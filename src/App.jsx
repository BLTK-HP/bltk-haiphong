import React, { useState, useMemo, useEffect } from 'react'
import PRODUCTS from './products.js'
import { useCollection, saveDoc, deleteDocument, batchSave } from './useFirestore.js'
import { collection, getDocs, deleteDoc, doc as fsDoc } from 'firebase/firestore'
import { db } from './firebase.js'
import { AuthProvider, useAuth, ROLES, ALLOWED, createUserProfile } from './useAuth.js'
import { auth } from './firebase.js'
import { createUserWithEmailAndPassword } from 'firebase/auth'


import { LayoutDashboard, ShoppingCart, Package, Truck, RotateCcw, BookText, Wallet, BarChart3, Smartphone, Plus, Minus, Search, Trash2, ArrowLeft, ArrowLeftRight, TrendingUp, ChevronRight, ChevronLeft, FileText, Globe, Sparkles, Store, Percent, CreditCard, UserCog, Printer, Pencil, ArrowDownToLine, Check, Save, Eye, Warehouse, Upload, ChevronDown, X, Users, Image as ImageIcon, AlertTriangle, Copy, Settings, ArrowUpFromLine, Building2, PackageSearch, Layers, CornerUpLeft, RefreshCw, ReceiptText, Link2 } from 'lucide-react'
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
const ORDER_TABS = ["Tất cả", "Chờ giao hàng", "Chờ xử lý", "Hoàn thành", "Huỷ"];
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
  const custExpTotal = (o.custExpenses||[]).reduce((s,e) => s+(e.amount||0), 0) + (o.shippingFee||0) + (o.returnFee||0);
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
  const orderStatus = isCancel ? "Huỷ"
    : hasReturn ? "Hoàn hàng"
    : (payDone && khoXong) ? "Hoàn thành"
    : o.deliveryConfirmed ? "Chờ xử lý"
    : "Chờ giao hàng";
  const profit = o.imported && o.exported ? total - (o.expense || 0) - totalCost - (o.importExpense || 0) : null;
  return { total, totalCost, remaining, pay, orderStatus, profit };
}
const CUSTOMERS = [
  {id:"KH001", name:"Anh Châu",   phone:"0989145440", addr:"5B/24/17 Khúc Thừa Dụ"},
  {id:"KH002", name:"Thuý Phạm",  phone:"0943460568", addr:"15/116 Nguyễn Đức Cảnh"},
  {id:"KH003", name:"Chú Thiệp",  phone:"0988590148", addr:"69/132 đường Vòng Vạn Mỹ"},
];

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
  settings_print: "Cấu hình mẫu in",
  admin_clear: "Xóa dữ liệu test"
};

/* ───────── atoms ───────── */
const Pill = ({
  map,
  value
}) => /*#__PURE__*/React.createElement("span", {
  className: `inline-flex items-center whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${map[value] || "bg-slate-100 text-slate-600 ring-slate-200"}`
}, value);
const field = "rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700 focus:border-[#92400e] focus:outline-none";
const inputF = "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:border-[#92400e] focus:outline-none focus:ring-1 focus:ring-[#fde68a]";
const inputSm = "w-full rounded-md border border-slate-200 px-2 py-1.5 text-sm focus:border-[#92400e] focus:outline-none";

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
  minW
}) => /*#__PURE__*/React.createElement("div", {
  className: "overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm",
  style: {position: "relative"}
}, /*#__PURE__*/React.createElement("table", {
  className: "w-full text-sm tbl-list",
  style: minW ? {
    minWidth: minW
  } : undefined
}, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", {
  className: "border-b border-slate-100 bg-amber-50 text-left text-xs uppercase tracking-wide text-amber-900/60"
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
  className: `-mb-px whitespace-nowrap border-b-2 px-3 py-2 text-[14px] transition ${active === t ? "border-[#92400e] font-medium text-[#92400e]" : "border-transparent text-slate-500 hover:text-slate-700"}`
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
const addBtn = "inline-flex items-center gap-1.5 rounded-lg border border-[#92400e] bg-white px-3 py-1.5 text-[14px] font-semibold text-[#92400e] hover:bg-[#fef3c7]";
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
  from = localMonthStart(),
  to = localToday(),
  onFilter,
  onExport,
  extra
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: "flex flex-wrap items-end gap-2"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: "mb-1 block text-[13px] font-medium text-slate-500"
  }, "Từ ngày"), /*#__PURE__*/React.createElement("input", {
    type: "date",
    defaultValue: from,
    className: field
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: "mb-1 block text-[13px] font-medium text-slate-500"
  }, "Đến ngày"), /*#__PURE__*/React.createElement("input", {
    type: "date",
    defaultValue: to,
    className: field
  })), setQ && /*#__PURE__*/React.createElement("div", {
    className: "min-w-[200px] flex-1"
  }, /*#__PURE__*/React.createElement("label", {
    className: "mb-1 block text-[13px] font-medium text-slate-500"
  }, "Tìm kiếm"), /*#__PURE__*/React.createElement("input", {
    value: q,
    onChange: e => setQ(e.target.value),
    placeholder: placeholder,
    className: `${field} w-full`
  })), extra, onFilter !== undefined && /*#__PURE__*/React.createElement("button", {
    onClick: onFilter,
    className: blueBtn + " py-2"
  }, /*#__PURE__*/React.createElement(Search, {
    className: "h-4 w-4"
  }), " Lọc"), /*#__PURE__*/React.createElement(PrintBtn, null), onExport && /*#__PURE__*/React.createElement(ExportBtn, {
    onClick: onExport
  }));
}

