import React, { useState, useMemo, useEffect } from 'react'
import PRODUCTS from './products.js'
import { useCollection, saveDoc, deleteDocument, batchSave } from './useFirestore.js'
import { AuthProvider, useAuth, ROLES, ALLOWED, createUserProfile } from './useAuth.js'
import { auth } from './firebase.js'
import { createUserWithEmailAndPassword } from 'firebase/auth'
import { LayoutDashboard, ShoppingCart, Package, Truck, RotateCcw, BookText, Wallet, BarChart3, Smartphone, Plus, Minus, Search, Trash2, ArrowLeft, ArrowLeftRight, TrendingUp, ChevronRight, FileText, Globe, Sparkles, Store, Percent, CreditCard, UserCog, Printer, Pencil, ArrowDownToLine, Check, Save, Eye, Warehouse, Upload, ChevronDown, X, Users, Image as ImageIcon, AlertTriangle, Copy, Settings } from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'


/* ───────── helpers ───────── */
const vnd = n => new Intl.NumberFormat("vi-VN").format(Math.round(n || 0));
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
  "Chờ giao hàng":  "bg-slate-100 text-slate-500 ring-slate-200",
  "Chờ xử lý":      "bg-[#FFFBEB] text-[#B45309] ring-[#FDE68A]",
  "Hoàn thành":     "bg-[#F0FDFA] text-[#0F766E] ring-[#0D9488]",
  "Huỷ":            "bg-[#FBE9E7] text-[#9A1B0E] ring-[#F5C5BE]"
};
const ORDER_TABS = ["Tất cả", "Chờ giao hàng", "Chờ xử lý", "Hoàn thành", "Huỷ"];
const PAY_STATUS = {
  "Đã đặt cọc":    "bg-slate-100 text-slate-500 ring-slate-200",
  "Chờ thanh toán": "bg-[#FFFBEB] text-[#B45309] ring-[#FDE68A]",
  "Đã thanh toán":  "bg-[#F0FDFA] text-[#0F766E] ring-[#0D9488]",
};
const KHO_STATUS = {
  "Cần nhập":      "bg-slate-100 text-slate-500 ring-slate-200",
  "Cần xuất":      "bg-slate-100 text-slate-500 ring-slate-200",
  "Đã xử lý kho": "bg-[#F0FDFA] text-[#0F766E] ring-[#0D9488]"
};
const DELIVERY = {
  "Đã giao hàng":   "bg-[#F0FDFA] text-[#0F766E] ring-[#0D9488]",
  "Chưa giao hàng": "bg-slate-100 text-slate-500 ring-slate-200"
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
  const total = (o.items||[]).reduce((s, l) => s + Math.max(0, l.price * l.qty - (l.disc || 0)), 0);
  const totalCost = (o.items||[]).reduce((s, l) => s + (l.cost||0) * l.qty, 0);
  const remaining = total - (o.paid||0);
  const payDone = total > 0 && remaining <= 0;
  const pay = payDone ? "Đã thanh toán"
    : o.deliveryConfirmed ? "Chờ thanh toán"
    : "Đã đặt cọc";
  const khoXong = !!(o.imported && o.exported);
  const isCancel = o.orderStatus === "Huỷ" || o.orderStatus === "Hủy";
  const orderStatus = isCancel ? "Huỷ"
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
    key: "settings_docnum",
    label: "Quy tắc đánh số chứng từ"
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
  dashboard: "Tổng quan",
  rp_sales: "Báo cáo bán hàng",
  rp_preorder: "Báo cáo sản phẩm đặt hàng",
  rp_staff: "Báo cáo nhân viên",
  settings: "Cài đặt",
  settings_payment: "Cài đặt thanh toán",
  settings_numformat: "Định dạng số",
  settings_docnum: "Quy tắc đánh số chứng từ"
};

