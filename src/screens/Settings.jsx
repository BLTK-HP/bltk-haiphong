import React, { useState } from 'react';
import { Plus, Pencil, Trash2, Eye, EyeOff, AlertTriangle } from 'lucide-react';
import { useCollection, saveDoc, deleteDocument } from '../useFirestore.js';
import { collection, getDocs, deleteDoc, doc as fsDoc } from 'firebase/firestore';
import { db, auth } from '../firebase.js';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { useAuth, ROLES, createUserProfile } from '../useAuth.js';
import {
  DEFAULT_THU_KINDS, DEFAULT_CHI_KINDS, useTxnKinds,
  useToast, useBankAccounts, useDocNum, useSupplierCosts,
} from '../contexts.jsx';
import { vnd, field, inputF, blueBtn, ghostBtn, addBtn, SUPPLIER_COSTS, fmtDocId } from '../constants.js';
import { NumInput, KindList, Th, TableShell, Card, IconBtn } from '../components/ui.jsx';

export function SettingsTxnKinds() {
  const { txnKinds, saveTxnKinds } = useTxnKinds() || {};
  const notify = useToast();
  const thuList = txnKinds?.thuKinds || DEFAULT_THU_KINDS;
  const chiList = txnKinds?.chiKinds || DEFAULT_CHI_KINDS;
  const [editGroup, setEditGroup] = React.useState(null); // "thu" | "chi"
  const [editIdx, setEditIdx]     = React.useState(null);
  const [editVal, setEditVal]     = React.useState("");
  const [addGroup, setAddGroup]   = React.useState(null);
  const [addVal, setAddVal]       = React.useState("");

  const startEdit = (group, idx, val) => { setEditGroup(group); setEditIdx(idx); setEditVal(val); setAddGroup(null); };
  const cancelEdit = () => { setEditGroup(null); setEditIdx(null); };
  const saveEdit = () => {
    if (!editVal.trim()) return;
    const list = editGroup === "thu" ? [...thuList] : [...chiList];
    list[editIdx] = editVal.trim();
    editGroup === "thu" ? saveTxnKinds(list, chiList) : saveTxnKinds(thuList, list);
    notify("Đã lưu");
    cancelEdit();
  };
  const deleteItem = (group, idx) => {
    if (!window.confirm("Xoá loại này?")) return;
    const list = group === "thu" ? thuList.filter((_,i)=>i!==idx) : chiList.filter((_,i)=>i!==idx);
    group === "thu" ? saveTxnKinds(list, chiList) : saveTxnKinds(thuList, list);
    notify("Đã xoá");
  };
  const startAdd = (group) => { setAddGroup(group); setAddVal(""); setEditGroup(null); };
  const confirmAdd = () => {
    if (!addVal.trim()) return;
    const list = addGroup === "thu" ? [...thuList, addVal.trim()] : [...chiList, addVal.trim()];
    addGroup === "thu" ? saveTxnKinds(list, chiList) : saveTxnKinds(thuList, list);
    notify("Đã thêm");
    setAddGroup(null);
  };
  const moveItem = (group, idx, dir) => {
    const list = [...(group === "thu" ? thuList : chiList)];
    const to = idx + dir;
    if (to < 0 || to >= list.length) return;
    [list[idx], list[to]] = [list[to], list[idx]];
    group === "thu" ? saveTxnKinds(list, chiList) : saveTxnKinds(thuList, list);
  };

  const kindListProps = {
    editGroup, editIdx, editVal,
    onEditChange: setEditVal,
    onEditSave: saveEdit,
    onEditCancel: cancelEdit,
    onStartEdit: startEdit,
    addGroup, addVal,
    onAddChange: setAddVal,
    onConfirmAdd: confirmAdd,
    onCancelAdd: () => setAddGroup(null),
    onStartAdd: startAdd,
    onMoveItem: moveItem,
    onDeleteItem: deleteItem,
  };

  return /*#__PURE__*/React.createElement("div", {className:"mx-auto max-w-2xl space-y-4 py-4"},
    /*#__PURE__*/React.createElement("div", {className:"flex items-center justify-between"},
      /*#__PURE__*/React.createElement("h2", {className:"text-[22px] font-bold text-slate-800"}, "Loại giao dịch Thu/Chi"),
      /*#__PURE__*/React.createElement("button", {onClick:()=>{if(window.confirm("Khôi phục danh sách mặc định?"))saveTxnKinds(DEFAULT_THU_KINDS,DEFAULT_CHI_KINDS);}, className:ghostBtn}, "Khôi phục mặc định")),
    /*#__PURE__*/React.createElement("p", {className:"text-sm text-slate-500"}, "Danh sách hiển thị trong dropdown chọn loại giao dịch trên màn hình Tài chính. Thêm/sửa/xoá không ảnh hưởng dữ liệu đã lưu."),
    /*#__PURE__*/React.createElement(KindList, {group:"thu", list:thuList, color:"text-[#047857]", ...kindListProps}),
    /*#__PURE__*/React.createElement(KindList, {group:"chi", list:chiList, color:"text-[#B91C1C]", ...kindListProps}));
}

