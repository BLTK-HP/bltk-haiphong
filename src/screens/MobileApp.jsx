import React, { useState, useEffect } from 'react';
import {
  ArrowDownToLine, ArrowLeft, ArrowLeftRight, ArrowUpFromLine, BarChart3, Bell,
  BookText, Building2, Check, CheckCircle, ChevronRight, Copy, CornerUpLeft,
  CreditCard, FileText, Home, Layers, LogOut, Package, PackageSearch, Pencil,
  Plus, Printer, ReceiptText, RefreshCw, RotateCcw, Search, ShoppingCart,
  Sparkles, Trash2, TrendingUp, Truck, Users, Wallet,
} from 'lucide-react';
import { useCollection, saveDoc } from '../useFirestore.js';
import { writeBatch, where } from 'firebase/firestore';
import { getMessaging, getToken } from 'firebase/messaging';
import { db } from '../firebase.js';
import { useAuth } from '../useAuth.js';
import { useToast } from '../contexts.jsx';
import PRODUCTS from '../products.js';
import { vnd, calc, field, inputF, blueBtn, ghostBtn, addBtn, parseViDate, localToday, localMonthStart } from '../constants.js';
import { Modal, NumInput, Phone, Sku, Pill, StatCard, Card, Th, TableShell } from '../components/ui.jsx';
import { openPrint } from './Sales.jsx';
import { deleteOrderCascade } from '../orderUtils.js';

export function useIsMobile() {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);
  return isMobile;
}

