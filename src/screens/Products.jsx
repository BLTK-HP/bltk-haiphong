import React, { useState, useMemo, useEffect } from 'react';
import { Plus, Save, Search, ArrowLeft, AlertTriangle } from 'lucide-react';
import { useCollection, saveDoc, deleteDocument, batchSave } from '../useFirestore.js';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../firebase.js';
import { useAuth } from '../useAuth.js';
import { useInventory, useToast } from '../contexts.jsx';
import {
  vnd, calc, field, inputF, blueBtn, ghostBtn, addBtn,
  SUPPLIERS, SUP_DETAIL, parseISO, parseISOEnd, parseViDate,
  localMonthStart, localToday,
} from '../constants.js';
import {
  Th, TableShell, Card, DateRangeFilter, PrintBtn, ExportBtn, exportCSV,
  NumInput, Modal, Phone, IconBtn, Empty,
} from '../components/ui.jsx';

/* ───────── Upload ảnh lên Firebase Storage ───────── */
export function ImageUploader({ sku, value, onChange }) {
  const [uploading, setUploading] = React.useState(false);
  const handleFile = async ev => {
    const file = ev.target.files && ev.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const safeSku = (sku || 'product_' + Date.now()).replace(/[\/\\]/g, '__');
      const ext = file.name.split('.').pop() || 'jpg';
      const path = `products/${safeSku}.${ext}`;
      const fileRef = storageRef(storage, path);
      await uploadBytes(fileRef, file);
      const url = await getDownloadURL(fileRef);
      onChange(url);
    } catch(e) {
      alert('Lỗi upload ảnh: ' + e.message);
    }
    setUploading(false);
  };
  return React.createElement("div", { className: "space-y-2" },
    React.createElement("div", { className: "flex items-center gap-3" },
      React.createElement("label", {
        className: "inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600 hover:bg-slate-100"
      },
        uploading
          ? React.createElement("span", null, "Đang upload...")
          : React.createElement(React.Fragment, null,
              React.createElement(Upload, { className: "h-4 w-4" }),
              " Chọn ảnh từ máy"
            ),
        React.createElement("input", {
          type: "file", accept: "image/*",
          className: "hidden",
          disabled: uploading,
          onChange: handleFile
        })
      ),
      value && React.createElement("button", {
        type: "button",
        onClick: () => onChange(""),
        className: "text-xs text-slate-400 hover:text-red-500"
      }, "Xoá ảnh")
    ),
    React.createElement("input", {
      type: "text",
      placeholder: "Hoặc dán URL ảnh...",
      value: value || "",
      onChange: ev => onChange(ev.target.value),
      className: "block w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"
    }),
    value && React.createElement("img", {
      src: value, alt: "preview",
      className: "h-24 w-24 rounded-lg border border-slate-200 object-cover",
      onError: ev => { ev.target.style.display = 'none'; }
    })
  );
}

