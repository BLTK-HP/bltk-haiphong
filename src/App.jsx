import React, { useState, useMemo } from 'react'
import { LayoutDashboard, ShoppingCart, Package, Truck, RotateCcw, BookText, Wallet, BarChart3, Smartphone, Plus, Search, Trash2, ArrowLeft, TrendingUp, ChevronRight, FileText, Globe, Sparkles, Store, Percent, CreditCard, UserCog, Printer, Pencil, ArrowDownToLine, Check, Save, Eye, Warehouse, Upload, ChevronDown, X, Users, Image as ImageIcon } from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'


/* ───────── helpers ───────── */
const vnd = n => new Intl.NumberFormat("vi-VN").format(Math.round(n || 0)) + "đ";
const num = n => new Intl.NumberFormat("vi-VN").format(Math.round(n || 0));
/* ── K2: định dạng text thống nhất cho SĐT / Mã SP, giữ số 0 đầu, không giãn ký tự ── */
const TEXT_CELL = "whitespace-nowrap";
const fmtPhone = v => {
  if (v == null) return "";
  let s = String(v).trim();
  if (/^\d{9,10}$/.test(s) && s.length === 9 && !s.startsWith("0")) s = "0" + s;
  return s;
};
const Phone = ({
  value
}) => /*#__PURE__*/React.createElement("span", {
  className: TEXT_CELL
}, fmtPhone(value));
const Sku = ({
  value
}) => /*#__PURE__*/React.createElement("span", {
  className: TEXT_CELL
}, String(value ?? ""));
const vndShort = n => {
  if (Math.abs(n) >= 1e9) return (n / 1e9).toFixed(2).replace(/\.?0+$/, "") + " tỷ";
  if (Math.abs(n) >= 1e6) return (n / 1e6).toFixed(1).replace(/\.0$/, "") + " tr";
  return new Intl.NumberFormat("vi-VN").format(n);
};
const CHANNELS = {
  Facebook: "bg-blue-50 text-blue-700 ring-blue-200",
  Zalo: "bg-sky-50 text-sky-700 ring-sky-200",
  TikTok: "bg-slate-900 text-white ring-slate-700",
  "Đến CH": "bg-slate-100 text-slate-600 ring-slate-200"
};
const ORDER_STATUS = {
  "Đặt cọc": "bg-sky-50 text-sky-700 ring-sky-200",
  "Đang xử lý": "bg-amber-50 text-amber-700 ring-amber-200",
  "Hoàn thành": "bg-emerald-50 text-emerald-700 ring-emerald-200",
  "Huỷ": "bg-rose-50 text-rose-700 ring-rose-200"
};
const ORDER_TABS = ["Tất cả", "Đặt cọc", "Đang xử lý", "Hoàn thành", "Huỷ"];
const PAY_STATUS = {
  "Đã thanh toán": "bg-emerald-50 text-emerald-700 ring-emerald-200",
  "Đặt cọc": "bg-sky-50 text-sky-700 ring-sky-200",
  "Chưa thanh toán": "bg-rose-50 text-rose-700 ring-rose-200"
};
const DELIVERY = {
  "Đã giao hàng": "bg-emerald-50 text-emerald-700 ring-emerald-200",
  "Chưa giao hàng": "bg-amber-50 text-amber-700 ring-amber-200"
};
const TIERS = {
  "Thường": "bg-slate-100 text-slate-600 ring-slate-200",
  "Bạc": "bg-zinc-100 text-zinc-600 ring-zinc-300",
  "Vàng": "bg-amber-50 text-amber-700 ring-amber-200",
  "Kim cương": "bg-cyan-50 text-cyan-700 ring-cyan-200"
};
const PAY_NCC = {
  "Đã thanh toán": "bg-emerald-50 text-emerald-700 ring-emerald-200",
  "Chưa thanh toán": "bg-amber-50 text-amber-700 ring-amber-200"
};
const APPROVE = {
  "Đã duyệt": "bg-emerald-50 text-emerald-700 ring-emerald-200",
  "Đã từ chối": "bg-rose-50 text-rose-700 ring-rose-200"
};

/* ───────── data ───────── */
const PRODUCTS = [{
  sku: "AC-989VN",
  name: "INAX - Bồn cầu AC-989VN",
  desc: "Bồn cầu 2 khối, nắp êm, xả Aqua Ceramic",
  brand: "INAX",
  cat: "Bồn cầu",
  unit: "Bộ",
  list: 6800000,
  sale: 4790000,
  cost: 4760000,
  stock: 4
}, {
  sku: "LFV-1402S-R",
  name: "INAX - Vòi Lavabo LFV-1402S-R",
  desc: "Vòi chậu nóng lạnh, thân đồng mạ crom",
  brand: "INAX",
  cat: "Vòi lavabo",
  unit: "Cái",
  list: 1850000,
  sale: 1382000,
  cost: 1270000,
  stock: 0
}, {
  sku: "BFV-2015S",
  name: "INAX - Vòi sen cây BFV-2015S nóng lạnh",
  desc: "Sen cây tăng áp, bát sen 3 chế độ",
  brand: "INAX",
  cat: "Sen tắm",
  unit: "Bộ",
  list: 11620000,
  sale: 8150000,
  cost: 7100000,
  stock: 2
}, {
  sku: "MS625CDW25",
  name: "TOTO - Bàn cầu 1 khối nắp điện tử S5",
  desc: "Nắp rửa điện tử Washlet, sấy khô, khử mùi",
  brand: "TOTO",
  cat: "Bồn cầu",
  unit: "Bộ",
  list: 40294000,
  sale: 26191100,
  cost: 21000000,
  stock: 1
}, {
  sku: "PIE875DC1E",
  name: "BOSCH - Bếp từ PIE875DC1E Serie 8",
  desc: "4 vùng nấu Châu Âu, FlexInduction, nhập Đức",
  brand: "BOSCH",
  cat: "Bếp từ",
  unit: "Cái",
  list: 33000000,
  sale: 24500000,
  cost: 19800000,
  stock: 3
}, {
  sku: "HBG7341B1",
  name: "BOSCH - Lò nướng âm tủ HBG7341B1 Serie 8",
  desc: "71L, tự vệ sinh nhiệt phân, 13 chức năng",
  brand: "BOSCH",
  cat: "Lò nướng",
  unit: "Cái",
  list: 38200000,
  sale: 28900000,
  cost: 23500000,
  stock: 1
}, {
  sku: "Tari-7851SR",
  name: "KONOX - Chậu rửa bát Tari 7851SR",
  desc: "Inox 304, 2 hố cân, phủ nano chống xước",
  brand: "KONOX",
  cat: "Chậu rửa",
  unit: "Bộ",
  list: 8390000,
  sale: 6292000,
  cost: 4900000,
  stock: 5
}, {
  sku: "CZ-656HNT",
  name: "CANZY - Bếp từ CZ-656HNT 3 vùng nấu",
  desc: "3 vùng nấu, mặt kính Schott Ceran",
  brand: "CANZY",
  cat: "Bếp từ",
  unit: "Cái",
  list: 14980000,
  sale: 5200000,
  cost: 3600000,
  stock: 0
}, {
  sku: "WP-6509",
  name: "AS - Bồn tiểu nam treo tường WP-6509",
  desc: "Cảm ứng xả tự động, sứ tráng men kháng khuẩn",
  brand: "AS",
  cat: "Tiểu nam",
  unit: "Bộ",
  list: 6900000,
  sale: 5900000,
  cost: 4600000,
  stock: 6
}, {
  sku: "VF-1858",
  name: "AS - Bồn cầu 1 khối VF-1858 Cozy",
  desc: "1 khối xả nhấn, nắp đóng êm, men chống bám",
  brand: "AS",
  cat: "Bồn cầu",
  unit: "Bộ",
  list: 6700000,
  sale: 4085000,
  cost: 3100000,
  stock: 2
}];
const mkOrder = o => ({
  expense: 0,
  importExpense: 0,
  paid: 0,
  delivery: "Chưa giao hàng",
  orderStatus: "Đặt cọc",
  imported: false,
  exported: false,
  returned: false,
  draft: false,
  ...o
});
const INIT_ORDERS = [mkOrder({
  id: "DH260229",
  dt: "15/06/2026 15:30",
  name: "Anh Tuấn",
  phone: "09xx111222",
  addr: "Số 12 Lê Chân, HP",
  channel: "Facebook",
  store: "Kho HH",
  staff: "NGOC HA",
  expense: 200000,
  paid: 12344000,
  delivery: "Đã giao hàng",
  orderStatus: "Hoàn thành",
  imported: true,
  exported: true,
  items: [{
    name: "INAX - Bồn cầu AC-989VN",
    price: 4790000,
    qty: 2,
    disc: 0,
    cost: 4760000
  }, {
    name: "INAX - Vòi Lavabo LFV-1402S-R",
    price: 1382000,
    qty: 2,
    disc: 0,
    cost: 1270000
  }]
}), mkOrder({
  id: "DH260228",
  dt: "12/06/2026 09:10",
  name: "Chị Mai",
  phone: "09xx333444",
  addr: "KĐT Ngô Quyền, HP",
  channel: "Zalo",
  store: "Kho TB",
  staff: "PAT",
  expense: 300000,
  paid: 5000000,
  delivery: "Chưa giao hàng",
  orderStatus: "Đang xử lý",
  imported: true,
  exported: false,
  items: [{
    name: "BOSCH - Bếp từ PIE875DC1E Serie 8",
    price: 24500000,
    qty: 1,
    disc: 0,
    cost: 19800000
  }]
}), mkOrder({
  id: "DH260227",
  dt: "12/06/2026 16:42",
  name: "Anh Bình",
  phone: "09xx555666",
  addr: "Hải An, HP",
  channel: "Facebook",
  store: "Kho HH",
  staff: "NGOC HA",
  expense: 0,
  paid: 0,
  delivery: "Chưa giao hàng",
  orderStatus: "Đặt cọc",
  imported: false,
  exported: false,
  items: [{
    name: "INAX - Vòi sen cây BFV-2015S nóng lạnh",
    price: 8150000,
    qty: 1,
    disc: 0,
    cost: 7100000
  }]
}), mkOrder({
  id: "DH260226",
  dt: "10/06/2026 11:05",
  name: "Chị Lan",
  phone: "09xx777888",
  addr: "Hồng Bàng, HP",
  channel: "TikTok",
  store: "Kho HH",
  staff: "SALE01",
  expense: 150000,
  paid: 6292000,
  delivery: "Đã giao hàng",
  orderStatus: "Hoàn thành",
  imported: true,
  exported: true,
  items: [{
    name: "KONOX - Chậu rửa bát Tari 7851SR",
    price: 6292000,
    qty: 1,
    disc: 0,
    cost: 4900000
  }]
}), mkOrder({
  id: "DH260225",
  dt: "08/06/2026 14:20",
  name: "Anh Dũng",
  phone: "09xx999000",
  addr: "Kiến An, HP",
  channel: "Đến CH",
  store: "Kho HH",
  staff: "PAT",
  expense: 0,
  paid: 0,
  delivery: "Chưa giao hàng",
  orderStatus: "Huỷ",
  imported: false,
  exported: false,
  items: [{
    name: "AS - Bồn tiểu nam treo tường WP-6509",
    price: 5900000,
    qty: 1,
    disc: 0,
    cost: 4600000
  }]
}), mkOrder({
  id: "BG00007",
  dt: "16/06/2026 08:30",
  name: "Chị Hà",
  phone: "09xx121314",
  addr: "Dương Kinh, HP",
  channel: "Facebook",
  store: "Kho TB",
  staff: "PAT",
  draft: true,
  desc: "Báo giá lò nướng cho khách xem",
  draftStatus: "Đã tạo đơn hàng",
  items: [{
    name: "BOSCH - Lò nướng âm tủ HBG7341B1 Serie 8",
    price: 28900000,
    qty: 1,
    disc: 0,
    cost: 23500000
  }]
}), mkOrder({
  id: "BG00006",
  dt: "15/06/2026 17:50",
  name: "Khách lẻ",
  phone: "",
  addr: "",
  channel: "Đến CH",
  store: "Kho HH",
  staff: "NGOC HA",
  draft: true,
  desc: "Khách hỏi giá tại quầy",
  draftStatus: "Chưa tạo đơn hàng",
  items: [{
    name: "INAX - Bồn cầu AC-989VN",
    price: 4790000,
    qty: 1,
    disc: 0,
    cost: 4760000
  }]
})];

/* derived order fields */
function calc(o) {
  const total = o.items.reduce((s, l) => s + Math.max(0, l.price * l.qty - (l.disc || 0)), 0);
  const totalCost = o.items.reduce((s, l) => s + l.cost * l.qty, 0);
  const remaining = total - o.paid;
  const pay = o.paid <= 0 ? "Chưa thanh toán" : o.paid >= total ? "Đã thanh toán" : "Đặt cọc";
  const profit = o.imported && o.exported ? total - (o.expense || 0) - totalCost - (o.importExpense || 0) : null;
  return {
    total,
    totalCost,
    remaining,
    pay,
    profit
  };
}
const CUSTOMERS = [{
  name: "Anh Tuấn",
  phone: "09xx111222",
  addr: "Lê Chân, HP",
  src: "Facebook",
  tier: "Vàng",
  orders: 5,
  spent: 48200000,
  debt: 0
}, {
  name: "Chị Mai",
  phone: "09xx333444",
  addr: "Ngô Quyền, HP",
  src: "Zalo",
  tier: "Thường",
  orders: 2,
  spent: 24500000,
  debt: 19500000
}, {
  name: "Anh Bình",
  phone: "09xx555666",
  addr: "Hải An, HP",
  src: "Facebook",
  tier: "Thường",
  orders: 1,
  spent: 8150000,
  debt: 8150000
}, {
  name: "Chị Lan",
  phone: "09xx777888",
  addr: "Hồng Bàng, HP",
  src: "TikTok",
  tier: "Bạc",
  orders: 4,
  spent: 31900000,
  debt: 0
}, {
  name: "Anh Dũng",
  phone: "09xx999000",
  addr: "Kiến An, HP",
  src: "Đến CH",
  tier: "Thường",
  orders: 1,
  spent: 5900000,
  debt: 2900000
}, {
  name: "Chị Hà",
  phone: "09xx121314",
  addr: "Dương Kinh, HP",
  src: "Facebook",
  tier: "Kim cương",
  orders: 9,
  spent: 152780000,
  debt: 18900000
}];

/* nhà cung cấp — tên đầy đủ + liên hệ + công nợ */
const SUPPLIERS = [{
  code: "0007",
  name: "AS LÊ HUY HẢI PHÒNG",
  phone: "0225 3 768 168",
  addr: "Lê Lợi, Ngô Quyền, HP",
  open: 36472000,
  ps: 0,
  tt: 0
}, {
  code: "0008",
  name: "BANCOOT",
  phone: "0936 220 808",
  addr: "Lê Chân, HP",
  open: 10139000,
  ps: 0,
  tt: 0
}, {
  code: "0016",
  name: "BLTK SG",
  phone: "0909 552 117",
  addr: "Tân Bình, TP.HCM",
  open: 51100000,
  ps: 0,
  tt: 0
}, {
  code: "0004",
  name: "BOSCH BLUEHOME",
  phone: "024 3791 0102",
  addr: "431 Hoàng Quốc Việt, Hà Nội",
  open: 151236000,
  ps: 0,
  tt: 0
}, {
  code: "0021",
  name: "EUROSUN",
  phone: "0243 7474 999",
  addr: "Cầu Giấy, Hà Nội",
  open: 2380000,
  ps: 0,
  tt: 0
}, {
  code: "0006",
  name: "INAX HP - HỮU TÍN",
  phone: "0225 3 826 826",
  addr: "Lê Thánh Tông, Ngô Quyền, HP",
  open: 566371002,
  ps: 0,
  tt: 0
}, {
  code: "0011",
  name: "INAX HP - THÀNH LƯƠNG",
  phone: "0225 3 555 333",
  addr: "Lạch Tray, Ngô Quyền, HP",
  open: 38100000,
  ps: 0,
  tt: 0
}, {
  code: "",
  name: "Không xác định",
  phone: "",
  addr: "",
  open: 62976000,
  ps: 0,
  tt: 0
}, {
  code: "0022",
  name: "KIM QUÝ",
  phone: "0904 116 116",
  addr: "Hồng Bàng, HP",
  open: 4830000,
  ps: 0,
  tt: 0
}, {
  code: "0017",
  name: "KOBESI",
  phone: "1900 6810",
  addr: "Hà Nội",
  open: 400000,
  ps: 0,
  tt: 0
}, {
  code: "0013",
  name: "PHỤ KIỆN - THẾ AS",
  phone: "0966 333 222",
  addr: "Hải Phòng",
  open: 1425000,
  ps: 0,
  tt: 0
}, {
  code: "0005",
  name: "TÂN ĐẢO (BELLO, NOBI)",
  phone: "0913 268 268",
  addr: "Hà Đông, Hà Nội",
  open: 89283508,
  ps: 0,
  tt: 0
}, {
  code: "0018",
  name: "TOTO NGỌC QUYẾN",
  phone: "0225 3 717 717",
  addr: "Văn Cao, Hải An, HP",
  open: 85745697,
  ps: 0,
  tt: 0
}];
/* lô hàng dư nợ chi tiết theo NCC (drill-down) */
const SUP_DETAIL = {
  "0007": [{
    date: "06/02/2026",
    slip: "PN20260206_0608",
    lot: "718_20260206_001",
    prod: "AS - Vòi Sen Neo Modern Nóng Lạnh WF-0711",
    sku: "WF-0711",
    qty: 2,
    cost: 1553000,
    paid: 0,
    pay: "Chưa thanh toán",
    staff: "THUY LINH"
  }, {
    date: "06/02/2026",
    slip: "PN20260206_0608",
    lot: "722_20260206_001",
    prod: "AS - Vòi Lavabo WF-1M01",
    sku: "WF-1M01",
    qty: 2,
    cost: 1609000,
    paid: 0,
    pay: "Chưa thanh toán",
    staff: "THUY LINH"
  }]
};
const IMPORTS = [{
  lot: "PN20260530_0031",
  date: "30/05/2026",
  prod: "INAX - Bồn cầu AC-989VN",
  store: "Kho HH",
  qtyIn: 5,
  qtyNow: 4,
  costNcc: 4760000,
  fee: 50000,
  supplier: "INAX HP - HỮU TÍN",
  order: "ĐH00521",
  staff: "NGOC HA",
  pay: "Chưa thanh toán"
}, {
  lot: "PN20260530_0034",
  date: "30/05/2026",
  prod: "KONOX - Chậu rửa Tari 7851SR",
  store: "Kho HH",
  qtyIn: 6,
  qtyNow: 5,
  costNcc: 4900000,
  fee: 80000,
  supplier: "KONOX",
  order: "ĐH00518",
  staff: "THUY LINH",
  pay: "Đã thanh toán"
}, {
  lot: "PN20260528_0012",
  date: "28/05/2026",
  prod: "BOSCH - Bếp từ PIE875DC1E",
  store: "Kho TB",
  qtyIn: 3,
  qtyNow: 3,
  costNcc: 19800000,
  fee: 200000,
  supplier: "BOSCH BLUEHOME",
  order: "ĐH00497",
  staff: "PAT",
  pay: "Chưa thanh toán"
}, {
  lot: "PN20260525_0008",
  date: "25/05/2026",
  prod: "TOTO - Bàn cầu 1 khối S5",
  store: "Kho HH",
  qtyIn: 2,
  qtyNow: 1,
  costNcc: 21000000,
  fee: 150000,
  supplier: "TOTO NGỌC QUYẾN",
  order: "ĐH00489",
  staff: "NGOC HA",
  pay: "Đã thanh toán"
}];
const RETURNS = [{
  order: "DH260204",
  cust: "Anh Ngọc Anh",
  prod: "INAX - Bồn cầu AC-989VN",
  qty: 1,
  amount: 4530000,
  store: "Kho HH",
  date: "20/05/2026",
  staff: "Quản Lý",
  status: "Đã duyệt"
}, {
  order: "DH260197",
  cust: "Anh Thiện",
  prod: "INAX - Bồn cầu AC-989VN",
  qty: 2,
  amount: 9520000,
  store: "Kho HH",
  date: "20/05/2026",
  staff: "Quản Lý",
  status: "Đã duyệt"
}, {
  order: "DH260081",
  cust: "Anh Chồi",
  prod: "BELLO - Gương LED chữ nhật",
  qty: 1,
  amount: 630000,
  store: "Kho HH",
  date: "09/02/2026",
  staff: "THUY LINH",
  status: "Đã duyệt"
}, {
  order: "DH250048",
  cust: "Chị Loan",
  prod: "Đuôi xi phông nhựa",
  qty: 1,
  amount: 180000,
  store: "Kho HH",
  date: "03/01/2026",
  staff: "NGOC HA",
  status: "Đã từ chối"
}];
const TXNS = [{
  date: "15/06/2026",
  kind: "Thu",
  note: "Thu tiền đơn DH260229",
  acc: "TCB · PAT",
  amount: 12370000
}, {
  date: "12/06/2026",
  kind: "Thu",
  note: "Đặt cọc đơn DH260228",
  acc: "Tiền mặt",
  amount: 5000000
}, {
  date: "10/06/2026",
  kind: "Chi",
  note: "Vận chuyển lô PN..0034",
  acc: "Tiền mặt",
  amount: -350000
}, {
  date: "08/06/2026",
  kind: "Thu",
  note: "Thu tiền đơn DH260225",
  acc: "TCB · Công ty",
  amount: 3000000
}];
const CASHFLOW = [{
  d: "01/06",
  thu: 0
}, {
  d: "02/06",
  thu: 35
}, {
  d: "03/06",
  thu: 23.5
}, {
  d: "06/06",
  thu: 1
}, {
  d: "07/06",
  thu: 3.4
}, {
  d: "08/06",
  thu: 3
}, {
  d: "10/06",
  thu: 5.5
}, {
  d: "12/06",
  thu: 5
}, {
  d: "15/06",
  thu: 12.4
}];
const STAFF_RANK = [{
  name: "NGOC HA",
  role: "Nhân viên",
  orders: 7,
  custs: 7,
  rev: 154772000,
  collected: 0.62
}, {
  name: "PAT",
  role: "Admin",
  orders: 4,
  custs: 4,
  rev: 48970000,
  collected: 0.41
}, {
  name: "SALE01",
  role: "Nhân viên",
  orders: 3,
  custs: 3,
  rev: 21560000,
  collected: 1.0
}, {
  name: "Quản Lý",
  role: "Manager",
  orders: 1,
  custs: 1,
  rev: 1480000,
  collected: 1.0
}];
const SALES_BY_DAY = [{
  day: "15/06/2026",
  n: 2,
  rev: 6480000,
  paid: 1480000
}, {
  day: "12/06/2026",
  n: 5,
  rev: 39464000,
  paid: 0
}, {
  day: "10/06/2026",
  n: 2,
  rev: 13270000,
  paid: 5490000
}, {
  day: "08/06/2026",
  n: 1,
  rev: 6890000,
  paid: 3000000
}, {
  day: "07/06/2026",
  n: 3,
  rev: 16940000,
  paid: 3420000
}];
const EXPORTS = [{
  slip: "PX20260615_002",
  dt: "15/06/2026 15:30",
  order: "DH260229",
  sku: "AC-989VN",
  prod: "INAX - Bồn cầu AC-989VN",
  supplier: "INAX HP - HỮU TÍN",
  store: "Kho HH",
  lot: "867_20260615_002",
  qty: 2,
  sale: 4790000,
  cust: "Anh Tuấn",
  addr: "Số 12 Lê Chân, HP",
  orderStatus: "Hoàn thành",
  delivery: "Đã giao hàng",
  staff: "NGOC HA"
}, {
  slip: "PX20260612_005",
  dt: "12/06/2026 09:10",
  order: "DH260228",
  sku: "PIE875DC1E",
  prod: "BOSCH - Bếp từ PIE875DC1E",
  supplier: "BOSCH BLUEHOME",
  store: "Kho TB",
  lot: "910_20260612_001",
  qty: 1,
  sale: 24500000,
  cust: "Chị Mai",
  addr: "KĐT Ngô Quyền, HP",
  orderStatus: "Đang xử lý",
  delivery: "Chưa giao hàng",
  staff: "PAT"
}, {
  slip: "PX20260610_003",
  dt: "10/06/2026 11:05",
  order: "DH260226",
  sku: "Tari-7851SR",
  prod: "KONOX - Chậu rửa Tari 7851SR",
  supplier: "KONOX",
  store: "Kho HH",
  lot: "732_20260610_001",
  qty: 1,
  sale: 6292000,
  cust: "Chị Lan",
  addr: "Hồng Bàng, HP",
  orderStatus: "Hoàn thành",
  delivery: "Đã giao hàng",
  staff: "SALE01"
}, {
  slip: "PX20260530_001",
  dt: "30/05/2026 17:51",
  order: "DH260201",
  sku: "WF-1M72",
  prod: "AS - Sen Cây Nóng Lạnh WF-1M72",
  supplier: "INAX HP - THÀNH LƯƠNG",
  store: "Kho HH",
  lot: "867_20260507_001",
  qty: 3,
  sale: 3700000,
  cust: "Chị Hà",
  addr: "Dương Kinh, HP",
  orderStatus: "Hoàn thành",
  delivery: "Đã giao hàng",
  staff: "Quản Lý"
}];

/* công nợ khách hàng — báo cáo tổng hợp */
const CUST_DEBT = [{
  staff: "NGOC HA",
  name: "Anh Châu",
  phone: "0989145440",
  open: 0,
  ps: 44716000,
  tt: 5000000
}, {
  staff: "NGOC HA",
  name: "Anh Chồi",
  phone: "0348454068",
  open: -1250000,
  ps: 0,
  tt: 0
}, {
  staff: "NGOC HA",
  name: "Anh Dũng",
  phone: "0985869995",
  open: 3000000,
  ps: 0,
  tt: 0,
  addr: "16/213 Phủ Thượng Đoạn"
}, {
  staff: "NGOC HA",
  name: "Anh Dũng",
  phone: "0913980857",
  open: -1225000,
  ps: 0,
  tt: 0
}, {
  staff: "PAT",
  name: "Anh Giang",
  phone: "0394026208",
  open: 7776000,
  ps: 0,
  tt: 0
}, {
  staff: "Quản Lý",
  name: "Anh Hiển",
  phone: "0912950622",
  open: 16072000,
  ps: 0,
  tt: 0
}, {
  staff: "PAT",
  name: "Anh Hoàng",
  phone: "0936501658",
  open: 7300000,
  ps: 0,
  tt: 0
}, {
  staff: "NGOC HA",
  name: "Anh Khánh",
  phone: "0904575005",
  open: 54412000,
  ps: 0,
  tt: 0
}, {
  staff: "NGOC HA",
  name: "Anh Khánh",
  phone: "0906096124",
  open: 10380000,
  ps: 0,
  tt: 0
}, {
  staff: "Quản Lý",
  name: "Anh Linh",
  phone: "0914404685",
  open: 47245000,
  ps: 1480000,
  tt: 1480000
}, {
  staff: "NGOC HA",
  name: "Anh Lương",
  phone: "0938486888",
  open: -610000,
  ps: 0,
  tt: 0
}, {
  staff: "Quản Lý",
  name: "Anh Nghĩa",
  phone: "0913501393",
  open: 12794000,
  ps: 0,
  tt: 0
}, {
  staff: "PAT",
  name: "Anh Ngọc Anh",
  phone: "0961109397",
  open: 23275000,
  ps: 0,
  tt: 0
}];
const CUST_DEBT_DETAIL = {
  "0985869995": {
    id: 600,
    addr: "16/213 Phủ Thượng Đoạn",
    email: "Không có",
    orders: [{
      id: "DH260192",
      date: "20/04/2026",
      expense: 200000,
      payable: 3000000,
      paid: 0,
      items: [{
        name: "VINGER - máy hút mùi chữ T VG 227 T01",
        sku: "VG 227 T01",
        qty: 1,
        price: 2800000,
        amount: 2800000
      }, {
        name: "MUNCHEN - Bộ nồi Schönbrunn Pro SB19",
        sku: "Pro SB19",
        qty: 1,
        price: 0,
        amount: 0
      }]
    }]
  }
};

/* báo cáo sản phẩm đặt hàng */
const PREORDER = [{
  sku: "AC-989VN",
  prod: "INAX - Bồn Cầu AC-989VN",
  ordered: 5,
  stock: 8,
  orders: 3
}, {
  sku: "AL-289V/ L288VC",
  prod: "INAX - Lavabo treo tường AL-289V/ L288VC",
  ordered: 4,
  stock: 1,
  orders: 2
}, {
  sku: "VF-1862",
  prod: "AS - Bồn Cầu VF-1862",
  ordered: 4,
  stock: 10,
  orders: 1
}, {
  sku: "LFV-1402S-R",
  prod: "INAX - Vòi Lavabo LFV-1402S-R",
  ordered: 3,
  stock: 1,
  orders: 1
}, {
  sku: "DUOI XP INOX UON",
  prod: "Đuôi xi phong inox SUS 304 uốn",
  ordered: 3,
  stock: 10,
  orders: 1
}, {
  sku: "BFV-1405S",
  prod: "INAX - Bộ Sen Cây BFV-1405S",
  ordered: 2,
  stock: 0,
  orders: 2
}, {
  sku: "BL-GLH 50",
  prod: "BELLO - Gương LED chữ nhật BL-GLH 50",
  ordered: 2,
  stock: 4,
  orders: 1
}];
const NAV = [{
  key: "finance",
  label: "Tài chính",
  icon: Wallet
}, {
  key: "sales",
  label: "Bán hàng",
  icon: ShoppingCart,
  children: [{
    key: "sales_draft",
    label: "Báo giá"
  }, {
    key: "sales_orders",
    label: "Danh sách đơn hàng"
  }]
}, {
  key: "purchase",
  label: "Mua hàng",
  icon: Truck,
  children: [{
    key: "pur_create",
    label: "Tạo phiếu mua hàng"
  }, {
    key: "pur_list",
    label: "Danh sách phiếu mua hàng"
  }]
}, {
  key: "wh",
  label: "Quản lý kho",
  icon: Warehouse,
  children: [{
    key: "wh_in",
    label: "Danh sách phiếu nhập kho"
  }, {
    key: "wh_out",
    label: "Danh sách phiếu xuất kho"
  }, {
    key: "wh_stock",
    label: "Tồn kho"
  }]
}, {
  key: "pc",
  label: "Sản phẩm & Khách hàng",
  icon: Users,
  children: [{
    key: "pc_products",
    label: "Danh sách sản phẩm"
  }, {
    key: "pc_customers",
    label: "Danh sách khách hàng"
  }, {
    key: "pc_suppliers",
    label: "Danh sách nhà cung cấp"
  }]
}, {
  key: "debt",
  label: "Sổ công nợ",
  icon: BookText,
  children: [{
    key: "debt_cust",
    label: "Công nợ khách hàng"
  }, {
    key: "debt_ncc",
    label: "Công nợ nhà cung cấp"
  }]
}, {
  key: "dashboard",
  label: "Tổng quan",
  icon: LayoutDashboard
}, {
  key: "reports",
  label: "Báo cáo",
  icon: BarChart3,
  children: [{
    key: "rp_sales",
    label: "Báo cáo bán hàng"
  }, {
    key: "rp_preorder",
    label: "Báo cáo sản phẩm đặt hàng"
  }, {
    key: "rp_staff",
    label: "Báo cáo nhân viên"
  }]
}];
const LABELS = {
  finance: "Tài chính",
  sales_draft: "Báo giá",
  sales_orders: "Danh sách đơn hàng",
  pur_create: "Tạo phiếu mua hàng",
  pur_list: "Danh sách phiếu mua hàng",
  wh_in: "Danh sách phiếu nhập kho",
  wh_out: "Danh sách phiếu xuất kho",
  wh_stock: "Tồn kho",
  pc_products: "Danh sách sản phẩm",
  pc_customers: "Danh sách khách hàng",
  pc_suppliers: "Danh sách nhà cung cấp",
  debt_cust: "Công nợ khách hàng",
  debt_ncc: "Công nợ nhà cung cấp",
  dashboard: "Tổng quan",
  rp_sales: "Báo cáo bán hàng",
  rp_preorder: "Báo cáo sản phẩm đặt hàng",
  rp_staff: "Báo cáo nhân viên"
};