/* ───────── atoms ───────── */
const Pill = ({
  map,
  value
}) => /*#__PURE__*/React.createElement("span", {
  className: `inline-flex items-center whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${map[value] || "bg-slate-100 text-slate-600 ring-slate-200"}`
}, value);
const field = "rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700 focus:border-[#0F766E] focus:outline-none";
const inputF = "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:border-[#0F766E] focus:outline-none focus:ring-1 focus:ring-[#CCFBF1]";
const inputSm = "w-full rounded-md border border-slate-200 px-2 py-1.5 text-sm focus:border-[#0F766E] focus:outline-none";

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
    pos: "text-[#047857]",
    neg: "text-[#B91C1C]",
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
  className: `-mb-px whitespace-nowrap border-b-2 px-3 py-2 text-[14px] transition ${active === t ? "border-[#0F766E] font-medium text-[#0F766E]" : "border-transparent text-slate-500 hover:text-slate-700"}`
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
    ? "rounded-md p-1.5 transition bg-[#FEE2E2] text-[#B91C1C] hover:bg-[#FECACA]"
    : `rounded-md p-1.5 transition hover:bg-slate-100 text-${tone}-500`
}, /*#__PURE__*/React.createElement(Icon, {
  className: "h-4 w-4"
}));
const blueBtn = "inline-flex items-center gap-1.5 rounded-lg bg-[#0D9488] px-3.5 py-1.5 text-[14px] font-semibold text-white shadow-sm hover:bg-[#0F766E]";
const greenBtn = "inline-flex items-center gap-1.5 rounded-lg bg-[#0F766E] px-3 py-1.5 text-[14px] font-semibold text-white hover:bg-[#0D5F58]";
const addBtn = "inline-flex items-center gap-1.5 rounded-lg border border-[#047857] bg-white px-3 py-1.5 text-[14px] font-semibold text-[#047857] hover:bg-[#F0FDF4]";
const ghostBtn = "inline-flex items-center gap-1.5 rounded-lg border border-[#CBD5E1] bg-white px-3 py-1.5 text-[14px] text-[#475569] hover:bg-[#F4F6F8]";
const outlineTealBtn = "inline-flex items-center gap-1.5 rounded-lg border border-[#0D9488] bg-white px-3 py-1.5 text-[14px] font-semibold text-[#0D9488] hover:bg-[#E6FFFA]";
const backBtn = "inline-flex items-center gap-1.5 rounded-lg border border-[#E2E8F0] bg-white px-3 py-1.5 text-[14px] text-[#64748B] hover:bg-[#F8FAFC]";

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
    className: "fixed top-5 left-1/2 z-[60] -translate-x-1/2 flex items-center gap-1.5 rounded-lg border border-[#B91C1C] bg-[#FEF2F2] px-4 py-2 text-sm font-medium text-[#B91C1C] shadow-lg"
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
  className: `inline-flex items-center rounded-md border border-[#0D9488] bg-white px-2.5 py-0.5 text-sm font-semibold text-[#0D9488] hover:bg-[#F0FDFA] ${className}`
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
    className: "font-semibold tabular-nums text-[#B91C1C]"
  }, vnd(633555810))), /*#__PURE__*/React.createElement("li", {
    className: "flex justify-between"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-slate-500"
  }, "— Đã thu"), /*#__PURE__*/React.createElement("span", {
    className: "font-medium tabular-nums text-[#047857]"
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
    className: "h-full rounded-full bg-[#0F766E]",
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
  setActive,
  openOrderId,
  setOpenOrderId,
  onExportKho,
  onImportKho
}) {
  const [view, setView] = useState(openOrderId ? {edit: openOrderId} : "list");
  React.useEffect(() => { if (openOrderId) { setView({edit: openOrderId}); setOpenOrderId && setOpenOrderId(null); } }, [openOrderId]);
  const [modal, setModal] = useState(null);
  const addOrder = (o, asDraft) => {
    const id = o.id && !asDraft ? o.id : (asDraft ? "BG000" + Math.floor(10 + Math.random() * 89) : "DH2602" + Math.floor(10 + Math.random() * 89));
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
    orders
  });
  if (view && view.edit) {
    const eo = orders.find(o => o.id === view.edit);
    if (eo) return /*#__PURE__*/React.createElement(CreateOrder, {
      editOrder: eo,
      onBack: () => setView("list"),
      onSaveEdit: o => saveEdit(eo.id, o),
      onSave: addOrder,
      onConvertDraft: eo.draft
        ? dhId => setOrders(os => os.map(o => o.id === eo.id ? {...o, draftStatus: "Đã tạo đơn hàng", linkedOrderId: dhId} : o))
        : undefined,
      onExportKho,
      onImportKho,
      orders
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
            date: p.dateIn ? new Date(p.dateIn).toLocaleDateString("vi-VN") : dateStr,
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
          slip: "PX" + base + "_" + String(Date.now() + i).slice(-4),
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
  const lbl = "mb-1 block text-[13px] font-medium text-slate-500";
  const inp = "w-full rounded-md border border-slate-200 px-2.5 py-1.5 text-sm focus:border-[#0F766E] focus:outline-none";
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
      className: "rounded-lg bg-[#0F766E] px-3.5 py-2 text-sm font-medium text-white hover:bg-[#0D5F58] disabled:bg-slate-300"
    }, "Xác nhận"))
  }, /*#__PURE__*/React.createElement("div", {
    className: "space-y-3"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: lbl
  }, "Loại"), /*#__PURE__*/React.createElement("div", {className: "flex gap-2"},
    ["Đặt cọc", "Thanh toán", "Giảm giá thêm"].map(s => /*#__PURE__*/React.createElement("button", {
      key: s, type: "button",
      onClick: () => setKind(s),
      className: `flex-1 rounded-lg border px-2.5 py-1.5 text-sm font-medium transition ${kind === s ? "border-[#A5D9BB] bg-[#E6F7EC] text-[#1B8A4D]" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"}`
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
  return p ? p.sku : "—";
};
function KhoModal({
  order,
  onClose,
  onConfirm
}) {
  const {whInItems: _inv} = useInventory();
  const stockOf = name => stockOfLive(name, _inv) || stockOfStatic(name);
  const [imported, setImported] = useState(!!order.imported);
  const [exported, setExported] = useState(!!order.exported);
  const [editing, setEditing] = useState(false);
  const [pn, setPn] = useState(order.pn || ("PN" + String(order.id).replace(/\D/g, "")));
  const [px, setPx] = useState(order.px || ("PX" + String(order.id).replace(/\D/g, "")));
  const [dateIn, setDateIn] = useState(order.dateIn || "2026-06-16");
  const [dateOut, setDateOut] = useState(order.dateOut || "2026-06-03");
  const [rows, setRows] = useState((order.items || []).map(it => {
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
  const ttNhap = r => { const stk = stockOf(r.name) || 0; return stk > 0 ? r.slXuat * r.giaNhap : r.slNhap * r.giaNhap + (r.cpmh || 0); };
  const ttXuat = r => r.slXuat * r.giaBan + (r.cpbh || 0);
  const loiNhuan = r => ttXuat(r) - (r.cpbh || 0) - ttNhap(r) - (r.cpmh || 0);
  const totalProfit = rows.reduce((s, r) => s + loiNhuan(r), 0);
  const totalIn = rows.reduce((s, r) => s + ttNhap(r), 0);
  const totalOut = rows.reduce((s, r) => s + ttXuat(r), 0);
  const cpmhTotal = rows.reduce((s, r) => s + (r.cpmh || 0), 0);
  const statusLabel = exported ? "Đã xuất kho" : imported ? "Đã nhập kho" : "Đang xử lý";
  const statusCls = exported ? "bg-emerald-50 text-emerald-700 ring-emerald-200" : imported ? "bg-sky-50 text-sky-700 ring-sky-200" : "bg-amber-50 text-amber-700 ring-amber-200";
  const inp = "w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm text-center focus:border-[#0F766E] focus:outline-none";
  const inpSL = "w-12 rounded-lg border border-slate-200 px-1 py-1.5 text-sm text-center focus:border-[#0F766E] focus:outline-none";
  const inpCP = "w-20 rounded-lg border border-slate-200 px-1 py-1.5 text-sm text-center focus:border-[#0F766E] focus:outline-none";
  const inpNCC = "w-44 rounded-lg border border-slate-200 px-2 py-1.5 text-sm text-left focus:border-[#0F766E] focus:outline-none";
  const inpGia = "w-28 rounded-lg border border-slate-200 px-2 py-1.5 text-sm text-center focus:border-[#0F766E] focus:outline-none";
  const fieldInp = "w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-[#0F766E] focus:outline-none";
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
        className: "rounded-lg border border-[#B91C1C] bg-[#FEF2F2] px-3.5 py-2 text-sm font-medium text-amber-700 hover:bg-amber-100 disabled:opacity-40"
      }, "✎ Sửa"),
      React.createElement("button", {
        onClick: doImport,
        disabled: imported && !editing,
        className: "rounded-lg bg-[#0F766E] px-3.5 py-2 text-sm font-medium text-white hover:bg-[#0D5F58] disabled:bg-slate-300"
      }, "↓ Nhập kho"),
      React.createElement("button", {
        onClick: doExport,
        disabled: (!imported && !editing) || (exported && !editing) || !order.deliveryConfirmed,
        title: !order.deliveryConfirmed ? "Cần xác nhận giao hàng trước khi xuất kho" : undefined,
        className: "rounded-lg bg-emerald-600 px-3.5 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:bg-slate-300 disabled:cursor-not-allowed"
      }, "↑ Xuất kho"))
  },
    !order.deliveryConfirmed && React.createElement("div", { className: "mb-4 flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3" },
      React.createElement("span", { className: "mt-0.5 shrink-0 text-amber-500" }, "⚠️"),
      React.createElement("p", { className: "text-sm text-amber-800" }, "Đơn hàng chưa được xác nhận giao hàng. Vui lòng xác nhận giao hàng trước khi thực hiện xuất kho.")),
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
            React.createElement("th", { rowSpan: 2, className: "border-b border-l border-amber-200 bg-amber-100/60 px-2 py-2 text-center font-semibold text-[#B91C1C]" }, "Lợi nhuận")),
          React.createElement("tr", { className: "border-b border-slate-200 bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500" },
            th("Tồn kho", "text-center"),
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
            return React.createElement("tr", { key: r.name, className: "border-b border-slate-100 align-middle" },
              React.createElement("td", { className: "px-3 py-3 text-center" },
                React.createElement("span", { className: `rounded px-1.5 py-0.5 text-xs font-medium ${(stock || 0) === 0 ? "bg-rose-100 text-[#B91C1C]" : "bg-emerald-100 text-emerald-700"}` }, stock ?? "—")),
              React.createElement("td", { className: "px-3 py-3 text-center" },
                React.createElement("select", { disabled: lockIn, className: `rounded-md border border-slate-200 px-1 py-1 text-xs ${lockIn ? "bg-slate-100 text-slate-400" : ""}`, value: r.kho, onChange: e => set(i, { kho: e.target.value }) },
                  React.createElement("option", { value: "TB" }, "TB"),
                  React.createElement("option", { value: "HG" }, "HG"),
                  React.createElement("option", { value: "HH" }, "HH"))),
              React.createElement("td", { className: "px-3 py-3 text-slate-800", style: { minWidth: 180 } }, r.name),
              React.createElement("td", { className: "border-l border-blue-100 bg-blue-50/30 px-2 py-3" },
                React.createElement("input", { type: "number", disabled: lockIn, className: `${inpSL} ${lockIn ? "bg-slate-100 text-slate-400" : ""}`, value: r.slNhap, onChange: e => set(i, { slNhap: +e.target.value }) })),
              React.createElement("td", { className: "bg-blue-50/30 px-2 py-3" }, (() => {
                  const stk = stockOf(r.name) || 0;
                  const autoPrice = stk > 0;
                  const prod = PRODUCTS.find(p => p.name === r.name);
                  const costVal = autoPrice ? (prod?.cost || r.giaNhap) : r.giaNhap;
                  return React.createElement(NumInput, { className: `${inpGia} ${(lockIn || autoPrice) ? "bg-slate-100 text-slate-400" : ""}`, align: "center", disabled: lockIn || autoPrice, value: costVal, onChange: v => set(i, { giaNhap: v }), title: autoPrice ? "Tự động lấy giá vốn từ kho (tồn > 0)" : "" });
                })()),
              React.createElement("td", { className: "bg-blue-50/30 px-2 py-3" },
                React.createElement(NumInput, { className: inpCP, align: "center", disabled: lockIn, value: r.cpmh, onChange: v => set(i, { cpmh: v }) })),
              React.createElement("td", { className: "bg-blue-50/30 px-2 py-3" },
                React.createElement("input", { className: `${inpNCC} ${lockIn ? "bg-slate-100 text-slate-400" : ""}`, disabled: lockIn, list: "ncc-list", value: r.nccIn, placeholder: "Lọc / chọn NCC", onChange: e => set(i, { nccIn: e.target.value }) })),
              moneyCell(ttNhap(r), "bg-blue-100/40 text-blue-700"),
              React.createElement("td", { className: "border-l border-emerald-100 bg-emerald-50/30 px-2 py-3" },
                React.createElement("input", { type: "number", disabled: true, className: `${inpSL} bg-slate-100 text-slate-400`, value: r.slXuat, onChange: e => set(i, { slXuat: +e.target.value }), title: "Tự động từ đơn hàng" })),
              React.createElement("td", { className: "bg-emerald-50/30 px-2 py-3" },
                React.createElement(NumInput, { className: `${inpGia} bg-slate-100 text-slate-400`, align: "center", disabled: true, value: r.giaBan, onChange: v => set(i, { giaBan: v }), title: "Tự động từ đơn hàng" })),
              React.createElement("td", { className: "bg-emerald-50/30 px-2 py-3" },
                React.createElement(NumInput, { className: `${inpCP} bg-slate-100 text-slate-400`, align: "center", disabled: true, value: r.cpbh, onChange: v => set(i, { cpbh: v }), title: "Tự động từ đơn hàng" })),
              moneyCell(ttXuat(r), "bg-emerald-100/40 text-emerald-700"),
              React.createElement("td", { className: "border-l border-amber-100 bg-amber-50/40 px-2 py-3 text-center text-sm font-semibold tabular-nums text-[#B91C1C]" }, num(loiNhuan(r))));
          }),
          React.createElement("tr", { className: "border-t-2 border-[#CCFBF1] bg-[#E6FFFA] font-semibold" },
            React.createElement("td", { className: "px-3 py-3 text-[14px] font-bold uppercase text-slate-800", colSpan: 3 }, "TỔNG CỘNG"),
            React.createElement("td", { colSpan: 4, className: "border-l border-blue-100 bg-blue-50/30" }),
            moneyCell(totalIn, "bg-blue-100/60 text-blue-700"),
            React.createElement("td", { colSpan: 3, className: "border-l border-emerald-100 bg-emerald-50/30" }),
            moneyCell(totalOut, "bg-emerald-100/60 text-emerald-700"),
            React.createElement("td", { className: "border-l border-amber-100 bg-amber-100/50 px-2 py-3 text-center text-sm font-bold tabular-nums text-[#B91C1C]" }, num(totalProfit)))))));
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
  const sm = "w-full rounded-md border border-slate-200 px-2 py-1 text-sm focus:border-[#0F766E] focus:outline-none";
  return /*#__PURE__*/React.createElement(Modal, {
    title: `Hoàn hàng — Đơn ${order.id}`,
    sub: "Chọn mặt hàng và số lượng khách trả lại",
    onClose: onClose,
    footer: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("span", {
      className: "mr-auto text-sm text-slate-500"
    }, "Tổng tiền hoàn: ", /*#__PURE__*/React.createElement("b", {
      className: "tabular-nums text-[#B91C1C]"
    }, vnd(total))), /*#__PURE__*/React.createElement("button", {
      onClick: onClose,
      className: "rounded-lg border border-slate-200 px-3.5 py-2 text-sm text-slate-600 hover:bg-slate-50"
    }, "Hủy"), /*#__PURE__*/React.createElement("button", {
      onClick: () => onConfirm({rows, reason}),
      disabled: total === 0,
      className: "rounded-lg bg-[#0F766E] px-3.5 py-2 text-sm font-medium text-white hover:bg-[#0D5F58] disabled:bg-slate-300"
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
  }))))));
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
    if (fStatus !== "Tất cả" && calc(o).orderStatus !== fStatus) return false;
    if (fStaff !== "Tất cả" && o.staff !== fStaff) return false;
    if (q && !`${o.id} ${o.name} ${o.phone}`.toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  });
  const onExport = () => exportCSV("danh-sach-don-hang", ["Số ĐH", "Ngày", "Khách hàng", "SĐT", "Địa chỉ", "Thành tiền", "Đã trả", "Còn lại", "Giao hàng", "Trạng thái", "Nhân viên"], rows.map(o => {
    const c = calc(o);
    return [o.id, o.dt, o.name, o.phone, o.addr, c.total, o.paid, c.remaining, o.delivery, c.orderStatus, o.staff];
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
    className: "mb-1 block text-[13px] font-medium text-slate-500"
  }, "Từ ngày"), /*#__PURE__*/React.createElement("input", {
    type: "date",
    defaultValue: "2026-06-01",
    className: field
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: "mb-1 block text-[13px] font-medium text-slate-500"
  }, "Đến ngày"), /*#__PURE__*/React.createElement("input", {
    type: "date",
    defaultValue: "2026-06-16",
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
  }, rows.length, " đơn · cuộn ngang để xem hết các cột →"), /*#__PURE__*/React.createElement(TableShell, {
    minW: "1360px",
    head: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(Th, {
      style: {
        width: 90, position: "sticky", left: 0, zIndex: 2, background: "#E6FFFA"
      }
    }, "Ngày"), /*#__PURE__*/React.createElement(Th, {
      style: {
        width: 96, position: "sticky", left: 90, zIndex: 2, background: "#E6FFFA"
      }
    }, "Số ĐH"), /*#__PURE__*/React.createElement(Th, {
      style: {
        width: 130, position: "sticky", left: 186, zIndex: 2, background: "#E6FFFA"
      }
    }, "Khách hàng"), /*#__PURE__*/React.createElement(Th, {
      style: {
        width: 180, position: "sticky", left: 316, zIndex: 2, background: "#E6FFFA"
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
    const rowBg = isCancel ? "#f1f5f9" : (ri % 2 === 0 ? "#FFFFFF" : "#F8FAFC");
    return /*#__PURE__*/React.createElement("tr", {
      key: o.id,
      className: `align-top hover:brightness-95 ${isCancel ? "opacity-60 grayscale text-slate-400" : ""}`,
      style: { background: rowBg, borderBottom: "1px solid #e2e8f0" }
    }, /*#__PURE__*/React.createElement("td", {
      className: "px-3 py-3",
      style: { position: "sticky", left: 0, zIndex: 1, background: rowBg }
    }, /*#__PURE__*/React.createElement(DateTime, {
      value: o.dt
    })), /*#__PURE__*/React.createElement("td", {
      className: "whitespace-nowrap px-3 py-3",
      style: { position: "sticky", left: 90, zIndex: 1, background: rowBg }
    }, /*#__PURE__*/React.createElement("button", {
      onClick: () => onEdit(o),
      className: "inline-flex items-center rounded-md border border-[#0D9488] bg-white px-2.5 py-0.5 text-sm font-semibold text-[#0D9488] hover:bg-[#F0FDFA]"
    }, o.id)), /*#__PURE__*/React.createElement("td", {
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
      className: "whitespace-nowrap px-3 py-3 text-right text-sm tabular-nums text-[#047857]"
    }, num(c.total)), /*#__PURE__*/React.createElement("td", {
      className: `whitespace-nowrap px-3 py-3 text-right text-sm tabular-nums ${o.paid > 0 ? "text-[#D97706]" : "text-[#94A3B8]"}`
    }, o.paid > 0 ? num(o.paid) : "–"), /*#__PURE__*/React.createElement("td", {
      className: `whitespace-nowrap px-3 py-3 text-right text-sm tabular-nums ${c.remaining > 0 ? "text-[#B91C1C]" : "text-[#94A3B8]"}`
    }, c.remaining > 0 ? num(c.remaining) : "—"), /*#__PURE__*/React.createElement("td", {
      className: "px-3 py-3 text-center"
    }, /*#__PURE__*/React.createElement(Pill, {
      map: ORDER_STATUS,
      value: c.orderStatus
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
      const label = !o.imported ? "Cần nhập" : !o.exported ? "Cần xuất" : "Đã xử lý kho";
      const cls = !o.imported ? "bg-slate-100 text-slate-500 ring-slate-200" : !o.exported ? "bg-slate-100 text-slate-500 ring-slate-200" : "bg-[#F0FDFA] text-[#0F766E] ring-[#0D9488]";
      return /*#__PURE__*/React.createElement("button", {
        onClick: () => onKho(o),
        title: "Mở màn hình xử lý kho (nhập → xuất)",
        className: `inline-flex cursor-pointer items-center whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset transition hover:opacity-70 ${cls}`
      }, label);
    })()), /*#__PURE__*/React.createElement("td", {
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
      className: "border-t-2 border-[#CCFBF1] bg-[#F0FDFA] font-semibold text-slate-800"
    }, /*#__PURE__*/React.createElement("td", {
      colSpan: 4,
      className: "px-3 py-3",
      style: { position: "sticky", left: 0, zIndex: 1, background: "#F0FDFA" }
    }, "TỔNG CỘNG (", rows.length, " ĐƠN)"), /*#__PURE__*/React.createElement("td", {
      className: "whitespace-nowrap px-3 py-3 text-right text-sm tabular-nums text-[#047857]", style: {fontWeight:700}
    }, num(sumTotal)), /*#__PURE__*/React.createElement("td", {
      className: `whitespace-nowrap px-3 py-3 text-right text-sm tabular-nums ${sumPaid > 0 ? "text-[#D97706]" : "text-[#94A3B8]"}`, style: {fontWeight:700}
    }, sumPaid > 0 ? num(sumPaid) : "–"), /*#__PURE__*/React.createElement("td", {
      className: `whitespace-nowrap px-3 py-3 text-right text-sm tabular-nums ${sumRemain > 0 ? "text-[#B91C1C]" : "text-[#94A3B8]"}`, style: {fontWeight:700}
    }, sumRemain > 0 ? num(sumRemain) : "–"), /*#__PURE__*/React.createElement("td", {
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
  "Đã tạo đơn hàng": "bg-[#F0FDFA] text-[#0F766E] ring-[#0D9488]"
  };
  const rows = drafts.filter(o => !q || `${o.id} ${o.name} ${o.phone} ${o.desc || ""}`.toLowerCase().includes(q.toLowerCase()));
  const onExport = () => exportCSV("bao-gia", ["Mã Báo giá", "Ngày", "Tên khách hàng", "Địa chỉ", "Diễn giải", "Trạng thái", "Nhân viên"], rows.map(o => [o.id, o.dt, o.name, o.addr, o.desc, o.draftStatus || "Chưa xử lý", o.staff]));
  const Toolbar = () => /*#__PURE__*/React.createElement("div", {
    className: "space-y-3"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex justify-end"
  }, /*#__PURE__*/React.createElement("button", {
    onClick: onNew,
    className: "inline-flex items-center gap-1.5 rounded-lg bg-[#0F766E] px-3.5 py-1.5 text-[14px] font-semibold text-white shadow-sm hover:bg-[#0D5F58]"
  }, /*#__PURE__*/React.createElement(Plus, {
    className: "h-4 w-4"
  }), " Tạo báo giá")), /*#__PURE__*/React.createElement("div", {
    className: "flex flex-wrap items-end gap-3 rounded-xl border border-slate-200 bg-white p-3"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: "mb-1 block text-[13px] font-medium text-slate-500"
  }, "Từ ngày"), /*#__PURE__*/React.createElement("input", {
    type: "date",
    defaultValue: "2026-06-01",
    className: field
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: "mb-1 block text-[13px] font-medium text-slate-500"
  }, "Đến ngày"), /*#__PURE__*/React.createElement("input", {
    type: "date",
    defaultValue: "2026-06-16",
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
    head: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(Th, null, "Số Báo giá"), /*#__PURE__*/React.createElement(Th, null, "Số ĐH"), /*#__PURE__*/React.createElement(Th, {
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
    }, "Ghi chú"), /*#__PURE__*/React.createElement(Th, {right: true}, "Tổng đơn"), /*#__PURE__*/React.createElement(Th, null, "Trạng thái"), /*#__PURE__*/React.createElement(Th, null, "Nhân viên"), /*#__PURE__*/React.createElement(Th, {
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
    className: "inline-flex items-center rounded-md border border-[#0D9488] bg-white px-2.5 py-0.5 text-sm font-semibold text-[#0D9488] hover:bg-[#F0FDFA]"
  }, o.id)), /*#__PURE__*/React.createElement("td", {
    className: "whitespace-nowrap px-4 py-3"
  }, o.linkedOrderId
    ? /*#__PURE__*/React.createElement("span", {className: "inline-flex items-center rounded-md border border-[#0D9488] bg-white px-2.5 py-0.5 text-sm font-semibold text-[#0D9488]"}, o.linkedOrderId)
    : /*#__PURE__*/React.createElement("span", {className: "text-slate-300 text-xs"}, "—")), /*#__PURE__*/React.createElement("td", {
    className: "px-4 py-3"
  }, /*#__PURE__*/React.createElement(DateTime, {
    value: o.dt
  })), /*#__PURE__*/React.createElement("td", {
    className: "px-4 py-3",
    style: {maxWidth: 130}
  }, /*#__PURE__*/React.createElement("div", {className: "text-slate-800 truncate"}, o.name),
    o.phone ? /*#__PURE__*/React.createElement("div", {className: "mt-0.5 text-xs text-slate-400"}, /*#__PURE__*/React.createElement(Phone, {value: o.phone})) : null), /*#__PURE__*/React.createElement("td", {
    className: "px-4 py-3 text-xs text-slate-500 truncate",
    style: {maxWidth: 120}
  }, o.addr || "—"), /*#__PURE__*/React.createElement("td", {
    className: "px-4 py-3 text-xs text-slate-500"
  }, o.note || "—"), /*#__PURE__*/React.createElement("td", {
    className: "px-4 py-3 text-right tabular-nums font-medium text-[#B91C1C]"
  }, vnd((o.items||[]).reduce((s,i)=>s+i.price*i.qty*(1-(i.disc||0)/100),0))), /*#__PURE__*/React.createElement("td", {
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
    tone: "danger",
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
  onConvertDraft,
  onExportKho,
  onImportKho,
  orders = []
}) {
  const notify = useToast();
  const {bankAccounts} = useBankAccounts();
  const isEdit = !!editOrder;
  const [prodsFS] = useCollection("products");
  const prods = prodsFS.length ? prodsFS : PRODUCTS;
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
  const [pendingOrderId] = useState(() => `DH2602${Math.floor(10 + Math.random() * 89)}`);
  const nowStr = () => { const d = new Date(), pad = n => String(n).padStart(2,"0"); return `${pad(d.getDate())}/${pad(d.getMonth()+1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`; };
  const effectiveOrderId = editOrder?.id || (!isDraft ? pendingOrderId : "");
  const autoAddTxn = (p) => {
    const nextId = _txns.length ? Math.max(..._txns.map(t=>t.id))+1 : 1;
    const d = new Date(), pad = n => String(n).padStart(2,"0");
    const dateStr = `${pad(d.getDate())}/${pad(d.getMonth()+1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
    _setTxns(xs => [{
      id: nextId,
      date: dateStr,
      entity: cust.name || "—",
      orderId: effectiveOrderId,
      kind: p.kind === "Đặt cọc" ? "Đặt cọc" : "Thanh toán",
      acc: p.account || "",
      amount: p.amount,
      note: `${p.kind === "Đặt cọc" ? "Tiền cọc" : "Thanh toán"} đơn hàng${effectiveOrderId ? " " + effectiveOrderId : ""}`,
      staff: p.staff || "QUẢN LÝ"
    }, ...xs]);
  };
  const CHI_KIND_MAP = {"Hoàn tiền hàng":"Chi phí","Chi phí Ship hàng":"Chi vận chuyển","Chi phí hoa hồng":"Chi phí"};
  const autoAddChi = (type, amount, acc) => {
    const nextId = _txns.length ? Math.max(..._txns.map(t=>t.id))+1 : 1;
    const d = new Date(), pad = n => String(n).padStart(2,"0");
    const dateStr = `${pad(d.getDate())}/${pad(d.getMonth()+1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
    _setTxns(xs => [{
      id: nextId, date: dateStr,
      entity: cust.name || "—",
      orderId: effectiveOrderId,
      kind: CHI_KIND_MAP[type] || "Chi phí",
      acc: acc || "",
      amount: -amount,
      note: `${type} đơn hàng${effectiveOrderId ? " " + effectiveOrderId : ""}`,
      staff: "QUẢN LÝ"
    }, ...xs]);
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
    "bg-[#F0FDFA] text-[#0F766E] ring-[#0D9488]",
  ];
  const badgeCls = (colIdx, activeIdx) => {
    if (activeIdx < 0 || colIdx > activeIdx) return "bg-slate-100 text-slate-400 ring-slate-200 opacity-40 cursor-not-allowed";
    if (colIdx < activeIdx) return COL_CLS[colIdx] + " opacity-60";
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
  const saveLabel = isEdit && !editOrder?.draft ? " Lưu thay đổi" : isDraft ? " Lưu báo giá" : " Lưu đơn hàng";
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
          onClick: () => { if (isDraft && payments.length > 0) { notify("⚠️ Đã có thanh toán — bắt buộc phải tạo đơn hàng"); return; } onSaveClick(); },
          disabled: subtotal === 0 || (isDraft && payments.length > 0),
          title: isDraft && payments.length > 0 ? "Đã có thanh toán, phải tạo đơn hàng" : undefined,
          className: outlineTealBtn + " disabled:cursor-not-allowed disabled:opacity-50"
        }, /*#__PURE__*/React.createElement(Save, {className: "h-4 w-4"}), saveLabel),
        isEdit && !editOrder?.draft && (
          !cancelled
            ? /*#__PURE__*/React.createElement("button", {type: "button", onClick: () => { setCancelled(true); const obj = build(); onSaveEdit({...obj, orderStatus: "Huỷ"}); notify("✅ Đã huỷ đơn"); setTimeout(onBack, 800); }, className: "inline-flex items-center rounded bg-slate-400 px-2.5 py-1.5 text-sm font-medium text-white hover:bg-slate-500"}, "Huỷ đơn")
            : /*#__PURE__*/React.createElement("button", {type: "button", onClick: () => { setCancelled(false); const obj = build(); onSaveEdit({...obj, orderStatus: ""}); notify("✅ Đã bỏ huỷ"); setTimeout(onBack, 800); }, className: "inline-flex items-center rounded border border-slate-200 bg-white px-2.5 py-1.5 text-sm font-medium text-slate-400 hover:bg-slate-50"}, "Bỏ huỷ")),
        (!isEdit || editOrder?.draft) && /*#__PURE__*/React.createElement("button", {
          onClick: () => { setSaveTried(true); if (!custValidFull) { notify("⚠️ Vui lòng điền đầy đủ thông tin và địa chỉ chi tiết"); return; } const dhId = editOrder?.draft ? pendingOrderId : null; onSave(dhId ? {...build(), id: dhId} : build(), false); if (dhId && onConvertDraft) onConvertDraft(dhId); notify("✅ Đã tạo đơn hàng"); setTimeout(onBack, 800); },
          disabled: subtotal === 0,
          className: blueBtn + " disabled:cursor-not-allowed disabled:opacity-50"
        }, /*#__PURE__*/React.createElement(ShoppingCart, {className: "h-4 w-4"}), " Tạo đơn hàng"),
        /*#__PURE__*/React.createElement("div", {className: "relative"},
          /*#__PURE__*/React.createElement("button", {onClick: () => { setSaveTried(true); if (!custValidFull) { notify("⚠️ Địa chỉ giao hàng chưa đủ chi tiết để in đơn"); return; } setShowPrintMenu(v => !v); }, className: ghostBtn},
            /*#__PURE__*/React.createElement(Printer, {className: "h-4 w-4"}), " In ", /*#__PURE__*/React.createElement(ChevronDown, {className: "h-3.5 w-3.5"})),
          showPrintMenu && /*#__PURE__*/React.createElement("div", {className: "absolute right-0 top-full z-20 mt-1 min-w-[140px] rounded-lg border border-slate-200 bg-white py-1 shadow-lg"},
            /*#__PURE__*/React.createElement("button", {onClick: () => { window.print(); setShowPrintMenu(false); }, className: "block w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"}, "In đơn hàng"),
            /*#__PURE__*/React.createElement("button", {onClick: () => setShowPrintMenu(false), className: "block w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"}, "Xuất PDF"))),
        /*#__PURE__*/React.createElement("button", {onClick: () => { if (isDraft && payments.length > 0) { notify("⚠️ Đã có thanh toán — bắt buộc phải tạo đơn hàng trước khi quay lại"); return; } onBack(); }, className: backBtn},
          /*#__PURE__*/React.createElement(ArrowLeft, {className: "h-4 w-4"}), " Quay lại")),
      /*#__PURE__*/React.createElement("input", {type: "datetime-local", value: dt, onChange: e => setDt(e.target.value), className: field}))),
  isDraft && payments.length > 0 && /*#__PURE__*/React.createElement("div", {className:"flex items-center gap-2 rounded-lg border border-[#B91C1C] bg-[#FEF2F2] px-4 py-2.5 text-sm font-medium text-amber-800"},
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
                className: "flex w-full flex-col px-3 py-2 text-left hover:bg-[#F0FDFA]"},
                /*#__PURE__*/React.createElement("span", {className: "font-medium text-slate-800"}, s.phone, /*#__PURE__*/React.createElement("span", {className: "ml-2 text-[#0F766E]"}, s.name)),
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
        (payActiveIdx === 2 ? [["Đã thanh toán", 2]] : paySteps.map((s,i) => [s,i])).map(([s, i]) =>
          /*#__PURE__*/React.createElement("span", {key: s, className: `inline-flex flex-1 items-center justify-center rounded px-2 py-1.5 text-sm font-semibold ring-1 ring-inset ${badgeCls(i, payActiveIdx)}`}, s))),
),
    /*#__PURE__*/React.createElement("div", {className: "rounded-lg border border-slate-200 bg-slate-50 px-4 py-3"},
      /*#__PURE__*/React.createElement("label", {className: "mb-2 block text-sm font-semibold text-slate-600"}, "Trạng thái kho"),
      /*#__PURE__*/React.createElement("div", {className: "flex gap-2"},
        (khoActiveIdx === 2
          ? [["Đã xử lý kho", 2, () => setShowKhoModal(true)]]
          : [["Nhập kho", 0, () => setShowKhoModal(true)], ["Xuất kho", 1, () => setShowKhoModal(true)], ["Đã xử lý kho", 2, () => setShowKhoModal(true)]]
        ).map(([lbl, colIdx, onClick]) => {
          const cls = badgeCls(colIdx, khoActiveIdx);
          const isActive = colIdx === khoActiveIdx;
          return isActive
            ? /*#__PURE__*/React.createElement("button", {key: lbl, type: "button", onClick, className: `inline-flex flex-1 items-center justify-center rounded py-1.5 text-sm font-semibold ring-1 ring-inset ${cls} transition hover:brightness-95`}, lbl)
            : /*#__PURE__*/React.createElement("span", {key: lbl, className: `inline-flex flex-1 items-center justify-center whitespace-nowrap rounded px-2 py-1.5 text-sm font-semibold ring-1 ring-inset ${cls}`}, lbl);
        })))),
  /*#__PURE__*/React.createElement("div", null,
    /*#__PURE__*/React.createElement("div", {className: "mb-2 flex items-center justify-between"},
      /*#__PURE__*/React.createElement("p", {className: "text-sm font-semibold text-slate-700"}, "Danh sách sản phẩm"),
      !isDraft && !(isEdit && editOrder?.draft) && /*#__PURE__*/React.createElement("div", {className: "relative"},
        deliveryConfirmed
          ? /*#__PURE__*/React.createElement("button", {className: "inline-flex items-center gap-1.5 rounded-lg bg-[#0F766E] px-3 py-1.5 text-sm font-bold text-white"},
              /*#__PURE__*/React.createElement(Check, {className: "h-4 w-4"}), " Đã giao hàng")
          : /*#__PURE__*/React.createElement("button", {
              onClick: () => { setDeliveryConfirmed(true); },
              className: "inline-flex items-center gap-1.5 rounded-lg bg-[#0F766E] px-3 py-1.5 text-sm font-medium text-white hover:bg-[#0D5F58]"
            }, /*#__PURE__*/React.createElement(Truck, {className: "h-4 w-4"}), " Xác nhận giao hàng"))),
    addrWarnPending ? /*#__PURE__*/React.createElement("div", {className: "mb-3 flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3"},
      /*#__PURE__*/React.createElement("span", {className: "mt-0.5 shrink-0 text-amber-500"}, "⚠️"),
      /*#__PURE__*/React.createElement("div", {className: "flex-1 text-sm"},
        /*#__PURE__*/React.createElement("p", {className: "font-medium text-amber-800"}, "Địa chỉ giao hàng chưa đủ chi tiết"),
        /*#__PURE__*/React.createElement("div", {className: "mt-2 flex gap-2"},
          /*#__PURE__*/React.createElement("button", {onClick: () => setAddrWarnPending(false), className: "rounded-md bg-white px-3 py-1 text-xs font-medium text-slate-700 ring-1 ring-inset ring-slate-300 hover:bg-slate-50"}, "Cập nhật địa chỉ"),
          /*#__PURE__*/React.createElement("button", {onClick: () => { setAddrWarnPending(false); setDelivery("Đã giao hàng"); }, className: "rounded-md bg-amber-600 px-3 py-1 text-xs font-medium text-white hover:bg-amber-700"}, "Vẫn xác nhận")))) : null,
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
              l.unit || "—"),
            /*#__PURE__*/React.createElement("td", {className: "px-3 py-2 border-b border-slate-100"},
              /*#__PURE__*/React.createElement("input", {type: "number", className: `${sm} text-center`, value: l.qty, onChange: e => setLine(i, {qty: +e.target.value})})),
            /*#__PURE__*/React.createElement("td", {className: "px-3 py-2 border-b border-slate-100 text-right tabular-nums text-slate-500 text-sm"},
              l.list > 0 ? num(l.list) : /*#__PURE__*/React.createElement("span", {className: "text-slate-300"}, "—")),
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
              /*#__PURE__*/React.createElement("select", {className: "rounded border border-slate-200 bg-white px-1.5 py-1 text-xs text-slate-700 focus:outline-none focus:border-[#0F766E]", value: l.kho||"HH", onChange: e => setLine(i,{kho:e.target.value})},
                /*#__PURE__*/React.createElement("option", null, "HH"),
                /*#__PURE__*/React.createElement("option", null, "HG"),
                /*#__PURE__*/React.createElement("option", null, "SR"))),
            /*#__PURE__*/React.createElement("td", {className: "px-3 py-2 border-b border-slate-100"},
              /*#__PURE__*/React.createElement("button", {onClick: () => setLines(ls => ls.filter((_,x)=>x!==i)), title: "Xoá", className: "rounded p-1.5 bg-[#FEE2E2] text-[#B91C1C] hover:bg-[#FECACA]"},
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
                  onClick: () => setShowReturnModal(true),
                  className: "flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-colors"
                }, /*#__PURE__*/React.createElement(RotateCcw, {className: "h-3 w-3"}), " Hoàn hàng")))),
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
                ...returns.map((ret,i) => /*#__PURE__*/React.createElement("tr", {key:i},
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
                    /*#__PURE__*/React.createElement("button", {onClick:()=>setReturns(xs=>xs.filter((_,j)=>j!==i)), title:"Xoá", className:"rounded p-1 bg-[#FEE2E2] text-[#B91C1C] hover:bg-[#FECACA]"},
                      /*#__PURE__*/React.createElement(X, {className:"h-3 w-3"})))))),
                /*#__PURE__*/React.createElement("tr", {className:"bg-slate-50 font-semibold text-sm"},
                  /*#__PURE__*/React.createElement("td", {className:"px-3 py-2 text-slate-600", colSpan:2}, "Tổng cộng"),
                  /*#__PURE__*/React.createElement("td", {className:"px-3 py-2 text-center tabular-nums"}, returns.reduce((s,r)=>s+(r.qty||0),0)),
                  /*#__PURE__*/React.createElement("td", {className:"px-3 py-2 text-right tabular-nums"}, vnd(returns.reduce((s,r)=>s+(r.amount||0),0))),
                  /*#__PURE__*/React.createElement("td", {className:"px-3 py-2 text-right tabular-nums"}, vnd(returns.reduce((s,r)=>s+(r.fee||0),0))),
                  /*#__PURE__*/React.createElement("td", {className:"px-3 py-2", colSpan:4})))),
  /*#__PURE__*/React.createElement("div", {className: "flex gap-4 items-start"},
    /*#__PURE__*/React.createElement("div", {className:"flex-1 rounded-xl bg-white shadow-sm border border-slate-200"},
      /*#__PURE__*/React.createElement("div", {className:"flex items-center justify-between h-14 px-4 border-b border-slate-200"},
        /*#__PURE__*/React.createElement("p", {className:"text-[16px] font-semibold text-[#0F766E]"}, "Thông tin đơn hàng")),
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
          /*#__PURE__*/React.createElement("dd", {className:`tabular-nums font-bold ${remaining>0?"text-[#B91C1C]":"text-[#047857]"}`}, vnd(remaining)))),
      /*#__PURE__*/React.createElement("div", {className:"mt-5 flex gap-3"},
        /*#__PURE__*/React.createElement("button", {onClick:()=>setPayModal(true), className:"flex-1 rounded-xl bg-[#0F766E] py-2 text-sm font-medium text-white hover:bg-[#0D5F58]"}, "Thanh toán")))),
    /*#__PURE__*/React.createElement("div", {className:"flex-1 rounded-xl bg-white shadow-sm"},
      /*#__PURE__*/React.createElement("div", {className:"flex items-center justify-between h-14 px-4 border-b border-slate-200"},
        /*#__PURE__*/React.createElement("p", {className:"text-[16px] font-semibold text-[#0F766E]"}, "Lịch sử thanh toán")),
      /*#__PURE__*/React.createElement("div", {className:"p-4"},
        payments.length === 0
          ? /*#__PURE__*/React.createElement("p", {className:"text-center text-sm text-slate-400"}, "Chưa có thanh toán")
          : /*#__PURE__*/React.createElement("div", {className:"space-y-2"},
              ...payments.map((p,i) => /*#__PURE__*/React.createElement("div", {key:i, className:"rounded-xl border border-[#0F766E] bg-[#F0FDFA]/60 px-3 py-2 text-xs"},
                /*#__PURE__*/React.createElement("div", {className:"flex items-center justify-between gap-2"},
                  /*#__PURE__*/React.createElement("div", {className:"min-w-0 flex-1 truncate whitespace-nowrap"},
                    /*#__PURE__*/React.createElement("span", {className:"font-semibold text-slate-800"}, (p.kind||"Thanh toán"), " : ", vnd(p.amount), "đ"),
                    /*#__PURE__*/React.createElement("span", {className:"mx-1.5 text-slate-300"}, "·"),
                    /*#__PURE__*/React.createElement("span", {className:"text-slate-500"}, p.datetime||p.date||""),
                    p.account && [/*#__PURE__*/React.createElement("span", {key:"dot", className:"mx-1.5 text-slate-300"}, "·"), /*#__PURE__*/React.createElement("span", {key:"acc", className:"font-medium text-[#0F766E]"}, p.account)]),
                  /*#__PURE__*/React.createElement("div", {className:"flex shrink-0 items-center gap-1"},
                    /*#__PURE__*/React.createElement("span", {className:"rounded-full bg-[#0F766E] px-2 py-0.5 text-[11px] font-medium text-white"}, p.staff||"quanly01"),
                    /*#__PURE__*/React.createElement("button", {onClick:()=>{setEditPayIdx(i);setEditPayModal(true);}, title:"Sửa", className:"rounded p-1 bg-[#0F766E] text-white hover:bg-[#0D5F58]"}, /*#__PURE__*/React.createElement(Pencil, {className:"h-3 w-3"})),
                    /*#__PURE__*/React.createElement("button", {onClick:()=>{const delta=p.kind==="Tiền hàng trả lại"||p.kind==="Hoàn tiền"?-p.amount:p.kind==="Giảm giá thêm"?0:p.amount;setPayments(xs=>xs.filter((_,j)=>j!==i));setPaid(v=>Math.max(0,v-delta));}, title:"Xóa", className:"rounded p-1 bg-[#FEE2E2] text-[#B91C1C] hover:bg-[#FECACA]"}, /*#__PURE__*/React.createElement(X, {className:"h-3 w-3"}))))))))),
    /*#__PURE__*/React.createElement("div", {className:"flex-1 rounded-xl bg-white shadow-sm border border-slate-200"},
      /*#__PURE__*/React.createElement("div", {className:"flex items-center justify-between h-14 px-4 border-b border-slate-200"},
        /*#__PURE__*/React.createElement("p", {className:"text-[16px] font-semibold text-[#0F766E]"}, "Chi phí công ty thanh toán"),
        /*#__PURE__*/React.createElement("button", {onClick:()=>setCompCostModal(true), className:"flex items-center gap-1.5 rounded-lg border border-[#047857] bg-white px-3 py-1.5 text-sm font-semibold text-[#047857] hover:bg-[#F0FDF4]"},
          /*#__PURE__*/React.createElement(Plus, {className:"h-4 w-4"}), "Thêm")),
      /*#__PURE__*/React.createElement("div", {className:"p-4"},
        compCosts.length === 0
          ? /*#__PURE__*/React.createElement("p", {className:"text-center text-sm text-slate-400"}, "Chưa có chi phí nào")
          : /*#__PURE__*/React.createElement("div", {className:"space-y-1.5"},
              ...compCosts.map((c,i) => /*#__PURE__*/React.createElement("div", {key:"cc"+i, className:"flex items-center justify-between text-xs"},
                /*#__PURE__*/React.createElement("span", {className:"text-slate-600"}, c.type),
                /*#__PURE__*/React.createElement("div", {className:"flex items-center gap-2"},
                  /*#__PURE__*/React.createElement("span", {className:"font-medium text-slate-800"}, vnd(c.amount)),
                  /*#__PURE__*/React.createElement("button", {onClick:()=>setCompCosts(xs=>xs.filter((_,j)=>j!==i)), className:"text-slate-400 hover:text-[#B91C1C]"}, /*#__PURE__*/React.createElement(X, {className:"h-3.5 w-3.5"})))))))),
  ),
  /*#__PURE__*/React.createElement("div", {className:"rounded-xl bg-white shadow-sm border border-slate-200"},
    /*#__PURE__*/React.createElement("div", {className:"px-4 py-3 border-b border-slate-200"},
      /*#__PURE__*/React.createElement("p", {className:"text-[16px] font-semibold text-[#0F766E]"}, "Nhật ký đơn hàng")),
    logs.length === 0
      ? /*#__PURE__*/React.createElement("p", {className:"p-4 text-center text-sm text-slate-400"}, "Chưa có nhật ký")
      : /*#__PURE__*/React.createElement("table", {className:"w-full text-sm"},
          /*#__PURE__*/React.createElement("thead", null,
            /*#__PURE__*/React.createElement("tr", {className:"bg-slate-50 text-left text-xs font-medium uppercase tracking-wide text-slate-500 border-b border-slate-200"},
              /*#__PURE__*/React.createElement("th", {className:"px-4 py-2.5", style:{width:150}}, "Thời gian"),
              /*#__PURE__*/React.createElement("th", {className:"px-4 py-2.5", style:{width:130}}, "Người thực hiện"),
              /*#__PURE__*/React.createElement("th", {className:"px-4 py-2.5", style:{width:180}}, "Hành động"),
              /*#__PURE__*/React.createElement("th", {className:"px-4 py-2.5"}, "Chi tiết"))),
          /*#__PURE__*/React.createElement("tbody", {className:"divide-y divide-slate-100"},
            ...logs.map((l,i) => /*#__PURE__*/React.createElement("tr", {key:i, className:"align-top hover:bg-slate-50/60"},
              /*#__PURE__*/React.createElement("td", {className:"px-4 py-2.5 text-xs text-slate-500 whitespace-nowrap"}, l.dt),
              /*#__PURE__*/React.createElement("td", {className:"px-4 py-2.5 text-xs font-medium text-slate-700"}, l.staff),
              /*#__PURE__*/React.createElement("td", {className:"px-4 py-2.5 text-xs"},
                /*#__PURE__*/React.createElement("span", {className: l.action === "Tạo đơn hàng" ? "font-semibold text-[#047857]" : "text-slate-500"}, l.action)),
              /*#__PURE__*/React.createElement("td", {className:"px-4 py-2.5 text-xs text-slate-600"}, l.detail)))))),
  editPayModal && editPayIdx !== null && /*#__PURE__*/React.createElement(PaymentModal, {
    accounts: ACCOUNTS,
    initial: payments[editPayIdx],
    onClose: () => { setEditPayModal(false); setEditPayIdx(null); },
    onConfirm: p => {
      const oldP = payments[editPayIdx];
      const oldDelta = oldP.kind==="Hoàn tiền"?-oldP.amount:oldP.kind==="Giảm giá thêm"?0:oldP.amount;
      const newDelta = p.kind==="Hoàn tiền"?-p.amount:p.kind==="Giảm giá thêm"?0:p.amount;
      setPayments(xs => xs.map((x,i) => i===editPayIdx ? {...p, date:oldP.date} : x));
      setPaid(v => Math.max(0, v-oldDelta+newDelta));
      setEditPayModal(false); setEditPayIdx(null);
    }
  }),
  payModal && /*#__PURE__*/React.createElement(PaymentModal, {
    accounts: ACCOUNTS,
    onClose: () => setPayModal(false),
    onConfirm: p => {
      setPayments(xs => [...xs, p]);
      const delta = p.kind==="Tiền hàng trả lại"||p.kind==="Hoàn tiền"?-p.amount:p.kind==="Giảm giá thêm"?0:p.amount;
      setPaid(v => Math.max(0, v+delta));
      addLog("payments_added", `POS - Đã thêm 1 thanh toán, tổng tiền: ${vnd(p.amount)}đ`, p.staff);
      autoAddTxn(p);
      setPayModal(false);
    }
  }),
  custExpModal && /*#__PURE__*/React.createElement(Modal, {
    title: "Chi phí đơn hàng (KH Thanh toán)", maxW: "max-w-sm", onClose: ()=>setCustExpModal(false),
    footer: /*#__PURE__*/React.createElement(React.Fragment, null,
      /*#__PURE__*/React.createElement("button", {onClick:()=>setCustExpModal(false), className:"rounded-lg border border-slate-200 px-3.5 py-2 text-sm text-slate-600 hover:bg-slate-50"}, "Huỷ"),
      /*#__PURE__*/React.createElement("button", {onClick:()=>{if(cexpAmt>0){setCustExpenses(xs=>[...xs,{type:cexpType,amount:cexpAmt}]);}setCustExpModal(false);setCexpAmt(0);}, className:"rounded-lg bg-[#047857] px-3.5 py-2 text-sm font-medium text-white hover:bg-[#065F46]"}, "Thêm"))
  }, /*#__PURE__*/React.createElement("div", {className:"space-y-3"},
    /*#__PURE__*/React.createElement("div", null,
      /*#__PURE__*/React.createElement("label", {className:"mb-1 block text-[13px] font-medium text-slate-500"}, "Loại chi phí"),
      /*#__PURE__*/React.createElement("select", {value:cexpType, onChange:e=>setCexpType(e.target.value), className:"w-full rounded-md border border-slate-200 px-2.5 py-1.5 text-sm focus:outline-none"},
        /*#__PURE__*/React.createElement("option", null, "Chi phí giao hàng >15km"),
        /*#__PURE__*/React.createElement("option", null, "Chi phí lắp đặt"),
        /*#__PURE__*/React.createElement("option", null, "Hoàn tiền đơn hàng"))),
    /*#__PURE__*/React.createElement("div", null,
      /*#__PURE__*/React.createElement("label", {className:"mb-1 block text-[13px] font-medium text-slate-500"}, "Số tiền"),
      /*#__PURE__*/React.createElement(NumInput, {value:cexpAmt, onChange:setCexpAmt, className:"w-full rounded-md border border-slate-200 px-2.5 py-1.5 text-sm focus:outline-none focus:border-[#0F766E]"})))),
  compCostModal && /*#__PURE__*/React.createElement(Modal, {
    title: "Chi phí thực tế (Công ty thanh toán)", maxW: "max-w-sm", onClose: ()=>setCompCostModal(false),
    footer: /*#__PURE__*/React.createElement(React.Fragment, null,
      /*#__PURE__*/React.createElement("button", {onClick:()=>setCompCostModal(false), className:"rounded-lg border border-slate-200 px-3.5 py-2 text-sm text-slate-600 hover:bg-slate-50"}, "Huỷ"),
      /*#__PURE__*/React.createElement("button", {onClick:()=>{if(ccostAmt>0){setCompCosts(xs=>[...xs,{type:ccostType,amount:ccostAmt}]);autoAddChi(ccostType,ccostAmt,ccostAcc);}setCompCostModal(false);setCcostAmt(0);setCcostAcc("");}, className:"rounded-lg bg-[#047857] px-3.5 py-2 text-sm font-medium text-white hover:bg-[#065F46]"}, "Thêm"))
  }, /*#__PURE__*/React.createElement("div", {className:"space-y-3"},
    /*#__PURE__*/React.createElement("div", null,
      /*#__PURE__*/React.createElement("label", {className:"mb-1 block text-[13px] font-medium text-slate-500"}, "Loại chi phí"),
      /*#__PURE__*/React.createElement("select", {value:ccostType, onChange:e=>setCcostType(e.target.value), className:"w-full rounded-md border border-slate-200 px-2.5 py-1.5 text-sm focus:outline-none"},
        /*#__PURE__*/React.createElement("option", null, "Hoàn tiền hàng"),
        /*#__PURE__*/React.createElement("option", null, "Chi phí Ship hàng"),
        /*#__PURE__*/React.createElement("option", null, "Chi phí hoa hồng"))),
    /*#__PURE__*/React.createElement("div", null,
      /*#__PURE__*/React.createElement("label", {className:"mb-1 block text-[13px] font-medium text-slate-500"}, "Tài khoản chi"),
      /*#__PURE__*/React.createElement("select", {value:ccostAcc, onChange:e=>setCcostAcc(e.target.value), className:"w-full rounded-md border border-slate-200 px-2.5 py-1.5 text-sm focus:outline-none"},
        /*#__PURE__*/React.createElement("option", {value:""}, "— Chọn tài khoản —"),
        bankAccounts.filter(a=>a.status==="Hoạt động").map(a=>/*#__PURE__*/React.createElement("option", {key:a.key, value:a.bank}, a.bank)))),
    /*#__PURE__*/React.createElement("div", null,
      /*#__PURE__*/React.createElement("label", {className:"mb-1 block text-[13px] font-medium text-slate-500"}, "Số tiền"),
      /*#__PURE__*/React.createElement(NumInput, {value:ccostAmt, onChange:setCcostAmt, className:"w-full rounded-md border border-slate-200 px-2.5 py-1.5 text-sm focus:outline-none focus:border-[#0F766E]"}))))
  ,
  isEdit && !editOrder?.draft && showKhoModal && /*#__PURE__*/React.createElement(KhoModal, {
    order: {...editOrder, imported, exported, deliveryConfirmed, items: lines.filter(l => l.name).map(l => ({name: l.name, qty: l.qty, price: l.price, cost: l.cost || 0, kho: l.kho || "HH", supplier: l.supplier || ""}))},
    onClose: () => setShowKhoModal(false),
    onConfirm: p => {
      setImported(true);
      if (p.allExported) setExported(true);
      const now = new Date();
      const dateStr = now.toLocaleDateString("vi-VN");
      const base = now.toISOString().slice(0,10).replace(/-/g,"");
      const ordItems = lines.filter(l => l.name);
      if (!p.allExported && onImportKho) {
        onImportKho(ordItems.map((it, i) => {
          const costNcc = p.items[i]?.cost || it.cost || 0;
          return {
            lot: (p.pn || ("PN" + base + "_" + String(Date.now()).slice(-4))) + (ordItems.length > 1 ? "_" + i : ""),
            date: p.dateIn ? new Date(p.dateIn).toLocaleDateString("vi-VN") : dateStr,
            prod: it.name,
            store: it.kho || "Kho HH",
            qtyIn: it.qty,
            qtyNow: it.qty,
            qtyRemaining: it.qty,
            costNcc,
            unitCost: costNcc,
            fee: 0,
            supplier: p.items[i]?.supplier || it.supplier || "",
            order: effectiveOrderId,
            staff: "NGOC HA",
            pay: "Chưa thanh toán"
          };
        }));
      }
      if (p.allExported && onExportKho) {
        const dt = dateStr + " " + now.toLocaleTimeString("vi-VN", {hour:"2-digit", minute:"2-digit"});
        onExportKho(ordItems.map((it, i) => ({
          slip: "PX" + base + "_" + String(Date.now() + i).slice(-4),
          dt,
          order: effectiveOrderId,
          sku: it.sku || "",
          prod: it.name,
          supplier: p.items[i]?.supplier || it.supplier || "",
          store: it.kho || "Kho HH",
          lot: "",
          qty: it.qty,
          sale: it.price,
          unitCost: p.items[i]?.cost || it.cost || 0,
          cust: cust.name,
          addr: cust.addr || "",
          orderStatus: "Chờ xử lý",
          delivery: delivery || "Chưa giao hàng",
          staff: "NGOC HA"
        })));
      }
    }
  })
  ),
  showReturnModal && /*#__PURE__*/React.createElement(ReturnModal, {
    order: {id: effectiveOrderId, items: lines.filter(l=>l.name).map(l=>({name:l.name, price:l.price, qty:l.qty}))},
    onClose: () => setShowReturnModal(false),
    onConfirm: ({rows, reason}) => {
      setReturns(rows.filter(r=>r.qty>0).map(r=>({prod:r.name, date:"", qty:r.qty, amount:r.price*r.qty, fee:0, note:reason||""})));
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
  }, /*#__PURE__*/React.createElement("span", {className: "inline-flex items-center rounded-md border border-[#0D9488] bg-white px-2.5 py-0.5 text-sm font-semibold text-[#0D9488] hover:bg-[#F0FDFA]"}, r.order)), /*#__PURE__*/React.createElement("td", {
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
function PurchaseModule({onImportToWh, purchaseList: list, setPurchaseList: setList}) {
  const [view, setView] = React.useState("list"); // "list" | "create" | {edit: record}
  const onSave = recs => setList(xs => [...recs, ...xs]);
  if (view === "create") return /*#__PURE__*/React.createElement(PurchaseCreate, {onBack: () => setView("list"), onSave, onImportToWh});
  if (view && view.edit) return /*#__PURE__*/React.createElement(PurchaseCreate, {editRecord: view.edit, onBack: () => setView("list"), onSave, onImportToWh});
  return /*#__PURE__*/React.createElement(PurchaseList, {
    onNew: () => setView("create"),
    onEdit: r => setView({edit: r}),
    onImportToWh,
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
  const [supText, setSupText] = useState("");
  const [supId, setSupId] = useState("");
  const [note, setNote] = useState("");
  const [rows, setRows] = useState([{name: "", qty: 1, price: 0, disc: 0, discType: "%", cpmh: 0}]);
  const [payStatus, setPayStatus] = useState("Chờ thanh toán");
  const [orderStatus, setOrderStatus] = useState("Chờ giao hàng");
  const [newProdReq, setNewProdReq] = useState(null);
  const set = (i, p) => setRows(xs => xs.map((x, k) => k === i ? {...x, ...p} : x));
  const sm = "w-full rounded-md border border-slate-200 px-2 py-1.5 text-sm focus:border-[#0F766E] focus:outline-none";
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
    const dateStr = `${pad2(d.getDate())}/${pad2(d.getMonth()+1)}/${d.getFullYear()}`;
    const base = Date.now();
    return rows.filter(l => l.name).map((l, i) => ({
      lot: `PM${d.getFullYear()}${pad2(d.getMonth()+1)}${pad2(d.getDate())}_${String(base + i).slice(-4)}`,
      date: dateStr,
      prod: l.name,
      store: "Kho HH",
      qtyIn: l.qty,
      qtyNow: 0,
      costNcc: l.price,
      fee: l.cpmh || 0,
      supplier: supText || "—",
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
          onClick: () => { const recs = buildRecords(); if (onSave) onSave(recs); notify("Đã lưu phiếu mua hàng"); onBack(); },
          disabled: subtotal === 0,
          className: outlineTealBtn + " disabled:cursor-not-allowed disabled:opacity-50"
        }, /*#__PURE__*/React.createElement(Save, {className: "h-4 w-4"}), " Lưu"),
        /*#__PURE__*/React.createElement("button", {
          onClick: () => { addLog("Tạo phiếu nhập", `${supText||"—"} — ${rows.filter(l=>l.name).length} sản phẩm — Tổng tiền: ${vnd(subtotal)}đ`); const recs = buildRecords(); if (onSave) onSave(recs); const slips = recs.map((r, i) => ({...r, lot: "PN" + r.lot.slice(2) + String(i), qtyNow: r.qtyIn, order: r.lot})); notify("Đã tạo phiếu nhập"); if (onImportToWh) onImportToWh(slips.length === 1 ? slips[0] : slips); else onBack(); },
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
          /*#__PURE__*/React.createElement("input", {type: "date", className: inputF, defaultValue: "2026-06-16"})),
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
                  className: "rounded-md bg-[#FEE2E2] p-1.5 text-[#B91C1C] hover:bg-[#FECACA]"
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
        /*#__PURE__*/React.createElement("p", {className: "text-[16px] font-semibold text-[#0F766E]"}, "Nhật ký đơn đặt hàng")),
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
                  /*#__PURE__*/React.createElement("span", {className: l.action === "Tạo phiếu mua hàng" || l.action === "Tạo phiếu nhập" ? "font-semibold text-[#047857]" : "text-slate-500"}, l.action)),
                /*#__PURE__*/React.createElement("td", {className: "px-4 py-2.5 text-xs text-slate-600"}, l.detail)))))));
}

