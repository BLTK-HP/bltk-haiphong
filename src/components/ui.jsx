import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { Search, Plus, Upload, Printer, ChevronDown, X, Check } from 'lucide-react';
import { num, vnd, TEXT_CELL, fmtPhone, field, inputF, inputSm, blueBtn, greenBtn, addBtn, ghostBtn } from '../constants.js';

/* ───────── tiny display atoms ───────── */
export const Phone = ({ value }) => React.createElement("span", { className: TEXT_CELL }, fmtPhone(value));
export const Sku   = ({ value }) => React.createElement("span", { className: TEXT_CELL }, String(value ?? ""));

export const Pill = ({ map, value }) => React.createElement("span", {
  className: `inline-flex items-center whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${map[value] || "bg-slate-100 text-slate-600 ring-slate-200"}`
}, value);

export function StatCard({ label, value, sub, tone = "default", icon: Icon }) {
  const c = { default: "text-[#92400e]", pos: "text-[#047857]", neg: "text-[#B91C1C]", accent: "text-[#92400e]", warn: "text-amber-600" }[tone];
  return React.createElement("div", { className: "rounded-xl border border-slate-200 bg-white p-4 shadow-sm" },
    React.createElement("div", { className: "flex items-center justify-between" },
      React.createElement("p", { className: "text-xs font-medium uppercase tracking-wide text-slate-500" }, label),
      Icon && React.createElement(Icon, { className: "h-4 w-4 text-slate-300" })),
    React.createElement("p", { className: `mt-2 text-2xl font-semibold tabular-nums ${c}` }, value),
    sub && React.createElement("p", { className: "mt-1 text-xs text-slate-400" }, sub));
}

export const Card = ({ title, children, right }) => React.createElement("div", { className: "rounded-xl border border-slate-200 bg-white shadow-sm" },
  (title || right) && React.createElement("div", { className: "relative flex items-center border-b border-slate-100 px-5 py-3" },
    title && React.createElement("h3", { className: "text-sm font-semibold text-slate-700 flex-1" }, title),
    right && React.createElement("div", { className: "ml-auto" }, right)),
  React.createElement("div", { className: (title || right) ? "p-5" : "" }, children));

export const Th = ({ children, right, center, style }) => React.createElement("th", {
  className: `whitespace-nowrap px-3 py-2.5 ${right ? "text-right" : center ? "text-center" : "text-left"}`,
  style
}, children);

export const TableShell = ({ head, children, foot, minW, stickyHead = true }) => React.createElement("div", {
  className: "overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm",
  style: stickyHead ? { maxHeight: "calc(100vh - 220px)", overflowY: "auto", position: "relative" } : { position: "relative" }
},
  React.createElement("table", { className: "w-full text-sm tbl-list", style: minW ? { minWidth: minW } : undefined },
    React.createElement("thead", { style: stickyHead ? { position: "sticky", top: 0, zIndex: 10 } : undefined },
      React.createElement("tr", { className: "border-b border-slate-100 bg-amber-50 text-left text-xs uppercase tracking-wide text-amber-900/60" }, head)),
    React.createElement("tbody", { className: "divide-y divide-slate-50" }, children),
    foot && React.createElement("tfoot", { style: { position: "sticky", bottom: 0, zIndex: 10 } }, foot)));

export const TabBar = ({ tabs, active, onChange }) => React.createElement("div", { className: "flex gap-1 border-b border-slate-200" },
  tabs.map(t => React.createElement("button", {
    key: t, onClick: () => onChange(t),
    className: `-mb-px whitespace-nowrap border-b-2 px-3 py-2 text-[14px] transition ${active === t ? "border-[#fed7aa] font-medium text-[#92400e]" : "border-transparent text-slate-500 hover:text-slate-700"}`
  }, t)));

export const Empty = ({ children }) => React.createElement("div", {
  className: "rounded-xl border border-dashed border-slate-200 bg-white px-6 py-10 text-center text-sm text-slate-400"
}, children);