/* ───────── Mobile App ───────── */
export function MobileApp({ profile, logout }) {
  const isAdmin = profile?.role === "admin";
  const [tab, setTab] = useState("orders");
  const [orders] = useCollection("orders");
  const [prodsFS] = useCollection("products");
  const [settingsFS] = useCollection("settings");
  const [txnsFS] = useCollection("txns", [], [where("year","==",2026)]);
  const [whInFS] = useCollection("wh_in");
  const [purchaseList] = useCollection("purchases");
  const [homeFrom, setHomeFrom] = useState(localMonthStart);
  const [homeTo, setHomeTo] = useState(localToday);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [productForm, setProductForm] = useState(null);
  const [savingProd, setSavingProd] = useState(false);
  const BLANK_FORM = {name:"",phone:"",addr:"",note:"",items:[]};
  const cfReducer = (s, a) => {
    switch(a.t) {
      case "F":    return {...s, [a.k]: a.v};
      case "FILL": return {name:a.name||"", phone:a.phone||"", addr:a.addr||"", note:a.note||"", items:a.items||[]};
      case "CUST": return {...s, phone:a.phone, name:a.name, addr:a.addr};
      case "ADD":  return {...s, items:[...s.items, a.item]};
      case "UPD":  return {...s, items:s.items.map((it,i)=>i===a.idx?{...it,[a.k]:a.v}:it)};
      case "DEL":  return {...s, items:s.items.filter((_,i)=>i!==a.idx)};
      case "RESET":return BLANK_FORM;
      default: return s;
    }
  };
  const [createForm, cfDispatch] = React.useReducer(cfReducer, BLANK_FORM);
  const [showMobPhoneSug, setShowMobPhoneSug] = useState(false);
  const mobPhoneSuggestions = React.useMemo(() => {
    const q = createForm.phone.trim();
    if (q.length < 4) return [];
    const seen = new Set();
    return orders.filter(o => o.phone && o.phone.includes(q) && !seen.has(o.phone) && seen.add(o.phone)).slice(0, 5).map(o => ({phone: o.phone, name: o.name, addr: o.addr||""}));
  }, [createForm.phone, orders]);
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
  /* ScreenReport state — hoisted để tránh vi phạm Rules of Hooks */
  const [rTab,      setRTab]      = useState("sales");
  const [rFrom,     setRFrom]     = useState(localMonthStart);
  const [rTo,       setRTo]       = useState(localToday);
  const [rSpQ,      setRSpQ]      = useState("");
  const [rNvFilter, setRNvFilter] = useState("Tất cả");
  const [rExpanded, setRExpanded] = useState(new Set());
  const [rSalePage, setRSalePage] = useState(1);
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
      cfDispatch({t:"RESET"});
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
    cfDispatch({t:"RESET"});
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
      setEditingOrderId(null); cfDispatch({t:"RESET"});
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
    cfDispatch({t:"RESET"});
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
      const { _id: _rid2, ...draftClean } = draft;
      const batch = writeBatch(db);
      const clean1 = JSON.parse(JSON.stringify({ ...rest, id: dhId, draft: false }));
      const clean2 = JSON.parse(JSON.stringify({ ...draftClean, draftStatus:"Đã tạo đơn hàng", linkedOrderId: dhId }));
      batch.set(fsDoc(db, "orders", String(dhId)), clean1);
      batch.set(fsDoc(db, "orders", String(draftDocId)), clean2);
      await batch.commit();
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
    cfDispatch({t:"FILL",name:o.name,phone:o.phone,addr:o.addr,note:o.note,items:o.items});
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
  const sortedOrders = React.useMemo(() => sortByDate(orders), [orders]);
  const visibleOrders = React.useMemo(() => sortedOrders.filter(o => !o.draft && matchSearch(o, orderSearch)), [sortedOrders, orderSearch]);
  const visibleQuotes = React.useMemo(() => sortedOrders.filter(o => o.draft && matchSearch(o, quoteSearch)), [sortedOrders, quoteSearch]);

  /* ── Màn hình Báo cáo (admin) ── */
  const ScreenReport = () => {
    const spQ = rSpQ; const setSpQ = setRSpQ;
    const nvFilter = rNvFilter; const setNvFilter = setRNvFilter;
    const expanded = rExpanded; const setExpanded = setRExpanded;
    const whInItems = whInFS || [];

    const inR = dt => { const d = parseViDate(dt); return (!rFrom || d >= parseISO(rFrom)) && (!rTo || d <= parseISOEnd(rTo)); };
    const cpbhOf = o => (o.compCosts||[]).filter(x=>["Chi phí Ship hàng","Chi phí hoa hồng","Chi phí lắp đặt"].includes(x.type)).reduce((s,x)=>s+(x.amount||0),0) + (o.importExpense||0) + (o.expense||0);
    const activeOrders = orders.filter(o => !o.draft && o.orderStatus !== "Huỷ" && o.orderStatus !== "Hủy" && inR(o.dt));

    const dtInput = (val, onChange) => React.createElement("input", {type:"date", value:val, onChange:e=>onChange(e.target.value),
      style:{fontSize:'16px'}, className:"flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-[#fed7aa] focus:outline-none"});

    const kpiCard = (label, value, color) => React.createElement("div", {className:"bg-white rounded-xl border border-slate-200 p-3 flex flex-col gap-1"},
      React.createElement("div", {className:"text-[10px] font-semibold uppercase tracking-wide text-slate-400"}, label),
      React.createElement("div", {className:`text-base font-bold tabular-nums ${color||"text-slate-800"}`}, value));

    /* ── Bán hàng ── */
    const SaleTab = () => {
      const PAGE = 20;
      const rows = activeOrders.map(o => {
        const c = calc(o); const cpbh = cpbhOf(o); const lai = c.total - c.totalCost - cpbh;
        return {...o, _c:c, _cpbh:cpbh, _lai:lai, _pct:c.total?(lai/c.total*100).toFixed(1):"0.0", _dt:String(o.dt||"").split(" ").find(p=>p.includes("/"))||""};
      });
      const totRevenue = rows.reduce((s,o)=>s+o._c.total,0);
      const totLai     = rows.reduce((s,o)=>s+o._lai,0);
      const totPaid    = rows.reduce((s,o)=>s+(o.paid||0),0);
      const totRem     = rows.reduce((s,o)=>s+Math.max(0,o._c.remaining),0);
      const totalPages = Math.max(1, Math.ceil(rows.length / PAGE));
      const page = Math.min(rSalePage, totalPages);
      const pageRows = rows.slice((page-1)*PAGE, page*PAGE);
      const Pager = () => totalPages <= 1 ? null : React.createElement("div",{className:"flex items-center justify-center gap-1 mt-3 flex-wrap"},
        React.createElement("button",{onClick:()=>setRSalePage(p=>Math.max(1,p-1)),disabled:page===1,
          className:"px-2.5 py-1 rounded-lg text-sm border border-slate-200 disabled:opacity-30 active:bg-slate-100"},"←"),
        [...Array(totalPages)].map((_,i)=>React.createElement("button",{key:i,onClick:()=>setRSalePage(i+1),
          className:`px-2.5 py-1 rounded-lg text-sm font-medium ${page===i+1?"bg-[#92400e] text-white border border-[#92400e]":"border border-slate-200 text-slate-600 active:bg-slate-100"}`},i+1)),
        React.createElement("button",{onClick:()=>setRSalePage(p=>Math.min(totalPages,p+1)),disabled:page===totalPages,
          className:"px-2.5 py-1 rounded-lg text-sm border border-slate-200 disabled:opacity-30 active:bg-slate-100"},"→"));
      return React.createElement(React.Fragment, null,
        React.createElement("div", {className:"grid grid-cols-2 gap-2 mb-3"},
          kpiCard("Doanh thu", num(totRevenue)+"đ", "text-[#047857]"),
          kpiCard("Lợi nhuận", num(totLai)+"đ", totLai>=0?"text-[#047857]":"text-[#B91C1C]"),
          kpiCard("Đã thu", num(totPaid)+"đ", "text-[#92400e]"),
          kpiCard("Còn lại", totRem>0?num(totRem)+"đ":"—", totRem>0?"text-[#B91C1C]":"text-slate-300")),
        rows.length === 0
          ? React.createElement("div", {className:"text-center py-10 text-slate-400 text-sm"}, "Không có đơn hàng trong kỳ")
          : React.createElement(React.Fragment, null,
              React.createElement("div",{className:"text-xs text-slate-400 mb-2 text-right"},
                rows.length+" đơn"+(totalPages>1?" · Trang "+page+"/"+totalPages:"")),
              React.createElement("div", {className:"space-y-2"},
                pageRows.map(o => React.createElement("div", {key:o.id, className:"bg-white rounded-xl border border-slate-200 p-3"},
                  React.createElement("div", {className:"flex items-center justify-between mb-1"},
                    React.createElement("span", {className:"text-xs font-semibold text-[#92400e] bg-[#ffedd5] px-2 py-0.5 rounded-full"}, o.id),
                    React.createElement("span", {className:"text-xs text-slate-400"}, o._dt.replace(",",""))),
                  React.createElement("div", {className:"text-sm font-medium text-slate-800 mb-2"}, o.name),
                  React.createElement("div", {className:"grid grid-cols-2 gap-x-4 gap-y-1 text-xs"},
                    React.createElement("div", {className:"flex justify-between"}, React.createElement("span",{className:"text-slate-400"},"Doanh thu"), React.createElement("span",{className:"tabular-nums font-medium"},num(o._c.total)+"đ")),
                    React.createElement("div", {className:"flex justify-between"}, React.createElement("span",{className:"text-slate-400"},"Lợi nhuận"), React.createElement("span",{className:`tabular-nums font-medium ${o._lai>=0?"text-[#047857]":"text-[#B91C1C]"}`},num(o._lai)+"đ ("+o._pct+"%)")),
                    React.createElement("div", {className:"flex justify-between"}, React.createElement("span",{className:"text-slate-400"},"Đã thu"), React.createElement("span",{className:"tabular-nums text-[#92400e]"},num(o.paid||0)+"đ")),
                    o._c.remaining>0 && React.createElement("div", {className:"flex justify-between"}, React.createElement("span",{className:"text-slate-400"},"Còn lại"), React.createElement("span",{className:"tabular-nums text-[#B91C1C] font-medium"},num(o._c.remaining)+"đ")))))),
              Pager()));
    };

    /* ── Sản phẩm đặt hàng ── */
    const SpTab = () => {
      const map = {};
      activeOrders.forEach(o => { (o.items||[]).forEach(it => {
        if (!it.name) return;
        if (!map[it.name]) map[it.name] = {prod:it.name, unit:it.unit||"", ordered:0, refs:[]};
        map[it.name].ordered += it.qty||0;
        map[it.name].refs.push({id:o.id, cust:o.name||"", qty:it.qty||0, dt:o.dt, status:o.orderStatus||""});
      }); });
      const allRows = Object.values(map).map(r=>({...r, stock:stockOfLive(r.prod, whInItems)})).sort((a,b)=>b.ordered-a.ordered);
      const rows = allRows.filter(r=>!spQ||r.prod.toLowerCase().includes(spQ.toLowerCase()));
      const toggle = k => setExpanded(s=>{const n=new Set(s); n.has(k)?n.delete(k):n.add(k); return n;});
      return React.createElement(React.Fragment, null,
        React.createElement("input", {value:spQ, onChange:e=>setSpQ(e.target.value), placeholder:"Tìm tên sản phẩm…",
          style:{fontSize:'16px'}, className:"w-full mb-3 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-[#fed7aa] focus:outline-none"}),
        rows.length===0
          ? React.createElement("div",{className:"text-center py-10 text-slate-400 text-sm"},"Không có dữ liệu")
          : React.createElement("div",{className:"space-y-2"},
              rows.map(r=>{
                const need=Math.max(0,r.ordered-r.stock); const isOpen=expanded.has(r.prod);
                return React.createElement("div",{key:r.prod, className:"bg-white rounded-xl border border-slate-200 overflow-hidden"},
                  React.createElement("div",{className:"p-3"},
                    React.createElement("div",{className:"flex items-start justify-between gap-2 mb-2"},
                      React.createElement("span",{className:"text-sm font-medium text-slate-800 leading-snug"},r.prod),
                      r.unit && React.createElement("span",{className:"text-xs text-slate-400 shrink-0"},r.unit)),
                    React.createElement("div",{className:"grid grid-cols-3 gap-2 text-xs mb-2"},
                      React.createElement("div",{className:"text-center"},React.createElement("div",{className:"font-bold text-slate-700 text-base tabular-nums"},r.ordered),React.createElement("div",{className:"text-slate-400"},"Đang đặt")),
                      React.createElement("div",{className:"text-center"},React.createElement("div",{className:`font-bold text-base tabular-nums ${r.stock>0?"text-[#047857]":"text-slate-300"}`},r.stock),React.createElement("div",{className:"text-slate-400"},"Tồn kho")),
                      React.createElement("div",{className:"text-center"},React.createElement("div",{className:`font-bold text-base tabular-nums ${need>0?"text-[#B91C1C]":"text-slate-300"}`},need>0?need:"—"),React.createElement("div",{className:"text-slate-400"},"Cần mua"))),
                    React.createElement("button",{onClick:()=>toggle(r.prod), className:"flex items-center gap-1 text-xs text-slate-500"},
                      React.createElement("span",{className:"font-medium"},r.refs.length+" đơn hàng"),
                      React.createElement(isOpen?ChevronDown:ChevronRight,{className:"h-3.5 w-3.5"}))),
                  isOpen && React.createElement("div",{className:"border-t border-orange-100 bg-orange-50/30 px-3 py-2 space-y-1.5"},
                    r.refs.map((ref,ri)=>React.createElement("div",{key:ri, className:"flex items-center justify-between text-xs"},
                      React.createElement("span",{className:"font-medium text-[#92400e]"},ref.id),
                      React.createElement("span",{className:"text-slate-600 flex-1 mx-2 truncate"},ref.cust),
                      React.createElement("span",{className:"text-slate-400"},"×"+ref.qty)))));
              })));
    };

    /* ── Nhân viên ── */
    const NvTab = () => {
      const staffNames = [...new Set(activeOrders.map(o=>o.staff).filter(Boolean))].sort();
      const filtered = nvFilter==="Tất cả" ? activeOrders : activeOrders.filter(o=>o.staff===nvFilter);
      const map = {};
      filtered.forEach(o=>{
        const s = o.staff||"Chưa phân công";
        if (!map[s]) map[s]={name:s, orders:0, custs:new Set(), rev:0, returned:0, paid:0};
        const c=calc(o); map[s].orders+=1; map[s].custs.add(o.name||""); map[s].rev+=c.total;
        map[s].returned+=(o.returns||[]).reduce((x,r)=>x+(r.amount||0),0); map[s].paid+=o.paid||0;
      });
      const data = Object.values(map).map(s=>({...s, custs:s.custs.size, remain:s.rev-s.paid})).sort((a,b)=>b.rev-a.rev);
      const totals = data.reduce((acc,s)=>({orders:acc.orders+s.orders, rev:acc.rev+s.rev, paid:acc.paid+s.paid, remain:acc.remain+s.remain}),{orders:0,rev:0,paid:0,remain:0});
      return React.createElement(React.Fragment, null,
        React.createElement("select",{value:nvFilter, onChange:e=>setNvFilter(e.target.value),
          style:{fontSize:'16px'}, className:"w-full mb-3 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-[#fed7aa] focus:outline-none"},
          React.createElement("option",null,"Tất cả"),
          staffNames.map(s=>React.createElement("option",{key:s},s))),
        data.length>0 && React.createElement("div",{className:"grid grid-cols-3 gap-2 mb-3"},
          kpiCard("Số đơn", totals.orders, "text-slate-700"),
          kpiCard("Doanh thu", num(totals.rev)+"đ", "text-[#047857]"),
          kpiCard("Còn lại", totals.remain>0?num(totals.remain)+"đ":"—", totals.remain>0?"text-[#B91C1C]":"text-slate-300")),
        data.length===0
          ? React.createElement("div",{className:"text-center py-10 text-slate-400 text-sm"},"Không có dữ liệu")
          : React.createElement("div",{className:"space-y-2"},
              data.map(s=>React.createElement("div",{key:s.name, className:"bg-white rounded-xl border border-slate-200 p-3"},
                React.createElement("div",{className:"flex items-center justify-between mb-2"},
                  React.createElement("span",{className:"font-semibold text-slate-800"},s.name),
                  React.createElement("span",{className:"text-xs text-slate-400"},s.orders+" đơn · "+s.custs+" khách")),
                React.createElement("div",{className:"grid grid-cols-2 gap-x-4 gap-y-1 text-xs"},
                  React.createElement("div",{className:"flex justify-between"},React.createElement("span",{className:"text-slate-400"},"Doanh thu"),React.createElement("span",{className:"tabular-nums font-medium text-[#047857]"},num(s.rev)+"đ")),
                  React.createElement("div",{className:"flex justify-between"},React.createElement("span",{className:"text-slate-400"},"Đã thu"),React.createElement("span",{className:"tabular-nums text-[#92400e]"},num(s.paid)+"đ")),
                  s.returned>0 && React.createElement("div",{className:"flex justify-between"},React.createElement("span",{className:"text-slate-400"},"Hoàn hàng"),React.createElement("span",{className:"tabular-nums text-amber-600"},num(s.returned)+"đ")),
                  s.remain>0 && React.createElement("div",{className:"flex justify-between"},React.createElement("span",{className:"text-slate-400"},"Còn lại"),React.createElement("span",{className:"tabular-nums text-[#B91C1C] font-medium"},num(s.remain)+"đ")))))));
    };

    const subTabs = [{key:"sales",label:"Bán hàng"},{key:"products",label:"Sản phẩm"},{key:"staff",label:"Nhân viên"}];
    return React.createElement("div",{className:"flex-1 overflow-y-auto"},
      React.createElement("div",{className:"p-4 space-y-3"},
        React.createElement("div",{className:"flex items-center gap-2"},
          dtInput(rFrom, v=>{setRFrom(v); setRSalePage(1);}),
          React.createElement("span",{className:"text-slate-400 text-sm shrink-0"},"→"),
          dtInput(rTo, v=>{setRTo(v); setRSalePage(1);})),
        React.createElement("div",{className:"flex rounded-xl overflow-hidden border border-[#fed7aa] bg-[#ffedd5]"},
          subTabs.map(t=>React.createElement("button",{key:t.key, onClick:()=>{setRTab(t.key); setRSalePage(1);},
            className:`flex-1 py-2 text-xs font-semibold transition-colors ${rTab===t.key?"bg-[#92400e] text-white":"text-[#92400e]"}`},
            t.label))),
        rTab==="sales"    ? SaleTab()
          : rTab==="products" ? SpTab()
          : NvTab()));
  };

  const tabs = [
    { key:"create",   icon: React.createElement(Plus,      {className:"h-6 w-6"}), label:"Tạo đơn", fab: true },
    { key:"orders",   icon: React.createElement(BookText,  {className:"h-5 w-5"}), label:"Đơn hàng" },
    { key:"quotes",   icon: React.createElement(FileText,  {className:"h-5 w-5"}), label:"Báo giá" },
    { key:"products", icon: React.createElement(Package,   {className:"h-5 w-5"}), label:"Sản phẩm" },
    ...(isAdmin ? [{ key:"report", icon: React.createElement(BarChart3, {className:"h-5 w-5"}), label:"Báo cáo" }] : []),
  ];

  const deliveryColor = s => s==="Đã giao hàng"?"bg-green-100 text-green-700":"bg-orange-100 text-orange-700";

  /* ── Màn hình Tổng quan ── */
  const ScreenHome = () => {
    const parseD = s => { if(!s)return new Date(0); const p=String(s).split(' ')[0].split('/'); return p.length===3?new Date(+p[2],+p[1]-1,+p[0]):new Date(s); };
    const fromD = homeFrom ? parseISO(homeFrom) : null;
    const toD   = homeTo   ? parseISOEnd(homeTo) : null;
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
    const baseProd = prodsFS.length ? prodsFS : PRODUCTS;
    const enriched = baseProd.map(p => ({ ...p, img: skuImg[p.sku||p._id] || null }));
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
            q ? filtered.length+"/"+baseProd.length+" sản phẩm" : "Hiện "+visible.length+"/"+baseProd.length+" — tìm kiếm để lọc nhanh"),
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
    const pickerBase = prodsFS.length ? prodsFS : PRODUCTS;
    const pickerProds = pickerBase.filter(p => !pickerQ ||
      (p.name+p.sku).toLowerCase().includes(pickerQ.toLowerCase())).slice(0, 30);
    const addItem = (p) => {
      cfDispatch({t:"ADD", item:{sku:p.sku, name:p.name, qty:1, price:p.sale||0}});
      setShowPicker(false); setPickerQ("");
    };
    const updItem = (idx, key, val) => cfDispatch({t:"UPD", idx, k:key, v:parseInt(val)||0});
    const delItem = (idx) => cfDispatch({t:"DEL", idx});
    const subtotal = createForm.items.reduce((s,it)=>s+(Number(it.price)||0)*(Number(it.qty)||0),0);
    return React.createElement("div", {className:"flex-1 flex flex-col overflow-hidden"},
      React.createElement("div", {className:"shrink-0 flex items-center justify-between px-4 py-2.5 bg-white border-b border-slate-200"},
        React.createElement("span", {className:"font-semibold text-slate-700 text-sm"}, editingOrderId ? "Sửa đơn "+editingOrderId : "Tạo đơn mới"),
        React.createElement("button", {
          onClick:()=>{ cfDispatch({t:"RESET"}); if (editingOrderRef) { setSelectedOrder(editingOrderRef); setTab(editingOrderRef.draft ? "quotes" : "orders"); } else { setTab("orders"); } setEditingOrderId(null); setEditingOrderRef(null); },
          className:"text-slate-400 active:text-slate-600"},
          React.createElement(X, {className:"h-5 w-5"}))),
      React.createElement("div", {className:"flex-1 overflow-y-auto"},
        React.createElement("div", {className:"p-4 space-y-4 pb-32"},
          React.createElement("div", null,
            React.createElement("div", {className:"text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2"}, "Khách hàng"),
            React.createElement("div", {className:"space-y-2"},
              React.createElement("input", {value:createForm.name, onChange:e=>cfDispatch({t:"F",k:"name",v:e.target.value}),
                placeholder:"Tên khách hàng *",
                style:{fontSize:'16px'},
                className:"w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm focus:border-[#fed7aa] focus:outline-none"}),
              React.createElement("div", {className:"relative"},
                React.createElement("input", {value:createForm.phone, onChange:e=>{ cfDispatch({t:"F",k:"phone",v:e.target.value}); setShowMobPhoneSug(true); },
                  onFocus:()=>setShowMobPhoneSug(true),
                  onBlur:()=>setTimeout(()=>setShowMobPhoneSug(false),150),
                  placeholder:"Số điện thoại", type:"tel",
                  style:{fontSize:'16px'},
                  className:"w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm focus:border-[#fed7aa] focus:outline-none"}),
                showMobPhoneSug && mobPhoneSuggestions.length > 0 && React.createElement("ul", {className:"absolute z-30 mt-1 w-full rounded-xl border border-slate-200 bg-white shadow-lg text-sm overflow-hidden"},
                  mobPhoneSuggestions.map((s,i) => React.createElement("li", {key:i},
                    React.createElement("button", {
                      onMouseDown:()=>{ cfDispatch({t:"CUST",phone:s.phone,name:s.name,addr:s.addr}); setShowMobPhoneSug(false); },
                      className:"flex w-full flex-col px-3 py-2.5 text-left active:bg-[#fef9f0] border-b border-slate-100 last:border-0"},
                      React.createElement("span", {className:"font-medium text-slate-800"}, s.phone, React.createElement("span", {className:"ml-2 text-[#92400e]"}, s.name)),
                      s.addr && React.createElement("span", {className:"text-xs text-slate-400 truncate block"}, s.addr)))))),
              React.createElement("input", {value:createForm.addr, onChange:e=>cfDispatch({t:"F",k:"addr",v:e.target.value}),
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
            React.createElement("textarea", {value:createForm.note, onChange:e=>cfDispatch({t:"F",k:"note",v:e.target.value}),
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
    tab==="home" ? (isAdmin ? ScreenHome() : ScreenOrders()) : tab==="orders" ? ScreenOrders() : tab==="quotes" ? ScreenQuotes() : tab==="create" ? ScreenCreate() : tab==="report" ? ScreenReport() : ScreenProducts(),
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