/* ───────── Purchase list ───────── */
function PurchaseList({
  onNew,
  onEdit,
  onImportToWh,
  list,
  setList
}) {
  const notify = useToast();
  const [q, setQ] = useState("");
  const [doc, setDoc] = useState(null);
  const [fSup, setFSup] = useState("Tất cả");
  const supNames = ["Tất cả", ...new Set(list.map(r => r.supplier))];
  const rows = list.filter(r => (fSup === "Tất cả" || r.supplier === fSup) && (!q || `${purCode(r.lot)} ${r.supplier} ${r.prod}`.toLowerCase().includes(q.toLowerCase())));
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
      /*#__PURE__*/React.createElement(PrintBtn, null),
      /*#__PURE__*/React.createElement(ExportBtn, {onClick: onExport}),
      /*#__PURE__*/React.createElement("button", {onClick: onNew, className: blueBtn},
        /*#__PURE__*/React.createElement(Plus, {className: "h-4 w-4"}), " Tạo phiếu mua hàng")),
    /*#__PURE__*/React.createElement("div", {className: "flex flex-wrap items-end gap-3 rounded-xl border border-slate-200 bg-white p-3"},
      /*#__PURE__*/React.createElement("div", null,
        /*#__PURE__*/React.createElement("label", {className: "mb-1 block text-[13px] font-medium text-slate-500"}, "Từ ngày"),
        /*#__PURE__*/React.createElement("input", {type: "date", defaultValue: "2026-06-01", className: field})),
      /*#__PURE__*/React.createElement("div", null,
        /*#__PURE__*/React.createElement("label", {className: "mb-1 block text-[13px] font-medium text-slate-500"}, "Đến ngày"),
        /*#__PURE__*/React.createElement("input", {type: "date", defaultValue: "2026-06-16", className: field})),
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
        /*#__PURE__*/React.createElement(Th, {center: true}, "Ngày đặt"),
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
      /*#__PURE__*/React.createElement("td", {className: "whitespace-nowrap px-3 py-2.5 text-slate-500"}, r.date),
      /*#__PURE__*/React.createElement("td", {className: "whitespace-nowrap px-3 py-2.5"},
        /*#__PURE__*/React.createElement("button", {onClick: () => onEdit(r), className: "inline-flex items-center rounded-md border border-[#0D9488] bg-white px-2.5 py-0.5 text-sm font-semibold text-[#0D9488] hover:bg-[#F0FDFA]"}, purCode(r.lot))),
      /*#__PURE__*/React.createElement("td", {className: "px-3 py-2.5"},
        /*#__PURE__*/React.createElement(Pill, {
          map: {"Đã nhập đủ": "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200", "Nhập một phần": "bg-amber-50 text-amber-700 ring-1 ring-amber-200", "Chờ nhập": "bg-slate-100 text-slate-500 ring-1 ring-slate-200"},
          value: r.qtyNow >= r.qtyIn ? "Đã nhập đủ" : r.qtyNow > 0 ? "Nhập một phần" : "Chờ nhập"
        })),
      /*#__PURE__*/React.createElement("td", {className: "px-3 py-2.5 text-slate-700"}, r.supplier),
      /*#__PURE__*/React.createElement("td", {className: "px-3 py-2.5 text-slate-800"}, r.prod),
      /*#__PURE__*/React.createElement("td", {className: "px-3 py-2.5 text-right tabular-nums text-slate-600"}, r.qtyIn),
      /*#__PURE__*/React.createElement("td", {className: "px-3 py-2.5 text-right tabular-nums text-[#047857]"}, vnd(r.costNcc)),
      /*#__PURE__*/React.createElement("td", {className: "px-3 py-2.5 text-right tabular-nums text-slate-500"}, r.fee ? vnd(r.fee) : "—"),
      /*#__PURE__*/React.createElement("td", {className: "px-3 py-2.5 text-right font-medium tabular-nums text-[#B91C1C]"}, vnd(r.costNcc * r.qtyIn)),
      /*#__PURE__*/React.createElement("td", {className: "whitespace-nowrap px-3 py-2.5 text-xs text-slate-500"}, r.staff),
      /*#__PURE__*/React.createElement("td", {className: "px-2 py-1.5 text-center text-sm font-medium text-slate-700"}, r.kho),
      /*#__PURE__*/React.createElement("td", {className: "px-3 py-2.5"},
        /*#__PURE__*/React.createElement("div", {className: "flex items-center justify-center gap-0.5"},
          /*#__PURE__*/React.createElement(IconBtn, {icon: ArrowDownToLine, title: "Nhập kho", onClick: () => {
              const khoMap = {HH:"Kho HH", HG:"Kho HG", SR:"Kho SR"};
              const slip = {
                lot: "PN" + new Date().toISOString().slice(0,10).replace(/-/g,"") + "_" + String(Date.now()).slice(-4),
                date: new Date().toLocaleDateString("vi-VN"),
                prod: r.prod,
                store: khoMap[r.kho] || r.store,
                qtyIn: r.qtyIn,
                qtyNow: r.qtyIn,
                costNcc: r.costNcc,
                fee: r.fee || 0,
                supplier: r.supplier,
                order: r.lot,
                staff: r.staff || "NGOC HA",
                pay: "Chưa thanh toán"
              };
              if (onImportToWh) { onImportToWh(slip); } else notify("Nhập kho thành công");
            }}),
          /*#__PURE__*/React.createElement(IconBtn, {icon: Pencil, title: "Sửa", onClick: () => onEdit(r)}),
          /*#__PURE__*/React.createElement(IconBtn, {icon: Printer, title: "In", onClick: () => window.print()}),
          /*#__PURE__*/React.createElement(IconBtn, {icon: Trash2, tone: "danger", title: "Xoá", onClick: () => del(r.lot)})))))),
    doc && /*#__PURE__*/React.createElement(DocModal, {doc: doc, onClose: () => setDoc(null)}));
}

