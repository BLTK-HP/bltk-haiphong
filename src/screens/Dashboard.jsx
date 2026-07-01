import React from 'react';
import {
  ArrowDownToLine, ArrowLeftRight, ArrowUpFromLine, Building2, ChevronRight,
  CornerUpLeft, CreditCard, FileText, Layers, Package, PackageSearch,
  ReceiptText, RefreshCw, RotateCcw, ShoppingCart, Sparkles, TrendingUp,
  Truck, Users, Wallet,
} from 'lucide-react';
import { useInventory, useBankAccounts, useTxns } from '../contexts.jsx';
import { vnd, num, calc, localToday } from '../constants.js';
import { Card, DateRangeFilter } from '../components/ui.jsx';

export function Dashboard({ orders = [], purchaseList = [], onOpenOrder }) {
  const { txns = [] }         = useTxns()         || {};
  const { bankAccounts = [] } = useBankAccounts() || {};
  const { whInItems = [] }    = useInventory()    || {};

  const [showRetList, setShowRetList] = useState(false);

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

  const plMap = React.useMemo(() => {
    const m = {};
    purchaseList.forEach(r => { m[r.lot + "__" + r.prod] = r; });
    return m;
  }, [purchaseList]);

  const allActive = React.useMemo(() =>
    orders.filter(o => !o.draft && o.orderStatus !== 'Huỷ' && o.orderStatus !== 'Hủy'),
    [orders]
  );
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

  // ── GIAO DỊCH HÀNG HOÁ (theo kỳ đã chọn) ──────────────────────────────────
  const deliveredOrders = fOrders.filter(o => o.deliveryConfirmed || o.exported);
  const depositOrders   = fOrders.filter(o => !o.deliveryConfirmed && !o.exported && (o.paid||0) > 0);
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
  const { custDebtList, totalCustDebt, nccDebtList, totalNccDebt } = React.useMemo(() => {
    const custDebt = {};
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

    return { custDebtList, totalCustDebt, nccDebtList, totalNccDebt };
  }, [allActive, whInItems, plMap]);

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

  // ── LỢI NHUẬN (Accrual) — theo kỳ đã chọn ───────────────────────────────
  const expOrders         = fOrders.filter(o => o.deliveryConfirmed || o.exported);
  const pendingOrders     = fOrders.filter(o => !o.deliveryConfirmed && !o.exported);
  const accrualRev        = expOrders.reduce((s,o) => s + calc(o).total, 0);
  const accrualCOGS       = expOrders.reduce((s,o) => s + calc(o).totalCost, 0);
  const accrualShip       = expOrders.reduce((s,o) => s + (o.importExpense||0), 0);
  const accrualExp        = expOrders.reduce((s,o) => s + (o.expense||0), 0);
  const accrualCompShip   = expOrders.reduce((s,o) => s + (o.compCosts||[]).filter(c=>c.type==="Chi phí Ship hàng").reduce((cs,c)=>cs+(c.amount||0),0), 0);
  const accrualCompComm   = expOrders.reduce((s,o) => s + (o.compCosts||[]).filter(c=>c.type==="Chi phí hoa hồng").reduce((cs,c)=>cs+(c.amount||0),0), 0);
  const accrualCompInst   = expOrders.reduce((s,o) => s + (o.compCosts||[]).filter(c=>c.type==="Chi phí lắp đặt").reduce((cs,c)=>cs+(c.amount||0),0), 0);
  const accrualCPBH       = accrualShip + accrualExp + accrualCompShip + accrualCompComm + accrualCompInst;
  const accrualGrossProfit = accrualRev - accrualCOGS;
  const accrualProfit     = accrualRev - accrualCOGS - accrualCPBH;
  const margin            = accrualRev > 0 ? Math.round(accrualProfit*1000/accrualRev)/10 : 0;
  const grossMargin       = accrualRev > 0 ? Math.round(accrualGrossProfit*1000/accrualRev)/10 : 0;
  const pendingRev        = pendingOrders.reduce((s,o) => s + calc(o).total, 0);
  const pendingCOGS       = pendingOrders.reduce((s,o) => s + calc(o).totalCost, 0);
  const pendingGrossProfit = pendingRev - pendingCOGS;
  const pendingGrossMargin = pendingRev > 0 ? Math.round(pendingGrossProfit*1000/pendingRev)/10 : 0;

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
      /*#__PURE__*/React.createElement(DateRangeFilter, {initFrom:fromDate, initTo:toDate, onApply:(f,t)=>{setFromDate(f);setToDate(t);}}),
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
        /*#__PURE__*/React.createElement("div", {className:"rounded-xl border border-[#fed7aa] bg-white p-4"},
          /*#__PURE__*/React.createElement("div", {className:"mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-[#92400e]"},
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
        /*#__PURE__*/React.createElement("div", {className:"rounded-xl border border-[#fed7aa] bg-white p-4"},
          /*#__PURE__*/React.createElement("div", {className:"mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-[#92400e]"},
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
        /*#__PURE__*/React.createElement("div", {className:"rounded-xl border border-[#fed7aa] bg-white p-4"},
          /*#__PURE__*/React.createElement("div", {className:"mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-[#92400e]"},
            /*#__PURE__*/React.createElement(CreditCard, {className:"h-3.5 w-3.5"}), "Số dư tài khoản"
          ),
          /*#__PURE__*/React.createElement("p", {className:"text-2xl font-bold text-[#92400e] tabular-nums"}, totalBal > 0 ? vnd(totalBal) : "—"),
          /*#__PURE__*/React.createElement("p", {className:"mt-0.5 mb-3 text-xs text-slate-400"}, accBals.length > 0 ? accBals.length + " tài khoản đang hoạt động" : "Chưa có tài khoản"),
          /*#__PURE__*/React.createElement("p", {className:"mb-2 text-[11px] italic text-slate-400"}, "Lũy kế đến cuối kỳ — không thay đổi theo ngày bắt đầu"),
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
        /*#__PURE__*/React.createElement("div", {className:"rounded-xl border border-[#fed7aa] bg-white p-4"},
          /*#__PURE__*/React.createElement("div", {className:"mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-[#92400e]"},
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
              /*#__PURE__*/React.createElement("p", {className:"text-sm font-bold text-[#92400e] tabular-nums"},
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
        /*#__PURE__*/React.createElement("div", {className:"rounded-xl border border-[#fed7aa] bg-white p-4"},
          /*#__PURE__*/React.createElement("div", {className:"mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-[#92400e]"},
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
              /*#__PURE__*/React.createElement("p", {className:"text-sm font-bold text-[#92400e] tabular-nums"},
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
        /*#__PURE__*/React.createElement("div", {className:"rounded-xl border border-[#fed7aa] bg-white p-4"},
          /*#__PURE__*/React.createElement("div", {className:"mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-[#92400e]"},
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
              /*#__PURE__*/React.createElement("p", {className:"text-sm font-bold text-[#92400e] tabular-nums"}, nccTotal > 0 ? vnd(nccTotal) : "—")
            )
          ),
          /*#__PURE__*/React.createElement("div", {className:"space-y-1.5"},
            kv("Đã thanh toán", nccPaid),
            kv("Còn phải trả", Math.max(0, nccTotal-nccPaid), "text-[#B91C1C]")
          )
        ),

        /* Tồn kho */
        /*#__PURE__*/React.createElement("div", {className:"rounded-xl border border-[#fed7aa] bg-white p-4"},
          /*#__PURE__*/React.createElement("div", {className:"mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-[#92400e]"},
            /*#__PURE__*/React.createElement(Layers, {className:"h-3.5 w-3.5"}), "Tồn kho hiện tại"
          ),
          /*#__PURE__*/React.createElement("p", {className:"text-2xl font-bold text-[#92400e] tabular-nums"}, stockVal > 0 ? vnd(stockVal) : "—"),
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
          /*#__PURE__*/React.createElement("div", {className:"mb-3 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-[#92400e]"},
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
              ? /*#__PURE__*/React.createElement("span", {className:"font-bold tabular-nums text-[#92400e]"}, vnd(totalNccDebt))
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
              returnedOrders.length > 0
                ? /*#__PURE__*/React.createElement("button", {
                    onClick: () => setShowRetList(v => !v),
                    className: "flex items-center gap-1 text-left"
                  },
                    /*#__PURE__*/React.createElement("span", {className:"text-2xl font-bold text-slate-800"}, returnedOrders.length),
                    /*#__PURE__*/React.createElement("span", {className:"text-sm font-normal text-slate-500 ml-1"}, "đơn"),
                    /*#__PURE__*/React.createElement(showRetList ? ChevronDown : ChevronRight, {className:"h-4 w-4 text-slate-400 ml-0.5"})
                  )
                : /*#__PURE__*/React.createElement("p", {className:"text-2xl font-bold text-slate-800"}, "0", /*#__PURE__*/React.createElement("span", {className:"text-sm font-normal text-slate-500 ml-1"}, "đơn"))
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
                ? /*#__PURE__*/React.createElement("span", {className:"tabular-nums font-medium text-[#92400e]"}, vnd(pendingRefund))
                : /*#__PURE__*/React.createElement("span", {className:"text-slate-300"}, "—")
            ),
            /*#__PURE__*/React.createElement("div", {className:"flex justify-between items-center text-sm"},
              /*#__PURE__*/React.createElement("span", {className:"text-slate-500"}, "Hàng nhập lại kho"),
              importedToStock > 0
                ? /*#__PURE__*/React.createElement("span", {className:"tabular-nums font-medium text-[#92400e]"}, vnd(importedToStock))
                : /*#__PURE__*/React.createElement("span", {className:"text-slate-300"}, "—")
            )
          ),
          showRetList && returnedOrders.length > 0 && /*#__PURE__*/React.createElement("div", {
            className: "mt-3 border-t border-slate-100 pt-3 space-y-0.5"
          },
            returnedOrders.map(o => {
              const retVal = (o.returns||[]).filter(r => !r.cancelled).reduce((s,r) => s+(r.amount||0), 0);
              return /*#__PURE__*/React.createElement("button", {
                key: o.id,
                onClick: () => onOpenOrder && onOpenOrder(o.id),
                className: "w-full flex items-center justify-between text-sm hover:bg-[#fff7ed] rounded-lg px-2 py-1.5 group transition-colors"
              },
                /*#__PURE__*/React.createElement("div", {className:"flex items-center gap-2"},
                  /*#__PURE__*/React.createElement("span", {className:"rounded-full bg-[#fcebd8] px-2 py-0.5 text-[11px] font-semibold text-[#92400e]"}, o.id),
                  /*#__PURE__*/React.createElement("span", {className:"text-slate-600 truncate max-w-[120px]"}, o.name||"—")
                ),
                /*#__PURE__*/React.createElement("div", {className:"flex items-center gap-1.5 shrink-0"},
                  retVal > 0 && /*#__PURE__*/React.createElement("span", {className:"tabular-nums text-rose-600 font-medium text-xs"}, vnd(retVal)),
                  /*#__PURE__*/React.createElement(ChevronRight, {className:"h-3.5 w-3.5 text-slate-300 group-hover:text-[#92400e]"})
                )
              );
            })
          )
        ),

        /* Trả hàng NCC */
        /*#__PURE__*/React.createElement("div", {className:"rounded-xl border border-slate-200 bg-white p-4"},
          /*#__PURE__*/React.createElement("div", {className:"mb-3 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-[#92400e]"},
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
        secHd("Lợi nhuận", "Accrual")
      ),
      /*#__PURE__*/React.createElement("p", {className:"mb-3 text-xs italic text-slate-400"}, "Tính theo đơn trong kỳ (gồm cả phần chưa thu tiền). Cột chưa giao là ước tính — chưa tính CPBH vì chi phí chưa phát sinh."),

      /*#__PURE__*/React.createElement("div", {className:"overflow-hidden rounded-xl border border-[#fed7aa] bg-white shadow-sm"},

        /* Header */
        /*#__PURE__*/React.createElement("div", {className:"grid grid-cols-3 border-b border-[#fed7aa] bg-[#ffedd5] px-4 py-2.5"},
          /*#__PURE__*/React.createElement("div", null),
          /*#__PURE__*/React.createElement("div", {className:"text-center"},
            /*#__PURE__*/React.createElement("div", {className:"text-[11px] font-semibold uppercase tracking-wide text-[#92400e]"}, "Đã giao"),
            /*#__PURE__*/React.createElement("div", {className:"text-[11px] text-slate-500"}, expOrders.length+" đơn")
          ),
          /*#__PURE__*/React.createElement("div", {className:"text-center"},
            /*#__PURE__*/React.createElement("div", {className:"text-[11px] font-semibold uppercase tracking-wide text-slate-500"}, "Chưa giao"),
            /*#__PURE__*/React.createElement("div", {className:"text-[11px] text-slate-400"}, pendingOrders.length+" đơn · ước tính")
          )
        ),

        /* Row: Doanh thu */
        /*#__PURE__*/React.createElement("div", {className:"grid grid-cols-3 border-b border-[#fed7aa] px-4 py-3"},
          /*#__PURE__*/React.createElement("div", {className:"flex items-center gap-1.5 text-sm font-medium text-[#92400e]"},
            /*#__PURE__*/React.createElement(ShoppingCart, {className:"h-3.5 w-3.5 text-[#b45309]"}), "Doanh thu"
          ),
          /*#__PURE__*/React.createElement("div", {className:"text-right text-sm font-bold tabular-nums "+(accrualRev > 0 ? "text-[#92400e]" : "text-slate-300")},
            accrualRev > 0 ? vnd(accrualRev) : "—"
          ),
          /*#__PURE__*/React.createElement("div", {className:"text-right text-sm font-semibold tabular-nums "+(pendingRev > 0 ? "text-[#92400e]" : "text-slate-300")},
            pendingRev > 0 ? vnd(pendingRev) : "—"
          )
        ),

        /* Row: Giá vốn */
        /*#__PURE__*/React.createElement("div", {className:"grid grid-cols-3 border-b border-[#fed7aa] px-4 py-3"},
          /*#__PURE__*/React.createElement("div", {className:"flex items-center gap-1.5 text-sm font-medium text-[#92400e]"},
            /*#__PURE__*/React.createElement(Package, {className:"h-3.5 w-3.5 text-[#b45309]"}), "Giá vốn"
          ),
          /*#__PURE__*/React.createElement("div", {className:"text-right text-sm font-bold tabular-nums "+(accrualCOGS > 0 ? "text-[#B91C1C]" : "text-slate-300")},
            accrualCOGS > 0 ? "−"+vnd(accrualCOGS) : "—"
          ),
          /*#__PURE__*/React.createElement("div", {className:"text-right text-sm font-semibold tabular-nums "+(pendingCOGS > 0 ? "text-[#B91C1C]" : "text-slate-300")},
            pendingCOGS > 0 ? "−"+vnd(pendingCOGS) : "—"
          )
        ),

        /* Row: Biên gộp (sub-row) */
        /*#__PURE__*/React.createElement("div", {className:"grid grid-cols-3 border-b border-[#fed7aa] bg-[#ffedd5] px-4 py-2"},
          /*#__PURE__*/React.createElement("div", {className:"text-[11px] italic text-[#92400e]"}, "Biên gộp (DT − GV)"),
          /*#__PURE__*/React.createElement("div", {className:"text-right text-[11px] tabular-nums font-semibold "+(accrualRev === 0 ? "text-slate-300" : accrualGrossProfit > 0 ? "text-emerald-700" : "text-[#B91C1C]")},
            accrualRev > 0 ? (accrualGrossProfit >= 0 ? "" : "−")+vnd(Math.abs(accrualGrossProfit)) : "—"
          ),
          /*#__PURE__*/React.createElement("div", {className:"text-right text-[11px] tabular-nums font-semibold "+(pendingRev === 0 ? "text-slate-300" : pendingGrossProfit > 0 ? "text-emerald-600" : "text-[#B91C1C]")},
            pendingRev > 0 ? (pendingGrossProfit >= 0 ? "" : "−")+vnd(Math.abs(pendingGrossProfit)) : "—"
          )
        ),

        /* Row: CPBH */
        /*#__PURE__*/React.createElement("div", {className:"grid grid-cols-3 border-b border-[#fed7aa] px-4 py-3"},
          /*#__PURE__*/React.createElement("div", null,
            /*#__PURE__*/React.createElement("div", {className:"flex items-center gap-1.5 text-sm font-medium text-[#92400e]"},
              /*#__PURE__*/React.createElement(ReceiptText, {className:"h-3.5 w-3.5 text-[#b45309]"}), "CPBH"
            ),
            accrualCPBH > 0 && /*#__PURE__*/React.createElement("div", {className:"mt-1 space-y-0.5 pl-5"},
              accrualShip > 0 && /*#__PURE__*/React.createElement("div", {className:"text-[11px] text-[#92400e]"}, "VC nhập: "+vnd(accrualShip)),
              accrualCompShip > 0 && /*#__PURE__*/React.createElement("div", {className:"text-[11px] text-[#92400e]"}, "Ship: "+vnd(accrualCompShip)),
              accrualCompComm > 0 && /*#__PURE__*/React.createElement("div", {className:"text-[11px] text-[#92400e]"}, "Hoa hồng: "+vnd(accrualCompComm)),
              accrualCompInst > 0 && /*#__PURE__*/React.createElement("div", {className:"text-[11px] text-[#92400e]"}, "Lắp đặt: "+vnd(accrualCompInst)),
              accrualExp > 0 && /*#__PURE__*/React.createElement("div", {className:"text-[11px] text-[#92400e]"}, "Khác: "+vnd(accrualExp))
            )
          ),
          /*#__PURE__*/React.createElement("div", {className:"text-right text-sm font-bold tabular-nums "+(accrualCPBH > 0 ? "text-[#B91C1C]" : "text-slate-300")},
            accrualCPBH > 0 ? "−"+vnd(accrualCPBH) : "—"
          ),
          /*#__PURE__*/React.createElement("div", {className:"flex items-center justify-end gap-1 text-[11px] italic text-slate-400"},
            /*#__PURE__*/React.createElement("span", {className:"inline-block h-1 w-1 rounded-full bg-slate-300"}),
            "chưa phát sinh"
          )
        ),

        /* Row: Lợi nhuận */
        /*#__PURE__*/React.createElement("div", {className:"grid grid-cols-3 px-4 py-4 "+(accrualRev === 0 ? "bg-[#ffedd5]" : accrualProfit > 0 ? "bg-emerald-50" : accrualProfit < 0 ? "bg-rose-50" : "bg-[#ffedd5]")},
          /*#__PURE__*/React.createElement("div", {className:"flex items-center gap-1.5 text-sm font-semibold "+(accrualRev === 0 ? "text-[#92400e]" : accrualProfit > 0 ? "text-emerald-700" : accrualProfit < 0 ? "text-rose-700" : "text-[#92400e]")},
            /*#__PURE__*/React.createElement(Sparkles, {className:"h-3.5 w-3.5"}), "Lợi nhuận"
          ),
          /*#__PURE__*/React.createElement("div", null,
            /*#__PURE__*/React.createElement("div", {className:"text-right text-lg font-bold tabular-nums "+(accrualRev === 0 ? "text-slate-300" : accrualProfit > 0 ? "text-emerald-600" : accrualProfit < 0 ? "text-[#B91C1C]" : "text-slate-300")},
              accrualRev > 0 && accrualProfit !== 0 ? (accrualProfit < 0 ? "−" : "")+vnd(Math.abs(accrualProfit)) : "—"
            ),
            accrualRev > 0 && /*#__PURE__*/React.createElement("div", {className:"text-right text-[11px] text-[#92400e]"}, "Biên "+margin+"% · DT−GV−CPBH")
          ),
          /*#__PURE__*/React.createElement("div", null,
            /*#__PURE__*/React.createElement("div", {className:"text-right text-sm font-semibold tabular-nums "+(pendingRev === 0 ? "text-slate-300" : pendingGrossProfit > 0 ? "text-emerald-600" : pendingGrossProfit < 0 ? "text-[#B91C1C]" : "text-slate-300")},
              pendingRev > 0 && pendingGrossProfit !== 0 ? (pendingGrossProfit < 0 ? "−" : "")+vnd(Math.abs(pendingGrossProfit)) : "—"
            ),
            pendingRev > 0 && /*#__PURE__*/React.createElement("div", {className:"text-right text-[11px] text-[#92400e]"}, "Biên "+pendingGrossMargin+"% · chưa trừ CPBH")
          )
        )
      )
    )
  );
}

