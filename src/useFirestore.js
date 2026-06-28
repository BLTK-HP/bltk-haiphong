import { useState, useEffect } from "react";
import { db } from "./firebase";
import {
  collection, doc, setDoc, deleteDoc,
  onSnapshot, writeBatch, query
} from "firebase/firestore";

// Trích year từ date string "DD/MM/YYYY ..." hoặc "YYYY-MM-DD"
function extractYear(dateStr) {
  if (!dateStr) return null;
  const s = String(dateStr);
  // format "DD/MM/YYYY" hoặc "DD/MM/YYYY HH:MM:SS"
  const m = s.match(/(\d{2})\/(\d{2})\/(\d{4})/);
  if (m) return parseInt(m[3], 10);
  // format "YYYY-MM-DD"
  const m2 = s.match(/^(\d{4})-/);
  if (m2) return parseInt(m2[1], 10);
  return null;
}

// Hook đọc realtime 1 collection, trả về [items, loaded, error]
// constraints: mảng Firestore QueryConstraint, vd: [where("year","==",2026)]
export function useCollection(colName, fallback = [], constraints = []) {
  const [items, setItems] = useState(fallback);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(null);

  // serialize constraints thành key để useEffect detect thay đổi
  const constraintKey = constraints.map(c => JSON.stringify(c)).join("|");

  useEffect(() => {
    const ref = constraints.length
      ? query(collection(db, colName), ...constraints)
      : collection(db, colName);
    const unsub = onSnapshot(ref, snap => {
      const data = snap.docs.map(d => ({ _id: d.id, ...d.data() }));
      setItems(data);
      setLoaded(true);
      setError(null);
    }, err => {
      console.error(colName, err);
      setError(err.message || err.code || "Lỗi kết nối Firestore");
      setLoaded(true);
    });
    return unsub;
  }, [colName, constraintKey]);

  return [items, loaded, error];
}

// Lưu 1 document — tự động thêm field year nếu document có date
export async function saveDoc(colName, id, data) {
  const clean = JSON.parse(JSON.stringify(data));
  if (clean.date && !clean.year) {
    const y = extractYear(clean.date);
    if (y) clean.year = y;
  }
  await setDoc(doc(db, colName, String(id)), clean);
}

// Xóa 1 document
export async function deleteDocument(colName, id) {
  await deleteDoc(doc(db, colName, String(id)));
}

// Ghi hàng loạt
export async function batchSave(colName, items, getId) {
  const CHUNK = 500;
  for (let i = 0; i < items.length; i += CHUNK) {
    const batch = writeBatch(db);
    items.slice(i, i + CHUNK).forEach(item => {
      const clean = JSON.parse(JSON.stringify(item));
      if (clean.date && !clean.year) {
        const y = extractYear(clean.date);
        if (y) clean.year = y;
      }
      const id = String(getId(clean));
      batch.set(doc(db, colName, id), clean);
    });
    await batch.commit();
  }
}