/* ───────── Warehouse import (bỏ cột thanh toán) ───────── */
function WhIn({whInItems: items, setWhInItems: setItems, orders = [], onOpenOrder}) {
  const [q, setQ] = useState("");
  const [doc, setDoc] = useState(null);
  const [orderModal, setOrderModal] = useState(null);
  const [slipModal, setSlipModal] = useState(null);
  const [fSup, setFSup] = useState("Tất cả");
  const [fProd, setFProd] = useState("Tất cả");
  const setKho = (lot, kho) => setItems(xs => xs.map(r => r.lot === lot ? {...r, kho} : r));
  const supNames = ["Tất cả", ...Array.from(new Set(items.map(r => r.supplier).filter(Boolean)))];
  const prodNames = ["Tất cả", ...Array.from(new Set(items.map(r => r.prod).filter(Boolean)))];
  const rows = items.filter(r =>
    (fSup === "Tất cả" || r.supplier === fSup) &&
    (fProd === "Tất cả" || r.prod === fProd) &&
    (!q || `${impCode(r.lot)} ${r.prod} ${r.supplier}`.toLowerCase().includes(q.toLowerCase()))
  );
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
    }, "SL còn"), /*#__PURE__*/React.createElement(Th, {
      right: true
    }, "Đơn giá"), /*#__PURE__*/React.createElement(Th, {
      right: true
    }, "CPMH"), /*#__PURE__*/React.createElement(Th, {
      right: true
    }, "Giá vốn"), /*#__PURE__*/React.createElement(Th, {
      right: true
    }, "Thành tiền"), /*#__PURE__*/React.createElement(Th, null, "Người tạo"), /*#__PURE__*/React.createElement(Th, null))
  }, rows.map(r => /*#__PURE__*/React.createElement("tr", {
    key: r.lot,
    className: "hover:bg-slate-50/60"
  }, /*#__PURE__*/React.createElement("td", {
    className: "whitespace-nowrap px-4 py-3 text-slate-500"
  }, r.date), /*#__PURE__*/React.createElement("td", {
    className: "px-4 py-3 text-slate-500"
  }, r.supplier), /*#__PURE__*/React.createElement("td", {
    className: "px-2 py-1.5 text-center text-sm font-medium text-slate-700"
  }, r.kho), /*#__PURE__*/React.createElement("td", {
    className: "px-4 py-3"
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => setSlipModal(r),
    className: "inline-flex items-center rounded-md border border-[#0D9488] bg-white px-2.5 py-0.5 text-sm font-semibold text-[#0D9488] hover:bg-[#F0FDFA]"
  }, impCode(r.lot))), /*#__PURE__*/React.createElement("td", {
    className: "px-4 py-3"
  }, r.order ? /*#__PURE__*/React.createElement("button", {
    onClick: () => openOrderDetail(r.order),
    className: "inline-flex items-center rounded-md border border-[#0D9488] bg-white px-2.5 py-0.5 text-sm font-semibold text-[#0D9488] hover:bg-[#F0FDFA]"
  }, r.order) : /*#__PURE__*/React.createElement("span", {className: "text-slate-400"}, "—")), /*#__PURE__*/React.createElement("td", {
    className: "px-4 py-3 text-slate-800"
  }, r.prod), /*#__PURE__*/React.createElement("td", {
    className: `px-4 py-3 text-right tabular-nums ${r.qtyIn < 0 ? "text-[#B91C1C]" : "text-slate-600"}`
  }, r.qtyIn), /*#__PURE__*/React.createElement("td", {
    className: `px-4 py-3 text-right font-medium tabular-nums ${r.qtyNow < 0 ? "text-[#B91C1C]" : "text-slate-800"}`
  }, r.qtyNow), /*#__PURE__*/React.createElement("td", {
    className: "px-4 py-3 text-right tabular-nums text-slate-600"
  }, vnd(r.costNcc)), /*#__PURE__*/React.createElement("td", {
    className: "px-4 py-3 text-right tabular-nums text-slate-500"
  }, r.fee ? vnd(r.fee) : "—"), /*#__PURE__*/React.createElement("td", {
    className: "px-4 py-3 text-right tabular-nums font-medium text-[#047857]"
  }, vnd(r.costNcc + (r.fee || 0))), /*#__PURE__*/React.createElement("td", {
    className: "px-4 py-3 text-right tabular-nums font-medium text-[#B91C1C]"
  }, vnd((r.costNcc + (r.fee || 0)) * r.qtyIn)), /*#__PURE__*/React.createElement("td", {
    className: "px-4 py-3 text-slate-500"
  }, r.staff), /*#__PURE__*/React.createElement("td", {
    className: "px-2 py-2 text-center"
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => setSlipModal(r),
    title: "In phiếu nhập",
    className: "inline-flex items-center rounded border border-slate-200 bg-white p-1.5 text-slate-600 hover:bg-slate-50 hover:text-slate-900"
  }, /*#__PURE__*/React.createElement(Printer, {className: "h-3.5 w-3.5"}))))),
  /*#__PURE__*/React.createElement("tr", {className: "border-t-2 border-[#CCFBF1] bg-[#E6FFFA]"},
    /*#__PURE__*/React.createElement("td", {className: "px-4 py-3 text-xs font-bold uppercase tracking-wide text-slate-800", colSpan: 6}, "TỔNG CỘNG (",rows.length," PHIẾU)"),
    /*#__PURE__*/React.createElement("td", {className: `px-4 py-3 text-right tabular-nums ${rows.reduce((s,r)=>s+r.qtyIn,0)<0?"text-[#B91C1C]":"text-slate-800"}`, style:{fontWeight:700}}, rows.reduce((s,r)=>s+r.qtyIn,0)),
    /*#__PURE__*/React.createElement("td", {className: `px-4 py-3 text-right tabular-nums ${rows.reduce((s,r)=>s+r.qtyNow,0)<0?"text-[#B91C1C]":"text-slate-800"}`, style:{fontWeight:700}}, rows.reduce((s,r)=>s+r.qtyNow,0)),
    /*#__PURE__*/React.createElement("td", {className: "px-4 py-3"}),
    /*#__PURE__*/React.createElement("td", {className: "px-4 py-3"}),
    /*#__PURE__*/React.createElement("td", {className: "px-4 py-3"}),
    /*#__PURE__*/React.createElement("td", {className: "px-4 py-3 text-right tabular-nums text-[#B91C1C]", style:{fontWeight:700}}, vnd(rows.reduce((s,r)=>s+(r.costNcc+(r.fee||0))*r.qtyIn,0))),
    /*#__PURE__*/React.createElement("td", {colSpan: 3}))),
  doc && /*#__PURE__*/React.createElement(DocModal, {doc: doc, onClose: () => setDoc(null)}),
  slipModal && /*#__PURE__*/React.createElement(Modal, {
    title: `Phiếu nhập kho — ${impCode(slipModal.lot)}`,
    maxW: "max-w-lg",
    onClose: () => setSlipModal(null),
    footer: /*#__PURE__*/React.createElement(React.Fragment, null,
      /*#__PURE__*/React.createElement(PrintBtn, null),
      /*#__PURE__*/React.createElement("button", {onClick: () => setSlipModal(null), className: ghostBtn}, "Đóng"))
  }, /*#__PURE__*/React.createElement("div", {className: "space-y-4 text-sm"},
    /*#__PURE__*/React.createElement("div", {className: "grid grid-cols-2 gap-y-2 text-xs"},
      /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", {className: "text-slate-500"}, "Số phiếu: "), /*#__PURE__*/React.createElement("span", {className: "inline-flex items-center rounded-md border border-[#0D9488] bg-white px-2.5 py-0.5 text-sm font-semibold text-[#0D9488]"}, impCode(slipModal.lot))),
      /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", {className: "text-slate-500"}, "Ngày nhập: "), /*#__PURE__*/React.createElement("span", {className: "font-medium text-slate-800"}, slipModal.date)),
      /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", {className: "text-slate-500"}, "Kho: "), /*#__PURE__*/React.createElement("span", {className: "font-medium text-slate-800"}, slipModal.kho || slipModal.store)),
      /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", {className: "text-slate-500"}, "Số đơn hàng: "), slipModal.order
        ? /*#__PURE__*/React.createElement("button", {onClick: () => { setSlipModal(null); onOpenOrder && onOpenOrder(slipModal.order); }, className: "inline-flex items-center rounded-md border border-[#0D9488] bg-white px-2.5 py-0.5 text-sm font-semibold text-[#0D9488] hover:bg-[#F0FDFA]"}, slipModal.order)
        : /*#__PURE__*/React.createElement("span", {className: "font-medium text-slate-400"}, "—")),
      /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", {className: "text-slate-500"}, "Nhà cung cấp: "), /*#__PURE__*/React.createElement("span", {className: "font-medium text-slate-800"}, slipModal.supplier)),
      /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", {className: "text-slate-500"}, "Người tạo: "), /*#__PURE__*/React.createElement("span", {className: "font-medium text-slate-800"}, slipModal.staff))),
    /*#__PURE__*/React.createElement("table", {className: "w-full border-collapse text-xs"},
      /*#__PURE__*/React.createElement("thead", null,
        /*#__PURE__*/React.createElement("tr", {className: "border-b-2 border-slate-300 bg-slate-50"},
          /*#__PURE__*/React.createElement("th", {className: "py-2 px-3 text-left font-semibold text-slate-600"}, "Sản phẩm"),
          /*#__PURE__*/React.createElement("th", {className: "py-2 px-3 text-right font-semibold text-slate-600"}, "SL nhập"),
          /*#__PURE__*/React.createElement("th", {className: "py-2 px-3 text-right font-semibold text-slate-600"}, "Đơn giá"),
          /*#__PURE__*/React.createElement("th", {className: "py-2 px-3 text-right font-semibold text-slate-600"}, "CPMH"),
          /*#__PURE__*/React.createElement("th", {className: "py-2 px-3 text-right font-semibold text-slate-600"}, "Giá vốn"),
          /*#__PURE__*/React.createElement("th", {className: "py-2 px-3 text-right font-semibold text-slate-600"}, "Thành tiền"))),
      /*#__PURE__*/React.createElement("tbody", null,
        /*#__PURE__*/React.createElement("tr", {className: "border-b border-slate-100"},
          /*#__PURE__*/React.createElement("td", {className: "py-2 px-3 text-slate-800"}, slipModal.prod),
          /*#__PURE__*/React.createElement("td", {className: "py-2 px-3 text-right tabular-nums"}, slipModal.qtyIn),
          /*#__PURE__*/React.createElement("td", {className: "py-2 px-3 text-right tabular-nums"}, vnd(slipModal.costNcc)),
          /*#__PURE__*/React.createElement("td", {className: "py-2 px-3 text-right tabular-nums"}, slipModal.fee ? vnd(slipModal.fee) : "—"),
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
    ? /*#__PURE__*/React.createElement("p", {className: "text-sm text-slate-500"}, "Không tìm thấy dữ liệu đơn hàng ", /*#__PURE__*/React.createElement("span", {className: "inline-flex items-center rounded-md border border-[#0D9488] bg-white px-2.5 py-0.5 text-sm font-semibold text-[#0D9488]"}, orderModal.id), " trong hệ thống.")
    : /*#__PURE__*/React.createElement("div", {className: "space-y-4 text-sm"},
        /*#__PURE__*/React.createElement("div", {className: "grid grid-cols-2 gap-3 rounded-lg bg-slate-50 px-4 py-3 text-xs"},
          /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", {className: "text-slate-500"}, "Khách hàng: "), /*#__PURE__*/React.createElement("span", {className: "font-medium text-slate-800"}, orderModal.name)),
          /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", {className: "text-slate-500"}, "SĐT: "), /*#__PURE__*/React.createElement("span", {className: "font-medium text-slate-800"}, orderModal.phone)),
          /*#__PURE__*/React.createElement("div", {className: "col-span-2"}, /*#__PURE__*/React.createElement("span", {className: "text-slate-500"}, "Địa chỉ: "), /*#__PURE__*/React.createElement("span", {className: "font-medium text-slate-800"}, orderModal.addr || "—")),
          /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", {className: "text-slate-500"}, "Ngày tạo: "), /*#__PURE__*/React.createElement("span", {className: "font-medium text-slate-800"}, orderModal.dt)),
          /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", {className: "text-slate-500"}, "Trạng thái: "), /*#__PURE__*/React.createElement("span", {className: "font-medium text-slate-800"}, calc(orderModal).orderStatus)),
          /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", {className: "text-slate-500"}, "Nhân viên: "), /*#__PURE__*/React.createElement("span", {className: "font-medium text-slate-800"}, orderModal.staff || "—")),
          /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", {className: "text-slate-500"}, "Kênh: "), /*#__PURE__*/React.createElement("span", {className: "font-medium text-slate-800"}, orderModal.channel || "—"))),
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
          /*#__PURE__*/React.createElement("span", {className: `font-bold tabular-nums ${(orderModal.total||0)-(orderModal.paid||0)>0?"text-[#B91C1C]":"text-[#047857]"}`},
            vnd((orderModal.total||0)-(orderModal.paid||0))))))));
}
function WhOut({whOutItems: items, setWhOutItems: setItems, onOpenOrder}) {
  const storeShort = s => (s || "").replace(/^Kho\s+/, "") || s || "—";
  const [q, setQ] = useState("");
  const [doc, setDoc] = useState(null);
  const [slipModal, setSlipModal] = useState(null);
  const [fProd, setFProd] = useState("Tất cả");
  const [fSup, setFSup] = useState("Tất cả");
  const prodList = ["Tất cả", ...new Set(items.map(r => r.prod))];
  const supList = ["Tất cả", ...new Set(items.map(r => r.supplier))];
  const rows = items.filter(r => {
    if (fProd !== "Tất cả" && r.prod !== fProd) return false;
    if (fSup !== "Tất cả" && r.supplier !== fSup) return false;
    if (q && !`${r.order} ${r.prod} ${r.cust} ${r.sku}`.toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  });
  const onExport = () => exportCSV("danh-sach-phieu-xuat-kho", ["Thời gian", "Đơn hàng", "Khách hàng", "Địa chỉ", "Tên sản phẩm", "Nhà cung cấp", "Kho", "SL xuất", "Giá bán", "Thành tiền", "TT Đơn", "TT Giao", "Người xuất"], rows.map(r => [r.dt, r.order, r.cust, r.addr, r.prod, r.supplier, r.store, r.qty, r.sale, r.sale * r.qty, r.orderStatus, r.delivery, r.staff]));
  return /*#__PURE__*/React.createElement("div", {
    className: "space-y-4"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex flex-wrap items-end gap-3 rounded-xl border border-slate-200 bg-white p-3"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: "mb-1 block text-[13px] font-medium text-slate-500"
  }, "Từ ngày"), /*#__PURE__*/React.createElement("input", {
    type: "date",
    defaultValue: "2026-06-01",
    className: field
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: "mb-1 block text-[13px] font-medium text-slate-500"
  }, "Đến ngày"), /*#__PURE__*/React.createElement("input", {
    type: "date",
    defaultValue: "2026-06-16",
    className: field
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: "mb-1 block text-[13px] font-medium text-slate-500"
  }, "Tên sản phẩm"), /*#__PURE__*/React.createElement("select", {
    value: fProd,
    onChange: e => setFProd(e.target.value),
    className: `${field} max-w-[180px]`
  }, prodList.map(s => /*#__PURE__*/React.createElement("option", {
    key: s
  }, s)))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: "mb-1 block text-[13px] font-medium text-slate-500"
  }, "Nhà cung cấp"), /*#__PURE__*/React.createElement("select", {
    value: fSup,
    onChange: e => setFSup(e.target.value),
    className: `${field} max-w-[170px]`
  }, supList.map(s => /*#__PURE__*/React.createElement("option", {
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
        width: 130
      }
    }, "Số phiếu xuất"), /*#__PURE__*/React.createElement(Th, {
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
    }, "Kho"), /*#__PURE__*/React.createElement(Th, {center:true, style:{width:70}}, "Thao tác"))
  }, rows.map(r => /*#__PURE__*/React.createElement("tr", {
    key: r.slip,
    className: "align-top hover:bg-slate-50/60"
  }, /*#__PURE__*/React.createElement("td", {
    className: "px-3 py-3 tabular-nums"
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => setSlipModal(r),
    className: "inline-flex items-center rounded-md border border-[#0D9488] bg-white px-2.5 py-0.5 text-sm font-semibold text-[#0D9488] hover:bg-[#F0FDFA]"
  }, r.slip)), /*#__PURE__*/React.createElement("td", {
    className: "px-3 py-3"
  }, /*#__PURE__*/React.createElement(DateTime, {
    value: r.dt
  })), /*#__PURE__*/React.createElement("td", {
    className: "px-3 py-3"
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => onOpenOrder ? onOpenOrder(r.order) : null,
    className: "inline-flex items-center rounded-md border border-[#0D9488] bg-white px-2.5 py-0.5 text-sm font-semibold text-[#0D9488] hover:bg-[#F0FDFA]"
  }, r.order)), /*#__PURE__*/React.createElement("td", {
    className: "px-3 py-3 text-slate-700"
  }, r.cust), /*#__PURE__*/React.createElement("td", {
    className: "px-3 py-3 text-xs text-slate-500"
  }, r.addr), /*#__PURE__*/React.createElement("td", {
    className: "px-3 py-3 text-slate-800"
  }, r.prod), /*#__PURE__*/React.createElement("td", {
    className: `px-3 py-3 text-right tabular-nums ${r.qty < 0 ? "text-[#B91C1C]" : "text-slate-600"}`
  }, r.qty), /*#__PURE__*/React.createElement("td", {
    className: "px-3 py-3 text-right tabular-nums text-[#047857]"
  }, vnd(r.sale)), /*#__PURE__*/React.createElement("td", {
    className: "px-3 py-3 text-right font-medium tabular-nums text-[#B91C1C]"
  }, vnd(r.sale * r.qty)), /*#__PURE__*/React.createElement("td", {
    className: "px-3 py-3 text-xs text-slate-500"
  }, r.staff), /*#__PURE__*/React.createElement("td", {
    className: "px-3 py-3 text-slate-600"
  }, r.supplier), /*#__PURE__*/React.createElement("td", {
    className: "px-3 py-3 text-slate-500"
  }, storeShort(r.store)), /*#__PURE__*/React.createElement("td", {className:"px-2 py-2 text-center"},
    /*#__PURE__*/React.createElement("button", {
      onClick: () => setSlipModal(r),
      title: "In phiếu xuất",
      className: "inline-flex items-center rounded border border-slate-200 bg-white p-1.5 text-slate-600 hover:bg-slate-50 hover:text-slate-900"
    }, /*#__PURE__*/React.createElement(Printer, {className: "h-3.5 w-3.5"}))))),
  /*#__PURE__*/React.createElement("tr", {className: "border-t-2 border-[#CCFBF1] bg-[#E6FFFA]"},
    /*#__PURE__*/React.createElement("td", {className: "px-3 py-3 text-xs font-bold uppercase tracking-wide text-slate-800", colSpan: 6}, "TỔNG CỘNG (", rows.length, " PHIẾU)"),
    /*#__PURE__*/React.createElement("td", {className: "px-3 py-3 text-right tabular-nums text-slate-800", style:{fontWeight:700}}, rows.reduce((s,r)=>s+r.qty,0)),
    /*#__PURE__*/React.createElement("td", {className: "px-3 py-3"}),
    /*#__PURE__*/React.createElement("td", {className: "px-3 py-3 text-right tabular-nums text-[#B91C1C]", style:{fontWeight:700}}, vnd(rows.reduce((s,r)=>s+r.sale*r.qty,0))),
    /*#__PURE__*/React.createElement("td", {colSpan: 4}))),
  slipModal && /*#__PURE__*/React.createElement(Modal, {
    title: `Phiếu xuất kho — ${slipModal.slip}`,
    maxW: "max-w-lg",
    onClose: () => setSlipModal(null),
    footer: /*#__PURE__*/React.createElement(React.Fragment, null,
      /*#__PURE__*/React.createElement(PrintBtn, null),
      /*#__PURE__*/React.createElement("button", {onClick: () => setSlipModal(null), className: ghostBtn}, "Đóng"))
  }, /*#__PURE__*/React.createElement("div", {className: "space-y-4 text-sm"},
    /*#__PURE__*/React.createElement("div", {className: "grid grid-cols-2 gap-y-2 text-xs"},
      /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", {className: "text-slate-500"}, "Số phiếu: "), /*#__PURE__*/React.createElement("span", {className: "inline-flex items-center rounded-md border border-[#0D9488] bg-white px-2.5 py-0.5 text-sm font-semibold text-[#0D9488]"}, slipModal.slip)),
      /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", {className: "text-slate-500"}, "Thời gian: "), /*#__PURE__*/React.createElement("span", {className: "font-medium text-slate-800"}, slipModal.dt)),
      /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", {className: "text-slate-500"}, "Đơn hàng: "), /*#__PURE__*/React.createElement("span", {className: "inline-flex items-center rounded-md border border-[#0D9488] bg-white px-2.5 py-0.5 text-sm font-semibold text-[#0D9488]"}, slipModal.order)),
      /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", {className: "text-slate-500"}, "Kho: "), /*#__PURE__*/React.createElement("span", {className: "font-medium text-slate-800"}, storeShort(slipModal.store))),
      /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", {className: "text-slate-500"}, "Khách hàng: "), /*#__PURE__*/React.createElement("span", {className: "font-medium text-slate-800"}, slipModal.cust)),
      /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", {className: "text-slate-500"}, "Người xuất: "), /*#__PURE__*/React.createElement("span", {className: "font-medium text-slate-800"}, slipModal.staff)),
      /*#__PURE__*/React.createElement("div", {className: "col-span-2"}, /*#__PURE__*/React.createElement("span", {className: "text-slate-500"}, "Địa chỉ: "), /*#__PURE__*/React.createElement("span", {className: "font-medium text-slate-800"}, slipModal.addr || "—"))),
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
    className: `rounded px-1.5 py-0.5 text-xs font-medium ${m.type === "Xuất" ? "bg-rose-50 text-[#B91C1C]" : m.type === "Nhập" ? "bg-emerald-50 text-[#047857]" : "bg-slate-100 text-slate-500"}`
  }, m.type)), /*#__PURE__*/React.createElement("td", {
    className: "px-3 py-2.5 text-slate-500"
  }, m.date), /*#__PURE__*/React.createElement("td", {
    className: "px-3 py-2.5"
  }, /*#__PURE__*/React.createElement("span", {className: "inline-flex items-center rounded-md border border-[#0D9488] bg-white px-2.5 py-0.5 text-xs font-semibold text-[#0D9488]"}, m.slip)), /*#__PURE__*/React.createElement("td", {
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
  const rows = STOCK_REPORT.filter(r => (store === "Tất cả kho" || r.store === store) && (!q || `${r.name} ${r.sku}`.toLowerCase().includes(q.toLowerCase())));
  const cell = "px-3 py-3 text-right tabular-nums";
  const onExport = () => exportCSV("bao-cao-xuat-nhap-ton-kho", ["Tên kho", "Mã SP", "Tên sản phẩm", "ĐVT", "Đơn giá", "Đầu kỳ SL", "Nhập SL", "Xuất SL", "Cuối kỳ SL"], rows.map(r => [r.store, r.sku, r.name, r.unit, r.price, r.o, r.in, r.out, r.o + r.in - r.out]));
  return /*#__PURE__*/React.createElement("div", {
    className: "space-y-4"
  }, /*#__PURE__*/React.createElement("h2", {
    className: "text-[16px] font-semibold text-[#0F766E]"
  }, "Báo cáo xuất nhập tồn kho"), /*#__PURE__*/React.createElement("div", {
    className: "flex flex-wrap items-end gap-3"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: "mb-1 block text-[13px] font-medium text-slate-500"
  }, "Từ ngày"), /*#__PURE__*/React.createElement("input", {
    type: "date",
    defaultValue: "2026-06-01",
    className: field
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: "mb-1 block text-[13px] font-medium text-slate-500"
  }, "Đến ngày"), /*#__PURE__*/React.createElement("input", {
    type: "date",
    defaultValue: "2026-06-16",
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
    className: "bg-[#E6FFFA] text-xs font-semibold uppercase tracking-wide text-[#64748B]"
  }, /*#__PURE__*/React.createElement("th", {
    rowSpan: 2,
    className: "border border-[#DDE3E8] px-3 py-2 text-left"
  }, "Kho"), /*#__PURE__*/React.createElement("th", {
    rowSpan: 2,
    className: "border border-[#DDE3E8] px-3 py-2 text-left"
  }, "Mã SP"), /*#__PURE__*/React.createElement("th", {
    rowSpan: 2,
    className: "border border-[#DDE3E8] px-3 py-2 text-left",
    style: {
      minWidth: 220
    }
  }, "Tên sản phẩm"), /*#__PURE__*/React.createElement("th", {
    rowSpan: 2,
    className: "border border-[#DDE3E8] px-3 py-2 text-left"
  }, "ĐVT"), /*#__PURE__*/React.createElement("th", {
    rowSpan: 2,
    className: "border border-[#DDE3E8] px-3 py-2 text-right"
  }, "Đơn giá"), /*#__PURE__*/React.createElement("th", {
    colSpan: 2,
    className: "border border-[#DDE3E8] bg-[#F0FDFA] px-3 py-2 text-center text-[#0F766E]"
  }, "Đầu kỳ"), /*#__PURE__*/React.createElement("th", {
    colSpan: 2,
    className: "border border-[#DDE3E8] bg-[#F0FDF4] px-3 py-2 text-center text-[#047857]"
  }, "Nhập kho"), /*#__PURE__*/React.createElement("th", {
    colSpan: 2,
    className: "border border-[#DDE3E8] bg-[#FFFBEB] px-3 py-2 text-center text-[#B45309]"
  }, "Xuất kho"), /*#__PURE__*/React.createElement("th", {
    colSpan: 2,
    className: "border border-[#DDE3E8] bg-[#FFF1F2] px-3 py-2 text-center text-[#B91C1C]"
  }, "Cuối kỳ")), /*#__PURE__*/React.createElement("tr", {
    className: "bg-[#CCFBF1] text-xs font-semibold uppercase tracking-wide text-[#475569]"
  }, [["SL","bg-[#F0FDFA]"],["Giá trị","bg-[#F0FDFA]"],["SL","bg-[#F0FDF4]"],["Giá trị","bg-[#F0FDF4]"],["SL","bg-[#FFFBEB]"],["Giá trị","bg-[#FFFBEB]"],["SL","bg-[#FFF1F2]"],["Giá trị","bg-[#FFF1F2]"]].map(([h,bg], i) => /*#__PURE__*/React.createElement("th", {
    key: i,
    className: `border border-[#DDE3E8] px-3 py-1.5 text-right ${bg}`
  }, h)))), /*#__PURE__*/React.createElement("tbody", {
    className: "divide-y divide-slate-100"
  }, rows.map((r, i) => {
    const end = r.o + r.in - r.out;
    return /*#__PURE__*/React.createElement("tr", {
      key: i,
      className: "hover:bg-slate-50/60"
    }, /*#__PURE__*/React.createElement("td", {
      className: "px-3 py-3 font-medium text-slate-700"
    }, r.store.replace(/^Kho\s+/, "")), /*#__PURE__*/React.createElement("td", {
      className: "border-l border-slate-100 px-3 py-3 text-xs text-slate-500"
    }, /*#__PURE__*/React.createElement(Sku, {
      value: r.sku
    })), /*#__PURE__*/React.createElement("td", {
      className: "border-l border-slate-100 px-3 py-3"
    }, /*#__PURE__*/React.createElement("button", {
      onClick: () => setDetail(r),
      className: "text-left text-[#2563EB] underline-offset-2 hover:underline"
    }, r.name)), /*#__PURE__*/React.createElement("td", {
      className: "border-l border-slate-100 px-3 py-3 text-slate-500"
    }, r.unit), /*#__PURE__*/React.createElement("td", {
      className: cell + " border-l border-slate-100 text-slate-700"
    }, num(r.price)), /*#__PURE__*/React.createElement("td", {
      className: cell + " border-l border-slate-100 text-slate-600"
    }, r.o || "–"), /*#__PURE__*/React.createElement("td", {
      className: cell + " border-l border-slate-100 text-slate-600"
    }, r.o ? num(r.o * r.price) : "–"), /*#__PURE__*/React.createElement("td", {
      className: cell + ` border-l border-slate-100 ${r.in ? "text-[#047857]" : "text-[#94A3B8]"}`
    }, r.in || "–"), /*#__PURE__*/React.createElement("td", {
      className: cell + ` border-l border-slate-100 ${r.in ? "text-[#047857]" : "text-[#94A3B8]"}`
    }, r.in ? num(r.in * r.price) : "–"), /*#__PURE__*/React.createElement("td", {
      className: cell + ` border-l border-slate-100 ${r.out ? "text-[#D97706]" : "text-[#94A3B8]"}`
    }, r.out || "–"), /*#__PURE__*/React.createElement("td", {
      className: cell + ` border-l border-slate-100 ${r.out ? "text-[#D97706]" : "text-[#94A3B8]"}`
    }, r.out ? num(r.out * r.price) : "–"), /*#__PURE__*/React.createElement("td", {
      className: cell + ` border-l border-slate-100 ${end < 0 ? "text-[#B91C1C]" : end > 0 ? "text-slate-600" : "text-[#94A3B8]"}`
    }, end || "–"), /*#__PURE__*/React.createElement("td", {
      className: cell + ` border-l border-slate-100 ${end < 0 ? "text-[#B91C1C]" : end > 0 ? "text-slate-600" : "text-[#94A3B8]"}`
    }, end ? num(end * r.price) : "–"));
  }), (() => {
    const tO    = rows.reduce((s,r)=>s+(r.o||0),0);
    const tOVal = rows.reduce((s,r)=>s+(r.o||0)*r.price,0);
    const tIn   = rows.reduce((s,r)=>s+(r.in||0),0);
    const tInVal= rows.reduce((s,r)=>s+(r.in||0)*r.price,0);
    const tOut  = rows.reduce((s,r)=>s+(r.out||0),0);
    const tOutVal=rows.reduce((s,r)=>s+(r.out||0)*r.price,0);
    const tEnd  = rows.reduce((s,r)=>s+(r.o+r.in-r.out),0);
    const tEndVal=rows.reduce((s,r)=>s+(r.o+r.in-r.out)*r.price,0);
    return /*#__PURE__*/React.createElement("tr", {className:"border-t-2 border-[#CCFBF1] bg-[#E6FFFA]"},
      /*#__PURE__*/React.createElement("td", {className:"border border-[#DDE3E8] px-3 py-2.5 text-center text-xs uppercase text-slate-800", style:{fontWeight:700}, colSpan:5}, "TỔNG CỘNG"),
      /*#__PURE__*/React.createElement("td", {className:cell+" border-l border-[#DDE3E8] text-slate-800", style:{fontWeight:700}}, tO||"–"),
      /*#__PURE__*/React.createElement("td", {className:cell+" border-l border-[#DDE3E8] text-slate-800", style:{fontWeight:700}}, tOVal?num(tOVal):"–"),
      /*#__PURE__*/React.createElement("td", {className:cell+" border-l border-[#DDE3E8] text-[#047857]", style:{fontWeight:700}}, tIn||"–"),
      /*#__PURE__*/React.createElement("td", {className:cell+" border-l border-[#DDE3E8] text-[#047857]", style:{fontWeight:700}}, tInVal?num(tInVal):"–"),
      /*#__PURE__*/React.createElement("td", {className:cell+" border-l border-[#DDE3E8] text-[#D97706]", style:{fontWeight:700}}, tOut||"–"),
      /*#__PURE__*/React.createElement("td", {className:cell+" border-l border-[#DDE3E8] text-[#D97706]", style:{fontWeight:700}}, tOutVal?num(tOutVal):"–"),
      /*#__PURE__*/React.createElement("td", {className:cell+` border-l border-[#DDE3E8] ${tEnd<0?"text-[#B91C1C]":"text-slate-800"}`, style:{fontWeight:700}}, tEnd||"–"),
      /*#__PURE__*/React.createElement("td", {className:cell+` border-l border-[#DDE3E8] ${tEndVal<0?"text-[#B91C1C]":"text-slate-800"}`, style:{fontWeight:700}}, tEndVal?num(tEndVal):"–"));
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
  const dupName = f.name.trim() && existingNames.includes(f.name.trim().toLowerCase());
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
  }, "*")), /*#__PURE__*/React.createElement("input", {
    className: inputF + (dupSku ? " border-rose-400 ring-1 ring-rose-400" : ""),
    value: f.sku,
    onChange: ev => set({sku: ev.target.value})
  }), dupSku && /*#__PURE__*/React.createElement("p", {
    className: "mt-1 flex items-center gap-1 text-xs text-[#B91C1C]"
  }, /*#__PURE__*/React.createElement(AlertTriangle, {className: "h-3.5 w-3.5 shrink-0"}), "Mã sản phẩm đã tồn tại, vui lòng nhập mã khác")), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
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
  const [itemsFS, prodsLoaded] = useCollection("products");
  const items = itemsFS;
  // Seed Firestore lần đầu nếu còn trống
  useEffect(() => {
    if (prodsLoaded && itemsFS.length === 0) {
      batchSave("products", PRODUCTS, p => p.sku).catch(console.error);
    }
  }, [prodsLoaded]);
  const setItems = (updater) => {
    const next = typeof updater === 'function' ? updater(items) : updater;
    const prevMap = Object.fromEntries(items.map(p => [p.sku, p]));
    const nextMap = Object.fromEntries(next.map(p => [p.sku, p]));
    Object.entries(nextMap).forEach(([id, p]) => {
      if (JSON.stringify(prevMap[id]) !== JSON.stringify(p)) saveDoc("products", id, p).catch(console.error);
    });
    Object.keys(prevMap).forEach(id => { if (!nextMap[id]) deleteDocument("products", id).catch(console.error); });
  };
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
  const tag = n => n === 0 ? "bg-rose-50 text-[#B91C1C]" : n <= 5 ? "bg-amber-50 text-amber-600" : "bg-emerald-50 text-[#047857]";
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
  }, pageRows.map(p => /*#__PURE__*/React.createElement("tr", {
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
    className: "flex items-center justify-center"
  }, /*#__PURE__*/React.createElement(IconBtn, {
    icon: Pencil,
    title: "Sửa",
    onClick: () => setForm(p)
  }), /*#__PURE__*/React.createElement(IconBtn, {
    tone: "danger",
    icon: Trash2,
    title: "Xoá",
    onClick: () => del(p.sku)
  })))))),
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
          className: `min-w-[2rem] rounded px-2 py-1 text-sm font-medium ${page === n ? "bg-[#0F766E] text-white" : "text-slate-600 hover:bg-slate-100"}`
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
  }, c.addr || "—"), /*#__PURE__*/React.createElement("td", {
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
    tone: "danger",
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
    className: "text-[16px] font-semibold uppercase text-slate-800"
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
    className: "bg-[#CCFBF1] text-xs font-semibold uppercase tracking-wide text-[#475569]"
  }, /*#__PURE__*/React.createElement("th", {
    rowSpan: 2,
    className: "border border-[#DDE3E8] px-3 py-2 text-left"
  }, "Tên khách hàng"), /*#__PURE__*/React.createElement("th", {
    rowSpan: 2,
    className: "border border-[#DDE3E8] px-3 py-2 text-left"
  }, "Điện thoại"), /*#__PURE__*/React.createElement("th", {
    rowSpan: 2,
    className: "border border-[#DDE3E8] px-3 py-2 text-right"
  }, "Số dư nợ đầu kỳ"), /*#__PURE__*/React.createElement("th", {
    colSpan: 2,
    className: "border border-[#DDE3E8] px-3 py-2 text-center"
  }, "Phát sinh trong kỳ"), /*#__PURE__*/React.createElement("th", {
    rowSpan: 2,
    className: "border border-[#DDE3E8] px-3 py-2 text-right"
  }, "Số dư nợ cuối kỳ")), /*#__PURE__*/React.createElement("tr", {
    className: "bg-[#CCFBF1] text-xs font-semibold uppercase tracking-wide text-[#475569]"
  }, /*#__PURE__*/React.createElement("th", {
    className: "border border-[#DDE3E8] px-3 py-1.5 text-right"
  }, "Số phát sinh"), /*#__PURE__*/React.createElement("th", {
    className: "border border-[#DDE3E8] px-3 py-1.5 text-right"
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
      className: "inline-flex items-center rounded-md border border-[#0D9488] bg-white px-2.5 py-0.5 text-sm font-semibold text-[#0D9488] hover:bg-[#F0FDFA]"
    }, r.name)), /*#__PURE__*/React.createElement("td", {
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
      className: `border-l border-slate-100 px-3 py-3 text-right tabular-nums ${close < 0 ? "text-[#B91C1C]" : "text-slate-700"}`
    }, num(close)));
  })), /*#__PURE__*/React.createElement("tfoot", null, /*#__PURE__*/React.createElement("tr", {
    className: "bg-[#E6FFFA] font-bold"
  }, /*#__PURE__*/React.createElement("td", {
    colSpan: 2,
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
    className: "mb-4 text-[16px] font-semibold text-[#0F766E]"
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
    className: "text-[#B91C1C]"
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
      className: "inline-flex items-center rounded-md border border-[#0D9488] bg-white px-2.5 py-0.5 text-sm font-semibold text-[#0D9488]"
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
      className: "px-3 py-3 text-right align-middle tabular-nums text-[#047857]"
    }, num(o.paid)), k === 0 && /*#__PURE__*/React.createElement("td", {
      rowSpan: o.items.length,
      className: "px-3 py-3 text-right align-middle font-semibold tabular-nums text-[#B91C1C]"
    }, num(debtO))));
  })), /*#__PURE__*/React.createElement("tfoot", null, /*#__PURE__*/React.createElement("tr", {
    className: "bg-slate-50 font-semibold"
  }, /*#__PURE__*/React.createElement("td", {
    colSpan: 8,
    className: "px-3 py-3 text-right text-slate-600"
  }, "Tổng dư nợ"), /*#__PURE__*/React.createElement("td", {
    className: "px-3 py-3 text-right tabular-nums text-[#B91C1C]"
  }, num(close)))))) : /*#__PURE__*/React.createElement(Empty, null, "Không có dữ liệu đơn hàng chi tiết cho khách này. Số dư nợ cuối kỳ: ", /*#__PURE__*/React.createElement("b", {
    className: "text-[#B91C1C]"
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
    className: "bg-[#CCFBF1] text-xs font-semibold uppercase tracking-wide text-[#475569]"
  }, /*#__PURE__*/React.createElement("th", {
    rowSpan: 2,
    className: "border border-[#DDE3E8] px-3 py-2 text-left"
  }, "Tên nhà cung cấp"), /*#__PURE__*/React.createElement("th", {
    rowSpan: 2,
    className: "border border-[#DDE3E8] px-3 py-2 text-right"
  }, "Số dư nợ đầu kỳ"), /*#__PURE__*/React.createElement("th", {
    colSpan: 2,
    className: "border border-[#DDE3E8] px-3 py-2 text-center"
  }, "Phát sinh trong kỳ"), /*#__PURE__*/React.createElement("th", {
    rowSpan: 2,
    className: "border border-[#DDE3E8] px-3 py-2 text-right"
  }, "Số dư nợ cuối kỳ")), /*#__PURE__*/React.createElement("tr", {
    className: "bg-[#CCFBF1] text-xs font-semibold uppercase tracking-wide text-[#475569]"
  }, /*#__PURE__*/React.createElement("th", {
    className: "border border-[#DDE3E8] px-3 py-1.5 text-right"
  }, "Số phát sinh"), /*#__PURE__*/React.createElement("th", {
    className: "border border-[#DDE3E8] px-3 py-1.5 text-right"
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
      className: "inline-flex items-center rounded-md border border-[#0D9488] bg-white px-2.5 py-0.5 text-sm font-semibold text-[#0D9488] hover:bg-[#F0FDFA]"
    }, s.name) : /*#__PURE__*/React.createElement("span", {
      className: "text-slate-600"
    }, s.name)), /*#__PURE__*/React.createElement("td", {
      className: "border-l border-slate-100 px-3 py-3 text-right tabular-nums text-slate-700"
    }, num(s.open)), /*#__PURE__*/React.createElement("td", {
      className: "border-l border-slate-100 px-3 py-3 text-right tabular-nums text-slate-600"
    }, num(s.ps)), /*#__PURE__*/React.createElement("td", {
      className: "border-l border-slate-100 px-3 py-3 text-right tabular-nums text-slate-600"
    }, num(s.tt)), /*#__PURE__*/React.createElement("td", {
      className: `border-l border-slate-100 px-3 py-3 text-right tabular-nums ${close < 0 ? "text-[#B91C1C]" : "text-slate-700"}`
    }, num(close)));
  })), /*#__PURE__*/React.createElement("tfoot", null, /*#__PURE__*/React.createElement("tr", {
    className: "bg-[#E6FFFA]"
  }, /*#__PURE__*/React.createElement("td", {
    className: "px-3 py-3 text-center text-slate-800", style: {fontWeight:700}
  }, "TỔNG CỘNG"), /*#__PURE__*/React.createElement("td", {
    className: "border-l border-slate-100 px-3 py-3 text-right tabular-nums text-slate-800", style:{fontWeight:700}
  }, num(totalOpen)), /*#__PURE__*/React.createElement("td", {
    className: "border-l border-slate-100 px-3 py-3 text-right tabular-nums text-slate-800", style:{fontWeight:700}
  }, "0"), /*#__PURE__*/React.createElement("td", {
    className: "border-l border-slate-100 px-3 py-3 text-right tabular-nums text-slate-800", style:{fontWeight:700}
  }, "0"), /*#__PURE__*/React.createElement("td", {
    className: "border-l border-slate-100 px-3 py-3 text-right tabular-nums text-slate-800", style:{fontWeight:700}
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
    className: "mb-4 text-[16px] font-semibold text-[#0F766E]"
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
    className: "text-[#B91C1C]"
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
      className: "px-3 py-3 text-right tabular-nums text-[#047857]"
    }, num(l.paid)), /*#__PURE__*/React.createElement("td", {
      className: "px-3 py-3 text-right font-semibold tabular-nums text-[#B91C1C]"
    }, num(tot - l.paid)), /*#__PURE__*/React.createElement("td", {
      className: "px-3 py-3"
    }, /*#__PURE__*/React.createElement(Pill, {
      map: PAY_NCC,
      value: l.pay
    })), /*#__PURE__*/React.createElement("td", {
      className: "px-3 py-3 text-slate-500"
    }, l.staff));
  })))) : /*#__PURE__*/React.createElement(Empty, null, "Không có dữ liệu lô hàng chi tiết. Tổng dư nợ cuối kỳ: ", /*#__PURE__*/React.createElement("b", {
    className: "text-[#B91C1C]"
  }, num(sup.open)))));
}

