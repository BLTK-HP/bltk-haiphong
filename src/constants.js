import PRODUCTS from './products.js';

/* ───────── helpers ───────── */
export const vnd = n => (n == null || isNaN(n)) ? "" : new Intl.NumberFormat("vi-VN").format(Math.round(n));
export const num = vnd;
export const TEXT_CELL = "whitespace-nowrap";
export const fmtPhone = v => {
  if (v == null) return "";
  let s = String(v).trim();
  if (/^\d{9,10}$/.test(s) && s.length === 9 && !s.startsWith("0")) s = "0" + s;
  return s;
};
export const vndShort = n => {
  if (Math.abs(n) >= 1e9) return (n / 1e9).toFixed(2).replace(/\.?0+$/, "") + " tỷ";
  if (Math.abs(n) >= 1e6) return (n / 1e6).toFixed(1).replace(/\.0$/, "") + " tr";
  return new Intl.NumberFormat("vi-VN").format(n);
};
export const localToday = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`; };
export const localMonthStart = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-01`; };
export const parseISO = s => { const [y,m,d] = String(s).split("-"); return new Date(+y,+m-1,+d); };
export const parseISOEnd = s => new Date(parseISO(s).getTime() + 86399999);
export const parseViDate = s => {
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

/* ───────── status maps ───────── */
export const CHANNELS = {
  Facebook: "bg-blue-50 text-blue-700 ring-blue-200",
  Zalo: "bg-sky-50 text-sky-700 ring-sky-200",
  TikTok: "bg-slate-900 text-white ring-slate-700",
  "Đến CH": "bg-slate-100 text-slate-600 ring-slate-200"
};
export const ORDER_STATUS = {
  "Chờ giao hàng":  "bg-slate-100 text-slate-500 ring-slate-200",
  "Chờ xử lý":      "bg-[#FFFBEB] text-[#B45309] ring-[#FDE68A]",
  "Hoàn thành":     "bg-[#fef9f0] text-[#92400e] ring-[#b45309]",
  "Huỷ":            "bg-[#FBE9E7] text-[#9A1B0E] ring-[#F5C5BE]"
};
export const ORDER_TABS = ["Tất cả", "Chờ xử lý", "Hoàn thành", "Huỷ"];
export const PAY_STATUS = {
  "Đã đặt cọc":    "bg-slate-100 text-slate-500 ring-slate-200",
  "Chờ thanh toán": "bg-[#FFFBEB] text-[#B45309] ring-[#FDE68A]",
  "Đã thanh toán":  "bg-[#fef9f0] text-[#92400e] ring-[#b45309]",
};
export const KHO_STATUS = {
  "Cần nhập":      "bg-slate-100 text-slate-500 ring-slate-200",
  "Cần xuất":      "bg-slate-100 text-slate-500 ring-slate-200",
  "Đã xử lý kho": "bg-[#fef9f0] text-[#92400e] ring-[#b45309]"
};
export const DELIVERY = {
  "Đã giao hàng":   "bg-[#fef9f0] text-[#92400e] ring-[#b45309]",
  "Chưa giao hàng": "bg-slate-100 text-slate-500 ring-slate-200"
};
export const normalizeDelivery = v => {
  if (!v || v === "Chưa giao" || v === "Sẵn sàng giao") return "Chưa giao hàng";
  if (v === "Đã giao") return "Đã giao hàng";
  return v;
};
export const TIERS = {
  "Thường": "bg-slate-100 text-slate-600 ring-slate-200",
  "Bạc": "bg-zinc-100 text-zinc-600 ring-zinc-300",
  "Vàng": "bg-amber-50 text-amber-700 ring-amber-200",
  "Kim cương": "bg-cyan-50 text-cyan-700 ring-cyan-200"
};
export const PAY_NCC = {
  "Đã thanh toán": "bg-amber-50 text-[#92400e] ring-amber-200",
  "Chưa thanh toán": "bg-amber-50 text-amber-700 ring-amber-200"
};
export const APPROVE = {
  "Đã duyệt": "bg-amber-50 text-[#92400e] ring-amber-200",
  "Đã từ chối": "bg-rose-50 text-rose-700 ring-rose-200"
};
export const C_THU = "#047857";
export const C_CHI = "#B91C1C";

/* ───────── order helpers ───────── */
export const mkOrder = o => ({
  expense: 0, importExpense: 0, paid: 0,
  delivery: "Chưa giao hàng", orderStatus: "",
  imported: false, exported: false, returned: false, draft: false,
  ...o
});
export const INIT_ORDERS = [];

export function calc(o) {
  const subtotal = (o.items||[]).reduce((s, l) => s + Math.max(0, l.price * l.qty - (l.disc || 0)), 0);
  const custExpTotal = (o.custExpenses||[]).reduce((s,e) => s+(e.amount||0), 0) + (o.shippingFee||0) + (o.installFee||0) + (o.returnFee||0);
  const total = subtotal + custExpTotal;
  const totalCost = (o.items||[]).reduce((s, l) => s + (l.cost||0) * l.qty, 0);
  const remaining = total - (o.paid||0);
  const payDone = total > 0 && remaining <= 0;
  const pay = payDone ? "Đã thanh toán" : o.deliveryConfirmed ? "Chờ thanh toán" : "Đã đặt cọc";
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

/* ───────── static data ───────── */
export const CUSTOMERS = [
  {id:"KH001", name:"Anh Châu",   phone:"0989145440", addr:"5B/24/17 Khúc Thừa Dụ"},
  {id:"KH002", name:"Thuý Phạm",  phone:"0943460568", addr:"15/116 Nguyễn Đức Cảnh"},
  {id:"KH003", name:"Chú Thiệp",  phone:"0988590148", addr:"69/132 đường Vòng Vạn Mỹ"},
];

export const SUPPLIER_COSTS = [
  { pat: ["AC-989VN", "AC-989/CW-MV"],                                   from: "02/01/2026", price: 4530000 },
  { pat: ["AC-989VN", "AC-989/CW-MV"],                                   from: "11/02/2026", price: 4570000 },
  { pat: ["AC-989/CW-S32"],                                              from: "29/01/2026", price: 5450000 },
  { pat: ["AC-902/CW-S32"],                                              from: "03/01/2026", price: 7050000 },
  { pat: ["AC-902VN"],                                                   from: "06/01/2026", price: 6850000 },
  { pat: ["AC-919VRN"],                                                  from: "13/01/2026", price: 8050000 },
  { pat: ["AC-919R/CW-S32", "AC-919/CW-S32"],                           from: "22/01/2026", price: 7550000 },
  { pat: ["AC-969VN"],                                                   from: "22/01/2026", price: 3800000 },
  { pat: ["AC-969/CW-S15"],                                              from: "03/02/2026", price: 4650000 },
  { pat: ["AC-602"],                                                     from: "22/01/2026", price: 3010000 },
  { pat: ["AC-1032"],                                                    from: "25/01/2026", price: 8650000 },
  { pat: ["L-289V/L-288VC", "L-289V/ L288VC", "AL-289V/ L288VC", "AL-289V/L-288VC"], from: "02/01/2026", price: 1704000 },
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
  { pat: ["L-288VD", "L288VD"],                                         from: "02/01/2026", price: 703000  },
  { pat: ["L-288VC", "L288VC"],                                         from: "02/01/2026", price: 703000  },
  { pat: ["L-298VC", "L298VC"],                                         from: "17/01/2026", price: 716000  },
  { pat: ["L-284VD", "L284VD"],                                         from: "03/02/2026", price: 572000  },
  { pat: ["LFV-1402S-R", "1402S-R", "LFV-1402SR"],                     from: "02/01/2026", price: 1190000 },
  { pat: ["LFV-1402S-R", "1402S-R", "LFV-1402SR"],                     from: "04/02/2026", price: 1200000 },
  { pat: ["LFV-1402SH", "1402SH"],                                      from: "02/01/2026", price: 1550000 },
  { pat: ["LFV-612", "LFV612"],                                         from: "26/01/2026", price: 1750000 },
  { pat: ["LFV-1112", "LPV-1112", "LFV1112"],                          from: "16/01/2026", price: 1040000 },
  { pat: ["SHV-900", "SHV900"],                                         from: "02/02/2026", price: 2539000 },
  { pat: ["BFV-3415T"],                                                  from: "05/01/2026", price: 7130000 },
  { pat: ["BFV-3415T"],                                                  from: "05/02/2026", price: 7170000 },
  { pat: ["BFV-3413T-3C", "3413T-3C"],                                  from: "03/01/2026", price: 2925000 },
  { pat: ["BFV-3413T-4C", "3413T-4C"],                                  from: "04/02/2026", price: 2750000 },
  { pat: ["BFV-3413T-8C", "3413T-8C"],                                  from: "07/02/2026", price: 2930000 },
  { pat: ["BFV-1115S-3C", "1115S-3C", "1115-3C"],                      from: "06/01/2026", price: 3946000 },
  { pat: ["BFV-1113S-8C", "1113S-8C", "1113-8C"],                      from: "04/02/2026", price: 1775000 },
  { pat: ["KO-102A", "KO102A", "CW-102A", "102A"],                     from: "27/12/2025", price: 275000  },
  { pat: ["102M"],                                                       from: "27/12/2025", price: 367000  },
  { pat: ["105M", "105MP", "CW-105"],                                   from: "26/01/2026", price: 855000  },
  { pat: ["UF-8V", "UF8V"],                                             from: "06/01/2026", price: 1191000 },
  { pat: ["C-306", "C306"],                                             from: "22/01/2026", price: 2550000 },
];

export function lookupImportCost(itemName, orderDateStr, costs) {
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

export const SUPPLIERS = [
  { code: "0007", name: "AS LÊ HUY HẢI PHÒNG",  phone: "", addr: "", open: 0, ps: 0, tt: 0 },
  { code: "0008", name: "BANCOOT",                phone: "", addr: "", open: 0, ps: 0, tt: 0 },
  { code: "0016", name: "BLTK SG",               phone: "", addr: "", open: 0, ps: 0, tt: 0 },
  { code: "0004", name: "BOSCH BLUEHOME",         phone: "", addr: "", open: 0, ps: 0, tt: 0 },
  { code: "0024", name: "BOSCH HD",              phone: "", addr: "", open: 0, ps: 0, tt: 0 },
  { code: "0025", name: "CANZY THÀNH NAM",        phone: "", addr: "", open: 0, ps: 0, tt: 0 },
  { code: "0021", name: "EUROSUN",               phone: "", addr: "", open: 0, ps: 0, tt: 0 },
  { code: "0006", name: "INAX HP - HỮU TÍN",    phone: "", addr: "", open: 0, ps: 0, tt: 0 },
  { code: "0011", name: "INAX HP - THÀNH LƯƠNG", phone: "", addr: "", open: 0, ps: 0, tt: 0 },
  { code: "0022", name: "KIM QUÝ",               phone: "", addr: "", open: 0, ps: 0, tt: 0 },
  { code: "0017", name: "KOBESI",                phone: "", addr: "", open: 0, ps: 0, tt: 0 },
  { code: "0026", name: "KOCHER",                phone: "", addr: "", open: 0, ps: 0, tt: 0 },
  { code: "0027", name: "KONOX",                 phone: "", addr: "", open: 0, ps: 0, tt: 0 },
  { code: "0013", name: "PHỤ KIỆN - THẾ AS",    phone: "", addr: "", open: 0, ps: 0, tt: 0 },
  { code: "0005", name: "TÂN ĐẢO (BELLO, NOBI)", phone: "", addr: "", open: 0, ps: 0, tt: 0 },
  { code: "0018", name: "TOTO NGỌC QUYẾN",       phone: "", addr: "", open: 0, ps: 0, tt: 0 },
];
export const SUP_DETAIL = {};
export const IMPORTS = [];
export const RETURNS = [];
export const ACCOUNTS_DEF = [
  {key: "TCB-CTY", bank: "TCB-CTY BLTK HP", stk: "02", owner: "CÔNG TY BTLK HP", openBal: 0},
  {key: "TCB-PAT", bank: "TCB-PAT",          stk: "01", owner: "PAT",              openBal: 0},
  {key: "Tiền mặt", bank: "TIEN MAT",         stk: "TM", owner: "Tiền mặt",         openBal: 0},
];
export const TXNS = [];
export const CASHFLOW = [];
export const STAFF_RANK = [];
export const SALES_BY_DAY = [];
export const EXPORTS = [];
export const CUST_DEBT = [];
export const CUST_DEBT_DETAIL = {};
export const PREORDER = [];

/* ───────── labels ───────── */
export const LABELS = {
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

/* ───────── CSS class strings ───────── */
export const field     = "rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700 focus:border-[#fed7aa] focus:outline-none";
export const inputF    = "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:border-[#fed7aa] focus:outline-none focus:ring-1 focus:ring-[#fde68a]";
export const inputSm   = "w-full rounded-md border border-slate-200 px-2 py-1.5 text-sm focus:border-[#fed7aa] focus:outline-none";
export const blueBtn   = "inline-flex items-center gap-1.5 rounded-lg bg-[#b45309] px-3.5 py-1.5 text-[14px] font-semibold text-white shadow-sm hover:bg-[#92400e]";
export const greenBtn  = "inline-flex items-center gap-1.5 rounded-lg bg-[#92400e] px-3 py-1.5 text-[14px] font-semibold text-white hover:bg-[#78350f]";
export const addBtn    = "inline-flex items-center gap-1.5 rounded-lg border border-[#fed7aa] bg-white px-3 py-1.5 text-[14px] font-semibold text-[#92400e] hover:bg-[#fef3c7]";
export const ghostBtn  = "inline-flex items-center gap-1.5 rounded-lg border border-[#CBD5E1] bg-white px-3 py-1.5 text-[14px] text-[#475569] hover:bg-[#faf7f4]";
export const outlineTealBtn = "inline-flex items-center gap-1.5 rounded-lg border border-[#b45309] bg-white px-3 py-1.5 text-[14px] font-semibold text-[#b45309] hover:bg-[#fef3c7]";
export const backBtn   = "inline-flex items-center gap-1.5 rounded-lg border border-[#E2E8F0] bg-white px-3 py-1.5 text-[14px] text-[#64748B] hover:bg-[#F8FAFC]";

/* ───────── doc numbering helpers ───────── */
export const yr2 = () => String(new Date().getFullYear()).slice(-2);
export const fmtDocId = (prefix, n) => prefix + yr2() + String(n).padStart(4, "0");
export const txnDocId = t => isNaN(Number(t.id)) ? "" : fmtDocId(t.amount >= 0 ? "PT" : "PC", t.id);
export const purCode = lot => String(lot).match(/^PM\d{6}$/) ? lot : "PM" + yr2() + String(lot).replace(/\D/g,"").slice(-4).padStart(4,"0");
export const impCode = lot => String(lot).match(/^PN\d{6}$/) ? lot : "PN" + yr2() + String(lot).replace(/\D/g,"").slice(-4).padStart(4,"0");
export const expCode = lot => String(lot).match(/^PX\d{6}$/) ? lot : "PX" + yr2() + String(lot).replace(/\D/g,"").slice(-4).padStart(4,"0");

/* ───────── inventory helpers ───────── */
export const stockOfStatic = name => { const p = PRODUCTS.find(x => x.name === name); return p ? p.stock : 0; };
export const stockOfLive = (name, whInItems) => whInItems.filter(r => r.prod === name).reduce((s, r) => s + (r.qtyRemaining ?? r.qtyNow ?? 0), 0);
