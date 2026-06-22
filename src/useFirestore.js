import { useState, useEffect } from "react";
import { db } from "./firebase";
import {
  collection, doc, setDoc, deleteDoc,
  onSnapshot, writeBatch
} from "firebase/firestore";

// Hook đọc realtime 1 collection, trả về [items, loaded]
export function useCollection(colName, fallback = []) {
  const [items, setItems] = useState(fallback);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, colName), snap => {
      const data = snap.docs.map(d => d.data());
      setItems(data);
      setLoaded(true);
    }, err => { console.error(colName, err); setLoaded(true); });
    return unsub;
  }, [colName]);

  return [items, loaded];
}

// Lưu 1 document (tạo mới hoặc ghi đè theo id)
export async function saveDoc(colName, id, data) {
  const clean = JSON.parse(JSON.stringify(data)); // loại bỏ undefined
  await setDoc(doc(db, colName, String(id)), clean);
}

// Xóa 1 document
export async function deleteDocument(colName, id) {
  await deleteDoc(doc(db, colName, String(id)));
}

// Ghi hàng loạt (dùng để seed dữ liệu lần đầu)
export async function batchSave(colName, items, getId) {
  const CHUNK = 500;
  for (let i = 0; i < items.length; i += CHUNK) {
    const batch = writeBatch(db);
    items.slice(i, i + CHUNK).forEach(item => {
      const id = String(getId(item));
      batch.set(doc(db, colName, id), JSON.parse(JSON.stringify(item)));
    });
    await batch.commit();
  }
}