/* ───────── Finance ───────── */
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
function PhieuChiModal({onClose, onSave, nextId}) {
  const {bankAccounts} = useBankAccounts();
  const activeAccs = bankAccounts.filter(a => a.status === "Hoạt động");
  const [acc, setAcc]       = useState(activeAccs[0]?.key || "");
  const [entity, setEntity] = useState("");
  const [orderId, setOrderId] = useState("");
  const [kind, setKind]     = useState("Chi phí");
  const [amount, setAmount] = useState(0);
  const [note, setNote]     = useState("");
  const canSave = entity.trim() && amount > 0;
  const now = () => { const d = new Date(); return d.toLocaleDateString('vi-VN') + " " + d.toLocaleTimeString('vi-VN',{hour:'2-digit',minute:'2-digit'}); };
  const doSave = () => onSave({id:nextId,date:now(),entity,orderId,kind,acc,amount:-amount,note,staff:"NGOC HA"});
  const lbl = "mb-1 block text-[13px] font-medium text-slate-500";
  return /*#__PURE__*/React.createElement(Modal, {title:"Lập phiếu chi",onClose,maxW:"max-w-lg",
    footer:/*#__PURE__*/React.createElement(React.Fragment,null,
      /*#__PURE__*/React.createElement("button",{onClick:onClose,className:ghostBtn},"Hủy"),
      /*#__PURE__*/React.createElement("button",{onClick:doSave,disabled:!canSave,className:"inline-flex items-center gap-1.5 rounded-lg bg-[#0F766E] px-3.5 py-2 text-sm font-semibold text-white hover:bg-[#0D5F58] disabled:opacity-50"},"Lưu phiếu chi"))},
    /*#__PURE__*/React.createElement("div",{className:"grid grid-cols-2 gap-3"},
      /*#__PURE__*/React.createElement("div",null,/*#__PURE__*/React.createElement("label",{className:lbl},"Tài khoản"),
        /*#__PURE__*/React.createElement("select",{value:acc,onChange:e=>setAcc(e.target.value),className:inputF},
          activeAccs.map(a=>/*#__PURE__*/React.createElement("option",{key:a.key,value:a.key},a.bank+" ("+a.account+")")))),
      /*#__PURE__*/React.createElement("div",null,/*#__PURE__*/React.createElement("label",{className:lbl},"Loại chi"),
        /*#__PURE__*/React.createElement("select",{value:kind,onChange:e=>setKind(e.target.value),className:inputF},
          ["CPVC Nhập Hàng","CP Ship ĐH","CP Lắp Đặt","CP Hoàn Hàng","CP Thuê Nhà","CP Tiền Điện","CP Tiền Nước","CP Vận Hành","CP Tiền Nước Uống","CP Hoa Hồng","CP Khác"].map(k=>/*#__PURE__*/React.createElement("option",{key:k},k)))),
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
  const ALL_KINDS = ["Thu tiền","Đặt cọc","Thanh toán","Thu khác","Chi mua hàng","Chi vận chuyển","Chi phí","Hoàn ứng","Chi khác","Chuyển đi","Chuyển về"];
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
  const {bankAccounts} = useBankAccounts();
  const activeAccs = bankAccounts.filter(a => a.status === "Hoạt động");
  const {txns, setTxns}       = useTxns();
  const [q, setQ]             = useState("");
  const localToday = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`; };
  const [fromDate, setFromDate] = useState(() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-01`; });
  const [toDate, setToDate]   = useState(localToday);
  const [fAcc, setFAcc]       = useState("Tất cả");
  const [fDir, setFDir]       = useState("Tất cả");
  const [fAccDetail, setFAccDetail] = useState(null);
  const [modal, setModal]     = useState(null);
  const [editTxn, setEditTxn] = useState(null);
  const nextId = txns.length ? Math.max(...txns.map(t=>t.id))+1 : 1;

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
    if (fAccDetail && t.acc !== fAccDetail) return false;
    if (q && !`${t.id} ${t.orderId} ${t.note} ${t.entity}`.toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  });

  const accSummary = activeAccs.map(a => {
    const at = visibleTxns.filter(t=>t.acc===a.key);
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
  const addChi  = t  => { setTxns(p=>[t,...p]); notify("Đã lưu phiếu chi"); setModal(null); };
  const addXfer = ts => { setTxns(p=>[...ts,...p]); notify("Đã chuyển tiền nội bộ"); setModal(null); };
  const delTxn    = id => { if(window.confirm("Xóa giao dịch này?")){ setTxns(p=>p.filter(t=>t.id!==id)); notify("Đã xóa giao dịch"); }};
  const saveEdit  = t  => { setTxns(p=>p.map(x=>x.id===t.id?t:x)); notify("Đã cập nhật giao dịch"); setEditTxn(null); };
  const resetFilter = () => { setQ(""); setFAcc("Tất cả"); setFKind("Tất cả"); setFAccDetail(null); };

  const THU = "bg-[#E6F7EC] text-[#1B8A4D] ring-1 ring-[#A5D9BB]";
  const CHI = "bg-[#FEF2F2] text-[#B91C1C] ring-1 ring-[#FECACA]";
  const KIND_COLORS = {
    "Thu tiền":      THU,
    "Đặt cọc":       THU,
    "Thanh toán":    THU,
    "Thu khác":      THU,
    "Chi mua hàng":  CHI,
    "Chi vận chuyển":CHI,
    "Chi phí":       CHI,
    "Hoàn ứng":      CHI,
    "Chi khác":      CHI,
    "Chuyển đi":  "bg-slate-100 text-slate-600 ring-1 ring-slate-200",
    "Chuyển về":  "bg-slate-100 text-slate-600 ring-1 ring-slate-200",
  };

  const thC = "whitespace-nowrap px-3 py-2.5 text-left";
  const thR = "whitespace-nowrap px-3 py-2.5 text-right";
  const tdC = "px-3 py-2.5 text-slate-700";
  const tdR = "px-3 py-2.5 text-right tabular-nums font-medium";

  return /*#__PURE__*/React.createElement("div", {className:"space-y-4"},

    /*#__PURE__*/React.createElement(Card, {title: "Sổ quỹ",
      right: /*#__PURE__*/React.createElement("div", {className:"flex gap-2"},
        /*#__PURE__*/React.createElement("button", {onClick:()=>setModal("thu"), className:"inline-flex items-center gap-1.5 rounded-lg bg-[#0D9488] px-3 py-1.5 text-sm font-semibold text-white hover:bg-[#0F766E]"},
          /*#__PURE__*/React.createElement(Plus, {className:"h-4 w-4"}), "Lập phiếu thu"),
        /*#__PURE__*/React.createElement("button", {onClick:()=>setModal("chi"), className:"inline-flex items-center gap-1.5 rounded-lg bg-[#0F766E] px-3 py-1.5 text-sm font-semibold text-white hover:bg-[#115E59]"},
          /*#__PURE__*/React.createElement(Minus, {className:"h-4 w-4"}), "Lập phiếu chi"),
        /*#__PURE__*/React.createElement("button", {onClick:()=>setModal("chuyen"), className:"inline-flex items-center gap-1.5 rounded-lg bg-[#115E59] px-3 py-1.5 text-sm font-semibold text-white hover:bg-[#134E4A]"},
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
              /*#__PURE__*/React.createElement("td",{className:tdR+(a.totalIn>0?" text-[#047857]":" text-slate-300")},a.totalIn>0?vnd(a.totalIn):"—"),
              /*#__PURE__*/React.createElement("td",{className:tdR+(a.totalOut>0?" text-[#B91C1C]":" text-slate-300")},a.totalOut>0?vnd(a.totalOut):"—"),
              /*#__PURE__*/React.createElement("td",{className:tdR+" text-slate-900 font-semibold"},vnd(a.closeBal)),
              /*#__PURE__*/React.createElement("td",{className:"px-3 py-2 text-center"},
                /*#__PURE__*/React.createElement("button",{onClick:()=>{ setFAccDetail(fAccDetail===a.key?null:a.key); setFAcc("Tất cả"); },
                  className:`rounded-md px-2 py-1 text-xs font-medium transition ${fAccDetail===a.key?"bg-[#0F766E] text-white":"bg-[#CCFBF1] text-[#0F766E] hover:bg-[#b2f0e8] ring-1 ring-[#0F766E]/20"}`},"Chi tiết")))),
            /*#__PURE__*/React.createElement("tr",{className:"bg-[#E6FFFA]"},
              /*#__PURE__*/React.createElement("td",{className:tdC+" font-bold text-slate-800",colSpan:3},"TỔNG CỘNG"),
              /*#__PURE__*/React.createElement("td",{className:"px-3 py-2.5 text-right tabular-nums text-slate-900",style:{fontWeight:700}},vnd(tot.openBal)),
              /*#__PURE__*/React.createElement("td",{className:"px-3 py-2.5 text-right tabular-nums text-[#047857]",style:{fontWeight:700}},tot.totalIn>0?vnd(tot.totalIn):"—"),
              /*#__PURE__*/React.createElement("td",{className:"px-3 py-2.5 text-right tabular-nums text-[#B91C1C]",style:{fontWeight:700}},tot.totalOut>0?vnd(tot.totalOut):"—"),
              /*#__PURE__*/React.createElement("td",{className:"px-3 py-2.5 text-right tabular-nums text-slate-900",style:{fontWeight:700}},vnd(tot.closeBal)),
              /*#__PURE__*/React.createElement("td",null)))))),

    /*#__PURE__*/React.createElement(Card, {title: fAccDetail ? `Lịch sử giao dịch: ${bankAccounts.find(a=>a.key===fAccDetail)?.bank||fAccDetail}` : "Lịch sử giao dịch",
      right: /*#__PURE__*/React.createElement("div", {className:"flex flex-wrap items-center gap-2"},
        /*#__PURE__*/React.createElement("input", {type:"date", value:fromDate, onChange:e=>setFromDate(e.target.value), className:`${field} py-1.5 text-sm`}),
        /*#__PURE__*/React.createElement("span", {className:"text-slate-400 text-sm"}, "—"),
        /*#__PURE__*/React.createElement("input", {type:"date", value:toDate, onChange:e=>setToDate(e.target.value), className:`${field} py-1.5 text-sm`}),
        /*#__PURE__*/React.createElement("div", {className:"relative"},
          /*#__PURE__*/React.createElement(Search, {className:"absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400"}),
          /*#__PURE__*/React.createElement("input", {value:q, onChange:e=>setQ(e.target.value), placeholder:"Tìm kiếm...", className:`${field} w-48 pl-8 py-1.5 text-sm`})),
        /*#__PURE__*/React.createElement("select", {value:fAcc, onChange:e=>{ setFAcc(e.target.value); setFAccDetail(null); }, className:`${field} py-1.5 text-sm`},
          allAccs.map(a=>/*#__PURE__*/React.createElement("option",{key:a},a))),
        /*#__PURE__*/React.createElement("select", {value:fDir, onChange:e=>setFDir(e.target.value), className:`${field} py-1.5 text-sm`},
          ["Tất cả","Thu","Chi"].map(k=>/*#__PURE__*/React.createElement("option",{key:k},k))))},
      /*#__PURE__*/React.createElement("div", {className:"-mx-5 -mb-5"},
        /*#__PURE__*/React.createElement(TableShell, {minW:"1100px",
          head:/*#__PURE__*/React.createElement(React.Fragment,null,
            /*#__PURE__*/React.createElement(Th,null,"Mã GD"),
            /*#__PURE__*/React.createElement(Th,{center:true},"Ngày"),
            /*#__PURE__*/React.createElement(Th,null,"Đối tượng"),
            /*#__PURE__*/React.createElement(Th,null,"Số đơn hàng"),
            /*#__PURE__*/React.createElement(Th,{center:true},"Loại giao dịch"),
            /*#__PURE__*/React.createElement(Th,{center:true},"Tài khoản"),
            /*#__PURE__*/React.createElement(Th,{center:true},"Số tiền"),
            /*#__PURE__*/React.createElement(Th,{center:true},"Nội dung"),
            /*#__PURE__*/React.createElement(Th,null,"Người tạo"),
            /*#__PURE__*/React.createElement(Th,{center:true},"Thao tác"))},
          visibleTxns.map(t=>/*#__PURE__*/React.createElement("tr",{key:t.id},
            /*#__PURE__*/React.createElement("td",{className:"px-3 py-2.5 text-slate-500 tabular-nums"},t.id),
            /*#__PURE__*/React.createElement("td",{className:"whitespace-nowrap px-3 py-2.5 text-slate-500"},t.date),
            /*#__PURE__*/React.createElement("td",{className:"px-3 py-2.5 text-slate-700"},t.entity),
            /*#__PURE__*/React.createElement("td",{className:"px-3 py-2.5"},
              t.orderId ? /*#__PURE__*/React.createElement("span",{className:"text-[#2563EB] hover:underline cursor-pointer", onClick:()=>onOpenOrder&&onOpenOrder(t.orderId)},t.orderId) : /*#__PURE__*/React.createElement("span",{className:"text-slate-300"},"—")),
            /*#__PURE__*/React.createElement("td",{className:"px-3 py-2.5 text-center"},
              /*#__PURE__*/React.createElement("span",{className:`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${KIND_COLORS[t.kind]||"bg-slate-100 text-slate-600 ring-1 ring-slate-200"}`},t.kind)),
            /*#__PURE__*/React.createElement("td",{className:"whitespace-nowrap px-3 py-2.5 text-slate-600"},t.acc),
            /*#__PURE__*/React.createElement("td",{className:`px-3 py-2.5 text-right tabular-nums font-semibold ${t.amount>=0?"text-[#047857]":"text-[#B91C1C]"}`},
              (t.amount>=0?"+":"")+vnd(t.amount)),
            /*#__PURE__*/React.createElement("td",{className:"px-3 py-2.5 text-slate-500 text-xs"},t.note||"—"),
            /*#__PURE__*/React.createElement("td",{className:"whitespace-nowrap px-3 py-2.5 text-xs text-slate-500"},t.staff),
            /*#__PURE__*/React.createElement("td",{className:"px-3 py-2.5"},
              /*#__PURE__*/React.createElement("div",{className:"flex items-center justify-center gap-1"},
                /*#__PURE__*/React.createElement(IconBtn,{icon:Pencil,title:"Sửa",onClick:()=>setEditTxn(t)}),
                /*#__PURE__*/React.createElement(IconBtn,{icon: Trash2, tone: "danger", title:"Xóa",onClick:()=>delTxn(t.id)})))))))),

    modal==="thu"    && /*#__PURE__*/React.createElement(PhieuThuModal,  {onClose:()=>setModal(null), onSave:addTxn,  nextId}),
    modal==="chi"    && /*#__PURE__*/React.createElement(PhieuChiModal,  {onClose:()=>setModal(null), onSave:addChi,  nextId}),
    modal==="chuyen" && /*#__PURE__*/React.createElement(ChuyenTienModal,{onClose:()=>setModal(null), onSave:addXfer, nextId}),
    editTxn && /*#__PURE__*/React.createElement(EditTxnModal,{txn:editTxn, onClose:()=>setEditTxn(null), onSave:saveEdit}));
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
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex flex-wrap items-end gap-2"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: "mb-1 block text-[13px] font-medium text-slate-500"
  }, "Từ ngày"), /*#__PURE__*/React.createElement("input", {
    type: "date",
    defaultValue: "2026-06-01",
    className: field
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: "mb-1 block text-[13px] font-medium text-slate-500"
  }, "Đến ngày"), /*#__PURE__*/React.createElement("input", {
    type: "date",
    defaultValue: "2026-06-16",
    className: field
  }))), /*#__PURE__*/React.createElement("div", {
    className: "grid grid-cols-2 gap-4 lg:grid-cols-4"
  }, /*#__PURE__*/React.createElement(StatCard, {
    label: "Thành tiền",
    value: sum.n,
    icon: ShoppingCart
  }), /*#__PURE__*/React.createElement(StatCard, {
    label: "Doanh thu",
    value: vnd(sum.rev),
    tone: "accent"
  }), /*#__PURE__*/React.createElement(StatCard, {
    label: "Vốn nhập",
    value: vnd(sum.rev * 0.78)
  }), /*#__PURE__*/React.createElement(StatCard, {
    label: "Lợi nhuận",
    value: vnd(sum.rev * 0.22),
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
      className: "px-4 py-3 text-right font-medium tabular-nums text-[#047857]"
    }, vnd(r.rev - cost)), /*#__PURE__*/React.createElement("td", {
      className: "px-4 py-3 text-right tabular-nums text-[#B91C1C]"
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
    className: "text-[16px] font-semibold text-[#0F766E]"
  }, "Báo cáo sản phẩm đặt hàng"), /*#__PURE__*/React.createElement("div", {
    className: "flex flex-wrap items-end gap-3"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: "mb-1 block text-[13px] font-medium text-slate-500"
  }, "Từ ngày"), /*#__PURE__*/React.createElement("input", {
    type: "date",
    defaultValue: "2026-06-01",
    className: field
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: "mb-1 block text-[13px] font-medium text-slate-500"
  }, "Đến ngày"), /*#__PURE__*/React.createElement("input", {
    type: "date",
    defaultValue: "2026-06-16",
    className: field
  })), /*#__PURE__*/React.createElement("div", {
    className: "min-w-[180px] flex-1"
  }, /*#__PURE__*/React.createElement("label", {
    className: "mb-1 block text-[13px] font-medium text-slate-500"
  }, "Tìm kiếm sản phẩm"), /*#__PURE__*/React.createElement("input", {
    value: q,
    onChange: e => setQ(e.target.value),
    placeholder: "Tên sản phẩm…",
    className: `${field} w-full`
  })), /*#__PURE__*/React.createElement("button", {
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
      className: "px-3 py-3 text-sm text-slate-600"
    }, r.sku), /*#__PURE__*/React.createElement("td", {
      className: "px-3 py-3 text-sm text-slate-800"
    }, r.prod), /*#__PURE__*/React.createElement("td", {
      className: "px-3 py-3 text-right tabular-nums text-slate-700"
    }, r.ordered), /*#__PURE__*/React.createElement("td", {
      className: `px-3 py-3 text-right tabular-nums ${r.stock > 0 ? "text-slate-500" : "text-[#94A3B8]"}`
    }, r.stock > 0 ? r.stock : "–"), /*#__PURE__*/React.createElement("td", {
      className: `px-3 py-3 text-right tabular-nums ${need > 0 ? "text-[#B91C1C]" : "text-[#94A3B8]"}`
    }, need > 0 ? need : "–"), /*#__PURE__*/React.createElement("td", {
      className: `px-3 py-3 text-right tabular-nums ${r.orders > 0 ? "text-slate-600" : "text-[#94A3B8]"}`
    }, r.orders > 0 ? r.orders : "–"));
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
    className: "text-[16px] font-semibold text-[#0F766E]"
  }, "Báo cáo nhân viên"), /*#__PURE__*/React.createElement("div", {
    className: "flex flex-wrap items-end gap-3"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: "mb-1 block text-[13px] font-medium text-slate-500"
  }, "Từ ngày"), /*#__PURE__*/React.createElement("input", {
    type: "date",
    defaultValue: "2026-06-01",
    className: field
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: "mb-1 block text-[13px] font-medium text-slate-500"
  }, "Đến ngày"), /*#__PURE__*/React.createElement("input", {
    type: "date",
    defaultValue: "2026-06-16",
    className: field
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: "mb-1 block text-[13px] font-medium text-slate-500"
  }, "Nhân viên"), /*#__PURE__*/React.createElement("select", {
    className: field
  }, /*#__PURE__*/React.createElement("option", null, "Tất cả"), STAFF_RANK.map(s => /*#__PURE__*/React.createElement("option", {
    key: s.name
  }, s.name)))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: "mb-1 block text-[13px] font-medium text-slate-500"
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
    className: "px-4 py-3 text-right tabular-nums text-[#047857]"
  }, vnd(s.collected)), /*#__PURE__*/React.createElement("td", {
    className: `px-4 py-3 text-right tabular-nums ${s.remain > 0 ? "text-[#B91C1C]" : "text-slate-300"}`
  }, s.remain > 0 ? vnd(s.remain) : "—")))));
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
        onImportKho: onImportKho
      });
    case "purchase":
      return /*#__PURE__*/React.createElement(PurchaseModule, {onImportToWh, purchaseList, setPurchaseList});
    case "wh_in":
      return /*#__PURE__*/React.createElement(WhIn, {whInItems, setWhInItems, orders, onOpenOrder: id => { setOpenOrderId(id); setActive("sales_orders"); }});
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
    case "settings_payment":
      return /*#__PURE__*/React.createElement(SettingsPayment, null);
    case "settings_numformat":
      return /*#__PURE__*/React.createElement(SettingsNumFormat, null);
    case "settings_docnum":
      return /*#__PURE__*/React.createElement(SettingsDocNum, null);
    case "users":
      return /*#__PURE__*/React.createElement(UsersTab, null);
    default:
      return /*#__PURE__*/React.createElement(Dashboard, null);
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
  const mergeWhIn = (prev, newSlips) => {
    const existing = new Set(prev.map(r => r.lot));
    const fresh = (Array.isArray(newSlips) ? newSlips : [newSlips]).filter(s => !existing.has(s.lot)).map(addKhoGlobal);
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
  const setWhInItems = u => syncFS("wh_in", r => r.lot)(whInItems, u);
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
  const [txns, setTxns] = useState(TXNS);
  const title = LABELS[active] || "";
  return /*#__PURE__*/React.createElement(InvCtx.Provider, {value: {whInItems, setWhInItems, whOutItems, setWhOutItems}},
  /*#__PURE__*/React.createElement(TxnCtx.Provider, {value: {txns, setTxns}},
  /*#__PURE__*/React.createElement(BankCtx.Provider, {value: {bankAccounts, setBankAccounts}},
  /*#__PURE__*/React.createElement(ToastHost, null, /*#__PURE__*/React.createElement("div", {
    className: "flex min-h-screen bg-[#F4F6F8] font-sans text-[#1E293B]",
    style: {
      fontFamily: "'Be Vietnam Pro', Inter, ui-sans-serif, system-ui, 'Segoe UI', Roboto, Arial, sans-serif"
    }
  }, /*#__PURE__*/React.createElement("aside", {
    className: "flex w-64 shrink-0 flex-col bg-[#1e293b]"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center px-4 py-4 border-b border-[#2d3f55] gap-2"
  }, /*#__PURE__*/React.createElement("div", { className: "flex-1" },
    /*#__PURE__*/React.createElement("p", {
      className: "text-[12px] font-bold tracking-wider text-white uppercase leading-tight"
    }, "BÁN LẺ TẠI KHO HẢI PHÒNG"),
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
        className: `flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition ${on ? "bg-[#0F766E] font-medium text-white" : "text-slate-400 hover:bg-[#253552] hover:text-white"}`
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
      className: `flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition hover:bg-[#253552] hover:text-white ${childOn ? "bg-[#253552] text-white" : "text-slate-400"}`
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
      className: `block w-full rounded-lg px-3 py-1.5 text-left text-sm transition ${active === c.key ? "font-medium text-[#CCFBF1]" : "text-slate-400 hover:bg-[#253552] hover:text-white"}`
    }, c.label))));
  })), /*#__PURE__*/React.createElement("div", {
    className: "border-t border-[#2d3f55] px-5 py-4"
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
    className: "flex-1 overflow-auto p-6"
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
    onImportToWh: slipOrSlips => { setWhInItems(prev => mergeWhIn(prev, slipOrSlips)); setActive("wh_in"); },
    onImportKho: slips => { setWhInItems(prev => mergeWhIn(prev, slips)); },
    onExportToWh: slips => { setWhOutItems(prev => mergeWhOut(prev, slips)); }
  }))))))));
}