/* ───────── Settings Supplier Costs ───────── */
export function SettingsSupplierCosts() {
  const costs = useSupplierCosts();
  const notify = useToast();
  const [editing, setEditing] = React.useState(null);
  const [adding, setAdding] = React.useState(false);
  const [newEntry, setNewEntry] = React.useState({ pat: "", from: "", price: 0, note: "" });
  const [search, setSearch] = React.useState("");

  const filtered = costs.filter(c => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (c.pat || []).some(p => p.toLowerCase().includes(s)) || (c.note || "").toLowerCase().includes(s);
  }).slice().sort((a, b) => (a.pat?.[0] || "").localeCompare(b.pat?.[0] || ""));

  const saveEntry = async (entry) => {
    const docId = entry._id || String(Date.now());
    const { _id, ...clean } = entry;
    clean.pat = typeof clean.pat === "string" ? clean.pat.split(",").map(p => p.trim()).filter(Boolean) : clean.pat;
    clean.price = Number(clean.price) || 0;
    await saveDoc("supplier_costs", docId, clean);
    notify("Đã lưu");
    setEditing(null);
    setAdding(false);
  };

  const deleteEntry = async (entry) => {
    if (!window.confirm("Xoá mục này?")) return;
    await deleteDocument("supplier_costs", entry._id);
    notify("Đã xoá");
  };

  const seedFromCode = async () => {
    if (!window.confirm("Nhập " + SUPPLIER_COSTS.length + " mục từ dữ liệu gốc? Sẽ ghi đè nếu có mục cùng thứ tự.")) return;
    for (let i = 0; i < SUPPLIER_COSTS.length; i++) {
      await saveDoc("supplier_costs", String(i + 1).padStart(4, "0"), SUPPLIER_COSTS[i]);
    }
    notify("Đã nhập " + SUPPLIER_COSTS.length + " mục giá vốn");
  };

  const th = "px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500";
  const td = "px-4 py-3 text-sm text-slate-700";
  const inf = inputF;

  const EntryForm = ({ entry, onSave, onCancel }) => {
    const [form, setForm] = React.useState({ ...entry, pat: Array.isArray(entry.pat) ? entry.pat.join(", ") : (entry.pat || "") });
    return /*#__PURE__*/React.createElement("tr", { className: "bg-amber-50" },
      /*#__PURE__*/React.createElement("td", { className: td, colSpan: 2 },
        /*#__PURE__*/React.createElement("input", { className: inf, value: form.note || "", onChange: e => setForm(f => ({...f, note: e.target.value})), placeholder: "Ghi chú (vd: Bồn cầu AC-989)" }),
        /*#__PURE__*/React.createElement("input", { className: inf + " mt-1", value: form.pat, onChange: e => setForm(f => ({...f, pat: e.target.value})), placeholder: "Mã sản phẩm, cách nhau bằng dấu phẩy (vd: AC-989VN, AC-989/CW-MV)" })),
      /*#__PURE__*/React.createElement("td", { className: td },
        /*#__PURE__*/React.createElement("input", { className: inf, value: form.from || "", onChange: e => setForm(f => ({...f, from: e.target.value})), placeholder: "DD/MM/YYYY" })),
      /*#__PURE__*/React.createElement("td", { className: td },
        /*#__PURE__*/React.createElement(NumInput, { className: inf, value: Number(form.price) || 0, onChange: v => setForm(f => ({...f, price: v})) })),
      /*#__PURE__*/React.createElement("td", { className: td },
        /*#__PURE__*/React.createElement("div", { className: "flex gap-2" },
          /*#__PURE__*/React.createElement("button", { onClick: () => onSave({...entry, ...form}), className: blueBtn }, "Lưu"),
          /*#__PURE__*/React.createElement("button", { onClick: onCancel, className: ghostBtn }, "Huỷ"))));
  };

  return /*#__PURE__*/React.createElement("div", { className: "mx-auto max-w-5xl space-y-4 py-4" },
    /*#__PURE__*/React.createElement("div", { className: "flex items-center justify-between" },
      /*#__PURE__*/React.createElement("h2", { className: "text-[22px] font-bold text-slate-800" }, "Bảng giá vốn sản phẩm"),
      /*#__PURE__*/React.createElement("div", { className: "flex gap-2" },
        costs.length === 0 && /*#__PURE__*/React.createElement("button", { onClick: seedFromCode, className: "rounded-lg border border-amber-300 bg-amber-50 px-3 py-1.5 text-sm font-medium text-amber-700 hover:bg-amber-100" }, "Nhập dữ liệu ban đầu"),
        /*#__PURE__*/React.createElement("button", { onClick: () => { setAdding(true); setNewEntry({ pat: "", from: "", price: 0, note: "" }); }, className: addBtn }, "+ Thêm mới"))),
    /*#__PURE__*/React.createElement("p", { className: "text-sm text-slate-500" },
      "Giá vốn dùng để tự điền khi nhập kho hàng loạt. Hệ thống chọn mục khớp tên sản phẩm và ngày gần nhất. Hiện có: ", /*#__PURE__*/React.createElement("strong", null, costs.length), " mục."),
    /*#__PURE__*/React.createElement("input", { className: inputF + " max-w-sm", value: search, onChange: e => setSearch(e.target.value), placeholder: "Tìm theo mã sản phẩm hoặc ghi chú..." }),
    /*#__PURE__*/React.createElement("div", { className: "rounded-xl border border-slate-200 bg-white overflow-hidden" },
      /*#__PURE__*/React.createElement("table", { className: "tbl-list w-full" },
        /*#__PURE__*/React.createElement("thead", null,
          /*#__PURE__*/React.createElement("tr", null,
            /*#__PURE__*/React.createElement("th", { className: th }, "Ghi chú / Mã sản phẩm"),
            /*#__PURE__*/React.createElement("th", { className: th }, "Mã khớp"),
            /*#__PURE__*/React.createElement("th", { className: th }, "Áp dụng từ"),
            /*#__PURE__*/React.createElement("th", { className: th }, "Giá vốn (đ)"),
            /*#__PURE__*/React.createElement("th", { className: th }, ""))),
        /*#__PURE__*/React.createElement("tbody", null,
          adding && /*#__PURE__*/React.createElement(EntryForm, { entry: newEntry, onSave: saveEntry, onCancel: () => setAdding(false) }),
          filtered.map(c =>
            editing?._id === c._id
              ? /*#__PURE__*/React.createElement(EntryForm, { key: c._id, entry: editing, onSave: saveEntry, onCancel: () => setEditing(null) })
              : /*#__PURE__*/React.createElement("tr", { key: c._id, className: "border-t border-slate-100 hover:bg-slate-50" },
                  /*#__PURE__*/React.createElement("td", { className: td }, c.note || ""),
                  /*#__PURE__*/React.createElement("td", { className: td + " font-mono text-xs text-slate-500" }, (c.pat || []).join(", ")),
                  /*#__PURE__*/React.createElement("td", { className: td }, c.from || ""),
                  /*#__PURE__*/React.createElement("td", { className: td + " font-semibold text-right" }, vnd(c.price) + "đ"),
                  /*#__PURE__*/React.createElement("td", { className: td },
                    /*#__PURE__*/React.createElement("div", { className: "flex gap-2" },
                      /*#__PURE__*/React.createElement("button", { onClick: () => setEditing(c), className: "text-xs text-blue-600 hover:underline" }, "Sửa"),
                      /*#__PURE__*/React.createElement("button", { onClick: () => deleteEntry(c), className: "text-xs text-red-500 hover:underline" }, "Xoá")))))))));
}

