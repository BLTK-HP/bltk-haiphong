import React, { useState } from 'react';
import { ChevronLeft, FileText, Link2, Plus, Printer, Save, Search } from 'lucide-react';
import { useCollection, saveDoc, deleteDocument } from '../useFirestore.js';
import { useToast } from '../contexts.jsx';
import { vnd, calc, field, inputF, blueBtn, ghostBtn, addBtn } from '../constants.js';
import { Th, TableShell, Modal, NumInput, IconBtn } from '../components/ui.jsx';
import { printContract, exportContractWord } from './Sales.jsx';

export function Contracts({orders = []}) {
  const notify = useToast();
  const [contracts, , ] = useCollection("contracts");
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [q, setQ] = useState("");
  const [addOrderId, setAddOrderId] = useState("");

  const today = () => { const d=new Date(); return `${String(d.getDate()).padStart(2,"0")}/${String(d.getMonth()+1).padStart(2,"0")}/${d.getFullYear()}`; };
  const emptyForm = {
    template:"HĐMB-TBVS", contractNum:"", signDate:today(), duration:"12 tháng",
    deliveryAddr:"", deposit:0,
    companyName:"", companyTax:"", companyAddr:"", companyPhone:"",
    custName:"", custPhone:"", custTax:"", custAddr:"",
    orderIds:[], note:""
  };
  const [form, setForm] = useState(emptyForm);
  const set = (k,v) => setForm(f=>({...f,[k]:v}));

  const PREFIX_MAP = {"HĐMB-TBVS":"TBVS","HĐMB-TBB":"TBB","HĐMB-TBVS-TBB":"TBVS-TBB"};
  const autoNum = (tpl) => {
    const p = PREFIX_MAP[tpl] || "HĐ";
    const yr = String(new Date().getFullYear()).slice(-2);
    const pat = `HĐ-${p}${yr}/`;
    const n = contracts.filter(c => (c.contractNum||"").startsWith(pat)).length + 1;
    return `${pat}${String(n).padStart(2,"0")}`;
  };
  const openNew  = () => { const num = autoNum(emptyForm.template); setForm({...emptyForm, contractNum:num}); setEditId(null); setAddOrderId(""); setShowForm(true); };
  const openEdit = c  => { setForm({...emptyForm,...c}); setEditId(c.id); setAddOrderId(""); setShowForm(true); };

  const addToAppendix = () => {
    if (!addOrderId || (form.orderIds||[]).includes(addOrderId)) return;
    const o = orders.find(x => x.id === addOrderId);
    if (!o) return;
    set("orderIds", [...(form.orderIds||[]), addOrderId]);
    if (!form.custName) set("custName", o.name||"");
    if (!form.custPhone) set("custPhone", o.phone||"");
    if (!form.custAddr)  set("custAddr",  o.addr||"");
    setAddOrderId("");
  };
  const removeOrder = id => set("orderIds", (form.orderIds||[]).filter(x => x !== id));

  const appendixItems = (form.orderIds||[]).flatMap(oid => {
    const o = orders.find(x => x.id === oid);
    return (o?.items||[]).filter(it=>it.name).map(it => ({...it, orderId:oid}));
  });
  const totalValue = appendixItems.reduce((s,it) => s + (it.price||0)*(it.qty||0), 0);

  const save = async () => {
    if (!form.contractNum) { notify("Vui lòng nhập số hợp đồng"); return; }
    const id = editId || ("HD" + Date.now());
    await saveDoc("contracts", id, {...form, value:totalValue, id})
      .then(() => { notify(editId ? "Đã cập nhật hợp đồng" : "Đã lưu hợp đồng"); setShowForm(false); })
      .catch(e => { console.error(e); notify("Lỗi lưu hợp đồng: " + (e.message || "Lỗi kết nối")); });
  };

  const del = async (id) => {
    if (!window.confirm("Xóa hợp đồng này?")) return;
    await deleteDocument("contracts", id)
      .then(() => notify("Đã xóa hợp đồng"))
      .catch(e => { console.error(e); notify("Lỗi xóa hợp đồng: " + (e.message || "Lỗi kết nối")); });
  };

  const filtered = contracts.filter(c => !q || `${c.contractNum} ${c.custName}`.toLowerCase().includes(q.toLowerCase()));
  const availOrders = orders.filter(o => !o.draft && o.orderStatus !== "Huỷ" && o.orderStatus !== "Hủy");

  const iF = "w-full rounded-[7px] border border-slate-200 bg-white px-3 py-2 text-sm focus:border-[#B45309] focus:outline-none";

  // ── FORM VIEW ──────────────────────────────────────────────────────────────
  if (showForm) {
    const SecNum = ({n}) => /*#__PURE__*/React.createElement("span", {className:"flex h-7 w-7 items-center justify-center rounded-full bg-[#B45309] text-white text-sm font-bold flex-shrink-0"}, n);
    const SecHd = ({n,title,note}) => /*#__PURE__*/React.createElement("div", {className:"mb-4 flex items-center gap-2.5"},
      /*#__PURE__*/React.createElement(SecNum, {n}),
      /*#__PURE__*/React.createElement("span", {className:"text-base font-semibold text-slate-800"}, title),
      note && /*#__PURE__*/React.createElement("span", {className:"ml-auto text-xs text-slate-400"}, note)
    );
    const Lbl = ({children}) => /*#__PURE__*/React.createElement("label", {className:"mb-1 block text-[12px] text-slate-500"}, children);
    const sec = "rounded-xl border border-slate-200 bg-white p-5 mb-4";

    return /*#__PURE__*/React.createElement("div", {className:"min-h-screen bg-[#FBF6F1] -mx-4 -mt-4 px-4 pt-4 pb-10"},
      /*#__PURE__*/React.createElement("div", {className:"max-w-3xl mx-auto"},

        /* Back + Title + Actions */
        /*#__PURE__*/React.createElement("div", {className:"mb-6 flex items-center gap-4"},
          /*#__PURE__*/React.createElement("button", {onClick:()=>setShowForm(false), className:"flex shrink-0 items-center gap-1 text-sm text-slate-500 hover:text-slate-700"},
            /*#__PURE__*/React.createElement(ChevronLeft, {className:"h-4 w-4"}), "Danh sách"),
          /*#__PURE__*/React.createElement("div", {className:"flex-1"}),
          /*#__PURE__*/React.createElement("div", {className:"flex shrink-0 gap-2"},
            /*#__PURE__*/React.createElement("button", {onClick:()=>exportContractWord(form, appendixItems, totalValue), className:"flex items-center gap-1.5 whitespace-nowrap rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"},
              /*#__PURE__*/React.createElement(FileText, {className:"h-4 w-4"}), "Xuất Word"),
            /*#__PURE__*/React.createElement("button", {onClick:()=>printContract(form, appendixItems, totalValue), className:"flex items-center gap-1.5 whitespace-nowrap rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"},
              /*#__PURE__*/React.createElement(Printer, {className:"h-4 w-4"}), "In / Xuất PDF"),
            /*#__PURE__*/React.createElement("button", {onClick:save, className:"flex items-center gap-1.5 whitespace-nowrap rounded-lg bg-[#B45309] px-4 py-2 text-sm font-semibold text-white hover:bg-[#92400e]"},
              /*#__PURE__*/React.createElement(Save, {className:"h-4 w-4"}), "Lưu hợp đồng")
          )
        ),

        /* Section 1: Template */
        /*#__PURE__*/React.createElement("div", {className:sec},
          /*#__PURE__*/React.createElement(SecHd, {n:"1", title:"Chọn mẫu hợp đồng"}),
          /*#__PURE__*/React.createElement("div", {className:"grid grid-cols-3 gap-3"},
            CONTRACT_TEMPLATES.map(t => {
              const active = form.template === t.key;
              return /*#__PURE__*/React.createElement("button", {
                key: t.key, onClick: () => { set("template", t.key); if (!editId) set("contractNum", autoNum(t.key)); },
                className: `rounded-xl border-2 p-4 text-center transition-all ${active ? "border-[#B45309] bg-[#FDF1E5]" : "border-slate-200 bg-white hover:border-[#B45309]/50"}`
              },
                /*#__PURE__*/React.createElement("div", {className:"text-2xl mb-1"}, t.icon),
                /*#__PURE__*/React.createElement("p", {className:`text-sm font-semibold ${active?"text-[#B45309]":"text-slate-700"}`}, t.label),
                /*#__PURE__*/React.createElement("p", {className:"text-xs text-slate-400 mt-0.5"}, t.key)
              );
            })
          )
        ),

        /* Section 2: Contract info */
        /*#__PURE__*/React.createElement("div", {className:sec},
          /*#__PURE__*/React.createElement(SecHd, {n:"2", title:"Thông tin hợp đồng"}),
          /*#__PURE__*/React.createElement("div", {className:"grid grid-cols-3 gap-3"},
            /*#__PURE__*/React.createElement("div", null,
              /*#__PURE__*/React.createElement(Lbl, null, "Số hợp đồng"),
              /*#__PURE__*/React.createElement("input", {value:form.contractNum, onChange:e=>set("contractNum",e.target.value), placeholder:"HĐ-TBVS 01", className:iF})),
            /*#__PURE__*/React.createElement("div", null,
              /*#__PURE__*/React.createElement(Lbl, null, "Ngày ký"),
              /*#__PURE__*/React.createElement("input", {value:form.signDate, onChange:e=>set("signDate",e.target.value), placeholder:"dd/mm/yyyy", className:iF})),
            /*#__PURE__*/React.createElement("div", null,
              /*#__PURE__*/React.createElement(Lbl, null, "Thời hạn"),
              /*#__PURE__*/React.createElement("input", {value:form.duration, onChange:e=>set("duration",e.target.value), placeholder:"12 tháng", className:iF}))
          )
        ),

        /* Section 3: Party info */
        /*#__PURE__*/React.createElement("div", {className:sec},
          /*#__PURE__*/React.createElement(SecHd, {n:"3", title:"Thông tin các bên", note:"các ô đều sửa được"}),
          /*#__PURE__*/React.createElement("div", {className:"grid grid-cols-2 gap-6"},
            /* Bên A */
            /*#__PURE__*/React.createElement("div", null,
              /*#__PURE__*/React.createElement("div", {className:"mb-3 flex gap-2 text-[11px] font-bold uppercase tracking-wide"},
                /*#__PURE__*/React.createElement("span", {className:"text-slate-500"}, "Bên A"),
                /*#__PURE__*/React.createElement("span", {className:"rounded bg-[#FCEBD8] px-2 py-0.5 text-[#B45309]"}, "Bên bán")),
              /*#__PURE__*/React.createElement(Lbl, null, "Tên công ty"),
              /*#__PURE__*/React.createElement("input", {value:form.companyName, onChange:e=>set("companyName",e.target.value), placeholder:"Công ty TNHH…", className:`${iF} mb-2`}),
              /*#__PURE__*/React.createElement(Lbl, null, "MST"),
              /*#__PURE__*/React.createElement("input", {value:form.companyTax, onChange:e=>set("companyTax",e.target.value), placeholder:"0312345678", className:`${iF} mb-2`}),
              /*#__PURE__*/React.createElement(Lbl, null, "Địa chỉ"),
              /*#__PURE__*/React.createElement("input", {value:form.companyAddr, onChange:e=>set("companyAddr",e.target.value), placeholder:"Địa chỉ công ty…", className:`${iF} mb-2`}),
              /*#__PURE__*/React.createElement(Lbl, null, "Số điện thoại"),
              /*#__PURE__*/React.createElement("input", {value:form.companyPhone, onChange:e=>set("companyPhone",e.target.value), placeholder:"033 5252 225", className:iF})
            ),
            /* Bên B */
            /*#__PURE__*/React.createElement("div", null,
              /*#__PURE__*/React.createElement("div", {className:"mb-3 flex gap-2 text-[11px] font-bold uppercase tracking-wide"},
                /*#__PURE__*/React.createElement("span", {className:"text-slate-500"}, "Bên B"),
                /*#__PURE__*/React.createElement("span", {className:"rounded bg-[#FCEBD8] px-2 py-0.5 text-[#B45309]"}, "Khách hàng")),
              /*#__PURE__*/React.createElement(Lbl, null, "Tên khách hàng"),
              /*#__PURE__*/React.createElement("input", {value:form.custName, onChange:e=>set("custName",e.target.value), placeholder:"Nhập…", className:`${iF} mb-2`}),
              /*#__PURE__*/React.createElement(Lbl, null, "MST / CCCD"),
              /*#__PURE__*/React.createElement("input", {value:form.custTax||"", onChange:e=>set("custTax",e.target.value), placeholder:"Nhập MST hoặc CCCD…", className:`${iF} mb-2`}),
              /*#__PURE__*/React.createElement(Lbl, null, "Địa chỉ"),
              /*#__PURE__*/React.createElement("input", {value:form.custAddr, onChange:e=>set("custAddr",e.target.value), placeholder:"Nhập địa chỉ khách hàng…", className:`${iF} mb-2`}),
              /*#__PURE__*/React.createElement(Lbl, null, "Số điện thoại"),
              /*#__PURE__*/React.createElement("input", {value:form.custPhone, onChange:e=>set("custPhone",e.target.value), placeholder:"Nhập…", className:iF})
            )
          )
        ),

        /* Section 4: Địa điểm giao hàng */
        /*#__PURE__*/React.createElement("div", {className:sec},
          /*#__PURE__*/React.createElement(SecHd, {n:"4", title:"Địa điểm giao hàng"}),
          /*#__PURE__*/React.createElement("input", {value:form.deliveryAddr||"", onChange:e=>set("deliveryAddr",e.target.value), placeholder:"Địa điểm nhận hàng của khách…", className:`${iF} w-full`})
        ),

        /* Section 5: Đặt cọc */
        /*#__PURE__*/React.createElement("div", {className:sec},
          /*#__PURE__*/React.createElement(SecHd, {n:"5", title:"Số tiền đặt cọc lần 1"}),
          /*#__PURE__*/React.createElement("div", {className:"flex items-center gap-3"},
            /*#__PURE__*/React.createElement("input", {
              type:"text", inputMode:"numeric",
              value: form.deposit ? new Intl.NumberFormat("vi-VN").format(form.deposit) : "",
              onChange: e => { const v = parseFloat(e.target.value.replace(/\./g,"").replace(/,/g,""))||0; set("deposit",v); },
              placeholder:"0",
              className:`${iF} w-60 text-right tabular-nums`
            }),
            /*#__PURE__*/React.createElement("span", {className:"text-sm text-slate-500"}, "VNĐ")
          )
        ),

        /* Section 6: Appendix */
        /*#__PURE__*/React.createElement("div", {className:sec},
          /*#__PURE__*/React.createElement(SecHd, {n:"6", title:"Phụ lục hợp đồng", note:"dữ liệu tự kéo từ đơn đặt hàng"}),

          /* Order selector row */
          /*#__PURE__*/React.createElement("div", {className:"mb-3 flex flex-wrap items-center gap-2"},
            /*#__PURE__*/React.createElement("div", {className:"flex items-center gap-1.5 rounded-lg border border-slate-200 bg-[#FBF6F1] px-2.5 py-1.5 text-xs font-medium text-slate-600"},
              /*#__PURE__*/React.createElement(Link2, {className:"h-3.5 w-3.5 text-[#B45309]"}), "Liên kết đơn hàng"),
            /*#__PURE__*/React.createElement("select", {
              value: addOrderId,
              onChange: e => setAddOrderId(e.target.value),
              className: "rounded-[7px] border border-slate-200 bg-white px-2 py-1.5 text-sm focus:border-[#B45309] focus:outline-none flex-1 min-w-0"
            },
              /*#__PURE__*/React.createElement("option", {value:""}, "— Chọn đơn hàng —"),
              availOrders.map(o => /*#__PURE__*/React.createElement("option", {key:o.id, value:o.id},
                `${o.id} · ${o.name||""} · ${vnd(calc(o).total)} đ`))
            ),
            /*#__PURE__*/React.createElement("button", {
              onClick: addToAppendix,
              disabled: !addOrderId,
              className: "whitespace-nowrap rounded-lg bg-[#B45309] px-3 py-1.5 text-sm font-semibold text-white hover:bg-[#92400e] disabled:opacity-40"
            }, "+ Thêm vào phụ lục")
          ),

          /* Pills */
          (form.orderIds||[]).length > 0 && /*#__PURE__*/React.createElement("div", {className:"mb-3 flex flex-wrap gap-2"},
            (form.orderIds||[]).map(id => /*#__PURE__*/React.createElement("span", {
              key: id,
              className: "inline-flex items-center gap-1.5 rounded-full border border-[#B45309] bg-[#FDF1E5] px-3 py-1 text-xs font-semibold text-[#B45309]"
            },
              id,
              /*#__PURE__*/React.createElement("button", {onClick:()=>removeOrder(id), className:"ml-0.5 text-[#B45309]/60 hover:text-[#B45309]"}, "×")
            ))
          ),

          /* Table */
          /*#__PURE__*/React.createElement("div", {className:"overflow-x-auto rounded-xl border border-[#FCEBD8]"},
            /*#__PURE__*/React.createElement("table", {className:"w-full text-sm"},
              /*#__PURE__*/React.createElement("thead", null,
                /*#__PURE__*/React.createElement("tr", {className:"bg-[#FCEBD8] text-[#7c2d12] text-xs font-semibold uppercase tracking-wide"},
                  /*#__PURE__*/React.createElement("th", {className:"px-3 py-2.5 text-center w-10"}, "STT"),
                  /*#__PURE__*/React.createElement("th", {className:"px-3 py-2.5 text-left"}, "Sản phẩm"),
                  /*#__PURE__*/React.createElement("th", {className:"px-3 py-2.5 text-center w-28"}, "Nguồn đơn"),
                  /*#__PURE__*/React.createElement("th", {className:"px-3 py-2.5 text-center w-16"}, "ĐVT"),
                  /*#__PURE__*/React.createElement("th", {className:"px-3 py-2.5 text-center w-14"}, "SL"),
                  /*#__PURE__*/React.createElement("th", {className:"px-3 py-2.5 text-right w-28"}, "Đơn giá"),
                  /*#__PURE__*/React.createElement("th", {className:"px-3 py-2.5 text-right w-28"}, "Thành tiền")
                )
              ),
              /*#__PURE__*/React.createElement("tbody", {className:"divide-y divide-[#FCEBD8]"},
                appendixItems.length === 0
                  ? /*#__PURE__*/React.createElement("tr", null,
                      /*#__PURE__*/React.createElement("td", {colSpan:7, className:"py-8 text-center text-sm text-slate-400"}, "Chưa có sản phẩm — thêm đơn hàng bên trên"))
                  : appendixItems.map((it, i) =>
                      /*#__PURE__*/React.createElement("tr", {key:`${it.orderId}-${i}`, className:"hover:bg-[#FBF6F1]"},
                        /*#__PURE__*/React.createElement("td", {className:"px-3 py-2.5 text-center text-slate-500"}, i+1),
                        /*#__PURE__*/React.createElement("td", {className:"px-3 py-2.5 font-medium text-slate-800"}, it.name),
                        /*#__PURE__*/React.createElement("td", {className:"px-3 py-2.5 text-center"},
                          /*#__PURE__*/React.createElement("span", {className:"rounded-full bg-[#FCEBD8] px-2 py-0.5 text-[11px] font-semibold text-[#B45309]"}, it.orderId)),
                        /*#__PURE__*/React.createElement("td", {className:"px-3 py-2.5 text-center text-slate-500"}, it.unit||"Cái"),
                        /*#__PURE__*/React.createElement("td", {className:"px-3 py-2.5 text-center tabular-nums"}, it.qty),
                        /*#__PURE__*/React.createElement("td", {className:"px-3 py-2.5 text-right tabular-nums text-slate-700"}, vnd(it.price||0)),
                        /*#__PURE__*/React.createElement("td", {className:"px-3 py-2.5 text-right tabular-nums font-medium text-slate-800"}, vnd((it.price||0)*(it.qty||0)))
                      )
                    )
              ),
              totalValue > 0 && /*#__PURE__*/React.createElement("tfoot", null,
                /*#__PURE__*/React.createElement("tr", {className:"bg-[#FDF1E5]"},
                  /*#__PURE__*/React.createElement("td", {colSpan:6, className:"px-3 py-3 text-right font-semibold text-slate-700"}, "TỔNG CỘNG"),
                  /*#__PURE__*/React.createElement("td", {className:"px-3 py-3 text-right font-bold text-[#B45309] tabular-nums"}, vnd(totalValue), " đ")
                )
              )
            )
          )
        ),

        /* Footer — tổng giá trị */
        /*#__PURE__*/React.createElement("div", {className:"rounded-xl border border-slate-200 bg-white px-5 py-3 text-center"},
          /*#__PURE__*/React.createElement("span", {className:"text-sm font-medium text-slate-600"},
            "Tổng giá trị HĐ: ",
            /*#__PURE__*/React.createElement("span", {className:"text-lg font-bold text-[#B45309]"}, vnd(totalValue), " đ"))
        )
      )
    );
  }

  // ── LIST VIEW ──────────────────────────────────────────────────────────────
  const tblHead = /*#__PURE__*/React.createElement(React.Fragment, null,
    /*#__PURE__*/React.createElement(Th, {style:{minWidth:120}}, "Số HĐ"),
    /*#__PURE__*/React.createElement(Th, {style:{minWidth:100}}, "Mẫu HĐ"),
    /*#__PURE__*/React.createElement(Th, {style:{minWidth:160}}, "Khách hàng"),
    /*#__PURE__*/React.createElement(Th, {style:{minWidth:90}}, "Ngày ký"),
    /*#__PURE__*/React.createElement(Th, {right:true, style:{width:130}}, "Giá trị HĐ"),
    /*#__PURE__*/React.createElement(Th, {style:{minWidth:160}}, "Đơn hàng"),
    /*#__PURE__*/React.createElement(Th, {center:true, style:{width:80}}, ""));

  return /*#__PURE__*/React.createElement("div", {className:"space-y-4"},
    /*#__PURE__*/React.createElement("div", {className:"flex flex-wrap items-center gap-2"},
      /*#__PURE__*/React.createElement("div", {className:"relative flex-1 min-w-[200px]"},
        /*#__PURE__*/React.createElement(Search, {className:"absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400"}),
        /*#__PURE__*/React.createElement("input", {value:q, onChange:e=>setQ(e.target.value), placeholder:"Tìm số HĐ, khách hàng…", className:`${field} w-full pl-8`})),
      /*#__PURE__*/React.createElement("button", {onClick:openNew, className:blueBtn},
        /*#__PURE__*/React.createElement(Plus, {className:"h-4 w-4"}), " Thêm hợp đồng")),
    /*#__PURE__*/React.createElement(TableShell, {minW:"900px", head:tblHead},
      filtered.length === 0
        ? /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("td", {colSpan:7, className:"px-4 py-8 text-center text-slate-400"}, "Chưa có hợp đồng nào"))
        : filtered.map(c => /*#__PURE__*/React.createElement("tr", {key:c.id, className:"hover:bg-slate-50/60 cursor-pointer", onClick:()=>openEdit(c)},
            /*#__PURE__*/React.createElement("td", {className:"px-3 py-3 font-medium text-[#B45309]"}, c.contractNum),
            /*#__PURE__*/React.createElement("td", {className:"px-3 py-3 text-xs text-slate-500"}, c.template||""),
            /*#__PURE__*/React.createElement("td", {className:"px-3 py-3"}, c.custName),
            /*#__PURE__*/React.createElement("td", {className:"px-3 py-3 text-slate-500"}, c.signDate),
            /*#__PURE__*/React.createElement("td", {className:"px-3 py-3 text-right tabular-nums font-medium"}, c.value?vnd(c.value):""),
            /*#__PURE__*/React.createElement("td", {className:"px-3 py-3"},
              /*#__PURE__*/React.createElement("div", {className:"flex flex-wrap gap-1"},
                (c.orderIds||[]).map(id => /*#__PURE__*/React.createElement("span", {key:id, className:"inline-flex items-center whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-medium bg-[#FDF1E5] text-[#B45309] ring-1 ring-inset ring-[#B45309]/40"}, id)))),
            /*#__PURE__*/React.createElement("td", {className:"px-3 py-3 text-center", onClick:e=>e.stopPropagation()},
              /*#__PURE__*/React.createElement(IconBtn, {icon:Trash2, tone:"danger", title:"Xóa", onClick:()=>del(c.id)}))))));
}