/* ───────── Settings Payment ───────── */
function SettingsPayment() {
  const {bankAccounts: banks, setBankAccounts: setBanks} = useBankAccounts();
  const inf = "w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-[#2563EB] focus:outline-none";
  const addBtnBlue = addBtn;
  const badge = s => s === "Hoạt động"
    ? "inline-flex items-center rounded-full bg-[#DCFCE7] px-2.5 py-0.5 text-xs font-semibold text-[#15803D]"
    : "inline-flex items-center rounded-full bg-[#F1F5F9] px-2.5 py-0.5 text-xs font-semibold text-slate-500";
  const editBtn = "rounded p-1.5 bg-[#E0F2FE] text-[#0284C7] hover:bg-[#BAE6FD]";
  const delBtn = "rounded p-1.5 bg-[#FEE2E2] text-[#B91C1C] hover:bg-[#FECACA]";
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
            /*#__PURE__*/React.createElement("td", {className: td}, r.branch || "—"),
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
            /*#__PURE__*/React.createElement("th", {className: th, style:{width:120}}, "Loại"),
            /*#__PURE__*/React.createElement("th", {className: th, style:{width:140}}, "Trạng thái"),
            /*#__PURE__*/React.createElement("th", {className: th, style:{width:100}}, "Thao tác"))),
        /*#__PURE__*/React.createElement("tbody", {className: "divide-y divide-slate-100"},
          txTypes.map(r => /*#__PURE__*/React.createElement("tr", {key: r.id, className: "hover:bg-slate-50"},
            /*#__PURE__*/React.createElement("td", {className: td}, r.name),
            /*#__PURE__*/React.createElement("td", {className: td}, r.type),
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
  {id:1, type:"Báo giá",            prefix:"BG",  num:72,  digits:5},
  {id:2, type:"Đơn hàng",           prefix:"DH",  num:48,  digits:5},
  {id:3, type:"Phiếu mua hàng",     prefix:"PM",  num:18,  digits:5},
  {id:4, type:"Phiếu nhập kho",     prefix:"PN",  num:35,  digits:5},
  {id:5, type:"Phiếu xuất kho",     prefix:"PX",  num:27,  digits:5},
  {id:6, type:"Phiếu thu",          prefix:"PT",  num:125, digits:5},
  {id:7, type:"Phiếu chi",          prefix:"PC",  num:187, digits:5},
];

function SettingsDocNum() {
  const [rows, setRows] = React.useState(DOC_NUM_INIT);
  const [editing, setEditing] = React.useState(null); // {id, num}
  const notify = useToast();

  const preview = r => r.prefix + String(r.num).padStart(r.digits, "0");

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
        /*#__PURE__*/React.createElement("thead", {className: "bg-[#F0FDFA]"},
          /*#__PURE__*/React.createElement("tr", null,
            /*#__PURE__*/React.createElement("th", {className: th + " w-8"}, "#"),
            /*#__PURE__*/React.createElement("th", {className: th}, "Loại chứng từ"),
            /*#__PURE__*/React.createElement("th", {className: th}, "Tiền tố"),
            /*#__PURE__*/React.createElement("th", {className: th + " text-right"}, "Số hiện tại"),
            /*#__PURE__*/React.createElement("th", {className: th + " text-right"}, "Tổng ký tự số"),
            /*#__PURE__*/React.createElement("th", {className: th}, "Hiển thị"),
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
                      className: "w-24 rounded border border-[#0D9488] px-2 py-0.5 text-right text-sm focus:outline-none focus:ring-1 focus:ring-[#0D9488]"
                    })
                  : r.num
              ),
              /*#__PURE__*/React.createElement("td", {className: td + " text-right"}, r.digits),
              /*#__PURE__*/React.createElement("td", {className: td},
                /*#__PURE__*/React.createElement("span", {className: "inline-flex items-center rounded-md border border-[#0D9488] bg-white px-2.5 py-0.5 text-sm font-semibold text-[#0D9488]"}, preview(r))
              ),
              /*#__PURE__*/React.createElement("td", {className: td + " text-center"},
                editing && editing.id === r.id
                  ? /*#__PURE__*/React.createElement("div", {className: "flex items-center justify-center gap-2"},
                      /*#__PURE__*/React.createElement("button", {onClick: save, className: "rounded-md bg-[#0F766E] px-3 py-1 text-xs font-semibold text-white hover:bg-[#0D5F58]"}, "Lưu"),
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
        "Số hiện tại là số của chứng từ ",
        /*#__PURE__*/React.createElement("strong", null, "gần nhất đã tạo"),
        ". Chứng từ tiếp theo sẽ được đánh số = số hiện tại + 1."
      ),
      /*#__PURE__*/React.createElement("p", {className: "text-[13px] text-slate-500"},
        "Tổng ký tự số: số thứ tự được bổ sung số 0 phía trước để đủ ",
        /*#__PURE__*/React.createElement("strong", null, "5 chữ số"),
        " (VD: 72 → 00072)."
      )
    )
  );
}

