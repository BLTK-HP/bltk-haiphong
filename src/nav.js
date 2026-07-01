import { Wallet, ShoppingCart, Truck, Warehouse, BookText, Users, LayoutDashboard, BarChart3, Settings } from 'lucide-react';

export const NAV = [
  { key: "finance",  label: "Tài chính",          icon: Wallet },
  { key: "sales",    label: "Bán hàng",            icon: ShoppingCart,
    children: [
      { key: "sales_draft",   label: "Báo giá" },
      { key: "sales_orders",  label: "Danh sách đơn hàng" },
      { key: "contracts",     label: "Hợp đồng" },
    ]
  },
  { key: "purchase", label: "Mua hàng",            icon: Truck },
  { key: "wh",       label: "Quản lý kho",         icon: Warehouse,
    children: [
      { key: "wh_in",    label: "Danh sách phiếu nhập kho" },
      { key: "wh_out",   label: "Danh sách phiếu xuất kho" },
      { key: "wh_stock", label: "Tồn kho" },
    ]
  },
  { key: "debt",     label: "Sổ công nợ",          icon: BookText,
    children: [
      { key: "debt_cust", label: "Công nợ khách hàng" },
      { key: "debt_ncc",  label: "Công nợ nhà cung cấp" },
    ]
  },
  { key: "pc",       label: "Sản phẩm, KH, NCC",  icon: Users,
    children: [
      { key: "pc_products",  label: "Danh sách sản phẩm" },
      { key: "pc_customers", label: "Danh sách khách hàng" },
      { key: "pc_suppliers", label: "Danh sách nhà cung cấp" },
    ]
  },
  { key: "dashboard", label: "Tổng quan",          icon: LayoutDashboard },
  { key: "reports",   label: "Báo cáo",            icon: BarChart3,
    children: [
      { key: "rp_sales",    label: "Báo cáo bán hàng" },
      { key: "rp_preorder", label: "Báo cáo sản phẩm đặt hàng" },
      { key: "rp_staff",    label: "Báo cáo nhân viên" },
    ]
  },
  { key: "settings", label: "Cài đặt",             icon: Settings,
    children: [
      { key: "settings_payment",        label: "Cài đặt thanh toán" },
      { key: "settings_numformat",      label: "Định dạng số" },
      { key: "settings_print",          label: "Cấu hình mẫu in" },
      { key: "settings_docnum",         label: "Quy tắc đánh số chứng từ" },
      { key: "settings_supplier_costs", label: "Bảng giá vốn sản phẩm" },
      { key: "settings_txn_kinds",      label: "Loại giao dịch Thu/Chi" },
      { key: "admin_clear",             label: "Xóa dữ liệu test" },
      { key: "users",                   label: "Quản lý nhân viên" },
    ]
  },
];
