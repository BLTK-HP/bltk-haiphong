import React, { useState } from 'react';
import { Check, Plus, Minus, Search, ArrowLeft, ArrowLeftRight, Pencil } from 'lucide-react';
import { useAuth } from '../useAuth.js';
import { useCollection } from '../useFirestore.js';
import {
  useBankAccounts, useTxnKinds, useToast, useTxns,
  DEFAULT_THU_KINDS, DEFAULT_CHI_KINDS,
} from '../contexts.jsx';
import { vnd, num, field, inputF, blueBtn, ghostBtn, parseISO, localMonthStart, localToday, fmtDocId } from '../constants.js';
import { Modal, NumInput, Th, TableShell, Card, DateRangeFilter, PrintBtn, ExportBtn, exportCSV } from '../components/ui.jsx';

/* ───────── Finance ───────── */
export function HuyGiaoDichModal({onClose, onConfirm}) {
  const [reason, setReason] = useState("");
  const canConfirm = reason.trim().length > 0;
  return /*#__PURE__*/React.createElement(Modal, {title:"Huỷ giao dịch", onClose, maxW:"max-w-sm",
    footer: /*#__PURE__*/React.createElement(React.Fragment, null,
      /*#__PURE__*/React.createElement("button", {onClick:onClose, className:ghostBtn}, "Đóng"),
      /*#__PURE__*/React.createElement("button", {onClick:()=>onConfirm(reason.trim()), disabled:!canConfirm, className:"rounded-lg px-4 py-2 text-sm font-semibold bg-red-600 text-white hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed"}, "Xác nhận huỷ"))},
    /*#__PURE__*/React.createElement("div", {className:"space-y-3"},
      /*#__PURE__*/React.createElement("p", {className:"text-sm text-slate-600"}, "Giao dịch bị huỷ sẽ không tính vào thu/chi nhưng vẫn lưu lại để tra cứu."),
      /*#__PURE__*/React.createElement("div", null,
        /*#__PURE__*/React.createElement("label", {className:"mb-1 block text-[13px] font-medium text-slate-500"}, "Lý do huỷ ", /*#__PURE__*/React.createElement("span", {className:"text-[#B91C1C]"}, "*")),
        /*#__PURE__*/React.createElement("input", {autoFocus:true, value:reason, onChange:e=>setReason(e.target.value), placeholder:"Nhập lý do...", className:inputF}))));
}

