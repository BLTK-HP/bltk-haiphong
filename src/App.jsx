import React, { useState, useMemo } from 'react'
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
const PRODUCTS = [
  {sku:"A-325PL",name:"INAX - Ống xả Lavabo A-325PL",sale:180000,list:206000,cost:152000,unit:"Cái",desc:"Chất liệu: nhựa Xuất xứ: Việt Nam",stock:0},
  {sku:"A-325PS",name:"INAX - Bộ xả Lavabo A-325PS",sale:220000,list:320000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"A500VS5B",name:"INAX - Vít cố định A500VS5B",sale:0,list:300000,cost:120000,unit:"Cái",desc:"",stock:0},
  {sku:"A-603PV",name:"Phụ kiện (xiphong) thoát nước Lavabo",sale:0,list:1360000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"A-675PV",name:"INAX - Ống xả thải A-675PV",sale:570000,list:680000,cost:540000,unit:"Cái",desc:"",stock:0},
  {sku:"A-703-7",name:"INAX - Van T Chia Nước A-703-7",sale:200000,list:263000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"AC-819VN",name:"INAX - Bồn Cầu AC-819VN",sale:46400000,list:79570000,cost:0,unit:"Bộ",desc:"",stock:0},
  {sku:"AC-902/CW-H18VNINAX",name:"- Bồn Cầu AC-902/CW-H18VN",sale:13257000,list:23820000,cost:0,unit:"Bộ",desc:"",stock:0},
  {sku:"AC-902/CW-S32VN",name:"INAX - Bồn Cầu AC-902/CW-S32VN",sale:7740000,list:12240000,cost:7490000,unit:"Bộ",desc:"Thiết kế vành xả Rim không góc khuất KBícộh",stock:0},
  {sku:"AC-902VN",name:"INAX - Bồn cầu AC-902VN",sale:7300000,list:11340000,cost:7000000,unit:"Bộ",desc:"Nắp êm CF-602VS Thiết kế vành xả Rim",stock:0},
  {sku:"AC-912VN",name:"INAX - Bồn Cầu AC-912VN",sale:6970000,list:10090000,cost:0,unit:"Bộ",desc:"",stock:0},
  {sku:"AC-919VRN",name:"INAX - Bồn Cầu AC-919VRN",sale:8660000,list:11970000,cost:8540000,unit:"Bộ",desc:"",stock:0},
  {sku:"AC-952/CW-KB22AVINNAX",name:"- Bồn Cầu AC-952/CW-KB22AVN",sale:21600000,list:29230000,cost:0,unit:"Bộ",desc:"",stock:0},
  {sku:"AC-952VN",name:"INAX - Bồn Cầu AC-952VN",sale:13245000,list:17560000,cost:12894000,unit:"Bộ",desc:"",stock:0},
  {sku:"AC-959VAN",name:"INAX - Bồn Cầu AC-959VAN",sale:5485000,list:8050000,cost:5690000,unit:"Bộ",desc:"",stock:0},
  {sku:"AC-969VN",name:"INAX - Bồn Cầu AC-969VN",sale:4060000,list:6200000,cost:3940000,unit:"Bộ",desc:"",stock:0},
  {sku:"AC-989/CW-S32VN",name:"INAX - Bồn Cầu AC-989/CW-S32VN",sale:5820000,list:9780000,cost:5700000,unit:"Bộ",desc:"Thiết kế vành xả Rim không góc khuất KBícộh",stock:0},
  {sku:"AC-989VN",name:"INAX - Bồn Cầu AC-989VN",sale:4880000,list:7910000,cost:4760000,unit:"Bộ",desc:"Nắp êm CF-502VS Thiết kế vành xả Rim",stock:0},
  {sku:"AL-2216V",name:"INAX - Lavabo âm AL-2216V",sale:1605000,list:2610000,cost:1422000,unit:"Cái",desc:"",stock:0},
  {sku:"AL-2293V",name:"INAX - Lavabo âm AL-2293V",sale:1695000,list:2030000,cost:1430000,unit:"Cái",desc:"",stock:0},
  {sku:"AL-2298V",name:"INAX - Lavabo âm AL-2298V",sale:2125000,list:2840000,cost:1994000,unit:"Cái",desc:"",stock:0},
  {sku:"A-L2298V-1",name:"INAX - Giá Đỡ Lavabo Âm Bàn A-L2298V3-",sale:0,list:520000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"AL-2395V",name:"INAX - Lavabo AL-2395V",sale:1314000,list:1810000,cost:1020000,unit:"Cái",desc:"",stock:0},
  {sku:"AL-2398V",name:"INAX - Lavabo AL-2398V",sale:1505000,list:1900000,cost:1338000,unit:"Cái",desc:"",stock:0},
  {sku:"AL-289V",name:"INAX - Lavabo Treo Tường AL-289V",sale:1006000,list:2120000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"AL-289V/ L288VC",name:"INAX - Lavabo treo tường AL-289V/ L28189V6C",sale:0,list:2480000,cost:1842000,unit:"Cái",desc:"",stock:0},
  {sku:"AL-293V",name:"INAX - Lavabo AL-293V",sale:2930000,list:3860000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"AL-294V",name:"INAX - Lavabo AL-294V",sale:2715000,list:3760000,cost:2550000,unit:"Cái",desc:"",stock:0},
  {sku:"AL-295V",name:"INAX - Lavabo AL-295V",sale:1605000,list:2550000,cost:1506000,unit:"Cái",desc:"",stock:0},
  {sku:"AL-299V",name:"INAX - Lavabo AL-299V",sale:2295000,list:3970000,cost:2155000,unit:"Cái",desc:"",stock:0},
  {sku:"AL-312V",name:"INAX - Lavabo Treo Tường AL-312V",sale:1200000,list:2150000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"AL-312V/L-298VC",name:"INAX - Lavabo Treo Tường AL-312V/L-229188V0C",sale:0,list:3740000,cost:2046000,unit:"Cái",desc:"",stock:0},
  {sku:"AL-642V",name:"INAX - Lavabo AL-642V",sale:3640000,list:6170000,cost:3420000,unit:"Cái",desc:"",stock:0},
  {sku:"AL-652V",name:"INAX - Lavabo AL-652V",sale:3920000,list:6030000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"AU-431VR",name:"INAX - Bồn Tiểu AU-431VR",sale:3034000,list:3890000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"AU-468VAC",name:"INAX - Bồn Tiểu AU-468VAC",sale:5470000,list:6270000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"BFV-1113S-1C",name:"INAX - Vòi Sen Tắm Nóng Lạnh BFV-111138S9-510C",sale:0,list:2800000,cost:1780000,unit:"Bộ",desc:"",stock:0},
  {sku:"BFV-1113S-4C",name:"INAX - Vòi Sen Tắm Nóng Lạnh BFV-111137S3-540C",sale:0,list:2590000,cost:1630000,unit:"Bộ",desc:"",stock:0},
  {sku:"BFV-1113S-8C",name:"INAX - Vòi Sen Tắm Nóng Lạnh BFV-111139S4-080C",sale:0,list:2840000,cost:1820000,unit:"Bộ",desc:"",stock:0},
  {sku:"BFV-1115S-3C",name:"INAX - Bộ Sen Cây BFV-1115S-3C",sale:4440000,list:6970000,cost:3946000,unit:"Bộ",desc:"",stock:0},
  {sku:"BFV-113S",name:"INAX - Vòi Sen Tắm Nóng Lạnh BFV-1133S",sale:0,list:5360000,cost:0,unit:"Bộ",desc:"",stock:0},
  {sku:"BFV-1205S",name:"INAX - Bộ Sen Cây BFV-1205S",sale:0,list:6900000,cost:0,unit:"Bộ",desc:"",stock:0},
  {sku:"BFV-1403S-3C",name:"INAX - Vòi Sen Tắm Nóng Lạnh BFV-140233S5-130C",sale:0,list:3510000,cost:2170000,unit:"Bộ",desc:"",stock:0},
  {sku:"BFV-1403S-4C",name:"INAX - Vòi Sen Tắm Nóng Lạnh BFV-140139S7-540C",sale:0,list:2760000,cost:0,unit:"Bộ",desc:"",stock:0},
  {sku:"BFV-1403S-8C",name:"INAX - Vòi Sen Tắm Nóng Lạnh BFV-140232S8-080C",sale:0,list:3450000,cost:2135000,unit:"Bộ",desc:"",stock:0},
  {sku:"BFV-3413T",name:"INAX - Bộ Sen nhiệt độ BFV-3413T",sale:0,list:5140000,cost:0,unit:"Bộ",desc:"",stock:0},
  {sku:"BFV-3413T-3C",name:"INAX - Bộ Sen nhiệt độ BFV-3413T - 3C",sale:0,list:5750000,cost:3150000,unit:"Bộ",desc:"",stock:0},
  {sku:"BFV-3413T-4C",name:"INAX - Bộ Sen nhiệt độ Inax BFV-3413T3",sale:0,list:4960000,cost:2750000,unit:"Bộ",desc:"",stock:0},
  {sku:"BFV-3413T-7C",name:"INAX - Bộ Sen nhiệt độ Inax BFV-3413T3",sale:0,list:5310000,cost:3090000,unit:"Bộ",desc:"",stock:0},
  {sku:"BFV-3413T-8C",name:"INAX - Bộ Sen nhiệt độ Inax BFV-3413T3",sale:0,list:5400000,cost:3140000,unit:"Bộ",desc:"",stock:0},
  {sku:"BFV-3415T",name:"INAX - Sen Cây Nhiệt Độ BFV-3415T",sale:7033000,list:14170000,cost:7200000,unit:"Cái",desc:"",stock:0},
  {sku:"BFV-3415T-3C",name:"INAX - Sen Cây Nhiệt Độ BFV-3415T-3C",sale:0,list:15160000,cost:7890000,unit:"Cái",desc:"",stock:0},
  {sku:"BFV-3415T-7C",name:"INAX - Sen Cây Nhiệt Độ BFV-3415T-7C",sale:0,list:14040000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"BFV-3415T-8C",name:"INAX - Sen Cây Nhiệt Độ BFV-3415T-8C",sale:0,list:14170000,cost:7790000,unit:"Cái",desc:"",stock:0},
  {sku:"BFV-3415T-9C",name:"INAX - Sen Cây Nhiệt Độ BFV-3415T-9C",sale:0,list:14360000,cost:7381000,unit:"Cái",desc:"",stock:0},
  {sku:"BFV-515S",name:"INAX - Bộ Sen Cây BFV-515S",sale:12150000,list:19450000,cost:0,unit:"Bộ",desc:"",stock:0},
  {sku:"BFV-6003S",name:"INAX - Vòi Sen Tắm Nóng Lạnh BFV-600634S",sale:0,list:8200000,cost:0,unit:"Bộ",desc:"",stock:0},
  {sku:"BFV-6015S",name:"INAX - Bộ Sen Cây BFV-6015S",sale:9750000,list:16400000,cost:0,unit:"Bộ",desc:"",stock:0},
  {sku:"BFV-71S",name:"INAX - Bộ Sen Cây BFV-71S",sale:15260000,list:19490000,cost:0,unit:"Bộ",desc:"",stock:0},
  {sku:"C-108VA",name:"INAX - Bồn Cầu C-108VA",sale:2030000,list:2680000,cost:1940000,unit:"Bộ",desc:"",stock:0},
  {sku:"CF-22H CR",name:"INAX - Hộp Giấy Vệ Sinh CF-22H CR",sale:99000,list:110000,cost:0,unit:"Cái",desc:"Chất liệu: nhựa Kích thước: 169 x 128 x 112mm",stock:0},
  {sku:"CF-500VS",name:"INAX - Nắp Bồn Cầu CF-500VS",sale:660000,list:1000000,cost:0,unit:"Bộ",desc:"",stock:0},
  {sku:"CF-502VS/BW1",name:"INAX - Nắp bệt CF-502VS/BW1",sale:950000,list:1200000,cost:750000,unit:"Cái",desc:"Nắp CF-502VS sử dụng cho bồn cầu AC-989VN i Chất",stock:0},
  {sku:"CF-602VS",name:"INAX - Nắp Bồn Cầu CF-602VS",sale:1050000,list:2000000,cost:950000,unit:"Bộ",desc:"",stock:0},
  {sku:"AC-602VN",name:"INAX - Bồn Cầu AC-602VN",sale:3350000,list:4920000,cost:3250000,unit:"Bộ",desc:"",stock:0},
  {sku:"C-514VAN",name:"INAX - Bồn Cầu C-514VAN",sale:2590000,list:3680000,cost:0,unit:"Bộ",desc:"",stock:0},
  {sku:"AC-832VN",name:"INAX - Bồn Cầu AC-832VN",sale:5390000,list:8070000,cost:0,unit:"Bộ",desc:"",stock:0},
  {sku:"AC-700VAN",name:"INAX - Bồn Cầu AC-700VAN",sale:4200000,list:4430000,cost:0,unit:"Bộ",desc:"",stock:0},
  {sku:"C-306VAN",name:"INAX - Bồn Cầu C-306VAN",sale:2690000,list:3360000,cost:2550000,unit:"Bộ",desc:"",stock:0},
  {sku:"CFV-102A",name:"INAX - Vòi xịt CFV-102A",sale:310000,list:431000,cost:1,unit:"Cái",desc:"",stock:0},
  {sku:"CFV-102M",name:"INAX - Vòi xịt CFV-102M",sale:420000,list:540000,cost:395000,unit:"Cái",desc:"",stock:0},
  {sku:"CFV-105MP",name:"INAX - Vòi xịt CFV-105MP",sale:1000000,list:1120000,cost:949000,unit:"Cái",desc:"",stock:0},
  {sku:"CW-KB22AVN",name:"INAX - Nắp Điện Tử CW-KB22AVN",sale:12630000,list:18700000,cost:8500000,unit:"Cái",desc:"Tương thích hầu hết với các bồn cầu Inax chính",stock:0},
  {sku:"CW-S15VN",name:"INAX - Nắp Rửa Cơ CW-S15VN",sale:1580000,list:2420000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"CW-S32VN",name:"INAX - Nắp Rửa Cơ CW-S32VN",sale:2290000,list:3490000,cost:1,unit:"Cái",desc:"",stock:0},
  {sku:"FDV-12",name:"INAX - Phễu Thoát Sàn Vuông FDV-12",sale:310000,list:335000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"H442V",name:"INAX - Kệ Gương H442V CR",sale:250000,list:284000,cost:230000,unit:"Cái",desc:"",stock:0},
  {sku:"H-AC480V6",name:"INAX - Bộ Phụ Kiện Phòng Tắm Bằng Sứ1",sale:0,list:1390000,cost:1129000,unit:"Cái",desc:"",stock:0},
  {sku:"KFS-945VA",name:"INAX - Thanh treo khăn KFS-945VA",sale:3270000,list:4010000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"KFS-946V",name:"INAX - Móc giấy vệ sinh KFS-946V",sale:720000,list:880000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"L-281V",name:"INAX - Lavabo Góc L-281V",sale:623000,list:750000,cost:573000,unit:"Cái",desc:"",stock:0},
  {sku:"L-288VD",name:"INAX - Lavabo L-288VD",sale:700000,list:830000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"L-288V/L-288VD",name:"INAX - Lavabo Treo Tường L-288V/L-2808.V0D0",sale:0,list:1875000,cost:1460000,unit:"Cái",desc:"",stock:0},
  {sku:"L-289V",name:"INAX - Lavabo Treo Tường L-289V",sale:0,list:1150000,cost:1001000,unit:"Cái",desc:"",stock:0},
  {sku:"L-289V/L-288VC",name:"INAX - Lavabo Treo Tường L-289V/L-2808.V0C0",sale:0,list:1870000,cost:1704000,unit:"Cái",desc:"",stock:0},
  {sku:"L-312V",name:"INAX - Lavabo Treo Tường L-312V",sale:1100000,list:2390000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"LFV-1112S",name:"INAX - Vòi Lavabo LFV-1112S",sale:1235000,list:1840000,cost:1140000,unit:"Cái",desc:"",stock:0},
  {sku:"LFV-1402S",name:"INAX - Vòi Lavabo LFV-1402S",sale:0,list:1950000,cost:1210000,unit:"Cái",desc:"",stock:0},
  {sku:"LFV-1402SH",name:"INAX - Vòi Lavabo LFV-1402SH",sale:1765000,list:2720000,cost:1655000,unit:"Cái",desc:"",stock:0},
  {sku:"LFV-1402S-R",name:"INAX - Vòi Lavabo LFV-1402S-R",sale:1382000,list:2110000,cost:1270000,unit:"Cái",desc:"",stock:0},
  {sku:"LFV-22S",name:"INAX - Vòi Lavabo Lạnh LFV-22S",sale:995000,list:1420000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"LFV-22SH",name:"INAX - Vòi Chậu Rửa Lạnh Thân Cao LFV1-42720S0H",sale:0,list:2100000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"LFV-612S",name:"INAX - Vòi Lavabo LFV-612S",sale:2055000,list:3210000,cost:1930000,unit:"Cái",desc:"",stock:0},
  {sku:"LFV-632S",name:"INAX - Vòi Lavabo LFV-632S",sale:2405000,list:3680000,cost:2146000,unit:"Cái",desc:"",stock:0},
  {sku:"LFV-652S",name:"INAX - Vòi Lavabo LFV-652S",sale:3745000,list:5460000,cost:3520000,unit:"Cái",desc:"",stock:0},
  {sku:"LFV-652SH",name:"INAX - Vòi Lavabo LFV-652SH",sale:5205000,list:7580000,cost:4650000,unit:"Cái",desc:"",stock:0},
  {sku:"OKUV-30SM",name:"INAX - Van Xả Tiểu Cảm Ứng OKUV-30S4M",sale:0,list:5620000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"U-411V",name:"INAX - Bồn Tiểu U-411V",sale:4680000,list:5140000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"UF-3VS",name:"INAX - Van Xả Nhấn Bồn Tiểu UF-3VS",sale:2580000,list:2960000,cost:0,unit:"Cái",desc:"Ống thẳng kiểu xả nhấn Tiết kiệm được",stock:0},
  {sku:"0509-WT",name:"AS - Chậu Rửa Đặt Bàn Acacia E 0509-W0T.00",sale:0,list:3300000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"120I",name:"BANCOOT - Ga Thoát Sàn Inox 304 1203I",sale:0,list:550000,cost:220000,unit:"Cái",desc:"",stock:0},
  {sku:"120M",name:"BANCOOT - Ga Thoát Sàn 120M",sale:350000,list:550000,cost:180000,unit:"Cái",desc:"",stock:0},
  {sku:"120N",name:"BANCOOT - Ga Thoát Sàn 120N",sale:680000,list:1000000,cost:250000,unit:"Cái",desc:"",stock:0},
  {sku:"23327000",name:"GROHE - Vòi Chậu Nóng Lạnh Size M 2303.0207000",sale:0,list:6300000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"34706000",name:"GROHE - Sen Tắm Thông Minh Âm Tườ0n.g0",sale:0,list:85260000,cost:0,unit:"Bộ",desc:"",stock:0},
  {sku:"39234000",name:"GROHE - Lavabo 39234000",sale:0,list:8500000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"435A",name:"GELER - Móc Áo 5 móc 435A",sale:595000,list:850000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"5S",name:"STIEBEL - Máy Lọc Nước Uống Eltron St0re.0a0m",sale:0,list:6790000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"600-39",name:"GELER - Lô giấy vệ sinh 600-39",sale:581000,list:830000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"6315",name:"GELER - Giàn sấy khăn tắm điện 6315",sale:4830000,list:6900000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"70CN78B",name:"EUROSUN - Máy hút mùi EH - 70CN78B",sale:0,list:9890000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"90CN78B",name:"EUROSUN - Máy hút mùi EH-90CN78B",sale:7273500,list:11190000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"9903",name:"GELER - Thanh vắt khăn 9903",sale:791000,list:1130000,cost:658386,unit:"Cái",desc:"",stock:0},
  {sku:"ACB-2",name:"STIEBEL - Bộ Lọc Nước Thô Stiebel Eltto0n.0",sale:0,list:4590300,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"ALIN FB0001",name:"Vòi bồn tắm ALIN FB0001",sale:6650000,list:9500000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"Alto Chrome",name:"KONOX - Vòi rửa bát dây rút Alto Chrom0.e00",sale:0,list:3650000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"AM105S",name:"MUNCHEN - Máy Hút Mùi AM105S",sale:6200000,list:8900000,cost:4916665,unit:"Cái",desc:"",stock:0},
  {sku:"BB - 300215",name:"BELLO - Lavabo Bán Âm BB - 300215",sale:2030000,list:2900000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"BB-800312",name:"BELLO - Lavabo BB - 800312",sale:1064000,list:1520000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"BCS 2111",name:"BANCOOT - Sen tắm Nóng Lạnh BCS",sale:0,list:1675000,cost:670000,unit:"Bộ",desc:"",stock:0},
  {sku:"BCV20-1",name:"BANCOOT - Vòi Rửa Lavabo BCV20-1",sale:1015000,list:1450000,cost:580000,unit:"Cái",desc:"",stock:0},
  {sku:"BCV 2111",name:"BANCOOT - Vòi Lavabo BCV 2111",sale:840000,list:1200000,cost:520000,unit:"Cái",desc:"",stock:0},
  {sku:"BCV8010",name:"BANCOOT - Vòi Rửa Bát BCV8010",sale:1750000,list:2500000,cost:700000,unit:"Cái",desc:"",stock:0},
  {sku:"BE8800",name:"BEUER - Bộ Phụ Kiện BE8800",sale:0,list:1870000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"BEL554MS0B",name:"BOSCH - Lò vi sóng Bosch BEL554MS0B",sale:0,list:19990000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"BEL653MB3",name:"BOSCH - Lò Vi Sóng Âm Tủ BEL653MB",sale:0,list:10600000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"BFL520MS0",name:"BOSCH - Lò vi sóng BFL520MS0",sale:0,list:16813000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"BFL523MS0",name:"BOSCH - Lò vi sóng BFL523MS0",sale:0,list:16813000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"BFL523MS0B",name:"BOSCH - Lò Vi Sóng Âm Tủ BFL523MS0B",sale:0,list:14200000,cost:8600000,unit:"Cái",desc:"",stock:0},
  {sku:"BFL634GB1",name:"BOSCH - Lò vi sóng Bosch BFL634GB1 S0e.r0i",sale:8,list:29790000,cost:16900000,unit:"Cái",desc:"",stock:0},
  {sku:"BL - 700810S",name:"BELLO - Vòi Lavabo BL - 700810S",sale:1309000,list:1870000,cost:841500,unit:"Cái",desc:"",stock:0},
  {sku:"BL-C430V",name:"BELLO - Chậu rửa bát BL-C430V",sale:3920000,list:5600000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"BL-GLH 50",name:"BELLO - Gương LED chữ nhật BL-GLH",sale:0,list:1650000,cost:680000,unit:"Cái",desc:"",stock:0},
  {sku:"BL-GLH 60",name:"BELLO - Gương LED chữ nhật BL-GLH",sale:0,list:1650000,cost:720000,unit:"Cái",desc:"",stock:0},
  {sku:"BL-GLH D60",name:"BELLO - Gương LED tròn BL-GLH D60",sale:1250000,list:1650000,cost:630000,unit:"Cái",desc:"",stock:0},
  {sku:"BL-GTD 50",name:"BELLO - Gương tròn BL-GTD 50",sale:750000,list:1150000,cost:205000,unit:"Cái",desc:"",stock:0},
  {sku:"BL - SNC",name:"BELLO - Bộ vòi xịt vệ sinh BL SNC",sale:350000,list:500000,cost:213500,unit:"Cái",desc:"",stock:0},
  {sku:"BL - SNT",name:"BELLO - Bộ vòi xịt vệ sinh BL SNT",sale:350000,list:450000,cost:185000,unit:"Cái",desc:"",stock:0},
  {sku:"BL - SNV",name:"BELLO - Bộ vòi xịt vệ sinh BL SNV",sale:350000,list:450000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"BLUES NB177",name:"NOBILIS - Vòi rửa bát BLUES NB177",sale:5057500,list:5950000,cost:3867500,unit:"Cái",desc:"",stock:0},
  {sku:"BL-VB220",name:"BELLO - Vòi rửa bát BL-VB220",sale:1358000,list:1940000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"BOTUCHAU",name:"HAUZSTIL - Thùng tủ lavabo 2 cánh mở0",sale:0,list:10000000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"BT-20034E",name:"BELLO - Bồn Cầu BT-20034E",sale:36400000,list:52000000,cost:26000000,unit:"Bộ",desc:"",stock:0},
  {sku:"BT - 400209",name:"BELLO - Bồn Cầu BT - 400209",sale:3080000,list:4400000,cost:0,unit:"Bộ",desc:"",stock:0},
  {sku:"BTL - 700705",name:"BELLO - Bộ sen cây BTL– 700705",sale:3500000,list:5000000,cost:2250000,unit:"Bộ",desc:"",stock:0},
  {sku:"BTMS 170",name:"BỒN TẮM MASSAGE 170",sale:25130000,list:35900000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"C971#XW TCF9433AT#ONTWO1",name:"- Bàn cầu điện tử C971#XW TCF904.3030A#NW1",sale:0,list:67329000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"CE502",name:"BANCOOT - Thanh vắt khăn CE502",sale:950000,list:2000000,cost:500000,unit:"Cái",desc:"",stock:0},
  {sku:"Combo Finish",name:"Combo Muối, Viên rửa, Dầu bóng Finish",sale:0,list:1500000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"Combo Finish 30V",name:"Combo Muối, Viên rửa, Dầu bóng Finish3",sale:0,list:900000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"Combo Sen Âm 01",name:"TOTO - Vòi sen âm tường 3 đường nướ0c.",sale:0,list:0,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"Comfor Chrome",name:"KONOX - Vòi rửa bát dây rút Comfor Ch0r.o0m0e",sale:0,list:4930000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"CPMH",name:"Chi phí mua hàng",sale:0,list:0,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"CS320DRT3",name:"TOTO - Bồn Cầu CS320DRT3",sale:0,list:4291000,cost:0,unit:"Bộ",desc:"",stock:0},
  {sku:"CS921VT/TCF83410GTOAATO/T",name:"-5 B3Pồ1n0 C0ầVuR CS921VT/TCF83410GA0A./0T053P100VR",sale:0,list:98513000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"CS921VT/TCF85510GTOAATO/T",name:"-5 B3Pồ1n0 C0ầVuR CS921VT/TCF85510GA0A./0T053P100VR",sale:0,list:128753000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"CS948DW18",name:"TOTO - Bồn Cầu CS948DW18",sale:0,list:16396000,cost:0,unit:"Bộ",desc:"",stock:0},
  {sku:"CS986CGW12#XW",name:"TOTO - Bàn cầu một khối CS986CGW120#.X0W0",sale:0,list:42081000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"CS988VT/TCF9575Z/TTO5T3OP1",name:"-0 B0ồn Cầu CS988VT/TCF9575Z/T503.0P0100",sale:0,list:89808000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"CW812REA#W/TCF4T9O1T1OEZ",name:"- Bàn cầu treo tường kèm nắp rử0a.",sale:0,list:77144000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"CW823JW",name:"TOTO - Bồn Cầu CW823JW/FV2#W/TC309.030VS#W",sale:0,list:22346000,cost:0,unit:"Bộ",desc:"",stock:0},
  {sku:"CXW-199DW",name:"KOCHER - Máy hút mùi âm bàn Tesla CX0W.00-199DW",sale:0,list:35500000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"CZ-7038GB",name:"CANZY - Máy Hút Mùi Độc Lập CZ-70380G.B00",sale:0,list:18750000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"DDC 8 EC",name:"STIEBEL - Máy Nước Nóng Đa Điểm Stie0b.0e0l",sale:0,list:7290800,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"DFS067K51",name:"BOSCH - Máy hút mùi âm tủ DFS067K",sale:0,list:30290000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"DFS097K51",name:"BOSCH - Máy hút mùi âm tủ DFS097K511",sale:0,list:43700000,cost:17200000,unit:"Cái",desc:"",stock:0},
  {sku:"DFT63AC50 series 4BOSCH",name:"- Máy hút mùi âm tủ DFT63AC",sale:0,list:10500000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"DFT63CA61B",name:"BOSCH - Máy hút mùi âm tủ DFT63CA6515B0",sale:0,list:7800000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"DFT93AC50",name:"BOSCH - Máy Hút Mùi Âm Tủ DFT93AC",sale:0,list:10990000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"DGH104ZR",name:"TOTO - Bát sen cầm tay DGH104ZR",sale:0,list:962000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"DGH108ZR",name:"TOTO - Bát sen tay DGH108ZR",sale:0,list:1649000,cost:0,unit:"Cái",desc:"Model: DHL755BL Thương hiệu: Bosch",stock:0},
  {sku:"DHL755BL",name:"BOSCH - Máy hút mùi âm tủ DHL755BL",sale:0,list:16890000,cost:9500000,unit:"Cái",desc:"",stock:0},
  {sku:"DH YOSHIMOTO",name:"YOSHIMOTO - Chậu Rửa Mặt Liền Khối",sale:0,list:22500000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"DM907C1S",name:"TOTO - Sen cây DM907C1S",sale:0,list:6990000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"DM907CS",name:"TOTO - Sen cây DM907CS",sale:0,list:6990000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"ĐQ D50",name:"Gương Đình Quốc Hình Tròn D50",sale:0,list:550000,cost:0,unit:"Cái",desc:"Kích thước: 50x70cm",stock:0},
  {sku:"ĐQ 1188",name:"ĐQ - Gương Trơn 1188",sale:850000,list:1500000,cost:378000,unit:"Cái",desc:"",stock:0},
  {sku:"ĐQCN 60x80",name:"Gương Đình Quốc hình chữ nhật 60x",sale:0,list:1050000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"DS708PS#W",name:"TOTO - Hộp Đựng Giấy Vệ Sinh DS708P0S.#0W0",sale:0,list:599000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"DUE126UPE",name:"TOTO - Van cảm ứng tiểu nam âm tườn0g.0",sale:0,list:9690000,cost:1,unit:"Cái",desc:"",stock:0},
  {sku:"DUOI XP INOX UONĐuôi",name:"xi phong inox SUS 304 uốn",sale:180000,list:375000,cost:95000,unit:"Cái",desc:"",stock:0},
  {sku:"DUOI XP NHUA",name:"Đuôi xi phông sun nhựa",sale:180000,list:205000,cost:55000,unit:"Cái",desc:"",stock:0},
  {sku:"DWB77CM50",name:"BOSCH - Máy hút mùi chữ T DWB77CM",sale:0,list:19990000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"DWB97BK61T",name:"BOSCH - Máy hút mùi chữ T DWB97BK6816T",sale:0,list:20990000,cost:7200000,unit:"Cái",desc:"",stock:0},
  {sku:"DWB97DM50B",name:"BOSCH - Máy hút mùi chữ T DWB97DM05.000B",sale:0,list:24890000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"DWB98JQ50B",name:"BOSCH - Máy hút mùi chữ T DWB98JQ5107B",sale:0,list:28600000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"DWK67FN60",name:"BOSCH - Máy hút mùi kính vát DWK67F1N",sale:0,list:35000000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"DWK81AN60",name:"BOSCH - Máy hút mùi kính vát DWK81A2N",sale:0,list:35900000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"DWK91LT60",name:"BOSCH - Máy hút mùi kính vát DWK91L2T",sale:0,list:40000000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"DWK97JQ60B",name:"BOSCH - Máy hút mùi DWK97JQ60B",sale:0,list:39600000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"EH-70AF76",name:"EUROSUN - Máy hút mùi EH-70AF76",sale:6298500,list:9690000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"EH-70AF85B",name:"EUROSUN - MÁY HÚT MÙI EH-70AF85B",sale:0,list:4580000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"EH-70CN78W",name:"EUROSUN - Máy hút mùi EH-70CN78W",sale:0,list:11680000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"EH-90AF76",name:"EUROSUN - Máy hút mùi EH-90AF76",sale:6493500,list:9990000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"EH-90K06",name:"EUROSUN - Máy hút mùi EH-90K06",sale:3237000,list:4980000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"EIP7-P",name:"BANCOOT - Lô Giấy Vệ Sinh Có Khay EIP570-0P",sale:0,list:713000,cost:135000,unit:"Cái",desc:"",stock:0},
  {sku:"ESH 30 H Plus",name:"STIEBEL - Máy Nước Nóng Gián Tiếp Sti0e.b0e0l",sale:0,list:5990600,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"EU301",name:"CLEANSUI - Mitsubishi EU301",sale:38880000,list:48600000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"EU-T256 Pro",name:"EUROSUN - Bếp Từ EU-T256 Pro",sale:8632000,list:13280000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"F1200",name:"FUKUSHIN - Giá bát nâng hạ sấy khô tự0",sale:0,list:69500000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"F900",name:"FUKUSHIN - Giá bát nâng hạ sấy khô tự0",sale:0,list:59500000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"FCM-DK FS",name:"SHIGERU - Chậu rửa chén cao cấp một",sale:0,list:12000000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"FFAS6868",name:"AS - Vòi xịt FFAS6868",sale:0,list:590000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"FFAS8686",name:"AS - Vòi Xịt Toile FFAS8686",sale:465000,list:570000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"FN 90V",name:"FINISH - Viên rửa bát hương chanh 90 v4i8ê5n0",sale:0,list:650000,cost:275000,unit:"Cái",desc:"",stock:0},
  {sku:"FI 30V",name:"FINISH - Viên rửa bát Finish Ultimate AI0O.0",sale:0,list:700000,cost:143000,unit:"Cái",desc:"",stock:0},
  {sku:"FI BONG 400ML",name:"FINISH - NƯỚC LÀM BÓNG FINISH 400M0.L00",sale:0,list:250000,cost:85000,unit:"Cái",desc:"",stock:0},
  {sku:"FI BONG 800ML",name:"FINISH - NƯỚC LÀM BÓNG FINISH 800M22L",sale:0,list:300000,cost:85000,unit:"Cái",desc:"",stock:0},
  {sku:"FI MUOI 1",name:"FINISH - Muối Rửa Bát Finish 1kg",sale:0,list:170000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"FI MUOI 1.2",name:"FINISH - Muối Rửa Bát Finish 1.2kg",sale:130000,list:200000,cost:65000,unit:"Cái",desc:"",stock:0},
  {sku:"FLAG NB205",name:"NOBILIS - Vòi rửa bát dây rút nóng lạnh5",sale:0,list:6540000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"FV-30BG3",name:"Panasonic - Quạt hút sưởi FV-30BG3",sale:0,list:10920000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"Ga Thoát 304 12x12Ga",name:"Thoát 304 12x12",sale:630000,list:860000,cost:480000,unit:"Cái",desc:"",stock:0},
  {sku:"GIN81ACE0",name:"BOSCH - Tủ Đông Âm Tủ GIN81ACE0 Se0ri.e0",sale:6,list:78300000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"MTA",name:"Móc áo inox 304",sale:370000,list:570000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"GM2266SA",name:"MUNCHEN - Bếp Từ GM2266SA",sale:12500000,list:19900000,cost:12040000,unit:"Cái",desc:"",stock:0},
  {sku:"HAP004A",name:"TOTO - Van Khóa HAP004A",sale:0,list:410000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"HBA5360B0",name:"BOSCH - Lò Nướng HBA5360B0 Series",sale:0,list:28900000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"HBA5360B0K",name:"BOSCH - Lò Nướng HBA5360B0K Series0",sale:6,list:25990000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"HBA5570S0B",name:"BOSCH - Lò Nướng Âm Tủ HBA5570S0B",sale:0,list:25100000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"HBF113BR0A",name:"BOSCH - Lò Nướng Bosch HBF113BR0A9",sale:0,list:17990000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"HBF133BS0A",name:"BOSCH - Lò nướng HBF133BS0A Series",sale:120500000,list:19800000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"HBG536EB3",name:"BOSCH - Nướng Âm Tủ HBG536EB3",sale:13900000,list:25990000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"HBG633BS1A",name:"BOSCH - Lò Nướng Âm Tủ Bosch HBG63232B9S010A0",sale:0,list:36490000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"HBG635BB1",name:"BOSCH - Lò nướng HBG635BB1 serie",sale:0,list:39500000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"HBG675BB1",name:"BOSCH - Lò Nướng Âm Tủ Bosch HBG6705.0B0B1",sale:0,list:36900000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"HBS534BB0B",name:"BOSCH - Lò Nướng Âm Tủ HBS534BB0B",sale:0,list:17900000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"HBS534BS0B",name:"BOSCH - Lò nướng âm tủ HBS534BS0B",sale:0,list:16990000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"HS810",name:"YOSHI - Chậu Rửa Đá Cẩm Thạch Nhân",sale:0,list:15500000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"HTHX58",name:"TOTO - Van T Cầu HTHX58 Chia 2 Đườn0g.",sale:0,list:370000,cost:295630,unit:"Cái",desc:"",stock:0},
  {sku:"K-750B",name:"MALLOCA - Máy hút khói khử mùi âm t1ủ4",sale:0,list:22000000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"KAD93ABEP",name:"BOSCH - Tủ Lạnh Side By Side BOSCH KA54D99030A0B0E0P.",sale:0,list:115550000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"KB5504B",name:"Vòi Lavabo KB5504B",sale:0,list:1250000,cost:400000,unit:"Cái",desc:"Kệ kính",stock:0},
  {sku:"KEKINH",name:"Kệ Kính Phòng Tắm",sale:325000,list:700000,cost:180000,unit:"Cái",desc:"",stock:0},
  {sku:"KFD96APEA",name:"BOSCH - Tủ Lạnh 4 Cánh KFD96APEA Se0r.i0e0",sale:6,list:122000000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"KFN96APEAG",name:"BOSCH - Tủ lạnh Bosch 4 cánh KFN96AP0E.0A0G",sale:0,list:97097000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"KIN86ADD0",name:"BOSCH - Tủ Lạnh 2 Cánh Lắp Âm KIN86A0.D0D00",sale:0,list:79100000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"KIR81ADD0",name:"BOSCH - Tủ Mát Âm Tủ KIR81ADD0 Ser0ie.0",sale:60,list:65000000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"KM5021T",name:"KVK - Vòi Rửa Bát KM5021T",sale:0,list:12000000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"KM6101EC",name:"KVK - Vòi rửa bát cao cấp KVK KM6101E0C.00",sale:0,list:15170000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"KM6101ECM4",name:"KVK - Vòi Rửa Bát KM6101ECM4",sale:0,list:26700000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"KN5444SU Dekor",name:"KONOX - Chậu rửa bát KN5444SU Deko0r.00",sale:0,list:4990000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"KN7044SU Dekor",name:"KONOX - Chậu rửa bát chống xước KN700.4040SU",sale:0,list:6520000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"KN7644SU Dekor",name:"KONOX - Chậu rửa bát chống xước KN706.4040SU",sale:0,list:9520000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"KQ VOI XA BON",name:"Vòi nóng lạnh gắn tường",sale:0,list:1500000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"KUW20VHF0",name:"BOSCH - Tủ rượu KUW20VHF0",sale:26000000,list:41600000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"L1704#XW",name:"TOTO - Lavabo L1704#XW",sale:0,list:7049000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"L501C#XW",name:"TOTO - Chậu đặt dương vành L501C#XW",sale:0,list:1178000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"L762#XW",name:"TOTO - Chậu đặt dương vành L762#XW",sale:0,list:1718000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"L763#XW",name:"TOTO - Chậu đặt dương vành L763#XW",sale:0,list:1669000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"L909C#XW",name:"TOTO - Chậu đặt dương vành L909C#XW",sale:0,list:3093000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"LFV-17",name:"INAX - Vòi Nước Lạnh Lavabo LFV-17",sale:787000,list:810000,cost:740000,unit:"Cái",desc:"",stock:0},
  {sku:"LG-552P",name:"BANCOOT - Lô Giấy LG-552P",sale:220000,list:313000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"LHT328C#XW",name:"TOTO - Lavabo LHT328C#XW",sale:0,list:3240000,cost:1,unit:"Cái",desc:"",stock:0},
  {sku:"LIKEN NL725D",name:"NOBINOX - Chậu rửa bát 1 hố LIKEN NL5712855D",sale:0,list:6100000,cost:3956000,unit:"Cái",desc:"",stock:0},
  {sku:"LIRA NJ562D",name:"NOBINOX - Chậu rửa bát 1 hố LIRA NJ566254D",sale:0,list:7700000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"LK501S",name:"BANCOOT - Thanh vắt khăn LK501S",sale:1366400,list:1952000,cost:801000,unit:"Cái",desc:"",stock:0},
  {sku:"LK 51031-P",name:"BANCOOT - Giá đựng xà phòng LK 5103316-7P",sale:0,list:525000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"LOFT NX533",name:"NOBINOX - Vòi rửa bát LOFT NX533",sale:2040000,list:2400000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"LT1706#XW",name:"TOTO - Lavabo LT1706#XW",sale:0,list:5911000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"LT1735#XW",name:"TOTO - Lavabo LT1735#XW",sale:0,list:5410000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"LT240CS#W",name:"TOTO - Chậu treo tường LT240CS#W",sale:0,list:1424000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"LT300C#W",name:"TOTO - Chậu treo tường LT300C#W",sale:0,list:893000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"LT328C#XW",name:"TOTO - Chậu treo tường LT328C#XW",sale:0,list:2160000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"LT367CR#XW",name:"TOTO - Chậu đặt trên bàn LT367CR#XW",sale:0,list:3407000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"LT505T#XW",name:"TOTO - Chậu đặt âm bàn LT505T#XW",sale:0,list:3201000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"LT523S#XW",name:"TOTO - Chậu đặt trên bàn LT523S#XW",sale:0,list:2455000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"LT533R#XW",name:"TOTO - Chậu bán âm bàn LT533R#XW",sale:0,list:2288000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"LT533S#XW",name:"TOTO - Chậu bán âm bàn LT533S#XW",sale:0,list:2288000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"LT546#XW",name:"TOTO - Chậu đặt âm bàn LT546#XW",sale:0,list:2239000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"LT5615C",name:"TOTO - Chậu đặt trên bàn LT5615C#XW",sale:0,list:4507000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"LT5616C",name:"TOTO - Chậu đặt trên bàn LT5616C#XW",sale:0,list:4870000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"LT5715",name:"TOTO - Chậu đặt trên bàn LT5715#XW",sale:0,list:4143000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"LT5716",name:"TOTO - Chậu đặt trên bàn LT5716#XW",sale:0,list:4457000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"LT647CS#XW",name:"TOTO - Chậu bán âm bàn LT647CS#XW",sale:0,list:4300000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"LT700CTR",name:"TOTO - Chậu đặt trên bàn LT700CTR#XW",sale:0,list:2906000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"LT710CSR",name:"TOTO - Chậu đặt trên bàn LT710CSR#XW",sale:0,list:2906000,cost:1,unit:"Cái",desc:"",stock:0},
  {sku:"LT710CTR",name:"TOTO - Chậu đặt trên bàn LT710CTR#W",sale:0,list:2955000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"LT764",name:"TOTO - Chậu đặt bàn LT764#XW",sale:0,list:2798000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"LT765",name:"TOTO - Chậu đặt âm bàn LT765#XW",sale:0,list:2798000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"LT950C",name:"TOTO - Chậu đặt trên bàn LT950C#XW",sale:0,list:3623000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"LT951CXW",name:"TOTO - Chậu đặt bàn LT951CXW",sale:0,list:3809000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"LT952",name:"TOTO - Chậu đặt trên bàn LT952#XW",sale:0,list:3633000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"LUMIA NJ510B",name:"NOBINOX - Chậu rửa bát 1 hố LUMIA N9J561900B",sale:0,list:11400000,cost:382000,unit:"Cái",desc:"",stock:0},
  {sku:"LUX-AOU800HOT",name:"AO SMITH - Máy Lọc Nước LUX-AOU80107H8O2T",sale:0,list:19800000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"LW1505V",name:"TOTO - Chậu Rửa Âm Bàn LW1505V",sale:0,list:2582000,cost:1,unit:"Cái",desc:"",stock:0},
  {sku:"LW1506V",name:"TOTO - Chậu Rửa Âm Bàn LW1506V",sale:0,list:3161000,cost:1,unit:"Cái",desc:"",stock:0},
  {sku:"LW1535V",name:"TOTO - Chậu Rửa Âm Bàn LW1535V",sale:0,list:3407000,cost:1,unit:"Cái",desc:"",stock:0},
  {sku:"LW1536V#XW",name:"TOTO - Lavabo LW1536V#XW",sale:0,list:3976000,cost:1,unit:"Cái",desc:"",stock:0},
  {sku:"LW526NJU#W",name:"TOTO - Chậu đặt trên bàn LW526NJU#W",sale:0,list:3348000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"MANIA NB214",name:"NOBILIS - Vòi Rửa Bát MANIA NB214",sale:5312500,list:6250000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"MANIA NB215T",name:"NOBILIS - Vòi dây rút nóng lạnh MANIA7",sale:0,list:8950000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"MANIA NB305C",name:"NOBILIS - Vòi dây rút nóng lạnh MANIA9",sale:0,list:10900000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"MB175MSS",name:"TOTO - Mặt nạ xả nhấn MB175MSS",sale:0,list:3140000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"MC1603",name:"EUROSUN - Bộ Nồi Inox MC1603 TITAN1IU3M",sale:0,list:2000000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"MC1702-HARMONYEUROSUN",name:"- BỘ NỒI INOX MC1702-HAR2M2O75N0Y",sale:0,list:3500000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"MC 9086HS",name:"MALLOCA - Máy hút mùi kính vát MC 99018368H8S",sale:0,list:13640000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"MH-03IR N",name:"MALLOCA - Bếp 2 từ và 1 điện MH-03IR1",sale:0,list:28160000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"MH 700GT",name:"MALLOCA - Máy hút khói khử mùi âm t6ủ3",sale:0,list:9130000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"MH-732 RN",name:"MALLOCA - Bếp Kính Âm 2 Điện MH-73722",sale:0,list:10890000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"MOVE NB133S",name:"NOBILIS - Vòi nóng lạnh cần mềm 2 đầu1",sale:0,list:13800000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"MS188VKW11#XW TT5O3TPO1",name:"0- 0BVàRn cầu một khối MS188VKW110#.0X0W",sale:0,list:47864000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"MS625CDW12#XW",name:"TOTO - Bàn cầu một khối MS625CDW102.#0X0W",sale:0,list:50996000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"MS625DT2#XW",name:"TOTO - Bàn cầu một khối MS625DT2#X0W.00",sale:0,list:19833000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"MS625DT8#XW",name:"TOTO - Bồn cầu MS625DT8#XW",sale:0,list:20432000,cost:0,unit:"Bộ",desc:"",stock:0},
  {sku:"MS625DW11#XW",name:"TOTO - Bàn cầu một khối MS625DW11#0X.0W0",sale:0,list:49297000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"MS625DW14#XW",name:"TOTO - Bồn Cầu MS625DW14#XW",sale:0,list:38507000,cost:0,unit:"Bộ",desc:"",stock:0},
  {sku:"MS625DW23#XW",name:"TOTO - Bàn cầu một khối MS625DW23#0X.0W0",sale:0,list:50220000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"MS636CDRW12#XWTOTO",name:"- Bàn cầu một khối MS636CDRW01.20#0XW",sale:0,list:55649000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"MS636DT2#XW",name:"TOTO - Bàn cầu một khối MS636DT2#X0W.00",sale:0,list:25007000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"MS636DT8#XW",name:"TOTO - Bàn cầu một khối MS636DT8#X0W.00",sale:0,list:25007000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"MS823CDRW12#XWTOTO",name:"- Bàn cầu một khối MS823CDRW01.20#0XW",sale:0,list:53254000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"MS823DRT2#XW",name:"TOTO - Bàn cầu một khối MS823DRT2#0X.W00",sale:0,list:22346000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"MS823DRT8#XW",name:"TOTO - Bàn cầu một khối MS823DRT8#0X.W00",sale:0,list:22346000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"MS823DRW11#XW",name:"TOTO - Bàn cầu một khối MS823DRW101.#0X0W",sale:0,list:51477000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"MS855DT8#XW",name:"TOTO - Bàn cầu một khối MS855DT8#X0W.00",sale:0,list:8846000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"MS855DW11#XW",name:"TOTO - Bàn cầu một khối MS855DW11#0X.0W0",sale:0,list:39734000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"MS856DT8#XW",name:"TOTO - Bàn cầu một khối MS855DT2#X0W.00",sale:0,list:8846000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"MS857DE4#XW",name:"TOTO - Bồn Cầu MS857DE4#XW",sale:0,list:14344000,cost:0,unit:"Bộ",desc:"",stock:0},
  {sku:"MS857DT10#XW",name:"TOTO - Bồn Cầu MS857DT10#XW",sale:0,list:8500000,cost:5239400,unit:"Bộ",desc:"",stock:0},
  {sku:"MS857DW16",name:"TOTO - Bồn Cầu MS857DW16",sale:0,list:21649000,cost:0,unit:"Bộ",desc:"",stock:0},
  {sku:"MS857DW18",name:"TOTO - Bồn Cầu MS857DW18/TCF237100.A00AA",sale:0,list:16946000,cost:0,unit:"Bộ",desc:"",stock:0},
  {sku:"MS885CDW12",name:"TOTO - Bàn cầu một khối MS885CDW102.#0X0W",sale:0,list:43701000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"MS885DE2#XW",name:"TOTO - Bồn cầu MS885DE2#XW",sale:0,list:14590000,cost:8273814,unit:"Bộ",desc:"",stock:0},
  {sku:"MS885DE4#XW",name:"TOTO - Bồn Cầu MS885DE4#XW",sale:0,list:16632000,cost:0,unit:"Bộ",desc:"",stock:0},
  {sku:"MS885DT2",name:"TOTO - Bàn cầu một khối MS885DT2#X0W.00",sale:0,list:11733000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"MS885DT8",name:"TOTO - Bồn cầu MS885DT8#XW",sale:0,list:11733000,cost:7978000,unit:"Bộ",desc:"",stock:0},
  {sku:"MS885DW11",name:"TOTO - Bàn cầu một khối MS885DW11#0X.0W0",sale:0,list:42248000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"MS885DW14",name:"TOTO - Bồn Cầu MS885DW14",sale:0,list:30358000,cost:1,unit:"Bộ",desc:"",stock:0},
  {sku:"MS885DW16",name:"TOTO - Bàn cầu một khối MS885DW16#0X.0W0",sale:0,list:23524000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"MS885DW18",name:"TOTO - Bàn cầu một khối MS885DW18#0X.0W0",sale:0,list:19253000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"MS887CRW12#XW",name:"TOTO - Bàn cầu một khối MS887CRW120#.0X0W",sale:0,list:45763000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"MS887CRW17#XW",name:"TOTO - Bồn Cầu MS887CRW17/TCF23406.00A0AA",sale:0,list:26391000,cost:0,unit:"Bộ",desc:"",stock:0},
  {sku:"MS887RT2#XW",name:"TOTO - Bàn cầu một khối MS887RT2#X0W.00",sale:0,list:14020000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"MS887RT8#XW",name:"TOTO - Bàn cầu một khối MS887RT8#X0W.00",sale:0,list:14020000,cost:1,unit:"Cái",desc:"",stock:0},
  {sku:"MS887RW11#XW",name:"TOTO - Bàn cầu một khối MS887RW11#0X.0W0",sale:0,list:44241000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"MS887RW16#XW",name:"TOTO - Bồn Cầu MS887RW16#XW",sale:0,list:25517000,cost:0,unit:"Bộ",desc:"",stock:0},
  {sku:"MS889CDRW12#XWTOTO",name:"- Bàn cầu một khối MS889CDRW01.20#0XW",sale:0,list:45763000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"MS889CDRW17",name:"TOTO - Bàn cầu một khối MS889CDRW01.700",sale:0,list:26391000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"MS889CDRW23",name:"TOTO - Bồn Cầu MS889CDRW23",sale:0,list:45164000,cost:0,unit:"Bộ",desc:"",stock:0},
  {sku:"MS889DRT2#XW",name:"TOTO - Bàn cầu một khối MS889DRT2#0X.W00",sale:0,list:14020000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"MS889DRT8#XW",name:"TOTO - Bàn cầu một khối MS889DRT8#0X.W00",sale:0,list:14020000,cost:1,unit:"Cái",desc:"",stock:0},
  {sku:"MS889DRW11#XW",name:"TOTO - Bàn cầu một khối MS889DRW101.#0X0W",sale:0,list:44241000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"MS889DRW16#XW",name:"TOTO - Bồn Cầu MS889DRW16#XW",sale:0,list:25517000,cost:0,unit:"Bộ",desc:"",stock:0},
  {sku:"MSO-A75TFT",name:"MALLOCA - Lò nướng đa năng MSO-A7252T1FT",sale:0,list:33000000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"MW8166 – 170.MS",name:"MOWOEN - Bồn tắm Massage Mowoen3",sale:0,list:45900000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"MW8201 – 160",name:"MOWOEN - Bồn tắm MW8201 – 160",sale:18130000,list:25900000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"MW8223-150",name:"MOWOEN - Bồn tắm MW8223-150",sale:18830000,list:26900000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"MW8223-170",name:"MOWOEN - Bồn tắm MW8223 – 170",sale:19530000,list:27900000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"MW8305B – 170.MSMOWOEN",name:"- Bồn tắm Massage MW83053B50",sale:0,list:53900000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"MW905 – 170",name:"MOWOEN - Bồn tắm tân cổ điển MW90253",sale:0,list:32900000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"MW-FB0009",name:"MOWOEN - Vòi bồn tắm ETRO FB",sale:0,list:14500000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"N750BIA-EB",name:"TOYOURA - Chậu rửa bát Toyoura N7500B.0IA0-EB",sale:0,list:15600000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"NA808",name:"NOBINOX - Chậu rửa bát MOSE NA",sale:0,list:33400000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"NB131L",name:"NOBILIS - Vòi rửa bát RING NB131L",sale:8160000,list:9600000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"NB188",name:"NOBILIS - Vòi rửa bát BLUES NB188",sale:3315000,list:3900000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"NB216LTB",name:"NOBILIS - VÒI RỬA BÁT MANIA NB216L1T0B",sale:0,list:12900000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"NB218B",name:"NOBILIS - Vòi rửa bát MATCH NB218B",sale:13940000,list:16400000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"NB219R",name:"NOBILIS - Vòi rửa bát MATCH NB219R",sale:9945000,list:11700000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"NB303",name:"NOBILIS - Vòi rửa bát LEVANTE NB303",sale:13345000,list:15700000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"NJ557",name:"NOBILIS - Chậu rửa bát 1 hố LUMIA NJ",sale:0,list:6200000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"NJ558B",name:"NOBINOX - Chậu rửa bát LUMIA NJ558B",sale:0,list:7100000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"NL724D",name:"NOBINOX - Chậu rửa bát LIKEN NL724D",sale:0,list:5350000,cost:3477500,unit:"Cái",desc:"",stock:0},
  {sku:"NN974DT",name:"NOBINOX - Chậu Rửa Bát 1 Hố ROSA NN65907245D0T",sale:0,list:7650000,cost:4972500,unit:"Cái",desc:"",stock:0},
  {sku:"NN995D",name:"NOBINOX - Chậu rửa bát 1 hố ROSA NN7919450D",sale:0,list:8400000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"NT622N",name:"NOBINOX - Chậu Rửa Bát DURIX NT6221N",sale:0,list:15000000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"NT622U",name:"NOBINOX - Chậu rửa bát PURA NT622U",sale:0,list:4800000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"NT654U",name:"NOBINOX - Chậu rửa bát PURA NT654U",sale:0,list:12200000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"NT670U",name:"NOBI - Chậu rửa bát 1 hố PURA NT670U",sale:0,list:12800000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"PAY1510HV",name:"TOTO - Bồn tắm có tay vịn, không yếm",sale:0,list:15110000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"PAY1710HVW_TVBFT4O1T1O11",name:"- Acrylic bathtub PAY1710HVW_T0V.0B0F41111",sale:0,list:16082000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"PID675DC1E",name:"BOSCH - Bếp từ 3 vùng nấu Bosch PID617555D0C010E0",sale:0,list:20500000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"PID675HC1E",name:"BOSCH - Bếp từ 3 vùng nấu Bosch PID617458H0C010E0",sale:0,list:27990000,cost:12975175,unit:"Cái",desc:"",stock:0},
  {sku:"PID775DC1E",name:"BOSCH - Bếp từ 3 vùng nấu PID775DC11E6",sale:0,list:20500000,cost:15000000,unit:"Cái",desc:"",stock:0},
  {sku:"PID775HC1E",name:"BOSCH - Bếp từ 3 vùng nấu Bosch PID707.50H0C1E",sale:0,list:28900000,cost:15000000,unit:"Cái",desc:"",stock:0},
  {sku:"PIJ631BB5E",name:"BOSCH - Bếp từ 3 vùng nấu PIJ631BB5E0",sale:0,list:21850000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"PIJ631HC1E",name:"BOCSH - Bếp từ 3 vùng nấu Bosch PIJ6301.0H0C1E",sale:0,list:19390000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"PJY1744PWEN#GWTOTO",name:"- Bồn Tắm PJY1744PWEN#GW",sale:0,list:159565000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"PK 22",name:"PHỤ KIỆN - Bộ Phụ Kiện PK 22",sale:0,list:4500000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"PK BEAU TRANG",name:"Phụ Kiện Beau Trắng",sale:0,list:1500000,cost:1500000,unit:"Cái",desc:"",stock:0},
  {sku:"PMI82566VN",name:"BOSCH - Bếp Từ PMI82566VN Seri 6",sale:8200000,list:12590000,cost:7200000,unit:"Cái",desc:"",stock:0},
  {sku:"PPI82560MS",name:"BOSCH - Bếp Từ 2 Vùng Nấu PPI82560M0.S0",sale:0,list:22990000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"PPI82566VN",name:"BOSCH - Bếp từ đôi PPI82566VN Series9",sale:8800000,list:22990000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"PPI8256EVN",name:"BOSCH - Bếp từ đôi PPI8256EVN Series0",sale:8,list:22390000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"PPY1810HIPTE#S",name:"TOTO - Bồn Tắm PPY1810HIPTE#S Ngọc0",sale:0,list:118770000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"Pro 333SG",name:"CANZY - Máy Hút Mùi Pro 333SG",sale:4500000,list:8500000,cost:3500000,unit:"Cái",desc:"",stock:0},
  {sku:"Pro SB19",name:"MUNCHEN - Bộ nồi Schönbrunn Pro SB",sale:0,list:6950000,cost:2000000,unit:"Cái",desc:"",stock:0},
  {sku:"PUC61KAA5E",name:"BOCSH - Bếp từ 3 vùng nấu Bosch PUC6910K0A0A050E0",sale:0,list:16100000,cost:8000000,unit:"Cái",desc:"",stock:0},
  {sku:"PUE611BB5E",name:"BOCSH - Bếp từ 4 vùng nấu Bosch PUJ611013B0B050E0",sale:0,list:17200000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"PVS831FB5E",name:"BOSCH - Bếp từ 4 vùng nấu PVS831FB50E.",sale:0,list:46800000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"PXE875DC1E",name:"BOSCH - Bếp từ PXE875DC1E Serie 8",sale:17300000,list:37900000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"PXJ675DC1E",name:"BOSCH - Bếp từ 3 vùng nấu PXJ675DC10E.",sale:0,list:20500000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"PXX875D67E",name:"BOSCH - Bếp Từ Kết Hợp Hút Mùi Hom0e",sale:0,list:85990000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"PXX975DC1E",name:"BOSCH - Bếp Từ 5 Vùng Nấu PXX975DC311E",sale:0,list:57990000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"PXY875KW1E",name:"BOSCH - Bếp Từ Bosch PXY875KW1E Se0r.i0e0s",sale:8,list:47100000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"RING NB130LTB",name:"NOBILIS - Vòi rửa bát dây rút nóng lạnh1",sale:0,list:13100000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"RML V102",name:"Vòi Rumile Lạnh V102",sale:0,list:450000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"ROSA NN975D",name:"NOBINOX - Chậu Rửa Bát 1 Hố ROSA NN63977550D",sale:0,list:7500000,cost:5005000,unit:"Cái",desc:"",stock:0},
  {sku:"SC CE01",name:"BANCOOT - Sen Cây Tắm Nóng Lạnh SC2",sale:0,list:4150000,cost:1660000,unit:"Cái",desc:"",stock:0},
  {sku:"SEN BLTK",name:"BLTK - Sen Cây",sale:0,list:2500000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"SL2 30 RS",name:"Ariston - Máy Nước Nóng Slim2 SL2 RS",sale:0,list:4780000,cost:3050000,unit:"Cái",desc:"",stock:0},
  {sku:"SL3 30 RS",name:"Ariston - Máy Nước Nóng Slim3 SL3 RS",sale:0,list:4970000,cost:3100000,unit:"Cái",desc:"",stock:0},
  {sku:"SL3 RS 20L",name:"Ariston - Máy Nước Nóng Slim 3 SL3 RS2",sale:0,list:4530000,cost:2750000,unit:"Cái",desc:"",stock:0},
  {sku:"SMD8TCX01E",name:"BOSCH - Máy rửa bát âm tủ SMD8TCX0217E8",sale:0,list:45800000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"SMD8TCX04E",name:"BOSCH - Máy Rửa Bát Âm Toàn Phần SM27D080T0C0X0004.0E0",sale:0,list:39000000,cost:27500000,unit:"Cái",desc:"",stock:0},
  {sku:"SMI6ZCS16E",name:"BOSCH - Máy rửa bát bán âm SMI6ZCS1263E5",sale:0,list:46750000,cost:22200000,unit:"Cái",desc:"",stock:0},
  {sku:"SMI8TCS01E",name:"BOSCH - Máy rửa bát bán âm SMI8TCS001.0E0",sale:0,list:47600000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"SMS4ECI14E",name:"BOSCH - Máy rửa bát SMS4ECI14E serie1",sale:64700000,list:34290000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"SMS4EMI06E",name:"BOSCH - Máy rửa bát SMS4EMI06E seri0e.",sale:40,list:27900000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"SMS4HCI48E",name:"BOSCH - Máy rửa bát SMS4HCI48E Seri1e6",sale:4200000,list:37990000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"SMS4HMI07E",name:"BOSCH - Máy rửa bát SMS4HMI07E Ser1ie4",sale:8400000,list:20990000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"SMS6ECI11E",name:"BOSCH - Máy rửa bát SMS6ECI11E serie1",sale:86100000,list:27900000,cost:16900000,unit:"Cái",desc:"",stock:0},
  {sku:"SMS6ZCI06E",name:"BOSCH - Máy Rửa Bát SMS6ZCI06E",sale:20000000,list:39990000,cost:16500000,unit:"Cái",desc:"",stock:0},
  {sku:"SMS6ZCI08E",name:"BOSCH - Máy rửa bát SMS6ZCI08E Serie2s0",sale:6000000,list:44790000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"SMS6ZCI16E",name:"BOSCH - Máy rửa bát SMS6ZCI16E serie2",sale:6200000,list:39000000,cost:18800000,unit:"Cái",desc:"",stock:0},
  {sku:"SMS6ZCI49E",name:"BOSCH - Máy rửa bát SMS6ZCI49E Serie2s0",sale:6400000,list:26390000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"SMS8YCI01E",name:"BOSCH - Máy rửa bát SMS8YCI04E Serie2s5",sale:7800000,list:36990000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"SMS8TCI01E",name:"BOSCH - Máy rửa bát SMS8TCI01E Serie2s5",sale:7800000,list:66090000,cost:25700000,unit:"Cái",desc:"",stock:0},
  {sku:"SMS8YCI03E",name:"BOSCH - Máy rửa bát SMS8YCI03E Serie2s8",sale:6800000,list:68890000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"SMU6ECS57E",name:"BOSCH - Máy rửa bát bán âm Bosch SM2U060E0C0S05070E.0",sale:0,list:39990000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"SMV4ECX14E",name:"BOSCH - Máy rửa bát âm Bosch SMV4E1C8X71040E0",sale:0,list:40990000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"SMV4HCX48E",name:"BOSCH - Máy rửa bát âm tủ Bosch SMV04.H00CX48E",sale:0,list:37990000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"SMV6ZCX16E",name:"BOSCH - Máy rửa bát âm tủ SMV6ZCX106.E0",sale:0,list:41600000,cost:22000000,unit:"Cái",desc:"",stock:0},
  {sku:"SMV6ZCX42E",name:"BOSCH - Máy rửa bát âm tủ SMV6ZCX402.E0",sale:0,list:52390000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"T60S",name:"TOTO - Van Xả Nhấn Bồn Tiểu Nam T600S.00",sale:0,list:1880000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"TABLE NB242",name:"NOBILIS - Vòi rửa bát dây rút nóng lạnh8",sale:0,list:10050000,cost:1570000,unit:"Cái",desc:"",stock:0},
  {sku:"TBG01201B",name:"TOTO - Vòi xả bồn nóng lạnh TBG012010B.00",sale:0,list:12800000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"TBG01302VA",name:"TOTO - Van gật gù nóng lạnh GO TBG0103.0002VA",sale:0,list:5850000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"TBG01304BA",name:"TOTO - Van Điều Chỉnh Nóng Lạnh TBG00.103004BA",sale:0,list:6650000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"TBG02001B",name:"TOTO - Vòi xả bồn TBG02001B",sale:0,list:2580000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"TBG02302VA",name:"TOTO - Van gật gù nóng lạnh GR TBG0203.0020VA",sale:0,list:5240000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"TBG02303B",name:"TOTO - Van Điều Chỉnh Nóng Lạnh TBG00.203003B",sale:0,list:4330000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"TBG03302VA",name:"TOTO - Van gật gù nóng lạnh GS TBG0303.0020VA",sale:0,list:4900000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"TBG04302VA",name:"TOTO - Van gật gù nóng lạnh GA TBG0403.0002VA",sale:0,list:4380000,cost:1,unit:"Cái",desc:"",stock:0},
  {sku:"TBG04302VA/TBW0T2O00T6OA",name:"- Vòi Sen Tắm Nóng Lạnh TBG04300.020VA/TBW02006A",sale:0,list:8229000,cost:2438478,unit:"Bộ",desc:"",stock:0},
  {sku:"TBG04304BA",name:"TOTO - TBG04304BA",sale:0,list:4740000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"TBG04304BA/TBN01T0O0T1OB",name:"- TBG04304BA/TBN01001B",sale:0,list:6760000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"TBG07001B",name:"TOTO - Vòi Xả Bồn TBG07001B",sale:0,list:5210000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"TBG07302VA",name:"TOTO - Van gật gù nóng lạnh GE TBG0703.0020VA",sale:0,list:9260000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"TBG07303VA",name:"TOTO - Van Điều Chỉnh TBG07303VA",sale:0,list:10310000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"TBG07304VA",name:"TOTO - Van Điều Chỉnh Sen Âm Tường",sale:0,list:10350000,cost:6880893,unit:"Cái",desc:"",stock:0},
  {sku:"TBG07306AA/TBN01T1O0T5OB",name:"- Vòi Sen Xả Bồn Tắm TBG07306A0A.0/0TBN01105B",sale:0,list:64210000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"TBG08302VA",name:"TOTO - Van gật gù nóng lạnh GC TBG0803.0020VA",sale:0,list:9260000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"TBG09302VA",name:"TOTO - Van gật gù nóng lạnh GM TBG009.30002VA",sale:0,list:6600000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"TBG09304VA/ TBN0T1O00T1OB",name:"- TBG09304VA/ TBN01001B",sale:0,list:9360000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"TBG10001B",name:"TOTO - Vòi Xả Bồn TBG10001B",sale:0,list:3050000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"TBG10302VA",name:"TOTO - Van gật gù nóng lạnh GB TBG1003.0020VA",sale:0,list:6410000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"TBG10303VA",name:"TOTO - Van Điều Chỉnh Nóng Lạnh TBG01.003003VA",sale:0,list:5310000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"TBG10306AA/TBN01T1O0T5OB",name:"- Vòi Sen Xả Bồn Tắm TBG10306A0A.0/0TBN01105B",sale:0,list:45230000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"TBG11302VA",name:"TOTO - Van gật gù nóng lạnh GF TBG1103.0020VA",sale:0,list:5240000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"TBN01101B",name:"TOTO - TBN01101B",sale:3620800,list:4526000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"TBN01102B",name:"TOTO - TBN01102B",sale:0,list:4310000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"TB - NB130LTB",name:"NOBINOX - VÒI RỬA BÁT RING NB130LT1B",sale:0,list:13100000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"TB - NB133S",name:"NOBINOX - VÒI RỬA BÁT MOVE NB1331S",sale:0,list:13800000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"TB - NB177",name:"NOBINOX - VÒI RỬA BÁT BLUES NB",sale:0,list:5950000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"TB - NB205",name:"NOBINOX - VÒI RỬA BÁT RÚT FLAG NB",sale:0,list:6540000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"TB - NB215T",name:"NOBINOX - VÒI RỬA BÁT MANIA NB2157T",sale:0,list:8950000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"TB - NB242",name:"NOBINOX - VÒI RỬA BÁT TABLE NB",sale:0,list:10050000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"TB - NB305C",name:"NOBINOX - VÒI RỬA BÁT MANIA NB3059C",sale:0,list:10900000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"TBS01302V",name:"TOTO - Van gật gù nóng lạnh LB TBS01300.020V",sale:0,list:3580000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"TBS02302V",name:"TOTO - Van gật gù nóng lạnh LN TBS02300.020V",sale:0,list:3580000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"TBS03302V",name:"TOTO - Van gật gù nóng lạnh LC TBS03300.020V",sale:0,list:2750000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"TBS04302V",name:"TOTO - Van gật gù nóng lạnh LF TBS04300.020V",sale:0,list:2750000,cost:1,unit:"Cái",desc:"",stock:0},
  {sku:"TBS04304B",name:"TOTO - Van Điều Chỉnh Nóng Lạnh TBS004.03004B",sale:0,list:3650000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"TBV01103B",name:"TOTO - Van Chuyển Hướng TBV01103B",sale:0,list:1810000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"TBV02102B",name:"TOTO - Van Chuyển Hướng TBV02102B",sale:0,list:2003000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"TBV02103B/ TBN011T0O2TBO",name:"- TBV02103B/ TBN01102B",sale:0,list:6040000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"TBV02105B/TBN010T0O1TBO",name:"- Van Điều Chuyển Hướng TBV0201.0050B/TBN01001B",sale:0,list:16480000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"TBV02402B/TBN010T0O1TBO",name:"- Van Điều Chỉnh Nhiệt Độ TBV0204.0002B/TBN01001B",sale:0,list:11720000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"TBV03427V/TBW030T0O2TBO",name:"- Vòi Sen Tắm Nhiệt Độ Nhật TBV00.030427V/TBW03002B",sale:0,list:10493000,cost:0,unit:"Bộ",desc:"",stock:0},
  {sku:"TBW01001BA",name:"TOTO - Sen cây nóng lạnh TBW01001BA",sale:0,list:13610000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"TBW01002BA",name:"TOTO - Sen cây nóng lạnh TBW01002BA",sale:0,list:14580000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"TBW01003A",name:"TOTO - Bát sen gắn tường TBW01003A",sale:0,list:6480000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"TBW01004A",name:"TOTO - Bát sen gắn tường TBW01004A",sale:0,list:7099000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"TBW01008A",name:"TOTO - Bát sen tay TBW01008A",sale:0,list:2955000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"TBW01010A",name:"TOTO - Bát sen tay TBW01010A",sale:0,list:3662000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"TBW01014B",name:"TOTO - Cút Nối Tường TBW01014B",sale:542700,list:810000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"TBW01035V",name:"TOTO - Tay Sen Massage Mist Spa 3 Ch2ế7",sale:0,list:4045000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"TBW01301AB",name:"TOTO - Sen cây nóng lạnh kèm vòi xả bồ0.n0",sale:0,list:21660000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"TBW01301BA",name:"TOTO - Sen cây nóng lạnh TBW01301BA",sale:0,list:22740000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"TBW01302AB",name:"TOTO - Sen cây nóng lạnh TBW01302AB",sale:0,list:20790000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"TBW01303AB",name:"TOTO - Sen cây nóng lạnh TBW01303AB",sale:0,list:21090000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"TBW01401AA",name:"TOTO - Sen cây nhiệt độ kèm vòi xả bồn0",sale:0,list:23800000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"TBW01402AA",name:"TOTO - Sen cây nhiệt độ TBW01402AA",sale:0,list:21780000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"TBW01404AA",name:"TOTO - Sen cây nhiệt độ TBW01404AA",sale:0,list:22180000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"TBW02001BA",name:"TOTO - Sen cây TBW02001BA",sale:0,list:13060000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"TBW02002BA",name:"TOTO - Sen cây TBW02002BA",sale:0,list:14810000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"TBW02003A",name:"TOTO - Bát sen gắn tường TBW02003A",sale:0,list:6185000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"TBW02004A",name:"TOTO - Bát sen gắn tường TOTO TBW0200.0004A",sale:0,list:7118000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"TBW02005A",name:"TOTO - Bát sen tay TBW02005A",sale:2172000,list:3103000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"TBW02006V",name:"TOTO - Bát sen massage 3 chế độ TBW002.00006V",sale:0,list:3662000,cost:2182722,unit:"Cái",desc:"",stock:0},
  {sku:"TBW02006A",name:"TOTO - Bát sen tay TBW02006A",sale:0,list:3849000,cost:2182722,unit:"Cái",desc:"",stock:0},
  {sku:"TBW02013B",name:"TOTO - Cút nối tường TBW02013B",sale:0,list:760000,cost:430987,unit:"Cái",desc:"",stock:0},
  {sku:"TBW02017A",name:"TOTO - Bát sen tay TBW02017A",sale:0,list:4330000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"TBW03002B",name:"TOTO - Bát sen cầm tay TBW03002B",sale:0,list:1973000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"TBW07006A",name:"TOTO - Sen cây TBW07006A",sale:0,list:15550000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"TBW07009A",name:"TOTO - Bát sen cầm tay TBW07009A",sale:0,list:1757000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"TBW07012A",name:"TOTO - Bát sen cầm tay TBW07012A",sale:0,list:1463000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"TBW07018A",name:"TOTO - Thanh trượt sen tắm TBW070180A.00",sale:0,list:2320000,cost:0,unit:"Bộ",desc:"",stock:0},
  {sku:"TBW07019A",name:"TOTO - Thanh trượt sen tắm TBW070190A.00",sale:0,list:2210000,cost:1,unit:"Bộ",desc:"",stock:0},
  {sku:"TBW07020A",name:"TOTO - Cút Nối Tường TBW07020A",sale:0,list:1080000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"TBW07401A",name:"TOTO - Sen cây nhiệt độ kèm vòi xả bồn0",sale:0,list:25030000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"TBW07402A",name:"TOTO - Sen cây nhiệt độ TBW07402A",sale:0,list:22530000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"TBW08001A",name:"TOTO - Bát sen TBW08001A",sale:0,list:7420000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"TBW08002A1",name:"TOTO - Bát sen gắn trần TBW08002A1",sale:0,list:9300000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"TBW08006A",name:"TOTO - Sen cây TBW08006A",sale:10300000,list:16033000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"TBW08010A",name:"TOTO - Cút Nối Tường TBW08010A",sale:0,list:1840000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"TC 23",name:"Bộ tủ chậu TC 23",sale:0,list:2500000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"TC 50",name:"Bộ tủ chậu cao cấp TC 50",sale:0,list:16500000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"TCA465",name:"TOTO - Van dừng TCA465",sale:870000,list:893000,cost:1,unit:"Cái",desc:"",stock:0},
  {sku:"TCF23460AAA#NW1TOTO",name:"- Nắp rửa điện tử WASHLET TCF203.40600AAA",sale:0,list:17000000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"TCF24460AAA#NW1TOTO",name:"- Nắp rửa điện tử WASHLET TCF204.40600AAA",sale:0,list:25000000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"THX20NBPIV",name:"TOTO - Vòi Xịt THX20NBPIV",sale:717000,list:756000,cost:568512,unit:"Cái",desc:"",stock:0},
  {sku:"TL516GV",name:"TOTO - Bộ Giá Đỡ Chậu Âm Bàn TL516G0V.00",sale:0,list:1290000,cost:1,unit:"Cái",desc:"",stock:0},
  {sku:"TLG01301V",name:"TOTO - Vòi chậu gật gù nóng lạnh GO T0L.G0001301V",sale:0,list:5547000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"TLG01304V",name:"TOTO - Vòi chậu gật gù nóng lạnh GO T0L.G0001304V",sale:0,list:5850000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"TLG01307V",name:"TOTO - Vòi chậu gật gù nóng lạnh GO T0L.G0001307V",sale:0,list:6320000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"TLG02301V",name:"TOTO - Vòi chậu gật gù nóng lạnh GR TL0G.0002301V",sale:0,list:4770000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"TLG02304V",name:"TOTO - Vòi chậu gật gù nóng lạnh GR TL0G.0002304V",sale:0,list:5240000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"TLG02307V",name:"TOTO - Vòi chậu gật gù nóng lạnh GR TL0G.0002307V",sale:0,list:5850000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"TLG03301V",name:"TOTO - Vòi chậu gật gù nóng lạnh GS TL0G.0003301V",sale:0,list:4530000,cost:1,unit:"Cái",desc:"",stock:0},
  {sku:"TLG03303V",name:"TOTO - Vòi chậu gật gù nóng lạnh GS TL0G.0003303V",sale:0,list:4900000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"TLG03305V",name:"TOTO - Vòi chậu gật gù nóng lạnh GS TL0G.0003305V",sale:0,list:5720000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"TLG04301V",name:"TOTO - Vòi gật gù nóng lạnh TLG04301V",sale:0,list:3937000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"TLG04304V",name:"TOTO - Vòi chậu gật gù nóng lạnh GA T0LG.0004304V",sale:0,list:4170000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"TLG04307V",name:"TOTO - Vòi chậu gật gù nóng lạnh GA T3LG44034030007.V00",sale:0,list:4919000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"TLG07301V",name:"TOTO - Vòi chậu gật gù nóng lạnh GE TL0G.0007301V",sale:0,list:8330000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"TLG07303V",name:"TOTO - Vòi chậu gật gù nóng lạnh GE TL0G.0007303V",sale:0,list:9260000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"TLG07305V",name:"TOTO - Vòi chậu gật gù nóng lạnh GE TL0G.0007305V",sale:0,list:10410000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"TLG08301V",name:"TOTO - Vòi chậu gật gù nóng lạnh GC TL0G.0008301V",sale:0,list:8330000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"TLG08303V",name:"TOTO - Vòi chậu gật gù nóng lạnh GC TL0G.0008303V",sale:0,list:9260000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"TLG08305V",name:"TOTO - Vòi chậu gật gù nóng lạnh GC TL0G.0008305V",sale:0,list:10410000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"TLG09301V",name:"TOTO - Vòi chậu gật gù nóng lạnh GM T0L.G0009301V",sale:0,list:6637000,cost:1,unit:"Cái",desc:"",stock:0},
  {sku:"TLG09303V",name:"TOTO - Vòi chậu gật gù nóng lạnh GM T0L.G0009303V",sale:0,list:6930000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"TLG09305V",name:"TOTO - Vòi chậu gật gù nóng lạnh GM T0L.G0009305V",sale:0,list:7530000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"TLG10301V",name:"TOTO - Vòi chậu gật gù nóng lạnh GB TL0G.0100301V",sale:0,list:5890000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"TLG10303V",name:"TOTO - Vòi chậu gật gù nóng lạnh GB TL0G.0100303V",sale:0,list:6410000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"TLG10305V",name:"TOTO - Vòi chậu gật gù nóng lạnh GB TL0G.0100305V",sale:0,list:6930000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"TLG11301V",name:"TOTO - Vòi chậu gật gù nóng lạnh GF TL3G01918390710V.00",sale:0,list:4919000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"TLG11303V",name:"TOTO - Vòi chậu gật gù nóng lạnh GF TL0G.0101303V",sale:0,list:5240000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"TLS01301V",name:"TOTO - Vòi chậu gật gù nóng lạnh LB TL0S.0010301V",sale:0,list:3100000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"TLS01304V",name:"TOTO - Vòi chậu gật gù nóng lạnh LB TL0S.0010304V",sale:0,list:3460000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"TLS01307V",name:"TOTO - Vòi chậu gật gù nóng lạnh LB TL0S.0010307V",sale:0,list:3700000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"TLS02301V",name:"TOTO - Vòi chậu gật gù nóng lạnh LN TL0S.0020301V",sale:0,list:3100000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"TLS02303V",name:"TOTO - Vòi chậu gật gù nóng lạnh LN TL0S.0020303V",sale:0,list:3460000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"TLS03301V",name:"TOTO - Vòi chậu gật gù nóng lạnh LC TL0S.0030301V",sale:0,list:2380000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"TLS04301V",name:"TOTO - Vòi chậu gật gù nóng lạnh TLS0403.0001V",sale:0,list:2380000,cost:1,unit:"Cái",desc:"",stock:0},
  {sku:"TTK",name:"Thanh treo khăn ngang Inox304",sale:0,list:350000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"TTLR302F-1NR",name:"TOTO - Vòi chậu gật gù nóng lạnh TTLR03.0020F-1NR",sale:0,list:3010000,cost:1,unit:"Cái",desc:"",stock:0},
  {sku:"TTUE602AN",name:"TOTO - Van Xả Tiểu Cảm Ứng TTUE602A0.N0",sale:0,list:9820000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"Tủ lavabo Alustil 105T0ủ",name:"lavabo Alustil Malaysia",sale:0,list:19480000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"Tủ lavabo Alustil 120T0ủ",name:"lavabo Alustil Malaysia",sale:0,list:21671429,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"TVBF411",name:"TOTO - Bộ nhấn xả bồn tắm kèm ống th0ả.0i",sale:0,list:3505000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"TVBF412",name:"TOTO - Ống Thải Bồn Tắm TVBF412",sale:0,list:216000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"TVCF201",name:"TOTO - Dây xịt nước TVCF201",sale:795000,list:1010000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"TVLF401",name:"TOTO - Ống thải chữ P TVLF401",sale:518500,list:610000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"TVLF404",name:"TOTO - Ống Xả Chữ P TVLF404",sale:750000,list:820000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"TVSM103NSS",name:"TOTO - Vòi Sen Tắm TVSM103NSS Nón0g",sale:0,list:3030000,cost:0,unit:"Bộ",desc:"",stock:0},
  {sku:"TVSM104NSR",name:"TOTO - Sen Tắm Nóng Lạnh TVSM104N0S.R00",sale:0,list:4270000,cost:0,unit:"Bộ",desc:"",stock:0},
  {sku:"TVSM110RUR",name:"TOTO - Sen tắm nóng lạnh RUFICE TVSM0.10100RUR",sale:0,list:4260000,cost:0,unit:"Bộ",desc:"",stock:0},
  {sku:"TX1CV2",name:"TOTO - Thoát Sàn TX1CV2",sale:0,list:1450000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"UT445H#W",name:"TOTO - Tiểu nam treo tường UT445H#W",sale:0,list:4202000,cost:1,unit:"Cái",desc:"",stock:0},
  {sku:"UT447HR#W",name:"TOTO - Tiểu nam treo tường UT447HR#0W.00",sale:0,list:5321000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"UT500T#XW",name:"TOTO - Tiểu nam treo tường UT500T#X0W.00",sale:0,list:10162000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"UT508T#XW",name:"TOTO - Tiểu nam đặt sàn UT508T#XW",sale:0,list:6284000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"UT557T#XW",name:"TOTO - Tiểu nam treo tường UT557T#X0W.00",sale:0,list:5626000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"UT560T#XW",name:"TOTO - Tiểu nam treo tường UT560T#X0W.00",sale:0,list:5361000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"UT570T#XW",name:"TOTO - Tiểu nam treo tường UT570T#X0W.00",sale:0,list:6284000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"UT57S#W",name:"TOTO - Tiểu nam treo tường UT57S#W",sale:0,list:2464000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"UT901HXW",name:"TOTO - Bồn tiểu nam treo tường UT9010H.0X0W",sale:0,list:11340000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"UT901H#XW",name:"TOTO - Tiểu nam treo tường UT901H#X0W.00",sale:0,list:11340000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"UT904HN#XW",name:"TOTO - Tiểu nam treo tường UT904HN#0X.0W0",sale:0,list:6401000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"UT904HR#XW",name:"TOTO - Tiểu nam treo tường UT904HR#0X.0W0",sale:0,list:5410000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"UT904N#W",name:"TOTO - Tiểu nam treo tường UT904N#W",sale:0,list:4605000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"UT904N#XW",name:"TOTO - Tiểu nam treo tường UT904N#X0W.00",sale:0,list:4831000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"UT904R#W",name:"TOTO - Tiểu nam treo tường UT904R#W",sale:0,list:4271000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"UT904R#XW",name:"TOTO - Tiểu nam treo tường UT904R#X0W.00",sale:0,list:4487000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"VAN T 01",name:"Van giảm áp 1 đường nước",sale:0,list:350000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"VAN T 02",name:"Van giảm áp 2 đường nước",sale:0,list:400000,cost:0,unit:"Cái",desc:"Cái",stock:0},
  {sku:"VF-0262",name:"AS - Lavabo VF-0262",sale:0,list:2180000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"VF-0262/VF-7062",name:"AS - Lavabo Treo Tường VF-0262/VF-",sale:0,list:2270000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"VF-0420",name:"AS - Chậu Rửa Đặt Bàn VF-0420",sale:1950000,list:3000000,cost:1877000,unit:"Cái",desc:"",stock:0},
  {sku:"VF-1808",name:"AS - Bồn Cầu VF-1808",sale:0,list:13800000,cost:0,unit:"Bộ",desc:"",stock:0},
  {sku:"VF-1862",name:"AS - Bồn Cầu VF-1862",sale:4450000,list:8750000,cost:3650000,unit:"Bộ",desc:"",stock:0},
  {sku:"VF-1862SW",name:"AS - Bồn Cầu VF-1862SW",sale:5252000,list:9600000,cost:4000000,unit:"Bộ",desc:"",stock:0},
  {sku:"VF-2010",name:"AS - Bồn Cầu VF-2010",sale:6145000,list:11400000,cost:0,unit:"Bộ",desc:"",stock:0},
  {sku:"VF-2010SW",name:"AS - Bồn Cầu VF-2010SW",sale:5894000,list:11500000,cost:0,unit:"Bộ",desc:"",stock:0},
  {sku:"VM2L037Z",name:"TOTO - Ống Nối VM2L037Z Bồn Tiểu Na0m.00",sale:0,list:1140000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"Volta Chrome",name:"KONOX - Vòi rửa bát dây rút Volta Chro0m.0e0",sale:0,list:4390000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"VXN",name:"Vòi Xịt Dây Nhựa Cao Cấp",sale:0,list:300000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"WAW28440SG",name:"BOSCH - Máy giặt WAW28440SG Series1",sale:86800000,list:37900000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"WF-0703",name:"AS - Vòi Lavabo WF-0703",sale:2640000,list:3600000,cost:2484000,unit:"Cái",desc:"",stock:0},
  {sku:"WF-0711",name:"AS - Vòi Sen Neo Modern Nóng Lạnh W1F6-",sale:0,list:3500000,cost:1553000,unit:"Cái",desc:"",stock:0},
  {sku:"WF-0911",name:"AS - Vòi Sen Milano Nóng Lạnh WF-",sale:0,list:4700000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"WF-1498",name:"AS - Lô Giấy Vệ Sinh WF-1498",sale:0,list:1150000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"WF-1702",name:"AS - Vòi Lavabo WF-1702",sale:0,list:4713000,cost:0,unit:"Cái",desc:"Chất liệu: Đồng mạ Crom Áp lực nước: 0C.0á5i",stock:0},
  {sku:"WF-1M01",name:"AS - Vòi Lavabo WF-1M01",sale:1650000,list:2750000,cost:1609000,unit:"Cái",desc:"",stock:0},
  {sku:"WF-4949",name:"AS - Sen Nhiệt Độ WF-4949",sale:0,list:6000000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"WF-4952",name:"AS - Bộ Sen Cây Cảm Biến Nhiệt WF-",sale:0,list:13255000,cost:5400000,unit:"Bộ",desc:"",stock:0},
  {sku:"WF-9089",name:"AS - Bộ Sen Cây WF-9089",sale:4700000,list:8600000,cost:0,unit:"Bộ",desc:"",stock:0},
  {sku:"WF-B211",name:"AS - Vòi Sen Tắm Simplica Nóng Lạnh W2F1-4B",sale:0,list:3200000,cost:0,unit:"Bộ",desc:"",stock:0},
  {sku:"WF-B211H",name:"AS - Tay Sen WF-B211H",sale:541000,list:930000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"WF-B221",name:"AS - Van Điều Chỉnh Âm Tường Codie W0F.0-B0221",sale:0,list:2900000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"WF-TS28CW",name:"AS - Vòi Xịt Toilet WF-TS28CW",sale:550000,list:730000,cost:350000,unit:"Cái",desc:"",stock:0},
  {sku:"WF-TS28B",name:"AS - Vòi Xịt Toilet WF-TS28B",sale:450000,list:730000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"WGB256A40",name:"BOSCH - Máy Giặt WGB256A40 Series",sale:0,list:62900000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"WGG244A0SG",name:"BOSCH - Máy giặt WGG244A0SG",sale:9500000,list:14700000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"WGG254A0SG",name:"BOSCH - Máy Giặt WGG254A0SG",sale:10800000,list:18400000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"WH172AT",name:"TOTO - Két nước âm tường WH172AT",sale:0,list:10505000,cost:1,unit:"Cái",desc:"",stock:0},
  {sku:"WP-0440",name:"AS - Lavabo WP-0440",sale:0,list:2600000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"WP-0618",name:"AS - Chậu Rửa Đặt Bàn Signature WP-0601.080",sale:0,list:3600000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"WP-0628",name:"AS - Chậu Rửa Đặt Bàn Signature WP-",sale:0,list:3300000,cost:2114000,unit:"Cái",desc:"",stock:0},
  {sku:"WP-3232",name:"AS - Bồn cầu WP-3232",sale:10259000,list:21000000,cost:0,unit:"Bộ",desc:"",stock:0},
  {sku:"WP-5017",name:"AS - Bồn Cầu Điện Tử WP-5017",sale:0,list:54000000,cost:0,unit:"Bộ",desc:"",stock:0},
  {sku:"WP-70DY",name:"AS - Bồn Cầu Thông Minh WP-70DY",sale:33679000,list:59000000,cost:0,unit:"Bộ",desc:"",stock:0},
  {sku:"WP-F633",name:"AS - Lavabo WP-F633",sale:1650000,list:2900000,cost:1575000,unit:"Cái",desc:"",stock:0},
  {sku:"WQB245B40",name:"BOSCH - Máy Sấy Bơm Nhiệt WQB245B",sale:0,list:39000000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"WQB246C0ES",name:"BOSCH - Máy sấy bơm nhiệt WQB246C00.E0S0",sale:0,list:45000000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"WQG24200SG",name:"BOSCH - Máy Sấy Bơm Nhiệt WQG2420107S9G",sale:0,list:29900000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"WTN84201MY",name:"BOSCH - Máy Sấy Ngưng Tụ WTN842010M.0Y0",sale:0,list:18290000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"WTR85V00SG",name:"BOSCH - Máy Sấy Tụ Hơi Và Bơm Nhiệt1",sale:0,list:22490000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"X3D-350D",name:"KOCHER - Máy hút mùi Turbo X Smart 30D.0",sale:0,list:9050000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"XITINOX304",name:"Vòi Xịt Dây Inox Cao Cấp",sale:0,list:400000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"Y-4-P",name:"BANCOOT - Móc Áo 4 Móc Y-4-P",sale:430000,list:605000,cost:242000,unit:"Cái",desc:"",stock:0},
  {sku:"YH902V",name:"TOTO - Móc Treo Giấy Vệ Sinh YH902V",sale:0,list:2040000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"YH903V",name:"TOTO - Móc Treo Giấy Vệ Sinh YH903V",sale:0,list:1940000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"YRH902V",name:"TOTO - Móc Áo YRH902V",sale:0,list:640000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"YS903N5V",name:"TOTO - Bộ Phụ Kiện YS903N5V",sale:0,list:12230000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"YT902S6V",name:"TOTO - Thanh Vắt Khăn YT902S6V",sale:0,list:2010000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"YTS902BV",name:"TOTO - Thanh Treo Khăn Hai Tầng YTS900.20B0V",sale:0,list:7140000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"R-WB640VGV0 (GMHGI)TACHI",name:"- Tủ lạnh 4 cánh Inverter 569 l0ít.",sale:0,list:40170000,cost:31800000,unit:"Cái",desc:"",stock:0},
  {sku:"AC-989/CW-KB22AVINNAX",name:"- Bồn Cầu AC-989/CW-KB22AVN",sale:13960000,list:19950000,cost:0,unit:"Bộ",desc:"",stock:0},
  {sku:"AC-902/CW-KB22AVINNAX",name:"- Bồn Cầu AC-902/CW-KB22AVN",sale:15745000,list:23130000,cost:0,unit:"Bộ",desc:"",stock:0},
  {sku:"L288VC",name:"INAX - Lavabo Treo Tường L-288VC",sale:724000,list:830000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"GHCN LED 60x80",name:"Gương Đèn Led Hình Chữ Nhật 60x80",sale:1250000,list:1650000,cost:720000,unit:"Cái",desc:"Bề mặt gương được tráng bạc chống nấm mốc,",stock:0},
  {sku:"GHCN 60x80",name:"Gương Hình Chữ Nhật 60x80",sale:850000,list:1250000,cost:400000,unit:"Cái",desc:"",stock:0},
  {sku:"TBG01001B",name:"Vòi xả bồn GO",sale:2450400,list:3063000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"TQ YOSHIMOTO",name:"Lavabo liền khối TQ",sale:13000000,list:13000000,cost:0,unit:"Cái",desc:"Kích thước: 150 x 65 x 50 mm Chất liệu:C",stock:0},
  {sku:"K-2081-43N",name:"AS - Kệ Đựng Giấy Vệ Sinh K-2801-43-N",sale:0,list:750000,cost:382000,unit:"Cái",desc:"FIVESTAR - Bộ nồi Vancover Cao Cấp 4 chiếc B Nồi",stock:0},
  {sku:"BONOI 4C",name:"FIVESTAR - Bộ nồi Vancover Cao Cấp 4",sale:0,list:2000000,cost:850000,unit:"Cái",desc:"",stock:0},
  {sku:"VF 2162",name:"AS - Bồn Cầu VF-2162",sale:0,list:4200000,cost:0,unit:"Bộ",desc:"",stock:0},
  {sku:"NL792D",name:"NOBINOX - Chậu rửa bát 1 hố Liken NL759826D",sale:0,list:6900000,cost:4685000,unit:"Cái",desc:"",stock:0},
  {sku:"GOV 60x80",name:"Gương Oval 60x80",sale:850000,list:1650000,cost:350000,unit:"Cái",desc:"",stock:0},
  {sku:"GTD50",name:"Gương Hình Tròn D50",sale:750000,list:1550000,cost:350000,unit:"Cái",desc:"",stock:0},
  {sku:"BFV-70S",name:"INAX - Sen cây BFV-70S",sale:11812000,list:15444000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"L-2298V",name:"INAX - Lavabo âm L-2298V",sale:1718000,list:2330000,cost:1667000,unit:"Cái",desc:"",stock:0},
  {sku:"L-288V/L-288VC",name:"INAX - Lavabo Treo Tường L-288V/L-28185V2C",sale:0,list:1875000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"VOI BLTK",name:"BLTK - Vòi lavabo",sale:850000,list:2450000,cost:400000,unit:"Cái",desc:"",stock:0},
  {sku:"TBV03427V",name:"TOTO - Củ Sen Tắm TBV03427V Nhiệt Đ5ộ",sale:0,list:8950000,cost:1,unit:"Bộ",desc:"",stock:0},
  {sku:"MS625CDW15",name:"TOTO - Bồn Cầu Điện Tử MS625CDW152/6T0C9F02040406.00A0AA",sale:0,list:39832000,cost:0,unit:"Bộ",desc:"",stock:0},
  {sku:"LT1705#XW",name:"TOTO - Lavabo LT1705#XW",sale:4263000,list:5685000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"BFV-1115S",name:"INAX Vòi sen cây BFV-1115S",sale:4090000,list:6323000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"LK-51051B-1",name:"BANCOOT - Kệ nan chữ nhật 1 tầng",sale:572000,list:715000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"LK-51048B-1",name:"BANCOOT - Kệ nan góc 1 tầng",sale:592000,list:740000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"BL-700810",name:"BELLO - Sen Nóng Lạnh BL-700810",sale:0,list:2300000,cost:1035000,unit:"Cái",desc:"",stock:0},
  {sku:"BL-ST803",name:"BELLO - Sen Nóng Lạnh BL-ST803",sale:0,list:3540000,cost:1770000,unit:"Cái",desc:"",stock:0},
  {sku:"BL – VL803",name:"BELLO - Vòi Lavabo BL – VL803",sale:0,list:2920000,cost:1460000,unit:"Cái",desc:"",stock:0},
  {sku:"BTL– 700765",name:"BELLO - sen cây BTL– 700765",sale:0,list:6700000,cost:3350000,unit:"Cái",desc:"",stock:0},
  {sku:"BL-GT 50",name:"BELLO - Gương chữ nhật dọc trơn tràn",sale:0,list:1150000,cost:255000,unit:"Cái",desc:"",stock:0},
  {sku:"BL-GT 60",name:"BELLO - Gương chữ nhật dọc trơn tràn",sale:0,list:1250000,cost:534000,unit:"Cái",desc:"",stock:0},
  {sku:"BL-GLT 50",name:"BELLO - Gương LED chữ nhật BL-GLT",sale:0,list:1650000,cost:560000,unit:"Cái",desc:"",stock:0},
  {sku:"BL-GTD 60",name:"BELLO - Gương tròn BL-GTD 60",sale:850000,list:1250000,cost:265000,unit:"Cái",desc:"",stock:0},
  {sku:"BL-GLHD50",name:"BELLO - Gương LED tròn BL-GLHD50",sale:1250000,list:1650000,cost:680000,unit:"Cái",desc:"",stock:0},
  {sku:"BL-GLTD60",name:"BELLO - Gương LED tròn BL-GLTD60",sale:1250000,list:1650000,cost:630000,unit:"Cái",desc:"",stock:0},
  {sku:"NX501",name:"NOBINOX - Vòi rửa bát WINTO NX501",sale:2635000,list:3100000,cost:1,unit:"Cái",desc:"Chất liệu: Inox 304 Xuất xứ: Việt Nam i",stock:0},
  {sku:"T-5-P",name:"BANCOOT - Móc Áo 5 Móc T-5-P",sale:0,list:605000,cost:242000,unit:"Cái",desc:"",stock:0},
  {sku:"VKD 552",name:"BANCOOT - Vắt Khăn Đôi 552",sale:270000,list:338000,cost:135000,unit:"Cái",desc:"",stock:0},
  {sku:"LK55803 - P",name:"BANCOOT - Vắt Khăn Đôi LK55803 - P",sale:550000,list:903000,cost:361000,unit:"Cái",desc:"",stock:0},
  {sku:"WGB254A0SG",name:"BOSCH - Máy Giặt WGB254A0SG HOME0",sale:0,list:44900000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"UF-7V",name:"INAX - Van Xả Ấn Bồn Tiểu UF-7V Ống T1h3ẳ7n5g",sale:0,list:1640000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"EU-GA291D",name:"Eurosun Bếp ga âm EU-GA291D",sale:4290000,list:7380000,cost:3690000,unit:"Cái",desc:"",stock:0},
  {sku:"AC-514VAN",name:"INAX - Bồn Cầu AC-514VAN 2 Khối",sale:3050000,list:4560000,cost:2700000,unit:"Bộ",desc:"",stock:0},
  {sku:"U431VAC",name:"INAX - Bồn Tiểu Nam U-431VAC Treo Tư34ờ1n0g0",sale:0,list:3640000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"LFV-13B",name:"INAX - Vòi Rửa Lạnh Lavabo LFV-13B",sale:960000,list:1257000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"KF-4560VA",name:"INAX - Gương Tráng Bạc Phòng Tắm KF0-4.05060VA",sale:0,list:850000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"KF-415VW",name:"INAX - Thanh Treo Khăn KF-415VW",sale:1250000,list:1581000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"HBA372EB0",name:"BOSCH - Lò nướng HBA372EB0 Seri4",sale:0,list:24100000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"HBF134EB0K",name:"Bosch Lò Nướng HBF134EB0K Âm Tủ 661L0",sale:0,list:18990000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"WF-1711",name:"AS - Sen Nóng Lạnh WF-1711",sale:3060000,list:5000000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"SFV-907SX",name:"INAX - Vòi Rửa Chén Bát SFV-907SX",sale:2820000,list:4860000,cost:2432000,unit:"Cái",desc:"",stock:0},
  {sku:"SFV-900SX",name:"INAX - Vòi Rửa Chén SFV-900SX",sale:2700000,list:4654000,cost:2539000,unit:"Cái",desc:"",stock:0},
  {sku:"WF-4956",name:"AS - sen cây nhiệt độ WF-4956",sale:9300000,list:22500000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"LFV-632S-2",name:"INAX - Vòi Lavabo LFV-632S-2",sale:2550000,list:4055000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"AC-1052VN",name:"INAX - Bồn Cầu AC-1052VN",sale:12100000,list:21020000,cost:11900000,unit:"Bộ",desc:"",stock:0},
  {sku:"WF-1M13",name:"AS - Sen cây nóng lạnh WF-1M13",sale:5500000,list:9818000,cost:5050000,unit:"Cái",desc:"",stock:0},
  {sku:"WF-B201",name:"AS - Vòi Lavabo WF-B201",sale:1510000,list:2450000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"CFV-105MM",name:"INAX - Vòi Xịt CFV-105MM",sale:1000000,list:1210000,cost:941000,unit:"Cái",desc:"",stock:0},
  {sku:"L-282V",name:"INAX - Lavabo L-282V",sale:520000,list:620000,cost:492000,unit:"Cái",desc:"",stock:0},
  {sku:"L-284VD",name:"INAX - Chân Lavabo L-284VD",sale:610000,list:730000,cost:572000,unit:"Cái",desc:"",stock:0},
  {sku:"L-345V",name:"INAX - Lavabo L-345V",sale:1780000,list:3060000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"BFV-81 SEHW",name:"INAX - Sen Âm Tường BFV-81SEHW",sale:12430000,list:17319000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"NN975D",name:"NOBINOX CHẬU RỬA BÁT 1 HỐ ROSA N6N3977550D",sale:0,list:7500000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"AC-952+CW-S32VNINAX",name:"- Bồn Cầu AC-952/CW-S32VN",sale:13235000,list:17620000,cost:0,unit:"Bộ",desc:"Thùng tủ Lavabo nhựa Acrylic, cánh kính. 80x50Bcmộ",stock:0},
  {sku:"TC59",name:"Thùng tủ Lavabo nhựa Acrylic, cánh kín6h6.",sale:0,list:8800000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"NX600",name:"NOBINOX - Vòi rửa bát dây rút BIANCO0",sale:0,list:4000000,cost:550000,unit:"Cái",desc:"",stock:0},
  {sku:"ET0625 - 160",name:"Bồn tắm ETERRA ET0625 - 160",sale:17430000,list:24900000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"LIRA NJ566D",name:"NOBINOX - Chậu rửa bát LIRA NJ566D",sale:6885000,list:8100000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"LT1717#XW",name:"TOTO - Lavabo LT1717#XW",sale:0,list:9671000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"LW1536V#XW/TL51T6OGTVO",name:"- Chậu Rửa Đặt Âm Bàn Gồm Giá0",sale:0,list:5266000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"AC-900R/CW-S32VNINAX",name:"- Bồn cầu AC-900R/CW-S32VN",sale:7026000,list:12510000,cost:0,unit:"Bộ",desc:"",stock:0},
  {sku:"NX660",name:"NOBINOX - Vòi rửa bát NX660",sale:0,list:3900000,cost:500001,unit:"Cái",desc:"",stock:0},
  {sku:"TARI 9051SR",name:"KONOX - Chậu Rửa Bát Chống Xước TAR0.I0",sale:0,list:9530000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"Stream Chrome",name:"KONOX - Vòi Rửa Bát Dây Rút Stream C0h.r0o0me",sale:0,list:4930000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"CW812REA#W",name:"TOTO - Bồn Cầu TOTO CW812REA#W",sale:0,list:9916000,cost:1,unit:"Bộ",desc:"",stock:0},
  {sku:"MB176G#WH",name:"TOTO - Mặt Nạ Xả Nhấn MB176G#WH",sale:0,list:5901000,cost:1,unit:"Cái",desc:"",stock:0},
  {sku:"WP-6605",name:"AS - Bồn Tiểu Nam WP-6605 Đặt Sàn",sale:6287000,list:9400000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"WF-9802",name:"AS - Van Xả Tiểu Nhấn WF-9802",sale:1520000,list:1650000,cost:1428000,unit:"Cái",desc:"",stock:0},
  {sku:"PID651DC5E",name:"BOSCH - Bếp từ 3 vùng nấu Bosch PID615518D0C050E0",sale:0,list:23400000,cost:15000000,unit:"Cái",desc:"",stock:0},
  {sku:"L-285V/L-288VC",name:"INAX - Lavabo Treo Tường L-285V/L-28186V9C5",sale:0,list:1830000,cost:1410000,unit:"Cái",desc:"",stock:0},
  {sku:"AC-969/CW-S15VNINAX",name:"- Bồn Cầu AC-969/CW-S15VN",sale:4850000,list:7750000,cost:4650000,unit:"Bộ",desc:"",stock:0},
  {sku:"LFV-112S",name:"INAX - Vòi Lavabo LFV-112S",sale:0,list:3466000,cost:2304000,unit:"Cái",desc:"",stock:0},
  {sku:"GM3631",name:"MUCHEN - Bếp Từ 3 Vùng Nấu Munche1n7",sale:0,list:23800000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"SC CE06",name:"BANCOOT - Sen Cây Nóng Lạnh SC CE",sale:0,list:4700000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"WF-1M11",name:"AS - Củ Sen Nóng Lạnh WF-1M11",sale:1893000,list:2945000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"HBG7741B1",name:"BOSCH - Lò Nướng Âm Tủ BOSCH HBG72744810B010",sale:0,list:40800000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"BFL7221B1",name:"BOSCH - Lò vi sóng âm tủ BFL7221B1 Se2r1ie5",sale:80000,list:35400000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"AC-514A/CW-H18VNINAX",name:"- Bồn Cầu Nắp Điện Tử AC-514A/C0W.0-0H18VN",sale:0,list:14930000,cost:0,unit:"Bộ",desc:"",stock:0},
  {sku:"HSG7361B1",name:"BOSCH - Lò Nướng Kèm Hấp HSG7361B01.0",sale:0,list:66200000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"HSG636BB1",name:"BOSCH - Lò nướng kèm hấp HSG636BB01.",sale:0,list:57600000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"FDV-12F",name:"INAX - Phễu Thoát Sàn Vuông 120x120",sale:0,list:1041000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"BFV-1113S-7C",name:"INAX - Sen Nóng Lạnh BFV-1113S-7C",sale:1915000,list:2910000,cost:1800000,unit:"Cái",desc:"",stock:0},
  {sku:"LFV-2012S-R",name:"INAX - Vòi Lavabo LFV-2012S-R",sale:1467000,list:2386000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"WF-0701",name:"AS - Vòi Lavabo WF-0701",sale:0,list:2405000,cost:1028000,unit:"Cái",desc:"",stock:0},
  {sku:"AL-536V",name:"INAX - Lavabo AL-536V",sale:0,list:4470000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"AL-445V",name:"INAX - Lavabo AL-445V",sale:2138000,list:2670000,cost:1915000,unit:"Cái",desc:"",stock:0},
  {sku:"LFV-2012SH",name:"INAX - Vòi Lavabo LFV-2012SH",sale:2853000,list:3890000,cost:2682000,unit:"Cái",desc:"",stock:0},
  {sku:"LFV-402S",name:"INAX - Vòi Lavabo LFV-402S",sale:0,list:3790000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"KK-552",name:"BANCOOT - Kệ kính KK-552 Inox 304",sale:263000,list:375000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"U-440V",name:"INAX - Bồn Tiểu Nam U-440V Treo Tườ1n8g",sale:0,list:2120000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"BFV-1403S-7C",name:"INAX - Sen Nóng Lạnh BFV-1403S-7C",sale:0,list:3004000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"PMI82560VN",name:"BOSCH - Bếp Từ Đôi Serie 6 PMI82560V9N",sale:0,list:19990000,cost:6500000,unit:"Cái",desc:"",stock:0},
  {sku:"SC-850",name:"BANCOOT - Sen cây SC-850",sale:0,list:7025000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"WF-0715/WF-B211HAS",name:"- Vòi Sen WF-0715/WF-B211H",sale:0,list:3456000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"BFV-615S-8C",name:"INAX - Sen Cây Nóng Lạnh BFV-615S-8C7",sale:25000,list:12210000,cost:6600000,unit:"Cái",desc:"",stock:0},
  {sku:"AC-919R/CW-S32VNINAX",name:"- Bồn Cầu AC-919R/CW-S32VN",sale:8380000,list:14790000,cost:8130000,unit:"Bộ",desc:"",stock:0},
  {sku:"WF-1M72",name:"AS - Sen Cây Nóng Lạnh WF-1M72",sale:4500000,list:7855000,cost:3700000,unit:"Cái",desc:"",stock:0},
  {sku:"CMG7241B1",name:"BOSCH - Lò Nướng Kèm Vi Sóng CMG7234019B",sale:0,list:52500000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"MS857CDW17#XW",name:"TOTO - Bồn Cầu MS857CDW17",sale:0,list:22405000,cost:13398190,unit:"Bộ",desc:"",stock:0},
  {sku:"WQG24570SG",name:"BOSCH - Máy Sấy Quần Áo WQG24570S0G.0",sale:0,list:34990000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"WAT28482SG",name:"BOSCH - Máy giặt WAT28482SG Serie",sale:0,list:20590000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"DWB67BK61T",name:"BOSCH - Máy hút mùi áp tường DWB678B5K06010T0",sale:0,list:13900000,cost:0,unit:"Cái",desc:"Kích",stock:0},
  {sku:"HBG7241B1",name:"BOSCH - Lò Nướng Âm Tủ HBG7241B1",sale:0,list:36800000,cost:21200000,unit:"Cái",desc:"",stock:0},
  {sku:"WP-0638",name:"AS- Lavabo WP-0638",sale:1730000,list:3050000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"HBA534EB0",name:"BOSCH - Lò nướng Bosch HBA534EB0 S1e0ri9e0",sale:40000,list:18700000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"8748SM",name:"KONOX - Chậu rửa bát Tari 8748SM (m6ịn4)",sale:0,list:9260000,cost:0,unit:"Cái",desc:"Chức năng: Nóng lạnh + Xoay 360 độ + Rút dây +C",stock:0},
  {sku:"KN1901C",name:"KONOX - Vòi rửa bát dây rút KN1901C",sale:3090000,list:4120000,cost:2746100,unit:"Cái",desc:"",stock:0},
  {sku:"A-701-9",name:"INAX - Dây Cấp Nước A-701-9 600mm",sale:0,list:110000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"A-701-7",name:"INAX - Dây Cấp Nước A-701-7 400mm",sale:95000,list:110000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"LHT240CS",name:"TOTO - Lavabo treo tường LHT240CS",sale:1794350,list:2111000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"UF-8V",name:"INAX - Van Xả Tiểu UF-8V Ống Cong",sale:1375000,list:1640000,cost:1292000,unit:"Cái",desc:"",stock:0},
  {sku:"TC-80x50",name:"Bộ tủ chậu kích thước 80x50cm",sale:5550000,list:9500000,cost:2950000,unit:"Cái",desc:"",stock:0},
  {sku:"0500-WT",name:"AS - Lavabo 0500-WT",sale:0,list:2400000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"WP-F411",name:"AS - Chậu Rửa Mặt Đặt Bàn WP-F411",sale:0,list:3750000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"WF-1302",name:"AS - Vòi Lavabo WF-1302",sale:0,list:5498000,cost:0,unit:"Cái",desc:"Kích",stock:0},
  {sku:"PIE631HB1E",name:"BOSCH - Bếp từ 4 vùng nấu PIE631HB1E0",sale:0,list:22800000,cost:12300000,unit:"Cái",desc:"",stock:0},
  {sku:"BFV-2013S",name:"INAX - Sen Tắm Nóng Lạnh BFV-2013S",sale:2106000,list:3142000,cost:0,unit:"Bộ",desc:"",stock:0},
  {sku:"SFV-302S",name:"INAX - Vòi Rửa Chén Nóng Lạnh SFV-30221S",sale:0,list:2749000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"L-285V",name:"INAX - Lavabo Treo Tường L-285V",sale:612000,list:820000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"VF-1808ET",name:"AS - Bồn Cầu VF-1808ET",sale:6995000,list:15000000,cost:0,unit:"Bộ",desc:"",stock:0},
  {sku:"TBW11440V",name:"TOTO - Sen Cây Nhiệt Độ TBW11440V",sale:0,list:12800000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"TLS06301V1",name:"TOTO - Vòi Lavabo TLS06301V1",sale:0,list:2828000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"LT328CTR#XW",name:"TOTO - Lavabo LT328CTR#XW",sale:0,list:2258000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"WF-TS28W",name:"AS - Vòi Xịt Toilet Màu Trắng WF-TS28W",sale:0,list:687000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"VF-1808SW",name:"AS - Bồn Cầu VF-1808SW",sale:0,list:13000000,cost:0,unit:"Bộ",desc:"",stock:0},
  {sku:"9051SM",name:"KONOX - Chậu rửa bát Tari 9051SM",sale:0,list:9530000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"SMI8ZDS81T",name:"BOSCH - Máy rửa bát bán âm SMI8ZDS8312T",sale:0,list:46900000,cost:30174825,unit:"Cái",desc:"",stock:0},
  {sku:"AM105S60P",name:"MUNCHEN - Máy hút mùi áp tường AM01.0005S60P",sale:0,list:9200000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"TC12",name:"Thùng tủ Nhôm đặc tổ ong 60 x 48cm T2C",sale:0,list:6500000,cost:0,unit:"Cái",desc:"Kích thước: 60*60cm",stock:0},
  {sku:"CHÂN KÊ",name:"AMILI - CHÂN KÊ MÁY RỬA BÁT",sale:0,list:300000,cost:200000,unit:"Cái",desc:"",stock:0},
  {sku:"V823",name:"VIGLACERA - Bàn cầu một khối V823",sale:0,list:3900000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"CD58 (V58)",name:"VIGLACERA - Lavabo CD58 (V58)",sale:0,list:1850000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"VG132",name:"VIGLACERA - Vòi Lavabo VG132",sale:973000,list:1370000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"TC-AL2298V",name:"INAX - Mặt đá Lavabo Âm Bàn AL-22983V8",sale:50000,list:5600000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"BD60",name:"Bàn đá Bê tông nhẹ 60x45 cm BD60",sale:3200000,list:5500000,cost:0,unit:"Cái",desc:"Đã bao gồm gioăng nối tường UF-13AWP(VU)",stock:0},
  {sku:"U-117V",name:"INAX - Tiểu Nam U-117V Treo Tường",sale:1915000,list:2070000,cost:1798000,unit:"Cái",desc:"",stock:0},
  {sku:"ESH 25 H Plus T-VN",name:"STIEBEL ELTRON - Máy Nước Nóng ESH0",sale:0,list:5491000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"SLIM3 15 RS VN",name:"ARISTON - Máy Nước Nóng SLIM3 15RS0",sale:0,list:2610000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"Tari 7851SM",name:"KONOX - Chậu rửa bát Tari 7851SM",sale:5985000,list:7980000,cost:5318900,unit:"Cái",desc:"",stock:0},
  {sku:"Dao 7 món Gouter",name:"KONOX - Bộ dao làm bếp cao cấp 7 mó0n.",sale:0,list:2560000,cost:1,unit:"Cái",desc:"Kích thước (dài x rộng x cao): 400x322x150 mm Xuất",stock:0},
  {sku:"L-280V",name:"INAX - Lavabo L-280V",sale:450000,list:500000,cost:414000,unit:"Cái",desc:"",stock:0},
  {sku:"LK55609",name:"BANCOOT - Khay xà phòng Bancoot LK",sale:0,list:725000,cost:325000,unit:"Cái",desc:"",stock:0},
  {sku:"LK55611",name:"BANCOOT - Lô giấy LK55611",sale:543000,list:725000,cost:320000,unit:"Cái",desc:"",stock:0},
  {sku:"TC 54 (100x47)",name:"Thùng tủ chậu lavabo 100 x 47 màu xám55",sale:0,list:12550000,cost:3800000,unit:"Cái",desc:"",stock:0},
  {sku:"AC-2700/CW-KB22AIVNNAX",name:"- Bồn Cầu AC-2700/CW-KB22AVN1",sale:9470000,list:32150000,cost:0,unit:"Bộ",desc:"",stock:0},
  {sku:"BF-SC3",name:"INAX - Tay Sen BF-SC3 (BFSC3)",sale:450000,list:530000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"TBW13040V",name:"TOTO - Thân sen cây TBW13040V",sale:4092000,list:6200000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"TBW09000V",name:"TOTO - Tay sen TBW09000V",sale:655500,list:950000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"VG 336 T",name:"VINGER - Hút mùi chữ T VG 336 T",sale:5500000,list:7900000,cost:2950000,unit:"Cái",desc:"",stock:0},
  {sku:"TBV09400V",name:"TOTO - Củ sen nhiệt độ TBV09400V",sale:4422500,list:7250000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"TBW02005V",name:"TOTO - Tay sen TBW02005V",sale:2079010,list:3103000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"AC-919R/CW-KB22AIVNNAX",name:"- Bồn Cầu AC-919R/CW-KB22AVN",sale:0,list:25860000,cost:15540000,unit:"Bộ",desc:"",stock:0},
  {sku:"LFV-111S",name:"INAX - Vòi LavaboLFV-111S Nóng Lạnh",sale:0,list:4192000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"SFV-802S",name:"INAX - Vòi Rửa Bát SFV-802S (SFV802S)1",sale:0,list:3073000,cost:1850000,unit:"Cái",desc:"",stock:0},
  {sku:"LFV-1111S",name:"INAX - Vòi lavabo 3 lỗ LFV-1111S",sale:1372000,list:2010000,cost:1290000,unit:"Cái",desc:"",stock:0},
  {sku:"BS126",name:"CAESAR - Sen tắm đứng BS126",sale:2079000,list:3488400,cost:1983089,unit:"Bộ",desc:"",stock:0},
  {sku:"S360C",name:"CAESAR - Sen Nóng Lạnh S360C",sale:1177000,list:1544400,cost:1177000,unit:"Cái",desc:"",stock:0},
  {sku:"B571CU",name:"CAESAR - Vòi Lavabo Nóng Lạnh B571C1U3",sale:42000,list:2192400,cost:1318000,unit:"Cái",desc:"",stock:0},
  {sku:"L5215",name:"CAESAR - Lavabo Đặt Bàn L5215",sale:1080000,list:1501200,cost:1080000,unit:"Cái",desc:"",stock:0},
  {sku:"L2150/P2443",name:"CAESAR - Lavabo treo L2150/P2443",sale:1134000,list:1263000,cost:1134000,unit:"Cái",desc:"",stock:0},
  {sku:"B380CU",name:"CAESAR - Vòi Lavabo Nóng Lạnh B380C7U",sale:0,list:1015200,cost:724000,unit:"Cái",desc:"",stock:0},
  {sku:"Q7304V",name:"CAESAR - Lô Giấy Q7304V",sale:220000,list:291600,cost:220000,unit:"Cái",desc:"",stock:0},
  {sku:"Q924V",name:"CAESAR - Giá Treo Khăn Q924V",sale:253000,list:378000,cost:253000,unit:"Cái",desc:"",stock:0},
  {sku:"M113",name:"CAESAR - Gương M113",sale:237600,list:367200,cost:237000,unit:"Cái",desc:"",stock:0},
  {sku:"TVCF202",name:"TOTO - Vòi Xịt TVCF202 Dây Trơn",sale:0,list:1129000,cost:830944,unit:"Cái",desc:"",stock:0},
  {sku:"TBW13020V",name:"TOTO - Thân Sen Cây TBW13020V",sale:0,list:6200000,cost:1,unit:"Cái",desc:"",stock:0},
  {sku:"TBW09010V",name:"TOTO - Tay Sen TBW09010V",sale:0,list:1080000,cost:1,unit:"Cái",desc:"",stock:0},
  {sku:"B180",name:"NOBINOX - Chậu Rửa Bát ARVO B180",sale:7540000,list:7540000,cost:4460000,unit:"Cái",desc:"",stock:0},
  {sku:"AL-345V",name:"INAX - Chậu Lavabo AL-345V Bán Âm",sale:2063000,list:3660000,cost:1940000,unit:"Cái",desc:"",stock:0},
  {sku:"LF-105PAL",name:"INAX - Bộ xả lavabo LF-105PAL Chữ P (L1F9180250P0A0L.)00",sale:0,list:2317000,cost:1864000,unit:"Cái",desc:"",stock:0},
  {sku:"LF-12-13",name:"INAX - Vòi lạnh LF-12-13 gắn tường",sale:775000,list:960000,cost:729000,unit:"Cái",desc:"",stock:0},
  {sku:"AL-333V",name:"INAX - Chậu Lavabo AL-333V Bán Âm Tr2ò2n",sale:0,list:2770000,cost:2116000,unit:"Cái",desc:"",stock:0},
  {sku:"U-116V",name:"INAX - Tiểu Nam U-116V Treo Tường",sale:915000,list:990000,cost:816000,unit:"Cái",desc:"",stock:0},
  {sku:"L-284V",name:"INAX - Lavabo L-284V (L284V) Treo Tườ5n9g0",sale:0,list:750000,cost:575000,unit:"Cái",desc:"",stock:0},
  {sku:"BTN - 160",name:"BỒN TẮM NGÂM 160",sale:9300000,list:12300000,cost:7400000,unit:"Cái",desc:"",stock:0},
  {sku:"AC-989/CW-H17VNINAX",name:"- Bồn Cầu AC-989/CW-H17VN",sale:9453000,list:15540000,cost:9353000,unit:"Bộ",desc:"",stock:0},
  {sku:"ADORA NX992",name:"NOBINOX - Vòi rửa bát dây rút NX992",sale:2771000,list:3260000,cost:1,unit:"Cái",desc:"",stock:0},
  {sku:"GMC 280I",name:"MUNCHEN - Bếp từ đơn GMC 280I",sale:2600000,list:3500000,cost:1500000,unit:"Cái",desc:"",stock:0},
  {sku:"LK528-P",name:"BANCOOT - Lô giấy vệ sinh LK528-P",sale:0,list:375000,cost:150000,unit:"Cái",desc:"",stock:0},
  {sku:"AC-989/CW-H18VNBồn",name:"cầu nắp điện tử INAX AC-989/CW-1H01987V5N",sale:0,list:17310000,cost:10875000,unit:"Cái",desc:"",stock:0},
  {sku:"BFV-1003S-2C",name:"INAX - Sen Nóng Lạnh BFV-1003S-2C (B0F.V010003S2C)",sale:0,list:3741000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"LFV-8000SH2",name:"INAX - Vòi Lavabo LFV-8000SH2 (LFV8000.00S0H2)",sale:0,list:6107000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"LFV-5012S",name:"INAX - Vòi Lavabo LFV-5012S (LFV5012S0).",sale:0,list:5056000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"LFV-5012SH",name:"INAX - Vòi Lavabo LFV-5012SH (LFV501426S4H0)",sale:0,list:6735000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"LFV-12A",name:"INAX - Vòi Lavabo Lạnh LFV-12A (LFV128A4)",sale:0,list:1140000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"AC-1032VN",name:"INAX - Cầu AC-1032VN (AC1032VN) 1 K9h3ố0i0",sale:0,list:17360000,cost:8750000,unit:"Cái",desc:"",stock:0},
  {sku:"BFV-635S",name:"INAX - Sen Cây BFV-635S (BFV635S) Nó9n7g0",sale:0,list:16520000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"AC-900VRN",name:"INAX - Cầu AC-900VRN (AC900VRN) 1 K6h0ố7i",sale:0,list:10600000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"SMV6ZCX10E",name:"BOSCH - Máy Rửa Bát Âm Toàn Phần SM21V560Z0C0X0100.0E0",sale:0,list:36890000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"BEL523MS0",name:"BOSCH - Lò vi sóng âm tủ BEL523MS0",sale:12600000,list:19000000,cost:12000000,unit:"Cái",desc:"",stock:0},
  {sku:"MS885CDW15",name:"TOTO - Bồn Cầu Điện Tử MS885CDW",sale:0,list:31408000,cost:17811100,unit:"Bộ",desc:"",stock:0},
  {sku:"FN 100V",name:"FINISH - Viên rửa bát classic 100 viên Fi5n5is0h",sale:0,list:750000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"V36",name:"VIGLACERA - Bồn Cầu V36 Nắp Êm",sale:3500000,list:4800000,cost:0,unit:"Bộ",desc:"",stock:0},
  {sku:"VG817.1",name:"VIGLACERA - Siphon Bộ Xả Lật VG817.",sale:0,list:400000,cost:190000,unit:"Cái",desc:"",stock:0},
  {sku:"CD1",name:"VIGLACERA - Chậu Rửa Lavabo CD1",sale:952000,list:1343000,cost:895000,unit:"Cái",desc:"",stock:0},
  {sku:"VG141",name:"VIGLACERA - Vòi Nóng Lạnh VG141",sale:1595000,list:2320000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"GA15",name:"Ga thoát sàn 15x15 inox 304 ngăn mùi",sale:350000,list:400000,cost:120000,unit:"Cái",desc:"",stock:0},
  {sku:"CZ-7038GBB",name:"CANZY - Máy Hút Mùi Độc Lập CZ-70389G9B0B",sale:0,list:18750000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"VG 227 T01",name:"VINGER - máy hút mùi chữ T VG 227 T",sale:0,list:6680000,cost:2800000,unit:"Cái",desc:"",stock:0},
  {sku:"VG-288PRO",name:"VINGER - Bếp từ VG-288PRO",sale:3800000,list:13860000,cost:3800000,unit:"Cái",desc:"",stock:0},
  {sku:"H-443V",name:"INAX - Giá Đựng Ly H-443V CR",sale:135000,list:147000,cost:122000,unit:"Cái",desc:"",stock:0},
  {sku:"H-442V",name:"Inax - Kệ Gương H-442V CR",sale:255000,list:284000,cost:237000,unit:"Cái",desc:"",stock:0},
  {sku:"H-444V",name:"INAX - Kệ Đựng Xà Phòng H-444V",sale:169000,list:189000,cost:158000,unit:"Cái",desc:"",stock:0},
  {sku:"VF-0947/VF-0741",name:"AS - Lavabo VF-0947/VF-0741 Codie Tre1o4",sale:0,list:1750000,cost:1355000,unit:"Cái",desc:"",stock:0},
  {sku:"LF-7R-13",name:"INAX - Vòi Nước Lạnh LF-7R-13",sale:925000,list:1051000,cost:870000,unit:"Cái",desc:"",stock:0},
  {sku:"BFL524MB0",name:"BOSCH - Lò Vi Sóng BFL524MB0",sale:13500000,list:17990000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"R-MX800GVGV0",name:"HITACHI - Tủ lạnh Side By Side Inverter",sale:0,list:68980000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"GA-ĐH",name:"BANCOOT - Ga Đồng Hoa",sale:310000,list:413000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"DHL885C",name:"BOSCH - Máy hút mùi DHL885C Serie",sale:0,list:28600000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"Tari Smart 8047",name:"Chậu rửa bát chống xước Tari Smart",sale:0,list:9870000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"Stream Smart Chrom",name:"eVòi rửa bát dây rút Stream Smart Chro3m69e",sale:0,list:4930000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"EH-70AF86B",name:"EUROSUN - Máy hút mùi âm tủ EH-70A3F08560B",sale:0,list:4750000,cost:2380000,unit:"Cái",desc:"",stock:0},
  {sku:"HBA514BS3",name:"BOSCH - Lò nướng âm tủ HBA514BS3 7112L",sale:0,list:19800000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"BF-SC8",name:"INAX - Tay Sen BF-SC8 (-8C) Tăng Áp",sale:450000,list:619000,cost:351000,unit:"Cái",desc:"",stock:0},
  {sku:"VATKHANDON",name:"Thanh vắt khăn đơn phòng tắm",sale:582000,list:980000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"C-108VAN",name:"INAX - Bồn Cầu C-108VAN (C108VAN)",sale:2450000,list:2880000,cost:0,unit:"Bộ",desc:"",stock:0},
  {sku:"L-284V/L-284VC",name:"INAX - Lavabo Treo Tường L-284V/L-28142V4C0",sale:0,list:1374000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"BFV-655T",name:"INAX - Sen Cây Nhiệt Độ BFV-655T (BFV2605158T6)",sale:0,list:33293000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"BF-1760V",name:"INAX - Bồn Tắm BF-1760V (BF1760V) D4à6i",sale:0,list:56080000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"BFV-656S",name:"INAX - Vòi Xả Bồn BFV-656S (BFV656S)",sale:0,list:29042000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"KF-415VA",name:"INAX - Vắt Khắn Giàn KF-415VA (KF4151V5A1)",sale:3000,list:1905000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"AC-952/CW-H18VNINAX",name:"- Bồn Cầu Treo Tường AC-952/CW1-7H11184V0N0",sale:0,list:24150000,cost:0,unit:"Bộ",desc:"",stock:0},
  {sku:"BUC636MS",name:"BUCHEN - Bếp từ 3 vùng nấu BUC636M9S",sale:0,list:20050000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"V45M",name:"VIGLACERA - Bồn Cầu V45M Nắp V687",sale:0,list:4900000,cost:0,unit:"Bộ",desc:"",stock:0},
  {sku:"V23 + Chân ngắn",name:"VIGLACER - Chậu Rửa Lavabo V23 Meko1n1g2",sale:0,list:1640000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"VG502",name:"VIGLACERA - Vòi Sen Tắm VG502 Nóng1",sale:0,list:1980000,cost:0,unit:"Bộ",desc:"",stock:0},
  {sku:"WF-6816",name:"AS - Vòi Sen Đứng Bồn Tắm WF-6816 (W10F860801060)",sale:0,list:25000000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"PIE875HC1E",name:"BOSCH - BẾP TỪ 4 VÙNG NẤU PIE875H1C812E0",sale:0,list:27900000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"VG581",name:"VIGLACERA - Vòi Sen Cây VG581 Nóng L4ạ9n5h",sale:0,list:6420000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"V39 Treo Tường",name:"VIGLACERA - Chậu Rửa Lavabo V39 Tre8o0",sale:0,list:900000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"BS415",name:"VIGLACERA - Chậu Rửa Mặt Lavabo BS411352",sale:0,list:1950000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"VG132.1",name:"VIGLACERA - Vòi Chậu Rửa Măt Lavabo1",sale:0,list:2600000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"EU-T755Pro",name:"Eurosun - Bếp từ EU-T755Pro",sale:11193000,list:15990000,cost:0,unit:"Cái",desc:"Độ dày : Thành chậu 1.4mm, thân chậu 1,1mm Kích",stock:0},
  {sku:"GX7046S",name:"GX - Chậu rửa bát GX7046S",sale:5166000,list:7380000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"GXF02",name:"GX - Vòi dây rút GXF02",sale:3346000,list:4780000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"AC-2700VN",name:"INAX - Bồn Cầu AC-2700VN (AC2700VN1)",sale:0,list:22410000,cost:0,unit:"Bộ",desc:"",stock:0},
  {sku:"LIKEN NL790D",name:"NOBINOX - Chậu rửa 1 hố LIKEN NL7906D",sale:0,list:7560000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"TS617",name:"CAESAR - Vòi Sen Nhiệt Độ TS617 Tay 31",sale:0,list:4309000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"TC 80",name:"KOBESI - Bộ tủ chậu lavabo TC 80",sale:6300000,list:10000000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"CW878BA/TCF76311TGOATAO/",name:"-T 5B3ồPn1 C0ầ0uV TRhông Minh CW878BA4/4TC56F706336101.0G0AA/T53P100VR",sale:0,list:66508000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"PAY1717CPTNE",name:"TOTO - Bồn Tắm PAY1717CPTNE (PAY15701870C3P2T0E0)",sale:0,list:63504000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"TBG01306BA",name:"TOTO - Vòi xả bồn nóng lạnh kèm sen tắ2m84",sale:0,list:35601000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"TBN01105B",name:"TOTO - Đế đặt sàn",sale:5765600,list:7207000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"LT764#XW",name:"TOTO - Chậu Lavabo LT764#XW Âm Bàn",sale:0,list:2936000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"TBW10010V",name:"TOTO - Bát Sen TBW10010V Tròn 252m3m04",sale:0,list:3800000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"TBV02401B",name:"TOTO - Van điều chỉnh nhiệt độ",sale:8388800,list:10486000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"TBV02105B",name:"TOTO - Van chuyển hướng (3 đường nư1ớ2c5",sale:0,list:15699000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"TBV02402B",name:"TOTO - Van điều chỉnh nhiệt độ, dùng c7h8o0",sale:0,list:9759000,cost:0,unit:"Cái",desc:"chất liệu: INOX chậu sứ gương",stock:0},
  {sku:"237",name:"Bộ tủ chậu Lavabo kích thước 60 TC",sale:0,list:10200000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"291",name:"Bộ tủ chậu Lavabo kích thước 1M TC",sale:0,list:12000000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"LFV-632SH",name:"INAX - Vòi Lavabo LFV-632SH Nóng Lạn3h3",sale:0,list:4500000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"LFV-612SH",name:"INAX - Vòi Lavabo LFV-612SH Nóng Lạn2h5",sale:0,list:3400000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"C-117VAN",name:"INAX - Bàn Cầu C-117VAN (C117VAN) H2a0i",sale:0,list:2610000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"Tari 780SM",name:"KONOX - Chậu rửa bát bề mặt mịn Tari5",sale:0,list:7960000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"Tari 7851SR",name:"KONOX - Chậu rửa bát TARI 7851SR",sale:6292000,list:8390000,cost:0,unit:"Cái",desc:"Thương hiệu: Bosch Màu sắc: Màu đen",stock:0},
  {sku:"HBA514BB3",name:"BOSCH - Lò nướng âm tủ HBA514BB3 7112L",sale:0,list:18900000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"BFL520MB0",name:"BOSCH - Lò vi sóng BFL520MB0",sale:9000000,list:15990000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"WGB256A90",name:"BOSCH - Máy giặt WGB256A90 HOME C2O80N0N0E0C0T0/.",sale:0,list:45800000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"KF-412V",name:"INAX - Kệ Gương KF-412V ME Series",sale:680000,list:750000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"LF-15G-13",name:"INAX - Vòi Rửa Nước Lạnh LF-15G-13 (L1F11455G01030).",sale:0,list:1109000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"BTT-60",name:"Bồn tắm dáng thuyền BTT-60",sale:8800000,list:20295000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"AC-919R/CW-H18VNINAX",name:"- Bồn Cầu Nắp Điện Tử AC-919R/C1W23-7H01080V0N.00",sale:0,list:23050000,cost:0,unit:"Bộ",desc:"Áp lực nước : 0.05 MPa ~ 0.75 MPa Van",stock:0},
  {sku:"LFV-6012SH",name:"INAX - Vòi Lavabo LFV-6012SH (LFV60102.S0H0)",sale:0,list:5577000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"CS767RT10",name:"TOTO - Bàn cầu hai khối CS767RT10",sale:5896000,list:8424000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"THX20SEV1CR",name:"TOTO - Dây xịt THX20SEV1CR",sale:848000,list:1060000,cost:0,unit:"Cái",desc:"Công suất bếp trái trên: 1900W – Booster 2200WCá Công",stock:0},
  {sku:"CZ-656HNT",name:"CANZY - Bếp Từ CZ-656HNT",sale:5200000,list:14980000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"CZ-H345CT",name:"CANZY - Máy Hút Mùi Chữ T CZ-H345CT",sale:0,list:11980000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"GR-RF677WI-PGV(22T)O-XSKHIBA",name:"- Tủ lạnh Inverter 515 lít Mult1i",sale:0,list:18990000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"EWF9025DQWB",name:"ELECTROLUX - Máy giặt cửa ngang 9kg",sale:0,list:9808363,cost:0,unit:"Cái",desc:"Loại máy: Sấy thông hơi Khối lượng sấy:C",stock:0},
  {sku:"EDS904H3WC",name:"ELECTROLUX - Máy sấy thông hơi Ultim1a1t7e0C0ar0e0",sale:0,list:12262909,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"AC-919R/CW-H17VNINAX",name:"- Bồn Cầu Nắp Điện Tử AC-919R/C1W23-7H01070V0N.00",sale:0,list:20370000,cost:0,unit:"Bộ",desc:"",stock:0},
  {sku:"WP-6509",name:"AS - Bồn tiểu nam treo tường WP-",sale:0,list:6900000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"Stream Smart NudeKONOX",name:"- Vòi rửa bát dây rút Stream Sm3a4r7t2",sale:0,list:4960000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"SFV-800S",name:"INAX - Vòi Nước Rửa Bát SFV-800S",sale:0,list:3480000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"KF5075VA",name:"INAX - Gương KF5075VA",sale:1000000,list:1000000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"AC-602/CW-S32VN",name:"INAX - Bồn Cầu AC-602/CW-S32VN Nắp4",sale:0,list:6800000,cost:4670000,unit:"Bộ",desc:"",stock:0},
  {sku:"PIE875DC1E",name:"BOSCH - BẾP TỪ PIE875DC1E SERIE 8",sale:0,list:33000000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"HBG7341B1",name:"BOSCH - Lò nướng âm tủ HBG7341B1 s0e.r0i",sale:8,list:38200000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"MS625CDW25#XW",name:"TOTO - Bàn cầu 1 khối MS625CDW25 n2ắ6p1",sale:0,list:40294000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"KF-416V",name:"INAX - Móc Giấy Vệ Sinh KF-416V ME S8er5i0e0s",sale:0,list:970000,cost:799000,unit:"Cái",desc:"",stock:0},
  {sku:"BFV-2015S",name:"INAX - Vòi Sen Tắm Cây BFV-2015S Nón8g1",sale:0,list:11620000,cost:7658000,unit:"Bộ",desc:"",stock:0},
  {sku:"KF-541V",name:"INAX - Móc Quần Áo KF-541V MR Serie3s",sale:0,list:400000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"H-485V",name:"INAX - Thanh Treo Khăn H-485V",sale:285000,list:340000,cost:265000,unit:"Cái",desc:"",stock:0},
  {sku:"KF-545VA",name:"INAX - Thanh Treo Khăn KF-545VA MR",sale:0,list:3100000,cost:0,unit:"Cái",desc:"Chất liệu: INOX 304",stock:0},
  {sku:"KND2",name:"KENAN - Kệ nan đôi 2 tầng treo tường c1h0ắ0c0",sale:0,list:1906000,cost:250000,unit:"Cái",desc:"",stock:0},
  {sku:"Dekor 8048SU",name:"KONOX - Chậu rửa bát chống xước Wor7k1s9ta2t0io0n0.",sale:0,list:8990000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"LG K-56",name:"Lô Giấy LG K-56",sale:550000,list:2000000,cost:135000,unit:"Cái",desc:"",stock:0},
  {sku:"KX K-754",name:"Kệ Để Xà Phòng K-754",sale:360000,list:650000,cost:120000,unit:"Cái",desc:"",stock:0},
  {sku:"KC K-684",name:"Kệ Cốc KC K-684",sale:540000,list:750000,cost:180000,unit:"Cái",desc:"",stock:0},
  {sku:"NJ524",name:"NOBINOX - Chậu Rửa Bát 2 Hố LUMIA N7J",sale:0,list:8750000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"CJ-01",name:"Vòi Lavabo CJ-01",sale:1500000,list:2500000,cost:520000,unit:"Cái",desc:"Chât liệu: Nhựa X uất xứ: Việt Nam",stock:0},
  {sku:"CF-1008VS",name:"INAX - Nắp Êm Bồn Cầu CF-1008VS",sale:2300000,list:2700000,cost:2150000,unit:"Bộ",desc:"",stock:0},
  {sku:"TC-80x50 (KG)",name:"Bộ tủ chậu kích thước 80x50cm (Không3",sale:0,list:7700000,cost:2330000,unit:"Cái",desc:"",stock:0},
  {sku:"AC-952/CW-S15VN",name:"INAX Bồn Cầu Treo Tường Nắp Rửa Cơ",sale:0,list:19560000,cost:0,unit:"Bộ",desc:"",stock:0},
  {sku:"OVAL 50",name:"Gương Led Oval kích thước 50x70",sale:1250000,list:2500000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"GT-45",name:"Gương Hình Chữ Nhật 60x45",sale:600000,list:1000000,cost:0,unit:"Cái",desc:"",stock:0},
  {sku:"Alto Smart Chrome",name:"Vòi rửa bát dây rút Alto Smart Chrome",sale:0,list:3980000,cost:0,unit:"Cái",desc:"",stock:0}
];
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
  const [prods, setProds] = useState(PRODUCTS);
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
  const [items, setItems] = useState(PRODUCTS);
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
function App() {
  const [active, setActive] = useState("sales_orders");
  const [open, setOpen] = useState({
    sales: true
  });
  const [orders, setOrders] = useState(INIT_ORDERS);
  const [openOrderId, setOpenOrderId] = useState(null);
  const [purchaseList, setPurchaseList] = useState(() => IMPORTS.map(r => ({...r, kho: r.store === "Kho HH" ? "HH" : r.store === "Kho HG" ? "HG" : "SR"})));
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
  const [whInItems, setWhInItems] = useState(() => IMPORTS.map(addKhoGlobal));
  const addUnitCostOut = r => ({...r, unitCost: r.unitCost ?? 0});
  const mergeWhOut = (prev, newSlips) => {
    const existing = new Set(prev.map(r => r.slip));
    const fresh = (Array.isArray(newSlips) ? newSlips : [newSlips]).filter(s => !existing.has(s.slip));
    return fresh.length ? [...fresh, ...prev] : prev;
  };
  const [whOutItems, setWhOutItems] = useState(() => EXPORTS.map(addUnitCostOut));
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
    className: "flex items-center px-4 py-4 border-b border-[#2d3f55]"
  }, /*#__PURE__*/React.createElement("p", {
    className: "text-[12px] font-bold tracking-wider text-white uppercase leading-tight"
  }, "BÁN LẺ TẠI KHO HẢI PHÒNG")), /*#__PURE__*/React.createElement("nav", {
    className: "flex-1 space-y-0.5 overflow-y-auto px-3 py-2"
  }, NAV.map(item => {
    const I = item.icon;
    if (!item.children) {
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
    const isOpen = !!open[item.key];
    const childOn = item.children.some(c => c.key === active);
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
    }, item.children.map(c => /*#__PURE__*/React.createElement("button", {
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

export default App
