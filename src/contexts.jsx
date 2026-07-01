import React, { useState } from 'react';
import { Check } from 'lucide-react';

/* ───────── Supplier costs context ───────── */
export const SupplierCostsCtx = React.createContext([]);
export const useSupplierCosts = () => React.useContext(SupplierCostsCtx);

/* ───────── Bank accounts context ───────── */
export const INIT_BANK_ACCOUNTS = [
  {id:1, key:"TCB-CTY",  bank:"TCB-CTY BLTK HP", account:"02", owner:"CÔNG TY BTLK HP", branch:"", note:"", openBal:951999,   status:"Hoạt động"},
  {id:2, key:"TCB-PAT",  bank:"TCB-PAT",          account:"01", owner:"PAT",              branch:"", note:"", openBal:218663367, status:"Hoạt động"},
  {id:3, key:"Tiền mặt", bank:"TIEN MAT",         account:"TM", owner:"Tiền mặt",         branch:"", note:"", openBal:0,        status:"Hoạt động"},
];
export const BankCtx = React.createContext(null);
export const useBankAccounts = () => React.useContext(BankCtx);

/* ───────── Txn kinds context ───────── */
export const DEFAULT_THU_KINDS = ["Đặt cọc","Thanh toán"];
export const DEFAULT_CHI_KINDS = ["CPVC Nhập Hàng","CP Đặt Cọc NCC","CP Thanh Toán NCC","CP Ship ĐH","CP Lắp Đặt","CP Hoàn Hàng","CP Thuê Nhà","CP Tiền Điện","CP Tiền Nước","CP Vận Hành","Hoàn tiền KH","Chi hoa hồng","Chi khác"];
export const TxnKindsCtx = React.createContext(null);
export const useTxnKinds = () => React.useContext(TxnKindsCtx);

/* ───────── Transaction context ───────── */
export const TxnCtx = React.createContext(null);
export const useTxns = () => React.useContext(TxnCtx);

/* ───────── Inventory context ───────── */
export const InvCtx = React.createContext({whInItems: [], setWhInItems: () => {}, whOutItems: [], setWhOutItems: () => {}});
export const useInventory = () => React.useContext(InvCtx);

/* ───────── DocNum context ───────── */
export const DocNumCtx = React.createContext(null);
export const useDocNum = () => React.useContext(DocNumCtx);

/* ───────── Toast ───────── */
export const ToastCtx = React.createContext(() => {});
export function useToast() { return React.useContext(ToastCtx); }
export function ToastHost({ children }) {
  const [msg, setMsg] = useState(null);
  const notify = React.useCallback(m => {
    setMsg(m);
    setTimeout(() => setMsg(null), 2200);
  }, []);
  return React.createElement(ToastCtx.Provider, { value: notify },
    children,
    msg && React.createElement("div", {
      className: "fixed top-5 left-1/2 z-[60] -translate-x-1/2 flex items-center gap-1.5 rounded-lg border border-[#b45309] bg-[#fef9f0] px-4 py-2 text-sm font-medium text-[#92400e] shadow-lg"
    }, React.createElement(Check, {className: "h-4 w-4 shrink-0"}), msg.replace(/^[✅✓⚠️⚠]\s*/u, ""))
  );
}