/* ───────── atoms ───────── */
const Pill = ({
  map,
  value
}) => /*#__PURE__*/React.createElement("span", {
  className: `inline-flex items-center whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${map[value] || "bg-slate-100 text-slate-600 ring-slate-200"}`
}, value);
const field = "rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700 focus:border-blue-400 focus:outline-none";
const inputF = "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-100";
const inputSm = "w-full rounded-md border border-slate-200 px-2 py-1.5 text-sm focus:border-blue-400 focus:outline-none";

/* số phiếu mua hàng dạng ngắn theo quy tắc đánh số (PMH + 5 số) */
const purCode = lot => "PMH" + String(700 + (parseInt(String(lot).replace(/\D/g, "").slice(-3), 10) % 99 || 1)).padStart(5, "0");
const impCode = lot => "PNK" + String(31 + (parseInt(String(lot).replace(/\D/g, "").slice(-4), 10) % 99 || 1)).padStart(5, "0");

/* ô nhập số có định dạng phân tách hàng nghìn (vi-VN) */
function NumInput({
  value,
  onChange,
  className = inputSm,
  placeholder = "0",
  align = "right",
  disabled = false
}) {
  const fmt = v => v === "" || v === null || v === undefined || isNaN(v) || v === 0 ? v === 0 ? "0" : "" : num(v);
  return /*#__PURE__*/React.createElement("input", {
    inputMode: "numeric",
    disabled: disabled,
    className: `${className} text-${align} tabular-nums ${disabled ? "bg-slate-100 text-slate-400" : ""}`,
    value: value === 0 ? "" : fmt(value),
    placeholder: placeholder,
    onChange: e => {
      const d = e.target.value.replace(/[^\d]/g, "");
      onChange(d === "" ? 0 : parseInt(d, 10));
    }
  });
}

/* combobox chọn sản phẩm: lọc danh mục + gọi callback khi muốn thêm mới */
function ProductPicker({
  value,
  products,
  onPick,
  onRequestNewProduct
}) {
  const [text, setText] = useState(value || "");
  const [openList, setOpenList] = useState(false);
  React.useEffect(() => {
    setText(value || "");
  }, [value]);
  const matches = products.filter(p => !text || `${p.name} ${p.sku}`.toLowerCase().includes(text.toLowerCase()));
  return /*#__PURE__*/React.createElement("div", {
    className: "relative"
  }, /*#__PURE__*/React.createElement("div", {
    className: "relative"
  }, /*#__PURE__*/React.createElement(Search, {
    className: "absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
  }), /*#__PURE__*/React.createElement("input", {
    className: inputSm + " pl-8",
    placeholder: "Lọc / chọn sản phẩm…",
    value: text,
    onChange: e => {
      setText(e.target.value);
      setOpenList(true);
      onPick({
        name: e.target.value
      });
    },
    onFocus: () => setOpenList(true),
    onBlur: () => setTimeout(() => setOpenList(false), 160)
  })), openList && /*#__PURE__*/React.createElement("div", {
    className: "absolute z-30 mt-1 max-h-60 w-full overflow-auto rounded-lg border border-slate-200 bg-white shadow-lg"
  }, matches.map(p => /*#__PURE__*/React.createElement("button", {
    key: p.sku,
    type: "button",
    onMouseDown: () => {
      onPick(p);
      setText(p.name);
      setOpenList(false);
    },
    className: "flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm hover:bg-slate-50"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-slate-800"
  }, p.name), /*#__PURE__*/React.createElement("span", {
    className: "shrink-0 text-xs tabular-nums text-slate-400"
  }, num(p.sale)))), onRequestNewProduct && /*#__PURE__*/React.createElement("button", {
    type: "button",
    onMouseDown: () => {
      setOpenList(false);
      onRequestNewProduct(text);
    },
    className: "flex w-full items-center gap-1.5 border-t border-slate-100 px-3 py-2 text-left text-sm font-medium text-blue-600 hover:bg-blue-50"
  }, /*#__PURE__*/React.createElement(Plus, {
    className: "h-4 w-4"
  }), " Thêm sản phẩm mới", text ? `: "${text}"` : "")));
}
function StatCard({
  label,
  value,
  sub,
  tone = "default",
  icon: Icon
}) {
  const c = {
    default: "text-slate-900",
    pos: "text-emerald-600",
    neg: "text-rose-600",
    accent: "text-blue-700",
    warn: "text-amber-600"
  }[tone];
  return /*#__PURE__*/React.createElement("div", {
    className: "rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-between"
  }, /*#__PURE__*/React.createElement("p", {
    className: "text-xs font-medium uppercase tracking-wide text-slate-500"
  }, label), Icon && /*#__PURE__*/React.createElement(Icon, {
    className: "h-4 w-4 text-slate-300"
  })), /*#__PURE__*/React.createElement("p", {
    className: `mt-2 text-2xl font-semibold tabular-nums ${c}`
  }, value), sub && /*#__PURE__*/React.createElement("p", {
    className: "mt-1 text-xs text-slate-400"
  }, sub));
}
const Card = ({
  title,
  children,
  right
}) => /*#__PURE__*/React.createElement("div", {
  className: "rounded-xl border border-slate-200 bg-white shadow-sm"
}, title && /*#__PURE__*/React.createElement("div", {
  className: "flex items-center justify-between border-b border-slate-100 px-5 py-3"
}, /*#__PURE__*/React.createElement("h3", {
  className: "text-sm font-semibold text-slate-700"
}, title), right), /*#__PURE__*/React.createElement("div", {
  className: title ? "p-5" : ""
}, children));
const Th = ({
  children,
  right,
  center,
  style
}) => /*#__PURE__*/React.createElement("th", {
  className: `whitespace-nowrap px-3 py-3 font-bold text-center`,
  style: style
}, children);
const TableShell = ({
  head,
  children,
  minW
}) => /*#__PURE__*/React.createElement("div", {
  className: "overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm",
  style: {position: "relative"}
}, /*#__PURE__*/React.createElement("table", {
  className: "w-full text-sm",
  style: minW ? {
    minWidth: minW
  } : undefined
}, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", {
  className: "border-b border-slate-100 bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500"
}, head)), /*#__PURE__*/React.createElement("tbody", {
  className: "divide-y divide-slate-50"
}, children)));
const TabBar = ({
  tabs,
  active,
  onChange
}) => /*#__PURE__*/React.createElement("div", {
  className: "flex gap-1 border-b border-slate-200"
}, tabs.map(t => /*#__PURE__*/React.createElement("button", {
  key: t,
  onClick: () => onChange(t),
  className: `-mb-px whitespace-nowrap border-b-2 px-3 py-2 text-sm transition ${active === t ? "border-blue-600 font-medium text-blue-700" : "border-transparent text-slate-500 hover:text-slate-700"}`
}, t)));
const Empty = ({
  children
}) => /*#__PURE__*/React.createElement("div", {
  className: "rounded-xl border border-dashed border-slate-200 bg-white px-6 py-10 text-center text-sm text-slate-400"
}, children);
const IconBtn = ({
  icon: Icon,
  title,
  onClick,
  tone = "slate"
}) => /*#__PURE__*/React.createElement("button", {
  title: title,
  onClick: onClick,
  className: `rounded-md p-1.5 transition hover:bg-slate-100 text-${tone}-500`
}, /*#__PURE__*/React.createElement(Icon, {
  className: "h-4 w-4"
}));
const blueBtn = "inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-1.5 text-sm font-medium text-white shadow-sm hover:bg-blue-700";
const greenBtn = "inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-700";
const ghostBtn = "inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50";

/* ── tách ngày & giờ xuống 2 dòng (F1) ── */
function DateTime({
  value
}) {
  if (!value) return /*#__PURE__*/React.createElement("span", {
    className: "text-slate-400"
  }, "—");
  const [d, ...rest] = String(value).split(" ");
  return /*#__PURE__*/React.createElement("span", {
    className: "text-xs text-slate-500"
  }, /*#__PURE__*/React.createElement("span", {
    className: "block"
  }, d), rest.length ? /*#__PURE__*/React.createElement("span", {
    className: "block text-slate-400"
  }, rest.join(" ")) : null);
}

/* ── Xuất Excel/CSV thật (E3) ── */
function exportCSV(filename, headers, rows) {
  const esc = v => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const csv = [headers.map(esc).join(","), ...rows.map(r => r.map(esc).join(","))].join("\r\n");
  const blob = new Blob(["\uFEFF" + csv], {
    type: "text/csv;charset=utf-8;"
  });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename.endsWith(".csv") ? filename : filename + ".csv";
  a.click();
  URL.revokeObjectURL(a.href);
}
const ExportBtn = ({
  onClick
}) => /*#__PURE__*/React.createElement("button", {
  onClick: onClick,
  className: greenBtn
}, /*#__PURE__*/React.createElement(Upload, {
  className: "h-4 w-4"
}), " Xuất Excel");
const PrintBtn = ({
  onClick = () => window.print()
}) => /*#__PURE__*/React.createElement("button", {
  onClick: onClick,
  className: ghostBtn
}, /*#__PURE__*/React.createElement(Printer, {
  className: "h-4 w-4"
}), " In");

/* ── Thanh lọc Từ ngày – Đến ngày + tìm kiếm dùng chung (E3) ── */
function RangeBar({
  q,
  setQ,
  placeholder = "Tìm kiếm…",
  from = "2026-06-01",
  to = "2026-06-16",
  onFilter,
  onExport,
  extra
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: "flex flex-wrap items-end gap-2"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: "mb-1 block text-xs font-medium text-slate-500"
  }, "Từ ngày"), /*#__PURE__*/React.createElement("input", {
    type: "date",
    defaultValue: from,
    className: field
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: "mb-1 block text-xs font-medium text-slate-500"
  }, "Đến ngày"), /*#__PURE__*/React.createElement("input", {
    type: "date",
    defaultValue: to,
    className: field
  })), setQ && /*#__PURE__*/React.createElement("div", {
    className: "min-w-[200px] flex-1"
  }, /*#__PURE__*/React.createElement("label", {
    className: "mb-1 block text-xs font-medium text-slate-500"
  }, "Tìm kiếm"), /*#__PURE__*/React.createElement("input", {
    value: q,
    onChange: e => setQ(e.target.value),
    placeholder: placeholder,
    className: `${field} w-full`
  })), extra, /*#__PURE__*/React.createElement("button", {
    onClick: onFilter,
    className: blueBtn + " py-2"
  }, /*#__PURE__*/React.createElement(Search, {
    className: "h-4 w-4"
  }), " Lọc"), /*#__PURE__*/React.createElement(PrintBtn, null), onExport && /*#__PURE__*/React.createElement(ExportBtn, {
    onClick: onExport
  }));
}

/* ── Toast nhẹ để báo thao tác đã chạy ── */
const ToastCtx = React.createContext(() => {});
function useToast() {
  return React.useContext(ToastCtx);
}
function ToastHost({
  children
}) {
  const [msg, setMsg] = useState(null);
  const notify = React.useCallback(m => {
    setMsg(m);
    setTimeout(() => setMsg(null), 2200);
  }, []);
  return /*#__PURE__*/React.createElement(ToastCtx.Provider, {
    value: notify
  }, children, msg && /*#__PURE__*/React.createElement("div", {
    className: "fixed top-5 left-1/2 z-[60] -translate-x-1/2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow-lg"
  }, msg));
}

/* ── Modal mở chứng từ gốc (D2) ── */
function DocModal({
  doc,
  onClose
}) {
  const kind = doc.code.startsWith("BG") ? "Báo giá" : doc.code.startsWith("ĐH") || doc.code.startsWith("DH") ? "Đơn hàng" : doc.code.startsWith("PM") || doc.code.startsWith("ĐMH") ? "Phiếu mua hàng" : doc.code.startsWith("PX") ? "Phiếu xuất kho" : doc.code.startsWith("PN") ? "Phiếu nhập kho" : "Chứng từ";
  return /*#__PURE__*/React.createElement(Modal, {
    title: `${kind} ${doc.code}`,
    sub: "Chứng từ gốc",
    onClose: onClose,
    footer: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(PrintBtn, null), /*#__PURE__*/React.createElement("button", {
      onClick: onClose,
      className: ghostBtn
    }, "Đóng"))
  }, /*#__PURE__*/React.createElement("div", {
    className: "space-y-2 text-sm"
  }, Object.entries(doc.fields || {}).map(([k, v]) => /*#__PURE__*/React.createElement("div", {
    key: k,
    className: "flex justify-between gap-4 border-b border-slate-50 py-1.5"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-slate-500"
  }, k), /*#__PURE__*/React.createElement("span", {
    className: "text-right font-medium text-slate-800"
  }, v))), doc.items && /*#__PURE__*/React.createElement("table", {
    className: "mt-3 w-full text-xs"
  }, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", {
    className: "border-b border-slate-200 text-left text-slate-500"
  }, /*#__PURE__*/React.createElement("th", {
    className: "py-1"
  }, "Sản phẩm"), /*#__PURE__*/React.createElement("th", {
    className: "py-1 text-right"
  }, "SL"), /*#__PURE__*/React.createElement("th", {
    className: "py-1 text-right"
  }, "Đơn giá"), /*#__PURE__*/React.createElement("th", {
    className: "py-1 text-right"
  }, "Thành tiền"))), /*#__PURE__*/React.createElement("tbody", null, doc.items.map((it, i) => /*#__PURE__*/React.createElement("tr", {
    key: i,
    className: "border-b border-slate-50"
  }, /*#__PURE__*/React.createElement("td", {
    className: "py-1.5 text-slate-700"
  }, it.name), /*#__PURE__*/React.createElement("td", {
    className: "py-1.5 text-right tabular-nums"
  }, it.qty), /*#__PURE__*/React.createElement("td", {
    className: "py-1.5 text-right tabular-nums"
  }, num(it.price)), /*#__PURE__*/React.createElement("td", {
    className: "py-1.5 text-right tabular-nums"
  }, num(it.price * it.qty))))))));
}
const DocLink = ({
  code,
  onOpen,
  className = ""
}) => /*#__PURE__*/React.createElement("button", {
  onClick: () => onOpen({
    code,
    fields: {
      "Số chứng từ": code,
      "Ngày": "16/06/2026",
      Kho: "Kho HH"
    }
  }),
  className: `font-medium text-blue-700 underline-offset-2 hover:underline ${className}`
}, code);

/* ───────── Dashboard ───────── */
function Dashboard() {
  return /*#__PURE__*/React.createElement("div", {
    className: "space-y-6"
  }, /*#__PURE__*/React.createElement("div", {
    className: "grid grid-cols-2 gap-4 lg:grid-cols-4"
  }, /*#__PURE__*/React.createElement(StatCard, {
    label: "Tài sản",
    value: vndShort(1633126508),
    sub: "Tiền + tồn kho",
    tone: "accent",
    icon: Wallet
  }), /*#__PURE__*/React.createElement(StatCard, {
    label: "Thu tiền hàng",
    value: "+" + vndShort(72946000),
    sub: "Tháng 06/2026",
    tone: "pos",
    icon: TrendingUp
  }), /*#__PURE__*/React.createElement(StatCard, {
    label: "Giá trị tồn kho",
    value: vndShort(374829177),
    sub: "Kho HH + TB",
    icon: Package
  }), /*#__PURE__*/React.createElement(StatCard, {
    label: "Lợi nhuận",
    value: vndShort(242456000),
    sub: "Tháng 06/2026",
    tone: "pos",
    icon: TrendingUp
  })), /*#__PURE__*/React.createElement("div", {
    className: "grid grid-cols-1 gap-6 lg:grid-cols-3"
  }, /*#__PURE__*/React.createElement("div", {
    className: "lg:col-span-2"
  }, /*#__PURE__*/React.createElement(Card, {
    title: "Dòng tiền thu theo ngày",
    right: /*#__PURE__*/React.createElement("span", {
      className: "text-xs text-slate-400"
    }, "triệu đồng")
  }, /*#__PURE__*/React.createElement("div", {
    className: "h-56"
  }, /*#__PURE__*/React.createElement(ResponsiveContainer, {
    width: "100%",
    height: "100%"
  }, /*#__PURE__*/React.createElement(AreaChart, {
    data: CASHFLOW,
    margin: {
      left: -18,
      right: 8,
      top: 4
    }
  }, /*#__PURE__*/React.createElement("defs", null, /*#__PURE__*/React.createElement("linearGradient", {
    id: "g",
    x1: "0",
    y1: "0",
    x2: "0",
    y2: "1"
  }, /*#__PURE__*/React.createElement("stop", {
    offset: "0%",
    stopColor: "#2563eb",
    stopOpacity: 0.25
  }), /*#__PURE__*/React.createElement("stop", {
    offset: "100%",
    stopColor: "#2563eb",
    stopOpacity: 0
  }))), /*#__PURE__*/React.createElement(CartesianGrid, {
    strokeDasharray: "3 3",
    stroke: "#eef2f7",
    vertical: false
  }), /*#__PURE__*/React.createElement(XAxis, {
    dataKey: "d",
    tick: {
      fontSize: 11,
      fill: "#94a3b8"
    },
    tickLine: false,
    axisLine: false
  }), /*#__PURE__*/React.createElement(YAxis, {
    tick: {
      fontSize: 11,
      fill: "#94a3b8"
    },
    tickLine: false,
    axisLine: false
  }), /*#__PURE__*/React.createElement(Tooltip, {
    formatter: v => [v + " tr", "Đã thu"],
    contentStyle: {
      borderRadius: 8,
      fontSize: 12,
      border: "1px solid #e2e8f0"
    }
  }), /*#__PURE__*/React.createElement(Area, {
    type: "monotone",
    dataKey: "thu",
    stroke: "#2563eb",
    strokeWidth: 2,
    fill: "url(#g)"
  })))))), /*#__PURE__*/React.createElement(Card, {
    title: "Công nợ — 06/2026"
  }, /*#__PURE__*/React.createElement("ul", {
    className: "space-y-3 text-sm"
  }, /*#__PURE__*/React.createElement("li", {
    className: "flex justify-between"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-slate-500"
  }, "Phải thu KH"), /*#__PURE__*/React.createElement("span", {
    className: "font-semibold tabular-nums text-rose-600"
  }, vnd(633555810))), /*#__PURE__*/React.createElement("li", {
    className: "flex justify-between"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-slate-500"
  }, "— Đã thu"), /*#__PURE__*/React.createElement("span", {
    className: "font-medium tabular-nums text-emerald-600"
  }, vnd(72946000))), /*#__PURE__*/React.createElement("li", {
    className: "flex justify-between border-t border-slate-100 pt-3"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-slate-500"
  }, "Phải trả NCC"), /*#__PURE__*/React.createElement("span", {
    className: "font-semibold tabular-nums text-amber-600"
  }, vnd(1100458207)))), /*#__PURE__*/React.createElement("h3", {
    className: "mb-3 mt-5 text-sm font-semibold text-slate-700"
  }, "Số dư tài khoản"), /*#__PURE__*/React.createElement("ul", {
    className: "space-y-2 text-sm"
  }, [["TCB · Công ty", 56358134], ["TCB · PAT", 1303668374], ["Tiền mặt", 273100000]].map(([k, v]) => /*#__PURE__*/React.createElement("li", {
    key: k,
    className: "flex justify-between"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-slate-500"
  }, k), /*#__PURE__*/React.createElement("span", {
    className: "font-medium tabular-nums text-slate-800"
  }, vnd(v))))))), /*#__PURE__*/React.createElement(Card, {
    title: "Xếp hạng nhân viên"
  }, /*#__PURE__*/React.createElement("div", {
    className: "-mx-5 -mb-5 divide-y divide-slate-100"
  }, STAFF_RANK.map((s, i) => /*#__PURE__*/React.createElement("div", {
    key: s.name,
    className: "flex items-center gap-4 px-5 py-3"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-600"
  }, i + 1), /*#__PURE__*/React.createElement("div", {
    className: "w-28 shrink-0"
  }, /*#__PURE__*/React.createElement("p", {
    className: "text-sm font-medium text-slate-800"
  }, s.name), /*#__PURE__*/React.createElement("p", {
    className: "text-xs text-slate-400"
  }, s.role)), /*#__PURE__*/React.createElement("div", {
    className: "hidden w-28 shrink-0 text-xs text-slate-500 sm:block"
  }, s.orders, " đơn · ", s.custs, " khách"), /*#__PURE__*/React.createElement("div", {
    className: "w-28 shrink-0 text-right text-sm font-semibold tabular-nums text-slate-800"
  }, vndShort(s.rev)), /*#__PURE__*/React.createElement("div", {
    className: "flex flex-1 items-center gap-2"
  }, /*#__PURE__*/React.createElement("div", {
    className: "h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100"
  }, /*#__PURE__*/React.createElement("div", {
    className: "h-full rounded-full bg-blue-600",
    style: {
      width: `${s.collected * 100}%`
    }
  })), /*#__PURE__*/React.createElement("span", {
    className: "w-10 text-right text-xs tabular-nums text-slate-500"
  }, Math.round(s.collected * 100), "%")))))));
}