/* ── Bank accounts context (shared Finance ↔ Settings) ── */
const INIT_BANK_ACCOUNTS = [
  {id:1, key:"TCB-CTY",  bank:"TCB-CTY BLTK HP", account:"02", owner:"CÔNG TY BTLK HP", branch:"", note:"", openBal:0, status:"Hoạt động"},
  {id:2, key:"TCB-PAT",  bank:"TCB-PAT",          account:"01", owner:"PAT",              branch:"", note:"", openBal:0, status:"Hoạt động"},
  {id:3, key:"Tiền mặt", bank:"TIEN MAT",         account:"TM", owner:"Tiền mặt",         branch:"", note:"", openBal:0, status:"Hoạt động"},
];
const BankCtx = React.createContext(null);
const useBankAccounts = () => React.useContext(BankCtx);
const TxnCtx = React.createContext(null);
const useTxns = () => React.useContext(TxnCtx);
const InvCtx = React.createContext({whInItems: [], setWhInItems: () => {}, whOutItems: [], setWhOutItems: () => {}});
const useInventory = () => React.useContext(InvCtx);
const DocNumCtx = React.createContext(null);
const useDocNum = () => React.useContext(DocNumCtx);
const yr2 = () => String(new Date().getFullYear()).slice(-2);
const fmtDocId = (prefix, num) => prefix + yr2() + String(num).padStart(4, "0");

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
function Dashboard({ orders = [], purchaseList = [] }) {
  const { txns = [] }         = useTxns()         || {};
  const { bankAccounts = [] } = useBankAccounts() || {};
  const { whInItems = [] }    = useInventory()    || {};

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

  const plMap = {};
  purchaseList.forEach(r => { plMap[r.lot + "__" + r.prod] = r; });

  const allActive = orders.filter(o => !o.draft && o.orderStatus !== 'Huỷ' && o.orderStatus !== 'Hủy');
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

  // ── GIAO DỊCH HÀNG HOÁ (all-time — hiển thị trạng thái hiện tại, không lọc theo kỳ) ──────
  const deliveredOrders = allActive.filter(o => o.deliveryConfirmed || o.exported);
  const depositOrders   = allActive.filter(o => calc(o).pay === "Đã đặt cọc");
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
  const custDebt  = {};
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

  // ── LỢI NHUẬN (Accrual) ───────────────────────────────────────────────────
  const expOrders     = allActive.filter(o => o.deliveryConfirmed || o.exported);
  const accrualRev    = expOrders.reduce((s,o) => s + calc(o).total, 0);
  const accrualCOGS   = expOrders.reduce((s,o) => s + calc(o).totalCost, 0);
  const accrualShip       = expOrders.reduce((s,o) => s + (o.importExpense||0), 0);
  const accrualExp        = expOrders.reduce((s,o) => s + (o.expense||0), 0);
  const accrualCompShip   = expOrders.reduce((s,o) => s + (o.compCosts||[]).filter(c=>c.type==="Chi phí Ship hàng").reduce((cs,c)=>cs+(c.amount||0),0), 0);
  const accrualCompComm   = expOrders.reduce((s,o) => s + (o.compCosts||[]).filter(c=>c.type==="Chi phí hoa hồng").reduce((cs,c)=>cs+(c.amount||0),0), 0);
  const accrualCompInst   = expOrders.reduce((s,o) => s + (o.compCosts||[]).filter(c=>c.type==="Chi phí lắp đặt").reduce((cs,c)=>cs+(c.amount||0),0), 0);
  const accrualCPBH       = accrualShip + accrualExp + accrualCompShip + accrualCompComm + accrualCompInst;
  const accrualProfit     = accrualRev - accrualCOGS - accrualCPBH;
  const margin        = accrualRev > 0 ? Math.round(accrualProfit*1000/accrualRev)/10 : 0;

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
      /*#__PURE__*/React.createElement("div", null,
        /*#__PURE__*/React.createElement("label", {className:"mb-1 block text-[13px] font-medium text-slate-500"}, "Từ ngày"),
        /*#__PURE__*/React.createElement("input", {type:"date", value:fromDate, onChange:e=>setFromDate(e.target.value), className:field})
      ),
      /*#__PURE__*/React.createElement("div", null,
        /*#__PURE__*/React.createElement("label", {className:"mb-1 block text-[13px] font-medium text-slate-500"}, "Đến ngày"),
        /*#__PURE__*/React.createElement("input", {type:"date", value:toDate, onChange:e=>setToDate(e.target.value), className:field})
      ),
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
        /*#__PURE__*/React.createElement("div", {className:"rounded-xl border border-emerald-200 bg-white p-4"},
          /*#__PURE__*/React.createElement("div", {className:"mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-emerald-700"},
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
        /*#__PURE__*/React.createElement("div", {className:"rounded-xl border border-rose-200 bg-white p-4"},
          /*#__PURE__*/React.createElement("div", {className:"mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-rose-700"},
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
        /*#__PURE__*/React.createElement("div", {className:"rounded-xl border border-blue-200 bg-white p-4"},
          /*#__PURE__*/React.createElement("div", {className:"mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-blue-700"},
            /*#__PURE__*/React.createElement(CreditCard, {className:"h-3.5 w-3.5"}), "Số dư tài khoản"
          ),
          /*#__PURE__*/React.createElement("p", {className:"text-2xl font-bold text-blue-700 tabular-nums"}, totalBal > 0 ? vnd(totalBal) : "—"),
          /*#__PURE__*/React.createElement("p", {className:"mt-0.5 mb-3 text-xs text-slate-400"}, accBals.length > 0 ? accBals.length + " tài khoản đang hoạt động" : "Chưa có tài khoản"),
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
        /*#__PURE__*/React.createElement("div", {className:"rounded-xl border border-emerald-200 bg-white p-4"},
          /*#__PURE__*/React.createElement("div", {className:"mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-emerald-700"},
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
              /*#__PURE__*/React.createElement("p", {className:"text-sm font-bold text-emerald-600 tabular-nums"},
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
        /*#__PURE__*/React.createElement("div", {className:"rounded-xl border border-amber-200 bg-white p-4"},
          /*#__PURE__*/React.createElement("div", {className:"mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-amber-700"},
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
              /*#__PURE__*/React.createElement("p", {className:"text-sm font-bold text-amber-600 tabular-nums"},
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
        /*#__PURE__*/React.createElement("div", {className:"rounded-xl border border-blue-200 bg-white p-4"},
          /*#__PURE__*/React.createElement("div", {className:"mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-blue-700"},
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
              /*#__PURE__*/React.createElement("p", {className:"text-sm font-bold text-blue-700 tabular-nums"}, nccTotal > 0 ? vnd(nccTotal) : "—")
            )
          ),
          /*#__PURE__*/React.createElement("div", {className:"space-y-1.5"},
            kv("Đã thanh toán", nccPaid),
            kv("Còn phải trả", Math.max(0, nccTotal-nccPaid), "text-[#B91C1C]")
          )
        ),

        /* Tồn kho */
        /*#__PURE__*/React.createElement("div", {className:"rounded-xl border border-amber-200 bg-white p-4"},
          /*#__PURE__*/React.createElement("div", {className:"mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-amber-700"},
            /*#__PURE__*/React.createElement(Layers, {className:"h-3.5 w-3.5"}), "Tồn kho hiện tại"
          ),
          /*#__PURE__*/React.createElement("p", {className:"text-2xl font-bold text-amber-600 tabular-nums"}, stockVal > 0 ? vnd(stockVal) : "—"),
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
          /*#__PURE__*/React.createElement("div", {className:"mb-3 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-blue-600"},
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
              ? /*#__PURE__*/React.createElement("span", {className:"font-bold tabular-nums text-blue-700"}, vnd(totalNccDebt))
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
              /*#__PURE__*/React.createElement("p", {className:"text-2xl font-bold text-slate-800"}, returnedOrders.length, /*#__PURE__*/React.createElement("span", {className:"text-sm font-normal text-slate-500 ml-1"}, "đơn"))
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
                ? /*#__PURE__*/React.createElement("span", {className:"tabular-nums font-medium text-amber-700"}, vnd(pendingRefund))
                : /*#__PURE__*/React.createElement("span", {className:"text-slate-300"}, "—")
            ),
            /*#__PURE__*/React.createElement("div", {className:"flex justify-between items-center text-sm"},
              /*#__PURE__*/React.createElement("span", {className:"text-slate-500"}, "Hàng nhập lại kho"),
              importedToStock > 0
                ? /*#__PURE__*/React.createElement("span", {className:"tabular-nums font-medium text-blue-600"}, vnd(importedToStock))
                : /*#__PURE__*/React.createElement("span", {className:"text-slate-300"}, "—")
            )
          )
        ),

        /* Trả hàng NCC */
        /*#__PURE__*/React.createElement("div", {className:"rounded-xl border border-slate-200 bg-white p-4"},
          /*#__PURE__*/React.createElement("div", {className:"mb-3 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-600"},
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
        secHd("Lợi nhuận", "Kế toán · Accrual")
      ),
      /*#__PURE__*/React.createElement("p", {className:"mb-3 text-xs italic text-slate-400"}, "Tính theo toàn bộ đơn đã giao (gồm cả phần chưa thu tiền) — khác với dòng tiền thực ở mục Tài Chính."),
      /*#__PURE__*/React.createElement("div", {className:"grid grid-cols-2 gap-3 lg:grid-cols-4"},

        /* Doanh thu */
        /*#__PURE__*/React.createElement("div", {className:"rounded-xl border-l-4 border-blue-400 bg-white p-4 shadow-sm"},
          /*#__PURE__*/React.createElement("div", {className:"mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-blue-700"},
            /*#__PURE__*/React.createElement(ShoppingCart, {className:"h-3.5 w-3.5"}), "Doanh thu"
          ),
          /*#__PURE__*/React.createElement("p", {className:"text-2xl font-bold text-blue-700 tabular-nums"}, accrualRev > 0 ? vnd(accrualRev) : "—"),
          /*#__PURE__*/React.createElement("p", {className:"mt-1 text-xs text-slate-400"}, expOrders.length + " đơn đã giao")
        ),

        /* Giá vốn */
        /*#__PURE__*/React.createElement("div", {className:"rounded-xl border-l-4 border-slate-300 bg-white p-4 shadow-sm"},
          /*#__PURE__*/React.createElement("div", {className:"mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-600"},
            /*#__PURE__*/React.createElement(Package, {className:"h-3.5 w-3.5"}), "Giá vốn hàng bán"
          ),
          /*#__PURE__*/React.createElement("p", {className:"text-2xl font-bold text-slate-700 tabular-nums"}, accrualCOGS > 0 ? "−"+vnd(accrualCOGS) : "—"),
          /*#__PURE__*/React.createElement("p", {className:"mt-1 text-xs text-slate-400"}, "Chi phí hàng đã bán")
        ),

        /* CPBH */
        /*#__PURE__*/React.createElement("div", {className:"rounded-xl border-l-4 border-amber-300 bg-white p-4 shadow-sm"},
          /*#__PURE__*/React.createElement("div", {className:"mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-amber-700"},
            /*#__PURE__*/React.createElement(ReceiptText, {className:"h-3.5 w-3.5"}), "Chi phí bán hàng"
          ),
          /*#__PURE__*/React.createElement("p", {className:"text-2xl font-bold text-amber-700 tabular-nums"}, accrualCPBH > 0 ? "−"+vnd(accrualCPBH) : "—"),
          /*#__PURE__*/React.createElement("div", {className:"mt-2 space-y-1"},
            /*#__PURE__*/React.createElement("div", {className:"flex justify-between text-xs"},
              /*#__PURE__*/React.createElement("span", {className:"text-slate-500"}, "Vận chuyển nhập"),
              accrualShip > 0 ? /*#__PURE__*/React.createElement("span", {className:"tabular-nums"}, vnd(accrualShip)) : /*#__PURE__*/React.createElement("span", {className:"text-slate-300"}, "—")
            ),
            /*#__PURE__*/React.createElement("div", {className:"flex justify-between text-xs"},
              /*#__PURE__*/React.createElement("span", {className:"text-slate-500"}, "Ship hàng"),
              accrualCompShip > 0 ? /*#__PURE__*/React.createElement("span", {className:"tabular-nums"}, vnd(accrualCompShip)) : /*#__PURE__*/React.createElement("span", {className:"text-slate-300"}, "—")
            ), /*#__PURE__*/React.createElement("div", {className:"flex justify-between text-xs py-0.5"},
              /*#__PURE__*/React.createElement("span", {className:"text-slate-500"}, "Hoa hồng"),
              accrualCompComm > 0 ? /*#__PURE__*/React.createElement("span", {className:"tabular-nums"}, vnd(accrualCompComm)) : /*#__PURE__*/React.createElement("span", {className:"text-slate-300"}, "—")
            ), /*#__PURE__*/React.createElement("div", {className:"flex justify-between text-xs py-0.5"},
              /*#__PURE__*/React.createElement("span", {className:"text-slate-500"}, "Lắp đặt"),
              accrualCompInst > 0 ? /*#__PURE__*/React.createElement("span", {className:"tabular-nums"}, vnd(accrualCompInst)) : /*#__PURE__*/React.createElement("span", {className:"text-slate-300"}, "—")
            ), /*#__PURE__*/React.createElement("div", {className:"flex justify-between text-xs py-0.5"},
              /*#__PURE__*/React.createElement("span", {className:"text-slate-500"}, "Chi phí khác"),
              accrualExp > 0 ? /*#__PURE__*/React.createElement("span", {className:"tabular-nums"}, vnd(accrualExp)) : /*#__PURE__*/React.createElement("span", {className:"text-slate-300"}, "—")
            )
          )
        ),

        /* Lợi nhuận */
        /*#__PURE__*/React.createElement("div", {className:"rounded-xl border-l-4 "+(accrualProfit > 0 ? "border-emerald-400" : "border-rose-400")+" bg-white p-4 shadow-sm"},
          /*#__PURE__*/React.createElement("div", {className:"mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide "+(accrualProfit >= 0 ? "text-emerald-700" : "text-rose-700")},
            /*#__PURE__*/React.createElement(Sparkles, {className:"h-3.5 w-3.5"}), "Lợi nhuận"
          ),
          /*#__PURE__*/React.createElement("p", {className:"text-2xl font-bold tabular-nums "+(accrualProfit > 0 ? "text-emerald-600" : accrualProfit < 0 ? "text-[#B91C1C]" : "text-slate-700")},
            accrualProfit !== 0 ? vnd(Math.abs(accrualProfit)) : "—"
          ),
          /*#__PURE__*/React.createElement("p", {className:"mt-1 text-xs text-slate-400"},
            accrualRev > 0 ? "Biên LN: "+margin+"% · DT − GV − CPBH" : "Chưa có đơn đã giao"
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
  const {docNums, setDocNums} = useDocNum();
  const nextId = (prefix) => {
    const row = docNums.find(r => r.prefix === prefix);
    const num = row ? row.num : 1;
    if (setDocNums) setDocNums(ds => ds.map(r => r.prefix === prefix ? {...r, num: r.num + 1} : r));
    return fmtDocId(prefix, num);
  };
  const addOrder = (o, asDraft) => {
    const id = o.id && !asDraft ? o.id : (asDraft ? nextId("BG") : nextId("DH"));
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
      onSaveEdit: o => saveEdit(eo.id, o),
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
    onOpenOrder: id => setView({edit: id})
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
            staff: "NGOC HA",
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
          staff: "NGOC HA"
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
  const [kind, setKind] = useState(initial?.kind || "Đặt cọc");
  const [amount, setAmount] = useState(initial?.amount || 0);
  const handleKind = s => {
    setKind(s);
    if (s === "Thanh toán" && remaining > 0) setAmount(remaining);
  };
  const [account, setAccount] = useState(initial?.account || accounts[0]);
  const [note, setNote] = useState(initial?.note || "");
  const lbl = "mb-1 block text-[13px] font-medium text-slate-500";
  const inp = "w-full rounded-md border border-slate-200 px-2.5 py-1.5 text-sm focus:border-[#92400e] focus:outline-none";
  return /*#__PURE__*/React.createElement(Modal, {
    title: "Thêm thanh toán",
    sub: "Mỗi khoản thu sẽ sinh 1 phiếu thu link sang Tài chính",
    maxW: "max-w-lg",
    onClose: onClose,
    footer: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("button", {
      onClick: onClose,
      className: "rounded-lg border border-slate-200 px-3.5 py-2 text-sm text-slate-600 hover:bg-slate-50"
    }, "Huỷ"), /*#__PURE__*/React.createElement("button", {
      onClick: () => { const _now = new Date(); onConfirm({kind, amount, account, note, staff: "NGOC HA", date: _now.toLocaleDateString("vi-VN"), datetime: _now.toLocaleTimeString("vi-VN",{hour:"2-digit",minute:"2-digit",second:"2-digit"}) + " " + _now.toLocaleDateString("vi-VN")}); },
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
          date: dateIn, order: order.id, staff: "NGOC HA", pay: "Chưa thanh toán",
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
  const fi = "w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-[#92400e] focus:outline-none";
  const ic = cls => "rounded-lg border border-slate-200 px-1.5 py-1.5 text-sm text-center focus:border-[#92400e] focus:outline-none " + (cls || "");
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
                    className: "rounded-lg border border-slate-200 px-2 py-1.5 text-xs w-36 focus:border-[#92400e] focus:outline-none " + (lockOut ? "bg-slate-100 text-slate-400" : ""),
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
  const sm = "w-full rounded-md border border-slate-200 px-2 py-1 text-sm focus:border-[#92400e] focus:outline-none";
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
                ? "border-[#92400e] bg-[#fef9f0] text-[#92400e]"
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
  onKho,
  onReturn
}) {
  const notify = useToast();
  const [q, setQ] = useState("");
  const [doc, setDoc] = useState(null);
  const [fDelivery, setFDelivery] = useState("Tất cả");
  const [fPayment, setFPayment] = useState("Tất cả");
  const [fStatus, setFStatus] = useState("Tất cả");
  const [fStaff, setFStaff] = useState("Tất cả");
  const [fromDate, setFromDate] = useState(localMonthStart());
  const [toDate, setToDate] = useState(localToday());
  const staffList = ["Tất cả", ...new Set(orders.map(o => o.staff))];
  const parseISO = s => { const [y,m,d] = s.split('-'); return new Date(+y,+m-1,+d); };
  const fromD = fromDate ? parseISO(fromDate) : null;
  const toD   = toDate   ? parseISO(toDate)   : null;
  const rows = orders.filter(o => {
    if (fromD || toD) { const d = parseViDate(o.dt); if (fromD && d < fromD) return false; if (toD && d > toD.setHours(23,59,59)) return false; }
    if (fDelivery !== "Tất cả" && o.delivery !== fDelivery) return false;
    if (fPayment !== "Tất cả" && calc(o).pay !== fPayment) return false;
    if (fStatus !== "Tất cả" && calc(o).orderStatus !== fStatus) return false;
    if (fStaff !== "Tất cả" && o.staff !== fStaff) return false;
    if (q && !`${o.id} ${o.name} ${o.phone}`.toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  }).sort((a,b) => parseViDate(b.dt) - parseViDate(a.dt));
  const onExport = () => exportCSV("danh-sach-don-hang", ["Số ĐH", "Ngày", "Khách hàng", "SĐT", "Địa chỉ", "Thành tiền", "Đã trả", "Còn lại", "Giao hàng", "Trạng thái", "Nhân viên"], rows.map(o => {
    const c = calc(o);
    return [o.id, o.dt, o.name, o.phone, o.addr, c.total, o.paid, c.remaining, o.delivery, c.orderStatus, o.staff];
  }));
  return /*#__PURE__*/React.createElement("div", {
    className: "space-y-4"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex flex-wrap items-center justify-end gap-2"
  }, /*#__PURE__*/React.createElement("button", {
    onClick: onNew,
    className: blueBtn
  }, /*#__PURE__*/React.createElement(Plus, {
    className: "h-4 w-4"
  }), " Tạo đơn hàng"), /*#__PURE__*/React.createElement(ExportBtn, {
    onClick: onExport
  })), /*#__PURE__*/React.createElement("div", {
    className: "flex flex-wrap items-end gap-3 rounded-xl border border-slate-200 bg-white p-3"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: "mb-1 block text-[13px] font-medium text-slate-500"
  }, "Từ ngày"), /*#__PURE__*/React.createElement("input", {
    type: "date",
    value: fromDate,
    onChange: e => setFromDate(e.target.value),
    className: field
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: "mb-1 block text-[13px] font-medium text-slate-500"
  }, "Đến ngày"), /*#__PURE__*/React.createElement("input", {
    type: "date",
    value: toDate,
    onChange: e => setToDate(e.target.value),
    className: field
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: "mb-1 block text-[13px] font-medium text-slate-500"
  }, "Giao hàng"), /*#__PURE__*/React.createElement("select", {
    value: fDelivery,
    onChange: e => setFDelivery(e.target.value),
    className: field
  }, ["Tất cả", "Đã giao hàng", "Chưa giao hàng"].map(s => /*#__PURE__*/React.createElement("option", {
    key: s
  }, s)))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: "mb-1 block text-[13px] font-medium text-slate-500"
  }, "Thanh toán"), /*#__PURE__*/React.createElement("select", {
    value: fPayment,
    onChange: e => setFPayment(e.target.value),
    className: field
  }, ["Tất cả", "Đã thanh toán", "Đã đặt cọc", "Chờ thanh toán"].map(s => /*#__PURE__*/React.createElement("option", {
    key: s
  }, s)))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: "mb-1 block text-[13px] font-medium text-slate-500"
  }, "Trạng thái"), /*#__PURE__*/React.createElement("select", {
    value: fStatus,
    onChange: e => setFStatus(e.target.value),
    className: field
  }, ORDER_TABS.map(s => /*#__PURE__*/React.createElement("option", {
    key: s
  }, s)))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: "mb-1 block text-[13px] font-medium text-slate-500"
  }, "Nhân viên"), /*#__PURE__*/React.createElement("select", {
    value: fStaff,
    onChange: e => setFStaff(e.target.value),
    className: field
  }, staffList.map(s => /*#__PURE__*/React.createElement("option", {
    key: s
  }, s)))), /*#__PURE__*/React.createElement("div", {
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
  }, /*#__PURE__*/React.createElement(React.Fragment, null, rows.map((o, ri) => {
    const c = calc(o);
    const isCancel = c.orderStatus === "Huỷ";
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
      style: { minWidth: 130, maxWidth: 130 }
    }, /*#__PURE__*/React.createElement("div", {
      className: "text-slate-800 truncate"
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
      className: `whitespace-nowrap px-3 py-3 text-right text-sm tabular-nums ${o.paid > 0 ? "text-[#D97706]" : "text-[#94A3B8]"}`
    }, o.paid > 0 ? num(o.paid) : ""), /*#__PURE__*/React.createElement("td", {
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
      value: o.delivery
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
    }))));
  }), (() => {
    const sumTotal = rows.reduce((s, o) => s + calc(o).total, 0);
    const sumPaid = rows.reduce((s, o) => s + (o.paid || 0), 0);
    const sumRemain = rows.reduce((s, o) => s + calc(o).remaining, 0);
    return /*#__PURE__*/React.createElement("tr", {
      className: "bg-[#fed7aa] font-semibold text-slate-800"
    }, /*#__PURE__*/React.createElement("td", {
      colSpan: 4,
      className: "px-3 py-3",
    }, "TỔNG CỘNG (", rows.length, " ĐƠN)"), /*#__PURE__*/React.createElement("td", {
      className: "whitespace-nowrap px-3 py-3 text-right text-sm tabular-nums text-[#92400e]", style: {fontWeight:700}
    }, num(sumTotal)), /*#__PURE__*/React.createElement("td", {
      className: `whitespace-nowrap px-3 py-3 text-right text-sm tabular-nums ${sumPaid > 0 ? "text-[#D97706]" : "text-[#94A3B8]"}`, style: {fontWeight:700}
    }, sumPaid > 0 ? num(sumPaid) : ""), /*#__PURE__*/React.createElement("td", {
      className: `whitespace-nowrap px-3 py-3 text-right text-sm tabular-nums ${sumRemain > 0 ? "text-[#B91C1C]" : "text-[#94A3B8]"}`, style: {fontWeight:700}
    }, sumRemain > 0 ? num(sumRemain) : ""), /*#__PURE__*/React.createElement("td", {
      colSpan: 6
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
  onEdit,
  onOpenOrder
}) {
  const notify = useToast();
  const [q, setQ] = useState("");
  const [doc, setDoc] = useState(null);
  const DSTATUS = {
    "Đã lên đơn": "bg-amber-50 text-[#92400e] ring-amber-200",
    "Chưa tạo đơn hàng": "bg-slate-100 text-slate-600 ring-slate-200",
  "Đã tạo đơn hàng": "bg-[#fef9f0] text-[#92400e] ring-[#b45309]"
  };
  const [fromDate, setFromDate] = useState(localMonthStart());
  const [toDate, setToDate] = useState(localToday());
  const _pISO = s => { const [y,m,d] = s.split("-"); return new Date(+y,+m-1,+d); };
  const _inR = (dt, f, t) => { const d = parseViDate(dt); return (!f || d >= _pISO(f)) && (!t || d <= new Date(_pISO(t).setHours(23,59,59))); };
  const rows = drafts.filter(o => _inR(o.dt, fromDate, toDate) && (!q || `${o.id} ${o.name} ${o.phone} ${o.desc || ""}`.toLowerCase().includes(q.toLowerCase()))).sort((a,b) => parseViDate(b.dt) - parseViDate(a.dt));
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
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: "mb-1 block text-[13px] font-medium text-slate-500"
  }, "Từ ngày"), /*#__PURE__*/React.createElement("input", {
    type: "date",
    value: fromDate, onChange: e => setFromDate(e.target.value),
    className: field
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: "mb-1 block text-[13px] font-medium text-slate-500"
  }, "Đến ngày"), /*#__PURE__*/React.createElement("input", {
    type: "date",
    value: toDate, onChange: e => setToDate(e.target.value),
    className: field
  })), /*#__PURE__*/React.createElement("div", {
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
  }, rows.map(o => /*#__PURE__*/React.createElement("tr", {
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
        "Diễn giải": o.desc || ""
      },
      items: o.items
    })
  }), /*#__PURE__*/React.createElement(IconBtn, {
    tone: "danger",
    icon: Trash2,
    title: "Xoá báo giá",
    onClick: () => onDelete(o.id)
  })))))), doc && /*#__PURE__*/React.createElement(DocModal, {
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
    (depositPrint > 0 ? mkSumRow("Đã đặt cọc:", fmt(depositPrint), false, "") : "")+
    (paidOnlyPrint > 0 ? mkSumRow("Đã thanh toán:", fmt(paidOnlyPrint), false, "") : "")+
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

  return "<!DOCTYPE html><html lang='vi'><head><meta charset='UTF-8'><title>"+TITLE+" - "+(order.id||"")+"</title><style>"
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
    +"<div class='no-print'><button onclick='window.print()' style='padding:7px 18px;background:#bfdbfe;color:#1e3a8a;border:none;border-radius:6px;cursor:pointer;font-size:13px;font-weight:600;'>🖨 In đơn hàng</button><button onclick='window.close()' style='padding:7px 18px;background:#e2e8f0;color:#1e293b;border:none;border-radius:6px;cursor:pointer;font-size:13px;'>← Quay lại</button></div>"
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
  <button onclick="window.print()" style="padding:7px 18px;background:#bfdbfe;color:#1e3a8a;border:none;border-radius:6px;cursor:pointer;font-size:13px;font-weight:600;">🖨 In / Xuất PDF</button>
  <button onclick="window.close()" style="margin-left:8px;padding:7px 18px;background:#e2e8f0;color:#1e293b;border:none;border-radius:6px;cursor:pointer;font-size:13px;">← Quay lại</button>
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
    kho: it.kho || "HH"
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
  const [payments, setPayments] = useState(editOrder?.payments || []);
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
  const [bottomTab, setBottomTab] = useState("payment");
  const [editReturnIdx, setEditReturnIdx] = useState(null);
  const [dupDismissed, setDupDismissed] = useState(false);
  const [showPhoneSug, setShowPhoneSug] = useState(false);
  const phoneSuggestions = React.useMemo(() => {
    const q = cust.phone.trim();
    if (q.length < 4) return [];
    const seen = new Set();
    return orders
      .filter(o => o.phone && o.phone.includes(q) && o.id !== (editOrder?.id || "") && !seen.has(o.phone) && seen.add(o.phone))
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
    if (_sdn) _sdn(ds => ds.map(r => r.prefix === "DH" ? {...r, num: r.num + 1} : r));
    return fmtDocId("DH", num);
  });
  const nowStr = () => { const d = new Date(), pad = n => String(n).padStart(2,"0"); return `${pad(d.getDate())}/${pad(d.getMonth()+1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`; };
  const effectiveOrderId = editOrder?.id || (!isDraft ? pendingOrderId : "");
  const autoAddTxn = (p) => {
    const nextId = _txns.length ? Math.max(..._txns.map(t=>t.id))+1 : 1;
    const d = new Date(), pad = n => String(n).padStart(2,"0");
    const dateStr = `${pad(d.getDate())}/${pad(d.getMonth()+1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
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
  const CHI_KIND_MAP = {"Hoàn tiền hàng":"Hoàn tiền KH","Chi phí Ship hàng":"Chi vận chuyển","Chi phí hoa hồng":"Chi hoa hồng","Chi phí lắp đặt":"Chi lắp đặt"};
  const autoAddChi = (type, amount, acc) => {
    const nextId = _txns.length ? Math.max(..._txns.map(t=>t.id))+1 : 1;
    const d = new Date(), pad = n => String(n).padStart(2,"0");
    const dateStr = `${pad(d.getDate())}/${pad(d.getMonth()+1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
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
  const [logs, setLogs] = useState(() => {
    if (!editOrder || editOrder.draft) return [];
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
  const custExpTotal = custExpenses.reduce((s,e) => s+e.amount, 0) + shippingFee + returnFee;
  const total = subtotal + custExpTotal;
  const deposit = payments.filter(p=>p.kind==="Đặt cọc").reduce((s,p)=>s+p.amount,0);
  const returnPaid = payments.filter(p=>p.kind==="Tiền hàng trả lại").reduce((s,p)=>s+p.amount,0);
  const paidOnly = payments.filter(p=>p.kind==="Thanh toán").reduce((s,p)=>s+p.amount,0);
  const discountExtra = payments.filter(p=>p.kind==="Giảm giá thêm").reduce((s,p)=>s+p.amount,0);
  const remaining = total - deposit - paidOnly - returnPaid - discountExtra;
  const payDone = total > 0 && remaining <= 0;
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
    staff: "PAT",
    paid,
    custExpenses,
    compCosts,
    shippingFee,
    returnFee,
    returns,
    note,
    delivery,
    orderStatus: cancelled ? "Huỷ" : "",
    deliveryConfirmed,
    imported,
    exported,
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
  const isBaoGia = isDraft || (isEdit && !!editOrder?.draft);
  const hasPaidOnBaoGia = isBaoGia && payments.length > 0;
  const saveLabel = isEdit && !editOrder?.draft ? " Lưu thay đổi" : isBaoGia ? " Lưu báo giá" : " Lưu đơn hàng";
  const onSaveClick = () => {
    setSaveTried(true);
    if (!isDraft && !custValid) return;
    if (isEdit) { onSaveEdit(build()); notify("✅ Đã lưu"); setTimeout(onBack, 800); }
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
              onClick: () => { setDeliveryConfirmed(true); setDelivery("Đã giao hàng"); },
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
          ...lines.map((l, i) => /*#__PURE__*/React.createElement("tr", {key: i, className: "align-middle", style: {backgroundColor: i%2===0?"#ffffff":"#f8fafc"}},
            /*#__PURE__*/React.createElement("td", {className: "px-3 py-2 border-b border-slate-100"},
              /*#__PURE__*/React.createElement(ProductPicker, {value: l.name, products: prods, onPick: p => setLine(i, p.sku||p.sale!==undefined?{name:p.name,price:p.sale??l.price,cost:p.cost??l.cost,list:p.list??l.list,unit:p.unit??l.unit}:{name:p.name})})),
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
              /*#__PURE__*/React.createElement("select", {className: "rounded border border-slate-200 bg-white px-1.5 py-1 text-xs text-slate-700 focus:outline-none focus:border-[#92400e]", value: l.kho||"HH", onChange: e => setLine(i,{kho:e.target.value})},
                /*#__PURE__*/React.createElement("option", null, "HH"),
                /*#__PURE__*/React.createElement("option", null, "HG"),
                /*#__PURE__*/React.createElement("option", null, "SR"))),
            /*#__PURE__*/React.createElement("td", {className: "px-3 py-2 border-b border-slate-100"},
              /*#__PURE__*/React.createElement("button", {onClick: () => setLines(ls => ls.filter((_,x)=>x!==i)), title: "Xoá", className: "rounded p-1.5 bg-amber-100 text-[#92400e] hover:bg-amber-200"},
                /*#__PURE__*/React.createElement(X, {className: "h-3.5 w-3.5"})))))))),
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
          /*#__PURE__*/React.createElement("dt", {className:"shrink-0 text-slate-500"}, "CP đổi trả"),
          /*#__PURE__*/React.createElement("dd", {className:"w-28"},
            /*#__PURE__*/React.createElement(NumInput, {value:returnFee, onChange:setReturnFee, className:"w-full border-0 bg-transparent px-0 py-0 text-right text-sm tabular-nums focus:outline-none"}))),
        /*#__PURE__*/React.createElement("div", {className:"my-2 border-t border-slate-200"}),
        /*#__PURE__*/React.createElement("div", {className:"flex justify-between"},
          /*#__PURE__*/React.createElement("dt", {className:"font-bold text-slate-800"}, "Tổng cộng"),
          /*#__PURE__*/React.createElement("dd", {className:"tabular-nums font-bold text-slate-900"}, vnd(total))),
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
        /*#__PURE__*/React.createElement("button", {onClick:()=>setPayModal(true), className:"flex-1 rounded-xl bg-[#92400e] py-2 text-sm font-medium text-white hover:bg-[#78350f]"}, "Thanh toán")))),
    /*#__PURE__*/React.createElement("div", {className:"flex-1 rounded-xl bg-white shadow-sm"},
      /*#__PURE__*/React.createElement("div", {className:"flex items-center justify-between h-14 px-4 border-b border-slate-200"},
        /*#__PURE__*/React.createElement("p", {className:"text-[13px] font-semibold text-[#92400e]"}, "Lịch sử thanh toán")),
      /*#__PURE__*/React.createElement("div", {className:"p-4"},
        payments.length === 0
          ? /*#__PURE__*/React.createElement("p", {className:"text-center text-sm text-slate-400"}, "Chưa có thanh toán")
          : /*#__PURE__*/React.createElement("div", {className:"space-y-2"},
              ...payments.map((p,i) => /*#__PURE__*/React.createElement("div", {key:i, className:"rounded-xl border border-[#92400e] bg-[#fef9f0]/60 px-3 py-2 text-xs"},
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
        /*#__PURE__*/React.createElement("button", {onClick:()=>{ setCcostType("Hoàn tiền hàng"); const rt=returns.reduce((s,r)=>s+(r.amount||0),0); setCcostAmt(rt||0); setCompCostModal(true); }, className:"flex items-center gap-1.5 rounded-lg border border-[#92400e] bg-white px-3 py-1.5 text-sm font-semibold text-[#92400e] hover:bg-[#fef3c7]"},
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
      /*#__PURE__*/React.createElement(NumInput, {value:cexpAmt, onChange:setCexpAmt, className:"w-full rounded-md border border-slate-200 px-2.5 py-1.5 text-sm focus:outline-none focus:border-[#92400e]"})))),
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
            const txnId=autoAddChi(ccostType,ccostAmt,ccostAcc);
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
      /*#__PURE__*/React.createElement("label", {className:"mb-1 block text-[13px] font-medium text-slate-500"}, "Số tiền"),
      /*#__PURE__*/React.createElement(NumInput, {value:ccostAmt, onChange:setCcostAmt, className:"w-full rounded-md border border-slate-200 px-2.5 py-1.5 text-sm focus:outline-none focus:border-[#92400e]"}))))
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
            staff: "NGOC HA",
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
          staff: "NGOC HA"
        })));
      }
    }
  })
  ),
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
        staff:"PAT", source:"hoankh", pay:"Không cần TT"
      })));
      addLog("return_confirmed", `Hoàn hàng ${activeRows.length} SP → ${store||"Kho HH"}, tổng: ${vnd(returnTotal)}đ`, "PAT");
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
  const sm = "w-full rounded-md border border-slate-200 px-2 py-1.5 text-sm focus:border-[#92400e] focus:outline-none";
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
      staff: editRecord.staff || "NGOC HA",
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
      /*#__PURE__*/React.createElement("div", null,
        /*#__PURE__*/React.createElement("label", {className: "mb-1 block text-[13px] font-medium text-slate-500"}, "Từ ngày"),
        /*#__PURE__*/React.createElement("input", {type: "date", value: fromDate, onChange: e => setFromDate(e.target.value), className: field})),
      /*#__PURE__*/React.createElement("div", null,
        /*#__PURE__*/React.createElement("label", {className: "mb-1 block text-[13px] font-medium text-slate-500"}, "Đến ngày"),
        /*#__PURE__*/React.createElement("input", {type: "date", value: toDate, onChange: e => setToDate(e.target.value), className: field})),
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
                staff: r.staff || "NGOC HA", pay: "Chưa thanh toán"
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
function WhIn({whInItems: items, setWhInItems: setItems, setWhOutItems, orders = [], purchaseList = [], setPurchaseList, initSearch = "", onMounted, onOpenOrder}) {
  const [q, setQ] = useState(initSearch);
  React.useEffect(() => { if (initSearch) setQ(initSearch); if (onMounted) onMounted(); }, []);
  const [doc, setDoc] = useState(null);
  const [orderModal, setOrderModal] = useState(null);
  const [slipModal, setSlipModal] = useState(null);
  const [nccReturnModal, setNccReturnModal] = useState(null);
  const [payModal, setPayModal] = useState(null);
  const [fSup, setFSup] = useState("Tất cả");
  const [fProd, setFProd] = useState("Tất cả");
  const {txns = [], setTxns} = useTxns() || {};
  const lotRemaining = r => { const tot=(r.costNcc+(r.fee||0))*r.qtyIn-(r.returns||[]).reduce((s,x)=>s+(x.amount||0),0); const paid=r.paid||(r.pay==="Đã thanh toán"?tot:0); return Math.max(0,tot-paid); };
  const nextTxnId = txns.length ? Math.max(...txns.map(t=>t.id))+1 : 1;
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
        delivery: "Hoàn NCC", staff: rec.staff || "PAT",
        source: "hoanncc", note: ret.note || ""
      }, ...xs]);
    }
    setNccReturnModal(null);
  };
  const supNames = ["Tất cả", ...Array.from(new Set(items.map(r => r.supplier).filter(Boolean)))];
  const prodNames = ["Tất cả", ...Array.from(new Set(items.map(r => r.prod).filter(Boolean)))];
  const rows = items.filter(r =>
    (fSup === "Tất cả" || r.supplier === fSup) &&
    (fProd === "Tất cả" || r.prod === fProd) &&
    (!q || `${impCode(r.lot)} ${r.prod} ${r.supplier}`.toLowerCase().includes(q.toLowerCase()))
  ).sort((a,b) => parseViDate(b.date) - parseViDate(a.date));
  const findOrder = id => orders.find(o => o.id === id || o.id.replace(/^Đ/i,"D") === id.replace(/^Đ/i,"D"));
  const openOrderDetail = id => { const o = findOrder(id); setOrderModal(o || {id, _notFound: true}); };
  const onExport = () => exportCSV("danh-sach-phieu-nhap-kho", ["Kho", "Số phiếu nhập", "Số đơn hàng", "Ngày nhập", "Sản phẩm", "SL nhập", "SL còn", "Đơn giá", "CPMH", "Giá vốn", "Thành tiền", "Nhà cung cấp", "Người tạo"], rows.map(r => [r.store, impCode(r.lot), r.order || "", r.date, r.prod, r.qtyIn, r.qtyNow, r.costNcc, r.fee || 0, r.costNcc + (r.fee || 0), (r.costNcc + (r.fee || 0)) * r.qtyIn, r.supplier, r.staff]));
  const nccExtra = /*#__PURE__*/React.createElement(React.Fragment, null,
    /*#__PURE__*/React.createElement("div", null,
      /*#__PURE__*/React.createElement("label", {className: "mb-1 block text-[13px] font-medium text-slate-500"}, "Sản phẩm"),
      /*#__PURE__*/React.createElement("select", {value: fProd, onChange: e => setFProd(e.target.value), className: `${field} max-w-[200px]`},
        prodNames.map(s => /*#__PURE__*/React.createElement("option", {key: s}, s)))),
    /*#__PURE__*/React.createElement("div", null,
      /*#__PURE__*/React.createElement("label", {className: "mb-1 block text-[13px] font-medium text-slate-500"}, "Nhà cung cấp"),
      /*#__PURE__*/React.createElement("select", {value: fSup, onChange: e => setFSup(e.target.value), className: field},
        supNames.map(s => /*#__PURE__*/React.createElement("option", {key: s}, s)))));
  return /*#__PURE__*/React.createElement("div", {
    className: "space-y-4"
  }, /*#__PURE__*/React.createElement(RangeBar, {
    q: q,
    setQ: setQ,
    placeholder: "Tìm theo mã phiếu, sản phẩm, NCC…",
    onExport: onExport,
    extra: nccExtra,
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
  }, rows.map(r => /*#__PURE__*/React.createElement("tr", {
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
  }, r.supplier), /*#__PURE__*/React.createElement("td", {
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
  }, r.qtyIn), /*#__PURE__*/React.createElement("td", {
    className: "px-4 py-3 text-right tabular-nums text-slate-600"
  }, vnd(r.costNcc)), /*#__PURE__*/React.createElement("td", {
    className: "px-4 py-3 text-right tabular-nums text-slate-500"
  }, r.fee ? vnd(r.fee) : ""), /*#__PURE__*/React.createElement("td", {
    className: "px-4 py-3 text-right tabular-nums font-medium text-[#92400e]"
  }, vnd(r.costNcc + (r.fee || 0))), /*#__PURE__*/React.createElement("td", {
    className: "px-4 py-3 text-right tabular-nums font-medium text-[#B91C1C]"
  }, vnd((r.costNcc + (r.fee || 0)) * r.qtyIn)), /*#__PURE__*/React.createElement("td", {
    className: "px-4 py-3 text-slate-500"
  }, r.staff))),
  /*#__PURE__*/React.createElement("tr", {className: "bg-[#fed7aa]"},
    /*#__PURE__*/React.createElement("td", {className: "px-4 py-3 text-xs font-bold uppercase tracking-wide text-slate-800", colSpan: 6}, "TỔNG CỘNG (",rows.length," PHIẾU)"),
    /*#__PURE__*/React.createElement("td", {className: `px-4 py-3 text-right tabular-nums ${rows.reduce((s,r)=>s+r.qtyIn,0)<0?"text-[#B91C1C]":"text-slate-800"}`, style:{fontWeight:700}}, rows.reduce((s,r)=>s+r.qtyIn,0)),
    
    /*#__PURE__*/React.createElement("td", {className: "px-4 py-3"}),
    /*#__PURE__*/React.createElement("td", {className: "px-4 py-3"}),
    /*#__PURE__*/React.createElement("td", {className: "px-4 py-3"}),
    /*#__PURE__*/React.createElement("td", {className: "px-4 py-3 text-right tabular-nums text-[#B91C1C]", style:{fontWeight:700}}, vnd(rows.reduce((s,r)=>s+(r.costNcc+(r.fee||0))*r.qtyIn,0))),
    /*#__PURE__*/React.createElement("td", {colSpan: 2}))),
  doc && /*#__PURE__*/React.createElement(DocModal, {doc: doc, onClose: () => setDoc(null)}),
  payModal && /*#__PURE__*/React.createElement(PhieuChiModal, {onClose: () => setPayModal(null), initEntity: payModal.supplier||"", initOrderId: impCode(payModal.lot), initKind: "CP Thanh Toán NCC", kinds: ["CP Đặt Cọc NCC","CP Thanh Toán NCC"], initAmount: lotRemaining(payModal), initNote: "Thanh toán "+impCode(payModal.lot)+" - "+(payModal.supplier||""), nextId: nextTxnId, onSave: handlePaySave}),
  nccReturnModal && /*#__PURE__*/React.createElement(NccReturnModal, {
    lot: nccReturnModal.lot,
    prod: nccReturnModal.prod,
    costNcc: nccReturnModal.costNcc || 0,
    onClose: () => setNccReturnModal(null),
    onSave: ret => doReturnNcc(nccReturnModal, ret)
  }),
  slipModal && /*#__PURE__*/React.createElement(Modal, {
    title: `Phiếu nhập kho — ${impCode(slipModal.lot)}`,
    maxW: "max-w-lg",
    onClose: () => setSlipModal(null),
    footer: /*#__PURE__*/React.createElement(React.Fragment, null,
      /*#__PURE__*/React.createElement(PrintBtn, null),
      lotRemaining(slipModal) > 0 && /*#__PURE__*/React.createElement("button", {onClick: () => { setPayModal(slipModal); setSlipModal(null); }, className: "inline-flex items-center gap-1.5 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm font-semibold text-[#047857] hover:bg-green-100"}, /*#__PURE__*/React.createElement(Wallet, {className: "h-4 w-4"}), "Thanh toán"),
      /*#__PURE__*/React.createElement("button", {onClick: () => { setNccReturnModal(slipModal); setSlipModal(null); }, className: "inline-flex items-center gap-1.5 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-semibold text-[#92400e] hover:bg-amber-100"}, /*#__PURE__*/React.createElement(RotateCcw, {className: "h-4 w-4"}), "Trả NCC"),
      /*#__PURE__*/React.createElement("button", {onClick: () => setSlipModal(null), className: ghostBtn}, "Đóng"))
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
  const prodList = ["Tất cả", ...new Set(items.map(r => r.prod))];
  const [fromDate, setFromDate] = useState(localMonthStart());
  const [toDate, setToDate] = useState(localToday());
  const _pISO = s => { const [y,m,d] = s.split("-"); return new Date(+y,+m-1,+d); };
  const _inR = (dt, f, t) => { const d = parseViDate(dt); return (!f || d >= _pISO(f)) && (!t || d <= new Date(_pISO(t).setHours(23,59,59))); };
  const rows = items.filter(r => {
    if (!_inR(r.dt, fromDate, toDate)) return false;
    if (fProd !== "Tất cả" && r.prod !== fProd) return false;
    if (q && !`${r.order} ${r.prod} ${r.cust} ${r.sku}`.toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  }).sort((a,b) => parseViDate(b.dt) - parseViDate(a.dt));
  const onExport = () => exportCSV("danh-sach-phieu-xuat-kho", ["Thời gian", "Đơn hàng", "Khách hàng", "Địa chỉ", "Tên sản phẩm", "Nhà cung cấp", "Kho", "SL xuất", "Giá bán", "Thành tiền", "TT Đơn", "TT Giao", "Người xuất"], rows.map(r => [r.dt, r.order, r.cust, r.addr, r.prod, r.supplier, r.store, r.qty, r.sale, r.sale * r.qty, r.orderStatus, r.delivery, r.staff]));
  return /*#__PURE__*/React.createElement("div", {
    className: "space-y-4"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex flex-wrap items-end gap-3 rounded-xl border border-slate-200 bg-white p-3"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: "mb-1 block text-[13px] font-medium text-slate-500"
  }, "Từ ngày"), /*#__PURE__*/React.createElement("input", {
    type: "date",
    value: fromDate, onChange: e => setFromDate(e.target.value),
    className: field
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: "mb-1 block text-[13px] font-medium text-slate-500"
  }, "Đến ngày"), /*#__PURE__*/React.createElement("input", {
    type: "date",
    value: toDate, onChange: e => setToDate(e.target.value),
    className: field
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
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
    }, "Kho"))
  }, rows.map(r => /*#__PURE__*/React.createElement("tr", {
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
  }, storeShort(r.store)))),
  /*#__PURE__*/React.createElement("tr", {className: "border-t-2 border-[#fdba74] bg-[#fed7aa]"},
    /*#__PURE__*/React.createElement("td", {className: "px-3 py-3 text-xs font-bold uppercase tracking-wide text-slate-800", colSpan: 6}, "TỔNG CỘNG (", rows.length, " PHIẾU)"),
    /*#__PURE__*/React.createElement("td", {className: "px-3 py-3 text-right tabular-nums text-slate-800", style:{fontWeight:700}}, rows.reduce((s,r)=>s+r.qty,0)),
    /*#__PURE__*/React.createElement("td", {className: "px-3 py-3"}),
    /*#__PURE__*/React.createElement("td", {className: "px-3 py-3 text-right tabular-nums text-[#B91C1C]", style:{fontWeight:700}}, vnd(rows.reduce((s,r)=>s+r.sale*r.qty,0))),
    /*#__PURE__*/React.createElement("td", {colSpan: 2}))),
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
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: "mb-1 block text-[13px] font-medium text-slate-500"
  }, "Từ ngày"), /*#__PURE__*/React.createElement("input", {
    type: "date",
    value: fromDate, onChange: e => setFromDate(e.target.value),
    className: field
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: "mb-1 block text-[13px] font-medium text-slate-500"
  }, "Đến ngày"), /*#__PURE__*/React.createElement("input", {
    type: "date",
    value: toDate, onChange: e => setToDate(e.target.value),
    className: field
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
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
    className: "overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm"
  }, /*#__PURE__*/React.createElement("table", {
    className: "w-full text-sm",
    style: {
      minWidth: 1100
    }
  }, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", {
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
  }, "*")), isEdit
    ? /*#__PURE__*/React.createElement("input", {
        className: inputF + " bg-slate-50 text-slate-500 cursor-not-allowed",
        value: f.sku,
        readOnly: true
      })
    : /*#__PURE__*/React.createElement(React.Fragment, null,
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
  const [itemsFS, prodsLoaded, prodsError] = useCollection("products");
  const [localItems, setLocalItems] = React.useState(null);
  // Chỉ khởi tạo lần đầu; không ghi đè local edits bằng snapshot Firestore
  React.useEffect(() => { if (prodsLoaded && localItems === null) setLocalItems(itemsFS.length ? itemsFS : null); }, [prodsLoaded, itemsFS.length]);
  const items = localItems ?? itemsFS;
  // Seed Firestore lần đầu nếu còn trống
  useEffect(() => {
    if (prodsLoaded && !prodsError && itemsFS.length === 0) {
      const toId = sku => sku.replace(/\//g, "__");
      batchSave("products", PRODUCTS.map(p => ({...p, _id: toId(p.sku)})), p => p._id).catch(console.error);
    }
  }, [prodsLoaded, prodsError]);
  const toFsId = sku => sku.replace(/\//g, "__");
  const setItems = (updater) => {
    const next = typeof updater === 'function' ? updater(items) : updater;
    setLocalItems(next);
    const prevMap = Object.fromEntries(items.map(p => [p.sku, p]));
    const nextMap = Object.fromEntries(next.map(p => [p.sku, p]));
    Object.entries(nextMap).forEach(([sku, p]) => {
      if (JSON.stringify(prevMap[sku]) !== JSON.stringify(p))
        saveDoc("products", toFsId(sku), p).catch(e => { console.error(e); notify("Lỗi lưu sản phẩm: " + (e.message || e.code || "Lỗi kết nối")); });
    });
    Object.keys(prevMap).forEach(sku => { if (!nextMap[sku]) deleteDocument("products", toFsId(sku)).catch(e => { console.error(e); notify("Lỗi xoá sản phẩm: " + (e.message || e.code || "Lỗi kết nối")); }); });
  };
  const [q, setQ] = useState("");
  const [form, setForm] = useState(null); // {} new | product edit
  const [delConfirm, setDelConfirm] = useState(null); // sku đang chờ xác nhận xóa
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
  const save = f => {
    if (form && form.sku) {
      setItems(xs => xs.map(p => p.sku === form.sku ? { ...p, ...f } : p));
      notify("Đã cập nhật sản phẩm");
    } else {
      setItems(xs => [{ ...f }, ...xs]);
      notify("Đã thêm sản phẩm");
    }
    setForm(null);
  };
  const del = sku => {
    setItems(xs => xs.filter(p => p.sku !== sku));
    notify("Đã xoá sản phẩm");
  };
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
  }, /*#__PURE__*/React.createElement(PrintBtn, null), /*#__PURE__*/React.createElement(ExportBtn, {
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
  }, delConfirm === p.sku
    ? /*#__PURE__*/React.createElement(React.Fragment, null,
        /*#__PURE__*/React.createElement("span", {className: "text-xs text-rose-600 font-medium"}, "Xoá?"),
        /*#__PURE__*/React.createElement("button", {
          className: "rounded px-1.5 py-0.5 text-xs font-semibold bg-rose-600 text-white hover:bg-rose-700",
          onClick: () => { del(p.sku); setDelConfirm(null); }
        }, "Có"),
        /*#__PURE__*/React.createElement("button", {
          className: "rounded px-1.5 py-0.5 text-xs text-slate-500 hover:bg-slate-100 border border-slate-200",
          onClick: () => setDelConfirm(null)
        }, "Không"))
    : /*#__PURE__*/React.createElement(React.Fragment, null,
        /*#__PURE__*/React.createElement(IconBtn, {
          icon: Pencil,
          title: "Sửa",
          onClick: () => setForm(p)
        }),
        /*#__PURE__*/React.createElement(IconBtn, {
          tone: "danger",
          icon: Trash2,
          title: "Xoá",
          onClick: () => setDelConfirm(p.sku)
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
    saveDoc("customers", id, isEdit ? {...form, ...f} : {...f, id}).catch(console.error);
    notify(isEdit ? "Đã cập nhật khách hàng" : "Đã thêm khách hàng");
    setForm(null);
  };
  const del = c => {
    if (window.confirm("Xoá khách hàng này?")) {
      deleteDocument("customers", c.id).catch(console.error);
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
  const nextTxnId = txns.length ? Math.max(...txns.map(t=>t.id))+1 : 1;
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
  }, /*#__PURE__*/React.createElement("input", {
    type: "date",
    value: fromDate, onChange: e => setFromDate(e.target.value),
    className: field
  }), /*#__PURE__*/React.createElement("span", {
    className: "text-slate-400"
  }, "→"), /*#__PURE__*/React.createElement("input", {
    type: "date",
    value: toDate, onChange: e => setToDate(e.target.value),
    className: field
  }), /*#__PURE__*/React.createElement("div", {
    className: "ml-auto flex gap-2"
  }, /*#__PURE__*/React.createElement(PrintBtn, null), /*#__PURE__*/React.createElement(ExportBtn, {
    onClick: onExport
  }))), /*#__PURE__*/React.createElement("div", {
    className: "text-center"
  }, /*#__PURE__*/React.createElement("h2", {
    className: "text-[16px] font-semibold uppercase text-slate-800"
  }, "Báo cáo tổng hợp công nợ khách hàng"), /*#__PURE__*/React.createElement("p", {
    className: "text-sm text-slate-500"
  }, "Từ ngày 01/06/2026 đến ngày 16/06/2026")), /*#__PURE__*/React.createElement("div", {
    className: "overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm"
  }, /*#__PURE__*/React.createElement("table", {
    className: "w-full text-sm",
    style: {
      minWidth: 1060
    }
  }, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", {
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
    className: "-mx-5 -mb-5 overflow-x-auto"
  }, /*#__PURE__*/React.createElement("table", {
    className: "w-full text-sm",
    style: {
      minWidth: 1020
    }
  }, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", {
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
      map[key].tt += pl?.paid || (r.pay==="Đã thanh toán" ? total : 0);
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
  }, /*#__PURE__*/React.createElement("input", {
    type: "date",
    value: fromDate, onChange: e => setFromDate(e.target.value),
    className: field
  }), /*#__PURE__*/React.createElement("span", {
    className: "text-slate-400"
  }, "→"), /*#__PURE__*/React.createElement("input", {
    type: "date",
    value: toDate, onChange: e => setToDate(e.target.value),
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
    className: "text-[16px] font-semibold uppercase text-slate-800"
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
          /*#__PURE__*/React.createElement(NumInput,{value:qty,onChange:setQty,className:"w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-[#92400e] focus:outline-none"})),
        /*#__PURE__*/React.createElement("div",null,
          /*#__PURE__*/React.createElement("label",{className:"mb-1 block text-xs font-medium text-slate-500"},"Số tiền hoàn"),
          /*#__PURE__*/React.createElement(NumInput,{value:amount,onChange:setAmount,className:"w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-[#92400e] focus:outline-none"}))),
      /*#__PURE__*/React.createElement("div",null,
        /*#__PURE__*/React.createElement("label",{className:"mb-1 block text-xs font-medium text-slate-500"},"Ghi chú"),
        /*#__PURE__*/React.createElement("input",{value:note,onChange:e=>setNote(e.target.value),placeholder:"Lý do hoàn...",className:"w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-[#92400e] focus:outline-none"})))
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
    className: "-mx-5 -mb-5 overflow-x-auto"
  }, /*#__PURE__*/React.createElement("table", {
    className: "w-full text-sm",
    style: {
      minWidth: 1000
    }
  }, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", {
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
    const paidAmt = l.paid || (l.pay==="Đã thanh toán" ? tienHang+chiPhi : 0);
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
  }, num(lots.reduce((s,l)=>{ const t=(l.qtyIn||0)*(l.costNcc||0)+(l.fee||0); return s+(l.paid||(l.pay==="Đã thanh toán"?t:0)); },0))), /*#__PURE__*/React.createElement("td", {
    className: "px-3 py-3 text-right tabular-nums border-l border-slate-100 text-[#B91C1C] font-semibold"
  }, num(lots.reduce((s,l)=>{ const rA=(l.returns||[]).reduce((r,x)=>r+(x.amount||0),0); const t=(l.qtyIn||0)*(l.costNcc||0)+(l.fee||0)-rA; const p=l.paid||(l.pay==="Đã thanh toán"?(l.qtyIn||0)*(l.costNcc||0)+(l.fee||0):0); return s+t-p; },0))), /*#__PURE__*/React.createElement("td", null))), returnModal && /*#__PURE__*/React.createElement(NccReturnModal, {lot:returnModal.lot, prod:returnModal.prod, costNcc:returnModal.costNcc||0, onClose:()=>setReturnModal(null), onSave:ret=>doReturn(returnModal,ret)}))) : /*#__PURE__*/React.createElement(Empty, null, "Không có dữ liệu lô hàng chi tiết. Tổng dư nợ cuối kỳ: ", /*#__PURE__*/React.createElement("b", {
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
  const {bankAccounts} = useBankAccounts();
  const activeAccs = bankAccounts.filter(a => a.status === "Hoạt động");
  const [acc, setAcc]       = useState(activeAccs[0]?.key || "");
  const [entity, setEntity] = useState("");
  const [orderId, setOrderId] = useState("");
  const [kind, setKind]     = useState("Thu tiền");
  const [amount, setAmount] = useState(0);
  const [note, setNote]     = useState("");
  const canSave = entity.trim() && amount > 0;
  const now = () => { const d = new Date(); return d.toLocaleDateString('vi-VN') + " " + d.toLocaleTimeString('vi-VN',{hour:'2-digit',minute:'2-digit'}); };
  const doSave = () => onSave({id:nextId,date:now(),entity,orderId,kind,acc,amount,note,staff:"NGOC HA"});
  const lbl = "mb-1 block text-[13px] font-medium text-slate-500";
  return /*#__PURE__*/React.createElement(Modal, {title:"Lập phiếu thu",onClose,maxW:"max-w-lg",
    footer:/*#__PURE__*/React.createElement(React.Fragment,null,
      /*#__PURE__*/React.createElement("button",{onClick:onClose,className:ghostBtn},"Hủy"),
      /*#__PURE__*/React.createElement("button",{onClick:doSave,disabled:!canSave,className:blueBtn+(canSave?"":" opacity-50 cursor-not-allowed")},"Lưu phiếu thu"))},
    /*#__PURE__*/React.createElement("div",{className:"grid grid-cols-2 gap-3"},
      /*#__PURE__*/React.createElement("div",null,/*#__PURE__*/React.createElement("label",{className:lbl},"Tài khoản"),
        /*#__PURE__*/React.createElement("select",{value:acc,onChange:e=>setAcc(e.target.value),className:inputF},
          activeAccs.map(a=>/*#__PURE__*/React.createElement("option",{key:a.key,value:a.key},a.bank+" ("+a.account+")")))),
      /*#__PURE__*/React.createElement("div",null,/*#__PURE__*/React.createElement("label",{className:lbl},"Loại thu"),
        /*#__PURE__*/React.createElement("select",{value:kind,onChange:e=>setKind(e.target.value),className:inputF},
          ["Thu Tiền Hàng","Thu Tiền Cọc","Thu Vận Chuyển","Thu Tiền Thuê Nhà","Thu Khác"].map(k=>/*#__PURE__*/React.createElement("option",{key:k},k)))),
      /*#__PURE__*/React.createElement("div",null,/*#__PURE__*/React.createElement("label",{className:lbl},"Đối tượng ",/*#__PURE__*/React.createElement("span",{className:"text-[#B91C1C]"},"*")),
        /*#__PURE__*/React.createElement("input",{value:entity,onChange:e=>setEntity(e.target.value),placeholder:"Tên khách hàng...",className:inputF})),
      /*#__PURE__*/React.createElement("div",null,/*#__PURE__*/React.createElement("label",{className:lbl},"Số đơn hàng"),
        /*#__PURE__*/React.createElement("input",{value:orderId,onChange:e=>setOrderId(e.target.value),placeholder:"DH...",className:inputF})),
      /*#__PURE__*/React.createElement("div",null,/*#__PURE__*/React.createElement("label",{className:lbl},"Số tiền (đ) ",/*#__PURE__*/React.createElement("span",{className:"text-[#B91C1C]"},"*")),
        /*#__PURE__*/React.createElement(NumInput,{className:inputF,value:amount,onChange:setAmount})),
      /*#__PURE__*/React.createElement("div",null,/*#__PURE__*/React.createElement("label",{className:lbl},"Nội dung"),
        /*#__PURE__*/React.createElement("input",{value:note,onChange:e=>setNote(e.target.value),placeholder:"Nội dung...",className:inputF}))));
}
function PhieuChiModal({onClose, onSave, nextId, initEntity="", initOrderId="", initKind="Chi phí", initAmount=0, initNote="", kinds=null}) {
  const {bankAccounts} = useBankAccounts();
  const {txns = []} = useTxns() || {};
  const activeAccs = bankAccounts.filter(a => a.status === "Hoạt động");
  const [acc, setAcc]       = useState(activeAccs[0]?.key || "");
  const [entity, setEntity] = useState(initEntity);
  const [orderId, setOrderId] = useState(initOrderId);
  const [kind, setKind]     = useState(initKind);
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
  const now = () => { const d = new Date(); return d.toLocaleDateString('vi-VN') + " " + d.toLocaleTimeString('vi-VN',{hour:'2-digit',minute:'2-digit'}); };
  const doSave = () => onSave({id:nextId,date:now(),entity,orderId,kind,acc,amount:-amount,note,staff:"NGOC HA"});
  const lbl = "mb-1 block text-[13px] font-medium text-slate-500";
  return /*#__PURE__*/React.createElement(Modal, {title:"Lập phiếu chi",onClose,maxW:"max-w-lg",
    footer:/*#__PURE__*/React.createElement(React.Fragment,null,
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
          (kinds||["CPVC Nhập Hàng","CP Đặt Cọc NCC","CP Thanh Toán NCC","CP Ship ĐH","CP Lắp Đặt","CP Hoàn Hàng","CP Thuê Nhà","CP Tiền Điện","CP Tiền Nước","CP Vận Hành","CP Hoa Hồng","Chi phí <200k"]).map(k=>/*#__PURE__*/React.createElement("option",{key:k},k)))),
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
      {id:nextId,   date:dt,entity:"Chuyển nội bộ",orderId:"",kind:"Chuyển đi", acc:from,amount:-amount,note:note||("Chuyển sang "+to),staff:"NGOC HA"},
      {id:nextId+1, date:dt,entity:"Chuyển nội bộ",orderId:"",kind:"Chuyển về", acc:to,  amount:amount, note:note||("Nhận từ "+from),  staff:"NGOC HA"},
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
  const ALL_KINDS = ["Thu tiền","Đặt cọc","Thanh toán","Thu khác","CPVC Nhập Hàng","CP Đặt Cọc NCC","CP Thanh Toán NCC","CP Ship ĐH","CP Lắp Đặt","CP Hoàn Hàng","CP Thuê Nhà","CP Tiền Điện","CP Tiền Nước","CP Vận Hành","CP Hoa Hồng","Chi phí <200k","Hoàn tiền KH","Hoàn ứng","Chuyển đi","Chuyển về"];
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
function Finance({setActive, onOpenOrder}) {
  const notify = useToast();
  const { profile } = useAuth();
  const {bankAccounts} = useBankAccounts();
  const activeAccs = bankAccounts.filter(a => a.status === "Hoạt động");
  const {txns, setTxns}       = useTxns();
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
  const nextId = txns.length ? Math.max(...txns.map(t=>t.id))+1 : 1;
  React.useEffect(() => { setTxnPage(1); }, [q, fromDate, toDate, fAcc, fDir]);
  React.useEffect(() => { setDetailPage(1); setDFromDate(localMonthStart); setDToDate(localToday); setDQ(""); setDDir("Tất cả"); }, [fAccDetail]);

  const parseD    = s => { const p=s.split(' ')[0].split('/'); return new Date(+p[2],+p[1]-1,+p[0]); };
  const parseISO  = s => { const [y,m,d]=s.split('-'); return new Date(+y,+m-1,+d); };
  const fromD = fromDate ? parseISO(fromDate) : null;
  const toD   = toDate   ? parseISO(toDate)   : null;

  const visibleTxns = txns.filter(t => {
    const d = parseD(t.date);
    if (fromD && d < fromD) return false;
    if (toD   && d > toD)   return false;
    if (fAcc !== "Tất cả" && t.acc !== fAcc) return false;
    if (fDir === "Thu" && t.amount <= 0) return false;
    if (fDir === "Chi" && t.amount >= 0) return false;
    if (q && !`${t.id} ${t.orderId} ${t.note} ${t.entity}`.toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  }).sort((a, b) => { const da = parseD(a.date), db = parseD(b.date); return da - db !== 0 ? db - da : b.id - a.id; });

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
    const d = parseD(t.date);
    if (fromD && d < fromD) return false;
    if (toD   && d > toD)   return false;
    return true;
  });
  const accSummary = activeAccs.map(a => {
    const at = summaryTxns.filter(t=>t.acc===a.key);
    const totalIn  = at.filter(t=>t.amount>0).reduce((s,t)=>s+t.amount,0);
    const totalOut = at.filter(t=>t.amount<0).reduce((s,t)=>s+Math.abs(t.amount),0);
    return {...a, totalIn, totalOut, closeBal: a.openBal+totalIn-totalOut};
  });
  const tot = {
    openBal: accSummary.reduce((s,a)=>s+a.openBal,0),
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
  const resetFilter = () => { setQ(""); setFAcc("Tất cả"); setFKind("Tất cả"); setFAccDetail(null); };
  const onExportTxn = () => exportCSV("lich-su-giao-dich", ["Ngày","Số phiếu","Số đơn hàng","Đối tượng","Loại GD","Tài khoản","Số tiền","Nội dung","Người tạo"],
    visibleTxns.map(t => [t.date, fmtDocId(t.amount>=0?"PT":"PC",t.id), t.orderId||"", t.entity||"", t.kind||"", t.acc||"", t.amount, t.note||"", t.staff||""]));

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
    if (t.amount > 0) thuKinds[t.kind||"Khác"] = (thuKinds[t.kind||"Khác"]||0) + t.amount;
    if (t.amount < 0) chiKinds[t.kind||"Khác"] = (chiKinds[t.kind||"Khác"]||0) + Math.abs(t.amount);
  });
  const THU_KINDS = ["Thu tiền hàng","Thu tiền đặt cọc","Thu tiền thuê nhà","Thu khác"];
  const knownThuKinds = new Set(THU_KINDS);
  const thuOrdered = THU_KINDS.filter(k=>thuKinds[k]>0).map(k=>({kind:k,total:thuKinds[k]}));
  const thuOther = Object.entries(thuKinds).filter(([k])=>!knownThuKinds.has(k)).map(([kind,total])=>({kind,total}));
  const thuGroups = [...thuOrdered, ...thuOther];
  const totalThu = thuGroups.reduce((s,g)=>s+g.total,0);

  const chiMainItems = Object.entries(chiKinds).filter(([,v])=>v>=200000).map(([kind,total])=>({kind,total}));
  const chiSmallItems = Object.entries(chiKinds).filter(([,v])=>v<200000).map(([kind,total])=>({kind,total}));
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
      if (dQ && !`${t.id} ${t.orderId} ${t.note} ${t.entity}`.toLowerCase().includes(dQ.toLowerCase())) return false;
      return true;
    });
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
          /*#__PURE__*/React.createElement(ExportBtn,{onClick:()=>exportCSV("giao-dich-"+fAccDetail,["Ngày","Số phiếu","Số đơn hàng","Đối tượng","Loại GD","Số tiền","Nội dung","Người tạo"],accTxns.map(t=>[t.date,fmtDocId(t.amount>=0?"PT":"PC",t.id),t.orderId||"",t.entity||"",t.kind||"",t.amount,t.note||"",t.staff||""]))}))},
        /*#__PURE__*/React.createElement("div", {className:"-mx-5 -mb-5"},
          /*#__PURE__*/React.createElement(TableShell, {minW:"1100px",
            head:/*#__PURE__*/React.createElement(React.Fragment,null,
              /*#__PURE__*/React.createElement(Th,{center:true,style:{minWidth:90}},"Ngày"),
              /*#__PURE__*/React.createElement(Th,{style:{width:90,minWidth:90}},"Số phiếu"),
              /*#__PURE__*/React.createElement(Th,{style:{width:90,minWidth:90}},"Số đơn hàng"),
              /*#__PURE__*/React.createElement(Th,{style:{minWidth:160}},"Đối tượng"),
              /*#__PURE__*/React.createElement(Th,{center:true,style:{width:95,minWidth:95}},"Loại giao dịch"),
              /*#__PURE__*/React.createElement(Th,{center:true,style:{minWidth:110}},"Số tiền"),
              /*#__PURE__*/React.createElement(Th,{style:{minWidth:200}},"Nội dung"),
              /*#__PURE__*/React.createElement(Th,{style:{minWidth:80}},"Người tạo"),
              /*#__PURE__*/React.createElement(Th,{center:true,style:{width:44,minWidth:44}},""),
              /*#__PURE__*/React.createElement(Th,{center:true,style:{width:80,minWidth:80}},""))},
            pagedAccTxns.map(t=>/*#__PURE__*/React.createElement("tr",{key:t.id,className:t.cancelled?"opacity-50 bg-slate-50":""},
              /*#__PURE__*/React.createElement("td",{className:"px-3 py-2.5 text-xs text-slate-500"},(() => {
                const parts = String(t.date||"").split(" ");
                return /*#__PURE__*/React.createElement(React.Fragment,null,
                  /*#__PURE__*/React.createElement("span",{className:"block"},(parts[0]||"")),
                  parts[1] ? /*#__PURE__*/React.createElement("span",{className:"block text-slate-400"},(parts[1]||"").split(":").slice(0,2).join(":")) : null);
              })()),
              /*#__PURE__*/React.createElement("td",{className:"px-3 py-2.5 tabular-nums"},
                /*#__PURE__*/React.createElement("span",{className:`inline-flex items-center whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-medium ${t.amount>0?"bg-[#dcfce7] text-[#047857]":t.amount<0?"bg-[#fee2e2] text-[#B91C1C]":"bg-slate-100 text-slate-600"}`},
                  fmtDocId(t.amount>=0?"PT":"PC",t.id))),
              /*#__PURE__*/React.createElement("td",{className:"px-3 py-2.5"},
                t.orderId?/*#__PURE__*/React.createElement("button",{className:"inline-flex items-center whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-medium bg-[#fef9f0] text-[#92400e] hover:bg-amber-100",onClick:()=>onOpenOrder&&onOpenOrder(t.orderId)},t.orderId):/*#__PURE__*/React.createElement("span",{className:"text-slate-300"},"")),
              /*#__PURE__*/React.createElement("td",{className:"px-3 py-2.5 text-slate-700"},t.entity),
              /*#__PURE__*/React.createElement("td",{className:"px-3 py-2.5 text-center"},
                /*#__PURE__*/React.createElement("span",{className:`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${KIND_COLORS_D[t.kind]||"bg-slate-100 text-slate-600"}`},t.kind)),
              /*#__PURE__*/React.createElement("td",{className:`whitespace-nowrap px-3 py-2.5 text-right tabular-nums font-semibold ${t.cancelled?"line-through text-slate-400":t.amount>0?"text-[#047857]":t.amount<0?"text-[#B91C1C]":"text-slate-500"}`},
                (t.amount>=0?"+":"")+vnd(t.amount)),
              /*#__PURE__*/React.createElement("td",{className:"px-3 py-2.5 text-slate-500 text-xs"},t.note||""),
              /*#__PURE__*/React.createElement("td",{className:"whitespace-nowrap px-3 py-2.5 text-xs text-slate-500"},t.staff),
              /*#__PURE__*/React.createElement("td",{className:"px-2 py-2 text-center"},
                !t.cancelled&&/*#__PURE__*/React.createElement("button",{onClick:()=>toggleCheck(t.id),title:t.checked?"Bỏ đối chiếu":"Đã đối chiếu",className:`h-5 w-5 rounded border-2 flex items-center justify-center transition mx-auto ${t.checked?"border-green-500 bg-green-500 text-white":"border-slate-300 hover:border-amber-400"}`},
                  t.checked&&/*#__PURE__*/React.createElement(Check,{className:"h-3 w-3 stroke-[3]"}))),
              /*#__PURE__*/React.createElement("td",{className:"px-3 py-2.5 text-center"},
                t.cancelled
                  ?/*#__PURE__*/React.createElement("button",{onClick:()=>restoreTxn(t.id),title:t.cancelReason?"Lý do: "+t.cancelReason+(t.cancelledBy?" · "+t.cancelledBy:""):"",className:"rounded px-2 py-0.5 text-xs font-medium bg-slate-100 text-slate-500 hover:bg-emerald-100 hover:text-emerald-700"},"Khôi phục")
                  :!t.orderId&&/*#__PURE__*/React.createElement("div",{className:"flex items-center gap-1 justify-center"},
                      /*#__PURE__*/React.createElement("button",{onClick:()=>setEditTxn(t),className:"rounded px-2 py-0.5 text-xs font-medium bg-slate-100 text-slate-600 hover:bg-amber-100 hover:text-amber-700"},"Sửa"),
                      /*#__PURE__*/React.createElement("button",{onClick:()=>setCancelTarget(t.id),className:"rounded px-2 py-0.5 text-xs font-medium bg-red-50 text-[#B91C1C] hover:bg-red-100"},"Huỷ")))))))),
      totalAccPages>1 && /*#__PURE__*/React.createElement("div",{className:"flex items-center justify-between gap-3 pt-3 px-1 flex-wrap"},
        /*#__PURE__*/React.createElement("span",{className:"text-xs text-slate-500"},`${(detailPage-1)*ACC_PER_PAGE+1}–${Math.min(detailPage*ACC_PER_PAGE,accTxns.length)} / ${accTxns.length} giao dịch`),
        /*#__PURE__*/React.createElement("div",{className:"flex items-center gap-1"},
          /*#__PURE__*/React.createElement("button",{disabled:detailPage===1,onClick:()=>setDetailPage(p=>Math.max(1,p-1)),className:"rounded px-2 py-1 text-sm text-slate-600 hover:bg-slate-100 disabled:opacity-30"},"Trước"),
          Array.from({length:totalAccPages},(_,i)=>i+1).map(n=>/*#__PURE__*/React.createElement("button",{key:n,onClick:()=>setDetailPage(n),className:`min-w-[2rem] rounded px-2 py-1 text-sm font-medium ${detailPage===n?"bg-[#92400e] text-white":"text-slate-600 hover:bg-slate-100"}`},n)),
          /*#__PURE__*/React.createElement("button",{disabled:detailPage===totalAccPages,onClick:()=>setDetailPage(p=>Math.min(totalAccPages,p+1)),className:"rounded px-2 py-1 text-sm text-slate-600 hover:bg-slate-100 disabled:opacity-30"},"Sau"))),
      modal==="thu" && /*#__PURE__*/React.createElement(PhieuThuModal,{onClose:()=>setModal(null),onSave:addTxn,nextId}),
      modal==="chi" && /*#__PURE__*/React.createElement(PhieuChiModal,{onClose:()=>setModal(null),onSave:addChi,nextId}),
      modal==="chuyen" && /*#__PURE__*/React.createElement(ChuyenTienModal,{onClose:()=>setModal(null),onSave:addXfer,nextId}),
      cancelTarget && /*#__PURE__*/React.createElement(HuyGiaoDichModal,{onClose:()=>setCancelTarget(null),onConfirm:reason=>cancelTxn(cancelTarget,reason)}),
      editTxn && /*#__PURE__*/React.createElement(EditTxnModal,{txn:editTxn,onClose:()=>setEditTxn(null),onSave:saveTxnEdit}));
  }

  return /*#__PURE__*/React.createElement("div", {className:"space-y-4"},

    /*#__PURE__*/React.createElement(Card, {title: "Sổ quỹ",
      right: /*#__PURE__*/React.createElement("div", {className:"flex flex-wrap items-center gap-2"},
        /*#__PURE__*/React.createElement("input", {type:"date", value:fromDate, onChange:e=>setFromDate(e.target.value), className:`${field} py-1.5 text-sm`}),
        /*#__PURE__*/React.createElement("span", {className:"text-slate-400 text-sm"}, "–"),
        /*#__PURE__*/React.createElement("input", {type:"date", value:toDate, onChange:e=>setToDate(e.target.value), className:`${field} py-1.5 text-sm`}),
        /*#__PURE__*/React.createElement("button", {onClick:()=>setModal("thu"), className:"inline-flex items-center gap-1.5 rounded-lg bg-[#b45309] px-3 py-1.5 text-sm font-semibold text-white hover:bg-[#92400e]"},
          /*#__PURE__*/React.createElement(Plus, {className:"h-4 w-4"}), "Lập phiếu thu"),
        /*#__PURE__*/React.createElement("button", {onClick:()=>setModal("chi"), className:"inline-flex items-center gap-1.5 rounded-lg bg-[#92400e] px-3 py-1.5 text-sm font-semibold text-white hover:bg-[#78350f]"},
          /*#__PURE__*/React.createElement(Minus, {className:"h-4 w-4"}), "Lập phiếu chi"),
        /*#__PURE__*/React.createElement("button", {onClick:()=>setModal("chuyen"), className:"inline-flex items-center gap-1.5 rounded-lg bg-[#78350f] px-3 py-1.5 text-sm font-semibold text-white hover:bg-[#78350f]"},
          /*#__PURE__*/React.createElement(ArrowLeftRight, {className:"h-4 w-4"}), "Chuyển tiền nội bộ"))},
      /*#__PURE__*/React.createElement("div", {className:"-mx-5 -mb-5 overflow-x-auto"},
        /*#__PURE__*/React.createElement("table", {className:"w-full text-sm tbl-list"},
          /*#__PURE__*/React.createElement("thead", null,
            /*#__PURE__*/React.createElement("tr", null,
              /*#__PURE__*/React.createElement("th",{className:thC},"Tài khoản"),
              /*#__PURE__*/React.createElement("th",{className:thC},"Số TK"),
              /*#__PURE__*/React.createElement("th",{className:thC},"Chủ tài khoản"),
              /*#__PURE__*/React.createElement("th",{className:thR},"Số dư đầu kỳ"),
              /*#__PURE__*/React.createElement("th",{className:thR},"Tổng tiền vào"),
              /*#__PURE__*/React.createElement("th",{className:thR},"Tổng tiền ra"),
              /*#__PURE__*/React.createElement("th",{className:thR},"Số dư cuối kỳ"),
              /*#__PURE__*/React.createElement("th",{className:"px-3 py-2.5 text-center"},""))),
          /*#__PURE__*/React.createElement("tbody", null,
            accSummary.map(a=>/*#__PURE__*/React.createElement("tr",{key:a.key},
              /*#__PURE__*/React.createElement("td",{className:tdC+" font-medium"},a.bank),
              /*#__PURE__*/React.createElement("td",{className:tdC},a.account),
              /*#__PURE__*/React.createElement("td",{className:tdC},a.owner),
              /*#__PURE__*/React.createElement("td",{className:tdR+" text-slate-800"},vnd(a.openBal)),
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
          ["Tất cả","Thu","Chi"].map(k=>/*#__PURE__*/React.createElement("option",{key:k},k))),
        /*#__PURE__*/React.createElement(PrintBtn, null),
        /*#__PURE__*/React.createElement(ExportBtn, {onClick: onExportTxn}))},
      /*#__PURE__*/React.createElement("div", {className:"-mx-5 -mb-5"},
        /*#__PURE__*/React.createElement(TableShell, {minW:"1100px",
          head:/*#__PURE__*/React.createElement(React.Fragment,null,
            /*#__PURE__*/React.createElement(Th,{center:true,style:{minWidth:90}},"Ngày"),
            /*#__PURE__*/React.createElement(Th,{style:{width:90,minWidth:90}},"Số phiếu"),
            /*#__PURE__*/React.createElement(Th,{style:{width:90,minWidth:90}},"Số đơn hàng"),
            /*#__PURE__*/React.createElement(Th,{style:{minWidth:160}},"Đối tượng"),
            /*#__PURE__*/React.createElement(Th,{center:true,style:{width:95,minWidth:95}},"Loại giao dịch"),
            /*#__PURE__*/React.createElement(Th,{center:true,style:{minWidth:110}},"Tài khoản"),
            /*#__PURE__*/React.createElement(Th,{center:true,style:{minWidth:110}},"Số tiền"),
            /*#__PURE__*/React.createElement(Th,{style:{minWidth:200}},"Nội dung"),
            /*#__PURE__*/React.createElement(Th,{style:{minWidth:80}},"Người tạo"),
            /*#__PURE__*/React.createElement(Th,{center:true},""),
            /*#__PURE__*/React.createElement(Th,{center:true},""))},
          pagedTxns.map(t=>/*#__PURE__*/React.createElement("tr",{key:t.id,className:t.cancelled?"opacity-50 bg-slate-50":""},
            /*#__PURE__*/React.createElement("td",{className:"px-3 py-2.5 text-xs text-slate-500"}, (() => {
              const parts = String(t.date||"").split(" ");
              return /*#__PURE__*/React.createElement(React.Fragment,null,
                /*#__PURE__*/React.createElement("span",{className:"block"},(parts[0]||"")),
                parts[1] ? /*#__PURE__*/React.createElement("span",{className:"block text-slate-400"},(parts[1]||"").split(":").slice(0,2).join(":")) : null);
            })()),
            /*#__PURE__*/React.createElement("td",{className:"px-3 py-2.5 tabular-nums"},
              /*#__PURE__*/React.createElement("span",{className:`inline-flex items-center whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-medium ${t.amount > 0 ? "bg-[#dcfce7] text-[#047857]" : t.amount < 0 ? "bg-[#fee2e2] text-[#B91C1C]" : "bg-slate-100 text-slate-600"}`},
                fmtDocId(t.amount >= 0 ? "PT" : "PC", t.id))),
            /*#__PURE__*/React.createElement("td",{className:"px-3 py-2.5"},
              t.orderId ? /*#__PURE__*/React.createElement("button",{className:"inline-flex items-center whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-medium bg-[#fef9f0] text-[#92400e] hover:bg-amber-100", onClick:()=>onOpenOrder&&onOpenOrder(t.orderId)},t.orderId) : /*#__PURE__*/React.createElement("span",{className:"text-slate-300"},"")),
            /*#__PURE__*/React.createElement("td",{className:"px-3 py-2.5 text-slate-700"},t.entity),
            /*#__PURE__*/React.createElement("td",{className:"px-3 py-2.5 text-center"},
              /*#__PURE__*/React.createElement("span",{className:`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${KIND_COLORS[t.kind]||"bg-slate-100 text-slate-600 "}`},t.kind)),
            /*#__PURE__*/React.createElement("td",{className:"whitespace-nowrap px-3 py-2.5 text-slate-600 text-xs"},t.acc),
            /*#__PURE__*/React.createElement("td",{className:`whitespace-nowrap px-3 py-2.5 text-right tabular-nums font-semibold ${t.cancelled?"line-through text-slate-400":t.amount > 0 ? "text-[#047857]" : t.amount < 0 ? "text-[#B91C1C]" : "text-slate-500"}`},
              (t.amount>=0?"+":"")+vnd(t.amount)),
            /*#__PURE__*/React.createElement("td",{className:"px-3 py-2.5 text-slate-500 text-xs"},t.note||""),
            /*#__PURE__*/React.createElement("td",{className:"whitespace-nowrap px-3 py-2.5 text-xs text-slate-500"},t.staff),
            /*#__PURE__*/React.createElement("td",{className:"px-2 py-2 text-center"},
              !t.cancelled&&/*#__PURE__*/React.createElement("button",{onClick:()=>toggleCheck(t.id),title:t.checked?"Bỏ đối chiếu":"Đã đối chiếu",className:`h-5 w-5 rounded border-2 flex items-center justify-center transition mx-auto ${t.checked?"border-green-500 bg-green-500 text-white":"border-slate-300 hover:border-amber-400"}`},
                t.checked&&/*#__PURE__*/React.createElement(Check,{className:"h-3 w-3 stroke-[3]"}))),
            /*#__PURE__*/React.createElement("td",{className:"px-3 py-2.5 text-center"},
              t.cancelled
                ?/*#__PURE__*/React.createElement("button",{onClick:()=>restoreTxn(t.id),className:"rounded px-2 py-0.5 text-xs font-medium bg-slate-100 text-slate-500 hover:bg-emerald-100 hover:text-emerald-700"},"Khôi phục")
                :/*#__PURE__*/React.createElement("button",{onClick:()=>cancelTxn(t.id),className:"rounded px-2 py-0.5 text-xs font-medium bg-red-50 text-[#B91C1C] hover:bg-red-100"},"Huỷ"))))))),
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
    modal==="chi"    && /*#__PURE__*/React.createElement(PhieuChiModal,  {onClose:()=>setModal(null), onSave:addChi,  nextId}),
    modal==="chuyen" && /*#__PURE__*/React.createElement(ChuyenTienModal,{onClose:()=>setModal(null), onSave:addXfer, nextId}),
    cancelTarget && /*#__PURE__*/React.createElement(HuyGiaoDichModal,{onClose:()=>setCancelTarget(null),onConfirm:reason=>cancelTxn(cancelTarget,reason)}),
    editTxn && /*#__PURE__*/React.createElement(EditTxnModal,{txn:editTxn,onClose:()=>setEditTxn(null),onSave:saveTxnEdit}));
}

/* ───────── Reports ───────── */
function ReportSales({orders = [], onOpenOrder}) {
  const [fromDate, setFromDate] = useState(localMonthStart());
  const [toDate, setToDate] = useState(localToday());
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

  const rows = [...filtered].sort((a,b) => parseViDate(b.dt) - parseViDate(a.dt));

  const onExport = () => exportCSV("bao-cao-ban-hang",
    ["Ngày","Số đơn","Khách hàng","Doanh thu","Giá vốn","CPBH","Lãi/Lỗ","%","Đã thu","Còn lại"],
    rows.map(o => {
      const c = calc(o);
      const cpbh = (o.compCosts||[]).filter(x=>["Chi phí Ship hàng","Chi phí hoa hồng","Chi phí lắp đặt"].includes(x.type)).reduce((s,x)=>s+(x.amount||0),0);
      const laiLo = c.total - c.totalCost - cpbh;
      const pct = c.total ? (laiLo/c.total*100).toFixed(1) : "0.0";
      const dtPart = String(o.dt||"").split(" ").find(p=>p.includes("/"))||"";
      return [dtPart.replace(",",""), o.id, o.name, c.total, c.totalCost, cpbh, laiLo, pct, o.paid||0, Math.max(0,c.remaining)];
    }));

  const totRevenue = rows.reduce((s,o)=>s+calc(o).total,0);
  const totCost    = rows.reduce((s,o)=>s+calc(o).totalCost,0);
  const totCpbh    = rows.reduce((s,o)=>{const cpbh=(o.compCosts||[]).filter(x=>["Chi phí Ship hàng","Chi phí hoa hồng","Chi phí lắp đặt"].includes(x.type)).reduce((s2,x)=>s2+(x.amount||0),0); return s+cpbh;},0);
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
        rows.map(o => {
          const c = calc(o);
          const cpbh = (o.compCosts||[]).filter(x=>["Chi phí Ship hàng","Chi phí hoa hồng","Chi phí lắp đặt"].includes(x.type)).reduce((s,x)=>s+(x.amount||0),0);
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
      /*#__PURE__*/React.createElement("div", null,
        /*#__PURE__*/React.createElement("label", {className:"mb-1 block text-[13px] font-medium text-slate-500"}, "Từ ngày"),
        /*#__PURE__*/React.createElement("input", {type:"date", value:fromDate, onChange:e=>setFromDate(e.target.value), className:field})),
      /*#__PURE__*/React.createElement("div", null,
        /*#__PURE__*/React.createElement("label", {className:"mb-1 block text-[13px] font-medium text-slate-500"}, "Đến ngày"),
        /*#__PURE__*/React.createElement("input", {type:"date", value:toDate, onChange:e=>setToDate(e.target.value), className:field})),
      /*#__PURE__*/React.createElement("div", {className:"flex items-end gap-2"},
        /*#__PURE__*/React.createElement(PrintBtn, null),
        /*#__PURE__*/React.createElement(ExportBtn, {onClick: onExport}))),
    /*#__PURE__*/React.createElement("div", {className:"grid grid-cols-3 gap-3"},
      /*#__PURE__*/React.createElement("div", {className:"rounded-xl border border-slate-200 bg-white p-4 shadow-sm"},
        /*#__PURE__*/React.createElement("p", {className:"text-xs font-medium uppercase tracking-wide text-slate-500"}, "Đơn đã giao"),
        /*#__PURE__*/React.createElement("span", {className:"mt-1 inline-block rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500"}, delivered.length+" đơn"),
        /*#__PURE__*/React.createElement("p", {className:"mt-2 text-2xl font-semibold tabular-nums text-right text-[#047857]"}, vnd(tDelivered))),
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
            /*#__PURE__*/React.createElement("span", {className:"text-sm font-semibold tabular-nums "+(tTotalRem>0?"text-[#B91C1C]":"text-slate-400")}, vnd(tTotalRem))))),
      /*#__PURE__*/React.createElement("div", {className:"rounded-xl border border-slate-200 bg-white p-4 shadow-sm"},
        /*#__PURE__*/React.createElement("p", {className:"text-xs font-medium uppercase tracking-wide text-slate-500"}, "Đơn chưa giao"),
        /*#__PURE__*/React.createElement("span", {className:"mt-1 inline-block rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500"}, undelivered.length+" đơn"),
        /*#__PURE__*/React.createElement("p", {className:"mt-2 text-2xl font-semibold tabular-nums text-right text-[#B91C1C]"}, vnd(tUndelivered))),
      /*#__PURE__*/React.createElement("div", {className:"rounded-xl border border-slate-200 bg-white p-4 shadow-sm flex flex-col justify-center gap-3"},
        /*#__PURE__*/React.createElement("div", null,
          /*#__PURE__*/React.createElement("p", {className:"text-xs font-medium uppercase tracking-wide text-right text-slate-500"}, "Tiền đặt cọc"),
          /*#__PURE__*/React.createElement("p", {className:"mt-1 text-xl font-semibold tabular-nums text-right text-[#92400e]"}, vnd(tDeposit))),
        /*#__PURE__*/React.createElement("div", {className:"border-t border-slate-100 pt-3"},
          /*#__PURE__*/React.createElement("p", {className:"text-xs font-medium uppercase tracking-wide text-right text-slate-500"}, "Tiền chưa thu"),
          /*#__PURE__*/React.createElement("p", {className:"mt-1 text-xl font-semibold tabular-nums text-right text-[#B91C1C]"}, vnd(tUndelivRem))))),
    /*#__PURE__*/React.createElement(Card, {title:"Chi tiết theo đơn hàng"},
      /*#__PURE__*/React.createElement("div", {className:"-mx-5 -mb-5"},
        /*#__PURE__*/React.createElement(TableShell, {head: tblHead}, tblBody))));
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
    const m = {"Đang xử lý":"bg-blue-50 text-blue-700","Đã xác nhận":"bg-amber-50 text-amber-700","Đã giao":"bg-emerald-50 text-emerald-700","Hoàn thành":"bg-emerald-50 text-emerald-700"};
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
      /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {className: "mb-1 block text-[13px] font-medium text-slate-500"}, "Từ ngày"),
        /*#__PURE__*/React.createElement("input", {type: "date", value: fromDate, onChange: e => setFromDate(e.target.value), className: field})),
      /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {className: "mb-1 block text-[13px] font-medium text-slate-500"}, "Đến ngày"),
        /*#__PURE__*/React.createElement("input", {type: "date", value: toDate, onChange: e => setToDate(e.target.value), className: field})),
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
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: "mb-1 block text-[13px] font-medium text-slate-500"
  }, "Từ ngày"), /*#__PURE__*/React.createElement("input", {
    type: "date",
    value: fromDate, onChange: e => setFromDate(e.target.value),
    className: field
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: "mb-1 block text-[13px] font-medium text-slate-500"
  }, "Đến ngày"), /*#__PURE__*/React.createElement("input", {
    type: "date",
    value: toDate, onChange: e => setToDate(e.target.value),
    className: field
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
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
    await saveDoc("contracts", id, {...form, value:totalValue, id}).catch(console.error);
    notify(editId ? "Đã cập nhật hợp đồng" : "Đã lưu hợp đồng");
    setShowForm(false);
  };

  const del = async (id) => {
    if (!window.confirm("Xóa hợp đồng này?")) return;
    await deleteDocument("contracts", id).catch(console.error);
    notify("Đã xóa hợp đồng");
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
      return /*#__PURE__*/React.createElement(WhIn, {whInItems, setWhInItems, setWhOutItems, orders, purchaseList, setPurchaseList, initSearch: whInSearch, onMounted: () => setWhInSearch(""), onOpenOrder: id => { setOpenOrderId(id); setActive("sales_orders"); }});
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
      return /*#__PURE__*/React.createElement(Dashboard, {orders, purchaseList});
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
    case "settings_print":
      return /*#__PURE__*/React.createElement(SettingsPrint, null);
    case "admin_clear":
      return /*#__PURE__*/React.createElement(AdminClearData, null);
    case "users":
      return /*#__PURE__*/React.createElement(UsersTab, null);
    default:
      return /*#__PURE__*/React.createElement(Dashboard, {orders, purchaseList});
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
function App({ profile, logout }) {
  const allowed = ALLOWED[profile?.role] || ALLOWED.sales;
  const defaultScreen = allowed.includes("sales_orders") ? "sales_orders" : allowed[0] || "dashboard";
  const [active, setActive] = useState(defaultScreen);
  const [whInSearch, setWhInSearch] = useState("");
  const [open, setOpen] = useState({ sales: true });
  // Firestore-backed state
  const [orders] = useCollection("orders");
  const [openOrderId, setOpenOrderId] = useState(null);
  const [purchaseList] = useCollection("purchases");
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
  const [whInItems] = useCollection("wh_in");
  const addUnitCostOut = r => ({...r, unitCost: r.unitCost ?? 0});
  const mergeWhOut = (prev, newSlips) => {
    const existing = new Set(prev.map(r => r.slip));
    const fresh = (Array.isArray(newSlips) ? newSlips : [newSlips]).filter(s => !existing.has(s.slip));
    return fresh.length ? [...fresh, ...prev] : prev;
  };
  const [whOutItems] = useCollection("wh_out");

  // Firestore write helpers (thay thế setState)
  const syncFS = (colName, getId) => (current, updater) => {
    const next = typeof updater === 'function' ? updater(current) : updater;
    const prevMap = Object.fromEntries(current.map(o => [getId(o), o]));
    const nextMap = Object.fromEntries(next.map(o => [getId(o), o]));
    Object.entries(nextMap).forEach(([id, o]) => {
      if (JSON.stringify(prevMap[id]) !== JSON.stringify(o)) saveDoc(colName, id, o).catch(console.error);
    });
    Object.keys(prevMap).forEach(id => { if (!nextMap[id]) deleteDocument(colName, id).catch(console.error); });
  };
  const setOrders = u => syncFS("orders", o => o.id)(orders, u);
  const setPurchaseList = u => syncFS("purchases", r => r.lot)(purchaseList, u);
  const setWhInItems = u => syncFS("wh_in", r => (r.lot||"")+"~~"+(r.prod||""))(whInItems, u);
  const setWhOutItems = u => syncFS("wh_out", r => r.slip)(whOutItems, u);
  const BANKS_VER = "v3";
  const [bankAccounts, setBankAccounts] = useState(() => {
    try {
      if (localStorage.getItem('bltk_banks_ver') !== BANKS_VER) {
        localStorage.setItem('bltk_banks_ver', BANKS_VER);
        return INIT_BANK_ACCOUNTS;
      }
      const saved = JSON.parse(localStorage.getItem('bltk_banks'));
      if (!saved) return INIT_BANK_ACCOUNTS;
      const initMap = Object.fromEntries(INIT_BANK_ACCOUNTS.map(a => [a.key, a.openBal]));
      return saved.map(a => a.key in initMap ? {...a, openBal: initMap[a.key]} : a);
    } catch { return INIT_BANK_ACCOUNTS; }
  });
  React.useEffect(() => {
    localStorage.setItem('bltk_banks', JSON.stringify(bankAccounts));
  }, [bankAccounts]);
  const [txnsFS] = useCollection("txns");
  const txns = txnsFS;
  const setTxns = u => syncFS("txns", t => String(t.id))(txns, u);
  const [docNums, setDocNums] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("bltk_docnums") || "null");
      if (!saved) return DOC_NUM_INIT;
      const curYear = new Date().getFullYear();
      return saved.map(r => r.year !== curYear ? {...r, num:1, year:curYear} : r);
    } catch { return DOC_NUM_INIT; }
  });
  React.useEffect(() => { localStorage.setItem("bltk_docnums", JSON.stringify(docNums)); }, [docNums]);
  const title = LABELS[active] || "";
  return /*#__PURE__*/React.createElement(DocNumCtx.Provider, {value: {docNums, setDocNums}},
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
  }, "PAT"), /*#__PURE__*/React.createElement("p", {
    className: "text-xs text-slate-400"
  }, "admin01 · Quản trị"))), /*#__PURE__*/React.createElement("div", {
    className: "flex min-w-0 flex-1 flex-col"
  }, /*#__PURE__*/React.createElement("header", {
    className: "flex items-center justify-between border-b border-slate-200 bg-white px-6 py-3.5"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex-1 text-center text-[22px] font-bold text-slate-800"
  }, title), /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-2 text-sm"
  })), /*#__PURE__*/React.createElement("main", {
    className: "flex-1 overflow-auto p-6 bg-[#faf7f4]"
  }, /*#__PURE__*/React.createElement(Screen, {
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
  })))))))));
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

  const initTxTypes = [
    {id:1, name:"Đặt cọc tầng 4 tòa nhà 384 LTT", type:"Thu", status:"Hoạt động"},
  ];
  const [txTypes, setTxTypes] = React.useState(initTxTypes);
  const [bankModal, setBankModal] = React.useState(null);
  const [txModal, setTxModal] = React.useState(null);
  const [bankForm, setBankForm] = React.useState({key:"", bank:"", account:"", owner:"", branch:"", note:"", openBal:0, status:"Hoạt động"});
  const [txForm, setTxForm] = React.useState({name:"", type:"Thu", status:"Hoạt động"});

  const openAddBank = () => { setBankForm({key:"", bank:"", account:"", owner:"", branch:"", note:"", openBal:0, status:"Hoạt động"}); setBankModal("add"); };
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
    if (txModal === "add") setTxTypes(ts => [...ts, {...txForm, id: Date.now()}]);
    else setTxTypes(ts => ts.map(t => t.id === txModal ? {...txForm, id: txModal} : t));
    setTxModal(null);
  };

  return /*#__PURE__*/React.createElement("div", {className: "space-y-6"},
    /*#__PURE__*/React.createElement("h2", {className: "text-[22px] font-bold text-slate-800"}, "Cài đặt thanh toán"),

    /*#__PURE__*/React.createElement("div", {className: "rounded-xl border border-slate-200 bg-white p-6 space-y-4"},
      /*#__PURE__*/React.createElement("h3", {className: "text-base font-semibold text-slate-800"}, "Quản lý tài khoản ngân hàng"),
      /*#__PURE__*/React.createElement("button", {onClick: openAddBank, className: addBtnBlue},
        /*#__PURE__*/React.createElement(Plus, {className: "h-4 w-4"}), " Thêm tài khoản ngân hàng"),
      /*#__PURE__*/React.createElement("table", {className: "w-full text-sm border-collapse"},
        /*#__PURE__*/React.createElement("thead", null,
          /*#__PURE__*/React.createElement("tr", {className: "border-b border-slate-200"},
            /*#__PURE__*/React.createElement("th", {className: th}, "Ngân hàng"),
            /*#__PURE__*/React.createElement("th", {className: th}, "Số tài khoản"),
            /*#__PURE__*/React.createElement("th", {className: th}, "Chủ tài khoản"),
            /*#__PURE__*/React.createElement("th", {className: th}, "Chi nhánh"),
            /*#__PURE__*/React.createElement("th", {className: th}, "Trạng thái"),
            /*#__PURE__*/React.createElement("th", {className: th}, "Thao tác"))),
        /*#__PURE__*/React.createElement("tbody", {className: "divide-y divide-slate-100"},
          banks.map(r => /*#__PURE__*/React.createElement("tr", {key: r.id, className: "hover:bg-slate-50"},
            /*#__PURE__*/React.createElement("td", {className: td}, r.bank),
            /*#__PURE__*/React.createElement("td", {className: td}, r.account),
            /*#__PURE__*/React.createElement("td", {className: td}, r.owner),
            /*#__PURE__*/React.createElement("td", {className: td}, r.branch || ""),
            /*#__PURE__*/React.createElement("td", {className: td}, /*#__PURE__*/React.createElement("span", {className: badge(r.status)}, r.status)),
            /*#__PURE__*/React.createElement("td", {className: "px-4 py-3"},
              /*#__PURE__*/React.createElement("div", {className: "flex items-center gap-1.5"},
                /*#__PURE__*/React.createElement("button", {onClick: () => openEditBank(r), className: editBtn}, /*#__PURE__*/React.createElement(Pencil, {className: "h-3.5 w-3.5"})),
                /*#__PURE__*/React.createElement("button", {onClick: () => deleteBank(r), className: delBtn, title: "Ẩn tài khoản (không xóa vĩnh viễn)"}, /*#__PURE__*/React.createElement(Trash2, {className: "h-3.5 w-3.5"})))))))),
      bankModal !== null && /*#__PURE__*/React.createElement("div", {className: "fixed inset-0 z-50 flex items-center justify-center bg-black/40"},
        /*#__PURE__*/React.createElement("div", {className: "w-full max-w-md rounded-xl bg-white p-6 shadow-xl space-y-4"},
          /*#__PURE__*/React.createElement("h4", {className: "text-base font-semibold text-slate-800"}, bankModal === "add" ? "Thêm tài khoản ngân hàng" : "Sửa tài khoản ngân hàng"),
          /*#__PURE__*/React.createElement("div", {className: "grid grid-cols-2 gap-3"},
            ["key:Mã tài khoản (ID)", "bank:Tên ngân hàng", "account:Số tài khoản", "owner:Chủ tài khoản", "branch:Chi nhánh", "note:Ghi chú"].map(s => {
              const [k, lbl] = s.split(":");
              return /*#__PURE__*/React.createElement("div", {key: k},
                /*#__PURE__*/React.createElement("label", {className: "mb-1 block text-xs font-medium text-slate-500"}, lbl),
                /*#__PURE__*/React.createElement("input", {className: inf, value: bankForm[k]||"", onChange: e => setBankForm(f => ({...f, [k]: e.target.value}))}));
            }),
            /*#__PURE__*/React.createElement("div", null,
              /*#__PURE__*/React.createElement("label", {className: "mb-1 block text-xs font-medium text-slate-500"}, "Số dư đầu kỳ (đ)", bankModal !== "add" && /*#__PURE__*/React.createElement("span", {className: "ml-1 text-[#94A3B8]"}, "— không thể sửa")),
              bankModal === "add"
                ? /*#__PURE__*/React.createElement(NumInput, {className: inf, value: bankForm.openBal||0, onChange: v => setBankForm(f => ({...f, openBal: v}))})
                : /*#__PURE__*/React.createElement("div", {className: "rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-sm text-slate-500 tabular-nums"}, (bankForm.openBal||0).toLocaleString("vi-VN"))),
            /*#__PURE__*/React.createElement("div", null,
              /*#__PURE__*/React.createElement("label", {className: "mb-1 block text-xs font-medium text-slate-500"}, "Trạng thái"),
              /*#__PURE__*/React.createElement("select", {className: inf, value: bankForm.status, onChange: e => setBankForm(f => ({...f, status: e.target.value}))},
                /*#__PURE__*/React.createElement("option", null, "Hoạt động"),
                /*#__PURE__*/React.createElement("option", null, "Ngừng hoạt động")))),
          /*#__PURE__*/React.createElement("div", {className: "flex justify-end gap-2"},
            /*#__PURE__*/React.createElement("button", {onClick: () => setBankModal(null), className: ghostBtn}, "Huỷ"),
            /*#__PURE__*/React.createElement("button", {onClick: saveBank, className: addBtnBlue}, "Lưu"))))),

    /*#__PURE__*/React.createElement("div", {className: "rounded-xl border border-slate-200 bg-white p-6 space-y-4"},
      /*#__PURE__*/React.createElement("h3", {className: "text-base font-semibold text-slate-800"}, "Quản lý loại giao dịch"),
      /*#__PURE__*/React.createElement("button", {onClick: openAddTx, className: addBtnBlue},
        /*#__PURE__*/React.createElement(Plus, {className: "h-4 w-4"}), " Thêm loại giao dịch"),
      /*#__PURE__*/React.createElement("table", {className: "w-full text-sm border-collapse"},
        /*#__PURE__*/React.createElement("thead", null,
          /*#__PURE__*/React.createElement("tr", {className: "border-b border-slate-200"},
            /*#__PURE__*/React.createElement("th", {className: th}, "Tên loại giao dịch"),
            /*#__PURE__*/React.createElement("th", {className: th, style:{width:140}}, "Trạng thái"),
            /*#__PURE__*/React.createElement("th", {className: th, style:{width:100}}, "Thao tác"))),
        /*#__PURE__*/React.createElement("tbody", {className: "divide-y divide-slate-100"},
          txTypes.map(r => /*#__PURE__*/React.createElement("tr", {key: r.id, className: "hover:bg-slate-50"},
            /*#__PURE__*/React.createElement("td", {className: td}, r.name),
            /*#__PURE__*/React.createElement("td", {className: td}, /*#__PURE__*/React.createElement("span", {className: badge(r.status)}, r.status)),
            /*#__PURE__*/React.createElement("td", {className: "px-4 py-3"},
              /*#__PURE__*/React.createElement("div", {className: "flex items-center gap-1.5"},
                /*#__PURE__*/React.createElement("button", {onClick: () => openEditTx(r), className: editBtn}, /*#__PURE__*/React.createElement(Pencil, {className: "h-3.5 w-3.5"})),
                /*#__PURE__*/React.createElement("button", {onClick: () => setTxTypes(ts => ts.filter(t => t.id !== r.id)), className: delBtn}, /*#__PURE__*/React.createElement(Trash2, {className: "h-3.5 w-3.5"})))))))),
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
              style: { background: "rgba(255,255,255,0.15)" } })
          ),
          React.createElement("div", null,
            React.createElement("label", { className: "block text-sm font-medium text-white/90 mb-1.5" }, "Mật khẩu"),
            React.createElement("input", { type: "password", value: pass, onChange: e => setPass(e.target.value), required: true,
              placeholder: "••••••••",
              className: "w-full border border-white/30 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-white/60 focus:border-transparent text-white placeholder-white/40",
              style: { background: "rgba(255,255,255,0.15)" } })
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
  const [editSaving, setEditSaving] = useState(false);

  const openEdit = u => { setEditUser(u); setEditName(u.name || ""); setEditEmail(u.email || ""); setEditRole(u.role || "sales"); };

  const saveEdit = async e => {
    e.preventDefault();
    setEditSaving(true);
    try {
      await saveDoc("users", editUser._id || editUser.uid || editUser.id, { ...editUser, name: editName.trim(), email: editEmail.trim(), role: editRole });
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
      await createUserProfile(cred.user.uid, { email: newEmail.trim(), name: newName.trim(), role: newRole });
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
        React.createElement(Th, null, "Vai trò"),
        React.createElement(Th, {center:true, style:{width:80}}, ""))
    },
      [...users].sort((a,b) => { const o = ["admin","manager","sales","warehouse"]; const ia = o.includes(a.role) ? o.indexOf(a.role) : 99; const ib = o.includes(b.role) ? o.indexOf(b.role) : 99; return ia - ib; }).map(u => React.createElement("tr", { key: u.email, className: "hover:bg-slate-50" },
        React.createElement("td", { className: "px-4 py-2.5 text-sm font-medium text-slate-800" }, u.name || ""),
        React.createElement("td", { className: "px-4 py-2.5 text-sm text-slate-500" }, u.email),
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

/* ───────── App wrapper với Auth ───────── */
function AppWithAuth() {
  const { user, profile, logout } = useAuth();
  if (user === undefined) return React.createElement("div", { className: "min-h-screen flex items-center justify-center text-slate-400" }, "Đang tải...");
  if (!user) return React.createElement(LoginScreen, null);
  return React.createElement(App, { profile, logout });
}

export default function Root() {
  return React.createElement(AuthProvider, null, React.createElement(AppWithAuth, null));
}
