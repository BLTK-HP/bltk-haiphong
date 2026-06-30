#!/usr/bin/env node
// Deploy Firebase Hosting trực tiếp bằng service account — không cần firebase login
import { readFileSync, readdirSync, statSync } from 'fs';
import { createHash, createSign } from 'crypto';
import { join, relative } from 'path';
import { gzip } from 'zlib';
import { promisify } from 'util';
import https from 'https';

const SA_PATH = '/Users/phuonganh/Downloads/JSON/bltk-haiphong-firebase-adminsdk-fbsvc-d6e78d27cb.json';
const SITE_ID = 'bltk-haiphong';
const DIST_DIR = new URL('./dist', import.meta.url).pathname;
const gzipAsync = promisify(gzip);

// ── OAuth2 via service account ──────────────────────────────────────────────
function b64url(s) { return Buffer.from(s).toString('base64url'); }

function makeJwt(sa) {
  const now = Math.floor(Date.now() / 1000);
  const h = b64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const p = b64url(JSON.stringify({
    iss: sa.client_email,
    scope: 'https://www.googleapis.com/auth/cloud-platform https://www.googleapis.com/auth/firebase',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now, exp: now + 3600,
  }));
  const s = createSign('RSA-SHA256');
  s.update(`${h}.${p}`);
  return `${h}.${p}.${s.sign(sa.private_key, 'base64url')}`;
}

function request(method, hostname, path, body, headers = {}) {
  return new Promise((resolve, reject) => {
    const buf = body ? (Buffer.isBuffer(body) ? body : Buffer.from(body)) : Buffer.alloc(0);
    const req = https.request({
      hostname, path, method,
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

async function api(method, path, body, token) {
  const bodyStr = body ? JSON.stringify(body) : '';
  const res = await request(method, 'firebasehosting.googleapis.com', path, bodyStr || undefined, {
    Authorization: `Bearer ${token}`,
    ...(bodyStr ? { 'Content-Type': 'application/json' } : {}),
  });
  if (res.status < 200 || res.status >= 300)
    throw new Error(`${method} ${path} → ${res.status}: ${res.body.slice(0, 500)}`);
  return JSON.parse(res.body);
}

// ── File helpers ────────────────────────────────────────────────────────────
function walkDir(dir, base = dir) {
  const results = [];
  for (const name of readdirSync(dir)) {
    const fp = join(dir, name);
    if (statSync(fp).isDirectory()) results.push(...walkDir(fp, base));
    else results.push({ fp, urlPath: '/' + relative(base, fp) });
  }
  return results;
}

// ── Main ────────────────────────────────────────────────────────────────────
async function main() {
  console.log('🔐 Lấy access token...');
  const token = await getToken();

  // 1. Tạo version
  console.log('📦 Tạo hosting version...');
  const vRes = await api('POST', `/v1beta1/projects/-/sites/${SITE_ID}/versions`,
    { status: 'CREATED' }, token
  );
  const versionName = vRes.name;
  console.log('   Version:', versionName.split('/').pop());

  // 2. Đọc file, gzip, rồi tính sha256 của nội dung gzipped (giống firebase-tools)
  const files = walkDir(DIST_DIR);
  const fileMap = {};   // urlPath → sha256(gzipped)
  const gzBufs = {};    // sha256(gzipped) → gzipped Buffer
  process.stdout.write(`📁 Gzipping ${files.length} files...`);
  for (const { fp, urlPath } of files) {
    const raw = readFileSync(fp);
    const gz = await gzipAsync(raw);
    const hash = createHash('sha256').update(gz).digest('hex');
    fileMap[urlPath] = hash;
    gzBufs[hash] = gz;
  }
  console.log(' done');

  // 3. populateFiles
  const popRes = await api('POST', `/v1beta1/${versionName}:populateFiles`, { files: fileMap }, token);
  const toUpload = popRes.uploadRequiredHashes || [];
  const uploadUrl = new URL(popRes.uploadUrl);
  console.log(`⬆️  Upload ${toUpload.length} files mới (${files.length - toUpload.length} cached)...`);

  // 4. Upload (gzipped)
  for (const hash of toUpload) {
    process.stdout.write('.');
    const res = await request('POST', uploadUrl.hostname,
      `${uploadUrl.pathname}/${hash}`,
      gzBufs[hash],
      { Authorization: `Bearer ${token}`, 'Content-Type': 'application/octet-stream' }
    );
    if (res.status < 200 || res.status >= 300)
      throw new Error(`Upload ${hash} → ${res.status}: ${res.body.slice(0, 200)}`);
  }
  if (toUpload.length > 0) console.log('');

  // 5. Finalize
  console.log('✅ Finalize...');
  await api('PATCH', `/v1beta1/${versionName}?update_mask=status`, { status: 'FINALIZED' }, token);

  // 6. Release
  console.log('🚀 Release...');
  await api('POST',
    `/v1beta1/projects/-/sites/${SITE_ID}/channels/live/releases?versionName=${encodeURIComponent(versionName)}`,
    {}, token
  );

  console.log('\n✅ Deploy xong! https://bltk-haiphong.web.app');
}

main().catch(e => { console.error('\n❌', e.message); process.exit(1); });