/* ───────── Sales module ───────── */
function SalesModule({
  orders,
  setOrders,
  sub,
  setActive
}) {
  const [view, setView] = useState("list"); // "list" | "create" | {edit:id}
  const [modal, setModal] = useState(null);
  const addOrder = (o, asDraft) => {
    const id = asDraft ? "BG000" + Math.floor(10 + Math.random() * 89) : "DH2602" + Math.floor(10 + Math.random() * 89);
    setOrders(p => [mkOrder({
      ...o,
      id,
      draft: asDraft,
      draftStatus: asDraft ? "Chưa tạo đơn hàng" : undefined,
      dt: new Date().toLocaleString("vi-VN", {
        hour12: false
      }).replace(",", "")
    }), ...p]);
    if (!asDraft && setActive) {
      setActive("sales_orders");
    } else {
      setView("list");
    }
  };
  const saveEdit = (id, o) => {
    setOrders(os => os.map(x => x.id === id ? {
      ...x,
      ...o
    } : x));
    setView("list");
  };
  const applyKho = (id, payload) => setOrders(os => os.map(o => o.id === id ? {
    ...o,
    imported: true,
    exported: payload.allExported,
    importExpense: payload.importExpense,
    pn: payload.pn,
    px: payload.px,
    dateIn: payload.dateIn,
    dateOut: payload.dateOut,
    items: o.items.map((it, i) => ({
      ...it,
      cost: payload.items[i].cost,
      supplier: payload.items[i].supplier
    }))
  } : o));
  const applyReturn = id => setOrders(os => os.map(o => o.id === id ? {
    ...o,
    returned: true
  } : o));
  const current = modal && orders.find(o => o.id === modal.id);
  if (view === "create") return /*#__PURE__*/React.createElement(CreateOrder, {
    isDraft: sub === "draft",
    onBack: () => setView("list"),
    onSave: addOrder
  });
  if (view && view.edit) {
    const eo = orders.find(o => o.id === view.edit);
    if (eo) return /*#__PURE__*/React.createElement(CreateOrder, {
      editOrder: eo,
      onBack: () => setView("list"),
      onSaveEdit: o => saveEdit(eo.id, o),
      onSave: addOrder,
      onConvertDraft: eo.draft
        ? id => setOrders(os => os.map(o => o.id === eo.id ? {...o, draftStatus: "Đã tạo đơn hàng"} : o))
        : undefined
    });
  }
  return /*#__PURE__*/React.createElement("div", {
    className: "space-y-4"
  }, sub === "draft" ? /*#__PURE__*/React.createElement(DraftTable, {
    drafts: orders.filter(o => o.draft),
    onNew: () => setView("create"),
    onEdit: o => setView({
      edit: o.id
    }),
    onDelete: id => setOrders(os => os.filter(o => o.id !== id))
  }) : /*#__PURE__*/React.createElement(OrderTable, {
    orders: orders.filter(o => !o.draft),
    onNew: () => setView("create"),
    onEdit: o => setView({
      edit: o.id
    }),
    onKho: o => setModal({
      mode: "kho",
      id: o.id
    }),
    onReturn: o => setModal({
      mode: "return",
      id: o.id
    })
  }), current && modal.mode === "kho" && /*#__PURE__*/React.createElement(KhoModal, {
    order: current,
    onClose: () => setModal(null),
    onConfirm: p => {
      applyKho(current.id, p);
    }
  }), current && modal.mode === "return" && /*#__PURE__*/React.createElement(ReturnModal, {
    order: current,
    onClose: () => setModal(null),
    onConfirm: () => {
      applyReturn(current.id);
      setModal(null);
    }
  }));
}
const Modal = ({
  title,
  sub,
  onClose,
  children,
  footer,
  maxW = "max-w-2xl"
}) => /*#__PURE__*/React.createElement("div", {
  className: "fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4",
  onClick: onClose
}, /*#__PURE__*/React.createElement("div", {
  className: `flex max-h-[88vh] w-full ${maxW} flex-col overflow-hidden rounded-xl bg-white shadow-xl`,
  onClick: e => e.stopPropagation()
}, /*#__PURE__*/React.createElement("div", {
  className: "flex items-start justify-between border-b border-slate-100 px-5 py-4"
}, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h3", {
  className: "text-sm font-semibold text-slate-800"
}, title), sub && /*#__PURE__*/React.createElement("p", {
  className: "mt-0.5 text-xs text-slate-400"
}, sub)), /*#__PURE__*/React.createElement("button", {
  onClick: onClose,
  className: "rounded-md p-1 text-slate-400 hover:bg-slate-100"
}, /*#__PURE__*/React.createElement(X, {
  className: "h-4 w-4"
}))), /*#__PURE__*/React.createElement("div", {
  className: "flex-1 overflow-auto p-5"
}, children), /*#__PURE__*/React.createElement("div", {
  className: "flex items-center justify-end gap-2 border-t border-slate-100 px-5 py-3"
}, footer)));
function PaymentModal({
  accounts,
  onClose,
  onConfirm,
  initial
}) {
  const [kind, setKind] = useState(initial?.kind || "Đặt cọc");
  const [amount, setAmount] = useState(initial?.amount || 0);
  const [account, setAccount] = useState(initial?.account || accounts[0]);
  const [note, setNote] = useState(initial?.note || "");
  const lbl = "mb-1 block text-xs font-medium text-slate-500";
  const inp = "w-full rounded-md border border-slate-200 px-2.5 py-1.5 text-sm focus:border-blue-400 focus:outline-none";
  return /*#__PURE__*/React.createElement(Modal, {
    title: "Thêm thanh toán",
    sub: "Mỗi khoản thu sẽ sinh 1 phiếu thu link sang Tài chính",
    maxW: "max-w-lg",
    onClose: onClose,
    footer: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("button", {
      onClick: onClose,
      className: "rounded-lg border border-slate-200 px-3.5 py-2 text-sm text-slate-600 hover:bg-slate-50"
    }, "Huỷ"), /*#__PURE__*/React.createElement("button", {
      onClick: () => onConfirm({
        kind,
        amount,
        account,
        note,
        date: new Date().toLocaleDateString("vi-VN")
      }),
      disabled: amount <= 0 && kind !== "Giảm giá thêm",
      className: "rounded-lg bg-blue-600 px-3.5 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:bg-slate-300"
    }, "Xác nhận"))
  }, /*#__PURE__*/React.createElement("div", {
    className: "space-y-3"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: lbl
  }, "Loại"), /*#__PURE__*/React.createElement("select", {
    className: inp,
    value: kind,
    onChange: e => setKind(e.target.value)
  }, ["Đặt cọc", "Thanh toán", "Hoàn tiền", "Giảm giá thêm"].map(s => /*#__PURE__*/React.createElement("option", {
    key: s
  }, s)))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: lbl
  }, "Số tiền"), /*#__PURE__*/React.createElement(NumInput, {
    className: inp,
    value: amount,
    onChange: setAmount
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: lbl
  }, "Tài khoản nhận tiền"), /*#__PURE__*/React.createElement("select", {
    className: inp,
    value: account,
    onChange: e => setAccount(e.target.value)
  }, accounts.map(s => /*#__PURE__*/React.createElement("option", {
    key: s
  }, s)))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: lbl
  }, "Ghi chú"), /*#__PURE__*/React.createElement("input", {
    className: inp,
    value: note,
    onChange: e => setNote(e.target.value),
    placeholder: "Ghi chú khoản thu…"
  }))));
}
const stockOf = name => {
  const p = PRODUCTS.find(x => x.name === name);
  return p ? p.stock : null;
};
const skuOf = name => {
  const p = PRODUCTS.find(x => x.name === name);
  return p ? p.sku : "—";
};
function KhoModal({
  order,
  onClose,
  onConfirm
}) {
  const [imported, setImported] = useState(!!order.imported);
  const [exported, setExported] = useState(!!order.exported);
  const [editing, setEditing] = useState(false);
  const [pn, setPn] = useState(order.pn || ("PN" + String(order.id).replace(/\D/g, "")));
  const [px, setPx] = useState(order.px || ("PX" + String(order.id).replace(/\D/g, "")));
  const [dateIn, setDateIn] = useState(order.dateIn || "2026-06-16");
  const [dateOut, setDateOut] = useState(order.dateOut || "2026-06-03");
  const [rows, setRows] = useState(order.items.map(it => {
    const stk = stockOf(it.name) || 0;
    const need = Math.max(0, it.qty - stk);
    return {
      name: it.name,
      qty: it.qty,
      kho: it.kho || "HH",
      slNhap: need,
      giaNhap: it.cost || 0,
      cpmh: 0,
      nccIn: it.supplier || "",
      slXuat: it.qty,
      giaBan: it.price || 0,
      cpbh: 0,
      nccOut: ""
    };
  }));
  const set = (i, p) => setRows(xs => xs.map((x, k) => k === i ? { ...x, ...p } : x));
  const ttNhap = r => r.slNhap * r.giaNhap + (r.cpmh || 0);
  const ttXuat = r => r.slXuat * r.giaBan + (r.cpbh || 0);
  const loiNhuan = r => ttXuat(r) - (r.cpbh || 0) - ttNhap(r) - (r.cpmh || 0);
  const totalProfit = rows.reduce((s, r) => s + loiNhuan(r), 0);
  const totalIn = rows.reduce((s, r) => s + ttNhap(r), 0);
  const totalOut = rows.reduce((s, r) => s + ttXuat(r), 0);
  const cpmhTotal = rows.reduce((s, r) => s + (r.cpmh || 0), 0);
  const statusLabel = exported ? "Đã xuất kho" : imported ? "Đã nhập kho" : "Đang xử lý";
  const statusCls = exported ? "bg-emerald-50 text-emerald-700 ring-emerald-200" : imported ? "bg-sky-50 text-sky-700 ring-sky-200" : "bg-amber-50 text-amber-700 ring-amber-200";
  const inp = "w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm text-center focus:border-blue-400 focus:outline-none";
  const inpSL = "w-12 rounded-lg border border-slate-200 px-1 py-1.5 text-sm text-center focus:border-blue-400 focus:outline-none";
  const inpCP = "w-20 rounded-lg border border-slate-200 px-1 py-1.5 text-sm text-center focus:border-blue-400 focus:outline-none";
  const inpNCC = "w-44 rounded-lg border border-slate-200 px-2 py-1.5 text-sm text-left focus:border-blue-400 focus:outline-none";
  const inpGia = "w-28 rounded-lg border border-slate-200 px-2 py-1.5 text-sm text-center focus:border-blue-400 focus:outline-none";
  const fieldInp = "w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none";
  const payload = allExp => ({
    importExpense: cpmhTotal,
    allExported: allExp,
    pn, px, dateIn, dateOut,
    items: rows.map(r => ({ cost: r.giaNhap, supplier: r.nccIn }))
  });
  const lockIn = imported && !editing;
  const lockOut = exported && !editing;
  const doImport = () => { setImported(true); setEditing(false); onConfirm(payload(exported)); };
  const doExport = () => { setExported(true); setEditing(false); onConfirm(payload(true)); onClose(); };
  const doEdit = () => setEditing(true);
  const th = (txt, extra) => React.createElement("th", { className: `px-3 py-2 font-medium ${extra || ""}` }, txt);
  const moneyCell = (val, color) => React.createElement("td", { className: `px-2 py-3 text-center text-sm font-semibold tabular-nums ${color}` }, num(val));
  return React.createElement(Modal, {
    maxW: "max-w-7xl",
    title: `Xử lý kho — Đơn ${order.id}`,
    sub: "Nhập thông tin nhập/xuất cho từng mặt hàng, sau đó xác nhận từng bước",
    onClose,
    footer: React.createElement(React.Fragment, null,
      React.createElement("button", {
        onClick: doEdit,
        disabled: (!imported && !exported) || editing,
        className: "rounded-lg border border-amber-300 bg-amber-50 px-3.5 py-2 text-sm font-medium text-amber-700 hover:bg-amber-100 disabled:opacity-40"
      }, "✎ Sửa"),
      React.createElement("button", {
        onClick: doImport,
        disabled: imported && !editing,
        className: "rounded-lg bg-blue-600 px-3.5 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:bg-slate-300"
      }, "↓ Nhập kho"),
      React.createElement("button", {
        onClick: doExport,
        disabled: (!imported && !editing) || (exported && !editing),
        className: "rounded-lg bg-emerald-600 px-3.5 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:bg-slate-300"
      }, "↑ Xuất kho"))
  },
    React.createElement("div", { className: "mb-4 flex justify-end" },
      React.createElement("span", { className: `inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium ring-1 ring-inset ${statusCls}` }, "⏳ ", statusLabel)),
    React.createElement("div", { className: "mb-5 grid grid-cols-1 gap-4 rounded-xl border border-slate-200 bg-slate-50/50 p-4 sm:grid-cols-2 lg:grid-cols-4" },
      React.createElement("div", null,
        React.createElement("label", { className: "mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500" }, "Số PN (Phiếu nhập)"),
        React.createElement("input", { className: fieldInp, value: pn, onChange: e => setPn(e.target.value) })),
      React.createElement("div", null,
        React.createElement("label", { className: "mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500" }, "Ngày nhập"),
        React.createElement("input", { type: "date", className: fieldInp, value: dateIn, onChange: e => setDateIn(e.target.value) })),
      React.createElement("div", null,
        React.createElement("label", { className: "mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500" }, "Số PX (Phiếu xuất)"),
        React.createElement("input", { className: fieldInp, value: px, onChange: e => setPx(e.target.value) })),
      React.createElement("div", null,
        React.createElement("label", { className: "mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500" }, "Ngày xuất"),
        React.createElement("input", { type: "date", className: fieldInp, value: dateOut, onChange: e => setDateOut(e.target.value) }))),
    React.createElement("datalist", { id: "ncc-list" }, SUPPLIERS.map(s => React.createElement("option", { key: s.code, value: s.name }))),
    React.createElement("div", { className: "overflow-x-auto rounded-xl border border-slate-200" },
      React.createElement("table", { className: "w-full text-sm", style: { minWidth: 1320 } },
        React.createElement("thead", null,
          React.createElement("tr", { className: "text-xs uppercase tracking-wide" },
            React.createElement("th", { colSpan: 3, className: "border-b border-slate-200 bg-white" }),
            React.createElement("th", { colSpan: 5, className: "border-b border-l border-blue-200 bg-blue-50 px-3 py-2 text-center font-semibold text-blue-700" }, "↓ Nhập kho"),
            React.createElement("th", { colSpan: 4, className: "border-b border-l border-emerald-200 bg-emerald-50 px-3 py-2 text-center font-semibold text-emerald-700" }, "↑ Xuất kho"),
            React.createElement("th", { rowSpan: 2, className: "border-b border-l border-amber-200 bg-amber-100/60 px-2 py-2 text-center font-semibold text-amber-700" }, "Lợi nhuận")),
          React.createElement("tr", { className: "border-b border-slate-200 bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500" },
            th("SL đặt/tồn kho", "text-center"),
            th("Kho", "text-center"),
            th("Sản phẩm"),
            th("SL nhập", "border-l border-blue-200 bg-blue-50/50 text-center"),
            th("Giá nhập", "bg-blue-50/50 text-center"),
            th("CPMH", "bg-blue-50/50 text-center"),
            th("NCC", "bg-blue-50/50 text-center"),
            th("TT nhập", "bg-blue-100/60 text-center text-blue-700"),
            th("SL xuất", "border-l border-emerald-200 bg-emerald-50/50 text-center"),
            th("Giá bán", "bg-emerald-50/50 text-center"),
            th("CPBH", "bg-emerald-50/50 text-center"),
            th("TT xuất", "bg-emerald-100/60 text-center text-emerald-700"))),
        React.createElement("tbody", null,
          rows.map((r, i) => {
            const stock = stockOf(r.name);
            return React.createElement("tr", { key: i, className: "border-b border-slate-100 align-middle" },
              React.createElement("td", { className: "px-3 py-3 text-center" },
                React.createElement("span", { className: "rounded bg-slate-200 px-1.5 py-0.5 text-xs font-medium text-slate-600" }, r.qty),
                React.createElement("span", { className: "mx-0.5 text-slate-300" }, "/"),
                React.createElement("span", { className: `rounded px-1.5 py-0.5 text-xs font-medium ${(stock || 0) === 0 ? "bg-rose-100 text-rose-600" : "bg-emerald-100 text-emerald-700"}` }, stock ?? "—")),
              React.createElement("td", { className: "px-3 py-3 text-center" },
                React.createElement("select", { disabled: lockIn, className: `rounded-md border border-slate-200 px-1 py-1 text-xs ${lockIn ? "bg-slate-100 text-slate-400" : ""}`, value: r.kho, onChange: e => set(i, { kho: e.target.value }) },
                  React.createElement("option", { value: "TB" }, "TB"),
                  React.createElement("option", { value: "HG" }, "HG"),
                  React.createElement("option", { value: "HH" }, "HH"))),
              React.createElement("td", { className: "px-3 py-3 text-slate-800", style: { minWidth: 180 } }, r.name),
              React.createElement("td", { className: "border-l border-blue-100 bg-blue-50/30 px-2 py-3" },
                React.createElement("input", { type: "number", disabled: lockIn, className: `${inpSL} ${lockIn ? "bg-slate-100 text-slate-400" : ""}`, value: r.slNhap, onChange: e => set(i, { slNhap: +e.target.value }) })),
              React.createElement("td", { className: "bg-blue-50/30 px-2 py-3" },
                React.createElement(NumInput, { className: inpGia, align: "center", disabled: lockIn, value: r.giaNhap, onChange: v => set(i, { giaNhap: v }) })),
              React.createElement("td", { className: "bg-blue-50/30 px-2 py-3" },
                React.createElement(NumInput, { className: inpCP, align: "center", disabled: lockIn, value: r.cpmh, onChange: v => set(i, { cpmh: v }) })),
              React.createElement("td", { className: "bg-blue-50/30 px-2 py-3" },
                React.createElement("input", { className: `${inpNCC} ${lockIn ? "bg-slate-100 text-slate-400" : ""}`, disabled: lockIn, list: "ncc-list", value: r.nccIn, placeholder: "Lọc / chọn NCC", onChange: e => set(i, { nccIn: e.target.value }) })),
              moneyCell(ttNhap(r), "bg-blue-100/40 text-blue-700"),
              React.createElement("td", { className: "border-l border-emerald-100 bg-emerald-50/30 px-2 py-3" },
                React.createElement("input", { type: "number", disabled: lockOut, className: `${inpSL} ${lockOut ? "bg-slate-100 text-slate-400" : ""}`, value: r.slXuat, onChange: e => set(i, { slXuat: +e.target.value }) })),
              React.createElement("td", { className: "bg-emerald-50/30 px-2 py-3" },
                React.createElement(NumInput, { className: inpGia, align: "center", disabled: lockOut, value: r.giaBan, onChange: v => set(i, { giaBan: v }) })),
              React.createElement("td", { className: "bg-emerald-50/30 px-2 py-3" },
                React.createElement(NumInput, { className: inpCP, align: "center", disabled: lockOut, value: r.cpbh, onChange: v => set(i, { cpbh: v }) })),
              moneyCell(ttXuat(r), "bg-emerald-100/40 text-emerald-700"),
              React.createElement("td", { className: "border-l border-amber-100 bg-amber-50/40 px-2 py-3 text-center text-sm font-semibold tabular-nums text-rose-600" }, num(loiNhuan(r))));
          }),
          React.createElement("tr", { className: "border-t-2 border-slate-200 bg-slate-50 font-semibold" },
            React.createElement("td", { className: "px-3 py-3 text-slate-700", colSpan: 3 }, "Tổng cộng"),
            React.createElement("td", { colSpan: 4, className: "border-l border-blue-100 bg-blue-50/30" }),
            moneyCell(totalIn, "bg-blue-100/60 text-blue-700"),
            React.createElement("td", { colSpan: 3, className: "border-l border-emerald-100 bg-emerald-50/30" }),
            moneyCell(totalOut, "bg-emerald-100/60 text-emerald-700"),
            React.createElement("td", { className: "border-l border-amber-100 bg-amber-100/50 px-2 py-3 text-center text-sm font-bold tabular-nums text-rose-600" }, num(totalProfit)))))));
}
function ReturnModal({
  order,
  onClose,
  onConfirm
}) {
  const [rows, setRows] = useState(order.items.map(it => ({
    name: it.name,
    price: it.price,
    max: it.qty,
    qty: 0
  })));
  const [reason, setReason] = useState("");
  const set = (i, p) => setRows(xs => xs.map((x, k) => k === i ? {
    ...x,
    ...p
  } : x));
  const total = rows.reduce((s, r) => s + r.price * r.qty, 0);
  const sm = "w-full rounded-md border border-slate-200 px-2 py-1 text-sm focus:border-blue-400 focus:outline-none";
  return /*#__PURE__*/React.createElement(Modal, {
    title: `Hoàn hàng — Đơn ${order.id}`,
    sub: "Chọn mặt hàng và số lượng khách trả lại",
    onClose: onClose,
    footer: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("span", {
      className: "mr-auto text-sm text-slate-500"
    }, "Tổng tiền hoàn: ", /*#__PURE__*/React.createElement("b", {
      className: "tabular-nums text-rose-600"
    }, vnd(total))), /*#__PURE__*/React.createElement("button", {
      onClick: onClose,
      className: "rounded-lg border border-slate-200 px-3.5 py-2 text-sm text-slate-600 hover:bg-slate-50"
    }, "Hủy"), /*#__PURE__*/React.createElement("button", {
      onClick: onConfirm,
      disabled: total === 0,
      className: "rounded-lg bg-rose-600 px-3.5 py-2 text-sm font-medium text-white hover:bg-rose-700 disabled:bg-slate-300"
    }, "Xác nhận hoàn hàng"))
  }, /*#__PURE__*/React.createElement("div", {
    className: "space-y-3"
  }, rows.map((r, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    className: "flex items-center gap-3 rounded-lg border border-slate-200 p-3"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex-1"
  }, /*#__PURE__*/React.createElement("p", {
    className: "text-sm text-slate-800"
  }, r.name), /*#__PURE__*/React.createElement("p", {
    className: "text-xs text-slate-400"
  }, "Đã mua: ", r.max, " · ", vnd(r.price))), /*#__PURE__*/React.createElement("div", {
    className: "w-28"
  }, /*#__PURE__*/React.createElement("label", {
    className: "text-xs text-slate-400"
  }, "SL trả"), /*#__PURE__*/React.createElement("input", {
    type: "number",
    min: 0,
    max: r.max,
    className: sm,
    value: r.qty,
    onChange: e => set(i, {
      qty: Math.min(r.max, Math.max(0, +e.target.value))
    })
  })))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: "mb-1 block text-xs font-medium text-slate-500"
  }, "Lý do hoàn"), /*#__PURE__*/React.createElement("input", {
    className: sm,
    value: reason,
    onChange: e => setReason(e.target.value),
    placeholder: "VD: khách đổi mẫu, lỗi sản phẩm..."
  }))));
}
function OrderTable({
  orders,
  onNew,
  onEdit,
  onKho,
  onReturn
}) {
  const notify = useToast();
  const [q, setQ] = useState("");
  const [doc, setDoc] = useState(null);
  const [fDelivery, setFDelivery] = useState("Tất cả");
  const [fStatus, setFStatus] = useState("Tất cả");
  const [fStaff, setFStaff] = useState("Tất cả");
  const staffList = ["Tất cả", ...new Set(orders.map(o => o.staff))];
  const rows = orders.filter(o => {
    if (fDelivery !== "Tất cả" && o.delivery !== fDelivery) return false;
    if (fStatus !== "Tất cả" && o.orderStatus !== fStatus) return false;
    if (fStaff !== "Tất cả" && o.staff !== fStaff) return false;
    if (q && !`${o.id} ${o.name} ${o.phone}`.toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  });
  const onExport = () => exportCSV("danh-sach-don-hang", ["Số ĐH", "Ngày", "Khách hàng", "SĐT", "Địa chỉ", "Thành tiền", "Đã trả", "Còn lại", "Giao hàng", "Trạng thái", "Nhân viên"], rows.map(o => {
    const c = calc(o);
    return [o.id, o.dt, o.name, o.phone, o.addr, c.total, o.paid, c.remaining, o.delivery, o.orderStatus, o.staff];
  }));
  return /*#__PURE__*/React.createElement("div", {
    className: "space-y-4"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex flex-wrap items-center justify-end gap-2"
  }, /*#__PURE__*/React.createElement(ExportBtn, {
    onClick: onExport
  }), /*#__PURE__*/React.createElement("button", {
    onClick: onNew,
    className: blueBtn
  }, /*#__PURE__*/React.createElement(Plus, {
    className: "h-4 w-4"
  }), " Tạo đơn hàng")), /*#__PURE__*/React.createElement("div", {
    className: "flex flex-wrap items-end gap-3 rounded-xl border border-slate-200 bg-white p-3"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: "mb-1 block text-xs font-medium text-slate-500"
  }, "Từ ngày"), /*#__PURE__*/React.createElement("input", {
    type: "date",
    defaultValue: "2026-06-01",
    className: field
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: "mb-1 block text-xs font-medium text-slate-500"
  }, "Đến ngày"), /*#__PURE__*/React.createElement("input", {
    type: "date",
    defaultValue: "2026-06-16",
    className: field
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: "mb-1 block text-xs font-medium text-slate-500"
  }, "Giao hàng"), /*#__PURE__*/React.createElement("select", {
    value: fDelivery,
    onChange: e => setFDelivery(e.target.value),
    className: field
  }, ["Tất cả", "Đã giao hàng", "Chưa giao hàng"].map(s => /*#__PURE__*/React.createElement("option", {
    key: s
  }, s)))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: "mb-1 block text-xs font-medium text-slate-500"
  }, "Trạng thái"), /*#__PURE__*/React.createElement("select", {
    value: fStatus,
    onChange: e => setFStatus(e.target.value),
    className: field
  }, ["Tất cả", "Đặt cọc", "Đang xử lý", "Hoàn thành", "Huỷ"].map(s => /*#__PURE__*/React.createElement("option", {
    key: s
  }, s)))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: "mb-1 block text-xs font-medium text-slate-500"
  }, "Nhân viên"), /*#__PURE__*/React.createElement("select", {
    value: fStaff,
    onChange: e => setFStaff(e.target.value),
    className: field
  }, staffList.map(s => /*#__PURE__*/React.createElement("option", {
    key: s
  }, s)))), /*#__PURE__*/React.createElement("div", {
    className: "relative min-w-[220px] flex-1"
  }, /*#__PURE__*/React.createElement("label", {
    className: "mb-1 block text-xs font-medium text-slate-500"
  }, "Tìm kiếm"), /*#__PURE__*/React.createElement(Search, {
    className: "absolute left-2.5 top-[2.05rem] h-4 w-4 text-slate-400"
  }), /*#__PURE__*/React.createElement("input", {
    value: q,
    onChange: e => setQ(e.target.value),
    placeholder: "Mã đơn, SĐT khách hàng…",
    className: `${field} w-full pl-8`
  }))), /*#__PURE__*/React.createElement("p", {
    className: "text-xs text-slate-400"
  }, rows.length, " đơn · cuộn ngang để xem hết các cột →"), /*#__PURE__*/React.createElement(TableShell, {
    minW: "1360px",
    head: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(Th, {
      style: {
        width: 96, position: "sticky", left: 0, zIndex: 2, background: "#f8fafc"
      }
    }, "Số ĐH"), /*#__PURE__*/React.createElement(Th, {
      style: {
        width: 90, position: "sticky", left: 96, zIndex: 2, background: "#f8fafc"
      }
    }, "Ngày"), /*#__PURE__*/React.createElement(Th, {
      style: {
        width: 130, position: "sticky", left: 186, zIndex: 2, background: "#f8fafc"
      }
    }, "Khách hàng"), /*#__PURE__*/React.createElement(Th, {
      style: {
        width: 180, position: "sticky", left: 316, zIndex: 2, background: "#f8fafc"
      }
    }, "Địa chỉ"), /*#__PURE__*/React.createElement(Th, {
      right: true,
      style: {
        width: 110
      }
    }, "Tổng đơn"), /*#__PURE__*/React.createElement(Th, {
      right: true,
      style: {
        width: 100
      }
    }, "Đã trả"), /*#__PURE__*/React.createElement(Th, {
      right: true,
      style: {
        width: 100
      }
    }, "Còn lại"), /*#__PURE__*/React.createElement(Th, {
      center: true,
      style: {
        width: 90
      }
    }, "Trạng thái"), /*#__PURE__*/React.createElement(Th, {
      center: true,
      style: {
        width: 90
      }
    }, "Giao hàng"), /*#__PURE__*/React.createElement(Th, {
      center: true,
      style: {
        width: 90
      }
    }, "Thanh toán"), /*#__PURE__*/React.createElement(Th, {
      center: true,
      style: {
        width: 140
      }
    }, "Xử lý kho"), /*#__PURE__*/React.createElement(Th, {
      center: true,
      style: {
        width: 100
      }
    }, "Hoàn hàng"), /*#__PURE__*/React.createElement(Th, {
      center: true,
      style: {
        width: 90
      }
    }, "Nhân viên"), /*#__PURE__*/React.createElement(Th, {
      center: true,
      style: {
        width: 80
      }
    }, "Thao tác"))
  }, /*#__PURE__*/React.createElement(React.Fragment, null, rows.map((o, ri) => {
    const c = calc(o);
    const isCancel = o.orderStatus === "Huỷ";
    const rowBg = isCancel ? "#f1f5f9" : (ri % 2 ? "#f1f5f9" : "#ffffff");
    return /*#__PURE__*/React.createElement("tr", {
      key: o.id,
      className: `align-top hover:brightness-95 ${isCancel ? "opacity-60 grayscale text-slate-400" : ""}`,
      style: { background: rowBg, borderBottom: "1px solid #e2e8f0" }
    }, /*#__PURE__*/React.createElement("td", {
      className: "whitespace-nowrap px-3 py-3",
      style: { position: "sticky", left: 0, zIndex: 1, background: rowBg }
    }, /*#__PURE__*/React.createElement("button", {
      onClick: () => onEdit(o),
      className: "font-medium text-blue-700 underline-offset-2 hover:underline"
    }, o.id)), /*#__PURE__*/React.createElement("td", {
      className: "px-3 py-3",
      style: { position: "sticky", left: 96, zIndex: 1, background: rowBg }
    }, /*#__PURE__*/React.createElement(DateTime, {
      value: o.dt
    })), /*#__PURE__*/React.createElement("td", {
      className: "px-3 py-3",
      style: { position: "sticky", left: 186, zIndex: 1, minWidth: 130, maxWidth: 130, background: rowBg }
    }, /*#__PURE__*/React.createElement("div", {
      className: "text-slate-800"
    }, o.name), /*#__PURE__*/React.createElement("div", {
      className: "text-xs text-slate-400"
    }, /*#__PURE__*/React.createElement(Phone, {
      value: o.phone
    }))), /*#__PURE__*/React.createElement("td", {
      className: "px-3 py-3 text-xs text-slate-500",
      style: { position: "sticky", left: 316, zIndex: 1, minWidth: 180, maxWidth: 180, background: rowBg }
    }, o.addr || "—"), /*#__PURE__*/React.createElement("td", {
      className: "whitespace-nowrap px-3 py-3 text-right text-sm tabular-nums text-slate-800"
    }, num(c.total)), /*#__PURE__*/React.createElement("td", {
      className: "whitespace-nowrap px-3 py-3 text-right text-sm tabular-nums text-emerald-600"
    }, num(o.paid)), /*#__PURE__*/React.createElement("td", {
      className: `whitespace-nowrap px-3 py-3 text-right text-sm tabular-nums ${c.remaining > 0 ? "text-rose-600" : "text-slate-300"}`
    }, c.remaining > 0 ? num(c.remaining) : "—"), /*#__PURE__*/React.createElement("td", {
      className: "px-3 py-3 text-center"
    }, /*#__PURE__*/React.createElement(Pill, {
      map: ORDER_STATUS,
      value: o.orderStatus
    })), /*#__PURE__*/React.createElement("td", {
      className: "px-3 py-3 text-center"
    }, /*#__PURE__*/React.createElement(Pill, {
      map: DELIVERY,
      value: o.delivery
    })), /*#__PURE__*/React.createElement("td", {
      className: "px-3 py-3 text-center"
    }, /*#__PURE__*/React.createElement(Pill, {
      map: PAY_STATUS,
      value: c.pay
    })), /*#__PURE__*/React.createElement("td", {
      className: "px-3 py-3 text-center"
    }, (() => {
      const label = !o.imported ? "Cần nhập" : !o.exported ? "Cần xuất" : "Đã xong";
      const cls = !o.imported ? "bg-amber-50 text-amber-700 ring-amber-200" : !o.exported ? "bg-sky-50 text-sky-700 ring-sky-200" : "bg-emerald-50 text-emerald-700 ring-emerald-200";
      return /*#__PURE__*/React.createElement("button", {
        onClick: () => onKho(o),
        title: "Mở màn hình xử lý kho (nhập → xuất)",
        className: `inline-flex items-center gap-1 whitespace-nowrap rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset transition hover:opacity-80 ${cls}`
      }, label === "Đã xong" ? /*#__PURE__*/React.createElement(Check, {
        className: "h-3 w-3"
      }) : /*#__PURE__*/React.createElement(ArrowDownToLine, {
        className: "h-3 w-3"
      }), " ", label);
    })()), /*#__PURE__*/React.createElement("td", {
      className: "px-3 py-3 text-center"
    }, o.returned ? /*#__PURE__*/React.createElement("span", {
      className: "inline-flex items-center gap-1 rounded-md bg-rose-50 px-2 py-1 text-xs font-medium text-rose-600 ring-1 ring-inset ring-rose-200"
    }, /*#__PURE__*/React.createElement(RotateCcw, {
      className: "h-3 w-3"
    }), " Đã hoàn") : /*#__PURE__*/React.createElement("button", {
      onClick: () => onReturn(o),
      title: "Tạo phiếu hoàn hàng",
      className: "inline-flex items-center gap-1 rounded-md bg-white px-2 py-1 text-xs text-slate-500 ring-1 ring-inset ring-slate-200 transition hover:bg-slate-50"
    }, /*#__PURE__*/React.createElement(RotateCcw, {
      className: "h-3 w-3"
    }), " Hoàn")), /*#__PURE__*/React.createElement("td", {
      className: "whitespace-nowrap px-3 py-3 text-center text-xs text-slate-500"
    }, o.staff || "—"), /*#__PURE__*/React.createElement("td", {
      className: "px-3 py-3"
    }, /*#__PURE__*/React.createElement("div", {
      className: "flex items-center justify-center"
    }, /*#__PURE__*/React.createElement(IconBtn, {
      icon: Printer,
      title: "In đơn",
      onClick: () => setDoc({
        code: o.id,
        fields: {
          "Khách hàng": o.name,
          "SĐT": o.phone || "—",
          "Địa chỉ": o.addr || "—",
          "Thành tiền": vnd(c.total)
        },
        items: o.items
      })
    }), /*#__PURE__*/React.createElement(IconBtn, {
      icon: Pencil,
      title: "Sửa đơn",
      onClick: () => onEdit(o)
    }))));
  }), (() => {
    const sumTotal = rows.reduce((s, o) => s + calc(o).total, 0);
    const sumPaid = rows.reduce((s, o) => s + (o.paid || 0), 0);
    const sumRemain = rows.reduce((s, o) => s + calc(o).remaining, 0);
    return /*#__PURE__*/React.createElement("tr", {
      className: "border-t-2 border-slate-300 bg-slate-100 font-semibold text-slate-700"
    }, /*#__PURE__*/React.createElement("td", {
      colSpan: 4,
      className: "px-3 py-3",
      style: { position: "sticky", left: 0, zIndex: 1, background: "#f1f5f9" }
    }, "Tổng cộng (", rows.length, " đơn)"), /*#__PURE__*/React.createElement("td", {
      className: "whitespace-nowrap px-3 py-3 text-right text-sm tabular-nums text-slate-800"
    }, num(sumTotal)), /*#__PURE__*/React.createElement("td", {
      className: "whitespace-nowrap px-3 py-3 text-right text-sm tabular-nums text-emerald-600"
    }, num(sumPaid)), /*#__PURE__*/React.createElement("td", {
      className: `whitespace-nowrap px-3 py-3 text-right text-sm tabular-nums ${sumRemain > 0 ? "text-rose-600" : "text-slate-400"}`
    }, num(sumRemain)), /*#__PURE__*/React.createElement("td", {
      colSpan: 7
    }));
  })())), doc && /*#__PURE__*/React.createElement(DocModal, {
    doc: doc,
    onClose: () => setDoc(null)
  }));
}
function DraftTable({
  drafts,
  onDelete,
  onNew,
  onEdit
}) {
  const notify = useToast();
  const [q, setQ] = useState("");
  const [doc, setDoc] = useState(null);
  const DSTATUS = {
    "Đã lên đơn": "bg-emerald-50 text-emerald-700 ring-emerald-200",
    "Chưa tạo đơn hàng": "bg-slate-100 text-slate-600 ring-slate-200",
  "Đã tạo đơn hàng": "bg-blue-50 text-blue-700 ring-blue-200"
  };
  const rows = drafts.filter(o => !q || `${o.id} ${o.name} ${o.phone} ${o.desc || ""}`.toLowerCase().includes(q.toLowerCase()));
  const onExport = () => exportCSV("bao-gia", ["Mã Báo giá", "Ngày", "Tên khách hàng", "Địa chỉ", "Diễn giải", "Trạng thái", "Nhân viên"], rows.map(o => [o.id, o.dt, o.name, o.addr, o.desc, o.draftStatus || "Chưa xử lý", o.staff]));
  const Toolbar = () => /*#__PURE__*/React.createElement("div", {
    className: "space-y-3"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex justify-end"
  }, /*#__PURE__*/React.createElement("button", {
    onClick: onNew,
    className: blueBtn
  }, /*#__PURE__*/React.createElement(Plus, {
    className: "h-4 w-4"
  }), " Tạo báo giá")), /*#__PURE__*/React.createElement("div", {
    className: "flex flex-wrap items-end gap-3 rounded-xl border border-slate-200 bg-white p-3"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: "mb-1 block text-xs font-medium text-slate-500"
  }, "Từ ngày"), /*#__PURE__*/React.createElement("input", {
    type: "date",
    defaultValue: "2026-06-01",
    className: field
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: "mb-1 block text-xs font-medium text-slate-500"
  }, "Đến ngày"), /*#__PURE__*/React.createElement("input", {
    type: "date",
    defaultValue: "2026-06-16",
    className: field
  })), /*#__PURE__*/React.createElement("div", {
    className: "relative min-w-[220px] flex-1"
  }, /*#__PURE__*/React.createElement("label", {
    className: "mb-1 block text-xs font-medium text-slate-500"
  }, "Tìm kiếm"), /*#__PURE__*/React.createElement(Search, {
    className: "absolute left-2.5 top-[2.05rem] h-4 w-4 text-slate-400"
  }), /*#__PURE__*/React.createElement("input", {
    value: q,
    onChange: e => setQ(e.target.value),
    placeholder: "Mã báo giá, khách hàng…",
    className: `${field} w-full pl-8`
  })), /*#__PURE__*/React.createElement(PrintBtn, null), /*#__PURE__*/React.createElement(ExportBtn, {
    onClick: onExport
  })));
  if (!drafts.length) return /*#__PURE__*/React.createElement("div", {
    className: "space-y-4"
  }, /*#__PURE__*/React.createElement(Toolbar, null), /*#__PURE__*/React.createElement(Empty, null, "Chưa có báo giá. Vào \"Tạo báo giá\" → bấm \"Lưu báo giá\" để lưu tạm."));
  return /*#__PURE__*/React.createElement("div", {
    className: "space-y-4"
  }, /*#__PURE__*/React.createElement(Toolbar, null), /*#__PURE__*/React.createElement(TableShell, {
    head: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(Th, null, "Mã Báo giá"), /*#__PURE__*/React.createElement(Th, {
      style: {
        width: 90
      }
    }, "Ngày"), /*#__PURE__*/React.createElement(Th, {
      style: {
        minWidth: 200
      }
    }, "Tên khách hàng"), /*#__PURE__*/React.createElement(Th, {
      style: {
        minWidth: 180
      }
    }, "Địa chỉ"), /*#__PURE__*/React.createElement(Th, {
      style: {
        minWidth: 200
      }
    }, "Diễn giải"), /*#__PURE__*/React.createElement(Th, null, "Trạng thái"), /*#__PURE__*/React.createElement(Th, null, "Nhân viên"), /*#__PURE__*/React.createElement(Th, {
      center: true,
      style: {
        width: 110
      }
    }, "Thao tác"))
  }, rows.map(o => /*#__PURE__*/React.createElement("tr", {
    key: o.id,
    className: "align-top hover:bg-slate-50/60"
  }, /*#__PURE__*/React.createElement("td", {
    className: "whitespace-nowrap px-4 py-3"
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => onEdit(o),
    className: "font-medium text-amber-600 underline-offset-2 hover:underline"
  }, o.id)), /*#__PURE__*/React.createElement("td", {
    className: "px-4 py-3"
  }, /*#__PURE__*/React.createElement(DateTime, {
    value: o.dt
  })), /*#__PURE__*/React.createElement("td", {
    className: "px-4 py-3 text-slate-800"
  }, o.name), /*#__PURE__*/React.createElement("td", {
    className: "px-4 py-3 text-xs text-slate-500",
    style: {
      maxWidth: 180
    }
  }, o.addr || "—"), /*#__PURE__*/React.createElement("td", {
    className: "px-4 py-3 text-xs text-slate-500",
    style: {
      maxWidth: 200
    }
  }, o.desc || "—"), /*#__PURE__*/React.createElement("td", {
    className: "px-4 py-3"
  }, /*#__PURE__*/React.createElement(Pill, {
    map: DSTATUS,
    value: o.draftStatus || "Chưa xử lý"
  })), /*#__PURE__*/React.createElement("td", {
    className: "whitespace-nowrap px-4 py-3 text-xs text-slate-500"
  }, o.staff), /*#__PURE__*/React.createElement("td", {
    className: "px-4 py-3"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-center"
  }, /*#__PURE__*/React.createElement(IconBtn, {
    icon: Pencil,
    title: "Sửa báo giá",
    onClick: () => onEdit(o)
  }), /*#__PURE__*/React.createElement(IconBtn, {
    icon: Printer,
    title: "In báo giá",
    onClick: () => setDoc({
      code: o.id,
      fields: {
        "Khách hàng": o.name,
        "Diễn giải": o.desc || "—"
      },
      items: o.items
    })
  }), /*#__PURE__*/React.createElement(IconBtn, {
    icon: Trash2,
    title: "Xoá báo giá",
    onClick: () => onDelete(o.id)
  })))))), doc && /*#__PURE__*/React.createElement(DocModal, {
    doc: doc,
    onClose: () => setDoc(null)
  }));
}
function CreateOrder({
  onBack,
  onSave,
  onSaveEdit,
  editOrder,
  isDraft,
  onConvertDraft
}) {
  const notify = useToast();
  const isEdit = !!editOrder;
  const [prods, setProds] = useState(PRODUCTS);
  const [cust, setCust] = useState({
    phone: editOrder?.phone || "",
    name: editOrder?.name || "",
    addr: editOrder?.addr || ""
  });
  const [store, setStore] = useState(editOrder?.store || "Kho HH");
  const [channel, setChannel] = useState(editOrder?.channel || "Facebook");
  const [orderStatus, setOrderStatus] = useState(editOrder?.orderStatus || "Đặt cọc");
  const [delivery, setDelivery] = useState(editOrder?.delivery || "Chưa giao hàng");
  const [dt, setDt] = useState("2026-06-16");
  const [lines, setLines] = useState(editOrder ? editOrder.items.map(it => ({
    name: it.name,
    price: it.price,
    qty: it.qty,
    disc: it.disc || 0,
    discType: "đ",
    cost: it.cost || 0,
    list: 0
  })) : [{
    name: "",
    price: 0,
    qty: 1,
    disc: 0,
    discType: "đ",
    cost: 0,
    list: 0
  }]);
  const [paid, setPaid] = useState(editOrder?.paid || 0);
  const [expense, setExpense] = useState(editOrder?.expense || 0);
  const [expenseType, setExpenseType] = useState(editOrder?.expenseType || "");
  const [companyExpense, setCompanyExpense] = useState(editOrder?.companyExpense || 0);
  const [companyExpenseType, setCompanyExpenseType] = useState(editOrder?.companyExpenseType || "");
  const [payModal, setPayModal] = useState(false);
  const [editPayIdx, setEditPayIdx] = useState(null);
  const [editPayModal, setEditPayModal] = useState(false);
  const [payments, setPayments] = useState(editOrder?.payments || []);
  const ACCOUNTS = ["Tiền mặt", "Vietcombank", "Techcombank", "MB Bank", "Momo"];
  const [newProdReq, setNewProdReq] = useState(null); // { name, lineIdx }
  const setLine = (i, p) => setLines(ls => ls.map((l, x) => x === i ? {
    ...l,
    ...p
  } : l));
  const lineDisc = l => l.discType === "%" ? l.price * l.qty * (l.disc || 0) / 100 : l.disc || 0;
  const lineTotal = l => Math.max(0, l.price * l.qty - lineDisc(l));
  const subtotal = lines.reduce((s, l) => s + lineTotal(l), 0);
  const total = subtotal + (expense || 0);
  const remaining = total - paid;
  const build = () => ({
    name: cust.name || "Khách lẻ",
    phone: cust.phone,
    addr: cust.addr,
    store,
    channel,
    staff: "PAT",
    paid,
    expense,
    expenseType,
    companyExpense,
    companyExpenseType,
    orderStatus,
    delivery,
    payments,
    items: lines.filter(l => l.name).map(l => ({
      name: l.name,
      price: l.price,
      qty: l.qty,
      disc: lineDisc(l),
      cost: l.cost
    }))
  });
  const onAddProduct = p => setProds(xs => [{
    ...p
  }, ...xs]);
  const sm = inputSm;
  return /*#__PURE__*/React.createElement("div", {
    className: "space-y-5"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex flex-wrap items-center justify-between gap-3"
  }, /*#__PURE__*/React.createElement("h2", {
    className: "text-xl font-bold text-slate-800"
  }, isEdit ? editOrder.draft ? `Sửa báo giá #${editOrder.id}` : `Sửa đơn hàng #${editOrder.id}` : isDraft ? "Tạo báo giá" : "Tạo đơn hàng"), /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-2"
  }, /*#__PURE__*/React.createElement("input", {
    type: "date",
    value: dt,
    onChange: e => setDt(e.target.value),
    className: field
  }), isDraft ? /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("button", {
    onClick: () => { onSave(build(), true); notify("✅ Đã lưu báo giá"); setTimeout(onBack, 800); },
    disabled: subtotal === 0 || paid > 0,
    title: paid > 0 ? "Đã có thanh toán/đặt cọc - chỉ có thể tạo đơn hàng" : "",
    className: greenBtn + " disabled:cursor-not-allowed disabled:bg-slate-300"
  }, /*#__PURE__*/React.createElement(Save, {
    className: "h-4 w-4"
  }), " Lưu báo giá"), /*#__PURE__*/React.createElement("button", {
    onClick: () => { onSave(build(), false); notify("✅ Đã tạo đơn hàng"); },
    disabled: subtotal === 0,
    className: blueBtn + " disabled:cursor-not-allowed disabled:bg-slate-300"
  }, /*#__PURE__*/React.createElement(Plus, {
    className: "h-4 w-4"
  }), " Tạo đơn hàng")) : isEdit ? /*#__PURE__*/React.createElement(React.Fragment, null,
  /*#__PURE__*/React.createElement("button", {
    onClick: () => { onSaveEdit(build()); notify(editOrder && editOrder.draft ? "✅ Đã lưu báo giá" : "✅ Đã lưu đơn hàng"); setTimeout(onBack, 800); },
    disabled: editOrder && editOrder.draft && paid > 0,
    title: editOrder && editOrder.draft && paid > 0 ? "Đã có thanh toán - chỉ có thể tạo đơn hàng" : "",
    className: greenBtn + " disabled:cursor-not-allowed disabled:bg-slate-300"
  }, /*#__PURE__*/React.createElement(Save, {
    className: "h-4 w-4"
  }), editOrder && editOrder.draft ? " Lưu báo giá" : " Lưu đơn hàng"),
  editOrder && editOrder.draft && onConvertDraft
    ? /*#__PURE__*/React.createElement("button", {
        onClick: () => {
          const newId = "DH2602" + Math.floor(10 + Math.random() * 89);
          onConvertDraft(newId);
          onSave && onSave({...build()}, false);
          notify("✅ Đã tạo đơn hàng");
        },
        disabled: subtotal === 0,
        className: blueBtn + " disabled:cursor-not-allowed disabled:bg-slate-300"
      }, /*#__PURE__*/React.createElement(Plus, {className: "h-4 w-4"}), " Tạo đơn hàng")
    : null) : /*#__PURE__*/React.createElement("button", {
    onClick: () => { onSave(build(), false); notify("✅ Đã lưu đơn hàng"); setTimeout(onBack, 800); },
    disabled: subtotal === 0,
    className: blueBtn + " disabled:cursor-not-allowed disabled:bg-slate-300"
  }, /*#__PURE__*/React.createElement(Plus, {
    className: "h-4 w-4"
  }), " Lưu đơn hàng"), /*#__PURE__*/React.createElement("button", {
    onClick: () => window.print(),
    className: ghostBtn
  }, /*#__PURE__*/React.createElement(Printer, {
    className: "h-4 w-4"
  }), " In"), /*#__PURE__*/React.createElement("button", {
    onClick: onBack,
    className: ghostBtn
  }, /*#__PURE__*/React.createElement(ArrowLeft, {
    className: "h-4 w-4"
  }), " Quay lại"))), /*#__PURE__*/React.createElement("div", {
    className: "grid grid-cols-1 gap-5"
  }, /*#__PURE__*/React.createElement("div", {
    className: "space-y-5"
  }, /*#__PURE__*/React.createElement(Card, {
    title: "Thông tin khách hàng"
  }, /*#__PURE__*/React.createElement("div", {
    className: "grid grid-cols-1 gap-3 sm:grid-cols-2"
  }, /*#__PURE__*/React.createElement("input", {
    className: inputF,
    placeholder: "Số điện thoại *",
    value: cust.phone,
    onChange: e => setCust({
      ...cust,
      phone: e.target.value
    })
  }), /*#__PURE__*/React.createElement("input", {
    className: inputF,
    placeholder: "Tên khách hàng *",
    value: cust.name,
    onChange: e => setCust({
      ...cust,
      name: e.target.value
    })
  }), /*#__PURE__*/React.createElement("input", {
    className: `${inputF} sm:col-span-2`,
    placeholder: "Địa chỉ giao hàng *",
    value: cust.addr,
    onChange: e => setCust({
      ...cust,
      addr: e.target.value
    })
  })), /*#__PURE__*/React.createElement("div", {
    className: "mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: "mb-1.5 block text-xs font-medium text-slate-500"
  }, "Hệ thống bán (kho)"), /*#__PURE__*/React.createElement("div", {
    className: "flex gap-2"
  }, ["Kho HH", "Kho TB"].map(s => /*#__PURE__*/React.createElement("button", {
    key: s,
    onClick: () => setStore(s),
    className: `rounded-lg px-3 py-1.5 text-sm ring-1 ring-inset transition ${store === s ? "bg-blue-600 text-white ring-blue-600" : "bg-white text-slate-600 ring-slate-200 hover:bg-slate-50"}`
  }, s)))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: "mb-1.5 block text-xs font-medium text-slate-500"
  }, "Nguồn đơn (kênh)"), /*#__PURE__*/React.createElement("div", {
    className: "flex flex-wrap gap-2"
  }, Object.keys(CHANNELS).map(c => /*#__PURE__*/React.createElement("button", {
    key: c,
    onClick: () => setChannel(c),
    className: `rounded-full px-2.5 py-1 text-xs ring-1 ring-inset transition ${channel === c ? CHANNELS[c] + " font-semibold" : "bg-white text-slate-500 ring-slate-200 hover:bg-slate-50"}`
  }, c))))), isEdit && editOrder && !editOrder.draft && /*#__PURE__*/React.createElement("div", {
    className: "mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: "mb-1.5 block text-xs font-medium text-slate-500"
  }, "Trạng thái đơn hàng"), /*#__PURE__*/React.createElement("select", {
    className: inputF,
    value: orderStatus,
    onChange: e => setOrderStatus(e.target.value)
  }, Object.keys(ORDER_STATUS).map(s => /*#__PURE__*/React.createElement("option", {
    key: s
  }, s))))), /*#__PURE__*/React.createElement(Card, {
    title: "Danh sách sản phẩm",
    right: isEdit && editOrder && !editOrder.draft ? /*#__PURE__*/React.createElement("div", {
      className: "flex items-center gap-2"
    }, /*#__PURE__*/React.createElement("span", {
      className: "text-xs font-medium text-slate-500"
    }, "Giao hàng:"), /*#__PURE__*/React.createElement("button", {
      onClick: () => {
        if (delivery !== "Đã giao hàng") {
          setDelivery("Đã giao hàng");
          setOrderStatus("Đang xử lý");
        } else {
          setDelivery("Chưa giao hàng");
        }
      },
      className: `rounded-lg px-3 py-1.5 text-sm font-medium ring-1 ring-inset transition ${delivery === "Đã giao hàng" ? "bg-emerald-600 text-white ring-emerald-600" : "bg-amber-50 text-amber-700 ring-amber-300 hover:bg-amber-100"}`
    }, delivery === "Đã giao hàng" ? "✓ Đã giao hàng" : "⏳ Chưa giao hàng")) : null
  }, /*#__PURE__*/React.createElement("div", {
    className: "rounded-lg border border-slate-200"
  }, /*#__PURE__*/React.createElement("table", {
    className: "w-full text-sm border-collapse"
  }, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", {
    className: "bg-slate-50 text-left text-xs font-medium uppercase tracking-wide text-slate-500"
  }, /*#__PURE__*/React.createElement("th", {
    className: "px-3 py-2.5 border border-slate-200 bg-slate-50",
    style: {
      minWidth: 260
    }
  }, "Tên sản phẩm"), /*#__PURE__*/React.createElement("th", {
    className: "px-3 py-2.5 text-center border border-slate-200 bg-slate-50",
    style: {
      width: 90
    }
  }, "SL"), /*#__PURE__*/React.createElement("th", {
    className: "px-3 py-2.5 text-right border border-slate-200 bg-slate-50",
    style: {
      width: 130
    }
  }, "Giá niêm yết"), /*#__PURE__*/React.createElement("th", {
    className: "px-3 py-2.5 text-right border border-slate-200 bg-slate-50",
    style: {
      width: 160
    }
  }, "Chiết khấu"), /*#__PURE__*/React.createElement("th", {
    className: "px-3 py-2.5 text-right border border-slate-200 bg-slate-50",
    style: {
      width: 130
    }
  }, "Giá bán"), /*#__PURE__*/React.createElement("th", {
    className: "px-3 py-2.5 text-right border border-slate-200 bg-slate-50",
    style: {
      width: 130
    }
  }, "Thành tiền"), /*#__PURE__*/React.createElement("th", {
    className: "px-3 py-2.5 border border-slate-200 bg-slate-50",
    style: {
      width: 60
    }
  }))), /*#__PURE__*/React.createElement("tbody", {
    className: ""
  }, lines.map((l, i) => /*#__PURE__*/React.createElement("tr", {
    key: i,
    className: "align-middle",
    style: {backgroundColor: i % 2 === 0 ? "#ffffff" : "#f8fafc"}
  }, /*#__PURE__*/React.createElement("td", {
    className: "px-3 py-2 border border-slate-200"
  }, /*#__PURE__*/React.createElement(ProductPicker, {
    value: l.name,
    products: prods,
    onRequestNewProduct: name => setNewProdReq({
      name,
      lineIdx: i
    }),
    onPick: p => setLine(i, p.sku || p.sale !== undefined ? {
      name: p.name,
      price: p.sale ?? l.price,
      cost: p.cost ?? l.cost,
      list: p.list ?? l.list
    } : {
      name: p.name
    })
  }), null), /*#__PURE__*/React.createElement("td", {
    className: "px-3 py-2 border border-slate-200"
  }, /*#__PURE__*/React.createElement("input", {
    type: "number",
    className: `${sm} text-center`,
    value: l.qty,
    onChange: e => setLine(i, {
      qty: +e.target.value
    })
  })), /*#__PURE__*/React.createElement("td", {
    className: "px-3 py-2 border border-slate-200"
  }, /*#__PURE__*/React.createElement(NumInput, {
    className: sm,
    value: l.list || 0,
    onChange: v => setLine(i, {
      list: v
    })
  })), /*#__PURE__*/React.createElement("td", {
    className: "px-3 py-2 border border-slate-200"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-stretch overflow-hidden rounded-md border border-slate-200 focus-within:border-blue-400"
  }, /*#__PURE__*/React.createElement(NumInput, {
    className: "w-full border-0 px-2 py-1.5 focus:outline-none",
    value: l.disc,
    onChange: v => setLine(i, {
      disc: v
    })
  }), /*#__PURE__*/React.createElement("select", {
    className: "border-l border-slate-200 bg-slate-50 px-1.5 text-xs text-slate-600 focus:outline-none",
    value: l.discType,
    onChange: e => setLine(i, {
      discType: e.target.value
    })
  }, /*#__PURE__*/React.createElement("option", {
    value: "đ"
  }, "đ"), /*#__PURE__*/React.createElement("option", {
    value: "%"
  }, "%")))), /*#__PURE__*/React.createElement("td", {
    className: "px-3 py-2 border border-slate-200"
  }, /*#__PURE__*/React.createElement(NumInput, {
    className: sm,
    value: l.price,
    onChange: v => setLine(i, {
      price: v
    })
  })), /*#__PURE__*/React.createElement("td", {
    className: "px-3 py-2 border border-slate-200 text-right align-middle"
  }, /*#__PURE__*/React.createElement("div", {
    className: "rounded-lg border border-emerald-300 bg-white px-2 py-1 text-right text-sm font-semibold tabular-nums text-emerald-700"
  }, num(lineTotal(l)))), /*#__PURE__*/React.createElement("td", {
    className: "px-3 py-2 border border-slate-200"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-end gap-1"
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => setLines(ls => ls.filter((_, x) => x !== i)),
    title: "Xoá dòng",
    className: "rounded-md bg-rose-500 p-1.5 text-white hover:bg-rose-600"
  }, /*#__PURE__*/React.createElement(X, {
    className: "h-4 w-4"
  })))))), /*#__PURE__*/React.createElement("div", {
    className: "mt-3 flex items-center gap-2"
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => setLines(ls => [...ls, {
      name: "",
      price: 0,
      qty: 1,
      disc: 0,
      discType: "đ",
      cost: 0,
      list: 0
    }]),
    className: "inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-white px-3 py-1.5 text-sm font-medium text-blue-600 hover:bg-blue-50"
  }, /*#__PURE__*/React.createElement(Plus, {
    className: "h-4 w-4"
  }), " Thêm dòng sản phẩm"), null, newProdReq !== null && /*#__PURE__*/React.createElement(ProductForm, {
    presetName: newProdReq.name,
    onClose: () => setNewProdReq(null),
    onSave: f => {
      onAddProduct(f);
      const idx = newProdReq.lineIdx;
      if (idx < lines.length) {
        setLine(idx, {
          name: f.name,
          price: f.sale || 0,
          cost: f.cost || 0,
          list: f.list || 0
        });
      } else {
        setLines(ls => [...ls, {
          name: f.name,
          price: f.sale || 0,
          qty: 1,
          disc: 0,
          discType: "đ",
          cost: f.cost || 0,
          list: f.list || 0
        }]);
      }
      setNewProdReq(null);
    }
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: ""
  }, /*#__PURE__*/React.createElement(Card, {
    title: "Thông tin thanh toán"
  }, /*#__PURE__*/React.createElement("dl", {
    className: "space-y-3 text-sm"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex justify-between"
  }, /*#__PURE__*/React.createElement("dt", {
    className: "text-slate-500"
  }, "Tổng tiền hàng"), /*#__PURE__*/React.createElement("dd", {
    className: "font-medium tabular-nums text-slate-800 text-right"
  }, num(subtotal))), /*#__PURE__*/React.createElement("div", {
    className: "flex items-center"
  }, /*#__PURE__*/React.createElement("dt", {
    className: "text-slate-500 shrink-0 w-24"
  }, "Chi phí"), /*#__PURE__*/React.createElement("select", {
    className: "w-32 pr-2 py-1 text-xs text-slate-600 bg-transparent",
    value: expenseType,
    onChange: e => setExpenseType(e.target.value)
  },
    /*#__PURE__*/React.createElement("option", {value: ""}, "KH trả"),
    /*#__PURE__*/React.createElement("option", {value: "Giao hàng >15km"}, "Giao hàng >15km"),
    /*#__PURE__*/React.createElement("option", {value: "Lắp đặt"}, "Lắp đặt"),
    /*#__PURE__*/React.createElement("option", {value: "Đổi trả"}, "Đổi trả"),
    /*#__PURE__*/React.createElement("option", {value: "Khác"}, "Khác")
  ), /*#__PURE__*/React.createElement(NumInput, {
    className: "w-28 rounded-lg border border-slate-200 px-2 py-1 shrink-0 ml-auto",
    value: expense,
    onChange: setExpense
  })), /*#__PURE__*/React.createElement("div", {
    className: "flex justify-between border-t border-slate-100 pt-3"
  }, /*#__PURE__*/React.createElement("dt", {
    className: "font-semibold text-slate-700"
  }, "Tổng cộng"), /*#__PURE__*/React.createElement("dd", {
    className: "font-semibold tabular-nums text-slate-900"
  }, num(total))), /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-between"
  }, /*#__PURE__*/React.createElement("dt", {
    className: "text-slate-500"
  }, "Đã thanh toán / Đặt cọc"), /*#__PURE__*/React.createElement("div", {
    className: "w-32 rounded-lg border border-slate-200 px-2 py-1 text-right text-sm tabular-nums font-medium bg-slate-50 text-slate-700 cursor-not-allowed select-none",
    title: "Nhập qua nút \"+ Thêm thanh toán\""
  }, num(paid))), /*#__PURE__*/React.createElement("div", {
    className: "flex justify-between border-t border-slate-100 pt-3"
  }, /*#__PURE__*/React.createElement("dt", {
    className: "font-medium text-slate-700"
  }, "Còn lại"), /*#__PURE__*/React.createElement("dd", {
    className: `font-semibold tabular-nums ${remaining > 0 ? "text-rose-600" : "text-emerald-600"}`
  }, num(remaining))),
  /*#__PURE__*/React.createElement("div", {
    className: "flex items-center mt-2"
  }, /*#__PURE__*/React.createElement("dt", {
    className: "text-slate-500 shrink-0 w-24"
  }, "Chi phí"), /*#__PURE__*/React.createElement("select", {
    className: "w-32 pr-2 py-1 text-xs text-slate-600 bg-transparent",
    value: companyExpenseType,
    onChange: e => setCompanyExpenseType(e.target.value)
  },
    /*#__PURE__*/React.createElement("option", {value: ""}, "CTY trả"),
    /*#__PURE__*/React.createElement("option", {value: "Giao hàng"}, "Giao hàng"),
    /*#__PURE__*/React.createElement("option", {value: "Lắp đặt"}, "Lắp đặt"),
    /*#__PURE__*/React.createElement("option", {value: "Khác"}, "Khác")
  ), /*#__PURE__*/React.createElement(NumInput, {
    className: "w-28 rounded-lg border border-slate-200 px-2 py-1 shrink-0 ml-auto",
    value: companyExpense,
    onChange: setCompanyExpense
  })))),
  /*#__PURE__*/React.createElement("div", {
    className: "mt-4 border-t border-slate-100 pt-3"
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => setPayModal(true),
    className: "inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 py-2 text-sm font-medium text-blue-700 hover:bg-blue-100"
  }, /*#__PURE__*/React.createElement(Plus, {
    className: "h-4 w-4"
  }), " Thêm thanh toán"), payments.length > 0 && /*#__PURE__*/React.createElement("ul", {
    className: "mt-2 space-y-1"
  }, payments.map((p, idx) => /*#__PURE__*/React.createElement("li", {
    key: idx,
    className: "flex items-center justify-between rounded-md bg-slate-50 px-2 py-1 text-xs gap-2"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-slate-600 flex-1"
  }, p.date ? p.date + " · " : "", p.kind, " · ", p.account),
  /*#__PURE__*/React.createElement("span", {
    className: "tabular-nums font-medium text-slate-800 shrink-0"
  }, num(p.amount)),
  /*#__PURE__*/React.createElement("button", {
    onClick: () => { setEditPayIdx(idx); setEditPayModal(true); },
    className: "ml-1 shrink-0 rounded p-0.5 text-slate-400 hover:bg-slate-200 hover:text-slate-700",
    title: "Sửa khoản thanh toán"
  }, "✏️")))), /*#__PURE__*/React.createElement("p", {
    className: "mt-2 text-[11px] text-slate-400"
  }, "Mỗi khoản thu tự sinh 1 phiếu thu và liên kết sang phần Tài chính.")), /*#__PURE__*/React.createElement("div", {
    className: "mt-4 border-t border-slate-100 pt-3"
  }, /*#__PURE__*/React.createElement("p", {
    className: "mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400"
  }, "Chứng từ đơn hàng"), /*#__PURE__*/React.createElement("div", {
    className: "flex flex-wrap gap-1.5"
  }, ["Nhận tiền", "Hình ảnh giao hàng", "Chi phí", "Xác nhận đặt hàng", "Trả hàng"].map(t => /*#__PURE__*/React.createElement("span", {
    key: t,
    className: "rounded-md bg-slate-100 px-2 py-0.5 text-[11px] text-slate-500"
  }, t))), /*#__PURE__*/React.createElement("p", {
    className: "mb-1 mt-3 text-xs font-semibold uppercase tracking-wide text-slate-400"
  }, "Nhật ký đơn hàng"), /*#__PURE__*/React.createElement("div", {
    className: "space-y-1 text-[11px] text-slate-500"
  }, /*#__PURE__*/React.createElement("div", null, dt, " · PAT · Tạo ", isDraft ? "báo giá" : "đơn hàng"), payments.map((p, idx) => /*#__PURE__*/React.createElement("div", {
    key: idx
  }, dt, " · PAT · ", p.kind, " ", num(p.amount))))), editPayModal && editPayIdx !== null && /*#__PURE__*/React.createElement(PaymentModal, {
    accounts: ACCOUNTS,
    initial: payments[editPayIdx],
    onClose: () => { setEditPayModal(false); setEditPayIdx(null); },
    onConfirm: p => {
      const oldP = payments[editPayIdx];
      const oldDelta = oldP.kind === "Hoàn tiền" ? -oldP.amount : oldP.kind === "Giảm giá thêm" ? 0 : oldP.amount;
      const newDelta = p.kind === "Hoàn tiền" ? -p.amount : p.kind === "Giảm giá thêm" ? 0 : p.amount;
      setPayments(xs => xs.map((x, i) => i === editPayIdx ? {...p, date: oldP.date} : x));
      setPaid(v => Math.max(0, v - oldDelta + newDelta));
      setEditPayModal(false); setEditPayIdx(null);
    }
  }),
  editPayModal && editPayIdx !== null && /*#__PURE__*/React.createElement(PaymentModal, {
    accounts: ACCOUNTS,
    initial: payments[editPayIdx],
    onClose: () => { setEditPayModal(false); setEditPayIdx(null); },
    onConfirm: p => {
      const oldP = payments[editPayIdx];
      const oldDelta = oldP.kind === "Hoàn tiền" ? -oldP.amount : oldP.kind === "Giảm giá thêm" ? 0 : oldP.amount;
      const newDelta = p.kind === "Hoàn tiền" ? -p.amount : p.kind === "Giảm giá thêm" ? 0 : p.amount;
      setPayments(xs => xs.map((x, i) => i === editPayIdx ? {...p, date: oldP.date} : x));
      setPaid(v => Math.max(0, v - oldDelta + newDelta));
      setEditPayModal(false); setEditPayIdx(null);
    }
  }),
  payModal && /*#__PURE__*/React.createElement(PaymentModal, {
    accounts: ACCOUNTS,
    onClose: () => setPayModal(false),
    onConfirm: p => {
      setPayments(xs => [...xs, p]);
      const delta = p.kind === "Hoàn tiền" ? -p.amount : p.kind === "Giảm giá thêm" ? 0 : p.amount;
      setPaid(v => Math.max(0, v + delta));
      setPayModal(false);
    }
  })))))))))));
}