/* ───────── Products (form thêm/sửa theo Ảnh 3 & 4) ───────── */
const UNITS = ["Cái", "Bộ", "Chiếc", "Hộp", "Thùng", "Mét", "Cặp"];
const CATS = ["Bồn cầu", "Vòi lavabo", "Sen tắm", "Chậu rửa", "Tiểu nam", "Bếp từ", "Lò nướng", "Hút mùi", "Phụ kiện"];
export function ProductForm({
  initial,
  presetName,
  onClose,
  onSave,
  existingNames = [],
  existingSkus = []
}) {
  const isEdit = !!(initial && initial.sku);
  const suggestSku = (presetName || "").trim().toUpperCase().replace(/\s+/g, "-").slice(0, 20);
  const e = initial || (presetName ? {
    name: presetName,
    sku: suggestSku,
    unit: "Cái"
  } : {});
  const [f, setF] = useState({
    sku: e.sku || "",
    name: e.name || "",
    desc: e.desc || "",
    cost: e.cost || 0,
    list: e.list || 0,
    sale: e.sale || 0,
    supplier: e.supplier || "",
    brand: e.brand || "",
    unit: e.unit || "",
    cat: e.cat || "",
    status: e.status || "Đang bán",
    stock: e.stock ?? 0,
    img: e.img || ""
  });
  const set = p => setF(x => ({
    ...x,
    ...p
  }));
  const dupName = f.name.trim() &&
    !(isEdit && f.name.trim().toLowerCase() === (e.name || "").trim().toLowerCase()) &&
    existingNames.includes(f.name.trim().toLowerCase());
  const dupSku  = f.sku.trim()  && existingSkus.includes(f.sku.trim().toLowerCase());
  const can = f.sku.trim() && f.name.trim() && f.unit && !dupName && !dupSku;
  return /*#__PURE__*/React.createElement(Modal, {
    title: isEdit ? "Sửa sản phẩm" : "Thêm sản phẩm mới",
    onClose: onClose,
    footer: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("button", {
      onClick: onClose,
      className: ghostBtn
    }, /*#__PURE__*/React.createElement(ArrowLeft, {
      className: "h-4 w-4"
    }), " Quay lại"), /*#__PURE__*/React.createElement("button", {
      onClick: () => can && onSave(f),
      disabled: !can,
      className: blueBtn + " disabled:bg-slate-300"
    }, /*#__PURE__*/React.createElement(Save, {
      className: "h-4 w-4"
    }), " Lưu"))
  }, /*#__PURE__*/React.createElement("div", {
    className: "space-y-4"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: "mb-1 block text-sm font-medium text-slate-700"
  }, "Mã sản phẩm ", /*#__PURE__*/React.createElement("span", {
    className: "text-[#B91C1C]"
  }, "*")), /*#__PURE__*/React.createElement(React.Fragment, null,
      /*#__PURE__*/React.createElement("input", {
        className: inputF + (dupSku ? " border-rose-400 ring-1 ring-rose-400" : ""),
        value: f.sku,
        onChange: ev => set({sku: ev.target.value})
      }),
      dupSku && /*#__PURE__*/React.createElement("p", {
        className: "mt-1 flex items-center gap-1 text-xs text-[#B91C1C]"
      }, /*#__PURE__*/React.createElement(AlertTriangle, {className: "h-3.5 w-3.5 shrink-0"}), "Mã sản phẩm đã tồn tại, vui lòng nhập mã khác"))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: "mb-1 block text-sm font-medium text-slate-700"
  }, "Tên sản phẩm ", /*#__PURE__*/React.createElement("span", {
    className: "text-[#B91C1C]"
  }, "*")), /*#__PURE__*/React.createElement("input", {
    className: inputF + (dupName ? " border-rose-400 ring-1 ring-rose-400" : ""),
    value: f.name,
    onChange: ev => set({name: ev.target.value})
  }), dupName && /*#__PURE__*/React.createElement("p", {
    className: "mt-1 flex items-center gap-1 text-xs text-[#B91C1C]"
  }, /*#__PURE__*/React.createElement(AlertTriangle, {className: "h-3.5 w-3.5 shrink-0"}), "Tên sản phẩm đã tồn tại, vui lòng nhập tên khác")), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: "mb-1 block text-sm font-medium text-slate-700"
  }, "Mô tả sản phẩm"), /*#__PURE__*/React.createElement("textarea", {
    rows: 3,
    className: inputF + " resize-none",
    placeholder: "Nhập mô tả sản phẩm...",
    value: f.desc,
    onChange: ev => set({
      desc: ev.target.value
    })
  }), /*#__PURE__*/React.createElement("p", {
    className: "mt-1 text-xs text-slate-400"
  }, "Sử dụng trình soạn thảo để định dạng văn bản.")), /*#__PURE__*/React.createElement("div", {
    className: "grid grid-cols-1 gap-4 sm:grid-cols-3"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: "mb-1 block text-sm font-medium text-slate-700"
  }, "Giá nhập"), /*#__PURE__*/React.createElement(NumInput, {
    className: inputF,
    value: f.cost,
    onChange: v => set({
      cost: v
    })
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: "mb-1 block text-sm font-medium text-slate-700"
  }, "Giá niêm yết"), /*#__PURE__*/React.createElement(NumInput, {
    className: inputF,
    value: f.list,
    onChange: v => set({
      list: v
    })
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: "mb-1 block text-sm font-medium text-slate-700"
  }, "Giá khuyến mãi"), /*#__PURE__*/React.createElement(NumInput, {
    className: inputF,
    value: f.sale,
    onChange: v => set({
      sale: v
    })
  }))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: "mb-1 block text-sm font-medium text-slate-700"
  }, "Nhà cung cấp"), /*#__PURE__*/React.createElement("input", {
    className: inputF,
    list: "sup-list-p",
    placeholder: "Tìm kiếm nhà cung cấp...",
    value: f.supplier,
    onChange: ev => set({
      supplier: ev.target.value
    })
  }), /*#__PURE__*/React.createElement("datalist", {
    id: "sup-list-p"
  }, SUPPLIERS.filter(s => s.code).map(s => /*#__PURE__*/React.createElement("option", {
    key: s.code,
    value: s.name
  }))), /*#__PURE__*/React.createElement("button", {
    className: "mt-1 inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:underline"
  }, /*#__PURE__*/React.createElement(Plus, {
    className: "h-3.5 w-3.5"
  }), " Thêm nhà cung cấp mới")), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: "mb-1 block text-sm font-medium text-slate-700"
  }, "Thương hiệu"), /*#__PURE__*/React.createElement("input", {
    className: inputF,
    value: f.brand,
    onChange: ev => set({
      brand: ev.target.value
    })
  })), /*#__PURE__*/React.createElement("div", {
    className: "grid grid-cols-1 gap-4 sm:grid-cols-2"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: "mb-1 block text-sm font-medium text-slate-700"
  }, "Đơn vị tính ", /*#__PURE__*/React.createElement("span", {
    className: "text-[#B91C1C]"
  }, "*")), /*#__PURE__*/React.createElement("select", {
    className: inputF,
    value: f.unit,
    onChange: ev => set({
      unit: ev.target.value
    })
  }, /*#__PURE__*/React.createElement("option", {
    value: ""
  }, "Chọn đơn vị tính"), UNITS.map(u => /*#__PURE__*/React.createElement("option", {
    key: u
  }, u)))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: "mb-1 block text-sm font-medium text-slate-700"
  }, "Danh mục sản phẩm"), /*#__PURE__*/React.createElement("select", {
    className: inputF,
    value: f.cat,
    onChange: ev => set({
      cat: ev.target.value
    })
  }, /*#__PURE__*/React.createElement("option", {
    value: ""
  }, "Chọn danh mục"), CATS.map(c => /*#__PURE__*/React.createElement("option", {
    key: c
  }, c))))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: "mb-1 block text-sm font-medium text-slate-700"
  }, "Trạng thái"), /*#__PURE__*/React.createElement("select", {
    className: inputF,
    value: f.status,
    onChange: ev => set({
      status: ev.target.value
    })
  }, /*#__PURE__*/React.createElement("option", null, "Đang bán"), /*#__PURE__*/React.createElement("option", null, "Ngừng bán"))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: "mb-1 block text-sm font-medium text-slate-700"
  }, "Hình ảnh"), /*#__PURE__*/React.createElement(ImageUploader, {
    sku: f.sku,
    value: f.img,
    onChange: url => set({ img: url })
  }))));
}
export function ProductsTab() {
  const notify = useToast();
  const [itemsFS, prodsLoaded, prodsError] = useCollection("products");
  const items = itemsFS;
  const toFsId = sku => sku.replace(/\//g, "__");
  // Seed Firestore lần đầu nếu còn trống
  useEffect(() => {
    if (prodsLoaded && !prodsError && itemsFS.length === 0) {
      const toId = sku => sku.replace(/\//g, "__");
      batchSave("products", PRODUCTS.map(p => ({...p, _id: toId(p.sku)})), p => p._id).catch(console.error);
    }
  }, [prodsLoaded, prodsError]);
  const [q, setQ] = useState("");
  const [form, setForm] = useState(null); // {} new | product edit
  const [perPage, setPerPage] = useState(50);
  const [page, setPage] = useState(1);
  const prevQ = React.useRef(q);
  const rows = useMemo(() => {
    if (prevQ.current !== q) {
      setPage(1);
      prevQ.current = q;
    }
    return items.filter(p => !q || `${p.name} ${p.sku}`.toLowerCase().includes(q.toLowerCase()));
  }, [items, q]);
  const totalPages = Math.ceil(rows.length / perPage);
  const pageRows = rows.slice((page - 1) * perPage, page * perPage);
  const pageNums = () => {
    if (totalPages <= 7) return Array.from({length: totalPages}, (_, i) => i + 1);
    if (page <= 4) return [1, 2, 3, 4, 5, "...", totalPages];
    if (page >= totalPages - 3) return [1, "...", totalPages-4, totalPages-3, totalPages-2, totalPages-1, totalPages];
    return [1, "...", page-1, page, page+1, "...", totalPages];
  };
  const tag = n => n === 0 ? "bg-rose-50 text-[#B91C1C]" : n <= 5 ? "bg-amber-50 text-amber-600" : "bg-emerald-50 text-[#92400e]";
  const save = async f => {
    const savedForm = form;
    setForm(null);
    if (savedForm && savedForm.sku) {
      // Dùng _id thực tế của Firestore document, không tính lại từ sku
      const docId = savedForm._id || toFsId(savedForm.sku);
      await saveDoc("products", docId, { ...savedForm, ...f })
        .then(() => notify("Đã cập nhật sản phẩm"))
        .catch(e => { console.error(e); notify("Lỗi lưu sản phẩm: " + (e.message || e.code || "Lỗi kết nối")); });
    } else {
      await saveDoc("products", toFsId(f.sku), f)
        .then(() => notify("Đã thêm sản phẩm"))
        .catch(e => { console.error(e); notify("Lỗi lưu sản phẩm: " + (e.message || e.code || "Lỗi kết nối")); });
    }
  };
  const del = _id => {
    deleteDocument("products", _id)
      .then(() => notify("Đã xoá sản phẩm"))
      .catch(e => { console.error(e); notify("Lỗi xoá sản phẩm: " + (e.message || e.code || "Lỗi kết nối")); });
  };
  const [deduping, setDeduping] = React.useState(false);
  const [dedupClean, setDedupClean] = React.useState(false);
  const cleanupDuplicates = async () => {
    setDeduping(true);
    const toFsId2 = sku => sku.replace(/\//g, "__");
    const bySkuMap = {};
    for (const p of itemsFS) {
      if (!p.sku) continue; // bỏ qua doc không có sku
      if (!bySkuMap[p.sku]) bySkuMap[p.sku] = [];
      bySkuMap[p.sku].push(p);
    }
    let deleted = 0;
    for (const [sku, group] of Object.entries(bySkuMap)) {
      if (group.length <= 1) continue;
      const canonical = toFsId2(sku);
      const keep = group.find(p => p._id === canonical) || group[0];
      for (const p of group) {
        if (p._id === keep._id) continue;
        await deleteDocument("products", p._id).catch(console.error);
        deleted++;
      }
    }
    setDeduping(false);
    setDedupClean(true); // ẩn nút sau khi đã chạy
    notify(deleted > 0 ? `Đã xóa ${deleted} bản sao thừa` : "Không có bản sao thừa");
  };
  const hasDuplicates = React.useMemo(() => {
    setDedupClean(false); // reset khi itemsFS thay đổi
    const seen = new Set();
    return itemsFS.some(p => {
      if (!p.sku) return false; // bỏ qua doc không có sku
      if (seen.has(p.sku)) return true;
      seen.add(p.sku);
      return false;
    });
  }, [itemsFS]);
  const onExport = () => exportCSV("danh-sach-san-pham", ["Mã SP", "Tên sản phẩm", "Mô tả", "ĐVT", "Niêm yết", "Giá bán", "Tồn"], rows.map(p => [p.sku, p.name, p.desc, p.unit, p.list, p.sale, p.stock]));
  if (!prodsLoaded) return /*#__PURE__*/React.createElement("div", {className: "flex items-center justify-center py-16 text-slate-400 text-sm gap-2"},
    /*#__PURE__*/React.createElement("svg", {className: "animate-spin h-5 w-5", viewBox: "0 0 24 24", fill: "none"},
      /*#__PURE__*/React.createElement("circle", {className: "opacity-25", cx: "12", cy: "12", r: "10", stroke: "currentColor", strokeWidth: "4"}),
      /*#__PURE__*/React.createElement("path", {className: "opacity-75", fill: "currentColor", d: "M4 12a8 8 0 018-8v8z"})),
    "Đang tải danh sách sản phẩm…");
  if (prodsError) return /*#__PURE__*/React.createElement("div", {className: "rounded-xl border border-red-200 bg-red-50 p-6 text-center"},
    /*#__PURE__*/React.createElement("p", {className: "font-semibold text-red-700 mb-1"}, "Không thể tải danh sách sản phẩm"),
    /*#__PURE__*/React.createElement("p", {className: "text-sm text-red-600"}, prodsError),
    /*#__PURE__*/React.createElement("p", {className: "mt-2 text-xs text-slate-500"}, "Kiểm tra Firestore Rules tại Firebase Console → Firestore Database → Rules"));
  return /*#__PURE__*/React.createElement("div", {
    className: "space-y-4"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex flex-wrap items-center gap-2"
  }, /*#__PURE__*/React.createElement("div", {
    className: "relative"
  }, /*#__PURE__*/React.createElement(Search, {
    className: "absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
  }), /*#__PURE__*/React.createElement("input", {
    value: q,
    onChange: e => setQ(e.target.value),
    placeholder: "Tìm tên / mã SP",
    className: `${field} w-60 pl-8`
  })), /*#__PURE__*/React.createElement("span", {
    className: "text-xs text-slate-400"
  }, rows.length, " sản phẩm"), /*#__PURE__*/React.createElement("div", {
    className: "ml-auto flex gap-2"
  }, (hasDuplicates && !dedupClean) && /*#__PURE__*/React.createElement("button", {
    onClick: cleanupDuplicates,
    disabled: deduping,
    className: "inline-flex items-center gap-1.5 rounded-lg border border-rose-300 bg-rose-50 px-3 py-1.5 text-sm font-medium text-rose-700 hover:bg-rose-100 disabled:opacity-50"
  }, deduping ? "Đang dọn…" : "Xóa bản sao thừa"), q && /*#__PURE__*/React.createElement("button", {
    onClick: () => setQ(""),
    className: ghostBtn
  }, /*#__PURE__*/React.createElement(ArrowLeft, {className: "h-4 w-4"}), " Quay lại"), /*#__PURE__*/React.createElement(ExportBtn, {
    onClick: onExport
  }), /*#__PURE__*/React.createElement("button", {
    onClick: () => setForm({}),
    className: addBtn
  }, /*#__PURE__*/React.createElement(Plus, {
    className: "h-4 w-4"
  }), " Thêm sản phẩm mới"))), /*#__PURE__*/React.createElement(TableShell, {
    minW: "1000px",
    head: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(Th, {
      center: true,
      style: {
        width: 70
      }
    }, "Hình ảnh"), /*#__PURE__*/React.createElement(Th, {
      style: {
        width: 240
      }
    }, "Mã SP"), /*#__PURE__*/React.createElement(Th, {
      style: {
        minWidth: 260
      }
    }, "Tên sản phẩm"), /*#__PURE__*/React.createElement(Th, {
      style: {
        minWidth: 240
      }
    }, "Mô tả"), /*#__PURE__*/React.createElement(Th, {
      style: {
        width: 70
      }
    }, "ĐVT"), /*#__PURE__*/React.createElement(Th, {
      right: true,
      style: {
        width: 110
      }
    }, "Niêm yết"), /*#__PURE__*/React.createElement(Th, {
      right: true,
      style: {
        width: 110
      }
    }, "Giá bán"), /*#__PURE__*/React.createElement(Th, {
      center: true,
      style: {
        width: 60
      }
    }, "Tồn"), /*#__PURE__*/React.createElement(Th, {
      center: true,
      style: {
        width: 90
      }
    }, "Thao tác"))
  }, pageRows.length === 0
    ? /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("td", {colSpan: 9, className: "py-12 text-center text-sm text-slate-400"}, q ? `Không tìm thấy sản phẩm khớp "${q}"` : "Chưa có sản phẩm nào. Nhấn \"Thêm sản phẩm mới\" để bắt đầu."))
    : pageRows.map(p => /*#__PURE__*/React.createElement("tr", {
    key: p.sku,
    className: "align-top hover:bg-slate-50/60"
  }, /*#__PURE__*/React.createElement("td", {
    className: "px-3 py-3"
  }, p.img
    ? /*#__PURE__*/React.createElement("img", {src: p.img, alt: p.name, className: "mx-auto h-12 w-12 rounded-lg border border-slate-200 object-cover"})
    : /*#__PURE__*/React.createElement("div", {className: "mx-auto flex h-12 w-12 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-300"},
        /*#__PURE__*/React.createElement(ImageIcon, {className: "h-5 w-5"}))), /*#__PURE__*/React.createElement("td", {
    className: "px-3 py-3 text-[13px] font-medium text-slate-700 max-w-[130px] overflow-hidden"
  }, /*#__PURE__*/React.createElement("div", {className: "truncate"}, /*#__PURE__*/React.createElement(Sku, {
    value: p.sku
  }))), /*#__PURE__*/React.createElement("td", {
    className: "px-3 py-3 text-slate-800 max-w-[260px] overflow-hidden"
  }, /*#__PURE__*/React.createElement("div", {className: "truncate", title: p.name}, p.name)), /*#__PURE__*/React.createElement("td", {
    className: "px-3 py-3 text-xs text-slate-500",
    style: {
      maxWidth: 280
    }
  }, p.desc), /*#__PURE__*/React.createElement("td", {
    className: "px-3 py-3 text-slate-500 max-w-[70px] overflow-hidden"
  }, /*#__PURE__*/React.createElement("div", {className: "truncate"}, p.unit)), /*#__PURE__*/React.createElement("td", {
    className: "px-3 py-3 text-right tabular-nums text-slate-400 line-through"
  }, vnd(p.list)), /*#__PURE__*/React.createElement("td", {
    className: "px-3 py-3 text-right font-semibold tabular-nums text-slate-900"
  }, vnd(p.sale)), /*#__PURE__*/React.createElement("td", {
    className: "px-3 py-3 text-center"
  }, /*#__PURE__*/React.createElement("span", {
    className: `inline-block min-w-[2rem] rounded-md px-2 py-0.5 text-center text-xs font-semibold tabular-nums ${tag(p.stock)}`
  }, p.stock)), /*#__PURE__*/React.createElement("td", {
    className: "px-3 py-3"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-center gap-1"
  }, /*#__PURE__*/React.createElement(React.Fragment, null,
      /*#__PURE__*/React.createElement(IconBtn, {
        icon: Pencil,
        title: "Sửa",
        onClick: () => setForm(p)
      }),
      /*#__PURE__*/React.createElement(IconBtn, {
        tone: "danger",
        icon: Trash2,
        title: "Xoá",
        onClick: () => del(p._id)
      }))))))),
  totalPages > 1 && /*#__PURE__*/React.createElement("div", {className: "flex items-center justify-between gap-3 pt-2 flex-wrap"},
    /*#__PURE__*/React.createElement("select", {
      value: perPage,
      onChange: e => { setPerPage(Number(e.target.value)); setPage(1); },
      className: `${field} text-sm`
    },
      [50, 100].map(n => /*#__PURE__*/React.createElement("option", {key: n, value: n}, n, " bản ghi trên 1 trang"))
    ),
    /*#__PURE__*/React.createElement("div", {className: "flex items-center gap-1"},
      /*#__PURE__*/React.createElement("button", {
        disabled: page === 1,
        onClick: () => setPage(p => Math.max(1, p - 1)),
        className: "rounded px-2 py-1 text-sm text-slate-600 hover:bg-slate-100 disabled:opacity-30"
      }, "Trước"),
      pageNums().map((n, i) => n === "..." ?
        /*#__PURE__*/React.createElement("span", {key: `e${i}`, className: "px-1 text-slate-400"}, "...") :
        /*#__PURE__*/React.createElement("button", {
          key: n,
          onClick: () => setPage(n),
          className: `min-w-[2rem] rounded px-2 py-1 text-sm font-medium ${page === n ? "bg-[#92400e] text-white" : "text-slate-600 hover:bg-slate-100"}`
        }, n)
      ),
      /*#__PURE__*/React.createElement("button", {
        disabled: page === totalPages,
        onClick: () => setPage(p => Math.min(totalPages, p + 1)),
        className: "rounded px-2 py-1 text-sm text-slate-600 hover:bg-slate-100 disabled:opacity-30"
      }, "Sau")
    )
  ),
  form && /*#__PURE__*/React.createElement(ProductForm, {
    initial: form.sku ? form : null,
    onClose: () => setForm(null),
    onSave: save,
    existingNames: items.filter(p => !form.sku || p.sku !== form.sku).map(p => p.name.toLowerCase()),
    existingSkus: items.filter(p => !form.sku || p.sku !== form.sku).map(p => p.sku.toLowerCase())
  }));
}
export function CustomerForm({
  initial,
  onClose,
  onSave
}) {
  const e = initial || {};
  const [f, setF] = useState({
    name: e.name || "",
    phone: e.phone || "",
    addr: e.addr || "",
    src: e.src || "Facebook",
    tier: e.tier || "Thường",
    orders: e.orders || 0,
    spent: e.spent || 0,
    debt: e.debt || 0
  });
  const set = p => setF(x => ({
    ...x,
    ...p
  }));
  const can = f.name.trim() && f.phone.trim();
  return /*#__PURE__*/React.createElement(Modal, {
    title: initial ? "Sửa khách hàng" : "Thêm khách hàng mới",
    onClose: onClose,
    footer: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("button", {
      onClick: onClose,
      className: backBtn
    }, "Quay lại"), /*#__PURE__*/React.createElement("button", {
      onClick: () => can && onSave(f),
      disabled: !can,
      className: blueBtn + " disabled:bg-slate-300"
    }, /*#__PURE__*/React.createElement(Save, {
      className: "h-4 w-4"
    }), " Lưu"))
  }, /*#__PURE__*/React.createElement("div", {
    className: "space-y-4"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: "mb-1 block text-sm font-medium text-slate-700"
  }, "Tên khách hàng ", /*#__PURE__*/React.createElement("span", {
    className: "text-[#B91C1C]"
  }, "*")), /*#__PURE__*/React.createElement("input", {
    className: inputF,
    value: f.name,
    onChange: ev => set({
      name: ev.target.value
    })
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: "mb-1 block text-sm font-medium text-slate-700"
  }, "Số điện thoại ", /*#__PURE__*/React.createElement("span", {
    className: "text-[#B91C1C]"
  }, "*")), /*#__PURE__*/React.createElement("input", {
    className: inputF,
    value: f.phone,
    onChange: ev => set({
      phone: ev.target.value
    })
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: "mb-1 block text-sm font-medium text-slate-700"
  }, "Địa chỉ"), /*#__PURE__*/React.createElement("input", {
    className: inputF,
    value: f.addr,
    onChange: ev => set({
      addr: ev.target.value
    })
  })), /*#__PURE__*/React.createElement("div", {
    className: "grid grid-cols-2 gap-4"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: "mb-1 block text-sm font-medium text-slate-700"
  }, "Nguồn"), /*#__PURE__*/React.createElement("select", {
    className: inputF,
    value: f.src,
    onChange: ev => set({
      src: ev.target.value
    })
  }, ["Facebook", "Zalo", "TikTok", "Đến CH"].map(s => /*#__PURE__*/React.createElement("option", {
    key: s
  }, s)))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: "mb-1 block text-sm font-medium text-slate-700"
  }, "Hạng"), /*#__PURE__*/React.createElement("select", {
    className: inputF,
    value: f.tier,
    onChange: ev => set({
      tier: ev.target.value
    })
  }, ["Thường", "Bạc", "Vàng", "Kim cương"].map(s => /*#__PURE__*/React.createElement("option", {
    key: s
  }, s)))))));
}
export function CustomersTab() {
  const notify = useToast();
  const [itemsFS, custsLoaded] = useCollection("customers");
  const items = itemsFS;
  // Seed Firestore lần đầu nếu còn trống
  useEffect(() => {
    if (custsLoaded && itemsFS.length === 0) {
      batchSave("customers", CUSTOMERS, c => c.id).catch(console.error);
    }
  }, [custsLoaded]);
  const [src, setSrc] = useState("Tất cả");
  const [tier, setTier] = useState("Tất cả");
  const [form, setForm] = useState(null);
  const rows = items.filter(c => (src === "Tất cả" || c.src === src) && (tier === "Tất cả" || c.tier === tier));
  const save = f => {
    const isEdit = form && form.id;
    const id = isEdit ? form.id : ("KH" + String(Date.now()).slice(-6));
    saveDoc("customers", id, isEdit ? {...form, ...f} : {...f, id})
      .then(() => { notify(isEdit ? "Đã cập nhật khách hàng" : "Đã thêm khách hàng"); setForm(null); })
      .catch(e => { console.error(e); notify("Lỗi lưu khách hàng: " + (e.message || "Lỗi kết nối")); });
  };
  const del = c => {
    if (window.confirm("Xoá khách hàng này?")) {
      deleteDocument("customers", c.id)
        .then(() => notify("Đã xoá khách hàng"))
        .catch(e => { console.error(e); notify("Lỗi xoá khách hàng: " + (e.message || "Lỗi kết nối")); });
    }
  };
  const onExport = () => exportCSV("danh-sach-khach-hang", ["Khách hàng", "Địa chỉ", "SĐT", "Nguồn", "Hạng", "Số đơn", "Tổng chi tiêu"], rows.map(c => [c.name, c.addr, c.phone, c.src, c.tier, c.orders, c.spent]));
  return /*#__PURE__*/React.createElement("div", {
    className: "space-y-4"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex flex-wrap items-center gap-2"
  }, /*#__PURE__*/React.createElement("select", {
    value: src,
    onChange: e => setSrc(e.target.value),
    className: field
  }, ["Tất cả", "Facebook", "Zalo", "TikTok", "Đến CH"].map(s => /*#__PURE__*/React.createElement("option", {
    key: s
  }, s))), /*#__PURE__*/React.createElement("select", {
    value: tier,
    onChange: e => setTier(e.target.value),
    className: field
  }, ["Tất cả", "Thường", "Bạc", "Vàng", "Kim cương"].map(s => /*#__PURE__*/React.createElement("option", {
    key: s
  }, s))), /*#__PURE__*/React.createElement("span", {
    className: "text-xs text-slate-400"
  }, rows.length, " khách"), /*#__PURE__*/React.createElement("div", {
    className: "ml-auto flex gap-2"
  }, /*#__PURE__*/React.createElement(PrintBtn, null), /*#__PURE__*/React.createElement(ExportBtn, {
    onClick: onExport
  }), /*#__PURE__*/React.createElement("button", {
    onClick: () => setForm({}),
    className: blueBtn
  }, /*#__PURE__*/React.createElement(Plus, {
    className: "h-4 w-4"
  }), " Thêm khách"))), /*#__PURE__*/React.createElement(TableShell, {
    head: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(Th, {
      style: {
        minWidth: 200
      }
    }, "Khách hàng"), /*#__PURE__*/React.createElement(Th, {
      style: {
        minWidth: 180
      }
    }, "Địa chỉ"), /*#__PURE__*/React.createElement(Th, null, "SĐT"), /*#__PURE__*/React.createElement(Th, null, "Nguồn"), /*#__PURE__*/React.createElement(Th, {
      right: true
    }, "Số đơn"), /*#__PURE__*/React.createElement(Th, {
      right: true
    }, "Tổng chi tiêu"), /*#__PURE__*/React.createElement(Th, {
      center: true,
      style: {
        width: 90
      }
    }, "Thao tác"))
  }, rows.map((c, i) => /*#__PURE__*/React.createElement("tr", {
    key: i,
    className: "hover:bg-slate-50/60"
  }, /*#__PURE__*/React.createElement("td", {
    className: "px-4 py-3 text-sm text-slate-800"
  }, c.name), /*#__PURE__*/React.createElement("td", {
    className: "px-4 py-3 text-sm text-slate-500"
  }, c.addr || ""), /*#__PURE__*/React.createElement("td", {
    className: "px-4 py-3 text-sm text-slate-500"
  }, /*#__PURE__*/React.createElement(Phone, {
    value: c.phone
  })), /*#__PURE__*/React.createElement("td", {
    className: "px-4 py-3"
  }, /*#__PURE__*/React.createElement(Pill, {
    map: CHANNELS,
    value: c.src
  })), /*#__PURE__*/React.createElement("td", {
    className: "px-4 py-3 text-right tabular-nums text-slate-600"
  }, c.orders), /*#__PURE__*/React.createElement("td", {
    className: "px-4 py-3 text-right font-medium tabular-nums text-slate-800"
  }, vnd(c.spent)), /*#__PURE__*/React.createElement("td", {
    className: "px-4 py-3"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-center"
  }, /*#__PURE__*/React.createElement(IconBtn, {
    icon: Pencil,
    title: "Sửa",
    onClick: () => setForm(c)
  }), /*#__PURE__*/React.createElement(IconBtn, {
    tone: "danger",
    icon: Trash2,
    title: "Xoá",
    onClick: () => del(c)
  })))))), form && /*#__PURE__*/React.createElement(CustomerForm, {
    initial: form.name ? form : null,
    onClose: () => setForm(null),
    onSave: save
  }));
}

