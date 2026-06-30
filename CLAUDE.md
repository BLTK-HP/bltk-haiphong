# CLAUDE.md — Hướng dẫn cho AI assistant

## Tổng quan
App quản lý bán lẻ thú kiểng (BLTK Hải Phòng). React + Firebase Firestore + Firebase Hosting.

- **URL production**: https://bltk-haiphong.web.app
- **Build**: `npm run build`
- **Deploy nhanh** (~30s): `npm run deploy` — dùng `deploy-local.mjs` + service account, không cần firebase login
- **Deploy qua CI**: `git push origin main` → GitHub Actions tự build + deploy (~2 phút)
- **firebase login / npx firebase deploy trực tiếp**: KHÔNG dùng — browser auth fail trên máy này

## Cấu trúc code
- `src/App.jsx` — toàn bộ app (9000+ dòng, monolith). **Không dùng JSX** — dùng `React.createElement(...)` trực tiếp.
- `src/useFirestore.js` — hooks và helpers Firestore: `useCollection`, `saveDoc`, `deleteDocument`, `batchSave`
- `src/useAuth.js` — auth, roles
- `src/firebase.js` — khởi tạo Firebase client SDK

## Firestore collections

| Collection | Doc ID | Ghi chú |
|---|---|---|
| `orders` | `o.id` (string) | Đơn hàng |
| `txns` | **Firestore auto-ID** | Giao dịch tài chính — xem mục quan trọng bên dưới |
| `products` | SKU-based | Sản phẩm |
| `purchases` | `r.lot` | Nhập hàng |
| `wh_in` | `lot~~prod` | Kho vào |
| `wh_out` | `r.slip` | Kho ra |
| `customers` | auto | Khách hàng |
| `users` | Firebase UID | Người dùng |
| `config` | varied | Cấu hình |
| `settings` | varies | Cài đặt hệ thống |

## ⚠️ Điểm quan trọng — không được bỏ qua

### 1. `syncFS` — cơ chế sync Firestore
```js
// App.jsx ~line 8217
const syncFS = (colName, getId) => (current, updater) => {
  // getId(item) được dùng làm CẢ HAI: key so sánh VÀ Firestore doc ID khi save
  Object.entries(nextMap).forEach(([id, o]) => {
    saveDoc(colName, id, o); // id = getId(item) = Firestore doc ID
  });
};
const setTxns = u => syncFS("txns", t => String(t.id))(txns, u);
```
**Hệ quả**: field `id` của mỗi transaction PHẢI = Firestore doc ID của nó. Nếu sửa transaction qua UI, `saveDoc("txns", t.id, data)` ghi vào đúng doc.

### 2. `txns` collection — auto-ID (từ 28/06/2026)
Tất cả bank transactions dùng **Firestore auto-generated ID**. Field `id` trong document = auto-ID đó.
- `_id` (thêm bởi `useCollection`) = Firestore doc ID = `t.id`
- Field `ref` chứa mã giao dịch ngân hàng (FT26xxx...) — chỉ để hiển thị và dedup
- **Lý do**: TCB-CTY và TCB-PAT chia sẻ cùng mã FT cho internal transfers → nếu dùng ref làm doc ID sẽ ghi đè nhau

Manual transactions (PhieuThu/PhieuChi) dùng numeric ID (1, 2, 3...) — cũng là Firestore doc ID.

### 3. `bankAccounts` — lưu trong `settings`, KHÔNG phải collection riêng
```js
// Đúng: settings/bankAccounts → field accounts[]
db.collection("settings").doc("bankAccounts")  // ✓

// Sai — không tồn tại:
db.collection("bankAccounts")  // ✗
```
Số dư đầu kỳ (openBal) thực tế: TCB-CTY = 951,999đ, TCB-PAT = 5,030,341đ (tính từ 01/01/2026).
`INIT_BANK_ACCOUNTS` trong code có giá trị cũ — chỉ dùng nếu Firestore chưa có doc này.

### 4. Roles
- `profile.role === "admin"` — toàn quyền
- `patOnly` = admin đang xem tab TCB-PAT — chỉ hiện GD của TCB-PAT

## Import sao kê ngân hàng tháng mới

Dùng `import_monthly_template.mjs`. **Phải dùng Firebase Admin SDK** (không phải client SDK).

```js
// Service account tại:
/Users/phuonganh/.secrets/bltk-haiphong-firebase-adminsdk-fbsvc-d6e78d27cb.json

// Pattern auto-ID + dedup:
const snap = await db.collection("txns").where("acc", "==", ACC).get();
const existingRefs = new Set(snap.docs.map(d => d.data().ref));
const toAdd = TXNS.filter(t => !existingRefs.has(t.ref));
toAdd.forEach(txn => {
  const newRef = db.collection("txns").doc(); // auto-ID
  batch.set(newRef, { ...txn, id: newRef.id, year: 2026 });
});
```

**Không bao giờ** dùng `ref` làm Firestore doc ID cho bank transactions.

## Lỗi hay gặp khi dùng Admin SDK

```js
// Đúng (ESM):
import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

// Sai (gây lỗi "cert is not a function"):
import admin from "firebase-admin";
```

## Component `NumInput` (App.jsx ~line 542)

`NumInput` là controlled input hiển thị số có format (dấu chấm ngăn cách hàng nghìn).

- Khi **focused**: hiện số thô (raw digits) + tự `select()` toàn bộ → user gõ số mới replace ngay
- Khi **blurred**: hiện số đã format ("30.694.000")
- **Lý do**: controlled input với format string gây cảm giác "đóng băng" khi user click vào giữa số và gõ

`PaymentModal.handleKind`: khi chuyển từ "Thanh toán" → loại khác thì reset amount về 0 (tránh giữ lại giá trị auto-fill từ `remaining`).

## CSS / Styling
- Tailwind CSS
- Header bảng: bg `#ffedd5`, text `#7c2d12`, border `#fed7aa` — class `.tbl-list th` ghi đè Tailwind
- Không dùng emoji trong code trừ khi user yêu cầu