export const IconBtn = ({ icon: Icon, title, onClick, tone = "slate" }) => React.createElement("button", {
  title, onClick,
  className: tone === "danger"
    ? "rounded-md p-1.5 transition bg-amber-100 text-[#92400e] hover:bg-amber-200"
    : `rounded-md p-1.5 transition hover:bg-slate-100 text-${tone}-500`
}, React.createElement(Icon, { className: "h-4 w-4" }));

export function DateTime({ value }) {
  if (!value) return React.createElement("span", { className: "text-slate-400" }, "");
  const parts = String(value).split(" ");
  const time = parts[0].split(":").slice(0, 2).join(":");
  const date = parts.slice(1).join(" ");
  return React.createElement("span", { className: "text-xs text-slate-500" },
    React.createElement("span", { className: "block" }, date || time),
    date ? React.createElement("span", { className: "block text-slate-400" }, time) : null);
}

/* ───────── export/print buttons ───────── */
export function exportCSV(filename, headers, rows) {
  const ws = XLSX.utils.aoa_to_sheet([headers, ...rows.map(r => r.map(v => v ?? ""))]);
  const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
  for (let R = 1; R <= range.e.r; R++) {
    for (let C = 0; C <= range.e.c; C++) {
      const cell = ws[XLSX.utils.encode_cell({r: R, c: C})];
      if (cell && typeof cell.v === 'number' && Math.abs(cell.v) >= 1000) cell.z = '#,##0';
    }
  }
  const colWidths = headers.map((h, i) => {
    const maxLen = Math.max(h.length, ...rows.map(r => String(r[i] ?? "").length));
    return { wch: Math.min(maxLen + 2, 40) };
  });
  ws['!cols'] = colWidths;
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Dữ liệu");
  XLSX.writeFile(wb, filename.replace(/\.(csv|xlsx)$/, "") + ".xlsx");
}
export const ExportBtn = ({ onClick }) => React.createElement("button", { onClick, className: greenBtn },
  React.createElement(Upload, { className: "h-4 w-4" }), " Xuất Excel");
export const PrintBtn = ({ onClick = () => window.print() }) => React.createElement("button", { onClick, className: ghostBtn },
  React.createElement(Printer, { className: "h-4 w-4" }), " In");

/* ───────── date range filter ───────── */
export function getPresetRange(preset) {
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
export const DATE_PRESETS = ["Đầu năm đến hiện tại",...Array.from({length:12},(_,i)=>`Tháng ${i+1}`)];

export function DateRangeFilter({ initFrom, initTo, onApply, compact = false }) {
  const localMonthStart = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-01`; };
  const localToday = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`; };
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
  if (compact) return React.createElement(React.Fragment, null,
    React.createElement("input", {type:"date", value:pFrom, onChange:e=>setPFrom(e.target.value), className:`${field} py-1.5 text-sm`}),
    React.createElement("span", {className:"text-slate-400 text-sm"}, "–"),
    React.createElement("input", {type:"date", value:pTo, onChange:e=>setPTo(e.target.value), className:`${field} py-1.5 text-sm`}),
    React.createElement("button", {onClick:()=>onApply(pFrom,pTo), className:"inline-flex items-center gap-1 rounded-lg border border-amber-600 bg-amber-50 px-2.5 py-1.5 text-sm font-medium text-amber-800 hover:bg-amber-100"},
      React.createElement(Search, {className:"h-3.5 w-3.5"}), "Lọc"));
  return React.createElement(React.Fragment, null,
    React.createElement("div", null,
      React.createElement("label", {className:lbl}, "Từ ngày"),
      React.createElement("input", {type:"date", value:pFrom, onChange:e=>setPFrom(e.target.value), className:field})),
    React.createElement("div", null,
      React.createElement("label", {className:lbl}, "Đến ngày"),
      React.createElement("input", {type:"date", value:pTo, onChange:e=>setPTo(e.target.value), className:field})),
    React.createElement("div", {className:"relative self-end", ref},
      React.createElement("div", {className:"flex"},
        React.createElement("button", {onClick:()=>onApply(pFrom,pTo), className:"inline-flex items-center gap-1.5 rounded-l-lg border border-r-0 border-amber-600 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-800 hover:bg-amber-100"},
          React.createElement(Search, {className:"h-4 w-4"}), "Lọc"),
        React.createElement("button", {onClick:()=>setOpen(v=>!v), className:"inline-flex items-center rounded-r-lg border border-amber-600 bg-amber-50 px-2 py-2 text-sm text-amber-800 hover:bg-amber-100"},
          React.createElement(ChevronDown, {className:"h-4 w-4"}))),
      open && React.createElement("div", {className:"absolute left-0 top-full z-50 mt-1 w-48 rounded-lg border border-slate-200 bg-white py-1 shadow-lg"},
        DATE_PRESETS.map((p,i) => React.createElement(React.Fragment, {key:p},
          i===1 && React.createElement("div", {className:"my-1 border-t border-slate-100"}),
          React.createElement("button", {
            onClick:()=>applyPreset(p),
            className:"w-full px-4 py-1.5 text-left text-sm text-slate-700 hover:bg-amber-50 hover:text-amber-800"
          }, p))))));
}