/* ───────── Returns ───────── */
function Returns() {
  const total = RETURNS.filter(r => r.status === "Đã duyệt").reduce((s, r) => s + r.amount, 0);
  return /*#__PURE__*/React.createElement("div", {
    className: "space-y-4"
  }, /*#__PURE__*/React.createElement("div", {
    className: "grid grid-cols-2 gap-4 sm:max-w-md"
  }, /*#__PURE__*/React.createElement(StatCard, {
    label: "Tổng lần trả",
    value: RETURNS.length,
    sub: "đã ghi nhận",
    icon: RotateCcw
  }), /*#__PURE__*/React.createElement(StatCard, {
    label: "Tổng tiền hoàn",
    value: vndShort(total),
    sub: "đơn đã duyệt",
    tone: "warn"
  })), /*#__PURE__*/React.createElement(TableShell, {
    head: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(Th, null, "Mã đơn gốc"), /*#__PURE__*/React.createElement(Th, null, "Khách"), /*#__PURE__*/React.createElement(Th, null, "Sản phẩm"), /*#__PURE__*/React.createElement(Th, {
      right: true
    }, "SL"), /*#__PURE__*/React.createElement(Th, {
      right: true
    }, "Thành tiền"), /*#__PURE__*/React.createElement(Th, null, "Kho về"), /*#__PURE__*/React.createElement(Th, null, "Ngày"), /*#__PURE__*/React.createElement(Th, null, "Người xử lý"), /*#__PURE__*/React.createElement(Th, null, "Trạng thái"))
  }, RETURNS.map((r, i) => /*#__PURE__*/React.createElement("tr", {
    key: i,
    className: "hover:bg-slate-50/60"
  }, /*#__PURE__*/React.createElement("td", {
    className: "px-4 py-3 font-medium text-blue-700"
  }, r.order), /*#__PURE__*/React.createElement("td", {
    className: "px-4 py-3 text-slate-800"
  }, r.cust), /*#__PURE__*/React.createElement("td", {
    className: "px-4 py-3 text-slate-600"
  }, r.prod), /*#__PURE__*/React.createElement("td", {
    className: "px-4 py-3 text-right tabular-nums text-slate-600"
  }, r.qty), /*#__PURE__*/React.createElement("td", {
    className: "px-4 py-3 text-right font-medium tabular-nums text-slate-800"
  }, vnd(r.amount)), /*#__PURE__*/React.createElement("td", {
    className: "px-4 py-3 text-slate-500"
  }, r.store), /*#__PURE__*/React.createElement("td", {
    className: "px-4 py-3 text-slate-500"
  }, r.date), /*#__PURE__*/React.createElement("td", {
    className: "px-4 py-3 text-slate-500"
  }, r.staff), /*#__PURE__*/React.createElement("td", {
    className: "px-4 py-3"
  }, /*#__PURE__*/React.createElement(Pill, {
    map: APPROVE,
    value: r.status
  }))))));
}

