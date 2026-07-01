import React, { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { vnd, calc, localMonthStart, localToday, parseISO, parseISOEnd, parseViDate, field, stockOfLive } from '../constants.js';
import { useInventory } from '../contexts.jsx';
import { Th, TableShell, Card, DateRangeFilter, PrintBtn, ExportBtn, exportCSV } from '../components/ui.jsx';

export function ReportSales({orders = [], onOpenOrder}) {
  const [fromDate, setFromDate] = useState(localMonthStart());
  const [toDate, setToDate] = useState(localToday());
  const [rPage, setRPage] = useState(1);
  React.useEffect(() => setRPage(1), [fromDate, toDate]);

  const fromD = fromDate ? parseISO(fromDate) : null;
  const toD   = toDate   ? parseISO(toDate)   : null;

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

export function ReportPreorder({ orders = [] }) {
  const [fromDate, setFromDate] = useState(localMonthStart());
  const [toDate, setToDate] = useState(localToday());
  const [q, setQ] = useState("");
  const [expanded, setExpanded] = useState(new Set());
  const { whInItems = [] } = useInventory() || {};

  const inR = dt => { const d = parseViDate(dt); return (!fromDate || d >= parseISO(fromDate)) && (!toDate || d <= parseISOEnd(toDate)); };
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

export function ReportStaff({ orders = [] }) {
  const [fromDate, setFromDate] = useState(localMonthStart());
  const [toDate, setToDate] = useState(localToday());
  const [staffFilter, setStaffFilter] = useState("Tất cả");

  const inR = dt => { const d = parseViDate(dt); return (!fromDate || d >= parseISO(fromDate)) && (!toDate || d <= parseISOEnd(toDate)); };
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