export function RangeBar({ q, setQ, placeholder = "Tìm kiếm…", from, setFrom, to, setTo, onExport, extra, noPrint }) {
  return React.createElement("div", { className: "flex flex-wrap items-end gap-2" },
    React.createElement(DateRangeFilter, { initFrom: from, initTo: to, onApply: (f, t) => { if (setFrom) setFrom(f); if (setTo) setTo(t); } }),
    setQ && React.createElement("div", { className: "min-w-[200px] flex-1" },
      React.createElement("label", { className: "mb-1 block text-[13px] font-medium text-slate-500" }, "Tìm kiếm"),
      React.createElement("input", { value: q, onChange: e => setQ(e.target.value), placeholder, className: `${field} w-full` })),
    extra,
    !noPrint && React.createElement(PrintBtn, null),
    onExport && React.createElement(ExportBtn, { onClick: onExport }));
}

/* ───────── NumInput ───────── */
export function NumInput({ value, onChange, className = inputSm, placeholder = "0", align = "right", disabled = false }) {
  const [focused, setFocused] = React.useState(false);
  const fmt = v => v === "" || v === null || v === undefined || isNaN(v) || v === 0 ? (v === 0 ? "0" : "") : num(v);
  const displayValue = focused ? (value === 0 ? "" : String(value)) : (value === 0 ? "" : fmt(value));
  return React.createElement("input", {
    inputMode: "numeric", disabled,
    className: `${className} text-${align} tabular-nums ${disabled ? "bg-slate-100 text-slate-400" : ""}`,
    value: displayValue, placeholder,
    onFocus: e => { setFocused(true); e.target.select(); },
    onBlur: () => setFocused(false),
    onChange: e => { const d = e.target.value.replace(/[^\d]/g, ""); onChange(d === "" ? 0 : parseInt(d, 10)); }
  });
}

/* ───────── ProductPicker ───────── */
export function ProductPicker({ value, products, onPick, onRequestNewProduct }) {
  const [text, setText] = useState(value || "");
  const [openList, setOpenList] = useState(false);
  React.useEffect(() => { setText(value || ""); }, [value]);
  const matches = products.filter(p => !text || `${p.name} ${p.sku}`.toLowerCase().includes(text.toLowerCase()));
  return React.createElement("div", { className: "relative" },
    React.createElement("div", { className: "relative" },
      React.createElement(Search, { className: "absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" }),
      React.createElement("input", {
        className: inputSm + " pl-8", placeholder: "Lọc / chọn sản phẩm…",
        value: text,
        onChange: e => { setText(e.target.value); setOpenList(true); onPick({ name: e.target.value }); },
        onFocus: () => setOpenList(true),
        onBlur: () => setTimeout(() => setOpenList(false), 160)
      })),
    openList && React.createElement("div", { className: "absolute z-30 mt-1 max-h-60 w-full overflow-auto rounded-lg border border-slate-200 bg-white shadow-lg" },
      matches.map(p => React.createElement("button", {
        key: p.sku, type: "button",
        onMouseDown: () => { onPick(p); setText(p.name); setOpenList(false); },
        className: "flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm hover:bg-slate-50"
      }, React.createElement("span", { className: "text-slate-800" }, p.name),
         React.createElement("span", { className: "shrink-0 text-xs tabular-nums text-slate-400" }, num(p.sale)))),
      onRequestNewProduct && React.createElement("button", {
        type: "button",
        onMouseDown: () => { setOpenList(false); onRequestNewProduct(text); },
        className: "flex w-full items-center gap-1.5 border-t border-slate-100 px-3 py-2 text-left text-sm font-medium text-blue-600 hover:bg-blue-50"
      }, React.createElement(Plus, { className: "h-4 w-4" }), " Thêm sản phẩm mới", text ? `: "${text}"` : "")));
}