/* ───────── Purchase create — bố cục theo Ảnh 1 (B1) ───────── */
function PurchaseCreate({
  onBack
}) {
  const notify = useToast();
  const [supText, setSupText] = useState("");
  const [supId, setSupId] = useState("");
  const [note, setNote] = useState("");
  const [rows, setRows] = useState([{
    name: "",
    qty: 1,
    price: 0,
    disc: 0,
    discType: "%",
    cost: 0
  }]);
  const set = (i, p) => setRows(xs => xs.map((x, k) => k === i ? {
    ...x,
    ...p
  } : x));
  const sm = "w-full rounded-md border border-slate-200 px-2 py-1.5 text-sm focus:border-blue-400 focus:outline-none";
  const lineDisc = l => l.discType === "%" ? l.price * l.qty * (l.disc || 0) / 100 : l.disc || 0;
  const subtotal = rows.reduce((s, l) => s + Math.max(0, l.price * l.qty - lineDisc(l)), 0);
  const filteredSup = SUPPLIERS.filter(s => s.code && (!supText || s.name.toLowerCase().includes(supText.toLowerCase())));
  return /*#__PURE__*/React.createElement("div", {
    className: "space-y-5"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-between"
  }, /*#__PURE__*/React.createElement("h2", {
    className: "flex items-center gap-2 text-xl font-bold text-slate-800"
  }, /*#__PURE__*/React.createElement(FileText, {
    className: "h-6 w-6 text-slate-400"
  }), " Tạo phiếu mua hàng"), /*#__PURE__*/React.createElement("button", {
    onClick: onBack,
    className: ghostBtn
  }, /*#__PURE__*/React.createElement(ArrowLeft, {
    className: "h-4 w-4"
  }), " Quay lại")), /*#__PURE__*/React.createElement("div", {
    className: "grid grid-cols-1 gap-5 lg:grid-cols-3"
  }, /*#__PURE__*/React.createElement("div", {
    className: "space-y-5"
  }, /*#__PURE__*/React.createElement(Card, {
    title: "Thông tin phiếu mua hàng"
  }, /*#__PURE__*/React.createElement("div", {
    className: "space-y-4"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: "mb-1 block text-sm font-medium text-slate-600"
  }, "Nhà cung cấp ", /*#__PURE__*/React.createElement("span", {
    className: "text-rose-500"
  }, "*")), /*#__PURE__*/React.createElement("input", {
    className: inputF,
    placeholder: "Tìm kiếm hoặc nhập tên nhà cung cấp mới...",
    value: supText,
    onChange: e => {
      setSupText(e.target.value);
      setSupId("");
    },
    list: "sup-list"
  }), /*#__PURE__*/React.createElement("datalist", {
    id: "sup-list"
  }, SUPPLIERS.filter(s => s.code).map(s => /*#__PURE__*/React.createElement("option", {
    key: s.code,
    value: s.name
  }))), supText && filteredSup.length > 0 && !filteredSup.some(s => s.name === supText) && /*#__PURE__*/React.createElement("div", {
    className: "mt-1 max-h-32 overflow-auto rounded-md border border-slate-200 text-sm"
  }, filteredSup.map(s => /*#__PURE__*/React.createElement("button", {
    key: s.code,
    onClick: () => {
      setSupText(s.name);
      setSupId(s.code);
    },
    className: "block w-full px-3 py-1.5 text-left hover:bg-slate-50"
  }, s.name)))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: "mb-1 block text-sm font-medium text-slate-600"
  }, "Ngày đặt hàng ", /*#__PURE__*/React.createElement("span", {
    className: "text-rose-500"
  }, "*")), /*#__PURE__*/React.createElement("input", {
    type: "date",
    className: inputF,
    defaultValue: "2026-06-16"
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: "mb-1 block text-sm font-medium text-slate-600"
  }, "Ghi chú"), /*#__PURE__*/React.createElement("textarea", {
    rows: 4,
    className: inputF + " resize-none",
    placeholder: "Ghi chú thêm về đơn hàng...",
    value: note,
    onChange: e => setNote(e.target.value)
  })))), /*#__PURE__*/React.createElement(Card, {
    title: "Tổng phiếu mua hàng"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-between"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-sm text-slate-500"
  }, "Tổng tiền thanh toán"), /*#__PURE__*/React.createElement("span", {
    className: "text-xl font-bold tabular-nums text-slate-900"
  }, num(subtotal))))), /*#__PURE__*/React.createElement("div", {
    className: "lg:col-span-2"
  }, /*#__PURE__*/React.createElement(Card, {
    title: "Danh sách sản phẩm"
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => setRows(xs => [...xs, {
      name: "",
      qty: 1,
      price: 0,
      disc: 0,
      discType: "%",
      cost: 0
    }]),
    className: blueBtn + " mb-4"
  }, /*#__PURE__*/React.createElement(Plus, {
    className: "h-4 w-4"
  }), " Thêm sản phẩm"), /*#__PURE__*/React.createElement("div", {
    className: "overflow-x-auto rounded-lg border border-slate-200"
  }, /*#__PURE__*/React.createElement("table", {
    className: "w-full text-sm",
    style: {
      minWidth: 820
    }
  }, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", {
    className: "border-b border-slate-100 bg-slate-50 text-left text-xs font-medium uppercase tracking-wide text-slate-500"
  }, /*#__PURE__*/React.createElement("th", {
    className: "px-3 py-2.5",
    style: {
      width: 40
    }
  }, "#"), /*#__PURE__*/React.createElement("th", {
    className: "px-3 py-2.5",
    style: {
      minWidth: 240
    }
  }, "Sản phẩm"), /*#__PURE__*/React.createElement("th", {
    className: "px-3 py-2.5 text-center",
    style: {
      width: 70
    }
  }, "SL"), /*#__PURE__*/React.createElement("th", {
    className: "px-3 py-2.5 text-right",
    style: {
      width: 130
    }
  }, "Giá sản phẩm ", /*#__PURE__*/React.createElement("span", {
    className: "text-rose-500"
  }, "(*)")), /*#__PURE__*/React.createElement("th", {
    className: "px-3 py-2.5 text-right",
    style: {
      width: 130
    }
  }, "Giảm giá"), /*#__PURE__*/React.createElement("th", {
    className: "px-3 py-2.5 text-right",
    style: {
      width: 130
    }
  }, "Giá nhập"), /*#__PURE__*/React.createElement("th", {
    className: "px-3 py-2.5 text-center",
    style: {
      width: 60
    }
  }, "Xóa"))), /*#__PURE__*/React.createElement("tbody", {
    className: "divide-y divide-slate-50"
  }, rows.map((l, i) => /*#__PURE__*/React.createElement("tr", {
    key: i,
    className: "align-top"
  }, /*#__PURE__*/React.createElement("td", {
    className: "px-3 py-3 text-slate-400"
  }, i + 1), /*#__PURE__*/React.createElement("td", {
    className: "px-3 py-3"
  }, /*#__PURE__*/React.createElement("input", {
    list: "pl-pur",
    className: sm,
    placeholder: "Tìm kiếm sản phẩm...",
    value: l.name,
    onChange: e => {
      const p = PRODUCTS.find(x => x.name === e.target.value);
      set(i, p ? {
        name: p.name,
        price: p.cost,
        cost: p.cost
      } : {
        name: e.target.value
      });
    }
  })), /*#__PURE__*/React.createElement("td", {
    className: "px-3 py-3"
  }, /*#__PURE__*/React.createElement("input", {
    type: "number",
    className: `${sm} text-center`,
    value: l.qty,
    onChange: e => set(i, {
      qty: +e.target.value
    })
  })), /*#__PURE__*/React.createElement("td", {
    className: "px-3 py-3"
  }, /*#__PURE__*/React.createElement(NumInput, {
    className: sm,
    value: l.price,
    onChange: v => set(i, {
      price: v
    })
  })), /*#__PURE__*/React.createElement("td", {
    className: "px-3 py-3"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-stretch overflow-hidden rounded-md border border-slate-200 focus-within:border-blue-400"
  }, /*#__PURE__*/React.createElement(NumInput, {
    className: "w-full border-0 px-2 py-1.5 focus:outline-none",
    value: l.disc,
    onChange: v => set(i, {
      disc: v
    })
  }), /*#__PURE__*/React.createElement("select", {
    className: "border-l border-slate-200 bg-slate-50 px-1.5 text-xs text-slate-600 focus:outline-none",
    value: l.discType,
    onChange: e => set(i, {
      discType: e.target.value
    })
  }, /*#__PURE__*/React.createElement("option", {
    value: "%"
  }, "%"), /*#__PURE__*/React.createElement("option", {
    value: "đ"
  }, "đ")))), /*#__PURE__*/React.createElement("td", {
    className: "px-3 py-3 text-right text-sm font-medium tabular-nums text-slate-800"
  }, num(Math.max(0, l.price * l.qty - lineDisc(l)))), /*#__PURE__*/React.createElement("td", {
    className: "px-3 py-3 text-center"
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => setRows(xs => xs.filter((_, k) => k !== i)),
    className: "rounded-md bg-rose-500 p-1.5 text-white hover:bg-rose-600"
  }, /*#__PURE__*/React.createElement(Trash2, {
    className: "h-4 w-4"
  }))))))), /*#__PURE__*/React.createElement("datalist", {
    id: "pl-pur"
  }, PRODUCTS.map(p => /*#__PURE__*/React.createElement("option", {
    key: p.sku,
    value: p.name
  })))), /*#__PURE__*/React.createElement("div", {
    className: "mt-4 flex justify-end"
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => notify("Đã lưu phiếu mua hàng"),
    disabled: subtotal === 0,
    className: greenBtn + " disabled:cursor-not-allowed disabled:bg-slate-300"
  }, /*#__PURE__*/React.createElement(Save, {
    className: "h-4 w-4"
  }), " Lưu phiếu mua hàng"))))));
}

/* ───────── Purchase list ───────── */
function PurchaseList({
  onNew,
  onEdit
}) {
  const notify = useToast();
  const [q, setQ] = useState("");
  const [doc, setDoc] = useState(null);
  const [fPay, setFPay] = useState("Tất cả");
  const [fSup, setFSup] = useState("Tất cả");
  const [list, setList] = useState(IMPORTS);
  const supNames = ["Tất cả", ...new Set(list.map(r => r.supplier))];
  const rows = list.filter(r => (fPay === "Tất cả" || r.pay === fPay) && (fSup === "Tất cả" || r.supplier === fSup) && (!q || `${purCode(r.lot)} ${r.supplier} ${r.prod} ${r.order}`.toLowerCase().includes(q.toLowerCase())));
  const del = lot => {
    if (window.confirm("Xoá phiếu mua hàng này?")) {
      setList(xs => xs.filter(r => r.lot !== lot));
      notify("Đã xoá phiếu mua hàng");
    }
  };
  const onExport = () => exportCSV("danh-sach-phieu-mua-hang", ["Ngày đặt", "Số phiếu", "Nhà cung cấp", "Sản phẩm", "Số lượng", "Đơn giá", "Thành tiền", "Đơn hàng", "Người tạo", "Thanh toán"], rows.map(r => [r.date, purCode(r.lot), r.supplier, r.prod, r.qtyIn, r.costNcc, r.costNcc * r.qtyIn, r.order, r.staff, r.pay]));
  return /*#__PURE__*/React.createElement("div", {
    className: "space-y-4"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex flex-wrap items-center justify-end gap-2"
  }, /*#__PURE__*/React.createElement(PrintBtn, null), /*#__PURE__*/React.createElement(ExportBtn, {
    onClick: onExport
  }), /*#__PURE__*/React.createElement("button", {
    onClick: onNew,
    className: blueBtn
  }, /*#__PURE__*/React.createElement(Plus, {
    className: "h-4 w-4"
  }), " Tạo phiếu mua hàng")), /*#__PURE__*/React.createElement("div", {
    className: "flex flex-wrap items-end gap-3 rounded-xl border border-slate-200 bg-white p-3"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: "mb-1 block text-xs font-medium text-slate-500"
  }, "Từ ngày"), /*#__PURE__*/React.createElement("input", {
    type: "date",
    defaultValue: "2026-06-01",
    className: field
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: "mb-1 block text-xs font-medium text-slate-500"
  }, "Đến ngày"), /*#__PURE__*/React.createElement("input", {
    type: "date",
    defaultValue: "2026-06-16",
    className: field
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: "mb-1 block text-xs font-medium text-slate-500"
  }, "NCC"), /*#__PURE__*/React.createElement("select", {
    value: fSup,
    onChange: e => setFSup(e.target.value),
    className: field
  }, supNames.map(s => /*#__PURE__*/React.createElement("option", {
    key: s
  }, s)))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: "mb-1 block text-xs font-medium text-slate-500"
  }, "Thanh toán"), /*#__PURE__*/React.createElement("select", {
    value: fPay,
    onChange: e => setFPay(e.target.value),
    className: field
  }, ["Tất cả", "Đã thanh toán", "Chưa thanh toán"].map(s => /*#__PURE__*/React.createElement("option", {
    key: s
  }, s)))), /*#__PURE__*/React.createElement("div", {
    className: "relative min-w-[220px] flex-1"
  }, /*#__PURE__*/React.createElement("label", {
    className: "mb-1 block text-xs font-medium text-slate-500"
  }, "Tìm kiếm"), /*#__PURE__*/React.createElement(Search, {
    className: "absolute left-2.5 top-[2.05rem] h-4 w-4 text-slate-400"
  }), /*#__PURE__*/React.createElement("input", {
    value: q,
    onChange: e => setQ(e.target.value),
    placeholder: "Số phiếu, NCC, sản phẩm…",
    className: `${field} w-full pl-8`
  }))), /*#__PURE__*/React.createElement("p", {
    className: "text-xs text-slate-400"
  }, rows.length, " phiếu · cuộn ngang để xem hết các cột →"), /*#__PURE__*/React.createElement(TableShell, {
    minW: "1300px",
    head: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(Th, null, "Ngày đặt"), /*#__PURE__*/React.createElement(Th, null, "Số phiếu"), /*#__PURE__*/React.createElement(Th, null, "Đơn hàng"), /*#__PURE__*/React.createElement(Th, {
      style: {
        minWidth: 150
      }
    }, "Nhà cung cấp"), /*#__PURE__*/React.createElement(Th, {
      style: {
        minWidth: 220
      }
    }, "Sản phẩm"), /*#__PURE__*/React.createElement(Th, {
      right: true
    }, "Số lượng"), /*#__PURE__*/React.createElement(Th, {
      right: true
    }, "Đơn giá"), /*#__PURE__*/React.createElement(Th, {
      right: true
    }, "Chi phí"), /*#__PURE__*/React.createElement(Th, {
      right: true
    }, "Thành tiền"), /*#__PURE__*/React.createElement(Th, null, "Người tạo"), /*#__PURE__*/React.createElement(Th, null, "Thanh toán"), /*#__PURE__*/React.createElement(Th, {
      center: true
    }, "Thao tác"))
  }, rows.map(r => /*#__PURE__*/React.createElement("tr", {
    key: r.lot,
    className: "hover:bg-slate-50/60"
  }, /*#__PURE__*/React.createElement("td", {
    className: "whitespace-nowrap px-3 py-3 text-slate-500"
  }, r.date), /*#__PURE__*/React.createElement("td", {
    className: "whitespace-nowrap px-3 py-3"
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => onEdit(r),
    className: "font-medium text-blue-700 underline-offset-2 hover:underline"
  }, purCode(r.lot))), /*#__PURE__*/React.createElement("td", {
    className: "px-3 py-3"
  }, /*#__PURE__*/React.createElement(DocLink, {
    code: r.order,
    onOpen: setDoc
  })), /*#__PURE__*/React.createElement("td", {
    className: "px-3 py-3 text-slate-700"
  }, r.supplier), /*#__PURE__*/React.createElement("td", {
    className: "px-3 py-3 text-slate-800"
  }, r.prod), /*#__PURE__*/React.createElement("td", {
    className: "px-3 py-3 text-right tabular-nums text-slate-600"
  }, r.qtyIn), /*#__PURE__*/React.createElement("td", {
    className: "px-3 py-3 text-right tabular-nums text-slate-600"
  }, vnd(r.costNcc)), /*#__PURE__*/React.createElement("td", {
    className: "px-3 py-3 text-right tabular-nums text-slate-500"
  }, "—"), /*#__PURE__*/React.createElement("td", {
    className: "px-3 py-3 text-right font-medium tabular-nums text-slate-800"
  }, vnd(r.costNcc * r.qtyIn)), /*#__PURE__*/React.createElement("td", {
    className: "whitespace-nowrap px-3 py-3 text-xs text-slate-500"
  }, r.staff), /*#__PURE__*/React.createElement("td", {
    className: "px-3 py-3"
  }, /*#__PURE__*/React.createElement(Pill, {
    map: PAY_NCC,
    value: r.pay
  })), /*#__PURE__*/React.createElement("td", {
    className: "px-3 py-3"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-center"
  }, /*#__PURE__*/React.createElement(IconBtn, {
    icon: Eye,
    title: "Xem chi tiết",
    onClick: () => setDoc({
      code: purCode(r.lot),
      fields: {
        "Nhà cung cấp": r.supplier,
        "Sản phẩm": r.prod,
        "Số lượng": r.qtyIn,
        "Đơn giá": vnd(r.costNcc),
        "Thành tiền": vnd(r.costNcc * r.qtyIn)
      }
    })
  }), /*#__PURE__*/React.createElement(IconBtn, {
    icon: Pencil,
    title: "Sửa",
    onClick: () => onEdit(r)
  }), /*#__PURE__*/React.createElement(IconBtn, {
    icon: Printer,
    title: "In",
    onClick: () => window.print()
  }), /*#__PURE__*/React.createElement(IconBtn, {
    icon: Trash2,
    title: "Xoá",
    onClick: () => del(r.lot)
  })))))), doc && /*#__PURE__*/React.createElement(DocModal, {
    doc: doc,
    onClose: () => setDoc(null)
  }));
}

/* ───────── Warehouse import (bỏ cột thanh toán) ───────── */
function WhIn() {
  const [q, setQ] = useState("");
  const [doc, setDoc] = useState(null);
  const rows = IMPORTS.filter(r => !q || `${impCode(r.lot)} ${r.prod} ${r.supplier}`.toLowerCase().includes(q.toLowerCase()));
  const onExport = () => exportCSV("danh-sach-phieu-nhap-kho", ["Kho", "Mã phiếu nhập", "Ngày nhập", "Sản phẩm", "SL nhập", "SL còn", "Giá vốn", "Nhà cung cấp", "Người tạo"], rows.map(r => [r.store, impCode(r.lot), r.date, r.prod, r.qtyIn, r.qtyNow, r.costNcc + (r.fee || 0), r.supplier, r.staff]));
  return /*#__PURE__*/React.createElement("div", {
    className: "space-y-4"
  }, /*#__PURE__*/React.createElement(RangeBar, {
    q: q,
    setQ: setQ,
    placeholder: "Tìm theo mã phiếu, sản phẩm, NCC…",
    onExport: onExport,
    extra: /*#__PURE__*/React.createElement("div", {
      className: "self-end"
    }, /*#__PURE__*/React.createElement("button", {
      className: blueBtn + " py-2"
    }, /*#__PURE__*/React.createElement(Plus, {
      className: "h-4 w-4"
    }), " Tạo phiếu nhập"))
  }), /*#__PURE__*/React.createElement(TableShell, {
    minW: "1100px",
    head: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(Th, {
      style: {
        width: 80
      }
    }, "Kho"), /*#__PURE__*/React.createElement(Th, null, "Mã phiếu nhập"), /*#__PURE__*/React.createElement(Th, null, "Ngày nhập"), /*#__PURE__*/React.createElement(Th, {
      style: {
        minWidth: 220
      }
    }, "Sản phẩm"), /*#__PURE__*/React.createElement(Th, {
      right: true
    }, "SL nhập"), /*#__PURE__*/React.createElement(Th, {
      right: true
    }, "SL còn"), /*#__PURE__*/React.createElement(Th, {
      right: true
    }, "Giá vốn"), /*#__PURE__*/React.createElement(Th, null, "Nhà cung cấp"), /*#__PURE__*/React.createElement(Th, null, "Người tạo"))
  }, rows.map(r => /*#__PURE__*/React.createElement("tr", {
    key: r.lot,
    className: "hover:bg-slate-50/60"
  }, /*#__PURE__*/React.createElement("td", {
    className: "px-4 py-3 text-slate-500"
  }, r.store), /*#__PURE__*/React.createElement("td", {
    className: "px-4 py-3"
  }, /*#__PURE__*/React.createElement(DocLink, {
    code: impCode(r.lot),
    onOpen: setDoc
  })), /*#__PURE__*/React.createElement("td", {
    className: "whitespace-nowrap px-4 py-3 text-slate-500"
  }, r.date), /*#__PURE__*/React.createElement("td", {
    className: "px-4 py-3 text-slate-800"
  }, r.prod), /*#__PURE__*/React.createElement("td", {
    className: "px-4 py-3 text-right tabular-nums text-slate-600"
  }, r.qtyIn), /*#__PURE__*/React.createElement("td", {
    className: "px-4 py-3 text-right font-medium tabular-nums text-slate-800"
  }, r.qtyNow), /*#__PURE__*/React.createElement("td", {
    className: "px-4 py-3 text-right tabular-nums text-slate-600",
    title: "Giá vốn = Giá NCC + Chi phí"
  }, vnd(r.costNcc + (r.fee || 0))), /*#__PURE__*/React.createElement("td", {
    className: "px-4 py-3 text-slate-500"
  }, r.supplier), /*#__PURE__*/React.createElement("td", {
    className: "px-4 py-3 text-slate-500"
  }, r.staff)))), doc && /*#__PURE__*/React.createElement(DocModal, {
    doc: doc,
    onClose: () => setDoc(null)
  }));
}
function WhOut() {
  const [q, setQ] = useState("");
  const [doc, setDoc] = useState(null);
  const [fProd, setFProd] = useState("Tất cả");
  const [fSup, setFSup] = useState("Tất cả");
  const [fStore, setFStore] = useState("Tất cả");
  const prodList = ["Tất cả", ...new Set(EXPORTS.map(r => r.prod))];
  const supList = ["Tất cả", ...new Set(EXPORTS.map(r => r.supplier))];
  const rows = EXPORTS.filter(r => {
    if (fProd !== "Tất cả" && r.prod !== fProd) return false;
    if (fSup !== "Tất cả" && r.supplier !== fSup) return false;
    if (fStore !== "Tất cả" && r.store !== fStore) return false;
    if (q && !`${r.order} ${r.prod} ${r.cust} ${r.sku}`.toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  });
  const onExport = () => exportCSV("danh-sach-phieu-xuat-kho", ["Thời gian", "Đơn hàng", "Khách hàng", "Địa chỉ", "Mã SP", "Tên sản phẩm", "Nhà cung cấp", "Kho", "SL xuất", "Giá bán", "Thành tiền", "TT Đơn", "TT Giao", "Người xuất"], rows.map(r => [r.dt, r.order, r.cust, r.addr, r.sku, r.prod, r.supplier, r.store, r.qty, r.sale, r.sale * r.qty, r.orderStatus, r.delivery, r.staff]));
  return /*#__PURE__*/React.createElement("div", {
    className: "space-y-4"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex flex-wrap items-center justify-end gap-2"
  }, /*#__PURE__*/React.createElement(PrintBtn, null), /*#__PURE__*/React.createElement(ExportBtn, {
    onClick: onExport
  })), /*#__PURE__*/React.createElement("div", {
    className: "flex flex-wrap items-end gap-3 rounded-xl border border-slate-200 bg-white p-3"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: "mb-1 block text-xs font-medium text-slate-500"
  }, "Từ ngày"), /*#__PURE__*/React.createElement("input", {
    type: "date",
    defaultValue: "2026-06-01",
    className: field
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: "mb-1 block text-xs font-medium text-slate-500"
  }, "Đến ngày"), /*#__PURE__*/React.createElement("input", {
    type: "date",
    defaultValue: "2026-06-16",
    className: field
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: "mb-1 block text-xs font-medium text-slate-500"
  }, "Tên sản phẩm"), /*#__PURE__*/React.createElement("select", {
    value: fProd,
    onChange: e => setFProd(e.target.value),
    className: `${field} max-w-[180px]`
  }, prodList.map(s => /*#__PURE__*/React.createElement("option", {
    key: s
  }, s)))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: "mb-1 block text-xs font-medium text-slate-500"
  }, "Nhà cung cấp"), /*#__PURE__*/React.createElement("select", {
    value: fSup,
    onChange: e => setFSup(e.target.value),
    className: `${field} max-w-[170px]`
  }, supList.map(s => /*#__PURE__*/React.createElement("option", {
    key: s
  }, s)))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: "mb-1 block text-xs font-medium text-slate-500"
  }, "Kho"), /*#__PURE__*/React.createElement("select", {
    value: fStore,
    onChange: e => setFStore(e.target.value),
    className: field
  }, ["Tất cả", "Kho HH", "Kho TB"].map(s => /*#__PURE__*/React.createElement("option", {
    key: s
  }, s)))), /*#__PURE__*/React.createElement("div", {
    className: "relative min-w-[200px] flex-1"
  }, /*#__PURE__*/React.createElement("label", {
    className: "mb-1 block text-xs font-medium text-slate-500"
  }, "Tìm kiếm"), /*#__PURE__*/React.createElement(Search, {
    className: "absolute left-2.5 top-[2.05rem] h-4 w-4 text-slate-400"
  }), /*#__PURE__*/React.createElement("input", {
    value: q,
    onChange: e => setQ(e.target.value),
    placeholder: "Đơn hàng, sản phẩm, khách hàng…",
    className: `${field} w-full pl-8`
  }))), /*#__PURE__*/React.createElement("p", {
    className: "text-xs text-slate-400"
  }, rows.length, " phiếu · cuộn ngang để xem hết các cột →"), /*#__PURE__*/React.createElement(TableShell, {
    minW: "1400px",
    head: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(Th, {
      style: {
        width: 110
      }
    }, "Thời gian"), /*#__PURE__*/React.createElement(Th, {
      style: {
        width: 100
      }
    }, "Đơn hàng"), /*#__PURE__*/React.createElement(Th, {
      style: {
        width: 120
      }
    }, "Khách hàng"), /*#__PURE__*/React.createElement(Th, {
      style: {
        minWidth: 180
      }
    }, "Địa chỉ"), /*#__PURE__*/React.createElement(Th, {
      style: {
        width: 110
      }
    }, "Mã SP"), /*#__PURE__*/React.createElement(Th, {
      style: {
        minWidth: 220
      }
    }, "Tên sản phẩm"), /*#__PURE__*/React.createElement(Th, {
      right: true,
      style: {
        width: 70
      }
    }, "SL xuất"), /*#__PURE__*/React.createElement(Th, {
      right: true,
      style: {
        width: 110
      }
    }, "Giá bán"), /*#__PURE__*/React.createElement(Th, {
      right: true,
      style: {
        width: 120
      }
    }, "Thành tiền"), /*#__PURE__*/React.createElement(Th, {
      style: {
        width: 90
      }
    }, "Người xuất"), /*#__PURE__*/React.createElement(Th, {
      style: {
        width: 150
      }
    }, "Nhà cung cấp"), /*#__PURE__*/React.createElement(Th, {
      style: {
        width: 80
      }
    }, "Kho"))
  }, rows.map(r => /*#__PURE__*/React.createElement("tr", {
    key: r.slip,
    className: "align-top hover:bg-slate-50/60"
  }, /*#__PURE__*/React.createElement("td", {
    className: "px-3 py-3"
  }, /*#__PURE__*/React.createElement(DateTime, {
    value: r.dt
  })), /*#__PURE__*/React.createElement("td", {
    className: "px-3 py-3"
  }, /*#__PURE__*/React.createElement(DocLink, {
    code: r.order,
    onOpen: setDoc
  })), /*#__PURE__*/React.createElement("td", {
    className: "px-3 py-3 text-slate-700"
  }, r.cust), /*#__PURE__*/React.createElement("td", {
    className: "px-3 py-3 text-xs text-slate-500"
  }, r.addr), /*#__PURE__*/React.createElement("td", {
    className: "px-3 py-3 text-slate-600"
  }, r.sku), /*#__PURE__*/React.createElement("td", {
    className: "px-3 py-3 text-slate-800"
  }, r.prod), /*#__PURE__*/React.createElement("td", {
    className: "px-3 py-3 text-right tabular-nums text-slate-600"
  }, r.qty), /*#__PURE__*/React.createElement("td", {
    className: "px-3 py-3 text-right tabular-nums text-slate-700"
  }, vnd(r.sale)), /*#__PURE__*/React.createElement("td", {
    className: "px-3 py-3 text-right font-medium tabular-nums text-slate-900"
  }, vnd(r.sale * r.qty)), /*#__PURE__*/React.createElement("td", {
    className: "px-3 py-3 text-xs text-slate-500"
  }, r.staff), /*#__PURE__*/React.createElement("td", {
    className: "px-3 py-3 text-slate-600"
  }, r.supplier), /*#__PURE__*/React.createElement("td", {
    className: "px-3 py-3 text-slate-500"
  }, r.store)))), doc && /*#__PURE__*/React.createElement(DocModal, {
    doc: doc,
    onClose: () => setDoc(null)
  }));
}