/* ───────── Suppliers (bỏ Mã NCC; form thêm/sửa; thao tác) ───────── */
export function SupplierForm({
  initial,
  onClose,
  onSave
}) {
  const e = initial || {};
  const [f, setF] = useState({
    code: e.code || "",
    name: e.name || "",
    phone: e.phone || "",
    addr: e.addr || "",
    open: e.open || 0,
    ps: 0,
    tt: 0
  });
  const set = p => setF(x => ({
    ...x,
    ...p
  }));
  const can = f.name.trim();
  return /*#__PURE__*/React.createElement(Modal, {
    title: initial ? "Sửa nhà cung cấp" : "Thêm nhà cung cấp mới",
    onClose: onClose,
    footer: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("button", {
      onClick: onClose,
      className: backBtn
    }, "Quay lại"), /*#__PURE__*/React.createElement("button", {
      onClick: () => can && onSave(f),
      disabled: !can,
      className: blueBtn + " disabled:bg-slate-300"
    }, /*#__PURE__*/React.createElement(Save, {
      className: "h-4 w-4"
    }), " Lưu"))
  }, /*#__PURE__*/React.createElement("div", {
    className: "space-y-4"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: "mb-1 block text-sm font-medium text-slate-700"
  }, "Tên nhà cung cấp ", /*#__PURE__*/React.createElement("span", {
    className: "text-[#B91C1C]"
  }, "*")), /*#__PURE__*/React.createElement("input", {
    className: inputF,
    value: f.name,
    onChange: ev => set({
      name: ev.target.value
    })
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: "mb-1 block text-sm font-medium text-slate-700"
  }, "Điện thoại"), /*#__PURE__*/React.createElement("input", {
    className: inputF,
    value: f.phone,
    onChange: ev => set({
      phone: ev.target.value
    })
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: "mb-1 block text-sm font-medium text-slate-700"
  }, "Địa chỉ"), /*#__PURE__*/React.createElement("input", {
    className: inputF,
    value: f.addr,
    onChange: ev => set({
      addr: ev.target.value
    })
  }))));
}
export function Suppliers() {
  const notify = useToast();
  const [items, setItems] = useState(SUPPLIERS.filter(s => s.name !== "Không xác định"));
  const [form, setForm] = useState(null);
  const [payModal, setPayModal] = useState(null);
  const { whInItems = [], setWhInItems } = useInventory() || {};
  const { txns = [], setTxns } = useTxns() || {};
  const lotRemaining = r => { const tot=(r.costNcc+(r.fee||0))*r.qtyIn-(r.returns||[]).reduce((s,x)=>s+(x.amount||0),0); const paid=r.paid||(r.pay==="Đã thanh toán"?tot:0); return Math.max(0,tot-paid); };
  const debtOf = name => whInItems.filter(r=>r.supplier===name).reduce((s,r)=>s+lotRemaining(r),0);
  const nextTxnId = txns.length ? Math.max(...txns.map(t=>Number(t.id)||0))+1 : 1;
  const handlePaySave = t => { setTxns(p=>[t,...p]); setPayModal(null); notify("Đã lưu phiếu chi"); };
  const save = f => {
    setItems(xs => form && form.name ? xs.map(s => s === form ? {
      ...s,
      ...f
    } : s) : [{
      ...f
    }, ...xs]);
    notify(form && form.name ? "Đã cập nhật NCC" : "Đã thêm NCC");
    setForm(null);
  };
  const del = s => {
    if (window.confirm("Xoá nhà cung cấp này?")) {
      setItems(xs => xs.filter(x => x !== s));
      notify("Đã xoá NCC");
    }
  };
  const onExport = () => exportCSV("danh-sach-nha-cung-cap", ["Tên nhà cung cấp", "Điện thoại", "Địa chỉ"], items.map(s => [s.name, s.phone, s.addr]));
  return /*#__PURE__*/React.createElement("div", {
    className: "space-y-4"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex justify-end gap-2"
  }, /*#__PURE__*/React.createElement(ExportBtn, {
    onClick: onExport
  }), /*#__PURE__*/React.createElement("button", {
    onClick: () => setForm({}),
    className: blueBtn
  }, /*#__PURE__*/React.createElement(Plus, {
    className: "h-4 w-4"
  }), " Thêm nhà cung cấp")), /*#__PURE__*/React.createElement(TableShell, {
    head: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(Th, {
      style: {
        minWidth: 260
      }
    }, "Tên nhà cung cấp"), /*#__PURE__*/React.createElement(Th, null, "Điện thoại"), /*#__PURE__*/React.createElement(Th, {
      style: {
        minWidth: 240
      }
    }, "Địa chỉ"), /*#__PURE__*/React.createElement(Th, {center:true}, "Dư nợ"), /*#__PURE__*/React.createElement(Th, {
      center: true,
      style: {
        width: 120
      }
    }, "Thao tác"))
  }, items.map((s, i) => { const debt = debtOf(s.name); return /*#__PURE__*/React.createElement("tr", {
    key: i,
    className: "hover:bg-slate-50/60"
  }, /*#__PURE__*/React.createElement("td", {
    className: "px-4 py-3 font-medium text-slate-800"
  }, s.name), /*#__PURE__*/React.createElement("td", {
    className: "px-4 py-3 text-xs text-slate-600"
  }, /*#__PURE__*/React.createElement(Phone, {
    value: s.phone
  })), /*#__PURE__*/React.createElement("td", {
    className: "px-4 py-3 text-slate-500"
  }, s.addr || ""), /*#__PURE__*/React.createElement("td", {
    className: "px-4 py-3 text-right tabular-nums " + (debt > 0 ? "text-[#B91C1C]" : "text-slate-400"),
    style: {fontWeight: 700}
  }, debt > 0 ? vnd(debt) : "—"), /*#__PURE__*/React.createElement("td", {
    className: "px-4 py-3"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-center gap-1"
  }, /*#__PURE__*/React.createElement("button", {onClick: () => debt > 0 && setPayModal(s), disabled: debt === 0, className: "inline-flex items-center gap-1 rounded border px-2 py-1 text-xs font-medium " + (debt > 0 ? "border-green-200 bg-green-50 text-[#047857] hover:bg-green-100" : "border-slate-200 bg-slate-50 text-slate-300 cursor-default")}, /*#__PURE__*/React.createElement(Wallet, {className:"h-3 w-3"}), "TT"),
  /*#__PURE__*/React.createElement(IconBtn, {
    icon: Pencil,
    title: "Sửa",
    onClick: () => setForm(s)
  }), /*#__PURE__*/React.createElement(IconBtn, {
    tone: "danger",
    icon: Trash2,
    title: "Xoá",
    onClick: () => del(s)
  })))); })), form && /*#__PURE__*/React.createElement(SupplierForm, {
    initial: form.name ? form : null,
    onClose: () => setForm(null),
    onSave: save
  }), payModal && /*#__PURE__*/React.createElement(PhieuChiModal, {onClose: () => setPayModal(null), initEntity: payModal.name, initKind: "CP Thanh Toán NCC", kinds: ["CP Đặt Cọc NCC","CP Thanh Toán NCC"], initAmount: debtOf(payModal.name), initNote: "Thanh toán NCC - "+payModal.name, nextId: nextTxnId, onSave: handlePaySave}));
}