/* ───────── Settings Payment ───────── */
export function SettingsPayment() {
  const {bankAccounts: banks, setBankAccounts: setBanks} = useBankAccounts();
  const inf = "w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-[#2563EB] focus:outline-none";
  const addBtnBlue = addBtn;
  const badge = s => s === "Hoạt động"
    ? "inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-[#92400e]"
    : "inline-flex items-center rounded-full bg-[#F1F5F9] px-2.5 py-0.5 text-xs font-semibold text-slate-500";
  const editBtn = "rounded p-1.5 bg-amber-100 text-[#92400e] hover:bg-amber-200";
  const delBtn = "rounded p-1.5 bg-amber-100 text-[#92400e] hover:bg-amber-200";
  const th = "px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wide";
  const td = "px-4 py-3 text-sm text-slate-700";

  const { txnKinds, saveTxnKinds } = useTxnKinds() || {};
  const thuList = txnKinds?.thuKinds?.length ? txnKinds.thuKinds : DEFAULT_THU_KINDS;
  const chiList = txnKinds?.chiKinds?.length ? txnKinds.chiKinds : DEFAULT_CHI_KINDS;
  const txTypes = [
    ...thuList.map((name, i) => ({id:`thu-${i}`, name, type:"Thu", status:"Hoạt động"})),
    ...chiList.map((name, i) => ({id:`chi-${i}`, name, type:"Chi", status:"Hoạt động"})),
  ];
  const [bankModal, setBankModal] = React.useState(null);
  const [txModal, setTxModal] = React.useState(null);
  const [bankForm, setBankForm] = React.useState({key:"", bank:"", account:"", owner:"", branch:"", note:"", openBal:0, openBalDate:"01/01/2026", status:"Hoạt động"});
  const [txForm, setTxForm] = React.useState({name:"", type:"Thu", status:"Hoạt động"});

  const openAddBank = () => { setBankForm({key:"", bank:"", account:"", owner:"", branch:"", note:"", openBal:0, openBalDate:"01/01/2026", status:"Hoạt động"}); setBankModal("add"); };
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
    const name = txForm.name.trim();
    if (!name) return;
    if (txModal === "add") {
      if (txForm.type === "Thu") saveTxnKinds([...thuList, name], chiList);
      else saveTxnKinds(thuList, [...chiList, name]);
    } else {
      const [grp, idx] = txModal.split("-");
      const i = parseInt(idx);
      if (grp === "thu") {
        const updated = [...thuList]; updated[i] = name;
        if (txForm.type === "Chi") saveTxnKinds(updated.filter((_,j)=>j!==i), [...chiList, name]);
        else saveTxnKinds(updated, chiList);
      } else {
        const updated = [...chiList]; updated[i] = name;
        if (txForm.type === "Thu") saveTxnKinds([...thuList, name], updated.filter((_,j)=>j!==i));
        else saveTxnKinds(thuList, updated);
      }
    }
    setTxModal(null);
  };
  const deleteTx = r => {
    const [grp, idx] = r.id.split("-");
    const i = parseInt(idx);
    if (grp === "thu") saveTxnKinds(thuList.filter((_,j)=>j!==i), chiList);
    else saveTxnKinds(thuList, chiList.filter((_,j)=>j!==i));
  };

  return /*#__PURE__*/React.createElement("div", {className: "space-y-6"},
    /*#__PURE__*/React.createElement("h2", {className: "text-[22px] font-bold text-slate-800"}, "Cài đặt thanh toán"),

    /*#__PURE__*/React.createElement("div", {className: "rounded-xl border border-slate-200 bg-white p-6 space-y-4"},
      /*#__PURE__*/React.createElement("h3", {className: "text-base font-semibold text-slate-800"}, "Quản lý tài khoản ngân hàng"),
      /*#__PURE__*/React.createElement("button", {onClick: openAddBank, className: addBtnBlue},
        /*#__PURE__*/React.createElement(Plus, {className: "h-4 w-4"}), " Thêm tài khoản ngân hàng"),
      /*#__PURE__*/React.createElement("table", {className: "w-full text-sm border-collapse", style:{tableLayout:"fixed"}},
        /*#__PURE__*/React.createElement("colgroup", null,
          /*#__PURE__*/React.createElement("col", {style:{width:"20%"}}),
          /*#__PURE__*/React.createElement("col", {style:{width:"13%"}}),
          /*#__PURE__*/React.createElement("col", {style:{width:"16%"}}),
          /*#__PURE__*/React.createElement("col", {style:{width:"17%"}}),
          /*#__PURE__*/React.createElement("col", {style:{width:"17%"}}),
          /*#__PURE__*/React.createElement("col", {style:{width:"17%"}})),
        /*#__PURE__*/React.createElement("thead", null,
          /*#__PURE__*/React.createElement("tr", {className: "border-b border-slate-200"},
            /*#__PURE__*/React.createElement("th", {className: th}, "Ngân hàng"),
            /*#__PURE__*/React.createElement("th", {className: th}, "Số tài khoản"),
            /*#__PURE__*/React.createElement("th", {className: th}, "Chủ tài khoản"),
            /*#__PURE__*/React.createElement("th", {className: th}, "Dư đầu kỳ (01/01/2026)"),
            /*#__PURE__*/React.createElement("th", {className: th}, "Trạng thái"),
            /*#__PURE__*/React.createElement("th", {className: th}, "Thao tác"))),
        /*#__PURE__*/React.createElement("tbody", {className: "divide-y divide-slate-100"},
          banks.map(r => /*#__PURE__*/React.createElement("tr", {key: r.id, className: "hover:bg-slate-50"},
            /*#__PURE__*/React.createElement("td", {className: td}, r.bank),
            /*#__PURE__*/React.createElement("td", {className: td}, r.account),
            /*#__PURE__*/React.createElement("td", {className: td}, r.owner),
            /*#__PURE__*/React.createElement("td", {className: td+" text-right tabular-nums font-medium", style:{color: r.openBal>0?"#047857":"#f59e0b"}},
              r.openBal ? r.openBal.toLocaleString("vi-VN")+"đ" : "⚠ Chưa nhập"),
            /*#__PURE__*/React.createElement("td", {className: td}, /*#__PURE__*/React.createElement("span", {className: badge(r.status)}, r.status)),
            /*#__PURE__*/React.createElement("td", {className: "px-4 py-3"},
              /*#__PURE__*/React.createElement("div", {className: "flex items-center gap-1.5"},
                /*#__PURE__*/React.createElement("button", {onClick: () => openEditBank(r), className: editBtn}, /*#__PURE__*/React.createElement(Pencil, {className: "h-3.5 w-3.5"})),
                /*#__PURE__*/React.createElement("button", {onClick: () => deleteBank(r), className: delBtn, title: "Ẩn tài khoản (không xóa vĩnh viễn)"}, /*#__PURE__*/React.createElement(Trash2, {className: "h-3.5 w-3.5"})))))))),
      bankModal !== null && /*#__PURE__*/React.createElement("div", {className: "fixed inset-0 z-50 flex items-center justify-center bg-black/40"},
        /*#__PURE__*/React.createElement("div", {className: "w-full max-w-lg rounded-xl bg-white p-6 shadow-xl space-y-4"},
          /*#__PURE__*/React.createElement("h4", {className: "text-base font-semibold text-slate-800"}, bankModal === "add" ? "Thêm tài khoản ngân hàng" : "Sửa tài khoản ngân hàng"),
          /*#__PURE__*/React.createElement("div", {className: "grid grid-cols-2 gap-3"},
            ["key:Mã tài khoản (ID)", "bank:Tên ngân hàng", "account:Số tài khoản", "owner:Chủ tài khoản", "branch:Chi nhánh", "note:Ghi chú"].map(s => {
              const [k, lbl] = s.split(":");
              return /*#__PURE__*/React.createElement("div", {key: k},
                /*#__PURE__*/React.createElement("label", {className: "mb-1 block text-xs font-medium text-slate-500"}, lbl),
                /*#__PURE__*/React.createElement("input", {className: inf, value: bankForm[k]||"", onChange: e => setBankForm(f => ({...f, [k]: e.target.value}))}));
            }),
            /*#__PURE__*/React.createElement("div", null,
              /*#__PURE__*/React.createElement("label", {className: "mb-1 block text-xs font-medium text-slate-500"}, "Dư đầu kỳ 01/01/2026 (đ)"),
              /*#__PURE__*/React.createElement(NumInput, {className: inf, value: bankForm.openBal||0, onChange: v => setBankForm(f => ({...f, openBal: v}))})),
            /*#__PURE__*/React.createElement("div", null,
              /*#__PURE__*/React.createElement("label", {className: "mb-1 block text-xs font-medium text-slate-500"}, "Trạng thái"),
              /*#__PURE__*/React.createElement("select", {className: inf, value: bankForm.status, onChange: e => setBankForm(f => ({...f, status: e.target.value}))},
                /*#__PURE__*/React.createElement("option", null, "Hoạt động"),
                /*#__PURE__*/React.createElement("option", null, "Ngừng hoạt động")))),
          /*#__PURE__*/React.createElement("p", {className: "text-xs text-amber-600 bg-amber-50 rounded-lg px-3 py-2"},
            "⚠ Số dư đầu kỳ = số dư TK ngân hàng tại ngày đầu kỳ (lấy từ sao kê NH). Tất cả giao dịch sau ngày đó sẽ cộng/trừ vào đây để ra số dư hiện tại."),
          /*#__PURE__*/React.createElement("div", {className: "flex justify-end gap-2"},
            /*#__PURE__*/React.createElement("button", {onClick: () => setBankModal(null), className: ghostBtn}, "Huỷ"),
            /*#__PURE__*/React.createElement("button", {onClick: saveBank, className: addBtnBlue}, "Lưu"))))),

    /*#__PURE__*/React.createElement("div", {className: "rounded-xl border border-slate-200 bg-white p-6 space-y-4"},
      /*#__PURE__*/React.createElement("h3", {className: "text-base font-semibold text-slate-800"}, "Quản lý loại giao dịch"),
      /*#__PURE__*/React.createElement("button", {onClick: openAddTx, className: addBtnBlue},
        /*#__PURE__*/React.createElement(Plus, {className: "h-4 w-4"}), " Thêm loại giao dịch"),
      /*#__PURE__*/React.createElement("table", {className: "w-full text-sm border-collapse", style:{tableLayout:"fixed"}},
        /*#__PURE__*/React.createElement("colgroup", null,
          /*#__PURE__*/React.createElement("col", {style:{width:"20%"}}),
          /*#__PURE__*/React.createElement("col", {style:{width:"13%"}}),
          /*#__PURE__*/React.createElement("col", {style:{width:"16%"}}),
          /*#__PURE__*/React.createElement("col", {style:{width:"17%"}}),
          /*#__PURE__*/React.createElement("col", {style:{width:"17%"}}),
          /*#__PURE__*/React.createElement("col", {style:{width:"17%"}})),
        /*#__PURE__*/React.createElement("thead", null,
          /*#__PURE__*/React.createElement("tr", {className: "border-b border-slate-200"},
            /*#__PURE__*/React.createElement("th", {className: th, colSpan:3}, "Tên loại giao dịch"),
            /*#__PURE__*/React.createElement("th", {className: th}, "Giao dịch"),
            /*#__PURE__*/React.createElement("th", {className: th}, "Trạng thái"),
            /*#__PURE__*/React.createElement("th", {className: th}, "Thao tác"))),
        /*#__PURE__*/React.createElement("tbody", {className: "divide-y divide-slate-100"},
          txTypes.map(r => /*#__PURE__*/React.createElement("tr", {key: r.id, className: "hover:bg-slate-50"},
            /*#__PURE__*/React.createElement("td", {className: td, colSpan:3}, r.name),
            /*#__PURE__*/React.createElement("td", {className: td},
              r.type && /*#__PURE__*/React.createElement("span", {className:`inline-flex items-center whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-medium ${r.type==="Thu"?"bg-[#dcfce7] text-[#047857]":"bg-[#fee2e2] text-[#B91C1C]"}`}, r.type)),
            /*#__PURE__*/React.createElement("td", {className: td}, /*#__PURE__*/React.createElement("span", {className: badge(r.status)}, r.status)),
            /*#__PURE__*/React.createElement("td", {className: "px-4 py-3"},
              /*#__PURE__*/React.createElement("div", {className: "flex items-center gap-1.5"},
                /*#__PURE__*/React.createElement("button", {onClick: () => openEditTx(r), className: editBtn}, /*#__PURE__*/React.createElement(Pencil, {className: "h-3.5 w-3.5"})),
                /*#__PURE__*/React.createElement("button", {onClick: () => deleteTx(r), className: delBtn}, /*#__PURE__*/React.createElement(Trash2, {className: "h-3.5 w-3.5"})))))))),
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
export function SettingsNumFormat() {
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
  {id:1, type:"Báo giá",        prefix:"BG", num:1, year:new Date().getFullYear()},
  {id:2, type:"Đơn hàng",       prefix:"DH", num:1, year:new Date().getFullYear()},
  {id:3, type:"Phiếu mua hàng", prefix:"PM", num:1, year:new Date().getFullYear()},
  {id:4, type:"Phiếu nhập kho", prefix:"PN", num:1, year:new Date().getFullYear()},
  {id:5, type:"Phiếu xuất kho", prefix:"PX", num:1, year:new Date().getFullYear()},
  {id:6, type:"Phiếu thu",      prefix:"PT", num:1, year:new Date().getFullYear()},
  {id:7, type:"Phiếu chi",      prefix:"PC", num:1, year:new Date().getFullYear()},
];

export function SettingsDocNum() {
  const {docNums: rows, setDocNums: setRows} = useDocNum();
  const [editing, setEditing] = React.useState(null);
  const notify = useToast();

  const preview = r => fmtDocId(r.prefix, r.num);

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
        /*#__PURE__*/React.createElement("thead", {className: "bg-[#fef9f0]"},
          /*#__PURE__*/React.createElement("tr", null,
            /*#__PURE__*/React.createElement("th", {className: th + " w-8"}, "#"),
            /*#__PURE__*/React.createElement("th", {className: th}, "Loại chứng từ"),
            /*#__PURE__*/React.createElement("th", {className: th}, "Tiền tố"),
            /*#__PURE__*/React.createElement("th", {className: th + " text-right"}, "Số hiện tại"),
            /*#__PURE__*/React.createElement("th", {className: th}, "Ví dụ hiển thị"),
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
                      className: "w-24 rounded border border-[#b45309] px-2 py-0.5 text-right text-sm focus:outline-none focus:ring-1 focus:ring-[#b45309]"
                    })
                  : r.num
              ),
              /*#__PURE__*/React.createElement("td", {className: td},
                /*#__PURE__*/React.createElement("span", {className: "inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-mono font-medium ring-1 ring-inset bg-[#fef9f0] text-[#92400e] ring-[#b45309]"}, preview(r))
              ),
              /*#__PURE__*/React.createElement("td", {className: td + " text-center"},
                editing && editing.id === r.id
                  ? /*#__PURE__*/React.createElement("div", {className: "flex items-center justify-center gap-2"},
                      /*#__PURE__*/React.createElement("button", {onClick: save, className: "rounded-md bg-[#92400e] px-3 py-1 text-xs font-semibold text-white hover:bg-[#78350f]"}, "Lưu"),
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
        "Định dạng: ", /*#__PURE__*/React.createElement("strong", null, "Tiền tố + 2 số cuối năm + 4 số thứ tự"),
        ". Ví dụ: ", /*#__PURE__*/React.createElement("strong", null, "BG260001"), ", ", /*#__PURE__*/React.createElement("strong", null, "DH260002"), "."
      ),
      /*#__PURE__*/React.createElement("p", {className: "text-[13px] text-slate-500"},
        "Sang năm mới, số thứ tự tự động reset về 0001. Ví dụ: ", /*#__PURE__*/React.createElement("strong", null, "BG270001"), "."
      )
    )
  );
}