/* ───────── Tồn kho — Báo cáo xuất nhập tồn ───────── */
const STOCK_REPORT = [{
  store: "Kho HH",
  sku: "CHÂN KÊ",
  name: "AMILI - Chân kê máy rửa bát",
  unit: "Bộ",
  price: 200000,
  o: 1,
  in: 0,
  out: 0
}, {
  store: "Kho HH",
  sku: "VF-1862",
  name: "AS - Bồn Cầu VF-1862",
  unit: "Bộ",
  price: 3650000,
  o: 10,
  in: 0,
  out: 0
}, {
  store: "Kho HH",
  sku: "VF-1863",
  name: "AS - Bồn Cầu VF-1863",
  unit: "Bộ",
  price: 3200000,
  o: 1,
  in: 0,
  out: 0
}, {
  store: "Kho HH",
  sku: "VF-0420",
  name: "AS - Chậu Rửa Đặt Bàn VF-0420",
  unit: "Cái",
  price: 1877000,
  o: 1,
  in: 0,
  out: 0
}, {
  store: "Kho HH",
  sku: "AC-989VN",
  name: "INAX - Bồn cầu AC-989VN",
  unit: "Bộ",
  price: 4760000,
  o: 6,
  in: 0,
  out: 2
}, {
  store: "Kho HH",
  sku: "WF-1M13",
  name: "AS - Sen cây nóng lạnh WF-1M13",
  unit: "Cái",
  price: 4480000,
  o: 3,
  in: 0,
  out: 0
}, {
  store: "Kho HH",
  sku: "Tari-7851SR",
  name: "KONOX - Chậu rửa Tari 7851SR",
  unit: "Bộ",
  price: 4900000,
  o: 6,
  in: 0,
  out: 1
}, {
  store: "Kho TB",
  sku: "PIE875DC1E",
  name: "BOSCH - Bếp từ PIE875DC1E",
  unit: "Cái",
  price: 19800000,
  o: 3,
  in: 3,
  out: 1
}, {
  store: "Kho TB",
  sku: "HBG7341B1",
  name: "BOSCH - Lò nướng HBG7341B1",
  unit: "Cái",
  price: 23500000,
  o: 1,
  in: 0,
  out: 0
}];
function StockDetailModal({
  row,
  onClose
}) {
  const moves = [...IMPORTS.filter(m => m.prod.includes(row.sku) || row.name.includes(m.prod.split(" - ")[0])).map(m => ({
    type: "Nhập",
    date: m.date,
    slip: m.lot,
    qty: m.qtyIn,
    store: m.store,
    ref: m.order
  })), ...EXPORTS.filter(m => m.sku === row.sku).map(m => ({
    type: "Xuất",
    date: m.dt.split(" ")[0],
    slip: m.slip,
    qty: m.qty,
    store: m.store,
    ref: m.order
  }))];
  const sample = moves.length ? moves : [{
    type: "Đầu kỳ",
    date: "01/06/2026",
    slip: "—",
    qty: row.o,
    store: row.store,
    ref: "—"
  }, ...(row.in ? [{
    type: "Nhập",
    date: "07/06/2026",
    slip: "PN…_" + row.sku,
    qty: row.in,
    store: row.store,
    ref: "ĐH…"
  }] : []), ...(row.out ? [{
    type: "Xuất",
    date: "12/06/2026",
    slip: "PX…_" + row.sku,
    qty: row.out,
    store: row.store,
    ref: "DH…"
  }] : [])];
  return /*#__PURE__*/React.createElement(Modal, {
    maxW: "max-w-3xl",
    title: `Chi tiết nhập – xuất: ${row.name}`,
    sub: `Mã: ${row.sku} · Kho: ${row.store} · Tồn cuối kỳ: ${row.o + row.in - row.out}`,
    onClose: onClose,
    footer: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(PrintBtn, null), /*#__PURE__*/React.createElement("button", {
      onClick: onClose,
      className: ghostBtn
    }, "Đóng"))
  }, /*#__PURE__*/React.createElement("div", {
    className: "overflow-x-auto rounded-lg border border-slate-200"
  }, /*#__PURE__*/React.createElement("table", {
    className: "w-full text-sm"
  }, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", {
    className: "border-b border-slate-100 bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500"
  }, /*#__PURE__*/React.createElement("th", {
    className: "px-3 py-2"
  }, "Loại"), /*#__PURE__*/React.createElement("th", {
    className: "px-3 py-2"
  }, "Ngày"), /*#__PURE__*/React.createElement("th", {
    className: "px-3 py-2"
  }, "Chứng từ"), /*#__PURE__*/React.createElement("th", {
    className: "px-3 py-2"
  }, "Kho"), /*#__PURE__*/React.createElement("th", {
    className: "px-3 py-2"
  }, "Liên quan"), /*#__PURE__*/React.createElement("th", {
    className: "px-3 py-2 text-right"
  }, "SL"))), /*#__PURE__*/React.createElement("tbody", {
    className: "divide-y divide-slate-50"
  }, sample.map((m, i) => /*#__PURE__*/React.createElement("tr", {
    key: i
  }, /*#__PURE__*/React.createElement("td", {
    className: "px-3 py-2.5"
  }, /*#__PURE__*/React.createElement("span", {
    className: `rounded px-1.5 py-0.5 text-xs font-medium ${m.type === "Xuất" ? "bg-rose-50 text-rose-600" : m.type === "Nhập" ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-500"}`
  }, m.type)), /*#__PURE__*/React.createElement("td", {
    className: "px-3 py-2.5 text-slate-500"
  }, m.date), /*#__PURE__*/React.createElement("td", {
    className: "px-3 py-2.5 font-mono text-xs text-blue-700"
  }, m.slip), /*#__PURE__*/React.createElement("td", {
    className: "px-3 py-2.5 text-slate-500"
  }, m.store), /*#__PURE__*/React.createElement("td", {
    className: "px-3 py-2.5 text-slate-500"
  }, m.ref), /*#__PURE__*/React.createElement("td", {
    className: `px-3 py-2.5 text-right font-medium tabular-nums ${m.type === "Xuất" ? "text-rose-600" : "text-slate-700"}`
  }, m.type === "Xuất" ? "-" : "+", m.qty)))))));
}
function Stock() {
  const [store, setStore] = useState("Tất cả kho");
  const [q, setQ] = useState("");
  const [detail, setDetail] = useState(null);
  const rows = STOCK_REPORT.filter(r => (store === "Tất cả kho" || r.store === store) && (!q || `${r.name} ${r.sku}`.toLowerCase().includes(q.toLowerCase())));
  const cell = "px-3 py-3 text-right tabular-nums";
  const onExport = () => exportCSV("bao-cao-xuat-nhap-ton-kho", ["Tên kho", "Mã SP", "Tên sản phẩm", "ĐVT", "Đơn giá", "Đầu kỳ SL", "Nhập SL", "Xuất SL", "Cuối kỳ SL"], rows.map(r => [r.store, r.sku, r.name, r.unit, r.price, r.o, r.in, r.out, r.o + r.in - r.out]));
  return /*#__PURE__*/React.createElement("div", {
    className: "space-y-4"
  }, /*#__PURE__*/React.createElement("h2", {
    className: "text-lg font-semibold text-slate-800"
  }, "Báo cáo xuất nhập tồn kho"), /*#__PURE__*/React.createElement("div", {
    className: "flex flex-wrap items-end gap-3"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: "mb-1 block text-xs font-medium text-slate-500"
  }, "Từ ngày"), /*#__PURE__*/React.createElement("input", {
    type: "date",
    defaultValue: "2026-06-01",
    className: field
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: "mb-1 block text-xs font-medium text-slate-500"
  }, "Đến ngày"), /*#__PURE__*/React.createElement("input", {
    type: "date",
    defaultValue: "2026-06-16",
    className: field
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: "mb-1 block text-xs font-medium text-slate-500"
  }, "Kho"), /*#__PURE__*/React.createElement("select", {
    value: store,
    onChange: e => setStore(e.target.value),
    className: field
  }, ["Tất cả kho", "Kho HH", "Kho TB"].map(s => /*#__PURE__*/React.createElement("option", {
    key: s
  }, s)))), /*#__PURE__*/React.createElement("div", {
    className: "min-w-[200px] flex-1"
  }, /*#__PURE__*/React.createElement("label", {
    className: "mb-1 block text-xs font-medium text-slate-500"
  }, "Tìm kiếm"), /*#__PURE__*/React.createElement("input", {
    value: q,
    onChange: e => setQ(e.target.value),
    placeholder: "Nhập mã hoặc tên sản phẩm…",
    className: `${field} w-full`
  })), /*#__PURE__*/React.createElement("button", {
    className: blueBtn + " py-2"
  }, /*#__PURE__*/React.createElement(Search, {
    className: "h-4 w-4"
  }), " Lọc"), /*#__PURE__*/React.createElement(PrintBtn, null), /*#__PURE__*/React.createElement(ExportBtn, {
    onClick: onExport
  })), /*#__PURE__*/React.createElement("div", {
    className: "overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm"
  }, /*#__PURE__*/React.createElement("table", {
    className: "w-full text-sm",
    style: {
      minWidth: 1100
    }
  }, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", {
    className: "bg-slate-800 text-xs font-medium text-slate-100"
  }, /*#__PURE__*/React.createElement("th", {
    rowSpan: 2,
    className: "px-3 py-2 text-left"
  }, "Tên kho"), /*#__PURE__*/React.createElement("th", {
    rowSpan: 2,
    className: "px-3 py-2 text-left"
  }, "Mã SP"), /*#__PURE__*/React.createElement("th", {
    rowSpan: 2,
    className: "px-3 py-2 text-left",
    style: {
      minWidth: 220
    }
  }, "Tên sản phẩm"), /*#__PURE__*/React.createElement("th", {
    rowSpan: 2,
    className: "px-3 py-2 text-left"
  }, "ĐVT"), /*#__PURE__*/React.createElement("th", {
    rowSpan: 2,
    className: "px-3 py-2 text-right"
  }, "Đơn giá"), /*#__PURE__*/React.createElement("th", {
    colSpan: 2,
    className: "border-l border-slate-600 px-3 py-2 text-center"
  }, "Đầu kỳ"), /*#__PURE__*/React.createElement("th", {
    colSpan: 2,
    className: "border-l border-slate-600 px-3 py-2 text-center"
  }, "Nhập kho"), /*#__PURE__*/React.createElement("th", {
    colSpan: 2,
    className: "border-l border-slate-600 px-3 py-2 text-center"
  }, "Xuất kho"), /*#__PURE__*/React.createElement("th", {
    colSpan: 2,
    className: "border-l border-slate-600 px-3 py-2 text-center"
  }, "Cuối kỳ")), /*#__PURE__*/React.createElement("tr", {
    className: "bg-slate-700 text-xs font-medium text-slate-200"
  }, ["SL", "Giá trị", "SL", "Giá trị", "SL", "Giá trị", "SL", "Giá trị"].map((h, i) => /*#__PURE__*/React.createElement("th", {
    key: i,
    className: `px-3 py-1.5 text-right ${i % 2 === 0 ? "border-l border-slate-600" : ""}`
  }, h)))), /*#__PURE__*/React.createElement("tbody", {
    className: "divide-y divide-slate-100"
  }, rows.map((r, i) => {
    const end = r.o + r.in - r.out;
    return /*#__PURE__*/React.createElement("tr", {
      key: i,
      className: "hover:bg-slate-50/60"
    }, /*#__PURE__*/React.createElement("td", {
      className: "px-3 py-3 font-medium text-slate-700"
    }, r.store), /*#__PURE__*/React.createElement("td", {
      className: "px-3 py-3 text-xs text-slate-500"
    }, /*#__PURE__*/React.createElement(Sku, {
      value: r.sku
    })), /*#__PURE__*/React.createElement("td", {
      className: "px-3 py-3"
    }, /*#__PURE__*/React.createElement("button", {
      onClick: () => setDetail(r),
      className: "text-left font-medium text-blue-700 underline-offset-2 hover:underline"
    }, r.name)), /*#__PURE__*/React.createElement("td", {
      className: "px-3 py-3 text-slate-500"
    }, r.unit), /*#__PURE__*/React.createElement("td", {
      className: cell + " text-slate-700"
    }, num(r.price)), /*#__PURE__*/React.createElement("td", {
      className: cell + " border-l border-slate-100 text-slate-600"
    }, r.o), /*#__PURE__*/React.createElement("td", {
      className: cell + " text-slate-600"
    }, num(r.o * r.price)), /*#__PURE__*/React.createElement("td", {
      className: cell + " border-l border-slate-100 text-emerald-600"
    }, r.in || 0), /*#__PURE__*/React.createElement("td", {
      className: cell + " text-emerald-600"
    }, r.in ? num(r.in * r.price) : 0), /*#__PURE__*/React.createElement("td", {
      className: cell + " border-l border-slate-100 text-rose-600"
    }, r.out || 0), /*#__PURE__*/React.createElement("td", {
      className: cell + " text-rose-600"
    }, r.out ? num(r.out * r.price) : 0), /*#__PURE__*/React.createElement("td", {
      className: cell + " border-l border-slate-100 font-semibold text-slate-800"
    }, end), /*#__PURE__*/React.createElement("td", {
      className: cell + " font-semibold text-slate-800"
    }, num(end * r.price)));
  })))), detail && /*#__PURE__*/React.createElement(StockDetailModal, {
    row: detail,
    onClose: () => setDetail(null)
  }));
}

/* ───────── Products (form thêm/sửa theo Ảnh 3 & 4) ───────── */
const UNITS = ["Cái", "Bộ", "Chiếc", "Hộp", "Thùng", "Mét", "Cặp"];
const CATS = ["Bồn cầu", "Vòi lavabo", "Sen tắm", "Chậu rửa", "Tiểu nam", "Bếp từ", "Lò nướng", "Hút mùi", "Phụ kiện"];
function ProductForm({
  initial,
  presetName,
  onClose,
  onSave
}) {
  const isEdit = !!(initial && initial.sku);
  const suggestSku = (presetName || "").trim().toUpperCase().replace(/\s+/g, "-").slice(0, 20);
  const e = initial || (presetName ? {
    name: presetName,
    sku: suggestSku,
    unit: "Cái"
  } : {});
  const [f, setF] = useState({
    sku: e.sku || "",
    name: e.name || "",
    desc: e.desc || "",
    cost: e.cost || 0,
    list: e.list || 0,
    sale: e.sale || 0,
    supplier: e.supplier || "",
    brand: e.brand || "",
    unit: e.unit || "",
    cat: e.cat || "",
    status: e.status || "Đang bán",
    stock: e.stock ?? 0,
    img: e.img || ""
  });
  const set = p => setF(x => ({
    ...x,
    ...p
  }));
  const can = f.sku.trim() && f.name.trim() && f.unit;
  return /*#__PURE__*/React.createElement(Modal, {
    title: isEdit ? "Sửa sản phẩm" : "Thêm sản phẩm mới",
    onClose: onClose,
    footer: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("button", {
      onClick: onClose,
      className: ghostBtn
    }, /*#__PURE__*/React.createElement(ArrowLeft, {
      className: "h-4 w-4"
    }), " Quay lại"), /*#__PURE__*/React.createElement("button", {
      onClick: () => can && onSave(f),
      disabled: !can,
      className: blueBtn + " disabled:bg-slate-300"
    }, /*#__PURE__*/React.createElement(Save, {
      className: "h-4 w-4"
    }), " Lưu"))
  }, /*#__PURE__*/React.createElement("div", {
    className: "space-y-4"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: "mb-1 block text-sm font-medium text-slate-700"
  }, "Mã sản phẩm ", /*#__PURE__*/React.createElement("span", {
    className: "text-rose-500"
  }, "*")), /*#__PURE__*/React.createElement("input", {
    className: inputF,
    value: f.sku,
    onChange: ev => set({
      sku: ev.target.value
    })
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: "mb-1 block text-sm font-medium text-slate-700"
  }, "Tên sản phẩm ", /*#__PURE__*/React.createElement("span", {
    className: "text-rose-500"
  }, "*")), /*#__PURE__*/React.createElement("input", {
    className: inputF,
    value: f.name,
    onChange: ev => set({
      name: ev.target.value
    })
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: "mb-1 block text-sm font-medium text-slate-700"
  }, "Mô tả sản phẩm"), /*#__PURE__*/React.createElement("textarea", {
    rows: 3,
    className: inputF + " resize-none",
    placeholder: "Nhập mô tả sản phẩm...",
    value: f.desc,
    onChange: ev => set({
      desc: ev.target.value
    })
  }), /*#__PURE__*/React.createElement("p", {
    className: "mt-1 text-xs text-slate-400"
  }, "Sử dụng trình soạn thảo để định dạng văn bản.")), /*#__PURE__*/React.createElement("div", {
    className: "grid grid-cols-1 gap-4 sm:grid-cols-3"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: "mb-1 block text-sm font-medium text-slate-700"
  }, "Giá nhập"), /*#__PURE__*/React.createElement(NumInput, {
    className: inputF,
    value: f.cost,
    onChange: v => set({
      cost: v
    })
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: "mb-1 block text-sm font-medium text-slate-700"
  }, "Giá niêm yết"), /*#__PURE__*/React.createElement(NumInput, {
    className: inputF,
    value: f.list,
    onChange: v => set({
      list: v
    })
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: "mb-1 block text-sm font-medium text-slate-700"
  }, "Giá khuyến mãi"), /*#__PURE__*/React.createElement(NumInput, {
    className: inputF,
    value: f.sale,
    onChange: v => set({
      sale: v
    })
  }))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: "mb-1 block text-sm font-medium text-slate-700"
  }, "Nhà cung cấp"), /*#__PURE__*/React.createElement("input", {
    className: inputF,
    list: "sup-list-p",
    placeholder: "Tìm kiếm nhà cung cấp...",
    value: f.supplier,
    onChange: ev => set({
      supplier: ev.target.value
    })
  }), /*#__PURE__*/React.createElement("datalist", {
    id: "sup-list-p"
  }, SUPPLIERS.filter(s => s.code).map(s => /*#__PURE__*/React.createElement("option", {
    key: s.code,
    value: s.name
  }))), /*#__PURE__*/React.createElement("button", {
    className: "mt-1 inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:underline"
  }, /*#__PURE__*/React.createElement(Plus, {
    className: "h-3.5 w-3.5"
  }), " Thêm nhà cung cấp mới")), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: "mb-1 block text-sm font-medium text-slate-700"
  }, "Thương hiệu"), /*#__PURE__*/React.createElement("input", {
    className: inputF,
    value: f.brand,
    onChange: ev => set({
      brand: ev.target.value
    })
  })), /*#__PURE__*/React.createElement("div", {
    className: "grid grid-cols-1 gap-4 sm:grid-cols-2"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: "mb-1 block text-sm font-medium text-slate-700"
  }, "Đơn vị tính ", /*#__PURE__*/React.createElement("span", {
    className: "text-rose-500"
  }, "*")), /*#__PURE__*/React.createElement("select", {
    className: inputF,
    value: f.unit,
    onChange: ev => set({
      unit: ev.target.value
    })
  }, /*#__PURE__*/React.createElement("option", {
    value: ""
  }, "Chọn đơn vị tính"), UNITS.map(u => /*#__PURE__*/React.createElement("option", {
    key: u
  }, u)))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: "mb-1 block text-sm font-medium text-slate-700"
  }, "Danh mục sản phẩm"), /*#__PURE__*/React.createElement("select", {
    className: inputF,
    value: f.cat,
    onChange: ev => set({
      cat: ev.target.value
    })
  }, /*#__PURE__*/React.createElement("option", {
    value: ""
  }, "Chọn danh mục"), CATS.map(c => /*#__PURE__*/React.createElement("option", {
    key: c
  }, c))))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: "mb-1 block text-sm font-medium text-slate-700"
  }, "Trạng thái"), /*#__PURE__*/React.createElement("select", {
    className: inputF,
    value: f.status,
    onChange: ev => set({
      status: ev.target.value
    })
  }, /*#__PURE__*/React.createElement("option", null, "Đang bán"), /*#__PURE__*/React.createElement("option", null, "Ngừng bán"))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: "mb-1 block text-sm font-medium text-slate-700"
  }, "Hình ảnh"), /*#__PURE__*/React.createElement("input", {
    type: "file",
    accept: "image/*",
    onChange: ev => {
      const file = ev.target.files && ev.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => set({
        img: reader.result
      });
      reader.readAsDataURL(file);
    },
    className: "block w-full text-sm text-slate-500 file:mr-3 file:rounded-md file:border-0 file:bg-slate-100 file:px-3 file:py-2 file:text-sm file:text-slate-700 hover:file:bg-slate-200"
  }), f.img ? /*#__PURE__*/React.createElement("img", {
    src: f.img,
    alt: "preview",
    className: "mt-2 h-24 w-24 rounded-lg border border-slate-200 object-cover"
  }) : null)));
}
function ProductsTab() {
  const notify = useToast();
  const [items, setItems] = useState(PRODUCTS);
  const [q, setQ] = useState("");
  const [brand, setBrand] = useState("Tất cả");
  const [sf, setSf] = useState("Tất cả");
  const [form, setForm] = useState(null); // {} new | product edit
  const brands = ["Tất cả", ...new Set(items.map(p => p.brand))];
  const rows = useMemo(() => items.filter(p => {
    if (brand !== "Tất cả" && p.brand !== brand) return false;
    if (sf === "Còn hàng" && p.stock <= 0) return false;
    if (sf === "Sắp hết (≤5)" && (p.stock === 0 || p.stock > 5)) return false;
    if (sf === "Hết hàng" && p.stock !== 0) return false;
    if (q && !`${p.name} ${p.sku}`.toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  }), [items, q, brand, sf]);
  const tag = n => n === 0 ? "bg-rose-50 text-rose-600" : n <= 5 ? "bg-amber-50 text-amber-600" : "bg-emerald-50 text-emerald-600";
  const save = f => {
    setItems(xs => xs.some(p => p.sku === f.sku && form && form.sku === f.sku) ? xs.map(p => p.sku === form.sku ? {
      ...p,
      ...f
    } : p) : [{
      ...f
    }, ...xs]);
    notify(form && form.sku ? "Đã cập nhật sản phẩm" : "Đã thêm sản phẩm");
    setForm(null);
  };
  const del = sku => {
    if (window.confirm("Xoá sản phẩm này?")) {
      setItems(xs => xs.filter(p => p.sku !== sku));
      notify("Đã xoá sản phẩm");
    }
  };
  const onExport = () => exportCSV("danh-sach-san-pham", ["Mã SP", "Tên sản phẩm", "Mô tả", "ĐVT", "Niêm yết", "Giá bán", "Tồn"], rows.map(p => [p.sku, p.name, p.desc, p.unit, p.list, p.sale, p.stock]));
  return /*#__PURE__*/React.createElement("div", {
    className: "space-y-4"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex flex-wrap items-center gap-2"
  }, /*#__PURE__*/React.createElement("div", {
    className: "relative"
  }, /*#__PURE__*/React.createElement(Search, {
    className: "absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
  }), /*#__PURE__*/React.createElement("input", {
    value: q,
    onChange: e => setQ(e.target.value),
    placeholder: "Tìm tên / mã SP",
    className: `${field} w-60 pl-8`
  })), /*#__PURE__*/React.createElement("select", {
    value: brand,
    onChange: e => setBrand(e.target.value),
    className: field
  }, brands.map(b => /*#__PURE__*/React.createElement("option", {
    key: b
  }, b))), /*#__PURE__*/React.createElement("select", {
    value: sf,
    onChange: e => setSf(e.target.value),
    className: field
  }, ["Tất cả", "Còn hàng", "Sắp hết (≤5)", "Hết hàng"].map(s => /*#__PURE__*/React.createElement("option", {
    key: s
  }, s))), /*#__PURE__*/React.createElement("span", {
    className: "text-xs text-slate-400"
  }, rows.length, " sản phẩm"), /*#__PURE__*/React.createElement("div", {
    className: "ml-auto flex gap-2"
  }, /*#__PURE__*/React.createElement(PrintBtn, null), /*#__PURE__*/React.createElement(ExportBtn, {
    onClick: onExport
  }), /*#__PURE__*/React.createElement("button", {
    onClick: () => setForm({}),
    className: blueBtn
  }, /*#__PURE__*/React.createElement(Plus, {
    className: "h-4 w-4"
  }), " Thêm SP"))), /*#__PURE__*/React.createElement(TableShell, {
    minW: "1000px",
    head: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(Th, {
      center: true,
      style: {
        width: 70
      }
    }, "Hình ảnh"), /*#__PURE__*/React.createElement(Th, {
      style: {
        width: 130
      }
    }, "Mã SP"), /*#__PURE__*/React.createElement(Th, {
      style: {
        minWidth: 260
      }
    }, "Tên sản phẩm"), /*#__PURE__*/React.createElement(Th, {
      style: {
        minWidth: 240
      }
    }, "Mô tả"), /*#__PURE__*/React.createElement(Th, {
      style: {
        width: 70
      }
    }, "ĐVT"), /*#__PURE__*/React.createElement(Th, {
      right: true,
      style: {
        width: 110
      }
    }, "Niêm yết"), /*#__PURE__*/React.createElement(Th, {
      right: true,
      style: {
        width: 110
      }
    }, "Giá bán"), /*#__PURE__*/React.createElement(Th, {
      center: true,
      style: {
        width: 60
      }
    }, "Tồn"), /*#__PURE__*/React.createElement(Th, {
      center: true,
      style: {
        width: 90
      }
    }, "Thao tác"))
  }, rows.map(p => /*#__PURE__*/React.createElement("tr", {
    key: p.sku,
    className: "align-top hover:bg-slate-50/60"
  }, /*#__PURE__*/React.createElement("td", {
    className: "px-3 py-3"
  }, /*#__PURE__*/React.createElement("div", {
    className: "mx-auto flex h-12 w-12 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-300"
  }, /*#__PURE__*/React.createElement(ImageIcon, {
    className: "h-5 w-5"
  }))), /*#__PURE__*/React.createElement("td", {
    className: "px-3 py-3 text-xs text-slate-500"
  }, /*#__PURE__*/React.createElement(Sku, {
    value: p.sku
  })), /*#__PURE__*/React.createElement("td", {
    className: "px-3 py-3 text-slate-800"
  }, p.name), /*#__PURE__*/React.createElement("td", {
    className: "px-3 py-3 text-xs text-slate-500",
    style: {
      maxWidth: 280
    }
  }, p.desc), /*#__PURE__*/React.createElement("td", {
    className: "px-3 py-3 text-slate-500"
  }, p.unit), /*#__PURE__*/React.createElement("td", {
    className: "px-3 py-3 text-right tabular-nums text-slate-400 line-through"
  }, vnd(p.list)), /*#__PURE__*/React.createElement("td", {
    className: "px-3 py-3 text-right font-semibold tabular-nums text-slate-900"
  }, vnd(p.sale)), /*#__PURE__*/React.createElement("td", {
    className: "px-3 py-3 text-center"
  }, /*#__PURE__*/React.createElement("span", {
    className: `inline-block min-w-[2rem] rounded-md px-2 py-0.5 text-center text-xs font-semibold tabular-nums ${tag(p.stock)}`
  }, p.stock)), /*#__PURE__*/React.createElement("td", {
    className: "px-3 py-3"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-center"
  }, /*#__PURE__*/React.createElement(IconBtn, {
    icon: Pencil,
    title: "Sửa",
    onClick: () => setForm(p)
  }), /*#__PURE__*/React.createElement(IconBtn, {
    icon: Trash2,
    title: "Xoá",
    onClick: () => del(p.sku)
  })))))), form && /*#__PURE__*/React.createElement(ProductForm, {
    initial: form.sku ? form : null,
    onClose: () => setForm(null),
    onSave: save
  }));
}
function CustomerForm({
  initial,
  onClose,
  onSave
}) {
  const e = initial || {};
  const [f, setF] = useState({
    name: e.name || "",
    phone: e.phone || "",
    addr: e.addr || "",
    src: e.src || "Facebook",
    tier: e.tier || "Thường",
    orders: e.orders || 0,
    spent: e.spent || 0,
    debt: e.debt || 0
  });
  const set = p => setF(x => ({
    ...x,
    ...p
  }));
  const can = f.name.trim() && f.phone.trim();
  return /*#__PURE__*/React.createElement(Modal, {
    title: initial ? "Sửa khách hàng" : "Thêm khách hàng mới",
    onClose: onClose,
    footer: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("button", {
      onClick: onClose,
      className: ghostBtn
    }, "Quay lại"), /*#__PURE__*/React.createElement("button", {
      onClick: () => can && onSave(f),
      disabled: !can,
      className: blueBtn + " disabled:bg-slate-300"
    }, /*#__PURE__*/React.createElement(Save, {
      className: "h-4 w-4"
    }), " Lưu"))
  }, /*#__PURE__*/React.createElement("div", {
    className: "space-y-4"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: "mb-1 block text-sm font-medium text-slate-700"
  }, "Tên khách hàng ", /*#__PURE__*/React.createElement("span", {
    className: "text-rose-500"
  }, "*")), /*#__PURE__*/React.createElement("input", {
    className: inputF,
    value: f.name,
    onChange: ev => set({
      name: ev.target.value
    })
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: "mb-1 block text-sm font-medium text-slate-700"
  }, "Số điện thoại ", /*#__PURE__*/React.createElement("span", {
    className: "text-rose-500"
  }, "*")), /*#__PURE__*/React.createElement("input", {
    className: inputF,
    value: f.phone,
    onChange: ev => set({
      phone: ev.target.value
    })
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: "mb-1 block text-sm font-medium text-slate-700"
  }, "Địa chỉ"), /*#__PURE__*/React.createElement("input", {
    className: inputF,
    value: f.addr,
    onChange: ev => set({
      addr: ev.target.value
    })
  })), /*#__PURE__*/React.createElement("div", {
    className: "grid grid-cols-2 gap-4"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: "mb-1 block text-sm font-medium text-slate-700"
  }, "Nguồn"), /*#__PURE__*/React.createElement("select", {
    className: inputF,
    value: f.src,
    onChange: ev => set({
      src: ev.target.value
    })
  }, ["Facebook", "Zalo", "TikTok", "Đến CH"].map(s => /*#__PURE__*/React.createElement("option", {
    key: s
  }, s)))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: "mb-1 block text-sm font-medium text-slate-700"
  }, "Hạng"), /*#__PURE__*/React.createElement("select", {
    className: inputF,
    value: f.tier,
    onChange: ev => set({
      tier: ev.target.value
    })
  }, ["Thường", "Bạc", "Vàng", "Kim cương"].map(s => /*#__PURE__*/React.createElement("option", {
    key: s
  }, s)))))));
}
function CustomersTab() {
  const notify = useToast();
  const [items, setItems] = useState(CUSTOMERS);
  const [src, setSrc] = useState("Tất cả");
  const [tier, setTier] = useState("Tất cả");
  const [form, setForm] = useState(null);
  const rows = items.filter(c => (src === "Tất cả" || c.src === src) && (tier === "Tất cả" || c.tier === tier));
  const save = f => {
    setItems(xs => form && form.name ? xs.map(c => c === form ? {
      ...c,
      ...f
    } : c) : [{
      ...f
    }, ...xs]);
    notify(form && form.name ? "Đã cập nhật khách hàng" : "Đã thêm khách hàng");
    setForm(null);
  };
  const del = c => {
    if (window.confirm("Xoá khách hàng này?")) {
      setItems(xs => xs.filter(x => x !== c));
      notify("Đã xoá khách hàng");
    }
  };
  const onExport = () => exportCSV("danh-sach-khach-hang", ["Khách hàng", "Địa chỉ", "SĐT", "Nguồn", "Hạng", "Số đơn", "Tổng chi tiêu"], rows.map(c => [c.name, c.addr, c.phone, c.src, c.tier, c.orders, c.spent]));
  return /*#__PURE__*/React.createElement("div", {
    className: "space-y-4"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex flex-wrap items-center gap-2"
  }, /*#__PURE__*/React.createElement("select", {
    value: src,
    onChange: e => setSrc(e.target.value),
    className: field
  }, ["Tất cả", "Facebook", "Zalo", "TikTok", "Đến CH"].map(s => /*#__PURE__*/React.createElement("option", {
    key: s
  }, s))), /*#__PURE__*/React.createElement("select", {
    value: tier,
    onChange: e => setTier(e.target.value),
    className: field
  }, ["Tất cả", "Thường", "Bạc", "Vàng", "Kim cương"].map(s => /*#__PURE__*/React.createElement("option", {
    key: s
  }, s))), /*#__PURE__*/React.createElement("span", {
    className: "text-xs text-slate-400"
  }, rows.length, " khách"), /*#__PURE__*/React.createElement("div", {
    className: "ml-auto flex gap-2"
  }, /*#__PURE__*/React.createElement(PrintBtn, null), /*#__PURE__*/React.createElement(ExportBtn, {
    onClick: onExport
  }), /*#__PURE__*/React.createElement("button", {
    onClick: () => setForm({}),
    className: blueBtn
  }, /*#__PURE__*/React.createElement(Plus, {
    className: "h-4 w-4"
  }), " Thêm khách"))), /*#__PURE__*/React.createElement(TableShell, {
    head: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(Th, {
      style: {
        minWidth: 200
      }
    }, "Khách hàng"), /*#__PURE__*/React.createElement(Th, {
      style: {
        minWidth: 180
      }
    }, "Địa chỉ"), /*#__PURE__*/React.createElement(Th, null, "SĐT"), /*#__PURE__*/React.createElement(Th, null, "Nguồn"), /*#__PURE__*/React.createElement(Th, null, "Hạng"), /*#__PURE__*/React.createElement(Th, {
      right: true
    }, "Số đơn"), /*#__PURE__*/React.createElement(Th, {
      right: true
    }, "Tổng chi tiêu"), /*#__PURE__*/React.createElement(Th, {
      center: true,
      style: {
        width: 90
      }
    }, "Thao tác"))
  }, rows.map((c, i) => /*#__PURE__*/React.createElement("tr", {
    key: i,
    className: "hover:bg-slate-50/60"
  }, /*#__PURE__*/React.createElement("td", {
    className: "px-4 py-3 font-medium text-slate-800"
  }, c.name), /*#__PURE__*/React.createElement("td", {
    className: "px-4 py-3 text-xs text-slate-500"
  }, c.addr || "—"), /*#__PURE__*/React.createElement("td", {
    className: "px-4 py-3 text-xs text-slate-500"
  }, /*#__PURE__*/React.createElement(Phone, {
    value: c.phone
  })), /*#__PURE__*/React.createElement("td", {
    className: "px-4 py-3"
  }, /*#__PURE__*/React.createElement(Pill, {
    map: CHANNELS,
    value: c.src
  })), /*#__PURE__*/React.createElement("td", {
    className: "px-4 py-3"
  }, /*#__PURE__*/React.createElement(Pill, {
    map: TIERS,
    value: c.tier
  })), /*#__PURE__*/React.createElement("td", {
    className: "px-4 py-3 text-right tabular-nums text-slate-600"
  }, c.orders), /*#__PURE__*/React.createElement("td", {
    className: "px-4 py-3 text-right font-medium tabular-nums text-slate-800"
  }, vnd(c.spent)), /*#__PURE__*/React.createElement("td", {
    className: "px-4 py-3"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-center"
  }, /*#__PURE__*/React.createElement(IconBtn, {
    icon: Pencil,
    title: "Sửa",
    onClick: () => setForm(c)
  }), /*#__PURE__*/React.createElement(IconBtn, {
    icon: Trash2,
    title: "Xoá",
    onClick: () => del(c)
  })))))), form && /*#__PURE__*/React.createElement(CustomerForm, {
    initial: form.name ? form : null,
    onClose: () => setForm(null),
    onSave: save
  }));
}

