import React, { useState, useEffect, createContext, useContext } from "react";
import { auth, db } from "./firebase";
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";

// role: "manager" | "sales" | "warehouse"
export const ROLES = {
  manager:   { label: "Quản lý / Kế toán", color: "bg-[#fef9f0] text-[#92400e] ring-1 ring-[#b45309]" },
  sales:     { label: "Nhân viên bán hàng", color: "bg-[#ffedd5] text-[#c2410c] ring-1 ring-[#fdba74]" },
  warehouse: { label: "Nhân viên kho",      color: "bg-amber-50 text-amber-700 ring-1 ring-amber-200" },
};

// Màn hình nào role nào được xem
export const ALLOWED = {
  manager:   ["sales_orders","sales_draft","sales_create","purchase","wh_in","wh_out","wh_stock","products","customers","finance","report","settings","settings_payment","settings_numformat","settings_docnum","users","dashboard","rp_sales","rp_preorder","rp_staff"],
  sales:     ["sales_orders","sales_draft","sales_create","products","customers","dashboard"],
  warehouse: ["wh_in","wh_out","wh_stock","purchase","products","customers","dashboard"],
};

export const AuthCtx = createContext(null);
export const useAuth = () => useContext(AuthCtx);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(undefined); // undefined = đang load
  const [profile, setProfile] = useState(null); // {name, role, email}

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async fbUser => {
      if (fbUser) {
        const snap = await getDoc(doc(db, "users", fbUser.uid));
        setProfile(snap.exists() ? snap.data() : { role: "sales", name: fbUser.email });
        setUser(fbUser);
      } else {
        setUser(null);
        setProfile(null);
      }
    });
    return unsub;
  }, []);

  const login = (email, password) =>
    signInWithEmailAndPassword(auth, email, password);

  const logout = () => signOut(auth);

  const canSee = screen => {
    if (!profile) return false;
    return (ALLOWED[profile.role] || []).includes(screen);
  };

  return React.createElement(AuthCtx.Provider,
    { value: { user, profile, login, logout, canSee } },
    children
  );
}

// Tạo user mới (chỉ manager dùng)
export async function createUserProfile(uid, data) {
  await setDoc(doc(db, "users", uid), data);
}