export function PhieuThuModal({onClose, onSave, nextId}) {
  const { profile: _thuProfile } = useAuth();
  const _staffName = _thuProfile?.name || "Quản lý";
  const {bankAccounts} = useBankAccounts();
  const { txnKinds: _thuKinds } = useTxnKinds() || {};
  const thuKindList = _thuKinds?.thuKinds?.length ? _thuKinds.thuKinds : DEFAULT_THU_KINDS;
  const activeAccs = bankAccounts.filter(a => a.status === "Hoạt động");
  const [acc, setAcc]       = useState(activeAccs[0]?.key || "");
  const [entity, setEntity] = useState("");
  const [orderId, setOrderId] = useState("");
  const [kind, setKind]     = useState(thuKindList[0] || "Đặt cọc");
  const [amount, setAmount] = useState(0);
  const [note, setNote]     = useState("");
  const canSave = entity.trim() && amount > 0;
  const errMsg = !entity.trim() ? "Vui lòng nhập tên đối tượng" : amount <= 0 ? "Vui lòng nhập số tiền lớn hơn 0" : null;
  const now = () => { const d = new Date(); return d.toLocaleDateString('vi-VN') + " " + d.toLocaleTimeString('vi-VN',{hour:'2-digit',minute:'2-digit'}); };
  const doSave = () => onSave({id:nextId,date:now(),entity,orderId,kind,acc,amount,note,staff:_staffName});
  const lbl = "mb-1 block text-[13px] font-medium text-slate-500";
  return /*#__PURE__*/React.createElement(Modal, {title:"Lập phiếu thu",onClose,maxW:"max-w-lg",
    footer:/*#__PURE__*/React.createElement(React.Fragment,null,
      errMsg && /*#__PURE__*/React.createElement("span",{className:"text-xs text-[#B91C1C] mr-auto"},"⚠ "+errMsg),
      /*#__PURE__*/React.createElement("button",{onClick:onClose,className:ghostBtn},"Hủy"),
      /*#__PURE__*/React.createElement("button",{onClick:doSave,disabled:!canSave,className:blueBtn+(canSave?"":" opacity-50 cursor-not-allowed")},"Lưu phiếu thu"))},
    /*#__PURE__*/React.createElement("div",{className:"grid grid-cols-2 gap-3"},
      /*#__PURE__*/React.createElement("div",null,/*#__PURE__*/React.createElement("label",{className:lbl},"Tài khoản"),
        /*#__PURE__*/React.createElement("select",{value:acc,onChange:e=>setAcc(e.target.value),className:inputF},
          activeAccs.map(a=>/*#__PURE__*/React.createElement("option",{key:a.key,value:a.key},a.bank+" ("+a.account+")")))),
      /*#__PURE__*/React.createElement("div",null,/*#__PURE__*/React.createElement("label",{className:lbl},"Loại thu"),
        /*#__PURE__*/React.createElement("select",{value:kind,onChange:e=>setKind(e.target.value),className:inputF},
          thuKindList.map(k=>/*#__PURE__*/React.createElement("option",{key:k},k)))),
      /*#__PURE__*/React.createElement("div",null,/*#__PURE__*/React.createElement("label",{className:lbl},"Đối tượng ",/*#__PURE__*/React.createElement("span",{className:"text-[#B91C1C]"},"*")),
        /*#__PURE__*/React.createElement("input",{value:entity,onChange:e=>setEntity(e.target.value),placeholder:"Tên khách hàng...",className:inputF})),
      /*#__PURE__*/React.createElement("div",null,/*#__PURE__*/React.createElement("label",{className:lbl},"Số đơn hàng"),
        /*#__PURE__*/React.createElement("input",{value:orderId,onChange:e=>setOrderId(e.target.value),placeholder:"DH...",className:inputF})),
      /*#__PURE__*/React.createElement("div",null,/*#__PURE__*/React.createElement("label",{className:lbl},"Số tiền (đ) ",/*#__PURE__*/React.createElement("span",{className:"text-[#B91C1C]"},"*")),
        /*#__PURE__*/React.createElement(NumInput,{className:inputF,value:amount,onChange:setAmount})),
      /*#__PURE__*/React.createElement("div",null,/*#__PURE__*/React.createElement("label",{className:lbl},"Nội dung"),
        /*#__PURE__*/React.createElement("input",{value:note,onChange:e=>setNote(e.target.value),placeholder:"Nội dung...",className:inputF}))));
}
export function PhieuChiModal({onClose, onSave, nextId, initEntity="", initOrderId="", initKind="Chi phí", initAmount=0, initNote="", kinds=null, initAcc=null}) {
  const { profile: _chiProfile } = useAuth();
  const _staffName = _chiProfile?.name || "Quản lý";
  const {bankAccounts} = useBankAccounts();
  const { txnKinds: _chiKinds } = useTxnKinds() || {};
  const chiKindList = kinds || (_chiKinds?.chiKinds?.length ? _chiKinds.chiKinds : DEFAULT_CHI_KINDS);
  const {txns = []} = useTxns() || {};
  const activeAccs = bankAccounts.filter(a => a.status === "Hoạt động");
  const [acc, setAcc]       = useState(initAcc || activeAccs[0]?.key || "");
  const [entity, setEntity] = useState(initEntity);
  const [orderId, setOrderId] = useState(initOrderId);
  const resolvedInitKind = kinds && !kinds.includes(initKind) ? kinds[0] : initKind;
  const [kind, setKind]     = useState(resolvedInitKind);
  const [amount, setAmount] = useState(initAmount);
  const [note, setNote]     = useState(initNote);
  React.useEffect(() => {
    if (kinds) {
      const verb = kind === "CP Đặt Cọc NCC" ? "Đặt cọc" : "Thanh toán";
      setNote(n => verb + n.replace(/^(Đặt cọc|Thanh toán)/, ""));
    }
  }, [kind]);
  const accObj = bankAccounts.find(a => a.key === acc);
  const accTxns = txns.filter(t => t.acc === acc && !t.cancelled);
  const curBal = (accObj?.openBal||0) + accTxns.filter(t=>t.amount>0).reduce((s,t)=>s+t.amount,0) - accTxns.filter(t=>t.amount<0).reduce((s,t)=>s+Math.abs(t.amount),0);
  const afterBal = curBal - amount;
  const canSave = entity.trim() && amount > 0 && afterBal >= 0;
  const errMsgChi = !entity.trim() ? "Vui lòng nhập tên đối tượng" : amount <= 0 ? "Vui lòng nhập số tiền lớn hơn 0" : afterBal < 0 ? "Số dư tài khoản không đủ để thực hiện" : null;
  const now = () => { const d = new Date(); return d.toLocaleDateString('vi-VN') + " " + d.toLocaleTimeString('vi-VN',{hour:'2-digit',minute:'2-digit'}); };
  const doSave = () => onSave({id:nextId,date:now(),entity,orderId,kind,acc,amount:-amount,note,staff:_staffName});
  const lbl = "mb-1 block text-[13px] font-medium text-slate-500";
  return /*#__PURE__*/React.createElement(Modal, {title:"Lập phiếu chi",onClose,maxW:"max-w-lg",
    footer:/*#__PURE__*/React.createElement(React.Fragment,null,
      errMsgChi && /*#__PURE__*/React.createElement("span",{className:"text-xs text-[#B91C1C] mr-auto"},"⚠ "+errMsgChi),
      /*#__PURE__*/React.createElement("button",{onClick:onClose,className:ghostBtn},"Hủy"),
      /*#__PURE__*/React.createElement("button",{onClick:doSave,disabled:!canSave,className:"inline-flex items-center gap-1.5 rounded-lg bg-[#92400e] px-3.5 py-2 text-sm font-semibold text-white hover:bg-[#78350f] disabled:opacity-50"},"Lưu phiếu chi"))},
    /*#__PURE__*/React.createElement("div",{className:"grid grid-cols-2 gap-3"},
      /*#__PURE__*/React.createElement("div",null,/*#__PURE__*/React.createElement("label",{className:lbl},"Tài khoản"),
        /*#__PURE__*/React.createElement("select",{value:acc,onChange:e=>setAcc(e.target.value),className:inputF},
          activeAccs.map(a=>/*#__PURE__*/React.createElement("option",{key:a.key,value:a.key},a.bank+" ("+a.account+")"))),
        /*#__PURE__*/React.createElement("div",{className:"mt-1 flex items-center justify-between text-xs"},
          /*#__PURE__*/React.createElement("span",{className:"text-slate-400"},"Số dư hiện tại:"),
          /*#__PURE__*/React.createElement("span",{className:"font-semibold "+(curBal<0?"text-[#B91C1C]":"text-[#047857]")},vnd(curBal)+"đ")),
        amount>0&&/*#__PURE__*/React.createElement("div",{className:"mt-0.5 flex items-center justify-between text-xs"},
          /*#__PURE__*/React.createElement("span",{className:"text-slate-400"},"Sau khi chi:"),
          /*#__PURE__*/React.createElement("span",{className:"font-semibold "+(afterBal<0?"text-[#B91C1C]":"text-slate-600")},vnd(afterBal)+"đ",afterBal<0&&" ⚠ Không đủ số dư!"))),
      /*#__PURE__*/React.createElement("div",null,/*#__PURE__*/React.createElement("label",{className:lbl},"Loại chi"),
        /*#__PURE__*/React.createElement("select",{value:kind,onChange:e=>setKind(e.target.value),className:inputF},
          chiKindList.map(k=>/*#__PURE__*/React.createElement("option",{key:k},k)))),
      /*#__PURE__*/React.createElement("div",null,/*#__PURE__*/React.createElement("label",{className:lbl},"Đối tượng ",/*#__PURE__*/React.createElement("span",{className:"text-[#B91C1C]"},"*")),
        /*#__PURE__*/React.createElement("input",{value:entity,onChange:e=>setEntity(e.target.value),placeholder:"Tên đối tượng...",className:inputF})),
      /*#__PURE__*/React.createElement("div",null,/*#__PURE__*/React.createElement("label",{className:lbl},"Số đơn hàng"),
        /*#__PURE__*/React.createElement("input",{value:orderId,onChange:e=>setOrderId(e.target.value),placeholder:"DH...",className:inputF})),
      /*#__PURE__*/React.createElement("div",null,/*#__PURE__*/React.createElement("label",{className:lbl},"Số tiền (đ) ",/*#__PURE__*/React.createElement("span",{className:"text-[#B91C1C]"},"*")),
        /*#__PURE__*/React.createElement(NumInput,{className:inputF,value:amount,onChange:setAmount})),
      /*#__PURE__*/React.createElement("div",null,/*#__PURE__*/React.createElement("label",{className:lbl},"Nội dung"),
        /*#__PURE__*/React.createElement("input",{value:note,onChange:e=>setNote(e.target.value),placeholder:"Nội dung...",className:inputF}))));
}
export function ChuyenTienModal({onClose, onSave, nextId}) {
  const { profile: _ctProfile } = useAuth();
  const _staffName = _ctProfile?.name || "Quản lý";
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
      {id:nextId,   date:dt,entity:"Chuyển nội bộ",orderId:"",kind:"Chuyển đi", acc:from,amount:-amount,note:note||("Chuyển sang "+to),staff:_staffName},
      {id:nextId+1, date:dt,entity:"Chuyển nội bộ",orderId:"",kind:"Chuyển về", acc:to,  amount:amount, note:note||("Nhận từ "+from),  staff:_staffName},
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
export function EditTxnModal({txn, onClose, onSave}) {
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
  const ALL_KINDS = ["Đặt cọc","Thanh toán","CPVC Nhập Hàng","CP Đặt Cọc NCC","CP Thanh Toán NCC","CP Ship ĐH","CP Lắp Đặt","CP Hoàn Hàng","CP Thuê Nhà","CP Tiền Điện","CP Tiền Nước","CP Vận Hành","CP Hoa Hồng","Chi phí <200k","Hoàn tiền KH","Hoàn ứng","Chuyển đi","Chuyển về"];
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
/* ───────── Đối chiếu sao kê tự động ───────── */
export function ReconcileBtn({ txns, setTxns, orders }) {
  const [busy, setBusy] = React.useState(false);
  const [result, setResult] = React.useState(null);

  const parseDate = s => {
    if (!s) return null;
    const p = s.split(' ')[0].split('/');
    return p.length === 3 ? new Date(+p[2], +p[1]-1, +p[0]) : null;
  };

  const doReconcile = async () => {
    setBusy(true); setResult(null);
    // Chỉ xét giao dịch ngân hàng THU chưa có orderId
    const bankTxns = txns.filter(t => t.bankImport && t.amount > 0 && !t.orderId);
    // Chỉ xét đơn hàng có tiền thanh toán
    const paidOrders = (orders || []).filter(o => o.paid > 0);

    let linked = 0, ambiguous = 0;
    const updates = {};

    for (const order of paidOrders) {
      const orderDate = parseDate(order.dt);
      if (!orderDate) continue;
      const matches = bankTxns.filter(t => {
        if (updates[t.id]) return false; // đã được link
        const txnDate = parseDate(t.date);
        if (!txnDate) return false;
        const diffDays = Math.abs((txnDate - orderDate) / 86400000);
        return t.amount === order.paid && diffDays <= 3;
      });
      if (matches.length === 1) {
        updates[matches[0].id] = order.id;
        linked++;
      } else if (matches.length > 1) {
        ambiguous++;
      }
    }

    if (linked > 0) {
      setTxns(p => p.map(t => updates[t.id] ? { ...t, orderId: updates[t.id] } : t));
    }
    setResult({ linked, ambiguous, total: bankTxns.length });
    setBusy(false);
  };

  return React.createElement("div", { className: "flex items-center gap-2" },
    React.createElement("button", {
      onClick: doReconcile, disabled: busy,
      className: "inline-flex items-center gap-1.5 rounded-lg border border-amber-300 bg-amber-50 px-3 py-1.5 text-sm font-medium text-amber-800 hover:bg-amber-100 disabled:opacity-50"
    }, busy ? "Đang đối chiếu..." : "Đối chiếu tự động"),
    result && React.createElement("span", { className: "text-xs text-slate-500" },
      `Khớp: ${result.linked} | Nhiều khả năng: ${result.ambiguous} | Chưa khớp: ${result.total - result.linked - result.ambiguous}`
    )
  );
}

export function DeliverySlipModal({ data, onClose }) {
  if (!data) return null;
  const { seq, date, pxSlip, items, custName, custPhone, custAddr, orderId } = data;
  const total = items.reduce((s, it) => s + it.price * it.qty, 0);
  return /*#__PURE__*/React.createElement(Modal, {
    title: `Phiếu giao hàng lần ${seq} — ${orderId}`,
    maxW: "max-w-xl",
    onClose,
    footer: /*#__PURE__*/React.createElement(React.Fragment, null,
      /*#__PURE__*/React.createElement(PrintBtn, null),
      /*#__PURE__*/React.createElement("button", {onClick: onClose, className: "rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50"}, "Đóng"))
  },
    /*#__PURE__*/React.createElement("div", {className: "space-y-4 text-sm"},
      /*#__PURE__*/React.createElement("div", {className: "grid grid-cols-2 gap-y-1.5 text-xs"},
        /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", {className: "text-slate-500"}, "Số phiếu: "), /*#__PURE__*/React.createElement("span", {className: "font-semibold text-[#92400e]"}, pxSlip)),
        /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", {className: "text-slate-500"}, "Ngày giao: "), /*#__PURE__*/React.createElement("span", {className: "font-medium"}, date)),
        /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", {className: "text-slate-500"}, "Đơn hàng: "), /*#__PURE__*/React.createElement("span", {className: "font-medium"}, orderId)),
        /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", {className: "text-slate-500"}, "Lần giao: "), /*#__PURE__*/React.createElement("span", {className: "font-semibold text-amber-700"}, "Lần " + seq)),
        /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", {className: "text-slate-500"}, "Khách hàng: "), /*#__PURE__*/React.createElement("span", {className: "font-medium"}, custName)),
        /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", {className: "text-slate-500"}, "SĐT: "), /*#__PURE__*/React.createElement("span", {className: "font-medium"}, custPhone)),
        custAddr && /*#__PURE__*/React.createElement("div", {className: "col-span-2"}, /*#__PURE__*/React.createElement("span", {className: "text-slate-500"}, "Địa chỉ: "), /*#__PURE__*/React.createElement("span", {className: "font-medium"}, custAddr))),
      /*#__PURE__*/React.createElement("table", {className: "w-full border-collapse text-xs"},
        /*#__PURE__*/React.createElement("thead", null,
          /*#__PURE__*/React.createElement("tr", {className: "bg-[#ffedd5] text-[#7c2d12]"},
            /*#__PURE__*/React.createElement("th", {className: "py-2 px-3 text-left font-semibold"}, "Sản phẩm"),
            /*#__PURE__*/React.createElement("th", {className: "py-2 px-3 text-center font-semibold w-12"}, "SL"),
            /*#__PURE__*/React.createElement("th", {className: "py-2 px-3 text-right font-semibold w-24"}, "Đơn giá"),
            /*#__PURE__*/React.createElement("th", {className: "py-2 px-3 text-right font-semibold w-28"}, "Thành tiền"))),
        /*#__PURE__*/React.createElement("tbody", null,
          items.map((it, i) =>
            /*#__PURE__*/React.createElement("tr", {key: i, className: "border-b border-slate-100"},
              /*#__PURE__*/React.createElement("td", {className: "py-2 px-3 text-slate-800"}, it.name),
              /*#__PURE__*/React.createElement("td", {className: "py-2 px-3 text-center tabular-nums"}, it.qty),
              /*#__PURE__*/React.createElement("td", {className: "py-2 px-3 text-right tabular-nums"}, vnd(it.price)),
              /*#__PURE__*/React.createElement("td", {className: "py-2 px-3 text-right tabular-nums font-medium"}, vnd(it.price * it.qty)))))),
      /*#__PURE__*/React.createElement("div", {className: "flex items-center justify-between rounded-lg bg-[#ffedd5] px-4 py-2.5"},
        /*#__PURE__*/React.createElement("span", {className: "font-semibold text-[#7c2d12]"}, "Tổng lần giao này"),
        /*#__PURE__*/React.createElement("span", {className: "text-lg font-bold tabular-nums text-[#92400e]"}, vnd(total)))));
}

export function Finance({setActive, onOpenOrder}) {
  const notify = useToast();
  const { profile } = useAuth();
  const isAdmin = profile?.role === "admin";
  const [finTab, setFinTab] = React.useState("cty");
  const patOnly = isAdmin && finTab === "pat";
  const {bankAccounts} = useBankAccounts();
  const activeAccs = bankAccounts.filter(a => a.status === "Hoạt động" && (patOnly ? a.key === "TCB-PAT" : a.key !== "TCB-PAT"));
  const {txns, setTxns}       = useTxns();
  const [orders]              = useCollection("orders");
  const [q, setQ]             = useState("");
  const [fromDate, setFromDate] = useState(localMonthStart);
  const [toDate, setToDate]   = useState(localToday);
  const [fAcc, setFAcc]       = useState("Tất cả");
  const [fDir, setFDir]       = useState("Tất cả");
  const [fAccDetail, setFAccDetail] = useState(null);
  const [modal, setModal]     = useState(null);
  const [cancelTarget, setCancelTarget] = useState(null);
  const [editTxn, setEditTxn] = useState(null);
  const [txnPage, setTxnPage] = useState(1);
  const [detailPage, setDetailPage] = useState(1);
  const [dFromDate, setDFromDate] = useState(localMonthStart);
  const [dToDate, setDToDate]     = useState(localToday);
  const [dQ, setDQ]               = useState("");
  const [dDir, setDDir]           = useState("Tất cả");
  const [fKind, setFKind]         = useState("Tất cả");
  const [dKind, setDKind]         = useState("Tất cả");
  const nextId = txns.length ? Math.max(...txns.map(t=>Number(t.id)||0))+1 : 1;
  React.useEffect(() => { setTxnPage(1); }, [q, fromDate, toDate, fAcc, fDir, fKind]);
  React.useEffect(() => { setDetailPage(1); setDFromDate(localMonthStart); setDToDate(localToday); setDQ(""); setDDir("Tất cả"); setDKind("Tất cả"); }, [fAccDetail]);

  const parseD    = s => { const p=s.split(' ')[0].split('/'); return new Date(+p[2],+p[1]-1,+p[0]); };
  const parseISO  = s => { const [y,m,d]=s.split('-'); return new Date(+y,+m-1,+d); };
  const fromD = fromDate ? parseISO(fromDate) : null;
  const toD   = toDate   ? parseISO(toDate)   : null;
  const normalizeKind = t => {
    if (patOnly && t.amount < 0 && Math.abs(t.amount) < 500000) return "CP cá nhân <500k";
    return t.kind;
  };

  const visibleTxns = txns.filter(t => {
    if (patOnly ? t.acc !== "TCB-PAT" : t.acc === "TCB-PAT") return false;
    const d = parseD(t.date);
    if (fromD && d < fromD) return false;
    if (toD   && d > toD)   return false;
    if (fAcc !== "Tất cả" && t.acc !== fAcc) return false;
    if (fDir === "Thu" && t.amount <= 0) return false;
    if (fDir === "Chi" && t.amount >= 0) return false;
    if (fKind !== "Tất cả" && normalizeKind(t) !== fKind) return false;
    if (q && !`${t.id} ${t.orderId} ${t.note} ${t.entity}`.toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  }).sort((a, b) => { const da = parseD(a.date), db = parseD(b.date); return da - db !== 0 ? db - da : b.id - a.id; });

  const { txnKinds } = useTxnKinds() || {};
  const baseTxns = txns.filter(t => !t.cancelled && (patOnly ? t.acc === "TCB-PAT" : t.acc !== "TCB-PAT"));
  const configThu = txnKinds?.thuKinds?.length ? txnKinds.thuKinds : DEFAULT_THU_KINDS;
  const configChi = txnKinds?.chiKinds?.length ? txnKinds.chiKinds : DEFAULT_CHI_KINDS;
  const allThuKinds = [...new Set([...configThu, ...baseTxns.filter(t=>t.amount>0).map(t=>normalizeKind(t)).filter(Boolean)])];
  const allChiKinds = [...new Set([...configChi, ...baseTxns.filter(t=>t.amount<0).map(t=>normalizeKind(t)).filter(Boolean)])];

  const TXN_PER_PAGE = 25;
  const totalTxnPages = Math.ceil(visibleTxns.length / TXN_PER_PAGE);
  const pagedTxns = visibleTxns.slice((txnPage - 1) * TXN_PER_PAGE, txnPage * TXN_PER_PAGE);
  const txnPageNums = () => {
    if (totalTxnPages <= 7) return Array.from({length: totalTxnPages}, (_, i) => i + 1);
    if (txnPage <= 4) return [1, 2, 3, 4, 5, "...", totalTxnPages];
    if (txnPage >= totalTxnPages - 3) return [1, "...", totalTxnPages-4, totalTxnPages-3, totalTxnPages-2, totalTxnPages-1, totalTxnPages];
    return [1, "...", txnPage-1, txnPage, txnPage+1, "...", totalTxnPages];
  };
  const summaryTxns = txns.filter(t => {
    if (t.cancelled) return false;
    if (patOnly ? t.acc !== "TCB-PAT" : t.acc === "TCB-PAT") return false;
    const d = parseD(t.date);
    if (fromD && d < fromD) return false;
    if (toD   && d > toD)   return false;
    return true;
  });
  const accSummary = activeAccs.map(a => {
    // Dư đầu kỳ = openBal(01/01) + tất cả GD trước fromDate
    const preTxns = fromD ? txns.filter(t => !t.cancelled && t.acc === a.key && parseD(t.date) < fromD) : [];
    const preIn   = preTxns.filter(t=>t.amount>0).reduce((s,t)=>s+t.amount,0);
    const preOut  = preTxns.filter(t=>t.amount<0).reduce((s,t)=>s+Math.abs(t.amount),0);
    const periodOpenBal = (a.openBal||0) + preIn - preOut;
    // Luỹ kế trong kỳ
    const at = summaryTxns.filter(t=>t.acc===a.key);
    const totalIn  = at.filter(t=>t.amount>0).reduce((s,t)=>s+t.amount,0);
    const totalOut = at.filter(t=>t.amount<0).reduce((s,t)=>s+Math.abs(t.amount),0);
    return {...a, periodOpenBal, totalIn, totalOut, closeBal: periodOpenBal+totalIn-totalOut};
  });
  const tot = {
    openBal: accSummary.reduce((s,a)=>s+(a.periodOpenBal||0),0),
    totalIn: accSummary.reduce((s,a)=>s+a.totalIn,0),
    totalOut:accSummary.reduce((s,a)=>s+a.totalOut,0),
    closeBal:accSummary.reduce((s,a)=>s+a.closeBal,0),
  };
  const allAccs  = ["Tất cả",...activeAccs.map(a=>a.key)];

  const addTxn  = t  => { setTxns(p=>[t,...p]); notify("Đã lưu phiếu thu"); setModal(null); };
  const currentBalance = accKey => {
    const acc = activeAccs.find(a => a.key === accKey);
    const allForAcc = txns.filter(t => t.acc === accKey && !t.cancelled);
    const totalIn  = allForAcc.filter(t => t.amount > 0).reduce((s,t) => s + t.amount, 0);
    const totalOut = allForAcc.filter(t => t.amount < 0).reduce((s,t) => s + Math.abs(t.amount), 0);
    return (acc?.openBal || 0) + totalIn - totalOut;
  };
  const addChi = t => {
    const bal = currentBalance(t.acc);
    if (bal + t.amount < 0) {
      alert("Số dư tài khoản không đủ. Hiện tại: " + num(bal) + "đ");
      return;
    }
    setTxns(p=>[t,...p]); notify("Đã lưu phiếu chi"); setModal(null);
  };
  const addXfer = ts => { setTxns(p=>[...ts,...p]); notify("Đã chuyển tiền nội bộ"); setModal(null); };
  const cancelTxn  = (id, reason) => {
    const now = new Date();
    const stamp = now.toLocaleDateString('vi-VN') + " " + now.toLocaleTimeString('vi-VN',{hour:'2-digit',minute:'2-digit'});
    setTxns(p=>p.map(t=>t.id===id?{...t,cancelled:true,cancelReason:reason,cancelledBy:profile?.name||profile?.email||"",cancelledAt:stamp}:t));
    notify("Đã huỷ giao dịch");
    setCancelTarget(null);
  };
  const restoreTxn = id => { setTxns(p=>p.map(t=>t.id===id?{...t,cancelled:false,cancelReason:undefined,cancelledBy:undefined,cancelledAt:undefined}:t)); notify("Đã khôi phục giao dịch"); };
  const saveTxnEdit = updated => { setTxns(p=>p.map(t=>t.id===updated.id?updated:t)); setEditTxn(null); notify("Đã cập nhật giao dịch"); };
  const toggleCheck = id => setTxns(p=>p.map(t=>t.id===id?{...t,checked:!t.checked}:t));
  const nonCancelledMain = visibleTxns.filter(t=>!t.cancelled);
  const allMainChecked = nonCancelledMain.length>0 && nonCancelledMain.every(t=>t.checked);
  const someMainChecked = nonCancelledMain.some(t=>t.checked);
  const toggleAllMain = () => { const ids=new Set(nonCancelledMain.map(t=>t.id)); setTxns(p=>p.map(t=>ids.has(t.id)?{...t,checked:!allMainChecked}:t)); };
  const resetFilter = () => { setQ(""); setFAcc("Tất cả"); setFKind("Tất cả"); setFAccDetail(null); };
  const onExportTxn = () => exportCSV("lich-su-giao-dich", ["Ngày","Số phiếu","Số đơn hàng","Đối tượng","Loại GD","Tài khoản","Số tiền","Nội dung","Người tạo"],
    visibleTxns.map((t,i) => [t.date, fmtDocId(t.amount>=0?"PT":"PC",i+1), t.orderId||"", t.entity||"", t.kind||"", t.acc||"", t.amount, t.note||"", t.staff||""]));

  const THU = "bg-[#dcfce7] text-[#047857]";
  const CHI = "bg-[#fee2e2] text-[#B91C1C]";
  const KIND_COLORS = {
    "Thu tiền":       THU,
    "Đặt cọc":        THU,
    "Thanh toán":     THU,
    "Thu khác":       THU,
    "CPVC Nhập Hàng": CHI, "CP Đặt Cọc NCC": CHI, "CP Thanh Toán NCC": CHI, "CP Ship ĐH": CHI, "CP Lắp Đặt": CHI, "CP Hoàn Hàng": CHI, "CP Thuê Nhà": CHI, "CP Tiền Điện": CHI, "CP Tiền Nước": CHI, "CP Vận Hành": CHI, "CP Hoa Hồng": CHI, "Chi phí <200k": CHI,
    "Chi vận chuyển": CHI,
    "Hoàn tiền KH":   CHI,
    "Chi hoa hồng":   CHI,
    "Chi lắp đặt":    CHI,
    "Chi phí":        CHI,
    "Hoàn ứng":       CHI,
    "Chi khác":       CHI,
    "CP cá nhân <500k": CHI, "CP tiền học": CHI, "CP điện nước": CHI, "CP thuê nhà": CHI,
    "Chuyển đi":  "bg-slate-100 text-slate-600 ring-1 ring-slate-200",
    "Chuyển về":  "bg-slate-100 text-slate-600 ring-1 ring-slate-200",
  };

  const thC = "whitespace-nowrap px-3 py-2.5 text-left";
  const thR = "whitespace-nowrap px-3 py-2.5 text-right";
  const tdC = "px-3 py-2.5 text-slate-700";
  const tdR = "px-3 py-2.5 text-right tabular-nums font-medium";

  // Phân loại thu/chi — dùng đúng tập summaryTxns (đã lọc ngày) + giới hạn tài khoản hoạt động
  // để nhất quán với tổng Sổ quỹ (tránh tính lệch do giao dịch orphan / account không active)
  const activeKeys = new Set(activeAccs.map(a=>a.key));
  const kindBaseTxns = summaryTxns.filter(t => {
    if (!activeKeys.has(t.acc)) return false;
    if (fAcc !== "Tất cả" && t.acc !== fAcc) return false;
    return true;
  });
  const thuKinds = {}, chiKinds = {};
  kindBaseTxns.forEach(t => {
    const k = normalizeKind(t) || "Khác";
    if (t.amount > 0) thuKinds[k] = (thuKinds[k]||0) + t.amount;
    if (t.amount < 0) chiKinds[k] = (chiKinds[k]||0) + Math.abs(t.amount);
  });
  const THU_KINDS = ["Đặt cọc","Thanh toán"];
  const knownThuKinds = new Set(THU_KINDS);
  const thuOrdered = THU_KINDS.filter(k=>thuKinds[k]>0).map(k=>({kind:k,total:thuKinds[k]}));
  const thuOther = Object.entries(thuKinds).filter(([k])=>!knownThuKinds.has(k)).map(([kind,total])=>({kind,total}));
  const thuGroups = [...thuOrdered, ...thuOther];
  const totalThu = thuGroups.reduce((s,g)=>s+g.total,0);

  const chiMainItems = Object.entries(chiKinds).filter(([,v])=>patOnly||v>=200000).map(([kind,total])=>({kind,total}));
  const chiSmallItems = patOnly ? [] : Object.entries(chiKinds).filter(([,v])=>v<200000).map(([kind,total])=>({kind,total}));
  const chiSmallTotal = chiSmallItems.reduce((s,i)=>s+i.total,0);
  const totalChi = Object.values(chiKinds).reduce((s,v)=>s+v,0);

  const subRow = (key,label,total) => /*#__PURE__*/React.createElement("tr",{key},
    /*#__PURE__*/React.createElement("td",{className:tdC},label),
    /*#__PURE__*/React.createElement("td",{className:tdR+" text-[#B91C1C]"},vnd(total)));
  const chiTableRows = [
    ...chiMainItems.map(i=>subRow(i.kind,i.kind,i.total)),
    ...(chiSmallTotal>0?[subRow("chi_khac","Chi phí khác",chiSmallTotal)]:[]),
    /*#__PURE__*/React.createElement("tr",{key:"tong",className:"bg-[#fed7aa]"},
      /*#__PURE__*/React.createElement("td",{className:tdC+" text-slate-800",style:{fontWeight:700}},"Tổng"),
      /*#__PURE__*/React.createElement("td",{className:tdR+" text-[#B91C1C]",style:{fontWeight:700}},vnd(totalChi))),
  ];

  const KIND_COLORS_D = {
    "Thu tiền":"bg-[#dcfce7] text-[#047857]","Đặt cọc":"bg-[#dcfce7] text-[#047857]","Thanh toán":"bg-[#dcfce7] text-[#047857]","Thu khác":"bg-[#dcfce7] text-[#047857]",
    "CPVC Nhập Hàng":"bg-[#fee2e2] text-[#B91C1C]","CP Đặt Cọc NCC":"bg-[#fee2e2] text-[#B91C1C]","CP Thanh Toán NCC":"bg-[#fee2e2] text-[#B91C1C]","CP Ship ĐH":"bg-[#fee2e2] text-[#B91C1C]","CP Lắp Đặt":"bg-[#fee2e2] text-[#B91C1C]","CP Hoàn Hàng":"bg-[#fee2e2] text-[#B91C1C]","CP Thuê Nhà":"bg-[#fee2e2] text-[#B91C1C]","CP Tiền Điện":"bg-[#fee2e2] text-[#B91C1C]","CP Tiền Nước":"bg-[#fee2e2] text-[#B91C1C]","CP Vận Hành":"bg-[#fee2e2] text-[#B91C1C]","CP Hoa Hồng":"bg-[#fee2e2] text-[#B91C1C]","Chi phí <200k":"bg-[#fee2e2] text-[#B91C1C]","Hoàn tiền KH":"bg-[#fee2e2] text-[#B91C1C]","Hoàn ứng":"bg-[#fee2e2] text-[#B91C1C]",
    "Chuyển đi":"bg-slate-100 text-slate-600 ring-1 ring-slate-200","Chuyển về":"bg-slate-100 text-slate-600 ring-1 ring-slate-200",
  };

  if (fAccDetail) {
    const accD = bankAccounts.find(a=>a.key===fAccDetail);
    const accSumD = accSummary.find(a=>a.key===fAccDetail);
    const dFromD = dFromDate ? parseISO(dFromDate) : null;
    const dToD   = dToDate   ? parseISO(dToDate)   : null;
    const accTxns = txns.filter(t=>{
      if (t.acc!==fAccDetail) return false;
      const d = parseD(t.date);
      if (dFromD && d < dFromD) return false;
      if (dToD   && d > dToD)   return false;
      if (dDir==="Thu" && t.amount<=0) return false;
      if (dDir==="Chi" && t.amount>=0) return false;
      if (dKind!=="Tất cả" && normalizeKind(t)!==dKind) return false;
      if (dQ && !`${t.id} ${t.orderId} ${t.note} ${t.entity}`.toLowerCase().includes(dQ.toLowerCase())) return false;
      return true;
    });
    const dThuKinds = [...new Set(txns.filter(t=>t.acc===fAccDetail&&!t.cancelled&&t.amount>0).map(t=>normalizeKind(t)).filter(Boolean))].sort();
    const dChiKinds = [...new Set(txns.filter(t=>t.acc===fAccDetail&&!t.cancelled&&t.amount<0).map(t=>normalizeKind(t)).filter(Boolean))].sort();
    const nonCancelledAcc = accTxns.filter(t=>!t.cancelled);
    const allAccChecked = nonCancelledAcc.length>0 && nonCancelledAcc.every(t=>t.checked);
    const someAccChecked = nonCancelledAcc.some(t=>t.checked);
    const toggleAllAcc = () => { const ids=new Set(nonCancelledAcc.map(t=>t.id)); setTxns(p=>p.map(t=>ids.has(t.id)?{...t,checked:!allAccChecked}:t)); };
    const ACC_PER_PAGE = 25;
    const totalAccPages = Math.ceil(accTxns.length/ACC_PER_PAGE);
    const pagedAccTxns = accTxns.slice((detailPage-1)*ACC_PER_PAGE, detailPage*ACC_PER_PAGE);
    return /*#__PURE__*/React.createElement("div", {className:"space-y-4"},
      /*#__PURE__*/React.createElement("div", {className:"flex items-center justify-between flex-wrap gap-2"},
        /*#__PURE__*/React.createElement("div", {className:"flex items-center gap-3"},
          /*#__PURE__*/React.createElement("button", {onClick:()=>setFAccDetail(null), className:"inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800"},
            /*#__PURE__*/React.createElement(ArrowLeft, {className:"h-4 w-4"}), " Quay lại sổ quỹ"),
          accD && /*#__PURE__*/React.createElement("div", {className:"flex items-center gap-2"},
            /*#__PURE__*/React.createElement("span", {className:"text-slate-300"}, "|"),
            /*#__PURE__*/React.createElement("span", {className:"font-semibold text-slate-800"}, accD.bank),
            /*#__PURE__*/React.createElement("span", {className:"text-xs text-slate-500 bg-slate-100 rounded px-1.5 py-0.5"}, accD.account),
            )),
        /*#__PURE__*/React.createElement("div", {className:"flex gap-2"},
          /*#__PURE__*/React.createElement("button", {onClick:()=>setModal("thu"), className:"inline-flex items-center gap-1.5 rounded-lg bg-[#b45309] px-3 py-1.5 text-sm font-semibold text-white hover:bg-[#92400e]"},
            /*#__PURE__*/React.createElement(Plus,{className:"h-4 w-4"}), "Lập phiếu thu"),
          /*#__PURE__*/React.createElement("button", {onClick:()=>setModal("chi"), className:"inline-flex items-center gap-1.5 rounded-lg bg-[#92400e] px-3 py-1.5 text-sm font-semibold text-white hover:bg-[#78350f]"},
            /*#__PURE__*/React.createElement(Minus,{className:"h-4 w-4"}), "Lập phiếu chi"))),
      accSumD && /*#__PURE__*/React.createElement("div", {className:"rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden"},
        /*#__PURE__*/React.createElement("table", {className:"w-full text-sm tbl-list",style:{tableLayout:"fixed"}},
          /*#__PURE__*/React.createElement("thead", null,
            /*#__PURE__*/React.createElement("tr", null,
              /*#__PURE__*/React.createElement("th",{className:thR,style:{width:"25%"}},"Số dư đầu kỳ"),
              /*#__PURE__*/React.createElement("th",{className:thR,style:{width:"25%"}},"Tổng tiền vào"),
              /*#__PURE__*/React.createElement("th",{className:thR,style:{width:"25%"}},"Tổng tiền ra"),
              /*#__PURE__*/React.createElement("th",{className:thR,style:{width:"25%"}},"Số dư cuối kỳ"))),
          /*#__PURE__*/React.createElement("tbody", null,
            /*#__PURE__*/React.createElement("tr", null,
              /*#__PURE__*/React.createElement("td",{className:tdR+" text-slate-800"},vnd(accSumD.openBal)),
              /*#__PURE__*/React.createElement("td",{className:tdR+(accSumD.totalIn>0?" text-[#92400e]":" text-slate-300")},accSumD.totalIn>0?vnd(accSumD.totalIn):"—"),
              /*#__PURE__*/React.createElement("td",{className:tdR+(accSumD.totalOut>0?" text-[#B91C1C]":" text-slate-300")},accSumD.totalOut>0?vnd(accSumD.totalOut):"—"),
              /*#__PURE__*/React.createElement("td",{className:tdR+" text-slate-900 font-semibold"},vnd(accSumD.closeBal)))))),
      /*#__PURE__*/React.createElement(Card, {title:"Lịch sử giao dịch",
        right:/*#__PURE__*/React.createElement("div",{className:"flex flex-wrap items-center gap-2"},
          /*#__PURE__*/React.createElement("input",{type:"date",value:dFromDate,onChange:e=>setDFromDate(e.target.value),className:`${field} py-1.5 text-sm`}),
          /*#__PURE__*/React.createElement("input",{type:"date",value:dToDate,onChange:e=>setDToDate(e.target.value),className:`${field} py-1.5 text-sm`}),
          /*#__PURE__*/React.createElement("div",{className:"relative"},
            /*#__PURE__*/React.createElement(Search,{className:"absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400"}),
            /*#__PURE__*/React.createElement("input",{value:dQ,onChange:e=>setDQ(e.target.value),placeholder:"Tìm kiếm...",className:`${field} w-44 pl-8 py-1.5 text-sm`})),
          /*#__PURE__*/React.createElement("select",{value:dDir,onChange:e=>setDDir(e.target.value),className:`${field} py-1.5 text-sm`},
            ["Tất cả","Thu","Chi"].map(k=>/*#__PURE__*/React.createElement("option",{key:k},k))),
          /*#__PURE__*/React.createElement(PrintBtn,null),
          /*#__PURE__*/React.createElement(ExportBtn,{onClick:()=>exportCSV("giao-dich-"+fAccDetail,["Ngày","Số phiếu","Số đơn hàng","Đối tượng","Loại GD","Số tiền","Nội dung","Người tạo"],accTxns.map((t,i)=>[t.date,fmtDocId(t.amount>=0?"PT":"PC",i+1),t.orderId||"",t.entity||"",t.kind||"",t.amount,t.note||"",t.staff||""]))}))},
        /*#__PURE__*/React.createElement("div", {className:"-mx-5 -mb-5"},
          /*#__PURE__*/React.createElement(TableShell, {minW:"800px",
            foot: (() => {
              const totalIn  = accTxns.filter(t=>!t.cancelled&&t.amount>0).reduce((s,t)=>s+t.amount,0);
              const totalOut = accTxns.filter(t=>!t.cancelled&&t.amount<0).reduce((s,t)=>s+t.amount,0);
              return /*#__PURE__*/React.createElement("tr", {className:"bg-[#fed7aa] text-sm font-semibold text-slate-800"},
                /*#__PURE__*/React.createElement("td", {colSpan: patOnly ? 2 : 3, className:"px-4 py-2.5"}, "TỔNG CỘNG (", accTxns.length, " GD)"),
                /*#__PURE__*/React.createElement("td", {colSpan:2}),
                /*#__PURE__*/React.createElement("td", {className:"px-4 py-2.5 text-right tabular-nums whitespace-nowrap"},
                  totalIn>0  && /*#__PURE__*/React.createElement("span", {className:"text-[#047857]"}, "+", vnd(totalIn)),
                  totalIn>0 && totalOut<0 && /*#__PURE__*/React.createElement("span", {className:"mx-1 text-slate-400"}, " / "),
                  totalOut<0 && /*#__PURE__*/React.createElement("span", {className:"text-[#B91C1C]"}, vnd(totalOut))),
                /*#__PURE__*/React.createElement("td", {colSpan:2}));
            })(),
            head:/*#__PURE__*/React.createElement(React.Fragment,null,
              /*#__PURE__*/React.createElement(Th,{center:true,style:{minWidth:90}},"Ngày"),
              /*#__PURE__*/React.createElement(Th,{style:{width:60,minWidth:60}},"Số phiếu"),
              !patOnly && /*#__PURE__*/React.createElement(Th,{center:true,style:{width:90,minWidth:90}},"Số đơn"),
              /*#__PURE__*/React.createElement(Th,{style:{minWidth:180}},"Đối tượng"),
              /*#__PURE__*/React.createElement(Th,{center:true,style:{width:155,minWidth:155}},"Loại giao dịch"),
              /*#__PURE__*/React.createElement(Th,{center:true,style:{minWidth:110}},"Số tiền"),
              /*#__PURE__*/React.createElement(Th,{style:{minWidth:200}},"Nội dung"),
              /*#__PURE__*/React.createElement(Th,{center:true,style:{width:44,minWidth:44}},
                nonCancelledAcc.length>0&&/*#__PURE__*/React.createElement("button",{onClick:toggleAllAcc,className:`h-5 w-5 rounded border-2 flex items-center justify-center transition mx-auto ${allAccChecked?"border-green-500 bg-green-500 text-white":someAccChecked?"border-amber-400 bg-amber-50":"border-slate-300 hover:border-amber-400"}`},
                  allAccChecked&&/*#__PURE__*/React.createElement(Check,{className:"h-3 w-3 stroke-[3]"}),
                  someAccChecked&&!allAccChecked&&/*#__PURE__*/React.createElement("span",{className:"block w-2.5 h-0.5 bg-amber-500 rounded"}))))},
            pagedAccTxns.map((t,i)=>/*#__PURE__*/React.createElement("tr",{key:t.id,className:t.cancelled?"opacity-50 bg-slate-50":""},
              /*#__PURE__*/React.createElement("td",{className:"px-3 py-2.5 text-xs text-slate-500"},(() => {
                const parts = String(t.date||"").split(" ");
                return /*#__PURE__*/React.createElement(React.Fragment,null,
                  /*#__PURE__*/React.createElement("span",{className:"block"},(parts[0]||"")),
                  parts[1] ? /*#__PURE__*/React.createElement("span",{className:"block text-slate-400"},(parts[1]||"").split(":").slice(0,2).join(":")) : null);
              })()),
              /*#__PURE__*/React.createElement("td",{className:"px-3 py-2.5 tabular-nums"},
                /*#__PURE__*/React.createElement("span",{className:`inline-flex items-center whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-medium ${t.amount>0?"bg-[#dcfce7] text-[#047857]":t.amount<0?"bg-[#fee2e2] text-[#B91C1C]":"bg-slate-100 text-slate-600"}`},
                  fmtDocId(t.amount>=0?"PT":"PC",(detailPage-1)*ACC_PER_PAGE+i+1))),
              !patOnly && /*#__PURE__*/React.createElement("td",{className:"px-2 py-2 text-center"},
                t.orderId ? /*#__PURE__*/React.createElement("span",{className:"inline-flex items-center rounded px-1.5 py-0.5 text-[11px] font-medium bg-amber-50 text-amber-800 ring-1 ring-amber-200 whitespace-nowrap"},t.orderId) : null),
              /*#__PURE__*/React.createElement("td",{className:"px-3 py-2.5 text-slate-700"},t.entity),
              /*#__PURE__*/React.createElement("td",{className:"px-2 py-2 text-center"},
                /*#__PURE__*/React.createElement("select",{
                  value:t.kind||"",
                  onChange:e=>setTxns(p=>p.map(x=>x.id===t.id?{...x,kind:e.target.value}:x)),
                  className:`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium border-0 outline-none cursor-pointer ${(normalizeKind(t)==="Chuyển đi"||normalizeKind(t)==="Chuyển về")?"bg-slate-100 text-slate-600 ring-1 ring-slate-200":t.amount>=0?THU:t.amount<0?CHI:"bg-slate-100 text-slate-600"}`},
                  /*#__PURE__*/React.createElement("option",{value:""},"— chọn loại —"),
                  (t.amount>=0?allThuKinds:allChiKinds).map(k=>/*#__PURE__*/React.createElement("option",{key:k,value:k},k)))),
              /*#__PURE__*/React.createElement("td",{className:"whitespace-nowrap px-3 py-2.5 text-right"},
                /*#__PURE__*/React.createElement("span",{className:`inline-flex items-center whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-semibold tabular-nums ${t.cancelled?"line-through bg-slate-100 text-slate-400":t.amount>0?"bg-[#dcfce7] text-[#047857]":t.amount<0?"bg-[#fee2e2] text-[#B91C1C]":"bg-slate-100 text-slate-500"}`},
                  (t.amount>=0?"+":"")+vnd(t.amount))),
              /*#__PURE__*/React.createElement("td",{className:"px-3 py-2.5 text-slate-500 text-xs"},t.note||""),
              /*#__PURE__*/React.createElement("td",{className:"px-2 py-2 text-center"},
                !t.cancelled&&/*#__PURE__*/React.createElement("button",{onClick:()=>toggleCheck(t.id),title:t.checked?"Bỏ đối chiếu":"Đã đối chiếu",className:`h-5 w-5 rounded border-2 flex items-center justify-center transition mx-auto ${t.checked?"border-green-500 bg-green-500 text-white":"border-slate-300 hover:border-amber-400"}`},
                  t.checked&&/*#__PURE__*/React.createElement(Check,{className:"h-3 w-3 stroke-[3]"})))))))),
      totalAccPages>1 && /*#__PURE__*/React.createElement("div",{className:"flex items-center justify-between gap-3 pt-3 px-1 flex-wrap"},
        /*#__PURE__*/React.createElement("span",{className:"text-xs text-slate-500"},`${(detailPage-1)*ACC_PER_PAGE+1}–${Math.min(detailPage*ACC_PER_PAGE,accTxns.length)} / ${accTxns.length} giao dịch`),
        /*#__PURE__*/React.createElement("div",{className:"flex items-center gap-1"},
          /*#__PURE__*/React.createElement("button",{disabled:detailPage===1,onClick:()=>setDetailPage(p=>Math.max(1,p-1)),className:"rounded px-2 py-1 text-sm text-slate-600 hover:bg-slate-100 disabled:opacity-30"},"Trước"),
          Array.from({length:totalAccPages},(_,i)=>i+1).map(n=>/*#__PURE__*/React.createElement("button",{key:n,onClick:()=>setDetailPage(n),className:`min-w-[2rem] rounded px-2 py-1 text-sm font-medium ${detailPage===n?"bg-[#92400e] text-white":"text-slate-600 hover:bg-slate-100"}`},n)),
          /*#__PURE__*/React.createElement("button",{disabled:detailPage===totalAccPages,onClick:()=>setDetailPage(p=>Math.min(totalAccPages,p+1)),className:"rounded px-2 py-1 text-sm text-slate-600 hover:bg-slate-100 disabled:opacity-30"},"Sau"))),
      modal==="thu" && /*#__PURE__*/React.createElement(PhieuThuModal,{onClose:()=>setModal(null),onSave:addTxn,nextId}),
      modal==="chi" && /*#__PURE__*/React.createElement(PhieuChiModal,{onClose:()=>setModal(null),onSave:addChi,nextId,kinds:patOnly?["CP cá nhân <500k","CP tiền học","CP điện nước","CP thuê nhà"]:null,initAcc:patOnly?"TCB-PAT":null}),
      modal==="chuyen" && /*#__PURE__*/React.createElement(ChuyenTienModal,{onClose:()=>setModal(null),onSave:addXfer,nextId}),
      cancelTarget && /*#__PURE__*/React.createElement(HuyGiaoDichModal,{onClose:()=>setCancelTarget(null),onConfirm:reason=>cancelTxn(cancelTarget,reason)}),
      editTxn && /*#__PURE__*/React.createElement(EditTxnModal,{txn:editTxn,onClose:()=>setEditTxn(null),onSave:saveTxnEdit}),
);
  }

  return /*#__PURE__*/React.createElement("div", {className:"space-y-4"},

    isAdmin && /*#__PURE__*/React.createElement("div", {className:"flex gap-1 border-b border-slate-200 mb-1"},
      /*#__PURE__*/React.createElement("button", {
        onClick:()=>setFinTab("cty"),
        className:`px-4 py-2 text-sm font-medium border-b-2 transition ${finTab==="cty" ? "border-[#fed7aa] text-[#92400e]" : "border-transparent text-slate-500 hover:text-slate-700"}`
      }, "Tài khoản công ty"),
      /*#__PURE__*/React.createElement("button", {
        onClick:()=>setFinTab("pat"),
        className:`px-4 py-2 text-sm font-medium border-b-2 transition ${finTab==="pat" ? "border-[#fed7aa] text-[#92400e]" : "border-transparent text-slate-500 hover:text-slate-700"}`
      }, "Tài khoản cá nhân")),

    /*#__PURE__*/React.createElement(Card, {title: "Sổ quỹ",
      right: /*#__PURE__*/React.createElement("div", {className:"flex flex-wrap items-center gap-2"},
        /*#__PURE__*/React.createElement(DateRangeFilter, {compact:true, initFrom:fromDate, initTo:toDate, onApply:(f,t)=>{setFromDate(f);setToDate(t);}}),
        /*#__PURE__*/React.createElement("button", {onClick:()=>setModal("thu"), className:"inline-flex items-center gap-1.5 rounded-lg bg-[#b45309] px-3 py-1.5 text-sm font-semibold text-white hover:bg-[#92400e]"},
          /*#__PURE__*/React.createElement(Plus, {className:"h-4 w-4"}), "Lập phiếu thu"),
        /*#__PURE__*/React.createElement("button", {onClick:()=>setModal("chi"), className:"inline-flex items-center gap-1.5 rounded-lg bg-[#92400e] px-3 py-1.5 text-sm font-semibold text-white hover:bg-[#78350f]"},
          /*#__PURE__*/React.createElement(Minus, {className:"h-4 w-4"}), "Lập phiếu chi"),
        /*#__PURE__*/React.createElement("button", {onClick:()=>setModal("chuyen"), className:"inline-flex items-center gap-1.5 rounded-lg bg-[#78350f] px-3 py-1.5 text-sm font-semibold text-white hover:bg-[#78350f]"},
          /*#__PURE__*/React.createElement(ArrowLeftRight, {className:"h-4 w-4"}), "Chuyển tiền nội bộ"),
)},
      /*#__PURE__*/React.createElement("div", {className:"-mx-5 -mb-5 overflow-x-auto"},
        /*#__PURE__*/React.createElement("table", {className:"w-full text-sm tbl-list"},
          /*#__PURE__*/React.createElement("thead", null,
            /*#__PURE__*/React.createElement("tr", null,
              /*#__PURE__*/React.createElement("th",{className:thC},"Tài khoản"),
              /*#__PURE__*/React.createElement("th",{className:thC},"Số TK"),
              /*#__PURE__*/React.createElement("th",{className:thC},"Chủ TK"),
              /*#__PURE__*/React.createElement("th",{className:thR},"Dư đầu kỳ"),
              /*#__PURE__*/React.createElement("th",{className:thR},"Thu"),
              /*#__PURE__*/React.createElement("th",{className:thR},"Chi"),
              /*#__PURE__*/React.createElement("th",{className:thR},"Số dư hiện tại"),
              /*#__PURE__*/React.createElement("th",{className:"px-3 py-2.5 text-center"},""))),
          /*#__PURE__*/React.createElement("tbody", null,
            accSummary.map(a=>/*#__PURE__*/React.createElement("tr",{key:a.key, className:""},
              /*#__PURE__*/React.createElement("td",{className:tdC+" font-medium"},a.bank),
              /*#__PURE__*/React.createElement("td",{className:tdC},a.account),
              /*#__PURE__*/React.createElement("td",{className:tdC+" text-slate-500 text-xs"},a.owner),
              /*#__PURE__*/React.createElement("td",{className:tdR+" text-slate-700"},vnd(a.periodOpenBal)),
              /*#__PURE__*/React.createElement("td",{className:tdR+(a.totalIn>0?" text-[#047857]":" text-slate-300")},a.totalIn>0?vnd(a.totalIn):""),
              /*#__PURE__*/React.createElement("td",{className:tdR+(a.totalOut>0?" text-[#B91C1C]":" text-slate-300")},a.totalOut>0?vnd(a.totalOut):""),
              /*#__PURE__*/React.createElement("td",{className:tdR+(a.closeBal<0?" text-[#B91C1C] font-bold":" text-slate-900 font-semibold")},vnd(a.closeBal)),
              /*#__PURE__*/React.createElement("td",{className:"px-3 py-2 text-center"},
                /*#__PURE__*/React.createElement("button",{onClick:()=>setFAccDetail(a.key),
                  className:"rounded-md px-2 py-1 text-xs font-medium transition bg-[#fde68a] text-[#92400e] hover:bg-amber-200 ring-1 ring-[#92400e]/20"},"Chi tiết")))),
            /*#__PURE__*/React.createElement("tr",{className:"bg-[#fed7aa]"},
              /*#__PURE__*/React.createElement("td",{className:tdC+" font-bold text-slate-800",colSpan:3},"TỔNG CỘNG"),
              /*#__PURE__*/React.createElement("td",{className:"px-3 py-2.5 text-right tabular-nums text-slate-900",style:{fontWeight:700}},vnd(tot.openBal)),
              /*#__PURE__*/React.createElement("td",{className:"px-3 py-2.5 text-right tabular-nums text-[#047857]",style:{fontWeight:700}},tot.totalIn>0?vnd(tot.totalIn):""),
              /*#__PURE__*/React.createElement("td",{className:"px-3 py-2.5 text-right tabular-nums text-[#B91C1C]",style:{fontWeight:700}},tot.totalOut>0?vnd(tot.totalOut):""),
              /*#__PURE__*/React.createElement("td",{className:"px-3 py-2.5 text-right tabular-nums text-slate-900",style:{fontWeight:700}},vnd(tot.closeBal)),
              /*#__PURE__*/React.createElement("td",null)))))),

    /*#__PURE__*/React.createElement("div", {className:"rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden"},
      /*#__PURE__*/React.createElement("div", {className:"grid grid-cols-2 divide-x divide-slate-100"},
        /*#__PURE__*/React.createElement("div", {className:"flex flex-col"},
          /*#__PURE__*/React.createElement("div", {className:"px-5 py-3 border-b border-slate-100"},
            /*#__PURE__*/React.createElement("span", {className:"inline-flex items-center rounded-full bg-[#fef9f0] px-3 py-1 text-sm font-semibold text-[#92400e] ring-1 ring-[#b45309]/40"}, "Phân loại thu")),
          /*#__PURE__*/React.createElement("table", {className:"w-full text-sm tbl-list"},
            /*#__PURE__*/React.createElement("tbody", null,
              thuGroups.map(g=>/*#__PURE__*/React.createElement("tr",{key:g.kind},
                /*#__PURE__*/React.createElement("td",{className:tdC},g.kind),
                /*#__PURE__*/React.createElement("td",{className:tdR+" text-[#047857]"},vnd(g.total)))))),
          /*#__PURE__*/React.createElement("table", {className:"w-full text-sm tbl-list mt-auto"},
            /*#__PURE__*/React.createElement("tbody", null,
              /*#__PURE__*/React.createElement("tr",{className:"bg-[#fed7aa]"},
                /*#__PURE__*/React.createElement("td",{className:tdC+" text-slate-800",style:{fontWeight:700}},"Tổng thu"),
                /*#__PURE__*/React.createElement("td",{className:tdR+" text-[#047857]",style:{fontWeight:700}},vnd(totalThu)))))),
        /*#__PURE__*/React.createElement("div", {className:"flex flex-col"},
          /*#__PURE__*/React.createElement("div", {className:"px-5 py-3 border-b border-slate-100"},
            /*#__PURE__*/React.createElement("span", {className:"inline-flex items-center rounded-full bg-[#fef9f0] px-3 py-1 text-sm font-semibold text-[#92400e] ring-1 ring-[#b45309]/40"}, "Phân loại chi")),
          /*#__PURE__*/React.createElement("table", {className:"w-full text-sm tbl-list"},
            /*#__PURE__*/React.createElement("tbody", null,
              ...chiMainItems.map(i=>/*#__PURE__*/React.createElement("tr",{key:i.kind},
                /*#__PURE__*/React.createElement("td",{className:tdC},i.kind),
                /*#__PURE__*/React.createElement("td",{className:tdR+" text-[#B91C1C]"},vnd(i.total)))),
              chiSmallTotal>0&&/*#__PURE__*/React.createElement("tr",{key:"chi_khac"},
                /*#__PURE__*/React.createElement("td",{className:tdC+" text-slate-500"},"Chi phí khác"),
                /*#__PURE__*/React.createElement("td",{className:tdR+" text-[#B91C1C]"},vnd(chiSmallTotal))))),
          /*#__PURE__*/React.createElement("table", {className:"w-full text-sm tbl-list mt-auto"},
            /*#__PURE__*/React.createElement("tbody", null,
              /*#__PURE__*/React.createElement("tr",{className:"bg-[#fed7aa]"},
                /*#__PURE__*/React.createElement("td",{className:tdC+" text-slate-800",style:{fontWeight:700}},"Tổng chi"),
                /*#__PURE__*/React.createElement("td",{className:tdR+" text-[#B91C1C]",style:{fontWeight:700}},vnd(totalChi)))))))),

    /*#__PURE__*/React.createElement(Card, {title: "Lịch sử giao dịch",
      right: /*#__PURE__*/React.createElement("div", {className:"flex flex-wrap items-center gap-2"},
        /*#__PURE__*/React.createElement("div", {className:"relative"},
          /*#__PURE__*/React.createElement(Search, {className:"absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400"}),
          /*#__PURE__*/React.createElement("input", {value:q, onChange:e=>setQ(e.target.value), placeholder:"Tìm kiếm...", className:`${field} w-48 pl-8 py-1.5 text-sm`})),
        /*#__PURE__*/React.createElement("select", {value:fAcc, onChange:e=>{ setFAcc(e.target.value); setFAccDetail(null); }, className:`${field} py-1.5 text-sm`},
          allAccs.map(a=>/*#__PURE__*/React.createElement("option",{key:a},a))),
        /*#__PURE__*/React.createElement("select", {value:fDir, onChange:e=>setFDir(e.target.value), className:`${field} py-1.5 text-sm`},
          [["Tất cả","Thu / Chi"],["Thu","Thu"],["Chi","Chi"]].map(([v,l])=>/*#__PURE__*/React.createElement("option",{key:v,value:v},l))),
        /*#__PURE__*/React.createElement(PrintBtn, null),
        /*#__PURE__*/React.createElement(ExportBtn, {onClick: onExportTxn}),
        !patOnly&&/*#__PURE__*/React.createElement(ReconcileBtn, {txns, setTxns, orders}))},
      /*#__PURE__*/React.createElement("div", {className:"-mx-5 -mb-5"},
        /*#__PURE__*/React.createElement(TableShell, {minW:"1100px",
          head:/*#__PURE__*/React.createElement(React.Fragment,null,
            /*#__PURE__*/React.createElement(Th,{center:true,style:{minWidth:90}},"Ngày"),
            /*#__PURE__*/React.createElement(Th,{style:{width:90,minWidth:90}},"Số phiếu"),
            !patOnly&&/*#__PURE__*/React.createElement(Th,{style:{width:90,minWidth:90}},"Số đơn hàng"),
            /*#__PURE__*/React.createElement(Th,{style:{minWidth:160}},"Đối tượng"),
            /*#__PURE__*/React.createElement(Th,{center:true,style:{width:patOnly?160:140,minWidth:patOnly?160:140}},"Loại giao dịch"),
            /*#__PURE__*/React.createElement(Th,{center:true,style:{minWidth:110}},"Tài khoản"),
            /*#__PURE__*/React.createElement(Th,{center:true,style:{minWidth:110}},"Số tiền"),
            /*#__PURE__*/React.createElement(Th,{style:{minWidth:200}},"Nội dung"),
            !patOnly&&/*#__PURE__*/React.createElement(Th,{style:{minWidth:80}},"Người tạo"),
            /*#__PURE__*/React.createElement(Th,{center:true,style:{width:44,minWidth:44}},
              nonCancelledMain.length>0&&/*#__PURE__*/React.createElement("button",{onClick:toggleAllMain,className:`h-5 w-5 rounded border-2 flex items-center justify-center transition mx-auto ${allMainChecked?"border-green-500 bg-green-500 text-white":someMainChecked?"border-amber-400 bg-amber-50":"border-slate-300 hover:border-amber-400"}`},
                allMainChecked&&/*#__PURE__*/React.createElement(Check,{className:"h-3 w-3 stroke-[3]"}),
                someMainChecked&&!allMainChecked&&/*#__PURE__*/React.createElement("span",{className:"block w-2.5 h-0.5 bg-amber-500 rounded"}))),
            !patOnly&&/*#__PURE__*/React.createElement(Th,{center:true},""))},
          pagedTxns.map((t,i)=>/*#__PURE__*/React.createElement("tr",{key:t.id,className:t.cancelled?"opacity-50 bg-slate-50":""},
            /*#__PURE__*/React.createElement("td",{className:"px-3 py-2.5 text-xs text-slate-500"}, (() => {
              const parts = String(t.date||"").split(" ");
              return /*#__PURE__*/React.createElement(React.Fragment,null,
                /*#__PURE__*/React.createElement("span",{className:"block"},(parts[0]||"")),
                parts[1] ? /*#__PURE__*/React.createElement("span",{className:"block text-slate-400"},(parts[1]||"").split(":").slice(0,2).join(":")) : null);
            })()),
            /*#__PURE__*/React.createElement("td",{className:"px-3 py-2.5 tabular-nums"},
              /*#__PURE__*/React.createElement("span",{className:`inline-flex items-center whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-medium ${t.amount > 0 ? "bg-[#dcfce7] text-[#047857]" : t.amount < 0 ? "bg-[#fee2e2] text-[#B91C1C]" : "bg-slate-100 text-slate-600"}`},
                fmtDocId(t.amount>=0?"PT":"PC",(txnPage-1)*TXN_PER_PAGE+i+1))),
            !patOnly&&/*#__PURE__*/React.createElement("td",{className:"px-3 py-2.5"},
              t.orderId ? /*#__PURE__*/React.createElement("button",{className:"inline-flex items-center whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-medium bg-[#fef9f0] text-[#92400e] hover:bg-amber-100", onClick:()=>onOpenOrder&&onOpenOrder(t.orderId)},t.orderId) : /*#__PURE__*/React.createElement("span",{className:"text-slate-300"},"")),
            /*#__PURE__*/React.createElement("td",{className:"px-3 py-2.5 text-slate-700"},t.entity),
            /*#__PURE__*/React.createElement("td",{className:"px-2 py-2 text-center"},
              /*#__PURE__*/React.createElement("select",{
                value:t.kind||"",
                onChange:e=>setTxns(p=>p.map(x=>x.id===t.id?{...x,kind:e.target.value}:x)),
                className:`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium border-0 outline-none cursor-pointer ${(normalizeKind(t)==="Chuyển đi"||normalizeKind(t)==="Chuyển về")?"bg-slate-100 text-slate-600 ring-1 ring-slate-200":t.amount>=0?THU:t.amount<0?CHI:"bg-slate-100 text-slate-600"}`},
                /*#__PURE__*/React.createElement("option",{value:""},"— chọn loại —"),
                (t.amount>=0?allThuKinds:allChiKinds).map(k=>/*#__PURE__*/React.createElement("option",{key:k,value:k},k)))),
            /*#__PURE__*/React.createElement("td",{className:"whitespace-nowrap px-3 py-2.5 text-slate-600 text-xs"},t.acc),
            /*#__PURE__*/React.createElement("td",{className:"whitespace-nowrap px-3 py-2.5 text-right"},
              /*#__PURE__*/React.createElement("span",{className:`inline-flex items-center whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-semibold tabular-nums ${t.cancelled?"line-through bg-slate-100 text-slate-400":t.amount>0?"bg-[#dcfce7] text-[#047857]":t.amount<0?"bg-[#fee2e2] text-[#B91C1C]":"bg-slate-100 text-slate-500"}`},
                (t.amount>=0?"+":"")+vnd(t.amount))),
            /*#__PURE__*/React.createElement("td",{className:"px-3 py-2.5 text-slate-500 text-xs"},t.note||""),
            !patOnly&&/*#__PURE__*/React.createElement("td",{className:"whitespace-nowrap px-3 py-2.5 text-xs text-slate-500"},t.staff),
            /*#__PURE__*/React.createElement("td",{className:"px-2 py-2 text-center"},
              !t.cancelled&&/*#__PURE__*/React.createElement("button",{onClick:()=>toggleCheck(t.id),title:t.checked?"Bỏ đối chiếu":"Đã đối chiếu",className:`h-5 w-5 rounded border-2 flex items-center justify-center transition mx-auto ${t.checked?"border-green-500 bg-green-500 text-white":"border-slate-300 hover:border-amber-400"}`},
                t.checked&&/*#__PURE__*/React.createElement(Check,{className:"h-3 w-3 stroke-[3]"}))),
            !patOnly&&/*#__PURE__*/React.createElement("td",{className:"px-3 py-2.5 text-center"},
              t.cancelled
                ?/*#__PURE__*/React.createElement("button",{onClick:()=>restoreTxn(t.id),className:"rounded px-2 py-0.5 text-xs font-medium bg-slate-100 text-slate-500 hover:bg-emerald-100 hover:text-emerald-700"},"Khôi phục")
                :(!t.orderId?/*#__PURE__*/React.createElement("button",{onClick:()=>setEditTxn(t),title:"Sửa giao dịch",className:"rounded p-1 text-slate-400 hover:text-amber-700 hover:bg-amber-50"},/*#__PURE__*/React.createElement(Pencil,{className:"h-3.5 w-3.5"})):null))))))),
    totalTxnPages > 1 && /*#__PURE__*/React.createElement("div", {className: "flex items-center justify-between gap-3 pt-3 px-1 flex-wrap"},
      /*#__PURE__*/React.createElement("span", {className: "text-xs text-slate-500"},
        `${(txnPage-1)*TXN_PER_PAGE+1}–${Math.min(txnPage*TXN_PER_PAGE, visibleTxns.length)} / ${visibleTxns.length} giao dịch`),
      /*#__PURE__*/React.createElement("div", {className: "flex items-center gap-1"},
        /*#__PURE__*/React.createElement("button", {
          disabled: txnPage === 1,
          onClick: () => setTxnPage(p => Math.max(1, p-1)),
          className: "rounded px-2 py-1 text-sm text-slate-600 hover:bg-slate-100 disabled:opacity-30"
        }, "Trước"),
        txnPageNums().map((n, i) => n === "..." ?
          /*#__PURE__*/React.createElement("span", {key: `e${i}`, className: "px-1 text-slate-400"}, "...") :
          /*#__PURE__*/React.createElement("button", {
            key: n,
            onClick: () => setTxnPage(n),
            className: `min-w-[2rem] rounded px-2 py-1 text-sm font-medium ${txnPage === n ? "bg-[#92400e] text-white" : "text-slate-600 hover:bg-slate-100"}`
          }, n)
        ),
        /*#__PURE__*/React.createElement("button", {
          disabled: txnPage === totalTxnPages,
          onClick: () => setTxnPage(p => Math.min(totalTxnPages, p+1)),
          className: "rounded px-2 py-1 text-sm text-slate-600 hover:bg-slate-100 disabled:opacity-30"
        }, "Sau")
      )
    ),

    modal==="thu"    && /*#__PURE__*/React.createElement(PhieuThuModal,  {onClose:()=>setModal(null), onSave:addTxn,  nextId}),
    modal==="chi"    && /*#__PURE__*/React.createElement(PhieuChiModal,  {onClose:()=>setModal(null), onSave:addChi,  nextId, kinds:patOnly?["CP cá nhân <500k","CP tiền học","CP điện nước","CP thuê nhà"]:null,initAcc:patOnly?"TCB-PAT":null}),
    modal==="chuyen" && /*#__PURE__*/React.createElement(ChuyenTienModal,{onClose:()=>setModal(null), onSave:addXfer, nextId}),
    cancelTarget && /*#__PURE__*/React.createElement(HuyGiaoDichModal,{onClose:()=>setCancelTarget(null),onConfirm:reason=>cancelTxn(cancelTarget,reason)}),
    editTxn && /*#__PURE__*/React.createElement(EditTxnModal,{txn:editTxn,onClose:()=>setEditTxn(null),onSave:saveTxnEdit}));
}