/* ───────── Modal ───────── */
export const Modal = ({ title, sub, onClose, children, footer, maxW = "max-w-2xl" }) =>
  React.createElement("div", { className: "fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4", onClick: onClose },
    React.createElement("div", { className: `flex max-h-[88vh] w-full ${maxW} flex-col overflow-hidden rounded-xl bg-white shadow-xl`, onClick: e => e.stopPropagation() },
      React.createElement("div", { className: "flex items-start justify-between border-b border-slate-100 px-5 py-4" },
        React.createElement("div", null,
          React.createElement("h3", { className: "text-sm font-semibold text-slate-800" }, title),
          sub && React.createElement("p", { className: "mt-0.5 text-xs text-slate-400" }, sub)),
        React.createElement("button", { onClick: onClose, className: "rounded-md p-1 text-slate-400 hover:bg-slate-100" },
          React.createElement(X, { className: "h-4 w-4" }))),
      React.createElement("div", { className: "flex-1 overflow-auto p-5" }, children),
      React.createElement("div", { className: "flex items-center justify-end gap-2 border-t border-slate-100 px-5 py-3" }, footer)));

/* ───────── DocModal + DocLink ───────── */
export function DocModal({ doc, onClose }) {
  const kind = doc.code.startsWith("BG") ? "Báo giá"
    : doc.code.startsWith("ĐH") || doc.code.startsWith("DH") ? "Đơn hàng"
    : doc.code.startsWith("PM") || doc.code.startsWith("ĐMH") ? "Phiếu mua hàng"
    : doc.code.startsWith("PX") ? "Phiếu xuất kho"
    : doc.code.startsWith("PN") ? "Phiếu nhập kho" : "Chứng từ";
  return React.createElement(Modal, { title: `${kind} ${doc.code}`, sub: "Chứng từ gốc", onClose,
    footer: React.createElement(React.Fragment, null, React.createElement(PrintBtn, null),
      React.createElement("button", { onClick: onClose, className: ghostBtn }, "Đóng")) },
    React.createElement("div", { className: "space-y-2 text-sm" },
      Object.entries(doc.fields || {}).map(([k, v]) => React.createElement("div", { key: k, className: "flex justify-between gap-4 border-b border-slate-50 py-1.5" },
        React.createElement("span", { className: "text-slate-500" }, k),
        React.createElement("span", { className: "text-right font-medium text-slate-800" }, v))),
      doc.items && React.createElement("table", { className: "mt-3 w-full text-xs" },
        React.createElement("thead", null, React.createElement("tr", { className: "border-b border-slate-200 text-left text-slate-500" },
          React.createElement("th", { className: "py-1" }, "Sản phẩm"),
          React.createElement("th", { className: "py-1 text-right" }, "SL"),
          React.createElement("th", { className: "py-1 text-right" }, "Đơn giá"),
          React.createElement("th", { className: "py-1 text-right" }, "Thành tiền"))),
        React.createElement("tbody", null, doc.items.map((it, i) => React.createElement("tr", { key: i, className: "border-b border-slate-50" },
          React.createElement("td", { className: "py-1.5 text-slate-700" }, it.name),
          React.createElement("td", { className: "py-1.5 text-right tabular-nums" }, it.qty),
          React.createElement("td", { className: "py-1.5 text-right tabular-nums" }, num(it.price)),
          React.createElement("td", { className: "py-1.5 text-right tabular-nums" }, num(it.price * it.qty))))))));
}