export function SettingsPrint() {
  const notify = useToast();
  const [cfgItems, , ] = useCollection("config");
  const cfg = cfgItems.find(c => c.id === "print_template") || {};
  const PRINT_DEFAULTS = {
    companyName: "CÔNG TY TNHH BÁN LẺ TẠI KHO HẢI PHÒNG",
    address: "LK-10, Số 384 Lê Thánh Tông, Phường Ngô Quyền, Thành phố Hải Phòng",
    phone: "033 5252 225",
    taxCode: "0202252225",
    email: "vat.banletaikhohaiphong@gmail.com",
    website: "",
    footer: "",
    logoUrl: "/logo.png",
    bankNo: "202252225",
    bankCode: "TCB",
    bankOwner: "BAN LE TAI KHO HAI PHONG",
    bankName: "TECHCOMBANK (Ngân hàng TMCP Kỳ Thương Việt Nam)",
  };
  const [form, setForm] = useState({...PRINT_DEFAULTS, ...cfg});
  React.useEffect(() => {
    if (cfg && cfg.id) setForm(f => ({...f, ...PRINT_DEFAULTS, ...cfg}));
  }, [JSON.stringify(cfg)]);
  const set = (k,v) => setForm(f => ({...f, [k]:v}));
  const save = async () => {
    await saveDoc("config", "print_template", {...form, id:"print_template"});
    notify("Đã lưu cấu hình mẫu in");
  };

  const LabelInput = ({label, k, ph, multi}) => /*#__PURE__*/React.createElement("div", null,
    /*#__PURE__*/React.createElement("label", {className:"mb-1 block text-[13px] font-medium text-slate-600"}, label),
    multi
      ? /*#__PURE__*/React.createElement("textarea", {rows:3, value:form[k]||"", onChange:e=>set(k,e.target.value), placeholder:ph||"", className:`${field} w-full`})
      : /*#__PURE__*/React.createElement("input", {type:"text", value:form[k]||"", onChange:e=>set(k,e.target.value), placeholder:ph||"", className:`${field} w-full`}));

  return /*#__PURE__*/React.createElement("div", {className:"max-w-2xl space-y-4"},
    /*#__PURE__*/React.createElement("h2", {className:"text-[16px] font-semibold text-[#92400e]"}, "Cấu hình mẫu in"),
    /*#__PURE__*/React.createElement(Card, {title:"Thông tin công ty"},
      /*#__PURE__*/React.createElement("div", {className:"grid grid-cols-1 gap-3 sm:grid-cols-2"},
        LabelInput({label:"Tên công ty", k:"companyName", ph:"BLTK Hải Phòng"}),
        LabelInput({label:"Mã số thuế", k:"taxCode", ph:"0123456789"}),
        LabelInput({label:"Địa chỉ", k:"address", ph:"Số X, đường Y, phường Z, Hải Phòng"}),
        LabelInput({label:"Điện thoại", k:"phone", ph:"0901 234 567"}),
        LabelInput({label:"Email", k:"email", ph:"info@bltk.vn"}),
        LabelInput({label:"Website", k:"website", ph:"www.bltk.vn"}),
        LabelInput({label:"URL Logo", k:"logoUrl", ph:"https://... (để trống nếu không có)"}),
        LabelInput({label:"Ghi chú cuối phiếu", k:"footer", ph:"Cảm ơn quý khách đã tin dùng sản phẩm!", multi:true}))),
    /*#__PURE__*/React.createElement(Card, {title:"Thông tin ngân hàng (QR VietQR)"},
      /*#__PURE__*/React.createElement("div", {className:"grid grid-cols-1 gap-3 sm:grid-cols-2"},
        LabelInput({label:"Số tài khoản", k:"bankNo", ph:"202252225"}),
        LabelInput({label:"Mã ngân hàng VietQR", k:"bankCode", ph:"TCB / VCB / MB / ACB..."}),
        LabelInput({label:"Tên tài khoản (in trên phiếu)", k:"bankOwner", ph:"BAN LE TAI KHO HAI PHONG"}),
        LabelInput({label:"Tên ngân hàng (in trên phiếu)", k:"bankName", ph:"TECHCOMBANK (NH TMCP Kỳ Thương VN)"}))),
    form.companyName && /*#__PURE__*/React.createElement(Card, {title:"Xem trước phần đầu phiếu in"},
      /*#__PURE__*/React.createElement("div", {className:"rounded border border-slate-200 bg-white p-4 text-sm"},
        /*#__PURE__*/React.createElement("div", {className:"flex items-start gap-4"},
          form.logoUrl && /*#__PURE__*/React.createElement("img", {src:form.logoUrl, alt:"logo", className:"h-14 w-auto object-contain"}),
          /*#__PURE__*/React.createElement("div", null,
            /*#__PURE__*/React.createElement("div", {className:"text-base font-bold text-slate-800"}, form.companyName),
            form.taxCode && /*#__PURE__*/React.createElement("div", {className:"text-xs text-slate-500"}, "MST: ", form.taxCode),
            form.address && /*#__PURE__*/React.createElement("div", {className:"text-xs text-slate-500"}, form.address),
            form.phone && /*#__PURE__*/React.createElement("div", {className:"text-xs text-slate-500"}, "ĐT: ", form.phone))))),
    /*#__PURE__*/React.createElement("div", {className:"flex justify-end"},
      /*#__PURE__*/React.createElement("button", {onClick:save, className:blueBtn}, "Lưu cấu hình")));
}