/* ───────── Công nợ khách hàng (tổng hợp → chi tiết) ───────── */
export function DebtCust({ orders = [] }) {
  const [detail, setDetail] = useState(null);
  const [fromDate, setFromDate] = useState(localMonthStart());
  const [toDate, setToDate] = useState(localToday());
  const custDebt = React.useMemo(() => {
    
    const fD = fromDate ? parseISO(fromDate) : null;
    const tD = toDate   ? new Date(parseISOEnd(toDate)) : null;
    const inR = s => { const ms = parseViDate(s); if (!ms) return true; const d = new Date(ms); return (!fD || d >= fD) && (!tD || d <= tD); };
    const active = orders.filter(o => !o.draft && o.orderStatus !== 'Huỷ' && o.orderStatus !== 'Hủy' && inR(o.dt));
    const map = {};
    active.forEach(o => {
      const key = o.phone || o.name;
      if (!map[key]) map[key] = { name: o.name, phone: o.phone, addr: o.addr || '', ps: 0, tt: 0, open: 0, orders: [] };
      if (o.exported || o.deliveryConfirmed) map[key].ps += calc(o).total;
      map[key].tt += o.paid || 0;
      map[key].orders.push(o);
    });
    return Object.values(map).filter(c => c.ps > 0 || c.tt > 0).sort((a,b) => a.name.localeCompare(b.name,'vi'));
  }, [orders, fromDate, toDate]);
  const totals = custDebt.reduce((a,r) => ({ open: a.open+r.open, ps: a.ps+r.ps, tt: a.tt+r.tt }), { open:0, ps:0, tt:0 });
  const closeTotal = totals.open + totals.ps - totals.tt;
  if (detail) return /*#__PURE__*/React.createElement(CustDebtDetail, {
    row: detail,
    onBack: () => setDetail(null)
  });
  const onExport = () => exportCSV("cong-no-khach-hang", ["Tên khách hàng", "Điện thoại", "Dư nợ đầu kỳ", "Phát sinh", "Thanh toán", "Dư nợ cuối kỳ"], custDebt.map(r => [r.name, r.phone, r.open, r.ps, r.tt, r.open + r.ps - r.tt]));
  return /*#__PURE__*/React.createElement("div", {
    className: "space-y-4"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex flex-wrap items-center gap-2"
  }, /*#__PURE__*/React.createElement(DateRangeFilter, {initFrom:fromDate, initTo:toDate, onApply:(f,t)=>{setFromDate(f);setToDate(t);}}), /*#__PURE__*/React.createElement("div", {
    className: "ml-auto flex gap-2"
  }, /*#__PURE__*/React.createElement(PrintBtn, null), /*#__PURE__*/React.createElement(ExportBtn, {
    onClick: onExport
  }))), /*#__PURE__*/React.createElement("div", {
    className: "text-center"
  }, /*#__PURE__*/React.createElement("h2", {
    className: "text-[16px] font-semibold uppercase text-slate-800"
  }, "Báo cáo tổng hợp công nợ khách hàng"), /*#__PURE__*/React.createElement("p", {
    className: "text-sm text-slate-500"
  }, `Từ ngày ${fromDate ? fromDate.split('-').reverse().join('/') : "—"} đến ngày ${toDate ? toDate.split('-').reverse().join('/') : "—"}`)), /*#__PURE__*/React.createElement("div", {
    className: "overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm",
    style: { maxHeight: "calc(100vh - 220px)", overflowY: "auto" }
  }, /*#__PURE__*/React.createElement("table", {
    className: "w-full text-sm",
    style: {
      minWidth: 1060
    }
  }, /*#__PURE__*/React.createElement("thead", {
    style: { position: "sticky", top: 0, zIndex: 10 }
  }, /*#__PURE__*/React.createElement("tr", {
    className: "bg-[#ffedd5] text-xs font-semibold uppercase tracking-wide text-[#7c2d12]"
  }, /*#__PURE__*/React.createElement("th", {
    rowSpan: 2,
    className: "border border-[#fed7aa] px-3 py-2 text-left"
  }, "Tên khách hàng"), /*#__PURE__*/React.createElement("th", {
    rowSpan: 2,
    className: "border border-[#fed7aa] px-3 py-2 text-left"
  }, "Địa chỉ"), /*#__PURE__*/React.createElement("th", {
    rowSpan: 2,
    className: "border border-[#fed7aa] px-3 py-2 text-left"
  }, "Điện thoại"), /*#__PURE__*/React.createElement("th", {
    rowSpan: 2,
    className: "border border-[#fed7aa] px-3 py-2 text-right"
  }, "Số dư nợ đầu kỳ"), /*#__PURE__*/React.createElement("th", {
    colSpan: 2,
    className: "border border-[#fed7aa] px-3 py-2 text-center"
  }, "Phát sinh trong kỳ"), /*#__PURE__*/React.createElement("th", {
    rowSpan: 2,
    className: "border border-[#fed7aa] px-3 py-2 text-right"
  }, "Số dư nợ cuối kỳ")), /*#__PURE__*/React.createElement("tr", {
    className: "bg-[#ffedd5] text-xs font-semibold uppercase tracking-wide text-[#7c2d12]"
  }, /*#__PURE__*/React.createElement("th", {
    className: "border border-[#fed7aa] px-3 py-1.5 text-center"
  }, "Phải TT"), /*#__PURE__*/React.createElement("th", {
    className: "border border-[#fed7aa] px-3 py-1.5 text-center"
  }, "Đã TT"))), /*#__PURE__*/React.createElement("tbody", {
    className: "divide-y divide-slate-100"
  }, custDebt.map((r, i) => {
    const close = r.open + r.ps - r.tt;
    return /*#__PURE__*/React.createElement("tr", {
      key: i,
      className: "hover:bg-slate-50/60"
    }, /*#__PURE__*/React.createElement("td", {
      className: "px-3 py-3"
    }, /*#__PURE__*/React.createElement("button", {
      onClick: () => setDetail(r),
      className: "text-left text-[#92400e] underline-offset-2 hover:underline"
    }, r.name)), /*#__PURE__*/React.createElement("td", {
      className: "border-l border-slate-100 px-3 py-3 text-xs text-slate-500"
    }, r.addr || ""), /*#__PURE__*/React.createElement("td", {
      className: "border-l border-slate-100 px-3 py-3 text-xs text-slate-500"
    }, /*#__PURE__*/React.createElement(Phone, {
      value: r.phone
    })), /*#__PURE__*/React.createElement("td", {
      className: `border-l border-slate-100 px-3 py-3 text-right tabular-nums ${r.open < 0 ? "text-[#B91C1C]" : "text-slate-700"}`
    }, num(r.open)), /*#__PURE__*/React.createElement("td", {
      className: "border-l border-slate-100 px-3 py-3 text-right tabular-nums text-slate-600"
    }, num(r.ps)), /*#__PURE__*/React.createElement("td", {
      className: "border-l border-slate-100 px-3 py-3 text-right tabular-nums text-slate-600"
    }, num(r.tt)), /*#__PURE__*/React.createElement("td", {
      className: `border-l border-slate-100 px-3 py-3 text-right tabular-nums font-semibold ${close < 0 ? "text-[#B91C1C]" : close === 0 ? "text-[#047857]" : "text-[#b45309]"}`
    }, num(close)));
  })), /*#__PURE__*/React.createElement("tfoot", null, /*#__PURE__*/React.createElement("tr", {
    className: "bg-[#fed7aa] font-bold"
  }, /*#__PURE__*/React.createElement("td", {
    colSpan: 3,
    className: "px-3 py-3 text-center text-slate-800", style: {fontWeight:700}
  }, "TỔNG CỘNG"), /*#__PURE__*/React.createElement("td", {
    className: "border-l border-slate-100 px-3 py-3 text-right tabular-nums text-slate-800", style: {fontWeight:700}
  }, num(totals.open)), /*#__PURE__*/React.createElement("td", {
    className: "border-l border-slate-100 px-3 py-3 text-right tabular-nums text-slate-800", style: {fontWeight:700}
  }, num(totals.ps)), /*#__PURE__*/React.createElement("td", {
    className: "border-l border-slate-100 px-3 py-3 text-right tabular-nums text-slate-800", style: {fontWeight:700}
  }, num(totals.tt)), /*#__PURE__*/React.createElement("td", {
    className: "border-l border-slate-100 px-3 py-3 text-right tabular-nums text-slate-800", style: {fontWeight:700}
  }, num(closeTotal)))))));
}
export function CustDebtDetail({
  row,
  onBack
}) {
  const detailOrders = (row.orders || []).map(o => {
    const c = calc(o);
    const itemsTotal = (o.items||[]).reduce((s,it)=>s+it.price*it.qty,0);
    const refund = (o.returns||[]).reduce((s,r)=>s+(r.amount||0),0);
    return { id:o.id, date:o.dt, items:(o.items||[]).map(it=>({name:it.name,sku:it.sku||'',qty:it.qty,price:it.price,amount:it.price*it.qty})), payable:c.total, paid:o.paid||0, expense:Math.max(0,c.total-itemsTotal), refund };
  }).filter(o=>o.items.length>0);
  const close = row.open + row.ps - row.tt;
  const totItems  = detailOrders.reduce((s,o)=>s+o.items.reduce((s2,it)=>s2+it.amount,0),0);
  const totRefund = detailOrders.reduce((s,o)=>s+o.refund,0);
  const totExp  = detailOrders.reduce((s,o)=>s+o.expense,0);
  const totPay  = detailOrders.reduce((s,o)=>s+o.payable,0);
  const totPaid = detailOrders.reduce((s,o)=>s+o.paid,0);
  const totDebt = totPay - totPaid;
  return /*#__PURE__*/React.createElement("div", {
    className: "space-y-4"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-between"
  }, /*#__PURE__*/React.createElement("button", {
    onClick: onBack,
    className: "inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800"
  }, /*#__PURE__*/React.createElement(ArrowLeft, {
    className: "h-4 w-4"
  }), " Quay lại báo cáo tổng hợp"), /*#__PURE__*/React.createElement("div", {
    className: "flex gap-2"
  }, /*#__PURE__*/React.createElement(PrintBtn, null), /*#__PURE__*/React.createElement(ExportBtn, {
    onClick: () => exportCSV("cong-no-" + row.name, ["Mã đơn", "Ngày", "Sản phẩm", "SL", "Đơn giá", "Tiền hàng", "Phải thanh toán", "Đã thanh toán", "Còn nợ"], detailOrders.flatMap(o => o.items.map(it => [o.id, o.date, it.name, it.qty, it.price, it.price * it.qty, o.payable, o.paid, o.payable - o.paid])))
  }))), /*#__PURE__*/React.createElement(Card, null, /*#__PURE__*/React.createElement("h3", {
    className: "mb-4 text-[16px] font-semibold text-[#92400e]"
  }, "Thông tin khách hàng"), /*#__PURE__*/React.createElement("div", {
    className: "flex flex-wrap gap-x-8 gap-y-1 text-sm"
  }, /*#__PURE__*/React.createElement("p", null, /*#__PURE__*/React.createElement("span", {
    className: "text-slate-500"
  }, "Tên khách hàng:"), " ", /*#__PURE__*/React.createElement("b", {
    className: "text-slate-800"
  }, row.name)), /*#__PURE__*/React.createElement("p", null, /*#__PURE__*/React.createElement("span", {
    className: "text-slate-500"
  }, "Địa chỉ:"), " ", /*#__PURE__*/React.createElement("b", {
    className: "text-slate-800"
  }, row.addr || "")), /*#__PURE__*/React.createElement("p", null, /*#__PURE__*/React.createElement("span", {
    className: "text-slate-500"
  }, "Số điện thoại:"), " ", /*#__PURE__*/React.createElement("b", {
    className: "text-slate-800"
  }, row.phone)), /*#__PURE__*/React.createElement("p", {className: "ml-auto text-right"}, /*#__PURE__*/React.createElement("span", {
    className: "text-slate-500"
  }, "Tổng dư nợ:"), " ", /*#__PURE__*/React.createElement("b", {
    className: "text-[#B91C1C]"
  }, num(close))))), /*#__PURE__*/React.createElement(Card, {
    title: "Bảng kê chi tiết công nợ khách hàng"
  }, detailOrders.length > 0 ? /*#__PURE__*/React.createElement("div", {
    className: "-mx-5 -mb-5 overflow-x-auto",
    style: { maxHeight: "calc(100vh - 280px)", overflowY: "auto" }
  }, /*#__PURE__*/React.createElement("table", {
    className: "w-full text-sm",
    style: {
      minWidth: 1020
    }
  }, /*#__PURE__*/React.createElement("thead", {
    style: { position: "sticky", top: 0, zIndex: 10 }
  }, /*#__PURE__*/React.createElement("tr", {
    className: "border-b border-[#fed7aa] bg-[#ffedd5] text-left text-xs uppercase tracking-wide text-[#7c2d12]"
  }, /*#__PURE__*/React.createElement("th", {
    className: "px-3 py-2.5"
  }, "Mã đơn"), /*#__PURE__*/React.createElement("th", {
    className: "px-3 py-2.5"
  }, "Sản phẩm"), /*#__PURE__*/React.createElement("th", {
    className: "px-3 py-2.5 text-right"
  }, "SL"), /*#__PURE__*/React.createElement("th", {
    className: "px-3 py-2.5 text-right"
  }, "Đơn giá"), /*#__PURE__*/React.createElement("th", {
    className: "px-3 py-2.5 text-right"
  }, "Tiền hàng"), /*#__PURE__*/React.createElement("th", {
    className: "px-3 py-2.5 text-right"
  }, "Hoàn tiền"), /*#__PURE__*/React.createElement("th", {
    className: "px-3 py-2.5 text-right"
  }, "Chi phí"), /*#__PURE__*/React.createElement("th", {
    className: "px-3 py-2.5 text-right"
  }, "Phải thanh toán"), /*#__PURE__*/React.createElement("th", {
    className: "px-3 py-2.5 text-right"
  }, "Đã thanh toán"), /*#__PURE__*/React.createElement("th", {
    className: "px-3 py-2.5 text-right"
  }, "Còn nợ"))), /*#__PURE__*/React.createElement("tbody", {
    className: "divide-y divide-slate-50"
  }, detailOrders.map((o, oi) => {
    const debtO = o.payable - o.paid;
    const td = "px-3 py-3 border-l border-slate-100";
    return o.items.map((it, k) => /*#__PURE__*/React.createElement("tr", {
      key: o.id + k,
      className: (k === 0 && oi > 0) ? "hover:bg-slate-50/60 border-t-2 border-t-slate-300" : "hover:bg-slate-50/60"
    }, k === 0 && /*#__PURE__*/React.createElement("td", {
      rowSpan: o.items.length,
      className: "px-3 py-3 align-top"
    }, /*#__PURE__*/React.createElement("span", {
      className: "inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset bg-[#fef9f0] text-[#92400e] ring-[#b45309]"
    }, o.id), /*#__PURE__*/React.createElement("br", null), /*#__PURE__*/React.createElement("span", {
      className: "text-xs text-slate-400"
    }, o.date)), /*#__PURE__*/React.createElement("td", {
      className: td + " text-slate-800"
    }, it.name, /*#__PURE__*/React.createElement("br", null), /*#__PURE__*/React.createElement("span", {
      className: "text-xs text-slate-400"
    }, it.sku)), /*#__PURE__*/React.createElement("td", {
      className: td + " text-right tabular-nums text-slate-600"
    }, it.qty), /*#__PURE__*/React.createElement("td", {
      className: td + " text-right tabular-nums text-slate-600"
    }, num(it.price)), /*#__PURE__*/React.createElement("td", {
      className: td + " text-right tabular-nums text-slate-700"
    }, num(it.amount)), k === 0 && /*#__PURE__*/React.createElement("td", {
      rowSpan: o.items.length,
      className: td + " text-right align-middle tabular-nums text-[#b45309]"
    }, o.refund > 0 ? num(o.refund) : ""), k === 0 && /*#__PURE__*/React.createElement("td", {
      rowSpan: o.items.length,
      className: td + " text-right align-middle tabular-nums text-slate-600"
    }, num(o.expense)), k === 0 && /*#__PURE__*/React.createElement("td", {
      rowSpan: o.items.length,
      className: td + " text-right align-middle tabular-nums text-slate-700"
    }, num(o.payable)), k === 0 && /*#__PURE__*/React.createElement("td", {
      rowSpan: o.items.length,
      className: td + " text-right align-middle tabular-nums text-[#92400e]"
    }, num(o.paid)), k === 0 && /*#__PURE__*/React.createElement("td", {
      rowSpan: o.items.length,
      className: td + " text-right align-middle font-semibold tabular-nums text-[#B91C1C]"
    }, num(debtO))));
  })), /*#__PURE__*/React.createElement("tfoot", null, /*#__PURE__*/React.createElement("tr", {
    className: "bg-slate-50 font-semibold border-t border-slate-200"
  }, /*#__PURE__*/React.createElement("td", {
    colSpan: 4,
    className: "px-3 py-3 text-right text-slate-500 text-xs uppercase tracking-wide"
  }, "Tổng cộng"), /*#__PURE__*/React.createElement("td", {
    className: "px-3 py-3 text-right tabular-nums border-l border-slate-100 text-slate-700 font-semibold"
  }, num(totItems)), /*#__PURE__*/React.createElement("td", {
    className: "px-3 py-3 text-right tabular-nums border-l border-slate-100 text-[#b45309]"
  }, totRefund > 0 ? num(totRefund) : ""), /*#__PURE__*/React.createElement("td", {
    className: "px-3 py-3 text-right tabular-nums border-l border-slate-100 text-slate-600"
  }, num(totExp)), /*#__PURE__*/React.createElement("td", {
    className: "px-3 py-3 text-right tabular-nums border-l border-slate-100 text-slate-700 font-semibold"
  }, num(totPay)), /*#__PURE__*/React.createElement("td", {
    className: "px-3 py-3 text-right tabular-nums border-l border-slate-100 text-[#92400e] font-semibold"
  }, num(totPaid)), /*#__PURE__*/React.createElement("td", {
    className: "px-3 py-3 text-right tabular-nums border-l border-slate-100 text-[#B91C1C] font-semibold"
  }, num(totDebt)))))) : /*#__PURE__*/React.createElement(Empty, null, "Không có dữ liệu đơn hàng chi tiết cho khách này. Số dư nợ cuối kỳ: ", /*#__PURE__*/React.createElement("b", {
    className: "text-[#B91C1C]"
  }, num(close)))));
}

