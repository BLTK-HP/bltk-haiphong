import React, { useState, useMemo, useEffect } from 'react';
import { ArrowLeft, Check, ChevronDown, Pencil, Plus, Printer, RotateCcw, Save, Search, ShoppingCart, Truck } from 'lucide-react';
import { useCollection } from '../useFirestore.js';
import { db } from '../firebase.js';
import { useAuth } from '../useAuth.js';
import { useInventory, useToast, useTxns, useDocNum, useBankAccounts, useSupplierCosts } from '../contexts.jsx';
import PRODUCTS from '../products.js';
import {
  vnd, vndShort, calc, field, inputF, blueBtn, ghostBtn, addBtn, outlineTealBtn, backBtn,
  parseISO, parseViDate, localMonthStart, localToday, fmtDocId,
  ORDER_STATUS, ORDER_TABS, PAY_STATUS, KHO_STATUS, DELIVERY, normalizeDelivery,
  TIERS, PAY_NCC, APPROVE, C_THU, C_CHI, mkOrder, INIT_ORDERS, CUSTOMERS,
  CHANNELS, STAFF_RANK, LABELS, RETURNS, lookupImportCost,
} from '../constants.js';
import { deleteOrderCascade } from '../orderUtils.js';
import {
  Th, TableShell, TabBar, Card, DateRangeFilter, PrintBtn, ExportBtn, exportCSV,
  NumInput, ProductPicker, Modal, DocModal, DocLink, Phone, Sku, Pill, StatCard, IconBtn, Empty,
  DateTime, getPresetRange, DATE_PRESETS, RangeBar,
} from '../components/ui.jsx';

/* ───────── Batch Kho Modal ───────── */
export function BatchKhoModal({ orders, onClose, onConfirm }) {
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
export function SalesModule({
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
export function PaymentModal({
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

const skuOf = name => {
  const p = PRODUCTS.find(x => x.name === name);
  return p ? p.sku : "";
};
export function KhoModal({ order, onClose, onConfirm, onGoToWhIn, initTab }) {
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
export function ReturnModal({
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
export function OrderTable({
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
export function DraftTable({
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
  
  const _inR = (dt, f, t) => { const d = parseViDate(dt); return (!f || d >= parseISO(f)) && (!t || d <= parseISOEnd(t)); };
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
export function numToWordVN(amount) {
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

export function buildPrintHTML(order, type, cfg, products) {
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

export function openPrint(order, type, cfg, products) {
  const w = window.open("", "_blank");
  if (!w) { alert("Vui lòng cho phép mở cửa sổ mới (popup) trong trình duyệt"); return; }
  w.document.write(buildPrintHTML(order, type, cfg, products));
  w.document.close();
  w.document.title = order.id || "";
  w.focus();
}

export function numToWordsVN(n) {
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

export function printContract(form, items, totalValue) {
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

export function exportContractWord(form, items, totalValue) {
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

export function CreateOrder({
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
export function Returns() {
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