export const DocLink = ({ code, onOpen, className = "" }) => React.createElement("button", {
  onClick: () => onOpen({ code, fields: { "Số chứng từ": code, "Ngày": "16/06/2026", Kho: "Kho HH" } }),
  className: `inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset bg-[#fef9f0] text-[#92400e] ring-[#b45309] ${className}`
}, code);

/* ───────── KindList (dùng trong SettingsTxnKinds) ───────── */
export function KindList({ group, list, color,
  editGroup, editIdx, editVal, onEditChange, onEditSave, onEditCancel, onStartEdit,
  addGroup, addVal, onAddChange, onConfirmAdd, onCancelAdd,
  onStartAdd, onMoveItem, onDeleteItem }) {
  return React.createElement("div", {className:"rounded-xl border border-slate-200 bg-white overflow-hidden"},
    React.createElement("div", {className:"flex items-center justify-between px-4 py-3 border-b border-slate-100"},
      React.createElement("span", {className:`text-sm font-semibold ${color}`}, group==="thu" ? "▲ Loại Thu" : "▼ Loại Chi"),
      React.createElement("button", {onClick:()=>onStartAdd(group), className:addBtn}, "+ Thêm")),
    React.createElement("table", {className:"tbl-list w-full"},
      React.createElement("tbody", null,
        list.map((k,i)=>React.createElement("tr", {key:i},
          React.createElement("td", {className:"px-4 py-2.5 text-sm text-slate-700 w-8 text-slate-400"}, i+1),
          React.createElement("td", {className:"px-2 py-2.5 text-sm font-medium text-slate-800"},
            editGroup===group && editIdx===i
              ? React.createElement("div", {className:"flex gap-2"},
                  React.createElement("input", {autoFocus:true, value:editVal, onChange:e=>onEditChange(e.target.value), onKeyDown:e=>{if(e.key==="Enter")onEditSave();if(e.key==="Escape")onEditCancel();}, className:inputF+" py-1 text-sm"}),
                  React.createElement("button", {onClick:onEditSave, className:blueBtn}, "Lưu"),
                  React.createElement("button", {onClick:onEditCancel, className:ghostBtn}, "Huỷ"))
              : k),
          React.createElement("td", {className:"px-2 py-2 text-right whitespace-nowrap"},
            React.createElement("div", {className:"flex items-center gap-1 justify-end"},
              React.createElement("button", {onClick:()=>onMoveItem(group,i,-1), disabled:i===0, className:"px-1 text-slate-400 hover:text-slate-700 disabled:opacity-20"}, "↑"),
              React.createElement("button", {onClick:()=>onMoveItem(group,i,1), disabled:i===list.length-1, className:"px-1 text-slate-400 hover:text-slate-700 disabled:opacity-20"}, "↓"),
              React.createElement("button", {onClick:()=>onStartEdit(group,i,k), className:"text-xs text-blue-600 hover:underline ml-2"}, "Sửa"),
              React.createElement("button", {onClick:()=>onDeleteItem(group,i), className:"text-xs text-red-500 hover:underline ml-1"}, "Xoá"))))),
        addGroup===group && React.createElement("tr", null,
          React.createElement("td", {colSpan:3, className:"px-4 py-2"},
            React.createElement("div", {className:"flex gap-2"},
              React.createElement("input", {autoFocus:true, value:addVal, onChange:e=>onAddChange(e.target.value), onKeyDown:e=>{if(e.key==="Enter")onConfirmAdd();if(e.key==="Escape")onCancelAdd();}, placeholder:"Tên loại giao dịch...", className:inputF+" py-1 text-sm"}),
              React.createElement("button", {onClick:onConfirmAdd, className:blueBtn}, "Thêm"),
              React.createElement("button", {onClick:onCancelAdd, className:ghostBtn}, "Huỷ")))))));
}