/* ───────── Công nợ NCC (tổng hợp → chi tiết) ───────── */
export function DebtNcc({ purchaseList = [], setPurchaseList, setWhInItems, whInItems = [] }) {
  const [detail, setDetail] = useState(null);
  const [fromDate, setFromDate] = useState(localMonthStart());
  const [toDate, setToDate] = useState(localToday());
  const nccDebt = React.useMemo(() => {
    
    const fD = fromDate ? parseISO(fromDate) : null;
    const tD = toDate   ? new Date(parseISOEnd(toDate)) : null;
    const inR = s => { const ms = parseViDate(s); if (!ms) return true; const d = new Date(ms); return (!fD || d >= fD) && (!tD || d <= tD); };
    const map = {};
    // Dùng whInItems làm nguồn duy nhất; join purchaseList để lấy paid/returns
    const plMap = {};
    purchaseList.forEach(r => { plMap[r.lot + "__" + r.prod] = r; });
    whInItems.filter(r => r.supplier && inR(r.date)).forEach(r => {
      const key = r.supplier;
      if (!map[key]) { const sup = SUPPLIERS.find(s=>s.name===key); map[key] = { name:key, open: sup?.open||0, ps:0, tt:0, lots:[] }; }
      const pl = plMap[r.lot + "__" + r.prod];
      const total = (r.qtyIn||0)*(r.costNcc||0)+(r.fee||0);
      const returnAmt = (pl?.returns||[]).reduce((s,x)=>s+(x.amount||0),0);
      map[key].ps += total - returnAmt;
      map[key].tt += pl ? (pl.paid||0) : (r.pay==="Đã thanh toán" ? total : 0);
      map[key].lots.push(pl ? {...r, ...pl} : r);
    });
    return Object.values(map).filter(s=>s.ps>0).sort((a,b)=>a.name.localeCompare(b.name,'vi'));
  }, [purchaseList, whInItems, fromDate, toDate]);
  if (detail) return /*#__PURE__*/React.createElement(NccDebtDetail, {
    sup: detail,
    purchaseList,
    setPurchaseList,
    setWhInItems,
    onBack: () => setDetail(null)
  });
  const onExport = () => exportCSV("cong-no-nha-cung-cap", ["Tên nhà cung cấp", "Dư nợ đầu kỳ", "Phát sinh", "Thanh toán", "Dư nợ cuối kỳ"], nccDebt.map(s => [s.name, s.open, s.ps, s.tt, s.open + s.ps - s.tt]));
  return /*#__PURE__*/React.createElement("div", {
    className: "space-y-4"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex flex-wrap items-center gap-2"
  }, /*#__PURE__*/React.createElement(DateRangeFilter, {initFrom:fromDate, initTo:toDate, onApply:(f,t)=>{setFromDate(f);setToDate(t);}}), /*#__PURE__*/React.createElement("select", {
    className: field
  }, /*#__PURE__*/React.createElement("option", null, "Tất cả nhà cung cấp"), SUPPLIERS.filter(s => s.code).map(s => /*#__PURE__*/React.createElement("option", {
    key: s.code
  }, s.name))), /*#__PURE__*/React.createElement("button", {
    className: blueBtn
  }, /*#__PURE__*/React.createElement(Search, {
    className: "h-4 w-4"
  }), " Lọc"), /*#__PURE__*/React.createElement("div", {
    className: "ml-auto flex gap-2"
  }, /*#__PURE__*/React.createElement(PrintBtn, null), /*#__PURE__*/React.createElement(ExportBtn, {
    onClick: onExport
  }))), /*#__PURE__*/React.createElement("div", {
    className: "text-center"
  }, /*#__PURE__*/React.createElement("h2", {
    className: "text-[16px] font-semibold uppercase text-slate-800"
  }, "Báo cáo tổng hợp công nợ nhà cung cấp"), /*#__PURE__*/React.createElement("p", {
    className: "text-sm text-slate-500"
  }, `Từ ngày ${fromDate ? fromDate.split('-').reverse().join('/') : "—"} đến ngày ${toDate ? toDate.split('-').reverse().join('/') : "—"}`)), /*#__PURE__*/React.createElement("div", {
    className: "overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm",
    style: { maxHeight: "calc(100vh - 220px)", overflowY: "auto" }
  }, /*#__PURE__*/React.createElement("table", {
    className: "w-full text-sm",
    style: {
      minWidth: 760
    }
  }, /*#__PURE__*/React.createElement("thead", {
    style: { position: "sticky", top: 0, zIndex: 10 }
  }, /*#__PURE__*/React.createElement("tr", {
    className: "bg-[#ffedd5] text-xs font-semibold uppercase tracking-wide text-[#7c2d12]"
  }, /*#__PURE__*/React.createElement("th", {
    rowSpan: 2,
    className: "border border-[#fed7aa] px-3 py-2 text-left"
  }, "Tên nhà cung cấp"), /*#__PURE__*/React.createElement("th", {
    rowSpan: 2,
    className: "border border-[#fed7aa] px-3 py-2 text-right"
  }, "Số dư nợ đầu kỳ"), /*#__PURE__*/React.createElement("th", {
    colSpan: 2,
    className: "border border-[#fed7aa] px-3 py-2 text-center"
  }, "Phát sinh trong kỳ"), /*#__PURE__*/React.createElement("th", {
    rowSpan: 2,
    className: "border border-[#fed7aa] px-3 py-2 text-right"
  }, "Số dư nợ cuối kỳ")), /*#__PURE__*/React.createElement("tr", {
    className: "bg-[#ffedd5] text-xs font-semibold uppercase tracking-wide text-[#7c2d12]"
  }, /*#__PURE__*/React.createElement("th", {
    className: "border border-[#fed7aa] px-3 py-1.5 text-right"
  }, "Số phát sinh"), /*#__PURE__*/React.createElement("th", {
    className: "border border-[#fed7aa] px-3 py-1.5 text-right"
  }, "Thanh toán"))), /*#__PURE__*/React.createElement("tbody", {
    className: "divide-y divide-slate-100"
  }, nccDebt.map((s, i) => {
    const close = s.open + s.ps - s.tt;
    return /*#__PURE__*/React.createElement("tr", {
      key: i,
      className: "hover:bg-slate-50/60"
    }, /*#__PURE__*/React.createElement("td", {
      className: "px-3 py-3"
    }, /*#__PURE__*/React.createElement("button", {
      onClick: () => setDetail(s),
      className: "text-left text-[#92400e] underline-offset-2 hover:underline"
    }, s.name)), /*#__PURE__*/React.createElement("td", {
      className: "border-l border-slate-100 px-3 py-3 text-right tabular-nums text-slate-700"
    }, num(s.open)), /*#__PURE__*/React.createElement("td", {
      className: "border-l border-slate-100 px-3 py-3 text-right tabular-nums text-slate-600"
    }, num(s.ps)), /*#__PURE__*/React.createElement("td", {
      className: "border-l border-slate-100 px-3 py-3 text-right tabular-nums text-slate-600"
    }, num(s.tt)), /*#__PURE__*/React.createElement("td", {
      className: `border-l border-slate-100 px-3 py-3 text-right tabular-nums font-semibold ${close < 0 ? "text-[#B91C1C]" : close === 0 ? "text-[#047857]" : "text-[#b45309]"}`
    }, num(close)));
  })), /*#__PURE__*/React.createElement("tfoot", null, /*#__PURE__*/React.createElement("tr", {
    className: "bg-[#fed7aa]"
  }, /*#__PURE__*/React.createElement("td", {
    className: "px-3 py-3 text-center text-slate-800", style: {fontWeight:700}
  }, "TỔNG CỘNG"), /*#__PURE__*/React.createElement("td", {
    className: "border-l border-slate-100 px-3 py-3 text-right tabular-nums text-slate-800", style:{fontWeight:700}
  }, num(nccDebt.reduce((s,x)=>s+x.open,0))), /*#__PURE__*/React.createElement("td", {
    className: "border-l border-slate-100 px-3 py-3 text-right tabular-nums text-slate-800", style:{fontWeight:700}
  }, num(nccDebt.reduce((s,x)=>s+x.ps,0))), /*#__PURE__*/React.createElement("td", {
    className: "border-l border-slate-100 px-3 py-3 text-right tabular-nums text-slate-800", style:{fontWeight:700}
  }, num(nccDebt.reduce((s,x)=>s+x.tt,0))), /*#__PURE__*/React.createElement("td", {
    className: "border-l border-slate-100 px-3 py-3 text-right tabular-nums text-slate-800", style:{fontWeight:700}
  }, num(nccDebt.reduce((s,x)=>s+(x.open+x.ps-x.tt),0))))))));
}
export function NccReturnModal({lot, prod, costNcc, onClose, onSave}) {
  const today = () => { const d=new Date(); return `${String(d.getDate()).padStart(2,"0")}/${String(d.getMonth()+1).padStart(2,"0")}/${d.getFullYear()}`; };
  const [qty, setQty] = useState(1);
  const [amount, setAmount] = useState(costNcc||0);
  const [note, setNote] = useState("");
  return /*#__PURE__*/React.createElement(Modal, {title:"Hoàn hàng NCC", onClose, maxW:"max-w-md",
    footer:/*#__PURE__*/React.createElement(React.Fragment,null,
      /*#__PURE__*/React.createElement("button",{onClick:onClose,className:ghostBtn},"Hủy"),
      /*#__PURE__*/React.createElement("button",{onClick:()=>onSave({qty,amount,date:today(),note}),disabled:qty<=0||amount<=0,className:blueBtn+(qty>0&&amount>0?"":" opacity-50 cursor-not-allowed")},"Xác nhận hoàn"))},
    /*#__PURE__*/React.createElement("div",{className:"space-y-3 text-sm"},
      /*#__PURE__*/React.createElement("p",null,/*#__PURE__*/React.createElement("span",{className:"text-slate-500"},"Sản phẩm: "),/*#__PURE__*/React.createElement("b",null,prod)),
      /*#__PURE__*/React.createElement("div",{className:"grid grid-cols-2 gap-3"},
        /*#__PURE__*/React.createElement("div",null,
          /*#__PURE__*/React.createElement("label",{className:"mb-1 block text-xs font-medium text-slate-500"},"Số lượng hoàn"),
          /*#__PURE__*/React.createElement(NumInput,{value:qty,onChange:setQty,className:"w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-[#fed7aa] focus:outline-none"})),
        /*#__PURE__*/React.createElement("div",null,
          /*#__PURE__*/React.createElement("label",{className:"mb-1 block text-xs font-medium text-slate-500"},"Số tiền hoàn"),
          /*#__PURE__*/React.createElement(NumInput,{value:amount,onChange:setAmount,className:"w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-[#fed7aa] focus:outline-none"}))),
      /*#__PURE__*/React.createElement("div",null,
        /*#__PURE__*/React.createElement("label",{className:"mb-1 block text-xs font-medium text-slate-500"},"Ghi chú"),
        /*#__PURE__*/React.createElement("input",{value:note,onChange:e=>setNote(e.target.value),placeholder:"Lý do hoàn...",className:"w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-[#fed7aa] focus:outline-none"})))
  );
}