/* ───────── Màn hình đăng nhập ───────── */
function LoginScreen() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const submit = async e => {
    e.preventDefault();
    setErr(""); setLoading(true);
    try { await login(email.trim(), pass); }
    catch { setErr("Email hoặc mật khẩu không đúng."); }
    finally { setLoading(false); }
  };
  return React.createElement("div", { className: "min-h-screen flex", style: { background: "linear-gradient(135deg, #4a0e1a 0%, #7f1d1d 50%, #991b1b 100%)" } },
    /* Panel trái — brand */
    React.createElement("div", { className: "hidden lg:flex flex-col justify-between w-1/2 p-12 text-white" },
      React.createElement("div", null,
        React.createElement("div", { className: "text-3xl font-extrabold tracking-wide" }, "BLTK"),
        React.createElement("div", { className: "text-red-200 text-sm mt-1" }, "Hải Phòng")
      ),
      React.createElement("div", null,
        React.createElement("div", { className: "text-4xl font-bold leading-snug mb-4" }, "Quản lý bán lẻ\ntại kho"),
        React.createElement("div", { className: "text-red-200 text-base" }, "Đơn hàng · Kho · Tài chính · Báo cáo")
      ),
      React.createElement("div", { className: "text-red-300 text-xs" }, "© 2026 BLTK Hải Phòng")
    ),
    /* Panel phải — form */
    React.createElement("div", { className: "flex flex-1 items-center justify-center p-6" },
      React.createElement("div", { className: "bg-white rounded-3xl shadow-2xl w-full max-w-md p-10" },
        /* Header */
        React.createElement("div", { className: "mb-8" },
          React.createElement("div", { className: "w-12 h-12 rounded-2xl flex items-center justify-center mb-4", style: { background: "linear-gradient(135deg,#7f1d1d,#4a0e1a)" } },
            React.createElement(Store, { className: "h-6 w-6 text-white" })
          ),
          React.createElement("h1", { className: "text-2xl font-bold text-slate-800" }, "Đăng nhập"),
          React.createElement("p", { className: "text-slate-400 text-sm mt-1" }, "Nhập thông tin tài khoản của bạn")
        ),
        /* Form */
        React.createElement("form", { onSubmit: submit, className: "space-y-5" },
          React.createElement("div", null,
            React.createElement("label", { className: "block text-sm font-medium text-slate-600 mb-1.5" }, "Email"),
            React.createElement("input", { type: "email", value: email, onChange: e => setEmail(e.target.value), required: true, autoFocus: true,
              placeholder: "ten@email.com",
              className: "w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-800 focus:border-transparent bg-slate-50" })
          ),
          React.createElement("div", null,
            React.createElement("label", { className: "block text-sm font-medium text-slate-600 mb-1.5" }, "Mật khẩu"),
            React.createElement("input", { type: "password", value: pass, onChange: e => setPass(e.target.value), required: true,
              placeholder: "••••••••",
              className: "w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-800 focus:border-transparent bg-slate-50" })
          ),
          err && React.createElement("div", { className: "flex items-center gap-2 text-sm text-red-600 bg-red-50 rounded-xl px-4 py-2.5" },
            React.createElement(AlertTriangle, { className: "h-4 w-4 flex-shrink-0" }), err
          ),
          React.createElement("button", { type: "submit", disabled: loading,
            className: "w-full text-white font-semibold rounded-xl py-3 text-sm transition disabled:opacity-60 mt-2",
            style: { background: loading ? "#7f1d1d" : "linear-gradient(135deg,#7f1d1d,#4a0e1a)" } },
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
  const [form, setForm] = useState(null); // null | {} new | user edit
  const [newEmail, setNewEmail] = useState("");
  const [newPass, setNewPass] = useState("");
  const [newName, setNewName] = useState("");
  const [newRole, setNewRole] = useState("sales");
  const [saving, setSaving] = useState(false);

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

  const changeRole = async (u, role) => {
    await saveDoc("users", u.uid || u.id, { ...u, role });
    notify("Đã cập nhật quyền");
  };

  const roleColors = { manager: "bg-purple-100 text-purple-700", sales: "bg-blue-100 text-blue-700", warehouse: "bg-green-100 text-green-700" };

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
      )
    },
      users.map(u => React.createElement("tr", { key: u.email, className: "hover:bg-slate-50" },
        React.createElement("td", { className: "px-4 py-2 text-sm font-medium" }, u.name || "—"),
        React.createElement("td", { className: "px-4 py-2 text-sm text-slate-500" }, u.email),
        React.createElement("td", { className: "px-4 py-2" },
          React.createElement("select", {
            value: u.role, onChange: e => changeRole(u, e.target.value),
            className: "text-xs rounded-full px-2 py-1 border-0 " + (roleColors[u.role] || "")
          },
            Object.entries(ROLES).map(([k, v]) => React.createElement("option", { key: k, value: k }, v.label))
          )
        )
      ))
    ),
    form && React.createElement("div", { className: "fixed inset-0 bg-black/40 flex items-center justify-center z-50" },
      React.createElement("div", { className: "bg-white rounded-2xl shadow-xl p-8 w-full max-w-sm" },
        React.createElement("h3", { className: "text-lg font-bold mb-6" }, "Thêm nhân viên"),
        React.createElement("form", { onSubmit: createUser, className: "space-y-4" },
          React.createElement("div", null,
            React.createElement("label", { className: "block text-sm font-medium text-slate-600 mb-1" }, "Họ tên"),
            React.createElement("input", { value: newName, onChange: e => setNewName(e.target.value), required: true,
              className: field + " w-full" })
          ),
          React.createElement("div", null,
            React.createElement("label", { className: "block text-sm font-medium text-slate-600 mb-1" }, "Email"),
            React.createElement("input", { type: "email", value: newEmail, onChange: e => setNewEmail(e.target.value), required: true,
              className: field + " w-full" })
          ),
          React.createElement("div", null,
            React.createElement("label", { className: "block text-sm font-medium text-slate-600 mb-1" }, "Mật khẩu tạm"),
            React.createElement("input", { type: "text", value: newPass, onChange: e => setNewPass(e.target.value), required: true, minLength: 6,
              className: field + " w-full" })
          ),
          React.createElement("div", null,
            React.createElement("label", { className: "block text-sm font-medium text-slate-600 mb-1" }, "Vai trò"),
            React.createElement("select", { value: newRole, onChange: e => setNewRole(e.target.value), className: field + " w-full" },
              Object.entries(ROLES).map(([k, v]) => React.createElement("option", { key: k, value: k }, v.label))
            )
          ),
          React.createElement("div", { className: "flex gap-2 pt-2" },
            React.createElement("button", { type: "button", onClick: () => setForm(null), className: "flex-1 border rounded-lg py-2 text-sm" }, "Huỷ"),
            React.createElement("button", { type: "submit", disabled: saving, className: blueBtn + " flex-1 justify-center disabled:opacity-50" },
              saving ? "Đang tạo..." : "Tạo tài khoản")
          )
        )
      )
    )
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