/* ───────── TEMP: Xóa dữ liệu test ───────── */
export function AdminClearData() {
  const [busy, setBusy] = React.useState(false);
  const [done, setDone] = React.useState(null);
  const COLS = ["orders","purchases","wh_in","wh_out","txns"];
  const clearAll = async () => {
    if (!window.confirm("Xóa TOÀN BỘ dữ liệu orders, purchases, wh_in, wh_out, txns?\nKhông thể hoàn tác!")) return;
    setBusy(true); setDone(null);
    const counts = {};
    for (const col of COLS) {
      const snap = await getDocs(collection(db, col));
      await Promise.all(snap.docs.map(d => deleteDoc(fsDoc(db, col, d.id))));
      counts[col] = snap.size;
    }
    setBusy(false);
    setDone(counts);
  };
  return React.createElement("div", {className: "space-y-4 max-w-lg"},
    React.createElement("div", {className: "rounded-xl border-2 border-red-200 bg-red-50 p-5 space-y-3"},
      React.createElement("p", {className: "font-semibold text-red-700"}, "⚠ Xóa dữ liệu test"),
      React.createElement("p", {className: "text-sm text-red-600"}, "Xóa toàn bộ: orders, purchases, wh_in, wh_out, txns. Không thể hoàn tác."),
      React.createElement("button", {
        onClick: clearAll, disabled: busy,
        className: "rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
      }, busy ? "Đang xóa..." : "Xóa tất cả dữ liệu"),
      done && React.createElement("div", {className: "text-sm text-green-700 space-y-1"},
        React.createElement("p", {className: "font-semibold"}, "✅ Đã xóa xong:"),
        Object.entries(done).map(([col, n]) =>
          React.createElement("p", {key: col}, col, ": ", n, " bản ghi")
        )
      )
    )
  );
}

