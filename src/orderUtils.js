import { collection, getDocs, query, where, writeBatch } from 'firebase/firestore';
import { db } from './firebase.js';
import { deleteDocument } from './useFirestore.js';

export async function deleteOrderCascade(orderId) {
  await deleteDocument("orders", orderId);
  const whInSnap = await getDocs(query(collection(db, "wh_in"), where("order", "==", orderId)));
  const batch = writeBatch(db);
  whInSnap.forEach(d => batch.delete(d.ref));
  const txnSnap = await getDocs(query(collection(db, "txns"), where("orderId", "==", orderId)));
  txnSnap.forEach(d => {
    const k = d.data().kind;
    if (k === "PhieuThu" || k === "PhieuChi") batch.delete(d.ref);
  });
  await batch.commit();
}
