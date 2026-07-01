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


/* ───────── ErrorBoundary ───────── */
class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { err: null }; }
  static getDerivedStateFromError(err) { return { err }; }
  componentDidCatch(err, info) { console.error("[ErrorBoundary]", err, info); }
  render() {
    if (this.state.err) return React.createElement("div", {
      className: "flex flex-col items-center justify-center h-64 gap-3 text-slate-500"
    },
      React.createElement("p", { className: "text-base font-semibold text-[#B91C1C]" }, "Màn hình gặp lỗi"),
      React.createElement("p", { className: "text-sm text-slate-400" }, String(this.state.err.message || this.state.err)),
      React.createElement("button", {
        onClick: () => this.setState({ err: null }),
        className: "mt-2 rounded-lg border border-slate-200 px-4 py-1.5 text-sm hover:bg-slate-50"
      }, "Thử lại")
    );
    return this.props.children;
  }
}

/* ── imports từ các file đã tách ── */
import {
  vnd, num, TEXT_CELL, fmtPhone, vndShort,
  localToday, localMonthStart, parseISO, parseISOEnd, parseViDate,
  CHANNELS, ORDER_STATUS, ORDER_TABS, PAY_STATUS, KHO_STATUS,
  DELIVERY, normalizeDelivery, TIERS, PAY_NCC, APPROVE,
  C_THU, C_CHI,
  mkOrder, INIT_ORDERS, calc,
  CUSTOMERS, SUPPLIER_COSTS, lookupImportCost, SUPPLIERS,
  SUP_DETAIL, IMPORTS, RETURNS, ACCOUNTS_DEF, TXNS, CASHFLOW,
  STAFF_RANK, SALES_BY_DAY, EXPORTS, CUST_DEBT, CUST_DEBT_DETAIL, PREORDER,
  LABELS,
  field, inputF, inputSm, blueBtn, greenBtn, addBtn, ghostBtn, outlineTealBtn, backBtn,
  yr2, fmtDocId, txnDocId, purCode, impCode, expCode,
  stockOfStatic, stockOfLive,
} from './constants.js';
import {
  SupplierCostsCtx, useSupplierCosts,
  INIT_BANK_ACCOUNTS,
  BankCtx, useBankAccounts,
  DEFAULT_THU_KINDS, DEFAULT_CHI_KINDS,
  TxnKindsCtx, useTxnKinds,
  TxnCtx, useTxns,
  InvCtx, useInventory,
  DocNumCtx, useDocNum,
  ToastCtx, useToast, ToastHost,
} from './contexts.jsx';
import { NAV } from './nav.js';
import {
  Phone, Sku, Pill, StatCard, Card, Th, TableShell, TabBar, Empty, IconBtn,
  DateTime, exportCSV, ExportBtn, PrintBtn,
  getPresetRange, DATE_PRESETS, DateRangeFilter, RangeBar,
  NumInput, ProductPicker,
  Modal, DocModal, DocLink,
  KindList,
} from './components/ui.jsx';
import { ReportSales, ReportPreorder, ReportStaff } from './screens/Reports.jsx';
import {
  SettingsTxnKinds, SettingsSupplierCosts, SettingsPayment, SettingsNumFormat,
  SettingsDocNum, SettingsPrint, AdminClearData, LoginScreen, UsersTab,
} from './screens/Settings.jsx';
import {
  HuyGiaoDichModal, PhieuThuModal, PhieuChiModal, ChuyenTienModal,
  EditTxnModal, ReconcileBtn, DeliverySlipModal, Finance,
} from './screens/Finance.jsx';
import {
  ImageUploader, ProductForm, ProductsTab,
  CustomerForm, CustomersTab,
  SupplierForm, Suppliers,
  DebtCust, CustDebtDetail,
  DebtNcc, NccReturnModal, NccDebtDetail,
} from './screens/Products.jsx';
import {
  PurchaseModule, PurchaseCreate, PurchaseList,
  WhIn, WhOut, StockDetailModal, Stock,
} from './screens/Purchase.jsx';
import {
  BatchKhoModal, SalesModule, PaymentModal, KhoModal, ReturnModal,
  OrderTable, DraftTable, CreateOrder, Returns,
  numToWordVN, buildPrintHTML, openPrint, numToWordsVN, printContract, exportContractWord,
} from './screens/Sales.jsx';
import { Contracts } from './screens/Contracts.jsx';
import { Dashboard } from './screens/Dashboard.jsx';
import { useIsMobile, MobileApp } from './screens/MobileApp.jsx';

/* ───────── Screen router ───────── */
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
export { deleteOrderCascade } from './orderUtils.js';

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
    const toWrite  = Object.entries(nextMap).filter(([id,o]) => JSON.stringify(prevMap[id]) !== JSON.stringify(o));
    const toDelete = Object.keys(prevMap).filter(id => !nextMap[id]);
    if (!toWrite.length && !toDelete.length) return;
    const ops = [...toWrite.map(([id,o])=>({t:'s',id,o})), ...toDelete.map(id=>({t:'d',id}))];
    for (let i = 0; i < ops.length; i += 500) {
      const b = writeBatch(db);
      ops.slice(i, i+500).forEach(op => {
        if (op.t === 's') {
          const clean = JSON.parse(JSON.stringify(op.o));
          // Giữ nguyên logic saveDoc: tự thêm year nếu có date nhưng chưa có year
          if (clean.date && !clean.year) {
            const m = String(clean.date).match(/(\d{2})\/(\d{2})\/(\d{4})/);
            if (m) clean.year = parseInt(m[3], 10);
            else { const m2 = String(clean.date).match(/^(\d{4})-/); if (m2) clean.year = parseInt(m2[1], 10); }
          }
          b.set(fsDoc(db, colName, String(op.id)), clean);
        } else {
          b.delete(fsDoc(db, colName, String(op.id)));
        }
      });
      b.commit().catch(err => console.error(`[syncFS] ${colName}`, err));
    }
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
    : /*#__PURE__*/React.createElement(ErrorBoundary, {key: active},
        /*#__PURE__*/React.createElement(Screen, {
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
        }))))))))))))
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