/* ───────── Màn hình đăng nhập ───────── */
export function LoginScreen() {
  const { login } = useAuth();
  const [email, setEmail] = useState(() => localStorage.getItem("bltk_saved_email") || "");
  const [pass, setPass] = useState(() => localStorage.getItem("bltk_saved_pass") || "");
  const [remember, setRemember] = useState(() => !!localStorage.getItem("bltk_saved_email"));
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const submit = async e => {
    e.preventDefault();
    setErr(""); setLoading(true);
    try {
      await login(email.trim(), pass);
      if (remember) { localStorage.setItem("bltk_saved_email", email.trim()); localStorage.setItem("bltk_saved_pass", pass); }
      else { localStorage.removeItem("bltk_saved_email"); localStorage.removeItem("bltk_saved_pass"); }
    }
    catch { setErr("Email hoặc mật khẩu không đúng."); }
    finally { setLoading(false); }
  };
  const BUBBLES = [
    {w:80,h:80,l:10,d:0,t:14},{w:40,h:40,l:25,d:2,t:9},{w:120,h:120,l:50,d:4,t:18},
    {w:30,h:30,l:70,d:1,t:8},{w:60,h:60,l:85,d:3,t:12},{w:50,h:50,l:40,d:5,t:10},
    {w:90,h:90,l:60,d:1.5,t:16},{w:35,h:35,l:15,d:6,t:7},{w:70,h:70,l:78,d:2.5,t:13},
    {w:45,h:45,l:5,d:7,t:11},{w:100,h:100,l:35,d:3.5,t:20},{w:25,h:25,l:90,d:0.5,t:6},
  ];
  return React.createElement("div", { className: "min-h-screen flex relative overflow-hidden",
      style: { background: "radial-gradient(ellipse at 60% 40%, #c84b0e 0%, #8b2200 45%, #4a1000 100%)" }
    },
    /* CSS keyframes bóng nước */
    React.createElement("style", null, `
      @keyframes floatBubble {
        0%   { transform: translateY(0) scale(1);   opacity: 0; }
        10%  { opacity: 0.5; }
        85%  { opacity: 0.25; }
        100% { transform: translateY(-110vh) scale(1.2); opacity: 0; }
      }
    `),
    /* Bóng nước nổi */
    React.createElement("div", { className: "absolute inset-0 overflow-hidden pointer-events-none" },
      ...BUBBLES.map((b,i) => React.createElement("div", { key: i, style: {
        position: "absolute",
        bottom: "-120px",
        left: `${b.l}%`,
        width: `${b.w}px`,
        height: `${b.h}px`,
        borderRadius: "50%",
        border: "1px solid rgba(255,255,255,0.35)",
        background: "radial-gradient(circle at 35% 35%, rgba(255,255,255,0.18), rgba(255,255,255,0.03))",
        animation: `floatBubble ${b.t}s ease-in ${b.d}s infinite`,
        boxShadow: "inset 0 0 12px rgba(255,255,255,0.12)",
      }}))
    ),
    /* Panel form */
    React.createElement("div", { className: "relative z-10 flex flex-1 items-center justify-center p-6" },
      React.createElement("div", { className: "rounded-3xl w-full max-w-md p-10", style: { background: "rgba(255,255,255,0.07)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)" } },
        /* Header — căn giữa */
        React.createElement("div", { className: "mb-8 flex flex-col items-center text-center" },
          React.createElement("img", { src: "/banner.jpg", alt: "BLTK", className: "w-24 h-24 rounded-2xl object-cover mb-5 shadow-lg" }),
          React.createElement("h1", { className: "text-2xl font-bold text-white" }, "Đăng nhập"),
          React.createElement("p", { className: "text-white/70 text-sm mt-1" }, "Nhập thông tin tài khoản của bạn")
        ),
        /* Form */
        React.createElement("form", { onSubmit: submit, className: "space-y-5" },
          React.createElement("div", null,
            React.createElement("label", { className: "block text-sm font-medium text-white/90 mb-1.5" }, "Email"),
            React.createElement("input", { type: "email", value: email, onChange: e => setEmail(e.target.value), required: true, autoFocus: true,
              placeholder: "ten@email.com",
              className: "w-full border border-white/30 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-white/60 focus:border-transparent text-white placeholder-white/40",
              style: { background: "rgba(255,255,255,0.15)", fontSize: '16px' } })
          ),
          React.createElement("div", null,
            React.createElement("label", { className: "block text-sm font-medium text-white/90 mb-1.5" }, "Mật khẩu"),
            React.createElement("div", { className: "relative" },
              React.createElement("input", { type: showPass ? "text" : "password", value: pass, onChange: e => setPass(e.target.value), required: true,
                placeholder: "••••••••",
                className: "w-full border border-white/30 rounded-xl px-4 py-3 pr-11 text-sm focus:outline-none focus:ring-2 focus:ring-white/60 focus:border-transparent text-white placeholder-white/40",
                style: { background: "rgba(255,255,255,0.15)", fontSize: '16px' } }),
              React.createElement("button", { type: "button", onClick: () => setShowPass(v => !v),
                className: "absolute right-3 top-1/2 -translate-y-1/2 text-white/60 hover:text-white/90 active:text-white" },
                React.createElement(showPass ? EyeOff : Eye, { className: "h-4.5 w-4.5" }))
            )
          ),
          React.createElement("label", { className: "flex items-center gap-2 cursor-pointer select-none" },
            React.createElement("input", { type: "checkbox", checked: remember, onChange: e => setRemember(e.target.checked), className: "w-4 h-4 rounded accent-amber-700" }),
            React.createElement("span", { className: "text-sm text-white/80" }, "Lưu mật khẩu")
          ),
          err && React.createElement("div", { className: "flex items-center gap-2 text-sm text-red-200 bg-red-900/40 rounded-xl px-4 py-2.5" },
            React.createElement(AlertTriangle, { className: "h-4 w-4 flex-shrink-0" }), err
          ),
          React.createElement("button", { type: "submit", disabled: loading,
            className: "w-full text-white font-semibold rounded-xl py-3 text-sm transition disabled:opacity-60 mt-2",
            style: { background: loading ? "#5a1200" : "linear-gradient(to top,#4a0e00,#a83800)" } },
            loading ? "Đang đăng nhập..." : "Đăng nhập →")
        )
      )
    )
  );
}

