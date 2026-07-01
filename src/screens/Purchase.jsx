import React, { useState, useMemo, useEffect } from 'react';
import { Plus, Save, Search, ArrowLeft, Trash2, FileText, ShoppingCart, RotateCcw, Wallet, Pencil } from 'lucide-react';
import { useCollection, saveDoc, deleteDocument, batchSave } from '../useFirestore.js';
import { db } from '../firebase.js';
import { useAuth } from '../useAuth.js';
import { useInventory, useToast, useTxns } from '../contexts.jsx';
import {
  vnd, num, calc, field, inputF, blueBtn, ghostBtn, addBtn,
  SUPPLIERS, SUP_DETAIL, parseISO, parseISOEnd, parseViDate,
  localMonthStart, localToday, impCode, purCode, expCode, lookupImportCost,
} from '../constants.js';
import {
  Th, TableShell, DateRangeFilter, PrintBtn, ExportBtn, exportCSV,
  NumInput, Modal, DocModal, Phone, Sku, Pill, RangeBar, IconBtn,
} from '../components/ui.jsx';
import { ProductForm } from './Products.jsx';
import { PhieuChiModal } from './Finance.jsx';
import { NccReturnModal } from './Products.jsx';

/* ───────── Purchase Module (list + create) ───────── */
export function PurchaseModule({onImportToWh, purchaseList: list, setPurchaseList: setList, setActive}) {
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
export function PurchaseCreate({
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
export function PurchaseList({
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
  
  const _inR = (dt, f, t) => { const d = parseViDate(dt); return (!f || d >= parseISO(f)) && (!t || d <= parseISOEnd(t)); };
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
export function WhIn({whInItems: items, setWhInItems: setItems, setWhOutItems, orders = [], setOrders, purchaseList = [], setPurchaseList, initSearch = "", onMounted, onOpenOrder}) {
  const notify = useToast();
  const { profile: _whProfile } = useAuth();
  const _staffName = _whProfile?.name || "Quản lý";
  
  const _inR = (dt, f, t) => { const d = parseViDate(dt); return (!f || d >= parseISO(f)) && (!t || d <= parseISOEnd(t)); };
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
export function WhOut({whOutItems: items, setWhOutItems: setItems, onOpenOrder}) {
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
  
  const _inR = (dt, f, t) => { const d = parseViDate(dt); return (!f || d >= parseISO(f)) && (!t || d <= parseISOEnd(t)); };
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
export function StockDetailModal({
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
export function Stock() {
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
