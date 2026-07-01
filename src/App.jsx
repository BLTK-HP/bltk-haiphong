import React, { useState, useMemo, useEffect } from 'react'
import * as XLSX from 'xlsx'
import PRODUCTS from './products.js'
import { useCollection, saveDoc, deleteDocument, batchSave } from './useFirestore.js'
import { collection, getDocs, deleteDoc, doc as fsDoc, where, writeBatch, query } from 'firebase/firestore'
import { db, storage, app as fbApp } from './firebase.js'
import { AuthProvider, useAuth, ROLES, ALLOWED, createUserProfile } from './useAuth.js'
import { auth } from './firebase.js'
import { getMessaging, getToken, onMessage } from 'firebase/messaging'
import { createUserWithEmailAndPassword } from 'firebase/auth'
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage'


import { LayoutDashboard, Home, ShoppingCart, Package, Truck, RotateCcw, BookText, Wallet, BarChart3, Smartphone, Plus, Minus, Search, Trash2, ArrowLeft, ArrowLeftRight, TrendingUp, ChevronRight, ChevronLeft, FileText, Globe, Sparkles, Store, Percent, CreditCard, UserCog, Printer, Pencil, ArrowDownToLine, Check, CheckCircle, Save, Eye, EyeOff, Warehouse, Upload, ChevronDown, X, Users, Image as ImageIcon, AlertTriangle, Copy, Settings, ArrowUpFromLine, Building2, PackageSearch, Layers, CornerUpLeft, RefreshCw, ReceiptText, Link2, Bell, LogOut } from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'


/* ───────── helpers ───────── */
const vnd = n => !n ? "" : new Intl.NumberFormat("vi-VN").format(Math.round(n));
const num = n => !n ? "" : new Intl.NumberFormat("vi-VN").format(Math.round(n));
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
const localToday = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`; };
const localMonthStart = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-01`; };
const parseViDate = s => {
  if (!s) return 0;
  const parts = String(s).split(" ");
  let dd,mm,yy,hh=0,mn=0;
  if (parts[0] && parts[0].includes("/")) {
    [dd,mm,yy] = parts[0].split("/"); if (parts[1]) [hh,mn] = parts[1].split(":");
  } else if (parts[1] && parts[1].includes("/")) {
    [dd,mm,yy] = parts[1].split("/"); if (parts[0]) [hh,mn] = parts[0].split(":");
  } else return 0;
  return new Date(+yy,+mm-1,+dd,+hh||0,+mn||0).getTime() || 0;
};
const CHANNELS = {
  Facebook: "bg-blue-50 text-blue-700 ring-blue-200",
  Zalo: "bg-sky-50 text-sky-700 ring-sky-200",
  TikTok: "bg-slate-900 text-white ring-slate-700",
  "Đến CH": "bg-slate-100 text-slate-600 ring-slate-200"
};
const ORDER_STATUS = {
  "Chờ giao hàng":  "bg-slate-100 text-slate-500 ring-slate-200",
  "Chờ xử lý":      "bg-[#FFFBEB] text-[#B45309] ring-[#FDE68A]",
  "Hoàn thành":     "bg-[#fef9f0] text-[#92400e] ring-[#b45309]",
  "Huỷ":            "bg-[#FBE9E7] text-[#9A1B0E] ring-[#F5C5BE]"
};
const ORDER_TABS = ["Tất cả", "Chờ xử lý", "Hoàn thành", "Huỷ"];
const PAY_STATUS = {
  "Đã đặt cọc":    "bg-slate-100 text-slate-500 ring-slate-200",
  "Chờ thanh toán": "bg-[#FFFBEB] text-[#B45309] ring-[#FDE68A]",
  "Đã thanh toán":  "bg-[#fef9f0] text-[#92400e] ring-[#b45309]",
};
const KHO_STATUS = {
  "Cần nhập":      "bg-slate-100 text-slate-500 ring-slate-200",
  "Cần xuất":      "bg-slate-100 text-slate-500 ring-slate-200",
  "Đã xử lý kho": "bg-[#fef9f0] text-[#92400e] ring-[#b45309]"
};
const DELIVERY = {
  "Đã giao hàng":   "bg-[#fef9f0] text-[#92400e] ring-[#b45309]",
  "Chưa giao hàng": "bg-slate-100 text-slate-500 ring-slate-200"
};
const normalizeDelivery = v => {
  if (!v || v === "Chưa giao" || v === "Sẵn sàng giao") return "Chưa giao hàng";
  if (v === "Đã giao") return "Đã giao hàng";
  return v;
};
const TIERS = {
  "Thường": "bg-slate-100 text-slate-600 ring-slate-200",
  "Bạc": "bg-zinc-100 text-zinc-600 ring-zinc-300",
  "Vàng": "bg-amber-50 text-amber-700 ring-amber-200",
  "Kim cương": "bg-cyan-50 text-cyan-700 ring-cyan-200"
};
const PAY_NCC = {
  "Đã thanh toán": "bg-amber-50 text-[#92400e] ring-amber-200",
  "Chưa thanh toán": "bg-amber-50 text-amber-700 ring-amber-200"
};
const APPROVE = {
  "Đã duyệt": "bg-amber-50 text-[#92400e] ring-amber-200",
  "Đã từ chối": "bg-rose-50 text-rose-700 ring-rose-200"
};

/* ───────── màu thu / chi ───────── */
const C_THU = "#047857"; // xanh lá đậm — tiền vào / doanh thu
const C_CHI = "#B91C1C"; // đỏ đô      — tiền ra / chi phí

/* ───────── data ───────── */
const mkOrder = o => ({
  expense: 0,
  importExpense: 0,
  paid: 0,
  delivery: "Chưa giao hàng",
  orderStatus: "",
  imported: false,
  exported: false,
  returned: false,
  draft: false,
  ...o
});
const INIT_ORDERS = [];

/* derived order fields */
function calc(o) {
  const subtotal = (o.items||[]).reduce((s, l) => s + Math.max(0, l.price * l.qty - (l.disc || 0)), 0);
  const custExpTotal = (o.custExpenses||[]).reduce((s,e) => s+(e.amount||0), 0) + (o.shippingFee||0) + (o.installFee||0) + (o.returnFee||0);
  const total = subtotal + custExpTotal;
  const totalCost = (o.items||[]).reduce((s, l) => s + (l.cost||0) * l.qty, 0);
  const remaining = total - (o.paid||0);
  const payDone = total > 0 && remaining <= 0;
  const pay = payDone ? "Đã thanh toán"
    : o.deliveryConfirmed ? "Chờ thanh toán"
    : "Đã đặt cọc";
  const khoXong = !!(o.imported && o.exported);
  const isCancel = o.orderStatus === "Huỷ" || o.orderStatus === "Hủy";
  const hasReturn = (o.returns||[]).length > 0;
  const partialDelivered = !khoXong && (o.items||[]).some(it => (it.deliveredQty||0) > 0);
  const orderStatus = isCancel ? "Huỷ"
    : hasReturn ? "Hoàn hàng"
    : (payDone && khoXong) ? "Hoàn thành"
    : partialDelivered ? "Đang giao"
    : o.deliveryConfirmed ? "Chờ xử lý"
    : "Chờ giao hàng";
  const compCostsTotal = (o.compCosts||[]).filter(c=>["Chi phí Ship hàng","Chi phí hoa hồng","Chi phí lắp đặt"].includes(c.type)).reduce((s,c)=>s+(c.amount||0),0);
  const profit = o.imported && o.exported ? total - (o.expense||0) - totalCost - (o.importExpense||0) - compCostsTotal : null;
  return { total, totalCost, remaining, pay, orderStatus, profit, compCostsTotal };
}
const CUSTOMERS = [
  {id:"KH001", name:"Anh Châu",   phone:"0989145440", addr:"5B/24/17 Khúc Thừa Dụ"},
  {id:"KH002", name:"Thuý Phạm",  phone:"0943460568", addr:"15/116 Nguyễn Đức Cảnh"},
  {id:"KH003", name:"Chú Thiệp",  phone:"0988590148", addr:"69/132 đường Vòng Vạn Mỹ"},
];

/* ── Bảng giá nhập NCC (sổ công nợ tháng 1-2/2026) ────────────────────────
   pat: các chuỗi cần xuất hiện trong tên sản phẩm để khớp
   from: ngày bắt đầu áp dụng giá này (DD/MM/YYYY)
   Quy tắc: ưu tiên pattern dài hơn (cụ thể hơn), rồi mới đến ngày gần nhất */
const SUPPLIER_COSTS = [
  // Bồn cầu AC-989
  { pat: ["AC-989VN", "AC-989/CW-MV"],                                   from: "02/01/2026", price: 4530000 },
  { pat: ["AC-989VN", "AC-989/CW-MV"],                                   from: "11/02/2026", price: 4570000 },
  { pat: ["AC-989/CW-S32"],                                              from: "29/01/2026", price: 5450000 },
  // Bồn cầu AC-902
  { pat: ["AC-902/CW-S32"],                                              from: "03/01/2026", price: 7050000 },
  { pat: ["AC-902VN"],                                                   from: "06/01/2026", price: 6850000 },
  // Bồn cầu AC-919
  { pat: ["AC-919VRN"],                                                  from: "13/01/2026", price: 8050000 },
  { pat: ["AC-919R/CW-S32", "AC-919/CW-S32"],                           from: "22/01/2026", price: 7550000 },
  // Bồn cầu AC-969
  { pat: ["AC-969VN"],                                                   from: "22/01/2026", price: 3800000 },
  { pat: ["AC-969/CW-S15"],                                              from: "03/02/2026", price: 4650000 },
  // Bồn cầu AC-602, AC-1032
  { pat: ["AC-602"],                                                     from: "22/01/2026", price: 3010000 },
  { pat: ["AC-1032"],                                                    from: "25/01/2026", price: 8650000 },
  // Lavabo — combo AL-289 + L-288VC (khớp trước, pattern dài hơn)
  { pat: ["L-289V/L-288VC", "L-289V/ L288VC", "AL-289V/ L288VC", "AL-289V/L-288VC"], from: "02/01/2026", price: 1704000 },
  // Lavabo chậu đơn lẻ
  { pat: ["AL-289V", "AL-289FC", "AL-289PC", "AL-289/"],                from: "02/01/2026", price: 1001000 },
  { pat: ["AL-312V", "AL-312FC", "AL-312PC", "AL-312/"],                from: "17/01/2026", price: 1130000 },
  { pat: ["AL-295"],                                                     from: "10/01/2026", price: 1371000 },
  { pat: ["AL-299"],                                                     from: "17/01/2026", price: 1987000 },
  { pat: ["AL-445"],                                                     from: "16/01/2026", price: 1915000 },
  { pat: ["AL-612"],                                                     from: "02/01/2026", price: 3514000 },
  { pat: ["AL-333"],                                                     from: "02/01/2026", price: 2116000 },
  { pat: ["AL-2216"],                                                    from: "10/01/2026", price: 1422000 },
  { pat: ["L-281V", "L281V", "L-281FC", "L-281PC"],                     from: "27/12/2025", price: 573000  },
  { pat: ["L-280V", "L-280FC", "L-280PC", "L280V", "L280FC"],           from: "16/01/2026", price: 392000  },
  { pat: ["L-282V", "L-282FC", "L-282PC", "L282FC", "L282PC"],          from: "03/01/2026", price: 492000  },
  { pat: ["L-285V", "L-285FC", "L-285PC", "L285FC"],                    from: "17/01/2026", price: 594000  },
  { pat: ["L-284V", "L-284FC", "L-284BC", "L-284PC", "L284FC", "L284BC"], from: "07/01/2026", price: 555000 },
  // Cây (drain arm) — đặt SAU combo để không bị overwrite
  { pat: ["L-288VD", "L288VD"],                                         from: "02/01/2026", price: 703000  },
  { pat: ["L-288VC", "L288VC"],                                         from: "02/01/2026", price: 703000  },
  { pat: ["L-298VC", "L298VC"],                                         from: "17/01/2026", price: 716000  },
  { pat: ["L-284VD", "L284VD"],                                         from: "03/02/2026", price: 572000  },
  // Vòi nước
  { pat: ["LFV-1402S-R", "1402S-R", "LFV-1402SR"],                     from: "02/01/2026", price: 1190000 },
  { pat: ["LFV-1402S-R", "1402S-R", "LFV-1402SR"],                     from: "04/02/2026", price: 1200000 },
  { pat: ["LFV-1402SH", "1402SH"],                                      from: "02/01/2026", price: 1550000 },
  { pat: ["LFV-612", "LFV612"],                                         from: "26/01/2026", price: 1750000 },
  { pat: ["LFV-1112", "LPV-1112", "LFV1112"],                          from: "16/01/2026", price: 1040000 },
  { pat: ["SHV-900", "SHV900"],                                         from: "02/02/2026", price: 2539000 },
  // Sen tắm
  { pat: ["BFV-3415T"],                                                  from: "05/01/2026", price: 7130000 },
  { pat: ["BFV-3415T"],                                                  from: "05/02/2026", price: 7170000 },
  { pat: ["BFV-3413T-3C", "3413T-3C"],                                  from: "03/01/2026", price: 2925000 },
  { pat: ["BFV-3413T-4C", "3413T-4C"],                                  from: "04/02/2026", price: 2750000 },
  { pat: ["BFV-3413T-8C", "3413T-8C"],                                  from: "07/02/2026", price: 2930000 },
  { pat: ["BFV-1115S-3C", "1115S-3C", "1115-3C"],                      from: "06/01/2026", price: 3946000 },
  { pat: ["BFV-1113S-8C", "1113S-8C", "1113-8C"],                      from: "04/02/2026", price: 1775000 },
  // Xịt
  { pat: ["KO-102A", "KO102A", "CW-102A", "102A"],                     from: "27/12/2025", price: 275000  },
  { pat: ["102M"],                                                       from: "27/12/2025", price: 367000  },
  { pat: ["105M", "105MP", "CW-105"],                                   from: "26/01/2026", price: 855000  },
  // Khác
  { pat: ["UF-8V", "UF8V"],                                             from: "06/01/2026", price: 1191000 },
  { pat: ["C-306", "C306"],                                             from: "22/01/2026", price: 2550000 },
];

function lookupImportCost(itemName, orderDateStr, costs) {
  if (!itemName) return null;
  const src = costs?.length ? costs : SUPPLIER_COSTS;
  const name = itemName.toLowerCase();
  const orderTs = parseViDate(orderDateStr);
  let best = null, bestLen = -1, bestTs = -1;
  for (const entry of src) {
    const entryTs = parseViDate(entry.from);
    if (orderTs && entryTs > orderTs) continue;
    for (const p of entry.pat) {
      if (!name.includes(p.toLowerCase())) continue;
      if (p.length > bestLen || (p.length === bestLen && entryTs > bestTs)) {
        bestLen = p.length; bestTs = entryTs; best = entry;
      }
    }
  }
  return best ? best.price : null;
}

/* nhà cung cấp — tên đầy đủ + liên hệ + công nợ */
const SUPPLIERS = [{
  code: "0007",
  name: "AS LÊ HUY HẢI PHÒNG",
  phone: "",
  addr: "",
  open: 0,
  ps: 0,
  tt: 0
}, {
  code: "0008",
  name: "BANCOOT",
  phone: "",
  addr: "",
  open: 0,
  ps: 0,
  tt: 0
}, {
  code: "0016",
  name: "BLTK SG",
  phone: "",
  addr: "",
  open: 0,
  ps: 0,
  tt: 0
}, {
  code: "0004",
  name: "BOSCH BLUEHOME",
  phone: "",
  addr: "",
  open: 0,
  ps: 0,
  tt: 0
}, {
  code: "0024",
  name: "BOSCH HD",
  phone: "",
  addr: "",
  open: 0,
  ps: 0,
  tt: 0
}, {
  code: "0025",
  name: "CANZY THÀNH NAM",
  phone: "",
  addr: "",
  open: 0,
  ps: 0,
  tt: 0
}, {
  code: "0021",
  name: "EUROSUN",
  phone: "",
  addr: "",
  open: 0,
  ps: 0,
  tt: 0
}, {
  code: "0006",
  name: "INAX HP - HỮU TÍN",
  phone: "",
  addr: "",
  open: 0,
  ps: 0,
  tt: 0
}, {
  code: "0011",
  name: "INAX HP - THÀNH LƯƠNG",
  phone: "",
  addr: "",
  open: 0,
  ps: 0,
  tt: 0
}, {
  code: "0022",
  name: "KIM QUÝ",
  phone: "",
  addr: "",
  open: 0,
  ps: 0,
  tt: 0
}, {
  code: "0017",
  name: "KOBESI",
  phone: "",
  addr: "",
  open: 0,
  ps: 0,
  tt: 0
}, {
  code: "0026",
  name: "KOCHER",
  phone: "",
  addr: "",
  open: 0,
  ps: 0,
  tt: 0
}, {
  code: "0027",
  name: "KONOX",
  phone: "",
  addr: "",
  open: 0,
  ps: 0,
  tt: 0
}, {
  code: "0013",
  name: "PHỤ KIỆN - THẾ AS",
  phone: "",
  addr: "",
  open: 0,
  ps: 0,
  tt: 0
}, {
  code: "0005",
  name: "TÂN ĐẢO (BELLO, NOBI)",
  phone: "",
  addr: "",
  open: 0,
  ps: 0,
  tt: 0
}, {
  code: "0018",
  name: "TOTO NGỌC QUYẾN",
  phone: "",
  addr: "",
  open: 0,
  ps: 0,
  tt: 0
}];
/* lô hàng dư nợ chi tiết theo NCC (drill-down) */
const SUP_DETAIL = {};
const IMPORTS = [];
const RETURNS = [];
const ACCOUNTS_DEF = [
  {key: "TCB-CTY", bank: "TCB-CTY BLTK HP", stk: "02", owner: "CÔNG TY BTLK HP", openBal: 0},
  {key: "TCB-PAT", bank: "TCB-PAT",          stk: "01", owner: "PAT",              openBal: 0},
  {key: "Tiền mặt", bank: "TIEN MAT",         stk: "TM", owner: "Tiền mặt",         openBal: 0},
];
const TXNS = [];
const CASHFLOW = [];
const STAFF_RANK = [];
const SALES_BY_DAY = [];
const EXPORTS = [];

/* công nợ khách hàng — báo cáo tổng hợp */
const CUST_DEBT = [];
const CUST_DEBT_DETAIL = {};

/* báo cáo sản phẩm đặt hàng */
const PREORDER = [];
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
  }, {
    key: "contracts",
    label: "Hợp đồng"
  }]
}, {
  key: "purchase",
  label: "Mua hàng",
  icon: Truck
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
  key: "pc",
  label: "Sản phẩm, KH, NCC",
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
}, {
  key: "settings",
  label: "Cài đặt",
  icon: Settings,
  children: [{
    key: "settings_payment",
    label: "Cài đặt thanh toán"
  }, {
    key: "settings_numformat",
    label: "Định dạng số"
  }, {
    key: "settings_print",
    label: "Cấu hình mẫu in"
  }, {
    key: "settings_docnum",
    label: "Quy tắc đánh số chứng từ"
  }, {
    key: "settings_supplier_costs",
    label: "Bảng giá vốn sản phẩm"
  }, {
    key: "settings_txn_kinds",
    label: "Loại giao dịch Thu/Chi"
  }, {
    key: "admin_clear",
    label: "Xóa dữ liệu test"
  }, {
    key: "users",
    label: "Quản lý nhân viên"
  }]
}];
const LABELS = {
  finance: "Tài chính",
  sales_draft: "Báo giá",
  sales_orders: "Danh sách đơn hàng",
  purchase: "Mua hàng",
  wh_in: "Danh sách phiếu nhập kho",
  wh_out: "Danh sách phiếu xuất kho",
  wh_stock: "Tồn kho",
  pc_products: "Danh sách sản phẩm",
  pc_customers: "Danh sách khách hàng",
  pc_suppliers: "Danh sách nhà cung cấp",
  debt_cust: "Công nợ khách hàng",
  debt_ncc: "Công nợ nhà cung cấp",
  contracts: "Hợp đồng",
  dashboard: "Tổng quan",
  rp_sales: "Báo cáo bán hàng",
  rp_preorder: "Báo cáo sản phẩm đặt hàng",
  rp_staff: "Báo cáo nhân viên",
  settings: "Cài đặt",
  settings_payment: "Cài đặt thanh toán",
  settings_numformat: "Định dạng số",
  settings_docnum: "Quy tắc đánh số chứng từ",
  settings_supplier_costs: "Bảng giá vốn sản phẩm",
  settings_txn_kinds: "Loại giao dịch Thu/Chi",
  settings_print: "Cấu hình mẫu in",
  admin_clear: "Xóa dữ liệu test",
};

/* ───────── atoms ───────── */
const Pill = ({
  map,
  value
}) => /*#__PURE__*/React.createElement("span", {
  className: `inline-flex items-center whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${map[value] || "bg-slate-100 text-slate-600 ring-slate-200"}`
}, value);
const field = "rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700 focus:border-[#fed7aa] focus:outline-none";
const inputF = "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:border-[#fed7aa] focus:outline-none focus:ring-1 focus:ring-[#fde68a]";
const inputSm = "w-full rounded-md border border-slate-200 px-2 py-1.5 text-sm focus:border-[#fed7aa] focus:outline-none";

const purCode = lot => String(lot).match(/^PM\d{6}$/) ? lot : "PM" + yr2() + String(lot).replace(/\D/g,"").slice(-4).padStart(4,"0");
const impCode = lot => String(lot).match(/^PN\d{6}$/) ? lot : "PN" + yr2() + String(lot).replace(/\D/g,"").slice(-4).padStart(4,"0");
const expCode = lot => String(lot).match(/^PX\d{6}$/) ? lot : "PX" + yr2() + String(lot).replace(/\D/g,"").slice(-4).padStart(4,"0");

/* ô nhập số có định dạng phân tách hàng nghìn (vi-VN) */
function NumInput({
  value,
  onChange,
  className = inputSm,
  placeholder = "0",
  align = "right",
  disabled = false
}) {
  const [focused, setFocused] = React.useState(false);
  const fmt = v => v === "" || v === null || v === undefined || isNaN(v) || v === 0 ? v === 0 ? "0" : "" : num(v);
  const displayValue = focused
    ? (value === 0 ? "" : String(value))
    : (value === 0 ? "" : fmt(value));
  return /*#__PURE__*/React.createElement("input", {
    inputMode: "numeric",
    disabled: disabled,
    className: `${className} text-${align} tabular-nums ${disabled ? "bg-slate-100 text-slate-400" : ""}`,
    value: displayValue,
    placeholder: placeholder,
    onFocus: e => { setFocused(true); e.target.select(); },
    onBlur: () => setFocused(false),
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
    default: "text-[#92400e]",
    pos: "text-[#047857]",
    neg: "text-[#B91C1C]",
    accent: "text-[#92400e]",
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
}, (title || right) && /*#__PURE__*/React.createElement("div", {
  className: "relative flex items-center border-b border-slate-100 px-5 py-3"
}, title && /*#__PURE__*/React.createElement("h3", {
  className: "text-sm font-semibold text-slate-700 flex-1"
}, title), right && /*#__PURE__*/React.createElement("div", {className: "ml-auto"}, right)), /*#__PURE__*/React.createElement("div", {
  className: (title || right) ? "p-5" : ""
}, children));
const Th = ({
  children,
  right,
  center,
  style
}) => /*#__PURE__*/React.createElement("th", {
  className: `whitespace-nowrap px-3 py-2.5 ${right ? "text-right" : center ? "text-center" : "text-left"}`,
  style: style
}, children);
const TableShell = ({
  head,
  children,
  foot,
  minW,
  stickyHead = true
}) => /*#__PURE__*/React.createElement("div", {
  className: "overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm",
  style: stickyHead ? { maxHeight: "calc(100vh - 220px)", overflowY: "auto", position: "relative" } : { position: "relative" }
}, /*#__PURE__*/React.createElement("table", {
  className: "w-full text-sm tbl-list",
  style: minW ? { minWidth: minW } : undefined
}, /*#__PURE__*/React.createElement("thead", {
  style: stickyHead ? { position: "sticky", top: 0, zIndex: 10 } : undefined
}, /*#__PURE__*/React.createElement("tr", {
  className: "border-b border-slate-100 bg-amber-50 text-left text-xs uppercase tracking-wide text-amber-900/60"
}, head)), /*#__PURE__*/React.createElement("tbody", {
  className: "divide-y divide-slate-50"
}, children), foot && /*#__PURE__*/React.createElement("tfoot", {
  style: { position: "sticky", bottom: 0, zIndex: 10 }
}, foot)));
const TabBar = ({
  tabs,
  active,
  onChange
}) => /*#__PURE__*/React.createElement("div", {
  className: "flex gap-1 border-b border-slate-200"
}, tabs.map(t => /*#__PURE__*/React.createElement("button", {
  key: t,
  onClick: () => onChange(t),
  className: `-mb-px whitespace-nowrap border-b-2 px-3 py-2 text-[14px] transition ${active === t ? "border-[#fed7aa] font-medium text-[#92400e]" : "border-transparent text-slate-500 hover:text-slate-700"}`
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
  className: tone === "danger"
    ? "rounded-md p-1.5 transition bg-amber-100 text-[#92400e] hover:bg-amber-200"
    : `rounded-md p-1.5 transition hover:bg-slate-100 text-${tone}-500`
}, /*#__PURE__*/React.createElement(Icon, {
  className: "h-4 w-4"
}));
const blueBtn = "inline-flex items-center gap-1.5 rounded-lg bg-[#b45309] px-3.5 py-1.5 text-[14px] font-semibold text-white shadow-sm hover:bg-[#92400e]";
const greenBtn = "inline-flex items-center gap-1.5 rounded-lg bg-[#92400e] px-3 py-1.5 text-[14px] font-semibold text-white hover:bg-[#78350f]";
const addBtn = "inline-flex items-center gap-1.5 rounded-lg border border-[#fed7aa] bg-white px-3 py-1.5 text-[14px] font-semibold text-[#92400e] hover:bg-[#fef3c7]";
const ghostBtn = "inline-flex items-center gap-1.5 rounded-lg border border-[#CBD5E1] bg-white px-3 py-1.5 text-[14px] text-[#475569] hover:bg-[#faf7f4]";
const outlineTealBtn = "inline-flex items-center gap-1.5 rounded-lg border border-[#b45309] bg-white px-3 py-1.5 text-[14px] font-semibold text-[#b45309] hover:bg-[#fef3c7]";
const backBtn = "inline-flex items-center gap-1.5 rounded-lg border border-[#E2E8F0] bg-white px-3 py-1.5 text-[14px] text-[#64748B] hover:bg-[#F8FAFC]";

/* ── tách ngày & giờ xuống 2 dòng (F1) ── */
function DateTime({
  value
}) {
  if (!value) return /*#__PURE__*/React.createElement("span", {
    className: "text-slate-400"
  }, "");
  const parts = String(value).split(" ");
  const time = parts[0].split(":").slice(0, 2).join(":");
  const date = parts.slice(1).join(" ");
  return /*#__PURE__*/React.createElement("span", {
    className: "text-xs text-slate-500"
  }, /*#__PURE__*/React.createElement("span", {
    className: "block"
  }, date || time), date ? /*#__PURE__*/React.createElement("span", {
    className: "block text-slate-400"
  }, time) : null);
}

/* ── Xuất Excel/CSV thật (E3) ── */
function exportCSV(filename, headers, rows) {
  const ws = XLSX.utils.aoa_to_sheet([headers, ...rows.map(r => r.map(v => v ?? ""))]);
  // \u0110\u1ECBnh d\u1EA1ng c\u1ED9t s\u1ED1 ti\u1EC1n (c\u1ED9t c\u00F3 gi\u00E1 tr\u1ECB s\u1ED1)
  const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
  for (let R = 1; R <= range.e.r; R++) {
    for (let C = 0; C <= range.e.c; C++) {
      const cell = ws[XLSX.utils.encode_cell({r: R, c: C})];
      if (cell && typeof cell.v === 'number' && Math.abs(cell.v) >= 1000) {
        cell.z = '#,##0';
      }
    }
  }
  // T\u1EF1 \u0111i\u1EC1u ch\u1EC9nh \u0111\u1ED9 r\u1ED9ng c\u1ED9t
  const colWidths = headers.map((h, i) => {
    const maxLen = Math.max(h.length, ...rows.map(r => String(r[i] ?? "").length));
    return { wch: Math.min(maxLen + 2, 40) };
  });
  ws['!cols'] = colWidths;
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "D\u1EEF li\u1EC7u");
  XLSX.writeFile(wb, filename.replace(/\.(csv|xlsx)$/, "") + ".xlsx");
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
function RangeBar({ q, setQ, placeholder = "Tìm kiếm…", from, setFrom, to, setTo, onExport, extra, noPrint }) {
  return /*#__PURE__*/React.createElement("div", {
    className: "flex flex-wrap items-end gap-2"
  },
  /*#__PURE__*/React.createElement(DateRangeFilter, {
    initFrom: from, initTo: to,
    onApply: (f, t) => { if (setFrom) setFrom(f); if (setTo) setTo(t); }
  }),
  setQ && /*#__PURE__*/React.createElement("div", {
    className: "min-w-[200px] flex-1"
  }, /*#__PURE__*/React.createElement("label", {
    className: "mb-1 block text-[13px] font-medium text-slate-500"
  }, "Tìm kiếm"), /*#__PURE__*/React.createElement("input", {
    value: q, onChange: e => setQ(e.target.value), placeholder: placeholder,
    className: `${field} w-full`
  })), extra,
  !noPrint && /*#__PURE__*/React.createElement(PrintBtn, null),
  onExport && /*#__PURE__*/React.createElement(ExportBtn, { onClick: onExport }));
}

/* ── Shared date-range picker với nút Lọc ── */
function getPresetRange(preset) {
  const now = new Date();
  const y = now.getFullYear();
  const pad = n => String(n).padStart(2,"0");
  const fmt = d => `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
  const lastDay = (y, m) => new Date(y, m, 0);
  if (preset === "Năm nay") return [fmt(new Date(y,0,1)), fmt(new Date(y,11,31))];
  if (preset === "Đầu năm đến hiện tại") return [fmt(new Date(y,0,1)), fmt(now)];
  if (preset === "Sáu tháng đầu năm") return [fmt(new Date(y,0,1)), fmt(new Date(y,5,30))];
  if (preset === "Sáu tháng cuối năm") return [fmt(new Date(y,6,1)), fmt(new Date(y,11,31))];
  const m = ["Tháng 1","Tháng 2","Tháng 3","Tháng 4","Tháng 5","Tháng 6","Tháng 7","Tháng 8","Tháng 9","Tháng 10","Tháng 11","Tháng 12"].indexOf(preset);
  if (m >= 0) return [fmt(new Date(y,m,1)), fmt(lastDay(y,m+1))];
  return null;
}
const DATE_PRESETS = ["Đầu năm đến hiện tại",...Array.from({length:12},(_,i)=>`Tháng ${i+1}`)];

function DateRangeFilter({ initFrom, initTo, onApply, compact = false }) {
  const [pFrom, setPFrom] = React.useState(initFrom || localMonthStart());
  const [pTo, setPTo]   = React.useState(initTo   || localToday());
  const [open, setOpen]  = React.useState(false);
  const ref = React.useRef(null);
  React.useEffect(() => {
    const handler = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);
  const lbl = "mb-1 block text-[13px] font-medium text-slate-500";
  const applyPreset = preset => {
    const range = getPresetRange(preset);
    if (!range) return;
    setPFrom(range[0]); setPTo(range[1]);
    onApply(range[0], range[1]);
    setOpen(false);
  };
  const filterBtn = "inline-flex items-center gap-1.5 self-end rounded-lg border border-amber-600 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-800 hover:bg-amber-100";
  if (compact) return /*#__PURE__*/React.createElement(React.Fragment, null,
    /*#__PURE__*/React.createElement("input", {type:"date", value:pFrom, onChange:e=>setPFrom(e.target.value), className:`${field} py-1.5 text-sm`}),
    /*#__PURE__*/React.createElement("span", {className:"text-slate-400 text-sm"}, "–"),
    /*#__PURE__*/React.createElement("input", {type:"date", value:pTo, onChange:e=>setPTo(e.target.value), className:`${field} py-1.5 text-sm`}),
    /*#__PURE__*/React.createElement("button", {onClick:()=>onApply(pFrom,pTo), className:"inline-flex items-center gap-1 rounded-lg border border-amber-600 bg-amber-50 px-2.5 py-1.5 text-sm font-medium text-amber-800 hover:bg-amber-100"},
      /*#__PURE__*/React.createElement(Search, {className:"h-3.5 w-3.5"}), "Lọc"));
  return /*#__PURE__*/React.createElement(React.Fragment, null,
    /*#__PURE__*/React.createElement("div", null,
      /*#__PURE__*/React.createElement("label", {className:lbl}, "Từ ngày"),
      /*#__PURE__*/React.createElement("input", {type:"date", value:pFrom, onChange:e=>setPFrom(e.target.value), className:field})),
    /*#__PURE__*/React.createElement("div", null,
      /*#__PURE__*/React.createElement("label", {className:lbl}, "Đến ngày"),
      /*#__PURE__*/React.createElement("input", {type:"date", value:pTo, onChange:e=>setPTo(e.target.value), className:field})),
    /*#__PURE__*/React.createElement("div", {className:"relative self-end", ref},
      /*#__PURE__*/React.createElement("div", {className:"flex"},
        /*#__PURE__*/React.createElement("button", {onClick:()=>onApply(pFrom,pTo), className:"inline-flex items-center gap-1.5 rounded-l-lg border border-r-0 border-amber-600 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-800 hover:bg-amber-100"},
          /*#__PURE__*/React.createElement(Search, {className:"h-4 w-4"}), "Lọc"),
        /*#__PURE__*/React.createElement("button", {onClick:()=>setOpen(v=>!v), className:"inline-flex items-center rounded-r-lg border border-amber-600 bg-amber-50 px-2 py-2 text-sm text-amber-800 hover:bg-amber-100"},
          /*#__PURE__*/React.createElement(ChevronDown, {className:"h-4 w-4"}))),
      open && /*#__PURE__*/React.createElement("div", {className:"absolute left-0 top-full z-50 mt-1 w-48 rounded-lg border border-slate-200 bg-white py-1 shadow-lg"},
        DATE_PRESETS.map((p,i) => /*#__PURE__*/React.createElement(React.Fragment, {key:p},
          i===1 && /*#__PURE__*/React.createElement("div", {className:"my-1 border-t border-slate-100"}),
          /*#__PURE__*/React.createElement("button", {
            onClick:()=>applyPreset(p),
            className:"w-full px-4 py-1.5 text-left text-sm text-slate-700 hover:bg-amber-50 hover:text-amber-800"
          }, p))))));
}

/* ── Supplier costs context ── */
const SupplierCostsCtx = React.createContext([]);
const useSupplierCosts = () => React.useContext(SupplierCostsCtx);

/* ── Bank accounts context (shared Finance ↔ Settings) ── */
const INIT_BANK_ACCOUNTS = [
  {id:1, key:"TCB-CTY",  bank:"TCB-CTY BLTK HP", account:"02", owner:"CÔNG TY BTLK HP", branch:"", note:"", openBal:951999, status:"Hoạt động"},
  {id:2, key:"TCB-PAT",  bank:"TCB-PAT",          account:"01", owner:"PAT",              branch:"", note:"", openBal:218663367, status:"Hoạt động"},
  {id:3, key:"Tiền mặt", bank:"TIEN MAT",         account:"TM", owner:"Tiền mặt",         branch:"", note:"", openBal:0,       status:"Hoạt động"},
];
const BankCtx = React.createContext(null);
const useBankAccounts = () => React.useContext(BankCtx);
const TxnKindsCtx = React.createContext(null);
const useTxnKinds = () => React.useContext(TxnKindsCtx);
const DEFAULT_THU_KINDS = ["Đặt cọc","Thanh toán"];
const DEFAULT_CHI_KINDS = ["CPVC Nhập Hàng","CP Đặt Cọc NCC","CP Thanh Toán NCC","CP Ship ĐH","CP Lắp Đặt","CP Hoàn Hàng","CP Thuê Nhà","CP Tiền Điện","CP Tiền Nước","CP Vận Hành","Hoàn tiền KH","Chi hoa hồng","Chi khác"];
const TxnCtx = React.createContext(null);
const useTxns = () => React.useContext(TxnCtx);
const InvCtx = React.createContext({whInItems: [], setWhInItems: () => {}, whOutItems: [], setWhOutItems: () => {}});
const useInventory = () => React.useContext(InvCtx);
const DocNumCtx = React.createContext(null);
const useDocNum = () => React.useContext(DocNumCtx);
const yr2 = () => String(new Date().getFullYear()).slice(-2);
const fmtDocId = (prefix, num) => prefix + yr2() + String(num).padStart(4, "0");
const txnDocId = t => isNaN(Number(t.id))
  ? ""
  : fmtDocId(t.amount >= 0 ? "PT" : "PC", t.id);

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
    className: "fixed top-5 left-1/2 z-[60] -translate-x-1/2 flex items-center gap-1.5 rounded-lg border border-[#b45309] bg-[#fef9f0] px-4 py-2 text-sm font-medium text-[#92400e] shadow-lg"
  }, /*#__PURE__*/React.createElement(Check, {className: "h-4 w-4 shrink-0"}), msg.replace(/^[✅✓⚠️⚠]\s*/u, "")));
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
  className: `inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset bg-[#fef9f0] text-[#92400e] ring-[#b45309] ${className}`
}, code);

/* ───────── Dashboard ───────── */
function Dashboard({ orders = [], purchaseList = [], onOpenOrder }) {
  const { txns = [] }         = useTxns()         || {};
  const { bankAccounts = [] } = useBankAccounts() || {};
  const { whInItems = [] }    = useInventory()    || {};

  const [showRetList, setShowRetList] = useState(false);

  const [fromDate, setFromDate] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-01`;
  });
  const [toDate, setToDate] = useState(localToday);

  const parseD   = s => { if (!s) return new Date(0); const p = s.split(' ')[0].split('/'); return new Date(+p[2],+p[1]-1,+p[0]); };
  const parseISO = s => { const [y,m,d] = s.split('-'); return new Date(+y,+m-1,+d); };
  const fromD    = fromDate ? parseISO(fromDate) : null;
  const toD      = toDate   ? parseISO(toDate)   : null;
  const inRange  = s => { const d = parseD(s); return (!fromD || d >= fromD) && (!toD || d <= toD); };

  const plMap = React.useMemo(() => {
    const m = {};
    purchaseList.forEach(r => { m[r.lot + "__" + r.prod] = r; });
    return m;
  }, [purchaseList]);

  const allActive = React.useMemo(() =>
    orders.filter(o => !o.draft && o.orderStatus !== 'Huỷ' && o.orderStatus !== 'Hủy'),
    [orders]
  );
  const fOrders   = allActive.filter(o => inRange(o.dt));
  const fTxns     = txns.filter(t => !t.cancelled && inRange(t.date));

  // ── TÀI CHÍNH ────────────────────────────────────────────────────────────
  const TRANSFER_KINDS = new Set(["Chuyển đi", "Chuyển về"]);
  const NCC_KINDS      = new Set(["CP Thanh Toán NCC", "CP Đặt Cọc NCC", "CPVC Nhập Hàng"]);

  const thuAll   = fTxns.filter(t => t.amount > 0 && !TRANSFER_KINDS.has(t.kind));
  const chiAll   = fTxns.filter(t => t.amount < 0 && !TRANSFER_KINDS.has(t.kind));
  const totalThu = thuAll.reduce((s,t) => s + t.amount, 0);
  const totalChi = chiAll.reduce((s,t) => s + Math.abs(t.amount), 0);
  const thuOrder = thuAll.filter(t => t.kind === "Thanh toán").reduce((s,t) => s + t.amount, 0);
  const thuCoc   = thuAll.filter(t => t.kind === "Đặt cọc").reduce((s,t) => s + t.amount, 0);
  const thuKhac  = totalThu - thuOrder - thuCoc;
  const chiNCC   = chiAll.filter(t => NCC_KINDS.has(t.kind)).reduce((s,t) => s + Math.abs(t.amount), 0);
  const chiCP    = chiAll.filter(t => !NCC_KINDS.has(t.kind)).reduce((s,t) => s + Math.abs(t.amount), 0);

  const activeAccs = bankAccounts.filter(a => a.status === "Hoạt động");
  const accBals    = activeAccs.map(a => {
    const net = txns.filter(t => !t.cancelled && t.acc === a.key && (!toD || parseD(t.date) <= toD)).reduce((s,t) => s + t.amount, 0);
    return { ...a, bal: (a.openBal||0) + net };
  });
  const totalBal = accBals.reduce((s,a) => s + a.bal, 0);

  // ── GIAO DỊCH HÀNG HOÁ (theo kỳ đã chọn) ──────────────────────────────────
  const deliveredOrders = fOrders.filter(o => o.deliveryConfirmed || o.exported);
  const depositOrders   = fOrders.filter(o => !o.deliveryConfirmed && !o.exported && (o.paid||0) > 0);
  const fWhIn           = whInItems.filter(r => r.supplier && inRange(r.date));
  const nccTotal        = fWhIn.reduce((s,r) => s + (r.qtyIn||0)*(r.costNcc||0) + (r.fee||0), 0);
  const nccPaid         = fWhIn.reduce((s,r) => {
    const pl  = plMap[r.lot+"__"+r.prod];
    const tot = (r.qtyIn||0)*(r.costNcc||0) + (r.fee||0);
    return s + (pl ? (pl.paid||0) : (r.pay === "Đã thanh toán" ? tot : 0));
  }, 0);
  const nccLots  = new Set(fWhIn.map(r => r.lot)).size;
  const stockVal = whInItems.reduce((s,r) => s + (r.qtyRemaining ?? r.qtyNow ?? 0) * (r.unitCost ?? r.costNcc ?? 0), 0);

  // ── CÔNG NỢ (all-time) ────────────────────────────────────────────────────
  const { custDebtList, totalCustDebt, nccDebtList, totalNccDebt } = React.useMemo(() => {
    const custDebt = {};
    allActive.forEach(o => {
      const rem = Math.max(0, calc(o).remaining);
      if (rem > 0 && o.name) custDebt[o.name] = (custDebt[o.name]||0) + rem;
    });
    const custDebtList  = Object.entries(custDebt).map(([n,d]) => ({name:n,debt:d})).sort((a,b) => b.debt-a.debt).slice(0,5);
    const totalCustDebt = Object.values(custDebt).reduce((s,v) => s+v, 0);

    const nccDebt = {};
    whInItems.filter(r => r.supplier).forEach(r => {
      const pl   = plMap[r.lot+"__"+r.prod];
      const tot  = (r.qtyIn||0)*(r.costNcc||0) + (r.fee||0);
      const rets = (pl?.returns||[]).reduce((s,x) => s+(x.amount||0), 0);
      const paid = pl ? (pl.paid||0) : (r.pay === "Đã thanh toán" ? tot : 0);
      const rem  = Math.max(0, tot - rets - paid);
      if (rem > 0 && r.supplier) nccDebt[r.supplier] = (nccDebt[r.supplier]||0) + rem;
    });
    const nccDebtList  = Object.entries(nccDebt).map(([n,d]) => ({name:n,debt:d})).sort((a,b) => b.debt-a.debt).slice(0,5);
    const totalNccDebt = Object.values(nccDebt).reduce((s,v) => s+v, 0);

    return { custDebtList, totalCustDebt, nccDebtList, totalNccDebt };
  }, [allActive, whInItems, plMap]);

  // ── HOÀN HÀNG ─────────────────────────────────────────────────────────────
  const returnedOrders  = allActive.filter(o => (o.returns||[]).some(r => !r.cancelled));
  const allRetItems     = returnedOrders.flatMap(o => (o.returns||[]).filter(r => !r.cancelled));
  const totalReturnVal  = allRetItems.reduce((s,r) => s + (r.amount||0), 0);
  const alreadyRefunded = returnedOrders.reduce((s,o) => s + (o.compCosts||[]).filter(c => c.type==="Hoàn tiền hàng").reduce((cs,c) => cs+(c.amount||0), 0), 0);
  const pendingRefund   = Math.max(0, totalReturnVal - alreadyRefunded);
  const importedToStock = totalReturnVal;
  const nccRetItems    = fWhIn.filter(r => (plMap[r.lot+"__"+r.prod]?.returns||[]).length > 0);
  const nccRetLots     = new Set(nccRetItems.map(r => r.lot)).size;
  const nccRetVal      = nccRetItems.reduce((s,r) => {
    const pl = plMap[r.lot+"__"+r.prod];
    return s + (pl?.returns||[]).reduce((rs,x) => rs+(x.amount||0), 0);
  }, 0);

  // ── LỢI NHUẬN (Accrual) — theo kỳ đã chọn ───────────────────────────────
  const expOrders         = fOrders.filter(o => o.deliveryConfirmed || o.exported);
  const pendingOrders     = fOrders.filter(o => !o.deliveryConfirmed && !o.exported);
  const accrualRev        = expOrders.reduce((s,o) => s + calc(o).total, 0);
  const accrualCOGS       = expOrders.reduce((s,o) => s + calc(o).totalCost, 0);
  const accrualShip       = expOrders.reduce((s,o) => s + (o.importExpense||0), 0);
  const accrualExp        = expOrders.reduce((s,o) => s + (o.expense||0), 0);
  const accrualCompShip   = expOrders.reduce((s,o) => s + (o.compCosts||[]).filter(c=>c.type==="Chi phí Ship hàng").reduce((cs,c)=>cs+(c.amount||0),0), 0);
  const accrualCompComm   = expOrders.reduce((s,o) => s + (o.compCosts||[]).filter(c=>c.type==="Chi phí hoa hồng").reduce((cs,c)=>cs+(c.amount||0),0), 0);
  const accrualCompInst   = expOrders.reduce((s,o) => s + (o.compCosts||[]).filter(c=>c.type==="Chi phí lắp đặt").reduce((cs,c)=>cs+(c.amount||0),0), 0);
  const accrualCPBH       = accrualShip + accrualExp + accrualCompShip + accrualCompComm + accrualCompInst;
  const accrualGrossProfit = accrualRev - accrualCOGS;
  const accrualProfit     = accrualRev - accrualCOGS - accrualCPBH;
  const margin            = accrualRev > 0 ? Math.round(accrualProfit*1000/accrualRev)/10 : 0;
  const grossMargin       = accrualRev > 0 ? Math.round(accrualGrossProfit*1000/accrualRev)/10 : 0;
  const pendingRev        = pendingOrders.reduce((s,o) => s + calc(o).total, 0);
  const pendingCOGS       = pendingOrders.reduce((s,o) => s + calc(o).totalCost, 0);
  const pendingGrossProfit = pendingRev - pendingCOGS;
  const pendingGrossMargin = pendingRev > 0 ? Math.round(pendingGrossProfit*1000/pendingRev)/10 : 0;

  // ── Helpers ────────────────────────────────────────────────────────────────
  const dash  = /*#__PURE__*/React.createElement("span", {className:"text-slate-300"}, "—");
  const kv    = (label, val, vCls) =>
    /*#__PURE__*/React.createElement("div", {className:"flex justify-between items-center text-sm py-0.5"},
      /*#__PURE__*/React.createElement("span", {className:"text-slate-500"}, label),
      val > 0
        ? /*#__PURE__*/React.createElement("span", {className:"tabular-nums font-medium "+(vCls||"text-slate-800")}, vnd(val))
        : dash
    );
  const secHd = (label, sub) =>
    /*#__PURE__*/React.createElement("span", {className:"text-[11px] font-semibold uppercase tracking-widest text-slate-500"},
      label,
      sub && /*#__PURE__*/React.createElement("span", {className:"ml-2 normal-case font-normal text-slate-400 tracking-normal"}, "· "+sub)
    );

  return /*#__PURE__*/React.createElement("div", {className:"space-y-6 pb-6"},

    /* ── Filter bar ── */
    /*#__PURE__*/React.createElement("div", {className:"flex flex-wrap items-end gap-3 rounded-xl border border-slate-200 bg-white p-3"},
      /*#__PURE__*/React.createElement(DateRangeFilter, {initFrom:fromDate, initTo:toDate, onApply:(f,t)=>{setFromDate(f);setToDate(t);}}),
      /*#__PURE__*/React.createElement("span", {className:"self-end pb-2 text-[13px] text-slate-400"},
        fOrders.length + " đơn · " + thuAll.length + " giao dịch thu"
      )
    ),

    /* ── TÀI CHÍNH ── */
    /*#__PURE__*/React.createElement("div", null,
      /*#__PURE__*/React.createElement("div", {className:"mb-3 flex items-center gap-2"},
        /*#__PURE__*/React.createElement(Wallet, {className:"h-3.5 w-3.5 text-slate-400"}),
        secHd("Tài chính", "Cash")
      ),
      /*#__PURE__*/React.createElement("p", {className:"mb-3 text-xs italic text-slate-400"}, "Tiền thực vào/ra tài khoản trong kỳ — không tính phần đơn đã giao nhưng chưa thu."),
      /*#__PURE__*/React.createElement("div", {className:"grid grid-cols-1 gap-3 md:grid-cols-3"},

        /* Tiền vào */
        /*#__PURE__*/React.createElement("div", {className:"rounded-xl border border-[#fed7aa] bg-white p-4"},
          /*#__PURE__*/React.createElement("div", {className:"mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-[#92400e]"},
            /*#__PURE__*/React.createElement(ArrowDownToLine, {className:"h-3.5 w-3.5"}), "Tiền vào"
          ),
          /*#__PURE__*/React.createElement("p", {className:"text-2xl font-bold text-emerald-600 tabular-nums"}, totalThu > 0 ? "+"+vnd(totalThu) : "—"),
          /*#__PURE__*/React.createElement("p", {className:"mt-0.5 mb-3 text-xs text-slate-400"}, thuAll.length + " giao dịch trong kỳ"),
          /*#__PURE__*/React.createElement("div", {className:"space-y-1.5"},
            kv("Thu từ đơn hàng", thuOrder),
            kv("Nhận cọc KH", thuCoc),
            thuKhac > 0 ? kv("Khác", thuKhac) : null
          )
        ),

        /* Tiền ra */
        /*#__PURE__*/React.createElement("div", {className:"rounded-xl border border-[#fed7aa] bg-white p-4"},
          /*#__PURE__*/React.createElement("div", {className:"mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-[#92400e]"},
            /*#__PURE__*/React.createElement(ArrowUpFromLine, {className:"h-3.5 w-3.5"}), "Tiền ra"
          ),
          /*#__PURE__*/React.createElement("p", {className:"text-2xl font-bold text-[#B91C1C] tabular-nums"}, totalChi > 0 ? "−"+vnd(totalChi) : "—"),
          /*#__PURE__*/React.createElement("p", {className:"mt-0.5 mb-3 text-xs text-slate-400"}, chiAll.length + " giao dịch trong kỳ"),
          /*#__PURE__*/React.createElement("div", {className:"space-y-1.5"},
            kv("Trả công nợ NCC", chiNCC),
            kv("Chi phí bán hàng", chiCP)
          )
        ),

        /* Số dư tài khoản */
        /*#__PURE__*/React.createElement("div", {className:"rounded-xl border border-[#fed7aa] bg-white p-4"},
          /*#__PURE__*/React.createElement("div", {className:"mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-[#92400e]"},
            /*#__PURE__*/React.createElement(CreditCard, {className:"h-3.5 w-3.5"}), "Số dư tài khoản"
          ),
          /*#__PURE__*/React.createElement("p", {className:"text-2xl font-bold text-[#92400e] tabular-nums"}, totalBal > 0 ? vnd(totalBal) : "—"),
          /*#__PURE__*/React.createElement("p", {className:"mt-0.5 mb-3 text-xs text-slate-400"}, accBals.length > 0 ? accBals.length + " tài khoản đang hoạt động" : "Chưa có tài khoản"),
          /*#__PURE__*/React.createElement("p", {className:"mb-2 text-[11px] italic text-slate-400"}, "Lũy kế đến cuối kỳ — không thay đổi theo ngày bắt đầu"),
          accBals.length === 0
            ? /*#__PURE__*/React.createElement("p", {className:"text-xs text-slate-400"}, "Thêm tài khoản trong Cài đặt")
            : /*#__PURE__*/React.createElement("div", {className:"space-y-2"},
                accBals.map(a =>
                  /*#__PURE__*/React.createElement("div", {key:a.key, className:"flex items-center justify-between"},
                    /*#__PURE__*/React.createElement("span", {className:"inline-flex items-center rounded-md bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-800"}, a.key||a.bank),
                    a.bal >= 0
                      ? /*#__PURE__*/React.createElement("span", {className:"text-sm font-semibold tabular-nums text-slate-800"}, vnd(a.bal))
                      : /*#__PURE__*/React.createElement("span", {className:"text-sm font-semibold tabular-nums text-[#B91C1C]"}, "−"+vnd(Math.abs(a.bal)))
                  )
                )
              )
        )
      )
    ),

    /* ── GIAO DỊCH HÀNG HOÁ ── */
    /*#__PURE__*/React.createElement("div", null,
      /*#__PURE__*/React.createElement("div", {className:"mb-3 flex items-center gap-2"},
        /*#__PURE__*/React.createElement(ArrowLeftRight, {className:"h-3.5 w-3.5 text-slate-400"}),
        secHd("Giao dịch hàng hoá")
      ),
      /*#__PURE__*/React.createElement("div", {className:"grid grid-cols-2 gap-3 lg:grid-cols-4"},

        /* Đơn đã giao */
        /*#__PURE__*/React.createElement("div", {className:"rounded-xl border border-[#fed7aa] bg-white p-4"},
          /*#__PURE__*/React.createElement("div", {className:"mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-[#92400e]"},
            /*#__PURE__*/React.createElement(Truck, {className:"h-3.5 w-3.5"}), "Đơn đã giao"
          ),
          /*#__PURE__*/React.createElement("div", {className:"mb-3 flex items-start justify-between"},
            /*#__PURE__*/React.createElement("div", null,
              /*#__PURE__*/React.createElement("p", {className:"text-xs text-slate-500"}, "Số đơn"),
              /*#__PURE__*/React.createElement("p", {className:"text-2xl font-bold text-slate-800"}, deliveredOrders.length,
                /*#__PURE__*/React.createElement("span", {className:"ml-1 text-sm font-normal text-slate-500"}, "đơn")
              )
            ),
            /*#__PURE__*/React.createElement("div", {className:"text-right"},
              /*#__PURE__*/React.createElement("p", {className:"text-xs text-slate-500"}, "Giá trị"),
              /*#__PURE__*/React.createElement("p", {className:"text-sm font-bold text-[#92400e] tabular-nums"},
                deliveredOrders.length > 0 ? vnd(deliveredOrders.reduce((s,o) => s+calc(o).total, 0)) : "—"
              )
            )
          ),
          /*#__PURE__*/React.createElement("div", {className:"space-y-1.5"},
            kv("Đã thu tiền", deliveredOrders.reduce((s,o) => s+(o.paid||0), 0)),
            kv("Còn phải thu", deliveredOrders.reduce((s,o) => s+Math.max(0,calc(o).remaining), 0), "text-[#B91C1C]")
          )
        ),

        /* Đơn nhận cọc */
        /*#__PURE__*/React.createElement("div", {className:"rounded-xl border border-[#fed7aa] bg-white p-4"},
          /*#__PURE__*/React.createElement("div", {className:"mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-[#92400e]"},
            /*#__PURE__*/React.createElement(Package, {className:"h-3.5 w-3.5"}), "Đơn nhận cọc"
          ),
          /*#__PURE__*/React.createElement("div", {className:"mb-3 flex items-start justify-between"},
            /*#__PURE__*/React.createElement("div", null,
              /*#__PURE__*/React.createElement("p", {className:"text-xs text-slate-500"}, "Đang chờ giao"),
              /*#__PURE__*/React.createElement("p", {className:"text-2xl font-bold text-slate-800"}, depositOrders.length,
                /*#__PURE__*/React.createElement("span", {className:"ml-1 text-sm font-normal text-slate-500"}, "đơn")
              )
            ),
            /*#__PURE__*/React.createElement("div", {className:"text-right"},
              /*#__PURE__*/React.createElement("p", {className:"text-xs text-slate-500"}, "Giá trị"),
              /*#__PURE__*/React.createElement("p", {className:"text-sm font-bold text-[#92400e] tabular-nums"},
                depositOrders.length > 0 ? vnd(depositOrders.reduce((s,o) => s+calc(o).total, 0)) : "—"
              )
            )
          ),
          /*#__PURE__*/React.createElement("div", {className:"space-y-1.5"},
            kv("Đã nhận cọc", depositOrders.reduce((s,o) => s+(o.paid||0), 0)),
            kv("Sẽ thu khi giao", depositOrders.reduce((s,o) => s+Math.max(0,calc(o).remaining), 0))
          )
        ),

        /* Mua hàng NCC */
        /*#__PURE__*/React.createElement("div", {className:"rounded-xl border border-[#fed7aa] bg-white p-4"},
          /*#__PURE__*/React.createElement("div", {className:"mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-[#92400e]"},
            /*#__PURE__*/React.createElement(PackageSearch, {className:"h-3.5 w-3.5"}), "Mua hàng NCC"
          ),
          /*#__PURE__*/React.createElement("div", {className:"mb-3 flex items-start justify-between"},
            /*#__PURE__*/React.createElement("div", null,
              /*#__PURE__*/React.createElement("p", {className:"text-xs text-slate-500"}, "Đơn nhập"),
              /*#__PURE__*/React.createElement("p", {className:"text-2xl font-bold text-slate-800"}, nccLots,
                /*#__PURE__*/React.createElement("span", {className:"ml-1 text-sm font-normal text-slate-500"}, "đơn")
              )
            ),
            /*#__PURE__*/React.createElement("div", {className:"text-right"},
              /*#__PURE__*/React.createElement("p", {className:"text-xs text-slate-500"}, "Giá trị"),
              /*#__PURE__*/React.createElement("p", {className:"text-sm font-bold text-[#92400e] tabular-nums"}, nccTotal > 0 ? vnd(nccTotal) : "—")
            )
          ),
          /*#__PURE__*/React.createElement("div", {className:"space-y-1.5"},
            kv("Đã thanh toán", nccPaid),
            kv("Còn phải trả", Math.max(0, nccTotal-nccPaid), "text-[#B91C1C]")
          )
        ),

        /* Tồn kho */
        /*#__PURE__*/React.createElement("div", {className:"rounded-xl border border-[#fed7aa] bg-white p-4"},
          /*#__PURE__*/React.createElement("div", {className:"mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-[#92400e]"},
            /*#__PURE__*/React.createElement(Layers, {className:"h-3.5 w-3.5"}), "Tồn kho hiện tại"
          ),
          /*#__PURE__*/React.createElement("p", {className:"text-2xl font-bold text-[#92400e] tabular-nums"}, stockVal > 0 ? vnd(stockVal) : "—"),
          /*#__PURE__*/React.createElement("p", {className:"mt-1 mb-3 text-xs text-slate-400"}, "Giá trị hàng tồn"),
          /*#__PURE__*/React.createElement("div", {className:"space-y-1.5"},
            kv("Mặt hàng còn hàng", whInItems.filter(r => (r.qtyRemaining??r.qtyNow??0) > 0).length)
          )
        )
      )
    ),

    /* ── CÔNG NỢ ── */
    /*#__PURE__*/React.createElement("div", null,
      /*#__PURE__*/React.createElement("div", {className:"mb-3 flex items-center gap-2"},
        /*#__PURE__*/React.createElement(FileText, {className:"h-3.5 w-3.5 text-slate-400"}),
        secHd("Công nợ", "Toàn thời gian")
      ),
      /*#__PURE__*/React.createElement("div", {className:"grid grid-cols-1 gap-3 md:grid-cols-2"},

        /* KH cần thu */
        /*#__PURE__*/React.createElement("div", {className:"flex flex-col rounded-xl border border-slate-200 bg-white p-4"},
          /*#__PURE__*/React.createElement("div", {className:"mb-3 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-rose-600"},
            /*#__PURE__*/React.createElement(Users, {className:"h-3.5 w-3.5"}), "Khách hàng cần thu tiền"
          ),
          /*#__PURE__*/React.createElement("div", {className:"flex-1"},
            custDebtList.length === 0
              ? /*#__PURE__*/React.createElement("p", {className:"py-2 text-sm text-slate-400"}, "Không có công nợ")
              : /*#__PURE__*/React.createElement("div", {className:"space-y-1.5"},
                  custDebtList.map(c =>
                    /*#__PURE__*/React.createElement("div", {key:c.name, className:"flex justify-between text-sm py-0.5"},
                      /*#__PURE__*/React.createElement("span", {className:"font-medium text-slate-800 truncate max-w-[60%]"}, c.name),
                      /*#__PURE__*/React.createElement("span", {className:"tabular-nums text-slate-600"}, vnd(c.debt))
                    )
                  )
                )
          ),
          /*#__PURE__*/React.createElement("div", {className:"mt-3 flex justify-between border-t border-slate-100 pt-2 text-sm"},
            /*#__PURE__*/React.createElement("span", {className:"text-slate-600"}, "Tổng cần thu"),
            totalCustDebt > 0
              ? /*#__PURE__*/React.createElement("span", {className:"font-bold tabular-nums text-[#B91C1C]"}, vnd(totalCustDebt))
              : /*#__PURE__*/React.createElement("span", {className:"text-slate-300"}, "—")
          )
        ),

        /* NCC cần trả */
        /*#__PURE__*/React.createElement("div", {className:"flex flex-col rounded-xl border border-slate-200 bg-white p-4"},
          /*#__PURE__*/React.createElement("div", {className:"mb-3 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-[#92400e]"},
            /*#__PURE__*/React.createElement(Building2, {className:"h-3.5 w-3.5"}), "NCC cần thanh toán"
          ),
          /*#__PURE__*/React.createElement("div", {className:"flex-1"},
            nccDebtList.length === 0
              ? /*#__PURE__*/React.createElement("p", {className:"py-2 text-sm text-slate-400"}, "Không có công nợ")
              : /*#__PURE__*/React.createElement("div", {className:"space-y-1.5"},
                  nccDebtList.map(c =>
                    /*#__PURE__*/React.createElement("div", {key:c.name, className:"flex justify-between text-sm py-0.5"},
                      /*#__PURE__*/React.createElement("span", {className:"font-medium text-slate-800 truncate max-w-[60%]"}, c.name),
                      /*#__PURE__*/React.createElement("span", {className:"tabular-nums text-slate-600"}, vnd(c.debt))
                    )
                  )
                )
          ),
          /*#__PURE__*/React.createElement("div", {className:"mt-3 flex justify-between border-t border-slate-100 pt-2 text-sm"},
            /*#__PURE__*/React.createElement("span", {className:"text-slate-600"}, "Tổng phải trả"),
            totalNccDebt > 0
              ? /*#__PURE__*/React.createElement("span", {className:"font-bold tabular-nums text-[#92400e]"}, vnd(totalNccDebt))
              : /*#__PURE__*/React.createElement("span", {className:"text-slate-300"}, "—")
          )
        )
      )
    ),

    /* ── HOÀN HÀNG ── */
    /*#__PURE__*/React.createElement("div", null,
      /*#__PURE__*/React.createElement("div", {className:"mb-3 flex items-center gap-2"},
        /*#__PURE__*/React.createElement(CornerUpLeft, {className:"h-3.5 w-3.5 text-slate-400"}),
        secHd("Hoàn hàng")
      ),
      /*#__PURE__*/React.createElement("div", {className:"grid grid-cols-1 gap-3 md:grid-cols-2"},

        /* KH trả hàng */
        /*#__PURE__*/React.createElement("div", {className:"rounded-xl border border-slate-200 bg-white p-4"},
          /*#__PURE__*/React.createElement("div", {className:"mb-3 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-rose-600"},
            /*#__PURE__*/React.createElement(RotateCcw, {className:"h-3.5 w-3.5"}), "Khách hàng trả hàng"
          ),
          /*#__PURE__*/React.createElement("div", {className:"mb-3 grid grid-cols-2 gap-3 border-b border-slate-100 pb-3"},
            /*#__PURE__*/React.createElement("div", null,
              /*#__PURE__*/React.createElement("p", {className:"text-[11px] text-slate-400 mb-0.5"}, "Số đơn hoàn"),
              returnedOrders.length > 0
                ? /*#__PURE__*/React.createElement("button", {
                    onClick: () => setShowRetList(v => !v),
                    className: "flex items-center gap-1 text-left"
                  },
                    /*#__PURE__*/React.createElement("span", {className:"text-2xl font-bold text-slate-800"}, returnedOrders.length),
                    /*#__PURE__*/React.createElement("span", {className:"text-sm font-normal text-slate-500 ml-1"}, "đơn"),
                    /*#__PURE__*/React.createElement(showRetList ? ChevronDown : ChevronRight, {className:"h-4 w-4 text-slate-400 ml-0.5"})
                  )
                : /*#__PURE__*/React.createElement("p", {className:"text-2xl font-bold text-slate-800"}, "0", /*#__PURE__*/React.createElement("span", {className:"text-sm font-normal text-slate-500 ml-1"}, "đơn"))
            ),
            /*#__PURE__*/React.createElement("div", {className:"text-right"},
              /*#__PURE__*/React.createElement("p", {className:"text-[11px] text-slate-400 mb-0.5"}, "Giá trị hoàn"),
              totalReturnVal > 0
                ? /*#__PURE__*/React.createElement("p", {className:"text-lg font-bold tabular-nums text-rose-600"}, vnd(totalReturnVal))
                : /*#__PURE__*/React.createElement("span", {className:"text-slate-300 text-lg"}, "—")
            )
          ),
          /*#__PURE__*/React.createElement("div", {className:"space-y-2"},
            /*#__PURE__*/React.createElement("div", {className:"flex justify-between items-center text-sm"},
              /*#__PURE__*/React.createElement("span", {className:"text-slate-500"}, "Đã hoàn tiền KH"),
              alreadyRefunded > 0
                ? /*#__PURE__*/React.createElement("span", {className:"tabular-nums font-medium text-rose-600"}, vnd(alreadyRefunded))
                : /*#__PURE__*/React.createElement("span", {className:"text-slate-300"}, "—")
            ),
            /*#__PURE__*/React.createElement("div", {className:"flex justify-between items-center text-sm"},
              /*#__PURE__*/React.createElement("span", {className:"text-slate-500"}, "Chờ xử lý"),
              pendingRefund > 0
                ? /*#__PURE__*/React.createElement("span", {className:"tabular-nums font-medium text-[#92400e]"}, vnd(pendingRefund))
                : /*#__PURE__*/React.createElement("span", {className:"text-slate-300"}, "—")
            ),
            /*#__PURE__*/React.createElement("div", {className:"flex justify-between items-center text-sm"},
              /*#__PURE__*/React.createElement("span", {className:"text-slate-500"}, "Hàng nhập lại kho"),
              importedToStock > 0
                ? /*#__PURE__*/React.createElement("span", {className:"tabular-nums font-medium text-[#92400e]"}, vnd(importedToStock))
                : /*#__PURE__*/React.createElement("span", {className:"text-slate-300"}, "—")
            )
          ),
          showRetList && returnedOrders.length > 0 && /*#__PURE__*/React.createElement("div", {
            className: "mt-3 border-t border-slate-100 pt-3 space-y-0.5"
          },
            returnedOrders.map(o => {
              const retVal = (o.returns||[]).filter(r => !r.cancelled).reduce((s,r) => s+(r.amount||0), 0);
              return /*#__PURE__*/React.createElement("button", {
                key: o.id,
                onClick: () => onOpenOrder && onOpenOrder(o.id),
                className: "w-full flex items-center justify-between text-sm hover:bg-[#fff7ed] rounded-lg px-2 py-1.5 group transition-colors"
              },
                /*#__PURE__*/React.createElement("div", {className:"flex items-center gap-2"},
                  /*#__PURE__*/React.createElement("span", {className:"rounded-full bg-[#fcebd8] px-2 py-0.5 text-[11px] font-semibold text-[#92400e]"}, o.id),
                  /*#__PURE__*/React.createElement("span", {className:"text-slate-600 truncate max-w-[120px]"}, o.name||"—")
                ),
                /*#__PURE__*/React.createElement("div", {className:"flex items-center gap-1.5 shrink-0"},
                  retVal > 0 && /*#__PURE__*/React.createElement("span", {className:"tabular-nums text-rose-600 font-medium text-xs"}, vnd(retVal)),
                  /*#__PURE__*/React.createElement(ChevronRight, {className:"h-3.5 w-3.5 text-slate-300 group-hover:text-[#92400e]"})
                )
              );
            })
          )
        ),

        /* Trả hàng NCC */
        /*#__PURE__*/React.createElement("div", {className:"rounded-xl border border-slate-200 bg-white p-4"},
          /*#__PURE__*/React.createElement("div", {className:"mb-3 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-[#92400e]"},
            /*#__PURE__*/React.createElement(RefreshCw, {className:"h-3.5 w-3.5"}), "Trả hàng NCC"
          ),
          /*#__PURE__*/React.createElement("div", {className:"flex items-baseline gap-2"},
            /*#__PURE__*/React.createElement("span", {className:"text-2xl font-bold text-slate-800"}, nccRetLots),
            /*#__PURE__*/React.createElement("span", {className:"text-sm text-slate-500"}, "đơn trong kỳ")
          ),
          /*#__PURE__*/React.createElement("div", {className:"mt-3 space-y-1.5"},
            kv("Ghi giảm công nợ NCC", nccRetVal)
          )
        )
      )
    ),

    /* ── LỢI NHUẬN (Accrual) ── */
    /*#__PURE__*/React.createElement("div", null,
      /*#__PURE__*/React.createElement("div", {className:"mb-1 flex items-center gap-2"},
        /*#__PURE__*/React.createElement(TrendingUp, {className:"h-3.5 w-3.5 text-slate-400"}),
        secHd("Lợi nhuận", "Accrual")
      ),
      /*#__PURE__*/React.createElement("p", {className:"mb-3 text-xs italic text-slate-400"}, "Tính theo đơn trong kỳ (gồm cả phần chưa thu tiền). Cột chưa giao là ước tính — chưa tính CPBH vì chi phí chưa phát sinh."),

      /*#__PURE__*/React.createElement("div", {className:"overflow-hidden rounded-xl border border-[#fed7aa] bg-white shadow-sm"},

        /* Header */
        /*#__PURE__*/React.createElement("div", {className:"grid grid-cols-3 border-b border-[#fed7aa] bg-[#ffedd5] px-4 py-2.5"},
          /*#__PURE__*/React.createElement("div", null),
          /*#__PURE__*/React.createElement("div", {className:"text-center"},
            /*#__PURE__*/React.createElement("div", {className:"text-[11px] font-semibold uppercase tracking-wide text-[#92400e]"}, "Đã giao"),
            /*#__PURE__*/React.createElement("div", {className:"text-[11px] text-slate-500"}, expOrders.length+" đơn")
          ),
          /*#__PURE__*/React.createElement("div", {className:"text-center"},
            /*#__PURE__*/React.createElement("div", {className:"text-[11px] font-semibold uppercase tracking-wide text-slate-500"}, "Chưa giao"),
            /*#__PURE__*/React.createElement("div", {className:"text-[11px] text-slate-400"}, pendingOrders.length+" đơn · ước tính")
          )
        ),

        /* Row: Doanh thu */
        /*#__PURE__*/React.createElement("div", {className:"grid grid-cols-3 border-b border-[#fed7aa] px-4 py-3"},
          /*#__PURE__*/React.createElement("div", {className:"flex items-center gap-1.5 text-sm font-medium text-[#92400e]"},
            /*#__PURE__*/React.createElement(ShoppingCart, {className:"h-3.5 w-3.5 text-[#b45309]"}), "Doanh thu"
          ),
          /*#__PURE__*/React.createElement("div", {className:"text-right text-sm font-bold tabular-nums "+(accrualRev > 0 ? "text-[#92400e]" : "text-slate-300")},
            accrualRev > 0 ? vnd(accrualRev) : "—"
          ),
          /*#__PURE__*/React.createElement("div", {className:"text-right text-sm font-semibold tabular-nums "+(pendingRev > 0 ? "text-[#92400e]" : "text-slate-300")},
            pendingRev > 0 ? vnd(pendingRev) : "—"
          )
        ),

        /* Row: Giá vốn */
        /*#__PURE__*/React.createElement("div", {className:"grid grid-cols-3 border-b border-[#fed7aa] px-4 py-3"},
          /*#__PURE__*/React.createElement("div", {className:"flex items-center gap-1.5 text-sm font-medium text-[#92400e]"},
            /*#__PURE__*/React.createElement(Package, {className:"h-3.5 w-3.5 text-[#b45309]"}), "Giá vốn"
          ),
          /*#__PURE__*/React.createElement("div", {className:"text-right text-sm font-bold tabular-nums "+(accrualCOGS > 0 ? "text-[#B91C1C]" : "text-slate-300")},
            accrualCOGS > 0 ? "−"+vnd(accrualCOGS) : "—"
          ),
          /*#__PURE__*/React.createElement("div", {className:"text-right text-sm font-semibold tabular-nums "+(pendingCOGS > 0 ? "text-[#B91C1C]" : "text-slate-300")},
            pendingCOGS > 0 ? "−"+vnd(pendingCOGS) : "—"
          )
        ),

        /* Row: Biên gộp (sub-row) */
        /*#__PURE__*/React.createElement("div", {className:"grid grid-cols-3 border-b border-[#fed7aa] bg-[#ffedd5] px-4 py-2"},
          /*#__PURE__*/React.createElement("div", {className:"text-[11px] italic text-[#92400e]"}, "Biên gộp (DT − GV)"),
          /*#__PURE__*/React.createElement("div", {className:"text-right text-[11px] tabular-nums font-semibold "+(accrualRev === 0 ? "text-slate-300" : accrualGrossProfit > 0 ? "text-emerald-700" : "text-[#B91C1C]")},
            accrualRev > 0 ? (accrualGrossProfit >= 0 ? "" : "−")+vnd(Math.abs(accrualGrossProfit)) : "—"
          ),
          /*#__PURE__*/React.createElement("div", {className:"text-right text-[11px] tabular-nums font-semibold "+(pendingRev === 0 ? "text-slate-300" : pendingGrossProfit > 0 ? "text-emerald-600" : "text-[#B91C1C]")},
            pendingRev > 0 ? (pendingGrossProfit >= 0 ? "" : "−")+vnd(Math.abs(pendingGrossProfit)) : "—"
          )
        ),

        /* Row: CPBH */
        /*#__PURE__*/React.createElement("div", {className:"grid grid-cols-3 border-b border-[#fed7aa] px-4 py-3"},
          /*#__PURE__*/React.createElement("div", null,
            /*#__PURE__*/React.createElement("div", {className:"flex items-center gap-1.5 text-sm font-medium text-[#92400e]"},
              /*#__PURE__*/React.createElement(ReceiptText, {className:"h-3.5 w-3.5 text-[#b45309]"}), "CPBH"
            ),
            accrualCPBH > 0 && /*#__PURE__*/React.createElement("div", {className:"mt-1 space-y-0.5 pl-5"},
              accrualShip > 0 && /*#__PURE__*/React.createElement("div", {className:"text-[11px] text-[#92400e]"}, "VC nhập: "+vnd(accrualShip)),
              accrualCompShip > 0 && /*#__PURE__*/React.createElement("div", {className:"text-[11px] text-[#92400e]"}, "Ship: "+vnd(accrualCompShip)),
              accrualCompComm > 0 && /*#__PURE__*/React.createElement("div", {className:"text-[11px] text-[#92400e]"}, "Hoa hồng: "+vnd(accrualCompComm)),
              accrualCompInst > 0 && /*#__PURE__*/React.createElement("div", {className:"text-[11px] text-[#92400e]"}, "Lắp đặt: "+vnd(accrualCompInst)),
              accrualExp > 0 && /*#__PURE__*/React.createElement("div", {className:"text-[11px] text-[#92400e]"}, "Khác: "+vnd(accrualExp))
            )
          ),
          /*#__PURE__*/React.createElement("div", {className:"text-right text-sm font-bold tabular-nums "+(accrualCPBH > 0 ? "text-[#B91C1C]" : "text-slate-300")},
            accrualCPBH > 0 ? "−"+vnd(accrualCPBH) : "—"
          ),
          /*#__PURE__*/React.createElement("div", {className:"flex items-center justify-end gap-1 text-[11px] italic text-slate-400"},
            /*#__PURE__*/React.createElement("span", {className:"inline-block h-1 w-1 rounded-full bg-slate-300"}),
            "chưa phát sinh"
          )
        ),

        /* Row: Lợi nhuận */
        /*#__PURE__*/React.createElement("div", {className:"grid grid-cols-3 px-4 py-4 "+(accrualRev === 0 ? "bg-[#ffedd5]" : accrualProfit > 0 ? "bg-emerald-50" : accrualProfit < 0 ? "bg-rose-50" : "bg-[#ffedd5]")},
          /*#__PURE__*/React.createElement("div", {className:"flex items-center gap-1.5 text-sm font-semibold "+(accrualRev === 0 ? "text-[#92400e]" : accrualProfit > 0 ? "text-emerald-700" : accrualProfit < 0 ? "text-rose-700" : "text-[#92400e]")},
            /*#__PURE__*/React.createElement(Sparkles, {className:"h-3.5 w-3.5"}), "Lợi nhuận"
          ),
          /*#__PURE__*/React.createElement("div", null,
            /*#__PURE__*/React.createElement("div", {className:"text-right text-lg font-bold tabular-nums "+(accrualRev === 0 ? "text-slate-300" : accrualProfit > 0 ? "text-emerald-600" : accrualProfit < 0 ? "text-[#B91C1C]" : "text-slate-300")},
              accrualRev > 0 && accrualProfit !== 0 ? (accrualProfit < 0 ? "−" : "")+vnd(Math.abs(accrualProfit)) : "—"
            ),
            accrualRev > 0 && /*#__PURE__*/React.createElement("div", {className:"text-right text-[11px] text-[#92400e]"}, "Biên "+margin+"% · DT−GV−CPBH")
          ),
          /*#__PURE__*/React.createElement("div", null,
            /*#__PURE__*/React.createElement("div", {className:"text-right text-sm font-semibold tabular-nums "+(pendingRev === 0 ? "text-slate-300" : pendingGrossProfit > 0 ? "text-emerald-600" : pendingGrossProfit < 0 ? "text-[#B91C1C]" : "text-slate-300")},
              pendingRev > 0 && pendingGrossProfit !== 0 ? (pendingGrossProfit < 0 ? "−" : "")+vnd(Math.abs(pendingGrossProfit)) : "—"
            ),
            pendingRev > 0 && /*#__PURE__*/React.createElement("div", {className:"text-right text-[11px] text-[#92400e]"}, "Biên "+pendingGrossMargin+"% · chưa trừ CPBH")
          )
        )
      )
    )
  );
}

/* ───────── Batch Kho Modal ───────── */
function BatchKhoModal({ orders, onClose, onConfirm }) {
  const supplierCosts = useSupplierCosts();
  const targets = orders.filter(o =>
    !o.draft && o.deliveryConfirmed && !o.imported &&
    o.orderStatus !== "Huỷ" && o.orderStatus !== "Hủy"
  ).sort((a, b) => parseViDate(a.dt) - parseViDate(b.dt));

  const preview = targets.map(ord => {
    const costs = (ord.items || []).map(it => lookupImportCost(it.name, ord.dt, supplierCosts));
    return { ...ord, _costs: costs };
  });

  const totalOrders = preview.length;
  const emptyCount = preview.reduce((s, o) => s + o._costs.filter(c => c === null).length, 0);

  const emptyOrders = preview.filter(o => o._costs.some(c => c === null)).map(o => o.id);

  const doConfirm = () => { onConfirm(preview); onClose(); };

  const th = "px-3 py-2 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wide bg-slate-50";
  const td = "px-3 py-1.5 text-sm";

  if (totalOrders === 0) return /*#__PURE__*/React.createElement(Modal, { title: "Xử lý kho hàng loạt", onClose },
    /*#__PURE__*/React.createElement("div", { className: "py-10 text-center text-sm text-slate-400 p-6" },
      "Không có đơn nào đã giao hàng cần xử lý kho."
    )
  );

  return /*#__PURE__*/React.createElement(Modal, {
    title: "Xử lý kho hàng loạt",
    sub: totalOrders + " đơn đã giao hàng chưa nhập/xuất kho",
    onClose, maxW: "max-w-3xl",
    footer: /*#__PURE__*/React.createElement(React.Fragment, null,
      /*#__PURE__*/React.createElement("button", { onClick: onClose, className: ghostBtn }, "Hủy"),
      /*#__PURE__*/React.createElement("button", { onClick: doConfirm, className: blueBtn },
        "↓↑ Xác nhận " + totalOrders + " đơn"
      )
    )
  },
    /*#__PURE__*/React.createElement("div", { className: "p-4 space-y-3" },
      emptyCount > 0 && /*#__PURE__*/React.createElement("div", { className: "rounded-lg bg-amber-50 border border-amber-200 px-4 py-2.5 text-sm text-amber-800" },
        "⚠ ", /*#__PURE__*/React.createElement("strong", null, emptyCount + " sản phẩm"),
        " không tìm được giá nhập → sẽ để 0đ. Sau khi xử lý, mở từng đơn để sửa thủ công: ",
        /*#__PURE__*/React.createElement("span", { className: "font-mono" }, emptyOrders.join(", "))
      ),
      /*#__PURE__*/React.createElement("div", { className: "overflow-auto max-h-[58vh] rounded-lg border border-slate-200" },
        /*#__PURE__*/React.createElement("table", { className: "w-full text-left border-collapse" },
          /*#__PURE__*/React.createElement("thead", null,
            /*#__PURE__*/React.createElement("tr", { className: "border-b border-slate-200" },
              /*#__PURE__*/React.createElement("th", { className: th }, "Đơn hàng"),
              /*#__PURE__*/React.createElement("th", { className: th }, "Ngày"),
              /*#__PURE__*/React.createElement("th", { className: th }, "Khách hàng"),
              /*#__PURE__*/React.createElement("th", { className: th }, "Sản phẩm"),
              /*#__PURE__*/React.createElement("th", { className: th + " text-center" }, "SL"),
              /*#__PURE__*/React.createElement("th", { className: th + " text-right" }, "Giá nhập")
            )
          ),
          /*#__PURE__*/React.createElement("tbody", null,
            preview.flatMap((ord, oi) =>
              (ord.items || []).map((it, ii) => {
                const cost = ord._costs[ii];
                const isFirst = ii === 0;
                const rowspan = (ord.items || []).length;
                return /*#__PURE__*/React.createElement("tr", {
                  key: ord.id + "-" + ii,
                  className: "border-b border-slate-100 " + (oi % 2 === 0 ? "bg-white" : "bg-slate-50/40")
                },
                  isFirst && /*#__PURE__*/React.createElement("td", { className: td + " font-mono text-xs text-[#92400e] font-semibold whitespace-nowrap", rowSpan: rowspan }, ord.id),
                  isFirst && /*#__PURE__*/React.createElement("td", { className: td + " text-xs text-slate-500 whitespace-nowrap", rowSpan: rowspan }, (ord.dt || "").replace(/.*?(\d{2}\/\d{2}\/\d{4}).*/, "$1")),
                  isFirst && /*#__PURE__*/React.createElement("td", { className: td + " text-sm text-slate-700 whitespace-nowrap", rowSpan: rowspan }, ord.name),
                  /*#__PURE__*/React.createElement("td", { className: td + " text-xs text-slate-600 max-w-[200px]" }, it.name),
                  /*#__PURE__*/React.createElement("td", { className: td + " text-xs text-center tabular-nums" }, "×" + it.qty),
                  /*#__PURE__*/React.createElement("td", {
                    className: td + " text-xs text-right tabular-nums whitespace-nowrap " + (cost === null ? "text-amber-600 font-semibold" : "text-slate-700")
                  }, cost === null ? "⚠ Nhập tay" : vnd(cost) + "đ")
                );
              })
            )
          )
        )
      )
    )
  );
}

/* ───────── Sales module ───────── */
function SalesModule({
  orders,
  setOrders,
  sub,
  setActive,
  openOrderId,
  setOpenOrderId,
  onExportKho,
  onImportKho,
  setWhInSearch
}) {
  const [view, setView] = useState(openOrderId ? {edit: openOrderId} : "list");
  React.useEffect(() => { if (openOrderId) { setView({edit: openOrderId}); setOpenOrderId && setOpenOrderId(null); } }, [openOrderId]);
  const [modal, setModal] = useState(null);
  const [listFromDate, setListFromDate] = useState(localMonthStart());
  const [listToDate, setListToDate] = useState(localToday());
  const {docNums, setDocNums} = useDocNum();
  const nextId = (prefix) => {
    const row = docNums.find(r => r.prefix === prefix);
    let num = row ? row.num : 1;
    // Bỏ qua các ID đã tồn tại (tránh xung đột khi counter lệch do migrate)
    while (orders.some(o => o.id === fmtDocId(prefix, num))) num++;
    if (setDocNums) setDocNums(ds => ds.map(r => r.prefix === prefix ? {...r, num: num + 1} : r));
    return fmtDocId(prefix, num);
  };
  const addOrder = (o, asDraft) => {
    // Nếu pendingOrderId đã tồn tại trong orders, tìm ID mới
    const proposedId = o.id && !asDraft ? o.id : null;
    const id = asDraft ? nextId("BG")
      : (proposedId && !orders.some(x => x.id === proposedId)) ? proposedId
      : nextId("DH");
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
  const cloneOrder = (o) => {
    const newId = nextId("BG");
    const { _id, draftStatus, linkedOrderId, ...rest } = o;
    setOrders(p => [mkOrder({ ...rest, id: newId, draft: true, draftStatus: "Chưa tạo đơn hàng",
      dt: new Date().toLocaleString("vi-VN", {hour12:false}).replace(",","") }), ...p]);
  };
  const saveEdit = (id, o, dt) => {
    setOrders(os => os.map(x => x.id === id ? {
      ...x,
      ...o
    } : x));
    if (dt) {
      const parts = String(dt).split(" ");
      const datePart = parts.find(p => p.includes("/")) || "";
      const [, mm, yy] = datePart.split("/");
      if (yy && mm) {
        const endDay = new Date(+yy, +mm, 0).getDate();
        setListFromDate(`${yy}-${mm.padStart(2,"0")}-01`);
        setListToDate(`${yy}-${mm.padStart(2,"0")}-${String(endDay).padStart(2,"0")}`);
      }
    }
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
  const [batchModal, setBatchModal] = useState(false);
  const handleBatchKho = (previewOrders) => {
    if (!previewOrders.length) return;
    const allIn = [], allOut = [];
    previewOrders.forEach((ord, oi) => {
      const pn = "PN" + String(ord.id).replace(/\D/g, "");
      // Lấy ngày từ đơn hàng: trích DD/MM/YYYY từ ord.dt
      const ordDateStr = String(ord.dt || "").match(/\d{2}\/\d{2}\/\d{4}/)?.[0] || ord.dt || "";
      const ordDt = ord.dt || ordDateStr;
      (ord.items || []).forEach((it, i) => {
        const cost = ord._costs[i] || 0;
        allIn.push({ lot: pn + ((ord.items.length > 1) ? "_" + i : ""), date: ordDateStr, prod: it.name, store: "Kho HH", kho: "HH", qtyIn: it.qty, qtyNow: it.qty, qtyRemaining: it.qty, costNcc: cost, unitCost: cost, fee: 0, supplier: it.supplier || "", order: ord.id, staff: "", pay: "Chưa thanh toán" });
        allOut.push({ slip: "PX" + String(ord.id).replace(/\D/g, "") + "_" + i, dt: ordDt, order: ord.id, sku: it.sku || "", prod: it.name, supplier: it.supplier || "", store: "Kho HH", kho: "HH", lot: "", qty: it.qty, sale: it.price, unitCost: cost, cust: ord.name, phone: ord.phone || "", addr: ord.addr || "", orderStatus: "Chờ xử lý", delivery: ord.delivery || "Đã giao hàng", staff: "" });
      });
    });
    setOrders(os => os.map(o => {
      const m = previewOrders.find(p => p.id === o.id);
      if (!m) return o;
      const ordDateStr = String(o.dt || "").match(/\d{2}\/\d{2}\/\d{4}/)?.[0] || "";
      return { ...o, imported: true, exported: true, pn: "PN" + String(o.id).replace(/\D/g, ""), px: "PX" + String(o.id).replace(/\D/g, ""), dateIn: ordDateStr, dateOut: ordDateStr, items: (o.items || []).map((it, i) => ({ ...it, cost: m._costs[i] || 0 })) };
    }));
    if (onImportKho && allIn.length) onImportKho(allIn);
    if (onExportKho && allOut.length) onExportKho(allOut);
  };
  const current = modal && orders.find(o => o.id === modal.id);
  if (view === "create") return /*#__PURE__*/React.createElement(CreateOrder, {
    isDraft: sub === "draft",
    onBack: () => setView("list"),
    onSave: addOrder,
    orders,
    setActive,
    setWhInSearch
  });
  if (view && view.edit) {
    const eo = orders.find(o => o.id === view.edit);
    if (eo) return /*#__PURE__*/React.createElement(CreateOrder, {
      editOrder: eo,
      onBack: () => setView("list"),
      onSaveEdit: o => saveEdit(eo.id, o, eo.dt),
      onQuickSave: o => setOrders(os => os.map(x => x.id === eo.id ? {...x, ...o} : x)),
      onSave: addOrder,
      onConvertDraft: eo.draft
        ? dhId => setOrders(os => os.map(o => o.id === eo.id ? {...o, draftStatus: "Đã tạo đơn hàng", linkedOrderId: dhId} : o))
        : undefined,
      onExportKho,
      onImportKho,
      orders,
      setActive,
      setWhInSearch
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
    onDelete: id => setOrders(os => os.filter(o => o.id !== id)),
    onClone: cloneOrder,
    onOpenOrder: id => setView({edit: id})
  }) : /*#__PURE__*/React.createElement(OrderTable, {
    orders: orders.filter(o => !o.draft),
    onNew: () => setView("create"),
    onEdit: o => setView({
      edit: o.id
    }),
    onDelete: id => deleteOrderCascade(id).catch(console.error),
    onKho: o => setModal({
      mode: "kho",
      id: o.id
    }),
    onReturn: o => setModal({
      mode: "return",
      id: o.id
    }),
    onBatchKho: () => setBatchModal(true),
    initFrom: listFromDate,
    initTo: listToDate
  }), batchModal && /*#__PURE__*/React.createElement(BatchKhoModal, {
    orders: orders.filter(o => !o.draft),
    onClose: () => setBatchModal(false),
    onConfirm: handleBatchKho
  }), current && modal.mode === "kho" && /*#__PURE__*/React.createElement(KhoModal, {
    order: current,
    onClose: () => setModal(null),
    onGoToWhIn: (pn) => { setModal(null); if (setWhInSearch) setWhInSearch(pn || ""); setActive && setActive("wh_in"); },
    onConfirm: p => {
      const ord = current;
      applyKho(ord.id, p);
      const now = new Date();
      const dateStr = now.toLocaleDateString("vi-VN");
      const dt = dateStr + " " + now.toLocaleTimeString("vi-VN", {hour:"2-digit", minute:"2-digit"});
      const base = now.toISOString().slice(0,10).replace(/-/g,"");
      if (!p.allExported && onImportKho) {
        const inSlips = (ord.items || []).map((it, i) => {
          const costNcc = p.items[i]?.cost || it.cost || 0;
          return {
            lot: (p.pn || ("PN" + base + "_" + String(Date.now()).slice(-4))) + (ord.items.length > 1 ? "_" + i : ""),
            date: dateStr,
            prod: it.name,
            store: ord.store || "Kho HH",
            qtyIn: it.qty,
            qtyNow: it.qty,
            qtyRemaining: it.qty,
            costNcc,
            unitCost: costNcc,
            fee: 0,
            supplier: p.items[i]?.supplier || it.supplier || "",
            order: ord.id,
            staff: _staffName,
            pay: "Chưa thanh toán"
          };
        });
        onImportKho(inSlips);
      }
      if (p.allExported && onExportKho) {
        const slips = (ord.items || []).map((it, i) => ({
          slip: nextId("PX"),
          dt,
          order: ord.id,
          sku: it.sku || "",
          prod: it.name,
          supplier: p.items[i]?.supplier || it.supplier || "",
          store: ord.store || "Kho HH",
          lot: "",
          qty: it.qty,
          sale: it.price,
          unitCost: p.items[i]?.cost || it.cost || 0,
          cust: ord.name,
          phone: ord.phone || "",
          addr: ord.addr || "",
          orderStatus: "Chờ xử lý",
          delivery: ord.delivery || "Chưa giao hàng",
          staff: _staffName
        }));
        onExportKho(slips);
      }
    }
  }), current && modal.mode === "return" && /*#__PURE__*/React.createElement(ReturnModal, {
    order: current,
    onClose: () => setModal(null),
    onConfirm: ({rows}) => {
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
  initial,
  remaining
}) {
  const { profile: _pmProfile } = useAuth();
  const _staffName = _pmProfile?.name || "Quản lý";
  const [kind, setKind] = useState(initial?.kind || "Đặt cọc");
  const [amount, setAmount] = useState(initial?.amount || 0);
  const handleKind = s => {
    setKind(s);
    if (s === "Thanh toán" && remaining > 0) setAmount(remaining);
    else if (kind === "Thanh toán") setAmount(0);
  };
  const [account, setAccount] = useState(initial?.account || accounts[0]);
  const [note, setNote] = useState(initial?.note || "");
  const todayISO = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`; };
  const [payDate, setPayDate] = useState(todayISO);
  const lbl = "mb-1 block text-[13px] font-medium text-slate-500";
  const inp = "w-full rounded-md border border-slate-200 px-2.5 py-1.5 text-sm focus:border-[#fed7aa] focus:outline-none";
  return /*#__PURE__*/React.createElement(Modal, {
    title: "Thêm thanh toán",
    sub: "Mỗi khoản thu sẽ sinh 1 phiếu thu link sang Tài chính",
    maxW: "max-w-lg",
    onClose: onClose,
    footer: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("button", {
      onClick: onClose,
      className: "rounded-lg border border-slate-200 px-3.5 py-2 text-sm text-slate-600 hover:bg-slate-50"
    }, "Huỷ"), /*#__PURE__*/React.createElement("button", {
      onClick: () => { const _now = new Date(); const [yr,mo,dy] = payDate.split("-"); const dateViVN = `${dy}/${mo}/${yr}`; onConfirm({kind, amount, account, note, staff: _staffName, date: dateViVN, datetime: _now.toLocaleTimeString("vi-VN",{hour:"2-digit",minute:"2-digit",second:"2-digit"}) + " " + dateViVN}); },
      disabled: amount <= 0 && kind !== "Giảm giá thêm",
      className: "rounded-lg bg-[#92400e] px-3.5 py-2 text-sm font-medium text-white hover:bg-[#78350f] disabled:bg-slate-300"
    }, "Xác nhận"))
  }, /*#__PURE__*/React.createElement("div", {
    className: "space-y-3"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: lbl
  }, "Loại"), /*#__PURE__*/React.createElement("div", {className: "flex gap-2"},
    ["Đặt cọc", "Thanh toán", "Giảm giá thêm"].map(s => /*#__PURE__*/React.createElement("button", {
      key: s, type: "button",
      onClick: () => handleKind(s),
      className: `flex-1 rounded-lg border px-2.5 py-1.5 text-sm font-medium transition ${kind === s ? "border-[#fcd34d] bg-[#fef3c7] text-[#b45309]" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"}`
    }, s)))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: lbl
  }, "Ngày"), /*#__PURE__*/React.createElement("input", {
    type: "date",
    className: inp,
    value: payDate,
    max: todayISO(),
    onChange: e => setPayDate(e.target.value)
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
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
const stockOfStatic = name => { const p = PRODUCTS.find(x => x.name === name); return p ? p.stock : 0; };
const stockOfLive = (name, whInItems) => whInItems.filter(r => r.prod === name).reduce((s, r) => s + (r.qtyRemaining ?? r.qtyNow ?? 0), 0);
const skuOf = name => {
  const p = PRODUCTS.find(x => x.name === name);
  return p ? p.sku : "";
};
function KhoModal({ order, onClose, onConfirm, onGoToWhIn, initTab }) {
  const { profile: _khoProfile } = useAuth();
  const _staffName = _khoProfile?.name || "Quản lý";
  const { whInItems: _inv, setWhInItems: _setWhIn, whOutItems: _whOut } = useInventory();
  // Local cache: seed từ order.wh_lots (persistent) + lots mới tạo trong session
  const [sessionLots, setSessionLots] = useState(order.wh_lots || []);
  const mergedInv = React.useMemo(() => {
    const fsKeys = new Set((_inv||[]).map(l => l.lot+"~~"+l.prod));
    return [...(_inv||[]), ...sessionLots.filter(l => !fsKeys.has(l.lot+"~~"+l.prod))];
  }, [_inv, sessionLots]);
  const stockOf = name => stockOfLive(name, mergedInv) || stockOfStatic(name);
  const [tab, setTab] = useState(initTab || (order.imported && !order.exported ? "xuat" : "nhap"));
  const [editing, setEditing] = useState(false);

  // ── Tab 1: Nhập kho ──────────────────────────────────────────────────────
  const [imported, setImported] = useState(!!order.imported);
  const [pn, setPn] = useState(order.pn || ("PN" + String(order.id).replace(/\D/g, "")));
  const [dateIn, setDateIn] = useState(order.dateIn || localToday());
  const [khoChung, setKhoChung] = useState((order.items || [])[0]?.kho || "HH");
  const [importRows, setImportRows] = useState(() =>
    (order.items || []).map(it => ({
      name: it.name,
      slDat: it.qty,
      slNhap: Math.max(0, it.qty - (stockOf(it.name) || 0)),
      giaNhap: it.cost || 0,
      cpmh: 0,
      nccIn: it.supplier || "",
    }))
  );
  const setIRow = (i, p) => setImportRows(xs => xs.map((x, k) => k === i ? { ...x, ...p } : x));
  const lockIn = imported && !editing;
  const cpmhTotal = importRows.reduce((s, r) => s + (r.cpmh || 0), 0);
  const ttNhap = r => r.slNhap * r.giaNhap + (r.cpmh || 0);
  const totalTtNhap = importRows.reduce((s, r) => s + ttNhap(r), 0);

  // ── Tab 2: Xuất kho ──────────────────────────────────────────────────────
  const [exported, setExported] = useState(!!order.exported);
  const [px, setPx] = useState(order.px || ("PX" + String(order.id).replace(/\D/g, "")));
  const [dateOut, setDateOut] = useState(order.dateOut || localToday());
  const [exportRows, setExportRows] = useState(() => {
    const existing = (_whOut || []).filter(r => r.order === order.id);
    if (existing.length > 0) {
      return existing.map(r => ({
        id: r.slip + "_r",
        name: r.prod,
        lotRef: r.lot || "",
        slDon: r.qty,
        slXuat: r.qty,
        giaBan: r.sale || 0,
      }));
    }
    return (order.items || []).map(it => {
      const lots = mergedInv.filter(l => l.prod === it.name && (l.qtyRemaining ?? l.qtyNow ?? 0) > 0);
      const best = lots.sort((a, b) => (b.qtyRemaining ?? b.qtyNow ?? 0) - (a.qtyRemaining ?? a.qtyNow ?? 0))[0];
      return { id: it.name + "_0", name: it.name, lotRef: best?.lot || "", slDon: it.qty, slXuat: it.qty, giaBan: it.price || 0 };
    });
  });
  const setERow = (i, p) => setExportRows(xs => xs.map((x, k) => k === i ? { ...x, ...p } : x));
  const addERow = (name, slDon, giaBan) => setExportRows(xs => [...xs, { id: name + "_" + Date.now(), name, lotRef: "", slDon, slXuat: 0, giaBan }]);
  const delERow = i => setExportRows(xs => xs.filter((_, k) => k !== i));
  const lockOut = exported && !editing;
  // Tự fill lotRef khi mergedInv cập nhật (Firestore hoặc sessionLots)
  React.useEffect(() => {
    setExportRows(prev => prev.map(r => {
      if (r.lotRef) return r;
      const lots = mergedInv.filter(l => l.prod === r.name && (l.qtyRemaining ?? l.qtyNow ?? 0) > 0);
      if (!lots.length) return r;
      const best = lots.sort((a, b) => (b.qtyRemaining ?? b.qtyNow ?? 0) - (a.qtyRemaining ?? a.qtyNow ?? 0))[0];
      return { ...r, lotRef: best.lot };
    }));
  }, [mergedInv]);
  const ttXuat = r => r.slXuat * r.giaBan;
  const totalTtXuat = exportRows.reduce((s, r) => s + ttXuat(r), 0);

  // ── Tab 3: Xử lý kho ────────────────────────────────────────────────────
  const cpbhList = (order.compCosts || []).filter(c => ["Chi phí Ship hàng", "Chi phí hoa hồng", "Chi phí lắp đặt"].includes(c.type));
  const totalCpbh = cpbhList.reduce((s, c) => s + (c.amount || 0), 0);
  const xlyRows = exportRows.map(r => {
    const lot = mergedInv.find(l => l.lot === r.lotRef && l.prod === r.name);
    const uc = lot ? (lot.unitCost ?? lot.costNcc ?? 0) : 0;
    const ttN = r.slXuat * uc, ttB = r.slXuat * r.giaBan;
    return { ...r, lotLabel: r.lotRef ? impCode(r.lotRef) : "", uc, ttN, ttB, loi: ttB - ttN };
  });
  const totalLoi = xlyRows.reduce((s, r) => s + r.loi, 0);
  const conLai = totalLoi - totalCpbh;

  // ── Actions ──────────────────────────────────────────────────────────────
  const doImport = () => {
    const missNcc = importRows.filter(r => r.slNhap > 0 && !r.nccIn.trim());
    if (missNcc.length) { alert("Vui lòng nhập tên NCC cho: " + missNcc.map(r => r.name).join(", ")); return; }
    const missGia = importRows.filter(r => r.slNhap > 0 && !(r.giaNhap > 0));
    if (missGia.length) { alert("Vui lòng nhập giá nhập cho: " + missGia.map(r => r.name).join(", ")); return; }
    // Upsert từng dòng: cập nhật nếu tồn tại (lot, prod), thêm mới nếu chưa có
    const newLots = [];
    _setWhIn(prev => {
      let result = [...prev];
      for (const r of importRows.filter(row => row.slNhap > 0 && row.nccIn.trim())) {
        const uc = r.slNhap > 0 ? Math.round((r.giaNhap * r.slNhap + (r.cpmh || 0)) / r.slNhap) : r.giaNhap;
        const rec = {
          lot: pn, prod: r.name,
          qtyIn: r.slNhap, qtyNow: r.slNhap, qtyRemaining: r.slNhap,
          costNcc: r.giaNhap, unitCost: uc,
          fee: r.cpmh || 0, supplier: r.nccIn,
          store: khoChung, kho: khoChung,
          date: dateIn, order: order.id, staff: _staffName, pay: "Chưa thanh toán",
        };
        newLots.push(rec);
        const idx = result.findIndex(l => l.lot === pn && l.prod === r.name);
        if (idx >= 0) result[idx] = { ...result[idx], ...rec };
        else result = [rec, ...result];
      }
      return result;
    });
    // Cập nhật local cache ngay lập tức (không chờ Firestore onSnapshot)
    setSessionLots(prev => {
      const keys = new Set(prev.map(l => l.lot+"~~"+l.prod));
      return [...prev, ...newLots.filter(l => !keys.has(l.lot+"~~"+l.prod))];
    });
    setImported(true); setEditing(false);
    onConfirm({ allExported: exported, pn, px, dateIn, dateOut, importExpense: cpmhTotal, kho: khoChung, isEditImport: editing, wh_lots: newLots, items: importRows.map(r => ({ cost: r.giaNhap, supplier: r.nccIn, cpmh: r.cpmh || 0, slNhap: r.slNhap })) });
  };
  const doExport = () => {
    // Kiểm tra không xuất vượt tồn kho
    const overStock = exportRows.filter(r => {
      if (!r.lotRef) return false;
      const lot = mergedInv.find(l => l.lot === r.lotRef && l.prod === r.name);
      return lot && r.slXuat > (lot.qtyRemaining ?? lot.qtyNow ?? 0);
    });
    if (overStock.length > 0) {
      notify("⚠️ Số lượng xuất vượt tồn kho: " + overStock.map(r => r.name).join(", "));
      return;
    }
    _setWhIn(prev => {
      const upd = prev.map(l => {
        const used = exportRows.filter(r => r.lotRef === l.lot && r.name === l.prod).reduce((s, r) => s + r.slXuat, 0);
        if (!used) return l;
        const rem = (l.qtyRemaining ?? l.qtyNow ?? 0) - used;
        return { ...l, qtyRemaining: rem, qtyNow: rem };
      });
      return upd;
    });
    setExported(true); setEditing(false);
    onConfirm({ allExported: true, pn, px, dateIn, dateOut, importExpense: cpmhTotal, kho: khoChung, items: importRows.map(r => ({ cost: r.giaNhap, supplier: r.nccIn, cpmh: r.cpmh || 0, slNhap: r.slNhap })), exportRows });
    onClose();
  };
  const doEdit = () => {
    if (exported) {
      _setWhIn(prev => prev.map(l => {
        const used = exportRows.filter(r => r.lotRef === l.lot && r.name === l.prod).reduce((s, r) => s + r.slXuat, 0);
        if (!used) return l;
        const rem = (l.qtyRemaining ?? l.qtyNow ?? 0) + used;
        return { ...l, qtyRemaining: rem, qtyNow: rem };
      }));
    }
    setEditing(true);
  };

  // ── Style helpers ─────────────────────────────────────────────────────────
  const fi = "w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-[#fed7aa] focus:outline-none";
  const ic = cls => "rounded-lg border border-slate-200 px-1.5 py-1.5 text-sm text-center focus:border-[#fed7aa] focus:outline-none " + (cls || "");
  const TH = (t, c) => React.createElement("th", { className: "px-3 py-2 text-xs font-semibold uppercase tracking-wide text-amber-900/70 " + (c || "") }, t);
  const MC = (v, c) => React.createElement("td", { className: "px-3 py-3 text-right text-sm font-semibold tabular-nums " + (c || "") }, num(v));

  // ── Tab 1 render ──────────────────────────────────────────────────────────
  const renderNhap = () => React.createElement(React.Fragment, null,
    React.createElement("div", { className: "mb-4 grid grid-cols-3 gap-4 rounded-xl border border-slate-200 bg-slate-50/50 p-4" },
      React.createElement("div", null,
        React.createElement("label", { className: "mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500" }, "Số phiếu nhập"),
        onGoToWhIn
          ? React.createElement("button", { onClick: () => onGoToWhIn(pn), className: fi + " w-full text-left text-[#92400e] hover:underline cursor-pointer", title: "Xem trong danh sách phiếu nhập kho" }, pn)
          : React.createElement("input", { className: fi, value: pn, disabled: lockIn, onChange: e => setPn(e.target.value) })),
      React.createElement("div", null,
        React.createElement("label", { className: "mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500" }, "Ngày nhập"),
        React.createElement("input", { type: "date", className: fi, value: dateIn, disabled: lockIn, onChange: e => setDateIn(e.target.value) })),
      React.createElement("div", null,
        React.createElement("label", { className: "mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500" }, "Kho hàng (*)"),
        React.createElement("select", { className: fi, disabled: lockIn, value: khoChung, onChange: e => setKhoChung(e.target.value) },
          React.createElement("option", { value: "" }, "Chọn kho"),
          React.createElement("option", { value: "HH" }, "HH"),
          React.createElement("option", { value: "TB" }, "TB"),
          React.createElement("option", { value: "HG" }, "HG")))),
    React.createElement("datalist", { id: "ncc-kho" }, SUPPLIERS.map(s => React.createElement("option", { key: s.code, value: s.name }))),
    React.createElement("div", { className: "overflow-x-auto rounded-xl border border-slate-200" },
      React.createElement("table", { className: "w-full text-sm" },
        React.createElement("thead", { className: "border-b border-[#fdba74] bg-[#ffedd5]" },
          React.createElement("tr", null,
            TH("Sản phẩm", "text-left"),
            TH("SL nhập"),
            TH("Giá nhập (*)"),
            TH("CPMH"),
            TH("Thành tiền", "text-right text-[#92400e]"),
            TH("Tên NCC (*)"),
            TH("SL Đặt"),
            TH("Tồn kho"))),
        React.createElement("tbody", null,
          importRows.map((r, i) => {
            const stk = stockOf(r.name);
            return React.createElement("tr", { key: r.name, className: "border-b border-slate-100 align-middle" },
              React.createElement("td", { className: "px-3 py-3 text-slate-800", style: { minWidth: 200 } }, r.name),
              React.createElement("td", { className: "px-2 py-3 text-center" },
                React.createElement("input", { type: "number", className: ic("w-16"), disabled: lockIn, value: r.slNhap, onChange: e => setIRow(i, { slNhap: +e.target.value }) })),
              React.createElement("td", { className: "px-2 py-3" },
                React.createElement(NumInput, { className: ic("w-28"), align: "center", disabled: lockIn, value: r.giaNhap, onChange: v => setIRow(i, { giaNhap: v }) })),
              React.createElement("td", { className: "px-2 py-3" },
                React.createElement(NumInput, { className: ic("w-24"), align: "center", disabled: lockIn, value: r.cpmh, onChange: v => setIRow(i, { cpmh: v }) })),
              MC(ttNhap(r), "text-[#92400e]"),
              React.createElement("td", { className: "px-2 py-3" },
                React.createElement("input", { className: ic("w-44 text-left") + ((r.slNhap > 0 && !r.nccIn.trim() && !lockIn) ? " !border-amber-300 bg-amber-50" : ""), disabled: lockIn, list: "ncc-kho", placeholder: r.slNhap > 0 ? "Nhập tên NCC (*)" : "Không bắt buộc", value: r.nccIn, onChange: e => setIRow(i, { nccIn: e.target.value }) })),
              React.createElement("td", { className: "px-3 py-3 text-center text-sm font-semibold text-slate-600" }, r.slDat),
              React.createElement("td", { className: "px-3 py-3 text-center" },
                React.createElement("span", { className: "rounded px-1.5 py-0.5 text-xs font-medium " + ((stk || 0) === 0 ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700") }, stk ?? "")));
          }),
          React.createElement("tr", { className: "border-t border-slate-200 bg-slate-50" },
            React.createElement("td", { className: "px-3 py-3 text-sm font-bold uppercase text-slate-700" }, "Tổng cộng"),
            React.createElement("td", { colSpan: 3 }),
            MC(totalTtNhap, "text-[#92400e] font-bold"),
            React.createElement("td", { colSpan: 3 }))))));

  // ── Tab 2 render ──────────────────────────────────────────────────────────
  const renderXuat = () => React.createElement(React.Fragment, null,
    !order.deliveryConfirmed && React.createElement("div", { className: "mb-4 flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3" },
      React.createElement("span", { className: "text-amber-500" }, "⚠️"),
      React.createElement("p", { className: "text-sm text-amber-800" }, "Đơn hàng chưa được xác nhận giao hàng.")),
    React.createElement("div", { className: "mb-4 grid grid-cols-2 gap-4 rounded-xl border border-slate-200 bg-slate-50/50 p-4" },
      React.createElement("div", null,
        React.createElement("label", { className: "mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500" }, "Số phiếu xuất"),
        React.createElement("input", { className: fi, value: px, disabled: lockOut, onChange: e => setPx(e.target.value) })),
      React.createElement("div", null,
        React.createElement("label", { className: "mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500" }, "Ngày xuất"),
        React.createElement("input", { type: "date", className: fi, value: dateOut, disabled: lockOut, onChange: e => setDateOut(e.target.value) }))),
    React.createElement("div", { className: "overflow-x-auto rounded-xl border border-slate-200" },
      React.createElement("table", { className: "w-full text-sm" },
        React.createElement("thead", { className: "border-b border-[#fdba74] bg-[#ffedd5]" },
          React.createElement("tr", null,
            TH("Tên sản phẩm", "text-left"),
            TH("Lô hàng"),
            TH("SL tồn"),
            TH("SL đơn"),
            TH("SL xuất"),
            TH("Giá bán"),
            TH("Thành tiền", "text-right text-[#c2410c]"),
            TH(""))),
        React.createElement("tbody", null,
          exportRows.map((r, i) => {
            const isFirst = exportRows.findIndex(x => x.name === r.name) === i;
            const cnt = exportRows.filter(x => x.name === r.name).length;
            const lots = mergedInv.filter(l => l.prod === r.name);
            const totalStock = lots.reduce((s, l) => s + (l.qtyRemaining ?? l.qtyNow ?? 0), 0);
            return React.createElement("tr", { key: r.id, className: "border-b border-slate-100 align-middle" },
              React.createElement("td", { className: "px-3 py-3 text-slate-800", style: { minWidth: 180 } },
                isFirst ? r.name : React.createElement("span", { className: "pl-4 text-xs text-slate-400" }, "↳ ", r.name)),
              React.createElement("td", { className: "px-2 py-3" },
                React.createElement("div", null,
                  React.createElement("select", {
                    className: "rounded-lg border border-slate-200 px-2 py-1.5 text-xs w-36 focus:border-[#fed7aa] focus:outline-none " + (lockOut ? "bg-slate-100 text-slate-400" : ""),
                    disabled: lockOut, value: r.lotRef,
                    onChange: e => setERow(i, { lotRef: e.target.value }),
                  },
                    React.createElement("option", { value: "" }, "Chọn lô hàng"),
                    lots.map(l => React.createElement("option", { key: l.lot, value: l.lot }, impCode(l.lot)))),
                  r.lotRef && (() => {
                    const sel = lots.find(l => l.lot === r.lotRef);
                    return sel ? React.createElement("p", { className: "mt-0.5 text-[11px] text-slate-400" },
                      "Còn ", React.createElement("b", null, sel.qtyRemaining ?? sel.qtyNow ?? 0), " — ", num(sel.costNcc), "đ/cái") : null;
                  })())),
              React.createElement("td", { className: "px-3 py-3 text-center" },
                React.createElement("span", { className: "rounded px-1.5 py-0.5 text-xs font-medium " + (totalStock <= 0 ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700") }, totalStock)),
              React.createElement("td", { className: "px-3 py-3 text-center text-sm text-slate-500" }, r.slDon),
              React.createElement("td", { className: "px-2 py-3 text-center" },
                React.createElement("input", { type: "number", className: ic("w-16"), disabled: lockOut, value: r.slXuat, onChange: e => setERow(i, { slXuat: +e.target.value }) })),
              React.createElement("td", { className: "px-2 py-3 text-center" },
                React.createElement(NumInput, { className: ic("w-28 bg-slate-100 text-slate-400"), align: "center", disabled: true, value: r.giaBan })),
              MC(ttXuat(r), "text-[#c2410c]"),
              React.createElement("td", { className: "px-2 py-3" },
                !lockOut && React.createElement("div", { className: "flex gap-1 justify-center" },
                  isFirst && lots.filter(l=>(l.qtyRemaining??l.qtyNow??0)>0).length > 1 && React.createElement("button", { onClick: () => addERow(r.name, r.slDon, r.giaBan), className: "rounded px-2 py-1 text-xs bg-amber-100 text-amber-800 hover:bg-amber-200", title: "Thêm lô" }, "+"),
                  cnt > 1 && React.createElement("button", { onClick: () => delERow(i), className: "rounded px-2 py-1 text-xs bg-rose-100 text-rose-700 hover:bg-rose-200" }, "×"))));
          }),
          React.createElement("tr", { className: "border-t border-slate-200 bg-slate-50" },
            React.createElement("td", { className: "px-3 py-3 text-sm font-bold uppercase text-slate-700" }, "Tổng cộng"),
            React.createElement("td", { colSpan: 4 }),
            MC(totalTtXuat, "text-[#c2410c] font-bold"),
            React.createElement("td"))))));

  // ── Tab 3 render ──────────────────────────────────────────────────────────
  const renderXlyKho = () => React.createElement(React.Fragment, null,
    React.createElement("div", { className: "overflow-x-auto rounded-xl border border-slate-200" },
      React.createElement("table", { className: "w-full text-sm" },
        React.createElement("thead", { className: "border-b border-slate-200 bg-amber-50" },
          React.createElement("tr", null,
            TH("Tên sản phẩm", "text-left"),
            TH("Lô hàng"),
            TH("SL xuất"),
            TH("TT nhập", "text-right text-[#92400e]"),
            TH("TT bán", "text-right text-[#c2410c]"),
            TH("Lợi nhuận", "text-right"))),
        React.createElement("tbody", null,
          xlyRows.map((r, i) => React.createElement("tr", { key: i, className: "border-b border-slate-100" },
            React.createElement("td", { className: "px-3 py-3 text-slate-800" }, r.name),
            React.createElement("td", { className: "px-3 py-3 text-center text-xs text-slate-500" }, r.lotLabel),
            React.createElement("td", { className: "px-3 py-3 text-center text-sm" }, r.slXuat),
            MC(r.ttN, "text-[#92400e]"),
            MC(r.ttB, "text-[#c2410c]"),
            MC(r.loi, r.loi >= 0 ? "text-emerald-700" : "text-rose-600"))),
          React.createElement("tr", { className: "border-t-2 border-slate-300 bg-amber-50/60 font-bold" },
            React.createElement("td", { className: "px-3 py-3 text-sm font-bold uppercase text-slate-700", colSpan: 3 }, "Lợi nhuận gộp"),
            MC(xlyRows.reduce((s, r) => s + r.ttN, 0), "text-[#92400e] font-bold"),
            MC(xlyRows.reduce((s, r) => s + r.ttB, 0), "text-[#c2410c] font-bold"),
            MC(totalLoi, totalLoi >= 0 ? "text-emerald-700 font-bold" : "text-rose-600 font-bold"))
        ))),
    React.createElement("div", { className: "mt-5 rounded-xl border border-slate-200 bg-slate-50/60 p-4" },
      React.createElement("p", { className: "mb-3 text-sm font-semibold text-slate-700" }, "Chi phí bán hàng (CPBH)"),
      cpbhList.length === 0
        ? React.createElement("p", { className: "text-sm italic text-slate-400" }, "Chưa có chi phí. Thêm tại \"Chi phí công ty thanh toán\" trong đơn hàng.")
        : React.createElement("div", { className: "space-y-1.5" },
            cpbhList.map((c, i) => React.createElement("div", { key: i, className: "flex justify-between text-sm" },
              React.createElement("span", { className: "text-slate-600" }, c.type),
              React.createElement("span", { className: "font-semibold tabular-nums text-[#B91C1C]" }, num(c.amount), "đ")))),
      React.createElement("div", { className: "mt-3 flex justify-between border-t border-slate-200 pt-3 text-sm font-bold" },
        React.createElement("span", null, "Tổng CPBH"),
        React.createElement("span", { className: "tabular-nums text-[#B91C1C]" }, num(totalCpbh), "đ"))),
    React.createElement("div", { className: "mt-3 flex items-center justify-between rounded-xl border border-amber-200 bg-[#fef9f0] px-5 py-4" },
      React.createElement("span", { className: "text-base font-bold text-slate-800" }, "Còn lại (Lợi nhuận − CPBH)"),
      React.createElement("span", { className: "text-xl font-bold tabular-nums " + (conLai >= 0 ? "text-emerald-700" : "text-rose-600") }, num(conLai))));

  const TABS = [
    { key: "nhap", label: "↓ Nhập kho", done: imported },
    { key: "xuat", label: "↑ Xuất kho", done: exported },
    { key: "xlykho", label: "⚖ Xử lý kho" },
  ];

  return React.createElement(Modal, {
    maxW: "max-w-5xl",
    title: `Xử lý kho — Đơn ${order.id}`,
    onClose,
    footer: React.createElement(React.Fragment, null,
      React.createElement("button", { onClick: doEdit, disabled: (!imported && !exported) || editing, className: "rounded-lg border border-[#B91C1C] bg-[#FEF2F2] px-3.5 py-2 text-sm font-medium text-amber-700 hover:bg-amber-100 disabled:opacity-40" }, "✎ Sửa"),
      tab === "nhap" && React.createElement("button", { onClick: doImport, disabled: imported && !editing, className: "rounded-lg bg-[#92400e] px-3.5 py-2 text-sm font-medium text-white hover:bg-[#78350f] disabled:bg-slate-300 disabled:cursor-not-allowed" }, "↓ Nhập kho"),
      tab === "xuat" && React.createElement("button", { onClick: doExport, disabled: (exported && !editing) || !order.deliveryConfirmed, title: !order.deliveryConfirmed ? "Cần xác nhận giao hàng trước" : undefined, className: "rounded-lg bg-[#78350f] px-3.5 py-2 text-sm font-medium text-white hover:bg-[#92400e] disabled:bg-slate-300 disabled:cursor-not-allowed" }, "↑ Xuất kho")),
  },
    React.createElement("div", { className: "mb-5 flex gap-1 rounded-xl border border-slate-200 bg-slate-50 p-1" },
      TABS.map(t => React.createElement("button", { key: t.key, onClick: () => setTab(t.key), className: "flex-1 flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold transition-colors " + (tab === t.key ? "bg-white shadow text-[#92400e]" : "text-slate-500 hover:text-slate-700") },
        t.label,
        t.done ? React.createElement("span", { className: "rounded-full bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold text-emerald-600 ring-1 ring-emerald-300" }, "✓") : null))),
    tab === "nhap" ? renderNhap() : tab === "xuat" ? renderXuat() : renderXlyKho());
}
const RETURN_STORES = [
  {key:"Kho HH", label:"HH"},
  {key:"Kho HG", label:"HG"},
  {key:"Kho SR", label:"SR"},
];
function ReturnModal({
  order,
  onClose,
  onConfirm
}) {
  const [rows, setRows] = useState(order.items.map(it => ({
    name: it.name,
    price: it.price,
    cost: it.cost || 0,
    max: it.qty,
    qty: 0
  })));
  const [reason, setReason] = useState("");
  const [store, setStore] = useState(RETURN_STORES[0].key);
  const set = (i, p) => setRows(xs => xs.map((x, k) => k === i ? {...x, ...p} : x));
  const total = rows.reduce((s, r) => s + r.price * r.qty, 0);
  const sm = "w-full rounded-md border border-slate-200 px-2 py-1 text-sm focus:border-[#fed7aa] focus:outline-none";
  return /*#__PURE__*/React.createElement(Modal, {
    title: `Hoàn hàng — Đơn ${order.id}`,
    sub: "Chọn mặt hàng và số lượng khách trả lại",
    onClose: onClose,
    footer: /*#__PURE__*/React.createElement(React.Fragment, null,
      /*#__PURE__*/React.createElement("span", {className:"mr-auto text-sm text-slate-500"},
        "Tổng tiền hoàn: ", /*#__PURE__*/React.createElement("b", {className:"tabular-nums text-[#B91C1C]"}, vnd(total))),
      /*#__PURE__*/React.createElement("button", {onClick:onClose, className:"rounded-lg border border-slate-200 px-3.5 py-2 text-sm text-slate-600 hover:bg-slate-50"}, "Hủy"),
      /*#__PURE__*/React.createElement("button", {
        onClick: () => onConfirm({rows, reason, store}),
        disabled: total === 0,
        className: "rounded-lg bg-[#92400e] px-3.5 py-2 text-sm font-medium text-white hover:bg-[#78350f] disabled:bg-slate-300"
      }, "Xác nhận hoàn hàng"))
  },
  /*#__PURE__*/React.createElement("div", {className:"space-y-3"},
    rows.map((r, i) =>
      /*#__PURE__*/React.createElement("div", {key:i, className:"flex items-center gap-3 rounded-lg border border-slate-200 p-3"},
        /*#__PURE__*/React.createElement("div", {className:"flex-1"},
          /*#__PURE__*/React.createElement("p", {className:"text-sm text-slate-800"}, r.name),
          /*#__PURE__*/React.createElement("p", {className:"text-xs text-slate-400"}, "Đã mua: ", r.max, " · ", vnd(r.price))
        ),
        /*#__PURE__*/React.createElement("div", {className:"w-28"},
          /*#__PURE__*/React.createElement("label", {className:"text-xs text-slate-400"}, "SL trả"),
          /*#__PURE__*/React.createElement("input", {
            type:"number", min:0, max:r.max, className:sm, value:r.qty,
            onChange: e => set(i, {qty: Math.min(r.max, Math.max(0, +e.target.value))})
          })
        )
      )
    ),
    /*#__PURE__*/React.createElement("div", {className:"mt-3"},
      /*#__PURE__*/React.createElement("label", {className:"block text-xs text-slate-500 mb-1"}, "Hoàn về kho"),
      /*#__PURE__*/React.createElement("div", {className:"flex gap-2"},
        RETURN_STORES.map(s =>
          /*#__PURE__*/React.createElement("button", {
            key: s.key,
            type: "button",
            onClick: () => setStore(s.key),
            className: "flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition-colors " +
              (store === s.key
                ? "border-[#fed7aa] bg-[#fef9f0] text-[#92400e]"
                : "border-slate-200 text-slate-500 hover:border-slate-300 hover:bg-slate-50")
          }, s.label)
        )
      )
    ),
    /*#__PURE__*/React.createElement("div", {className:"mt-3"},
      /*#__PURE__*/React.createElement("label", {className:"block text-xs text-slate-500 mb-1"}, "Lý do"),
      /*#__PURE__*/React.createElement("input", {
        value:reason, onChange:e=>setReason(e.target.value),
        placeholder:"Nhập lý do hoàn hàng...",
        className:sm
      })
    )
  ));
}
function OrderTable({
  orders,
  onNew,
  onEdit,
  onDelete,
  onKho,
  onReturn,
  onBatchKho,
  initFrom,
  initTo
}) {
  const notify = useToast();
  const { profile: _otProfile } = useAuth();
  const [q, setQ] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [doc, setDoc] = useState(null);
  const [fDelivery, setFDelivery] = useState("Tất cả");
  const [fPayment, setFPayment] = useState("Tất cả");
  const [fStatus, setFStatus] = useState("Tất cả");
  const [fStaff, setFStaff] = useState("Tất cả");
  const [fromDate, setFromDate] = useState(initFrom || localMonthStart());
  const [toDate, setToDate] = useState(initTo || localToday());
  const [ordPage, setOrdPage] = useState(1);
  React.useEffect(() => setOrdPage(1), [q, fDelivery, fPayment, fStatus, fStaff, fromDate, toDate]);
  const [usersForFilter] = useCollection("users");
  const staffList = ["Tất cả", ...usersForFilter.map(u => u.name).filter(Boolean).sort()];
  const parseISO = s => { const [y,m,d] = s.split('-'); return new Date(+y,+m-1,+d); };
  const fromD = fromDate ? parseISO(fromDate) : null;
  const toD   = toDate   ? parseISO(toDate)   : null;
  const rows = orders.filter(o => {
    if (fromD || toD) { const d = parseViDate(o.dt); if (fromD && d < fromD) return false; if (toD && d > new Date(toD.getFullYear(), toD.getMonth(), toD.getDate(), 23, 59, 59)) return false; }
    if (fDelivery !== "Tất cả" && normalizeDelivery(o.delivery) !== fDelivery) return false;
    if (fPayment !== "Tất cả" && calc(o).pay !== fPayment) return false;
    if (fStatus !== "Tất cả" && calc(o).orderStatus !== fStatus) return false;
    if (fStaff !== "Tất cả" && o.staff !== fStaff) return false;
    if (q && !`${o.id} ${o.name} ${o.phone}`.toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  }).sort((a,b) => parseViDate(b.dt) - parseViDate(a.dt));
  const ORD_PER_PAGE = 30;
  const totalOrdPages = Math.ceil(rows.length / ORD_PER_PAGE);
  const pagedOrders = rows.slice((ordPage - 1) * ORD_PER_PAGE, ordPage * ORD_PER_PAGE);
  const sumTotal = rows.reduce((s, o) => s + calc(o).total, 0);
  const sumDatCoc = rows.reduce((s, o) => s + (o.payments||[]).filter(p => p.kind === "Đặt cọc").reduce((a,p) => a+(p.amount||0), 0), 0);
  const sumPaid = rows.reduce((s, o) => s + (o.paid || 0), 0);
  const sumRemain = rows.reduce((s, o) => s + Math.max(0, calc(o).remaining), 0);
  const onExport = () => {
    const wb = XLSX.utils.book_new();

    // Áp định dạng số (#,##0) cho các cột số
    const applyNumFmt = (ws, numCols) => {
      const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
      for (let R = 1; R <= range.e.r; R++) {
        numCols.forEach(C => {
          const addr = XLSX.utils.encode_cell({ r: R, c: C });
          if (ws[addr] && typeof ws[addr].v === 'number') ws[addr].z = '#,##0';
        });
      }
    };

    // Tính chiều cao dòng dựa trên độ dài text và độ rộng cột
    const calcRowH = (dataRows, colWidths) =>
      dataRows.map(row => {
        const lines = row.reduce((max, cell, ci) => {
          if (cell == null || cell === "") return max;
          const text = String(cell);
          const w = colWidths[ci] || 10;
          const est = text.split('\n').reduce((s, seg) => s + Math.max(1, Math.ceil(seg.length / w)), 0);
          return Math.max(max, est);
        }, 1);
        return { hpt: Math.max(16, lines * 15) };
      });

    const sumCol = (arr, c) => arr.reduce((s, r) => s + (Number(r[c]) || 0), 0);

    // ── Sheet 1: Tổng hợp đơn hàng ──────────────────────────────────────────
    const colW1 = [4,8,10,14,11,22,12,10,10,12,12,12,12,10,14,14,12];
    const h1 = ["STT", "Số ĐH", "Ngày", "Khách hàng", "SĐT", "Địa chỉ",
      "Tiền hàng", "Phí ship KH", "Phí hoàn KH", "Tổng đơn",
      "Đặt cọc", "Thanh toán", "Còn lại", "Hoàn tiền",
      "Giao hàng", "Trạng thái", "Nhân viên"];
    const r1 = rows.map((o, i) => {
      const c = calc(o);
      const its = o.items || [];
      const subtotal = its.reduce((s, it) => s + Math.max(0, (it.price||0) * (it.qty||0) - (it.disc||0)), 0);
      const activeRets = (o.returns || []).filter(r => !r.cancelled);
      const retAmt = activeRets.reduce((s, r) => s + (r.amount||0), 0);
      const pmts = o.payments || [];
      const datCoc = pmts.filter(p => p.kind === "Đặt cọc").reduce((s, p) => s + (p.amount||0), 0);
      const thanhToan = pmts.filter(p => p.kind === "Thanh toán").reduce((s, p) => s + (p.amount||0), 0);
      return [
        i + 1, o.id, o.dt, o.name, o.phone || "", o.addr || "",
        subtotal, o.shippingFee || 0, o.returnFee || 0, c.total,
        datCoc, thanhToan, Math.max(0, c.remaining), retAmt,
        o.delivery || "", c.orderStatus, o.staff || "",
      ];
    });
    const tot1 = [
      null, "TỔNG CỘNG", null, `${rows.length} đơn`, null, null,
      sumCol(r1,6), sumCol(r1,7), sumCol(r1,8), sumCol(r1,9),
      sumCol(r1,10), sumCol(r1,11), sumCol(r1,12), sumCol(r1,13),
      null, null, null,
    ];
    const ws1 = XLSX.utils.aoa_to_sheet([h1, ...r1, tot1]);
    applyNumFmt(ws1, [6,7,8,9,10,11,12,13]);
    ws1['!cols'] = colW1.map(w => ({ wch: w }));
    ws1['!rows'] = [{ hpt: 18 }, ...calcRowH(r1, colW1), { hpt: 18 }];
    XLSX.utils.book_append_sheet(wb, ws1, "Don hang");

    // ── Sheet 2: Chi tiết từng sản phẩm ─────────────────────────────────────
    const colW2 = [10,10,14,10,32,5,12,10,12];
    const h2 = ["Số ĐH", "Ngày", "Khách hàng", "Mã SP", "Tên sản phẩm", "SL", "Đơn giá", "Giảm giá", "Thành tiền SP"];
    const r2 = rows.flatMap(o =>
      (o.items || []).map(it => [
        o.id, o.dt, o.name,
        it.sku || "", it.name || "",
        it.qty || 0, it.price || 0, it.disc || 0,
        Math.max(0, (it.price||0) * (it.qty||0) - (it.disc||0)),
      ])
    );
    const tot2 = ["TỔNG CỘNG", null, null, null, `${r2.length} SP`,
      sumCol(r2,5), null, sumCol(r2,7), sumCol(r2,8)];
    const ws2 = XLSX.utils.aoa_to_sheet([h2, ...r2, tot2]);
    applyNumFmt(ws2, [5,6,7,8]);
    ws2['!cols'] = colW2.map(w => ({ wch: w }));
    ws2['!rows'] = [{ hpt: 18 }, ...calcRowH(r2, colW2), { hpt: 18 }];
    XLSX.utils.book_append_sheet(wb, ws2, "Chi tiet SP");

    // ── Sheet 3: Hoàn hàng ───────────────────────────────────────────────────
    const hasRet = rows.some(o => (o.returns||[]).some(r => !r.cancelled));
    if (hasRet) {
      const colW3 = [10,10,14,24,10,6,12,10,20];
      const h3 = ["Số ĐH", "Ngày ĐH", "Khách hàng", "Sản phẩm hoàn", "Ngày hoàn", "SL hoàn", "Tiền hoàn", "Phí hoàn", "Ghi chú"];
      const r3 = rows.flatMap(o =>
        (o.returns||[]).filter(r => !r.cancelled).map(r => [
          o.id, o.dt, o.name,
          r.prod || "", r.date || "", r.qty || 0, r.amount || 0, r.fee || 0, r.note || "",
        ])
      );
      const tot3 = ["TỔNG CỘNG", null, null, null, null,
        sumCol(r3,5), sumCol(r3,6), sumCol(r3,7), null];
      const ws3 = XLSX.utils.aoa_to_sheet([h3, ...r3, tot3]);
      applyNumFmt(ws3, [5,6,7]);
      ws3['!cols'] = colW3.map(w => ({ wch: w }));
      ws3['!rows'] = [{ hpt: 18 }, ...calcRowH(r3, colW3), { hpt: 18 }];
      XLSX.utils.book_append_sheet(wb, ws3, "Hoan hang");
    }

    XLSX.writeFile(wb, "danh-sach-don-hang.xlsx");
  };
  return /*#__PURE__*/React.createElement("div", {
    className: "space-y-4"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex flex-wrap items-center justify-end gap-2"
  }, onBatchKho && /*#__PURE__*/React.createElement("button", {
    onClick: onBatchKho,
    className: outlineTealBtn,
    title: "Tự động nhập + xuất kho cho tất cả đơn đã giao hàng"
  }, "↓↑ Xử lý kho hàng loạt"), /*#__PURE__*/React.createElement("button", {
    onClick: onNew,
    className: blueBtn
  }, /*#__PURE__*/React.createElement(Plus, {
    className: "h-4 w-4"
  }), " Tạo đơn hàng"), /*#__PURE__*/React.createElement(ExportBtn, {
    onClick: onExport
  })), /*#__PURE__*/React.createElement("div", {
    className: "flex flex-wrap items-end gap-3 rounded-xl border border-slate-200 bg-white p-3"
  }, /*#__PURE__*/React.createElement(DateRangeFilter, {initFrom:fromDate, initTo:toDate, onApply:(f,t)=>{setFromDate(f);setToDate(t);}}),
  /*#__PURE__*/React.createElement("div", {className: "flex flex-1 gap-3 min-w-0"},
    /*#__PURE__*/React.createElement("div", {className: "flex-1 min-w-0"}, /*#__PURE__*/React.createElement("label", {
      className: "mb-1 block text-[13px] font-medium text-slate-500"
    }, "Giao hàng"), /*#__PURE__*/React.createElement("select", {
      value: fDelivery,
      onChange: e => setFDelivery(e.target.value),
      className: field + " w-full"
    }, ["Tất cả", "Đã giao hàng", "Chưa giao hàng"].map(s => /*#__PURE__*/React.createElement("option", {key: s}, s)))),
    /*#__PURE__*/React.createElement("div", {className: "flex-1 min-w-0"}, /*#__PURE__*/React.createElement("label", {
      className: "mb-1 block text-[13px] font-medium text-slate-500"
    }, "Thanh toán"), /*#__PURE__*/React.createElement("select", {
      value: fPayment,
      onChange: e => setFPayment(e.target.value),
      className: field + " w-full"
    }, ["Tất cả", "Đã thanh toán", "Đã đặt cọc", "Chờ thanh toán"].map(s => /*#__PURE__*/React.createElement("option", {key: s}, s)))),
    /*#__PURE__*/React.createElement("div", {className: "flex-1 min-w-0"}, /*#__PURE__*/React.createElement("label", {
      className: "mb-1 block text-[13px] font-medium text-slate-500"
    }, "Trạng thái"), /*#__PURE__*/React.createElement("select", {
      value: fStatus,
      onChange: e => setFStatus(e.target.value),
      className: field + " w-full"
    }, ORDER_TABS.map(s => /*#__PURE__*/React.createElement("option", {key: s}, s)))),
    /*#__PURE__*/React.createElement("div", {className: "flex-1 min-w-0"}, /*#__PURE__*/React.createElement("label", {
      className: "mb-1 block text-[13px] font-medium text-slate-500"
    }, "Nhân viên"), /*#__PURE__*/React.createElement("select", {
      value: fStaff,
      onChange: e => setFStaff(e.target.value),
      className: field + " w-full"
    }, staffList.map(s => /*#__PURE__*/React.createElement("option", {key: s}, s))))), /*#__PURE__*/React.createElement("div", {
    className: "relative min-w-[220px] flex-1"
  }, /*#__PURE__*/React.createElement("label", {
    className: "mb-1 block text-[13px] font-medium text-slate-500"
  }, "Tìm kiếm"), /*#__PURE__*/React.createElement(Search, {
    className: "absolute left-2.5 top-[2.05rem] h-4 w-4 text-slate-400"
  }), /*#__PURE__*/React.createElement("input", {
    value: q,
    onChange: e => setQ(e.target.value),
    placeholder: "Mã đơn, SĐT khách hàng…",
    className: `${field} w-full pl-8`
  }))), /*#__PURE__*/React.createElement("p", {
    className: "text-xs text-slate-400"
  }), /*#__PURE__*/React.createElement(TableShell, {
    foot: /*#__PURE__*/React.createElement("tr", {className: "bg-[#fed7aa] text-sm text-slate-800", style: {fontWeight: 700}},
      /*#__PURE__*/React.createElement("td", {colSpan: 4, className: "px-4 py-2.5"}, "TỔNG CỘNG (", rows.length, " ĐƠN)"),
      /*#__PURE__*/React.createElement("td", {className: "px-4 py-2.5 text-right tabular-nums text-[#92400e]", style: {fontWeight: 700}}, num(sumTotal)),
      /*#__PURE__*/React.createElement("td", {className: "px-4 py-2.5 text-right tabular-nums", style: {fontWeight: 700, color: sumDatCoc > 0 ? "#D97706" : "#94A3B8"}}, sumDatCoc > 0 ? num(sumDatCoc) : ""),
      /*#__PURE__*/React.createElement("td", {className: "px-4 py-2.5 text-right tabular-nums", style: {fontWeight: 700, color: sumPaid > 0 ? "#D97706" : "#94A3B8"}}, sumPaid > 0 ? num(sumPaid) : ""),
      /*#__PURE__*/React.createElement("td", {className: "px-4 py-2.5 text-right tabular-nums", style: {fontWeight: 700, color: sumRemain > 0 ? "#B91C1C" : "#94A3B8"}}, sumRemain > 0 ? num(sumRemain) : ""),
      /*#__PURE__*/React.createElement("td", {colSpan: 6})),
    head: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(Th, {
      style: { width: 90 }
    }, "Ngày"), /*#__PURE__*/React.createElement(Th, {
      style: { width: 96 }
    }, "Số đơn hàng"), /*#__PURE__*/React.createElement(Th, {
      style: { width: 130 }
    }, "Khách hàng"), /*#__PURE__*/React.createElement(Th, {
      style: { width: 180 }
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
    }, "Đặt cọc"), /*#__PURE__*/React.createElement(Th, {
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
    }, "Thanh toán"), /*#__PURE__*/React.createElement(Th, {
      center: true,
      style: {
        width: 90
      }
    }, "Giao hàng"), /*#__PURE__*/React.createElement(Th, {
      center: true,
      style: {
        width: 140
      }
    }, "Xử lý kho"), /*#__PURE__*/React.createElement(Th, {
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
  }, /*#__PURE__*/React.createElement(React.Fragment, null, pagedOrders.map((o, ri) => {
    const c = calc(o);
    const isCancel = c.orderStatus === "Huỷ";
    const datCoc = (o.payments||[]).filter(p => p.kind === "Đặt cọc").reduce((s,p) => s+(p.amount||0), 0);
    const thanhToan = (o.payments||[]).filter(p => p.kind !== "Đặt cọc").reduce((s,p) => s+(p.amount||0), 0);
    return /*#__PURE__*/React.createElement("tr", {
      key: o.id,
      className: `align-top hover:bg-slate-50/60 ${isCancel ? "opacity-60 grayscale text-slate-400 bg-slate-50" : "bg-white"}`,
      style: { borderBottom: "1px solid #e2e8f0" }
    }, /*#__PURE__*/React.createElement("td", {
      className: "px-3 py-3"
    }, /*#__PURE__*/React.createElement(DateTime, {
      value: o.dt
    })), /*#__PURE__*/React.createElement("td", {
      className: "whitespace-nowrap px-3 py-3"
    }, /*#__PURE__*/React.createElement("button", {
      onClick: () => onEdit(o),
      className: "inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset bg-[#fef9f0] text-[#92400e] ring-[#b45309]"
    }, o.id)), /*#__PURE__*/React.createElement("td", {
      className: "px-3 py-3",
      style: { minWidth: 130 }
    }, /*#__PURE__*/React.createElement("div", {
      className: "text-slate-800"
    }, o.name), /*#__PURE__*/React.createElement("div", {
      className: "text-xs text-slate-400"
    }, /*#__PURE__*/React.createElement(Phone, {
      value: o.phone
    }))), /*#__PURE__*/React.createElement("td", {
      className: "px-3 py-3 text-xs text-slate-500",
      style: { minWidth: 150, maxWidth: 150 }
    }, o.addr || ""), /*#__PURE__*/React.createElement("td", {
      className: "whitespace-nowrap px-3 py-3 text-right text-sm tabular-nums text-[#92400e]"
    }, num(c.total)), /*#__PURE__*/React.createElement("td", {
      className: `whitespace-nowrap px-3 py-3 text-right text-sm tabular-nums ${datCoc > 0 ? "text-[#D97706]" : "text-[#94A3B8]"}`
    }, datCoc > 0 ? num(datCoc) : ""), /*#__PURE__*/React.createElement("td", {
      className: `whitespace-nowrap px-3 py-3 text-right text-sm tabular-nums ${thanhToan > 0 ? "text-[#D97706]" : "text-[#94A3B8]"}`
    }, thanhToan > 0 ? num(thanhToan) : ""), /*#__PURE__*/React.createElement("td", {
      className: `whitespace-nowrap px-3 py-3 text-right text-sm tabular-nums ${c.remaining > 0 ? "text-[#B91C1C]" : "text-[#94A3B8]"}`
    }, c.remaining > 0 ? num(c.remaining) : ""), /*#__PURE__*/React.createElement("td", {
      className: "px-3 py-3 text-center"
    }, /*#__PURE__*/React.createElement(Pill, {
      map: ORDER_STATUS,
      value: c.orderStatus
    })), /*#__PURE__*/React.createElement("td", {
      className: "px-3 py-3 text-center"
    }, /*#__PURE__*/React.createElement(Pill, {
      map: PAY_STATUS,
      value: c.pay
    })), /*#__PURE__*/React.createElement("td", {
      className: "px-3 py-3 text-center"
    }, /*#__PURE__*/React.createElement(Pill, {
      map: DELIVERY,
      value: normalizeDelivery(o.delivery)
    })), /*#__PURE__*/React.createElement("td", {
      className: "px-3 py-3 text-center"
    }, (() => {
      const label = !o.imported ? "Cần nhập" : !o.exported ? "Cần xuất" : "Đã xử lý kho";
      const cls = !o.imported ? "bg-slate-100 text-slate-500 ring-slate-200" : !o.exported ? "bg-slate-100 text-slate-500 ring-slate-200" : "bg-[#fef9f0] text-[#92400e] ring-[#b45309]";
      return /*#__PURE__*/React.createElement("button", {
        onClick: () => onKho(o),
        title: "Mở màn hình xử lý kho (nhập → xuất)",
        className: `inline-flex cursor-pointer items-center whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset transition hover:opacity-70 ${cls}`
      }, label);
    })()), /*#__PURE__*/React.createElement("td", {
      className: "whitespace-nowrap px-3 py-3 text-center text-xs text-slate-500"
    }, o.staff || ""), /*#__PURE__*/React.createElement("td", {
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
          "SĐT": o.phone || "",
          "Địa chỉ": o.addr || "",
          "Thành tiền": vnd(c.total)
        },
        items: o.items
      })
    }), /*#__PURE__*/React.createElement(IconBtn, {
      icon: Pencil,
      title: "Sửa đơn",
      onClick: () => onEdit(o)
    }), _otProfile?.role === "admin" && /*#__PURE__*/React.createElement(IconBtn, {
      icon: Trash2,
      tone: "danger",
      title: "Xoá đơn",
      onClick: () => { if (window.confirm(`Xoá đơn ${o.id} của ${o.name}?\nThao tác không thể hoàn tác.`)) onDelete(o.id); }
    }))));
  }))),
  totalOrdPages > 1 && /*#__PURE__*/React.createElement("div", {className: "flex items-center justify-between gap-3 pt-1 px-1 flex-wrap"},
    /*#__PURE__*/React.createElement("span", {className: "text-xs text-slate-500"},
      `${(ordPage-1)*ORD_PER_PAGE+1}–${Math.min(ordPage*ORD_PER_PAGE, rows.length)} / ${rows.length} đơn`),
    /*#__PURE__*/React.createElement("div", {className: "flex items-center gap-1"},
      /*#__PURE__*/React.createElement("button", {
        disabled: ordPage === 1,
        onClick: () => setOrdPage(p => Math.max(1, p-1)),
        className: "rounded px-2 py-1 text-sm text-slate-600 hover:bg-slate-100 disabled:opacity-30"
      }, "Trước"),
      Array.from({length: totalOrdPages}, (_, i) => i+1)
        .filter(n => n === 1 || n === totalOrdPages || Math.abs(n - ordPage) <= 1)
        .reduce((acc, n, i, arr) => { if (i > 0 && n - arr[i-1] > 1) acc.push("..."); acc.push(n); return acc; }, [])
        .map((n, i) => n === "..." ?
          /*#__PURE__*/React.createElement("span", {key: `e${i}`, className: "px-1 text-slate-400"}, "...") :
          /*#__PURE__*/React.createElement("button", {key: n, onClick: () => setOrdPage(n),
            className: `min-w-[2rem] rounded px-2 py-1 text-sm font-medium ${ordPage === n ? "bg-[#92400e] text-white" : "text-slate-600 hover:bg-slate-100"}`
          }, n)),
      /*#__PURE__*/React.createElement("button", {
        disabled: ordPage === totalOrdPages,
        onClick: () => setOrdPage(p => Math.min(totalOrdPages, p+1)),
        className: "rounded px-2 py-1 text-sm text-slate-600 hover:bg-slate-100 disabled:opacity-30"
      }, "Sau"))),
  doc && /*#__PURE__*/React.createElement(DocModal, {
    doc: doc,
    onClose: () => setDoc(null)
  }));
}
function DraftTable({
  drafts,
  onDelete,
  onClone,
  onNew,
  onEdit,
  onOpenOrder
}) {
  const notify = useToast();
  const { profile: _dtProfile } = useAuth();
  const [q, setQ] = useState("");
  const [doc, setDoc] = useState(null);
  const DSTATUS = {
    "Đã lên đơn": "bg-amber-50 text-[#92400e] ring-amber-200",
    "Chưa tạo đơn hàng": "bg-slate-100 text-slate-600 ring-slate-200",
  "Đã tạo đơn hàng": "bg-[#fef9f0] text-[#92400e] ring-[#b45309]"
  };
  const [fromDate, setFromDate] = useState(localMonthStart());
  const [toDate, setToDate] = useState(localToday());
  const [draftPage, setDraftPage] = useState(1);
  React.useEffect(() => setDraftPage(1), [q, fromDate, toDate]);
  const _pISO = s => { const [y,m,d] = s.split("-"); return new Date(+y,+m-1,+d); };
  const _inR = (dt, f, t) => { const d = parseViDate(dt); return (!f || d >= _pISO(f)) && (!t || d <= new Date(_pISO(t).setHours(23,59,59))); };
  const rows = drafts.filter(o => _inR(o.dt, fromDate, toDate) && (!q || `${o.id} ${o.name} ${o.phone} ${o.desc || ""}`.toLowerCase().includes(q.toLowerCase()))).sort((a,b) => parseViDate(b.dt) - parseViDate(a.dt));
  const DRAFT_PER_PAGE = 30;
  const totalDraftPages = Math.ceil(rows.length / DRAFT_PER_PAGE);
  const pagedDrafts = rows.slice((draftPage - 1) * DRAFT_PER_PAGE, draftPage * DRAFT_PER_PAGE);
  const onExport = () => exportCSV("bao-gia", ["Mã Báo giá", "Ngày", "Tên khách hàng", "Địa chỉ", "Diễn giải", "Trạng thái", "Nhân viên"], rows.map(o => [o.id, o.dt, o.name, o.addr, o.desc, o.draftStatus || "Chưa xử lý", o.staff]));
  const Toolbar = () => /*#__PURE__*/React.createElement("div", {
    className: "space-y-3"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex justify-end"
  }, /*#__PURE__*/React.createElement("button", {
    onClick: onNew,
    className: "inline-flex items-center gap-1.5 rounded-lg bg-[#92400e] px-3.5 py-1.5 text-[14px] font-semibold text-white shadow-sm hover:bg-[#78350f]"
  }, /*#__PURE__*/React.createElement(Plus, {
    className: "h-4 w-4"
  }), " Tạo báo giá")), /*#__PURE__*/React.createElement("div", {
    className: "flex flex-wrap items-end gap-3 rounded-xl border border-slate-200 bg-white p-3"
  }, /*#__PURE__*/React.createElement(DateRangeFilter, {initFrom:fromDate, initTo:toDate, onApply:(f,t)=>{setFromDate(f);setToDate(t);}}), /*#__PURE__*/React.createElement("div", {
    className: "relative flex-1"
  }, /*#__PURE__*/React.createElement(Search, {
    className: "absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400"
  }), /*#__PURE__*/React.createElement("input", {
    value: q,
    onChange: e => setQ(e.target.value),
    placeholder: "Mã báo giá, khách hàng…",
    className: `${field} w-full pl-8`
  }))));
  if (!drafts.length) return /*#__PURE__*/React.createElement("div", {
    className: "space-y-4"
  }, /*#__PURE__*/React.createElement(Toolbar, null), /*#__PURE__*/React.createElement(Empty, null, "Chưa có báo giá. Vào \"Tạo báo giá\" → bấm \"Lưu báo giá\" để lưu tạm."));
  return /*#__PURE__*/React.createElement("div", {
    className: "space-y-4"
  }, /*#__PURE__*/React.createElement(Toolbar, null), /*#__PURE__*/React.createElement(TableShell, {
    head: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(Th, null, "Số Báo giá"), /*#__PURE__*/React.createElement(Th, null, "Số đơn hàng"), /*#__PURE__*/React.createElement(Th, {
      style: {
        width: 90
      }
    }, "Ngày"), /*#__PURE__*/React.createElement(Th, {
      style: {
        minWidth: 130
      }
    }, "Tên khách hàng"), /*#__PURE__*/React.createElement(Th, {
      style: {
        minWidth: 120
      }
    }, "Địa chỉ"), /*#__PURE__*/React.createElement(Th, {
      style: {
        minWidth: 180
      }
    }, "Ghi chú"), /*#__PURE__*/React.createElement(Th, {right: true, style:{minWidth:110}}, "Tổng đơn"), /*#__PURE__*/React.createElement(Th, null, "Nhân viên"), /*#__PURE__*/React.createElement(Th, {
      center: true,
      style: {
        width: 110
      }
    }, "Thao tác"))
  }, pagedDrafts.map(o => /*#__PURE__*/React.createElement("tr", {
    key: o.id,
    className: "align-top hover:bg-slate-50/60"
  }, /*#__PURE__*/React.createElement("td", {
    className: "whitespace-nowrap px-4 py-3"
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => onEdit(o),
    className: "inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset bg-[#fef9f0] text-[#92400e] ring-[#b45309]"
  }, o.id)), /*#__PURE__*/React.createElement("td", {
    className: "whitespace-nowrap px-4 py-3"
  }, o.linkedOrderId
    ? /*#__PURE__*/React.createElement("button", {onClick: () => onOpenOrder && onOpenOrder(o.linkedOrderId), className: "inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset bg-[#fef9f0] text-[#92400e] ring-[#b45309] hover:bg-amber-100"}, o.linkedOrderId)
    : /*#__PURE__*/React.createElement("span", {className: "text-slate-300 text-xs"}, "")), /*#__PURE__*/React.createElement("td", {
    className: "px-4 py-3"
  }, /*#__PURE__*/React.createElement(DateTime, {
    value: o.dt
  })), /*#__PURE__*/React.createElement("td", {
    className: "px-4 py-3",
    style: {maxWidth: 130}
  }, /*#__PURE__*/React.createElement("div", {className: "text-slate-800 truncate"}, o.name),
    o.phone ? /*#__PURE__*/React.createElement("div", {className: "mt-0.5 text-xs text-slate-400"}, /*#__PURE__*/React.createElement(Phone, {value: o.phone})) : null), /*#__PURE__*/React.createElement("td", {
    className: "px-4 py-3",
    style: {minWidth: 210, maxWidth: 210}
  }, /*#__PURE__*/React.createElement("div", {className: "text-xs text-slate-500 truncate"}, o.addr || "")), /*#__PURE__*/React.createElement("td", {
    className: "px-4 py-3 text-xs text-slate-500"
  }, o.note || ""), /*#__PURE__*/React.createElement("td", {
    className: "px-4 py-3 text-right tabular-nums font-medium text-[#B91C1C]"
  }, vnd((o.items||[]).reduce((s,i)=>s+i.price*i.qty*(1-(i.disc||0)/100),0))), /*#__PURE__*/React.createElement("td", {
    className: "whitespace-nowrap px-4 py-3 text-xs text-slate-500"
  }, o.staff), /*#__PURE__*/React.createElement("td", {
    className: "px-4 py-3"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-center"
  }, onClone && /*#__PURE__*/React.createElement(IconBtn, {
    icon: Copy,
    title: "Nhân bản báo giá",
    onClick: () => onClone(o)
  }), _dtProfile?.role === "admin" && /*#__PURE__*/React.createElement(IconBtn, {
    tone: "danger",
    icon: Trash2,
    title: "Xoá báo giá",
    onClick: () => onDelete(o.id)
  }))))))
  , totalDraftPages > 1 && /*#__PURE__*/React.createElement("div", {className: "flex items-center justify-between gap-3 pt-1 px-1 flex-wrap"},
    /*#__PURE__*/React.createElement("span", {className: "text-xs text-slate-500"},
      `${(draftPage-1)*DRAFT_PER_PAGE+1}–${Math.min(draftPage*DRAFT_PER_PAGE, rows.length)} / ${rows.length} báo giá`),
    /*#__PURE__*/React.createElement("div", {className: "flex items-center gap-1"},
      /*#__PURE__*/React.createElement("button", {
        disabled: draftPage === 1,
        onClick: () => setDraftPage(p => Math.max(1, p-1)),
        className: "rounded px-2 py-1 text-sm text-slate-600 hover:bg-slate-100 disabled:opacity-30"
      }, "Trước"),
      Array.from({length: totalDraftPages}, (_, i) => i+1)
        .filter(n => n === 1 || n === totalDraftPages || Math.abs(n - draftPage) <= 1)
        .reduce((acc, n, i, arr) => { if (i > 0 && n - arr[i-1] > 1) acc.push("..."); acc.push(n); return acc; }, [])
        .map((n, i) => n === "..." ?
          /*#__PURE__*/React.createElement("span", {key: `e${i}`, className: "px-1 text-slate-400"}, "...") :
          /*#__PURE__*/React.createElement("button", {key: n, onClick: () => setDraftPage(n),
            className: `min-w-[2rem] rounded px-2 py-1 text-sm font-medium ${draftPage === n ? "bg-[#92400e] text-white" : "text-slate-600 hover:bg-slate-100"}`
          }, n)),
      /*#__PURE__*/React.createElement("button", {
        disabled: draftPage === totalDraftPages,
        onClick: () => setDraftPage(p => Math.min(totalDraftPages, p+1)),
        className: "rounded px-2 py-1 text-sm text-slate-600 hover:bg-slate-100 disabled:opacity-30"
      }, "Sau"))),
  doc && /*#__PURE__*/React.createElement(DocModal, {
    doc: doc,
    onClose: () => setDoc(null)
  }));
}
function numToWordVN(amount) {
  if (!amount || amount === 0) return "Không đồng";
  const n = Math.round(Math.abs(amount));
  const ones = ["","một","hai","ba","bốn","năm","sáu","bảy","tám","chín"];
  function readGroup(x) {
    if (x === 0) return "";
    if (x < 10) return ones[x];
    const t = Math.floor(x/10), u = x%10;
    const ts = t === 1 ? "mười" : ones[t]+" mươi";
    if (u === 0) return ts;
    if (u === 1 && t > 1) return ts+" mốt";
    if (u === 5) return ts+" lăm";
    return ts+" "+ones[u];
  }
  function readH(x, isFirst) {
    if (x === 0) return "";
    const h = Math.floor(x/100), r = x%100;
    if (h > 0) {
      const hs = ones[h]+" trăm";
      if (r === 0) return hs;
      if (r < 10) return hs+" lẻ "+ones[r];
      return hs+" "+readGroup(r);
    }
    if (isFirst) return readGroup(r);
    if (r < 10) return "lẻ "+ones[r];
    return "không trăm "+readGroup(r);
  }
  const ty = Math.floor(n/1e9), tr = Math.floor(n%1e9/1e6), ng = Math.floor(n%1e6/1e3), un = n%1e3;
  const parts = [];
  if (ty) parts.push(readH(ty,true)+" tỷ");
  if (tr) parts.push(readH(tr,!parts.length)+" triệu");
  if (ng) parts.push(readH(ng,!parts.length)+" nghìn");
  if (un) parts.push(readH(un,!parts.length));
  if (!parts.length) return "Không đồng";
  const s = parts.join(" ").replace(/\s+/g," ").trim();
  return s[0].toUpperCase()+s.slice(1)+" đồng";
}

function buildPrintHTML(order, type, cfg, products) {
  const fmt = n => (n == null || n === 0) ? "0" : new Intl.NumberFormat("vi-VN").format(Math.round(n));
  const compName = cfg.companyName || "CÔNG TY TNHH BÁN LẺ TẠI KHO HẢI PHÒNG";
  const compAddr = cfg.address || "LK-10, Số 384 Lê Thánh Tông, Phường Ngô Quyền, Thành phố Hải Phòng";
  const compPhone = cfg.phone || "033 5252 225";
  const logoUrl = cfg.logoUrl || "/logo.png";
  const bankNo = cfg.bankNo || "202252225";
  const bankCode = cfg.bankCode || "TCB";
  const bankOwner = cfg.bankOwner || "BAN LE TAI KHO HAI PHONG";
  const bankName = cfg.bankName || "TECHCOMBANK (Ngân hàng TMCP Kỳ Thương Việt Nam)";

  const fmtDt = s => {
    if (!s) return "";
    const m = String(s).match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
    return m ? String(m[1]).padStart(2,"0")+"/"+String(m[2]).padStart(2,"0")+"/"+m[3] : String(s);
  };
  const orderDate = fmtDt(order.dt) || new Date().toLocaleDateString("vi-VN");
  const now = new Date();
  const nowStr = String(now.getHours()).padStart(2,"0")+":"+String(now.getMinutes()).padStart(2,"0")+" "+now.toLocaleDateString("vi-VN");

  const prodMap = {};
  (products||[]).forEach(p => { if (p.name) prodMap[p.name] = p; });

  const items = order.items || [];
  const subtotal = items.reduce((s,l) => s+Math.max(0,l.price*l.qty-(l.disc||0)),0);
  const custExp = ((order.custExpenses||[]).reduce((s,e)=>s+(e.amount||0),0))+(order.shippingFee||0)+(order.returnFee||0);
  const total = subtotal + custExp;
  const paid = order.paid || 0;
  const remaining = Math.max(0, total - paid);
  const payments = (order.payments||[]).filter(p => p.kind !== "Tiền hàng trả lại");

  const showLogo = type !== "phieu-giao-no-logo";
  const showPrice = type === "bao-gia" || type === "xac-nhan" || type === "phieu-giao-gia";
  const isDelivery = type === "phieu-giao" || type === "phieu-giao-no-logo";
  const TITLE = {"bao-gia":"BÁO GIÁ","xac-nhan":"ĐƠN XÁC NHẬN ĐẶT HÀNG","phieu-giao":"PHIẾU GIAO HÀNG","phieu-giao-no-logo":"PHIẾU GIAO HÀNG","phieu-giao-gia":"PHIẾU GIAO HÀNG"}[type]||"PHIẾU";

  const qrUrl = bankNo ? "https://img.vietqr.io/image/"+bankCode+"-"+bankNo+"-qr_only.png?amount="+remaining+"&addInfo="+encodeURIComponent(order.id||"")+"&accountName="+encodeURIComponent(bankOwner) : "";

  const productRows = items.map((item,idx) => {
    const prod = prodMap[item.name] || {};
    const sku = prod.sku || "";
    const imgTag = prod.img ? '<img src="'+prod.img+'" style="width:100%;max-height:72px;object-fit:contain;display:block;">' : "";
    const listPrice = prod.list || item.price;
    const lineTotal = Math.max(0, item.price*item.qty-(item.disc||0));
    const priceAfter = item.qty>0 ? Math.round(lineTotal/item.qty) : item.price;
    const discPct = (listPrice>0 && priceAfter<listPrice) ? "-"+((listPrice-priceAfter)/listPrice*100).toFixed(1)+"%" : "";
    if (showPrice) {
      const td = "padding:8px 6px;border-bottom:0.7px solid #444;border-right:0.7px solid #444;";
      const tdL = "padding:8px 6px;border-bottom:0.7px solid #444;";
      return "<tr>"
        +"<td style='"+td+"text-align:center;'>"+(idx+1)+"</td>"
        +"<td style='"+td+"text-align:left;'>"+sku+"</td>"
        +"<td style='"+td+"'>"+item.name+"</td>"
        +"<td style='"+td+"text-align:center;'>"+imgTag+"</td>"
        +"<td style='"+td+"text-align:center;'>Cái</td>"
        +"<td style='"+td+"text-align:center;'>"+item.qty+"</td>"
        +"<td style='"+td+"text-align:right;'>"+fmt(listPrice)+"</td>"
        +"<td style='"+td+"text-align:right;'>"+discPct+"</td>"
        +"<td style='"+td+"text-align:right;'>"+fmt(priceAfter)+"</td>"
        +"<td style='"+tdL+"text-align:right;font-weight:600;'>"+fmt(lineTotal)+"</td>"
        +"</tr>";
    }
    {
      const isLast = idx === items.length - 1;
      const bb = isLast ? "" : "border-bottom:1px solid #555;";
      const td = "padding:10px 6px;"+bb+"border-right:1px solid #555;";
      const tdL = "padding:10px 6px;"+bb;
      return "<tr>"
        +"<td style='"+td+"text-align:center;'>"+(idx+1)+"</td>"
        +"<td style='"+td+"text-align:left;'>"+sku+"</td>"
        +"<td style='"+td+"'>"+item.name+"</td>"
        +"<td style='"+td+"text-align:center;'>"+imgTag+"</td>"
        +"<td style='"+td+"text-align:center;'>Cái</td>"
        +"<td style='"+tdL+"text-align:center;'>"+item.qty+"</td>"
        +"</tr>";
    }
  }).join("");

  const sfPrint = order.shippingFee || 0;
  const rfPrint = order.returnFee || 0;
  const depositPrint = payments.filter(p => p.kind === "Đặt cọc").reduce((s,p) => s + p.amount, 0);
  const paidOnlyPrint = payments.filter(p => p.kind === "Thanh toán").reduce((s,p) => s + p.amount, 0);
  const depositRows = payments.filter(p => p.kind === "Đặt cọc");
  const paidRows = payments.filter(p => p.kind === "Thanh toán");
  const rStyle = "padding:5px 8px;font-size:11.5px;white-space:nowrap;border:none;";
  const mkSumRow = (label, value, bold, color) =>
    "<tr><td colspan='6' style='border:none;'></td>"+
    "<td colspan='3' style='"+rStyle+"text-align:left;"+(bold?"font-weight:600;":"")+"'>"+label+"</td>"+
    "<td style='"+rStyle+"text-align:right;"+(bold?"font-weight:700;":"")+(color?"color:"+color+";":"")+"'>"+value+"</td></tr>";

  const summarySection = showPrice ? (
    "<tr><td colspan='10' style='border:none;height:13px;padding:0;'></td></tr>"+
    (type!=="bao-gia" ? mkSumRow("Cộng tiền hàng (Đã trừ CK):", fmt(subtotal), false, "") : "")+
    (sfPrint > 0 ? mkSumRow("CP giao hàng >15km:", fmt(sfPrint), false, "") : "")+
    (rfPrint > 0 ? mkSumRow("CP đổi trả:", fmt(rfPrint), false, "") : "")+
    mkSumRow("Tổng cộng:", fmt(total), true, "#16a34a")+
    depositRows.map(p => mkSumRow("Đặt cọc"+(p.date?" - "+p.date:"")+":", fmt(p.amount), false, "")).join("")+
    paidRows.map(p => mkSumRow("Thanh toán"+(p.date?" - "+p.date:"")+":", fmt(p.amount), false, "")).join("")+
    (type!=="bao-gia" ? mkSumRow("Còn lại:", remaining===0?"0":fmt(remaining), true, "#dc2626") : "")+
    "<tr><td colspan='10' style='border:none;border-top:0.7px solid #444;padding:7px 10px;font-size:12px;'>Số tiền bằng chữ:&nbsp;&nbsp;<strong>"+numToWordVN(type==="bao-gia"?total:remaining)+"</strong></td></tr>"
  ) : "";

  const headerHtml = showLogo ? (
    "<table style='width:100%;border-collapse:collapse;margin-bottom:14px;padding-bottom:12px;border-bottom:2px solid #e2e8f0;'><tr>"+
    "<td style='width:99px;text-align:right;vertical-align:middle;border:none;'>"+
    "<img src='"+logoUrl+"' alt='logo' style='width:90px;height:auto;' onerror=\"this.style.display='none'\"></td>"+
    "<td style='vertical-align:middle;padding-left:10px;line-height:1.7;border:none;text-align:left;'>"+
    "<div style='font-size:15px;font-weight:700;text-transform:uppercase;'>"+compName+"</div>"+
    "<div style='font-size:12px;color:#475569;'>Địa Chỉ: "+compAddr+"</div>"+
    "<div style='font-size:12px;color:#475569;'>Hotline: "+compPhone+"</div>"+
    "</td></tr></table>"
  ) : "";

  const timeStampHtml = showPrice ? "<div style='text-align:right;font-size:10.5px;color:#94a3b8;margin-bottom:4px;'>"+nowStr+"&nbsp;&nbsp;&nbsp;"+(order.id||"")+"</div>" : "";

  const custInfoHtml = "<div style='display:flex;justify-content:space-between;margin-bottom:14px;font-size:12px;'>"
    +"<div style='line-height:2;'>"
    +"<div><strong>Khách hàng:</strong> "+(order.name||"")+" "+(order.phone||"")+"</div>"
    +"<div><strong>Địa chỉ:</strong> "+(order.addr||"")+"</div>"
    +"<div><strong>Diễn giải:</strong> "+(order.note||"")+"</div>"
    +"</div>"
    +"<div style='text-align:left;line-height:2;margin-right:1cm;'>"
    +"<div><strong>Ngày tháng:</strong> "+orderDate+"</div>"
    +"<div><strong>Số đơn:</strong> "+(order.id||"")+"</div>"
    +"<div><strong>Loại tiền:</strong> VNĐ</div>"
    +"</div></div>";

  const thPriceStyle = "style='background:#bfdbfe;padding:8px 6px;font-size:12px;font-weight:600;border:1px solid #444;'";
  const tableHeaderHtml = showPrice
    ? (()=>{
      const th = "background:#bfdbfe;padding:6px 4px;font-size:10px;font-weight:600;border-bottom:1px solid #444;border-right:0.7px solid #444;";
      const thL = "background:#bfdbfe;padding:6px 4px;font-size:10px;font-weight:600;border-bottom:1px solid #444;";
      return "<thead><tr>"
        +"<th style='"+th+"text-align:center;white-space:nowrap;'>STT</th>"
        +"<th style='"+th+"text-align:center;white-space:nowrap;'>Mã sản phẩm</th>"
        +"<th style='"+th+"text-align:center;'>Tên sản phẩm</th>"
        +"<th style='"+th+"text-align:center;white-space:nowrap;'>Hình ảnh</th>"
        +"<th style='"+th+"text-align:center;white-space:nowrap;'>ĐVT</th>"
        +"<th style='"+th+"text-align:center;white-space:nowrap;'>SL</th>"
        +"<th style='"+th+"text-align:center;'>Giá niêm yết</th>"
        +"<th style='"+th+"text-align:center;'>CK</th>"
        +"<th style='"+th+"text-align:center;'>Giá bán sau CK</th>"
        +"<th style='"+thL+"text-align:center;'>Thành tiền</th>"
        +"</tr></thead>";
    })()
    : (()=>{
      const th = "background:#bfdbfe;padding:6px 4px;font-size:10px;font-weight:600;border-bottom:1px solid #555;border-right:1px solid #555;text-align:center;white-space:nowrap;";
      const thL = "background:#bfdbfe;padding:6px 4px;font-size:10px;font-weight:600;border-bottom:1px solid #555;text-align:center;white-space:nowrap;";
      return "<thead><tr>"
        +"<th style='"+th+"'>STT</th>"
        +"<th style='"+th+"'>Mã sản phẩm</th>"
        +"<th style='"+th+"'>Tên sản phẩm</th>"
        +"<th style='"+th+"'>Hình ảnh</th>"
        +"<th style='"+th+"'>ĐVT</th>"
        +"<th style='"+thL+"'>SL</th>"
        +"</tr></thead>";
    })();

  const termsHtml = type === "bao-gia"
    ? "<div style='margin-top:18px;font-size:11.5px;line-height:1.85;color:#1e293b;'><div>1) Báo giá có hiệu lực trong ngày hoặc đến khi hết khuyến mại, có thể thay đổi mà không báo trước.</div><div style='margin-top:5px;'>2) Báo giá chưa bao gồm lắp đặt. Miễn phí vận chuyển đến tầng 1 trong nội thành Hải Phòng.</div><div style='margin-top:5px;'>3) Đặt cọc 50% giá trị đơn hàng, quyết toán vào đợt giao hàng cuối. Huỷ đơn hoặc không nhận hàng sẽ mất cọc.</div><div style='margin-top:5px;'>4) Đổi trả trong vòng 15 ngày kể từ ngày giao hàng. Đối với đơn hàng nhiều sản phẩm, số lượng đổi trả không vượt quá 20% giá trị đơn. Không áp dụng cho hàng nhập khẩu, hàng chuyên biệt và hàng đặt theo yêu cầu.</div></div>"
    : (type === "xac-nhan" || type === "phieu-giao-gia")
    ? "<div style='margin-top:18px;font-size:11.5px;line-height:1.85;color:#1e293b;'><div style='font-weight:600;margin-bottom:6px;'>Khách hàng vui lòng kiểm tra và xác nhận các nội dung dưới đây:</div><div>1) Đơn giá chưa bao gồm lắp đặt. Miễn phí vận chuyển đến tầng 1 trong nội thành Hải Phòng.</div><div style='margin-top:5px;'>2) Đặt cọc 50% giá trị đơn hàng, quyết toán vào đợt giao hàng cuối. Huỷ đơn hoặc không nhận hàng sẽ mất cọc.</div><div style='margin-top:5px;'>3) Đổi trả trong vòng 15 ngày kể từ ngày giao hàng. Đối với đơn hàng nhiều sản phẩm, số lượng đổi trả không vượt quá 20% giá trị đơn. Không áp dụng cho hàng nhập khẩu, hàng chuyên biệt và hàng đặt theo yêu cầu.</div></div>"
    : (type === "phieu-giao" || type === "phieu-giao-no-logo")
    ? "<div style='margin-top:18px;font-size:11.5px;line-height:1.85;color:#1e293b;'><div style='font-weight:600;margin-bottom:6px;'>Khách hàng vui lòng kiểm tra và xác nhận các nội dung dưới đây:</div><div>1. Khách hàng đã nhận đầy đủ số lượng (phụ kiện đi kèm) và kiểm tra đúng tên hàng hóa ghi trên Phiếu Giao Hàng.</div><div style='margin-top:5px;'>2. Hàng hóa được giao đến chân công trình tình trạng nguyên vẹn, không bể vỡ, móp méo. Công ty không chịu trách nhiệm về các vấn đề phát sinh do bên thứ ba hoặc do khách hàng gây ra trong quá trình lắp đặt, thi công.</div><div style='margin-top:5px;'>3. Khách hàng có trách nhiệm thanh toán số tiền còn lại ngay sau khi nhận hàng.</div></div>"
    : "";

  const bankHtml = (showPrice && bankNo)
    ? "<div style='display:flex;justify-content:space-between;align-items:flex-start;margin-top:20px;'><div style='font-size:12.5px;line-height:1.9;'><div style='font-weight:700;'>"+bankOwner+"</div><div>Số tài khoản: <strong>"+bankNo+"</strong></div><div>"+bankName+"</div></div>"+(qrUrl?"<img src='"+qrUrl+"' alt='QR' style='width:90px;height:90px;object-fit:contain;margin-right:5cm;'>":"")+"</div>"
    : "";

  const signatureHtml = isDelivery
    ? "<hr style='border:none;border-top:1px solid #1e293b;margin:20px 0 30px;'><div style='display:flex;justify-content:space-around;text-align:center;'><div><div style='font-weight:700;font-size:13px;'>Người giao hàng</div><div style='font-style:italic;color:#64748b;font-size:12px;margin-top:4px;'>(Ký, họ tên)</div></div><div><div style='font-weight:700;font-size:13px;'>Khách hàng</div><div style='font-style:italic;color:#64748b;font-size:12px;margin-top:4px;'>(Ký, họ tên)</div></div></div>"
    : "<div style='display:flex;justify-content:space-around;margin-top:50px;text-align:center;'><div><div style='font-weight:700;font-size:13px;'>Người lập phiếu</div><div style='font-style:italic;color:#64748b;font-size:12px;margin-top:4px;'>(Ký, họ tên)</div></div><div><div style='font-weight:700;font-size:13px;'>Khách hàng</div><div style='font-style:italic;color:#64748b;font-size:12px;margin-top:4px;'>(Ký, họ tên)</div></div></div>";

  const colGroupPrice = "<colgroup><col style='width:0.7cm'><col style='width:3cm'><col><col style='width:2cm'><col style='width:0.9cm'><col style='width:0.7cm'><col style='width:2.2cm'><col style='width:1.4cm'><col style='width:2.2cm'><col style='width:2.2cm'></colgroup>";
  const colGroupDelivery = "<colgroup><col style='width:38px'><col style='width:4cm'><col><col style='width:4.5cm'><col style='width:1.6cm'><col style='width:1.4cm'></colgroup>";

  return "<!DOCTYPE html><html lang='vi'><head><meta charset='UTF-8'><title>"+(order.id||"")+"</title><style>"
    +"*{box-sizing:border-box;margin:0;padding:0;}"
    +"body{font-family:Arial,sans-serif;font-size:12px;color:#1e293b;background:#e8edf2;}"
    +".no-print{padding:12px 20px;display:flex;gap:10px;background:#fff;border-bottom:1px solid #444;position:sticky;top:0;z-index:10;}"
    +".page{background:#fff;width:210mm;min-height:297mm;padding:8mm;margin:20px auto;box-shadow:0 2px 20px rgba(0,0,0,.15);}"
    +"table{border-collapse:separate;border-spacing:0;width:100%;font-size:11.5px;}"
    +"td,th{border:none;vertical-align:middle;}"
    +"@media print{"
    +".no-print{display:none!important;}"
    +"body{background:#fff;}"
    +".page{width:210mm;min-height:auto;padding:8mm;box-shadow:none;margin:0;}"
    +"@page{size:A4;margin:0;}"
    +"}"
    +"</style></head><body>"
    +"<div class='no-print'><button onclick='window.print()' style='padding:14px 28px;background:#bfdbfe;color:#1e3a8a;border:none;border-radius:8px;cursor:pointer;font-size:28px;font-weight:600;'>🖨 In đơn hàng</button><button onclick='window.close()' style='padding:14px 28px;background:#e2e8f0;color:#1e293b;border:none;border-radius:8px;cursor:pointer;font-size:28px;'>← Quay lại</button></div>"
    +"<div class='page'>"
    +timeStampHtml
    +headerHtml
    +"<div style='text-align:center;font-size:17px;font-weight:700;letter-spacing:1px;margin:14px 0 16px;'>"+TITLE+"</div>"
    +custInfoHtml
    +"<div style='margin-top:0.5cm;border:1px solid #444;border-radius:8px;overflow:hidden;'>"
    +"<table style='table-layout:fixed;'>"+(showPrice?colGroupPrice:colGroupDelivery)+tableHeaderHtml+"<tbody>"+productRows+summarySection+"</tbody></table></div>"
    +termsHtml
    +bankHtml
    +signatureHtml
    +"</div></body></html>";
}

function openPrint(order, type, cfg, products) {
  const w = window.open("", "_blank");
  if (!w) { alert("Vui lòng cho phép mở cửa sổ mới (popup) trong trình duyệt"); return; }
  w.document.write(buildPrintHTML(order, type, cfg, products));
  w.document.close();
  w.focus();
}

function numToWordsVN(n) {
  if (!n || n === 0) return "Không đồng";
  n = Math.round(n);
  const dv = ["","một","hai","ba","bốn","năm","sáu","bảy","tám","chín"];
  function read3(x, leading) {
    if (x === 0) return "";
    const h = Math.floor(x/100), tm = x%100, t = Math.floor(tm/10), u = tm%10;
    let s = "";
    if (h > 0) s += dv[h] + " trăm";
    else if (leading) s += "không trăm";
    if (t > 1)      s += " "+dv[t]+" mươi"+(u===0?"":(u===1?" mốt":u===4?" tư":u===5?" lăm":" "+dv[u]));
    else if (t===1) s += " mười"+(u===0?"":(u===5?" lăm":" "+dv[u]));
    else if (u > 0) s += (h>0||leading?" lẻ ":" ")+dv[u];
    return s.trim();
  }
  const ty=Math.floor(n/1e9), tr=Math.floor((n%1e9)/1e6), ng=Math.floor((n%1e6)/1e3), rm=n%1e3;
  let parts=[];
  if(ty)  parts.push(read3(ty,false)+" tỷ");
  if(tr)  parts.push(read3(tr,!!ty)+" triệu");
  if(ng)  parts.push(read3(ng,!!(ty||tr))+" nghìn");
  if(rm)  parts.push(read3(rm,!!(ty||tr||ng)));
  const r = parts.join(" ").replace(/\s+/g," ").trim();
  return r.charAt(0).toUpperCase()+r.slice(1)+" đồng";
}

function printContract(form, items, totalValue) {
  const SUBJECT_MAP = {
    "HĐMB-TBVS":     "Cung cấp thiết bị vệ sinh",
    "HĐMB-TBB":      "Cung cấp thiết bị bếp",
    "HĐMB-TBVS-TBB": "Cung cấp thiết bị vệ sinh và thiết bị bếp",
  };
  const subject = SUBJECT_MAP[form.template] || "Cung cấp thiết bị";
  const fmtV = n => n ? new Intl.NumberFormat("vi-VN").format(Math.round(n)) : "0";
  const [dd, mm, yyyy] = (form.signDate || "").split("/");
  const dateStr = dd ? `ngày ${dd} tháng ${mm} năm ${yyyy}` : "..... tháng ..... năm .....";

  const productRows = items.length
    ? items.map((it, i) =>
        `<tr>
          <td style="text-align:center;border:1px solid #333;padding:4px 6px;">${i+1}</td>
          <td style="border:1px solid #333;padding:4px 6px;">${it.name||""}</td>
          <td style="text-align:center;border:1px solid #333;padding:4px 6px;">${it.unit||"Cái"}</td>
          <td style="text-align:center;border:1px solid #333;padding:4px 6px;">${it.qty||0}</td>
          <td style="text-align:right;border:1px solid #333;padding:4px 6px;">${fmtV(it.price)}</td>
          <td style="text-align:right;border:1px solid #333;padding:4px 6px;">${fmtV((it.price||0)*(it.qty||0))}</td>
        </tr>`).join("")
    : `<tr><td colspan="6" style="text-align:center;border:1px solid #333;padding:8px;">(Xem Phụ lục hợp đồng đính kèm)</td></tr>`;
  const totalWords = numToWordsVN(totalValue);
  const depositWords = form.deposit ? numToWordsVN(form.deposit) : "";

  const html = `<!DOCTYPE html><html lang="vi"><head><meta charset="UTF-8">
<title>Hợp đồng ${form.contractNum||""}</title>
<style>
*{box-sizing:border-box;}
body{font-family:"Times New Roman",Times,serif;font-size:13pt;color:#000;background:#fff;margin:0;line-height:1.5;}
.page{width:210mm;min-height:297mm;margin:0 auto;padding:25mm 20mm 25mm 30mm;}
h1{font-size:14pt;font-weight:bold;text-align:center;margin:8px 0 4px;text-transform:uppercase;letter-spacing:0.5px;}
.sub{text-align:center;font-style:italic;margin-bottom:14px;}
p{margin:4px 0;text-align:justify;}
.lb{font-size:11pt;font-style:italic;margin:2px 0 2px 24pt;text-align:justify;}
.pt{font-size:13pt;font-weight:bold;margin:12px 0 5px;text-align:left;}
.pr{display:flex;margin-bottom:3px;text-align:left;}
.pl{width:145px;flex-shrink:0;}.pr>span:last-child{flex:1;min-width:0;}
table{width:100%;border-collapse:collapse;margin:8px 0;font-size:12pt;}
th{background:#f0f0f0;font-weight:bold;text-align:center;border:1px solid #333;padding:5px 6px;}
td{vertical-align:top;}
.at{font-weight:bold;margin:12px 0 4px;text-align:left;text-transform:uppercase;}
ul{margin:3px 0 5px 24pt;}li{margin-bottom:3px;text-align:justify;}
.sig{display:flex;justify-content:space-around;margin-top:48px;text-align:center;}
.sc{width:40%;}
.np{text-align:center;padding:12px;background:#f1f5f9;}
@media print{.np{display:none!important;}.page{padding:25mm 20mm 25mm 30mm;}@page{size:A4;margin:0;}}
</style></head><body>
<div class="np">
  <button onclick="window.print()" style="padding:14px 28px;background:#bfdbfe;color:#1e3a8a;border:none;border-radius:8px;cursor:pointer;font-size:28px;font-weight:600;">🖨 In / Xuất PDF</button>
  <button onclick="window.close()" style="margin-left:16px;padding:14px 28px;background:#e2e8f0;color:#1e293b;border:none;border-radius:8px;cursor:pointer;font-size:28px;">← Quay lại</button>
</div>
<div class="page">
<div style="text-align:center;font-weight:bold;margin-bottom:2px;">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</div>
<div style="text-align:center;font-weight:bold;text-decoration:underline;margin-bottom:20px;">Độc lập - Tự do - Hạnh phúc</div>
<h1>HỢP ĐỒNG MUA BÁN</h1>
<div style="text-align:center;margin-bottom:4px;">Số: ${form.contractNum||"……………"}</div>
<div class="sub">(Về việc: ${subject})</div>
<p class="lb">Căn cứ Bộ luật dân sự năm 2015 được Quốc hội nước Cộng hòa xã hội chủ nghĩa Việt Nam thông qua ngày 24/11/2015 có hiệu lực ngày 01/01/2017.</p>
<p class="lb">Căn cứ Luật thương mại năm 2005 được Quốc hội nước Cộng hòa xã hội chủ nghĩa Việt Nam thông qua ngày 14/6/2005 có hiệu lực ngày 01/01/2006.</p>
<p class="lb">Căn cứ vào nhu cầu và năng lực của hai bên.</p>
<p>Hôm nay, ${dateStr}, tại văn phòng Công ty TNHH Bán Lẻ Tại Kho Hải Phòng, chúng tôi gồm có:</p>
<p class="pt">BÊN BÁN (BÊN A): CÔNG TY TNHH BÁN LẺ TẠI KHO HẢI PHÒNG</p>
<div class="pr"><span class="pl">Địa chỉ</span><span>: LK-10, Số 384 Lê Thánh Tông, Phường Ngô Quyền, Thành phố Hải Phòng, Việt Nam</span></div>
<div class="pr"><span class="pl">Người đại diện</span><span>: Bà Trần Thị Phương Anh &nbsp;&nbsp;&nbsp;—&nbsp;&nbsp;&nbsp; Chức vụ: Giám đốc</span></div>
<div class="pr"><span class="pl">Mã số thuế</span><span>: 0202252225</span></div>
<div class="pr"><span class="pl">Số tài khoản</span><span>: 202252225 – Ngân hàng TMCP Kỹ thương Việt Nam (Techcombank) – Chi nhánh Kiến An</span></div>
${form.companyPhone?`<div class="pr"><span class="pl">Số điện thoại</span><span>: ${form.companyPhone}</span></div>`:""}
${(()=>{const isCo=/công ty/i.test(form.custName||"");const lbName=isCo?"Công ty":"Họ và tên";const lbTax=isCo?"Mã số thuế":"Số CCCD";return`<p class="pt">BÊN MUA (BÊN B):</p>
<div class="pr"><span class="pl">${lbName}</span><span>: ${form.custName||""}</span></div>
<div class="pr"><span class="pl">${lbTax}</span><span>: ${form.custTax||""}</span></div>
<div class="pr"><span class="pl">Địa chỉ</span><span>: ${form.custAddr||""}</span></div>
<div class="pr"><span class="pl">Số điện thoại</span><span>: ${form.custPhone||""}</span></div>`;})()}
<p><em>Hai bên cùng thỏa thuận ký kết hợp đồng với những điều khoản sau:</em></p>
<p class="at">ĐIỀU 1: NỘI DUNG CÔNG VIỆC</p>
<p>Bên A đồng ý cung cấp ${subject} cho Bên B đúng với mã hàng, tên hàng, số lượng, thông số kỹ thuật và đơn giá được thể hiện chi tiết trong bảng kê đính kèm.</p>
<p>Giá trị hợp đồng đã bao gồm thuế GTGT và chi phí vận chuyển hàng hóa đến chân công trình. Không bao gồm chi phí lắp đặt sản phẩm.</p>
<table>
  <thead><tr>
    <th style="width:8%">STT</th><th>Tên hàng hóa</th>
    <th style="width:10%">ĐVT</th><th style="width:8%">SL</th>
    <th style="width:16%">Đơn giá (VNĐ)</th><th style="width:16%">Thành tiền (VNĐ)</th>
  </tr></thead>
  <tbody>${productRows}</tbody>
  <tfoot>
    <tr>
      <td colspan="5" style="text-align:right;font-weight:bold;border:1px solid #333;padding:5px 6px;">TỔNG CỘNG</td>
      <td style="text-align:right;font-weight:bold;border:1px solid #333;padding:5px 6px;">${fmtV(totalValue)}</td>
    </tr>
    <tr>
      <td colspan="6" style="border:1px solid #333;padding:5px 6px;font-style:italic;">(Bằng chữ: <strong>${totalWords}</strong>/.)</td>
    </tr>
  </tfoot>
</table>
<p class="at">ĐIỀU 2: THỜI GIAN GIAO NHẬN HÀNG</p>
<ul>
  <li>Thời gian giao nhận: Bên B sẽ thông báo trước 03-05 ngày để bên A chuẩn bị hàng hóa, vận chuyển giao hàng.</li>
  <li>Địa điểm giao hàng: ${form.deliveryAddr||form.custAddr||""}</li>
  <li>Bên B phải chuẩn bị sắp xếp khu vực nhận hàng, nhân công, máy móc (nếu cần) để lên lầu và phải tự chịu trách nhiệm bảo quản hàng hóa sau khi Bên A đã giao hàng đến chân công trình của Bên B. Bên B phải chịu mọi rủi ro đối với những trường hợp mất mát hàng hóa, phụ kiện, cũng như hàng hóa bị hư hỏng hoặc bể vỡ sau khi hai bên đã hoàn tất thủ tục giao nhận.</li>
</ul>
<p class="at">ĐIỀU 3: PHƯƠNG THỨC THANH TOÁN</p>
<p>Bên B thanh toán cho Bên A bằng hình thức chuyển khoản theo 2 lần như sau:</p>
<p><strong>Lần 01:</strong> Đặt cọc tạm ứng số tiền là: <strong>${form.deposit?fmtV(form.deposit)+" VNĐ":""}</strong>${depositWords?`<br>(Bằng chữ: <em>${depositWords}</em>/.)`:""} ngay sau khi ký hợp đồng.</p>
<ul>
  <li>Trong trường hợp đơn hàng của Bên B được thực hiện thành công, khoản đặt cọc nói trên sẽ được khấu trừ để hoàn tất nghĩa vụ thanh toán của Bên B.</li>
  <li>Trong trường hợp Bên A không thể giao hàng do nguyên nhân khách quan từ Nhà sản xuất/ Nhà cung cấp. Bên A thực hiện việc xử lý khoản thanh toán đặt cọc của Bên B theo một trong các phương án sau:<br>+ Chuyển đổi khoản đặt cọc của Bên B sang một Đơn Hàng mới có sẵn hàng (nếu Bên B có yêu cầu).<br>+ Hoàn trả lại khoản đặt cọc của Bên B (bằng tiền mặt hoặc chuyển khoản vào tài khoản của Bên B).</li>
</ul>
<p><strong>Lần 02:</strong> Thanh toán số tiền còn lại của đơn hàng ngay tại thời điểm kiểm tra và nhận xong hàng hóa kể từ khi kí nhận vào biên bản nhận hàng (hoặc phiếu giao hàng có giá trị tương đương).</p>
<ul>
  <li>Trong trường hợp Bên B không thanh toán số tiền còn lại của tổng giá trị hợp đồng thì Bên A sẽ thu hồi toàn bộ hàng hóa vừa giao và không hoàn cọc. Bên B không được phép cản trở Bên A thu hồi hàng hóa dưới bất kì hình thức nào nếu như Bên B không thanh toán theo thỏa thuận.</li>
  <li>Trong trường hợp Bên B yêu cầu giao hàng thành nhiều đợt thì sẽ thanh toán dứt điểm cho từng đợt nhận hàng và tiền cọc sẽ được cấn trừ vào đơn hàng cuối cùng.</li>
</ul>
<p class="at">ĐIỀU 4: PHƯƠNG THỨC ĐỔI TRẢ/ BẢO HÀNH SAU KHI GIAO HÀNG</p>
<p><strong>Điều kiện đổi trả hàng (sản phẩm):</strong></p>
<ul>
  <li>Sản phẩm được xác định bị lỗi kỹ thuật bởi nhân viên kỹ thuật của Công ty hoặc Nhà sản xuất;</li>
  <li>Sản phẩm không thuộc nhóm hàng đặt Nhà máy không được phép đổi trả.</li>
  <li>Sản phẩm phải nguyên vẹn không bị trầy xước, móp méo, ố vàng, nứt vỡ. (Bên B phải có trách nhiệm bảo quản cẩn thận thùng đựng, xốp và phụ kiện đi kèm khi nhận hàng để dự phòng các tình huống phải đổi trả hàng);</li>
  <li>Bên B phải cung cấp đầy đủ Phiếu Giao Hàng và Phiếu Bảo Hành (nếu có).</li>
</ul>
<p><strong>Chính sách đổi trả hàng:</strong></p>
<ul>
  <li>Đối với các trường hợp đáp ứng đủ điều kiện, trong vòng 05 ngày sau khi nhận thông tin và các giấy tờ theo quy định, Bên A sẽ thông báo thời gian giao sản phẩm mới thay thế tới Bên B;</li>
  <li>Bên A sẽ hoàn tiền 100% số tiền Bên B đã thanh toán nếu sản phẩm hết hàng.</li>
</ul>
<p><strong>Trường hợp Bên B không chấp nhận đổi trả hoặc đổi trả mất phí 20% giá trị sản phẩm sau khi nhận hàng:</strong></p>
<ul>
  <li>Bên B làm sản phẩm bị trầy xước, móp méo, nứt vỡ….</li>
  <li>Bên B đổi trả vì lý do cá nhân muốn thay đổi chủng loại, mẫu mã khác.</li>
</ul>
<p><strong>Bảo hành:</strong> Mỗi Nhà sản xuất/ Nhà cung cấp đều có quy định về chính sách bảo hành hàng hóa, sản phẩm riêng. Được quy định rõ ràng, cụ thể bằng hình thức bảo hành điện tử tại nhà hoặc Phiếu bảo hành giấy (có mã QR) luôn kèm theo trong mỗi thùng sản phẩm, hàng hóa. Ngoài ra khách hàng có thể liên hệ số điện thoại <strong>033 5252 225</strong> để được tư vấn hỗ trợ bảo hành nhanh chóng, thuận tiện nhất.</p>
<p class="at">ĐIỀU 5: TRÁCH NHIỆM CỦA CÁC BÊN</p>
<p><strong>Trách nhiệm của Bên A:</strong></p>
<ul>
  <li>Đảm bảo cung cấp thiết bị theo đúng tiến độ bên B yêu cầu.</li>
  <li>Sau khi giao hàng, Bên A sẽ cung cấp cho Bên B những giấy tờ sau <strong>(đây không phải là điều kiện để Bên B tiến hành việc thanh toán cho Bên A)</strong>: Phiếu Giao Hàng và Phiếu Bảo Hành (nếu có); Hoá đơn VAT (gửi qua mail); Chứng nhận xuất xưởng cấp sau 7-10 ngày, kể từ ngày có hoá đơn VAT.</li>
  <li>Bên A cam kết đảm bảo hàng hóa giao cho Bên B là hàng chính hãng của Nhà cung cấp. Nếu bên A cung cấp hàng hóa không chính Hãng, không đảm bảo đúng chất lượng của Nhà sản xuất/ Nhà cung như yêu cầu của Bên B đã thỏa thuận trong Đơn xác nhận đặt hàng thì Bên A chịu đền bù 100% giá trị đơn hàng giao sai.</li>
</ul>
<p><strong>Trách nhiệm của Bên B:</strong></p>
<ul>
  <li>Bảo đảm mặt bằng, điểm đỗ xe giao nhận hàng và an ninh, an toàn trong khu vực làm việc.</li>
  <li>Bảo đảm thanh toán đúng thời hạn được thỏa thuận giữa hai bên.</li>
</ul>
<p class="at">ĐIỀU 6: ĐIỀU KHOẢN CHUNG</p>
<ul>
  <li>Hợp đồng này được lập thành 02 (hai) bản có giá trị pháp lý như nhau, Bên A giữ 01 (một) bản, Bên B giữ 01 bản.</li>
  <li>Kèm theo hợp đồng này là Phụ lục hợp đồng có giá trị pháp lý tương đương hợp đồng.</li>
  <li>Hợp đồng này có hiệu lực kể từ ngày ký kết.</li>
  <li>Sau khi giao nhận hàng và thanh toán hoàn tất, hợp đồng này tự được thanh lý.</li>
</ul>
<table style="width:100%;margin-top:48px;border-collapse:collapse;"><tr>
  <td style="width:50%;text-align:center;border:none;padding:0;vertical-align:top;"><strong>BÊN BÁN</strong><br><em>(Ký, ghi rõ họ tên)</em><br><br><br><br><br><br></td>
  <td style="width:50%;text-align:center;border:none;padding:0;vertical-align:top;"><strong>BÊN MUA</strong><br><em>(Ký, ghi rõ họ tên)</em><br><br><br><br><br><br></td>
</tr></table>
</div></body></html>`;

  const w = window.open("", "_blank");
  if (!w) { alert("Vui lòng cho phép mở cửa sổ mới (popup) trong trình duyệt"); return; }
  w.document.write(html);
  w.document.close();
  w.focus();
}

function exportContractWord(form, items, totalValue) {
  const SUBJECT_MAP = {
    "HĐMB-TBVS":     "Cung cấp thiết bị vệ sinh",
    "HĐMB-TBB":      "Cung cấp thiết bị bếp",
    "HĐMB-TBVS-TBB": "Cung cấp thiết bị vệ sinh và thiết bị bếp",
  };
  const subject = SUBJECT_MAP[form.template] || "Cung cấp thiết bị";
  const fmtV = n => n ? new Intl.NumberFormat("vi-VN").format(Math.round(n)) : "0";
  const [dd, mm, yyyy] = (form.signDate || "").split("/");
  const dateStr = dd ? `ngày ${dd} tháng ${mm} năm ${yyyy}` : "..... tháng ..... năm .....";

  const productRows = items.length
    ? items.map((it, i) =>
        `<tr>
          <td style="text-align:center;border:1px solid #333;padding:4px 6px;">${i+1}</td>
          <td style="border:1px solid #333;padding:4px 6px;">${it.name||""}</td>
          <td style="text-align:center;border:1px solid #333;padding:4px 6px;">${it.unit||"Cái"}</td>
          <td style="text-align:center;border:1px solid #333;padding:4px 6px;">${it.qty||0}</td>
          <td style="text-align:right;border:1px solid #333;padding:4px 6px;">${fmtV(it.price)}</td>
          <td style="text-align:right;border:1px solid #333;padding:4px 6px;">${fmtV((it.price||0)*(it.qty||0))}</td>
        </tr>`).join("")
    : `<tr><td colspan="6" style="text-align:center;border:1px solid #333;padding:8px;">(Xem Phụ lục hợp đồng đính kèm)</td></tr>`;
  const totalWords = numToWordsVN(totalValue);
  const depositWords = form.deposit ? numToWordsVN(form.deposit) : "";

  const html = `<html xmlns:o='urn:schemas-microsoft-com:office:office'
  xmlns:w='urn:schemas-microsoft-com:office:word'
  xmlns='http://www.w3.org/TR/REC-html40'>
<head><meta charset='utf-8'>
<style>
*{box-sizing:border-box;}
body{font-family:"Times New Roman",Times,serif;font-size:13pt;color:#000;background:#fff;margin:0;line-height:1.8;}
.page{width:210mm;margin:0 auto;padding:25mm 20mm 25mm 30mm;}
h1{font-size:14pt;font-weight:bold;text-align:center;margin:10pt 0 6pt;text-transform:uppercase;letter-spacing:0.5px;}
.sub{text-align:center;font-style:italic;margin-bottom:10pt;}
p{margin:8pt 0;text-align:justify;}
.lb{font-size:11pt;font-style:italic;margin:3pt 0 3pt 24pt;text-align:justify;}
.pt{font-size:13pt;font-weight:bold;margin:14pt 0 6pt;text-align:left;}
.pr{display:block;margin-bottom:6pt;text-align:left;}
.pl{display:inline-block;width:145px;}
table{width:100%;border-collapse:collapse;margin:10pt 0;font-size:12pt;}
th{background:#f0f0f0;font-weight:bold;text-align:center;border:1px solid #333;padding:5px 6px;}
td{vertical-align:top;}
.at{font-weight:bold;margin:16pt 0 6pt;text-align:left;text-transform:uppercase;}
ul{margin:4pt 0 8pt 24pt;}li{margin-bottom:6pt;text-align:justify;}
.sig{margin-top:48pt;text-align:center;}
.sc{width:40%;}
</style></head>
<body><div class="page">
<div style="text-align:center;font-weight:bold;margin-bottom:2px;">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</div>
<div style="text-align:center;font-weight:bold;text-decoration:underline;margin-bottom:20px;">Độc lập - Tự do - Hạnh phúc</div>
<h1>HỢP ĐỒNG MUA BÁN</h1>
<div style="text-align:center;margin-bottom:4px;">Số: ${form.contractNum||"……………"}</div>
<div class="sub">(Về việc: ${subject})</div>
<p class="lb">Căn cứ Bộ luật dân sự năm 2015 được Quốc hội nước Cộng hòa xã hội chủ nghĩa Việt Nam thông qua ngày 24/11/2015 có hiệu lực ngày 01/01/2017.</p>
<p class="lb">Căn cứ Luật thương mại năm 2005 được Quốc hội nước Cộng hòa xã hội chủ nghĩa Việt Nam thông qua ngày 14/6/2005 có hiệu lực ngày 01/01/2006.</p>
<p class="lb">Căn cứ vào nhu cầu và năng lực của hai bên.</p>
<p>Hôm nay, ${dateStr}, tại văn phòng Công ty TNHH Bán Lẻ Tại Kho Hải Phòng, chúng tôi gồm có:</p>
<p class="pt">BÊN BÁN (BÊN A): CÔNG TY TNHH BÁN LẺ TẠI KHO HẢI PHÒNG</p>
<div class="pr"><span class="pl">Địa chỉ</span><span>: LK-10, Số 384 Lê Thánh Tông, Phường Ngô Quyền, Thành phố Hải Phòng, Việt Nam</span></div>
<div class="pr"><span class="pl">Người đại diện</span><span>: Bà Trần Thị Phương Anh &nbsp;&nbsp;&nbsp;—&nbsp;&nbsp;&nbsp; Chức vụ: Giám đốc</span></div>
<div class="pr"><span class="pl">Mã số thuế</span><span>: 0202252225</span></div>
<div class="pr"><span class="pl">Số tài khoản</span><span>: 202252225 – Ngân hàng TMCP Kỹ thương Việt Nam (Techcombank) – Chi nhánh Kiến An</span></div>
${form.companyPhone?`<div class="pr"><span class="pl">Số điện thoại</span><span>: ${form.companyPhone}</span></div>`:""}
${(()=>{const isCo=/công ty/i.test(form.custName||"");const lbName=isCo?"Công ty":"Họ và tên";const lbTax=isCo?"Mã số thuế":"Số CCCD";return`<p class="pt">BÊN MUA (BÊN B):</p>
<div class="pr"><span class="pl">${lbName}</span><span>: ${form.custName||""}</span></div>
<div class="pr"><span class="pl">${lbTax}</span><span>: ${form.custTax||""}</span></div>
<div class="pr"><span class="pl">Địa chỉ</span><span>: ${form.custAddr||""}</span></div>
<div class="pr"><span class="pl">Số điện thoại</span><span>: ${form.custPhone||""}</span></div>`;})()}
<p><em>Hai bên cùng thỏa thuận ký kết hợp đồng với những điều khoản sau:</em></p>
<p class="at">ĐIỀU 1: NỘI DUNG CÔNG VIỆC</p>
<p>Bên A đồng ý cung cấp ${subject} cho Bên B đúng với mã hàng, tên hàng, số lượng, thông số kỹ thuật và đơn giá được thể hiện chi tiết trong bảng kê đính kèm.</p>
<p>Giá trị hợp đồng đã bao gồm thuế GTGT và chi phí vận chuyển hàng hóa đến chân công trình. Không bao gồm chi phí lắp đặt sản phẩm.</p>
<table>
  <thead><tr>
    <th style="width:8%">STT</th><th>Tên hàng hóa</th>
    <th style="width:10%">ĐVT</th><th style="width:8%">SL</th>
    <th style="width:16%">Đơn giá (VNĐ)</th><th style="width:16%">Thành tiền (VNĐ)</th>
  </tr></thead>
  <tbody>${productRows}</tbody>
  <tfoot>
    <tr>
      <td colspan="5" style="text-align:right;font-weight:bold;border:1px solid #333;padding:5px 6px;">TỔNG CỘNG</td>
      <td style="text-align:right;font-weight:bold;border:1px solid #333;padding:5px 6px;">${fmtV(totalValue)}</td>
    </tr>
    <tr>
      <td colspan="6" style="border:1px solid #333;padding:5px 6px;font-style:italic;">(Bằng chữ: <strong>${totalWords}</strong>/.)</td>
    </tr>
  </tfoot>
</table>
<p class="at">ĐIỀU 2: THỜI GIAN GIAO NHẬN HÀNG</p>
<ul>
  <li>Thời gian giao nhận: Bên B sẽ thông báo trước 03-05 ngày để bên A chuẩn bị hàng hóa, vận chuyển giao hàng.</li>
  <li>Địa điểm giao hàng: ${form.deliveryAddr||form.custAddr||""}</li>
  <li>Bên B phải chuẩn bị sắp xếp khu vực nhận hàng, nhân công, máy móc (nếu cần) để lên lầu và phải tự chịu trách nhiệm bảo quản hàng hóa sau khi Bên A đã giao hàng đến chân công trình của Bên B. Bên B phải chịu mọi rủi ro đối với những trường hợp mất mát hàng hóa, phụ kiện, cũng như hàng hóa bị hư hỏng hoặc bể vỡ sau khi hai bên đã hoàn tất thủ tục giao nhận.</li>
</ul>
<p class="at">ĐIỀU 3: PHƯƠNG THỨC THANH TOÁN</p>
<p>Bên B thanh toán cho Bên A bằng hình thức chuyển khoản theo 2 lần như sau:</p>
<p><strong>Lần 01:</strong> Đặt cọc tạm ứng số tiền là: <strong>${form.deposit?fmtV(form.deposit)+" VNĐ":""}</strong>${depositWords?`<br>(Bằng chữ: <em>${depositWords}</em>/.)`:""} ngay sau khi ký hợp đồng.</p>
<ul>
  <li>Trong trường hợp đơn hàng của Bên B được thực hiện thành công, khoản đặt cọc nói trên sẽ được khấu trừ để hoàn tất nghĩa vụ thanh toán của Bên B.</li>
  <li>Trong trường hợp Bên A không thể giao hàng do nguyên nhân khách quan từ Nhà sản xuất/ Nhà cung cấp, Bên A sẽ hoàn trả hoặc chuyển đổi khoản đặt cọc theo yêu cầu của Bên B.</li>
</ul>
<p><strong>Lần 02:</strong> Thanh toán số tiền còn lại của đơn hàng ngay tại thời điểm kiểm tra và nhận xong hàng hóa kể từ khi kí nhận vào biên bản nhận hàng (hoặc phiếu giao hàng có giá trị tương đương).</p>
<ul>
  <li>Trong trường hợp Bên B không thanh toán số tiền còn lại của tổng giá trị hợp đồng thì Bên A sẽ thu hồi toàn bộ hàng hóa vừa giao và không hoàn cọc. Bên B không được phép cản trở Bên A thu hồi hàng hóa dưới bất kì hình thức nào nếu như Bên B không thanh toán theo thỏa thuận.</li>
  <li>Trong trường hợp Bên B yêu cầu giao hàng thành nhiều đợt thì sẽ thanh toán dứt điểm cho từng đợt nhận hàng và tiền cọc sẽ được cấn trừ vào đơn hàng cuối cùng.</li>
</ul>
<p class="at">ĐIỀU 4: PHƯƠNG THỨC ĐỔI TRẢ/ BẢO HÀNH SAU KHI GIAO HÀNG</p>
<p><strong>Điều kiện đổi trả hàng (sản phẩm):</strong></p>
<ul>
  <li>Sản phẩm được xác định bị lỗi kỹ thuật bởi nhân viên kỹ thuật của Công ty hoặc Nhà sản xuất;</li>
  <li>Sản phẩm không thuộc nhóm hàng đặt Nhà máy không được phép đổi trả.</li>
  <li>Sản phẩm phải nguyên vẹn không bị trầy xước, móp méo, ố vàng, nứt vỡ. (Bên B phải có trách nhiệm bảo quản cẩn thận thùng đựng, xốp và phụ kiện đi kèm khi nhận hàng để dự phòng các tình huống phải đổi trả hàng);</li>
  <li>Bên B phải cung cấp đầy đủ Phiếu Giao Hàng và Phiếu Bảo Hành (nếu có).</li>
</ul>
<p><strong>Chính sách đổi trả hàng:</strong></p>
<ul>
  <li>Đối với các trường hợp đáp ứng đủ điều kiện, trong vòng 05 ngày sau khi nhận thông tin và các giấy tờ theo quy định, Bên A sẽ thông báo thời gian giao sản phẩm mới thay thế tới Bên B;</li>
  <li>Bên A sẽ hoàn tiền 100% số tiền Bên B đã thanh toán nếu sản phẩm hết hàng.</li>
</ul>
<p><strong>Trường hợp Bên B không chấp nhận đổi trả hoặc đổi trả mất phí 20% giá trị sản phẩm sau khi nhận hàng:</strong></p>
<ul>
  <li>Bên B làm sản phẩm bị trầy xước, móp méo, nứt vỡ….</li>
  <li>Bên B đổi trả vì lý do cá nhân muốn thay đổi chủng loại, mẫu mã khác.</li>
</ul>
<p><strong>Bảo hành:</strong> Mỗi Nhà sản xuất/ Nhà cung cấp đều có quy định về chính sách bảo hành hàng hóa, sản phẩm riêng. Được quy định rõ ràng, cụ thể bằng hình thức bảo hành điện tử tại nhà hoặc Phiếu bảo hành giấy (có mã QR) luôn kèm theo trong mỗi thùng sản phẩm, hàng hóa. Ngoài ra khách hàng có thể liên hệ số điện thoại <strong>033 5252 225</strong> để được tư vấn hỗ trợ bảo hành nhanh chóng, thuận tiện nhất.</p>
<p class="at">ĐIỀU 5: TRÁCH NHIỆM CỦA CÁC BÊN</p>
<p><strong>Trách nhiệm của Bên A:</strong></p>
<ul>
  <li>Đảm bảo cung cấp thiết bị theo đúng tiến độ bên B yêu cầu.</li>
  <li>Sau khi giao hàng, Bên A sẽ cung cấp cho Bên B những giấy tờ sau <strong>(đây không phải là điều kiện để Bên B tiến hành việc thanh toán cho Bên A)</strong>: Phiếu Giao Hàng và Phiếu Bảo Hành (nếu có); Hoá đơn VAT (gửi qua mail); Chứng nhận xuất xưởng cấp sau 7-10 ngày, kể từ ngày có hoá đơn VAT.</li>
  <li>Bên A cam kết đảm bảo hàng hóa giao cho Bên B là hàng chính hãng của Nhà cung cấp. Nếu bên A cung cấp hàng hóa không chính Hãng, không đảm bảo đúng chất lượng của Nhà sản xuất/ Nhà cung như yêu cầu của Bên B đã thỏa thuận trong Đơn xác nhận đặt hàng thì Bên A chịu đền bù 100% giá trị đơn hàng giao sai.</li>
</ul>
<p><strong>Trách nhiệm của Bên B:</strong></p>
<ul>
  <li>Bảo đảm mặt bằng, điểm đỗ xe giao nhận hàng và an ninh, an toàn trong khu vực làm việc.</li>
  <li>Bảo đảm thanh toán đúng thời hạn được thỏa thuận giữa hai bên.</li>
</ul>
<p class="at">ĐIỀU 6: ĐIỀU KHOẢN CHUNG</p>
<ul>
  <li>Hợp đồng này được lập thành 02 (hai) bản có giá trị pháp lý như nhau, Bên A giữ 01 bản, Bên B giữ 01 bản.</li>
  <li>Hợp đồng này có hiệu lực kể từ ngày ký kết.</li>
  <li>Sau khi giao nhận hàng và thanh toán hoàn tất, hợp đồng này tự được thanh lý.</li>
</ul>
<table style="width:100%;margin-top:48px;border-collapse:collapse;"><tr>
  <td style="width:50%;text-align:center;border:none;padding:0;vertical-align:top;"><strong>BÊN BÁN</strong><br><em>(Ký, ghi rõ họ tên)</em><br><br><br><br><br><br></td>
  <td style="width:50%;text-align:center;border:none;padding:0;vertical-align:top;"><strong>BÊN MUA</strong><br><em>(Ký, ghi rõ họ tên)</em><br><br><br><br><br><br></td>
</tr></table>
</div></body></html>`;

  const blob = new Blob(['﻿', html], {type: 'application/msword'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${(form.contractNum||'HĐ-moi').replace(/\//g,'-')}.doc`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function CreateOrder({
  onBack,
  onSave,
  onSaveEdit,
  onQuickSave,
  editOrder,
  isDraft,
  onConvertDraft,
  onExportKho,
  onImportKho,
  orders = [],
  setActive,
  setWhInSearch
}) {
  const notify = useToast();
  const {bankAccounts} = useBankAccounts();
  const isEdit = !!editOrder;
  const [prodsFS] = useCollection("products");
  const prods = prodsFS.length ? prodsFS : PRODUCTS;
  const { profile: _coProfile } = useAuth();
  const _staffName = _coProfile?.name || "Quản lý";
  const [cfgItems] = useCollection("config");
  const printCfg = cfgItems.find(c => c.id === "print_template") || {};
  const [cust, setCust] = useState({
    phone: editOrder?.phone || "",
    name: editOrder?.name || "",
    addr: editOrder?.addr || ""
  });
  const [store, setStore] = useState(editOrder?.store || "Kho HH");
  const [channel, setChannel] = useState(editOrder?.channel || "Facebook");
const [delivery, setDelivery] = useState(editOrder?.delivery || "Chưa giao hàng");
  const [dt, setDt] = useState(() => { const n = new Date(); return n.getFullYear()+"-"+String(n.getMonth()+1).padStart(2,"0")+"-"+String(n.getDate()).padStart(2,"0")+"T"+String(n.getHours()).padStart(2,"0")+":"+String(n.getMinutes()).padStart(2,"0"); });
  const [lines, setLines] = useState(editOrder ? editOrder.items.map(it => ({
    name: it.name,
    price: it.price,
    qty: it.qty,
    disc: it.disc || 0,
    discType: "đ",
    cost: it.cost || 0,
    list: 0,
    kho: it.kho || "HH",
    deliveredQty: it.deliveredQty || 0
  })) : [{
    name: "",
    price: 0,
    qty: 1,
    disc: 0,
    discType: "đ",
    cost: 0,
    list: 0,
    kho: "HH"
  }]);
  const [paid, setPaid] = useState(editOrder?.paid || 0);
  const [custExpenses, setCustExpenses] = useState(editOrder?.custExpenses || []);
  const [compCosts, setCompCosts] = useState(editOrder?.compCosts || []);
  const [shippingFee, setShippingFee] = useState(editOrder?.shippingFee || 0);
  const [installFee, setInstallFee] = useState(editOrder?.installFee || 0);
  const [returnFee, setReturnFee] = useState(editOrder?.returnFee || 0);
  const [note, setNote] = useState(editOrder?.note || "");
  const [saveTried, setSaveTried] = useState(false);
  const [addrWarnPending, setAddrWarnPending] = useState(false);
  const [payModal, setPayModal] = useState(false);
  const [editPayIdx, setEditPayIdx] = useState(null);
  const [editPayModal, setEditPayModal] = useState(false);
  const [custExpModal, setCustExpModal] = useState(false);
  const [cexpType, setCexpType] = useState("Chi phí giao hàng >15km");
  const [cexpAmt, setCexpAmt] = useState(0);
  const [compCostModal, setCompCostModal] = useState(false);
  const [editCcostIdx, setEditCcostIdx] = useState(null);
  const [ccostType, setCcostType] = useState("Hoàn tiền hàng");
  const [ccostAmt, setCcostAmt] = useState(0);
  const [ccostAcc, setCcostAcc] = useState("");
  const [ccostDate, setCcostDate] = useState(() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`; });
  const [payments, setPayments] = useState(() => {
    const arr = editOrder?.payments;
    if (arr?.length > 0) return arr;
    if (editOrder?.paid > 0) return [{ kind: "Thanh toán", amount: editOrder.paid, dt: editOrder.dt || "" }];
    return [];
  });
  const [returns, setReturns] = useState(editOrder?.returns || []);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [cancelled, setCancelled] = useState(editOrder?.orderStatus === "Huỷ" || editOrder?.orderStatus === "Hủy" || false);
  const [imported, setImported] = useState(!!editOrder?.imported);
  const [exported, setExported] = useState(!!editOrder?.exported);
  const [showKhoModal, setShowKhoModal] = useState(false);
  const [khoModalTab, setKhoModalTab] = useState(null);
  const [showPrintMenu, setShowPrintMenu] = useState(false);
  const [deliveryConfirmed, setDeliveryConfirmed] = useState(editOrder?.deliveryConfirmed || false);
  const [showDeliveryConfirm, setShowDeliveryConfirm] = useState(false);
  const [deliveries, setDeliveries] = useState(editOrder?.deliveries || []);
  const [dlvChecked, setDlvChecked] = useState({});
  const [dlvQtys, setDlvQtys] = useState({});
  const [dlvSlipModal, setDlvSlipModal] = useState(null);
  const [showDlvPanel, setShowDlvPanel] = useState(false);
  const [bottomTab, setBottomTab] = useState("payment");
  const [editReturnIdx, setEditReturnIdx] = useState(null);
  const [dupDismissed, setDupDismissed] = useState(false);
  const [showPhoneSug, setShowPhoneSug] = useState(false);
  const phoneSuggestions = React.useMemo(() => {
    const q = cust.phone.trim();
    if (q.length < 4) return [];
    const seen = new Set();
    return orders
      .filter(o => !o.draft && o.phone && o.phone.includes(q) && o.id !== (editOrder?.id || "") && !seen.has(o.phone) && seen.add(o.phone))
      .slice(0, 5)
      .map(o => ({phone: o.phone, name: o.name, addr: o.addr}));
  }, [cust.phone, orders]);
  const {txns: _txns, setTxns: _setTxns} = useTxns();
  const {docNums: _dn, setDocNums: _sdn} = useDocNum() || {};
  const [pendingOrderId] = useState(() => {
    // Chỉ cấp số DH khi: (1) tạo đơn hàng mới (không phải báo giá), hoặc (2) chuyển báo giá → đơn hàng
    const needsNewDH = (!editOrder && !isDraft) || (editOrder && editOrder.draft);
    if (!needsNewDH) return "";
    const row = _dn && _dn.find(r => r.prefix === "DH");
    const num = row ? row.num : 1;
    return fmtDocId("DH", num);
  });
  // Tăng counter docNums sau render (không được gọi setState của component cha trong render phase)
  React.useEffect(() => {
    if (pendingOrderId && _sdn) {
      _sdn(ds => ds.map(r => r.prefix === "DH" ? {...r, num: r.num + 1} : r));
    }
  }, []);
  const nowStr = () => { const d = new Date(), pad = n => String(n).padStart(2,"0"); return `${pad(d.getDate())}/${pad(d.getMonth()+1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`; };
  const effectiveOrderId = editOrder?.id || (!isDraft ? pendingOrderId : "");
  const autoAddTxn = (p) => {
    const nextId = _txns.length ? Math.max(..._txns.map(t=>Number(t.id)||0))+1 : 1;
    const d = new Date(), pad = n => String(n).padStart(2,"0");
    const timePart = `${pad(d.getHours())}:${pad(d.getMinutes())}`;
    const dateStr = p.date ? `${p.date} ${timePart}` : `${pad(d.getDate())}/${pad(d.getMonth()+1)}/${d.getFullYear()} ${timePart}`;
    const accKey = bankAccounts.find(a => a.bank === p.account)?.key || p.account || "";
    _setTxns(xs => [{
      id: nextId,
      date: dateStr,
      entity: cust.name || "",
      orderId: effectiveOrderId,
      kind: p.kind === "Đặt cọc" ? "Đặt cọc" : "Thanh toán",
      acc: accKey,
      amount: p.amount,
      note: `${p.kind === "Đặt cọc" ? "Tiền cọc" : "Thanh toán"} đơn hàng${effectiveOrderId ? " " + effectiveOrderId : ""}`,
      staff: p.staff || "QUẢN LÝ"
    }, ...xs]);
    return nextId;
  };
  const autoUpdateTxn = (txnId, oldAmount, p) => {
    const accKey = bankAccounts.find(a => a.bank === p.account)?.key || p.account || "";
    const newKind = p.kind === "Đặt cọc" ? "Đặt cọc" : "Thanh toán";
    _setTxns(xs => xs.map(t => {
      if (txnId ? t.id === txnId : (t.orderId === effectiveOrderId && t.amount === oldAmount))
        return {...t, amount: p.amount, acc: accKey, kind: newKind,
          note: `${p.kind === "Đặt cọc" ? "Tiền cọc" : "Thanh toán"} đơn hàng${effectiveOrderId ? " " + effectiveOrderId : ""}`};
      return t;
    }));
  };
  const CHI_KIND_MAP = {"Hoàn tiền hàng":"Hoàn tiền KH","Chi phí Ship hàng":"CP Ship ĐH","Chi phí hoa hồng":"Chi hoa hồng","Chi phí lắp đặt":"CP Lắp Đặt"};
  const autoAddChi = (type, amount, acc, date) => {
    const nextId = _txns.length ? Math.max(..._txns.map(t=>Number(t.id)||0))+1 : 1;
    const d = new Date(), pad = n => String(n).padStart(2,"0");
    const timePart = `${pad(d.getHours())}:${pad(d.getMinutes())}`;
    const dateStr = date ? `${date} ${timePart}` : `${pad(d.getDate())}/${pad(d.getMonth()+1)}/${d.getFullYear()} ${timePart}`;
    const accKey = bankAccounts.find(a => a.bank === acc)?.key || acc || "";
    const accObj = bankAccounts.find(a => a.key === accKey);
    const activeTxns = _txns.filter(t => t.acc === accKey && !t.cancelled);
    const curBal = (accObj?.openBal||0) + activeTxns.filter(t=>t.amount>0).reduce((s,t)=>s+t.amount,0) - activeTxns.filter(t=>t.amount<0).reduce((s,t)=>s+Math.abs(t.amount),0);
    if (curBal - amount < 0) {
      alert(`⚠ Không đủ số dư tài khoản ${accKey}!\nSố dư hiện tại: ${new Intl.NumberFormat("vi-VN").format(curBal)}đ\nCần chi: ${new Intl.NumberFormat("vi-VN").format(amount)}đ`);
      return null;
    }
    _setTxns(xs => [{
      id: nextId, date: dateStr,
      entity: cust.name || "",
      orderId: effectiveOrderId,
      kind: CHI_KIND_MAP[type] || "Chi phí",
      acc: accKey,
      amount: -amount,
      note: `${type} đơn hàng${effectiveOrderId ? " " + effectiveOrderId : ""}`,
      staff: "QUẢN LÝ"
    }, ...xs]);
    return nextId;
  };
  const autoUpdateChi = (txnId, oldAmount, type, amount, acc) => {
    const accKey = bankAccounts.find(a => a.bank === acc)?.key || acc || "";
    _setTxns(xs => xs.map(t => {
      if (txnId ? t.id === txnId : (t.orderId === effectiveOrderId && t.amount === -oldAmount))
        return {...t, amount: -amount, acc: accKey, kind: CHI_KIND_MAP[type]||"Chi phí",
          note: `${type} đơn hàng${effectiveOrderId ? " " + effectiveOrderId : ""}`};
      return t;
    }));
  };
  const handlePartialDelivery = () => {
    const pad = n => String(n).padStart(2,"0");
    const now = new Date();
    const dateStr = `${pad(now.getDate())}/${pad(now.getMonth()+1)}/${now.getFullYear()} ${pad(now.getHours())}:${pad(now.getMinutes())}`;
    const seq = (deliveries.length || 0) + 1;
    const pxNum = (_dn && _dn.find(r => r.prefix === "PX"))?.num || 1;
    const pxSlip = fmtDocId("PX", pxNum + (deliveries.length || 0));
    const batchItems = lines.filter(l => l.name && dlvChecked[l.name] && (dlvQtys[l.name]||0) > 0).map(l => {
      const unitPrice = l.qty > 0 ? Math.round((l.price * l.qty - (l.discType === "%" ? l.price * l.qty * (l.disc||0)/100 : l.disc||0)) / l.qty) : l.price;
      return { name: l.name, qty: Number(dlvQtys[l.name]||0), price: unitPrice, cost: l.cost||0, kho: l.kho||"HH" };
    });
    if (!batchItems.length) { notify("Chọn ít nhất 1 sản phẩm để giao"); return; }
    for (const item of batchItems) {
      const line = lines.find(l => l.name === item.name);
      if (item.qty > line.qty - (line.deliveredQty||0)) { notify(`${item.name}: số lượng giao vượt quá tồn`); return; }
    }
    if (onExportKho) {
      onExportKho(batchItems.map((item, i) => ({
        slip: i === 0 ? pxSlip : pxSlip + "_" + i,
        dt: dateStr, order: effectiveOrderId, prod: item.name, lot: "", qty: item.qty,
        sale: item.price, unitCost: item.cost, cust: cust.name, phone: cust.phone||"",
        addr: cust.addr||"", store: item.kho, orderStatus: "Chờ xử lý",
        delivery: "Đã giao hàng", staff: _staffName
      })));
    }
    const updLines = lines.map(l => {
      const b = batchItems.find(b => b.name === l.name);
      return b ? {...l, deliveredQty: (l.deliveredQty||0) + b.qty} : l;
    });
    setLines(updLines);
    const newDeliveries = [...deliveries, { seq, date: dateStr, pxSlip, items: batchItems }];
    setDeliveries(newDeliveries);
    const validLines = updLines.filter(l => l.name);
    const allDone = validLines.every(l => (l.deliveredQty||0) >= l.qty);
    if (allDone) { setExported(true); setDeliveryConfirmed(true); }
    if (onQuickSave) onQuickSave({ items: updLines, deliveries: newDeliveries, exported: allDone, deliveryConfirmed: allDone || deliveryConfirmed });
    setDlvSlipModal({ seq, date: dateStr, pxSlip, items: batchItems, custName: cust.name, custPhone: cust.phone||"", custAddr: cust.addr||"", orderId: effectiveOrderId });
    setDlvChecked({});
    setDlvQtys({});
  };
  const [logs, setLogs] = useState(() => {
    if (!editOrder || editOrder.draft) return [];
    // Nếu đã có logs lưu trong đơn → dùng lại, không tái tạo
    if (editOrder.logs?.length) return editOrder.logs;
    const base = [{
      dt: editOrder.dt || "",
      staff: editOrder.staff || "QUẢN LÝ",
      action: "Tạo đơn hàng",
      detail: `POS - Tạo đơn hàng mới với ${(editOrder.items||[]).length} sản phẩm: ${(editOrder.items||[]).map(it=>`${it.name} (SL: ${it.qty}, Giá: ${vnd(it.price)}đ)`).join(", ")} - Tổng tiền: ${vnd((editOrder.items||[]).reduce((s,it)=>s+it.price*it.qty,0))}đ`
    }];
    const payLogs = (editOrder.payments||[]).map(p => ({
      dt: p.datetime || p.date || editOrder.dt || "",
      staff: p.staff || editOrder.staff || "QUẢN LÝ",
      action: "payments_added",
      detail: `POS - Đã thêm 1 thanh toán, tổng tiền: ${vnd(p.amount)}đ`
    }));
    return [...base, ...payLogs];
  });
  const addLog = (action, detail, staffName) => setLogs(xs => [...xs, { dt: nowStr(), staff: staffName || "QUẢN LÝ", action, detail }]);
  const ACCOUNTS = bankAccounts.filter(a=>a.status==="Hoạt động").map(a=>a.bank);
  const [newProdReq, setNewProdReq] = useState(null); // { name, lineIdx }
  const setLine = (i, p) => setLines(ls => ls.map((l, x) => x === i ? {
    ...l,
    ...p
  } : l));
  const lineDisc = l => l.discType === "%" ? l.price * l.qty * (l.disc || 0) / 100 : l.disc || 0;
  const lineTotal = l => Math.max(0, l.price * l.qty - lineDisc(l));
  const subtotal = lines.reduce((s, l) => s + lineTotal(l), 0);
  const custExpTotal = custExpenses.reduce((s,e) => s+e.amount, 0) + shippingFee + installFee + returnFee;
  const total = subtotal + custExpTotal;
  const deposit = payments.filter(p=>p.kind==="Đặt cọc").reduce((s,p)=>s+p.amount,0);
  const returnPaid = payments.filter(p=>p.kind==="Tiền hàng trả lại").reduce((s,p)=>s+p.amount,0);
  const paidOnly = payments.filter(p=>p.kind==="Thanh toán").reduce((s,p)=>s+p.amount,0);
  const discountExtra = payments.filter(p=>p.kind==="Giảm giá thêm").reduce((s,p)=>s+p.amount,0);
  const returnAmt = returns.filter(r=>!r.cancelled).reduce((s,r)=>s+(r.amount||0),0);
  const effectiveTotal = total - returnAmt;
  const remaining = effectiveTotal - deposit - paidOnly - returnPaid - discountExtra;
  const payDone = effectiveTotal > 0 && remaining <= 0;
  const payStatus = payDone ? "Đã thanh toán"
    : deliveryConfirmed ? "Chờ thanh toán"
    : "Đã đặt cọc";
  const khoXong = !!(imported && exported);
  const orderStatus = cancelled ? "Huỷ"
    : (payDone && khoXong) ? "Hoàn thành"
    : deliveryConfirmed ? "Chờ xử lý"
    : "Chờ giao hàng";
  const khoActiveIdx = (imported && exported) ? 2 : imported ? 1 : 0;
  const orderSteps = ["Chờ giao hàng", "Chờ xử lý", "Hoàn thành"];
  const orderActiveIdx = cancelled ? -1 : orderSteps.indexOf(orderStatus);
  const paySteps = ["Đã đặt cọc", "Chờ thanh toán", "Đã thanh toán"];
  const payActiveIdx = paySteps.indexOf(payStatus);
  const COL_CLS = [
    "bg-[#F1F5F9] text-[#475569] ring-[#CBD5E1]",
    "bg-[#FFFBEB] text-[#B45309] ring-[#FDE68A]",
    "bg-[#fef9f0] text-[#92400e] ring-[#b45309]",
  ];
  const badgeCls = (colIdx, activeIdx) => {
    if (activeIdx < 0 || colIdx > activeIdx) return "bg-slate-100 text-slate-400 ring-slate-200 opacity-40 cursor-not-allowed";
    if (colIdx < activeIdx) return "bg-amber-50 text-amber-600 ring-amber-200";
    return COL_CLS[colIdx];
  };
  const custValid = !!cust.name.trim() && !!cust.phone.trim() && !!cust.addr.trim();
  const addrIsVague = addr => {
    const s = (addr || "").trim().toLowerCase();
    if (!s) return false;
    const CITIES = ["hải phòng","hà nội","hồ chí minh","sài gòn","đà nẵng","cần thơ","hải dương","hưng yên","quảng ninh","thái bình","nam định","ninh bình","thanh hóa","nghệ an","hà tĩnh","bắc ninh","vĩnh phúc","phú thọ","bắc giang","thái nguyên","lạng sơn","tuyên quang","lào cai","yên bái","sơn la","hòa bình","điện biên","lai châu","cao bằng","bắc kạn","hà giang"];
    const stripped = s.replace(/^(tp|thành phố|tỉnh|tp\.)\s*/i,"").trim();
    if (CITIES.some(c => stripped === c || s === c || s === "tp " + c || s === "tỉnh " + c)) return true;
    const hasDetail = /\d/.test(s) || /đường|phố|số\s|số,|ngõ|ngách|khu|tòa|tầng|lô\s|block|quận|huyện|phường|xã/i.test(s);
    return s.split(/[\s,]+/).filter(Boolean).length <= 3 && !hasDetail;
  };
  const addrDetailed = cust.addr.trim() && !addrIsVague(cust.addr);
  const custValidFull = custValid && addrDetailed;
  const handlePrint = (type) => {
    setSaveTried(true);
    if (!custValidFull) { notify("⚠️ Địa chỉ giao hàng chưa đủ chi tiết để in đơn"); return; }
    openPrint({...build(), dt: editOrder?.dt || dt}, type, printCfg, prods);
    setShowPrintMenu(false);
  };
  const phoneQuery = cust.phone.trim();
  const dupCust = phoneQuery && phoneQuery !== (editOrder?.phone || "")
    ? (() => {
        const fromCust = CUSTOMERS.find(cu => cu.phone && cu.phone.trim() === phoneQuery);
        if (fromCust) return fromCust;
        const fromOrder = orders.find(o => o.id !== (editOrder?.id || "") && o.phone && o.phone.trim() === phoneQuery);
        return fromOrder ? {name: fromOrder.name, addr: fromOrder.addr, _orderId: fromOrder.id, _isDraft: !!fromOrder.draft} : null;
      })()
    : null;
  const build = () => ({
    id: effectiveOrderId,
    name: cust.name || "Khách lẻ",
    phone: cust.phone,
    addr: cust.addr,
    store,
    channel,
    staff: _staffName,
    paid,
    custExpenses,
    compCosts,
    shippingFee,
    installFee,
    returnFee,
    returns,
    note,
    delivery,
    orderStatus: cancelled ? "Huỷ" : "",
    deliveryConfirmed,
    imported,
    exported,
    payments,
    logs,
    ...(deliveries.length ? { deliveries } : {}),
    items: lines.filter(l => l.name).map(l => ({
      name: l.name,
      price: l.price,
      qty: l.qty,
      disc: lineDisc(l),
      cost: l.cost,
      ...(l.deliveredQty ? { deliveredQty: l.deliveredQty } : {})
    }))
  });
  const onAddProduct = p => setProds(xs => [{
    ...p
  }, ...xs]);
  const sm = inputSm;
  const isBaoGia = isDraft || (isEdit && !!editOrder?.draft);
  const hasPaidOnBaoGia = isBaoGia && payments.length > 0;
  const saveLabel = isEdit && !editOrder?.draft ? " Lưu thay đổi" : isBaoGia ? " Lưu báo giá" : " Lưu đơn hàng";
  const onSaveClick = () => {
    setSaveTried(true);
    if (!isDraft && !custValid) return;
    const badItems = lines.filter(l => l.name && l.qty <= 0);
    if (badItems.length > 0) { notify("⚠️ Sản phẩm \"" + badItems[0].name + "\" có số lượng = 0. Vui lòng kiểm tra lại."); return; }
    const negPrice = lines.filter(l => l.name && l.price < 0);
    if (negPrice.length > 0) { notify("⚠️ Sản phẩm \"" + negPrice[0].name + "\" có giá bán âm. Vui lòng kiểm tra lại."); return; }
    if (isEdit) { addLog("order_edited", `Sửa đơn hàng — ${_staffName}`, _staffName); onSaveEdit(build()); notify("✅ Đã lưu"); setTimeout(onBack, 800); }
    else { onSave(build(), isDraft); notify("✅ Đã lưu"); setTimeout(onBack, 800); }
  };
  return /*#__PURE__*/React.createElement("div", {
    className: "space-y-5"
  },
  /*#__PURE__*/React.createElement("div", {className: "flex items-start justify-between gap-3"},
    /*#__PURE__*/React.createElement("h2", {className: "text-[22px] font-bold text-slate-800"},
      isEdit ? (editOrder.draft ? `Sửa báo giá #${editOrder.id}` : `Sửa đơn hàng #${editOrder.id}`) : isDraft ? "Tạo báo giá" : "Tạo đơn hàng"),
    /*#__PURE__*/React.createElement("div", {className: "flex flex-col items-end gap-2"},
      /*#__PURE__*/React.createElement("div", {className: "flex items-center gap-2"},
        (isEdit || isDraft) && /*#__PURE__*/React.createElement("button", {
          onClick: () => { if (hasPaidOnBaoGia) { notify("⚠️ Đã có thanh toán — bắt buộc phải tạo đơn hàng"); return; } onSaveClick(); },
          disabled: subtotal === 0 || hasPaidOnBaoGia,
          title: hasPaidOnBaoGia ? "Đã có thanh toán, phải tạo đơn hàng" : undefined,
          className: blueBtn + " disabled:cursor-not-allowed disabled:opacity-50"
        }, /*#__PURE__*/React.createElement(Save, {className: "h-4 w-4"}), saveLabel),
        isEdit && !editOrder?.draft && (
          !cancelled
            ? /*#__PURE__*/React.createElement("button", {type: "button", onClick: () => { setCancelled(true); const obj = build(); onSaveEdit({...obj, orderStatus: "Huỷ"}); notify("✅ Đã huỷ đơn"); setTimeout(onBack, 800); }, className: "inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-[14px] font-semibold text-red-600 hover:bg-red-100"}, "Huỷ đơn")
            : /*#__PURE__*/React.createElement("button", {type: "button", onClick: () => { setCancelled(false); const obj = build(); onSaveEdit({...obj, orderStatus: ""}); notify("✅ Đã bỏ huỷ"); setTimeout(onBack, 800); }, className: "inline-flex items-center rounded border border-slate-200 bg-white px-2.5 py-1.5 text-sm font-medium text-slate-400 hover:bg-slate-50"}, "Bỏ huỷ")),
        (!isEdit || editOrder?.draft) && /*#__PURE__*/React.createElement("button", {
          onClick: () => { setSaveTried(true); if (!custValidFull) { notify("⚠️ Vui lòng điền đầy đủ thông tin và địa chỉ chi tiết"); return; } const dhId = editOrder?.draft ? pendingOrderId : null; onSave(dhId ? {...build(), id: dhId} : build(), false); if (dhId && onConvertDraft) onConvertDraft(dhId); notify("✅ Đã tạo đơn hàng"); setTimeout(onBack, 800); },
          disabled: subtotal === 0,
          className: blueBtn + " disabled:cursor-not-allowed disabled:opacity-50"
        }, /*#__PURE__*/React.createElement(ShoppingCart, {className: "h-4 w-4"}), " Tạo đơn hàng"),
        isEdit && isBaoGia && /*#__PURE__*/React.createElement("button", {onClick: () => handlePrint("bao-gia"), className: "inline-flex items-center gap-1.5 rounded-lg border border-[#fed7aa] bg-[#ffedd5] px-3 py-1.5 text-[14px] font-semibold text-[#92400e] hover:bg-[#fde8c8]"}, /*#__PURE__*/React.createElement(Printer, {className: "h-4 w-4"}), " In Báo Giá"),
        isEdit && !isBaoGia && !deliveryConfirmed && /*#__PURE__*/React.createElement("button", {onClick: () => handlePrint("xac-nhan"), className: "inline-flex items-center gap-1.5 rounded-lg border border-[#fed7aa] bg-[#ffedd5] px-3 py-1.5 text-[14px] font-semibold text-[#92400e] hover:bg-[#fde8c8]"}, /*#__PURE__*/React.createElement(Printer, {className: "h-4 w-4"}), " In Đơn XN ĐH"),
        isEdit && !isBaoGia && deliveryConfirmed && /*#__PURE__*/React.createElement("div", {className: "relative"},
          /*#__PURE__*/React.createElement("button", {onClick: () => setShowPrintMenu(v => !v), className: "inline-flex items-center gap-1.5 rounded-lg border border-[#fed7aa] bg-[#ffedd5] px-3 py-1.5 text-[14px] font-semibold text-[#92400e] hover:bg-[#fde8c8]"},
            /*#__PURE__*/React.createElement(Printer, {className: "h-4 w-4"}), " In Phiếu Giao ", /*#__PURE__*/React.createElement(ChevronDown, {className: "h-3.5 w-3.5"})),
          showPrintMenu && /*#__PURE__*/React.createElement("div", {className: "absolute right-0 top-full z-20 mt-1 min-w-[210px] rounded-lg border border-slate-200 bg-white py-1 shadow-lg"},
            /*#__PURE__*/React.createElement("button", {onClick: () => handlePrint("phieu-giao-gia"), className: "block w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"}, "Phiếu giao hàng"),
            /*#__PURE__*/React.createElement("button", {onClick: () => handlePrint("phieu-giao"), className: "block w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"}, "Phiếu giao hàng không giá"),
            /*#__PURE__*/React.createElement("button", {onClick: () => handlePrint("phieu-giao-no-logo"), className: "block w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"}, "Phiếu giao hàng không logo"))),
        /*#__PURE__*/React.createElement("button", {onClick: () => { if (hasPaidOnBaoGia) { notify("⚠️ Đã có thanh toán — bắt buộc phải tạo đơn hàng trước khi quay lại"); return; } onBack(); }, className: backBtn},
          /*#__PURE__*/React.createElement(ArrowLeft, {className: "h-4 w-4"}), " Quay lại")),
      /*#__PURE__*/React.createElement("input", {type: "datetime-local", value: dt, onChange: e => setDt(e.target.value), className: field}))),
  hasPaidOnBaoGia && /*#__PURE__*/React.createElement("div", {className:"flex items-center gap-2 rounded-lg border border-[#B91C1C] bg-[#FEF2F2] px-4 py-2.5 text-sm font-medium text-amber-800"},
    "⚠️ Đã có thanh toán — báo giá này bắt buộc phải chuyển thành đơn hàng, không thể lưu báo giá."),
  /*#__PURE__*/React.createElement("div", null,
    /*#__PURE__*/React.createElement("p", {className: "mb-2 text-sm font-semibold text-slate-700"}, "Thông tin khách hàng"),
    /*#__PURE__*/React.createElement("div", {className: "grid grid-cols-3 gap-3"},
      /*#__PURE__*/React.createElement("div", null,
        /*#__PURE__*/React.createElement("label", {className: "mb-1 block text-[13px] font-medium text-slate-500"}, "Số điện thoại ",/*#__PURE__*/React.createElement("span",{className:"text-[#B91C1C]"},"(*)")),
        /*#__PURE__*/React.createElement("div", {className: "relative"},
          /*#__PURE__*/React.createElement("input", {className: `${inputF}${saveTried && !cust.phone.trim() ? " border-rose-400" : ""}`, value: cust.phone,
            onChange: e => { setCust({...cust, phone: e.target.value}); setDupDismissed(false); setShowPhoneSug(true); },
            onFocus: () => setShowPhoneSug(true),
            onBlur: () => setTimeout(() => setShowPhoneSug(false), 150)}),
          showPhoneSug && phoneSuggestions.length > 0 && /*#__PURE__*/React.createElement("ul", {className: "absolute z-30 mt-1 w-full rounded-lg border border-slate-200 bg-white shadow-lg text-sm overflow-hidden"},
            phoneSuggestions.map((s, i) => /*#__PURE__*/React.createElement("li", {key: i},
              /*#__PURE__*/React.createElement("button", {
                onMouseDown: () => { setCust({phone: s.phone, name: s.name, addr: s.addr}); setShowPhoneSug(false); setDupDismissed(true); },
                className: "flex w-full flex-col px-3 py-2 text-left hover:bg-[#fef9f0]"},
                /*#__PURE__*/React.createElement("span", {className: "font-medium text-slate-800"}, s.phone, /*#__PURE__*/React.createElement("span", {className: "ml-2 text-[#92400e]"}, s.name)),
                s.addr && /*#__PURE__*/React.createElement("span", {className: "text-xs text-slate-400 truncate"}, s.addr)))))),
        saveTried && !cust.phone.trim() ? /*#__PURE__*/React.createElement("p", {className: "mt-1 text-xs text-[#B91C1C]"}, "Vui lòng nhập SĐT") : null,
        dupCust && !dupDismissed ? /*#__PURE__*/React.createElement("div", {className: "mt-2 rounded-lg border border-amber-300 bg-amber-50 p-2 text-xs"},
          /*#__PURE__*/React.createElement("div", {className: "font-semibold text-amber-800"},
            "⚠️ Trùng SĐT: ", dupCust.name,
            dupCust._orderId ? /*#__PURE__*/React.createElement("span", {className: "ml-1 font-normal text-amber-700"},
              "(", dupCust._isDraft ? "Báo giá" : "Đơn", " ", dupCust._orderId, ")") : null),
          /*#__PURE__*/React.createElement("button", {onClick: () => { setCust({...cust, name: dupCust.name||cust.name, addr: dupCust.addr||cust.addr}); setDupDismissed(true); }, className: "mt-1 text-amber-700 underline"}, "Dùng thông tin này")) : null),
      /*#__PURE__*/React.createElement("div", null,
        /*#__PURE__*/React.createElement("label", {className: "mb-1 block text-[13px] font-medium text-slate-500"}, "Tên khách hàng ",/*#__PURE__*/React.createElement("span",{className:"text-[#B91C1C]"},"(*)")),
        /*#__PURE__*/React.createElement("input", {className: `${inputF}${saveTried && !cust.name.trim() ? " border-rose-400" : ""}`, value: cust.name, onChange: e => setCust({...cust, name: e.target.value})}),
        saveTried && !cust.name.trim() ? /*#__PURE__*/React.createElement("p", {className: "mt-1 text-xs text-[#B91C1C]"}, "Vui lòng nhập tên") : null),
      /*#__PURE__*/React.createElement("div", null,
        /*#__PURE__*/React.createElement("label", {className: "mb-1 block text-[13px] font-medium text-slate-500"}, "Địa chỉ giao hàng ",/*#__PURE__*/React.createElement("span",{className:"text-[#B91C1C]"},"(*)")),
        /*#__PURE__*/React.createElement("input", {className: `${inputF}${saveTried && (!cust.addr.trim() || addrIsVague(cust.addr)) ? " border-rose-400" : ""}`, value: cust.addr, onChange: e => setCust({...cust, addr: e.target.value})}),
        saveTried && !cust.addr.trim() ? /*#__PURE__*/React.createElement("p", {className: "mt-1 text-xs text-[#B91C1C]"}, "Vui lòng nhập địa chỉ") :
        saveTried && addrIsVague(cust.addr) ? /*#__PURE__*/React.createElement("p", {className: "mt-1 text-xs text-[#B91C1C]"}, "Địa chỉ chưa đủ chi tiết (cần số nhà, đường, phường...)") : null))),
  /*#__PURE__*/React.createElement("div", null,
    /*#__PURE__*/React.createElement("label", {className: "mb-1 block text-[13px] font-medium text-slate-500"}, "Ghi chú"),
    /*#__PURE__*/React.createElement("input", {className: inputF, value: note, onChange: e => setNote(e.target.value), placeholder: "Ghi chú cho đơn hàng..."})),
  isEdit && !editOrder?.draft && /*#__PURE__*/React.createElement("div", {className: "grid grid-cols-3 gap-4"},
    /*#__PURE__*/React.createElement("div", {className: "rounded-lg border border-slate-200 bg-slate-50 px-4 py-3"},
      /*#__PURE__*/React.createElement("label", {className: "mb-2 block text-sm font-semibold text-slate-600"}, "Trạng thái đơn hàng"),
      /*#__PURE__*/React.createElement("div", {className: "flex gap-2"},
        (orderActiveIdx === 2 ? [["Hoàn thành", 2]] : orderSteps.map((s,i) => [s,i])).map(([s, i]) =>
          /*#__PURE__*/React.createElement("span", {key: s, className: `inline-flex flex-1 items-center justify-center rounded px-2 py-1.5 text-sm font-semibold ring-1 ring-inset ${badgeCls(i, orderActiveIdx)}`}, s))),
),
    /*#__PURE__*/React.createElement("div", {className: "rounded-lg border border-slate-200 bg-slate-50 px-4 py-3"},
      /*#__PURE__*/React.createElement("label", {className: "mb-2 block text-sm font-semibold text-slate-600"}, "Trạng thái thanh toán"),
      /*#__PURE__*/React.createElement("div", {className: "flex gap-2"},
        (payActiveIdx === 2 ? [["Đã thanh toán", 2]] : paySteps.map((s,i) => [s,i])).map(([s, i]) => {
          const frozenCls = "bg-slate-100 text-slate-400 ring-slate-200 opacity-40 cursor-not-allowed";
          const cls = (i === 0 && payActiveIdx > 0 && paid === 0) ? frozenCls : badgeCls(i, payActiveIdx);
          return /*#__PURE__*/React.createElement("span", {key: s, className: `inline-flex flex-1 items-center justify-center rounded px-2 py-1.5 text-sm font-semibold ring-1 ring-inset ${cls}`}, s);
        })),
),
    /*#__PURE__*/React.createElement("div", {className: "rounded-lg border border-slate-200 bg-slate-50 px-4 py-3"},
      /*#__PURE__*/React.createElement("label", {className: "mb-2 block text-sm font-semibold text-slate-600"}, "Trạng thái kho"),
      /*#__PURE__*/React.createElement("div", {className: "flex gap-2"},
        (khoActiveIdx === 2
          ? [["Đã xử lý kho", 2, () => { setKhoModalTab("nhap"); setShowKhoModal(true); }]]
          : [["Nhập kho", 0, () => { setKhoModalTab("nhap"); setShowKhoModal(true); }], ["Xuất kho", 1, () => { setKhoModalTab("xuat"); setShowKhoModal(true); }], ["Đã xử lý kho", 2, () => { setKhoModalTab("nhap"); setShowKhoModal(true); }]]
        ).map(([lbl, colIdx, onClick]) => {
          const cls = badgeCls(colIdx, khoActiveIdx);
          return /*#__PURE__*/React.createElement("button", {key: lbl, type: "button", onClick, className: `inline-flex flex-1 items-center justify-center rounded py-1.5 text-sm font-semibold ring-1 ring-inset ${cls} transition hover:brightness-95`}, lbl);
        })))),
  /*#__PURE__*/React.createElement("div", null,
    /*#__PURE__*/React.createElement("div", {className: "mb-2 flex items-center justify-between"},
      /*#__PURE__*/React.createElement("p", {className: "text-sm font-semibold text-slate-700"}, "Danh sách sản phẩm"),
      !isDraft && !(isEdit && editOrder?.draft) && /*#__PURE__*/React.createElement("div", {className: "relative"},
        deliveryConfirmed
          ? /*#__PURE__*/React.createElement("button", {className: "inline-flex items-center gap-1.5 rounded-lg bg-[#92400e] px-3 py-1.5 text-sm font-bold text-white"},
              /*#__PURE__*/React.createElement(Check, {className: "h-4 w-4"}), " Đã giao hàng")
          : /*#__PURE__*/React.createElement("button", {
              onClick: () => { setDeliveryConfirmed(true); setDelivery("Đã giao hàng"); addLog("delivery_confirmed", "Xác nhận giao hàng", _staffName); },
              className: "inline-flex items-center gap-1.5 rounded-lg bg-[#92400e] px-3 py-1.5 text-sm font-medium text-white hover:bg-[#78350f]"
            }, /*#__PURE__*/React.createElement(Truck, {className: "h-4 w-4"}), " Xác nhận giao hàng"))),
    addrWarnPending ? /*#__PURE__*/React.createElement("div", {className: "mb-3 flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3"},
      /*#__PURE__*/React.createElement("span", {className: "mt-0.5 shrink-0 text-amber-500"}, "⚠️"),
      /*#__PURE__*/React.createElement("div", {className: "flex-1 text-sm"},
        /*#__PURE__*/React.createElement("p", {className: "font-medium text-amber-800"}, "Địa chỉ giao hàng chưa đủ chi tiết"),
        /*#__PURE__*/React.createElement("div", {className: "mt-2 flex gap-2"},
          /*#__PURE__*/React.createElement("button", {onClick: () => setAddrWarnPending(false), className: "rounded-md bg-white px-3 py-1 text-xs font-medium text-slate-700 ring-1 ring-inset ring-slate-300 hover:bg-slate-50"}, "Cập nhật địa chỉ"),
          /*#__PURE__*/React.createElement("button", {onClick: () => { setAddrWarnPending(false); setDelivery("Đã giao hàng"); setDeliveryConfirmed(true); }, className: "rounded-md bg-amber-600 px-3 py-1 text-xs font-medium text-white hover:bg-amber-700"}, "Vẫn xác nhận")))) : null,
    /*#__PURE__*/React.createElement("div", {className: "rounded-lg border border-slate-200"},
      /*#__PURE__*/React.createElement("table", {className: "w-full text-sm border-collapse", style:{tableLayout:"fixed"}},
        /*#__PURE__*/React.createElement("colgroup", null,
          /*#__PURE__*/React.createElement("col", {style:{width:350}}),
          /*#__PURE__*/React.createElement("col", {style:{width:64}}),
          /*#__PURE__*/React.createElement("col", {style:{width:70}}),
          /*#__PURE__*/React.createElement("col", {style:{width:120}}),
          /*#__PURE__*/React.createElement("col", {style:{width:150}}),
          /*#__PURE__*/React.createElement("col", {style:{width:130}}),
          /*#__PURE__*/React.createElement("col", {style:{width:120}}),
          /*#__PURE__*/React.createElement("col", {style:{width:80}}),
          /*#__PURE__*/React.createElement("col", {style:{width:44}})),
        /*#__PURE__*/React.createElement("thead", null,
          /*#__PURE__*/React.createElement("tr", {className: "bg-slate-50 text-left text-xs font-medium uppercase tracking-wide text-slate-500"},
            /*#__PURE__*/React.createElement("th", {className: "px-3 py-2.5 border-b border-slate-200"}, "Tên sản phẩm"),
            /*#__PURE__*/React.createElement("th", {className: "px-3 py-2.5 border-b border-slate-200 text-center"}, "ĐVT"),
            /*#__PURE__*/React.createElement("th", {className: "px-3 py-2.5 border-b border-slate-200 text-center"}, "SL"),
            /*#__PURE__*/React.createElement("th", {className: "px-3 py-2.5 border-b border-slate-200 text-right"}, "Giá niêm yết"),
            /*#__PURE__*/React.createElement("th", {className: "px-3 py-2.5 border-b border-slate-200 text-right"}, "Giảm giá"),
            /*#__PURE__*/React.createElement("th", {className: "px-3 py-2.5 border-b border-slate-200 text-right"}, "Giá bán"),
            /*#__PURE__*/React.createElement("th", {className: "px-3 py-2.5 border-b border-slate-200 text-right"}, "Thành tiền"),
            /*#__PURE__*/React.createElement("th", {className: "px-3 py-2.5 border-b border-slate-200 text-center"}, "Kho"),
            /*#__PURE__*/React.createElement("th", {className: "px-3 py-2.5 border-b border-slate-200", style: {width: 44}}))),
        /*#__PURE__*/React.createElement("tbody", null,
          ...lines.map((l, i) => { const isReturned = !!(l.name && returns.some(r => !r.cancelled && r.prod === l.name)); return /*#__PURE__*/React.createElement("tr", {key: i, className: "align-middle", style: {backgroundColor: isReturned ? "#fffbeb" : i%2===0?"#ffffff":"#f8fafc"}},
            /*#__PURE__*/React.createElement("td", {className: "px-3 py-2 border-b border-slate-100"},
              /*#__PURE__*/React.createElement(ProductPicker, {value: l.name, products: prods, onPick: p => setLine(i, p.sku||p.sale!==undefined?{name:p.name,price:p.sale??l.price,cost:p.cost??l.cost,list:p.list??l.list,unit:p.unit??l.unit}:{name:p.name})}),
              isReturned && /*#__PURE__*/React.createElement("div", {className: "mt-0.5 flex items-center gap-1 text-xs font-medium text-amber-600"}, "⚠️ Sản phẩm đã trả")),
            /*#__PURE__*/React.createElement("td", {className: "px-3 py-2 border-b border-slate-100 text-center text-xs text-slate-500"},
              l.unit || ""),
            /*#__PURE__*/React.createElement("td", {className: "px-3 py-2 border-b border-slate-100"},
              /*#__PURE__*/React.createElement("input", {type: "number", className: `${sm} text-center`, value: l.qty, onChange: e => setLine(i, {qty: +e.target.value})})),
            /*#__PURE__*/React.createElement("td", {className: "px-3 py-2 border-b border-slate-100 text-right tabular-nums text-slate-500 text-sm"},
              l.list > 0 ? num(l.list) : /*#__PURE__*/React.createElement("span", {className: "text-slate-300"}, "")),
            /*#__PURE__*/React.createElement("td", {className: "px-3 py-2 border-b border-slate-100"},
              /*#__PURE__*/React.createElement("div", {className: "flex items-stretch overflow-hidden rounded-md border border-slate-200 focus-within:border-blue-400"},
                /*#__PURE__*/React.createElement(NumInput, {className: "w-full border-0 px-2 py-1.5 focus:outline-none", value: l.disc, onChange: v => setLine(i, {disc: v})}),
                /*#__PURE__*/React.createElement("select", {className: "border-l border-slate-200 bg-slate-50 px-1.5 text-xs text-slate-600 focus:outline-none", value: l.discType, onChange: e => setLine(i, {discType: e.target.value})},
                  /*#__PURE__*/React.createElement("option", {value: "đ"}, "đ"),
                  /*#__PURE__*/React.createElement("option", {value: "%"}, "%")))),
            /*#__PURE__*/React.createElement("td", {className: "px-3 py-2 border-b border-slate-100"},
              /*#__PURE__*/React.createElement(NumInput, {className: `${sm} w-full text-right`, value: l.price, onChange: v => setLine(i, {price: v})})),
            /*#__PURE__*/React.createElement("td", {className: "px-3 py-2 border-b border-slate-100 text-right tabular-nums font-semibold text-slate-800"}, num(lineTotal(l))),
            /*#__PURE__*/React.createElement("td", {className: "px-3 py-2 border-b border-slate-100 text-center"},
              /*#__PURE__*/React.createElement("select", {className: "rounded border border-slate-200 bg-white px-1.5 py-1 text-xs text-slate-700 focus:outline-none focus:border-[#fed7aa]", value: l.kho||"HH", onChange: e => setLine(i,{kho:e.target.value})},
                /*#__PURE__*/React.createElement("option", null, "HH"),
                /*#__PURE__*/React.createElement("option", null, "HG"),
                /*#__PURE__*/React.createElement("option", null, "SR"))),
            /*#__PURE__*/React.createElement("td", {className: "px-3 py-2 border-b border-slate-100"},
              /*#__PURE__*/React.createElement("button", {onClick: () => setLines(ls => ls.filter((_,x)=>x!==i)), title: "Xoá", className: "rounded p-1.5 bg-amber-100 text-[#92400e] hover:bg-amber-200"},
                /*#__PURE__*/React.createElement(X, {className: "h-3.5 w-3.5"})))); })))),
    /*#__PURE__*/React.createElement("div", {className: "mt-3 flex items-center gap-2"},
      /*#__PURE__*/React.createElement("button", {
        onClick: () => setLines(ls => [...ls, {name:"",price:0,qty:1,disc:0,discType:"đ",cost:0,list:0,kho:"HH",unit:""}]),
        className: addBtn
      }, /*#__PURE__*/React.createElement(Plus, {className: "h-4 w-4"}), " Thêm dòng"),
      /*#__PURE__*/React.createElement("button", {
        onClick: () => setNewProdReq({name:"", lineIdx: lines.length}),
        className: addBtn
      }, /*#__PURE__*/React.createElement(Plus, {className: "h-4 w-4"}), " Thêm sản phẩm mới"),
      newProdReq !== null && /*#__PURE__*/React.createElement(ProductForm, {
        presetName: newProdReq.name,
        onClose: () => setNewProdReq(null),
        onSave: f => {
          onAddProduct(f);
          const idx = newProdReq.lineIdx;
          if (idx < lines.length) { setLine(idx, {name:f.name,price:f.sale||0,cost:f.cost||0,list:f.list||0}); }
          else { setLines(ls => [...ls, {name:f.name,price:f.sale||0,qty:1,disc:0,discType:"đ",cost:f.cost||0,list:f.list||0}]); }
          setNewProdReq(null);
        }
      }))),
  /*#__PURE__*/React.createElement("div", null,
    /*#__PURE__*/React.createElement("div", {className: isEdit && !editOrder?.draft ? "overflow-hidden rounded-lg border border-slate-200" : ""},
      isEdit && !editOrder?.draft && lines.filter(l => l.name).some(l => (l.deliveredQty||0) < l.qty) && /*#__PURE__*/React.createElement("div", {className: "space-y-2"},
    /*#__PURE__*/React.createElement("div", {className: "flex items-center justify-between rounded-lg border border-amber-200 bg-amber-50 px-4 py-2.5"},
      /*#__PURE__*/React.createElement("label", {className: "flex cursor-pointer items-center gap-2", onClick: () => setShowDlvPanel(v => !v)},
        /*#__PURE__*/React.createElement("input", {type: "checkbox", readOnly: true, checked: showDlvPanel, className: "h-4 w-4 cursor-pointer rounded border-amber-300 accent-amber-600"}),
        /*#__PURE__*/React.createElement("span", {className: "text-sm font-semibold text-amber-800"}, "Giao hàng từng phần")),
      deliveries.length > 0 && /*#__PURE__*/React.createElement("div", {className: "flex gap-1"},
        deliveries.map(d => /*#__PURE__*/React.createElement("button", {
          key: d.seq, onClick: () => setDlvSlipModal({...d, custName: cust.name, custPhone: cust.phone||"", custAddr: cust.addr||"", orderId: effectiveOrderId}),
          className: "rounded-full bg-amber-200 px-2 py-0.5 text-xs font-medium text-amber-800 hover:bg-amber-300"
        }, "Lần " + d.seq)))),
    showDlvPanel && /*#__PURE__*/React.createElement("div", {className: "rounded-lg border border-amber-200 bg-amber-50 p-4"},
      /*#__PURE__*/React.createElement("table", {className: "w-full text-sm mb-3", style:{borderCollapse:"collapse"}},
        /*#__PURE__*/React.createElement("thead", null,
          /*#__PURE__*/React.createElement("tr", {className: "text-xs text-amber-700 border-b border-amber-200"},
            /*#__PURE__*/React.createElement("th", {className: "py-1.5 text-left font-medium w-8"}, ""),
            /*#__PURE__*/React.createElement("th", {className: "py-1.5 text-left font-medium"}, "Sản phẩm"),
            /*#__PURE__*/React.createElement("th", {className: "py-1.5 text-center font-medium w-14"}, "Đặt"),
            /*#__PURE__*/React.createElement("th", {className: "py-1.5 text-center font-medium w-16"}, "Đã giao"),
            /*#__PURE__*/React.createElement("th", {className: "py-1.5 text-center font-medium w-14"}, "Còn"),
            /*#__PURE__*/React.createElement("th", {className: "py-1.5 text-center font-medium w-24"}, "Lần này"))),
        /*#__PURE__*/React.createElement("tbody", null,
          lines.filter(l => l.name && (l.deliveredQty||0) < l.qty).map(l =>
            /*#__PURE__*/React.createElement("tr", {key: l.name, className: "border-b border-amber-100"},
              /*#__PURE__*/React.createElement("td", {className: "py-2"},
                /*#__PURE__*/React.createElement("input", {type: "checkbox", checked: !!dlvChecked[l.name], onChange: e => { const v = e.target.checked; setDlvChecked(c => ({...c, [l.name]: v})); if (v && !dlvQtys[l.name]) setDlvQtys(q => ({...q, [l.name]: l.qty - (l.deliveredQty||0)})); }, className: "h-4 w-4 rounded border-amber-300"})),
              /*#__PURE__*/React.createElement("td", {className: "py-2 text-slate-700"}, l.name),
              /*#__PURE__*/React.createElement("td", {className: "py-2 text-center tabular-nums text-slate-600"}, l.qty),
              /*#__PURE__*/React.createElement("td", {className: "py-2 text-center tabular-nums text-slate-500"}, l.deliveredQty||0),
              /*#__PURE__*/React.createElement("td", {className: "py-2 text-center tabular-nums font-medium text-amber-700"}, l.qty - (l.deliveredQty||0)),
              /*#__PURE__*/React.createElement("td", {className: "py-2 text-center"},
                dlvChecked[l.name]
                  ? /*#__PURE__*/React.createElement("input", {type: "number", min: 1, max: l.qty-(l.deliveredQty||0), value: dlvQtys[l.name]||"", onChange: e => setDlvQtys(q => ({...q, [l.name]: Math.min(Number(e.target.value), l.qty-(l.deliveredQty||0))})), className: "w-16 rounded border border-amber-300 px-1 py-0.5 text-center text-sm focus:outline-none focus:border-amber-500"})
                  : /*#__PURE__*/React.createElement("span", {className: "text-slate-300"}, "—")))))),
      /*#__PURE__*/React.createElement("div", {className: "flex justify-end"},
        /*#__PURE__*/React.createElement("button", {
          onClick: handlePartialDelivery,
          className: "inline-flex items-center gap-1.5 rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700"
        }, "Giao hàng lần " + ((deliveries.length||0)+1))))),
  isEdit && !editOrder?.draft && /*#__PURE__*/React.createElement("table", {className: "w-full text-sm border-collapse [&_td]:border-b [&_td]:border-slate-200 [&_th]:border-b [&_th]:border-slate-200", style:{tableLayout:"fixed"}},
        /*#__PURE__*/React.createElement("colgroup", null,
          /*#__PURE__*/React.createElement("col", {style:{width:350}}),
          /*#__PURE__*/React.createElement("col", {style:{width:64}}),
          /*#__PURE__*/React.createElement("col", {style:{width:70}}),
          /*#__PURE__*/React.createElement("col", {style:{width:120}}),
          /*#__PURE__*/React.createElement("col", {style:{width:150}}),
          /*#__PURE__*/React.createElement("col", {style:{width:130}}),
          /*#__PURE__*/React.createElement("col", {style:{width:120}}),
          /*#__PURE__*/React.createElement("col", {style:{width:80}}),
          /*#__PURE__*/React.createElement("col", {style:{width:44}})),
        /*#__PURE__*/React.createElement("thead", null,
          /*#__PURE__*/React.createElement("tr", {className: "bg-slate-50 text-left text-xs font-medium text-slate-500"},
            /*#__PURE__*/React.createElement("th", {className: "px-3 py-2 border-b border-slate-200", colSpan:9},
              /*#__PURE__*/React.createElement("div", {className: "flex items-center justify-end"},
                /*#__PURE__*/React.createElement("button", {
                  onClick: () => !returns.some(r=>!r.cancelled) && setShowReturnModal(true),
                  disabled: returns.some(r=>!r.cancelled),
                  className: returns.some(r=>!r.cancelled) ? "flex items-center gap-1 rounded-md border border-slate-100 bg-slate-50 text-slate-300 px-2.5 py-1 text-xs font-medium cursor-not-allowed" : "flex items-center gap-1 rounded-md border border-slate-300 bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-200 transition-colors"
                }, /*#__PURE__*/React.createElement(RotateCcw, {className: "h-3 w-3"}), returns.some(r=>!r.cancelled) ? " Đã hoàn" : " Hoàn hàng")))),
          /*#__PURE__*/React.createElement("tr", {className: "bg-white text-left text-xs font-medium text-slate-400"},
            /*#__PURE__*/React.createElement("th", {className: "px-3 py-1.5 border-b border-slate-100"}, "Tên sản phẩm"),
            /*#__PURE__*/React.createElement("th", {className: "px-3 py-1.5 border-b border-slate-100 text-center"}, "ĐVT"),
            /*#__PURE__*/React.createElement("th", {className: "px-3 py-1.5 border-b border-slate-100 text-center"}, "SL"),
            /*#__PURE__*/React.createElement("th", {className: "px-3 py-1.5 border-b border-slate-100 text-right"}, "Số tiền trả"),
            /*#__PURE__*/React.createElement("th", {className: "px-3 py-1.5 border-b border-slate-100 text-right"}, "CP đổi trả"),
            /*#__PURE__*/React.createElement("th", {className: "px-3 py-1.5 border-b border-slate-100"}),
            /*#__PURE__*/React.createElement("th", {className: "px-3 py-1.5 border-b border-slate-100"}, "Lý do hoàn"),
            /*#__PURE__*/React.createElement("th", {className: "px-3 py-1.5 border-b border-slate-100", colSpan:2}))),
        /*#__PURE__*/React.createElement("tbody", null,
          returns.length === 0
            ? /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("td", {colSpan:9, className:"py-5 text-center text-sm text-slate-400"}, "Chưa có hàng trả"))
            : /*#__PURE__*/React.createElement(React.Fragment, null,
                ...returns.map((ret,i) => /*#__PURE__*/React.createElement("tr", {key:i, className:ret.cancelled?"opacity-40 line-through":""},
                  /*#__PURE__*/React.createElement("td", {className:"px-3 py-2"}, ret.prod),
                  /*#__PURE__*/React.createElement("td", {className:"px-3 py-2 text-center text-xs text-slate-500"}, ret.date||""),
                  /*#__PURE__*/React.createElement("td", {className:"px-3 py-2 text-center"}, ret.qty),
                  /*#__PURE__*/React.createElement("td", {className:"px-3 py-2 text-right tabular-nums"}, vnd(ret.amount||0)),
                  /*#__PURE__*/React.createElement("td", {className:"px-3 py-2"},
                    /*#__PURE__*/React.createElement(NumInput, {value:ret.fee||0, onChange:v=>setReturns(xs=>xs.map((r,j)=>j===i?{...r,fee:v}:r)), className:"w-full border-0 bg-transparent px-0 py-0 text-right text-sm tabular-nums focus:outline-none"})),
                  /*#__PURE__*/React.createElement("td", {className:"px-3 py-2"}),
                  /*#__PURE__*/React.createElement("td", {className:"px-3 py-2"},
                    /*#__PURE__*/React.createElement("input", {value:ret.note||"", onChange:e=>setReturns(xs=>xs.map((r,j)=>j===i?{...r,note:e.target.value}:r)), placeholder:"Nhập lý do...", className:"w-full border-0 bg-transparent px-0 py-0 text-xs text-slate-500 focus:outline-none placeholder:text-slate-300"})),
                  /*#__PURE__*/React.createElement("td", {className:"px-3 py-2"}),
                  /*#__PURE__*/React.createElement("td", {className:"px-3 py-2 text-right"},
                    /*#__PURE__*/React.createElement("button", {onClick:()=>setReturns(xs=>xs.map((r,j)=>j===i?{...r,cancelled:!r.cancelled}:r)), className:ret.cancelled?"rounded px-2 py-0.5 text-[10px] font-medium bg-slate-100 text-slate-400 hover:bg-slate-200":"rounded px-2 py-0.5 text-[10px] font-medium bg-rose-50 text-rose-500 hover:bg-rose-100"},
                      ret.cancelled?"Bỏ huỷ":"Huỷ"))))),
                /*#__PURE__*/React.createElement("tr", {className:"bg-slate-50 font-semibold text-sm"},
                  /*#__PURE__*/React.createElement("td", {className:"px-3 py-2 text-slate-600", colSpan:2}, "Tổng cộng"),
                  /*#__PURE__*/React.createElement("td", {className:"px-3 py-2 text-center tabular-nums"}, returns.filter(r=>!r.cancelled).reduce((s,r)=>s+(r.qty||0),0)),
                  /*#__PURE__*/React.createElement("td", {className:"px-3 py-2 text-right tabular-nums"}, vnd(returns.filter(r=>!r.cancelled).reduce((s,r)=>s+(r.amount||0),0))),
                  /*#__PURE__*/React.createElement("td", {className:"px-3 py-2 text-right tabular-nums"}, vnd(returns.filter(r=>!r.cancelled).reduce((s,r)=>s+(r.fee||0),0))),
                  /*#__PURE__*/React.createElement("td", {className:"px-3 py-2", colSpan:4})))),
  /*#__PURE__*/React.createElement("div", {className: "flex gap-4 items-start"},
    /*#__PURE__*/React.createElement("div", {className:"flex-1 rounded-xl bg-white shadow-sm border border-slate-200"},
      /*#__PURE__*/React.createElement("div", {className:"flex items-center justify-between h-14 px-4 border-b border-slate-200"},
        /*#__PURE__*/React.createElement("p", {className:"text-[13px] font-semibold text-[#92400e]"}, "Thông tin đơn hàng")),
      /*#__PURE__*/React.createElement("div", {className:"p-4"},
      /*#__PURE__*/React.createElement("dl", {className:"space-y-2 text-sm"},
        /*#__PURE__*/React.createElement("div", {className:"flex justify-between"},
          /*#__PURE__*/React.createElement("dt", {className:"text-slate-500"}, "Tổng tiền hàng"),
          /*#__PURE__*/React.createElement("dd", {className:"tabular-nums text-slate-800"}, vnd(subtotal))),
        /*#__PURE__*/React.createElement("div", {className:"flex items-center justify-between gap-2"},
          /*#__PURE__*/React.createElement("dt", {className:"shrink-0 text-slate-500"}, "CP giao hàng >15km"),
          /*#__PURE__*/React.createElement("dd", {className:"w-28"},
            /*#__PURE__*/React.createElement(NumInput, {value:shippingFee, onChange:setShippingFee, className:"w-full border-0 bg-transparent px-0 py-0 text-right text-sm tabular-nums focus:outline-none"}))),
        /*#__PURE__*/React.createElement("div", {className:"flex items-center justify-between gap-2"},
          /*#__PURE__*/React.createElement("dt", {className:"shrink-0 text-slate-500"}, "CP lắp đặt"),
          /*#__PURE__*/React.createElement("dd", {className:"w-28"},
            /*#__PURE__*/React.createElement(NumInput, {value:installFee, onChange:setInstallFee, className:"w-full border-0 bg-transparent px-0 py-0 text-right text-sm tabular-nums focus:outline-none"}))),
        /*#__PURE__*/React.createElement("div", {className:"flex items-center justify-between gap-2"},
          /*#__PURE__*/React.createElement("dt", {className:"shrink-0 text-slate-500"}, "CP đổi trả"),
          /*#__PURE__*/React.createElement("dd", {className:"w-28"},
            /*#__PURE__*/React.createElement(NumInput, {value:returnFee, onChange:setReturnFee, className:"w-full border-0 bg-transparent px-0 py-0 text-right text-sm tabular-nums focus:outline-none"}))),
        returnAmt > 0 && /*#__PURE__*/React.createElement("div", {className:"flex justify-between"},
          /*#__PURE__*/React.createElement("dt", {className:"text-rose-500"}, "Hoàn hàng"),
          /*#__PURE__*/React.createElement("dd", {className:"tabular-nums text-rose-500"}, "−" + vnd(returnAmt))),
        /*#__PURE__*/React.createElement("div", {className:"my-2 border-t border-slate-200"}),
        /*#__PURE__*/React.createElement("div", {className:"flex justify-between"},
          /*#__PURE__*/React.createElement("dt", {className:"font-bold text-slate-800"}, "Tổng cộng"),
          /*#__PURE__*/React.createElement("dd", {className:"tabular-nums font-bold text-slate-900"}, vnd(effectiveTotal))),
        /*#__PURE__*/React.createElement("div", {className:"flex justify-between"},
          /*#__PURE__*/React.createElement("dt", {className:"text-slate-500"}, "Đã đặt cọc"),
          /*#__PURE__*/React.createElement("dd", {className:"tabular-nums text-slate-800"}, vnd(deposit))),
        /*#__PURE__*/React.createElement("div", {className:"flex justify-between"},
          /*#__PURE__*/React.createElement("dt", {className:"text-slate-500"}, "Đã thanh toán"),
          /*#__PURE__*/React.createElement("dd", {className:"tabular-nums text-slate-800"}, vnd(paidOnly))),
        discountExtra > 0 && /*#__PURE__*/React.createElement("div", {className:"flex justify-between"},
          /*#__PURE__*/React.createElement("dt", {className:"text-slate-500"}, "Giảm giá thêm"),
          /*#__PURE__*/React.createElement("dd", {className:"tabular-nums text-slate-800"}, vnd(discountExtra))),
        /*#__PURE__*/React.createElement("div", {className:"flex justify-between"},
          /*#__PURE__*/React.createElement("dt", {className:"font-bold text-slate-800"}, "Còn lại"),
          /*#__PURE__*/React.createElement("dd", {className:`tabular-nums font-bold ${remaining>0?"text-[#B91C1C]":"text-[#92400e]"}`}, vnd(remaining) || "0"))),
      /*#__PURE__*/React.createElement("div", {className:"mt-5 flex gap-3"},
        /*#__PURE__*/React.createElement("button", {onClick:()=>setPayModal("Đặt cọc"), className:"flex-1 rounded-xl border border-[#fed7aa] py-2 text-sm font-medium text-[#92400e] hover:bg-orange-50"}, "Đặt cọc"),
        /*#__PURE__*/React.createElement("button", {onClick:()=>setPayModal("Thanh toán"), className:"flex-1 rounded-xl bg-[#92400e] py-2 text-sm font-medium text-white hover:bg-[#78350f]"}, "Thanh toán")))),
    /*#__PURE__*/React.createElement("div", {className:"flex-1 rounded-xl bg-white shadow-sm"},
      /*#__PURE__*/React.createElement("div", {className:"flex items-center justify-between h-14 px-4 border-b border-slate-200"},
        /*#__PURE__*/React.createElement("p", {className:"text-[13px] font-semibold text-[#92400e]"}, "Lịch sử thanh toán")),
      /*#__PURE__*/React.createElement("div", {className:"p-4"},
        payments.length === 0
          ? /*#__PURE__*/React.createElement("p", {className:"text-center text-sm text-slate-400"}, "Chưa có thanh toán")
          : /*#__PURE__*/React.createElement("div", {className:"space-y-2"},
              ...payments.map((p,i) => /*#__PURE__*/React.createElement("div", {key:i, className:"rounded-xl border border-[#fed7aa] bg-[#fef9f0]/60 px-3 py-2 text-xs"},
                /*#__PURE__*/React.createElement("div", {className:"flex items-center justify-between gap-2"},
                  /*#__PURE__*/React.createElement("div", {className:"min-w-0 flex-1 truncate whitespace-nowrap"},
                    /*#__PURE__*/React.createElement("span", {className:"font-semibold text-slate-800"}, (p.kind||"Thanh toán"), " : ", vnd(p.amount), "đ"),
                    /*#__PURE__*/React.createElement("span", {className:"mx-1.5 text-slate-300"}, "·"),
                    /*#__PURE__*/React.createElement("span", {className:"text-slate-500"}, p.datetime||p.date||""),
                    p.account && [/*#__PURE__*/React.createElement("span", {key:"dot", className:"mx-1.5 text-slate-300"}, "·"), /*#__PURE__*/React.createElement("span", {key:"acc", className:"font-medium text-[#92400e]"}, p.account)]),
                  /*#__PURE__*/React.createElement("div", {className:"flex shrink-0 items-center gap-1"},
                    /*#__PURE__*/React.createElement("span", {className:"rounded-full bg-[#92400e] px-2 py-0.5 text-[11px] font-medium text-white"}, p.staff||"quanly01"),
                    /*#__PURE__*/React.createElement("button", {onClick:()=>{setEditPayIdx(i);setEditPayModal(true);}, title:"Sửa", className:"rounded p-1 bg-[#92400e] text-white hover:bg-[#78350f]"}, /*#__PURE__*/React.createElement(Pencil, {className:"h-3 w-3"}))))))))),
    /*#__PURE__*/React.createElement("div", {className:"flex-1 rounded-xl bg-white shadow-sm border border-slate-200"},
      /*#__PURE__*/React.createElement("div", {className:"flex items-center justify-between h-14 px-4 border-b border-slate-200"},
        /*#__PURE__*/React.createElement("p", {className:"text-[13px] font-semibold text-[#92400e]"}, "Chi phí công ty thanh toán"),
        /*#__PURE__*/React.createElement("button", {onClick:()=>{ setCcostType("Hoàn tiền hàng"); const rt=returns.reduce((s,r)=>s+(r.amount||0),0); setCcostAmt(rt||0); setCompCostModal(true); }, className:"flex items-center gap-1.5 rounded-lg border border-[#fed7aa] bg-white px-3 py-1.5 text-sm font-semibold text-[#92400e] hover:bg-[#fef3c7]"},
          /*#__PURE__*/React.createElement(Plus, {className:"h-4 w-4"}), "Thêm")),
      /*#__PURE__*/React.createElement("div", {className:"p-4"},
        compCosts.length === 0
          ? /*#__PURE__*/React.createElement("p", {className:"text-center text-sm text-slate-400"}, "Chưa có chi phí nào")
          : /*#__PURE__*/React.createElement("div", {className:"space-y-1.5"},
              ...compCosts.map((c,i) => /*#__PURE__*/React.createElement("div", {key:"cc"+i, className:"flex items-center justify-between text-xs"},
                /*#__PURE__*/React.createElement("span", {className:"text-slate-600"}, c.type),
                /*#__PURE__*/React.createElement("div", {className:"flex items-center gap-2"},
                  /*#__PURE__*/React.createElement("span", {className:"font-medium text-slate-800"}, vnd(c.amount)),
                  /*#__PURE__*/React.createElement("button", {onClick:()=>{setEditCcostIdx(i);setCcostType(c.type);setCcostAmt(c.amount);setCcostAcc(c.acc||"");setCompCostModal(true);}, className:"rounded p-1 bg-[#92400e] text-white hover:bg-[#78350f]"}, /*#__PURE__*/React.createElement(Pencil, {className:"h-3 w-3"})))))))),
  ),
  /*#__PURE__*/React.createElement("div", {className:"rounded-xl bg-white shadow-sm border border-slate-200"},
    /*#__PURE__*/React.createElement("div", {className:"px-4 py-3 border-b border-slate-200"},
      /*#__PURE__*/React.createElement("p", {className:"text-sm font-semibold text-[#92400e]"}, "Nhật ký đơn hàng")),
    logs.length === 0
      ? /*#__PURE__*/React.createElement("p", {className:"p-4 text-center text-xs text-slate-400"}, "Chưa có nhật ký")
      : /*#__PURE__*/React.createElement("table", {className:"w-full text-xs"},
          /*#__PURE__*/React.createElement("thead", null,
            /*#__PURE__*/React.createElement("tr", {className:"bg-slate-50 text-left text-[11px] font-medium uppercase tracking-wide text-slate-500 border-b border-slate-200"},
              /*#__PURE__*/React.createElement("th", {className:"px-4 py-2", style:{width:130}}, "Thời gian"),
              /*#__PURE__*/React.createElement("th", {className:"px-4 py-2", style:{width:120}}, "Người thực hiện"),
              /*#__PURE__*/React.createElement("th", {className:"px-4 py-2", style:{width:160}}, "Hành động"),
              /*#__PURE__*/React.createElement("th", {className:"px-4 py-2"}, "Chi tiết"))),
          /*#__PURE__*/React.createElement("tbody", {className:"divide-y divide-slate-100"},
            ...logs.map((l,i) => /*#__PURE__*/React.createElement("tr", {key:i, className:"align-top hover:bg-slate-50/60"},
              /*#__PURE__*/React.createElement("td", {className:"px-4 py-1.5 text-[11px] text-slate-500 whitespace-nowrap"}, l.dt),
              /*#__PURE__*/React.createElement("td", {className:"px-4 py-1.5 text-[11px] font-medium text-slate-700"}, l.staff),
              /*#__PURE__*/React.createElement("td", {className:"px-4 py-1.5 text-[11px]"},
                /*#__PURE__*/React.createElement("span", {className: l.action === "Tạo đơn hàng" ? "font-semibold text-[#92400e]" : "text-slate-500"}, l.action)),
              /*#__PURE__*/React.createElement("td", {className:"px-4 py-1.5 text-[11px] text-slate-600"}, l.detail)))))),
  editPayModal && editPayIdx !== null && /*#__PURE__*/React.createElement(PaymentModal, {
    accounts: ACCOUNTS,
    initial: payments[editPayIdx],
    onClose: () => { setEditPayModal(false); setEditPayIdx(null); },
    onConfirm: p => {
      const oldP = payments[editPayIdx];
      const oldDelta = oldP.kind==="Hoàn tiền"?-oldP.amount:oldP.kind==="Giảm giá thêm"?0:oldP.amount;
      const newDelta = p.kind==="Hoàn tiền"?-p.amount:p.kind==="Giảm giá thêm"?0:p.amount;
      autoUpdateTxn(oldP.txnId||null, oldP.amount, p);
      setPayments(xs => xs.map((x,i) => i===editPayIdx ? {...p, date:oldP.date, txnId:oldP.txnId} : x));
      setPaid(v => Math.max(0, v-oldDelta+newDelta));
      setEditPayModal(false); setEditPayIdx(null);
    }
  }),
  payModal && /*#__PURE__*/React.createElement(PaymentModal, {
    accounts: ACCOUNTS,
    remaining: remaining,
    initial: typeof payModal === "string" ? { kind: payModal } : undefined,
    onClose: () => setPayModal(false),
    onConfirm: p => {
      const txnId = autoAddTxn(p);
      setPayments(xs => [...xs, {...p, txnId}]);
      const delta = p.kind==="Tiền hàng trả lại"||p.kind==="Hoàn tiền"?-p.amount:p.kind==="Giảm giá thêm"?0:p.amount;
      setPaid(v => Math.max(0, v+delta));
      addLog("payments_added", `POS - Đã thêm 1 thanh toán, tổng tiền: ${vnd(p.amount)}đ`, p.staff);
      setPayModal(false);
    }
  }),
  custExpModal && /*#__PURE__*/React.createElement(Modal, {
    title: "Chi phí đơn hàng (KH Thanh toán)", maxW: "max-w-sm", onClose: ()=>setCustExpModal(false),
    footer: /*#__PURE__*/React.createElement(React.Fragment, null,
      /*#__PURE__*/React.createElement("button", {onClick:()=>setCustExpModal(false), className:"rounded-lg border border-slate-200 px-3.5 py-2 text-sm text-slate-600 hover:bg-slate-50"}, "Huỷ"),
      /*#__PURE__*/React.createElement("button", {onClick:()=>{if(cexpAmt>0){setCustExpenses(xs=>[...xs,{type:cexpType,amount:cexpAmt}]);}setCustExpModal(false);setCexpAmt(0);}, className:"rounded-lg bg-[#92400e] px-3.5 py-2 text-sm font-medium text-white hover:bg-[#065F46]"}, "Thêm"))
  }, /*#__PURE__*/React.createElement("div", {className:"space-y-3"},
    /*#__PURE__*/React.createElement("div", null,
      /*#__PURE__*/React.createElement("label", {className:"mb-1 block text-[13px] font-medium text-slate-500"}, "Loại chi phí"),
      /*#__PURE__*/React.createElement("select", {value:cexpType, onChange:e=>setCexpType(e.target.value), className:"w-full rounded-md border border-slate-200 px-2.5 py-1.5 text-sm focus:outline-none"},
        /*#__PURE__*/React.createElement("option", null, "Chi phí giao hàng >15km"),
        /*#__PURE__*/React.createElement("option", null, "Chi phí lắp đặt"),
        /*#__PURE__*/React.createElement("option", null, "Hoàn tiền đơn hàng"))),
    /*#__PURE__*/React.createElement("div", null,
      /*#__PURE__*/React.createElement("label", {className:"mb-1 block text-[13px] font-medium text-slate-500"}, "Số tiền"),
      /*#__PURE__*/React.createElement(NumInput, {value:cexpAmt, onChange:setCexpAmt, className:"w-full rounded-md border border-slate-200 px-2.5 py-1.5 text-sm focus:outline-none focus:border-[#fed7aa]"})))),
  compCostModal && /*#__PURE__*/React.createElement(Modal, {
    title: "Chi phí thực tế (Công ty thanh toán)", maxW: "max-w-sm", onClose: ()=>{setCompCostModal(false);setEditCcostIdx(null);setCcostAmt(0);setCcostAcc("");},
    footer: /*#__PURE__*/React.createElement(React.Fragment, null,
      /*#__PURE__*/React.createElement("button", {onClick:()=>setCompCostModal(false), className:"rounded-lg border border-slate-200 px-3.5 py-2 text-sm text-slate-600 hover:bg-slate-50"}, "Huỷ"),
      /*#__PURE__*/React.createElement("button", {onClick:()=>{
        if(ccostAmt>0){
          if(editCcostIdx!==null){
            const old=compCosts[editCcostIdx];
            autoUpdateChi(old.txnId||null,old.amount,ccostType,ccostAmt,ccostAcc);
            setCompCosts(xs=>xs.map((x,j)=>j===editCcostIdx?{...x,type:ccostType,amount:ccostAmt,txnId:old.txnId}:x));
          } else {
            const [cy,cm,cd]=ccostDate.split("-"); const dateViVN=`${cd}/${cm}/${cy}`;
            const txnId=autoAddChi(ccostType,ccostAmt,ccostAcc,dateViVN);
            setCompCosts(xs=>[...xs,{type:ccostType,amount:ccostAmt,txnId}]);
          }
        }
        setCompCostModal(false);setCcostAmt(0);setCcostAcc("");setEditCcostIdx(null);
      }, className:"rounded-lg bg-[#92400e] px-3.5 py-2 text-sm font-medium text-white hover:bg-[#065F46]"}, editCcostIdx!==null?"Lưu":"Thêm"))
  }, /*#__PURE__*/React.createElement("div", {className:"space-y-3"},
    /*#__PURE__*/React.createElement("div", null,
      /*#__PURE__*/React.createElement("label", {className:"mb-1 block text-[13px] font-medium text-slate-500"}, "Loại chi phí"),
      /*#__PURE__*/React.createElement("select", {value:ccostType, onChange:e=>{ const t=e.target.value; setCcostType(t); if(t==="Hoàn tiền hàng"){ const rt=returns.reduce((s,r)=>s+(r.amount||0),0); setCcostAmt(rt||0); } else { setCcostAmt(0); }}, className:"w-full rounded-md border border-slate-200 px-2.5 py-1.5 text-sm focus:outline-none"},
        /*#__PURE__*/React.createElement("option", null, "Hoàn tiền hàng"),
        /*#__PURE__*/React.createElement("option", null, "Chi phí Ship hàng"),
        /*#__PURE__*/React.createElement("option", null, "Chi phí hoa hồng"),
        /*#__PURE__*/React.createElement("option", null, "Chi phí lắp đặt"))),
    /*#__PURE__*/React.createElement("div", null,
      /*#__PURE__*/React.createElement("label", {className:"mb-1 block text-[13px] font-medium text-slate-500"}, "Tài khoản chi"),
      /*#__PURE__*/React.createElement("select", {value:ccostAcc, onChange:e=>setCcostAcc(e.target.value), className:"w-full rounded-md border border-slate-200 px-2.5 py-1.5 text-sm focus:outline-none"},
        /*#__PURE__*/React.createElement("option", {value:""}, "— Chọn tài khoản —"),
        bankAccounts.filter(a=>a.status==="Hoạt động").map(a=>/*#__PURE__*/React.createElement("option", {key:a.key, value:a.bank}, a.bank)))),
    /*#__PURE__*/React.createElement("div", null,
      /*#__PURE__*/React.createElement("label", {className:"mb-1 block text-[13px] font-medium text-slate-500"}, "Ngày"),
      /*#__PURE__*/React.createElement("input", {type:"date", value:ccostDate, max:new Date().toISOString().slice(0,10), onChange:e=>setCcostDate(e.target.value), className:"w-full rounded-md border border-slate-200 px-2.5 py-1.5 text-sm focus:border-[#fed7aa] focus:outline-none"})),
    /*#__PURE__*/React.createElement("div", null,
      /*#__PURE__*/React.createElement("label", {className:"mb-1 block text-[13px] font-medium text-slate-500"}, "Số tiền"),
      /*#__PURE__*/React.createElement(NumInput, {value:ccostAmt, onChange:setCcostAmt, className:"w-full rounded-md border border-slate-200 px-2.5 py-1.5 text-sm focus:outline-none focus:border-[#fed7aa]"}))))
  ,
  isEdit && !editOrder?.draft && showKhoModal && /*#__PURE__*/React.createElement(KhoModal, {
    order: {...editOrder, imported, exported, deliveryConfirmed, items: lines.filter(l => l.name).map(l => ({name: l.name, qty: l.qty, price: l.price, cost: l.cost || 0, kho: l.kho || "HH", supplier: l.supplier || ""}))},
    initTab: khoModalTab,
    onClose: () => setShowKhoModal(false),
    onGoToWhIn: (pn) => { setShowKhoModal(false); if (setWhInSearch) setWhInSearch(pn || ""); setActive && setActive("wh_in"); },
    onConfirm: p => {
      setImported(true);
      if (p.allExported) setExported(true);
      // Lưu wh_lots vào order ngay khi nhập kho (không chờ user bấm Lưu)
      if (!p.allExported && !p.isEditImport && p.wh_lots?.length && onQuickSave) {
        onQuickSave({ imported: true, wh_lots: p.wh_lots });
      }
      const now = new Date();
      const timeStr = now.toLocaleTimeString("vi-VN", {hour:"2-digit", minute:"2-digit"});
      const fmtDate = (iso) => iso ? new Date(iso).toLocaleDateString("vi-VN") + " " + timeStr : now.toLocaleDateString("vi-VN") + " " + timeStr;
      const importDate = fmtDate(p.dateIn);
      const exportDate = fmtDate(p.dateOut);
      const base = now.toISOString().slice(0,10).replace(/-/g,"");
      const ordItems = lines.filter(l => l.name);
      if (!p.allExported && !p.isEditImport && onImportKho) {
        onImportKho(ordItems.map((it, i) => {
          const costNcc = p.items[i]?.cost || it.cost || 0;
          return {
            lot: p.pn || ("PN" + base + "_" + String(Date.now()).slice(-4)),
            date: importDate,
            prod: it.name,
            store: p.kho || it.kho || "Kho HH",
            qtyIn: p.items[i]?.slNhap ?? it.qty,
            qtyNow: p.items[i]?.slNhap ?? it.qty,
            qtyRemaining: p.items[i]?.slNhap ?? it.qty,
            costNcc,
            unitCost: costNcc,
            fee: p.items[i]?.cpmh || 0,
            supplier: p.items[i]?.supplier || it.supplier || "",
            order: effectiveOrderId,
            staff: _staffName,
            pay: "Chưa thanh toán"
          };
        }));
      }
      if (p.allExported && onExportKho) {
        const dt = exportDate;
        const expRows = p.exportRows || ordItems.map((it, i) => ({name: it.name, lotRef: "", slXuat: it.qty, giaBan: it.price || 0}));
        const totalExpRows = expRows.length;
        onExportKho(expRows.map((row, i) => ({
          slip: (() => { const r = _dn && _dn.find(r => r.prefix === "PX"); const n = (r ? r.num : 1) + i; if (_sdn && i === 0) _sdn(ds => ds.map(r => r.prefix === "PX" ? {...r, num: r.num + totalExpRows} : r)); return fmtDocId("PX", n); })(),
          dt,
          order: effectiveOrderId,
          prod: row.name,
          lot: row.lotRef || "",
          qty: row.slXuat,
          sale: row.giaBan,
          unitCost: (() => { const it = ordItems.find(x => x.name === row.name); return it?.cost || 0; })(),
          cust: cust.name,
          phone: cust.phone || "",
          addr: cust.addr || "",
          store: p.kho || "Kho HH",
          orderStatus: "Chờ xử lý",
          delivery: delivery || "Chưa giao hàng",
          staff: _staffName
        })));
      }
    }
  })
  ),
  dlvSlipModal && /*#__PURE__*/React.createElement(DeliverySlipModal, {data: dlvSlipModal, onClose: () => setDlvSlipModal(null)}),
  showReturnModal && /*#__PURE__*/React.createElement(ReturnModal, {
    order: {id: effectiveOrderId, items: lines.filter(l=>l.name).map(l=>({name:l.name, price:l.price, qty:l.qty, cost:l.cost||0}))},
    onClose: () => setShowReturnModal(false),
    onConfirm: ({rows, reason, store}) => {
      const activeRows = rows.filter(r=>r.qty>0);
      if (!activeRows.length) { setShowReturnModal(false); return; }
      const now = new Date(), pad = n=>String(n).padStart(2,"0");
      const dateStr = `${pad(now.getDate())}/${pad(now.getMonth()+1)}/${now.getFullYear()}`;
      const dt = dateStr + " " + `${pad(now.getHours())}:${pad(now.getMinutes())}`;
      const returnTotal = activeRows.reduce((s,r)=>s+r.price*r.qty,0);
      const base = now.toISOString().slice(0,10).replace(/-/g,"");
      setReturns(activeRows.map(r=>({prod:r.name, date:dateStr, qty:r.qty, amount:r.price*r.qty, fee:0, note:reason||"", store:store||"Kho HH"})));
      if (onImportKho) onImportKho(activeRows.map((r,i)=>({
        lot:"HOANKH_"+(effectiveOrderId||base)+"_"+i,
        date:dateStr, prod:r.name, store:store||"Kho HH",
        qtyIn:r.qty, qtyNow:r.qty, qtyRemaining:r.qty,
        costNcc:r.cost||0, unitCost:r.cost||0,
        fee:0, supplier:"", order:effectiveOrderId||"",
        staff:_staffName, source:"hoankh", pay:"Không cần TT"
      })));
      addLog("return_confirmed", `Hoàn hàng ${activeRows.length} SP → ${store||"Kho HH"}, tổng: ${vnd(returnTotal)}đ`, _staffName);
      setShowReturnModal(false);
    }
  })
  ));
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
    className: "px-4 py-3"
  }, /*#__PURE__*/React.createElement("span", {className: "inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset bg-[#fef9f0] text-[#92400e] ring-[#b45309]"}, r.order)), /*#__PURE__*/React.createElement("td", {
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

/* ───────── Purchase Module (list + create) ───────── */
function PurchaseModule({onImportToWh, purchaseList: list, setPurchaseList: setList, setActive}) {
  const [view, setView] = React.useState("list"); // "list" | "create" | {edit: record}
  const onSave = recs => setList(xs => [...recs, ...xs]);
  if (view === "create") return /*#__PURE__*/React.createElement(PurchaseCreate, {onBack: () => setView("list"), onSave, onImportToWh});
  if (view && view.edit) return /*#__PURE__*/React.createElement(PurchaseCreate, {editRecord: view.edit, onBack: () => setView("list"), onSave, onImportToWh});
  return /*#__PURE__*/React.createElement(PurchaseList, {
    onNew: () => setView("create"),
    onEdit: r => setView({edit: r}),
    onImportToWh,
    onGoToWhIn: () => setActive && setActive("wh_in"),
    list,
    setList
  });
}

/* ───────── Purchase create — bố cục theo Ảnh 1 (B1) ───────── */
function PurchaseCreate({
  onBack,
  onSave,
  onImportToWh,
  editRecord
}) {
  const notify = useToast();
  const {docNums, setDocNums} = useDocNum();
  const [supText, setSupText] = useState("");
  const [supId, setSupId] = useState("");
  const [note, setNote] = useState("");
  const [rows, setRows] = useState([{name: "", qty: 1, price: 0, disc: 0, discType: "%", cpmh: 0}]);
  const [payStatus, setPayStatus] = useState("Chờ thanh toán");
  const [orderStatus, setOrderStatus] = useState("Chờ giao hàng");
  const [newProdReq, setNewProdReq] = useState(null);
  const set = (i, p) => setRows(xs => xs.map((x, k) => k === i ? {...x, ...p} : x));
  const sm = "w-full rounded-md border border-slate-200 px-2 py-1.5 text-sm focus:border-[#fed7aa] focus:outline-none";
  const lineDisc = l => l.discType === "%" ? l.price * l.qty * (l.disc || 0) / 100 : l.disc || 0;
  const lineTotal = l => Math.max(0, l.price * l.qty - lineDisc(l) + (l.cpmh || 0));
  const subtotal = rows.reduce((s, l) => s + lineTotal(l), 0);
  const filteredSup = SUPPLIERS.filter(s => s.code && (!supText || s.name.toLowerCase().includes(supText.toLowerCase())));
  const nowStr = () => {
    const d = new Date(), pad = n => String(n).padStart(2,"0");
    return `${pad(d.getDate())}/${pad(d.getMonth()+1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  };
  const [logs, setLogs] = useState(() => {
    if (!editRecord) return [];
    return [{
      dt: (editRecord.date||"") + " 00:00:00",
      staff: editRecord.staff || _staffName,
      action: "Tạo phiếu mua hàng",
      detail: `${editRecord.supplier} — ${editRecord.prod} (SL: ${editRecord.qtyIn}, Đơn giá: ${vnd(editRecord.costNcc)}đ) — Tổng tiền: ${vnd(editRecord.costNcc * editRecord.qtyIn)}đ`
    }];
  });
  const addLog = (action, detail) => setLogs(xs => [...xs, { dt: nowStr(), staff: "QUẢN LÝ", action, detail }]);
  const pad2 = n => String(n).padStart(2, "0");
  const buildRecords = () => {
    const d = new Date();
    const dateStr = `${pad2(d.getDate())}/${pad2(d.getMonth()+1)}/${d.getFullYear()} ${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
    const pmRow = docNums.find(r => r.prefix === "PM");
    const pmStart = pmRow ? pmRow.num : 1;
    const pmSlip = fmtDocId("PM", pmStart);
    const filtered = rows.filter(l => l.name);
    return filtered.map((l, i) => ({
      slip: pmSlip,
      lot: filtered.length > 1 ? pmSlip + "_" + i : pmSlip,
      date: dateStr,
      prod: l.name,
      store: "Kho HH",
      qtyIn: l.qty,
      qtyNow: 0,
      costNcc: l.price,
      fee: l.cpmh || 0,
      supplier: supText || "",
      order: "",
      staff: "QUẢN LÝ",
      pay: "Chờ thanh toán",
      kho: "HH"
    }));
  };
  return /*#__PURE__*/React.createElement("div", {className: "space-y-5"},
    /*#__PURE__*/React.createElement("div", {className: "flex items-center justify-between"},
      /*#__PURE__*/React.createElement("h2", {className: "flex items-center gap-2 text-[22px] font-bold text-slate-800"},
        /*#__PURE__*/React.createElement(FileText, {className: "h-6 w-6 text-slate-400"}), " Tạo phiếu mua hàng"),
      /*#__PURE__*/React.createElement("div", {className: "flex items-center gap-2"},
        /*#__PURE__*/React.createElement("button", {
          onClick: () => { const recs = buildRecords(); if (onSave) onSave(recs); setDocNums(ds => ds.map(r => r.prefix === "PM" ? {...r, num: r.num + 1} : r)); notify("Đã lưu phiếu mua hàng"); onBack(); },
          disabled: subtotal === 0,
          className: outlineTealBtn + " disabled:cursor-not-allowed disabled:opacity-50"
        }, /*#__PURE__*/React.createElement(Save, {className: "h-4 w-4"}), " Lưu"),
        /*#__PURE__*/React.createElement("button", {
          onClick: () => { addLog("Tạo phiếu nhập", `${supText||""} — ${rows.filter(l=>l.name).length} sản phẩm — Tổng tiền: ${vnd(subtotal)}đ`); const recs = buildRecords(); if (onSave) onSave(recs); setDocNums(ds => ds.map(r => r.prefix === "PM" ? {...r, num: r.num + 1} : r)); const slips = recs.map((r, i) => ({...r, lot: r.lot.replace("PM","PN") + (recs.length > 1 ? String(i) : ""), qtyNow: r.qtyIn, order: r.lot})); notify("Đã tạo phiếu nhập"); if (onImportToWh) onImportToWh(slips.length === 1 ? slips[0] : slips); else onBack(); },
          disabled: subtotal === 0,
          className: blueBtn + " disabled:cursor-not-allowed disabled:opacity-50"
        }, /*#__PURE__*/React.createElement(ShoppingCart, {className: "h-4 w-4"}), " Tạo phiếu nhập"),
        /*#__PURE__*/React.createElement("button", {onClick: onBack, className: backBtn},
          /*#__PURE__*/React.createElement(ArrowLeft, {className: "h-4 w-4"}), " Quay lại"))),
    /*#__PURE__*/React.createElement("div", null,
      /*#__PURE__*/React.createElement("p", {className: "mb-2 text-sm font-semibold text-slate-700"}, "Thông tin phiếu mua hàng"),
      /*#__PURE__*/React.createElement("div", {className: "grid grid-cols-3 gap-3"},
        /*#__PURE__*/React.createElement("div", null,
          /*#__PURE__*/React.createElement("label", {className: "mb-1 block text-[13px] font-medium text-slate-500"},
            "Nhà cung cấp ", /*#__PURE__*/React.createElement("span", {className: "text-[#B91C1C]"}, "(*)")),
          /*#__PURE__*/React.createElement("input", {
            className: inputF,
            placeholder: "Tìm kiếm hoặc nhập tên nhà cung cấp...",
            value: supText,
            onChange: e => { setSupText(e.target.value); setSupId(""); },
            list: "sup-list"
          }),
          /*#__PURE__*/React.createElement("datalist", {id: "sup-list"},
            SUPPLIERS.filter(s => s.code).map(s => /*#__PURE__*/React.createElement("option", {key: s.code, value: s.name}))),
          supText && filteredSup.length > 0 && !filteredSup.some(s => s.name === supText) &&
            /*#__PURE__*/React.createElement("div", {className: "mt-1 max-h-32 overflow-auto rounded-md border border-slate-200 text-sm"},
              filteredSup.map(s => /*#__PURE__*/React.createElement("button", {
                key: s.code,
                onClick: () => { setSupText(s.name); setSupId(s.code); },
                className: "block w-full px-3 py-1.5 text-left hover:bg-slate-50"
              }, s.name)))),
        /*#__PURE__*/React.createElement("div", null,
          /*#__PURE__*/React.createElement("label", {className: "mb-1 block text-[13px] font-medium text-slate-500"},
            "Ngày đặt hàng ", /*#__PURE__*/React.createElement("span", {className: "text-[#B91C1C]"}, "(*)")),
          /*#__PURE__*/React.createElement("input", {type: "date", className: inputF, defaultValue: localToday()})),
        /*#__PURE__*/React.createElement("div", null,
          /*#__PURE__*/React.createElement("label", {className: "mb-1 block text-[13px] font-medium text-slate-500"}, "Ghi chú"),
          /*#__PURE__*/React.createElement("input", {
            className: inputF,
            placeholder: "Ghi chú thêm về đơn hàng...",
            value: note,
            onChange: e => setNote(e.target.value)
          })))),
    /*#__PURE__*/React.createElement("div", null,
      /*#__PURE__*/React.createElement("p", {className: "mb-2 text-sm font-semibold text-slate-700"}, "Danh sách sản phẩm"),
      /*#__PURE__*/React.createElement("div", {className: "rounded-lg border border-slate-200"},
        /*#__PURE__*/React.createElement("table", {className: "w-full text-sm border-collapse", style: {minWidth: 820}},
          /*#__PURE__*/React.createElement("thead", null,
            /*#__PURE__*/React.createElement("tr", {className: "bg-slate-50 text-left text-xs font-medium uppercase tracking-wide text-slate-500"},
              /*#__PURE__*/React.createElement("th", {className: "px-3 py-2.5 border-b border-slate-200", style: {minWidth: 240}}, "Tên sản phẩm"),
              /*#__PURE__*/React.createElement("th", {className: "px-3 py-2.5 border-b border-slate-200 text-center", style: {width: 64}}, "SL"),
              /*#__PURE__*/React.createElement("th", {className: "px-3 py-2.5 border-b border-slate-200 text-right", style: {width: 130}}, "Giá nhập"),
              /*#__PURE__*/React.createElement("th", {className: "px-3 py-2.5 border-b border-slate-200 text-right", style: {width: 140}}, "Giảm giá"),
              /*#__PURE__*/React.createElement("th", {className: "px-3 py-2.5 border-b border-slate-200 text-right", style: {width: 110}}, "CPMH"),
              /*#__PURE__*/React.createElement("th", {className: "px-3 py-2.5 border-b border-slate-200 text-right", style: {width: 120}}, "Thành tiền"),
              /*#__PURE__*/React.createElement("th", {className: "px-3 py-2.5 border-b border-slate-200", style: {width: 44}}))),
          /*#__PURE__*/React.createElement("tbody", {className: "divide-y divide-slate-100"},
            rows.map((l, i) => /*#__PURE__*/React.createElement("tr", {key: i, className: "align-middle"},
              /*#__PURE__*/React.createElement("td", {className: "px-3 py-2.5"},
                /*#__PURE__*/React.createElement("input", {
                  list: "pl-pur",
                  className: sm,
                  placeholder: "Lọc / chọn sản phẩm...",
                  value: l.name,
                  onChange: e => {
                    const p = PRODUCTS.find(x => x.name === e.target.value);
                    set(i, p ? {name: p.name, price: p.cost} : {name: e.target.value});
                  }
                })),
              /*#__PURE__*/React.createElement("td", {className: "px-3 py-2.5"},
                /*#__PURE__*/React.createElement("input", {
                  type: "number", className: `${sm} text-center`, value: l.qty,
                  onChange: e => set(i, {qty: +e.target.value})
                })),
              /*#__PURE__*/React.createElement("td", {className: "px-3 py-2.5"},
                /*#__PURE__*/React.createElement(NumInput, {className: sm, value: l.price, onChange: v => set(i, {price: v})})),
              /*#__PURE__*/React.createElement("td", {className: "px-3 py-2.5"},
                /*#__PURE__*/React.createElement("div", {className: "flex items-stretch overflow-hidden rounded-md border border-slate-200 focus-within:border-blue-400"},
                  /*#__PURE__*/React.createElement(NumInput, {
                    className: "w-full border-0 px-2 py-1.5 focus:outline-none",
                    value: l.disc, onChange: v => set(i, {disc: v})
                  }),
                  /*#__PURE__*/React.createElement("select", {
                    className: "border-l border-slate-200 bg-slate-50 px-1.5 text-xs text-slate-600 focus:outline-none",
                    value: l.discType, onChange: e => set(i, {discType: e.target.value})
                  }, /*#__PURE__*/React.createElement("option", {value: "%"}, "%"), /*#__PURE__*/React.createElement("option", {value: "đ"}, "đ")))),
              /*#__PURE__*/React.createElement("td", {className: "px-3 py-2.5"},
                /*#__PURE__*/React.createElement(NumInput, {className: sm, value: l.cpmh||0, onChange: v => set(i, {cpmh: v})})),
              /*#__PURE__*/React.createElement("td", {className: "px-3 py-2.5 text-right tabular-nums text-slate-800"},
                num(lineTotal(l))),
              /*#__PURE__*/React.createElement("td", {className: "px-3 py-2.5 text-center"},
                /*#__PURE__*/React.createElement("button", {
                  onClick: () => setRows(xs => xs.filter((_, k) => k !== i)),
                  className: "rounded-md bg-amber-100 p-1.5 text-[#92400e] hover:bg-amber-200"
                }, /*#__PURE__*/React.createElement(Trash2, {className: "h-3.5 w-3.5"}))))),
            /*#__PURE__*/React.createElement("tr", {className: "border-t-2 border-slate-200"},
              /*#__PURE__*/React.createElement("td", {colSpan: 4, className: "px-3 py-2.5 text-right text-sm uppercase text-slate-800", style: {fontWeight:700}}, "TỔNG CỘNG"),
              /*#__PURE__*/React.createElement("td", {className: "px-3 py-2.5 text-right tabular-nums text-slate-800", style: {fontWeight:700}}, num(rows.reduce((s,l)=>s+(l.cpmh||0),0))),
              /*#__PURE__*/React.createElement("td", {className: "px-3 py-2.5 text-right tabular-nums text-slate-800", style: {fontWeight:700}}, num(subtotal)),
              /*#__PURE__*/React.createElement("td", null))),
          /*#__PURE__*/React.createElement("datalist", {id: "pl-pur"},
            PRODUCTS.map(p => /*#__PURE__*/React.createElement("option", {key: p.sku, value: p.name}))))),
      /*#__PURE__*/React.createElement("div", {className: "mt-2 flex items-center gap-2"},
        /*#__PURE__*/React.createElement("button", {
          onClick: () => setRows(xs => [...xs, {name: "", qty: 1, price: 0, disc: 0, discType: "%", cpmh: 0}]),
          className: addBtn
        }, /*#__PURE__*/React.createElement(Plus, {className: "h-4 w-4"}), " Thêm dòng"),
        /*#__PURE__*/React.createElement("button", {
          onClick: () => setNewProdReq({name: "", lineIdx: rows.length}),
          className: addBtn
        }, /*#__PURE__*/React.createElement(Plus, {className: "h-4 w-4"}), " Thêm sản phẩm mới"),
        newProdReq !== null && /*#__PURE__*/React.createElement(ProductForm, {
          presetName: newProdReq.name,
          onClose: () => setNewProdReq(null),
          onSave: f => {
            const idx = newProdReq.lineIdx;
            if (idx < rows.length) { set(idx, {name: f.name, price: f.cost || 0}); }
            else { setRows(xs => [...xs, {name: f.name, qty: 1, price: f.cost || 0, disc: 0, discType: "%", cpmh: 0}]); }
            setNewProdReq(null);
          }
        })))
    , /*#__PURE__*/React.createElement("div", {className: "rounded-xl bg-white shadow-sm border border-slate-200"},
      /*#__PURE__*/React.createElement("div", {className: "px-4 py-3 border-b border-slate-200"},
        /*#__PURE__*/React.createElement("p", {className: "text-[16px] font-semibold text-[#92400e]"}, "Nhật ký đơn đặt hàng")),
      logs.length === 0
        ? /*#__PURE__*/React.createElement("p", {className: "p-4 text-center text-sm text-slate-400"}, "Chưa có nhật ký")
        : /*#__PURE__*/React.createElement("table", {className: "w-full text-sm"},
            /*#__PURE__*/React.createElement("thead", null,
              /*#__PURE__*/React.createElement("tr", {className: "bg-slate-50 text-left text-xs font-medium uppercase tracking-wide text-slate-500 border-b border-slate-200"},
                /*#__PURE__*/React.createElement("th", {className: "px-4 py-2.5", style: {width: 150}}, "Thời gian"),
                /*#__PURE__*/React.createElement("th", {className: "px-4 py-2.5", style: {width: 130}}, "Người thực hiện"),
                /*#__PURE__*/React.createElement("th", {className: "px-4 py-2.5", style: {width: 180}}, "Hành động"),
                /*#__PURE__*/React.createElement("th", {className: "px-4 py-2.5"}, "Chi tiết"))),
            /*#__PURE__*/React.createElement("tbody", {className: "divide-y divide-slate-100"},
              ...logs.map((l, i) => /*#__PURE__*/React.createElement("tr", {key: i, className: "align-top hover:bg-slate-50/60"},
                /*#__PURE__*/React.createElement("td", {className: "px-4 py-2.5 text-xs text-slate-500 whitespace-nowrap"}, l.dt),
                /*#__PURE__*/React.createElement("td", {className: "px-4 py-2.5 text-xs font-medium text-slate-700"}, l.staff),
                /*#__PURE__*/React.createElement("td", {className: "px-4 py-2.5 text-xs"},
                  /*#__PURE__*/React.createElement("span", {className: l.action === "Tạo phiếu mua hàng" || l.action === "Tạo phiếu nhập" ? "font-semibold text-[#92400e]" : "text-slate-500"}, l.action)),
                /*#__PURE__*/React.createElement("td", {className: "px-4 py-2.5 text-xs text-slate-600"}, l.detail)))))));
}

/* ───────── Purchase list ───────── */
function PurchaseList({
  onNew,
  onEdit,
  onImportToWh,
  onGoToWhIn,
  list,
  setList
}) {
  const notify = useToast();
  const [q, setQ] = useState("");
  const [doc, setDoc] = useState(null);
  const [fSup, setFSup] = useState("Tất cả");
  const supNames = ["Tất cả", ...new Set(list.map(r => r.supplier))];
  const [fromDate, setFromDate] = useState(localMonthStart());
  const [toDate, setToDate] = useState(localToday());
  const _pISO = s => { const [y,m,d] = s.split("-"); return new Date(+y,+m-1,+d); };
  const _inR = (dt, f, t) => { const d = parseViDate(dt); return (!f || d >= _pISO(f)) && (!t || d <= new Date(_pISO(t).setHours(23,59,59))); };
  const rows = list.filter(r => _inR(r.date, fromDate, toDate) && (fSup === "Tất cả" || r.supplier === fSup) && (!q || `${purCode(r.lot)} ${r.supplier} ${r.prod}`.toLowerCase().includes(q.toLowerCase()))).sort((a,b) => parseViDate(b.date) - parseViDate(a.date));
  const setKho = (lot, kho) => setList(xs => xs.map(r => r.lot === lot ? {...r, kho} : r));
  const del = lot => {
    if (window.confirm("Xoá phiếu mua hàng này?")) {
      setList(xs => xs.filter(r => r.lot !== lot));
      notify("Đã xoá phiếu mua hàng");
    }
  };
  const onExport = () => exportCSV("danh-sach-phieu-mua-hang", ["Ngày đặt", "Số phiếu", "Trạng thái", "Nhà cung cấp", "Sản phẩm", "Số lượng", "Đơn giá", "Chi phí", "Thành tiền", "Người tạo", "Kho"], rows.map(r => [r.date, purCode(r.lot), r.qtyNow >= r.qtyIn ? "Đã nhập đủ" : r.qtyNow > 0 ? "Nhập một phần" : "Chờ nhập", r.supplier, r.prod, r.qtyIn, r.costNcc, r.fee || 0, r.costNcc * r.qtyIn, r.staff, r.kho]));
  return /*#__PURE__*/React.createElement("div", {className: "space-y-4"},
    /*#__PURE__*/React.createElement("div", {className: "flex flex-wrap items-center justify-end gap-2"},
      /*#__PURE__*/React.createElement("button", {onClick: onNew, className: blueBtn},
        /*#__PURE__*/React.createElement(Plus, {className: "h-4 w-4"}), " Tạo phiếu mua hàng"),
      /*#__PURE__*/React.createElement(ExportBtn, {onClick: onExport})),
    /*#__PURE__*/React.createElement("div", {className: "flex flex-wrap items-end gap-3 rounded-xl border border-slate-200 bg-white p-3"},
      /*#__PURE__*/React.createElement(DateRangeFilter, {initFrom:fromDate, initTo:toDate, onApply:(f,t)=>{setFromDate(f);setToDate(t);}}),
      /*#__PURE__*/React.createElement("div", null,
        /*#__PURE__*/React.createElement("label", {className: "mb-1 block text-[13px] font-medium text-slate-500"}, "NCC"),
        /*#__PURE__*/React.createElement("select", {value: fSup, onChange: e => setFSup(e.target.value), className: field},
          supNames.map(s => /*#__PURE__*/React.createElement("option", {key: s}, s)))),
      /*#__PURE__*/React.createElement("div", {className: "relative min-w-[220px] flex-1"},
        /*#__PURE__*/React.createElement("label", {className: "mb-1 block text-[13px] font-medium text-slate-500"}, "Tìm kiếm"),
        /*#__PURE__*/React.createElement(Search, {className: "absolute left-2.5 top-[2.05rem] h-4 w-4 text-slate-400"}),
        /*#__PURE__*/React.createElement("input", {value: q, onChange: e => setQ(e.target.value), placeholder: "Số phiếu, NCC, sản phẩm…", className: `${field} w-full pl-8`}))),
    /*#__PURE__*/React.createElement(TableShell, {
      minW: "1200px",
      head: /*#__PURE__*/React.createElement(React.Fragment, null,
        /*#__PURE__*/React.createElement(Th, {center: true}, "Ngày"),
        /*#__PURE__*/React.createElement(Th, {center: true}, "Số phiếu"),
        /*#__PURE__*/React.createElement(Th, {center: true}, "Trạng thái"),
        /*#__PURE__*/React.createElement(Th, {center: true, style: {minWidth: 150}}, "Nhà cung cấp"),
        /*#__PURE__*/React.createElement(Th, {center: true, style: {minWidth: 220}}, "Sản phẩm"),
        /*#__PURE__*/React.createElement(Th, {right: true}, "Số lượng"),
        /*#__PURE__*/React.createElement(Th, {right: true}, "Đơn giá"),
        /*#__PURE__*/React.createElement(Th, {right: true}, "Chi phí"),
        /*#__PURE__*/React.createElement(Th, {right: true}, "Thành tiền"),
        /*#__PURE__*/React.createElement(Th, {center: true}, "Người tạo"),
        /*#__PURE__*/React.createElement(Th, {center: true}, "Kho"),
        /*#__PURE__*/React.createElement(Th, {center: true}, "Thao tác"))
    }, rows.map(r => /*#__PURE__*/React.createElement("tr", {key: r.lot},
      /*#__PURE__*/React.createElement("td", {className: "px-3 py-2.5", style:{fontSize:"11px"}}, (() => {
        const p = String(r.date||"").split(" ");
        return /*#__PURE__*/React.createElement("span", {className:"text-slate-500"},
          /*#__PURE__*/React.createElement("span", {className:"block"}, p[0]||""),
          p[1] ? /*#__PURE__*/React.createElement("span", {className:"block text-slate-400"}, p[1]) : null);
      })()),
      /*#__PURE__*/React.createElement("td", {className: "whitespace-nowrap px-3 py-2.5"},
        /*#__PURE__*/React.createElement("button", {onClick: () => onEdit(r), className: "inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset bg-[#fef9f0] text-[#92400e] ring-[#b45309]"}, purCode(r.lot))),
      /*#__PURE__*/React.createElement("td", {className: "px-3 py-2.5"}, (() => {
        const status = r.qtyNow >= r.qtyIn ? "Đã nhập đủ" : r.qtyNow > 0 ? "Nhập một phần" : "Chờ nhập";
        if (status === "Chờ nhập") {
          return /*#__PURE__*/React.createElement("button", {
            title: "Click để nhập kho và chuyển sang danh sách nhập hàng",
            onClick: () => {
              const khoMap = {HH:"Kho HH", HG:"Kho HG", SR:"Kho SR"};
              const slip = {
                lot: "PN" + new Date().toISOString().slice(0,10).replace(/-/g,"") + "_" + String(Date.now()).slice(-4),
                date: (() => { const _d = new Date(); return _d.toLocaleDateString("vi-VN") + " " + _d.toLocaleTimeString("vi-VN", {hour:"2-digit", minute:"2-digit"}); })(),
                prod: r.prod, store: khoMap[r.kho] || r.store,
                qtyIn: r.qtyIn, qtyNow: r.qtyIn,
                costNcc: r.costNcc, fee: r.fee || 0,
                supplier: r.supplier, order: r.lot,
                staff: r.staff || _staffName, pay: "Chưa thanh toán"
              };
              if (onImportToWh) onImportToWh(slip);
              setList(xs => xs.map(x => x.lot === r.lot ? {...x, qtyNow: x.qtyIn} : x));
              if (onGoToWhIn) onGoToWhIn();
            },
            className: "inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset bg-amber-50 text-[#92400e] ring-amber-300 hover:bg-amber-100 cursor-pointer"
          }, "Chờ nhập →");
        }
        return /*#__PURE__*/React.createElement(Pill, {
          map: {"Đã nhập đủ": "bg-amber-50 text-[#92400e] ring-1 ring-amber-200", "Nhập một phần": "bg-amber-50 text-amber-700 ring-1 ring-amber-200"},
          value: status
        });
      })()),
      /*#__PURE__*/React.createElement("td", {className: "px-3 py-2.5 text-slate-700"}, r.supplier),
      /*#__PURE__*/React.createElement("td", {className: "px-3 py-2.5 text-slate-800"}, r.prod),
      /*#__PURE__*/React.createElement("td", {className: "px-3 py-2.5 text-right tabular-nums text-slate-600"}, r.qtyIn),
      /*#__PURE__*/React.createElement("td", {className: "px-3 py-2.5 text-right tabular-nums text-[#92400e]"}, vnd(r.costNcc)),
      /*#__PURE__*/React.createElement("td", {className: "px-3 py-2.5 text-right tabular-nums text-slate-500"}, r.fee ? vnd(r.fee) : ""),
      /*#__PURE__*/React.createElement("td", {className: "px-3 py-2.5 text-right font-medium tabular-nums text-[#B91C1C]"}, vnd(r.costNcc * r.qtyIn)),
      /*#__PURE__*/React.createElement("td", {className: "whitespace-nowrap px-3 py-2.5 text-xs text-slate-500"}, r.staff),
      /*#__PURE__*/React.createElement("td", {className: "px-2 py-1.5 text-center text-sm font-medium text-slate-700"}, r.kho),
      /*#__PURE__*/React.createElement("td", {className: "px-3 py-2.5"},
        /*#__PURE__*/React.createElement("div", {className: "flex items-center justify-center gap-0.5"},
          /*#__PURE__*/React.createElement(IconBtn, {icon: Pencil, title: "Sửa", onClick: () => onEdit(r)}),
          /*#__PURE__*/React.createElement(IconBtn, {icon: Printer, title: "In", onClick: () => window.print()}),
          /*#__PURE__*/React.createElement(IconBtn, {icon: Trash2, tone: "danger", title: "Xoá", onClick: () => del(r.lot)})))))),
    doc && /*#__PURE__*/React.createElement(DocModal, {doc: doc, onClose: () => setDoc(null)}));
}

/* ───────── Warehouse import (bỏ cột thanh toán) ───────── */
function WhIn({whInItems: items, setWhInItems: setItems, setWhOutItems, orders = [], setOrders, purchaseList = [], setPurchaseList, initSearch = "", onMounted, onOpenOrder}) {
  const notify = useToast();
  const { profile: _whProfile } = useAuth();
  const _staffName = _whProfile?.name || "Quản lý";
  const _pISO = s => { const [y,m,d] = s.split("-"); return new Date(+y,+m-1,+d); };
  const _inR = (dt, f, t) => { const d = parseViDate(dt); return (!f || d >= _pISO(f)) && (!t || d <= new Date(_pISO(t).setHours(23,59,59))); };
  const [q, setQ] = useState(initSearch);
  React.useEffect(() => { if (initSearch) setQ(initSearch); if (onMounted) onMounted(); }, []);
  const [doc, setDoc] = useState(null);
  const [orderModal, setOrderModal] = useState(null);
  const [slipModal, setSlipModal] = useState(null);
  const [editSlip, setEditSlip] = useState(null);
  const [nccReturnModal, setNccReturnModal] = useState(null);
  const [payModal, setPayModal] = useState(null);
  const [fSup, setFSup] = useState("");
  const [fProd, setFProd] = useState("Tất cả");
  const nccNames = [...new Set([...SUPPLIERS.map(s => s.name), ...items.map(r => r.supplier).filter(Boolean)])].sort();
  const setNcc = (r, val) => setItems(xs => xs.map(x => x.lot === r.lot && x.prod === r.prod ? {...x, supplier: val} : x));
  const [editCost, setEditCost] = useState(null); // { lot, prod, costNcc, fee }
  const startEditCost = r => setEditCost({ lot: r.lot, prod: r.prod, costNcc: r.costNcc || 0, fee: r.fee || 0 });
  const saveCost = r => {
    if (!editCost) return;
    const newCostNcc = Number(editCost.costNcc) || 0;
    const newFee = Number(editCost.fee) || 0;
    const newUnitCost = r.qtyIn > 0 ? Math.round((newCostNcc * r.qtyIn + newFee) / r.qtyIn) : newCostNcc;
    setItems(xs => xs.map(x => x.lot === r.lot && x.prod === r.prod ? {...x, costNcc: newCostNcc, fee: newFee, unitCost: newUnitCost} : x));
    if (r.order && setOrders) {
      setOrders(os => os.map(o => o.id === r.order ? {...o, items: (o.items||[]).map(it => it.name === r.prod ? {...it, cost: newUnitCost} : it)} : o));
    }
    setEditCost(null);
  };
  const [fromDate, setFromDate] = useState(localMonthStart());
  const [toDate, setToDate] = useState(localToday());
  const [whInPage, setWhInPage] = useState(1);
  React.useEffect(() => setWhInPage(1), [q, fSup, fProd, fromDate, toDate]);
  const {txns = [], setTxns} = useTxns() || {};
  const lotRemaining = r => { const tot=(r.costNcc+(r.fee||0))*r.qtyIn-(r.returns||[]).reduce((s,x)=>s+(x.amount||0),0); const paid=r.paid||(r.pay==="Đã thanh toán"?tot:0); return Math.max(0,tot-paid); };
  const nextTxnId = txns.length ? Math.max(...txns.map(t=>Number(t.id)||0))+1 : 1;
  const handlePaySave = t => { setTxns(p=>[t,...p]); if(payModal) setItems(xs=>xs.map(r=>(r.lot===payModal.lot&&r.prod===payModal.prod)?{...r,paid:(r.paid||0)+Math.abs(t.amount)}:r)); setPayModal(null); notify("Đã lưu phiếu chi thanh toán NCC"); };
  const setKho = (lot, kho) => setItems(xs => xs.map(r => r.lot === lot ? {...r, kho} : r));
  const doReturnNcc = (rec, ret) => {
    const d = new Date(), pad = n=>String(n).padStart(2,"0");
    const dateStr = `${pad(d.getDate())}/${pad(d.getMonth()+1)}/${d.getFullYear()}`;
    const dt = dateStr + " " + `${pad(d.getHours())}:${pad(d.getMinutes())}`;
    setItems(xs => xs.map(r => r.lot === rec.lot && r.prod === rec.prod
      ? {...r, qtyRemaining: Math.max(0, (r.qtyRemaining ?? r.qtyNow ?? 0) - ret.qty), qtyNow: Math.max(0, (r.qtyNow ?? 0) - ret.qty)}
      : r));
    if (setPurchaseList) {
      setPurchaseList(xs => xs.map(r => (r.lot === rec.order || r.lot === rec.lot) && r.prod === rec.prod
        ? {...r, returns: [...(r.returns||[]), {...ret, date: dateStr}]}
        : r));
    }
    if (setWhOutItems) {
      const slip = "HNN" + String(Date.now()).slice(-8);
      setWhOutItems(xs => [{
        slip, dt, order: rec.lot || "", prod: rec.prod,
        lot: rec.lot || "", qty: ret.qty, sale: 0, unitCost: rec.costNcc || 0,
        cust: rec.supplier || "NCC", phone: "", addr: "",
        store: rec.store || "Kho HH", orderStatus: "Hoàn NCC",
        delivery: "Hoàn NCC", staff: rec.staff || _staffName,
        source: "hoanncc", note: ret.note || ""
      }, ...xs]);
    }
    setNccReturnModal(null);
  };
  const supNames = [...new Set(items.map(r => r.supplier).filter(Boolean))].sort();
  const prodNames = ["Tất cả", ...Array.from(new Set(items.map(r => r.prod).filter(Boolean))).sort()];
  const rows = items.filter(r =>
    _inR(r.date, fromDate, toDate) &&
    (!fSup || r.supplier === fSup) &&
    (fProd === "Tất cả" || r.prod.toLowerCase().includes(fProd.toLowerCase())) &&
    (!q || `${impCode(r.lot)} ${r.prod} ${r.supplier}`.toLowerCase().includes(q.toLowerCase()))
  ).sort((a,b) => parseViDate(b.date) - parseViDate(a.date));
  const WHIN_PER_PAGE = 25;
  const totalWhInPages = Math.ceil(rows.length / WHIN_PER_PAGE);
  const pagedRows = rows.slice((whInPage - 1) * WHIN_PER_PAGE, whInPage * WHIN_PER_PAGE);
  const findOrder = id => orders.find(o => o.id === id || o.id.replace(/^Đ/i,"D") === id.replace(/^Đ/i,"D"));
  const openOrderDetail = id => { const o = findOrder(id); setOrderModal(o || {id, _notFound: true}); };
  const onExport = () => exportCSV("danh-sach-phieu-nhap-kho", ["Kho", "Số phiếu nhập", "Số đơn hàng", "Ngày nhập", "Sản phẩm", "SL nhập", "SL còn", "Đơn giá", "CPMH", "Giá vốn", "Thành tiền", "Nhà cung cấp", "Người tạo"], rows.map(r => [r.store, impCode(r.lot), r.order || "", r.date, r.prod, r.qtyIn, r.qtyNow, r.costNcc, r.fee || 0, r.costNcc + (r.fee || 0), (r.costNcc + (r.fee || 0)) * r.qtyIn, r.supplier, r.staff]));
  const nccExtra = /*#__PURE__*/React.createElement(React.Fragment, null,
    /*#__PURE__*/React.createElement("div", null,
      /*#__PURE__*/React.createElement("label", {className: "mb-1 block text-[13px] font-medium text-slate-500"}, "Sản phẩm"),
      /*#__PURE__*/React.createElement("div", {className: "relative"},
        /*#__PURE__*/React.createElement("input", {
          value: fProd === "Tất cả" ? "" : fProd,
          onChange: e => setFProd(e.target.value || "Tất cả"),
          placeholder: "Gõ tên sản phẩm…",
          className: `${field} min-w-[200px] pr-6`
        }),
        fProd !== "Tất cả" && /*#__PURE__*/React.createElement("button", {
          onClick: () => setFProd("Tất cả"),
          className: "absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-lg leading-none"
        }, "×"))),
    /*#__PURE__*/React.createElement("div", null,
      /*#__PURE__*/React.createElement("label", {className: "mb-1 block text-[13px] font-medium text-slate-500"}, "Nhà cung cấp"),
      /*#__PURE__*/React.createElement("select", {value: fSup, onChange: e => setFSup(e.target.value), className: `${field} min-w-[200px]`},
        /*#__PURE__*/React.createElement("option", {value: ""}, "— Chọn NCC —"),
        supNames.map(s => /*#__PURE__*/React.createElement("option", {key: s, value: s}, s)))));
  return /*#__PURE__*/React.createElement("div", {
    className: "space-y-4"
  }, /*#__PURE__*/React.createElement(RangeBar, {
    q: q,
    setQ: setQ,
    placeholder: "Tìm theo mã phiếu, sản phẩm, NCC…",
    from: fromDate, setFrom: setFromDate,
    to: toDate, setTo: setToDate,
    onExport: onExport,
    extra: nccExtra,
    noPrint: true,
  }), /*#__PURE__*/React.createElement(TableShell, {
    minW: "1500px",
    head: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(Th, {
      style: {
        width: 110
      }
    }, "Ngày nhập"), /*#__PURE__*/React.createElement(Th, {
      style: {
        minWidth: 140
      }
    }, "Nhà cung cấp"), /*#__PURE__*/React.createElement(Th, {
      style: {
        width: 80
      }
    }, "Kho"), /*#__PURE__*/React.createElement(Th, null, "Số phiếu nhập"), /*#__PURE__*/React.createElement(Th, null, "Số đơn hàng"), /*#__PURE__*/React.createElement(Th, {
      style: {
        minWidth: 220
      }
    }, "Sản phẩm"), /*#__PURE__*/React.createElement(Th, {
      right: true
    }, "SL nhập"), /*#__PURE__*/React.createElement(Th, {
      right: true
    }, "Đơn giá"), /*#__PURE__*/React.createElement(Th, {
      right: true
    }, "CPMH"), /*#__PURE__*/React.createElement(Th, {
      right: true
    }, "Giá vốn"), /*#__PURE__*/React.createElement(Th, {
      right: true
    }, "Thành tiền"), /*#__PURE__*/React.createElement(Th, null, "Người tạo"))
  }, pagedRows.map(r => /*#__PURE__*/React.createElement("tr", {
    key: r.lot,
    className: "hover:bg-slate-50/60"
  }, /*#__PURE__*/React.createElement("td", {
    className: "px-3 py-3", style: {fontSize:"11px"}
  }, (() => {
    const p = String(r.date||"").split(" ");
    const dateS = p[0]||""; const timeS = p[1]||"";
    return /*#__PURE__*/React.createElement("span", {className:"text-slate-500"},
      /*#__PURE__*/React.createElement("span", {className:"block"}, dateS),
      timeS ? /*#__PURE__*/React.createElement("span", {className:"block text-slate-400"}, timeS) : null);
  })()), /*#__PURE__*/React.createElement("td", {
    className: "px-4 py-3 text-slate-500"
  }, /*#__PURE__*/React.createElement("select", {
    value: r.supplier || "",
    onChange: e => setNcc(r, e.target.value),
    className: `w-full rounded px-1.5 py-0.5 text-sm border-0 outline-none cursor-pointer bg-transparent hover:bg-amber-50 ${r.supplier ? "text-slate-700" : "text-slate-400"}`
  },
    /*#__PURE__*/React.createElement("option", {value: ""}, "— chọn NCC —"),
    nccNames.map(n => /*#__PURE__*/React.createElement("option", {key: n, value: n}, n)))), /*#__PURE__*/React.createElement("td", {
    className: "px-2 py-1.5 text-center text-sm font-medium text-slate-700"
  }, r.kho), /*#__PURE__*/React.createElement("td", {
    className: "px-4 py-3"
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => setSlipModal(r),
    className: "inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset bg-[#fef9f0] text-[#92400e] ring-[#b45309]"
  }, impCode(r.lot))), /*#__PURE__*/React.createElement("td", {
    className: "px-4 py-3"
  }, r.order ? /*#__PURE__*/React.createElement("button", {
    onClick: () => onOpenOrder && onOpenOrder(r.order),
    className: "inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset bg-[#fef9f0] text-[#92400e] ring-[#b45309]"
  }, r.order.startsWith("PM") ? purCode(r.order) : r.order) : /*#__PURE__*/React.createElement("span", {className: "text-slate-400"}, "")), /*#__PURE__*/React.createElement("td", {
    className: "px-4 py-3 text-slate-800"
  }, r.prod), /*#__PURE__*/React.createElement("td", {
    className: `px-4 py-3 text-right tabular-nums ${r.qtyIn < 0 ? "text-[#B91C1C]" : "text-slate-600"}`
  }, r.qtyIn),
  editCost && editCost.lot === r.lot && editCost.prod === r.prod
    ? /*#__PURE__*/React.createElement(React.Fragment, null,
        /*#__PURE__*/React.createElement("td", {className: "px-2 py-1"},
          /*#__PURE__*/React.createElement(NumInput, {value: editCost.costNcc, onChange: v => setEditCost(ec => ({...ec, costNcc: v})), className: "w-28 rounded border border-amber-300 px-2 py-1 text-right text-sm focus:outline-none focus:border-amber-500"})),
        /*#__PURE__*/React.createElement("td", {className: "px-2 py-1"},
          /*#__PURE__*/React.createElement(NumInput, {value: editCost.fee, onChange: v => setEditCost(ec => ({...ec, fee: v})), className: "w-24 rounded border border-amber-300 px-2 py-1 text-right text-sm focus:outline-none focus:border-amber-500"})),
        /*#__PURE__*/React.createElement("td", {className: "px-4 py-3 text-right tabular-nums font-medium text-[#92400e]"},
          vnd((Number(editCost.costNcc)||0) + (Number(editCost.fee)||0))),
        /*#__PURE__*/React.createElement("td", {className: "px-4 py-3 text-right tabular-nums font-medium text-[#B91C1C]"},
          vnd(((Number(editCost.costNcc)||0) + (Number(editCost.fee)||0)) * r.qtyIn)),
        /*#__PURE__*/React.createElement("td", {className: "px-2 py-1 whitespace-nowrap"},
          /*#__PURE__*/React.createElement("button", {onClick: () => saveCost(r), className: "mr-1 rounded bg-amber-500 px-2 py-1 text-xs font-semibold text-white hover:bg-amber-600"}, "Lưu"),
          /*#__PURE__*/React.createElement("button", {onClick: () => setEditCost(null), className: "rounded border border-slate-200 px-2 py-1 text-xs text-slate-500 hover:bg-slate-50"}, "Huỷ")))
    : /*#__PURE__*/React.createElement(React.Fragment, null,
        /*#__PURE__*/React.createElement("td", {
          className: "px-4 py-3 text-right tabular-nums text-slate-600 cursor-pointer hover:bg-amber-50 hover:text-amber-700",
          title: "Bấm để sửa giá nhập", onClick: () => startEditCost(r)
        }, vnd(r.costNcc)),
        /*#__PURE__*/React.createElement("td", {
          className: "px-4 py-3 text-right tabular-nums text-slate-500 cursor-pointer hover:bg-amber-50 hover:text-amber-700",
          title: "Bấm để sửa CPMH", onClick: () => startEditCost(r)
        }, r.fee ? vnd(r.fee) : /*#__PURE__*/React.createElement("span", {className: "text-slate-300 text-xs"}, "—")),
        /*#__PURE__*/React.createElement("td", {className: "px-4 py-3 text-right tabular-nums font-medium text-[#92400e]"}, vnd(r.costNcc + (r.fee || 0))),
        /*#__PURE__*/React.createElement("td", {className: "px-4 py-3 text-right tabular-nums font-medium text-[#B91C1C]"}, vnd((r.costNcc + (r.fee || 0)) * r.qtyIn)),
        /*#__PURE__*/React.createElement("td", {className: "px-4 py-3 text-slate-500"}, r.staff)))),
  /*#__PURE__*/React.createElement("tr", {className: "bg-[#fed7aa]"},
    /*#__PURE__*/React.createElement("td", {className: "px-4 py-3 text-xs font-bold uppercase tracking-wide text-slate-800", colSpan: 6}, "TỔNG CỘNG (",rows.length," PHIẾU)"),
    /*#__PURE__*/React.createElement("td", {className: `px-4 py-3 text-right tabular-nums ${rows.reduce((s,r)=>s+r.qtyIn,0)<0?"text-[#B91C1C]":"text-slate-800"}`, style:{fontWeight:700}}, rows.reduce((s,r)=>s+r.qtyIn,0)),
    
    /*#__PURE__*/React.createElement("td", {className: "px-4 py-3"}),
    /*#__PURE__*/React.createElement("td", {className: "px-4 py-3"}),
    /*#__PURE__*/React.createElement("td", {className: "px-4 py-3"}),
    /*#__PURE__*/React.createElement("td", {className: "px-4 py-3 text-right tabular-nums text-[#B91C1C]", style:{fontWeight:700}}, vnd(rows.reduce((s,r)=>s+(r.costNcc+(r.fee||0))*r.qtyIn,0))),
    /*#__PURE__*/React.createElement("td", {colSpan: 2}))),
  totalWhInPages > 1 && /*#__PURE__*/React.createElement("div", {className: "flex items-center justify-between gap-3 pt-1 px-1 flex-wrap"},
    /*#__PURE__*/React.createElement("span", {className: "text-xs text-slate-500"},
      `${(whInPage-1)*WHIN_PER_PAGE+1}–${Math.min(whInPage*WHIN_PER_PAGE, rows.length)} / ${rows.length} phiếu`),
    /*#__PURE__*/React.createElement("div", {className: "flex items-center gap-1"},
      /*#__PURE__*/React.createElement("button", {
        disabled: whInPage === 1,
        onClick: () => setWhInPage(p => Math.max(1, p-1)),
        className: "rounded px-2 py-1 text-sm text-slate-600 hover:bg-slate-100 disabled:opacity-30"
      }, "Trước"),
      Array.from({length: totalWhInPages}, (_, i) => i+1)
        .filter(n => n === 1 || n === totalWhInPages || Math.abs(n - whInPage) <= 1)
        .reduce((acc, n, i, arr) => {
          if (i > 0 && n - arr[i-1] > 1) acc.push("...");
          acc.push(n);
          return acc;
        }, [])
        .map((n, i) => n === "..." ?
          /*#__PURE__*/React.createElement("span", {key: `e${i}`, className: "px-1 text-slate-400"}, "...") :
          /*#__PURE__*/React.createElement("button", {
            key: n,
            onClick: () => setWhInPage(n),
            className: `min-w-[2rem] rounded px-2 py-1 text-sm font-medium ${whInPage === n ? "bg-[#92400e] text-white" : "text-slate-600 hover:bg-slate-100"}`
          }, n)),
      /*#__PURE__*/React.createElement("button", {
        disabled: whInPage === totalWhInPages,
        onClick: () => setWhInPage(p => Math.min(totalWhInPages, p+1)),
        className: "rounded px-2 py-1 text-sm text-slate-600 hover:bg-slate-100 disabled:opacity-30"
      }, "Sau"))),
  doc && /*#__PURE__*/React.createElement(DocModal, {doc: doc, onClose: () => setDoc(null)}),
  payModal && /*#__PURE__*/React.createElement(PhieuChiModal, {onClose: () => setPayModal(null), initEntity: payModal.supplier||"", initOrderId: impCode(payModal.lot), initKind: "CP Thanh Toán NCC", kinds: ["CP Đặt Cọc NCC","CP Thanh Toán NCC"], initAmount: lotRemaining(payModal), initNote: "Thanh toán "+impCode(payModal.lot)+" - "+(payModal.supplier||""), nextId: nextTxnId, onSave: handlePaySave}),
  nccReturnModal && /*#__PURE__*/React.createElement(NccReturnModal, {
    lot: nccReturnModal.lot,
    prod: nccReturnModal.prod,
    costNcc: nccReturnModal.costNcc || 0,
    onClose: () => setNccReturnModal(null),
    onSave: ret => doReturnNcc(nccReturnModal, ret)
  }),
  editSlip && /*#__PURE__*/React.createElement(Modal, {
    title: `Sửa phiếu nhập — ${impCode(editSlip.lot)}`,
    maxW: "max-w-lg",
    onClose: () => setEditSlip(null),
    footer: /*#__PURE__*/React.createElement(React.Fragment, null,
      /*#__PURE__*/React.createElement("button", {
        onClick: () => {
          const docId = editSlip._id || (editSlip.lot + "~~" + editSlip.prod);
          const updated = {...editSlip, unitCost: (editSlip.qtyIn||0) > 0 ? Math.round(((editSlip.costNcc||0) * (editSlip.qtyIn||0) + (editSlip.fee||0)) / (editSlip.qtyIn||1)) : (editSlip.costNcc||0)};
          setItems(xs => xs.map(x => (x.lot === editSlip.lot && x.prod === editSlip.prod) ? updated : x));
          saveDoc("wh_in", docId, updated);
          setEditSlip(null);
          notify("Đã lưu phiếu nhập");
        },
        className: "inline-flex items-center gap-1.5 rounded-lg bg-[#92400e] px-4 py-2 text-sm font-semibold text-white hover:bg-[#7c2d12]"
      }, /*#__PURE__*/React.createElement(Save, {className: "h-4 w-4"}), "Lưu"),
      /*#__PURE__*/React.createElement("button", {onClick: () => setEditSlip(null), className: ghostBtn}, "Huỷ"))
  }, /*#__PURE__*/React.createElement("div", {className: "space-y-3 text-sm"},
    /*#__PURE__*/React.createElement("div", {className: "grid grid-cols-2 gap-3"},
      /*#__PURE__*/React.createElement("div", null,
        /*#__PURE__*/React.createElement("label", {className: "mb-1 block text-[11px] font-medium text-slate-500"}, "Ngày nhập"),
        /*#__PURE__*/React.createElement("input", {type: "text", value: editSlip.date || "", onChange: e => setEditSlip(v => ({...v, date: e.target.value})), className: "w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-[#fed7aa] focus:outline-none"})
      ),
      /*#__PURE__*/React.createElement("div", null,
        /*#__PURE__*/React.createElement("label", {className: "mb-1 block text-[11px] font-medium text-slate-500"}, "Kho"),
        /*#__PURE__*/React.createElement("input", {type: "text", value: editSlip.kho || editSlip.store || "", onChange: e => setEditSlip(v => ({...v, kho: e.target.value, store: e.target.value})), className: "w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-[#fed7aa] focus:outline-none"})
      )
    ),
    /*#__PURE__*/React.createElement("div", null,
      /*#__PURE__*/React.createElement("label", {className: "mb-1 block text-[11px] font-medium text-slate-500"}, "Nhà cung cấp"),
      /*#__PURE__*/React.createElement("select", {value: editSlip.supplier || "", onChange: e => setEditSlip(v => ({...v, supplier: e.target.value})), className: "w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-[#fed7aa] focus:outline-none bg-white"},
        /*#__PURE__*/React.createElement("option", {value: ""}, "— chọn NCC —"),
        nccNames.map(n => /*#__PURE__*/React.createElement("option", {key: n, value: n}, n))
      )
    ),
    /*#__PURE__*/React.createElement("div", null,
      /*#__PURE__*/React.createElement("label", {className: "mb-1 block text-[11px] font-medium text-slate-500"}, "Sản phẩm"),
      /*#__PURE__*/React.createElement("div", {className: "rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-600"}, editSlip.prod)
    ),
    /*#__PURE__*/React.createElement("div", {className: "grid grid-cols-3 gap-3"},
      /*#__PURE__*/React.createElement("div", null,
        /*#__PURE__*/React.createElement("label", {className: "mb-1 block text-[11px] font-medium text-slate-500"}, "SL nhập"),
        /*#__PURE__*/React.createElement(NumInput, {value: editSlip.qtyIn || 0, onChange: v => setEditSlip(x => ({...x, qtyIn: v})), className: "w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-right focus:border-[#fed7aa] focus:outline-none"})
      ),
      /*#__PURE__*/React.createElement("div", null,
        /*#__PURE__*/React.createElement("label", {className: "mb-1 block text-[11px] font-medium text-slate-500"}, "Đơn giá"),
        /*#__PURE__*/React.createElement(NumInput, {value: editSlip.costNcc || 0, onChange: v => setEditSlip(x => ({...x, costNcc: v})), className: "w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-right focus:border-[#fed7aa] focus:outline-none"})
      ),
      /*#__PURE__*/React.createElement("div", null,
        /*#__PURE__*/React.createElement("label", {className: "mb-1 block text-[11px] font-medium text-slate-500"}, "CPMH"),
        /*#__PURE__*/React.createElement(NumInput, {value: editSlip.fee || 0, onChange: v => setEditSlip(x => ({...x, fee: v})), className: "w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-right focus:border-[#fed7aa] focus:outline-none"})
      )
    ),
    /*#__PURE__*/React.createElement("div", {className: "flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-xs font-semibold"},
      /*#__PURE__*/React.createElement("span", {className: "text-slate-600"}, "Tổng thành tiền"),
      /*#__PURE__*/React.createElement("span", {className: "text-slate-900"}, vnd(((editSlip.costNcc||0) + (editSlip.fee||0)) * (editSlip.qtyIn||0)))
    )
  )),
  slipModal && /*#__PURE__*/React.createElement(Modal, {
    title: `Phiếu nhập kho — ${impCode(slipModal.lot)}`,
    maxW: "max-w-lg",
    onClose: () => setSlipModal(null),
    footer: /*#__PURE__*/React.createElement(React.Fragment, null,
      /*#__PURE__*/React.createElement("button", {onClick: () => { setNccReturnModal(slipModal); setSlipModal(null); }, className: "inline-flex items-center gap-1.5 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-semibold text-[#92400e] hover:bg-amber-100"}, /*#__PURE__*/React.createElement(RotateCcw, {className: "h-4 w-4"}), "Hoàn"),
      lotRemaining(slipModal) > 0 && /*#__PURE__*/React.createElement("button", {onClick: () => { setPayModal(slipModal); setSlipModal(null); }, className: "inline-flex items-center gap-1.5 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm font-semibold text-[#047857] hover:bg-green-100 whitespace-nowrap"}, /*#__PURE__*/React.createElement(Wallet, {className: "h-4 w-4"}), "Thanh toán"),
      /*#__PURE__*/React.createElement("button", {onClick: () => { setEditSlip({...slipModal}); setSlipModal(null); }, className: "inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"}, /*#__PURE__*/React.createElement(Pencil, {className: "h-4 w-4"}), "Sửa"),
      /*#__PURE__*/React.createElement(PrintBtn, null),
      _whProfile?.role === "admin" && /*#__PURE__*/React.createElement("button", {onClick: () => { if (!window.confirm("Xoá phiếu nhập này?")) return; const docId = slipModal._id || (slipModal.lot + "~~" + slipModal.prod); deleteDocument("wh_in", docId); setItems(xs => xs.filter(x => !(x.lot === slipModal.lot && x.prod === slipModal.prod))); setSlipModal(null); notify("Đã xoá phiếu nhập"); }, className: "inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-100"}, /*#__PURE__*/React.createElement(Trash2, {className: "h-4 w-4"}), "Xoá"))
  }, /*#__PURE__*/React.createElement("div", {className: "space-y-4 text-sm"},
    /*#__PURE__*/React.createElement("div", {className: "grid grid-cols-2 gap-y-2 text-xs"},
      /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", {className: "text-slate-500"}, "Số phiếu: "), /*#__PURE__*/React.createElement("span", {className: "font-semibold text-[#92400e]"}, impCode(slipModal.lot))),
      /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", {className: "text-slate-500"}, "Ngày nhập: "), /*#__PURE__*/React.createElement("span", {className: "font-medium text-slate-800"}, slipModal.date)),
      /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", {className: "text-slate-500"}, "Kho: "), /*#__PURE__*/React.createElement("span", {className: "font-medium text-slate-800"}, slipModal.kho || slipModal.store)),
      /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", {className: "text-slate-500"}, "Số đơn hàng: "), slipModal.order
        ? /*#__PURE__*/React.createElement("button", {onClick: () => { setSlipModal(null); onOpenOrder && onOpenOrder(slipModal.order); }, className: "inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset bg-[#fef9f0] text-[#92400e] ring-[#b45309]"}, slipModal.order.startsWith("PM") ? purCode(slipModal.order) : slipModal.order)
        : /*#__PURE__*/React.createElement("span", {className: "font-medium text-slate-400"}, "")),
      /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", {className: "text-slate-500"}, "NCC: "), /*#__PURE__*/React.createElement("span", {className: "font-medium text-slate-800"}, slipModal.supplier)),
      /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", {className: "text-slate-500"}, "Người tạo: "), /*#__PURE__*/React.createElement("span", {className: "font-medium text-slate-800"}, slipModal.staff))),
    /*#__PURE__*/React.createElement("table", {className: "w-full border-collapse text-xs"},
      /*#__PURE__*/React.createElement("thead", null,
        /*#__PURE__*/React.createElement("tr", {className: "border-b-2 border-slate-300 bg-slate-50"},
          /*#__PURE__*/React.createElement("th", {className: "py-2 px-3 text-center font-semibold text-slate-600"}, "Sản phẩm"),
          /*#__PURE__*/React.createElement("th", {className: "py-2 px-3 text-center font-semibold text-slate-600"}, "SL nhập"),
          /*#__PURE__*/React.createElement("th", {className: "py-2 px-3 text-center font-semibold text-slate-600"}, "Đơn giá"),
          /*#__PURE__*/React.createElement("th", {className: "py-2 px-3 text-center font-semibold text-slate-600"}, "CPMH"),
          /*#__PURE__*/React.createElement("th", {className: "py-2 px-3 text-center font-semibold text-slate-600"}, "Giá vốn"),
          /*#__PURE__*/React.createElement("th", {className: "py-2 px-3 text-center font-semibold text-slate-600"}, "Thành tiền"))),
      /*#__PURE__*/React.createElement("tbody", null,
        /*#__PURE__*/React.createElement("tr", {className: "border-b border-slate-100"},
          /*#__PURE__*/React.createElement("td", {className: "py-2 px-3 text-slate-800"}, slipModal.prod),
          /*#__PURE__*/React.createElement("td", {className: "py-2 px-3 text-right tabular-nums"}, slipModal.qtyIn),
          /*#__PURE__*/React.createElement("td", {className: "py-2 px-3 text-right tabular-nums"}, vnd(slipModal.costNcc)),
          /*#__PURE__*/React.createElement("td", {className: "py-2 px-3 text-right tabular-nums"}, slipModal.fee ? vnd(slipModal.fee) : ""),
          /*#__PURE__*/React.createElement("td", {className: "py-2 px-3 text-right tabular-nums font-medium"}, vnd(slipModal.costNcc + (slipModal.fee || 0))),
          /*#__PURE__*/React.createElement("td", {className: "py-2 px-3 text-right tabular-nums font-bold"}, vnd((slipModal.costNcc + (slipModal.fee || 0)) * slipModal.qtyIn))))),
    /*#__PURE__*/React.createElement("div", {className: "flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-xs font-semibold"},
      /*#__PURE__*/React.createElement("span", {className: "text-slate-600"}, "Tổng thành tiền"),
      /*#__PURE__*/React.createElement("span", {className: "text-slate-900"}, vnd((slipModal.costNcc + (slipModal.fee || 0)) * slipModal.qtyIn))))),
  orderModal && /*#__PURE__*/React.createElement(Modal, {
    title: orderModal._notFound ? `Đơn hàng ${orderModal.id}` : `Đơn hàng ${orderModal.id}`,
    maxW: "max-w-2xl",
    onClose: () => setOrderModal(null),
    footer: /*#__PURE__*/React.createElement(React.Fragment, null,
      /*#__PURE__*/React.createElement(PrintBtn, null),
      /*#__PURE__*/React.createElement("button", {onClick: () => setOrderModal(null), className: ghostBtn}, "Đóng"))
  }, orderModal._notFound
    ? /*#__PURE__*/React.createElement("p", {className: "text-sm text-slate-500"}, "Không tìm thấy dữ liệu đơn hàng ", /*#__PURE__*/React.createElement("span", {className: "inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset bg-[#fef9f0] text-[#92400e] ring-[#b45309]"}, orderModal.id), " trong hệ thống.")
    : /*#__PURE__*/React.createElement("div", {className: "space-y-4 text-sm"},
        /*#__PURE__*/React.createElement("div", {className: "grid grid-cols-2 gap-3 rounded-lg bg-slate-50 px-4 py-3 text-xs"},
          /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", {className: "text-slate-500"}, "Khách hàng: "), /*#__PURE__*/React.createElement("span", {className: "font-medium text-slate-800"}, orderModal.name)),
          /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", {className: "text-slate-500"}, "SĐT: "), /*#__PURE__*/React.createElement("span", {className: "font-medium text-slate-800"}, orderModal.phone)),
          /*#__PURE__*/React.createElement("div", {className: "col-span-2"}, /*#__PURE__*/React.createElement("span", {className: "text-slate-500"}, "Địa chỉ: "), /*#__PURE__*/React.createElement("span", {className: "font-medium text-slate-800"}, orderModal.addr || "")),
          /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", {className: "text-slate-500"}, "Ngày tạo: "), /*#__PURE__*/React.createElement("span", {className: "font-medium text-slate-800"}, orderModal.dt)),
          /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", {className: "text-slate-500"}, "Trạng thái: "), /*#__PURE__*/React.createElement("span", {className: "font-medium text-slate-800"}, calc(orderModal).orderStatus)),
          /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", {className: "text-slate-500"}, "Nhân viên: "), /*#__PURE__*/React.createElement("span", {className: "font-medium text-slate-800"}, orderModal.staff || "")),
          /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", {className: "text-slate-500"}, "Kênh: "), /*#__PURE__*/React.createElement("span", {className: "font-medium text-slate-800"}, orderModal.channel || ""))),
        orderModal.items && orderModal.items.length > 0 && /*#__PURE__*/React.createElement("div", null,
          /*#__PURE__*/React.createElement("p", {className: "mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500"}, "Sản phẩm"),
          /*#__PURE__*/React.createElement("table", {className: "w-full text-xs"},
            /*#__PURE__*/React.createElement("thead", null,
              /*#__PURE__*/React.createElement("tr", {className: "border-b border-slate-200 text-slate-500"},
                /*#__PURE__*/React.createElement("th", {className: "py-1.5 text-left font-medium"}, "Tên sản phẩm"),
                /*#__PURE__*/React.createElement("th", {className: "py-1.5 text-right font-medium"}, "SL"),
                /*#__PURE__*/React.createElement("th", {className: "py-1.5 text-right font-medium"}, "Đơn giá"),
                /*#__PURE__*/React.createElement("th", {className: "py-1.5 text-right font-medium"}, "Thành tiền"))),
            /*#__PURE__*/React.createElement("tbody", null,
              ...(orderModal.items || []).map((it, i) =>
                /*#__PURE__*/React.createElement("tr", {key: i, className: "border-b border-slate-50"},
                  /*#__PURE__*/React.createElement("td", {className: "py-1.5 text-slate-700"}, it.name),
                  /*#__PURE__*/React.createElement("td", {className: "py-1.5 text-right tabular-nums"}, it.qty),
                  /*#__PURE__*/React.createElement("td", {className: "py-1.5 text-right tabular-nums"}, vnd(it.price)),
                  /*#__PURE__*/React.createElement("td", {className: "py-1.5 text-right tabular-nums font-medium"}, vnd(it.price * it.qty)))))),
        /*#__PURE__*/React.createElement("div", {className: "flex items-center justify-between rounded-lg bg-slate-50 px-4 py-2 text-xs"},
          /*#__PURE__*/React.createElement("span", {className: "text-slate-500"}, "Đã thanh toán"),
          /*#__PURE__*/React.createElement("span", {className: "font-semibold text-slate-800"}, vnd(orderModal.paid || 0))),
        /*#__PURE__*/React.createElement("div", {className: "flex items-center justify-between rounded-lg bg-slate-50 px-4 py-2 text-xs"},
          /*#__PURE__*/React.createElement("span", {className: "font-semibold text-slate-700"}, "Còn lại"),
          /*#__PURE__*/React.createElement("span", {className: `font-bold tabular-nums ${(orderModal.total||0)-(orderModal.paid||0)>0?"text-[#B91C1C]":"text-[#92400e]"}`},
            vnd((orderModal.total||0)-(orderModal.paid||0))))))));
}
function WhOut({whOutItems: items, setWhOutItems: setItems, onOpenOrder}) {
  const storeShort = s => (s || "").replace(/^Kho\s+/, "") || s || "";
  const [q, setQ] = useState("");
  const [doc, setDoc] = useState(null);
  const [slipModal, setSlipModal] = useState(null);
  const [fProd, setFProd] = useState("Tất cả");
  const [fromDate, setFromDate] = useState(localMonthStart());
  const [toDate, setToDate] = useState(localToday());
  const [whOutPage, setWhOutPage] = useState(1);
  const [selectedSlips, setSelectedSlips] = useState(new Set());
  const toggleSlip = slip => setSelectedSlips(prev => { const s = new Set(prev); s.has(slip) ? s.delete(slip) : s.add(slip); return s; });
  React.useEffect(() => setWhOutPage(1), [q, fProd, fromDate, toDate]);
  const prodList = ["Tất cả", ...new Set(items.map(r => r.prod))];
  const _pISO = s => { const [y,m,d] = s.split("-"); return new Date(+y,+m-1,+d); };
  const _inR = (dt, f, t) => { const d = parseViDate(dt); return (!f || d >= _pISO(f)) && (!t || d <= new Date(_pISO(t).setHours(23,59,59))); };
  const rows = items.filter(r => {
    if (!_inR(r.dt, fromDate, toDate)) return false;
    if (fProd !== "Tất cả" && r.prod !== fProd) return false;
    if (q && !`${r.order} ${r.prod} ${r.cust} ${r.sku}`.toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  }).sort((a,b) => parseViDate(b.dt) - parseViDate(a.dt));
  const WHOUT_PER_PAGE = 25;
  const totalWhOutPages = Math.ceil(rows.length / WHOUT_PER_PAGE);
  const pagedWhOut = rows.slice((whOutPage - 1) * WHOUT_PER_PAGE, whOutPage * WHOUT_PER_PAGE);
  const allPageChecked = pagedWhOut.length > 0 && pagedWhOut.every(r => selectedSlips.has(r.slip));
  const toggleAll = () => setSelectedSlips(prev => { const s = new Set(prev); allPageChecked ? pagedWhOut.forEach(r => s.delete(r.slip)) : pagedWhOut.forEach(r => s.add(r.slip)); return s; });
  const onExport = () => exportCSV("danh-sach-phieu-xuat-kho", ["Thời gian", "Đơn hàng", "Khách hàng", "Địa chỉ", "Tên sản phẩm", "Nhà cung cấp", "Kho", "SL xuất", "Giá bán", "Thành tiền", "TT Đơn", "TT Giao", "Người xuất"], rows.map(r => [r.dt, r.order, r.cust, r.addr, r.prod, r.supplier, r.store, r.qty, r.sale, r.sale * r.qty, r.orderStatus, r.delivery, r.staff]));
  return /*#__PURE__*/React.createElement("div", {
    className: "space-y-4"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex flex-wrap items-end gap-3 rounded-xl border border-slate-200 bg-white p-3"
  }, /*#__PURE__*/React.createElement(DateRangeFilter, {initFrom:fromDate, initTo:toDate, onApply:(f,t)=>{setFromDate(f);setToDate(t);}}), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: "mb-1 block text-[13px] font-medium text-slate-500"
  }, "Tên sản phẩm"), /*#__PURE__*/React.createElement("select", {
    value: fProd,
    onChange: e => setFProd(e.target.value),
    className: `${field} max-w-[180px]`
  }, prodList.map(s => /*#__PURE__*/React.createElement("option", {
    key: s
  }, s)))), /*#__PURE__*/React.createElement("div", {
    className: "relative min-w-[200px] flex-1"
  }, /*#__PURE__*/React.createElement("label", {
    className: "mb-1 block text-[13px] font-medium text-slate-500"
  }, "Tìm kiếm"), /*#__PURE__*/React.createElement(Search, {
    className: "absolute left-2.5 top-[2.05rem] h-4 w-4 text-slate-400"
  }), /*#__PURE__*/React.createElement("input", {
    value: q,
    onChange: e => setQ(e.target.value),
    placeholder: "Đơn hàng, sản phẩm, khách hàng…",
    className: `${field} w-full pl-8`
  })), /*#__PURE__*/React.createElement("div", {className: "flex items-end gap-2 pb-0.5"},
    /*#__PURE__*/React.createElement(PrintBtn, null),
    /*#__PURE__*/React.createElement(ExportBtn, {onClick: onExport}))), /*#__PURE__*/React.createElement("p", {
    className: "text-xs text-slate-400"
  }), /*#__PURE__*/React.createElement(TableShell, {
    minW: "1400px",
    head: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(Th, {
      style: {
        width: 90
      }
    }, "Ngày xuất"), /*#__PURE__*/React.createElement(Th, {
      style: {
        width: 110
      }
    }, "Số phiếu xuất"), /*#__PURE__*/React.createElement(Th, {
      style: {
        width: 100
      }
    }, "Đơn hàng"), /*#__PURE__*/React.createElement(Th, {
      style: {
        minWidth: 160
      }
    }, "Khách hàng"), /*#__PURE__*/React.createElement(Th, {
      style: {
        minWidth: 160
      }
    }, "Địa chỉ"), /*#__PURE__*/React.createElement(Th, {
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
        width: 80
      }
    }, "Kho"), /*#__PURE__*/React.createElement(Th, {
      style: {width: 40},
      className: "text-center"
    }, /*#__PURE__*/React.createElement("input", {
      type: "checkbox",
      checked: allPageChecked,
      onChange: toggleAll,
      className: "h-3.5 w-3.5 cursor-pointer accent-blue-500 rounded"
    })))
  }, pagedWhOut.map(r => /*#__PURE__*/React.createElement("tr", {
    key: r.slip,
    className: "align-top hover:bg-slate-50/60"
  }, /*#__PURE__*/React.createElement("td", {className:"px-3 py-3", style:{fontSize:"11px"}}, (() => {
    const p = String(r.dt||"").split(" ");
    const dateStr = p[0]||"";
    const timeStr = p[1] ? p[1].split(":").slice(0,2).join(":") : "";
    return /*#__PURE__*/React.createElement("span", {className:"text-slate-500"},
      /*#__PURE__*/React.createElement("span", {className:"block"}, dateStr),
      timeStr ? /*#__PURE__*/React.createElement("span", {className:"block text-slate-400"}, timeStr) : null);
  })()), /*#__PURE__*/React.createElement("td", {
    className: "px-3 py-3 tabular-nums"
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => setSlipModal(r),
    className: "inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset bg-[#fef9f0] text-[#92400e] ring-[#b45309] hover:bg-amber-100"
  }, expCode(r.slip))), /*#__PURE__*/React.createElement("td", {
    className: "px-3 py-3"
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => onOpenOrder ? onOpenOrder(r.order) : null,
    className: "inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset bg-[#fef9f0] text-[#92400e] ring-[#b45309]"
  }, r.order)), /*#__PURE__*/React.createElement("td", {
    className: "px-3 py-3",
    style: {minWidth: 160}
  }, /*#__PURE__*/React.createElement("div", {className: "text-slate-800 truncate"}, r.cust),
    r.phone ? /*#__PURE__*/React.createElement("div", {className: "mt-0.5 text-xs text-slate-400"}, /*#__PURE__*/React.createElement(Phone, {value: r.phone})) : null
  ), /*#__PURE__*/React.createElement("td", {
    className: "px-3 py-3 text-xs text-slate-500"
  }, r.addr), /*#__PURE__*/React.createElement("td", {
    className: "px-3 py-3 text-slate-800"
  }, r.prod), /*#__PURE__*/React.createElement("td", {
    className: `px-3 py-3 text-right tabular-nums ${r.qty < 0 ? "text-[#B91C1C]" : "text-slate-600"}`
  }, r.qty), /*#__PURE__*/React.createElement("td", {
    className: "px-3 py-3 text-right tabular-nums text-[#92400e]"
  }, vnd(r.sale)), /*#__PURE__*/React.createElement("td", {
    className: "px-3 py-3 text-right font-medium tabular-nums text-[#B91C1C]"
  }, vnd(r.sale * r.qty)), /*#__PURE__*/React.createElement("td", {
    className: "px-3 py-3 text-xs text-slate-500"
  }, r.staff), /*#__PURE__*/React.createElement("td", {
    className: "px-3 py-3 text-slate-500"
  }, storeShort(r.store)), /*#__PURE__*/React.createElement("td", {
    className: "px-3 py-3 text-center"
  }, /*#__PURE__*/React.createElement("input", {
    type: "checkbox",
    checked: selectedSlips.has(r.slip),
    onChange: () => toggleSlip(r.slip),
    className: "h-3.5 w-3.5 cursor-pointer accent-blue-500 rounded"
  })))),
  /*#__PURE__*/React.createElement("tr", {className: "border-t-2 border-[#fdba74] bg-[#fed7aa]"},
    /*#__PURE__*/React.createElement("td", {className: "px-3 py-3 text-xs font-bold uppercase tracking-wide text-slate-800", colSpan: 6}, "TỔNG CỘNG (", rows.length, " PHIẾU)"),
    /*#__PURE__*/React.createElement("td", {className: "px-3 py-3 text-right tabular-nums text-slate-800", style:{fontWeight:700}}, rows.reduce((s,r)=>s+r.qty,0)),
    /*#__PURE__*/React.createElement("td", {className: "px-3 py-3"}),
    /*#__PURE__*/React.createElement("td", {className: "px-3 py-3 text-right tabular-nums text-[#B91C1C]", style:{fontWeight:700}}, vnd(rows.reduce((s,r)=>s+r.sale*r.qty,0))),
    /*#__PURE__*/React.createElement("td", {colSpan: 3}))),
  totalWhOutPages > 1 && /*#__PURE__*/React.createElement("div", {className: "flex items-center justify-between gap-3 pt-1 px-1 flex-wrap"},
    /*#__PURE__*/React.createElement("span", {className: "text-xs text-slate-500"},
      `${(whOutPage-1)*WHOUT_PER_PAGE+1}–${Math.min(whOutPage*WHOUT_PER_PAGE, rows.length)} / ${rows.length} phiếu`),
    /*#__PURE__*/React.createElement("div", {className: "flex items-center gap-1"},
      /*#__PURE__*/React.createElement("button", {
        disabled: whOutPage === 1,
        onClick: () => setWhOutPage(p => Math.max(1, p-1)),
        className: "rounded px-2 py-1 text-sm text-slate-600 hover:bg-slate-100 disabled:opacity-30"
      }, "Trước"),
      Array.from({length: totalWhOutPages}, (_, i) => i+1)
        .filter(n => n === 1 || n === totalWhOutPages || Math.abs(n - whOutPage) <= 1)
        .reduce((acc, n, i, arr) => {
          if (i > 0 && n - arr[i-1] > 1) acc.push("...");
          acc.push(n);
          return acc;
        }, [])
        .map((n, i) => n === "..." ?
          /*#__PURE__*/React.createElement("span", {key: `e${i}`, className: "px-1 text-slate-400"}, "...") :
          /*#__PURE__*/React.createElement("button", {
            key: n,
            onClick: () => setWhOutPage(n),
            className: `min-w-[2rem] rounded px-2 py-1 text-sm font-medium ${whOutPage === n ? "bg-[#92400e] text-white" : "text-slate-600 hover:bg-slate-100"}`
          }, n)),
      /*#__PURE__*/React.createElement("button", {
        disabled: whOutPage === totalWhOutPages,
        onClick: () => setWhOutPage(p => Math.min(totalWhOutPages, p+1)),
        className: "rounded px-2 py-1 text-sm text-slate-600 hover:bg-slate-100 disabled:opacity-30"
      }, "Sau"))),
  slipModal && /*#__PURE__*/React.createElement(Modal, {
    title: `Phiếu xuất kho — ${expCode(slipModal.slip)}`,
    maxW: "max-w-lg",
    onClose: () => setSlipModal(null),
    footer: /*#__PURE__*/React.createElement(React.Fragment, null,
      /*#__PURE__*/React.createElement(PrintBtn, null),
      /*#__PURE__*/React.createElement("button", {onClick: () => setSlipModal(null), className: ghostBtn}, "Đóng"))
  }, /*#__PURE__*/React.createElement("div", {className: "space-y-4 text-sm"},
    /*#__PURE__*/React.createElement("div", {className: "grid grid-cols-2 gap-y-2 text-xs"},
      /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", {className: "text-slate-500"}, "Số phiếu: "), /*#__PURE__*/React.createElement("span", {className: "font-semibold text-[#92400e]"}, expCode(slipModal.slip))),
      /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", {className: "text-slate-500"}, "Thời gian: "), /*#__PURE__*/React.createElement("span", {className: "font-medium text-slate-800"}, slipModal.dt)),
      /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", {className: "text-slate-500"}, "Đơn hàng: "), slipModal.order && onOpenOrder ? /*#__PURE__*/React.createElement("button", {onClick: () => { setSlipModal(null); onOpenOrder(slipModal.order); }, className: "inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset bg-[#fef9f0] text-[#92400e] ring-[#b45309] hover:bg-[#ffedd5]"}, slipModal.order) : /*#__PURE__*/React.createElement("span", {className: "font-medium text-slate-800"}, slipModal.order)),
      /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", {className: "text-slate-500"}, "Kho: "), /*#__PURE__*/React.createElement("span", {className: "font-medium text-slate-800"}, storeShort(slipModal.store))),
      /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", {className: "text-slate-500"}, "Khách hàng: "), /*#__PURE__*/React.createElement("span", {className: "font-medium text-slate-800"}, slipModal.cust)),
      /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", {className: "text-slate-500"}, "Người xuất: "), /*#__PURE__*/React.createElement("span", {className: "font-medium text-slate-800"}, slipModal.staff)),
      /*#__PURE__*/React.createElement("div", {className: "col-span-2"}, /*#__PURE__*/React.createElement("span", {className: "text-slate-500"}, "Địa chỉ: "), /*#__PURE__*/React.createElement("span", {className: "font-medium text-slate-800"}, slipModal.addr || ""))),
    /*#__PURE__*/React.createElement("table", {className: "w-full border-collapse text-xs"},
      /*#__PURE__*/React.createElement("thead", null,
        /*#__PURE__*/React.createElement("tr", {className: "border-b-2 border-slate-300 bg-slate-50"},
          /*#__PURE__*/React.createElement("th", {className: "py-2 px-3 text-left font-semibold text-slate-600"}, "Mã SP"),
          /*#__PURE__*/React.createElement("th", {className: "py-2 px-3 text-left font-semibold text-slate-600"}, "Sản phẩm"),
          /*#__PURE__*/React.createElement("th", {className: "py-2 px-3 text-right font-semibold text-slate-600"}, "SL xuất"),
          /*#__PURE__*/React.createElement("th", {className: "py-2 px-3 text-right font-semibold text-slate-600"}, "Giá bán"),
          /*#__PURE__*/React.createElement("th", {className: "py-2 px-3 text-right font-semibold text-slate-600"}, "Thành tiền"))),
      /*#__PURE__*/React.createElement("tbody", null,
        /*#__PURE__*/React.createElement("tr", {className: "border-b border-slate-100"},
          /*#__PURE__*/React.createElement("td", {className: "py-2 px-3 text-slate-800"}, slipModal.prod),
          /*#__PURE__*/React.createElement("td", {className: "py-2 px-3 text-right tabular-nums"}, slipModal.qty),
          /*#__PURE__*/React.createElement("td", {className: "py-2 px-3 text-right tabular-nums"}, vnd(slipModal.sale)),
          /*#__PURE__*/React.createElement("td", {className: "py-2 px-3 text-right tabular-nums font-bold"}, vnd(slipModal.sale * slipModal.qty))))),
    /*#__PURE__*/React.createElement("div", {className: "flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-xs font-semibold"},
      /*#__PURE__*/React.createElement("span", {className: "text-slate-600"}, "Tổng thành tiền"),
      /*#__PURE__*/React.createElement("span", {className: "text-slate-900"}, vnd(slipModal.sale * slipModal.qty))))));
}
/* ───────── Tồn kho — Báo cáo xuất nhập tồn ───────── */
const STOCK_REPORT = [];
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
    date: localToday().split("-").reverse().join("/"),
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
    className: "border-b border-slate-100 bg-amber-50 text-left text-xs uppercase tracking-wide text-amber-900/60"
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
    className: `rounded px-1.5 py-0.5 text-xs font-medium ${m.type === "Xuất" ? "bg-rose-50 text-[#B91C1C]" : m.type === "Nhập" ? "bg-emerald-50 text-[#92400e]" : "bg-slate-100 text-slate-500"}`
  }, m.type)), /*#__PURE__*/React.createElement("td", {
    className: "px-3 py-2.5 text-slate-500"
  }, m.date), /*#__PURE__*/React.createElement("td", {
    className: "px-3 py-2.5"
  }, /*#__PURE__*/React.createElement("span", {className: "inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset bg-[#fef9f0] text-[#92400e] ring-[#b45309]"}, m.slip)), /*#__PURE__*/React.createElement("td", {
    className: "px-3 py-2.5 text-slate-500"
  }, m.store), /*#__PURE__*/React.createElement("td", {
    className: "px-3 py-2.5 text-slate-500"
  }, m.ref), /*#__PURE__*/React.createElement("td", {
    className: `px-3 py-2.5 text-right font-medium tabular-nums ${m.type === "Xuất" ? "text-[#B91C1C]" : "text-slate-700"}`
  }, m.type === "Xuất" ? "-" : "+", m.qty)))))));
}
function Stock() {
  const [store, setStore] = useState("Tất cả kho");
  const [q, setQ] = useState("");
  const [detail, setDetail] = useState(null);
  const [fromDate, setFromDate] = useState(localMonthStart());
  const [toDate, setToDate] = useState(localToday());
  const { whInItems = [], whOutItems = [] } = useInventory();
  const [prodsFS] = useCollection("products");
  const stockReport = React.useMemo(() => {
    const map = {};
    whInItems.forEach(r => {
      const key = `${r.prod}__${r.store || "Kho HH"}`;
      if (!map[key]) map[key] = { prod: r.prod, store: r.store || "Kho HH", in: 0, out: 0, costNcc: r.costNcc || 0 };
      map[key].in += r.qtyIn || 0;
      if (r.costNcc) map[key].costNcc = r.costNcc;
    });
    whOutItems.forEach(r => {
      const storeName = r.store || "Kho HH";
      const key = `${r.prod}__${storeName}`;
      if (!map[key]) map[key] = { prod: r.prod, store: storeName, in: 0, out: 0, costNcc: 0 };
      map[key].out += r.qty || 0;
    });
    const prods = prodsFS || [];
    return Object.values(map).map(m => {
      const p = prods.find(x => x.name === m.prod || (x.sku && m.prod && m.prod.includes(x.sku)));
      return { store: m.store, sku: p?.sku || "", name: m.prod, unit: p?.unit || "Cái", price: m.costNcc || p?.sale || 0, o: 0, in: m.in, out: m.out };
    }).sort((a,b) => a.name.localeCompare(b.name, "vi"));
  }, [whInItems, whOutItems, prodsFS]);
  const rows = stockReport.filter(r => (store === "Tất cả kho" || r.store === store) && (!q || `${r.name} ${r.sku}`.toLowerCase().includes(q.toLowerCase())));
  const cell = "px-3 py-3 text-right tabular-nums";
  const onExport = () => exportCSV("bao-cao-xuat-nhap-ton-kho", ["Tên kho", "Mã SP", "Tên sản phẩm", "ĐVT", "Đơn giá", "Đầu kỳ SL", "Nhập SL", "Xuất SL", "Cuối kỳ SL"], rows.map(r => [r.store, r.sku, r.name, r.unit, r.price, r.o, r.in, r.out, r.o + r.in - r.out]));
  return /*#__PURE__*/React.createElement("div", {
    className: "space-y-4"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex flex-wrap items-end gap-3 rounded-xl border border-slate-200 bg-white p-3"
  }, /*#__PURE__*/React.createElement(DateRangeFilter, {initFrom:fromDate, initTo:toDate, onApply:(f,t)=>{setFromDate(f);setToDate(t);}}), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: "mb-1 block text-[13px] font-medium text-slate-500"
  }, "Kho"), /*#__PURE__*/React.createElement("select", {
    value: store,
    onChange: e => setStore(e.target.value),
    className: field
  }, ["Tất cả kho", "Kho HH", "Kho TB"].map(s => /*#__PURE__*/React.createElement("option", {
    key: s
  }, s)))), /*#__PURE__*/React.createElement("div", {
    className: "min-w-[200px] flex-1"
  }, /*#__PURE__*/React.createElement("label", {
    className: "mb-1 block text-[13px] font-medium text-slate-500"
  }, "Tìm kiếm"), /*#__PURE__*/React.createElement("input", {
    value: q,
    onChange: e => setQ(e.target.value),
    placeholder: "Nhập mã hoặc tên sản phẩm…",
    className: `${field} w-full`
  })), /*#__PURE__*/React.createElement("div", {className: "flex items-end gap-2 pb-0.5"},
    /*#__PURE__*/React.createElement(PrintBtn, null), /*#__PURE__*/React.createElement(ExportBtn, {
      onClick: onExport
    }))), /*#__PURE__*/React.createElement("div", {
    className: "overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm",
    style: { maxHeight: "calc(100vh - 220px)", overflowY: "auto" }
  }, /*#__PURE__*/React.createElement("table", {
    className: "w-full text-sm",
    style: {
      minWidth: 1100
    }
  }, /*#__PURE__*/React.createElement("thead", {
    style: { position: "sticky", top: 0, zIndex: 10 }
  }, /*#__PURE__*/React.createElement("tr", {
    className: "bg-[#ffedd5] text-xs font-semibold uppercase tracking-wide text-[#7c2d12]"
  }, /*#__PURE__*/React.createElement("th", {
    rowSpan: 2,
    className: "border border-[#fed7aa] px-3 py-2 text-left"
  }, "Kho"), /*#__PURE__*/React.createElement("th", {
    rowSpan: 2,
    className: "border border-[#fed7aa] px-3 py-2 text-left"
  }, "Mã SP"), /*#__PURE__*/React.createElement("th", {
    rowSpan: 2,
    className: "border border-[#fed7aa] px-3 py-2 text-left",
    style: {
      minWidth: 220
    }
  }, "Tên sản phẩm"), /*#__PURE__*/React.createElement("th", {
    rowSpan: 2,
    className: "border border-[#fed7aa] px-3 py-2 text-left"
  }, "ĐVT"), /*#__PURE__*/React.createElement("th", {
    rowSpan: 2,
    className: "border border-[#fed7aa] px-3 py-2 text-right"
  }, "Giá vốn"), /*#__PURE__*/React.createElement("th", {
    colSpan: 2,
    className: "border border-[#fed7aa] bg-[#ffedd5] px-3 py-2 text-center text-[#7c2d12]"
  }, "Đầu kỳ"), /*#__PURE__*/React.createElement("th", {
    colSpan: 2,
    className: "border border-[#fed7aa] bg-[#ffedd5] px-3 py-2 text-center text-[#7c2d12]"
  }, "Nhập kho"), /*#__PURE__*/React.createElement("th", {
    colSpan: 2,
    className: "border border-[#fed7aa] bg-[#ffedd5] px-3 py-2 text-center text-[#7c2d12]"
  }, "Xuất kho"), /*#__PURE__*/React.createElement("th", {
    colSpan: 2,
    className: "border border-[#fed7aa] bg-[#ffedd5] px-3 py-2 text-center text-[#7c2d12]"
  }, "Cuối kỳ")), /*#__PURE__*/React.createElement("tr", {
    className: "bg-[#ffedd5] text-xs font-semibold uppercase tracking-wide text-[#7c2d12]"
  }, [["SL","bg-[#ffedd5]"],["Giá trị","bg-[#ffedd5]"],["SL","bg-[#ffedd5]"],["Giá trị","bg-[#ffedd5]"],["SL","bg-[#ffedd5]"],["Giá trị","bg-[#ffedd5]"],["SL","bg-[#ffedd5]"],["Giá trị","bg-[#ffedd5]"]].map(([h,bg], i) => /*#__PURE__*/React.createElement("th", {
    key: i,
    className: `border border-[#fed7aa] px-3 py-1.5 text-right ${bg}`
  }, h)))), /*#__PURE__*/React.createElement("tbody", {
    className: "divide-y divide-slate-200"
  }, rows.map((r, i) => {
    const end = r.o + r.in - r.out;
    return /*#__PURE__*/React.createElement("tr", {
      key: i,
      className: "hover:bg-slate-50/60"
    }, /*#__PURE__*/React.createElement("td", {
      className: "px-3 py-3 font-medium text-slate-700"
    }, r.store.replace(/^Kho\s+/, "")), /*#__PURE__*/React.createElement("td", {
      className: "border-l border-slate-200 px-3 py-3 text-xs text-slate-500"
    }, /*#__PURE__*/React.createElement(Sku, {
      value: r.sku
    })), /*#__PURE__*/React.createElement("td", {
      className: "border-l border-slate-200 px-3 py-3"
    }, /*#__PURE__*/React.createElement("button", {
      onClick: () => setDetail(r),
      className: "text-left text-[#92400e] underline-offset-2 hover:underline"
    }, r.name)), /*#__PURE__*/React.createElement("td", {
      className: "border-l border-slate-200 px-3 py-3 text-slate-500"
    }, r.unit), /*#__PURE__*/React.createElement("td", {
      className: cell + " border-l border-slate-200 text-slate-700"
    }, num(r.price)), /*#__PURE__*/React.createElement("td", {
      className: cell + " border-l border-slate-200 text-slate-600"
    }, r.o || ""), /*#__PURE__*/React.createElement("td", {
      className: cell + " border-l border-slate-200 text-slate-600"
    }, r.o ? num(r.o * r.price) : ""), /*#__PURE__*/React.createElement("td", {
      className: cell + ` border-l border-slate-200 ${r.in ? "text-[#92400e]" : "text-[#94A3B8]"}`
    }, r.in || ""), /*#__PURE__*/React.createElement("td", {
      className: cell + ` border-l border-slate-200 ${r.in ? "text-[#92400e]" : "text-[#94A3B8]"}`
    }, r.in ? num(r.in * r.price) : ""), /*#__PURE__*/React.createElement("td", {
      className: cell + ` border-l border-slate-200 ${r.out ? "text-[#D97706]" : "text-[#94A3B8]"}`
    }, r.out || ""), /*#__PURE__*/React.createElement("td", {
      className: cell + ` border-l border-slate-200 ${r.out ? "text-[#D97706]" : "text-[#94A3B8]"}`
    }, r.out ? num(r.out * r.price) : ""), /*#__PURE__*/React.createElement("td", {
      className: cell + ` border-l border-slate-200 ${end > 0 ? "text-[#92400e]" : "text-[#94A3B8]"}`
    }, end || ""), /*#__PURE__*/React.createElement("td", {
      className: cell + ` border-l border-slate-200 ${end > 0 ? "text-[#92400e]" : "text-[#94A3B8]"}`
    }, end ? num(end * r.price) : ""));
  }), (() => {
    const tO    = rows.reduce((s,r)=>s+(r.o||0),0);
    const tOVal = rows.reduce((s,r)=>s+(r.o||0)*r.price,0);
    const tIn   = rows.reduce((s,r)=>s+(r.in||0),0);
    const tInVal= rows.reduce((s,r)=>s+(r.in||0)*r.price,0);
    const tOut  = rows.reduce((s,r)=>s+(r.out||0),0);
    const tOutVal=rows.reduce((s,r)=>s+(r.out||0)*r.price,0);
    const tEnd  = rows.reduce((s,r)=>s+(r.o+r.in-r.out),0);
    const tEndVal=rows.reduce((s,r)=>s+(r.o+r.in-r.out)*r.price,0);
    return /*#__PURE__*/React.createElement("tr", {className:"bg-[#fed7aa]"},
      /*#__PURE__*/React.createElement("td", {className:"border border-[#DDE3E8] px-3 py-2.5 text-center text-xs uppercase text-slate-800", style:{fontWeight:700}, colSpan:5}, "TỔNG CỘNG"),
      /*#__PURE__*/React.createElement("td", {className:cell+" border-l border-[#DDE3E8] text-slate-800", style:{fontWeight:700}}, tO||""),
      /*#__PURE__*/React.createElement("td", {className:cell+" border-l border-[#DDE3E8] text-slate-800", style:{fontWeight:700}}, tOVal?num(tOVal):""),
      /*#__PURE__*/React.createElement("td", {className:cell+" border-l border-[#DDE3E8] text-[#92400e]", style:{fontWeight:700}}, tIn||""),
      /*#__PURE__*/React.createElement("td", {className:cell+" border-l border-[#DDE3E8] text-[#92400e]", style:{fontWeight:700}}, tInVal?num(tInVal):""),
      /*#__PURE__*/React.createElement("td", {className:cell+" border-l border-[#DDE3E8] text-[#b45309]", style:{fontWeight:700}}, tOut||""),
      /*#__PURE__*/React.createElement("td", {className:cell+" border-l border-[#DDE3E8] text-[#b45309]", style:{fontWeight:700}}, tOutVal?num(tOutVal):""),
      /*#__PURE__*/React.createElement("td", {className:cell+" border-l border-[#DDE3E8] text-[#92400e]", style:{fontWeight:700}}, tEnd||""),
      /*#__PURE__*/React.createElement("td", {className:cell+" border-l border-[#DDE3E8] text-[#92400e]", style:{fontWeight:700}}, tEndVal?num(tEndVal):""));
  })()
  ))), detail && /*#__PURE__*/React.createElement(StockDetailModal, {
    row: detail,
    onClose: () => setDetail(null)
  }));
}

/* ───────── Upload ảnh lên Firebase Storage ───────── */
function ImageUploader({ sku, value, onChange }) {
  const [uploading, setUploading] = React.useState(false);
  const handleFile = async ev => {
    const file = ev.target.files && ev.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const safeSku = (sku || 'product_' + Date.now()).replace(/[\/\\]/g, '__');
      const ext = file.name.split('.').pop() || 'jpg';
      const path = `products/${safeSku}.${ext}`;
      const fileRef = storageRef(storage, path);
      await uploadBytes(fileRef, file);
      const url = await getDownloadURL(fileRef);
      onChange(url);
    } catch(e) {
      alert('Lỗi upload ảnh: ' + e.message);
    }
    setUploading(false);
  };
  return React.createElement("div", { className: "space-y-2" },
    React.createElement("div", { className: "flex items-center gap-3" },
      React.createElement("label", {
        className: "inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600 hover:bg-slate-100"
      },
        uploading
          ? React.createElement("span", null, "Đang upload...")
          : React.createElement(React.Fragment, null,
              React.createElement(Upload, { className: "h-4 w-4" }),
              " Chọn ảnh từ máy"
            ),
        React.createElement("input", {
          type: "file", accept: "image/*",
          className: "hidden",
          disabled: uploading,
          onChange: handleFile
        })
      ),
      value && React.createElement("button", {
        type: "button",
        onClick: () => onChange(""),
        className: "text-xs text-slate-400 hover:text-red-500"
      }, "Xoá ảnh")
    ),
    React.createElement("input", {
      type: "text",
      placeholder: "Hoặc dán URL ảnh...",
      value: value || "",
      onChange: ev => onChange(ev.target.value),
      className: "block w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"
    }),
    value && React.createElement("img", {
      src: value, alt: "preview",
      className: "h-24 w-24 rounded-lg border border-slate-200 object-cover",
      onError: ev => { ev.target.style.display = 'none'; }
    })
  );
}

/* ───────── Products (form thêm/sửa theo Ảnh 3 & 4) ───────── */
const UNITS = ["Cái", "Bộ", "Chiếc", "Hộp", "Thùng", "Mét", "Cặp"];
const CATS = ["Bồn cầu", "Vòi lavabo", "Sen tắm", "Chậu rửa", "Tiểu nam", "Bếp từ", "Lò nướng", "Hút mùi", "Phụ kiện"];
function ProductForm({
  initial,
  presetName,
  onClose,
  onSave,
  existingNames = [],
  existingSkus = []
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
  const dupName = f.name.trim() &&
    !(isEdit && f.name.trim().toLowerCase() === (e.name || "").trim().toLowerCase()) &&
    existingNames.includes(f.name.trim().toLowerCase());
  const dupSku  = f.sku.trim()  && existingSkus.includes(f.sku.trim().toLowerCase());
  const can = f.sku.trim() && f.name.trim() && f.unit && !dupName && !dupSku;
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
    className: "text-[#B91C1C]"
  }, "*")), /*#__PURE__*/React.createElement(React.Fragment, null,
      /*#__PURE__*/React.createElement("input", {
        className: inputF + (dupSku ? " border-rose-400 ring-1 ring-rose-400" : ""),
        value: f.sku,
        onChange: ev => set({sku: ev.target.value})
      }),
      dupSku && /*#__PURE__*/React.createElement("p", {
        className: "mt-1 flex items-center gap-1 text-xs text-[#B91C1C]"
      }, /*#__PURE__*/React.createElement(AlertTriangle, {className: "h-3.5 w-3.5 shrink-0"}), "Mã sản phẩm đã tồn tại, vui lòng nhập mã khác"))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: "mb-1 block text-sm font-medium text-slate-700"
  }, "Tên sản phẩm ", /*#__PURE__*/React.createElement("span", {
    className: "text-[#B91C1C]"
  }, "*")), /*#__PURE__*/React.createElement("input", {
    className: inputF + (dupName ? " border-rose-400 ring-1 ring-rose-400" : ""),
    value: f.name,
    onChange: ev => set({name: ev.target.value})
  }), dupName && /*#__PURE__*/React.createElement("p", {
    className: "mt-1 flex items-center gap-1 text-xs text-[#B91C1C]"
  }, /*#__PURE__*/React.createElement(AlertTriangle, {className: "h-3.5 w-3.5 shrink-0"}), "Tên sản phẩm đã tồn tại, vui lòng nhập tên khác")), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
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
    className: "text-[#B91C1C]"
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
  }, "Hình ảnh"), /*#__PURE__*/React.createElement(ImageUploader, {
    sku: f.sku,
    value: f.img,
    onChange: url => set({ img: url })
  }))));
}
function ProductsTab() {
  const notify = useToast();
  const [itemsFS, prodsLoaded, prodsError] = useCollection("products");
  const items = itemsFS;
  const toFsId = sku => sku.replace(/\//g, "__");
  // Seed Firestore lần đầu nếu còn trống
  useEffect(() => {
    if (prodsLoaded && !prodsError && itemsFS.length === 0) {
      const toId = sku => sku.replace(/\//g, "__");
      batchSave("products", PRODUCTS.map(p => ({...p, _id: toId(p.sku)})), p => p._id).catch(console.error);
    }
  }, [prodsLoaded, prodsError]);
  const [q, setQ] = useState("");
  const [form, setForm] = useState(null); // {} new | product edit
  const [perPage, setPerPage] = useState(50);
  const [page, setPage] = useState(1);
  const prevQ = React.useRef(q);
  const rows = useMemo(() => {
    if (prevQ.current !== q) {
      setPage(1);
      prevQ.current = q;
    }
    return items.filter(p => !q || `${p.name} ${p.sku}`.toLowerCase().includes(q.toLowerCase()));
  }, [items, q]);
  const totalPages = Math.ceil(rows.length / perPage);
  const pageRows = rows.slice((page - 1) * perPage, page * perPage);
  const pageNums = () => {
    if (totalPages <= 7) return Array.from({length: totalPages}, (_, i) => i + 1);
    if (page <= 4) return [1, 2, 3, 4, 5, "...", totalPages];
    if (page >= totalPages - 3) return [1, "...", totalPages-4, totalPages-3, totalPages-2, totalPages-1, totalPages];
    return [1, "...", page-1, page, page+1, "...", totalPages];
  };
  const tag = n => n === 0 ? "bg-rose-50 text-[#B91C1C]" : n <= 5 ? "bg-amber-50 text-amber-600" : "bg-emerald-50 text-[#92400e]";
  const save = async f => {
    const savedForm = form;
    setForm(null);
    if (savedForm && savedForm.sku) {
      // Dùng _id thực tế của Firestore document, không tính lại từ sku
      const docId = savedForm._id || toFsId(savedForm.sku);
      await saveDoc("products", docId, { ...savedForm, ...f })
        .then(() => notify("Đã cập nhật sản phẩm"))
        .catch(e => { console.error(e); notify("Lỗi lưu sản phẩm: " + (e.message || e.code || "Lỗi kết nối")); });
    } else {
      await saveDoc("products", toFsId(f.sku), f)
        .then(() => notify("Đã thêm sản phẩm"))
        .catch(e => { console.error(e); notify("Lỗi lưu sản phẩm: " + (e.message || e.code || "Lỗi kết nối")); });
    }
  };
  const del = _id => {
    deleteDocument("products", _id)
      .then(() => notify("Đã xoá sản phẩm"))
      .catch(e => { console.error(e); notify("Lỗi xoá sản phẩm: " + (e.message || e.code || "Lỗi kết nối")); });
  };
  const [deduping, setDeduping] = React.useState(false);
  const [dedupClean, setDedupClean] = React.useState(false);
  const cleanupDuplicates = async () => {
    setDeduping(true);
    const toFsId2 = sku => sku.replace(/\//g, "__");
    const bySkuMap = {};
    for (const p of itemsFS) {
      if (!p.sku) continue; // bỏ qua doc không có sku
      if (!bySkuMap[p.sku]) bySkuMap[p.sku] = [];
      bySkuMap[p.sku].push(p);
    }
    let deleted = 0;
    for (const [sku, group] of Object.entries(bySkuMap)) {
      if (group.length <= 1) continue;
      const canonical = toFsId2(sku);
      const keep = group.find(p => p._id === canonical) || group[0];
      for (const p of group) {
        if (p._id === keep._id) continue;
        await deleteDocument("products", p._id).catch(console.error);
        deleted++;
      }
    }
    setDeduping(false);
    setDedupClean(true); // ẩn nút sau khi đã chạy
    notify(deleted > 0 ? `Đã xóa ${deleted} bản sao thừa` : "Không có bản sao thừa");
  };
  const hasDuplicates = React.useMemo(() => {
    setDedupClean(false); // reset khi itemsFS thay đổi
    const seen = new Set();
    return itemsFS.some(p => {
      if (!p.sku) return false; // bỏ qua doc không có sku
      if (seen.has(p.sku)) return true;
      seen.add(p.sku);
      return false;
    });
  }, [itemsFS]);
  const onExport = () => exportCSV("danh-sach-san-pham", ["Mã SP", "Tên sản phẩm", "Mô tả", "ĐVT", "Niêm yết", "Giá bán", "Tồn"], rows.map(p => [p.sku, p.name, p.desc, p.unit, p.list, p.sale, p.stock]));
  if (!prodsLoaded) return /*#__PURE__*/React.createElement("div", {className: "flex items-center justify-center py-16 text-slate-400 text-sm gap-2"},
    /*#__PURE__*/React.createElement("svg", {className: "animate-spin h-5 w-5", viewBox: "0 0 24 24", fill: "none"},
      /*#__PURE__*/React.createElement("circle", {className: "opacity-25", cx: "12", cy: "12", r: "10", stroke: "currentColor", strokeWidth: "4"}),
      /*#__PURE__*/React.createElement("path", {className: "opacity-75", fill: "currentColor", d: "M4 12a8 8 0 018-8v8z"})),
    "Đang tải danh sách sản phẩm…");
  if (prodsError) return /*#__PURE__*/React.createElement("div", {className: "rounded-xl border border-red-200 bg-red-50 p-6 text-center"},
    /*#__PURE__*/React.createElement("p", {className: "font-semibold text-red-700 mb-1"}, "Không thể tải danh sách sản phẩm"),
    /*#__PURE__*/React.createElement("p", {className: "text-sm text-red-600"}, prodsError),
    /*#__PURE__*/React.createElement("p", {className: "mt-2 text-xs text-slate-500"}, "Kiểm tra Firestore Rules tại Firebase Console → Firestore Database → Rules"));
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
  })), /*#__PURE__*/React.createElement("span", {
    className: "text-xs text-slate-400"
  }, rows.length, " sản phẩm"), /*#__PURE__*/React.createElement("div", {
    className: "ml-auto flex gap-2"
  }, (hasDuplicates && !dedupClean) && /*#__PURE__*/React.createElement("button", {
    onClick: cleanupDuplicates,
    disabled: deduping,
    className: "inline-flex items-center gap-1.5 rounded-lg border border-rose-300 bg-rose-50 px-3 py-1.5 text-sm font-medium text-rose-700 hover:bg-rose-100 disabled:opacity-50"
  }, deduping ? "Đang dọn…" : "Xóa bản sao thừa"), q && /*#__PURE__*/React.createElement("button", {
    onClick: () => setQ(""),
    className: ghostBtn
  }, /*#__PURE__*/React.createElement(ArrowLeft, {className: "h-4 w-4"}), " Quay lại"), /*#__PURE__*/React.createElement(ExportBtn, {
    onClick: onExport
  }), /*#__PURE__*/React.createElement("button", {
    onClick: () => setForm({}),
    className: addBtn
  }, /*#__PURE__*/React.createElement(Plus, {
    className: "h-4 w-4"
  }), " Thêm sản phẩm mới"))), /*#__PURE__*/React.createElement(TableShell, {
    minW: "1000px",
    head: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(Th, {
      center: true,
      style: {
        width: 70
      }
    }, "Hình ảnh"), /*#__PURE__*/React.createElement(Th, {
      style: {
        width: 240
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
  }, pageRows.length === 0
    ? /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("td", {colSpan: 9, className: "py-12 text-center text-sm text-slate-400"}, q ? `Không tìm thấy sản phẩm khớp "${q}"` : "Chưa có sản phẩm nào. Nhấn \"Thêm sản phẩm mới\" để bắt đầu."))
    : pageRows.map(p => /*#__PURE__*/React.createElement("tr", {
    key: p.sku,
    className: "align-top hover:bg-slate-50/60"
  }, /*#__PURE__*/React.createElement("td", {
    className: "px-3 py-3"
  }, p.img
    ? /*#__PURE__*/React.createElement("img", {src: p.img, alt: p.name, className: "mx-auto h-12 w-12 rounded-lg border border-slate-200 object-cover"})
    : /*#__PURE__*/React.createElement("div", {className: "mx-auto flex h-12 w-12 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-300"},
        /*#__PURE__*/React.createElement(ImageIcon, {className: "h-5 w-5"}))), /*#__PURE__*/React.createElement("td", {
    className: "px-3 py-3 text-[13px] font-medium text-slate-700 max-w-[130px] overflow-hidden"
  }, /*#__PURE__*/React.createElement("div", {className: "truncate"}, /*#__PURE__*/React.createElement(Sku, {
    value: p.sku
  }))), /*#__PURE__*/React.createElement("td", {
    className: "px-3 py-3 text-slate-800 max-w-[260px] overflow-hidden"
  }, /*#__PURE__*/React.createElement("div", {className: "truncate", title: p.name}, p.name)), /*#__PURE__*/React.createElement("td", {
    className: "px-3 py-3 text-xs text-slate-500",
    style: {
      maxWidth: 280
    }
  }, p.desc), /*#__PURE__*/React.createElement("td", {
    className: "px-3 py-3 text-slate-500 max-w-[70px] overflow-hidden"
  }, /*#__PURE__*/React.createElement("div", {className: "truncate"}, p.unit)), /*#__PURE__*/React.createElement("td", {
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
    className: "flex items-center justify-center gap-1"
  }, /*#__PURE__*/React.createElement(React.Fragment, null,
      /*#__PURE__*/React.createElement(IconBtn, {
        icon: Pencil,
        title: "Sửa",
        onClick: () => setForm(p)
      }),
      /*#__PURE__*/React.createElement(IconBtn, {
        tone: "danger",
        icon: Trash2,
        title: "Xoá",
        onClick: () => del(p._id)
      }))))))),
  totalPages > 1 && /*#__PURE__*/React.createElement("div", {className: "flex items-center justify-between gap-3 pt-2 flex-wrap"},
    /*#__PURE__*/React.createElement("select", {
      value: perPage,
      onChange: e => { setPerPage(Number(e.target.value)); setPage(1); },
      className: `${field} text-sm`
    },
      [50, 100].map(n => /*#__PURE__*/React.createElement("option", {key: n, value: n}, n, " bản ghi trên 1 trang"))
    ),
    /*#__PURE__*/React.createElement("div", {className: "flex items-center gap-1"},
      /*#__PURE__*/React.createElement("button", {
        disabled: page === 1,
        onClick: () => setPage(p => Math.max(1, p - 1)),
        className: "rounded px-2 py-1 text-sm text-slate-600 hover:bg-slate-100 disabled:opacity-30"
      }, "Trước"),
      pageNums().map((n, i) => n === "..." ?
        /*#__PURE__*/React.createElement("span", {key: `e${i}`, className: "px-1 text-slate-400"}, "...") :
        /*#__PURE__*/React.createElement("button", {
          key: n,
          onClick: () => setPage(n),
          className: `min-w-[2rem] rounded px-2 py-1 text-sm font-medium ${page === n ? "bg-[#92400e] text-white" : "text-slate-600 hover:bg-slate-100"}`
        }, n)
      ),
      /*#__PURE__*/React.createElement("button", {
        disabled: page === totalPages,
        onClick: () => setPage(p => Math.min(totalPages, p + 1)),
        className: "rounded px-2 py-1 text-sm text-slate-600 hover:bg-slate-100 disabled:opacity-30"
      }, "Sau")
    )
  ),
  form && /*#__PURE__*/React.createElement(ProductForm, {
    initial: form.sku ? form : null,
    onClose: () => setForm(null),
    onSave: save,
    existingNames: items.filter(p => !form.sku || p.sku !== form.sku).map(p => p.name.toLowerCase()),
    existingSkus: items.filter(p => !form.sku || p.sku !== form.sku).map(p => p.sku.toLowerCase())
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
      className: backBtn
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
    className: "text-[#B91C1C]"
  }, "*")), /*#__PURE__*/React.createElement("input", {
    className: inputF,
    value: f.name,
    onChange: ev => set({
      name: ev.target.value
    })
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: "mb-1 block text-sm font-medium text-slate-700"
  }, "Số điện thoại ", /*#__PURE__*/React.createElement("span", {
    className: "text-[#B91C1C]"
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
  const [itemsFS, custsLoaded] = useCollection("customers");
  const items = itemsFS;
  // Seed Firestore lần đầu nếu còn trống
  useEffect(() => {
    if (custsLoaded && itemsFS.length === 0) {
      batchSave("customers", CUSTOMERS, c => c.id).catch(console.error);
    }
  }, [custsLoaded]);
  const [src, setSrc] = useState("Tất cả");
  const [tier, setTier] = useState("Tất cả");
  const [form, setForm] = useState(null);
  const rows = items.filter(c => (src === "Tất cả" || c.src === src) && (tier === "Tất cả" || c.tier === tier));
  const save = f => {
    const isEdit = form && form.id;
    const id = isEdit ? form.id : ("KH" + String(Date.now()).slice(-6));
    saveDoc("customers", id, isEdit ? {...form, ...f} : {...f, id})
      .then(() => { notify(isEdit ? "Đã cập nhật khách hàng" : "Đã thêm khách hàng"); setForm(null); })
      .catch(e => { console.error(e); notify("Lỗi lưu khách hàng: " + (e.message || "Lỗi kết nối")); });
  };
  const del = c => {
    if (window.confirm("Xoá khách hàng này?")) {
      deleteDocument("customers", c.id)
        .then(() => notify("Đã xoá khách hàng"))
        .catch(e => { console.error(e); notify("Lỗi xoá khách hàng: " + (e.message || "Lỗi kết nối")); });
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
    }, "Địa chỉ"), /*#__PURE__*/React.createElement(Th, null, "SĐT"), /*#__PURE__*/React.createElement(Th, null, "Nguồn"), /*#__PURE__*/React.createElement(Th, {
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
    className: "px-4 py-3 text-sm text-slate-800"
  }, c.name), /*#__PURE__*/React.createElement("td", {
    className: "px-4 py-3 text-sm text-slate-500"
  }, c.addr || ""), /*#__PURE__*/React.createElement("td", {
    className: "px-4 py-3 text-sm text-slate-500"
  }, /*#__PURE__*/React.createElement(Phone, {
    value: c.phone
  })), /*#__PURE__*/React.createElement("td", {
    className: "px-4 py-3"
  }, /*#__PURE__*/React.createElement(Pill, {
    map: CHANNELS,
    value: c.src
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
    tone: "danger",
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
      className: backBtn
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
    className: "text-[#B91C1C]"
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
  const [payModal, setPayModal] = useState(null);
  const { whInItems = [], setWhInItems } = useInventory() || {};
  const { txns = [], setTxns } = useTxns() || {};
  const lotRemaining = r => { const tot=(r.costNcc+(r.fee||0))*r.qtyIn-(r.returns||[]).reduce((s,x)=>s+(x.amount||0),0); const paid=r.paid||(r.pay==="Đã thanh toán"?tot:0); return Math.max(0,tot-paid); };
  const debtOf = name => whInItems.filter(r=>r.supplier===name).reduce((s,r)=>s+lotRemaining(r),0);
  const nextTxnId = txns.length ? Math.max(...txns.map(t=>Number(t.id)||0))+1 : 1;
  const handlePaySave = t => { setTxns(p=>[t,...p]); setPayModal(null); notify("Đã lưu phiếu chi"); };
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
    }, "Địa chỉ"), /*#__PURE__*/React.createElement(Th, {center:true}, "Dư nợ"), /*#__PURE__*/React.createElement(Th, {
      center: true,
      style: {
        width: 120
      }
    }, "Thao tác"))
  }, items.map((s, i) => { const debt = debtOf(s.name); return /*#__PURE__*/React.createElement("tr", {
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
  }, s.addr || ""), /*#__PURE__*/React.createElement("td", {
    className: "px-4 py-3 text-right tabular-nums " + (debt > 0 ? "text-[#B91C1C]" : "text-slate-400"),
    style: {fontWeight: 700}
  }, debt > 0 ? vnd(debt) : "—"), /*#__PURE__*/React.createElement("td", {
    className: "px-4 py-3"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-center gap-1"
  }, /*#__PURE__*/React.createElement("button", {onClick: () => debt > 0 && setPayModal(s), disabled: debt === 0, className: "inline-flex items-center gap-1 rounded border px-2 py-1 text-xs font-medium " + (debt > 0 ? "border-green-200 bg-green-50 text-[#047857] hover:bg-green-100" : "border-slate-200 bg-slate-50 text-slate-300 cursor-default")}, /*#__PURE__*/React.createElement(Wallet, {className:"h-3 w-3"}), "TT"),
  /*#__PURE__*/React.createElement(IconBtn, {
    icon: Pencil,
    title: "Sửa",
    onClick: () => setForm(s)
  }), /*#__PURE__*/React.createElement(IconBtn, {
    tone: "danger",
    icon: Trash2,
    title: "Xoá",
    onClick: () => del(s)
  })))); })), form && /*#__PURE__*/React.createElement(SupplierForm, {
    initial: form.name ? form : null,
    onClose: () => setForm(null),
    onSave: save
  }), payModal && /*#__PURE__*/React.createElement(PhieuChiModal, {onClose: () => setPayModal(null), initEntity: payModal.name, initKind: "CP Thanh Toán NCC", kinds: ["CP Đặt Cọc NCC","CP Thanh Toán NCC"], initAmount: debtOf(payModal.name), initNote: "Thanh toán NCC - "+payModal.name, nextId: nextTxnId, onSave: handlePaySave}));
}

/* ───────── Công nợ khách hàng (tổng hợp → chi tiết) ───────── */
function DebtCust({ orders = [] }) {
  const [detail, setDetail] = useState(null);
  const [fromDate, setFromDate] = useState(localMonthStart());
  const [toDate, setToDate] = useState(localToday());
  const custDebt = React.useMemo(() => {
    const _pISO = s => { const [y,m,d] = s.split('-'); return new Date(+y,+m-1,+d); };
    const fD = fromDate ? _pISO(fromDate) : null;
    const tD = toDate   ? new Date(_pISO(toDate).setHours(23,59,59,999)) : null;
    const inR = s => { const ms = parseViDate(s); if (!ms) return true; const d = new Date(ms); return (!fD || d >= fD) && (!tD || d <= tD); };
    const active = orders.filter(o => !o.draft && o.orderStatus !== 'Huỷ' && o.orderStatus !== 'Hủy' && inR(o.dt));
    const map = {};
    active.forEach(o => {
      const key = o.phone || o.name;
      if (!map[key]) map[key] = { name: o.name, phone: o.phone, addr: o.addr || '', ps: 0, tt: 0, open: 0, orders: [] };
      if (o.exported || o.deliveryConfirmed) map[key].ps += calc(o).total;
      map[key].tt += o.paid || 0;
      map[key].orders.push(o);
    });
    return Object.values(map).filter(c => c.ps > 0 || c.tt > 0).sort((a,b) => a.name.localeCompare(b.name,'vi'));
  }, [orders, fromDate, toDate]);
  const totals = custDebt.reduce((a,r) => ({ open: a.open+r.open, ps: a.ps+r.ps, tt: a.tt+r.tt }), { open:0, ps:0, tt:0 });
  const closeTotal = totals.open + totals.ps - totals.tt;
  if (detail) return /*#__PURE__*/React.createElement(CustDebtDetail, {
    row: detail,
    onBack: () => setDetail(null)
  });
  const onExport = () => exportCSV("cong-no-khach-hang", ["Tên khách hàng", "Điện thoại", "Dư nợ đầu kỳ", "Phát sinh", "Thanh toán", "Dư nợ cuối kỳ"], custDebt.map(r => [r.name, r.phone, r.open, r.ps, r.tt, r.open + r.ps - r.tt]));
  return /*#__PURE__*/React.createElement("div", {
    className: "space-y-4"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex flex-wrap items-center gap-2"
  }, /*#__PURE__*/React.createElement(DateRangeFilter, {initFrom:fromDate, initTo:toDate, onApply:(f,t)=>{setFromDate(f);setToDate(t);}}), /*#__PURE__*/React.createElement("div", {
    className: "ml-auto flex gap-2"
  }, /*#__PURE__*/React.createElement(PrintBtn, null), /*#__PURE__*/React.createElement(ExportBtn, {
    onClick: onExport
  }))), /*#__PURE__*/React.createElement("div", {
    className: "text-center"
  }, /*#__PURE__*/React.createElement("h2", {
    className: "text-[16px] font-semibold uppercase text-slate-800"
  }, "Báo cáo tổng hợp công nợ khách hàng"), /*#__PURE__*/React.createElement("p", {
    className: "text-sm text-slate-500"
  }, `Từ ngày ${fromDate ? fromDate.split('-').reverse().join('/') : "—"} đến ngày ${toDate ? toDate.split('-').reverse().join('/') : "—"}`)), /*#__PURE__*/React.createElement("div", {
    className: "overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm",
    style: { maxHeight: "calc(100vh - 220px)", overflowY: "auto" }
  }, /*#__PURE__*/React.createElement("table", {
    className: "w-full text-sm",
    style: {
      minWidth: 1060
    }
  }, /*#__PURE__*/React.createElement("thead", {
    style: { position: "sticky", top: 0, zIndex: 10 }
  }, /*#__PURE__*/React.createElement("tr", {
    className: "bg-[#ffedd5] text-xs font-semibold uppercase tracking-wide text-[#7c2d12]"
  }, /*#__PURE__*/React.createElement("th", {
    rowSpan: 2,
    className: "border border-[#fed7aa] px-3 py-2 text-left"
  }, "Tên khách hàng"), /*#__PURE__*/React.createElement("th", {
    rowSpan: 2,
    className: "border border-[#fed7aa] px-3 py-2 text-left"
  }, "Địa chỉ"), /*#__PURE__*/React.createElement("th", {
    rowSpan: 2,
    className: "border border-[#fed7aa] px-3 py-2 text-left"
  }, "Điện thoại"), /*#__PURE__*/React.createElement("th", {
    rowSpan: 2,
    className: "border border-[#fed7aa] px-3 py-2 text-right"
  }, "Số dư nợ đầu kỳ"), /*#__PURE__*/React.createElement("th", {
    colSpan: 2,
    className: "border border-[#fed7aa] px-3 py-2 text-center"
  }, "Phát sinh trong kỳ"), /*#__PURE__*/React.createElement("th", {
    rowSpan: 2,
    className: "border border-[#fed7aa] px-3 py-2 text-right"
  }, "Số dư nợ cuối kỳ")), /*#__PURE__*/React.createElement("tr", {
    className: "bg-[#ffedd5] text-xs font-semibold uppercase tracking-wide text-[#7c2d12]"
  }, /*#__PURE__*/React.createElement("th", {
    className: "border border-[#fed7aa] px-3 py-1.5 text-center"
  }, "Phải TT"), /*#__PURE__*/React.createElement("th", {
    className: "border border-[#fed7aa] px-3 py-1.5 text-center"
  }, "Đã TT"))), /*#__PURE__*/React.createElement("tbody", {
    className: "divide-y divide-slate-100"
  }, custDebt.map((r, i) => {
    const close = r.open + r.ps - r.tt;
    return /*#__PURE__*/React.createElement("tr", {
      key: i,
      className: "hover:bg-slate-50/60"
    }, /*#__PURE__*/React.createElement("td", {
      className: "px-3 py-3"
    }, /*#__PURE__*/React.createElement("button", {
      onClick: () => setDetail(r),
      className: "text-left text-[#92400e] underline-offset-2 hover:underline"
    }, r.name)), /*#__PURE__*/React.createElement("td", {
      className: "border-l border-slate-100 px-3 py-3 text-xs text-slate-500"
    }, r.addr || ""), /*#__PURE__*/React.createElement("td", {
      className: "border-l border-slate-100 px-3 py-3 text-xs text-slate-500"
    }, /*#__PURE__*/React.createElement(Phone, {
      value: r.phone
    })), /*#__PURE__*/React.createElement("td", {
      className: `border-l border-slate-100 px-3 py-3 text-right tabular-nums ${r.open < 0 ? "text-[#B91C1C]" : "text-slate-700"}`
    }, num(r.open)), /*#__PURE__*/React.createElement("td", {
      className: "border-l border-slate-100 px-3 py-3 text-right tabular-nums text-slate-600"
    }, num(r.ps)), /*#__PURE__*/React.createElement("td", {
      className: "border-l border-slate-100 px-3 py-3 text-right tabular-nums text-slate-600"
    }, num(r.tt)), /*#__PURE__*/React.createElement("td", {
      className: `border-l border-slate-100 px-3 py-3 text-right tabular-nums font-semibold ${close < 0 ? "text-[#B91C1C]" : close === 0 ? "text-[#047857]" : "text-[#b45309]"}`
    }, num(close)));
  })), /*#__PURE__*/React.createElement("tfoot", null, /*#__PURE__*/React.createElement("tr", {
    className: "bg-[#fed7aa] font-bold"
  }, /*#__PURE__*/React.createElement("td", {
    colSpan: 3,
    className: "px-3 py-3 text-center text-slate-800", style: {fontWeight:700}
  }, "TỔNG CỘNG"), /*#__PURE__*/React.createElement("td", {
    className: "border-l border-slate-100 px-3 py-3 text-right tabular-nums text-slate-800", style: {fontWeight:700}
  }, num(totals.open)), /*#__PURE__*/React.createElement("td", {
    className: "border-l border-slate-100 px-3 py-3 text-right tabular-nums text-slate-800", style: {fontWeight:700}
  }, num(totals.ps)), /*#__PURE__*/React.createElement("td", {
    className: "border-l border-slate-100 px-3 py-3 text-right tabular-nums text-slate-800", style: {fontWeight:700}
  }, num(totals.tt)), /*#__PURE__*/React.createElement("td", {
    className: "border-l border-slate-100 px-3 py-3 text-right tabular-nums text-slate-800", style: {fontWeight:700}
  }, num(closeTotal)))))));
}
function CustDebtDetail({
  row,
  onBack
}) {
  const detailOrders = (row.orders || []).map(o => {
    const c = calc(o);
    const itemsTotal = (o.items||[]).reduce((s,it)=>s+it.price*it.qty,0);
    const refund = (o.returns||[]).reduce((s,r)=>s+(r.amount||0),0);
    return { id:o.id, date:o.dt, items:(o.items||[]).map(it=>({name:it.name,sku:it.sku||'',qty:it.qty,price:it.price,amount:it.price*it.qty})), payable:c.total, paid:o.paid||0, expense:Math.max(0,c.total-itemsTotal), refund };
  }).filter(o=>o.items.length>0);
  const close = row.open + row.ps - row.tt;
  const totItems  = detailOrders.reduce((s,o)=>s+o.items.reduce((s2,it)=>s2+it.amount,0),0);
  const totRefund = detailOrders.reduce((s,o)=>s+o.refund,0);
  const totExp  = detailOrders.reduce((s,o)=>s+o.expense,0);
  const totPay  = detailOrders.reduce((s,o)=>s+o.payable,0);
  const totPaid = detailOrders.reduce((s,o)=>s+o.paid,0);
  const totDebt = totPay - totPaid;
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
    onClick: () => exportCSV("cong-no-" + row.name, ["Mã đơn", "Ngày", "Sản phẩm", "SL", "Đơn giá", "Tiền hàng", "Phải thanh toán", "Đã thanh toán", "Còn nợ"], detailOrders.flatMap(o => o.items.map(it => [o.id, o.date, it.name, it.qty, it.price, it.price * it.qty, o.payable, o.paid, o.payable - o.paid])))
  }))), /*#__PURE__*/React.createElement(Card, null, /*#__PURE__*/React.createElement("h3", {
    className: "mb-4 text-[16px] font-semibold text-[#92400e]"
  }, "Thông tin khách hàng"), /*#__PURE__*/React.createElement("div", {
    className: "flex flex-wrap gap-x-8 gap-y-1 text-sm"
  }, /*#__PURE__*/React.createElement("p", null, /*#__PURE__*/React.createElement("span", {
    className: "text-slate-500"
  }, "Tên khách hàng:"), " ", /*#__PURE__*/React.createElement("b", {
    className: "text-slate-800"
  }, row.name)), /*#__PURE__*/React.createElement("p", null, /*#__PURE__*/React.createElement("span", {
    className: "text-slate-500"
  }, "Địa chỉ:"), " ", /*#__PURE__*/React.createElement("b", {
    className: "text-slate-800"
  }, row.addr || "")), /*#__PURE__*/React.createElement("p", null, /*#__PURE__*/React.createElement("span", {
    className: "text-slate-500"
  }, "Số điện thoại:"), " ", /*#__PURE__*/React.createElement("b", {
    className: "text-slate-800"
  }, row.phone)), /*#__PURE__*/React.createElement("p", {className: "ml-auto text-right"}, /*#__PURE__*/React.createElement("span", {
    className: "text-slate-500"
  }, "Tổng dư nợ:"), " ", /*#__PURE__*/React.createElement("b", {
    className: "text-[#B91C1C]"
  }, num(close))))), /*#__PURE__*/React.createElement(Card, {
    title: "Bảng kê chi tiết công nợ khách hàng"
  }, detailOrders.length > 0 ? /*#__PURE__*/React.createElement("div", {
    className: "-mx-5 -mb-5 overflow-x-auto",
    style: { maxHeight: "calc(100vh - 280px)", overflowY: "auto" }
  }, /*#__PURE__*/React.createElement("table", {
    className: "w-full text-sm",
    style: {
      minWidth: 1020
    }
  }, /*#__PURE__*/React.createElement("thead", {
    style: { position: "sticky", top: 0, zIndex: 10 }
  }, /*#__PURE__*/React.createElement("tr", {
    className: "border-b border-[#fed7aa] bg-[#ffedd5] text-left text-xs uppercase tracking-wide text-[#7c2d12]"
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
  }, "Hoàn tiền"), /*#__PURE__*/React.createElement("th", {
    className: "px-3 py-2.5 text-right"
  }, "Chi phí"), /*#__PURE__*/React.createElement("th", {
    className: "px-3 py-2.5 text-right"
  }, "Phải thanh toán"), /*#__PURE__*/React.createElement("th", {
    className: "px-3 py-2.5 text-right"
  }, "Đã thanh toán"), /*#__PURE__*/React.createElement("th", {
    className: "px-3 py-2.5 text-right"
  }, "Còn nợ"))), /*#__PURE__*/React.createElement("tbody", {
    className: "divide-y divide-slate-50"
  }, detailOrders.map((o, oi) => {
    const debtO = o.payable - o.paid;
    const td = "px-3 py-3 border-l border-slate-100";
    return o.items.map((it, k) => /*#__PURE__*/React.createElement("tr", {
      key: o.id + k,
      className: (k === 0 && oi > 0) ? "hover:bg-slate-50/60 border-t-2 border-t-slate-300" : "hover:bg-slate-50/60"
    }, k === 0 && /*#__PURE__*/React.createElement("td", {
      rowSpan: o.items.length,
      className: "px-3 py-3 align-top"
    }, /*#__PURE__*/React.createElement("span", {
      className: "inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset bg-[#fef9f0] text-[#92400e] ring-[#b45309]"
    }, o.id), /*#__PURE__*/React.createElement("br", null), /*#__PURE__*/React.createElement("span", {
      className: "text-xs text-slate-400"
    }, o.date)), /*#__PURE__*/React.createElement("td", {
      className: td + " text-slate-800"
    }, it.name, /*#__PURE__*/React.createElement("br", null), /*#__PURE__*/React.createElement("span", {
      className: "text-xs text-slate-400"
    }, it.sku)), /*#__PURE__*/React.createElement("td", {
      className: td + " text-right tabular-nums text-slate-600"
    }, it.qty), /*#__PURE__*/React.createElement("td", {
      className: td + " text-right tabular-nums text-slate-600"
    }, num(it.price)), /*#__PURE__*/React.createElement("td", {
      className: td + " text-right tabular-nums text-slate-700"
    }, num(it.amount)), k === 0 && /*#__PURE__*/React.createElement("td", {
      rowSpan: o.items.length,
      className: td + " text-right align-middle tabular-nums text-[#b45309]"
    }, o.refund > 0 ? num(o.refund) : ""), k === 0 && /*#__PURE__*/React.createElement("td", {
      rowSpan: o.items.length,
      className: td + " text-right align-middle tabular-nums text-slate-600"
    }, num(o.expense)), k === 0 && /*#__PURE__*/React.createElement("td", {
      rowSpan: o.items.length,
      className: td + " text-right align-middle tabular-nums text-slate-700"
    }, num(o.payable)), k === 0 && /*#__PURE__*/React.createElement("td", {
      rowSpan: o.items.length,
      className: td + " text-right align-middle tabular-nums text-[#92400e]"
    }, num(o.paid)), k === 0 && /*#__PURE__*/React.createElement("td", {
      rowSpan: o.items.length,
      className: td + " text-right align-middle font-semibold tabular-nums text-[#B91C1C]"
    }, num(debtO))));
  })), /*#__PURE__*/React.createElement("tfoot", null, /*#__PURE__*/React.createElement("tr", {
    className: "bg-slate-50 font-semibold border-t border-slate-200"
  }, /*#__PURE__*/React.createElement("td", {
    colSpan: 4,
    className: "px-3 py-3 text-right text-slate-500 text-xs uppercase tracking-wide"
  }, "Tổng cộng"), /*#__PURE__*/React.createElement("td", {
    className: "px-3 py-3 text-right tabular-nums border-l border-slate-100 text-slate-700 font-semibold"
  }, num(totItems)), /*#__PURE__*/React.createElement("td", {
    className: "px-3 py-3 text-right tabular-nums border-l border-slate-100 text-[#b45309]"
  }, totRefund > 0 ? num(totRefund) : ""), /*#__PURE__*/React.createElement("td", {
    className: "px-3 py-3 text-right tabular-nums border-l border-slate-100 text-slate-600"
  }, num(totExp)), /*#__PURE__*/React.createElement("td", {
    className: "px-3 py-3 text-right tabular-nums border-l border-slate-100 text-slate-700 font-semibold"
  }, num(totPay)), /*#__PURE__*/React.createElement("td", {
    className: "px-3 py-3 text-right tabular-nums border-l border-slate-100 text-[#92400e] font-semibold"
  }, num(totPaid)), /*#__PURE__*/React.createElement("td", {
    className: "px-3 py-3 text-right tabular-nums border-l border-slate-100 text-[#B91C1C] font-semibold"
  }, num(totDebt)))))) : /*#__PURE__*/React.createElement(Empty, null, "Không có dữ liệu đơn hàng chi tiết cho khách này. Số dư nợ cuối kỳ: ", /*#__PURE__*/React.createElement("b", {
    className: "text-[#B91C1C]"
  }, num(close)))));
}

/* ───────── Công nợ NCC (tổng hợp → chi tiết) ───────── */
function DebtNcc({ purchaseList = [], setPurchaseList, setWhInItems, whInItems = [] }) {
  const [detail, setDetail] = useState(null);
  const [fromDate, setFromDate] = useState(localMonthStart());
  const [toDate, setToDate] = useState(localToday());
  const nccDebt = React.useMemo(() => {
    const _pISO = s => { const [y,m,d] = s.split('-'); return new Date(+y,+m-1,+d); };
    const fD = fromDate ? _pISO(fromDate) : null;
    const tD = toDate   ? new Date(_pISO(toDate).setHours(23,59,59,999)) : null;
    const inR = s => { const ms = parseViDate(s); if (!ms) return true; const d = new Date(ms); return (!fD || d >= fD) && (!tD || d <= tD); };
    const map = {};
    // Dùng whInItems làm nguồn duy nhất; join purchaseList để lấy paid/returns
    const plMap = {};
    purchaseList.forEach(r => { plMap[r.lot + "__" + r.prod] = r; });
    whInItems.filter(r => r.supplier && inR(r.date)).forEach(r => {
      const key = r.supplier;
      if (!map[key]) { const sup = SUPPLIERS.find(s=>s.name===key); map[key] = { name:key, open: sup?.open||0, ps:0, tt:0, lots:[] }; }
      const pl = plMap[r.lot + "__" + r.prod];
      const total = (r.qtyIn||0)*(r.costNcc||0)+(r.fee||0);
      const returnAmt = (pl?.returns||[]).reduce((s,x)=>s+(x.amount||0),0);
      map[key].ps += total - returnAmt;
      map[key].tt += pl ? (pl.paid||0) : (r.pay==="Đã thanh toán" ? total : 0);
      map[key].lots.push(pl ? {...r, ...pl} : r);
    });
    return Object.values(map).filter(s=>s.ps>0).sort((a,b)=>a.name.localeCompare(b.name,'vi'));
  }, [purchaseList, whInItems, fromDate, toDate]);
  if (detail) return /*#__PURE__*/React.createElement(NccDebtDetail, {
    sup: detail,
    purchaseList,
    setPurchaseList,
    setWhInItems,
    onBack: () => setDetail(null)
  });
  const onExport = () => exportCSV("cong-no-nha-cung-cap", ["Tên nhà cung cấp", "Dư nợ đầu kỳ", "Phát sinh", "Thanh toán", "Dư nợ cuối kỳ"], nccDebt.map(s => [s.name, s.open, s.ps, s.tt, s.open + s.ps - s.tt]));
  return /*#__PURE__*/React.createElement("div", {
    className: "space-y-4"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex flex-wrap items-center gap-2"
  }, /*#__PURE__*/React.createElement(DateRangeFilter, {initFrom:fromDate, initTo:toDate, onApply:(f,t)=>{setFromDate(f);setToDate(t);}}), /*#__PURE__*/React.createElement("select", {
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
    className: "text-[16px] font-semibold uppercase text-slate-800"
  }, "Báo cáo tổng hợp công nợ nhà cung cấp"), /*#__PURE__*/React.createElement("p", {
    className: "text-sm text-slate-500"
  }, `Từ ngày ${fromDate ? fromDate.split('-').reverse().join('/') : "—"} đến ngày ${toDate ? toDate.split('-').reverse().join('/') : "—"}`)), /*#__PURE__*/React.createElement("div", {
    className: "overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm",
    style: { maxHeight: "calc(100vh - 220px)", overflowY: "auto" }
  }, /*#__PURE__*/React.createElement("table", {
    className: "w-full text-sm",
    style: {
      minWidth: 760
    }
  }, /*#__PURE__*/React.createElement("thead", {
    style: { position: "sticky", top: 0, zIndex: 10 }
  }, /*#__PURE__*/React.createElement("tr", {
    className: "bg-[#ffedd5] text-xs font-semibold uppercase tracking-wide text-[#7c2d12]"
  }, /*#__PURE__*/React.createElement("th", {
    rowSpan: 2,
    className: "border border-[#fed7aa] px-3 py-2 text-left"
  }, "Tên nhà cung cấp"), /*#__PURE__*/React.createElement("th", {
    rowSpan: 2,
    className: "border border-[#fed7aa] px-3 py-2 text-right"
  }, "Số dư nợ đầu kỳ"), /*#__PURE__*/React.createElement("th", {
    colSpan: 2,
    className: "border border-[#fed7aa] px-3 py-2 text-center"
  }, "Phát sinh trong kỳ"), /*#__PURE__*/React.createElement("th", {
    rowSpan: 2,
    className: "border border-[#fed7aa] px-3 py-2 text-right"
  }, "Số dư nợ cuối kỳ")), /*#__PURE__*/React.createElement("tr", {
    className: "bg-[#ffedd5] text-xs font-semibold uppercase tracking-wide text-[#7c2d12]"
  }, /*#__PURE__*/React.createElement("th", {
    className: "border border-[#fed7aa] px-3 py-1.5 text-right"
  }, "Số phát sinh"), /*#__PURE__*/React.createElement("th", {
    className: "border border-[#fed7aa] px-3 py-1.5 text-right"
  }, "Thanh toán"))), /*#__PURE__*/React.createElement("tbody", {
    className: "divide-y divide-slate-100"
  }, nccDebt.map((s, i) => {
    const close = s.open + s.ps - s.tt;
    return /*#__PURE__*/React.createElement("tr", {
      key: i,
      className: "hover:bg-slate-50/60"
    }, /*#__PURE__*/React.createElement("td", {
      className: "px-3 py-3"
    }, /*#__PURE__*/React.createElement("button", {
      onClick: () => setDetail(s),
      className: "text-left text-[#92400e] underline-offset-2 hover:underline"
    }, s.name)), /*#__PURE__*/React.createElement("td", {
      className: "border-l border-slate-100 px-3 py-3 text-right tabular-nums text-slate-700"
    }, num(s.open)), /*#__PURE__*/React.createElement("td", {
      className: "border-l border-slate-100 px-3 py-3 text-right tabular-nums text-slate-600"
    }, num(s.ps)), /*#__PURE__*/React.createElement("td", {
      className: "border-l border-slate-100 px-3 py-3 text-right tabular-nums text-slate-600"
    }, num(s.tt)), /*#__PURE__*/React.createElement("td", {
      className: `border-l border-slate-100 px-3 py-3 text-right tabular-nums font-semibold ${close < 0 ? "text-[#B91C1C]" : close === 0 ? "text-[#047857]" : "text-[#b45309]"}`
    }, num(close)));
  })), /*#__PURE__*/React.createElement("tfoot", null, /*#__PURE__*/React.createElement("tr", {
    className: "bg-[#fed7aa]"
  }, /*#__PURE__*/React.createElement("td", {
    className: "px-3 py-3 text-center text-slate-800", style: {fontWeight:700}
  }, "TỔNG CỘNG"), /*#__PURE__*/React.createElement("td", {
    className: "border-l border-slate-100 px-3 py-3 text-right tabular-nums text-slate-800", style:{fontWeight:700}
  }, num(nccDebt.reduce((s,x)=>s+x.open,0))), /*#__PURE__*/React.createElement("td", {
    className: "border-l border-slate-100 px-3 py-3 text-right tabular-nums text-slate-800", style:{fontWeight:700}
  }, num(nccDebt.reduce((s,x)=>s+x.ps,0))), /*#__PURE__*/React.createElement("td", {
    className: "border-l border-slate-100 px-3 py-3 text-right tabular-nums text-slate-800", style:{fontWeight:700}
  }, num(nccDebt.reduce((s,x)=>s+x.tt,0))), /*#__PURE__*/React.createElement("td", {
    className: "border-l border-slate-100 px-3 py-3 text-right tabular-nums text-slate-800", style:{fontWeight:700}
  }, num(nccDebt.reduce((s,x)=>s+(x.open+x.ps-x.tt),0))))))));
}
function NccReturnModal({lot, prod, costNcc, onClose, onSave}) {
  const today = () => { const d=new Date(); return `${String(d.getDate()).padStart(2,"0")}/${String(d.getMonth()+1).padStart(2,"0")}/${d.getFullYear()}`; };
  const [qty, setQty] = useState(1);
  const [amount, setAmount] = useState(costNcc||0);
  const [note, setNote] = useState("");
  return /*#__PURE__*/React.createElement(Modal, {title:"Hoàn hàng NCC", onClose, maxW:"max-w-md",
    footer:/*#__PURE__*/React.createElement(React.Fragment,null,
      /*#__PURE__*/React.createElement("button",{onClick:onClose,className:ghostBtn},"Hủy"),
      /*#__PURE__*/React.createElement("button",{onClick:()=>onSave({qty,amount,date:today(),note}),disabled:qty<=0||amount<=0,className:blueBtn+(qty>0&&amount>0?"":" opacity-50 cursor-not-allowed")},"Xác nhận hoàn"))},
    /*#__PURE__*/React.createElement("div",{className:"space-y-3 text-sm"},
      /*#__PURE__*/React.createElement("p",null,/*#__PURE__*/React.createElement("span",{className:"text-slate-500"},"Sản phẩm: "),/*#__PURE__*/React.createElement("b",null,prod)),
      /*#__PURE__*/React.createElement("div",{className:"grid grid-cols-2 gap-3"},
        /*#__PURE__*/React.createElement("div",null,
          /*#__PURE__*/React.createElement("label",{className:"mb-1 block text-xs font-medium text-slate-500"},"Số lượng hoàn"),
          /*#__PURE__*/React.createElement(NumInput,{value:qty,onChange:setQty,className:"w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-[#fed7aa] focus:outline-none"})),
        /*#__PURE__*/React.createElement("div",null,
          /*#__PURE__*/React.createElement("label",{className:"mb-1 block text-xs font-medium text-slate-500"},"Số tiền hoàn"),
          /*#__PURE__*/React.createElement(NumInput,{value:amount,onChange:setAmount,className:"w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-[#fed7aa] focus:outline-none"}))),
      /*#__PURE__*/React.createElement("div",null,
        /*#__PURE__*/React.createElement("label",{className:"mb-1 block text-xs font-medium text-slate-500"},"Ghi chú"),
        /*#__PURE__*/React.createElement("input",{value:note,onChange:e=>setNote(e.target.value),placeholder:"Lý do hoàn...",className:"w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-[#fed7aa] focus:outline-none"})))
  );
}

function NccDebtDetail({
  sup,
  purchaseList,
  setPurchaseList,
  setWhInItems,
  onBack
}) {
  const lots = sup.lots || [];
  const close = (sup.open||0) + (sup.ps||0) - (sup.tt||0);
  const [returnModal, setReturnModal] = useState(null);
  const onReturn = lot => {
    const rec = (purchaseList||[]).find(r => r.lot === lot.lot && r.prod === lot.prod);
    if (!rec) return;
    setReturnModal(rec);
  };
  const doReturn = (rec, ret) => {
    if (!setPurchaseList) return;
    setPurchaseList(xs => xs.map(r => (r.lot===rec.lot&&r.prod===rec.prod) ? {...r, returns:[...(r.returns||[]),ret]} : r));
    if (setWhInItems) {
      setWhInItems(xs => xs.map(r => (r.lot===rec.lot&&r.prod===rec.prod)
        ? {...r, qtyRemaining: Math.max(0,(r.qtyRemaining??r.qtyNow??0)-ret.qty), qtyNow: Math.max(0,(r.qtyNow??0)-ret.qty)}
        : r));
    }
    setReturnModal(null);
  };
  return /*#__PURE__*/React.createElement("div", {
    className: "space-y-4"
  }, /*#__PURE__*/React.createElement("button", {
    onClick: onBack,
    className: "inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800"
  }, /*#__PURE__*/React.createElement(ArrowLeft, {
    className: "h-4 w-4"
  }), " Quay lại báo cáo tổng hợp"), /*#__PURE__*/React.createElement(Card, null, /*#__PURE__*/React.createElement("h3", {
    className: "mb-4 text-[16px] font-semibold text-[#92400e]"
  }, "Thông tin nhà cung cấp"), /*#__PURE__*/React.createElement("div", {
    className: "flex flex-wrap gap-x-8 gap-y-1 text-sm"
  }, /*#__PURE__*/React.createElement("p", null, /*#__PURE__*/React.createElement("span", {
    className: "text-slate-500"
  }, "Tên nhà cung cấp:"), " ", /*#__PURE__*/React.createElement("b", {
    className: "text-slate-800"
  }, sup.name)), /*#__PURE__*/React.createElement("p", {className: "ml-auto text-right"}, /*#__PURE__*/React.createElement("span", {
    className: "text-slate-500"
  }, "Tổng dư nợ:"), " ", /*#__PURE__*/React.createElement("b", {
    className: "text-[#B91C1C]"
  }, num(close))))), /*#__PURE__*/React.createElement(Card, {
    title: "Bảng kê chi tiết lô hàng"
  }, lots.length ? /*#__PURE__*/React.createElement("div", {
    className: "-mx-5 -mb-5 overflow-x-auto",
    style: { maxHeight: "calc(100vh - 280px)", overflowY: "auto" }
  }, /*#__PURE__*/React.createElement("table", {
    className: "w-full text-sm",
    style: {
      minWidth: 1000
    }
  }, /*#__PURE__*/React.createElement("thead", {
    style: { position: "sticky", top: 0, zIndex: 10 }
  }, /*#__PURE__*/React.createElement("tr", {
    className: "border-b border-[#fed7aa] bg-[#ffedd5] text-left text-xs uppercase tracking-wide text-[#7c2d12]"
  }, /*#__PURE__*/React.createElement("th", {
    className: "px-3 py-2.5"
  }, "Ngày nhập"), /*#__PURE__*/React.createElement("th", {
    className: "px-3 py-2.5"
  }, "Số phiếu nhập"), /*#__PURE__*/React.createElement("th", {
    className: "px-3 py-2.5"
  }, "Sản phẩm"), /*#__PURE__*/React.createElement("th", {
    className: "px-3 py-2.5 text-right"
  }, "SL"), /*#__PURE__*/React.createElement("th", {
    className: "px-3 py-2.5 text-right"
  }, "Đơn giá"), /*#__PURE__*/React.createElement("th", {
    className: "px-3 py-2.5 text-right"
  }, "Tiền hàng"), /*#__PURE__*/React.createElement("th", {
    className: "px-3 py-2.5 text-right"
  }, "Hoàn hàng"), /*#__PURE__*/React.createElement("th", {
    className: "px-3 py-2.5 text-right"
  }, "Chi phí"), /*#__PURE__*/React.createElement("th", {
    className: "px-3 py-2.5 text-right"
  }, "Phải thanh toán"), /*#__PURE__*/React.createElement("th", {
    className: "px-3 py-2.5 text-right"
  }, "Đã thanh toán"), /*#__PURE__*/React.createElement("th", {
    className: "px-3 py-2.5 text-right"
  }, "Còn nợ"), /*#__PURE__*/React.createElement("th", {
    className: "px-3 py-2.5"
  }, ""))), /*#__PURE__*/React.createElement("tbody", {
    className: "divide-y divide-slate-50"
  }, lots.map((l, li) => {
    const tienHang = (l.qtyIn||0)*(l.costNcc||0);
    const chiPhi = l.fee||0;
    const returnAmt = (l.returns||[]).reduce((s,x)=>s+(x.amount||0),0);
    const tot = tienHang + chiPhi - returnAmt;
    const paidAmt = (l.paid != null) ? (l.paid||0) : (l.pay==="Đã thanh toán" ? tienHang+chiPhi : 0);
    const con = tot - paidAmt;
    const td = "px-3 py-3 border-l border-slate-100";
    return /*#__PURE__*/React.createElement("tr", {
      key: li,
      className: "hover:bg-slate-50/60"
    }, /*#__PURE__*/React.createElement("td", {
      className: "px-3 py-3 text-slate-500 whitespace-nowrap"
    }, l.date), /*#__PURE__*/React.createElement("td", {
      className: "px-3 py-3"
    }, /*#__PURE__*/React.createElement("span", {className: "inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset bg-[#fef9f0] text-[#92400e] ring-[#b45309]"}, impCode(l.slip||l.lot))), /*#__PURE__*/React.createElement("td", {
      className: td + " text-slate-800"
    }, l.prod), /*#__PURE__*/React.createElement("td", {
      className: td + " text-right tabular-nums text-slate-600"
    }, l.qtyIn||0), /*#__PURE__*/React.createElement("td", {
      className: td + " text-right tabular-nums text-slate-600"
    }, num(l.costNcc)), /*#__PURE__*/React.createElement("td", {
      className: td + " text-right tabular-nums text-slate-700 font-medium"
    }, num(tienHang)), /*#__PURE__*/React.createElement("td", {
      className: td + " text-right tabular-nums text-[#b45309]"
    }, returnAmt > 0 ? num(returnAmt) : ""), /*#__PURE__*/React.createElement("td", {
      className: td + " text-right tabular-nums text-slate-600"
    }, chiPhi > 0 ? num(chiPhi) : ""), /*#__PURE__*/React.createElement("td", {
      className: td + " text-right tabular-nums text-slate-700 font-semibold"
    }, num(tot)), /*#__PURE__*/React.createElement("td", {
      className: td + " text-right tabular-nums text-[#92400e] font-semibold"
    }, paidAmt > 0 ? num(paidAmt) : ""), /*#__PURE__*/React.createElement("td", {
      className: td + " text-right tabular-nums font-semibold " + (con > 0 ? "text-[#B91C1C]" : "text-slate-400")
    }, num(con)||"0"), /*#__PURE__*/React.createElement("td", {
      className: "px-3 py-3 border-l border-slate-100"
    })
  )
  })), /*#__PURE__*/React.createElement("tfoot", null, /*#__PURE__*/React.createElement("tr", {
    className: "bg-slate-50 font-semibold border-t border-slate-200"
  }, /*#__PURE__*/React.createElement("td", {
    colSpan: 5,
    className: "px-3 py-3 text-right text-slate-500 text-xs uppercase tracking-wide"
  }, "Tổng cộng"), /*#__PURE__*/React.createElement("td", {
    className: "px-3 py-3 text-right tabular-nums border-l border-slate-100 text-slate-700 font-semibold"
  }, num(lots.reduce((s,l)=>(l.qtyIn||0)*(l.costNcc||0)+s,0))), /*#__PURE__*/React.createElement("td", {
    className: "px-3 py-3 text-right tabular-nums border-l border-slate-100 text-[#b45309]"
  }, lots.reduce((s,l)=>s+(l.returns||[]).reduce((r,x)=>r+(x.amount||0),0),0)>0 ? num(lots.reduce((s,l)=>s+(l.returns||[]).reduce((r,x)=>r+(x.amount||0),0),0)) : ""), /*#__PURE__*/React.createElement("td", {
    className: "px-3 py-3 text-right tabular-nums border-l border-slate-100 text-slate-600"
  }, lots.reduce((s,l)=>s+(l.fee||0),0)>0 ? num(lots.reduce((s,l)=>s+(l.fee||0),0)) : ""), /*#__PURE__*/React.createElement("td", {
    className: "px-3 py-3 text-right tabular-nums border-l border-slate-100 text-slate-700 font-semibold"
  }, num(lots.reduce((s,l)=>{ const rA=(l.returns||[]).reduce((r,x)=>r+(x.amount||0),0); return s+(l.qtyIn||0)*(l.costNcc||0)+(l.fee||0)-rA; },0))), /*#__PURE__*/React.createElement("td", {
    className: "px-3 py-3 text-right tabular-nums border-l border-slate-100 text-[#92400e] font-semibold"
  }, num(lots.reduce((s,l)=>{ const t=(l.qtyIn||0)*(l.costNcc||0)+(l.fee||0); return s+((l.paid!=null)?(l.paid||0):(l.pay==="Đã thanh toán"?t:0)); },0))), /*#__PURE__*/React.createElement("td", {
    className: "px-3 py-3 text-right tabular-nums border-l border-slate-100 text-[#B91C1C] font-semibold"
  }, num(lots.reduce((s,l)=>{ const rA=(l.returns||[]).reduce((r,x)=>r+(x.amount||0),0); const t=(l.qtyIn||0)*(l.costNcc||0)+(l.fee||0)-rA; const p=(l.paid!=null)?(l.paid||0):(l.pay==="Đã thanh toán"?(l.qtyIn||0)*(l.costNcc||0)+(l.fee||0):0); return s+t-p; },0))), /*#__PURE__*/React.createElement("td", null))), returnModal && /*#__PURE__*/React.createElement(NccReturnModal, {lot:returnModal.lot, prod:returnModal.prod, costNcc:returnModal.costNcc||0, onClose:()=>setReturnModal(null), onSave:ret=>doReturn(returnModal,ret)}))) : /*#__PURE__*/React.createElement(Empty, null, "Không có dữ liệu lô hàng chi tiết. Tổng dư nợ cuối kỳ: ", /*#__PURE__*/React.createElement("b", {
    className: "text-[#B91C1C]"
  }, num(sup.open)))));
}

/* ───────── Finance ───────── */
function HuyGiaoDichModal({onClose, onConfirm}) {
  const [reason, setReason] = useState("");
  const canConfirm = reason.trim().length > 0;
  return /*#__PURE__*/React.createElement(Modal, {title:"Huỷ giao dịch", onClose, maxW:"max-w-sm",
    footer: /*#__PURE__*/React.createElement(React.Fragment, null,
      /*#__PURE__*/React.createElement("button", {onClick:onClose, className:ghostBtn}, "Đóng"),
      /*#__PURE__*/React.createElement("button", {onClick:()=>onConfirm(reason.trim()), disabled:!canConfirm, className:"rounded-lg px-4 py-2 text-sm font-semibold bg-red-600 text-white hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed"}, "Xác nhận huỷ"))},
    /*#__PURE__*/React.createElement("div", {className:"space-y-3"},
      /*#__PURE__*/React.createElement("p", {className:"text-sm text-slate-600"}, "Giao dịch bị huỷ sẽ không tính vào thu/chi nhưng vẫn lưu lại để tra cứu."),
      /*#__PURE__*/React.createElement("div", null,
        /*#__PURE__*/React.createElement("label", {className:"mb-1 block text-[13px] font-medium text-slate-500"}, "Lý do huỷ ", /*#__PURE__*/React.createElement("span", {className:"text-[#B91C1C]"}, "*")),
        /*#__PURE__*/React.createElement("input", {autoFocus:true, value:reason, onChange:e=>setReason(e.target.value), placeholder:"Nhập lý do...", className:inputF}))));
}

function PhieuThuModal({onClose, onSave, nextId}) {
  const { profile: _thuProfile } = useAuth();
  const _staffName = _thuProfile?.name || "Quản lý";
  const {bankAccounts} = useBankAccounts();
  const { txnKinds: _thuKinds } = useTxnKinds() || {};
  const thuKindList = _thuKinds?.thuKinds?.length ? _thuKinds.thuKinds : DEFAULT_THU_KINDS;
  const activeAccs = bankAccounts.filter(a => a.status === "Hoạt động");
  const [acc, setAcc]       = useState(activeAccs[0]?.key || "");
  const [entity, setEntity] = useState("");
  const [orderId, setOrderId] = useState("");
  const [kind, setKind]     = useState(thuKindList[0] || "Đặt cọc");
  const [amount, setAmount] = useState(0);
  const [note, setNote]     = useState("");
  const canSave = entity.trim() && amount > 0;
  const errMsg = !entity.trim() ? "Vui lòng nhập tên đối tượng" : amount <= 0 ? "Vui lòng nhập số tiền lớn hơn 0" : null;
  const now = () => { const d = new Date(); return d.toLocaleDateString('vi-VN') + " " + d.toLocaleTimeString('vi-VN',{hour:'2-digit',minute:'2-digit'}); };
  const doSave = () => onSave({id:nextId,date:now(),entity,orderId,kind,acc,amount,note,staff:_staffName});
  const lbl = "mb-1 block text-[13px] font-medium text-slate-500";
  return /*#__PURE__*/React.createElement(Modal, {title:"Lập phiếu thu",onClose,maxW:"max-w-lg",
    footer:/*#__PURE__*/React.createElement(React.Fragment,null,
      errMsg && /*#__PURE__*/React.createElement("span",{className:"text-xs text-[#B91C1C] mr-auto"},"⚠ "+errMsg),
      /*#__PURE__*/React.createElement("button",{onClick:onClose,className:ghostBtn},"Hủy"),
      /*#__PURE__*/React.createElement("button",{onClick:doSave,disabled:!canSave,className:blueBtn+(canSave?"":" opacity-50 cursor-not-allowed")},"Lưu phiếu thu"))},
    /*#__PURE__*/React.createElement("div",{className:"grid grid-cols-2 gap-3"},
      /*#__PURE__*/React.createElement("div",null,/*#__PURE__*/React.createElement("label",{className:lbl},"Tài khoản"),
        /*#__PURE__*/React.createElement("select",{value:acc,onChange:e=>setAcc(e.target.value),className:inputF},
          activeAccs.map(a=>/*#__PURE__*/React.createElement("option",{key:a.key,value:a.key},a.bank+" ("+a.account+")")))),
      /*#__PURE__*/React.createElement("div",null,/*#__PURE__*/React.createElement("label",{className:lbl},"Loại thu"),
        /*#__PURE__*/React.createElement("select",{value:kind,onChange:e=>setKind(e.target.value),className:inputF},
          thuKindList.map(k=>/*#__PURE__*/React.createElement("option",{key:k},k)))),
      /*#__PURE__*/React.createElement("div",null,/*#__PURE__*/React.createElement("label",{className:lbl},"Đối tượng ",/*#__PURE__*/React.createElement("span",{className:"text-[#B91C1C]"},"*")),
        /*#__PURE__*/React.createElement("input",{value:entity,onChange:e=>setEntity(e.target.value),placeholder:"Tên khách hàng...",className:inputF})),
      /*#__PURE__*/React.createElement("div",null,/*#__PURE__*/React.createElement("label",{className:lbl},"Số đơn hàng"),
        /*#__PURE__*/React.createElement("input",{value:orderId,onChange:e=>setOrderId(e.target.value),placeholder:"DH...",className:inputF})),
      /*#__PURE__*/React.createElement("div",null,/*#__PURE__*/React.createElement("label",{className:lbl},"Số tiền (đ) ",/*#__PURE__*/React.createElement("span",{className:"text-[#B91C1C]"},"*")),
        /*#__PURE__*/React.createElement(NumInput,{className:inputF,value:amount,onChange:setAmount})),
      /*#__PURE__*/React.createElement("div",null,/*#__PURE__*/React.createElement("label",{className:lbl},"Nội dung"),
        /*#__PURE__*/React.createElement("input",{value:note,onChange:e=>setNote(e.target.value),placeholder:"Nội dung...",className:inputF}))));
}
function PhieuChiModal({onClose, onSave, nextId, initEntity="", initOrderId="", initKind="Chi phí", initAmount=0, initNote="", kinds=null, initAcc=null}) {
  const { profile: _chiProfile } = useAuth();
  const _staffName = _chiProfile?.name || "Quản lý";
  const {bankAccounts} = useBankAccounts();
  const { txnKinds: _chiKinds } = useTxnKinds() || {};
  const chiKindList = kinds || (_chiKinds?.chiKinds?.length ? _chiKinds.chiKinds : DEFAULT_CHI_KINDS);
  const {txns = []} = useTxns() || {};
  const activeAccs = bankAccounts.filter(a => a.status === "Hoạt động");
  const [acc, setAcc]       = useState(initAcc || activeAccs[0]?.key || "");
  const [entity, setEntity] = useState(initEntity);
  const [orderId, setOrderId] = useState(initOrderId);
  const resolvedInitKind = kinds && !kinds.includes(initKind) ? kinds[0] : initKind;
  const [kind, setKind]     = useState(resolvedInitKind);
  const [amount, setAmount] = useState(initAmount);
  const [note, setNote]     = useState(initNote);
  React.useEffect(() => {
    if (kinds) {
      const verb = kind === "CP Đặt Cọc NCC" ? "Đặt cọc" : "Thanh toán";
      setNote(n => verb + n.replace(/^(Đặt cọc|Thanh toán)/, ""));
    }
  }, [kind]);
  const accObj = bankAccounts.find(a => a.key === acc);
  const accTxns = txns.filter(t => t.acc === acc && !t.cancelled);
  const curBal = (accObj?.openBal||0) + accTxns.filter(t=>t.amount>0).reduce((s,t)=>s+t.amount,0) - accTxns.filter(t=>t.amount<0).reduce((s,t)=>s+Math.abs(t.amount),0);
  const afterBal = curBal - amount;
  const canSave = entity.trim() && amount > 0 && afterBal >= 0;
  const errMsgChi = !entity.trim() ? "Vui lòng nhập tên đối tượng" : amount <= 0 ? "Vui lòng nhập số tiền lớn hơn 0" : afterBal < 0 ? "Số dư tài khoản không đủ để thực hiện" : null;
  const now = () => { const d = new Date(); return d.toLocaleDateString('vi-VN') + " " + d.toLocaleTimeString('vi-VN',{hour:'2-digit',minute:'2-digit'}); };
  const doSave = () => onSave({id:nextId,date:now(),entity,orderId,kind,acc,amount:-amount,note,staff:_staffName});
  const lbl = "mb-1 block text-[13px] font-medium text-slate-500";
  return /*#__PURE__*/React.createElement(Modal, {title:"Lập phiếu chi",onClose,maxW:"max-w-lg",
    footer:/*#__PURE__*/React.createElement(React.Fragment,null,
      errMsgChi && /*#__PURE__*/React.createElement("span",{className:"text-xs text-[#B91C1C] mr-auto"},"⚠ "+errMsgChi),
      /*#__PURE__*/React.createElement("button",{onClick:onClose,className:ghostBtn},"Hủy"),
      /*#__PURE__*/React.createElement("button",{onClick:doSave,disabled:!canSave,className:"inline-flex items-center gap-1.5 rounded-lg bg-[#92400e] px-3.5 py-2 text-sm font-semibold text-white hover:bg-[#78350f] disabled:opacity-50"},"Lưu phiếu chi"))},
    /*#__PURE__*/React.createElement("div",{className:"grid grid-cols-2 gap-3"},
      /*#__PURE__*/React.createElement("div",null,/*#__PURE__*/React.createElement("label",{className:lbl},"Tài khoản"),
        /*#__PURE__*/React.createElement("select",{value:acc,onChange:e=>setAcc(e.target.value),className:inputF},
          activeAccs.map(a=>/*#__PURE__*/React.createElement("option",{key:a.key,value:a.key},a.bank+" ("+a.account+")"))),
        /*#__PURE__*/React.createElement("div",{className:"mt-1 flex items-center justify-between text-xs"},
          /*#__PURE__*/React.createElement("span",{className:"text-slate-400"},"Số dư hiện tại:"),
          /*#__PURE__*/React.createElement("span",{className:"font-semibold "+(curBal<0?"text-[#B91C1C]":"text-[#047857]")},vnd(curBal)+"đ")),
        amount>0&&/*#__PURE__*/React.createElement("div",{className:"mt-0.5 flex items-center justify-between text-xs"},
          /*#__PURE__*/React.createElement("span",{className:"text-slate-400"},"Sau khi chi:"),
          /*#__PURE__*/React.createElement("span",{className:"font-semibold "+(afterBal<0?"text-[#B91C1C]":"text-slate-600")},vnd(afterBal)+"đ",afterBal<0&&" ⚠ Không đủ số dư!"))),
      /*#__PURE__*/React.createElement("div",null,/*#__PURE__*/React.createElement("label",{className:lbl},"Loại chi"),
        /*#__PURE__*/React.createElement("select",{value:kind,onChange:e=>setKind(e.target.value),className:inputF},
          chiKindList.map(k=>/*#__PURE__*/React.createElement("option",{key:k},k)))),
      /*#__PURE__*/React.createElement("div",null,/*#__PURE__*/React.createElement("label",{className:lbl},"Đối tượng ",/*#__PURE__*/React.createElement("span",{className:"text-[#B91C1C]"},"*")),
        /*#__PURE__*/React.createElement("input",{value:entity,onChange:e=>setEntity(e.target.value),placeholder:"Tên đối tượng...",className:inputF})),
      /*#__PURE__*/React.createElement("div",null,/*#__PURE__*/React.createElement("label",{className:lbl},"Số đơn hàng"),
        /*#__PURE__*/React.createElement("input",{value:orderId,onChange:e=>setOrderId(e.target.value),placeholder:"DH...",className:inputF})),
      /*#__PURE__*/React.createElement("div",null,/*#__PURE__*/React.createElement("label",{className:lbl},"Số tiền (đ) ",/*#__PURE__*/React.createElement("span",{className:"text-[#B91C1C]"},"*")),
        /*#__PURE__*/React.createElement(NumInput,{className:inputF,value:amount,onChange:setAmount})),
      /*#__PURE__*/React.createElement("div",null,/*#__PURE__*/React.createElement("label",{className:lbl},"Nội dung"),
        /*#__PURE__*/React.createElement("input",{value:note,onChange:e=>setNote(e.target.value),placeholder:"Nội dung...",className:inputF}))));
}
function ChuyenTienModal({onClose, onSave, nextId}) {
  const { profile: _ctProfile } = useAuth();
  const _staffName = _ctProfile?.name || "Quản lý";
  const {bankAccounts} = useBankAccounts();
  const activeAccs = bankAccounts.filter(a => a.status === "Hoạt động");
  const [from, setFrom]   = useState(activeAccs[0]?.key || "");
  const [to, setTo]       = useState(activeAccs[1]?.key || "");
  const [amount, setAmount] = useState(0);
  const [note, setNote]   = useState("");
  const canSave = from !== to && amount > 0;
  const now = () => { const d = new Date(); return d.toLocaleDateString('vi-VN') + " " + d.toLocaleTimeString('vi-VN',{hour:'2-digit',minute:'2-digit'}); };
  const doSave = () => {
    const dt = now();
    onSave([
      {id:nextId,   date:dt,entity:"Chuyển nội bộ",orderId:"",kind:"Chuyển đi", acc:from,amount:-amount,note:note||("Chuyển sang "+to),staff:_staffName},
      {id:nextId+1, date:dt,entity:"Chuyển nội bộ",orderId:"",kind:"Chuyển về", acc:to,  amount:amount, note:note||("Nhận từ "+from),  staff:_staffName},
    ]);
  };
  const lbl = "mb-1 block text-[13px] font-medium text-slate-500";
  return /*#__PURE__*/React.createElement(Modal, {title:"Chuyển tiền nội bộ",onClose,maxW:"max-w-md",
    footer:/*#__PURE__*/React.createElement(React.Fragment,null,
      /*#__PURE__*/React.createElement("button",{onClick:onClose,className:ghostBtn},"Hủy"),
      /*#__PURE__*/React.createElement("button",{onClick:doSave,disabled:!canSave,className:blueBtn+(canSave?"":" opacity-50 cursor-not-allowed")},"Xác nhận chuyển"))},
    /*#__PURE__*/React.createElement("div",{className:"space-y-3"},
      /*#__PURE__*/React.createElement("div",{className:"grid grid-cols-2 gap-3"},
        /*#__PURE__*/React.createElement("div",null,/*#__PURE__*/React.createElement("label",{className:lbl},"Tài khoản nguồn"),
          /*#__PURE__*/React.createElement("select",{value:from,onChange:e=>setFrom(e.target.value),className:inputF},
            activeAccs.map(a=>/*#__PURE__*/React.createElement("option",{key:a.key,value:a.key},a.bank)))),
        /*#__PURE__*/React.createElement("div",null,/*#__PURE__*/React.createElement("label",{className:lbl},"Tài khoản đích"),
          /*#__PURE__*/React.createElement("select",{value:to,onChange:e=>setTo(e.target.value),className:inputF},
            activeAccs.filter(a=>a.key!==from).map(a=>/*#__PURE__*/React.createElement("option",{key:a.key,value:a.key},a.bank))))),
      /*#__PURE__*/React.createElement("div",null,/*#__PURE__*/React.createElement("label",{className:lbl},"Số tiền (đ) *"),
        /*#__PURE__*/React.createElement(NumInput,{className:inputF,value:amount,onChange:setAmount})),
      /*#__PURE__*/React.createElement("div",null,/*#__PURE__*/React.createElement("label",{className:lbl},"Ghi chú"),
        /*#__PURE__*/React.createElement("input",{value:note,onChange:e=>setNote(e.target.value),placeholder:"Lý do chuyển...",className:inputF})),
      from===to&&/*#__PURE__*/React.createElement("p",{className:"text-xs text-[#B91C1C]"},"Tài khoản nguồn và đích không được trùng nhau")));
}
function EditTxnModal({txn, onClose, onSave}) {
  const {bankAccounts} = useBankAccounts();
  const [acc, setAcc]         = useState(txn.acc);
  const [entity, setEntity]   = useState(txn.entity);
  const [orderId, setOrderId] = useState(txn.orderId||"");
  const [kind, setKind]       = useState(txn.kind);
  const [rawAmt, setRawAmt]   = useState(Math.abs(txn.amount));
  const [note, setNote]       = useState(txn.note||"");
  const isOut   = txn.amount < 0;
  const canSave = entity.trim() && rawAmt > 0;
  const lbl     = "mb-1 block text-[13px] font-medium text-slate-500";
  const ALL_KINDS = ["Đặt cọc","Thanh toán","CPVC Nhập Hàng","CP Đặt Cọc NCC","CP Thanh Toán NCC","CP Ship ĐH","CP Lắp Đặt","CP Hoàn Hàng","CP Thuê Nhà","CP Tiền Điện","CP Tiền Nước","CP Vận Hành","CP Hoa Hồng","Chi phí <200k","Hoàn tiền KH","Hoàn ứng","Chuyển đi","Chuyển về"];
  const doSave  = () => onSave({...txn, acc, entity, orderId, kind, amount: isOut ? -rawAmt : rawAmt, note});
  return /*#__PURE__*/React.createElement(Modal, {title:"Sửa giao dịch #"+txn.id, onClose, maxW:"max-w-lg",
    footer:/*#__PURE__*/React.createElement(React.Fragment, null,
      /*#__PURE__*/React.createElement("button",{onClick:onClose,className:ghostBtn},"Hủy"),
      /*#__PURE__*/React.createElement("button",{onClick:doSave,disabled:!canSave,className:blueBtn+(canSave?"":" opacity-50 cursor-not-allowed")},"Lưu thay đổi"))},
    /*#__PURE__*/React.createElement("div",{className:"grid grid-cols-2 gap-3"},
      /*#__PURE__*/React.createElement("div",null,/*#__PURE__*/React.createElement("label",{className:lbl},"Tài khoản"),
        /*#__PURE__*/React.createElement("select",{value:acc,onChange:e=>setAcc(e.target.value),className:inputF},
          bankAccounts.map(a=>/*#__PURE__*/React.createElement("option",{key:a.key,value:a.key},a.bank+" ("+a.account+")")))),
      /*#__PURE__*/React.createElement("div",null,/*#__PURE__*/React.createElement("label",{className:lbl},"Loại GD"),
        /*#__PURE__*/React.createElement("select",{value:kind,onChange:e=>setKind(e.target.value),className:inputF},
          ALL_KINDS.map(k=>/*#__PURE__*/React.createElement("option",{key:k},k)))),
      /*#__PURE__*/React.createElement("div",null,/*#__PURE__*/React.createElement("label",{className:lbl},"Đối tượng"),
        /*#__PURE__*/React.createElement("input",{value:entity,onChange:e=>setEntity(e.target.value),className:inputF})),
      /*#__PURE__*/React.createElement("div",null,/*#__PURE__*/React.createElement("label",{className:lbl},"Mã đơn liên quan"),
        /*#__PURE__*/React.createElement("input",{value:orderId,onChange:e=>setOrderId(e.target.value),placeholder:"DH...",className:inputF})),
      /*#__PURE__*/React.createElement("div",null,/*#__PURE__*/React.createElement("label",{className:lbl},"Số tiền"),
        /*#__PURE__*/React.createElement(NumInput,{className:inputF,value:rawAmt,onChange:setRawAmt})),
      /*#__PURE__*/React.createElement("div",null,/*#__PURE__*/React.createElement("label",{className:lbl},"Ghi chú"),
        /*#__PURE__*/React.createElement("input",{value:note,onChange:e=>setNote(e.target.value),className:inputF}))));
}
/* ───────── Đối chiếu sao kê tự động ───────── */
function ReconcileBtn({ txns, setTxns, orders }) {
  const [busy, setBusy] = React.useState(false);
  const [result, setResult] = React.useState(null);

  const parseDate = s => {
    if (!s) return null;
    const p = s.split(' ')[0].split('/');
    return p.length === 3 ? new Date(+p[2], +p[1]-1, +p[0]) : null;
  };

  const doReconcile = async () => {
    setBusy(true); setResult(null);
    // Chỉ xét giao dịch ngân hàng THU chưa có orderId
    const bankTxns = txns.filter(t => t.bankImport && t.amount > 0 && !t.orderId);
    // Chỉ xét đơn hàng có tiền thanh toán
    const paidOrders = (orders || []).filter(o => o.paid > 0);

    let linked = 0, ambiguous = 0;
    const updates = {};

    for (const order of paidOrders) {
      const orderDate = parseDate(order.dt);
      if (!orderDate) continue;
      const matches = bankTxns.filter(t => {
        if (updates[t.id]) return false; // đã được link
        const txnDate = parseDate(t.date);
        if (!txnDate) return false;
        const diffDays = Math.abs((txnDate - orderDate) / 86400000);
        return t.amount === order.paid && diffDays <= 3;
      });
      if (matches.length === 1) {
        updates[matches[0].id] = order.id;
        linked++;
      } else if (matches.length > 1) {
        ambiguous++;
      }
    }

    if (linked > 0) {
      setTxns(p => p.map(t => updates[t.id] ? { ...t, orderId: updates[t.id] } : t));
    }
    setResult({ linked, ambiguous, total: bankTxns.length });
    setBusy(false);
  };

  return React.createElement("div", { className: "flex items-center gap-2" },
    React.createElement("button", {
      onClick: doReconcile, disabled: busy,
      className: "inline-flex items-center gap-1.5 rounded-lg border border-amber-300 bg-amber-50 px-3 py-1.5 text-sm font-medium text-amber-800 hover:bg-amber-100 disabled:opacity-50"
    }, busy ? "Đang đối chiếu..." : "Đối chiếu tự động"),
    result && React.createElement("span", { className: "text-xs text-slate-500" },
      `Khớp: ${result.linked} | Nhiều khả năng: ${result.ambiguous} | Chưa khớp: ${result.total - result.linked - result.ambiguous}`
    )
  );
}

function DeliverySlipModal({ data, onClose }) {
  if (!data) return null;
  const { seq, date, pxSlip, items, custName, custPhone, custAddr, orderId } = data;
  const total = items.reduce((s, it) => s + it.price * it.qty, 0);
  return /*#__PURE__*/React.createElement(Modal, {
    title: `Phiếu giao hàng lần ${seq} — ${orderId}`,
    maxW: "max-w-xl",
    onClose,
    footer: /*#__PURE__*/React.createElement(React.Fragment, null,
      /*#__PURE__*/React.createElement(PrintBtn, null),
      /*#__PURE__*/React.createElement("button", {onClick: onClose, className: "rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50"}, "Đóng"))
  },
    /*#__PURE__*/React.createElement("div", {className: "space-y-4 text-sm"},
      /*#__PURE__*/React.createElement("div", {className: "grid grid-cols-2 gap-y-1.5 text-xs"},
        /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", {className: "text-slate-500"}, "Số phiếu: "), /*#__PURE__*/React.createElement("span", {className: "font-semibold text-[#92400e]"}, pxSlip)),
        /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", {className: "text-slate-500"}, "Ngày giao: "), /*#__PURE__*/React.createElement("span", {className: "font-medium"}, date)),
        /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", {className: "text-slate-500"}, "Đơn hàng: "), /*#__PURE__*/React.createElement("span", {className: "font-medium"}, orderId)),
        /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", {className: "text-slate-500"}, "Lần giao: "), /*#__PURE__*/React.createElement("span", {className: "font-semibold text-amber-700"}, "Lần " + seq)),
        /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", {className: "text-slate-500"}, "Khách hàng: "), /*#__PURE__*/React.createElement("span", {className: "font-medium"}, custName)),
        /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", {className: "text-slate-500"}, "SĐT: "), /*#__PURE__*/React.createElement("span", {className: "font-medium"}, custPhone)),
        custAddr && /*#__PURE__*/React.createElement("div", {className: "col-span-2"}, /*#__PURE__*/React.createElement("span", {className: "text-slate-500"}, "Địa chỉ: "), /*#__PURE__*/React.createElement("span", {className: "font-medium"}, custAddr))),
      /*#__PURE__*/React.createElement("table", {className: "w-full border-collapse text-xs"},
        /*#__PURE__*/React.createElement("thead", null,
          /*#__PURE__*/React.createElement("tr", {className: "bg-[#ffedd5] text-[#7c2d12]"},
            /*#__PURE__*/React.createElement("th", {className: "py-2 px-3 text-left font-semibold"}, "Sản phẩm"),
            /*#__PURE__*/React.createElement("th", {className: "py-2 px-3 text-center font-semibold w-12"}, "SL"),
            /*#__PURE__*/React.createElement("th", {className: "py-2 px-3 text-right font-semibold w-24"}, "Đơn giá"),
            /*#__PURE__*/React.createElement("th", {className: "py-2 px-3 text-right font-semibold w-28"}, "Thành tiền"))),
        /*#__PURE__*/React.createElement("tbody", null,
          items.map((it, i) =>
            /*#__PURE__*/React.createElement("tr", {key: i, className: "border-b border-slate-100"},
              /*#__PURE__*/React.createElement("td", {className: "py-2 px-3 text-slate-800"}, it.name),
              /*#__PURE__*/React.createElement("td", {className: "py-2 px-3 text-center tabular-nums"}, it.qty),
              /*#__PURE__*/React.createElement("td", {className: "py-2 px-3 text-right tabular-nums"}, vnd(it.price)),
              /*#__PURE__*/React.createElement("td", {className: "py-2 px-3 text-right tabular-nums font-medium"}, vnd(it.price * it.qty)))))),
      /*#__PURE__*/React.createElement("div", {className: "flex items-center justify-between rounded-lg bg-[#ffedd5] px-4 py-2.5"},
        /*#__PURE__*/React.createElement("span", {className: "font-semibold text-[#7c2d12]"}, "Tổng lần giao này"),
        /*#__PURE__*/React.createElement("span", {className: "text-lg font-bold tabular-nums text-[#92400e]"}, vnd(total)))));
}

function Finance({setActive, onOpenOrder}) {
  const notify = useToast();
  const { profile } = useAuth();
  const isAdmin = profile?.role === "admin";
  const [finTab, setFinTab] = React.useState("cty");
  const patOnly = isAdmin && finTab === "pat";
  const {bankAccounts} = useBankAccounts();
  const activeAccs = bankAccounts.filter(a => a.status === "Hoạt động" && (patOnly ? a.key === "TCB-PAT" : a.key !== "TCB-PAT"));
  const {txns, setTxns}       = useTxns();
  const [orders]              = useCollection("orders");
  const [q, setQ]             = useState("");
  const [fromDate, setFromDate] = useState(localMonthStart);
  const [toDate, setToDate]   = useState(localToday);
  const [fAcc, setFAcc]       = useState("Tất cả");
  const [fDir, setFDir]       = useState("Tất cả");
  const [fAccDetail, setFAccDetail] = useState(null);
  const [modal, setModal]     = useState(null);
  const [cancelTarget, setCancelTarget] = useState(null);
  const [editTxn, setEditTxn] = useState(null);
  const [txnPage, setTxnPage] = useState(1);
  const [detailPage, setDetailPage] = useState(1);
  const [dFromDate, setDFromDate] = useState(localMonthStart);
  const [dToDate, setDToDate]     = useState(localToday);
  const [dQ, setDQ]               = useState("");
  const [dDir, setDDir]           = useState("Tất cả");
  const [fKind, setFKind]         = useState("Tất cả");
  const [dKind, setDKind]         = useState("Tất cả");
  const nextId = txns.length ? Math.max(...txns.map(t=>Number(t.id)||0))+1 : 1;
  React.useEffect(() => { setTxnPage(1); }, [q, fromDate, toDate, fAcc, fDir, fKind]);
  React.useEffect(() => { setDetailPage(1); setDFromDate(localMonthStart); setDToDate(localToday); setDQ(""); setDDir("Tất cả"); setDKind("Tất cả"); }, [fAccDetail]);

  const parseD    = s => { const p=s.split(' ')[0].split('/'); return new Date(+p[2],+p[1]-1,+p[0]); };
  const parseISO  = s => { const [y,m,d]=s.split('-'); return new Date(+y,+m-1,+d); };
  const fromD = fromDate ? parseISO(fromDate) : null;
  const toD   = toDate   ? parseISO(toDate)   : null;
  const normalizeKind = t => {
    if (patOnly && t.amount < 0 && Math.abs(t.amount) < 500000) return "CP cá nhân <500k";
    return t.kind;
  };

  const visibleTxns = txns.filter(t => {
    if (patOnly ? t.acc !== "TCB-PAT" : t.acc === "TCB-PAT") return false;
    const d = parseD(t.date);
    if (fromD && d < fromD) return false;
    if (toD   && d > toD)   return false;
    if (fAcc !== "Tất cả" && t.acc !== fAcc) return false;
    if (fDir === "Thu" && t.amount <= 0) return false;
    if (fDir === "Chi" && t.amount >= 0) return false;
    if (fKind !== "Tất cả" && normalizeKind(t) !== fKind) return false;
    if (q && !`${t.id} ${t.orderId} ${t.note} ${t.entity}`.toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  }).sort((a, b) => { const da = parseD(a.date), db = parseD(b.date); return da - db !== 0 ? db - da : b.id - a.id; });

  const { txnKinds } = useTxnKinds() || {};
  const baseTxns = txns.filter(t => !t.cancelled && (patOnly ? t.acc === "TCB-PAT" : t.acc !== "TCB-PAT"));
  const configThu = txnKinds?.thuKinds?.length ? txnKinds.thuKinds : DEFAULT_THU_KINDS;
  const configChi = txnKinds?.chiKinds?.length ? txnKinds.chiKinds : DEFAULT_CHI_KINDS;
  const allThuKinds = [...new Set([...configThu, ...baseTxns.filter(t=>t.amount>0).map(t=>normalizeKind(t)).filter(Boolean)])];
  const allChiKinds = [...new Set([...configChi, ...baseTxns.filter(t=>t.amount<0).map(t=>normalizeKind(t)).filter(Boolean)])];

  const TXN_PER_PAGE = 25;
  const totalTxnPages = Math.ceil(visibleTxns.length / TXN_PER_PAGE);
  const pagedTxns = visibleTxns.slice((txnPage - 1) * TXN_PER_PAGE, txnPage * TXN_PER_PAGE);
  const txnPageNums = () => {
    if (totalTxnPages <= 7) return Array.from({length: totalTxnPages}, (_, i) => i + 1);
    if (txnPage <= 4) return [1, 2, 3, 4, 5, "...", totalTxnPages];
    if (txnPage >= totalTxnPages - 3) return [1, "...", totalTxnPages-4, totalTxnPages-3, totalTxnPages-2, totalTxnPages-1, totalTxnPages];
    return [1, "...", txnPage-1, txnPage, txnPage+1, "...", totalTxnPages];
  };
  const summaryTxns = txns.filter(t => {
    if (t.cancelled) return false;
    if (patOnly ? t.acc !== "TCB-PAT" : t.acc === "TCB-PAT") return false;
    const d = parseD(t.date);
    if (fromD && d < fromD) return false;
    if (toD   && d > toD)   return false;
    return true;
  });
  const accSummary = activeAccs.map(a => {
    // Dư đầu kỳ = openBal(01/01) + tất cả GD trước fromDate
    const preTxns = fromD ? txns.filter(t => !t.cancelled && t.acc === a.key && parseD(t.date) < fromD) : [];
    const preIn   = preTxns.filter(t=>t.amount>0).reduce((s,t)=>s+t.amount,0);
    const preOut  = preTxns.filter(t=>t.amount<0).reduce((s,t)=>s+Math.abs(t.amount),0);
    const periodOpenBal = (a.openBal||0) + preIn - preOut;
    // Luỹ kế trong kỳ
    const at = summaryTxns.filter(t=>t.acc===a.key);
    const totalIn  = at.filter(t=>t.amount>0).reduce((s,t)=>s+t.amount,0);
    const totalOut = at.filter(t=>t.amount<0).reduce((s,t)=>s+Math.abs(t.amount),0);
    return {...a, periodOpenBal, totalIn, totalOut, closeBal: periodOpenBal+totalIn-totalOut};
  });
  const tot = {
    openBal: accSummary.reduce((s,a)=>s+(a.periodOpenBal||0),0),
    totalIn: accSummary.reduce((s,a)=>s+a.totalIn,0),
    totalOut:accSummary.reduce((s,a)=>s+a.totalOut,0),
    closeBal:accSummary.reduce((s,a)=>s+a.closeBal,0),
  };
  const allAccs  = ["Tất cả",...activeAccs.map(a=>a.key)];

  const addTxn  = t  => { setTxns(p=>[t,...p]); notify("Đã lưu phiếu thu"); setModal(null); };
  const currentBalance = accKey => {
    const acc = activeAccs.find(a => a.key === accKey);
    const allForAcc = txns.filter(t => t.acc === accKey && !t.cancelled);
    const totalIn  = allForAcc.filter(t => t.amount > 0).reduce((s,t) => s + t.amount, 0);
    const totalOut = allForAcc.filter(t => t.amount < 0).reduce((s,t) => s + Math.abs(t.amount), 0);
    return (acc?.openBal || 0) + totalIn - totalOut;
  };
  const addChi = t => {
    const bal = currentBalance(t.acc);
    if (bal + t.amount < 0) {
      alert("Số dư tài khoản không đủ. Hiện tại: " + num(bal) + "đ");
      return;
    }
    setTxns(p=>[t,...p]); notify("Đã lưu phiếu chi"); setModal(null);
  };
  const addXfer = ts => { setTxns(p=>[...ts,...p]); notify("Đã chuyển tiền nội bộ"); setModal(null); };
  const cancelTxn  = (id, reason) => {
    const now = new Date();
    const stamp = now.toLocaleDateString('vi-VN') + " " + now.toLocaleTimeString('vi-VN',{hour:'2-digit',minute:'2-digit'});
    setTxns(p=>p.map(t=>t.id===id?{...t,cancelled:true,cancelReason:reason,cancelledBy:profile?.name||profile?.email||"",cancelledAt:stamp}:t));
    notify("Đã huỷ giao dịch");
    setCancelTarget(null);
  };
  const restoreTxn = id => { setTxns(p=>p.map(t=>t.id===id?{...t,cancelled:false,cancelReason:undefined,cancelledBy:undefined,cancelledAt:undefined}:t)); notify("Đã khôi phục giao dịch"); };
  const saveTxnEdit = updated => { setTxns(p=>p.map(t=>t.id===updated.id?updated:t)); setEditTxn(null); notify("Đã cập nhật giao dịch"); };
  const toggleCheck = id => setTxns(p=>p.map(t=>t.id===id?{...t,checked:!t.checked}:t));
  const nonCancelledMain = visibleTxns.filter(t=>!t.cancelled);
  const allMainChecked = nonCancelledMain.length>0 && nonCancelledMain.every(t=>t.checked);
  const someMainChecked = nonCancelledMain.some(t=>t.checked);
  const toggleAllMain = () => { const ids=new Set(nonCancelledMain.map(t=>t.id)); setTxns(p=>p.map(t=>ids.has(t.id)?{...t,checked:!allMainChecked}:t)); };
  const resetFilter = () => { setQ(""); setFAcc("Tất cả"); setFKind("Tất cả"); setFAccDetail(null); };
  const onExportTxn = () => exportCSV("lich-su-giao-dich", ["Ngày","Số phiếu","Số đơn hàng","Đối tượng","Loại GD","Tài khoản","Số tiền","Nội dung","Người tạo"],
    visibleTxns.map((t,i) => [t.date, fmtDocId(t.amount>=0?"PT":"PC",i+1), t.orderId||"", t.entity||"", t.kind||"", t.acc||"", t.amount, t.note||"", t.staff||""]));

  const THU = "bg-[#dcfce7] text-[#047857]";
  const CHI = "bg-[#fee2e2] text-[#B91C1C]";
  const KIND_COLORS = {
    "Thu tiền":       THU,
    "Đặt cọc":        THU,
    "Thanh toán":     THU,
    "Thu khác":       THU,
    "CPVC Nhập Hàng": CHI, "CP Đặt Cọc NCC": CHI, "CP Thanh Toán NCC": CHI, "CP Ship ĐH": CHI, "CP Lắp Đặt": CHI, "CP Hoàn Hàng": CHI, "CP Thuê Nhà": CHI, "CP Tiền Điện": CHI, "CP Tiền Nước": CHI, "CP Vận Hành": CHI, "CP Hoa Hồng": CHI, "Chi phí <200k": CHI,
    "Chi vận chuyển": CHI,
    "Hoàn tiền KH":   CHI,
    "Chi hoa hồng":   CHI,
    "Chi lắp đặt":    CHI,
    "Chi phí":        CHI,
    "Hoàn ứng":       CHI,
    "Chi khác":       CHI,
    "CP cá nhân <500k": CHI, "CP tiền học": CHI, "CP điện nước": CHI, "CP thuê nhà": CHI,
    "Chuyển đi":  "bg-slate-100 text-slate-600 ring-1 ring-slate-200",
    "Chuyển về":  "bg-slate-100 text-slate-600 ring-1 ring-slate-200",
  };

  const thC = "whitespace-nowrap px-3 py-2.5 text-left";
  const thR = "whitespace-nowrap px-3 py-2.5 text-right";
  const tdC = "px-3 py-2.5 text-slate-700";
  const tdR = "px-3 py-2.5 text-right tabular-nums font-medium";

  // Phân loại thu/chi — dùng đúng tập summaryTxns (đã lọc ngày) + giới hạn tài khoản hoạt động
  // để nhất quán với tổng Sổ quỹ (tránh tính lệch do giao dịch orphan / account không active)
  const activeKeys = new Set(activeAccs.map(a=>a.key));
  const kindBaseTxns = summaryTxns.filter(t => {
    if (!activeKeys.has(t.acc)) return false;
    if (fAcc !== "Tất cả" && t.acc !== fAcc) return false;
    return true;
  });
  const thuKinds = {}, chiKinds = {};
  kindBaseTxns.forEach(t => {
    const k = normalizeKind(t) || "Khác";
    if (t.amount > 0) thuKinds[k] = (thuKinds[k]||0) + t.amount;
    if (t.amount < 0) chiKinds[k] = (chiKinds[k]||0) + Math.abs(t.amount);
  });
  const THU_KINDS = ["Đặt cọc","Thanh toán"];
  const knownThuKinds = new Set(THU_KINDS);
  const thuOrdered = THU_KINDS.filter(k=>thuKinds[k]>0).map(k=>({kind:k,total:thuKinds[k]}));
  const thuOther = Object.entries(thuKinds).filter(([k])=>!knownThuKinds.has(k)).map(([kind,total])=>({kind,total}));
  const thuGroups = [...thuOrdered, ...thuOther];
  const totalThu = thuGroups.reduce((s,g)=>s+g.total,0);

  const chiMainItems = Object.entries(chiKinds).filter(([,v])=>patOnly||v>=200000).map(([kind,total])=>({kind,total}));
  const chiSmallItems = patOnly ? [] : Object.entries(chiKinds).filter(([,v])=>v<200000).map(([kind,total])=>({kind,total}));
  const chiSmallTotal = chiSmallItems.reduce((s,i)=>s+i.total,0);
  const totalChi = Object.values(chiKinds).reduce((s,v)=>s+v,0);

  const subRow = (key,label,total) => /*#__PURE__*/React.createElement("tr",{key},
    /*#__PURE__*/React.createElement("td",{className:tdC},label),
    /*#__PURE__*/React.createElement("td",{className:tdR+" text-[#B91C1C]"},vnd(total)));
  const chiTableRows = [
    ...chiMainItems.map(i=>subRow(i.kind,i.kind,i.total)),
    ...(chiSmallTotal>0?[subRow("chi_khac","Chi phí khác",chiSmallTotal)]:[]),
    /*#__PURE__*/React.createElement("tr",{key:"tong",className:"bg-[#fed7aa]"},
      /*#__PURE__*/React.createElement("td",{className:tdC+" text-slate-800",style:{fontWeight:700}},"Tổng"),
      /*#__PURE__*/React.createElement("td",{className:tdR+" text-[#B91C1C]",style:{fontWeight:700}},vnd(totalChi))),
  ];

  const KIND_COLORS_D = {
    "Thu tiền":"bg-[#dcfce7] text-[#047857]","Đặt cọc":"bg-[#dcfce7] text-[#047857]","Thanh toán":"bg-[#dcfce7] text-[#047857]","Thu khác":"bg-[#dcfce7] text-[#047857]",
    "CPVC Nhập Hàng":"bg-[#fee2e2] text-[#B91C1C]","CP Đặt Cọc NCC":"bg-[#fee2e2] text-[#B91C1C]","CP Thanh Toán NCC":"bg-[#fee2e2] text-[#B91C1C]","CP Ship ĐH":"bg-[#fee2e2] text-[#B91C1C]","CP Lắp Đặt":"bg-[#fee2e2] text-[#B91C1C]","CP Hoàn Hàng":"bg-[#fee2e2] text-[#B91C1C]","CP Thuê Nhà":"bg-[#fee2e2] text-[#B91C1C]","CP Tiền Điện":"bg-[#fee2e2] text-[#B91C1C]","CP Tiền Nước":"bg-[#fee2e2] text-[#B91C1C]","CP Vận Hành":"bg-[#fee2e2] text-[#B91C1C]","CP Hoa Hồng":"bg-[#fee2e2] text-[#B91C1C]","Chi phí <200k":"bg-[#fee2e2] text-[#B91C1C]","Hoàn tiền KH":"bg-[#fee2e2] text-[#B91C1C]","Hoàn ứng":"bg-[#fee2e2] text-[#B91C1C]",
    "Chuyển đi":"bg-slate-100 text-slate-600 ring-1 ring-slate-200","Chuyển về":"bg-slate-100 text-slate-600 ring-1 ring-slate-200",
  };

  if (fAccDetail) {
    const accD = bankAccounts.find(a=>a.key===fAccDetail);
    const accSumD = accSummary.find(a=>a.key===fAccDetail);
    const dFromD = dFromDate ? parseISO(dFromDate) : null;
    const dToD   = dToDate   ? parseISO(dToDate)   : null;
    const accTxns = txns.filter(t=>{
      if (t.acc!==fAccDetail) return false;
      const d = parseD(t.date);
      if (dFromD && d < dFromD) return false;
      if (dToD   && d > dToD)   return false;
      if (dDir==="Thu" && t.amount<=0) return false;
      if (dDir==="Chi" && t.amount>=0) return false;
      if (dKind!=="Tất cả" && normalizeKind(t)!==dKind) return false;
      if (dQ && !`${t.id} ${t.orderId} ${t.note} ${t.entity}`.toLowerCase().includes(dQ.toLowerCase())) return false;
      return true;
    });
    const dThuKinds = [...new Set(txns.filter(t=>t.acc===fAccDetail&&!t.cancelled&&t.amount>0).map(t=>normalizeKind(t)).filter(Boolean))].sort();
    const dChiKinds = [...new Set(txns.filter(t=>t.acc===fAccDetail&&!t.cancelled&&t.amount<0).map(t=>normalizeKind(t)).filter(Boolean))].sort();
    const nonCancelledAcc = accTxns.filter(t=>!t.cancelled);
    const allAccChecked = nonCancelledAcc.length>0 && nonCancelledAcc.every(t=>t.checked);
    const someAccChecked = nonCancelledAcc.some(t=>t.checked);
    const toggleAllAcc = () => { const ids=new Set(nonCancelledAcc.map(t=>t.id)); setTxns(p=>p.map(t=>ids.has(t.id)?{...t,checked:!allAccChecked}:t)); };
    const ACC_PER_PAGE = 25;
    const totalAccPages = Math.ceil(accTxns.length/ACC_PER_PAGE);
    const pagedAccTxns = accTxns.slice((detailPage-1)*ACC_PER_PAGE, detailPage*ACC_PER_PAGE);
    return /*#__PURE__*/React.createElement("div", {className:"space-y-4"},
      /*#__PURE__*/React.createElement("div", {className:"flex items-center justify-between flex-wrap gap-2"},
        /*#__PURE__*/React.createElement("div", {className:"flex items-center gap-3"},
          /*#__PURE__*/React.createElement("button", {onClick:()=>setFAccDetail(null), className:"inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800"},
            /*#__PURE__*/React.createElement(ArrowLeft, {className:"h-4 w-4"}), " Quay lại sổ quỹ"),
          accD && /*#__PURE__*/React.createElement("div", {className:"flex items-center gap-2"},
            /*#__PURE__*/React.createElement("span", {className:"text-slate-300"}, "|"),
            /*#__PURE__*/React.createElement("span", {className:"font-semibold text-slate-800"}, accD.bank),
            /*#__PURE__*/React.createElement("span", {className:"text-xs text-slate-500 bg-slate-100 rounded px-1.5 py-0.5"}, accD.account),
            )),
        /*#__PURE__*/React.createElement("div", {className:"flex gap-2"},
          /*#__PURE__*/React.createElement("button", {onClick:()=>setModal("thu"), className:"inline-flex items-center gap-1.5 rounded-lg bg-[#b45309] px-3 py-1.5 text-sm font-semibold text-white hover:bg-[#92400e]"},
            /*#__PURE__*/React.createElement(Plus,{className:"h-4 w-4"}), "Lập phiếu thu"),
          /*#__PURE__*/React.createElement("button", {onClick:()=>setModal("chi"), className:"inline-flex items-center gap-1.5 rounded-lg bg-[#92400e] px-3 py-1.5 text-sm font-semibold text-white hover:bg-[#78350f]"},
            /*#__PURE__*/React.createElement(Minus,{className:"h-4 w-4"}), "Lập phiếu chi"))),
      accSumD && /*#__PURE__*/React.createElement("div", {className:"rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden"},
        /*#__PURE__*/React.createElement("table", {className:"w-full text-sm tbl-list",style:{tableLayout:"fixed"}},
          /*#__PURE__*/React.createElement("thead", null,
            /*#__PURE__*/React.createElement("tr", null,
              /*#__PURE__*/React.createElement("th",{className:thR,style:{width:"25%"}},"Số dư đầu kỳ"),
              /*#__PURE__*/React.createElement("th",{className:thR,style:{width:"25%"}},"Tổng tiền vào"),
              /*#__PURE__*/React.createElement("th",{className:thR,style:{width:"25%"}},"Tổng tiền ra"),
              /*#__PURE__*/React.createElement("th",{className:thR,style:{width:"25%"}},"Số dư cuối kỳ"))),
          /*#__PURE__*/React.createElement("tbody", null,
            /*#__PURE__*/React.createElement("tr", null,
              /*#__PURE__*/React.createElement("td",{className:tdR+" text-slate-800"},vnd(accSumD.openBal)),
              /*#__PURE__*/React.createElement("td",{className:tdR+(accSumD.totalIn>0?" text-[#92400e]":" text-slate-300")},accSumD.totalIn>0?vnd(accSumD.totalIn):"—"),
              /*#__PURE__*/React.createElement("td",{className:tdR+(accSumD.totalOut>0?" text-[#B91C1C]":" text-slate-300")},accSumD.totalOut>0?vnd(accSumD.totalOut):"—"),
              /*#__PURE__*/React.createElement("td",{className:tdR+" text-slate-900 font-semibold"},vnd(accSumD.closeBal)))))),
      /*#__PURE__*/React.createElement(Card, {title:"Lịch sử giao dịch",
        right:/*#__PURE__*/React.createElement("div",{className:"flex flex-wrap items-center gap-2"},
          /*#__PURE__*/React.createElement("input",{type:"date",value:dFromDate,onChange:e=>setDFromDate(e.target.value),className:`${field} py-1.5 text-sm`}),
          /*#__PURE__*/React.createElement("input",{type:"date",value:dToDate,onChange:e=>setDToDate(e.target.value),className:`${field} py-1.5 text-sm`}),
          /*#__PURE__*/React.createElement("div",{className:"relative"},
            /*#__PURE__*/React.createElement(Search,{className:"absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400"}),
            /*#__PURE__*/React.createElement("input",{value:dQ,onChange:e=>setDQ(e.target.value),placeholder:"Tìm kiếm...",className:`${field} w-44 pl-8 py-1.5 text-sm`})),
          /*#__PURE__*/React.createElement("select",{value:dDir,onChange:e=>setDDir(e.target.value),className:`${field} py-1.5 text-sm`},
            ["Tất cả","Thu","Chi"].map(k=>/*#__PURE__*/React.createElement("option",{key:k},k))),
          /*#__PURE__*/React.createElement(PrintBtn,null),
          /*#__PURE__*/React.createElement(ExportBtn,{onClick:()=>exportCSV("giao-dich-"+fAccDetail,["Ngày","Số phiếu","Số đơn hàng","Đối tượng","Loại GD","Số tiền","Nội dung","Người tạo"],accTxns.map((t,i)=>[t.date,fmtDocId(t.amount>=0?"PT":"PC",i+1),t.orderId||"",t.entity||"",t.kind||"",t.amount,t.note||"",t.staff||""]))}))},
        /*#__PURE__*/React.createElement("div", {className:"-mx-5 -mb-5"},
          /*#__PURE__*/React.createElement(TableShell, {minW:"800px",
            foot: (() => {
              const totalIn  = accTxns.filter(t=>!t.cancelled&&t.amount>0).reduce((s,t)=>s+t.amount,0);
              const totalOut = accTxns.filter(t=>!t.cancelled&&t.amount<0).reduce((s,t)=>s+t.amount,0);
              return /*#__PURE__*/React.createElement("tr", {className:"bg-[#fed7aa] text-sm font-semibold text-slate-800"},
                /*#__PURE__*/React.createElement("td", {colSpan: patOnly ? 2 : 3, className:"px-4 py-2.5"}, "TỔNG CỘNG (", accTxns.length, " GD)"),
                /*#__PURE__*/React.createElement("td", {colSpan:2}),
                /*#__PURE__*/React.createElement("td", {className:"px-4 py-2.5 text-right tabular-nums whitespace-nowrap"},
                  totalIn>0  && /*#__PURE__*/React.createElement("span", {className:"text-[#047857]"}, "+", vnd(totalIn)),
                  totalIn>0 && totalOut<0 && /*#__PURE__*/React.createElement("span", {className:"mx-1 text-slate-400"}, " / "),
                  totalOut<0 && /*#__PURE__*/React.createElement("span", {className:"text-[#B91C1C]"}, vnd(totalOut))),
                /*#__PURE__*/React.createElement("td", {colSpan:2}));
            })(),
            head:/*#__PURE__*/React.createElement(React.Fragment,null,
              /*#__PURE__*/React.createElement(Th,{center:true,style:{minWidth:90}},"Ngày"),
              /*#__PURE__*/React.createElement(Th,{style:{width:60,minWidth:60}},"Số phiếu"),
              !patOnly && /*#__PURE__*/React.createElement(Th,{center:true,style:{width:90,minWidth:90}},"Số đơn"),
              /*#__PURE__*/React.createElement(Th,{style:{minWidth:180}},"Đối tượng"),
              /*#__PURE__*/React.createElement(Th,{center:true,style:{width:155,minWidth:155}},"Loại giao dịch"),
              /*#__PURE__*/React.createElement(Th,{center:true,style:{minWidth:110}},"Số tiền"),
              /*#__PURE__*/React.createElement(Th,{style:{minWidth:200}},"Nội dung"),
              /*#__PURE__*/React.createElement(Th,{center:true,style:{width:44,minWidth:44}},
                nonCancelledAcc.length>0&&/*#__PURE__*/React.createElement("button",{onClick:toggleAllAcc,className:`h-5 w-5 rounded border-2 flex items-center justify-center transition mx-auto ${allAccChecked?"border-green-500 bg-green-500 text-white":someAccChecked?"border-amber-400 bg-amber-50":"border-slate-300 hover:border-amber-400"}`},
                  allAccChecked&&/*#__PURE__*/React.createElement(Check,{className:"h-3 w-3 stroke-[3]"}),
                  someAccChecked&&!allAccChecked&&/*#__PURE__*/React.createElement("span",{className:"block w-2.5 h-0.5 bg-amber-500 rounded"}))))},
            pagedAccTxns.map((t,i)=>/*#__PURE__*/React.createElement("tr",{key:t.id,className:t.cancelled?"opacity-50 bg-slate-50":""},
              /*#__PURE__*/React.createElement("td",{className:"px-3 py-2.5 text-xs text-slate-500"},(() => {
                const parts = String(t.date||"").split(" ");
                return /*#__PURE__*/React.createElement(React.Fragment,null,
                  /*#__PURE__*/React.createElement("span",{className:"block"},(parts[0]||"")),
                  parts[1] ? /*#__PURE__*/React.createElement("span",{className:"block text-slate-400"},(parts[1]||"").split(":").slice(0,2).join(":")) : null);
              })()),
              /*#__PURE__*/React.createElement("td",{className:"px-3 py-2.5 tabular-nums"},
                /*#__PURE__*/React.createElement("span",{className:`inline-flex items-center whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-medium ${t.amount>0?"bg-[#dcfce7] text-[#047857]":t.amount<0?"bg-[#fee2e2] text-[#B91C1C]":"bg-slate-100 text-slate-600"}`},
                  fmtDocId(t.amount>=0?"PT":"PC",(detailPage-1)*ACC_PER_PAGE+i+1))),
              !patOnly && /*#__PURE__*/React.createElement("td",{className:"px-2 py-2 text-center"},
                t.orderId ? /*#__PURE__*/React.createElement("span",{className:"inline-flex items-center rounded px-1.5 py-0.5 text-[11px] font-medium bg-amber-50 text-amber-800 ring-1 ring-amber-200 whitespace-nowrap"},t.orderId) : null),
              /*#__PURE__*/React.createElement("td",{className:"px-3 py-2.5 text-slate-700"},t.entity),
              /*#__PURE__*/React.createElement("td",{className:"px-2 py-2 text-center"},
                /*#__PURE__*/React.createElement("select",{
                  value:t.kind||"",
                  onChange:e=>setTxns(p=>p.map(x=>x.id===t.id?{...x,kind:e.target.value}:x)),
                  className:`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium border-0 outline-none cursor-pointer ${(normalizeKind(t)==="Chuyển đi"||normalizeKind(t)==="Chuyển về")?"bg-slate-100 text-slate-600 ring-1 ring-slate-200":t.amount>=0?THU:t.amount<0?CHI:"bg-slate-100 text-slate-600"}`},
                  /*#__PURE__*/React.createElement("option",{value:""},"— chọn loại —"),
                  (t.amount>=0?allThuKinds:allChiKinds).map(k=>/*#__PURE__*/React.createElement("option",{key:k,value:k},k)))),
              /*#__PURE__*/React.createElement("td",{className:"whitespace-nowrap px-3 py-2.5 text-right"},
                /*#__PURE__*/React.createElement("span",{className:`inline-flex items-center whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-semibold tabular-nums ${t.cancelled?"line-through bg-slate-100 text-slate-400":t.amount>0?"bg-[#dcfce7] text-[#047857]":t.amount<0?"bg-[#fee2e2] text-[#B91C1C]":"bg-slate-100 text-slate-500"}`},
                  (t.amount>=0?"+":"")+vnd(t.amount))),
              /*#__PURE__*/React.createElement("td",{className:"px-3 py-2.5 text-slate-500 text-xs"},t.note||""),
              /*#__PURE__*/React.createElement("td",{className:"px-2 py-2 text-center"},
                !t.cancelled&&/*#__PURE__*/React.createElement("button",{onClick:()=>toggleCheck(t.id),title:t.checked?"Bỏ đối chiếu":"Đã đối chiếu",className:`h-5 w-5 rounded border-2 flex items-center justify-center transition mx-auto ${t.checked?"border-green-500 bg-green-500 text-white":"border-slate-300 hover:border-amber-400"}`},
                  t.checked&&/*#__PURE__*/React.createElement(Check,{className:"h-3 w-3 stroke-[3]"})))))))),
      totalAccPages>1 && /*#__PURE__*/React.createElement("div",{className:"flex items-center justify-between gap-3 pt-3 px-1 flex-wrap"},
        /*#__PURE__*/React.createElement("span",{className:"text-xs text-slate-500"},`${(detailPage-1)*ACC_PER_PAGE+1}–${Math.min(detailPage*ACC_PER_PAGE,accTxns.length)} / ${accTxns.length} giao dịch`),
        /*#__PURE__*/React.createElement("div",{className:"flex items-center gap-1"},
          /*#__PURE__*/React.createElement("button",{disabled:detailPage===1,onClick:()=>setDetailPage(p=>Math.max(1,p-1)),className:"rounded px-2 py-1 text-sm text-slate-600 hover:bg-slate-100 disabled:opacity-30"},"Trước"),
          Array.from({length:totalAccPages},(_,i)=>i+1).map(n=>/*#__PURE__*/React.createElement("button",{key:n,onClick:()=>setDetailPage(n),className:`min-w-[2rem] rounded px-2 py-1 text-sm font-medium ${detailPage===n?"bg-[#92400e] text-white":"text-slate-600 hover:bg-slate-100"}`},n)),
          /*#__PURE__*/React.createElement("button",{disabled:detailPage===totalAccPages,onClick:()=>setDetailPage(p=>Math.min(totalAccPages,p+1)),className:"rounded px-2 py-1 text-sm text-slate-600 hover:bg-slate-100 disabled:opacity-30"},"Sau"))),
      modal==="thu" && /*#__PURE__*/React.createElement(PhieuThuModal,{onClose:()=>setModal(null),onSave:addTxn,nextId}),
      modal==="chi" && /*#__PURE__*/React.createElement(PhieuChiModal,{onClose:()=>setModal(null),onSave:addChi,nextId,kinds:patOnly?["CP cá nhân <500k","CP tiền học","CP điện nước","CP thuê nhà"]:null,initAcc:patOnly?"TCB-PAT":null}),
      modal==="chuyen" && /*#__PURE__*/React.createElement(ChuyenTienModal,{onClose:()=>setModal(null),onSave:addXfer,nextId}),
      cancelTarget && /*#__PURE__*/React.createElement(HuyGiaoDichModal,{onClose:()=>setCancelTarget(null),onConfirm:reason=>cancelTxn(cancelTarget,reason)}),
      editTxn && /*#__PURE__*/React.createElement(EditTxnModal,{txn:editTxn,onClose:()=>setEditTxn(null),onSave:saveTxnEdit}),
);
  }

  return /*#__PURE__*/React.createElement("div", {className:"space-y-4"},

    isAdmin && /*#__PURE__*/React.createElement("div", {className:"flex gap-1 border-b border-slate-200 mb-1"},
      /*#__PURE__*/React.createElement("button", {
        onClick:()=>setFinTab("cty"),
        className:`px-4 py-2 text-sm font-medium border-b-2 transition ${finTab==="cty" ? "border-[#fed7aa] text-[#92400e]" : "border-transparent text-slate-500 hover:text-slate-700"}`
      }, "Tài khoản công ty"),
      /*#__PURE__*/React.createElement("button", {
        onClick:()=>setFinTab("pat"),
        className:`px-4 py-2 text-sm font-medium border-b-2 transition ${finTab==="pat" ? "border-[#fed7aa] text-[#92400e]" : "border-transparent text-slate-500 hover:text-slate-700"}`
      }, "Tài khoản cá nhân")),

    /*#__PURE__*/React.createElement(Card, {title: "Sổ quỹ",
      right: /*#__PURE__*/React.createElement("div", {className:"flex flex-wrap items-center gap-2"},
        /*#__PURE__*/React.createElement(DateRangeFilter, {compact:true, initFrom:fromDate, initTo:toDate, onApply:(f,t)=>{setFromDate(f);setToDate(t);}}),
        /*#__PURE__*/React.createElement("button", {onClick:()=>setModal("thu"), className:"inline-flex items-center gap-1.5 rounded-lg bg-[#b45309] px-3 py-1.5 text-sm font-semibold text-white hover:bg-[#92400e]"},
          /*#__PURE__*/React.createElement(Plus, {className:"h-4 w-4"}), "Lập phiếu thu"),
        /*#__PURE__*/React.createElement("button", {onClick:()=>setModal("chi"), className:"inline-flex items-center gap-1.5 rounded-lg bg-[#92400e] px-3 py-1.5 text-sm font-semibold text-white hover:bg-[#78350f]"},
          /*#__PURE__*/React.createElement(Minus, {className:"h-4 w-4"}), "Lập phiếu chi"),
        /*#__PURE__*/React.createElement("button", {onClick:()=>setModal("chuyen"), className:"inline-flex items-center gap-1.5 rounded-lg bg-[#78350f] px-3 py-1.5 text-sm font-semibold text-white hover:bg-[#78350f]"},
          /*#__PURE__*/React.createElement(ArrowLeftRight, {className:"h-4 w-4"}), "Chuyển tiền nội bộ"),
)},
      /*#__PURE__*/React.createElement("div", {className:"-mx-5 -mb-5 overflow-x-auto"},
        /*#__PURE__*/React.createElement("table", {className:"w-full text-sm tbl-list"},
          /*#__PURE__*/React.createElement("thead", null,
            /*#__PURE__*/React.createElement("tr", null,
              /*#__PURE__*/React.createElement("th",{className:thC},"Tài khoản"),
              /*#__PURE__*/React.createElement("th",{className:thC},"Số TK"),
              /*#__PURE__*/React.createElement("th",{className:thC},"Chủ TK"),
              /*#__PURE__*/React.createElement("th",{className:thR},"Dư đầu kỳ"),
              /*#__PURE__*/React.createElement("th",{className:thR},"Thu"),
              /*#__PURE__*/React.createElement("th",{className:thR},"Chi"),
              /*#__PURE__*/React.createElement("th",{className:thR},"Số dư hiện tại"),
              /*#__PURE__*/React.createElement("th",{className:"px-3 py-2.5 text-center"},""))),
          /*#__PURE__*/React.createElement("tbody", null,
            accSummary.map(a=>/*#__PURE__*/React.createElement("tr",{key:a.key, className:""},
              /*#__PURE__*/React.createElement("td",{className:tdC+" font-medium"},a.bank),
              /*#__PURE__*/React.createElement("td",{className:tdC},a.account),
              /*#__PURE__*/React.createElement("td",{className:tdC+" text-slate-500 text-xs"},a.owner),
              /*#__PURE__*/React.createElement("td",{className:tdR+" text-slate-700"},vnd(a.periodOpenBal)),
              /*#__PURE__*/React.createElement("td",{className:tdR+(a.totalIn>0?" text-[#047857]":" text-slate-300")},a.totalIn>0?vnd(a.totalIn):""),
              /*#__PURE__*/React.createElement("td",{className:tdR+(a.totalOut>0?" text-[#B91C1C]":" text-slate-300")},a.totalOut>0?vnd(a.totalOut):""),
              /*#__PURE__*/React.createElement("td",{className:tdR+(a.closeBal<0?" text-[#B91C1C] font-bold":" text-slate-900 font-semibold")},vnd(a.closeBal)),
              /*#__PURE__*/React.createElement("td",{className:"px-3 py-2 text-center"},
                /*#__PURE__*/React.createElement("button",{onClick:()=>setFAccDetail(a.key),
                  className:"rounded-md px-2 py-1 text-xs font-medium transition bg-[#fde68a] text-[#92400e] hover:bg-amber-200 ring-1 ring-[#92400e]/20"},"Chi tiết")))),
            /*#__PURE__*/React.createElement("tr",{className:"bg-[#fed7aa]"},
              /*#__PURE__*/React.createElement("td",{className:tdC+" font-bold text-slate-800",colSpan:3},"TỔNG CỘNG"),
              /*#__PURE__*/React.createElement("td",{className:"px-3 py-2.5 text-right tabular-nums text-slate-900",style:{fontWeight:700}},vnd(tot.openBal)),
              /*#__PURE__*/React.createElement("td",{className:"px-3 py-2.5 text-right tabular-nums text-[#047857]",style:{fontWeight:700}},tot.totalIn>0?vnd(tot.totalIn):""),
              /*#__PURE__*/React.createElement("td",{className:"px-3 py-2.5 text-right tabular-nums text-[#B91C1C]",style:{fontWeight:700}},tot.totalOut>0?vnd(tot.totalOut):""),
              /*#__PURE__*/React.createElement("td",{className:"px-3 py-2.5 text-right tabular-nums text-slate-900",style:{fontWeight:700}},vnd(tot.closeBal)),
              /*#__PURE__*/React.createElement("td",null)))))),

    /*#__PURE__*/React.createElement("div", {className:"rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden"},
      /*#__PURE__*/React.createElement("div", {className:"grid grid-cols-2 divide-x divide-slate-100"},
        /*#__PURE__*/React.createElement("div", {className:"flex flex-col"},
          /*#__PURE__*/React.createElement("div", {className:"px-5 py-3 border-b border-slate-100"},
            /*#__PURE__*/React.createElement("span", {className:"inline-flex items-center rounded-full bg-[#fef9f0] px-3 py-1 text-sm font-semibold text-[#92400e] ring-1 ring-[#b45309]/40"}, "Phân loại thu")),
          /*#__PURE__*/React.createElement("table", {className:"w-full text-sm tbl-list"},
            /*#__PURE__*/React.createElement("tbody", null,
              thuGroups.map(g=>/*#__PURE__*/React.createElement("tr",{key:g.kind},
                /*#__PURE__*/React.createElement("td",{className:tdC},g.kind),
                /*#__PURE__*/React.createElement("td",{className:tdR+" text-[#047857]"},vnd(g.total)))))),
          /*#__PURE__*/React.createElement("table", {className:"w-full text-sm tbl-list mt-auto"},
            /*#__PURE__*/React.createElement("tbody", null,
              /*#__PURE__*/React.createElement("tr",{className:"bg-[#fed7aa]"},
                /*#__PURE__*/React.createElement("td",{className:tdC+" text-slate-800",style:{fontWeight:700}},"Tổng thu"),
                /*#__PURE__*/React.createElement("td",{className:tdR+" text-[#047857]",style:{fontWeight:700}},vnd(totalThu)))))),
        /*#__PURE__*/React.createElement("div", {className:"flex flex-col"},
          /*#__PURE__*/React.createElement("div", {className:"px-5 py-3 border-b border-slate-100"},
            /*#__PURE__*/React.createElement("span", {className:"inline-flex items-center rounded-full bg-[#fef9f0] px-3 py-1 text-sm font-semibold text-[#92400e] ring-1 ring-[#b45309]/40"}, "Phân loại chi")),
          /*#__PURE__*/React.createElement("table", {className:"w-full text-sm tbl-list"},
            /*#__PURE__*/React.createElement("tbody", null,
              ...chiMainItems.map(i=>/*#__PURE__*/React.createElement("tr",{key:i.kind},
                /*#__PURE__*/React.createElement("td",{className:tdC},i.kind),
                /*#__PURE__*/React.createElement("td",{className:tdR+" text-[#B91C1C]"},vnd(i.total)))),
              chiSmallTotal>0&&/*#__PURE__*/React.createElement("tr",{key:"chi_khac"},
                /*#__PURE__*/React.createElement("td",{className:tdC+" text-slate-500"},"Chi phí khác"),
                /*#__PURE__*/React.createElement("td",{className:tdR+" text-[#B91C1C]"},vnd(chiSmallTotal))))),
          /*#__PURE__*/React.createElement("table", {className:"w-full text-sm tbl-list mt-auto"},
            /*#__PURE__*/React.createElement("tbody", null,
              /*#__PURE__*/React.createElement("tr",{className:"bg-[#fed7aa]"},
                /*#__PURE__*/React.createElement("td",{className:tdC+" text-slate-800",style:{fontWeight:700}},"Tổng chi"),
                /*#__PURE__*/React.createElement("td",{className:tdR+" text-[#B91C1C]",style:{fontWeight:700}},vnd(totalChi)))))))),

    /*#__PURE__*/React.createElement(Card, {title: "Lịch sử giao dịch",
      right: /*#__PURE__*/React.createElement("div", {className:"flex flex-wrap items-center gap-2"},
        /*#__PURE__*/React.createElement("div", {className:"relative"},
          /*#__PURE__*/React.createElement(Search, {className:"absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400"}),
          /*#__PURE__*/React.createElement("input", {value:q, onChange:e=>setQ(e.target.value), placeholder:"Tìm kiếm...", className:`${field} w-48 pl-8 py-1.5 text-sm`})),
        /*#__PURE__*/React.createElement("select", {value:fAcc, onChange:e=>{ setFAcc(e.target.value); setFAccDetail(null); }, className:`${field} py-1.5 text-sm`},
          allAccs.map(a=>/*#__PURE__*/React.createElement("option",{key:a},a))),
        /*#__PURE__*/React.createElement("select", {value:fDir, onChange:e=>setFDir(e.target.value), className:`${field} py-1.5 text-sm`},
          [["Tất cả","Thu / Chi"],["Thu","Thu"],["Chi","Chi"]].map(([v,l])=>/*#__PURE__*/React.createElement("option",{key:v,value:v},l))),
        /*#__PURE__*/React.createElement(PrintBtn, null),
        /*#__PURE__*/React.createElement(ExportBtn, {onClick: onExportTxn}),
        !patOnly&&/*#__PURE__*/React.createElement(ReconcileBtn, {txns, setTxns, orders}))},
      /*#__PURE__*/React.createElement("div", {className:"-mx-5 -mb-5"},
        /*#__PURE__*/React.createElement(TableShell, {minW:"1100px",
          head:/*#__PURE__*/React.createElement(React.Fragment,null,
            /*#__PURE__*/React.createElement(Th,{center:true,style:{minWidth:90}},"Ngày"),
            /*#__PURE__*/React.createElement(Th,{style:{width:90,minWidth:90}},"Số phiếu"),
            !patOnly&&/*#__PURE__*/React.createElement(Th,{style:{width:90,minWidth:90}},"Số đơn hàng"),
            /*#__PURE__*/React.createElement(Th,{style:{minWidth:160}},"Đối tượng"),
            /*#__PURE__*/React.createElement(Th,{center:true,style:{width:patOnly?160:140,minWidth:patOnly?160:140}},"Loại giao dịch"),
            /*#__PURE__*/React.createElement(Th,{center:true,style:{minWidth:110}},"Tài khoản"),
            /*#__PURE__*/React.createElement(Th,{center:true,style:{minWidth:110}},"Số tiền"),
            /*#__PURE__*/React.createElement(Th,{style:{minWidth:200}},"Nội dung"),
            !patOnly&&/*#__PURE__*/React.createElement(Th,{style:{minWidth:80}},"Người tạo"),
            /*#__PURE__*/React.createElement(Th,{center:true,style:{width:44,minWidth:44}},
              nonCancelledMain.length>0&&/*#__PURE__*/React.createElement("button",{onClick:toggleAllMain,className:`h-5 w-5 rounded border-2 flex items-center justify-center transition mx-auto ${allMainChecked?"border-green-500 bg-green-500 text-white":someMainChecked?"border-amber-400 bg-amber-50":"border-slate-300 hover:border-amber-400"}`},
                allMainChecked&&/*#__PURE__*/React.createElement(Check,{className:"h-3 w-3 stroke-[3]"}),
                someMainChecked&&!allMainChecked&&/*#__PURE__*/React.createElement("span",{className:"block w-2.5 h-0.5 bg-amber-500 rounded"}))),
            !patOnly&&/*#__PURE__*/React.createElement(Th,{center:true},""))},
          pagedTxns.map((t,i)=>/*#__PURE__*/React.createElement("tr",{key:t.id,className:t.cancelled?"opacity-50 bg-slate-50":""},
            /*#__PURE__*/React.createElement("td",{className:"px-3 py-2.5 text-xs text-slate-500"}, (() => {
              const parts = String(t.date||"").split(" ");
              return /*#__PURE__*/React.createElement(React.Fragment,null,
                /*#__PURE__*/React.createElement("span",{className:"block"},(parts[0]||"")),
                parts[1] ? /*#__PURE__*/React.createElement("span",{className:"block text-slate-400"},(parts[1]||"").split(":").slice(0,2).join(":")) : null);
            })()),
            /*#__PURE__*/React.createElement("td",{className:"px-3 py-2.5 tabular-nums"},
              /*#__PURE__*/React.createElement("span",{className:`inline-flex items-center whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-medium ${t.amount > 0 ? "bg-[#dcfce7] text-[#047857]" : t.amount < 0 ? "bg-[#fee2e2] text-[#B91C1C]" : "bg-slate-100 text-slate-600"}`},
                fmtDocId(t.amount>=0?"PT":"PC",(txnPage-1)*TXN_PER_PAGE+i+1))),
            !patOnly&&/*#__PURE__*/React.createElement("td",{className:"px-3 py-2.5"},
              t.orderId ? /*#__PURE__*/React.createElement("button",{className:"inline-flex items-center whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-medium bg-[#fef9f0] text-[#92400e] hover:bg-amber-100", onClick:()=>onOpenOrder&&onOpenOrder(t.orderId)},t.orderId) : /*#__PURE__*/React.createElement("span",{className:"text-slate-300"},"")),
            /*#__PURE__*/React.createElement("td",{className:"px-3 py-2.5 text-slate-700"},t.entity),
            /*#__PURE__*/React.createElement("td",{className:"px-2 py-2 text-center"},
              /*#__PURE__*/React.createElement("select",{
                value:t.kind||"",
                onChange:e=>setTxns(p=>p.map(x=>x.id===t.id?{...x,kind:e.target.value}:x)),
                className:`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium border-0 outline-none cursor-pointer ${(normalizeKind(t)==="Chuyển đi"||normalizeKind(t)==="Chuyển về")?"bg-slate-100 text-slate-600 ring-1 ring-slate-200":t.amount>=0?THU:t.amount<0?CHI:"bg-slate-100 text-slate-600"}`},
                /*#__PURE__*/React.createElement("option",{value:""},"— chọn loại —"),
                (t.amount>=0?allThuKinds:allChiKinds).map(k=>/*#__PURE__*/React.createElement("option",{key:k,value:k},k)))),
            /*#__PURE__*/React.createElement("td",{className:"whitespace-nowrap px-3 py-2.5 text-slate-600 text-xs"},t.acc),
            /*#__PURE__*/React.createElement("td",{className:"whitespace-nowrap px-3 py-2.5 text-right"},
              /*#__PURE__*/React.createElement("span",{className:`inline-flex items-center whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-semibold tabular-nums ${t.cancelled?"line-through bg-slate-100 text-slate-400":t.amount>0?"bg-[#dcfce7] text-[#047857]":t.amount<0?"bg-[#fee2e2] text-[#B91C1C]":"bg-slate-100 text-slate-500"}`},
                (t.amount>=0?"+":"")+vnd(t.amount))),
            /*#__PURE__*/React.createElement("td",{className:"px-3 py-2.5 text-slate-500 text-xs"},t.note||""),
            !patOnly&&/*#__PURE__*/React.createElement("td",{className:"whitespace-nowrap px-3 py-2.5 text-xs text-slate-500"},t.staff),
            /*#__PURE__*/React.createElement("td",{className:"px-2 py-2 text-center"},
              !t.cancelled&&/*#__PURE__*/React.createElement("button",{onClick:()=>toggleCheck(t.id),title:t.checked?"Bỏ đối chiếu":"Đã đối chiếu",className:`h-5 w-5 rounded border-2 flex items-center justify-center transition mx-auto ${t.checked?"border-green-500 bg-green-500 text-white":"border-slate-300 hover:border-amber-400"}`},
                t.checked&&/*#__PURE__*/React.createElement(Check,{className:"h-3 w-3 stroke-[3]"}))),
            !patOnly&&/*#__PURE__*/React.createElement("td",{className:"px-3 py-2.5 text-center"},
              t.cancelled
                ?/*#__PURE__*/React.createElement("button",{onClick:()=>restoreTxn(t.id),className:"rounded px-2 py-0.5 text-xs font-medium bg-slate-100 text-slate-500 hover:bg-emerald-100 hover:text-emerald-700"},"Khôi phục")
                :(!t.orderId?/*#__PURE__*/React.createElement("button",{onClick:()=>setEditTxn(t),title:"Sửa giao dịch",className:"rounded p-1 text-slate-400 hover:text-amber-700 hover:bg-amber-50"},/*#__PURE__*/React.createElement(Pencil,{className:"h-3.5 w-3.5"})):null))))))),
    totalTxnPages > 1 && /*#__PURE__*/React.createElement("div", {className: "flex items-center justify-between gap-3 pt-3 px-1 flex-wrap"},
      /*#__PURE__*/React.createElement("span", {className: "text-xs text-slate-500"},
        `${(txnPage-1)*TXN_PER_PAGE+1}–${Math.min(txnPage*TXN_PER_PAGE, visibleTxns.length)} / ${visibleTxns.length} giao dịch`),
      /*#__PURE__*/React.createElement("div", {className: "flex items-center gap-1"},
        /*#__PURE__*/React.createElement("button", {
          disabled: txnPage === 1,
          onClick: () => setTxnPage(p => Math.max(1, p-1)),
          className: "rounded px-2 py-1 text-sm text-slate-600 hover:bg-slate-100 disabled:opacity-30"
        }, "Trước"),
        txnPageNums().map((n, i) => n === "..." ?
          /*#__PURE__*/React.createElement("span", {key: `e${i}`, className: "px-1 text-slate-400"}, "...") :
          /*#__PURE__*/React.createElement("button", {
            key: n,
            onClick: () => setTxnPage(n),
            className: `min-w-[2rem] rounded px-2 py-1 text-sm font-medium ${txnPage === n ? "bg-[#92400e] text-white" : "text-slate-600 hover:bg-slate-100"}`
          }, n)
        ),
        /*#__PURE__*/React.createElement("button", {
          disabled: txnPage === totalTxnPages,
          onClick: () => setTxnPage(p => Math.min(totalTxnPages, p+1)),
          className: "rounded px-2 py-1 text-sm text-slate-600 hover:bg-slate-100 disabled:opacity-30"
        }, "Sau")
      )
    ),

    modal==="thu"    && /*#__PURE__*/React.createElement(PhieuThuModal,  {onClose:()=>setModal(null), onSave:addTxn,  nextId}),
    modal==="chi"    && /*#__PURE__*/React.createElement(PhieuChiModal,  {onClose:()=>setModal(null), onSave:addChi,  nextId, kinds:patOnly?["CP cá nhân <500k","CP tiền học","CP điện nước","CP thuê nhà"]:null,initAcc:patOnly?"TCB-PAT":null}),
    modal==="chuyen" && /*#__PURE__*/React.createElement(ChuyenTienModal,{onClose:()=>setModal(null), onSave:addXfer, nextId}),
    cancelTarget && /*#__PURE__*/React.createElement(HuyGiaoDichModal,{onClose:()=>setCancelTarget(null),onConfirm:reason=>cancelTxn(cancelTarget,reason)}),
    editTxn && /*#__PURE__*/React.createElement(EditTxnModal,{txn:editTxn,onClose:()=>setEditTxn(null),onSave:saveTxnEdit}));
}

/* ───────── Reports ───────── */
function ReportSales({orders = [], onOpenOrder}) {
  const [fromDate, setFromDate] = useState(localMonthStart());
  const [toDate, setToDate] = useState(localToday());
  const [rPage, setRPage] = useState(1);
  React.useEffect(() => setRPage(1), [fromDate, toDate]);
  const _pISO = s => { const [y,m,d] = s.split("-"); return new Date(+y,+m-1,+d); };
  const fromD = fromDate ? _pISO(fromDate) : null;
  const toD   = toDate   ? _pISO(toDate)   : null;

  const filtered = orders.filter(o => {
    if (o.draft) return false;
    const st = o.orderStatus || "";
    if (st === "Huỷ" || st === "Hủy") return false;
    const d = parseViDate(o.dt);
    if (fromD && d < fromD) return false;
    if (toD   && d > new Date(toD.getFullYear(), toD.getMonth(), toD.getDate(), 23, 59, 59)) return false;
    return true;
  });

  const undelivered = filtered.filter(o => !o.deliveryConfirmed);
  const delivered   = filtered.filter(o => !!o.deliveryConfirmed);
  const tUndelivered = undelivered.reduce((s,o) => s + calc(o).total, 0);
  const tDeposit     = undelivered.reduce((s,o) => s + (o.paid||0), 0);
  const tUndelivRem  = tUndelivered - tDeposit;
  const tDelivered    = delivered.reduce((s,o) => s + calc(o).total, 0);
  const tDeliveredPaid = delivered.reduce((s,o) => s + (o.paid||0), 0);
  const tReceivable   = delivered.reduce((s,o) => s + Math.max(0, calc(o).remaining), 0);
  const tTotal       = tUndelivered + tDelivered;
  const tTotalPaid   = tDeliveredPaid + tDeposit;
  const tTotalRem    = tTotal - tTotalPaid;

  const cpbhOf = o => (o.compCosts||[]).filter(x=>["Chi phí Ship hàng","Chi phí hoa hồng","Chi phí lắp đặt"].includes(x.type)).reduce((s,x)=>s+(x.amount||0),0) + (o.importExpense||0) + (o.expense||0);
  const tDelivCost   = delivered.reduce((s,o) => s + calc(o).totalCost, 0);
  const tDelivCPBH   = delivered.reduce((s,o) => s + cpbhOf(o), 0);
  const tDelivProfit = tDelivered - tDelivCost - tDelivCPBH;
  const tDelivMargin = tDelivered > 0 ? Math.round(tDelivProfit*1000/tDelivered)/10 : 0;
  const tUndelivCost  = undelivered.reduce((s,o) => s + calc(o).totalCost, 0);
  const tUndelivGross = tUndelivered - tUndelivCost;
  const tUndelivGrossMargin = tUndelivered > 0 ? Math.round(tUndelivGross*1000/tUndelivered)/10 : 0;

  const rows = [...filtered].sort((a,b) => parseViDate(b.dt) - parseViDate(a.dt));
  const RS_PER_PAGE = 30;
  const totalRSPages = Math.ceil(rows.length / RS_PER_PAGE);
  const pagedRS = rows.slice((rPage - 1) * RS_PER_PAGE, rPage * RS_PER_PAGE);

  const onExport = () => exportCSV("bao-cao-ban-hang",
    ["Ngày","Số đơn","Khách hàng","Doanh thu","Giá vốn","CPBH","Lãi/Lỗ","%","Đã thu","Còn lại"],
    rows.map(o => {
      const c = calc(o);
      const cpbh = cpbhOf(o);
      const laiLo = c.total - c.totalCost - cpbh;
      const pct = c.total ? (laiLo/c.total*100).toFixed(1) : "0.0";
      const dtPart = String(o.dt||"").split(" ").find(p=>p.includes("/"))||"";
      return [dtPart.replace(",",""), o.id, o.name, c.total, c.totalCost, cpbh, laiLo, pct, o.paid||0, Math.max(0,c.remaining)];
    }));

  const totRevenue = rows.reduce((s,o)=>s+calc(o).total,0);
  const totCost    = rows.reduce((s,o)=>s+calc(o).totalCost,0);
  const totCpbh    = rows.reduce((s,o)=>s+cpbhOf(o),0);
  const totLai     = totRevenue - totCost - totCpbh;
  const totPaid    = rows.reduce((s,o)=>s+(o.paid||0),0);
  const totRem     = rows.reduce((s,o)=>s+Math.max(0,calc(o).remaining),0);

  const tblHead = /*#__PURE__*/React.createElement(React.Fragment, null,
    /*#__PURE__*/React.createElement(Th, null, "Ngày"),
    /*#__PURE__*/React.createElement(Th, null, "Số đơn"),
    /*#__PURE__*/React.createElement(Th, {style:{minWidth:160}}, "Khách hàng"),
    /*#__PURE__*/React.createElement(Th, {right:true}, "Doanh thu"),
    /*#__PURE__*/React.createElement(Th, {right:true}, "Giá vốn"),
    /*#__PURE__*/React.createElement(Th, {right:true}, "CPBH"),
    /*#__PURE__*/React.createElement(Th, {right:true}, "Lãi/Lỗ"),
    /*#__PURE__*/React.createElement(Th, {right:true}, "%"),
    /*#__PURE__*/React.createElement(Th, {right:true}, "Đã thu"),
    /*#__PURE__*/React.createElement(Th, {right:true}, "Còn lại"));

  const tblBody = rows.length === 0
    ? /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("td", {colSpan:10, className:"px-4 py-8 text-center text-slate-400"}, "Không có dữ liệu trong khoảng thời gian này"))
    : /*#__PURE__*/React.createElement(React.Fragment, null,
        pagedRS.map(o => {
          const c = calc(o);
          const cpbh = cpbhOf(o);
          const laiLo = c.total - c.totalCost - cpbh;
          const pct = c.total ? (laiLo/c.total*100).toFixed(1) : "0.0";
          const dtPart = String(o.dt||"").split(" ").find(p=>p.includes("/"))||"";
          return /*#__PURE__*/React.createElement("tr", {key:o.id, className:"hover:bg-slate-50/60"},
            /*#__PURE__*/React.createElement("td", {className:"px-4 py-3 text-slate-500 whitespace-nowrap text-sm"}, dtPart.replace(",","")),
            /*#__PURE__*/React.createElement("td", {className:"px-4 py-3 whitespace-nowrap"},
              /*#__PURE__*/React.createElement("button", {onClick:()=>onOpenOrder&&onOpenOrder(o.id), className:"inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset bg-[#ffedd5] text-[#7c2d12] ring-[#fed7aa] hover:bg-[#fed7aa]"}, o.id)),
            /*#__PURE__*/React.createElement("td", {className:"px-4 py-3 text-slate-800"}, o.name),
            /*#__PURE__*/React.createElement("td", {className:"px-4 py-3 text-right tabular-nums font-medium text-slate-800"}, vnd(c.total)),
            /*#__PURE__*/React.createElement("td", {className:"px-4 py-3 text-right tabular-nums text-slate-500"}, vnd(c.totalCost)),
            /*#__PURE__*/React.createElement("td", {className:"px-4 py-3 text-right tabular-nums text-slate-500"}, cpbh?vnd(cpbh):""),
            /*#__PURE__*/React.createElement("td", {className:"px-4 py-3 text-right tabular-nums font-medium "+(laiLo>=0?"text-[#047857]":"text-[#c2410c]")}, vnd(laiLo)),
            /*#__PURE__*/React.createElement("td", {className:"px-4 py-3 text-right tabular-nums "+(parseFloat(pct)>=0?"text-[#047857]":"text-[#B91C1C]")}, pct+"%"),
            /*#__PURE__*/React.createElement("td", {className:"px-4 py-3 text-right tabular-nums text-[#92400e]"}, (o.paid||0)>0?vnd(o.paid||0):""),
            /*#__PURE__*/React.createElement("td", {className:"px-4 py-3 text-right tabular-nums font-medium "+(c.remaining>0?"text-[#B91C1C]":"text-slate-400")}, c.remaining>0?vnd(c.remaining):""));
        }),
        /*#__PURE__*/React.createElement("tr", {className:"border-t-2 border-[#fdba74] bg-[#fed7aa]"},
          /*#__PURE__*/React.createElement("td", {colSpan:3, className:"px-4 py-3 text-sm text-slate-800", style:{fontWeight:700}}, "TỔNG CỘNG"),
          /*#__PURE__*/React.createElement("td", {className:"px-4 py-3 text-right tabular-nums text-sm text-slate-800", style:{fontWeight:700}}, vnd(totRevenue)),
          /*#__PURE__*/React.createElement("td", {className:"px-4 py-3 text-right tabular-nums text-sm text-slate-800", style:{fontWeight:700}}, vnd(totCost)),
          /*#__PURE__*/React.createElement("td", {className:"px-4 py-3 text-right tabular-nums text-sm text-slate-800", style:{fontWeight:700}}, totCpbh?vnd(totCpbh):""),
          /*#__PURE__*/React.createElement("td", {className:"px-4 py-3 text-right tabular-nums text-sm "+(totLai>=0?"text-[#047857]":"text-[#c2410c]"), style:{fontWeight:700}}, vnd(totLai)),
          /*#__PURE__*/React.createElement("td", {className:"px-4 py-3"}),
          /*#__PURE__*/React.createElement("td", {className:"px-4 py-3 text-right tabular-nums text-sm text-[#92400e]", style:{fontWeight:700}}, vnd(totPaid)),
          /*#__PURE__*/React.createElement("td", {className:"px-4 py-3 text-right tabular-nums text-sm "+(totRem>0?"text-[#B91C1C]":"text-slate-400"), style:{fontWeight:700}}, totRem>0?vnd(totRem):"")));

  return /*#__PURE__*/React.createElement("div", {className:"space-y-4"},
    /*#__PURE__*/React.createElement("div", {className:"flex flex-wrap items-end gap-2"},
      /*#__PURE__*/React.createElement(DateRangeFilter, {initFrom:fromDate, initTo:toDate, onApply:(f,t)=>{setFromDate(f);setToDate(t);}}),
      /*#__PURE__*/React.createElement("div", {className:"flex items-end gap-2"},
        /*#__PURE__*/React.createElement(PrintBtn, null),
        /*#__PURE__*/React.createElement(ExportBtn, {onClick: onExport}))),
    /*#__PURE__*/React.createElement("div", {className:"grid grid-cols-3 gap-3"},
      /*#__PURE__*/React.createElement("div", {className:"rounded-xl border border-slate-200 bg-white p-4 shadow-sm"},
        /*#__PURE__*/React.createElement("p", {className:"text-xs font-medium uppercase tracking-wide text-slate-500"}, "Đơn đã giao"),
        /*#__PURE__*/React.createElement("span", {className:"mt-1 inline-block rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500"}, delivered.length+" đơn"),
        /*#__PURE__*/React.createElement("p", {className:"mt-2 text-2xl font-semibold tabular-nums text-right text-[#047857]"}, vnd(tDelivered)),
        delivered.length > 0 && /*#__PURE__*/React.createElement("div", {className:"mt-3 space-y-1.5 border-t border-slate-100 pt-3"},
          /*#__PURE__*/React.createElement("div", {className:"flex justify-between text-xs"},
            /*#__PURE__*/React.createElement("span", {className:"text-slate-400"}, "Giá vốn"),
            /*#__PURE__*/React.createElement("span", {className:"tabular-nums text-slate-500"}, "−"+vnd(tDelivCost))),
          tDelivCPBH > 0 && /*#__PURE__*/React.createElement("div", {className:"flex justify-between text-xs"},
            /*#__PURE__*/React.createElement("span", {className:"text-slate-400"}, "CPBH"),
            /*#__PURE__*/React.createElement("span", {className:"tabular-nums text-slate-500"}, "−"+vnd(tDelivCPBH))),
          /*#__PURE__*/React.createElement("div", {className:"flex justify-between text-xs border-t border-slate-100 pt-1.5 mt-1"},
            /*#__PURE__*/React.createElement("span", {className:"font-medium text-[#92400e]"}, "Lợi nhuận"),
            /*#__PURE__*/React.createElement("span", {className:"tabular-nums font-semibold "+(tDelivProfit>=0?"text-emerald-700":"text-[#B91C1C]")},
              (tDelivProfit>=0?"":"-")+vnd(Math.abs(tDelivProfit))
            ))
        )),
      /*#__PURE__*/React.createElement("div", {className:"rounded-xl border border-slate-200 bg-white p-4 shadow-sm flex flex-col justify-center gap-3"},
        /*#__PURE__*/React.createElement("div", null,
          /*#__PURE__*/React.createElement("p", {className:"text-xs font-medium uppercase tracking-wide text-right text-slate-500"}, "Tiền đã thu"),
          /*#__PURE__*/React.createElement("p", {className:"mt-1 text-xl font-semibold tabular-nums text-right text-[#047857]"}, vnd(tDeliveredPaid))),
        /*#__PURE__*/React.createElement("div", {className:"border-t border-slate-100 pt-3"},
          /*#__PURE__*/React.createElement("p", {className:"text-xs font-medium uppercase tracking-wide text-right text-slate-500"}, "Tiền phải thu"),
          /*#__PURE__*/React.createElement("p", {className:"mt-1 text-xl font-semibold tabular-nums text-right text-[#B91C1C]"}, vnd(tReceivable)))),
      /*#__PURE__*/React.createElement("div", {className:"row-span-2 rounded-xl border border-slate-200 bg-white p-5 shadow-sm flex flex-col justify-center"},
        /*#__PURE__*/React.createElement("div", {className:"flex items-center justify-end gap-1.5"},
          /*#__PURE__*/React.createElement("p", {className:"text-xs font-medium uppercase tracking-wide text-slate-500"}, "Tổng giá trị đơn hàng"),
          /*#__PURE__*/React.createElement("span", {className:"rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500"}, (delivered.length+undelivered.length)+" đơn")),
        /*#__PURE__*/React.createElement("p", {className:"mt-2 text-3xl font-bold tabular-nums text-right text-[#92400e]"}, vnd(tTotal)),
        /*#__PURE__*/React.createElement("div", {className:"mt-4 w-full border-t border-slate-100 pt-3 flex flex-col gap-2"},
          /*#__PURE__*/React.createElement("div", {className:"flex items-center justify-between"},
            /*#__PURE__*/React.createElement("span", {className:"text-xs text-slate-500"}, "Tổng đã thu"),
            /*#__PURE__*/React.createElement("span", {className:"text-sm font-semibold tabular-nums text-[#047857]"}, vnd(tTotalPaid))),
          /*#__PURE__*/React.createElement("div", {className:"flex items-center justify-between"},
            /*#__PURE__*/React.createElement("span", {className:"text-xs text-slate-500"}, "Còn lại"),
            /*#__PURE__*/React.createElement("span", {className:"text-sm font-semibold tabular-nums "+(tTotalRem>0?"text-[#B91C1C]":"text-slate-400")}, vnd(tTotalRem)))),
        delivered.length > 0 && /*#__PURE__*/React.createElement("div", {className:"mt-3 w-full border-t border-[#fed7aa] pt-3 flex flex-col gap-2"},
          /*#__PURE__*/React.createElement("div", {className:"flex items-center justify-between"},
            /*#__PURE__*/React.createElement("span", {className:"text-xs font-medium text-[#92400e]"}, "LN thực (đã giao)"),
            /*#__PURE__*/React.createElement("span", {className:"text-sm font-bold tabular-nums "+(tDelivProfit>=0?"text-emerald-700":"text-[#B91C1C]")},
              (tDelivProfit>=0?"":"-")+vnd(Math.abs(tDelivProfit)))),
          undelivered.length > 0 && /*#__PURE__*/React.createElement("div", {className:"flex items-center justify-between"},
            /*#__PURE__*/React.createElement("span", {className:"text-xs text-slate-500"}, "Lãi gộp tạm (chưa giao)"),
            /*#__PURE__*/React.createElement("span", {className:"text-sm font-semibold tabular-nums "+(tUndelivGross>=0?"text-emerald-600":"text-[#B91C1C]")},
              (tUndelivGross>=0?"":"-")+vnd(Math.abs(tUndelivGross)))))),
      /*#__PURE__*/React.createElement("div", {className:"rounded-xl border border-slate-200 bg-white p-4 shadow-sm"},
        /*#__PURE__*/React.createElement("p", {className:"text-xs font-medium uppercase tracking-wide text-slate-500"}, "Đơn chưa giao"),
        /*#__PURE__*/React.createElement("span", {className:"mt-1 inline-block rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500"}, undelivered.length+" đơn"),
        /*#__PURE__*/React.createElement("p", {className:"mt-2 text-2xl font-semibold tabular-nums text-right text-[#B91C1C]"}, vnd(tUndelivered)),
        undelivered.length > 0 && /*#__PURE__*/React.createElement("div", {className:"mt-3 space-y-1.5 border-t border-slate-100 pt-3"},
          /*#__PURE__*/React.createElement("div", {className:"flex justify-between text-xs"},
            /*#__PURE__*/React.createElement("span", {className:"text-slate-400"}, "Giá vốn tạm"),
            /*#__PURE__*/React.createElement("span", {className:"tabular-nums text-slate-500"}, "−"+vnd(tUndelivCost))),
          /*#__PURE__*/React.createElement("div", {className:"flex justify-between text-xs border-t border-slate-100 pt-1.5 mt-1"},
            /*#__PURE__*/React.createElement("span", {className:"font-medium text-[#92400e]"}, "Lãi gộp tạm"),
            /*#__PURE__*/React.createElement("span", {className:"tabular-nums font-semibold "+(tUndelivGross>=0?"text-emerald-600":"text-[#B91C1C]")},
              (tUndelivGross>=0?"":"-")+vnd(Math.abs(tUndelivGross))
            )),
          /*#__PURE__*/React.createElement("p", {className:"text-[10px] italic text-slate-400 text-right"}, "Chưa tính CPBH")
        )),
      /*#__PURE__*/React.createElement("div", {className:"rounded-xl border border-slate-200 bg-white p-4 shadow-sm flex flex-col justify-center gap-3"},
        /*#__PURE__*/React.createElement("div", null,
          /*#__PURE__*/React.createElement("p", {className:"text-xs font-medium uppercase tracking-wide text-right text-slate-500"}, "Tiền đặt cọc"),
          /*#__PURE__*/React.createElement("p", {className:"mt-1 text-xl font-semibold tabular-nums text-right text-[#92400e]"}, vnd(tDeposit))),
        /*#__PURE__*/React.createElement("div", {className:"border-t border-slate-100 pt-3"},
          /*#__PURE__*/React.createElement("p", {className:"text-xs font-medium uppercase tracking-wide text-right text-slate-500"}, "Tiền chưa thu"),
          /*#__PURE__*/React.createElement("p", {className:"mt-1 text-xl font-semibold tabular-nums text-right text-[#B91C1C]"}, vnd(tUndelivRem))))),
    /*#__PURE__*/React.createElement(Card, {title:"Chi tiết theo đơn hàng"},
      /*#__PURE__*/React.createElement("div", {className:"-mx-5 -mb-5"},
        /*#__PURE__*/React.createElement(TableShell, {head: tblHead}, tblBody)),
      totalRSPages > 1 && /*#__PURE__*/React.createElement("div", {className: "mt-3 flex items-center justify-between gap-3 flex-wrap"},
        /*#__PURE__*/React.createElement("span", {className: "text-xs text-slate-500"},
          `${(rPage-1)*RS_PER_PAGE+1}–${Math.min(rPage*RS_PER_PAGE, rows.length)} / ${rows.length} đơn`),
        /*#__PURE__*/React.createElement("div", {className: "flex items-center gap-1"},
          /*#__PURE__*/React.createElement("button", {
            disabled: rPage === 1,
            onClick: () => setRPage(p => Math.max(1, p-1)),
            className: "rounded px-2 py-1 text-sm text-slate-600 hover:bg-slate-100 disabled:opacity-30"
          }, "Trước"),
          Array.from({length: totalRSPages}, (_, i) => i+1)
            .filter(n => n === 1 || n === totalRSPages || Math.abs(n - rPage) <= 1)
            .reduce((acc, n, i, arr) => { if (i > 0 && n - arr[i-1] > 1) acc.push("..."); acc.push(n); return acc; }, [])
            .map((n, i) => n === "..." ?
              /*#__PURE__*/React.createElement("span", {key: `e${i}`, className: "px-1 text-slate-400"}, "...") :
              /*#__PURE__*/React.createElement("button", {key: n, onClick: () => setRPage(n),
                className: `min-w-[2rem] rounded px-2 py-1 text-sm font-medium ${rPage === n ? "bg-[#92400e] text-white" : "text-slate-600 hover:bg-slate-100"}`
              }, n)),
          /*#__PURE__*/React.createElement("button", {
            disabled: rPage === totalRSPages,
            onClick: () => setRPage(p => Math.min(totalRSPages, p+1)),
            className: "rounded px-2 py-1 text-sm text-slate-600 hover:bg-slate-100 disabled:opacity-30"
          }, "Sau")))));
}

/* báo cáo sản phẩm đặt hàng (theo mẫu) */
function ReportPreorder({ orders = [] }) {
  const [fromDate, setFromDate] = useState(localMonthStart());
  const [toDate, setToDate] = useState(localToday());
  const [q, setQ] = useState("");
  const [expanded, setExpanded] = useState(new Set());
  const { whInItems = [] } = useInventory() || {};
  const _pISO = s => { const [y,m,d] = s.split("-"); return new Date(+y,+m-1,+d); };
  const inR = dt => { const d = parseViDate(dt); return (!fromDate || d >= _pISO(fromDate)) && (!toDate || d <= new Date(_pISO(toDate).setHours(23,59,59))); };
  const activeOrders = orders.filter(o => !o.draft && o.orderStatus !== "Huỷ" && o.orderStatus !== "Hủy" && inR(o.dt));
  const map = {};
  activeOrders.forEach(o => {
    (o.items || []).forEach(it => {
      if (!it.name) return;
      if (!map[it.name]) map[it.name] = { prod: it.name, unit: it.unit || "", ordered: 0, refs: [] };
      map[it.name].ordered += it.qty || 0;
      map[it.name].refs.push({ id: o.id, cust: o.name || "", qty: it.qty || 0, dt: o.dt, status: o.orderStatus || "" });
    });
  });
  const allRows = Object.values(map).map(r => ({ ...r, stock: stockOfLive(r.prod, whInItems) })).sort((a,b) => b.ordered - a.ordered);
  const rows = allRows.filter(r => !q || r.prod.toLowerCase().includes(q.toLowerCase()));
  const toggle = key => setExpanded(s => { const n = new Set(s); n.has(key) ? n.delete(key) : n.add(key); return n; });
  const onExport = () => exportCSV("bao-cao-san-pham-dat-hang", ["STT", "Tên sản phẩm", "ĐVT", "Đang đặt", "Tồn kho", "Cần mua"], rows.map((r, i) => [i + 1, r.prod, r.unit, r.ordered, r.stock, Math.max(0, r.ordered - r.stock)]));
  const statusBadge = s => {
    const m = {"Đang xử lý":"bg-[#fef9f0] text-[#92400e]","Chờ xử lý":"bg-[#fef9f0] text-[#92400e]","Đã xác nhận":"bg-amber-50 text-amber-700","Đã giao":"bg-emerald-50 text-emerald-700","Hoàn thành":"bg-emerald-50 text-emerald-700"};
    return /*#__PURE__*/React.createElement("span", {className: "rounded-full px-2 py-0.5 text-[11px] font-medium " + (m[s] || "bg-slate-100 text-slate-500")}, s || "—");
  };
  const tblRows = [];
  rows.forEach((r, i) => {
    const need = Math.max(0, r.ordered - r.stock);
    const isOpen = expanded.has(r.prod);
    tblRows.push(/*#__PURE__*/React.createElement("tr", {key: r.prod, className: "hover:bg-slate-50/60 " + (isOpen ? "bg-orange-50/40" : "")},
      /*#__PURE__*/React.createElement("td", {className: "px-3 py-2.5 text-center text-slate-400 text-sm"}, i + 1),
      /*#__PURE__*/React.createElement("td", {className: "px-3 py-2.5 text-sm font-medium text-slate-800"}, r.prod),
      /*#__PURE__*/React.createElement("td", {className: "px-3 py-2.5 text-sm text-slate-500 text-center"}, r.unit || "—"),
      /*#__PURE__*/React.createElement("td", {className: "px-3 py-2.5 text-right tabular-nums font-semibold text-slate-700"}, r.ordered),
      /*#__PURE__*/React.createElement("td", {className: "px-3 py-2.5 text-right tabular-nums " + (r.stock > 0 ? "text-emerald-600" : "text-slate-300")}, r.stock > 0 ? r.stock : "0"),
      /*#__PURE__*/React.createElement("td", {className: "px-3 py-2.5 text-right tabular-nums font-semibold " + (need > 0 ? "text-[#B91C1C]" : "text-slate-300")}, need > 0 ? need : "—"),
      /*#__PURE__*/React.createElement("td", {className: "px-3 py-2.5 text-center"},
        /*#__PURE__*/React.createElement("button", {onClick: () => toggle(r.prod), className: "inline-flex items-center gap-1 rounded px-2 py-1 text-xs text-slate-500 hover:bg-slate-100"},
          /*#__PURE__*/React.createElement("span", {className: "font-medium text-slate-600"}, r.refs.length, " đơn"),
          /*#__PURE__*/React.createElement(isOpen ? ChevronDown : ChevronRight, {className: "h-3.5 w-3.5"})))));
    if (isOpen) {
      tblRows.push(/*#__PURE__*/React.createElement("tr", {key: r.prod + "_sub"},
        /*#__PURE__*/React.createElement("td", {colSpan: 7, className: "px-0 py-0"},
          /*#__PURE__*/React.createElement("table", {className: "w-full border-t border-b border-orange-100 bg-orange-50/30"},
            /*#__PURE__*/React.createElement("thead", null,
              /*#__PURE__*/React.createElement("tr", {className: "text-[11px] font-semibold uppercase text-slate-400"},
                /*#__PURE__*/React.createElement("td", {className: "py-1.5 pl-12 pr-3 w-36"}, "Đơn hàng"),
                /*#__PURE__*/React.createElement("td", {className: "py-1.5 px-3"}, "Khách hàng"),
                /*#__PURE__*/React.createElement("td", {className: "py-1.5 px-3 text-right w-24"}, "SL đặt"),
                /*#__PURE__*/React.createElement("td", {className: "py-1.5 px-3 w-36"}, "Ngày đặt"),
                /*#__PURE__*/React.createElement("td", {className: "py-1.5 px-3 w-36"}, "Trạng thái"))),
            /*#__PURE__*/React.createElement("tbody", null, r.refs.map((ref, ri) =>
              /*#__PURE__*/React.createElement("tr", {key: ri, className: "border-t border-orange-100/60 hover:bg-orange-50/50"},
                /*#__PURE__*/React.createElement("td", {className: "py-2 pl-12 pr-3"},
                  /*#__PURE__*/React.createElement("span", {className: "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset bg-[#fef9f0] text-[#92400e] ring-[#b45309]"}, ref.id)),
                /*#__PURE__*/React.createElement("td", {className: "py-2 px-3 text-sm text-slate-700"}, ref.cust),
                /*#__PURE__*/React.createElement("td", {className: "py-2 px-3 text-right tabular-nums text-sm font-medium text-slate-700"}, ref.qty),
                /*#__PURE__*/React.createElement("td", {className: "py-2 px-3 text-xs text-slate-500"}, ref.dt),
                /*#__PURE__*/React.createElement("td", {className: "py-2 px-3"}, statusBadge(ref.status)))))))));
    }
  });
  return /*#__PURE__*/React.createElement("div", {className: "space-y-4"},
    /*#__PURE__*/React.createElement("h2", {className: "text-[16px] font-semibold text-[#92400e]"}, "Báo cáo sản phẩm đặt hàng"),
    /*#__PURE__*/React.createElement("div", {className: "flex flex-wrap items-end gap-3"},
      /*#__PURE__*/React.createElement(DateRangeFilter, {initFrom:fromDate, initTo:toDate, onApply:(f,t)=>{setFromDate(f);setToDate(t);}}), 
      /*#__PURE__*/React.createElement("div", {className: "min-w-[180px] flex-1"},
        /*#__PURE__*/React.createElement("label", {className: "mb-1 block text-[13px] font-medium text-slate-500"}, "Tìm kiếm sản phẩm"),
        /*#__PURE__*/React.createElement("input", {value: q, onChange: e => setQ(e.target.value), placeholder: "Tên sản phẩm…", className: `${field} w-full`})),
      /*#__PURE__*/React.createElement(PrintBtn, null), /*#__PURE__*/React.createElement(ExportBtn, {onClick: onExport})),
    /*#__PURE__*/React.createElement(TableShell, {
      head: /*#__PURE__*/React.createElement(React.Fragment, null,
        /*#__PURE__*/React.createElement(Th, {center:true, style:{width:50}}, "STT"),
        /*#__PURE__*/React.createElement(Th, {style:{minWidth:120}}, "Tên sản phẩm"),
        /*#__PURE__*/React.createElement(Th, {center:true, style:{width:108}}, "ĐVT"),
        /*#__PURE__*/React.createElement(Th, {right:true, style:{width:138}}, "Đang đặt"),
        /*#__PURE__*/React.createElement(Th, {right:true, style:{width:138}}, "Tồn kho"),
        /*#__PURE__*/React.createElement(Th, {right:true, style:{width:148}}, "Cần mua"),
        /*#__PURE__*/React.createElement(Th, {center:true, style:{width:138}}, "Đơn hàng"))
    }, tblRows));
}
function ReportStaff({ orders = [] }) {
  const [fromDate, setFromDate] = useState(localMonthStart());
  const [toDate, setToDate] = useState(localToday());
  const [staffFilter, setStaffFilter] = useState("Tất cả");
  const _pISO = s => { const [y,m,d] = s.split("-"); return new Date(+y,+m-1,+d); };
  const inR = dt => { const d = parseViDate(dt); return (!fromDate || d >= _pISO(fromDate)) && (!toDate || d <= new Date(_pISO(toDate).setHours(23,59,59))); };
  const activeOrders = orders.filter(o => !o.draft && o.orderStatus !== "Huỷ" && o.orderStatus !== "Hủy" && inR(o.dt));
  const staffNames = [...new Set(activeOrders.map(o => o.staff).filter(Boolean))].sort();
  const filtered = staffFilter === "Tất cả" ? activeOrders : activeOrders.filter(o => o.staff === staffFilter);
  const map = {};
  filtered.forEach(o => {
    const s = o.staff || "Chưa phân công";
    if (!map[s]) map[s] = { name: s, orders: 0, custs: new Set(), rev: 0, returned: 0, paid: 0 };
    const c = calc(o);
    map[s].orders += 1;
    map[s].custs.add(o.name || "");
    map[s].rev += c.total;
    map[s].returned += (o.returns || []).reduce((x, r) => x + (r.amount || 0), 0);
    map[s].paid += o.paid || 0;
  });
  const data = Object.values(map).map(s => ({ ...s, custs: s.custs.size, remain: s.rev - s.paid })).sort((a,b) => b.rev - a.rev);
  const totals = data.reduce((acc, s) => ({ orders: acc.orders+s.orders, custs: acc.custs+s.custs, rev: acc.rev+s.rev, returned: acc.returned+s.returned, paid: acc.paid+s.paid, remain: acc.remain+s.remain }), {orders:0,custs:0,rev:0,returned:0,paid:0,remain:0});
  const onExport = () => exportCSV("bao-cao-nhan-vien", ["Nhân viên", "Số đơn", "Số khách", "Doanh thu", "Tiền hàng trả lại", "Đã thu", "Còn lại"], data.map(s => [s.name, s.orders, s.custs, s.rev, s.returned, s.paid, s.remain]));
  return /*#__PURE__*/React.createElement("div", {
    className: "space-y-4"
  }, /*#__PURE__*/React.createElement("h2", {
    className: "text-[16px] font-semibold text-[#92400e]"
  }, "Báo cáo nhân viên"), /*#__PURE__*/React.createElement("div", {
    className: "flex flex-wrap items-end gap-3"
  }, /*#__PURE__*/React.createElement(DateRangeFilter, {initFrom:fromDate, initTo:toDate, onApply:(f,t)=>{setFromDate(f);setToDate(t);}}), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: "mb-1 block text-[13px] font-medium text-slate-500"
  }, "Nhân viên"), /*#__PURE__*/React.createElement("select", {
    value: staffFilter, onChange: e => setStaffFilter(e.target.value), className: field
  }, /*#__PURE__*/React.createElement("option", null, "Tất cả"), staffNames.map(s => /*#__PURE__*/React.createElement("option", {key: s}, s)))),
  /*#__PURE__*/React.createElement(PrintBtn, null), /*#__PURE__*/React.createElement(ExportBtn, {onClick: onExport})),
  /*#__PURE__*/React.createElement(TableShell, {
    minW: "900px",
    head: /*#__PURE__*/React.createElement(React.Fragment, null,
      /*#__PURE__*/React.createElement(Th, {style:{minWidth:140}}, "Nhân viên"),
      /*#__PURE__*/React.createElement(Th, {right:true}, "Số đơn"),
      /*#__PURE__*/React.createElement(Th, {right:true}, "Số khách"),
      /*#__PURE__*/React.createElement(Th, {right:true}, "Doanh thu"),
      /*#__PURE__*/React.createElement(Th, {right:true}, "Tiền hàng trả lại"),
      /*#__PURE__*/React.createElement(Th, {right:true}, "Đã thu"),
      /*#__PURE__*/React.createElement(Th, {right:true}, "Còn lại"))
  }, data.map(s => /*#__PURE__*/React.createElement("tr", {key: s.name, className: "hover:bg-slate-50/60"},
    /*#__PURE__*/React.createElement("td", {className: "px-4 py-3 font-medium text-slate-800"}, s.name),
    /*#__PURE__*/React.createElement("td", {className: "px-4 py-3 text-right tabular-nums text-slate-600"}, s.orders),
    /*#__PURE__*/React.createElement("td", {className: "px-4 py-3 text-right tabular-nums text-slate-600"}, s.custs),
    /*#__PURE__*/React.createElement("td", {className: "px-4 py-3 text-right font-medium tabular-nums text-slate-800"}, vnd(s.rev)),
    /*#__PURE__*/React.createElement("td", {className: "px-4 py-3 text-right tabular-nums text-amber-600"}, s.returned > 0 ? vnd(s.returned) : "—"),
    /*#__PURE__*/React.createElement("td", {className: "px-4 py-3 text-right tabular-nums text-[#92400e]"}, vnd(s.paid)),
    /*#__PURE__*/React.createElement("td", {className: `px-4 py-3 text-right tabular-nums ${s.remain > 0 ? "text-[#B91C1C]" : "text-slate-300"}`}, s.remain > 0 ? vnd(s.remain) : ""))),
  data.length > 1 && /*#__PURE__*/React.createElement("tr", {className: "border-t-2 border-slate-200 bg-slate-50 font-semibold"},
    /*#__PURE__*/React.createElement("td", {className: "px-4 py-2.5 text-sm text-slate-600"}, "Tổng cộng"),
    /*#__PURE__*/React.createElement("td", {className: "px-4 py-2.5 text-right tabular-nums text-slate-700"}, totals.orders),
    /*#__PURE__*/React.createElement("td", {className: "px-4 py-2.5 text-right tabular-nums text-slate-700"}, totals.custs),
    /*#__PURE__*/React.createElement("td", {className: "px-4 py-2.5 text-right tabular-nums text-slate-800"}, vnd(totals.rev)),
    /*#__PURE__*/React.createElement("td", {className: "px-4 py-2.5 text-right tabular-nums text-amber-600"}, totals.returned > 0 ? vnd(totals.returned) : "—"),
    /*#__PURE__*/React.createElement("td", {className: "px-4 py-2.5 text-right tabular-nums text-[#92400e]"}, vnd(totals.paid)),
    /*#__PURE__*/React.createElement("td", {className: `px-4 py-2.5 text-right tabular-nums ${totals.remain > 0 ? "text-[#B91C1C]" : "text-slate-300"}`}, totals.remain > 0 ? vnd(totals.remain) : ""))));
}
const CONTRACT_TEMPLATES = [
  {key:"HĐMB-TBVS",     label:"HĐMB Thiết bị vệ sinh", icon:"🚿"},
  {key:"HĐMB-TBB",      label:"HĐMB Thiết bị bếp",     icon:"🍳"},
  {key:"HĐMB-TBVS-TBB", label:"HĐMB TBVS & Bếp",       icon:"🏠"},
];

function Contracts({orders = []}) {
  const notify = useToast();
  const [contracts, , ] = useCollection("contracts");
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [q, setQ] = useState("");
  const [addOrderId, setAddOrderId] = useState("");

  const today = () => { const d=new Date(); return `${String(d.getDate()).padStart(2,"0")}/${String(d.getMonth()+1).padStart(2,"0")}/${d.getFullYear()}`; };
  const emptyForm = {
    template:"HĐMB-TBVS", contractNum:"", signDate:today(), duration:"12 tháng",
    deliveryAddr:"", deposit:0,
    companyName:"", companyTax:"", companyAddr:"", companyPhone:"",
    custName:"", custPhone:"", custTax:"", custAddr:"",
    orderIds:[], note:""
  };
  const [form, setForm] = useState(emptyForm);
  const set = (k,v) => setForm(f=>({...f,[k]:v}));

  const PREFIX_MAP = {"HĐMB-TBVS":"TBVS","HĐMB-TBB":"TBB","HĐMB-TBVS-TBB":"TBVS-TBB"};
  const autoNum = (tpl) => {
    const p = PREFIX_MAP[tpl] || "HĐ";
    const yr = String(new Date().getFullYear()).slice(-2);
    const pat = `HĐ-${p}${yr}/`;
    const n = contracts.filter(c => (c.contractNum||"").startsWith(pat)).length + 1;
    return `${pat}${String(n).padStart(2,"0")}`;
  };
  const openNew  = () => { const num = autoNum(emptyForm.template); setForm({...emptyForm, contractNum:num}); setEditId(null); setAddOrderId(""); setShowForm(true); };
  const openEdit = c  => { setForm({...emptyForm,...c}); setEditId(c.id); setAddOrderId(""); setShowForm(true); };

  const addToAppendix = () => {
    if (!addOrderId || (form.orderIds||[]).includes(addOrderId)) return;
    const o = orders.find(x => x.id === addOrderId);
    if (!o) return;
    set("orderIds", [...(form.orderIds||[]), addOrderId]);
    if (!form.custName) set("custName", o.name||"");
    if (!form.custPhone) set("custPhone", o.phone||"");
    if (!form.custAddr)  set("custAddr",  o.addr||"");
    setAddOrderId("");
  };
  const removeOrder = id => set("orderIds", (form.orderIds||[]).filter(x => x !== id));

  const appendixItems = (form.orderIds||[]).flatMap(oid => {
    const o = orders.find(x => x.id === oid);
    return (o?.items||[]).filter(it=>it.name).map(it => ({...it, orderId:oid}));
  });
  const totalValue = appendixItems.reduce((s,it) => s + (it.price||0)*(it.qty||0), 0);

  const save = async () => {
    if (!form.contractNum) { notify("Vui lòng nhập số hợp đồng"); return; }
    const id = editId || ("HD" + Date.now());
    await saveDoc("contracts", id, {...form, value:totalValue, id})
      .then(() => { notify(editId ? "Đã cập nhật hợp đồng" : "Đã lưu hợp đồng"); setShowForm(false); })
      .catch(e => { console.error(e); notify("Lỗi lưu hợp đồng: " + (e.message || "Lỗi kết nối")); });
  };

  const del = async (id) => {
    if (!window.confirm("Xóa hợp đồng này?")) return;
    await deleteDocument("contracts", id)
      .then(() => notify("Đã xóa hợp đồng"))
      .catch(e => { console.error(e); notify("Lỗi xóa hợp đồng: " + (e.message || "Lỗi kết nối")); });
  };

  const filtered = contracts.filter(c => !q || `${c.contractNum} ${c.custName}`.toLowerCase().includes(q.toLowerCase()));
  const availOrders = orders.filter(o => !o.draft && o.orderStatus !== "Huỷ" && o.orderStatus !== "Hủy");

  const iF = "w-full rounded-[7px] border border-slate-200 bg-white px-3 py-2 text-sm focus:border-[#B45309] focus:outline-none";

  // ── FORM VIEW ──────────────────────────────────────────────────────────────
  if (showForm) {
    const SecNum = ({n}) => /*#__PURE__*/React.createElement("span", {className:"flex h-7 w-7 items-center justify-center rounded-full bg-[#B45309] text-white text-sm font-bold flex-shrink-0"}, n);
    const SecHd = ({n,title,note}) => /*#__PURE__*/React.createElement("div", {className:"mb-4 flex items-center gap-2.5"},
      /*#__PURE__*/React.createElement(SecNum, {n}),
      /*#__PURE__*/React.createElement("span", {className:"text-base font-semibold text-slate-800"}, title),
      note && /*#__PURE__*/React.createElement("span", {className:"ml-auto text-xs text-slate-400"}, note)
    );
    const Lbl = ({children}) => /*#__PURE__*/React.createElement("label", {className:"mb-1 block text-[12px] text-slate-500"}, children);
    const sec = "rounded-xl border border-slate-200 bg-white p-5 mb-4";

    return /*#__PURE__*/React.createElement("div", {className:"min-h-screen bg-[#FBF6F1] -mx-4 -mt-4 px-4 pt-4 pb-10"},
      /*#__PURE__*/React.createElement("div", {className:"max-w-3xl mx-auto"},

        /* Back + Title + Actions */
        /*#__PURE__*/React.createElement("div", {className:"mb-6 flex items-center gap-4"},
          /*#__PURE__*/React.createElement("button", {onClick:()=>setShowForm(false), className:"flex shrink-0 items-center gap-1 text-sm text-slate-500 hover:text-slate-700"},
            /*#__PURE__*/React.createElement(ChevronLeft, {className:"h-4 w-4"}), "Danh sách"),
          /*#__PURE__*/React.createElement("div", {className:"flex-1"}),
          /*#__PURE__*/React.createElement("div", {className:"flex shrink-0 gap-2"},
            /*#__PURE__*/React.createElement("button", {onClick:()=>exportContractWord(form, appendixItems, totalValue), className:"flex items-center gap-1.5 whitespace-nowrap rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"},
              /*#__PURE__*/React.createElement(FileText, {className:"h-4 w-4"}), "Xuất Word"),
            /*#__PURE__*/React.createElement("button", {onClick:()=>printContract(form, appendixItems, totalValue), className:"flex items-center gap-1.5 whitespace-nowrap rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"},
              /*#__PURE__*/React.createElement(Printer, {className:"h-4 w-4"}), "In / Xuất PDF"),
            /*#__PURE__*/React.createElement("button", {onClick:save, className:"flex items-center gap-1.5 whitespace-nowrap rounded-lg bg-[#B45309] px-4 py-2 text-sm font-semibold text-white hover:bg-[#92400e]"},
              /*#__PURE__*/React.createElement(Save, {className:"h-4 w-4"}), "Lưu hợp đồng")
          )
        ),

        /* Section 1: Template */
        /*#__PURE__*/React.createElement("div", {className:sec},
          /*#__PURE__*/React.createElement(SecHd, {n:"1", title:"Chọn mẫu hợp đồng"}),
          /*#__PURE__*/React.createElement("div", {className:"grid grid-cols-3 gap-3"},
            CONTRACT_TEMPLATES.map(t => {
              const active = form.template === t.key;
              return /*#__PURE__*/React.createElement("button", {
                key: t.key, onClick: () => { set("template", t.key); if (!editId) set("contractNum", autoNum(t.key)); },
                className: `rounded-xl border-2 p-4 text-center transition-all ${active ? "border-[#B45309] bg-[#FDF1E5]" : "border-slate-200 bg-white hover:border-[#B45309]/50"}`
              },
                /*#__PURE__*/React.createElement("div", {className:"text-2xl mb-1"}, t.icon),
                /*#__PURE__*/React.createElement("p", {className:`text-sm font-semibold ${active?"text-[#B45309]":"text-slate-700"}`}, t.label),
                /*#__PURE__*/React.createElement("p", {className:"text-xs text-slate-400 mt-0.5"}, t.key)
              );
            })
          )
        ),

        /* Section 2: Contract info */
        /*#__PURE__*/React.createElement("div", {className:sec},
          /*#__PURE__*/React.createElement(SecHd, {n:"2", title:"Thông tin hợp đồng"}),
          /*#__PURE__*/React.createElement("div", {className:"grid grid-cols-3 gap-3"},
            /*#__PURE__*/React.createElement("div", null,
              /*#__PURE__*/React.createElement(Lbl, null, "Số hợp đồng"),
              /*#__PURE__*/React.createElement("input", {value:form.contractNum, onChange:e=>set("contractNum",e.target.value), placeholder:"HĐ-TBVS 01", className:iF})),
            /*#__PURE__*/React.createElement("div", null,
              /*#__PURE__*/React.createElement(Lbl, null, "Ngày ký"),
              /*#__PURE__*/React.createElement("input", {value:form.signDate, onChange:e=>set("signDate",e.target.value), placeholder:"dd/mm/yyyy", className:iF})),
            /*#__PURE__*/React.createElement("div", null,
              /*#__PURE__*/React.createElement(Lbl, null, "Thời hạn"),
              /*#__PURE__*/React.createElement("input", {value:form.duration, onChange:e=>set("duration",e.target.value), placeholder:"12 tháng", className:iF}))
          )
        ),

        /* Section 3: Party info */
        /*#__PURE__*/React.createElement("div", {className:sec},
          /*#__PURE__*/React.createElement(SecHd, {n:"3", title:"Thông tin các bên", note:"các ô đều sửa được"}),
          /*#__PURE__*/React.createElement("div", {className:"grid grid-cols-2 gap-6"},
            /* Bên A */
            /*#__PURE__*/React.createElement("div", null,
              /*#__PURE__*/React.createElement("div", {className:"mb-3 flex gap-2 text-[11px] font-bold uppercase tracking-wide"},
                /*#__PURE__*/React.createElement("span", {className:"text-slate-500"}, "Bên A"),
                /*#__PURE__*/React.createElement("span", {className:"rounded bg-[#FCEBD8] px-2 py-0.5 text-[#B45309]"}, "Bên bán")),
              /*#__PURE__*/React.createElement(Lbl, null, "Tên công ty"),
              /*#__PURE__*/React.createElement("input", {value:form.companyName, onChange:e=>set("companyName",e.target.value), placeholder:"Công ty TNHH…", className:`${iF} mb-2`}),
              /*#__PURE__*/React.createElement(Lbl, null, "MST"),
              /*#__PURE__*/React.createElement("input", {value:form.companyTax, onChange:e=>set("companyTax",e.target.value), placeholder:"0312345678", className:`${iF} mb-2`}),
              /*#__PURE__*/React.createElement(Lbl, null, "Địa chỉ"),
              /*#__PURE__*/React.createElement("input", {value:form.companyAddr, onChange:e=>set("companyAddr",e.target.value), placeholder:"Địa chỉ công ty…", className:`${iF} mb-2`}),
              /*#__PURE__*/React.createElement(Lbl, null, "Số điện thoại"),
              /*#__PURE__*/React.createElement("input", {value:form.companyPhone, onChange:e=>set("companyPhone",e.target.value), placeholder:"033 5252 225", className:iF})
            ),
            /* Bên B */
            /*#__PURE__*/React.createElement("div", null,
              /*#__PURE__*/React.createElement("div", {className:"mb-3 flex gap-2 text-[11px] font-bold uppercase tracking-wide"},
                /*#__PURE__*/React.createElement("span", {className:"text-slate-500"}, "Bên B"),
                /*#__PURE__*/React.createElement("span", {className:"rounded bg-[#FCEBD8] px-2 py-0.5 text-[#B45309]"}, "Khách hàng")),
              /*#__PURE__*/React.createElement(Lbl, null, "Tên khách hàng"),
              /*#__PURE__*/React.createElement("input", {value:form.custName, onChange:e=>set("custName",e.target.value), placeholder:"Nhập…", className:`${iF} mb-2`}),
              /*#__PURE__*/React.createElement(Lbl, null, "MST / CCCD"),
              /*#__PURE__*/React.createElement("input", {value:form.custTax||"", onChange:e=>set("custTax",e.target.value), placeholder:"Nhập MST hoặc CCCD…", className:`${iF} mb-2`}),
              /*#__PURE__*/React.createElement(Lbl, null, "Địa chỉ"),
              /*#__PURE__*/React.createElement("input", {value:form.custAddr, onChange:e=>set("custAddr",e.target.value), placeholder:"Nhập địa chỉ khách hàng…", className:`${iF} mb-2`}),
              /*#__PURE__*/React.createElement(Lbl, null, "Số điện thoại"),
              /*#__PURE__*/React.createElement("input", {value:form.custPhone, onChange:e=>set("custPhone",e.target.value), placeholder:"Nhập…", className:iF})
            )
          )
        ),

        /* Section 4: Địa điểm giao hàng */
        /*#__PURE__*/React.createElement("div", {className:sec},
          /*#__PURE__*/React.createElement(SecHd, {n:"4", title:"Địa điểm giao hàng"}),
          /*#__PURE__*/React.createElement("input", {value:form.deliveryAddr||"", onChange:e=>set("deliveryAddr",e.target.value), placeholder:"Địa điểm nhận hàng của khách…", className:`${iF} w-full`})
        ),

        /* Section 5: Đặt cọc */
        /*#__PURE__*/React.createElement("div", {className:sec},
          /*#__PURE__*/React.createElement(SecHd, {n:"5", title:"Số tiền đặt cọc lần 1"}),
          /*#__PURE__*/React.createElement("div", {className:"flex items-center gap-3"},
            /*#__PURE__*/React.createElement("input", {
              type:"text", inputMode:"numeric",
              value: form.deposit ? new Intl.NumberFormat("vi-VN").format(form.deposit) : "",
              onChange: e => { const v = parseFloat(e.target.value.replace(/\./g,"").replace(/,/g,""))||0; set("deposit",v); },
              placeholder:"0",
              className:`${iF} w-60 text-right tabular-nums`
            }),
            /*#__PURE__*/React.createElement("span", {className:"text-sm text-slate-500"}, "VNĐ")
          )
        ),

        /* Section 6: Appendix */
        /*#__PURE__*/React.createElement("div", {className:sec},
          /*#__PURE__*/React.createElement(SecHd, {n:"6", title:"Phụ lục hợp đồng", note:"dữ liệu tự kéo từ đơn đặt hàng"}),

          /* Order selector row */
          /*#__PURE__*/React.createElement("div", {className:"mb-3 flex flex-wrap items-center gap-2"},
            /*#__PURE__*/React.createElement("div", {className:"flex items-center gap-1.5 rounded-lg border border-slate-200 bg-[#FBF6F1] px-2.5 py-1.5 text-xs font-medium text-slate-600"},
              /*#__PURE__*/React.createElement(Link2, {className:"h-3.5 w-3.5 text-[#B45309]"}), "Liên kết đơn hàng"),
            /*#__PURE__*/React.createElement("select", {
              value: addOrderId,
              onChange: e => setAddOrderId(e.target.value),
              className: "rounded-[7px] border border-slate-200 bg-white px-2 py-1.5 text-sm focus:border-[#B45309] focus:outline-none flex-1 min-w-0"
            },
              /*#__PURE__*/React.createElement("option", {value:""}, "— Chọn đơn hàng —"),
              availOrders.map(o => /*#__PURE__*/React.createElement("option", {key:o.id, value:o.id},
                `${o.id} · ${o.name||""} · ${vnd(calc(o).total)} đ`))
            ),
            /*#__PURE__*/React.createElement("button", {
              onClick: addToAppendix,
              disabled: !addOrderId,
              className: "whitespace-nowrap rounded-lg bg-[#B45309] px-3 py-1.5 text-sm font-semibold text-white hover:bg-[#92400e] disabled:opacity-40"
            }, "+ Thêm vào phụ lục")
          ),

          /* Pills */
          (form.orderIds||[]).length > 0 && /*#__PURE__*/React.createElement("div", {className:"mb-3 flex flex-wrap gap-2"},
            (form.orderIds||[]).map(id => /*#__PURE__*/React.createElement("span", {
              key: id,
              className: "inline-flex items-center gap-1.5 rounded-full border border-[#B45309] bg-[#FDF1E5] px-3 py-1 text-xs font-semibold text-[#B45309]"
            },
              id,
              /*#__PURE__*/React.createElement("button", {onClick:()=>removeOrder(id), className:"ml-0.5 text-[#B45309]/60 hover:text-[#B45309]"}, "×")
            ))
          ),

          /* Table */
          /*#__PURE__*/React.createElement("div", {className:"overflow-x-auto rounded-xl border border-[#FCEBD8]"},
            /*#__PURE__*/React.createElement("table", {className:"w-full text-sm"},
              /*#__PURE__*/React.createElement("thead", null,
                /*#__PURE__*/React.createElement("tr", {className:"bg-[#FCEBD8] text-[#7c2d12] text-xs font-semibold uppercase tracking-wide"},
                  /*#__PURE__*/React.createElement("th", {className:"px-3 py-2.5 text-center w-10"}, "STT"),
                  /*#__PURE__*/React.createElement("th", {className:"px-3 py-2.5 text-left"}, "Sản phẩm"),
                  /*#__PURE__*/React.createElement("th", {className:"px-3 py-2.5 text-center w-28"}, "Nguồn đơn"),
                  /*#__PURE__*/React.createElement("th", {className:"px-3 py-2.5 text-center w-16"}, "ĐVT"),
                  /*#__PURE__*/React.createElement("th", {className:"px-3 py-2.5 text-center w-14"}, "SL"),
                  /*#__PURE__*/React.createElement("th", {className:"px-3 py-2.5 text-right w-28"}, "Đơn giá"),
                  /*#__PURE__*/React.createElement("th", {className:"px-3 py-2.5 text-right w-28"}, "Thành tiền")
                )
              ),
              /*#__PURE__*/React.createElement("tbody", {className:"divide-y divide-[#FCEBD8]"},
                appendixItems.length === 0
                  ? /*#__PURE__*/React.createElement("tr", null,
                      /*#__PURE__*/React.createElement("td", {colSpan:7, className:"py-8 text-center text-sm text-slate-400"}, "Chưa có sản phẩm — thêm đơn hàng bên trên"))
                  : appendixItems.map((it, i) =>
                      /*#__PURE__*/React.createElement("tr", {key:`${it.orderId}-${i}`, className:"hover:bg-[#FBF6F1]"},
                        /*#__PURE__*/React.createElement("td", {className:"px-3 py-2.5 text-center text-slate-500"}, i+1),
                        /*#__PURE__*/React.createElement("td", {className:"px-3 py-2.5 font-medium text-slate-800"}, it.name),
                        /*#__PURE__*/React.createElement("td", {className:"px-3 py-2.5 text-center"},
                          /*#__PURE__*/React.createElement("span", {className:"rounded-full bg-[#FCEBD8] px-2 py-0.5 text-[11px] font-semibold text-[#B45309]"}, it.orderId)),
                        /*#__PURE__*/React.createElement("td", {className:"px-3 py-2.5 text-center text-slate-500"}, it.unit||"Cái"),
                        /*#__PURE__*/React.createElement("td", {className:"px-3 py-2.5 text-center tabular-nums"}, it.qty),
                        /*#__PURE__*/React.createElement("td", {className:"px-3 py-2.5 text-right tabular-nums text-slate-700"}, vnd(it.price||0)),
                        /*#__PURE__*/React.createElement("td", {className:"px-3 py-2.5 text-right tabular-nums font-medium text-slate-800"}, vnd((it.price||0)*(it.qty||0)))
                      )
                    )
              ),
              totalValue > 0 && /*#__PURE__*/React.createElement("tfoot", null,
                /*#__PURE__*/React.createElement("tr", {className:"bg-[#FDF1E5]"},
                  /*#__PURE__*/React.createElement("td", {colSpan:6, className:"px-3 py-3 text-right font-semibold text-slate-700"}, "TỔNG CỘNG"),
                  /*#__PURE__*/React.createElement("td", {className:"px-3 py-3 text-right font-bold text-[#B45309] tabular-nums"}, vnd(totalValue), " đ")
                )
              )
            )
          )
        ),

        /* Footer — tổng giá trị */
        /*#__PURE__*/React.createElement("div", {className:"rounded-xl border border-slate-200 bg-white px-5 py-3 text-center"},
          /*#__PURE__*/React.createElement("span", {className:"text-sm font-medium text-slate-600"},
            "Tổng giá trị HĐ: ",
            /*#__PURE__*/React.createElement("span", {className:"text-lg font-bold text-[#B45309]"}, vnd(totalValue), " đ"))
        )
      )
    );
  }

  // ── LIST VIEW ──────────────────────────────────────────────────────────────
  const tblHead = /*#__PURE__*/React.createElement(React.Fragment, null,
    /*#__PURE__*/React.createElement(Th, {style:{minWidth:120}}, "Số HĐ"),
    /*#__PURE__*/React.createElement(Th, {style:{minWidth:100}}, "Mẫu HĐ"),
    /*#__PURE__*/React.createElement(Th, {style:{minWidth:160}}, "Khách hàng"),
    /*#__PURE__*/React.createElement(Th, {style:{minWidth:90}}, "Ngày ký"),
    /*#__PURE__*/React.createElement(Th, {right:true, style:{width:130}}, "Giá trị HĐ"),
    /*#__PURE__*/React.createElement(Th, {style:{minWidth:160}}, "Đơn hàng"),
    /*#__PURE__*/React.createElement(Th, {center:true, style:{width:80}}, ""));

  return /*#__PURE__*/React.createElement("div", {className:"space-y-4"},
    /*#__PURE__*/React.createElement("div", {className:"flex flex-wrap items-center gap-2"},
      /*#__PURE__*/React.createElement("div", {className:"relative flex-1 min-w-[200px]"},
        /*#__PURE__*/React.createElement(Search, {className:"absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400"}),
        /*#__PURE__*/React.createElement("input", {value:q, onChange:e=>setQ(e.target.value), placeholder:"Tìm số HĐ, khách hàng…", className:`${field} w-full pl-8`})),
      /*#__PURE__*/React.createElement("button", {onClick:openNew, className:blueBtn},
        /*#__PURE__*/React.createElement(Plus, {className:"h-4 w-4"}), " Thêm hợp đồng")),
    /*#__PURE__*/React.createElement(TableShell, {minW:"900px", head:tblHead},
      filtered.length === 0
        ? /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("td", {colSpan:7, className:"px-4 py-8 text-center text-slate-400"}, "Chưa có hợp đồng nào"))
        : filtered.map(c => /*#__PURE__*/React.createElement("tr", {key:c.id, className:"hover:bg-slate-50/60 cursor-pointer", onClick:()=>openEdit(c)},
            /*#__PURE__*/React.createElement("td", {className:"px-3 py-3 font-medium text-[#B45309]"}, c.contractNum),
            /*#__PURE__*/React.createElement("td", {className:"px-3 py-3 text-xs text-slate-500"}, c.template||""),
            /*#__PURE__*/React.createElement("td", {className:"px-3 py-3"}, c.custName),
            /*#__PURE__*/React.createElement("td", {className:"px-3 py-3 text-slate-500"}, c.signDate),
            /*#__PURE__*/React.createElement("td", {className:"px-3 py-3 text-right tabular-nums font-medium"}, c.value?vnd(c.value):""),
            /*#__PURE__*/React.createElement("td", {className:"px-3 py-3"},
              /*#__PURE__*/React.createElement("div", {className:"flex flex-wrap gap-1"},
                (c.orderIds||[]).map(id => /*#__PURE__*/React.createElement("span", {key:id, className:"inline-flex items-center whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-medium bg-[#FDF1E5] text-[#B45309] ring-1 ring-inset ring-[#B45309]/40"}, id)))),
            /*#__PURE__*/React.createElement("td", {className:"px-3 py-3 text-center", onClick:e=>e.stopPropagation()},
              /*#__PURE__*/React.createElement(IconBtn, {icon:Trash2, tone:"danger", title:"Xóa", onClick:()=>del(c.id)}))))));
}

function Screen({
  active,
  setActive,
  orders,
  setOrders,
  openOrderId,
  setOpenOrderId,
  purchaseList,
  setPurchaseList,
  whInItems,
  setWhInItems,
  whOutItems,
  setWhOutItems,
  whInSearch,
  setWhInSearch,
  onImportToWh,
  onImportKho,
  onExportToWh
}) {
  switch (active) {
    case "finance":
      return /*#__PURE__*/React.createElement(Finance, {setActive, onOpenOrder: id => { setOpenOrderId(id); setActive("sales_orders"); }});
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
        setActive: setActive,
        openOrderId: openOrderId,
        setOpenOrderId: setOpenOrderId,
        onExportKho: slips => { onExportToWh(slips); },
        onImportKho: onImportKho,
        setWhInSearch: setWhInSearch
      });
    case "purchase":
      return /*#__PURE__*/React.createElement(PurchaseModule, {onImportToWh, purchaseList, setPurchaseList, setActive});
    case "wh_in":
      return /*#__PURE__*/React.createElement(WhIn, {whInItems, setWhInItems, setWhOutItems, orders, setOrders, purchaseList, setPurchaseList, initSearch: whInSearch, onMounted: () => setWhInSearch(""), onOpenOrder: id => { setOpenOrderId(id); setActive("sales_orders"); }});
    case "wh_out":
      return /*#__PURE__*/React.createElement(WhOut, {
        whOutItems: whOutItems,
        setWhOutItems: setWhOutItems,
        onOpenOrder: id => { setOpenOrderId(id); setActive("sales_orders"); }
      });
    case "wh_stock":
      return /*#__PURE__*/React.createElement(Stock, null);
    case "pc_products":
      return /*#__PURE__*/React.createElement(ProductsTab, null);
    case "pc_customers":
      return /*#__PURE__*/React.createElement(CustomersTab, null);
    case "pc_suppliers":
      return /*#__PURE__*/React.createElement(Suppliers, null);
    case "contracts":
      return /*#__PURE__*/React.createElement(Contracts, {orders});
    case "debt_cust":
      return /*#__PURE__*/React.createElement(DebtCust, {orders});
    case "debt_ncc":
      return /*#__PURE__*/React.createElement(DebtNcc, {purchaseList, setPurchaseList, setWhInItems, whInItems});
    case "dashboard":
      return /*#__PURE__*/React.createElement(Dashboard, {orders, purchaseList, onOpenOrder: id => { setOpenOrderId(id); setActive("sales_orders"); }});
    case "rp_sales":
      return /*#__PURE__*/React.createElement(ReportSales, {orders, onOpenOrder: id => { setOpenOrderId(id); setActive("sales_orders"); }});
    case "rp_preorder":
      return /*#__PURE__*/React.createElement(ReportPreorder, {orders});
    case "rp_staff":
      return /*#__PURE__*/React.createElement(ReportStaff, {orders});
    case "settings_payment":
      return /*#__PURE__*/React.createElement(SettingsPayment, null);
    case "settings_numformat":
      return /*#__PURE__*/React.createElement(SettingsNumFormat, null);
    case "settings_docnum":
      return /*#__PURE__*/React.createElement(SettingsDocNum, null);
    case "settings_supplier_costs":
      return /*#__PURE__*/React.createElement(SettingsSupplierCosts, null);
    case "settings_txn_kinds":
      return /*#__PURE__*/React.createElement(SettingsTxnKinds, null);
    case "settings_print":
      return /*#__PURE__*/React.createElement(SettingsPrint, null);
    case "admin_clear":
      return /*#__PURE__*/React.createElement(AdminClearData, null);
    case "users":
      return /*#__PURE__*/React.createElement(UsersTab, null);
    default:
      return /*#__PURE__*/React.createElement(Dashboard, {orders, purchaseList, onOpenOrder: id => { setOpenOrderId(id); setActive("sales_orders"); }});
  }
}

/* ───────── Shell ───────── */
function CartLogo({
  className = "h-10 w-10"
}) {
  return /*#__PURE__*/React.createElement("svg", {
    viewBox: "0 0 100 100",
    className: className,
    xmlns: "http://www.w3.org/2000/svg",
    "aria-label": "BLTK"
  },
  /*#__PURE__*/React.createElement("polygon", {
    points: "8,38 20,8 42,8 36,20 64,8 74,26 68,34 54,16 40,16 44,26 26,26 16,44",
    fill: "#EE3D24"
  }),
  /*#__PURE__*/React.createElement("polygon", {
    points: "12,26 86,18 92,44 18,52",
    fill: "#EE3D24"
  }),
  /*#__PURE__*/React.createElement("polygon", {
    points: "18,58 86,50 92,76 12,84",
    fill: "#EE3D24"
  }),
  /*#__PURE__*/React.createElement("circle", { cx: "24", cy: "93", r: "7", fill: "#EE3D24" }),
  /*#__PURE__*/React.createElement("circle", { cx: "68", cy: "93", r: "7", fill: "#EE3D24" }));
}
async function deleteOrderCascade(orderId) {
  await deleteDocument("orders", orderId);
  const whInSnap = await getDocs(query(collection(db, "wh_in"), where("order", "==", orderId)));
  const batch = writeBatch(db);
  whInSnap.forEach(d => batch.delete(d.ref));
  const txnSnap = await getDocs(query(collection(db, "txns"), where("orderId", "==", orderId)));
  txnSnap.forEach(d => {
    const k = d.data().kind;
    if (k === "PhieuThu" || k === "PhieuChi") batch.delete(d.ref);
  });
  await batch.commit();
}

function App({ profile, logout }) {
  const allowed = ALLOWED[profile?.role] || ALLOWED.sales;
  const defaultScreen = allowed.includes("sales_orders") ? "sales_orders" : allowed[0] || "dashboard";
  const [active, setActive] = useState(defaultScreen);
  const [whInSearch, setWhInSearch] = useState("");
  const [open, setOpen] = useState({ sales: true });
  // Firestore-backed state
  const [orders, ordersLoaded] = useCollection("orders");
  const [openOrderId, setOpenOrderId] = useState(null);
  const [purchaseList, purchasesLoaded] = useCollection("purchases");
  const toKhoGlobal = s => (s||"HH").replace(/^Kho\s+/, "") || "HH";
  const addKhoGlobal = r => ({
    ...r,
    kho: r.kho || toKhoGlobal(r.store),
    qtyRemaining: r.qtyRemaining ?? r.qtyNow ?? r.qtyIn ?? 0,
    unitCost: r.unitCost ?? (r.qtyIn > 0 ? Math.round(((r.costNcc || 0) * r.qtyIn + (r.fee || 0)) / r.qtyIn) : (r.costNcc || 0))
  });
  const whInKey = r => (r.lot || "") + "~~" + (r.prod || "").replace(/\//g, "_");
  const mergeWhIn = (prev, newSlips) => {
    const existing = new Set(prev.map(r => whInKey(r)));
    const fresh = (Array.isArray(newSlips) ? newSlips : [newSlips]).filter(s => !existing.has(whInKey(s))).map(addKhoGlobal);
    return fresh.length ? [...fresh, ...prev] : prev;
  };
  const [whInItems, whInLoaded] = useCollection("wh_in");
  const addUnitCostOut = r => ({...r, unitCost: r.unitCost ?? 0});
  const mergeWhOut = (prev, newSlips) => {
    const existing = new Set(prev.map(r => r.slip));
    const fresh = (Array.isArray(newSlips) ? newSlips : [newSlips]).filter(s => !existing.has(s.slip));
    return fresh.length ? [...fresh, ...prev] : prev;
  };
  const [whOutItems, whOutLoaded] = useCollection("wh_out");

  // Firestore write helpers (thay thế setState)
  // Refs luôn giữ giá trị mới nhất — tránh stale-closure khi syncFS được gọi
  // từ callback sau nhiều render (vd: 2 action liên tiếp trước khi onSnapshot kịp fire)
  const ordersRef      = React.useRef(orders);
  const purchaseRef    = React.useRef(purchaseList);
  const whInRef        = React.useRef(whInItems);
  const whOutRef       = React.useRef(whOutItems);
  React.useEffect(() => { ordersRef.current   = orders; },      [orders]);
  React.useEffect(() => { purchaseRef.current = purchaseList; }, [purchaseList]);
  React.useEffect(() => { whInRef.current     = whInItems; },   [whInItems]);
  React.useEffect(() => { whOutRef.current    = whOutItems; },  [whOutItems]);

  const syncFS = (colName, getId) => (current, updater) => {
    const next = typeof updater === 'function' ? updater(current) : updater;
    const prevMap = Object.fromEntries(current.map(o => [getId(o), o]));
    const nextMap = Object.fromEntries(next.map(o => [getId(o), o]));
    Object.entries(nextMap).forEach(([id, o]) => {
      if (JSON.stringify(prevMap[id]) !== JSON.stringify(o)) saveDoc(colName, id, o).catch(err => { console.error(`[syncFS] ${colName}/${id}`, err); });
    });
    Object.keys(prevMap).forEach(id => { if (!nextMap[id]) deleteDocument(colName, id).catch(err => { console.error(`[syncFS] delete ${colName}/${id}`, err); }); });
  };
  const setOrders      = u => syncFS("orders",    o => o.id)                           (ordersRef.current,   u);
  const setPurchaseList = u => syncFS("purchases", r => r.lot)                          (purchaseRef.current,  u);
  const setWhInItems   = u => syncFS("wh_in",     r => (r.lot||"")+"~~"+(r.prod||"")) (whInRef.current,     u);
  const setWhOutItems  = u => syncFS("wh_out",    r => r.slip)                         (whOutRef.current,    u);
  // Bảng giá vốn từ Firestore — thay thế SUPPLIER_COSTS hardcode
  const [supplierCostsFS] = useCollection("supplier_costs");
  const supplierCosts = supplierCostsFS.length ? supplierCostsFS : SUPPLIER_COSTS;

  // Fix #2: bankAccounts lưu trên Firestore thay vì localStorage — đồng nhất mọi thiết bị/trình duyệt
  const [settingsFS, settingsLoaded] = useCollection("settings");
  const [bankAccounts, setBankAccountsState] = useState(INIT_BANK_ACCOUNTS);
  React.useEffect(() => {
    if (!settingsLoaded) return;
    const doc = settingsFS.find(d => d._id === "bankAccounts");
    if (doc?.accounts?.length) {
      setBankAccountsState(doc.accounts);
    } else {
      // Lần đầu: seed từ localStorage (nếu có) hoặc INIT_BANK_ACCOUNTS
      const local = (() => { try { return JSON.parse(localStorage.getItem('bltk_banks')) || null; } catch { return null; } })();
      const seed = local || INIT_BANK_ACCOUNTS;
      setBankAccountsState(seed);
      saveDoc("settings", "bankAccounts", { accounts: seed });
    }
  }, [settingsLoaded, settingsFS]);
  const setBankAccounts = updater => {
    const next = typeof updater === 'function' ? updater(bankAccounts) : updater;
    setBankAccountsState(next);
    saveDoc("settings", "bankAccounts", { accounts: next });
  };
  const [txnsFS, txnsLoaded] = useCollection("txns");
  const txns = txnsFS;
  const txnsRef = React.useRef(txns);
  React.useEffect(() => { txnsRef.current = txns; }, [txns]);
  const setTxns = u => syncFS("txns", t => String(t.id))(txnsRef.current, u);
  const [docNums, setDocNumsState] = useState(DOC_NUM_INIT);
  React.useEffect(() => {
    if (!settingsLoaded) return;
    const fsDoc = settingsFS.find(d => d._id === 'docNums');
    const curYear = new Date().getFullYear();
    if (fsDoc?.rows?.length) {
      setDocNumsState(fsDoc.rows.map(r => r.year !== curYear ? {...r, num:1, year:curYear} : r));
    } else {
      const local = (() => { try { return JSON.parse(localStorage.getItem('bltk_docnums')) || null; } catch { return null; } })();
      const seed = (local || DOC_NUM_INIT).map(r => r.year !== curYear ? {...r, num:1, year:curYear} : r);
      setDocNumsState(seed);
      saveDoc('settings', 'docNums', { rows: seed });
    }
  }, [settingsLoaded, settingsFS]);
  const setDocNums = updater => {
    setDocNumsState(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      saveDoc('settings', 'docNums', { rows: next });
      return next;
    });
  };
  const [txnKinds, setTxnKindsState] = useState({thuKinds: DEFAULT_THU_KINDS, chiKinds: DEFAULT_CHI_KINDS});
  React.useEffect(() => {
    if (!settingsLoaded) return;
    const doc = settingsFS.find(d => d._id === "txnKinds");
    if (doc?.thuKinds?.length || doc?.chiKinds?.length) {
      setTxnKindsState({ thuKinds: doc.thuKinds || DEFAULT_THU_KINDS, chiKinds: doc.chiKinds || DEFAULT_CHI_KINDS });
    }
  }, [settingsLoaded, settingsFS]);
  const saveTxnKinds = (thuKinds, chiKinds) => {
    const next = {thuKinds, chiKinds};
    setTxnKindsState(next);
    saveDoc('settings', 'txnKinds', next);
  };
  const title = LABELS[active] || "";
  const appLoaded = ordersLoaded && purchasesLoaded && whInLoaded && whOutLoaded && txnsLoaded && settingsLoaded;



  return /*#__PURE__*/React.createElement(TxnKindsCtx.Provider, {value: {txnKinds, saveTxnKinds}},
  /*#__PURE__*/React.createElement(SupplierCostsCtx.Provider, {value: supplierCosts},
  /*#__PURE__*/React.createElement(DocNumCtx.Provider, {value: {docNums, setDocNums}},
  /*#__PURE__*/React.createElement(InvCtx.Provider, {value: {whInItems, setWhInItems, whOutItems, setWhOutItems}},
  /*#__PURE__*/React.createElement(TxnCtx.Provider, {value: {txns, setTxns}},
  /*#__PURE__*/React.createElement(BankCtx.Provider, {value: {bankAccounts, setBankAccounts}},
  /*#__PURE__*/React.createElement(ToastHost, null, /*#__PURE__*/React.createElement("div", {
    className: "flex min-h-screen bg-[#faf7f4] font-sans text-[#1E293B]",
    style: {
      fontFamily: "'Be Vietnam Pro', Inter, ui-sans-serif, system-ui, 'Segoe UI', Roboto, Arial, sans-serif"
    }
  }, /*#__PURE__*/React.createElement("aside", {
    className: "flex w-64 shrink-0 flex-col bg-[#2c1810]"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center px-4 py-4 border-b border-[#3d2416] gap-2"
  }, /*#__PURE__*/React.createElement("div", { className: "flex-1" },
    /*#__PURE__*/React.createElement("p", {
      className: "text-[12px] font-bold tracking-wider text-white uppercase leading-tight"
    }, "BLTK HẢI PHÒNG"),
    profile && /*#__PURE__*/React.createElement("p", { className: "text-[10px] text-slate-400 mt-0.5 truncate" },
      (profile.name || profile.email) + " · " + (ROLES[profile.role]?.label || ""))
  ),
  logout && /*#__PURE__*/React.createElement("button", { onClick: logout, title: "Đăng xuất",
    className: "text-slate-400 hover:text-white transition shrink-0" },
    /*#__PURE__*/React.createElement(X, { className: "h-4 w-4" })
  )), /*#__PURE__*/React.createElement("nav", {
    className: "flex-1 space-y-0.5 overflow-y-auto px-3 py-2"
  }, NAV.map(item => {
    const I = item.icon;
    if (!item.children) {
      if (!allowed.includes(item.key)) return null;
      const on = active === item.key;
      return /*#__PURE__*/React.createElement("button", {
        key: item.key,
        onClick: () => setActive(item.key),
        className: `flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition ${on ? "bg-[#92400e] font-medium text-white" : "text-slate-400 hover:bg-[#3d2416] hover:text-white"}`
      }, /*#__PURE__*/React.createElement(I, {
        className: "h-4 w-4 shrink-0"
      }), /*#__PURE__*/React.createElement("span", {
        className: "flex-1 text-left"
      }, item.label));
    }
    const visibleChildren = item.children.filter(c => allowed.includes(c.key));
    if (visibleChildren.length === 0) return null;
    const isOpen = !!open[item.key];
    const childOn = visibleChildren.some(c => c.key === active);
    return /*#__PURE__*/React.createElement("div", {
      key: item.key
    }, /*#__PURE__*/React.createElement("button", {
      onClick: () => setOpen(o => ({
        ...o,
        [item.key]: !o[item.key]
      })),
      className: `flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition hover:bg-[#3d2416] hover:text-white ${childOn ? "bg-[#3d2416] text-white" : "text-slate-400"}`
    }, /*#__PURE__*/React.createElement(I, {
      className: "h-4 w-4 shrink-0"
    }), /*#__PURE__*/React.createElement("span", {
      className: "flex-1 text-left"
    }, item.label), /*#__PURE__*/React.createElement(ChevronDown, {
      className: `h-4 w-4 shrink-0 transition ${isOpen ? "rotate-180" : ""}`
    })), isOpen && /*#__PURE__*/React.createElement("div", {
      className: "mt-0.5 space-y-0.5 pl-7"
    }, visibleChildren.map(c => /*#__PURE__*/React.createElement("button", {
      key: c.key,
      onClick: () => setActive(c.key),
      className: `block w-full rounded-lg px-3 py-1.5 text-left text-sm transition ${active === c.key ? "font-medium text-[#fde68a]" : "text-slate-400 hover:bg-[#3d2416] hover:text-white"}`
    }, c.label))));
  })), /*#__PURE__*/React.createElement("div", {
    className: "border-t border-[#3d2416] px-5 py-4"
  }, /*#__PURE__*/React.createElement("p", {
    className: "text-sm font-medium text-white"
  }, profile?.name || "Quản lý"), /*#__PURE__*/React.createElement("p", {
    className: "text-xs text-slate-400"
  }, `${profile?.email ? profile.email.split("@")[0] : "—"} · ${profile?.role || "Nhân viên"}`))) , /*#__PURE__*/React.createElement("div", {
    className: "flex min-w-0 flex-1 flex-col"
  }, /*#__PURE__*/React.createElement("header", {
    className: "flex items-center justify-between border-b border-slate-200 bg-white px-6 py-3.5"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex-1 text-center text-[22px] font-bold text-slate-800"
  }, title), /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-2 text-sm"
  })), /*#__PURE__*/React.createElement("main", {
    className: "flex-1 overflow-auto p-6 bg-[#faf7f4]"
  }, !appLoaded
    ? /*#__PURE__*/React.createElement("div", {className: "flex flex-col items-center justify-center h-64 gap-3 text-slate-400"},
        /*#__PURE__*/React.createElement("div", {className: "animate-spin h-8 w-8 rounded-full border-4 border-slate-200 border-t-[#92400e]"}),
        /*#__PURE__*/React.createElement("span", {className: "text-sm"}, "Đang tải dữ liệu..."))
    : /*#__PURE__*/React.createElement(Screen, {
    active: active,
    setActive: setActive,
    orders: orders,
    setOrders: setOrders,
    openOrderId: openOrderId,
    setOpenOrderId: setOpenOrderId,
    purchaseList: purchaseList,
    setPurchaseList: setPurchaseList,
    whInItems: whInItems,
    setWhInItems: setWhInItems,
    whOutItems: whOutItems,
    setWhOutItems: setWhOutItems,
    whInSearch: whInSearch,
    setWhInSearch: setWhInSearch,
    onImportToWh: slipOrSlips => { setWhInItems(prev => mergeWhIn(prev, slipOrSlips)); setActive("wh_in"); },
    onImportKho: slips => { setWhInItems(prev => mergeWhIn(prev, slips)); },
    onExportToWh: slips => { setWhOutItems(prev => mergeWhOut(prev, slips)); }
  })))))))))));
}

/* ───────── Settings Txn Kinds ───────── */
function SettingsTxnKinds() {
  const { txnKinds, saveTxnKinds } = useTxnKinds() || {};
  const notify = useToast();
  const thuList = txnKinds?.thuKinds || DEFAULT_THU_KINDS;
  const chiList = txnKinds?.chiKinds || DEFAULT_CHI_KINDS;
  const [editGroup, setEditGroup] = React.useState(null); // "thu" | "chi"
  const [editIdx, setEditIdx]     = React.useState(null);
  const [editVal, setEditVal]     = React.useState("");
  const [addGroup, setAddGroup]   = React.useState(null);
  const [addVal, setAddVal]       = React.useState("");

  const startEdit = (group, idx, val) => { setEditGroup(group); setEditIdx(idx); setEditVal(val); setAddGroup(null); };
  const cancelEdit = () => { setEditGroup(null); setEditIdx(null); };
  const saveEdit = () => {
    if (!editVal.trim()) return;
    const list = editGroup === "thu" ? [...thuList] : [...chiList];
    list[editIdx] = editVal.trim();
    editGroup === "thu" ? saveTxnKinds(list, chiList) : saveTxnKinds(thuList, list);
    notify("Đã lưu");
    cancelEdit();
  };
  const deleteItem = (group, idx) => {
    if (!window.confirm("Xoá loại này?")) return;
    const list = group === "thu" ? thuList.filter((_,i)=>i!==idx) : chiList.filter((_,i)=>i!==idx);
    group === "thu" ? saveTxnKinds(list, chiList) : saveTxnKinds(thuList, list);
    notify("Đã xoá");
  };
  const startAdd = (group) => { setAddGroup(group); setAddVal(""); setEditGroup(null); };
  const confirmAdd = () => {
    if (!addVal.trim()) return;
    const list = addGroup === "thu" ? [...thuList, addVal.trim()] : [...chiList, addVal.trim()];
    addGroup === "thu" ? saveTxnKinds(list, chiList) : saveTxnKinds(thuList, list);
    notify("Đã thêm");
    setAddGroup(null);
  };
  const moveItem = (group, idx, dir) => {
    const list = [...(group === "thu" ? thuList : chiList)];
    const to = idx + dir;
    if (to < 0 || to >= list.length) return;
    [list[idx], list[to]] = [list[to], list[idx]];
    group === "thu" ? saveTxnKinds(list, chiList) : saveTxnKinds(thuList, list);
  };

  const KindList = ({group, list, color}) => /*#__PURE__*/React.createElement("div", {className:"rounded-xl border border-slate-200 bg-white overflow-hidden"},
    /*#__PURE__*/React.createElement("div", {className:"flex items-center justify-between px-4 py-3 border-b border-slate-100"},
      /*#__PURE__*/React.createElement("span", {className:`text-sm font-semibold ${color}`}, group==="thu" ? "▲ Loại Thu" : "▼ Loại Chi"),
      /*#__PURE__*/React.createElement("button", {onClick:()=>startAdd(group), className:addBtn}, "+ Thêm")),
    /*#__PURE__*/React.createElement("table", {className:"tbl-list w-full"},
      /*#__PURE__*/React.createElement("tbody", null,
        list.map((k,i)=>/*#__PURE__*/React.createElement("tr", {key:i},
          /*#__PURE__*/React.createElement("td", {className:"px-4 py-2.5 text-sm text-slate-700 w-8 text-slate-400"}, i+1),
          /*#__PURE__*/React.createElement("td", {className:"px-2 py-2.5 text-sm font-medium text-slate-800"},
            editGroup===group && editIdx===i
              ? /*#__PURE__*/React.createElement("div", {className:"flex gap-2"},
                  /*#__PURE__*/React.createElement("input", {autoFocus:true, value:editVal, onChange:e=>setEditVal(e.target.value), onKeyDown:e=>{if(e.key==="Enter")saveEdit();if(e.key==="Escape")cancelEdit();}, className:inputF+" py-1 text-sm"}),
                  /*#__PURE__*/React.createElement("button", {onClick:saveEdit, className:blueBtn}, "Lưu"),
                  /*#__PURE__*/React.createElement("button", {onClick:cancelEdit, className:ghostBtn}, "Huỷ"))
              : k),
          /*#__PURE__*/React.createElement("td", {className:"px-2 py-2 text-right whitespace-nowrap"},
            /*#__PURE__*/React.createElement("div", {className:"flex items-center gap-1 justify-end"},
              /*#__PURE__*/React.createElement("button", {onClick:()=>moveItem(group,i,-1), disabled:i===0, className:"px-1 text-slate-400 hover:text-slate-700 disabled:opacity-20"}, "↑"),
              /*#__PURE__*/React.createElement("button", {onClick:()=>moveItem(group,i,1), disabled:i===list.length-1, className:"px-1 text-slate-400 hover:text-slate-700 disabled:opacity-20"}, "↓"),
              /*#__PURE__*/React.createElement("button", {onClick:()=>startEdit(group,i,k), className:"text-xs text-blue-600 hover:underline ml-2"}, "Sửa"),
              /*#__PURE__*/React.createElement("button", {onClick:()=>deleteItem(group,i), className:"text-xs text-red-500 hover:underline ml-1"}, "Xoá"))))),
        addGroup===group && /*#__PURE__*/React.createElement("tr", null,
          /*#__PURE__*/React.createElement("td", {colSpan:3, className:"px-4 py-2"},
            /*#__PURE__*/React.createElement("div", {className:"flex gap-2"},
              /*#__PURE__*/React.createElement("input", {autoFocus:true, value:addVal, onChange:e=>setAddVal(e.target.value), onKeyDown:e=>{if(e.key==="Enter")confirmAdd();if(e.key==="Escape")setAddGroup(null);}, placeholder:"Tên loại giao dịch...", className:inputF+" py-1 text-sm"}),
              /*#__PURE__*/React.createElement("button", {onClick:confirmAdd, className:blueBtn}, "Thêm"),
              /*#__PURE__*/React.createElement("button", {onClick:()=>setAddGroup(null), className:ghostBtn}, "Huỷ")))))));

  return /*#__PURE__*/React.createElement("div", {className:"mx-auto max-w-2xl space-y-4 py-4"},
    /*#__PURE__*/React.createElement("div", {className:"flex items-center justify-between"},
      /*#__PURE__*/React.createElement("h2", {className:"text-[22px] font-bold text-slate-800"}, "Loại giao dịch Thu/Chi"),
      /*#__PURE__*/React.createElement("button", {onClick:()=>{if(window.confirm("Khôi phục danh sách mặc định?"))saveTxnKinds(DEFAULT_THU_KINDS,DEFAULT_CHI_KINDS);}, className:ghostBtn}, "Khôi phục mặc định")),
    /*#__PURE__*/React.createElement("p", {className:"text-sm text-slate-500"}, "Danh sách hiển thị trong dropdown chọn loại giao dịch trên màn hình Tài chính. Thêm/sửa/xoá không ảnh hưởng dữ liệu đã lưu."),
    /*#__PURE__*/React.createElement(KindList, {group:"thu", list:thuList, color:"text-[#047857]"}),
    /*#__PURE__*/React.createElement(KindList, {group:"chi", list:chiList, color:"text-[#B91C1C]"}));
}

/* ───────── Settings Supplier Costs ───────── */
function SettingsSupplierCosts() {
  const costs = useSupplierCosts();
  const notify = useToast();
  const [editing, setEditing] = React.useState(null);
  const [adding, setAdding] = React.useState(false);
  const [newEntry, setNewEntry] = React.useState({ pat: "", from: "", price: 0, note: "" });
  const [search, setSearch] = React.useState("");

  const filtered = costs.filter(c => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (c.pat || []).some(p => p.toLowerCase().includes(s)) || (c.note || "").toLowerCase().includes(s);
  }).slice().sort((a, b) => (a.pat?.[0] || "").localeCompare(b.pat?.[0] || ""));

  const saveEntry = async (entry) => {
    const docId = entry._id || String(Date.now());
    const { _id, ...clean } = entry;
    clean.pat = typeof clean.pat === "string" ? clean.pat.split(",").map(p => p.trim()).filter(Boolean) : clean.pat;
    clean.price = Number(clean.price) || 0;
    await saveDoc("supplier_costs", docId, clean);
    notify("Đã lưu");
    setEditing(null);
    setAdding(false);
  };

  const deleteEntry = async (entry) => {
    if (!window.confirm("Xoá mục này?")) return;
    await deleteDocument("supplier_costs", entry._id);
    notify("Đã xoá");
  };

  const seedFromCode = async () => {
    if (!window.confirm("Nhập " + SUPPLIER_COSTS.length + " mục từ dữ liệu gốc? Sẽ ghi đè nếu có mục cùng thứ tự.")) return;
    for (let i = 0; i < SUPPLIER_COSTS.length; i++) {
      await saveDoc("supplier_costs", String(i + 1).padStart(4, "0"), SUPPLIER_COSTS[i]);
    }
    notify("Đã nhập " + SUPPLIER_COSTS.length + " mục giá vốn");
  };

  const th = "px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500";
  const td = "px-4 py-3 text-sm text-slate-700";
  const inf = inputF;

  const EntryForm = ({ entry, onSave, onCancel }) => {
    const [form, setForm] = React.useState({ ...entry, pat: Array.isArray(entry.pat) ? entry.pat.join(", ") : (entry.pat || "") });
    return /*#__PURE__*/React.createElement("tr", { className: "bg-amber-50" },
      /*#__PURE__*/React.createElement("td", { className: td, colSpan: 2 },
        /*#__PURE__*/React.createElement("input", { className: inf, value: form.note || "", onChange: e => setForm(f => ({...f, note: e.target.value})), placeholder: "Ghi chú (vd: Bồn cầu AC-989)" }),
        /*#__PURE__*/React.createElement("input", { className: inf + " mt-1", value: form.pat, onChange: e => setForm(f => ({...f, pat: e.target.value})), placeholder: "Mã sản phẩm, cách nhau bằng dấu phẩy (vd: AC-989VN, AC-989/CW-MV)" })),
      /*#__PURE__*/React.createElement("td", { className: td },
        /*#__PURE__*/React.createElement("input", { className: inf, value: form.from || "", onChange: e => setForm(f => ({...f, from: e.target.value})), placeholder: "DD/MM/YYYY" })),
      /*#__PURE__*/React.createElement("td", { className: td },
        /*#__PURE__*/React.createElement(NumInput, { className: inf, value: Number(form.price) || 0, onChange: v => setForm(f => ({...f, price: v})) })),
      /*#__PURE__*/React.createElement("td", { className: td },
        /*#__PURE__*/React.createElement("div", { className: "flex gap-2" },
          /*#__PURE__*/React.createElement("button", { onClick: () => onSave({...entry, ...form}), className: blueBtn }, "Lưu"),
          /*#__PURE__*/React.createElement("button", { onClick: onCancel, className: ghostBtn }, "Huỷ"))));
  };

  return /*#__PURE__*/React.createElement("div", { className: "mx-auto max-w-5xl space-y-4 py-4" },
    /*#__PURE__*/React.createElement("div", { className: "flex items-center justify-between" },
      /*#__PURE__*/React.createElement("h2", { className: "text-[22px] font-bold text-slate-800" }, "Bảng giá vốn sản phẩm"),
      /*#__PURE__*/React.createElement("div", { className: "flex gap-2" },
        costs.length === 0 && /*#__PURE__*/React.createElement("button", { onClick: seedFromCode, className: "rounded-lg border border-amber-300 bg-amber-50 px-3 py-1.5 text-sm font-medium text-amber-700 hover:bg-amber-100" }, "Nhập dữ liệu ban đầu"),
        /*#__PURE__*/React.createElement("button", { onClick: () => { setAdding(true); setNewEntry({ pat: "", from: "", price: 0, note: "" }); }, className: addBtn }, "+ Thêm mới"))),
    /*#__PURE__*/React.createElement("p", { className: "text-sm text-slate-500" },
      "Giá vốn dùng để tự điền khi nhập kho hàng loạt. Hệ thống chọn mục khớp tên sản phẩm và ngày gần nhất. Hiện có: ", /*#__PURE__*/React.createElement("strong", null, costs.length), " mục."),
    /*#__PURE__*/React.createElement("input", { className: inputF + " max-w-sm", value: search, onChange: e => setSearch(e.target.value), placeholder: "Tìm theo mã sản phẩm hoặc ghi chú..." }),
    /*#__PURE__*/React.createElement("div", { className: "rounded-xl border border-slate-200 bg-white overflow-hidden" },
      /*#__PURE__*/React.createElement("table", { className: "tbl-list w-full" },
        /*#__PURE__*/React.createElement("thead", null,
          /*#__PURE__*/React.createElement("tr", null,
            /*#__PURE__*/React.createElement("th", { className: th }, "Ghi chú / Mã sản phẩm"),
            /*#__PURE__*/React.createElement("th", { className: th }, "Mã khớp"),
            /*#__PURE__*/React.createElement("th", { className: th }, "Áp dụng từ"),
            /*#__PURE__*/React.createElement("th", { className: th }, "Giá vốn (đ)"),
            /*#__PURE__*/React.createElement("th", { className: th }, ""))),
        /*#__PURE__*/React.createElement("tbody", null,
          adding && /*#__PURE__*/React.createElement(EntryForm, { entry: newEntry, onSave: saveEntry, onCancel: () => setAdding(false) }),
          filtered.map(c =>
            editing?._id === c._id
              ? /*#__PURE__*/React.createElement(EntryForm, { key: c._id, entry: editing, onSave: saveEntry, onCancel: () => setEditing(null) })
              : /*#__PURE__*/React.createElement("tr", { key: c._id, className: "border-t border-slate-100 hover:bg-slate-50" },
                  /*#__PURE__*/React.createElement("td", { className: td }, c.note || ""),
                  /*#__PURE__*/React.createElement("td", { className: td + " font-mono text-xs text-slate-500" }, (c.pat || []).join(", ")),
                  /*#__PURE__*/React.createElement("td", { className: td }, c.from || ""),
                  /*#__PURE__*/React.createElement("td", { className: td + " font-semibold text-right" }, vnd(c.price) + "đ"),
                  /*#__PURE__*/React.createElement("td", { className: td },
                    /*#__PURE__*/React.createElement("div", { className: "flex gap-2" },
                      /*#__PURE__*/React.createElement("button", { onClick: () => setEditing(c), className: "text-xs text-blue-600 hover:underline" }, "Sửa"),
                      /*#__PURE__*/React.createElement("button", { onClick: () => deleteEntry(c), className: "text-xs text-red-500 hover:underline" }, "Xoá")))))))));
}

/* ───────── Settings Payment ───────── */
function SettingsPayment() {
  const {bankAccounts: banks, setBankAccounts: setBanks} = useBankAccounts();
  const inf = "w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-[#2563EB] focus:outline-none";
  const addBtnBlue = addBtn;
  const badge = s => s === "Hoạt động"
    ? "inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-[#92400e]"
    : "inline-flex items-center rounded-full bg-[#F1F5F9] px-2.5 py-0.5 text-xs font-semibold text-slate-500";
  const editBtn = "rounded p-1.5 bg-amber-100 text-[#92400e] hover:bg-amber-200";
  const delBtn = "rounded p-1.5 bg-amber-100 text-[#92400e] hover:bg-amber-200";
  const th = "px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wide";
  const td = "px-4 py-3 text-sm text-slate-700";

  const { txnKinds, saveTxnKinds } = useTxnKinds() || {};
  const thuList = txnKinds?.thuKinds?.length ? txnKinds.thuKinds : DEFAULT_THU_KINDS;
  const chiList = txnKinds?.chiKinds?.length ? txnKinds.chiKinds : DEFAULT_CHI_KINDS;
  const txTypes = [
    ...thuList.map((name, i) => ({id:`thu-${i}`, name, type:"Thu", status:"Hoạt động"})),
    ...chiList.map((name, i) => ({id:`chi-${i}`, name, type:"Chi", status:"Hoạt động"})),
  ];
  const [bankModal, setBankModal] = React.useState(null);
  const [txModal, setTxModal] = React.useState(null);
  const [bankForm, setBankForm] = React.useState({key:"", bank:"", account:"", owner:"", branch:"", note:"", openBal:0, openBalDate:"01/01/2026", status:"Hoạt động"});
  const [txForm, setTxForm] = React.useState({name:"", type:"Thu", status:"Hoạt động"});

  const openAddBank = () => { setBankForm({key:"", bank:"", account:"", owner:"", branch:"", note:"", openBal:0, openBalDate:"01/01/2026", status:"Hoạt động"}); setBankModal("add"); };
  const openEditBank = r => { setBankForm({...r}); setBankModal(r.id); };
  const saveBank = () => {
    if (bankModal === "add") setBanks(bs => [...bs, {...bankForm, id: Date.now(), key: bankForm.key || bankForm.bank}]);
    else setBanks(bs => bs.map(b => b.id === bankModal ? {...bankForm, id: bankModal} : b));
    setBankModal(null);
  };
  const deleteBank = r => {
    setBanks(bs => bs.map(b => b.id === r.id ? {...b, status: "Ngừng hoạt động"} : b));
  };

  const openAddTx = () => { setTxForm({name:"", type:"Thu", status:"Hoạt động"}); setTxModal("add"); };
  const openEditTx = r => { setTxForm({...r}); setTxModal(r.id); };
  const saveTx = () => {
    const name = txForm.name.trim();
    if (!name) return;
    if (txModal === "add") {
      if (txForm.type === "Thu") saveTxnKinds([...thuList, name], chiList);
      else saveTxnKinds(thuList, [...chiList, name]);
    } else {
      const [grp, idx] = txModal.split("-");
      const i = parseInt(idx);
      if (grp === "thu") {
        const updated = [...thuList]; updated[i] = name;
        if (txForm.type === "Chi") saveTxnKinds(updated.filter((_,j)=>j!==i), [...chiList, name]);
        else saveTxnKinds(updated, chiList);
      } else {
        const updated = [...chiList]; updated[i] = name;
        if (txForm.type === "Thu") saveTxnKinds([...thuList, name], updated.filter((_,j)=>j!==i));
        else saveTxnKinds(thuList, updated);
      }
    }
    setTxModal(null);
  };
  const deleteTx = r => {
    const [grp, idx] = r.id.split("-");
    const i = parseInt(idx);
    if (grp === "thu") saveTxnKinds(thuList.filter((_,j)=>j!==i), chiList);
    else saveTxnKinds(thuList, chiList.filter((_,j)=>j!==i));
  };

  return /*#__PURE__*/React.createElement("div", {className: "space-y-6"},
    /*#__PURE__*/React.createElement("h2", {className: "text-[22px] font-bold text-slate-800"}, "Cài đặt thanh toán"),

    /*#__PURE__*/React.createElement("div", {className: "rounded-xl border border-slate-200 bg-white p-6 space-y-4"},
      /*#__PURE__*/React.createElement("h3", {className: "text-base font-semibold text-slate-800"}, "Quản lý tài khoản ngân hàng"),
      /*#__PURE__*/React.createElement("button", {onClick: openAddBank, className: addBtnBlue},
        /*#__PURE__*/React.createElement(Plus, {className: "h-4 w-4"}), " Thêm tài khoản ngân hàng"),
      /*#__PURE__*/React.createElement("table", {className: "w-full text-sm border-collapse", style:{tableLayout:"fixed"}},
        /*#__PURE__*/React.createElement("colgroup", null,
          /*#__PURE__*/React.createElement("col", {style:{width:"20%"}}),
          /*#__PURE__*/React.createElement("col", {style:{width:"13%"}}),
          /*#__PURE__*/React.createElement("col", {style:{width:"16%"}}),
          /*#__PURE__*/React.createElement("col", {style:{width:"17%"}}),
          /*#__PURE__*/React.createElement("col", {style:{width:"17%"}}),
          /*#__PURE__*/React.createElement("col", {style:{width:"17%"}})),
        /*#__PURE__*/React.createElement("thead", null,
          /*#__PURE__*/React.createElement("tr", {className: "border-b border-slate-200"},
            /*#__PURE__*/React.createElement("th", {className: th}, "Ngân hàng"),
            /*#__PURE__*/React.createElement("th", {className: th}, "Số tài khoản"),
            /*#__PURE__*/React.createElement("th", {className: th}, "Chủ tài khoản"),
            /*#__PURE__*/React.createElement("th", {className: th}, "Dư đầu kỳ (01/01/2026)"),
            /*#__PURE__*/React.createElement("th", {className: th}, "Trạng thái"),
            /*#__PURE__*/React.createElement("th", {className: th}, "Thao tác"))),
        /*#__PURE__*/React.createElement("tbody", {className: "divide-y divide-slate-100"},
          banks.map(r => /*#__PURE__*/React.createElement("tr", {key: r.id, className: "hover:bg-slate-50"},
            /*#__PURE__*/React.createElement("td", {className: td}, r.bank),
            /*#__PURE__*/React.createElement("td", {className: td}, r.account),
            /*#__PURE__*/React.createElement("td", {className: td}, r.owner),
            /*#__PURE__*/React.createElement("td", {className: td+" text-right tabular-nums font-medium", style:{color: r.openBal>0?"#047857":"#f59e0b"}},
              r.openBal ? r.openBal.toLocaleString("vi-VN")+"đ" : "⚠ Chưa nhập"),
            /*#__PURE__*/React.createElement("td", {className: td}, /*#__PURE__*/React.createElement("span", {className: badge(r.status)}, r.status)),
            /*#__PURE__*/React.createElement("td", {className: "px-4 py-3"},
              /*#__PURE__*/React.createElement("div", {className: "flex items-center gap-1.5"},
                /*#__PURE__*/React.createElement("button", {onClick: () => openEditBank(r), className: editBtn}, /*#__PURE__*/React.createElement(Pencil, {className: "h-3.5 w-3.5"})),
                /*#__PURE__*/React.createElement("button", {onClick: () => deleteBank(r), className: delBtn, title: "Ẩn tài khoản (không xóa vĩnh viễn)"}, /*#__PURE__*/React.createElement(Trash2, {className: "h-3.5 w-3.5"})))))))),
      bankModal !== null && /*#__PURE__*/React.createElement("div", {className: "fixed inset-0 z-50 flex items-center justify-center bg-black/40"},
        /*#__PURE__*/React.createElement("div", {className: "w-full max-w-lg rounded-xl bg-white p-6 shadow-xl space-y-4"},
          /*#__PURE__*/React.createElement("h4", {className: "text-base font-semibold text-slate-800"}, bankModal === "add" ? "Thêm tài khoản ngân hàng" : "Sửa tài khoản ngân hàng"),
          /*#__PURE__*/React.createElement("div", {className: "grid grid-cols-2 gap-3"},
            ["key:Mã tài khoản (ID)", "bank:Tên ngân hàng", "account:Số tài khoản", "owner:Chủ tài khoản", "branch:Chi nhánh", "note:Ghi chú"].map(s => {
              const [k, lbl] = s.split(":");
              return /*#__PURE__*/React.createElement("div", {key: k},
                /*#__PURE__*/React.createElement("label", {className: "mb-1 block text-xs font-medium text-slate-500"}, lbl),
                /*#__PURE__*/React.createElement("input", {className: inf, value: bankForm[k]||"", onChange: e => setBankForm(f => ({...f, [k]: e.target.value}))}));
            }),
            /*#__PURE__*/React.createElement("div", null,
              /*#__PURE__*/React.createElement("label", {className: "mb-1 block text-xs font-medium text-slate-500"}, "Dư đầu kỳ 01/01/2026 (đ)"),
              /*#__PURE__*/React.createElement(NumInput, {className: inf, value: bankForm.openBal||0, onChange: v => setBankForm(f => ({...f, openBal: v}))})),
            /*#__PURE__*/React.createElement("div", null,
              /*#__PURE__*/React.createElement("label", {className: "mb-1 block text-xs font-medium text-slate-500"}, "Trạng thái"),
              /*#__PURE__*/React.createElement("select", {className: inf, value: bankForm.status, onChange: e => setBankForm(f => ({...f, status: e.target.value}))},
                /*#__PURE__*/React.createElement("option", null, "Hoạt động"),
                /*#__PURE__*/React.createElement("option", null, "Ngừng hoạt động")))),
          /*#__PURE__*/React.createElement("p", {className: "text-xs text-amber-600 bg-amber-50 rounded-lg px-3 py-2"},
            "⚠ Số dư đầu kỳ = số dư TK ngân hàng tại ngày đầu kỳ (lấy từ sao kê NH). Tất cả giao dịch sau ngày đó sẽ cộng/trừ vào đây để ra số dư hiện tại."),
          /*#__PURE__*/React.createElement("div", {className: "flex justify-end gap-2"},
            /*#__PURE__*/React.createElement("button", {onClick: () => setBankModal(null), className: ghostBtn}, "Huỷ"),
            /*#__PURE__*/React.createElement("button", {onClick: saveBank, className: addBtnBlue}, "Lưu"))))),

    /*#__PURE__*/React.createElement("div", {className: "rounded-xl border border-slate-200 bg-white p-6 space-y-4"},
      /*#__PURE__*/React.createElement("h3", {className: "text-base font-semibold text-slate-800"}, "Quản lý loại giao dịch"),
      /*#__PURE__*/React.createElement("button", {onClick: openAddTx, className: addBtnBlue},
        /*#__PURE__*/React.createElement(Plus, {className: "h-4 w-4"}), " Thêm loại giao dịch"),
      /*#__PURE__*/React.createElement("table", {className: "w-full text-sm border-collapse", style:{tableLayout:"fixed"}},
        /*#__PURE__*/React.createElement("colgroup", null,
          /*#__PURE__*/React.createElement("col", {style:{width:"20%"}}),
          /*#__PURE__*/React.createElement("col", {style:{width:"13%"}}),
          /*#__PURE__*/React.createElement("col", {style:{width:"16%"}}),
          /*#__PURE__*/React.createElement("col", {style:{width:"17%"}}),
          /*#__PURE__*/React.createElement("col", {style:{width:"17%"}}),
          /*#__PURE__*/React.createElement("col", {style:{width:"17%"}})),
        /*#__PURE__*/React.createElement("thead", null,
          /*#__PURE__*/React.createElement("tr", {className: "border-b border-slate-200"},
            /*#__PURE__*/React.createElement("th", {className: th, colSpan:3}, "Tên loại giao dịch"),
            /*#__PURE__*/React.createElement("th", {className: th}, "Giao dịch"),
            /*#__PURE__*/React.createElement("th", {className: th}, "Trạng thái"),
            /*#__PURE__*/React.createElement("th", {className: th}, "Thao tác"))),
        /*#__PURE__*/React.createElement("tbody", {className: "divide-y divide-slate-100"},
          txTypes.map(r => /*#__PURE__*/React.createElement("tr", {key: r.id, className: "hover:bg-slate-50"},
            /*#__PURE__*/React.createElement("td", {className: td, colSpan:3}, r.name),
            /*#__PURE__*/React.createElement("td", {className: td},
              r.type && /*#__PURE__*/React.createElement("span", {className:`inline-flex items-center whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-medium ${r.type==="Thu"?"bg-[#dcfce7] text-[#047857]":"bg-[#fee2e2] text-[#B91C1C]"}`}, r.type)),
            /*#__PURE__*/React.createElement("td", {className: td}, /*#__PURE__*/React.createElement("span", {className: badge(r.status)}, r.status)),
            /*#__PURE__*/React.createElement("td", {className: "px-4 py-3"},
              /*#__PURE__*/React.createElement("div", {className: "flex items-center gap-1.5"},
                /*#__PURE__*/React.createElement("button", {onClick: () => openEditTx(r), className: editBtn}, /*#__PURE__*/React.createElement(Pencil, {className: "h-3.5 w-3.5"})),
                /*#__PURE__*/React.createElement("button", {onClick: () => deleteTx(r), className: delBtn}, /*#__PURE__*/React.createElement(Trash2, {className: "h-3.5 w-3.5"})))))))),
      txModal !== null && /*#__PURE__*/React.createElement("div", {className: "fixed inset-0 z-50 flex items-center justify-center bg-black/40"},
        /*#__PURE__*/React.createElement("div", {className: "w-full max-w-sm rounded-xl bg-white p-6 shadow-xl space-y-4"},
          /*#__PURE__*/React.createElement("h4", {className: "text-base font-semibold text-slate-800"}, txModal === "add" ? "Thêm loại giao dịch" : "Sửa loại giao dịch"),
          /*#__PURE__*/React.createElement("div", {className: "space-y-3"},
            /*#__PURE__*/React.createElement("div", null,
              /*#__PURE__*/React.createElement("label", {className: "mb-1 block text-xs font-medium text-slate-500"}, "Tên loại giao dịch"),
              /*#__PURE__*/React.createElement("input", {className: inf, value: txForm.name, onChange: e => setTxForm(f => ({...f, name: e.target.value}))})),
            /*#__PURE__*/React.createElement("div", null,
              /*#__PURE__*/React.createElement("label", {className: "mb-1 block text-xs font-medium text-slate-500"}, "Loại"),
              /*#__PURE__*/React.createElement("select", {className: inf, value: txForm.type, onChange: e => setTxForm(f => ({...f, type: e.target.value}))},
                /*#__PURE__*/React.createElement("option", null, "Thu"),
                /*#__PURE__*/React.createElement("option", null, "Chi"))),
            /*#__PURE__*/React.createElement("div", null,
              /*#__PURE__*/React.createElement("label", {className: "mb-1 block text-xs font-medium text-slate-500"}, "Trạng thái"),
              /*#__PURE__*/React.createElement("select", {className: inf, value: txForm.status, onChange: e => setTxForm(f => ({...f, status: e.target.value}))},
                /*#__PURE__*/React.createElement("option", null, "Hoạt động"),
                /*#__PURE__*/React.createElement("option", null, "Ngừng hoạt động")))),
          /*#__PURE__*/React.createElement("div", {className: "flex justify-end gap-2"},
            /*#__PURE__*/React.createElement("button", {onClick: () => setTxModal(null), className: ghostBtn}, "Huỷ"),
            /*#__PURE__*/React.createElement("button", {onClick: saveTx, className: addBtnBlue}, "Lưu"))))));
}

/* ───────── Settings: Định dạng số ───────── */
function SettingsNumFormat() {
  const sectionHd = "text-[15px] font-bold text-slate-800";
  const rowCls = "flex items-start gap-4 border-t border-slate-100 py-3";
  const label = "w-64 shrink-0 text-[13px] text-slate-600";
  const val = "text-[13px] font-medium text-slate-800";
  const ex = "ml-4 text-[13px] font-bold text-slate-700";

  const separatorRows = [
    ["Ngăn cách hàng nghìn trên giao diện", ". (dấu chấm)"],
    ["Ngăn cách hàng thập phân trên giao diện", ", (dấu phẩy)"],
    ["Ngăn cách hàng nghìn trên báo cáo", ". (dấu chấm)"],
    ["Ngăn cách hàng thập phân trên báo cáo", ", (dấu phẩy)"],
  ];
  const decimalRows = [
    ["Tiền (VNĐ)", 0, "1.234.568"],
    ["Số lượng", 0, "1.234.568"],
    ["Đơn giá", 0, "1.234.568"],
    ["Tỷ lệ (%)", 2, "1.234.567,89"],
    ["Hệ số, tỷ lệ", 2, "1.234.567,89"],
  ];

  return /*#__PURE__*/React.createElement("div", {className: "mx-auto max-w-3xl space-y-8 py-4"},
    /*#__PURE__*/React.createElement("h2", {className: "text-[22px] font-bold text-slate-800"}, "Định dạng số"),

    /*#__PURE__*/React.createElement("div", {className: "rounded-xl border border-slate-200 bg-white p-6 space-y-1"},
      /*#__PURE__*/React.createElement("p", {className: sectionHd}, "Ký tự ngăn cách"),
      separatorRows.map(([desc, v]) =>
        /*#__PURE__*/React.createElement("div", {key: desc, className: rowCls},
          /*#__PURE__*/React.createElement("span", {className: label}, desc),
          /*#__PURE__*/React.createElement("span", {className: val}, v)
        )
      )
    ),

    /*#__PURE__*/React.createElement("div", {className: "rounded-xl border border-slate-200 bg-white p-6 space-y-1"},
      /*#__PURE__*/React.createElement("p", {className: sectionHd}, "Số chữ số của phần thập phân"),
      decimalRows.map(([desc, digits, example]) =>
        /*#__PURE__*/React.createElement("div", {key: desc, className: rowCls},
          /*#__PURE__*/React.createElement("span", {className: label}, desc),
          /*#__PURE__*/React.createElement("span", {className: "w-8 text-center text-[13px] font-semibold text-slate-700"}, digits),
          /*#__PURE__*/React.createElement("span", {className: ex}, "Ví dụ: ", example)
        )
      )
    ),

    /*#__PURE__*/React.createElement("div", {className: "rounded-xl border border-slate-200 bg-white p-6 space-y-1"},
      /*#__PURE__*/React.createElement("p", {className: sectionHd}, "Cách thể hiện số âm"),
      /*#__PURE__*/React.createElement("div", {className: rowCls},
        /*#__PURE__*/React.createElement("span", {className: label}, "Ký hiệu"),
        /*#__PURE__*/React.createElement("span", {className: "w-8 text-center text-[13px] font-semibold text-slate-700"}, "-n"),
        /*#__PURE__*/React.createElement("span", {className: "ml-4 text-[13px] font-bold text-[#B91C1C]"}, "Ví dụ: -1.234.568")
      ),
      /*#__PURE__*/React.createElement("div", {className: rowCls},
        /*#__PURE__*/React.createElement("span", {className: label}, "Màu sắc"),
        /*#__PURE__*/React.createElement("span", {className: "h-5 w-5 rounded bg-[#B91C1C]"}),
        /*#__PURE__*/React.createElement("span", {className: "ml-2 text-[13px] text-slate-700"}, "Đỏ")
      )
    )
  );
}

/* ───────── Settings: Quy tắc đánh số chứng từ ───────── */
const DOC_NUM_INIT = [
  {id:1, type:"Báo giá",        prefix:"BG", num:1, year:new Date().getFullYear()},
  {id:2, type:"Đơn hàng",       prefix:"DH", num:1, year:new Date().getFullYear()},
  {id:3, type:"Phiếu mua hàng", prefix:"PM", num:1, year:new Date().getFullYear()},
  {id:4, type:"Phiếu nhập kho", prefix:"PN", num:1, year:new Date().getFullYear()},
  {id:5, type:"Phiếu xuất kho", prefix:"PX", num:1, year:new Date().getFullYear()},
  {id:6, type:"Phiếu thu",      prefix:"PT", num:1, year:new Date().getFullYear()},
  {id:7, type:"Phiếu chi",      prefix:"PC", num:1, year:new Date().getFullYear()},
];

function SettingsDocNum() {
  const {docNums: rows, setDocNums: setRows} = useDocNum();
  const [editing, setEditing] = React.useState(null);
  const notify = useToast();

  const preview = r => fmtDocId(r.prefix, r.num);

  const save = () => {
    setRows(xs => xs.map(r => r.id === editing.id ? {...r, num: Number(editing.num) || r.num} : r));
    notify("Đã cập nhật quy tắc đánh số");
    setEditing(null);
  };

  const th = "px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500";
  const td = "px-4 py-3 text-[13px] text-slate-700";

  return /*#__PURE__*/React.createElement("div", {className: "mx-auto max-w-3xl space-y-6 py-4"},
    /*#__PURE__*/React.createElement("h2", {className: "text-[22px] font-bold text-slate-800"}, "Quy tắc đánh số chứng từ"),

    /*#__PURE__*/React.createElement("div", {className: "rounded-xl border border-slate-200 bg-white overflow-hidden"},
      /*#__PURE__*/React.createElement("table", {className: "w-full"},
        /*#__PURE__*/React.createElement("thead", {className: "bg-[#fef9f0]"},
          /*#__PURE__*/React.createElement("tr", null,
            /*#__PURE__*/React.createElement("th", {className: th + " w-8"}, "#"),
            /*#__PURE__*/React.createElement("th", {className: th}, "Loại chứng từ"),
            /*#__PURE__*/React.createElement("th", {className: th}, "Tiền tố"),
            /*#__PURE__*/React.createElement("th", {className: th + " text-right"}, "Số hiện tại"),
            /*#__PURE__*/React.createElement("th", {className: th}, "Ví dụ hiển thị"),
            /*#__PURE__*/React.createElement("th", {className: th + " text-center"}, "Thao tác")
          )
        ),
        /*#__PURE__*/React.createElement("tbody", {className: "divide-y divide-slate-100"},
          rows.map((r, i) =>
            /*#__PURE__*/React.createElement("tr", {key: r.id, className: "hover:bg-slate-50/60"},
              /*#__PURE__*/React.createElement("td", {className: td + " text-slate-400"}, i + 1),
              /*#__PURE__*/React.createElement("td", {className: td + " font-medium text-slate-800"}, r.type),
              /*#__PURE__*/React.createElement("td", {className: td},
                /*#__PURE__*/React.createElement("span", {className: "rounded bg-slate-100 px-2 py-0.5 font-mono text-xs font-semibold text-slate-700"}, r.prefix)
              ),
              /*#__PURE__*/React.createElement("td", {className: td + " text-right tabular-nums"},
                editing && editing.id === r.id
                  ? /*#__PURE__*/React.createElement("input", {
                      type: "number", min: 1,
                      value: editing.num,
                      onChange: e => setEditing(x => ({...x, num: e.target.value})),
                      className: "w-24 rounded border border-[#b45309] px-2 py-0.5 text-right text-sm focus:outline-none focus:ring-1 focus:ring-[#b45309]"
                    })
                  : r.num
              ),
              /*#__PURE__*/React.createElement("td", {className: td},
                /*#__PURE__*/React.createElement("span", {className: "inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-mono font-medium ring-1 ring-inset bg-[#fef9f0] text-[#92400e] ring-[#b45309]"}, preview(r))
              ),
              /*#__PURE__*/React.createElement("td", {className: td + " text-center"},
                editing && editing.id === r.id
                  ? /*#__PURE__*/React.createElement("div", {className: "flex items-center justify-center gap-2"},
                      /*#__PURE__*/React.createElement("button", {onClick: save, className: "rounded-md bg-[#92400e] px-3 py-1 text-xs font-semibold text-white hover:bg-[#78350f]"}, "Lưu"),
                      /*#__PURE__*/React.createElement("button", {onClick: () => setEditing(null), className: "rounded-md border border-slate-200 bg-white px-3 py-1 text-xs text-slate-600 hover:bg-slate-50"}, "Huỷ")
                    )
                  : /*#__PURE__*/React.createElement(IconBtn, {icon: Pencil, title: "Sửa", onClick: () => setEditing({id: r.id, num: r.num})})
              )
            )
          )
        )
      )
    ),

    /*#__PURE__*/React.createElement("div", {className: "rounded-xl border border-slate-200 bg-white p-5 space-y-2"},
      /*#__PURE__*/React.createElement("p", {className: "text-[13px] text-slate-500"},
        "Định dạng: ", /*#__PURE__*/React.createElement("strong", null, "Tiền tố + 2 số cuối năm + 4 số thứ tự"),
        ". Ví dụ: ", /*#__PURE__*/React.createElement("strong", null, "BG260001"), ", ", /*#__PURE__*/React.createElement("strong", null, "DH260002"), "."
      ),
      /*#__PURE__*/React.createElement("p", {className: "text-[13px] text-slate-500"},
        "Sang năm mới, số thứ tự tự động reset về 0001. Ví dụ: ", /*#__PURE__*/React.createElement("strong", null, "BG270001"), "."
      )
    )
  );
}

function SettingsPrint() {
  const notify = useToast();
  const [cfgItems, , ] = useCollection("config");
  const cfg = cfgItems.find(c => c.id === "print_template") || {};
  const PRINT_DEFAULTS = {
    companyName: "CÔNG TY TNHH BÁN LẺ TẠI KHO HẢI PHÒNG",
    address: "LK-10, Số 384 Lê Thánh Tông, Phường Ngô Quyền, Thành phố Hải Phòng",
    phone: "033 5252 225",
    taxCode: "0202252225",
    email: "vat.banletaikhohaiphong@gmail.com",
    website: "",
    footer: "",
    logoUrl: "/logo.png",
    bankNo: "202252225",
    bankCode: "TCB",
    bankOwner: "BAN LE TAI KHO HAI PHONG",
    bankName: "TECHCOMBANK (Ngân hàng TMCP Kỳ Thương Việt Nam)",
  };
  const [form, setForm] = useState({...PRINT_DEFAULTS, ...cfg});
  React.useEffect(() => {
    if (cfg && cfg.id) setForm(f => ({...f, ...PRINT_DEFAULTS, ...cfg}));
  }, [JSON.stringify(cfg)]);
  const set = (k,v) => setForm(f => ({...f, [k]:v}));
  const save = async () => {
    await saveDoc("config", "print_template", {...form, id:"print_template"});
    notify("Đã lưu cấu hình mẫu in");
  };

  const LabelInput = ({label, k, ph, multi}) => /*#__PURE__*/React.createElement("div", null,
    /*#__PURE__*/React.createElement("label", {className:"mb-1 block text-[13px] font-medium text-slate-600"}, label),
    multi
      ? /*#__PURE__*/React.createElement("textarea", {rows:3, value:form[k]||"", onChange:e=>set(k,e.target.value), placeholder:ph||"", className:`${field} w-full`})
      : /*#__PURE__*/React.createElement("input", {type:"text", value:form[k]||"", onChange:e=>set(k,e.target.value), placeholder:ph||"", className:`${field} w-full`}));

  return /*#__PURE__*/React.createElement("div", {className:"max-w-2xl space-y-4"},
    /*#__PURE__*/React.createElement("h2", {className:"text-[16px] font-semibold text-[#92400e]"}, "Cấu hình mẫu in"),
    /*#__PURE__*/React.createElement(Card, {title:"Thông tin công ty"},
      /*#__PURE__*/React.createElement("div", {className:"grid grid-cols-1 gap-3 sm:grid-cols-2"},
        LabelInput({label:"Tên công ty", k:"companyName", ph:"BLTK Hải Phòng"}),
        LabelInput({label:"Mã số thuế", k:"taxCode", ph:"0123456789"}),
        LabelInput({label:"Địa chỉ", k:"address", ph:"Số X, đường Y, phường Z, Hải Phòng"}),
        LabelInput({label:"Điện thoại", k:"phone", ph:"0901 234 567"}),
        LabelInput({label:"Email", k:"email", ph:"info@bltk.vn"}),
        LabelInput({label:"Website", k:"website", ph:"www.bltk.vn"}),
        LabelInput({label:"URL Logo", k:"logoUrl", ph:"https://... (để trống nếu không có)"}),
        LabelInput({label:"Ghi chú cuối phiếu", k:"footer", ph:"Cảm ơn quý khách đã tin dùng sản phẩm!", multi:true}))),
    /*#__PURE__*/React.createElement(Card, {title:"Thông tin ngân hàng (QR VietQR)"},
      /*#__PURE__*/React.createElement("div", {className:"grid grid-cols-1 gap-3 sm:grid-cols-2"},
        LabelInput({label:"Số tài khoản", k:"bankNo", ph:"202252225"}),
        LabelInput({label:"Mã ngân hàng VietQR", k:"bankCode", ph:"TCB / VCB / MB / ACB..."}),
        LabelInput({label:"Tên tài khoản (in trên phiếu)", k:"bankOwner", ph:"BAN LE TAI KHO HAI PHONG"}),
        LabelInput({label:"Tên ngân hàng (in trên phiếu)", k:"bankName", ph:"TECHCOMBANK (NH TMCP Kỳ Thương VN)"}))),
    form.companyName && /*#__PURE__*/React.createElement(Card, {title:"Xem trước phần đầu phiếu in"},
      /*#__PURE__*/React.createElement("div", {className:"rounded border border-slate-200 bg-white p-4 text-sm"},
        /*#__PURE__*/React.createElement("div", {className:"flex items-start gap-4"},
          form.logoUrl && /*#__PURE__*/React.createElement("img", {src:form.logoUrl, alt:"logo", className:"h-14 w-auto object-contain"}),
          /*#__PURE__*/React.createElement("div", null,
            /*#__PURE__*/React.createElement("div", {className:"text-base font-bold text-slate-800"}, form.companyName),
            form.taxCode && /*#__PURE__*/React.createElement("div", {className:"text-xs text-slate-500"}, "MST: ", form.taxCode),
            form.address && /*#__PURE__*/React.createElement("div", {className:"text-xs text-slate-500"}, form.address),
            form.phone && /*#__PURE__*/React.createElement("div", {className:"text-xs text-slate-500"}, "ĐT: ", form.phone))))),
    /*#__PURE__*/React.createElement("div", {className:"flex justify-end"},
      /*#__PURE__*/React.createElement("button", {onClick:save, className:blueBtn}, "Lưu cấu hình")));
}



/* ───────── TEMP: Xóa dữ liệu test ───────── */
function AdminClearData() {
  const [busy, setBusy] = React.useState(false);
  const [done, setDone] = React.useState(null);
  const COLS = ["orders","purchases","wh_in","wh_out","txns"];
  const clearAll = async () => {
    if (!window.confirm("Xóa TOÀN BỘ dữ liệu orders, purchases, wh_in, wh_out, txns?\nKhông thể hoàn tác!")) return;
    setBusy(true); setDone(null);
    const counts = {};
    for (const col of COLS) {
      const snap = await getDocs(collection(db, col));
      await Promise.all(snap.docs.map(d => deleteDoc(fsDoc(db, col, d.id))));
      counts[col] = snap.size;
    }
    setBusy(false);
    setDone(counts);
  };
  return React.createElement("div", {className: "space-y-4 max-w-lg"},
    React.createElement("div", {className: "rounded-xl border-2 border-red-200 bg-red-50 p-5 space-y-3"},
      React.createElement("p", {className: "font-semibold text-red-700"}, "⚠ Xóa dữ liệu test"),
      React.createElement("p", {className: "text-sm text-red-600"}, "Xóa toàn bộ: orders, purchases, wh_in, wh_out, txns. Không thể hoàn tác."),
      React.createElement("button", {
        onClick: clearAll, disabled: busy,
        className: "rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
      }, busy ? "Đang xóa..." : "Xóa tất cả dữ liệu"),
      done && React.createElement("div", {className: "text-sm text-green-700 space-y-1"},
        React.createElement("p", {className: "font-semibold"}, "✅ Đã xóa xong:"),
        Object.entries(done).map(([col, n]) =>
          React.createElement("p", {key: col}, col, ": ", n, " bản ghi")
        )
      )
    )
  );
}

/* ───────── Màn hình đăng nhập ───────── */
function LoginScreen() {
  const { login } = useAuth();
  const [email, setEmail] = useState(() => localStorage.getItem("bltk_saved_email") || "");
  const [pass, setPass] = useState(() => localStorage.getItem("bltk_saved_pass") || "");
  const [remember, setRemember] = useState(() => !!localStorage.getItem("bltk_saved_email"));
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const submit = async e => {
    e.preventDefault();
    setErr(""); setLoading(true);
    try {
      await login(email.trim(), pass);
      if (remember) { localStorage.setItem("bltk_saved_email", email.trim()); localStorage.setItem("bltk_saved_pass", pass); }
      else { localStorage.removeItem("bltk_saved_email"); localStorage.removeItem("bltk_saved_pass"); }
    }
    catch { setErr("Email hoặc mật khẩu không đúng."); }
    finally { setLoading(false); }
  };
  const BUBBLES = [
    {w:80,h:80,l:10,d:0,t:14},{w:40,h:40,l:25,d:2,t:9},{w:120,h:120,l:50,d:4,t:18},
    {w:30,h:30,l:70,d:1,t:8},{w:60,h:60,l:85,d:3,t:12},{w:50,h:50,l:40,d:5,t:10},
    {w:90,h:90,l:60,d:1.5,t:16},{w:35,h:35,l:15,d:6,t:7},{w:70,h:70,l:78,d:2.5,t:13},
    {w:45,h:45,l:5,d:7,t:11},{w:100,h:100,l:35,d:3.5,t:20},{w:25,h:25,l:90,d:0.5,t:6},
  ];
  return React.createElement("div", { className: "min-h-screen flex relative overflow-hidden",
      style: { background: "radial-gradient(ellipse at 60% 40%, #c84b0e 0%, #8b2200 45%, #4a1000 100%)" }
    },
    /* CSS keyframes bóng nước */
    React.createElement("style", null, `
      @keyframes floatBubble {
        0%   { transform: translateY(0) scale(1);   opacity: 0; }
        10%  { opacity: 0.5; }
        85%  { opacity: 0.25; }
        100% { transform: translateY(-110vh) scale(1.2); opacity: 0; }
      }
    `),
    /* Bóng nước nổi */
    React.createElement("div", { className: "absolute inset-0 overflow-hidden pointer-events-none" },
      ...BUBBLES.map((b,i) => React.createElement("div", { key: i, style: {
        position: "absolute",
        bottom: "-120px",
        left: `${b.l}%`,
        width: `${b.w}px`,
        height: `${b.h}px`,
        borderRadius: "50%",
        border: "1px solid rgba(255,255,255,0.35)",
        background: "radial-gradient(circle at 35% 35%, rgba(255,255,255,0.18), rgba(255,255,255,0.03))",
        animation: `floatBubble ${b.t}s ease-in ${b.d}s infinite`,
        boxShadow: "inset 0 0 12px rgba(255,255,255,0.12)",
      }}))
    ),
    /* Panel form */
    React.createElement("div", { className: "relative z-10 flex flex-1 items-center justify-center p-6" },
      React.createElement("div", { className: "rounded-3xl w-full max-w-md p-10", style: { background: "rgba(255,255,255,0.07)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)" } },
        /* Header — căn giữa */
        React.createElement("div", { className: "mb-8 flex flex-col items-center text-center" },
          React.createElement("img", { src: "/banner.jpg", alt: "BLTK", className: "w-24 h-24 rounded-2xl object-cover mb-5 shadow-lg" }),
          React.createElement("h1", { className: "text-2xl font-bold text-white" }, "Đăng nhập"),
          React.createElement("p", { className: "text-white/70 text-sm mt-1" }, "Nhập thông tin tài khoản của bạn")
        ),
        /* Form */
        React.createElement("form", { onSubmit: submit, className: "space-y-5" },
          React.createElement("div", null,
            React.createElement("label", { className: "block text-sm font-medium text-white/90 mb-1.5" }, "Email"),
            React.createElement("input", { type: "email", value: email, onChange: e => setEmail(e.target.value), required: true, autoFocus: true,
              placeholder: "ten@email.com",
              className: "w-full border border-white/30 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-white/60 focus:border-transparent text-white placeholder-white/40",
              style: { background: "rgba(255,255,255,0.15)", fontSize: '16px' } })
          ),
          React.createElement("div", null,
            React.createElement("label", { className: "block text-sm font-medium text-white/90 mb-1.5" }, "Mật khẩu"),
            React.createElement("div", { className: "relative" },
              React.createElement("input", { type: showPass ? "text" : "password", value: pass, onChange: e => setPass(e.target.value), required: true,
                placeholder: "••••••••",
                className: "w-full border border-white/30 rounded-xl px-4 py-3 pr-11 text-sm focus:outline-none focus:ring-2 focus:ring-white/60 focus:border-transparent text-white placeholder-white/40",
                style: { background: "rgba(255,255,255,0.15)", fontSize: '16px' } }),
              React.createElement("button", { type: "button", onClick: () => setShowPass(v => !v),
                className: "absolute right-3 top-1/2 -translate-y-1/2 text-white/60 hover:text-white/90 active:text-white" },
                React.createElement(showPass ? EyeOff : Eye, { className: "h-4.5 w-4.5" }))
            )
          ),
          React.createElement("label", { className: "flex items-center gap-2 cursor-pointer select-none" },
            React.createElement("input", { type: "checkbox", checked: remember, onChange: e => setRemember(e.target.checked), className: "w-4 h-4 rounded accent-amber-700" }),
            React.createElement("span", { className: "text-sm text-white/80" }, "Lưu mật khẩu")
          ),
          err && React.createElement("div", { className: "flex items-center gap-2 text-sm text-red-200 bg-red-900/40 rounded-xl px-4 py-2.5" },
            React.createElement(AlertTriangle, { className: "h-4 w-4 flex-shrink-0" }), err
          ),
          React.createElement("button", { type: "submit", disabled: loading,
            className: "w-full text-white font-semibold rounded-xl py-3 text-sm transition disabled:opacity-60 mt-2",
            style: { background: loading ? "#5a1200" : "linear-gradient(to top,#4a0e00,#a83800)" } },
            loading ? "Đang đăng nhập..." : "Đăng nhập →")
        )
      )
    )
  );
}

/* ───────── Màn hình quản lý người dùng (chỉ manager) ───────── */
function UsersTab() {
  const notify = useToast();
  const [users] = useCollection("users");
  const [form, setForm] = useState(null);
  const [newEmail, setNewEmail] = useState("");
  const [newPass, setNewPass] = useState("");
  const [newName, setNewName] = useState("");
  const [newRole, setNewRole] = useState("sales");
  const [saving, setSaving] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editRole, setEditRole] = useState("sales");
  const [editPass, setEditPass] = useState("");
  const [showEditPass, setShowEditPass] = useState(false);
  const [editSaving, setEditSaving] = useState(false);

  const openEdit = u => { setEditUser(u); setEditName(u.name || ""); setEditEmail(u.email || ""); setEditRole(u.role || "sales"); setEditPass(u.pass || ""); setShowEditPass(false); };

  const saveEdit = async e => {
    e.preventDefault();
    setEditSaving(true);
    try {
      const data = { ...editUser, name: editName.trim(), email: editEmail.trim(), role: editRole };
      if (editPass.trim()) data.pass = editPass.trim();
      await saveDoc("users", editUser._id || editUser.uid || editUser.id, data);
      notify("Đã cập nhật thông tin");
      setEditUser(null);
    } catch(err) { notify("Lỗi: " + err.message); }
    finally { setEditSaving(false); }
  };

  const createUser = async e => {
    e.preventDefault();
    setSaving(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, newEmail.trim(), newPass);
      await createUserProfile(cred.user.uid, { email: newEmail.trim(), name: newName.trim(), role: newRole, pass: newPass.trim() });
      notify("Đã tạo tài khoản " + newEmail);
      setForm(null); setNewEmail(""); setNewPass(""); setNewName(""); setNewRole("sales");
    } catch(err) {
      notify("Lỗi: " + (err.code === "auth/email-already-in-use" ? "Email đã tồn tại" : err.message));
    } finally { setSaving(false); }
  };

  const lbl = "block text-sm font-medium text-slate-600 mb-1";
  return React.createElement("div", { className: "space-y-4" },
    React.createElement("div", { className: "flex justify-between items-center" },
      React.createElement("h2", { className: "text-base font-semibold" }, users.length + " tài khoản"),
      React.createElement("button", { onClick: () => setForm({}), className: blueBtn },
        React.createElement(Plus, { className: "h-4 w-4" }), " Thêm nhân viên")
    ),
    React.createElement(TableShell, {
      head: React.createElement(React.Fragment, null,
        React.createElement(Th, null, "Họ tên"),
        React.createElement(Th, null, "Email"),
        React.createElement(Th, null, "Mật khẩu"),
        React.createElement(Th, null, "Vai trò"),
        React.createElement(Th, {center:true, style:{width:80}}, ""))
    },
      [...users].sort((a,b) => { const o = ["admin","manager","sales","warehouse"]; const ia = o.includes(a.role) ? o.indexOf(a.role) : 99; const ib = o.includes(b.role) ? o.indexOf(b.role) : 99; return ia - ib; }).map(u => React.createElement("tr", { key: u.email, className: "hover:bg-slate-50" },
        React.createElement("td", { className: "px-4 py-2.5 text-sm font-medium text-slate-800" }, u.name || ""),
        React.createElement("td", { className: "px-4 py-2.5 text-sm text-slate-500" }, u.email),
        React.createElement("td", { className: "px-4 py-2.5 text-sm font-mono text-slate-600" }, u.pass || React.createElement("span", {className:"text-slate-300 text-xs"}, "chưa lưu")),
        React.createElement("td", { className: "px-4 py-2.5" },
          React.createElement("span", {className: "inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium " + (ROLES[u.role]?.color || "bg-slate-100 text-slate-500")},
            ROLES[u.role]?.label || u.role)),
        React.createElement("td", { className: "px-4 py-2.5 text-center" },
          React.createElement(IconBtn, { icon: Pencil, title: "Sửa thông tin", onClick: () => openEdit(u) }))
      ))
    ),
    editUser && React.createElement("div", { className: "fixed inset-0 bg-black/40 flex items-center justify-center z-50" },
      React.createElement("div", { className: "bg-white rounded-2xl shadow-xl p-8 w-full max-w-sm" },
        React.createElement("h3", { className: "text-lg font-bold mb-6" }, "Sửa thông tin nhân viên"),
        React.createElement("form", { onSubmit: saveEdit, className: "space-y-4" },
          React.createElement("div", null,
            React.createElement("label", { className: lbl }, "Họ tên"),
            React.createElement("input", { value: editName, onChange: e => setEditName(e.target.value), required: true, className: field + " w-full" })),
          React.createElement("div", null,
            React.createElement("label", { className: lbl }, "Email"),
            React.createElement("input", { type: "email", value: editEmail, onChange: e => setEditEmail(e.target.value), required: true, className: field + " w-full" })),
          React.createElement("div", null,
            React.createElement("label", { className: lbl }, "Vai trò"),
            React.createElement("select", { value: editRole, onChange: e => setEditRole(e.target.value), className: field + " w-full" },
              Object.entries(ROLES).map(([k, v]) => React.createElement("option", { key: k, value: k }, v.label)))),
          React.createElement("div", null,
            React.createElement("label", { className: lbl }, "Mật khẩu (lưu để nhớ)"),
            React.createElement("div", {className:"relative"},
              React.createElement("input", { type: showEditPass ? "text" : "password", value: editPass, onChange: e => setEditPass(e.target.value), placeholder: "Nhập để lưu mật khẩu", className: field + " w-full pr-10" }),
              React.createElement("button", { type:"button", onClick: () => setShowEditPass(v => !v), className:"absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs" },
                showEditPass ? "Ẩn" : "Hiện"))),
          React.createElement("div", { className: "flex gap-2 pt-2" },
            React.createElement("button", { type: "button", onClick: () => setEditUser(null), className: ghostBtn }, "Huỷ"),
            React.createElement("button", { type: "submit", disabled: editSaving, className: blueBtn + " flex-1 justify-center disabled:opacity-50" },
              editSaving ? "Đang lưu..." : "Lưu thay đổi"))))),
    form && React.createElement("div", { className: "fixed inset-0 bg-black/40 flex items-center justify-center z-50" },
      React.createElement("div", { className: "bg-white rounded-2xl shadow-xl p-8 w-full max-w-sm" },
        React.createElement("h3", { className: "text-lg font-bold mb-6" }, "Thêm nhân viên"),
        React.createElement("form", { onSubmit: createUser, className: "space-y-4" },
          React.createElement("div", null,
            React.createElement("label", { className: lbl }, "Họ tên"),
            React.createElement("input", { value: newName, onChange: e => setNewName(e.target.value), required: true, className: field + " w-full" })),
          React.createElement("div", null,
            React.createElement("label", { className: lbl }, "Email"),
            React.createElement("input", { type: "email", value: newEmail, onChange: e => setNewEmail(e.target.value), required: true, className: field + " w-full" })),
          React.createElement("div", null,
            React.createElement("label", { className: lbl }, "Mật khẩu tạm"),
            React.createElement("input", { type: "text", value: newPass, onChange: e => setNewPass(e.target.value), required: true, minLength: 6, className: field + " w-full" })),
          React.createElement("div", null,
            React.createElement("label", { className: lbl }, "Vai trò"),
            React.createElement("select", { value: newRole, onChange: e => setNewRole(e.target.value), className: field + " w-full" },
              Object.entries(ROLES).map(([k, v]) => React.createElement("option", { key: k, value: k }, v.label)))),
          React.createElement("div", { className: "flex gap-2 pt-2" },
            React.createElement("button", { type: "button", onClick: () => setForm(null), className: ghostBtn }, "Huỷ"),
            React.createElement("button", { type: "submit", disabled: saving, className: blueBtn + " flex-1 justify-center disabled:opacity-50" },
              saving ? "Đang tạo..." : "Tạo tài khoản")))))
  );
}

/* ───────── Mobile detection hook ───────── */
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);
  return isMobile;
}

/* ───────── Mobile App ───────── */
function MobileApp({ profile, logout }) {
  const isAdmin = profile?.role === "admin";
  const [tab, setTab] = useState("orders");
  const [orders] = useCollection("orders");
  const [prodsFS] = useCollection("products");
  const [settingsFS] = useCollection("settings");
  const [txnsFS] = useCollection("txns");
  const [whInFS] = useCollection("wh_in");
  const [purchaseList] = useCollection("purchases");
  const [homeFrom, setHomeFrom] = useState(localMonthStart);
  const [homeTo, setHomeTo] = useState(localToday);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [productForm, setProductForm] = useState(null);
  const [savingProd, setSavingProd] = useState(false);
  const [createForm, setCreateForm] = useState({name:"",phone:"",addr:"",note:"",items:[]});
  const [showPicker, setShowPicker] = useState(false);
  const [pickerQ, setPickerQ] = useState("");
  const [orderSearch, setOrderSearch] = useState("");
  const [quoteSearch, setQuoteSearch] = useState("");
  const [showPayModal, setShowPayModal] = useState(false);
  const [payExpenses, setPayExpenses] = useState([]);
  const [payDeposit, setPayDeposit] = useState(0);
  const [payPayment, setPayPayment] = useState(0);
  const [prodQ, setProdQ] = useState("");
  const [prodLimit, setProdLimit] = useState(50);
  const [showDetailPay, setShowDetailPay] = useState(false);
  const [detailPayAmt, setDetailPayAmt] = useState(0);
  const [detailPayKind, setDetailPayKind] = useState("Thanh toán");
  const [editingOrderId, setEditingOrderId] = useState(null);
  const [editingOrderRef, setEditingOrderRef] = useState(null);
  const [mobAcc, setMobAcc] = useState("CTY");
  const [showWhIn, setShowWhIn] = useState(false);
  const [whInRows, setWhInRows] = useState([]);
  const [whInPn, setWhInPn] = useState("");
  const [whInDate, setWhInDate] = useState("");
  const [whInKho, setWhInKho] = useState("HH");
  const [justImported, setJustImported] = useState(false);
  const [showPartialDlv, setShowPartialDlv] = useState(false);
  const [partialDlvQtys, setPartialDlvQtys] = useState({});
  const [nccSugIdx, setNccSugIdx] = useState(null);
  const [showPrintMenu, setShowPrintMenu] = useState(false);
  const [converting, setConverting] = useState(false);
  const [notifs, setNotifs] = useState([]);
  const [showRetListMob, setShowRetListMob] = useState(false);
  const [showNotifs, setShowNotifs] = useState(false);
  const notify = useToast();

  /* ── FCM: đăng ký token push + lắng nghe foreground ── */
  // VAPID key: Firebase Console → Project Settings → Cloud Messaging → Web Push certificates → Generate key pair
  const FCM_VAPID_KEY = "BF5HggSTNBun3AFv4u9rcsK4kJ9IzvQtDGP4ONMcdffIJWGKuyI5XXr_Mt6-GiGEaQ3_F9c-3DEmThXjYHxUNmw";
  const knownOrderIds = React.useRef(null);
  const knownTxnIds = React.useRef(null);
  const homeLastTap = React.useRef(0);

  React.useEffect(() => {
    if (!profile?.uid) return;
    if (!("Notification" in window) || !("serviceWorker" in navigator)) return;
    (async () => {
      try {
        const perm = Notification.permission === "default"
          ? await Notification.requestPermission()
          : Notification.permission;
        if (perm !== "granted") return;
        const reg = await navigator.serviceWorker.register("/firebase-messaging-sw.js");
        if (FCM_VAPID_KEY === "REPLACE_WITH_YOUR_VAPID_KEY") return;
        const msg = (() => { try { return getMessaging(fbApp); } catch(e) { return null; } })();
        if (!msg) return;
        const token = await getToken(msg, { vapidKey: FCM_VAPID_KEY, serviceWorkerRegistration: reg });
        if (token) saveDoc("users", profile.uid, { fcmToken: token });
        onMessage(msg, payload => {
          const title = payload.notification?.title || "BLTK Hai Phong";
          const body = payload.notification?.body || "";
          notify(body ? title + " — " + body : title);
        });
      } catch(e) { /* messaging not supported on this device */ }
    })();
  }, [profile?.uid]);

  const pushNotif = (msg, type) => {
    setNotifs(prev => [{id: Date.now(), msg, type: type||"order", ts: new Date().toLocaleTimeString("vi-VN",{hour:"2-digit",minute:"2-digit"})}, ...prev].slice(0, 50));
  };

  React.useEffect(() => {
    if (!orders || !orders.length) return;
    const ids = new Set(orders.map(o => o.id));
    if (knownOrderIds.current === null) { knownOrderIds.current = ids; return; }
    const newOnes = orders.filter(o => !knownOrderIds.current.has(o.id));
    knownOrderIds.current = ids;
    if (!newOnes.length) return;
    newOnes.forEach(o => {
      const msg = "Đơn mới: " + (o.name||"KH") + " — " + o.id;
      notify(msg);
      pushNotif(msg, "order");
    });
    if (Notification.permission === "granted" && tab !== "orders") {
      const o = newOnes[0];
      new Notification("Đơn hàng mới — BLTK", {
        body: (o.name||"Khách hàng") + " (" + o.id + ")",
        icon: "/logo.png", tag: "order-" + o.id
      });
    }
  }, [orders]);

  React.useEffect(() => {
    if (!txnsFS || !txnsFS.length) return;
    const manual = txnsFS.filter(t => ["PhieuThu","PhieuChi"].includes(t.kind));
    const ids = new Set(manual.map(t => t._id || String(t.id)));
    if (knownTxnIds.current === null) { knownTxnIds.current = ids; return; }
    const newOnes = manual.filter(t => !knownTxnIds.current.has(t._id || String(t.id)));
    knownTxnIds.current = ids;
    if (!newOnes.length) return;
    newOnes.forEach(t => {
      const label = t.kind === "PhieuThu" ? "Phiếu thu" : "Phiếu chi";
      const msg = label + ": " + (t.entity||t.from||t.to||"") + " — " + num(Math.abs(t.amount)) + "đ";
      notify(msg);
      pushNotif(msg, "txn");
    });
    if (Notification.permission === "granted") {
      const t = newOnes[0];
      const label = t.kind === "PhieuThu" ? "Phiếu thu" : "Phiếu chi";
      new Notification(label + " mới — BLTK", {
        body: (t.entity||t.from||t.to||"") + " " + num(Math.abs(t.amount)) + "đ",
        icon: "/logo.png", tag: "txn-" + (t._id || t.id)
      });
    }
  }, [txnsFS]);

  const toFsId = sku => String(sku||"").replace(/\//g, "__");
  const handleSaveProduct = async () => {
    const f = productForm;
    if (!f.name || !f.sku) { alert("Vui lòng điền tên và mã sản phẩm"); return; }
    setSavingProd(true);
    try {
      const id = f._id || toFsId(f.sku);
      const { _id, ...data } = f;
      await saveDoc("products", id, { ...data, sale: Number(f.sale)||0, list: Number(f.list)||0 });
      setProductForm(null);
    } catch(e) { alert("Lỗi lưu: " + e.message); }
    setSavingProd(false);
  };

  const yr2 = () => String(new Date().getFullYear()).slice(-2);
  const fmtMobId = (prefix, n) => prefix + yr2() + String(n).padStart(4,"0");
  const nextMobileId = (prefix) => {
    const rows = ((settingsFS||[]).find(d=>d._id==="docNums")?.rows)||[];
    const row = rows.find(r => r.prefix === prefix);
    let num = row ? row.num : 1;
    while ((orders||[]).some(o => o.id === fmtMobId(prefix, num))) num++;
    const newRows = rows.some(r => r.prefix === prefix)
      ? rows.map(r => r.prefix === prefix ? {...r, num: num+1} : r)
      : [...rows, {prefix, num: num+1}];
    saveDoc("settings", "docNums", { rows: newRows });
    return fmtMobId(prefix, num);
  };
  const saveMobileOrder = (asDraft) => {
    if (!createForm.items.length) { alert("Vui lòng thêm ít nhất 1 sản phẩm"); return; }
    if (editingOrderId) {
      const orig = (orders||[]).find(o=>o.id===editingOrderId) || {};
      const updated = {...orig, name:createForm.name.trim(), phone:createForm.phone.trim(), addr:createForm.addr.trim(), items:createForm.items, note:createForm.note.trim()};
      saveDoc("orders", editingOrderId, updated);
      setEditingOrderId(null); setEditingOrderRef(null);
      setCreateForm({name:"",phone:"",addr:"",note:"",items:[]});
      setSelectedOrder(updated);
      setTab(orig.draft ? "quotes" : "orders");
      return;
    }
    const id = asDraft ? nextMobileId("BG") : nextMobileId("DH");
    const order = {
      id, draft: asDraft,
      ...(asDraft ? {draftStatus:"Chưa tạo đơn hàng"} : {}),
      name: createForm.name.trim(), phone: createForm.phone.trim(),
      addr: createForm.addr.trim(), items: createForm.items,
      note: createForm.note.trim(),
      paid:0, expense:0, importExpense:0,
      delivery:"Chưa giao hàng", orderStatus:"",
      imported:false, exported:false, returned:false,
      staff: profile?.name || "",
      dt: new Date().toLocaleString("vi-VN",{hour12:false}).replace(",",""),
    };
    saveDoc("orders", id, order);
    setCreateForm({name:"",phone:"",addr:"",note:"",items:[]});
    setTab(asDraft ? "quotes" : "orders");
  };
  const saveMobileOrderWithPayment = () => {
    if (!createForm.name.trim()) { alert("Vui lòng nhập tên khách hàng"); return; }
    if (!createForm.phone.trim()) { alert("Vui lòng nhập số điện thoại"); return; }
    if (!createForm.addr.trim()) { alert("Vui lòng nhập địa chỉ giao hàng"); return; }
    if (!createForm.items.length) { alert("Vui lòng thêm ít nhất 1 sản phẩm"); return; }
    const now = new Date().toLocaleString("vi-VN",{hour12:false}).replace(",","");
    const validExp = payExpenses.filter(e=>e.amount>0);
    const expense = validExp.reduce((s,e)=>s+(e.amount||0), 0);
    const payments = [];
    if (payDeposit>0) payments.push({kind:"Đặt cọc", amount:payDeposit, dt:now});
    if (payPayment>0) payments.push({kind:"Thanh toán", amount:payPayment, dt:now});
    if (editingOrderId) {
      const orig = (orders||[]).find(o=>o.id===editingOrderId) || {};
      const existingPmts = orig.payments || [];
      saveDoc("orders", editingOrderId, {...orig, name:createForm.name.trim(), phone:createForm.phone.trim(), addr:createForm.addr.trim(), items:createForm.items, note:createForm.note.trim(), expense, custExpenses:validExp, payments:[...existingPmts,...payments]});
      setEditingOrderId(null); setCreateForm({name:"",phone:"",addr:"",note:"",items:[]});
      setPayExpenses([]); setPayDeposit(0); setPayPayment(0); setShowPayModal(false); setTab("orders"); return;
    }
    const id = nextMobileId("DH");
    saveDoc("orders", id, {
      id, draft:false,
      name:createForm.name.trim(), phone:createForm.phone.trim(),
      addr:createForm.addr.trim(), items:createForm.items, note:createForm.note.trim(),
      paid:payPayment, expense, custExpenses:validExp, importExpense:0, payments,
      delivery:"Chưa giao hàng", orderStatus:"",
      imported:false, exported:false, returned:false,
      staff: profile?.name || "",
      dt:now,
    });
    setCreateForm({name:"",phone:"",addr:"",note:"",items:[]});
    setPayExpenses([]); setPayDeposit(0); setPayPayment(0);
    setShowPayModal(false);
    setTab("orders");
  };

  const cloneDraft = (o) => {
    const newId = nextMobileId("BG");
    const { _id, draftStatus, linkedOrderId, ...rest } = o;
    saveDoc("orders", newId, { ...rest, id: newId, draft: true, draftStatus:"Chưa tạo đơn hàng",
      dt: new Date().toLocaleString("vi-VN",{hour12:false}).replace(",","") });
    notify("Đã nhân bản → "+newId);
  };

  const convertDraftToOrder = async (draft) => {
    if (converting) return;
    setConverting(true);
    try {
      const dhId = nextMobileId("DH");
      const draftDocId = draft.id || draft._id;
      if (!draftDocId) throw new Error("Không tìm thấy ID báo giá");
      const { _id: _rid, draftStatus: _ds, linkedOrderId: _li, ...rest } = draft;
      await saveDoc("orders", dhId, { ...rest, id: dhId, draft: false });
      const { _id: _rid2, ...draftClean } = draft;
      await saveDoc("orders", draftDocId, { ...draftClean, draftStatus:"Đã tạo đơn hàng", linkedOrderId: dhId });
      notify("Đã tạo đơn " + dhId);
      setSelectedOrder(null);
      setTab("orders");
    } catch(e) {
      alert("Lỗi tạo đơn: " + e.message);
    } finally {
      setConverting(false);
    }
  };

  const doEdit = (o) => {
    setEditingOrderId(o.id);
    setEditingOrderRef(o);
    setCreateForm({name:o.name||"",phone:o.phone||"",addr:o.addr||"",note:o.note||"",items:o.items||[]});
    setSelectedOrder(null);
    setTab("create");
  };

  const doWarehouseIn = (o) => {
    const pn = "PN" + String(o.id).replace(/\D/g,"");
    setWhInPn(o.pn || pn);
    setWhInDate(o.dateIn || localToday());
    setWhInKho((o.items||[])[0]?.kho || "HH");
    setWhInRows((o.items||[]).map(it => ({name:it.name, slDat:it.qty, slNhap:it.qty, giaNhap:it.cost||0, nccIn:it.supplier||""})));
    setShowWhIn(true);
  };

  const doSaveWhIn = (o) => {
    const miss = whInRows.filter(r => r.slNhap > 0 && !r.nccIn.trim());
    if (miss.length) { alert("Vui lòng nhập tên NCC cho: " + miss.map(r=>r.name).join(", ")); return; }
    const missGia = whInRows.filter(r => r.slNhap > 0 && !(r.giaNhap > 0));
    if (missGia.length) { alert("Vui lòng nhập giá nhập cho: " + missGia.map(r=>r.name).join(", ")); return; }
    const now = new Date().toLocaleString("vi-VN",{hour12:false}).replace(",","");
    const updatedItems = (o.items||[]).map((it,i) => ({...it, cost:whInRows[i]?.giaNhap||it.cost||0, supplier:whInRows[i]?.nccIn||it.supplier||""}));
    const updatedOrder = {...o, imported:true, pn:whInPn, dateIn:whInDate, importedAt:now, items:updatedItems};
    saveDoc("orders", o.id, updatedOrder);
    const pn = whInPn || ("PN" + new Date().toISOString().slice(0,10).replace(/-/g,"") + "_" + String(Date.now()).slice(-4));
    const dateStr = whInDate ? new Date(whInDate).toLocaleDateString("vi-VN") : new Date().toLocaleDateString("vi-VN");
    const storeMap = {HH:"Kho HH", TB:"Kho TB", HG:"Kho HG"};
    const storeName = storeMap[whInKho] || "Kho HH";
    (o.items||[]).forEach((it, i) => {
      const row = whInRows[i];
      if (!row || !(row.slNhap > 0)) return;
      const lot = pn + ((o.items||[]).length > 1 ? "_" + i : "");
      saveDoc("wh_in", lot + "~~" + it.name, {
        lot, date: dateStr, prod: it.name, store: storeName, kho: whInKho,
        qtyIn: row.slNhap, qtyNow: row.slNhap, qtyRemaining: row.slNhap,
        costNcc: row.giaNhap, unitCost: row.giaNhap, fee: 0,
        supplier: row.nccIn, order: o.id, staff: "", pay: "Chưa thanh toán"
      });
    });
    setSelectedOrder(updatedOrder);
    setShowWhIn(false);
    setJustImported(true);
    setTimeout(() => setJustImported(false), 5000);
  };

  const doConfirmDelivery = (o) => {
    if (!window.confirm(`Xác nhận đã giao hàng đơn ${o.id}?`)) return;
    const now = new Date().toLocaleString("vi-VN",{hour12:false}).replace(",","");
    const d = new Date();
    const dt = d.toLocaleDateString("vi-VN") + " " + d.toLocaleTimeString("vi-VN",{hour12:false,hour:"2-digit",minute:"2-digit"});
    const updated = {...o, deliveryConfirmed:true, deliveredAt:now, orderStatus:"Hoàn thành", exported:true};
    saveDoc("orders", o.id, updated);
    const storeMap = {HH:"Kho HH", TB:"Kho TB", HG:"Kho HG"};
    (o.items||[]).forEach((it, i) => {
      if (!(it.qty > 0)) return;
      const slip = "PX-" + o.id + ((o.items||[]).length > 1 ? "_" + i : "");
      saveDoc("wh_out", slip, {
        slip, dt, order: o.id,
        sku: it.sku || "", prod: it.name, supplier: it.supplier || "",
        store: storeMap[it.kho] || "Kho HH", lot: "",
        qty: it.qty, sale: it.price, unitCost: it.cost || 0,
        cust: o.name, phone: o.phone || "", addr: o.addr || "",
        orderStatus: "Hoàn thành", delivery: "Đã giao hàng", staff: ""
      });
    });
    setSelectedOrder(updated);
  };

  const doPartialDelivery = (o) => {
    const initQtys = {};
    (o.items||[]).forEach((it,i) => {
      const remaining = (it.qty||0) - (it.deliveredQty||0);
      initQtys[i] = remaining > 0 ? remaining : 0;
    });
    setPartialDlvQtys(initQtys);
    setShowPartialDlv(true);
  };

  const doConfirmPartial = (o) => {
    const hasAny = Object.values(partialDlvQtys).some(q => q > 0);
    if (!hasAny) { alert("Vui lòng nhập số lượng cần giao"); return; }
    for (let i = 0; i < (o.items||[]).length; i++) {
      const it = o.items[i];
      const remaining = (it.qty||0) - (it.deliveredQty||0);
      if ((partialDlvQtys[i]||0) > remaining) {
        alert(`${it.name}: số lượng giao (${partialDlvQtys[i]}) vượt quá còn lại (${remaining})`);
        return;
      }
    }
    const d = new Date();
    const dt = d.toLocaleDateString("vi-VN") + " " + d.toLocaleTimeString("vi-VN",{hour12:false,hour:"2-digit",minute:"2-digit"});
    const now = d.toLocaleString("vi-VN",{hour12:false}).replace(",","");
    const storeMap = {HH:"Kho HH", TB:"Kho TB", HG:"Kho HG"};
    const seq = ((o.deliveries||[]).length || 0) + 1;
    const pxSlip = "PX-" + o.id + "-P" + seq;
    const batchItems = [];
    const updatedItems = (o.items||[]).map((it, i) => {
      const qty = partialDlvQtys[i] || 0;
      if (qty > 0) {
        batchItems.push({name: it.name, qty, price: it.price||0, cost: it.cost||0, kho: it.kho||"HH", sku: it.sku||"", supplier: it.supplier||""});
        saveDoc("wh_out", pxSlip + (qty>1 || (o.items||[]).length>1 ? "_"+i : ""), {
          slip: pxSlip, dt, order: o.id,
          sku: it.sku||"", prod: it.name, supplier: it.supplier||"",
          store: storeMap[it.kho||"HH"]||"Kho HH", lot: "",
          qty, sale: it.price||0, unitCost: it.cost||0,
          cust: o.name, phone: o.phone||"", addr: o.addr||"",
          orderStatus: "Chờ xử lý", delivery: "Đang giao", staff: ""
        });
      }
      return {...it, deliveredQty: (it.deliveredQty||0) + qty};
    });
    const newDeliveries = [...(o.deliveries||[]), {seq, date: dt, pxSlip, items: batchItems}];
    const allDone = updatedItems.every(it => (it.deliveredQty||0) >= (it.qty||0));
    const updated = {
      ...o,
      items: updatedItems,
      deliveries: newDeliveries,
      ...(allDone ? {exported: true, deliveryConfirmed: true, deliveredAt: now, orderStatus: "Hoàn thành"} : {})
    };
    saveDoc("orders", o.id, updated);
    setSelectedOrder(updated);
    setShowPartialDlv(false);
    notify(allDone ? "Giao hàng hoàn tất!" : `Đã giao lần ${seq}`);
  };

  const doReturn = (o) => {
    if (!window.confirm(`Xác nhận hoàn hàng đơn ${o.id}?`)) return;
    const updated = {...o, returned:true, orderStatus:"Đã hoàn hàng"};
    saveDoc("orders", o.id, updated);
    setSelectedOrder(updated);
  };

  const doAddPayment = () => {
    setDetailPayAmt(0);
    setDetailPayKind("Thanh toán");
    setShowDetailPay(true);
  };

  const doSaveDetailPay = (o) => {
    if (!detailPayAmt || detailPayAmt <= 0) { alert("Nhập số tiền thanh toán"); return; }
    const now = new Date().toLocaleString("vi-VN",{hour12:false}).replace(",","");
    const pmts = [...(o.payments||[]), {kind:detailPayKind, amount:detailPayAmt, dt:now}];
    const updated = {...o, payments:pmts};
    saveDoc("orders", o.id, updated);
    setSelectedOrder(updated);
    setShowDetailPay(false); setDetailPayAmt(0);
  };

  const doPrint = () => setShowPrintMenu(true);

  const doOpenPrint = (o, type) => {
    const printCfg = (settingsFS||[]).find(s=>s._id==="print_template") || {};
    openPrint(o, type, printCfg, prodsFS||[]);
    setShowPrintMenu(false);
  };

  const sortByDate = arr => [...(arr||[])].sort((a,b) => {
    const parse = s => {
      const p = String(s||"").split(" ");
      const datePart = p.find(t => t.includes("/"));
      if (!datePart) return new Date(0);
      const d = datePart.split("/");
      if (d.length !== 3) return new Date(0);
      const timePart = p.find(t => t.includes(":")) || "0:0";
      const [hh, mm] = timePart.split(":");
      return new Date(d[2], d[1]-1, d[0], parseInt(hh)||0, parseInt(mm)||0);
    };
    return parse(b.dt) - parse(a.dt);
  });
  const matchSearch = (o, q) => !q || [o.id, o.name, o.phone].some(f => String(f||"").toLowerCase().includes(q.toLowerCase()));
  const visibleOrders = sortByDate(orders).filter(o => !o.draft && matchSearch(o, orderSearch));
  const visibleQuotes = sortByDate(orders).filter(o => o.draft && matchSearch(o, quoteSearch));

  const tabs = [
    { key:"create",   icon: React.createElement(Plus,      {className:"h-6 w-6"}), label:"Tạo đơn", fab: true },
    { key:"orders",   icon: React.createElement(BookText,  {className:"h-5 w-5"}), label:"Đơn hàng" },
    { key:"quotes",   icon: React.createElement(FileText,  {className:"h-5 w-5"}), label:"Báo giá" },
    { key:"products", icon: React.createElement(Package,   {className:"h-5 w-5"}), label:"Sản phẩm" },
  ];

  const statusColor = s => ({
    "Hoàn thành":"bg-green-100 text-green-700","Đang xử lý":"bg-blue-100 text-blue-700",
    "Chờ xử lý":"bg-amber-100 text-amber-700","Huỷ":"bg-red-100 text-red-400",
  }[s] || "bg-slate-100 text-slate-500");

  const deliveryColor = s => s==="Đã giao hàng"?"bg-green-100 text-green-700":"bg-orange-100 text-orange-700";

  /* ── Màn hình Tổng quan ── */
  const ScreenHome = () => {
    const parseD = s => { if(!s)return new Date(0); const p=String(s).split(' ')[0].split('/'); return p.length===3?new Date(+p[2],+p[1]-1,+p[0]):new Date(s); };
    const parseISO = s => { const [y,m,d]=s.split('-'); return new Date(+y,+m-1,+d); };
    const fromD = homeFrom ? parseISO(homeFrom) : null;
    const toD   = homeTo   ? new Date(parseISO(homeTo).getTime()+86399999) : null;
    const inM = s => { const d=parseD(s); return (!fromD||d>=fromD)&&(!toD||d<=toD); };
    const endOfMonth = toD || new Date();
    const fmt = n => n>0 ? num(n)+"đ" : "—";
    const TRANSFER_KINDS = new Set(["Chuyển đi","Chuyển về"]);
    const NCC_KINDS = new Set(["CP Thanh Toán NCC","CP Đặt Cọc NCC","CPVC Nhập Hàng"]);

    // ── TÀI CHÍNH
    const allTxns = txnsFS||[];
    const bankSettings = (settingsFS||[]).find(s=>s._id==="bankAccounts");
    const accKey = mobAcc === "PAT" ? "TCB-PAT" : "TCB-CTY";
    const accs = (bankSettings?.accounts||[]).filter(a=>a.status==="Hoạt động"&&a.key===accKey);
    const accBals = accs.map(a=>{
      const net=allTxns.filter(t=>!t.cancelled&&t.acc===a.key&&parseD(t.date)<=endOfMonth).reduce((s,t)=>s+t.amount,0);
      return {...a,bal:(a.openBal||0)+net};
    });
    const totalBal = accBals.reduce((s,a)=>s+a.bal,0);
    const pTxns = allTxns.filter(t=>!t.cancelled&&inM(t.date)&&!TRANSFER_KINDS.has(t.kind)&&t.acc===accKey);
    const thuAll = pTxns.filter(t=>t.amount>0);
    const chiAll = pTxns.filter(t=>t.amount<0);
    const totalThu = thuAll.reduce((s,t)=>s+t.amount,0);
    const totalChi = chiAll.reduce((s,t)=>s+Math.abs(t.amount),0);
    const thuOrder = thuAll.filter(t=>t.kind==="Thanh toán").reduce((s,t)=>s+t.amount,0);
    const thuCoc = thuAll.filter(t=>t.kind==="Đặt cọc").reduce((s,t)=>s+t.amount,0);
    const thuKhac = totalThu-thuOrder-thuCoc;
    const chiNCC = chiAll.filter(t=>NCC_KINDS.has(t.kind)).reduce((s,t)=>s+Math.abs(t.amount),0);
    const chiCP = chiAll.filter(t=>!NCC_KINDS.has(t.kind)).reduce((s,t)=>s+Math.abs(t.amount),0);

    // ── GIAO DỊCH HÀNG HOÁ
    const activeOrders = (orders||[]).filter(o=>!o.draft&&o.orderStatus!=="Huỷ"&&o.orderStatus!=="Hủy");
    const fOrders = activeOrders.filter(o=>inM(o.dt));
    const delivOrders = fOrders.filter(o=>o.deliveryConfirmed||o.exported);
    const depositOrders = fOrders.filter(o=>!o.deliveryConfirmed&&!o.exported&&(o.paid||0)>0);
    const plMap = {};
    (purchaseList||[]).forEach(r=>{plMap[r.lot+"__"+r.prod]=r;});
    const whIn = whInFS||[];
    const fWhIn = whIn.filter(r=>r.supplier&&inM(r.date));
    const nccTotal = fWhIn.reduce((s,r)=>s+(r.qtyIn||0)*(r.costNcc||0)+(r.fee||0),0);
    const nccPaid = fWhIn.reduce((s,r)=>{const pl=plMap[r.lot+"__"+r.prod];const tot=(r.qtyIn||0)*(r.costNcc||0)+(r.fee||0);return s+(pl?(pl.paid||0):(r.pay==="Đã thanh toán"?tot:0));},0);
    const nccLots = new Set(fWhIn.map(r=>r.lot)).size;
    const stockVal = whIn.reduce((s,r)=>s+(r.qtyRemaining??r.qtyNow??0)*(r.unitCost??r.costNcc??0),0);
    const delivVal = delivOrders.reduce((s,o)=>s+calc(o).total,0);
    const delivPaid = delivOrders.reduce((s,o)=>s+(o.paid||0),0);
    const delivRem = delivOrders.reduce((s,o)=>s+Math.max(0,calc(o).remaining),0);
    const depVal = depositOrders.reduce((s,o)=>s+calc(o).total,0);
    const depPaid = depositOrders.reduce((s,o)=>s+(o.paid||0),0);
    const depRem = depositOrders.reduce((s,o)=>s+Math.max(0,calc(o).remaining),0);

    // ── CÔNG NỢ (all-time)
    const custDebt = {};
    activeOrders.forEach(o=>{const rem=Math.max(0,calc(o).remaining);if(rem>0&&o.name)custDebt[o.name]=(custDebt[o.name]||0)+rem;});
    const custDebtList = Object.entries(custDebt).map(([n,d])=>({name:n,debt:d})).sort((a,b)=>b.debt-a.debt).slice(0,5);
    const totalCustDebt = Object.values(custDebt).reduce((s,v)=>s+v,0);
    const nccDebt = {};
    whIn.filter(r=>r.supplier).forEach(r=>{
      const pl=plMap[r.lot+"__"+r.prod];
      const tot=(r.qtyIn||0)*(r.costNcc||0)+(r.fee||0);
      const rets=(pl?.returns||[]).reduce((s,x)=>s+(x.amount||0),0);
      const paid=pl?(pl.paid||0):(r.pay==="Đã thanh toán"?tot:0);
      const rem=Math.max(0,tot-rets-paid);
      if(rem>0&&r.supplier)nccDebt[r.supplier]=(nccDebt[r.supplier]||0)+rem;
    });
    const nccDebtList = Object.entries(nccDebt).map(([n,d])=>({name:n,debt:d})).sort((a,b)=>b.debt-a.debt).slice(0,5);
    const totalNccDebt = Object.values(nccDebt).reduce((s,v)=>s+v,0);

    // ── HOÀN HÀNG
    const returnedOrders = activeOrders.filter(o=>(o.returns||[]).some(r=>!r.cancelled));
    const allRetItems = returnedOrders.flatMap(o=>(o.returns||[]).filter(r=>!r.cancelled));
    const totalReturnVal = allRetItems.reduce((s,r)=>s+(r.amount||0),0);
    const alreadyRefunded = returnedOrders.reduce((s,o)=>s+(o.compCosts||[]).filter(c=>c.type==="Hoàn tiền hàng").reduce((cs,c)=>cs+(c.amount||0),0),0);
    const pendingRefund = Math.max(0,totalReturnVal-alreadyRefunded);
    const nccRetItems = fWhIn.filter(r=>(plMap[r.lot+"__"+r.prod]?.returns||[]).length>0);
    const nccRetLots = new Set(nccRetItems.map(r=>r.lot)).size;
    const nccRetVal = nccRetItems.reduce((s,r)=>{const pl=plMap[r.lot+"__"+r.prod];return s+(pl?.returns||[]).reduce((rs,x)=>rs+(x.amount||0),0);},0);

    // ── LỢI NHUẬN (Accrual)
    const expOrders = fOrders.filter(o=>o.deliveryConfirmed||o.exported);
    const pendOrders = fOrders.filter(o=>!o.deliveryConfirmed&&!o.exported);
    const accRev = expOrders.reduce((s,o)=>s+calc(o).total,0);
    const accCOGS = expOrders.reduce((s,o)=>s+calc(o).totalCost,0);
    const accShip = expOrders.reduce((s,o)=>s+(o.importExpense||0),0);
    const accExp = expOrders.reduce((s,o)=>s+(o.expense||0),0);
    const accCmpS = expOrders.reduce((s,o)=>s+(o.compCosts||[]).filter(c=>c.type==="Chi phí Ship hàng").reduce((cs,c)=>cs+(c.amount||0),0),0);
    const accCmpC = expOrders.reduce((s,o)=>s+(o.compCosts||[]).filter(c=>c.type==="Chi phí hoa hồng").reduce((cs,c)=>cs+(c.amount||0),0),0);
    const accCmpI = expOrders.reduce((s,o)=>s+(o.compCosts||[]).filter(c=>c.type==="Chi phí lắp đặt").reduce((cs,c)=>cs+(c.amount||0),0),0);
    const accCPBH = accShip+accExp+accCmpS+accCmpC+accCmpI;
    const accGross = accRev-accCOGS;
    const accProfit = accRev-accCOGS-accCPBH;
    const accMargin = accRev>0?Math.round(accProfit*1000/accRev)/10:0;
    const penRev = pendOrders.reduce((s,o)=>s+calc(o).total,0);
    const penCOGS = pendOrders.reduce((s,o)=>s+calc(o).totalCost,0);
    const penGross = penRev-penCOGS;
    const penMargin = penRev>0?Math.round(penGross*1000/penRev)/10:0;

    // ── Helpers UI
    const R = (label,val,cls) => React.createElement("div",{className:"flex justify-between items-center py-1.5 border-b border-slate-100 last:border-0"},
      React.createElement("span",{className:"text-sm text-slate-500"},label),
      React.createElement("span",{className:"text-sm font-medium "+(cls||"text-slate-700")},val));
    const SHd = (ico,title,sub) => React.createElement("div",{className:"flex items-center gap-2"},
      React.createElement("div",{className:"w-6 h-6 rounded-md bg-[#ffedd5] flex items-center justify-center shrink-0"},ico),
      React.createElement("span",{className:"font-bold text-sm text-[#7c2d12]"},title),
      sub&&React.createElement("span",{className:"text-xs text-slate-400"},"· "+sub));
    const Card = children => React.createElement("div",{className:"bg-white rounded-2xl border border-[#fed7aa] p-4 shadow-sm"},children);
    const SubLabel = (ico,label,cls) => React.createElement("div",{className:"text-[11px] font-semibold uppercase tracking-wide mb-1.5 flex items-center gap-1 "+(cls||"text-[#92400e]")},ico,label);
    const BigNum = (val,cls) => React.createElement("div",{className:"text-xl font-bold tabular-nums mb-2 "+(cls||"text-slate-800")},val);

    return React.createElement("div",{className:"flex-1 overflow-y-auto"},
      React.createElement("div",{className:"px-3 pt-3 pb-6 space-y-4"},

        // ── Date range + Toggle tài khoản + Quay lại (1 hàng)
        React.createElement("div",{className:"flex items-center gap-2"},
          React.createElement("div",{className:"flex-1 flex items-center gap-1.5 bg-white rounded-2xl border border-slate-200 px-3 py-2"},
            React.createElement("input",{type:"date",value:homeFrom,onChange:e=>setHomeFrom(e.target.value),style:{fontSize:'13px'},
              className:"flex-1 min-w-0 border-none outline-none text-slate-700 font-medium bg-transparent"}),
            React.createElement("span",{className:"text-slate-300 shrink-0"},"→"),
            React.createElement("input",{type:"date",value:homeTo,onChange:e=>setHomeTo(e.target.value),style:{fontSize:'13px'},
              className:"flex-1 min-w-0 border-none outline-none text-slate-700 font-medium bg-transparent"})),
          React.createElement("button",{onClick:()=>setTab("orders"),className:"shrink-0 flex items-center gap-1 text-xs text-slate-500 bg-white border border-slate-200 rounded-2xl px-3 py-2 active:bg-slate-50"},
            React.createElement(ArrowLeft,{className:"h-3.5 w-3.5"}),
            "Quay lại")),

        // ── 1. TÀI CHÍNH
        React.createElement("div",null,
          React.createElement("div",{className:"flex items-center justify-between mb-2"},
            SHd(React.createElement(Wallet,{className:"h-3.5 w-3.5 text-[#92400e]"}),"Tài chính","Cash"),
            React.createElement("button",{onClick:()=>setMobAcc(a=>a==="PAT"?"CTY":"PAT"),
              className:"h-7 px-2.5 flex items-center rounded-lg border border-[#fed7aa] bg-[#ffedd5] text-[#92400e] text-xs font-bold"},
              mobAcc)),
          Card(React.createElement("div",null,
            // Tiền vào
            SubLabel(React.createElement(ArrowDownToLine,{className:"h-3 w-3"}),"Tiền vào"),
            BigNum(totalThu>0?"+"+num(totalThu)+"đ":"—","text-emerald-600"),
            R("Thu từ đơn hàng",thuOrder>0?"+"+num(thuOrder)+"đ":"—","text-green-600"),
            R("Nhận cọc KH",thuCoc>0?"+"+num(thuCoc)+"đ":"—","text-green-600"),
            thuKhac>0?R("Khác","+"+num(thuKhac)+"đ","text-green-600"):null,
            // Tiền ra
            React.createElement("div",{className:"pt-3 mt-1"},
              SubLabel(React.createElement(ArrowUpFromLine,{className:"h-3 w-3"}),"Tiền ra"),
              BigNum(totalChi>0?"−"+num(totalChi)+"đ":"—","text-red-600"),
              R("Trả công nợ NCC",chiNCC>0?"−"+num(chiNCC)+"đ":"—","text-red-500"),
              R("Chi phí bán hàng",chiCP>0?"−"+num(chiCP)+"đ":"—","text-red-500")),
            // Số dư
            React.createElement("div",{className:"pt-3 mt-1"},
              SubLabel(React.createElement(CreditCard,{className:"h-3 w-3"}),"Số dư tài khoản"),
              BigNum(fmt(totalBal),"text-[#92400e]"),
              React.createElement("div",{className:"text-[11px] italic text-slate-400 mb-2"},"Lũy kế đến cuối tháng"),
              React.createElement("div",{className:"space-y-1.5"},
                accBals.map(a=>React.createElement("div",{key:a.key,className:"flex justify-between items-center"},
                  React.createElement("span",{className:"text-xs bg-amber-100 text-amber-800 font-semibold px-2 py-0.5 rounded"},a.key||a.bank),
                  React.createElement("span",{className:"text-sm font-semibold tabular-nums "+(a.bal>=0?"text-slate-800":"text-red-600")},
                    (a.bal<0?"−":"")+num(Math.abs(a.bal))+"đ")))))))),

        // ── 2. GIAO DỊCH HÀNG HOÁ
        React.createElement("div",null,
          SHd(React.createElement(ArrowLeftRight,{className:"h-3.5 w-3.5 text-[#92400e]"}),"Giao dịch hàng hoá"),
          React.createElement("div",{className:"space-y-2"},
            // Đơn đã giao
            Card(React.createElement("div",null,
              SubLabel(React.createElement(Truck,{className:"h-3 w-3"}),"Đơn đã giao"),
              React.createElement("div",{className:"flex justify-between items-end mb-2"},
                React.createElement("span",{className:"text-2xl font-bold text-slate-800"},delivOrders.length,React.createElement("span",{className:"text-sm font-normal text-slate-500 ml-1"},"đơn")),
                React.createElement("span",{className:"text-sm font-bold text-[#92400e] tabular-nums"},fmt(delivVal))),
              R("Đã thu tiền",fmt(delivPaid),"text-green-600"),
              R("Còn phải thu",fmt(delivRem),"text-red-500"))),
            // Đơn nhận cọc
            Card(React.createElement("div",null,
              SubLabel(React.createElement(Package,{className:"h-3 w-3"}),"Đơn nhận cọc"),
              React.createElement("div",{className:"flex justify-between items-end mb-2"},
                React.createElement("span",{className:"text-2xl font-bold text-slate-800"},depositOrders.length,React.createElement("span",{className:"text-sm font-normal text-slate-500 ml-1"},"đơn")),
                React.createElement("span",{className:"text-sm font-bold text-[#92400e] tabular-nums"},fmt(depVal))),
              R("Đã nhận cọc",fmt(depPaid),"text-green-600"),
              R("Sẽ thu khi giao",fmt(depRem),"text-slate-700"))),
            // Mua hàng NCC
            Card(React.createElement("div",null,
              SubLabel(React.createElement(PackageSearch,{className:"h-3 w-3"}),"Mua hàng NCC"),
              React.createElement("div",{className:"flex justify-between items-end mb-2"},
                React.createElement("span",{className:"text-2xl font-bold text-slate-800"},nccLots,React.createElement("span",{className:"text-sm font-normal text-slate-500 ml-1"},"đơn nhập")),
                React.createElement("span",{className:"text-sm font-bold text-[#92400e] tabular-nums"},fmt(nccTotal))),
              R("Đã thanh toán",fmt(nccPaid),"text-green-600"),
              R("Còn phải trả",fmt(Math.max(0,nccTotal-nccPaid)),"text-red-500"))),
            // Tồn kho
            Card(React.createElement("div",null,
              SubLabel(React.createElement(Layers,{className:"h-3 w-3"}),"Tồn kho hiện tại"),
              BigNum(fmt(stockVal),"text-[#92400e]"),
              React.createElement("div",{className:"text-xs text-slate-400 -mt-1 mb-1"},"Giá trị hàng tồn"),
              R("Mặt hàng còn hàng",String(whIn.filter(r=>(r.qtyRemaining??r.qtyNow??0)>0).length),"text-slate-700"))))),

        // ── 3. CÔNG NỢ
        React.createElement("div",null,
          SHd(React.createElement(FileText,{className:"h-3.5 w-3.5 text-[#92400e]"}),"Công nợ","Toàn thời gian"),
          React.createElement("div",{className:"space-y-2"},
            Card(React.createElement("div",null,
              SubLabel(React.createElement(Users,{className:"h-3 w-3"}),"Khách hàng cần thu tiền","text-rose-600"),
              custDebtList.length===0
                ?React.createElement("div",{className:"text-sm text-slate-400 py-1"},"Không có công nợ")
                :React.createElement("div",{className:"space-y-1.5"},
                    custDebtList.map(c=>React.createElement("div",{key:c.name,className:"flex justify-between text-sm"},
                      React.createElement("span",{className:"font-medium text-slate-800 truncate max-w-[60%]"},c.name),
                      React.createElement("span",{className:"tabular-nums text-slate-600"},num(c.debt)+"đ")))),
              React.createElement("div",{className:"mt-2 pt-2 border-t border-slate-100 flex justify-between text-sm"},
                React.createElement("span",{className:"text-slate-600"},"Tổng cần thu"),
                totalCustDebt>0
                  ?React.createElement("span",{className:"font-bold tabular-nums text-red-600"},num(totalCustDebt)+"đ")
                  :React.createElement("span",{className:"text-slate-300"},"—")))),
            Card(React.createElement("div",null,
              SubLabel(React.createElement(Building2,{className:"h-3 w-3"}),"NCC cần thanh toán"),
              nccDebtList.length===0
                ?React.createElement("div",{className:"text-sm text-slate-400 py-1"},"Không có công nợ")
                :React.createElement("div",{className:"space-y-1.5"},
                    nccDebtList.map(c=>React.createElement("div",{key:c.name,className:"flex justify-between text-sm"},
                      React.createElement("span",{className:"font-medium text-slate-800 truncate max-w-[60%]"},c.name),
                      React.createElement("span",{className:"tabular-nums text-slate-600"},num(c.debt)+"đ")))),
              React.createElement("div",{className:"mt-2 pt-2 border-t border-slate-100 flex justify-between text-sm"},
                React.createElement("span",{className:"text-slate-600"},"Tổng phải trả"),
                totalNccDebt>0
                  ?React.createElement("span",{className:"font-bold tabular-nums text-[#92400e]"},num(totalNccDebt)+"đ")
                  :React.createElement("span",{className:"text-slate-300"},"—")))))),

        // ── 4. HOÀN HÀNG
        React.createElement("div",null,
          SHd(React.createElement(CornerUpLeft,{className:"h-3.5 w-3.5 text-[#92400e]"}),"Hoàn hàng"),
          React.createElement("div",{className:"space-y-2"},
            Card(React.createElement("div",null,
              SubLabel(React.createElement(RotateCcw,{className:"h-3 w-3"}),"Khách hàng trả hàng","text-rose-600"),
              React.createElement("div",{className:"flex justify-between items-end mb-2 pb-2 border-b border-slate-100"},
                returnedOrders.length > 0
                  ? React.createElement("button",{onClick:()=>setShowRetListMob(v=>!v), className:"flex items-center gap-1"},
                      React.createElement("span",{className:"text-2xl font-bold text-slate-800"},returnedOrders.length),
                      React.createElement("span",{className:"text-sm font-normal text-slate-500 ml-1"},"đơn hoàn"),
                      React.createElement(showRetListMob ? ChevronDown : ChevronRight,{className:"h-4 w-4 text-slate-400 ml-0.5"}))
                  : React.createElement("span",{className:"text-2xl font-bold text-slate-800"},"0",React.createElement("span",{className:"text-sm font-normal text-slate-500 ml-1"},"đơn hoàn")),
                totalReturnVal>0?React.createElement("span",{className:"text-lg font-bold tabular-nums text-rose-600"},num(totalReturnVal)+"đ"):React.createElement("span",{className:"text-slate-300 text-lg"},"—")),
              R("Đã hoàn tiền KH",alreadyRefunded>0?num(alreadyRefunded)+"đ":"—","text-rose-600"),
              R("Chờ xử lý",pendingRefund>0?num(pendingRefund)+"đ":"—","text-[#92400e]"),
              showRetListMob && returnedOrders.length > 0 && React.createElement("div",{className:"mt-3 border-t border-slate-100 pt-3 space-y-0.5"},
                returnedOrders.map(o=>{
                  const retVal=(o.returns||[]).filter(r=>!r.cancelled).reduce((s,r)=>s+(r.amount||0),0);
                  return React.createElement("button",{key:o.id, onClick:()=>{ setSelectedOrder(o); setTab("orders"); }, className:"w-full flex items-center justify-between text-sm active:bg-[#fff7ed] rounded-lg px-2 py-1.5 group"},
                    React.createElement("div",{className:"flex items-center gap-2"},
                      React.createElement("span",{className:"rounded-full bg-[#fcebd8] px-2 py-0.5 text-[11px] font-semibold text-[#92400e]"},o.id),
                      React.createElement("span",{className:"text-slate-600 truncate max-w-[120px]"},o.name||"—")),
                    React.createElement("div",{className:"flex items-center gap-1.5 shrink-0"},
                      retVal>0&&React.createElement("span",{className:"tabular-nums text-rose-600 font-medium text-xs"},num(retVal)+"đ"),
                      React.createElement(ChevronRight,{className:"h-3.5 w-3.5 text-slate-300"})));
                })))),
            nccRetLots>0&&Card(React.createElement("div",null,
              SubLabel(React.createElement(RefreshCw,{className:"h-3 w-3"}),"Trả hàng NCC"),
              React.createElement("div",{className:"flex items-baseline gap-2 mb-1"},
                React.createElement("span",{className:"text-2xl font-bold text-slate-800"},nccRetLots),
                React.createElement("span",{className:"text-sm text-slate-500"},"đơn trong tháng")),
              R("Ghi giảm công nợ NCC",fmt(nccRetVal),"text-[#92400e]"))))),

        // ── 5. LỢI NHUẬN
        React.createElement("div",null,
          SHd(React.createElement(TrendingUp,{className:"h-3.5 w-3.5 text-[#92400e]"}),"Lợi nhuận","Accrual"),
          React.createElement("div",{className:"text-xs italic text-slate-400 mb-2"},"Đơn trong tháng · DT/GV/LN theo accrual. Cột chưa giao chưa trừ CPBH."),
          Card(React.createElement("div",null,
            // Header
            React.createElement("div",{className:"grid grid-cols-3 -mx-4 -mt-4 mb-3 px-4 py-2.5 bg-[#ffedd5] rounded-t-2xl border-b border-[#fed7aa]"},
              React.createElement("div",null),
              React.createElement("div",{className:"text-center"},
                React.createElement("div",{className:"text-[11px] font-semibold uppercase tracking-wide text-[#92400e]"},"Đã giao"),
                React.createElement("div",{className:"text-[11px] text-slate-500"},expOrders.length+" đơn")),
              React.createElement("div",{className:"text-center"},
                React.createElement("div",{className:"text-[11px] font-semibold uppercase tracking-wide text-slate-500"},"Chưa giao"),
                React.createElement("div",{className:"text-[11px] text-slate-400"},pendOrders.length+" đơn"))),
            // Doanh thu
            React.createElement("div",{className:"grid grid-cols-3 py-2 border-b border-slate-100"},
              React.createElement("div",{className:"text-sm text-[#92400e] flex items-center gap-1"},React.createElement(ShoppingCart,{className:"h-3 w-3"}),"DT"),
              React.createElement("div",{className:"text-right text-sm font-bold tabular-nums "+(accRev>0?"text-[#92400e]":"text-slate-300")},fmt(accRev)),
              React.createElement("div",{className:"text-right text-sm font-semibold tabular-nums "+(penRev>0?"text-[#92400e]":"text-slate-300")},fmt(penRev))),
            // Giá vốn
            React.createElement("div",{className:"grid grid-cols-3 py-2 border-b border-slate-100"},
              React.createElement("div",{className:"text-sm text-[#92400e] flex items-center gap-1"},React.createElement(Package,{className:"h-3 w-3"}),"GV"),
              React.createElement("div",{className:"text-right text-sm font-bold tabular-nums "+(accCOGS>0?"text-red-600":"text-slate-300")},accCOGS>0?"−"+num(accCOGS)+"đ":"—"),
              React.createElement("div",{className:"text-right text-sm font-semibold tabular-nums "+(penCOGS>0?"text-red-600":"text-slate-300")},penCOGS>0?"−"+num(penCOGS)+"đ":"—")),
            // Biên gộp
            React.createElement("div",{className:"grid grid-cols-3 py-2 border-b border-slate-100 bg-orange-50 -mx-4 px-4"},
              React.createElement("div",{className:"text-[11px] italic text-[#92400e]"},"Biên gộp"),
              React.createElement("div",{className:"text-right text-[11px] tabular-nums font-semibold "+(accRev===0?"text-slate-300":accGross>0?"text-emerald-700":"text-red-600")},
                accRev>0?(accGross<0?"−":"")+num(Math.abs(accGross))+"đ":"—"),
              React.createElement("div",{className:"text-right text-[11px] tabular-nums font-semibold "+(penRev===0?"text-slate-300":penGross>0?"text-emerald-600":"text-red-600")},
                penRev>0?(penGross<0?"−":"")+num(Math.abs(penGross))+"đ":"—")),
            // CPBH
            React.createElement("div",{className:"grid grid-cols-3 py-2 border-b border-slate-100"},
              React.createElement("div",{className:"text-sm text-[#92400e] flex items-center gap-1"},React.createElement(ReceiptText,{className:"h-3 w-3"}),"CPBH"),
              React.createElement("div",{className:"text-right text-sm font-bold tabular-nums "+(accCPBH>0?"text-red-600":"text-slate-300")},accCPBH>0?"−"+num(accCPBH)+"đ":"—"),
              React.createElement("div",{className:"text-right text-[11px] italic text-slate-400"},"chưa ps")),
            // Lợi nhuận
            React.createElement("div",{className:"grid grid-cols-3 -mx-4 -mb-4 px-4 py-3 rounded-b-2xl "+(accRev===0?"bg-[#ffedd5]":accProfit>0?"bg-emerald-50":accProfit<0?"bg-rose-50":"bg-[#ffedd5]")},
              React.createElement("div",{className:"flex items-center gap-1 text-sm font-semibold "+(accProfit>0?"text-emerald-700":accProfit<0?"text-rose-700":"text-[#92400e]")},React.createElement(Sparkles,{className:"h-3.5 w-3.5"}),"LN"),
              React.createElement("div",null,
                React.createElement("div",{className:"text-right text-base font-bold tabular-nums "+(accRev===0?"text-slate-300":accProfit>0?"text-emerald-600":accProfit<0?"text-red-600":"text-slate-300")},
                  accRev>0&&accProfit!==0?(accProfit<0?"−":"")+num(Math.abs(accProfit))+"đ":"—"),
                accRev>0&&React.createElement("div",{className:"text-right text-[11px] text-[#92400e]"},"Biên "+accMargin+"%")),
              React.createElement("div",null,
                React.createElement("div",{className:"text-right text-sm font-semibold tabular-nums "+(penRev===0?"text-slate-300":penGross>0?"text-emerald-600":penGross<0?"text-red-600":"text-slate-300")},
                  penRev>0&&penGross!==0?(penGross<0?"−":"")+num(Math.abs(penGross))+"đ":"—"),
                penRev>0&&React.createElement("div",{className:"text-right text-[11px] text-slate-400"},"Biên "+penMargin+"%"))))))

      )
    );
  };

  /* ── Màn hình Đơn hàng ── */
  const ScreenOrders = () => React.createElement("div", {className:"flex-1 relative overflow-hidden"},
    React.createElement("div", {className:"absolute inset-0 overflow-y-auto pb-4"},
      React.createElement("div", {className:"px-3 pt-3"},
        React.createElement("div", {className:"relative mb-3"},
          React.createElement(Search, {className:"absolute left-2.5 top-2.5 h-4 w-4 text-slate-400"}),
          React.createElement("input", {value:orderSearch, onChange:e=>setOrderSearch(e.target.value),
            placeholder:"Tìm mã đơn, tên KH, SĐT...",
            style:{fontSize:'16px'},
            className:"w-full rounded-xl border border-slate-200 bg-white pl-8 pr-3 py-2 text-sm focus:border-[#fed7aa] focus:outline-none"})),
        visibleOrders.length === 0
          ? React.createElement("div", {className:"text-center text-slate-400 pt-10 text-sm"},
              orderSearch ? "Không tìm thấy đơn hàng nào" : "Chưa có đơn hàng")
          : React.createElement("div", {className:"space-y-2"},
              visibleOrders.map(o => {
                const c = calc(o);
                const pmts = o.payments || [];
                const datCoc = pmts.filter(p=>p.kind==="Đặt cọc").reduce((s,p)=>s+(p.amount||0),0);
                const thanhToan = pmts.filter(p=>p.kind!=="Đặt cọc").reduce((s,p)=>s+(p.amount||0),0);
                const toggleStatus = e => {
                  e.stopPropagation();
                  if (o.orderStatus !== "Hoàn thành" && c.remaining > 0) {
                    if (!window.confirm("Đơn còn nợ "+num(c.remaining)+"đ. Vẫn đánh dấu hoàn thành?")) return;
                  }
                  const next = o.orderStatus === "Hoàn thành" ? "Chờ xử lý" : "Hoàn thành";
                  saveDoc("orders", o.id, {...o, orderStatus: next});
                };
                const mobStatus = (o.orderStatus === "Hoàn thành" && c.remaining <= 0) ? "Hoàn thành" : c.remaining <= 0 ? "Hoàn thành" : o.orderStatus === "Hoàn thành" ? "Hoàn thành*" : "Chờ xử lý";
                const mobStatusColor = (mobStatus === "Hoàn thành") ? "bg-green-100 text-green-700" : mobStatus === "Hoàn thành*" ? "bg-orange-100 text-orange-700" : "bg-amber-100 text-amber-700";
                return React.createElement("div", {
                  key: o.id,
                  className: "bg-white rounded-xl border border-slate-200 p-3 shadow-sm active:bg-slate-50",
                  onClick: () => setSelectedOrder(o),
                },
                  React.createElement("div", {className:"flex items-start justify-between gap-2 mb-1.5"},
                    React.createElement("div", {className:"flex items-center gap-1.5 flex-wrap"},
                      React.createElement("span", {className:"font-bold text-[#92400e] text-sm"}, o.id),
                      React.createElement("button", {onClick:toggleStatus, className:`text-[11px] font-medium px-2 py-0.5 rounded-full ${mobStatusColor}`}, mobStatus)),
                    React.createElement("div", {className:"flex items-start gap-1.5 shrink-0"},
                      React.createElement("div", {className:"text-right"},
                        React.createElement("div", {className:"text-sm font-bold text-slate-700"}, num(c.total)+"đ"),
                        React.createElement("div", {className:`text-[11px] ${c.remaining>0?"text-red-500":"text-green-600"}`},
                          c.remaining>0 ? "Còn: "+num(c.remaining)+"đ" : "Đã thu đủ")),
                      profile?.role === "admin" && React.createElement("button", {
                        onClick: e => { e.stopPropagation(); if (window.confirm("Xóa đơn "+o.id+"?")) deleteOrderCascade(o.id).catch(console.error); },
                        className:"p-1.5 rounded-full bg-slate-100 text-slate-500 active:bg-red-50 active:text-red-600"},
                        React.createElement(Trash2, {className:"h-4 w-4"})))),
                  React.createElement("div", {className:"text-sm font-medium text-slate-800 flex items-baseline gap-1.5 flex-wrap"},
                    React.createElement("span", null, o.name),
                    o.phone && React.createElement("span", {className:"text-xs text-slate-400 font-normal"}, o.phone)),
                  o.addr && React.createElement("div", {className:"text-xs text-slate-500 mt-0.5"}, o.addr),
                  React.createElement("div", {className:"text-xs text-slate-400 mt-0.5"},
                    o.dt||"", o.staff ? " · "+o.staff : ""));
              }))
      )
    )
  );

  /* ── Màn hình Sản phẩm ── */
  const ScreenProducts = () => {
    const q = prodQ; const setQ = (v) => { setProdQ(typeof v==="function"?v(prodQ):v); };
    const limit = prodLimit; const setLimit = (v) => { setProdLimit(typeof v==="function"?v(prodLimit):v); };
    const skuImg = Object.fromEntries((prodsFS||[]).filter(p=>p.img).map(p=>[p.sku||p._id, p.img]));
    const enriched = PRODUCTS.map(p => ({ ...p, img: skuImg[p.sku] || null }));
    const filtered = enriched.filter(p => !q || (p.name+p.sku+(p.brand||"")).toLowerCase().includes(q.toLowerCase()));
    const visible = q ? filtered : filtered.slice(0, limit);
    const hasMore = !q && filtered.length > limit;
    return React.createElement("div", {className:"flex-1 relative overflow-hidden"},
      React.createElement("div", {className:"absolute inset-0 overflow-y-auto pb-20"},
        React.createElement("div", {className:"px-3 pt-3"},
          React.createElement("div", {className:"relative mb-3"},
            React.createElement(Search, {className:"absolute left-2.5 top-2.5 h-4 w-4 text-slate-400"}),
            React.createElement("input", {value:q, onChange:e=>{ setQ(e.target.value); setLimit(50); }, placeholder:"Tìm theo tên, mã...",
              style:{fontSize:'16px'},
              className:"w-full rounded-xl border border-slate-200 bg-white pl-8 pr-3 py-2 text-sm focus:border-[#fed7aa] focus:outline-none"})),
          React.createElement("div", {className:"text-xs text-slate-400 mb-2"},
            q ? filtered.length+"/"+PRODUCTS.length+" sản phẩm" : "Hiện "+visible.length+"/"+PRODUCTS.length+" — tìm kiếm để lọc nhanh"),
          React.createElement("div", {className:"space-y-2"},
            visible.map(p => React.createElement("div", {
              key:p.sku,
              className:"bg-white rounded-xl border border-slate-200 p-3 flex items-center gap-2 active:bg-slate-50",
              onClick:()=>setSelectedProduct(p),
            },
              p.img
                ? React.createElement("img", {src:p.img, alt:p.name, className:"w-14 h-14 rounded-lg object-cover shrink-0 bg-slate-100"})
                : React.createElement("div", {className:"w-14 h-14 rounded-lg bg-slate-100 shrink-0 flex items-center justify-center"},
                    React.createElement(Package, {className:"h-6 w-6 text-slate-300"})),
              React.createElement("div", {className:"flex-1 min-w-0"},
                React.createElement("div", {className:"text-sm font-medium text-slate-800 leading-snug line-clamp-2"}, p.name),
                React.createElement("div", {className:"text-xs text-slate-400 mt-0.5"}, "Mã: "+p.sku),
                React.createElement("div", {className:"flex items-baseline gap-2 mt-1 flex-wrap"},
                  p.sale>0 && React.createElement("span", {className:"text-sm font-semibold text-[#92400e]"}, num(p.sale)+"đ"),
                  p.list>0 && React.createElement("span", {className:"text-xs text-slate-400 line-through"}, num(p.list)+"đ"))),
              React.createElement("button", {
                className:"shrink-0 p-2 text-slate-400 active:text-[#92400e]",
                onClick:e=>{ e.stopPropagation(); setProductForm(p); },
              }, React.createElement(Pencil, {className:"h-4 w-4"}))))),
          hasMore && React.createElement("button", {
            className:"w-full mt-3 py-3 text-sm text-[#92400e] font-medium border border-[#fed7aa] rounded-xl active:bg-orange-50",
            onClick:()=>setLimit(l=>l+100),
          }, "Xem thêm 100 sản phẩm"))),
      React.createElement("button", {
        className:"absolute bottom-4 right-4 h-14 w-14 bg-[#92400e] rounded-full flex items-center justify-center shadow-lg active:scale-95 transition-transform z-10",
        onClick:()=>setProductForm({name:"",sku:"",sale:0,list:0,unit:"Cái",desc:""}),
      }, React.createElement(Plus, {className:"h-7 w-7 text-white"})));
  };

  /* ── Màn hình Báo giá ── */
  const ScreenQuotes = () => React.createElement("div", {className:"flex-1 relative overflow-hidden"},
    React.createElement("div", {className:"absolute inset-0 overflow-y-auto pb-4"},
      React.createElement("div", {className:"px-3 pt-3"},
        React.createElement("div", {className:"relative mb-3"},
          React.createElement(Search, {className:"absolute left-2.5 top-2.5 h-4 w-4 text-slate-400"}),
          React.createElement("input", {value:quoteSearch, onChange:e=>setQuoteSearch(e.target.value),
            placeholder:"Tìm mã báo giá, tên KH, SĐT...",
            style:{fontSize:'16px'},
            className:"w-full rounded-xl border border-slate-200 bg-white pl-8 pr-3 py-2 text-sm focus:border-[#fed7aa] focus:outline-none"})),
        visibleQuotes.length === 0
          ? React.createElement("div", {className:"text-center text-slate-400 pt-10 text-sm"},
              quoteSearch ? "Không tìm thấy báo giá nào" : "Chưa có báo giá nào")
          : React.createElement("div", {className:"space-y-2"},
              visibleQuotes.map(o => {
                const c = calc(o);
                return React.createElement("div", {
                  key: o.id,
                  className: "bg-white rounded-xl border border-slate-200 p-3 shadow-sm active:bg-slate-50",
                  onClick: () => setSelectedOrder(o),
                },
                  React.createElement("div", {className:"flex items-start justify-between gap-2 mb-1"},
                    React.createElement("div", {className:"flex items-center gap-1.5"},
                      React.createElement("span", {className:"font-bold text-[#92400e] text-sm"}, o.id)),
                    React.createElement("div", {className:"flex items-start gap-1.5 shrink-0"},
                      React.createElement("div", {className:"text-sm font-bold text-slate-700"}, num(c.total)+"đ"),
                      React.createElement("button", {
                        onClick: e => { e.stopPropagation(); cloneDraft(o); },
                        className:"p-1.5 rounded-full bg-slate-100 text-slate-500 active:bg-[#ffedd5] active:text-[#92400e]",
                        title:"Nhân bản"},
                        React.createElement(Copy, {className:"h-4 w-4"})),
                      profile?.role === "admin" && React.createElement("button", {
                        onClick: e => { e.stopPropagation(); if (window.confirm("Xóa báo giá "+o.id+"?")) deleteOrderCascade(o.id).catch(console.error); },
                        className:"p-1.5 rounded-full bg-slate-100 text-slate-500 active:bg-red-50 active:text-red-600",
                        title:"Xóa"},
                        React.createElement(Trash2, {className:"h-4 w-4"})))),
                  React.createElement("div", {className:"text-sm font-medium text-slate-800 flex items-baseline gap-1.5 flex-wrap"},
                    React.createElement("span", null, o.name),
                    o.phone && React.createElement("span", {className:"text-xs text-slate-400 font-normal"}, o.phone)),
                  o.addr && React.createElement("div", {className:"text-xs text-slate-500 mt-0.5"}, o.addr),
                  React.createElement("div", {className:"text-xs text-slate-400 mt-0.5 flex items-center gap-1"},
                    React.createElement("span", null, o.dt||""),
                    o.staff && React.createElement("span", null, "· "+o.staff)));
              }))
      )
    )
  );

  /* ── Màn hình Tạo đơn ── */
  const ScreenCreate = () => {
    const pickerProds = PRODUCTS.filter(p => !pickerQ ||
      (p.name+p.sku).toLowerCase().includes(pickerQ.toLowerCase())).slice(0, 30);
    const addItem = (p) => {
      setCreateForm(f => ({...f, items:[...f.items, {sku:p.sku, name:p.name, qty:1, price:p.sale||0}]}));
      setShowPicker(false); setPickerQ("");
    };
    const updItem = (idx, key, val) =>
      setCreateForm(f => ({...f, items:f.items.map((it,i)=>i===idx?{...it,[key]:parseInt(val)||0}:it)}));
    const delItem = (idx) =>
      setCreateForm(f => ({...f, items:f.items.filter((_,i)=>i!==idx)}));
    const subtotal = createForm.items.reduce((s,it)=>s+(Number(it.price)||0)*(Number(it.qty)||0),0);
    return React.createElement("div", {className:"flex-1 flex flex-col overflow-hidden"},
      React.createElement("div", {className:"shrink-0 flex items-center justify-between px-4 py-2.5 bg-white border-b border-slate-200"},
        React.createElement("span", {className:"font-semibold text-slate-700 text-sm"}, editingOrderId ? "Sửa đơn "+editingOrderId : "Tạo đơn mới"),
        React.createElement("button", {
          onClick:()=>{ setCreateForm({name:"",phone:"",addr:"",note:"",items:[]}); if (editingOrderRef) { setSelectedOrder(editingOrderRef); setTab(editingOrderRef.draft ? "quotes" : "orders"); } else { setTab("orders"); } setEditingOrderId(null); setEditingOrderRef(null); },
          className:"text-slate-400 active:text-slate-600"},
          React.createElement(X, {className:"h-5 w-5"}))),
      React.createElement("div", {className:"flex-1 overflow-y-auto"},
        React.createElement("div", {className:"p-4 space-y-4 pb-32"},
          React.createElement("div", null,
            React.createElement("div", {className:"text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2"}, "Khách hàng"),
            React.createElement("div", {className:"space-y-2"},
              React.createElement("input", {value:createForm.name, onChange:e=>setCreateForm(f=>({...f,name:e.target.value})),
                placeholder:"Tên khách hàng *",
                style:{fontSize:'16px'},
                className:"w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm focus:border-[#fed7aa] focus:outline-none"}),
              React.createElement("input", {value:createForm.phone, onChange:e=>setCreateForm(f=>({...f,phone:e.target.value})),
                placeholder:"Số điện thoại", type:"tel",
                style:{fontSize:'16px'},
                className:"w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm focus:border-[#fed7aa] focus:outline-none"}),
              React.createElement("input", {value:createForm.addr, onChange:e=>setCreateForm(f=>({...f,addr:e.target.value})),
                placeholder:"Địa chỉ giao hàng",
                style:{fontSize:'16px'},
                className:"w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm focus:border-[#fed7aa] focus:outline-none"}))),
          React.createElement("div", null,
            React.createElement("div", {className:"flex items-center justify-between mb-2"},
              React.createElement("div", {className:"text-xs font-semibold text-slate-400 uppercase tracking-wide"}, "Sản phẩm"),
              React.createElement("button", {onClick:()=>setShowPicker(true),
                className:"flex items-center gap-1 text-xs text-[#92400e] font-medium border border-[#fed7aa] rounded-lg px-2 py-1 active:bg-orange-50"},
                React.createElement(Plus, {className:"h-3 w-3"}), "Thêm")),
            createForm.items.length === 0
              ? React.createElement("div", {className:"text-sm text-slate-400 text-center py-6 bg-white rounded-xl border border-dashed border-slate-200"},
                  "Bấm Thêm để chọn sản phẩm")
              : React.createElement("div", {className:"space-y-2"},
                  createForm.items.map((it,idx) => React.createElement("div", {key:idx, className:"bg-white rounded-xl border border-slate-200 p-3"},
                    React.createElement("div", {className:"flex items-center justify-between mb-2"},
                      React.createElement("div", {className:"text-sm font-medium text-slate-800 flex-1 mr-2 leading-snug line-clamp-2"}, it.name),
                      React.createElement("button", {onClick:()=>delItem(idx), className:"shrink-0 text-slate-300 active:text-red-400"},
                        React.createElement(X, {className:"h-4 w-4"}))),
                    React.createElement("div", {className:"grid grid-cols-2 gap-2"},
                      React.createElement("div", null,
                        React.createElement("label", {className:"text-[10px] text-slate-400 uppercase tracking-wide"}, "Số lượng"),
                        React.createElement("input", {type:"text", inputMode:"numeric", pattern:"[0-9]*", value:it.qty||"",
                          onFocus:e=>e.target.select(),
                          onChange:e=>updItem(idx,"qty",e.target.value.replace(/\D/g,"")),
                          style:{fontSize:'16px'},
                          className:"w-full mt-0.5 rounded-lg border border-slate-200 px-2 py-1.5 text-sm focus:border-[#fed7aa] focus:outline-none"})),
                      React.createElement("div", null,
                        React.createElement("label", {className:"text-[10px] text-slate-400 uppercase tracking-wide"}, "Đơn giá (đ)"),
                        React.createElement("input", {type:"text", inputMode:"numeric", pattern:"[0-9]*", value:num(it.price)||"",
                          onFocus:e=>e.target.select(),
                          onChange:e=>updItem(idx,"price",e.target.value.replace(/\D/g,"")),
                          style:{fontSize:'16px'},
                          className:"w-full mt-0.5 rounded-lg border border-slate-200 px-2 py-1.5 text-sm focus:border-[#fed7aa] focus:outline-none"}))))),
                  subtotal > 0 && React.createElement("div", {className:"flex justify-between items-center mt-2 px-1"},
                    React.createElement("span", {className:"text-sm text-slate-500"}, "Tổng"),
                    React.createElement("span", {className:"text-base font-bold text-[#92400e]"}, num(subtotal)+"đ")))),
          React.createElement("div", null,
            React.createElement("div", {className:"text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2"}, "Ghi chú"),
            React.createElement("textarea", {value:createForm.note, onChange:e=>setCreateForm(f=>({...f,note:e.target.value})),
              rows:3, placeholder:"Ghi chú cho đơn...",
              style:{fontSize:'16px'},
              className:"w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm focus:border-[#fed7aa] focus:outline-none resize-none"})))),
      React.createElement("div", {className:"shrink-0 p-4 border-t border-slate-200 bg-white flex gap-3 safe-area-bottom"},
        editingOrderId
          ? React.createElement("button", {onClick:()=>saveMobileOrder(false),
              className:"flex-1 py-3 rounded-xl bg-[#92400e] text-white font-semibold text-sm active:opacity-80"},
              "Lưu lại")
          : React.createElement(React.Fragment, null,
              React.createElement("button", {onClick:()=>saveMobileOrder(true),
                className:"flex-1 py-3 rounded-xl border-2 border-[#fed7aa] text-[#92400e] font-semibold text-sm active:bg-orange-50"},
                "Báo giá"),
              React.createElement("button", {onClick:()=>{
                  if (!createForm.name.trim()) { alert("Vui lòng nhập tên khách hàng"); return; }
                  if (!createForm.phone.trim()) { alert("Vui lòng nhập số điện thoại"); return; }
                  if (!createForm.addr.trim()) { alert("Vui lòng nhập địa chỉ giao hàng"); return; }
                  if (!createForm.items.length) { alert("Vui lòng thêm ít nhất 1 sản phẩm"); return; }
                  setShowPayModal(true);
                },
                className:"flex-1 py-3 rounded-xl bg-[#92400e] text-white font-semibold text-sm active:opacity-80"},
                "Thanh toán"))),
      showPicker && React.createElement("div", {className:"absolute inset-0 z-[80] bg-white flex flex-col"},
        React.createElement("div", {className:"shrink-0 flex items-center justify-between px-4 py-3 bg-[#92400e]"},
          React.createElement("span", {className:"text-white font-semibold text-base"}, "Chọn sản phẩm"),
          React.createElement("button", {onClick:()=>{setShowPicker(false);setPickerQ("");}, className:"text-white/80"},
            React.createElement(X, {className:"h-6 w-6"}))),
        React.createElement("div", {className:"px-3 py-2 border-b border-slate-100"},
          React.createElement("div", {className:"relative"},
            React.createElement(Search, {className:"absolute left-2.5 top-2.5 h-4 w-4 text-slate-400"}),
            React.createElement("input", {value:pickerQ, onChange:e=>setPickerQ(e.target.value),
              placeholder:"Tìm theo tên, mã SKU...",
              autoFocus:true,
              style:{fontSize:'16px'},
              className:"w-full rounded-xl border border-slate-200 pl-8 pr-3 py-2 text-sm focus:border-[#fed7aa] focus:outline-none"}))),
        React.createElement("div", {className:"flex-1 overflow-y-auto"},
          React.createElement("div", {className:"divide-y divide-slate-100"},
            pickerProds.map(p => React.createElement("button", {
              key:p.sku, onClick:()=>addItem(p),
              className:"w-full flex items-center gap-3 px-4 py-3 text-left active:bg-orange-50"},
              React.createElement("div", {className:"flex-1 min-w-0"},
                React.createElement("div", {className:"text-sm font-medium text-slate-800 leading-snug"}, p.name),
                React.createElement("div", {className:"text-xs text-slate-400 mt-0.5"}, p.sku+(p.unit?" · "+p.unit:""))),
              p.sale > 0 && React.createElement("div", {className:"text-sm font-semibold text-[#92400e] shrink-0"}, num(p.sale)+"đ")))))));
  };

  const allNccNames = [...new Set([
    ...SUPPLIERS.map(s=>s.name),
    ...(whInFS||[]).map(r=>r.supplier).filter(Boolean)
  ])].sort();

  return React.createElement("div", {className:"relative flex flex-col h-screen bg-slate-50 overflow-hidden"},
    /* Header */
    React.createElement("div", {className:"shrink-0 flex items-center justify-between px-4 h-14 bg-white border-b border-slate-100 safe-area-top"},
      /* Logo + tên */
      React.createElement("div", {className:"flex items-center gap-2"},
        React.createElement("img", {src:"/banner.jpg", alt:"BLTK", className:"w-9 h-9 rounded-lg object-cover"}),
        React.createElement("span", {className:"font-bold text-[#92400e] text-base tracking-wide"}, "BLTK Hải Phòng")),
      /* Icons bên phải */
      React.createElement("div", {className:"flex items-center gap-1.5"},
        /* Bell */
        React.createElement("div", {className:"relative"},
          React.createElement("button", {onClick:()=>setShowNotifs(v=>!v),
            className:`w-8 h-8 flex items-center justify-center rounded-lg ${showNotifs?"bg-[#ffedd5]":"active:bg-[#ffedd5]"} text-[#92400e]`,
            title:"Thông báo"},
            React.createElement(Bell, {className:"h-4 w-4"})),
          notifs.length > 0 && React.createElement("span", {className:"absolute -top-1 -right-1 min-w-[16px] h-4 px-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center leading-none"}, notifs.length > 9 ? "9+" : notifs.length),
          showNotifs && React.createElement("div", {className:"absolute right-0 top-full mt-2 w-72 bg-white rounded-xl shadow-xl border border-slate-200 z-[200] overflow-hidden"},
            React.createElement("div", {className:"flex items-center justify-between px-3 py-2 border-b border-slate-100"},
              React.createElement("span", {className:"text-xs font-semibold text-slate-600"}, "Thông báo"),
              notifs.length > 0 && React.createElement("button", {onClick:()=>setNotifs([]), className:"text-[10px] text-slate-400 hover:text-red-500"}, "Xoá tất cả")),
            notifs.length === 0
              ? React.createElement("div", {className:"px-3 py-6 text-center text-xs text-slate-400"}, "Chưa có thông báo")
              : React.createElement("div", {className:"max-h-72 overflow-y-auto divide-y divide-slate-50"},
                  notifs.map(n => React.createElement("div", {key:n.id, className:"px-3 py-2.5"},
                    React.createElement("div", {className:"text-xs text-slate-700 leading-snug"}, n.msg),
                    React.createElement("div", {className:"text-[10px] text-slate-400 mt-0.5"}, n.ts)))))),
        /* Home — chỉ admin */
        isAdmin && React.createElement("button", {onClick:()=>setTab("home"),
          className:`w-8 h-8 flex items-center justify-center rounded-lg ${tab==="home"?"bg-[#ffedd5]":"active:bg-[#ffedd5]"} text-[#92400e]`,
          title:"Tổng quan"},
          React.createElement(Home, {className:"h-4 w-4"})),
        /* Logout */
        React.createElement("button", {onClick:logout, title:"Đăng xuất",
          className:"w-8 h-8 flex items-center justify-center rounded-lg active:bg-[#ffedd5] text-[#92400e]"},
          React.createElement(LogOut, {className:"h-4 w-4"})),
        /* Tên nhân viên */
        React.createElement("span", {className:"text-xs text-slate-500 font-medium"}, profile?.name||""))),
    /* Screen — gọi thẳng function để tránh unmount khi re-render */
    tab==="home" ? (isAdmin ? ScreenHome() : ScreenOrders()) : tab==="orders" ? ScreenOrders() : tab==="quotes" ? ScreenQuotes() : tab==="create" ? ScreenCreate() : ScreenProducts(),
    /* Bottom nav */
    React.createElement("div", {className:"shrink-0 border-t border-slate-200 bg-white safe-area-bottom"},
      React.createElement("div", {className:"flex"},
        tabs.map(t => t.fab
          ? React.createElement("button", {key:t.key, onClick:()=>setTab(t.key),
              className:"flex-1 flex flex-col items-center justify-center py-2 gap-0.5"},
              React.createElement("div", {className:`h-12 w-12 rounded-full flex items-center justify-center shadow-lg transition-transform active:scale-95 ${tab===t.key?"bg-[#78350f]":"bg-[#92400e]"}`},
                React.createElement("span", {className:"text-white"}, t.icon)),
              React.createElement("span", {className:"text-[10px] font-medium text-[#92400e]"}, t.label))
          : React.createElement("button", {key:t.key, onClick:()=>setTab(t.key),
              className:`flex-1 flex flex-col items-center justify-center py-2 gap-0.5 transition-colors ${tab===t.key?"text-[#92400e]":"text-slate-400"}`},
              t.icon,
              React.createElement("span", {className:"text-[10px] font-medium"}, t.label))))),
    /* Chi tiết đơn hàng overlay */
    selectedOrder && React.createElement("div", {className:"absolute inset-0 z-50 bg-white flex flex-col"},
      React.createElement("div", {className:"shrink-0 flex items-center justify-between px-4 py-3 bg-[#92400e]"},
        React.createElement("span", {className:"text-white font-semibold text-base"}, selectedOrder?.draft ? "Chi tiết báo giá" : "Chi tiết đơn hàng"),
        React.createElement("button", {onClick:()=>setSelectedOrder(null), className:"text-white/80 hover:text-white"},
          React.createElement(X, {className:"h-6 w-6"}))),
      React.createElement("div", {className:"flex-1 overflow-y-auto p-4 space-y-4"},
        (() => {
          const o = selectedOrder;
          const c = calc(o);
          const pmts = o.payments || [];
          return React.createElement(React.Fragment, null,
            /* Thông tin cơ bản */
            React.createElement("div", {className:"grid grid-cols-2 gap-3"},
              React.createElement("div", null, React.createElement("div", {className:"text-xs text-slate-400"}, "Mã đơn"), React.createElement("div", {className:"font-bold text-[#92400e]"}, o.id)),
              React.createElement("div", null, React.createElement("div", {className:"text-xs text-slate-400"}, "Ngày tạo"), React.createElement("div", {className:"text-sm text-slate-700"}, o.dt)),
              React.createElement("div", null, React.createElement("div", {className:"text-xs text-slate-400"}, "Khách hàng"), React.createElement("div", {className:"text-sm font-medium text-slate-800"}, o.name)),
              React.createElement("div", null, React.createElement("div", {className:"text-xs text-slate-400"}, "SĐT"), React.createElement("div", {className:"text-sm text-slate-700"}, o.phone||"—")),
              React.createElement("div", {className:"col-span-2"}, React.createElement("div", {className:"text-xs text-slate-400"}, "Địa chỉ"), React.createElement("div", {className:"text-sm text-slate-700"}, o.addr||"—"))),
            /* Sản phẩm */
            React.createElement("div", {className:"bg-slate-50 rounded-xl p-3"},
              React.createElement("div", {className:"text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wide"}, "Sản phẩm"),
              (o.items||[]).map((it,i) => React.createElement("div", {key:i, className:"flex justify-between items-start py-1.5 border-b border-slate-100 last:border-0"},
                React.createElement("div", {className:"flex-1 text-sm text-slate-700 pr-2"}, it.name, React.createElement("span", {className:"text-slate-400 ml-1"}, "x"+it.qty)),
                React.createElement("div", {className:"text-sm font-medium text-slate-800 shrink-0"}, num((it.price||0)*(it.qty||1))+"đ")))),
            /* Tổng tiền */
            React.createElement("div", {className:"bg-white border border-slate-200 rounded-xl p-3 space-y-1.5"},
              React.createElement("div", {className:"flex justify-between text-sm"}, React.createElement("span", {className:"text-slate-500"}, "Tổng tiền hàng"), React.createElement("span", null, num((o.items||[]).reduce((s,it)=>s+(it.price||0)*(it.qty||1),0))+"đ")),
              o.shippingFee>0 && React.createElement("div", {className:"flex justify-between text-sm"}, React.createElement("span", {className:"text-slate-500"}, "Vận chuyển"), React.createElement("span", null, num(o.shippingFee)+"đ")),
              React.createElement("div", {className:"flex justify-between text-sm font-semibold border-t border-slate-100 pt-1.5"}, React.createElement("span", {className:"text-[#92400e]"}, "Tổng đơn"), React.createElement("span", {className:"text-[#92400e]"}, num(c.total)+"đ")),
              pmts.map((p,i) => React.createElement("div", {key:i, className:"flex justify-between text-sm"}, React.createElement("span", {className:"text-slate-500"}, (p.kind||"Thanh toán")+" - "+(p.date||"")), React.createElement("span", {className:"text-amber-600"}, num(p.amount)+"đ"))),
              React.createElement("div", {className:"flex justify-between text-sm font-bold border-t border-slate-100 pt-1.5"}, React.createElement("span", {className:c.remaining>0?"text-red-500":"text-green-600"}, "Còn lại"), React.createElement("span", {className:c.remaining>0?"text-red-500":"text-green-600"}, num(c.remaining)+"đ")))
          );
        })()),
      React.createElement("div", {className:"shrink-0 px-3 py-2.5 border-t border-[#fed7aa] bg-[#fffbf5] safe-area-bottom"},
        (() => {
          const o = selectedOrder;
          const c = calc(o);
          if (o.draft) {
            const printCfg = (settingsFS||[]).find(s=>s._id==="print_template")||{};
            const dPill = "flex-1 flex items-center justify-center gap-1.5 px-2 py-2.5 text-xs font-semibold rounded-full bg-[#ffedd5] text-[#92400e] border border-[#fed7aa] active:opacity-75";
            return React.createElement("div", {className:"flex gap-2"},
              React.createElement("button", {onClick:()=>{ openPrint(o,"bao-gia",printCfg,prodsFS||[]); }, className:dPill},
                React.createElement(Printer, {className:"h-3.5 w-3.5 shrink-0"}), "In báo giá"),
              React.createElement("button", {onClick:()=>convertDraftToOrder(o), disabled:converting, className:dPill+(converting?" opacity-50":"")},
                React.createElement(CheckCircle, {className:"h-3.5 w-3.5 shrink-0"}), converting?"Đang tạo...":"Tạo đơn ngay"),
              React.createElement("button", {onClick:()=>doEdit(o), className:dPill},
                React.createElement(Pencil, {className:"h-3.5 w-3.5 shrink-0"}), "Sửa đơn"));
          }
          const pill = "bg-[#ffedd5] text-[#92400e] border border-[#fed7aa] rounded-full";
          const pillRed = "bg-red-50 text-red-600 border border-red-200 rounded-full";
          const btn = (onClick, icon, label, cls) => React.createElement("button", {onClick,
            className:`flex-1 flex items-center justify-center gap-1.5 px-2 py-2 text-xs font-semibold active:opacity-75 ${cls}`},
            icon, label);
          const btnSm = (onClick, icon, label, cls) => React.createElement("button", {onClick,
            className:`w-16 shrink-0 flex items-center justify-center gap-1 py-2 text-xs font-semibold active:opacity-75 ${cls}`},
            icon, label);
          const ic = (I) => React.createElement(I, {className:"h-3.5 w-3.5 shrink-0"});
          if (o.deliveryConfirmed || o.returned) {
            return React.createElement("div", {className:"flex gap-2"},
              !o.returned && btn(()=>doReturn(o), ic(RotateCcw), "Hoàn hàng", pill),
              c.remaining > 0 && btn(doAddPayment, ic(CreditCard), "Thanh toán", pill),
              btn(doPrint, ic(Printer), "In", pill));
          }
          if (o.imported) {
            const deliveryPill = justImported
              ? pill + " ring-2 ring-[#92400e] ring-offset-1 animate-pulse"
              : pill;
            return React.createElement("div", {className:"space-y-2"},
              React.createElement("div", {className:"flex gap-2"},
                btn(()=>{ setJustImported(false); doConfirmDelivery(o); }, ic(Truck), "Xác nhận giao", deliveryPill),
                btn(()=>doPartialDelivery(o), ic(Layers), "Giao từng phần", pill)),
              React.createElement("div", {className:"flex gap-2"},
                btn(doAddPayment, ic(CreditCard), "Thanh toán", pill),
                btn(()=>doEdit(o), ic(Pencil), "Sửa", pill),
                btn(doPrint, ic(Printer), "In", pill)));
          }
          return React.createElement("div", {className:"flex gap-1.5"},
            btn(()=>doWarehouseIn(o), ic(ArrowDownToLine), "Nhập hàng", pill),
            btn(doAddPayment, ic(CreditCard), "Thanh toán", pill),
            btn(()=>doEdit(o), ic(Pencil), "Sửa", pill),
            btn(doPrint, ic(Printer), "In", pill));
        })())),
    /* Chi tiết sản phẩm overlay */
    selectedProduct && React.createElement("div", {className:"absolute inset-0 z-50 bg-white flex flex-col"},
      React.createElement("div", {className:"shrink-0 flex items-center justify-between px-4 py-3 bg-[#92400e]"},
        React.createElement("span", {className:"text-white font-semibold text-base"}, "Chi tiết sản phẩm"),
        React.createElement("button", {onClick:()=>setSelectedProduct(null), className:"text-white/80 hover:text-white"},
          React.createElement(X, {className:"h-6 w-6"}))),
      React.createElement("div", {className:"flex-1 overflow-y-auto"},
        selectedProduct.img
          ? React.createElement("img", {src:selectedProduct.img, alt:selectedProduct.name, className:"w-full max-h-64 object-contain bg-slate-50"})
          : React.createElement("div", {className:"w-full h-48 bg-slate-100 flex items-center justify-center"},
              React.createElement(Package, {className:"h-16 w-16 text-slate-300"})),
        React.createElement("div", {className:"p-4 space-y-4"},
          React.createElement("div", null,
            React.createElement("div", {className:"text-lg font-bold text-slate-800 leading-snug"}, selectedProduct.name),
            React.createElement("div", {className:"text-sm text-slate-400 mt-1"}, "Mã: "+selectedProduct.sku+(selectedProduct.unit ? " · "+selectedProduct.unit : ""))),
          React.createElement("div", {className:"bg-orange-50 rounded-xl p-3 space-y-1.5"},
            selectedProduct.sale>0 && React.createElement("div", {className:"flex justify-between items-center"},
              React.createElement("span", {className:"text-sm text-slate-600"}, "Giá bán"),
              React.createElement("span", {className:"text-lg font-bold text-[#92400e]"}, num(selectedProduct.sale)+"đ")),
            selectedProduct.list>0 && React.createElement("div", {className:"flex justify-between items-center"},
              React.createElement("span", {className:"text-sm text-slate-500"}, "Giá niêm yết"),
              React.createElement("span", {className:"text-sm text-slate-400 line-through"}, num(selectedProduct.list)+"đ")),
            selectedProduct.sale>0 && selectedProduct.list>0 && React.createElement("div", {className:"flex justify-between items-center"},
              React.createElement("span", {className:"text-sm text-slate-500"}, "Chiết khấu"),
              React.createElement("span", {className:"text-sm font-medium text-green-600"}, Math.round((1-selectedProduct.sale/selectedProduct.list)*100)+"%"))),
          selectedProduct.desc && React.createElement("div", null,
            React.createElement("div", {className:"text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1"}, "Mô tả"),
            React.createElement("div", {className:"space-y-0.5"},
              selectedProduct.desc
                .split(/\r?\n/)
                .flatMap(line => line.split(/(?<=[^\s])(?=\p{Lu}\p{Ll})/u))
                .filter(Boolean)
                .map((line, i) => React.createElement("div", {key:i, className:"text-sm text-slate-700"}, line.trim()))
            ))))),
    /* Form thêm / sửa sản phẩm overlay */
    productForm !== null && React.createElement("div", {className:"absolute inset-0 z-[70] bg-white flex flex-col"},
      React.createElement("div", {className:"shrink-0 flex items-center justify-between px-4 py-3 bg-[#92400e]"},
        React.createElement("span", {className:"text-white font-semibold text-base"}, productForm._id ? "Sửa sản phẩm" : "Thêm sản phẩm"),
        React.createElement("div", {className:"flex items-center gap-3"},
          React.createElement("button", {onClick:handleSaveProduct, disabled:savingProd, className:"text-white/90 hover:text-white"},
            React.createElement(Check, {className:"h-6 w-6"})),
          React.createElement("button", {onClick:()=>setProductForm(null), className:"text-white/80 hover:text-white"},
            React.createElement(X, {className:"h-6 w-6"})))),
      React.createElement("div", {className:"flex-1 overflow-y-auto p-4 space-y-3"},
        React.createElement("div", null,
          React.createElement("label", {className:"text-xs font-semibold text-slate-500 uppercase tracking-wide"}, "Tên sản phẩm *"),
          React.createElement("input", {value:productForm.name||"", onChange:e=>setProductForm(p=>({...p,name:e.target.value})),
            placeholder:"Nhập tên sản phẩm", style:{fontSize:'16px'}, className:"mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:border-[#fed7aa] focus:outline-none"})),
        React.createElement("div", null,
          React.createElement("label", {className:"text-xs font-semibold text-slate-500 uppercase tracking-wide"}, "Mã SKU *"),
          React.createElement("input", {value:productForm.sku||"", onChange:e=>setProductForm(p=>({...p,sku:e.target.value})),
            disabled:!!productForm._id, placeholder:"Nhập mã SKU",
            style:{fontSize:'16px'}, className:"mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:border-[#fed7aa] focus:outline-none disabled:bg-slate-50 disabled:text-slate-400"})),
        React.createElement("div", {className:"grid grid-cols-2 gap-3"},
          React.createElement("div", null,
            React.createElement("label", {className:"text-xs font-semibold text-slate-500 uppercase tracking-wide"}, "Giá bán"),
            React.createElement("input", {type:"number", value:productForm.sale||"", onChange:e=>setProductForm(p=>({...p,sale:e.target.value})),
              placeholder:"0", style:{fontSize:'16px'}, className:"mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:border-[#fed7aa] focus:outline-none"})),
          React.createElement("div", null,
            React.createElement("label", {className:"text-xs font-semibold text-slate-500 uppercase tracking-wide"}, "Giá niêm yết"),
            React.createElement("input", {type:"number", value:productForm.list||"", onChange:e=>setProductForm(p=>({...p,list:e.target.value})),
              placeholder:"0", style:{fontSize:'16px'}, className:"mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:border-[#fed7aa] focus:outline-none"}))),
        React.createElement("div", null,
          React.createElement("label", {className:"text-xs font-semibold text-slate-500 uppercase tracking-wide"}, "Đơn vị"),
          React.createElement("input", {value:productForm.unit||"", onChange:e=>setProductForm(p=>({...p,unit:e.target.value})),
            placeholder:"Cái, Bộ, ...", style:{fontSize:'16px'}, className:"mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:border-[#fed7aa] focus:outline-none"})),
        React.createElement("div", null,
          React.createElement("label", {className:"text-xs font-semibold text-slate-500 uppercase tracking-wide"}, "Mô tả"),
          React.createElement("textarea", {value:productForm.desc||"", onChange:e=>setProductForm(p=>({...p,desc:e.target.value})),
            rows:4, placeholder:"Mô tả sản phẩm...", style:{fontSize:'16px'}, className:"mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:border-[#fed7aa] focus:outline-none resize-none"})),
        React.createElement("button", {onClick:handleSaveProduct, disabled:savingProd,
          className:"w-full bg-[#92400e] text-white rounded-xl py-3 font-semibold text-sm active:opacity-80 disabled:opacity-50"},
          savingProd ? "Đang lưu..." : (productForm._id ? "Lưu thay đổi" : "Thêm sản phẩm"))))
    ,
    /* Payment modal */
    showPayModal && React.createElement("div", {className:"absolute inset-0 z-[90] bg-white flex flex-col"},
      React.createElement("div", {className:"shrink-0 flex items-center justify-between px-4 py-3 bg-[#92400e]"},
        React.createElement("span", {className:"text-white font-semibold text-base"}, "Thanh toán đơn hàng"),
        React.createElement("button", {onClick:()=>{setShowPayModal(false);setPayExpenses([]);setPayDeposit(0);setPayPayment(0);}, className:"text-white/80"},
          React.createElement(X, {className:"h-6 w-6"}))),
      React.createElement("div", {className:"flex-1 overflow-y-auto p-4 space-y-5"},
        /* Chi phí phát sinh */
        React.createElement("div", null,
          React.createElement("div", {className:"text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2"}, "Chi phí phát sinh (KH thanh toán)"),
          React.createElement("div", {className:"flex gap-2 flex-wrap mb-3"},
            ["Chi phí giao hàng >15km","Chi phí lắp đặt","Chi phí đổi trả"]
              .filter(t=>!payExpenses.find(e=>e.type===t))
              .map(t=>React.createElement("button", {key:t,
                onClick:()=>setPayExpenses(p=>[...p,{type:t,amount:0}]),
                className:"text-xs px-3 py-1.5 rounded-lg border border-[#fed7aa] text-[#92400e] active:bg-orange-50"},
                "+ "+t.replace("Chi phí ","")))),
          React.createElement("div", {className:"space-y-2"},
            payExpenses.map((e,i)=>React.createElement("div", {key:i, className:"flex items-center gap-2"},
              React.createElement("span", {className:"flex-1 text-sm text-slate-700"}, e.type.replace("Chi phí ","")),
              React.createElement("input", {type:"text",inputMode:"numeric",value:num(e.amount)||"",
                onFocus:ev=>ev.target.select(),
                onChange:ev=>setPayExpenses(p=>p.map((x,j)=>j===i?{...x,amount:parseInt(ev.target.value.replace(/\D/g,""))||0}:x)),
                style:{fontSize:'16px'},className:"w-28 rounded-lg border border-slate-200 px-2 py-1.5 text-sm text-right focus:border-[#fed7aa] focus:outline-none"}),
              React.createElement("span",{className:"text-xs text-slate-400"},"đ"),
              React.createElement("button",{onClick:()=>setPayExpenses(p=>p.filter((_,j)=>j!==i)),className:"text-slate-300 active:text-red-400"},
                React.createElement(X,{className:"h-4 w-4"})))))),
        /* Thanh toán */
        React.createElement("div", {className:"space-y-3"},
          React.createElement("div", {className:"text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1"}, "Thanh toán"),
          React.createElement("div", {className:"flex items-center gap-3"},
            React.createElement("span", {className:"text-sm text-slate-700 w-24 shrink-0"}, "Đặt cọc"),
            React.createElement("input", {type:"text",inputMode:"numeric",value:num(payDeposit)||"",
              onFocus:e=>e.target.select(),onChange:e=>setPayDeposit(parseInt(e.target.value.replace(/\D/g,""))||0),
              style:{fontSize:'16px'},className:"flex-1 rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:border-[#fed7aa] focus:outline-none"}),
            React.createElement("span",{className:"text-sm text-slate-400"},"đ")),
          React.createElement("div", {className:"flex items-center gap-3"},
            React.createElement("span", {className:"text-sm text-slate-700 w-24 shrink-0"}, "Thanh toán"),
            React.createElement("input", {type:"text",inputMode:"numeric",value:num(payPayment)||"",
              onFocus:e=>e.target.select(),onChange:e=>setPayPayment(parseInt(e.target.value.replace(/\D/g,""))||0),
              style:{fontSize:'16px'},className:"flex-1 rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:border-[#fed7aa] focus:outline-none"}),
            React.createElement("span",{className:"text-sm text-slate-400"},"đ"))),
        /* Tóm tắt */
        (()=>{
          const sub=createForm.items.reduce((s,it)=>s+(Number(it.price)||0)*(Number(it.qty)||0),0);
          const exp=payExpenses.reduce((s,e)=>s+(e.amount||0),0);
          const total=sub+exp;
          const paid=payDeposit+payPayment;
          return React.createElement("div",{className:"bg-slate-50 rounded-xl p-3 space-y-1.5"},
            React.createElement("div",{className:"flex justify-between text-sm"},React.createElement("span",{className:"text-slate-500"},"Tiền hàng"),React.createElement("span",null,num(sub)+"đ")),
            exp>0&&React.createElement("div",{className:"flex justify-between text-sm"},React.createElement("span",{className:"text-slate-500"},"Chi phí"),React.createElement("span",null,num(exp)+"đ")),
            React.createElement("div",{className:"flex justify-between text-sm font-semibold border-t border-slate-100 pt-1.5"},React.createElement("span",{className:"text-[#92400e]"},"Tổng cộng"),React.createElement("span",{className:"text-[#92400e]"},num(total)+"đ")),
            paid>0&&React.createElement("div",{className:"flex justify-between text-sm"},React.createElement("span",{className:"text-slate-500"},"Đã thanh toán"),React.createElement("span",{className:"text-amber-600"},num(paid)+"đ")),
            React.createElement("div",{className:"flex justify-between text-sm font-bold"},React.createElement("span",{className:(total-paid)>0?"text-red-500":"text-green-600"},"Còn lại"),React.createElement("span",{className:(total-paid)>0?"text-red-500":"text-green-600"},num(total-paid)+"đ")));
        })()),
      React.createElement("div", {className:"shrink-0 p-4 border-t border-slate-200 bg-white safe-area-bottom"},
        React.createElement("button", {onClick:saveMobileOrderWithPayment,
          className:"w-full py-3 bg-[#92400e] text-white rounded-xl font-semibold text-sm active:opacity-80"},
          editingOrderId ? "Cập nhật đơn hàng" : "Xác nhận tạo đơn hàng"))),
    /* Overlay thanh toán thêm cho đơn đang xem */
    showDetailPay && selectedOrder && React.createElement("div", {className:"absolute inset-0 z-[100] bg-black/40 flex items-end"},
      React.createElement("div", {className:"w-full bg-white rounded-t-2xl p-5 space-y-4 safe-area-bottom"},
        React.createElement("div", {className:"flex items-center justify-between"},
          React.createElement("span", {className:"font-semibold text-[#7c2d12]"}, "Thanh toán — "+selectedOrder.id),
          React.createElement("button", {onClick:()=>{setShowDetailPay(false);setDetailPayAmt(0);}, className:"text-slate-400"},
            React.createElement(X, {className:"h-5 w-5"}))),
        React.createElement("div", {className:"flex gap-2"},
          ["Đặt cọc","Thanh toán","Hoàn tiền"].map(k=>React.createElement("button", {key:k,
            onClick:()=>setDetailPayKind(k),
            className:`flex-1 py-2 rounded-xl text-sm font-medium border transition-colors ${detailPayKind===k?"bg-[#92400e] text-white border-[#fed7aa]":"border-[#fed7aa] text-[#92400e]"}`},
            k))),
        React.createElement("div", {className:"flex items-center gap-3"},
          React.createElement("input", {type:"text", inputMode:"numeric",
            value:num(detailPayAmt)||"",
            autoFocus:true,
            onFocus:e=>e.target.select(),
            onChange:e=>setDetailPayAmt(parseInt(e.target.value.replace(/\D/g,""))||0),
            style:{fontSize:'16px'}, className:"flex-1 rounded-xl border border-[#fed7aa] px-3 py-2.5 text-sm focus:border-[#fed7aa] focus:outline-none text-right"}),
          React.createElement("span", {className:"text-sm text-slate-400"}, "đ")),
        React.createElement("button", {onClick:()=>doSaveDetailPay(selectedOrder),
          className:"w-full py-2.5 bg-[#92400e] text-white rounded-xl font-semibold text-sm active:opacity-80"},
          "Xác nhận"))),
    /* Overlay nhập kho mobile */
    showWhIn && selectedOrder && React.createElement("div", {className:"absolute inset-0 z-[100] bg-white flex flex-col"},
      React.createElement("div", {className:"shrink-0 flex items-center justify-between px-4 py-3 bg-[#92400e]"},
        React.createElement("span", {className:"text-white font-semibold text-base"}, "Nhập kho — "+selectedOrder.id),
        React.createElement("button", {onClick:()=>setShowWhIn(false), className:"text-white/80"},
          React.createElement(X, {className:"h-6 w-6"}))),
      React.createElement("div", {className:"flex-1 overflow-y-auto p-4 space-y-4"},
        React.createElement("div", {className:"grid grid-cols-2 gap-3"},
          React.createElement("div", null,
            React.createElement("label", {className:"text-xs font-semibold text-slate-500 uppercase tracking-wide"}, "Số phiếu nhập"),
            React.createElement("input", {value:whInPn, onChange:e=>setWhInPn(e.target.value), style:{fontSize:'16px'},
              className:"mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-[#fed7aa] focus:outline-none"})),
          React.createElement("div", null,
            React.createElement("label", {className:"text-xs font-semibold text-slate-500 uppercase tracking-wide"}, "Ngày nhập"),
            React.createElement("input", {type:"date", value:whInDate, onChange:e=>setWhInDate(e.target.value), style:{fontSize:'16px'},
              className:"mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-[#fed7aa] focus:outline-none"})),
          React.createElement("div", null,
            React.createElement("label", {className:"text-xs font-semibold text-slate-500 uppercase tracking-wide"}, "Kho hàng"),
            React.createElement("select", {value:whInKho, onChange:e=>setWhInKho(e.target.value), style:{fontSize:'16px'},
              className:"mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-[#fed7aa] focus:outline-none bg-white"},
              React.createElement("option", {value:"HH"}, "HH"),
              React.createElement("option", {value:"TB"}, "TB"),
              React.createElement("option", {value:"HG"}, "HG")))),
        React.createElement("div", {className:"space-y-3"},
          whInRows.map((r,i)=>{
            const kw = (r.nccIn||"").trim().toLowerCase();
            const sugs = kw.length>=1 ? allNccNames.filter(n=>n.toLowerCase().includes(kw)) : [];
            const hilite = name => {
              const idx = name.toLowerCase().indexOf(kw);
              if (idx<0) return name;
              return React.createElement(React.Fragment, null,
                name.slice(0,idx),
                React.createElement("span", {className:"font-semibold text-[#92400e]"}, name.slice(idx,idx+kw.length)),
                name.slice(idx+kw.length));
            };
            return React.createElement("div", {key:i, className:"bg-[#fffbf5] border border-[#fed7aa] rounded-xl p-3 space-y-2"},
              React.createElement("div", {className:"text-sm font-semibold text-[#7c2d12]"}, r.name,
                React.createElement("span", {className:"ml-2 text-xs font-normal text-slate-400"}, "SL: "+r.slDat)),
              React.createElement("div", {className:"grid grid-cols-2 gap-2"},
                React.createElement("div", null,
                  React.createElement("label", {className:"text-xs text-slate-500"}, "SL nhập"),
                  React.createElement("input", {type:"number", inputMode:"numeric", value:r.slNhap,
                    onChange:e=>setWhInRows(xs=>xs.map((x,k)=>k===i?{...x,slNhap:parseInt(e.target.value)||0}:x)),
                    style:{fontSize:'16px'}, className:"mt-0.5 w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm focus:border-[#fed7aa] focus:outline-none"})),
                React.createElement("div", null,
                  React.createElement("label", {className:"text-xs text-slate-500"}, "Giá nhập (*)"),
                  React.createElement("input", {type:"text", inputMode:"numeric",
                    value:num(r.giaNhap)||"",
                    onFocus:e=>e.target.select(),
                    onChange:e=>setWhInRows(xs=>xs.map((x,k)=>k===i?{...x,giaNhap:parseInt(e.target.value.replace(/\D/g,""))||0}:x)),
                    style:{fontSize:'16px'}, className:"mt-0.5 w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm focus:border-[#fed7aa] focus:outline-none text-right"}))),
              React.createElement("div", {className:"relative"},
                React.createElement("label", {className:"text-xs text-slate-500"}, "Nhà cung cấp (*)"),
                React.createElement("input", {value:r.nccIn, placeholder:"Gõ để tìm NCC...",
                  onFocus:()=>setNccSugIdx(i),
                  onBlur:()=>setTimeout(()=>setNccSugIdx(v=>v===i?null:v), 150),
                  onChange:e=>{
                    setNccSugIdx(i);
                    setWhInRows(xs=>xs.map((x,k)=>k===i?{...x,nccIn:e.target.value}:x));
                  },
                  style:{fontSize:'16px'}, className:`mt-0.5 w-full rounded-lg border px-2 py-1.5 text-sm focus:border-[#fed7aa] focus:outline-none ${r.slNhap>0&&!r.nccIn.trim()?"border-amber-300 bg-amber-50":"border-slate-200"}`}),
                nccSugIdx===i && sugs.length>0 && React.createElement("ul", {className:"absolute z-50 left-0 right-0 top-full mt-0.5 bg-white border border-[#fed7aa] rounded-xl shadow-lg max-h-52 overflow-y-auto"},
                  sugs.map(name=>React.createElement("li", {key:name,
                    onMouseDown:e=>e.preventDefault(),
                    onClick:()=>{ setWhInRows(xs=>xs.map((x,k)=>k===i?{...x,nccIn:name}:x)); setNccSugIdx(null); },
                    className:"px-3 py-2.5 text-sm text-slate-700 active:bg-[#fff7ed] border-b border-slate-100 last:border-0 cursor-pointer"},
                    hilite(name))))));
          }))),
      React.createElement("div", {className:"shrink-0 p-4 border-t border-[#fed7aa] bg-[#fffbf5] safe-area-bottom"},
        React.createElement("button", {onClick:()=>doSaveWhIn(selectedOrder),
          className:"w-full py-3 bg-[#92400e] text-white rounded-xl font-semibold text-sm active:opacity-80"},
          "Xác nhận nhập kho"))),
    /* Overlay giao từng phần */
    showPartialDlv && selectedOrder && React.createElement("div", {className:"absolute inset-0 z-[100] bg-white flex flex-col"},
      React.createElement("div", {className:"shrink-0 flex items-center justify-between px-4 py-3 bg-[#92400e]"},
        React.createElement("span", {className:"text-white font-semibold text-base"}, "Giao từng phần — "+selectedOrder.id),
        React.createElement("button", {onClick:()=>setShowPartialDlv(false), className:"text-white/80"},
          React.createElement(X, {className:"h-6 w-6"}))),
      React.createElement("div", {className:"flex-1 overflow-y-auto p-4 space-y-3"},
        (selectedOrder.items||[]).map((it, i) => {
          const remaining = (it.qty||0) - (it.deliveredQty||0);
          if (remaining <= 0) return React.createElement("div", {key:i, className:"bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center justify-between opacity-50"},
            React.createElement("span", {className:"text-sm text-slate-500"}, it.name),
            React.createElement("span", {className:"text-xs text-green-600 font-semibold"}, "Đã giao hết"));
          return React.createElement("div", {key:i, className:"bg-[#fffbf5] border border-[#fed7aa] rounded-xl p-3 space-y-2"},
            React.createElement("div", {className:"text-sm font-semibold text-[#7c2d12]"}, it.name),
            React.createElement("div", {className:"text-xs text-slate-400"}, `Còn lại: ${remaining} / Tổng: ${it.qty}`),
            React.createElement("div", {className:"flex items-center gap-3"},
              React.createElement("label", {className:"text-xs text-slate-500 shrink-0"}, "SL giao"),
              React.createElement("div", {className:"flex items-center gap-2"},
                React.createElement("button", {
                  onClick:()=>setPartialDlvQtys(q=>({...q,[i]:Math.max(0,(q[i]||0)-1)})),
                  className:"w-8 h-8 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center text-lg font-bold active:bg-slate-200"
                }, "−"),
                React.createElement("input", {
                  type:"number", inputMode:"numeric",
                  value: partialDlvQtys[i]||0,
                  onFocus: e=>e.target.select(),
                  onChange: e=>setPartialDlvQtys(q=>({...q,[i]:Math.min(remaining,Math.max(0,parseInt(e.target.value)||0))})),
                  style:{fontSize:'16px'}, className:"w-14 text-center rounded-lg border border-slate-200 px-2 py-1.5 text-sm focus:border-[#fed7aa] focus:outline-none"}),
                React.createElement("button", {
                  onClick:()=>setPartialDlvQtys(q=>({...q,[i]:Math.min(remaining,(q[i]||0)+1)})),
                  className:"w-8 h-8 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center text-lg font-bold active:bg-slate-200"
                }, "+"))));
        })),
      React.createElement("div", {className:"shrink-0 p-4 border-t border-[#fed7aa] bg-[#fffbf5] safe-area-bottom"},
        React.createElement("button", {onClick:()=>doConfirmPartial(selectedOrder),
          className:"w-full py-3 bg-[#92400e] text-white rounded-xl font-semibold text-sm active:opacity-80"},
          "Xác nhận giao"))),
    /* Print menu bottom sheet */
    showPrintMenu && selectedOrder && React.createElement("div", {className:"absolute inset-0 z-[100] bg-black/40 flex items-end",
      onClick:()=>setShowPrintMenu(false)},
      React.createElement("div", {className:"w-full bg-white rounded-t-2xl p-5 space-y-3 safe-area-bottom", onClick:e=>e.stopPropagation()},
        React.createElement("div", {className:"flex items-center justify-between mb-1"},
          React.createElement("span", {className:"font-semibold text-[#7c2d12]"}, "In — "+selectedOrder.id),
          React.createElement("button", {onClick:()=>setShowPrintMenu(false), className:"text-slate-400"},
            React.createElement(X, {className:"h-5 w-5"}))),
        React.createElement("button", {onClick:()=>doOpenPrint(selectedOrder,"xac-nhan"),
          className:"w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-[#fed7aa] bg-[#ffedd5] active:opacity-75"},
          React.createElement(Printer, {className:"h-4 w-4 text-[#92400e]"}),
          React.createElement("span", {className:"text-sm font-medium text-[#92400e]"}, "Xác nhận đặt hàng")),
        React.createElement("button", {onClick:()=>doOpenPrint(selectedOrder,"phieu-giao-gia"),
          className:"w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-[#fed7aa] bg-[#ffedd5] active:opacity-75"},
          React.createElement(Printer, {className:"h-4 w-4 text-[#92400e]"}),
          React.createElement("span", {className:"text-sm font-medium text-[#92400e]"}, "Phiếu giao hàng (có giá)")),
        React.createElement("button", {onClick:()=>doOpenPrint(selectedOrder,"phieu-giao"),
          className:"w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 active:opacity-75"},
          React.createElement(Printer, {className:"h-4 w-4 text-slate-500"}),
          React.createElement("span", {className:"text-sm font-medium text-slate-600"}, "Phiếu giao hàng (không giá)"))))
    );
}


/* ───────── App wrapper với Auth ───────── */
function AppWithAuth() {
  const { user, profile, logout } = useAuth();
  const isMobile = useIsMobile();
  if (user === undefined) return React.createElement("div", { className: "min-h-screen flex items-center justify-center text-slate-400" }, "Đang tải...");
  if (!user) return React.createElement(LoginScreen, null);
  if (isMobile) return React.createElement(MobileApp, { profile, logout });
  return React.createElement(App, { profile, logout });
}

export default function Root() {
  return React.createElement(AuthProvider, null, React.createElement(AppWithAuth, null));
}