/* ───────── Suppliers (bỏ Mã NCC; form thêm/sửa; thao tác) ───────── */
function SupplierForm({
  initial,
  onClose,
  onSave
}) {
  const e = initial || {};
  const [f, setF] = useState({
    code: e.code || "",
    name: e.name || "",
    phone: e.phone || "",
    addr: e.addr || "",
    open: e.open || 0,
    ps: 0,
    tt: 0
  });
  const set = p => setF(x => ({
    ...x,
    ...p
  }));
  const can = f.name.trim();
  return /*#__PURE__*/React.createElement(Modal, {
    title: initial ? "Sửa nhà cung cấp" : "Thêm nhà cung cấp mới",
    onClose: onClose,
    footer: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("button", {
      onClick: onClose,
      className: ghostBtn
    }, "Quay lại"), /*#__PURE__*/React.createElement("button", {
      onClick: () => can && onSave(f),
      disabled: !can,
      className: blueBtn + " disabled:bg-slate-300"
    }, /*#__PURE__*/React.createElement(Save, {
      className: "h-4 w-4"
    }), " Lưu"))
  }, /*#__PURE__*/React.createElement("div", {
    className: "space-y-4"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: "mb-1 block text-sm font-medium text-slate-700"
  }, "Tên nhà cung cấp ", /*#__PURE__*/React.createElement("span", {
    className: "text-rose-500"
  }, "*")), /*#__PURE__*/React.createElement("input", {
    className: inputF,
    value: f.name,
    onChange: ev => set({
      name: ev.target.value
    })
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: "mb-1 block text-sm font-medium text-slate-700"
  }, "Điện thoại"), /*#__PURE__*/React.createElement("input", {
    className: inputF,
    value: f.phone,
    onChange: ev => set({
      phone: ev.target.value
    })
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: "mb-1 block text-sm font-medium text-slate-700"
  }, "Địa chỉ"), /*#__PURE__*/React.createElement("input", {
    className: inputF,
    value: f.addr,
    onChange: ev => set({
      addr: ev.target.value
    })
  }))));
}
function Suppliers() {
  const notify = useToast();
  const [items, setItems] = useState(SUPPLIERS.filter(s => s.name !== "Không xác định"));
  const [form, setForm] = useState(null);
  const save = f => {
    setItems(xs => form && form.name ? xs.map(s => s === form ? {
      ...s,
      ...f
    } : s) : [{
      ...f
    }, ...xs]);
    notify(form && form.name ? "Đã cập nhật NCC" : "Đã thêm NCC");
    setForm(null);
  };
  const del = s => {
    if (window.confirm("Xoá nhà cung cấp này?")) {
      setItems(xs => xs.filter(x => x !== s));
      notify("Đã xoá NCC");
    }
  };
  const onExport = () => exportCSV("danh-sach-nha-cung-cap", ["Tên nhà cung cấp", "Điện thoại", "Địa chỉ"], items.map(s => [s.name, s.phone, s.addr]));
  return /*#__PURE__*/React.createElement("div", {
    className: "space-y-4"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex justify-end gap-2"
  }, /*#__PURE__*/React.createElement(ExportBtn, {
    onClick: onExport
  }), /*#__PURE__*/React.createElement("button", {
    onClick: () => setForm({}),
    className: blueBtn
  }, /*#__PURE__*/React.createElement(Plus, {
    className: "h-4 w-4"
  }), " Thêm nhà cung cấp")), /*#__PURE__*/React.createElement(TableShell, {
    head: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(Th, {
      style: {
        minWidth: 260
      }
    }, "Tên nhà cung cấp"), /*#__PURE__*/React.createElement(Th, null, "Điện thoại"), /*#__PURE__*/React.createElement(Th, {
      style: {
        minWidth: 240
      }
    }, "Địa chỉ"), /*#__PURE__*/React.createElement(Th, {
      center: true,
      style: {
        width: 90
      }
    }, "Thao tác"))
  }, items.map((s, i) => /*#__PURE__*/React.createElement("tr", {
    key: i,
    className: "hover:bg-slate-50/60"
  }, /*#__PURE__*/React.createElement("td", {
    className: "px-4 py-3 font-medium text-slate-800"
  }, s.name), /*#__PURE__*/React.createElement("td", {
    className: "px-4 py-3 text-xs text-slate-600"
  }, /*#__PURE__*/React.createElement(Phone, {
    value: s.phone
  })), /*#__PURE__*/React.createElement("td", {
    className: "px-4 py-3 text-slate-500"
  }, s.addr || "—"), /*#__PURE__*/React.createElement("td", {
    className: "px-4 py-3"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-center"
  }, /*#__PURE__*/React.createElement(IconBtn, {
    icon: Pencil,
    title: "Sửa",
    onClick: () => setForm(s)
  }), /*#__PURE__*/React.createElement(IconBtn, {
    icon: Trash2,
    title: "Xoá",
    onClick: () => del(s)
  })))))), form && /*#__PURE__*/React.createElement(SupplierForm, {
    initial: form.name ? form : null,
    onClose: () => setForm(null),
    onSave: save
  }));
}

/* ───────── Công nợ khách hàng (tổng hợp → chi tiết) ───────── */
function DebtCust() {
  const [detail, setDetail] = useState(null);
  const totals = CUST_DEBT.reduce((a, r) => ({
    open: a.open + r.open,
    ps: a.ps + r.ps,
    tt: a.tt + r.tt
  }), {
    open: 0,
    ps: 0,
    tt: 0
  });
  const closeTotal = totals.open + totals.ps - totals.tt;
  if (detail) return /*#__PURE__*/React.createElement(CustDebtDetail, {
    row: detail,
    onBack: () => setDetail(null)
  });
  const onExport = () => exportCSV("cong-no-khach-hang", ["Tên khách hàng", "Điện thoại", "Dư nợ đầu kỳ", "Phát sinh", "Thanh toán", "Dư nợ cuối kỳ"], CUST_DEBT.map(r => [r.name, r.phone, r.open, r.ps, r.tt, r.open + r.ps - r.tt]));
  return /*#__PURE__*/React.createElement("div", {
    className: "space-y-4"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex flex-wrap items-center gap-2"
  }, /*#__PURE__*/React.createElement("input", {
    type: "date",
    defaultValue: "2026-06-01",
    className: field
  }), /*#__PURE__*/React.createElement("span", {
    className: "text-slate-400"
  }, "→"), /*#__PURE__*/React.createElement("input", {
    type: "date",
    defaultValue: "2026-06-16",
    className: field
  }), /*#__PURE__*/React.createElement("button", {
    className: blueBtn
  }, /*#__PURE__*/React.createElement(Search, {
    className: "h-4 w-4"
  }), " Lọc"), /*#__PURE__*/React.createElement("div", {
    className: "ml-auto flex gap-2"
  }, /*#__PURE__*/React.createElement(PrintBtn, null), /*#__PURE__*/React.createElement(ExportBtn, {
    onClick: onExport
  }))), /*#__PURE__*/React.createElement("div", {
    className: "text-center"
  }, /*#__PURE__*/React.createElement("h2", {
    className: "text-lg font-bold uppercase text-slate-800"
  }, "Báo cáo tổng hợp công nợ khách hàng"), /*#__PURE__*/React.createElement("p", {
    className: "text-sm text-slate-500"
  }, "Từ ngày 01/06/2026 đến ngày 16/06/2026")), /*#__PURE__*/React.createElement("div", {
    className: "overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm"
  }, /*#__PURE__*/React.createElement("table", {
    className: "w-full text-sm",
    style: {
      minWidth: 820
    }
  }, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", {
    className: "bg-slate-800 text-xs font-medium text-slate-100"
  }, /*#__PURE__*/React.createElement("th", {
    rowSpan: 2,
    className: "px-3 py-2 text-left"
  }, "Tên khách hàng"), /*#__PURE__*/React.createElement("th", {
    rowSpan: 2,
    className: "px-3 py-2 text-left"
  }, "Điện thoại"), /*#__PURE__*/React.createElement("th", {
    rowSpan: 2,
    className: "border-l border-slate-600 px-3 py-2 text-right"
  }, "Số dư nợ đầu kỳ"), /*#__PURE__*/React.createElement("th", {
    colSpan: 2,
    className: "border-l border-slate-600 px-3 py-2 text-center"
  }, "Phát sinh trong kỳ"), /*#__PURE__*/React.createElement("th", {
    rowSpan: 2,
    className: "border-l border-slate-600 px-3 py-2 text-right"
  }, "Số dư nợ cuối kỳ")), /*#__PURE__*/React.createElement("tr", {
    className: "bg-slate-700 text-xs font-medium text-slate-200"
  }, /*#__PURE__*/React.createElement("th", {
    className: "border-l border-slate-600 px-3 py-1.5 text-right"
  }, "Số phát sinh"), /*#__PURE__*/React.createElement("th", {
    className: "px-3 py-1.5 text-right"
  }, "Thanh toán"))), /*#__PURE__*/React.createElement("tbody", {
    className: "divide-y divide-slate-100"
  }, CUST_DEBT.map((r, i) => {
    const close = r.open + r.ps - r.tt;
    return /*#__PURE__*/React.createElement("tr", {
      key: i,
      className: "hover:bg-slate-50/60"
    }, /*#__PURE__*/React.createElement("td", {
      className: "px-3 py-3"
    }, /*#__PURE__*/React.createElement("button", {
      onClick: () => setDetail(r),
      className: "font-medium text-blue-700 underline-offset-2 hover:underline"
    }, r.name)), /*#__PURE__*/React.createElement("td", {
      className: "px-3 py-3 text-xs text-slate-500"
    }, /*#__PURE__*/React.createElement(Phone, {
      value: r.phone
    })), /*#__PURE__*/React.createElement("td", {
      className: "border-l border-slate-100 px-3 py-3 text-right tabular-nums text-slate-700"
    }, num(r.open)), /*#__PURE__*/React.createElement("td", {
      className: "border-l border-slate-100 px-3 py-3 text-right tabular-nums text-slate-600"
    }, num(r.ps)), /*#__PURE__*/React.createElement("td", {
      className: "px-3 py-3 text-right tabular-nums text-slate-600"
    }, num(r.tt)), /*#__PURE__*/React.createElement("td", {
      className: `border-l border-slate-100 px-3 py-3 text-right font-semibold tabular-nums ${close < 0 ? "text-blue-600" : "text-rose-600"}`
    }, num(close)));
  })), /*#__PURE__*/React.createElement("tfoot", null, /*#__PURE__*/React.createElement("tr", {
    className: "bg-amber-50 font-bold"
  }, /*#__PURE__*/React.createElement("td", {
    colSpan: 2,
    className: "px-3 py-3 text-center text-slate-700"
  }, "TỔNG CỘNG"), /*#__PURE__*/React.createElement("td", {
    className: "border-l border-slate-100 px-3 py-3 text-right tabular-nums text-slate-800"
  }, num(totals.open)), /*#__PURE__*/React.createElement("td", {
    className: "border-l border-slate-100 px-3 py-3 text-right tabular-nums text-slate-800"
  }, num(totals.ps)), /*#__PURE__*/React.createElement("td", {
    className: "px-3 py-3 text-right tabular-nums text-slate-800"
  }, num(totals.tt)), /*#__PURE__*/React.createElement("td", {
    className: "border-l border-slate-100 px-3 py-3 text-right tabular-nums text-rose-600"
  }, num(closeTotal)))))));
}
function CustDebtDetail({
  row,
  onBack
}) {
  const d = CUST_DEBT_DETAIL[row.phone];
  const close = row.open + row.ps - row.tt;
  return /*#__PURE__*/React.createElement("div", {
    className: "space-y-4"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-between"
  }, /*#__PURE__*/React.createElement("button", {
    onClick: onBack,
    className: "inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800"
  }, /*#__PURE__*/React.createElement(ArrowLeft, {
    className: "h-4 w-4"
  }), " Quay lại báo cáo tổng hợp"), /*#__PURE__*/React.createElement("div", {
    className: "flex gap-2"
  }, /*#__PURE__*/React.createElement(PrintBtn, null), /*#__PURE__*/React.createElement(ExportBtn, {
    onClick: () => exportCSV("cong-no-" + row.name, ["Mã đơn", "Ngày", "Sản phẩm", "SL", "Đơn giá", "Tiền hàng", "Phải thanh toán", "Đã thanh toán", "Còn nợ"], (d ? d.orders : []).flatMap(o => o.items.map(it => [o.id, o.date, it.name, it.qty, it.price, it.price * it.qty, o.payable, o.paid, o.payable - o.paid])))
  }))), /*#__PURE__*/React.createElement(Card, null, /*#__PURE__*/React.createElement("h3", {
    className: "mb-4 text-base font-semibold text-slate-800"
  }, "Thông tin khách hàng"), /*#__PURE__*/React.createElement("div", {
    className: "grid grid-cols-1 gap-y-2 text-sm sm:grid-cols-2"
  }, /*#__PURE__*/React.createElement("p", null, /*#__PURE__*/React.createElement("span", {
    className: "text-slate-500"
  }, "Địa chỉ:"), " ", /*#__PURE__*/React.createElement("b", {
    className: "text-slate-800"
  }, d?.addr || row.addr || "—")), /*#__PURE__*/React.createElement("p", null, /*#__PURE__*/React.createElement("span", {
    className: "text-slate-500"
  }, "Tên khách hàng:"), " ", /*#__PURE__*/React.createElement("b", {
    className: "text-slate-800"
  }, row.name)), /*#__PURE__*/React.createElement("p", null, /*#__PURE__*/React.createElement("span", {
    className: "text-slate-500"
  }, "Số điện thoại:"), " ", /*#__PURE__*/React.createElement("b", {
    className: "text-slate-800"
  }, row.phone)), /*#__PURE__*/React.createElement("p", null, /*#__PURE__*/React.createElement("span", {
    className: "text-slate-500"
  }, "Tổng dư nợ:"), " ", /*#__PURE__*/React.createElement("b", {
    className: "text-rose-600"
  }, num(close))))), /*#__PURE__*/React.createElement(Card, {
    title: "Danh sách đơn hàng còn nợ"
  }, d ? /*#__PURE__*/React.createElement("div", {
    className: "-mx-5 -mb-5 overflow-x-auto"
  }, /*#__PURE__*/React.createElement("table", {
    className: "w-full text-sm",
    style: {
      minWidth: 900
    }
  }, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", {
    className: "border-b border-slate-100 bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500"
  }, /*#__PURE__*/React.createElement("th", {
    className: "px-3 py-2.5"
  }, "Mã đơn"), /*#__PURE__*/React.createElement("th", {
    className: "px-3 py-2.5"
  }, "Sản phẩm"), /*#__PURE__*/React.createElement("th", {
    className: "px-3 py-2.5 text-right"
  }, "SL"), /*#__PURE__*/React.createElement("th", {
    className: "px-3 py-2.5 text-right"
  }, "Đơn giá"), /*#__PURE__*/React.createElement("th", {
    className: "px-3 py-2.5 text-right"
  }, "Tiền hàng"), /*#__PURE__*/React.createElement("th", {
    className: "px-3 py-2.5 text-right"
  }, "Chi phí"), /*#__PURE__*/React.createElement("th", {
    className: "px-3 py-2.5 text-right"
  }, "Phải thanh toán"), /*#__PURE__*/React.createElement("th", {
    className: "px-3 py-2.5 text-right"
  }, "Đã thanh toán"), /*#__PURE__*/React.createElement("th", {
    className: "px-3 py-2.5 text-right"
  }, "Còn nợ"))), /*#__PURE__*/React.createElement("tbody", {
    className: "divide-y divide-slate-100"
  }, d.orders.map(o => {
    const debtO = o.payable - o.paid;
    return o.items.map((it, k) => /*#__PURE__*/React.createElement("tr", {
      key: o.id + k,
      className: "hover:bg-slate-50/60"
    }, k === 0 && /*#__PURE__*/React.createElement("td", {
      rowSpan: o.items.length,
      className: "px-3 py-3 align-top"
    }, /*#__PURE__*/React.createElement("span", {
      className: "font-medium text-blue-700"
    }, o.id), /*#__PURE__*/React.createElement("br", null), /*#__PURE__*/React.createElement("span", {
      className: "text-xs text-slate-400"
    }, o.date)), /*#__PURE__*/React.createElement("td", {
      className: "px-3 py-3 text-slate-800"
    }, it.name, /*#__PURE__*/React.createElement("br", null), /*#__PURE__*/React.createElement("span", {
      className: "text-xs text-slate-400"
    }, it.sku)), /*#__PURE__*/React.createElement("td", {
      className: "px-3 py-3 text-right tabular-nums text-slate-600"
    }, it.qty), /*#__PURE__*/React.createElement("td", {
      className: "px-3 py-3 text-right tabular-nums text-slate-600"
    }, num(it.price)), /*#__PURE__*/React.createElement("td", {
      className: "px-3 py-3 text-right tabular-nums text-slate-700"
    }, num(it.amount)), k === 0 && /*#__PURE__*/React.createElement("td", {
      rowSpan: o.items.length,
      className: "px-3 py-3 text-right align-middle tabular-nums text-slate-600"
    }, num(o.expense)), k === 0 && /*#__PURE__*/React.createElement("td", {
      rowSpan: o.items.length,
      className: "px-3 py-3 text-right align-middle tabular-nums text-slate-700"
    }, num(o.payable)), k === 0 && /*#__PURE__*/React.createElement("td", {
      rowSpan: o.items.length,
      className: "px-3 py-3 text-right align-middle tabular-nums text-emerald-600"
    }, num(o.paid)), k === 0 && /*#__PURE__*/React.createElement("td", {
      rowSpan: o.items.length,
      className: "px-3 py-3 text-right align-middle font-semibold tabular-nums text-rose-600"
    }, num(debtO))));
  })), /*#__PURE__*/React.createElement("tfoot", null, /*#__PURE__*/React.createElement("tr", {
    className: "bg-slate-50 font-semibold"
  }, /*#__PURE__*/React.createElement("td", {
    colSpan: 8,
    className: "px-3 py-3 text-right text-slate-600"
  }, "Tổng dư nợ"), /*#__PURE__*/React.createElement("td", {
    className: "px-3 py-3 text-right tabular-nums text-rose-600"
  }, num(close)))))) : /*#__PURE__*/React.createElement(Empty, null, "Không có dữ liệu đơn hàng chi tiết cho khách này. Số dư nợ cuối kỳ: ", /*#__PURE__*/React.createElement("b", {
    className: "text-rose-600"
  }, num(close)))));
}

/* ───────── Công nợ NCC (tổng hợp → chi tiết) ───────── */
function DebtNcc() {
  const [detail, setDetail] = useState(null);
  const totalOpen = SUPPLIERS.reduce((s, x) => s + x.open, 0);
  if (detail) return /*#__PURE__*/React.createElement(NccDebtDetail, {
    sup: detail,
    onBack: () => setDetail(null)
  });
  const onExport = () => exportCSV("cong-no-nha-cung-cap", ["Tên nhà cung cấp", "Dư nợ đầu kỳ", "Phát sinh", "Thanh toán", "Dư nợ cuối kỳ"], SUPPLIERS.map(s => [s.name, s.open, s.ps, s.tt, s.open + s.ps - s.tt]));
  return /*#__PURE__*/React.createElement("div", {
    className: "space-y-4"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex flex-wrap items-center gap-2"
  }, /*#__PURE__*/React.createElement("input", {
    type: "date",
    defaultValue: "2026-06-01",
    className: field
  }), /*#__PURE__*/React.createElement("span", {
    className: "text-slate-400"
  }, "→"), /*#__PURE__*/React.createElement("input", {
    type: "date",
    defaultValue: "2026-06-16",
    className: field
  }), /*#__PURE__*/React.createElement("select", {
    className: field
  }, /*#__PURE__*/React.createElement("option", null, "Tất cả nhà cung cấp"), SUPPLIERS.filter(s => s.code).map(s => /*#__PURE__*/React.createElement("option", {
    key: s.code
  }, s.name))), /*#__PURE__*/React.createElement("button", {
    className: blueBtn
  }, /*#__PURE__*/React.createElement(Search, {
    className: "h-4 w-4"
  }), " Lọc"), /*#__PURE__*/React.createElement("div", {
    className: "ml-auto flex gap-2"
  }, /*#__PURE__*/React.createElement(PrintBtn, null), /*#__PURE__*/React.createElement(ExportBtn, {
    onClick: onExport
  }))), /*#__PURE__*/React.createElement("div", {
    className: "text-center"
  }, /*#__PURE__*/React.createElement("h2", {
    className: "text-lg font-bold uppercase text-slate-800"
  }, "Báo cáo tổng hợp công nợ nhà cung cấp"), /*#__PURE__*/React.createElement("p", {
    className: "text-sm text-slate-500"
  }, "Từ ngày 01/06/2026 đến ngày 16/06/2026")), /*#__PURE__*/React.createElement("div", {
    className: "overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm"
  }, /*#__PURE__*/React.createElement("table", {
    className: "w-full text-sm",
    style: {
      minWidth: 760
    }
  }, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", {
    className: "bg-slate-800 text-xs font-medium text-slate-100"
  }, /*#__PURE__*/React.createElement("th", {
    rowSpan: 2,
    className: "px-3 py-2 text-left"
  }, "Tên nhà cung cấp"), /*#__PURE__*/React.createElement("th", {
    rowSpan: 2,
    className: "border-l border-slate-600 px-3 py-2 text-right"
  }, "Số dư nợ đầu kỳ"), /*#__PURE__*/React.createElement("th", {
    colSpan: 2,
    className: "border-l border-slate-600 px-3 py-2 text-center"
  }, "Phát sinh trong kỳ"), /*#__PURE__*/React.createElement("th", {
    rowSpan: 2,
    className: "border-l border-slate-600 px-3 py-2 text-right"
  }, "Số dư nợ cuối kỳ")), /*#__PURE__*/React.createElement("tr", {
    className: "bg-slate-700 text-xs font-medium text-slate-200"
  }, /*#__PURE__*/React.createElement("th", {
    className: "border-l border-slate-600 px-3 py-1.5 text-right"
  }, "Số phát sinh"), /*#__PURE__*/React.createElement("th", {
    className: "px-3 py-1.5 text-right"
  }, "Thanh toán"))), /*#__PURE__*/React.createElement("tbody", {
    className: "divide-y divide-slate-100"
  }, SUPPLIERS.map((s, i) => {
    const close = s.open + s.ps - s.tt;
    return /*#__PURE__*/React.createElement("tr", {
      key: i,
      className: "hover:bg-slate-50/60"
    }, /*#__PURE__*/React.createElement("td", {
      className: "px-3 py-3"
    }, s.code ? /*#__PURE__*/React.createElement("button", {
      onClick: () => setDetail(s),
      className: "font-medium text-blue-700 underline-offset-2 hover:underline"
    }, s.name) : /*#__PURE__*/React.createElement("span", {
      className: "text-slate-600"
    }, s.name)), /*#__PURE__*/React.createElement("td", {
      className: "border-l border-slate-100 px-3 py-3 text-right tabular-nums text-slate-700"
    }, num(s.open)), /*#__PURE__*/React.createElement("td", {
      className: "border-l border-slate-100 px-3 py-3 text-right tabular-nums text-slate-600"
    }, num(s.ps)), /*#__PURE__*/React.createElement("td", {
      className: "px-3 py-3 text-right tabular-nums text-slate-600"
    }, num(s.tt)), /*#__PURE__*/React.createElement("td", {
      className: "border-l border-slate-100 px-3 py-3 text-right font-semibold tabular-nums text-rose-600"
    }, num(close)));
  })), /*#__PURE__*/React.createElement("tfoot", null, /*#__PURE__*/React.createElement("tr", {
    className: "bg-amber-50 font-bold"
  }, /*#__PURE__*/React.createElement("td", {
    className: "px-3 py-3 text-center text-slate-700"
  }, "TỔNG CỘNG"), /*#__PURE__*/React.createElement("td", {
    className: "border-l border-slate-100 px-3 py-3 text-right tabular-nums text-slate-800"
  }, num(totalOpen)), /*#__PURE__*/React.createElement("td", {
    className: "border-l border-slate-100 px-3 py-3 text-right tabular-nums"
  }, "0"), /*#__PURE__*/React.createElement("td", {
    className: "px-3 py-3 text-right tabular-nums"
  }, "0"), /*#__PURE__*/React.createElement("td", {
    className: "border-l border-slate-100 px-3 py-3 text-right tabular-nums text-rose-600"
  }, num(totalOpen)))))));
}
function NccDebtDetail({
  sup,
  onBack
}) {
  const lots = SUP_DETAIL[sup.code] || [];
  return /*#__PURE__*/React.createElement("div", {
    className: "space-y-4"
  }, /*#__PURE__*/React.createElement("button", {
    onClick: onBack,
    className: "inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800"
  }, /*#__PURE__*/React.createElement(ArrowLeft, {
    className: "h-4 w-4"
  }), " Quay lại báo cáo tổng hợp"), /*#__PURE__*/React.createElement(Card, null, /*#__PURE__*/React.createElement("h3", {
    className: "mb-4 text-base font-semibold text-slate-800"
  }, "Thông tin nhà cung cấp"), /*#__PURE__*/React.createElement("div", {
    className: "grid grid-cols-1 gap-y-2 text-sm sm:grid-cols-2"
  }, /*#__PURE__*/React.createElement("p", null, /*#__PURE__*/React.createElement("span", {
    className: "text-slate-500"
  }, "Mã NCC:"), " ", /*#__PURE__*/React.createElement("b", {
    className: "text-slate-800"
  }, sup.code)), /*#__PURE__*/React.createElement("p", null, /*#__PURE__*/React.createElement("span", {
    className: "text-slate-500"
  }, "Địa chỉ:"), " ", /*#__PURE__*/React.createElement("b", {
    className: "text-slate-800"
  }, sup.addr || "—")), /*#__PURE__*/React.createElement("p", null, /*#__PURE__*/React.createElement("span", {
    className: "text-slate-500"
  }, "Tên nhà cung cấp:"), " ", /*#__PURE__*/React.createElement("b", {
    className: "text-slate-800"
  }, sup.name)), /*#__PURE__*/React.createElement("p", null, /*#__PURE__*/React.createElement("span", {
    className: "text-slate-500"
  }, "Điện thoại:"), " ", /*#__PURE__*/React.createElement("b", {
    className: "text-slate-800"
  }, sup.phone || "—")), /*#__PURE__*/React.createElement("p", null, /*#__PURE__*/React.createElement("span", {
    className: "text-slate-500"
  }, "Tổng dư nợ:"), " ", /*#__PURE__*/React.createElement("b", {
    className: "text-rose-600"
  }, num(sup.open))))), /*#__PURE__*/React.createElement(Card, {
    title: "Danh sách lô hàng có dư nợ / thanh toán dư"
  }, lots.length ? /*#__PURE__*/React.createElement("div", {
    className: "-mx-5 -mb-5 overflow-x-auto"
  }, /*#__PURE__*/React.createElement("table", {
    className: "w-full text-sm",
    style: {
      minWidth: 1000
    }
  }, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", {
    className: "border-b border-slate-100 bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500"
  }, /*#__PURE__*/React.createElement("th", {
    className: "px-3 py-2.5"
  }, "Ngày nhập"), /*#__PURE__*/React.createElement("th", {
    className: "px-3 py-2.5"
  }, "Mã phiếu nhập"), /*#__PURE__*/React.createElement("th", {
    className: "px-3 py-2.5"
  }, "Mã lô"), /*#__PURE__*/React.createElement("th", {
    className: "px-3 py-2.5"
  }, "Sản phẩm"), /*#__PURE__*/React.createElement("th", {
    className: "px-3 py-2.5 text-right"
  }, "SL"), /*#__PURE__*/React.createElement("th", {
    className: "px-3 py-2.5 text-right"
  }, "Giá nhập"), /*#__PURE__*/React.createElement("th", {
    className: "px-3 py-2.5 text-right"
  }, "Tổng tiền"), /*#__PURE__*/React.createElement("th", {
    className: "px-3 py-2.5 text-right"
  }, "Đã thanh toán"), /*#__PURE__*/React.createElement("th", {
    className: "px-3 py-2.5 text-right"
  }, "Còn nợ"), /*#__PURE__*/React.createElement("th", {
    className: "px-3 py-2.5"
  }, "Trạng thái"), /*#__PURE__*/React.createElement("th", {
    className: "px-3 py-2.5"
  }, "Người tạo"))), /*#__PURE__*/React.createElement("tbody", {
    className: "divide-y divide-slate-100"
  }, lots.map((l, i) => {
    const tot = l.cost * l.qty;
    return /*#__PURE__*/React.createElement("tr", {
      key: i,
      className: "hover:bg-slate-50/60"
    }, /*#__PURE__*/React.createElement("td", {
      className: "px-3 py-3 text-slate-500"
    }, l.date), /*#__PURE__*/React.createElement("td", {
      className: "px-3 py-3 font-mono text-xs text-slate-600"
    }, l.slip), /*#__PURE__*/React.createElement("td", {
      className: "px-3 py-3 font-mono text-xs text-slate-500"
    }, l.lot), /*#__PURE__*/React.createElement("td", {
      className: "px-3 py-3 text-slate-800"
    }, l.prod, /*#__PURE__*/React.createElement("br", null), /*#__PURE__*/React.createElement("span", {
      className: "text-xs text-slate-400"
    }, l.sku)), /*#__PURE__*/React.createElement("td", {
      className: "px-3 py-3 text-right tabular-nums text-slate-600"
    }, l.qty), /*#__PURE__*/React.createElement("td", {
      className: "px-3 py-3 text-right tabular-nums text-slate-600"
    }, num(l.cost)), /*#__PURE__*/React.createElement("td", {
      className: "px-3 py-3 text-right font-medium tabular-nums text-slate-800"
    }, num(tot)), /*#__PURE__*/React.createElement("td", {
      className: "px-3 py-3 text-right tabular-nums text-emerald-600"
    }, num(l.paid)), /*#__PURE__*/React.createElement("td", {
      className: "px-3 py-3 text-right font-semibold tabular-nums text-rose-600"
    }, num(tot - l.paid)), /*#__PURE__*/React.createElement("td", {
      className: "px-3 py-3"
    }, /*#__PURE__*/React.createElement(Pill, {
      map: PAY_NCC,
      value: l.pay
    })), /*#__PURE__*/React.createElement("td", {
      className: "px-3 py-3 text-slate-500"
    }, l.staff));
  })))) : /*#__PURE__*/React.createElement(Empty, null, "Không có dữ liệu lô hàng chi tiết. Tổng dư nợ cuối kỳ: ", /*#__PURE__*/React.createElement("b", {
    className: "text-rose-600"
  }, num(sup.open)))));
}

