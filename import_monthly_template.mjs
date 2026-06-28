// Template import sao kê ngân hàng tháng mới — dùng lại mỗi tháng
// 1. Copy file này → vd: import_t7_2026.mjs
// 2. Điền dữ liệu vào TXNS bên dưới
// 3. node import_t7_2026.mjs
//
// ĐẢM BẢO AN TOÀN:
// - Dùng Firestore auto-ID → không bao giờ conflict giữa PAT và CTY
// - Check dedup theo (ref + acc) trước khi import → không bao giờ nhân đôi GD
// - Chỉ thêm mới, không xoá GD cũ

import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore }        from "firebase-admin/firestore";
import { readFileSync }        from "fs";

const SA_PATH = "/Users/phuonganh/Downloads/JSON/bltk-haiphong-firebase-adminsdk-fbsvc-d6e78d27cb.json";
initializeApp({ credential: cert(JSON.parse(readFileSync(SA_PATH, "utf8"))) });
const db = getFirestore();

// ─── ĐIỀN DỮ LIỆU VÀO ĐÂY ────────────────────────────────────────────────────
const ACC = "TCB-CTY"; // hoặc "TCB-PAT"
const TXNS = [
  // { ref: "FT26xxxxxxxxxx", date: "01/07/2026", entity: "TEN NGUOI CHUYEN", amount: 1000000 },
  // amount: dương = tiền vào, âm = tiền ra
];
// ─────────────────────────────────────────────────────────────────────────────

async function importMonth() {
  if (!TXNS.length) { console.log("TXNS rỗng. Điền dữ liệu trước khi chạy."); return; }

  console.log(`Import ${TXNS.length} GD cho ${ACC}...`);

  // 1. Đọc tất cả ref hiện có của tài khoản này để kiểm tra duplicate
  const snap = await db.collection("txns").where("acc", "==", ACC).get();
  const existingRefs = new Set(snap.docs.map(d => d.data().ref).filter(Boolean));
  console.log(`Hiện có ${existingRefs.size} GD ${ACC} trong Firestore`);

  // 2. Lọc ra GD chưa tồn tại
  const toAdd = TXNS.filter(t => {
    if (existingRefs.has(t.ref)) {
      console.log(`  SKIP duplicate: ${t.ref}`);
      return false;
    }
    return true;
  });
  console.log(`Sẽ thêm: ${toAdd.length} GD | Bỏ qua (đã có): ${TXNS.length - toAdd.length}`);
  if (!toAdd.length) { console.log("Không có GD mới. Kết thúc."); return; }

  // 3. Import với auto-ID
  const CHUNK = 400;
  for (let i = 0; i < toAdd.length; i += CHUNK) {
    const batch = db.batch();
    toAdd.slice(i, i + CHUNK).forEach(txn => {
      const newRef = db.collection("txns").doc(); // auto-ID, không bao giờ conflict
      const year   = parseInt(String(txn.date).match(/\d{4}/)?.[0] || "2026");
      batch.set(newRef, { ...txn, acc: ACC, id: newRef.id, year });
    });
    await batch.commit();
  }

  // 4. Verify
  const after = await db.collection("txns").where("acc", "==", ACC).get();
  console.log(`\nHoàn tất! ${ACC}: ${snap.size} → ${after.size} GD`);
}

importMonth().catch(e => { console.error(e); process.exit(1); });