/* ───────── Màn hình quản lý người dùng (chỉ manager) ───────── */
export function UsersTab() {
  const notify = useToast();
  const [users] = useCollection("users");
  const [form, setForm] = useState(null);
  const [newEmail, setNewEmail] = useState("");
  const [newPass, setNewPass] = useState("");
  const [newName, setNewName] = useState("");
  const [newRole, setNewRole] = useState("sales");
  const [saving, setSaving] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editRole, setEditRole] = useState("sales");
  const [editPass, setEditPass] = useState("");
  const [showEditPass, setShowEditPass] = useState(false);
  const [editSaving, setEditSaving] = useState(false);

  const openEdit = u => { setEditUser(u); setEditName(u.name || ""); setEditEmail(u.email || ""); setEditRole(u.role || "sales"); setEditPass(u.pass || ""); setShowEditPass(false); };

  const saveEdit = async e => {
    e.preventDefault();
    setEditSaving(true);
    try {
      const data = { ...editUser, name: editName.trim(), email: editEmail.trim(), role: editRole };
      if (editPass.trim()) data.pass = editPass.trim();
      await saveDoc("users", editUser._id || editUser.uid || editUser.id, data);
      notify("Đã cập nhật thông tin");
      setEditUser(null);
    } catch(err) { notify("Lỗi: " + err.message); }
    finally { setEditSaving(false); }
  };

  const createUser = async e => {
    e.preventDefault();
    setSaving(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, newEmail.trim(), newPass);
      await createUserProfile(cred.user.uid, { email: newEmail.trim(), name: newName.trim(), role: newRole, pass: newPass.trim() });
      notify("Đã tạo tài khoản " + newEmail);
      setForm(null); setNewEmail(""); setNewPass(""); setNewName(""); setNewRole("sales");
    } catch(err) {
      notify("Lỗi: " + (err.code === "auth/email-already-in-use" ? "Email đã tồn tại" : err.message));
    } finally { setSaving(false); }
  };

  const lbl = "block text-sm font-medium text-slate-600 mb-1";
  return React.createElement("div", { className: "space-y-4" },
    React.createElement("div", { className: "flex justify-between items-center" },
      React.createElement("h2", { className: "text-base font-semibold" }, users.length + " tài khoản"),
      React.createElement("button", { onClick: () => setForm({}), className: blueBtn },
        React.createElement(Plus, { className: "h-4 w-4" }), " Thêm nhân viên")
    ),
    React.createElement(TableShell, {
      head: React.createElement(React.Fragment, null,
        React.createElement(Th, null, "Họ tên"),
        React.createElement(Th, null, "Email"),
        React.createElement(Th, null, "Mật khẩu"),
        React.createElement(Th, null, "Vai trò"),
        React.createElement(Th, {center:true, style:{width:80}}, ""))
    },
      [...users].sort((a,b) => { const o = ["admin","manager","sales","warehouse"]; const ia = o.includes(a.role) ? o.indexOf(a.role) : 99; const ib = o.includes(b.role) ? o.indexOf(b.role) : 99; return ia - ib; }).map(u => React.createElement("tr", { key: u.email, className: "hover:bg-slate-50" },
        React.createElement("td", { className: "px-4 py-2.5 text-sm font-medium text-slate-800" }, u.name || ""),
        React.createElement("td", { className: "px-4 py-2.5 text-sm text-slate-500" }, u.email),
        React.createElement("td", { className: "px-4 py-2.5 text-sm font-mono text-slate-600" }, u.pass || React.createElement("span", {className:"text-slate-300 text-xs"}, "chưa lưu")),
        React.createElement("td", { className: "px-4 py-2.5" },
          React.createElement("span", {className: "inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium " + (ROLES[u.role]?.color || "bg-slate-100 text-slate-500")},
            ROLES[u.role]?.label || u.role)),
        React.createElement("td", { className: "px-4 py-2.5 text-center" },
          React.createElement(IconBtn, { icon: Pencil, title: "Sửa thông tin", onClick: () => openEdit(u) }))
      ))
    ),
    editUser && React.createElement("div", { className: "fixed inset-0 bg-black/40 flex items-center justify-center z-50" },
      React.createElement("div", { className: "bg-white rounded-2xl shadow-xl p-8 w-full max-w-sm" },
        React.createElement("h3", { className: "text-lg font-bold mb-6" }, "Sửa thông tin nhân viên"),
        React.createElement("form", { onSubmit: saveEdit, className: "space-y-4" },
          React.createElement("div", null,
            React.createElement("label", { className: lbl }, "Họ tên"),
            React.createElement("input", { value: editName, onChange: e => setEditName(e.target.value), required: true, className: field + " w-full" })),
          React.createElement("div", null,
            React.createElement("label", { className: lbl }, "Email"),
            React.createElement("input", { type: "email", value: editEmail, onChange: e => setEditEmail(e.target.value), required: true, className: field + " w-full" })),
          React.createElement("div", null,
            React.createElement("label", { className: lbl }, "Vai trò"),
            React.createElement("select", { value: editRole, onChange: e => setEditRole(e.target.value), className: field + " w-full" },
              Object.entries(ROLES).map(([k, v]) => React.createElement("option", { key: k, value: k }, v.label)))),
          React.createElement("div", null,
            React.createElement("label", { className: lbl }, "Mật khẩu (lưu để nhớ)"),
            React.createElement("div", {className:"relative"},
              React.createElement("input", { type: showEditPass ? "text" : "password", value: editPass, onChange: e => setEditPass(e.target.value), placeholder: "Nhập để lưu mật khẩu", className: field + " w-full pr-10" }),
              React.createElement("button", { type:"button", onClick: () => setShowEditPass(v => !v), className:"absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs" },
                showEditPass ? "Ẩn" : "Hiện"))),
          React.createElement("div", { className: "flex gap-2 pt-2" },
            React.createElement("button", { type: "button", onClick: () => setEditUser(null), className: ghostBtn }, "Huỷ"),
            React.createElement("button", { type: "submit", disabled: editSaving, className: blueBtn + " flex-1 justify-center disabled:opacity-50" },
              editSaving ? "Đang lưu..." : "Lưu thay đổi"))))),
    form && React.createElement("div", { className: "fixed inset-0 bg-black/40 flex items-center justify-center z-50" },
      React.createElement("div", { className: "bg-white rounded-2xl shadow-xl p-8 w-full max-w-sm" },
        React.createElement("h3", { className: "text-lg font-bold mb-6" }, "Thêm nhân viên"),
        React.createElement("form", { onSubmit: createUser, className: "space-y-4" },
          React.createElement("div", null,
            React.createElement("label", { className: lbl }, "Họ tên"),
            React.createElement("input", { value: newName, onChange: e => setNewName(e.target.value), required: true, className: field + " w-full" })),
          React.createElement("div", null,
            React.createElement("label", { className: lbl }, "Email"),
            React.createElement("input", { type: "email", value: newEmail, onChange: e => setNewEmail(e.target.value), required: true, className: field + " w-full" })),
          React.createElement("div", null,
            React.createElement("label", { className: lbl }, "Mật khẩu tạm"),
            React.createElement("input", { type: "text", value: newPass, onChange: e => setNewPass(e.target.value), required: true, minLength: 6, className: field + " w-full" })),
          React.createElement("div", null,
            React.createElement("label", { className: lbl }, "Vai trò"),
            React.createElement("select", { value: newRole, onChange: e => setNewRole(e.target.value), className: field + " w-full" },
              Object.entries(ROLES).map(([k, v]) => React.createElement("option", { key: k, value: k }, v.label)))),
          React.createElement("div", { className: "flex gap-2 pt-2" },
            React.createElement("button", { type: "button", onClick: () => setForm(null), className: ghostBtn }, "Huỷ"),
            React.createElement("button", { type: "submit", disabled: saving, className: blueBtn + " flex-1 justify-center disabled:opacity-50" },
              saving ? "Đang tạo..." : "Tạo tài khoản")))))
  );
}