/* ───────── Finance ───────── */
function VoucherModal({
  onClose,
  onSave
}) {
  const [kind, setKind] = useState("Thu");
  const [acc, setAcc] = useState("Tiền mặt");
  const [amount, setAmount] = useState(0);
  const [note, setNote] = useState("");
  const can = amount > 0 && note.trim();
  return /*#__PURE__*/React.createElement(Modal, {
    title: "Lập phiếu thu / chi",
    onClose: onClose,
    maxW: "max-w-lg",
    footer: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("button", {
      onClick: onClose,
      className: ghostBtn
    }, "Hủy"), /*#__PURE__*/React.createElement("button", {
      onClick: () => can && onSave({
        date: "16/06/2026",
        kind,
        acc,
        note,
        amount: kind === "Thu" ? amount : -amount
      }),
      disabled: !can,
      className: blueBtn + " disabled:bg-slate-300"
    }, /*#__PURE__*/React.createElement(Save, {
      className: "h-4 w-4"
    }), " Lưu phiếu"))
  }, /*#__PURE__*/React.createElement("div", {
    className: "space-y-4"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: "mb-1 block text-sm font-medium text-slate-700"
  }, "Loại phiếu"), /*#__PURE__*/React.createElement("div", {
    className: "flex gap-2"
  }, ["Thu", "Chi"].map(k => /*#__PURE__*/React.createElement("button", {
    key: k,
    onClick: () => setKind(k),
    className: `flex-1 rounded-lg px-3 py-2 text-sm ring-1 ring-inset transition ${kind === k ? k === "Thu" ? "bg-emerald-600 text-white ring-emerald-600" : "bg-rose-600 text-white ring-rose-600" : "bg-white text-slate-600 ring-slate-200 hover:bg-slate-50"}`
  }, k === "Thu" ? "Phiếu thu" : "Phiếu chi")))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: "mb-1 block text-sm font-medium text-slate-700"
  }, "Tài khoản"), /*#__PURE__*/React.createElement("select", {
    className: inputF,
    value: acc,
    onChange: e => setAcc(e.target.value)
  }, /*#__PURE__*/React.createElement("option", null, "Tiền mặt"), /*#__PURE__*/React.createElement("option", null, "TCB · Công ty"), /*#__PURE__*/React.createElement("option", null, "TCB · PAT"))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: "mb-1 block text-sm font-medium text-slate-700"
  }, "Số tiền"), /*#__PURE__*/React.createElement(NumInput, {
    className: inputF,
    value: amount,
    onChange: setAmount
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: "mb-1 block text-sm font-medium text-slate-700"
  }, "Nội dung"), /*#__PURE__*/React.createElement("input", {
    className: inputF,
    value: note,
    placeholder: "VD: Thu tiền đơn DH...",
    onChange: e => setNote(e.target.value)
  }))));
}
function Finance() {
  const notify = useToast();
  const [txns, setTxns] = useState(TXNS);
  const [modal, setModal] = useState(false);
  return /*#__PURE__*/React.createElement("div", {
    className: "space-y-4"
  }, /*#__PURE__*/React.createElement("div", {
    className: "grid grid-cols-2 gap-4 lg:grid-cols-4"
  }, /*#__PURE__*/React.createElement(StatCard, {
    label: "TCB · Công ty",
    value: vndShort(56358134),
    icon: CreditCard
  }), /*#__PURE__*/React.createElement(StatCard, {
    label: "TCB · PAT",
    value: vndShort(1303668374),
    icon: CreditCard,
    tone: "accent"
  }), /*#__PURE__*/React.createElement(StatCard, {
    label: "Tiền mặt",
    value: vndShort(273100000),
    icon: Wallet
  }), /*#__PURE__*/React.createElement(StatCard, {
    label: "Tổng số dư",
    value: vndShort(1633126508),
    tone: "pos",
    icon: TrendingUp
  })), /*#__PURE__*/React.createElement(Card, {
    title: "Phiếu thu / chi gần đây",
    right: /*#__PURE__*/React.createElement("button", {
      onClick: () => setModal(true),
      className: "inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700"
    }, /*#__PURE__*/React.createElement(Plus, {
      className: "h-4 w-4"
    }), " Lập phiếu")
  }, /*#__PURE__*/React.createElement("div", {
    className: "-mx-5 -mb-5"
  }, /*#__PURE__*/React.createElement(TableShell, {
    head: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(Th, null, "Ngày"), /*#__PURE__*/React.createElement(Th, null, "Loại"), /*#__PURE__*/React.createElement(Th, null, "Nội dung"), /*#__PURE__*/React.createElement(Th, null, "Tài khoản"), /*#__PURE__*/React.createElement(Th, {
      right: true
    }, "Số tiền"))
  }, txns.map((t, i) => /*#__PURE__*/React.createElement("tr", {
    key: i,
    className: "hover:bg-slate-50/60"
  }, /*#__PURE__*/React.createElement("td", {
    className: "px-4 py-3 text-slate-500"
  }, t.date), /*#__PURE__*/React.createElement("td", {
    className: "px-4 py-3"
  }, /*#__PURE__*/React.createElement("span", {
    className: `rounded px-1.5 py-0.5 text-xs font-medium ${t.amount >= 0 ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`
  }, t.kind)), /*#__PURE__*/React.createElement("td", {
    className: "px-4 py-3 text-slate-700"
  }, t.note), /*#__PURE__*/React.createElement("td", {
    className: "px-4 py-3 text-slate-500"
  }, t.acc), /*#__PURE__*/React.createElement("td", {
    className: `px-4 py-3 text-right font-medium tabular-nums ${t.amount >= 0 ? "text-emerald-600" : "text-rose-600"}`
  }, t.amount >= 0 ? "+" : "", vnd(t.amount))))))), modal && /*#__PURE__*/React.createElement(VoucherModal, {
    onClose: () => setModal(false),
    onSave: v => {
      setTxns(p => [v, ...p]);
      notify("Đã lập phiếu " + (v.amount >= 0 ? "thu" : "chi"));
      setModal(false);
    }
  }));
}

/* ───────── Reports ───────── */
function ReportSales() {
  const sum = SALES_BY_DAY.reduce((a, r) => ({
    n: a.n + r.n,
    rev: a.rev + r.rev,
    paid: a.paid + r.paid
  }), {
    n: 0,
    rev: 0,
    paid: 0
  });
  return /*#__PURE__*/React.createElement("div", {
    className: "space-y-4"
  }, /*#__PURE__*/React.createElement("p", {
    className: "text-sm text-slate-500"
  }, "Mục đích: nhìn ra lỗ / lãi từng đơn hàng theo ngày."), /*#__PURE__*/React.createElement("div", {
    className: "flex flex-wrap items-end gap-2"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: "mb-1 block text-xs font-medium text-slate-500"
  }, "Từ ngày"), /*#__PURE__*/React.createElement("input", {
    type: "date",
    defaultValue: "2026-06-01",
    className: field
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: "mb-1 block text-xs font-medium text-slate-500"
  }, "Đến ngày"), /*#__PURE__*/React.createElement("input", {
    type: "date",
    defaultValue: "2026-06-16",
    className: field
  })), /*#__PURE__*/React.createElement("select", {
    className: field
  }, ["Nhân viên: Tất cả", "PAT", "NGOC HA", "SALE01"].map(s => /*#__PURE__*/React.createElement("option", {
    key: s
  }, s))), /*#__PURE__*/React.createElement("select", {
    className: field
  }, ["Kho: Tất cả", "Kho HH", "Kho TB"].map(s => /*#__PURE__*/React.createElement("option", {
    key: s
  }, s)))), /*#__PURE__*/React.createElement("div", {
    className: "grid grid-cols-2 gap-4 lg:grid-cols-4"
  }, /*#__PURE__*/React.createElement(StatCard, {
    label: "Thành tiền",
    value: sum.n,
    icon: ShoppingCart
  }), /*#__PURE__*/React.createElement(StatCard, {
    label: "Doanh thu",
    value: vndShort(sum.rev),
    tone: "accent"
  }), /*#__PURE__*/React.createElement(StatCard, {
    label: "Vốn nhập",
    value: vndShort(sum.rev * 0.78)
  }), /*#__PURE__*/React.createElement(StatCard, {
    label: "Lợi nhuận",
    value: vndShort(sum.rev * 0.22),
    tone: "pos"
  })), /*#__PURE__*/React.createElement(Card, {
    title: "Chi tiết theo ngày"
  }, /*#__PURE__*/React.createElement("div", {
    className: "-mx-5 -mb-5"
  }, /*#__PURE__*/React.createElement(TableShell, {
    head: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(Th, null, "Ngày"), /*#__PURE__*/React.createElement(Th, {
      right: true
    }, "Số đơn"), /*#__PURE__*/React.createElement(Th, {
      right: true
    }, "Doanh thu"), /*#__PURE__*/React.createElement(Th, {
      right: true
    }, "Vốn nhập"), /*#__PURE__*/React.createElement(Th, {
      right: true
    }, "Lợi nhuận"), /*#__PURE__*/React.createElement(Th, {
      right: true
    }, "Còn nợ"))
  }, SALES_BY_DAY.map((r, i) => {
    const cost = Math.round(r.rev * 0.78);
    return /*#__PURE__*/React.createElement("tr", {
      key: i,
      className: "hover:bg-slate-50/60"
    }, /*#__PURE__*/React.createElement("td", {
      className: "px-4 py-3 text-slate-500"
    }, r.day), /*#__PURE__*/React.createElement("td", {
      className: "px-4 py-3 text-right tabular-nums text-slate-600"
    }, r.n), /*#__PURE__*/React.createElement("td", {
      className: "px-4 py-3 text-right font-medium tabular-nums text-slate-800"
    }, vnd(r.rev)), /*#__PURE__*/React.createElement("td", {
      className: "px-4 py-3 text-right tabular-nums text-slate-500"
    }, vnd(cost)), /*#__PURE__*/React.createElement("td", {
      className: "px-4 py-3 text-right font-medium tabular-nums text-emerald-600"
    }, vnd(r.rev - cost)), /*#__PURE__*/React.createElement("td", {
      className: "px-4 py-3 text-right tabular-nums text-rose-600"
    }, vnd(r.rev - r.paid)));
  })))));
}

/* báo cáo sản phẩm đặt hàng (theo mẫu) */
function ReportPreorder() {
  const [q, setQ] = useState("");
  const rows = PREORDER.filter(r => !q || `${r.prod} ${r.sku}`.toLowerCase().includes(q.toLowerCase()));
  const onExport = () => exportCSV("bao-cao-san-pham-dat-hang", ["STT", "Mã SP", "Tên sản phẩm", "SL đặt", "SL trong kho", "SL cần mua", "SL đơn hàng"], rows.map((r, i) => [i + 1, r.sku, r.prod, r.ordered, r.stock, Math.max(0, r.ordered - r.stock), r.orders]));
  return /*#__PURE__*/React.createElement("div", {
    className: "space-y-4"
  }, /*#__PURE__*/React.createElement("h2", {
    className: "text-lg font-semibold text-slate-800"
  }, "Báo cáo sản phẩm đặt hàng"), /*#__PURE__*/React.createElement("div", {
    className: "flex flex-wrap items-end gap-3"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: "mb-1 block text-xs font-medium text-slate-500"
  }, "Từ ngày"), /*#__PURE__*/React.createElement("input", {
    type: "date",
    defaultValue: "2026-06-01",
    className: field
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: "mb-1 block text-xs font-medium text-slate-500"
  }, "Đến ngày"), /*#__PURE__*/React.createElement("input", {
    type: "date",
    defaultValue: "2026-06-16",
    className: field
  })), /*#__PURE__*/React.createElement("div", {
    className: "min-w-[180px] flex-1"
  }, /*#__PURE__*/React.createElement("label", {
    className: "mb-1 block text-xs font-medium text-slate-500"
  }, "Tìm kiếm sản phẩm"), /*#__PURE__*/React.createElement("input", {
    value: q,
    onChange: e => setQ(e.target.value),
    placeholder: "Tên sản phẩm…",
    className: `${field} w-full`
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: "mb-1 block text-xs font-medium text-slate-500"
  }, "Trạng thái đơn hàng"), /*#__PURE__*/React.createElement("select", {
    className: field
  }, /*#__PURE__*/React.createElement("option", null, "Đang xử lý"), /*#__PURE__*/React.createElement("option", null, "Tất cả"), /*#__PURE__*/React.createElement("option", null, "Đã hoàn thành"))), /*#__PURE__*/React.createElement("button", {
    className: blueBtn + " py-2"
  }, /*#__PURE__*/React.createElement(Search, {
    className: "h-4 w-4"
  }), " Lọc"), /*#__PURE__*/React.createElement(PrintBtn, null), /*#__PURE__*/React.createElement(ExportBtn, {
    onClick: onExport
  })), /*#__PURE__*/React.createElement(TableShell, {
    head: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(Th, {
      center: true,
      style: {
        width: 50
      }
    }, "STT"), /*#__PURE__*/React.createElement(Th, null, "Mã sản phẩm"), /*#__PURE__*/React.createElement(Th, {
      style: {
        minWidth: 260
      }
    }, "Tên sản phẩm"), /*#__PURE__*/React.createElement(Th, {
      right: true
    }, "Số lượng đặt"), /*#__PURE__*/React.createElement(Th, {
      right: true
    }, "Số lượng trong kho"), /*#__PURE__*/React.createElement(Th, {
      right: true
    }, "Số lượng cần mua"), /*#__PURE__*/React.createElement(Th, {
      right: true
    }, "Số lượng đơn hàng"))
  }, rows.map((r, i) => {
    const need = Math.max(0, r.ordered - r.stock);
    return /*#__PURE__*/React.createElement("tr", {
      key: i,
      className: "hover:bg-slate-50/60"
    }, /*#__PURE__*/React.createElement("td", {
      className: "px-3 py-3 text-center text-slate-500"
    }, i + 1), /*#__PURE__*/React.createElement("td", {
      className: "px-3 py-3 font-mono text-xs text-slate-600"
    }, r.sku), /*#__PURE__*/React.createElement("td", {
      className: "px-3 py-3 text-slate-800"
    }, r.prod), /*#__PURE__*/React.createElement("td", {
      className: "px-3 py-3 text-right tabular-nums text-slate-700"
    }, r.ordered), /*#__PURE__*/React.createElement("td", {
      className: "px-3 py-3 text-right tabular-nums text-slate-500"
    }, r.stock), /*#__PURE__*/React.createElement("td", {
      className: `px-3 py-3 text-right font-semibold tabular-nums ${need > 0 ? "text-rose-600" : "text-slate-300"}`
    }, need > 0 ? need : 0), /*#__PURE__*/React.createElement("td", {
      className: "px-3 py-3 text-right tabular-nums text-slate-600"
    }, r.orders));
  })));
}
function ReportStaff() {
  const data = STAFF_RANK.map(s => {
    const collected = Math.round(s.rev * s.collected);
    return {
      ...s,
      returned: Math.round(s.rev * 0.03),
      collected,
      remain: s.rev - collected
    };
  });
  const onExport = () => exportCSV("bao-cao-nhan-vien", ["Nhân viên", "Số đơn", "Số khách", "Doanh thu", "Tiền hàng trả lại", "Đã thu", "Còn lại"], data.map(s => [s.name, s.orders, s.custs, s.rev, s.returned, s.collected, s.remain]));
  return /*#__PURE__*/React.createElement("div", {
    className: "space-y-4"
  }, /*#__PURE__*/React.createElement("h2", {
    className: "text-lg font-semibold text-slate-800"
  }, "Báo cáo nhân viên"), /*#__PURE__*/React.createElement("div", {
    className: "flex flex-wrap items-end gap-3"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: "mb-1 block text-xs font-medium text-slate-500"
  }, "Từ ngày"), /*#__PURE__*/React.createElement("input", {
    type: "date",
    defaultValue: "2026-06-01",
    className: field
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: "mb-1 block text-xs font-medium text-slate-500"
  }, "Đến ngày"), /*#__PURE__*/React.createElement("input", {
    type: "date",
    defaultValue: "2026-06-16",
    className: field
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: "mb-1 block text-xs font-medium text-slate-500"
  }, "Nhân viên"), /*#__PURE__*/React.createElement("select", {
    className: field
  }, /*#__PURE__*/React.createElement("option", null, "Tất cả"), STAFF_RANK.map(s => /*#__PURE__*/React.createElement("option", {
    key: s.name
  }, s.name)))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: "mb-1 block text-xs font-medium text-slate-500"
  }, "Kho"), /*#__PURE__*/React.createElement("select", {
    className: field
  }, ["Tất cả", "Kho HH", "Kho TB"].map(k => /*#__PURE__*/React.createElement("option", {
    key: k
  }, k)))), /*#__PURE__*/React.createElement("button", {
    className: blueBtn + " py-2"
  }, /*#__PURE__*/React.createElement(Search, {
    className: "h-4 w-4"
  }), " Lọc"), /*#__PURE__*/React.createElement(PrintBtn, null), /*#__PURE__*/React.createElement(ExportBtn, {
    onClick: onExport
  })), /*#__PURE__*/React.createElement(TableShell, {
    minW: "900px",
    head: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(Th, {
      style: {
        minWidth: 140
      }
    }, "Nhân viên"), /*#__PURE__*/React.createElement(Th, {
      right: true
    }, "Số đơn"), /*#__PURE__*/React.createElement(Th, {
      right: true
    }, "Số khách"), /*#__PURE__*/React.createElement(Th, {
      right: true
    }, "Doanh thu"), /*#__PURE__*/React.createElement(Th, {
      right: true
    }, "Tiền hàng trả lại"), /*#__PURE__*/React.createElement(Th, {
      right: true
    }, "Đã thu"), /*#__PURE__*/React.createElement(Th, {
      right: true
    }, "Còn lại"))
  }, data.map(s => /*#__PURE__*/React.createElement("tr", {
    key: s.name,
    className: "hover:bg-slate-50/60"
  }, /*#__PURE__*/React.createElement("td", {
    className: "px-4 py-3 font-medium text-slate-800"
  }, s.name), /*#__PURE__*/React.createElement("td", {
    className: "px-4 py-3 text-right tabular-nums text-slate-600"
  }, s.orders), /*#__PURE__*/React.createElement("td", {
    className: "px-4 py-3 text-right tabular-nums text-slate-600"
  }, s.custs), /*#__PURE__*/React.createElement("td", {
    className: "px-4 py-3 text-right font-medium tabular-nums text-slate-800"
  }, vnd(s.rev)), /*#__PURE__*/React.createElement("td", {
    className: "px-4 py-3 text-right tabular-nums text-amber-600"
  }, vnd(s.returned)), /*#__PURE__*/React.createElement("td", {
    className: "px-4 py-3 text-right tabular-nums text-emerald-600"
  }, vnd(s.collected)), /*#__PURE__*/React.createElement("td", {
    className: `px-4 py-3 text-right tabular-nums ${s.remain > 0 ? "text-rose-600" : "text-slate-300"}`
  }, s.remain > 0 ? vnd(s.remain) : "—")))));
}
function Screen({
  active,
  setActive,
  orders,
  setOrders
}) {
  switch (active) {
    case "finance":
      return /*#__PURE__*/React.createElement(Finance, null);
    case "sales_draft":
      return /*#__PURE__*/React.createElement(SalesModule, {
        orders: orders,
        setOrders: setOrders,
        sub: "draft",
        setActive: setActive
      });
    case "sales_orders":
      return /*#__PURE__*/React.createElement(SalesModule, {
        orders: orders,
        setOrders: setOrders,
        sub: "orders",
        setActive: setActive
      });
    case "pur_create":
      return /*#__PURE__*/React.createElement(PurchaseCreate, {
        onBack: () => setActive("pur_list")
      });
    case "pur_list":
      return /*#__PURE__*/React.createElement(PurchaseList, {
        onNew: () => setActive("pur_create"),
        onEdit: () => setActive("pur_create")
      });
    case "wh_in":
      return /*#__PURE__*/React.createElement(WhIn, null);
    case "wh_out":
      return /*#__PURE__*/React.createElement(WhOut, null);
    case "wh_stock":
      return /*#__PURE__*/React.createElement(Stock, null);
    case "pc_products":
      return /*#__PURE__*/React.createElement(ProductsTab, null);
    case "pc_customers":
      return /*#__PURE__*/React.createElement(CustomersTab, null);
    case "pc_suppliers":
      return /*#__PURE__*/React.createElement(Suppliers, null);
    case "debt_cust":
      return /*#__PURE__*/React.createElement(DebtCust, null);
    case "debt_ncc":
      return /*#__PURE__*/React.createElement(DebtNcc, null);
    case "dashboard":
      return /*#__PURE__*/React.createElement(Dashboard, null);
    case "rp_sales":
      return /*#__PURE__*/React.createElement(ReportSales, null);
    case "rp_preorder":
      return /*#__PURE__*/React.createElement(ReportPreorder, null);
    case "rp_staff":
      return /*#__PURE__*/React.createElement(ReportStaff, null);
    default:
      return /*#__PURE__*/React.createElement(Dashboard, null);
  }
}

/* ───────── Shell ───────── */
function CartLogo({
  className = "h-7 w-7"
}) {
  return /*#__PURE__*/React.createElement("svg", {
    viewBox: "0 0 64 64",
    className: className,
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    "aria-label": "BANLETAIKHO.vn"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M8 12h10l3 5h33l-7 22H24L19 17",
    stroke: "#FF3B0F",
    strokeWidth: "6",
    strokeLinejoin: "round",
    strokeLinecap: "round"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M32 22v12M32 22l-6 6M32 22l6 6",
    stroke: "#FF3B0F",
    strokeWidth: "5",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "26",
    cy: "48",
    r: "4",
    fill: "#FF3B0F"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "46",
    cy: "48",
    r: "4",
    fill: "#FF3B0F"
  }));
}
function App() {
  const [active, setActive] = useState("sales_orders");
  const [open, setOpen] = useState({
    sales: true
  });
  const [orders, setOrders] = useState(INIT_ORDERS);
  const title = LABELS[active] || "";
  return /*#__PURE__*/React.createElement(ToastHost, null, /*#__PURE__*/React.createElement("div", {
    className: "flex min-h-screen bg-slate-100 font-sans text-slate-900",
    style: {
      fontFamily: "Inter, ui-sans-serif, system-ui, 'Segoe UI', Roboto, Arial, sans-serif"
    }
  }, /*#__PURE__*/React.createElement("aside", {
    className: "flex w-64 shrink-0 flex-col bg-slate-900"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex flex-col items-center gap-2 px-5 py-5 text-center"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex h-9 w-9 items-center justify-center rounded-lg bg-white"
  }, /*#__PURE__*/React.createElement(CartLogo, null)), /*#__PURE__*/React.createElement("div", {
    className: "leading-tight"
  }, /*#__PURE__*/React.createElement("p", {
    className: "text-sm font-bold text-white"
  }, "BLTK Hải Phòng"), /*#__PURE__*/React.createElement("p", {
    className: "text-[11px] font-medium tracking-wide text-orange-400"
  }, "BANLETAIKHO.vn"))), /*#__PURE__*/React.createElement("nav", {
    className: "flex-1 space-y-0.5 overflow-y-auto px-3 py-2"
  }, NAV.map(item => {
    const I = item.icon;
    if (!item.children) {
      const on = active === item.key;
      return /*#__PURE__*/React.createElement("button", {
        key: item.key,
        onClick: () => setActive(item.key),
        className: `flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition ${on ? "bg-blue-600 font-medium text-white" : "text-slate-300 hover:bg-slate-800"}`
      }, /*#__PURE__*/React.createElement(I, {
        className: "h-4 w-4 shrink-0"
      }), /*#__PURE__*/React.createElement("span", {
        className: "flex-1 text-left"
      }, item.label));
    }
    const isOpen = !!open[item.key];
    const childOn = item.children.some(c => c.key === active);
    return /*#__PURE__*/React.createElement("div", {
      key: item.key
    }, /*#__PURE__*/React.createElement("button", {
      onClick: () => setOpen(o => ({
        ...o,
        [item.key]: !o[item.key]
      })),
      className: `flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition hover:bg-slate-800 ${childOn ? "text-white" : "text-slate-300"}`
    }, /*#__PURE__*/React.createElement(I, {
      className: "h-4 w-4 shrink-0"
    }), /*#__PURE__*/React.createElement("span", {
      className: "flex-1 text-left"
    }, item.label), /*#__PURE__*/React.createElement(ChevronDown, {
      className: `h-4 w-4 shrink-0 transition ${isOpen ? "rotate-180" : ""}`
    })), isOpen && /*#__PURE__*/React.createElement("div", {
      className: "mt-0.5 space-y-0.5 pl-7"
    }, item.children.map(c => /*#__PURE__*/React.createElement("button", {
      key: c.key,
      onClick: () => setActive(c.key),
      className: `block w-full rounded-lg px-3 py-1.5 text-left text-sm transition ${active === c.key ? "bg-blue-600 font-medium text-white" : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"}`
    }, c.label))));
  })), /*#__PURE__*/React.createElement("div", {
    className: "border-t border-slate-800 px-5 py-4"
  }, /*#__PURE__*/React.createElement("p", {
    className: "text-sm font-medium text-white"
  }, "PAT"), /*#__PURE__*/React.createElement("p", {
    className: "text-xs text-slate-400"
  }, "admin01 · Quản trị"))), /*#__PURE__*/React.createElement("div", {
    className: "flex min-w-0 flex-1 flex-col"
  }, /*#__PURE__*/React.createElement("header", {
    className: "flex items-center justify-between border-b border-slate-200 bg-white px-6 py-3.5"
  }, /*#__PURE__*/React.createElement("div", {
    className: "text-sm font-semibold text-slate-800"
  }, title), /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-2 text-sm"
  })), /*#__PURE__*/React.createElement("main", {
    className: "flex-1 overflow-auto p-6"
  }, /*#__PURE__*/React.createElement(Screen, {
    active: active,
    setActive: setActive,
    orders: orders,
    setOrders: setOrders
  })))));
}
export default App