export function NccDebtDetail({
  sup,
  purchaseList,
  setPurchaseList,
  setWhInItems,
  onBack
}) {
  const lots = sup.lots || [];
  const close = (sup.open||0) + (sup.ps||0) - (sup.tt||0);
  const [returnModal, setReturnModal] = useState(null);
  const onReturn = lot => {
    const rec = (purchaseList||[]).find(r => r.lot === lot.lot && r.prod === lot.prod);
    if (!rec) return;
    setReturnModal(rec);
  };
  const doReturn = (rec, ret) => {
    if (!setPurchaseList) return;
    setPurchaseList(xs => xs.map(r => (r.lot===rec.lot&&r.prod===rec.prod) ? {...r, returns:[...(r.returns||[]),ret]} : r));
    if (setWhInItems) {
      setWhInItems(xs => xs.map(r => (r.lot===rec.lot&&r.prod===rec.prod)
        ? {...r, qtyRemaining: Math.max(0,(r.qtyRemaining??r.qtyNow??0)-ret.qty), qtyNow: Math.max(0,(r.qtyNow??0)-ret.qty)}
        : r));
    }
    setReturnModal(null);
  };
  return /*#__PURE__*/React.createElement("div", {
    className: "space-y-4"
  }, /*#__PURE__*/React.createElement("button", {
    onClick: onBack,
    className: "inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800"
  }, /*#__PURE__*/React.createElement(ArrowLeft, {
    className: "h-4 w-4"
  }), " Quay lại báo cáo tổng hợp"), /*#__PURE__*/React.createElement(Card, null, /*#__PURE__*/React.createElement("h3", {
    className: "mb-4 text-[16px] font-semibold text-[#92400e]"
  }, "Thông tin nhà cung cấp"), /*#__PURE__*/React.createElement("div", {
    className: "flex flex-wrap gap-x-8 gap-y-1 text-sm"
  }, /*#__PURE__*/React.createElement("p", null, /*#__PURE__*/React.createElement("span", {
    className: "text-slate-500"
  }, "Tên nhà cung cấp:"), " ", /*#__PURE__*/React.createElement("b", {
    className: "text-slate-800"
  }, sup.name)), /*#__PURE__*/React.createElement("p", {className: "ml-auto text-right"}, /*#__PURE__*/React.createElement("span", {
    className: "text-slate-500"
  }, "Tổng dư nợ:"), " ", /*#__PURE__*/React.createElement("b", {
    className: "text-[#B91C1C]"
  }, num(close))))), /*#__PURE__*/React.createElement(Card, {
    title: "Bảng kê chi tiết lô hàng"
  }, lots.length ? /*#__PURE__*/React.createElement("div", {
    className: "-mx-5 -mb-5 overflow-x-auto",
    style: { maxHeight: "calc(100vh - 280px)", overflowY: "auto" }
  }, /*#__PURE__*/React.createElement("table", {
    className: "w-full text-sm",
    style: {
      minWidth: 1000
    }
  }, /*#__PURE__*/React.createElement("thead", {
    style: { position: "sticky", top: 0, zIndex: 10 }
  }, /*#__PURE__*/React.createElement("tr", {
    className: "border-b border-[#fed7aa] bg-[#ffedd5] text-left text-xs uppercase tracking-wide text-[#7c2d12]"
  }, /*#__PURE__*/React.createElement("th", {
    className: "px-3 py-2.5"
  }, "Ngày nhập"), /*#__PURE__*/React.createElement("th", {
    className: "px-3 py-2.5"
  }, "Số phiếu nhập"), /*#__PURE__*/React.createElement("th", {
    className: "px-3 py-2.5"
  }, "Sản phẩm"), /*#__PURE__*/React.createElement("th", {
    className: "px-3 py-2.5 text-right"
  }, "SL"), /*#__PURE__*/React.createElement("th", {
    className: "px-3 py-2.5 text-right"
  }, "Đơn giá"), /*#__PURE__*/React.createElement("th", {
    className: "px-3 py-2.5 text-right"
  }, "Tiền hàng"), /*#__PURE__*/React.createElement("th", {
    className: "px-3 py-2.5 text-right"
  }, "Hoàn hàng"), /*#__PURE__*/React.createElement("th", {
    className: "px-3 py-2.5 text-right"
  }, "Chi phí"), /*#__PURE__*/React.createElement("th", {
    className: "px-3 py-2.5 text-right"
  }, "Phải thanh toán"), /*#__PURE__*/React.createElement("th", {
    className: "px-3 py-2.5 text-right"
  }, "Đã thanh toán"), /*#__PURE__*/React.createElement("th", {
    className: "px-3 py-2.5 text-right"
  }, "Còn nợ"), /*#__PURE__*/React.createElement("th", {
    className: "px-3 py-2.5"
  }, ""))), /*#__PURE__*/React.createElement("tbody", {
    className: "divide-y divide-slate-50"
  }, lots.map((l, li) => {
    const tienHang = (l.qtyIn||0)*(l.costNcc||0);
    const chiPhi = l.fee||0;
    const returnAmt = (l.returns||[]).reduce((s,x)=>s+(x.amount||0),0);
    const tot = tienHang + chiPhi - returnAmt;
    const paidAmt = (l.paid != null) ? (l.paid||0) : (l.pay==="Đã thanh toán" ? tienHang+chiPhi : 0);
    const con = tot - paidAmt;
    const td = "px-3 py-3 border-l border-slate-100";
    return /*#__PURE__*/React.createElement("tr", {
      key: li,
      className: "hover:bg-slate-50/60"
    }, /*#__PURE__*/React.createElement("td", {
      className: "px-3 py-3 text-slate-500 whitespace-nowrap"
    }, l.date), /*#__PURE__*/React.createElement("td", {
      className: "px-3 py-3"
    }, /*#__PURE__*/React.createElement("span", {className: "inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset bg-[#fef9f0] text-[#92400e] ring-[#b45309]"}, impCode(l.slip||l.lot))), /*#__PURE__*/React.createElement("td", {
      className: td + " text-slate-800"
    }, l.prod), /*#__PURE__*/React.createElement("td", {
      className: td + " text-right tabular-nums text-slate-600"
    }, l.qtyIn||0), /*#__PURE__*/React.createElement("td", {
      className: td + " text-right tabular-nums text-slate-600"
    }, num(l.costNcc)), /*#__PURE__*/React.createElement("td", {
      className: td + " text-right tabular-nums text-slate-700 font-medium"
    }, num(tienHang)), /*#__PURE__*/React.createElement("td", {
      className: td + " text-right tabular-nums text-[#b45309]"
    }, returnAmt > 0 ? num(returnAmt) : ""), /*#__PURE__*/React.createElement("td", {
      className: td + " text-right tabular-nums text-slate-600"
    }, chiPhi > 0 ? num(chiPhi) : ""), /*#__PURE__*/React.createElement("td", {
      className: td + " text-right tabular-nums text-slate-700 font-semibold"
    }, num(tot)), /*#__PURE__*/React.createElement("td", {
      className: td + " text-right tabular-nums text-[#92400e] font-semibold"
    }, paidAmt > 0 ? num(paidAmt) : ""), /*#__PURE__*/React.createElement("td", {
      className: td + " text-right tabular-nums font-semibold " + (con > 0 ? "text-[#B91C1C]" : "text-slate-400")
    }, num(con)||"0"), /*#__PURE__*/React.createElement("td", {
      className: "px-3 py-3 border-l border-slate-100"
    })
  )
  })), /*#__PURE__*/React.createElement("tfoot", null, /*#__PURE__*/React.createElement("tr", {
    className: "bg-slate-50 font-semibold border-t border-slate-200"
  }, /*#__PURE__*/React.createElement("td", {
    colSpan: 5,
    className: "px-3 py-3 text-right text-slate-500 text-xs uppercase tracking-wide"
  }, "Tổng cộng"), /*#__PURE__*/React.createElement("td", {
    className: "px-3 py-3 text-right tabular-nums border-l border-slate-100 text-slate-700 font-semibold"
  }, num(lots.reduce((s,l)=>(l.qtyIn||0)*(l.costNcc||0)+s,0))), /*#__PURE__*/React.createElement("td", {
    className: "px-3 py-3 text-right tabular-nums border-l border-slate-100 text-[#b45309]"
  }, lots.reduce((s,l)=>s+(l.returns||[]).reduce((r,x)=>r+(x.amount||0),0),0)>0 ? num(lots.reduce((s,l)=>s+(l.returns||[]).reduce((r,x)=>r+(x.amount||0),0),0)) : ""), /*#__PURE__*/React.createElement("td", {
    className: "px-3 py-3 text-right tabular-nums border-l border-slate-100 text-slate-600"
  }, lots.reduce((s,l)=>s+(l.fee||0),0)>0 ? num(lots.reduce((s,l)=>s+(l.fee||0),0)) : ""), /*#__PURE__*/React.createElement("td", {
    className: "px-3 py-3 text-right tabular-nums border-l border-slate-100 text-slate-700 font-semibold"
  }, num(lots.reduce((s,l)=>{ const rA=(l.returns||[]).reduce((r,x)=>r+(x.amount||0),0); return s+(l.qtyIn||0)*(l.costNcc||0)+(l.fee||0)-rA; },0))), /*#__PURE__*/React.createElement("td", {
    className: "px-3 py-3 text-right tabular-nums border-l border-slate-100 text-[#92400e] font-semibold"
  }, num(lots.reduce((s,l)=>{ const t=(l.qtyIn||0)*(l.costNcc||0)+(l.fee||0); return s+((l.paid!=null)?(l.paid||0):(l.pay==="Đã thanh toán"?t:0)); },0))), /*#__PURE__*/React.createElement("td", {
    className: "px-3 py-3 text-right tabular-nums border-l border-slate-100 text-[#B91C1C] font-semibold"
  }, num(lots.reduce((s,l)=>{ const rA=(l.returns||[]).reduce((r,x)=>r+(x.amount||0),0); const t=(l.qtyIn||0)*(l.costNcc||0)+(l.fee||0)-rA; const p=(l.paid!=null)?(l.paid||0):(l.pay==="Đã thanh toán"?(l.qtyIn||0)*(l.costNcc||0)+(l.fee||0):0); return s+t-p; },0))), /*#__PURE__*/React.createElement("td", null))), returnModal && /*#__PURE__*/React.createElement(NccReturnModal, {lot:returnModal.lot, prod:returnModal.prod, costNcc:returnModal.costNcc||0, onClose:()=>setReturnModal(null), onSave:ret=>doReturn(returnModal,ret)}))) : /*#__PURE__*/React.createElement(Empty, null, "Không có dữ liệu lô hàng chi tiết. Tổng dư nợ cuối kỳ: ", /*#__PURE__*/React.createElement("b", {
    className: "text-[#B91C1C]"
  }, num(sup.open)))));
}

