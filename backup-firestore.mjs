#!/usr/bin/env node
// Backup toàn bộ Firestore ra file JSON local
// Chạy: node backup-firestore.mjs
// Cron hàng ngày: thêm vào crontab (xem hướng dẫn cuối file)

import { readFileSync, mkdirSync, writeFileSync, readdirSync, unlinkSync } from 'fs';
import { join, resolve } from 'path';
import https from 'https';

const SA_PATH  = '/Users/phuonganh/.secrets/bltk-haiphong-firebase-adminsdk-fbsvc-d6e78d27cb.json';
const PROJECT  = 'bltk-haiphong';
const BACKUP_DIR = resolve('/Users/phuonganh/firestore-backups');
const KEEP_DAYS  = 30; // giữ 30 bản gần nhất

const COLLECTIONS = [
  'orders', 'txns', 'products', 'purchases',
  'wh_in', 'wh_out', 'customers', 'users',
  'contracts', 'supplier_costs', 'config', 'settings',
];

// ── Auth ────────────────────────────────────────────────────────────────────
import { createSign } from 'crypto';

function b64url(s) { return Buffer.from(s).toString('base64url'); }

function makeJwt(sa) {
  const now = Math.floor(Date.now() / 1000);
  const h = b64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const p = b64url(JSON.stringify({
    iss: sa.client_email,
    scope: 'https://www.googleapis.com/auth/datastore https://www.googleapis.com/auth/cloud-platform',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now, exp: now + 3600,
  }));
  const s = createSign('RSA-SHA256');
  s.update(`${h}.${p}`);
  return `${h}.${p}.${s.sign(sa.private_key, 'base64url')}`;
}

function request(method, hostname, path, body, headers = {}) {
  return new Promise((resolve, reject) => {
    const buf = body ? Buffer.from(body) : Buffer.alloc(0);
    const req = https.request({ hostname, path, method,
      headers: { 'Content-Length': buf.length, ...headers },
    }, res => {
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => resolve({ status: res.statusCode, body: Buffer.concat(chunks).toString() }));
    });
    req.on('error', reject);
    if (buf.length) req.write(buf);
    req.end();
  });
}

async function getToken() {
  const sa = JSON.parse(readFileSync(SA_PATH, 'utf8'));
  const jwt = makeJwt(sa);
  const res = await request('POST', 'oauth2.googleapis.com', '/token',
    `grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=${jwt}`,
    { 'Content-Type': 'application/x-www-form-urlencoded' }
  );
  const data = JSON.parse(res.body);
  if (!data.access_token) throw new Error('Token error: ' + res.body);
  return data.access_token;
}

// ── Firestore REST API ───────────────────────────────────────────────────────
function firestoreValue(v) {
  if (v.stringValue  !== undefined) return v.stringValue;
  if (v.integerValue !== undefined) return parseInt(v.integerValue);
  if (v.doubleValue  !== undefined) return v.doubleValue;
  if (v.booleanValue !== undefined) return v.booleanValue;
  if (v.nullValue    !== undefined) return null;
  if (v.timestampValue !== undefined) return v.timestampValue;
  if (v.arrayValue   !== undefined) return (v.arrayValue.values || []).map(firestoreValue);
  if (v.mapValue     !== undefined) return Object.fromEntries(
    Object.entries(v.mapValue.fields || {}).map(([k, val]) => [k, firestoreValue(val)])
  );
  return null;
}

function parseDoc(doc) {
  const id = doc.name.split('/').pop();
  const fields = Object.fromEntries(
    Object.entries(doc.fields || {}).map(([k, v]) => [k, firestoreValue(v)])
  );
  return { _id: id, ...fields };
}

async function listDocs(colName, token, pageToken = null) {
  const base = `/v1/projects/${PROJECT}/databases/(default)/documents/${colName}`;
  const url  = base + (pageToken ? `?pageToken=${pageToken}` : '');
  const res = await request('GET', 'firestore.googleapis.com', url, null, {
    Authorization: `Bearer ${token}`,
  });
  if (res.status !== 200) throw new Error(`GET ${colName}: ${res.status} ${res.body.slice(0,200)}`);
  return JSON.parse(res.body);
}

async function backupCollection(colName, token) {
  const docs = [];
  let pageToken = null;
  do {
    const data = await listDocs(colName, token, pageToken);
    for (const doc of data.documents || []) docs.push(parseDoc(doc));
    pageToken = data.nextPageToken || null;
  } while (pageToken);
  return docs;
}

// ── Cleanup old backups ──────────────────────────────────────────────────────
function cleanOldBackups(dir, keepDays) {
  const files = readdirSync(dir)
    .filter(f => f.endsWith('.json'))
    .sort()
    .reverse();
  const toDelete = files.slice(keepDays);
  for (const f of toDelete) {
    unlinkSync(join(dir, f));
    console.log(`  Xóa bản cũ: ${f}`);
  }
}

// ── Main ────────────────────────────────────────────────────────────────────
async function main() {
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10); // YYYY-MM-DD
  const timeStr = now.toTimeString().slice(0, 5).replace(':', '');
  const filename = `${dateStr}_${timeStr}.json`;

  mkdirSync(BACKUP_DIR, { recursive: true });

  console.log(`🔐 Lấy access token...`);
  const token = await getToken();

  const backup = { exportedAt: now.toISOString(), project: PROJECT, collections: {} };

  for (const col of COLLECTIONS) {
    process.stdout.write(`📦 ${col}...`);
    try {
      const docs = await backupCollection(col, token);
      backup.collections[col] = docs;
      console.log(` ${docs.length} docs`);
    } catch (e) {
      console.log(` ⚠️  ${e.message}`);
      backup.collections[col] = [];
    }
  }

  const outPath = join(BACKUP_DIR, filename);
  writeFileSync(outPath, JSON.stringify(backup, null, 2), 'utf8');

  const sizeMB = (JSON.stringify(backup).length / 1024 / 1024).toFixed(2);
  console.log(`\n✅ Đã lưu: ${outPath} (${sizeMB} MB)`);

  cleanOldBackups(BACKUP_DIR, KEEP_DAYS);

  // Tổng kết
  const total = Object.values(backup.collections).reduce((s, d) => s + d.length, 0);
  console.log(`📊 Tổng: ${total} documents từ ${COLLECTIONS.length} collections`);
}

main().catch(e => { console.error('\n❌', e.message); process.exit(1); });

/*
─────────────────────────────────────────────
CÁCH CÀI CHẠY TỰ ĐỘNG MỖI NGÀY LÚC 2 GIỜ SÁNG
─────────────────────────────────────────────

1. Mở Terminal, gõ:
   crontab -e

2. Thêm dòng này (nhấn i để edit, Esc rồi :wq để lưu):
   0 2 * * * /usr/local/bin/node /Users/phuonganh/bltk-haiphong/backup-firestore.mjs >> /Users/phuonganh/firestore-backups/backup.log 2>&1

3. Kiểm tra node path đúng chưa:
   which node
   (thay /usr/local/bin/node bằng kết quả đó nếu khác)

4. Test chạy thử ngay:
   node /Users/phuonganh/bltk-haiphong/backup-firestore.mjs

File backup lưu tại: ~/firestore-backups/
Tự xóa bản cũ hơn 30 ngày.
─────────────────────────────────────────────
*/
