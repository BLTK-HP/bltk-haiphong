import { onDocumentCreated } from "firebase-functions/v2/firestore";
import { initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getMessaging } from "firebase-admin/messaging";

initializeApp();
const db = getFirestore();

const getAllTokens = async () => {
  const snap = await db.collection("users").get();
  const tokens = [];
  snap.docs.forEach(d => {
    const data = d.data();
    if (data.fcmToken) tokens.push(data.fcmToken);
    if (Array.isArray(data.fcmTokens)) tokens.push(...data.fcmTokens);
  });
  return [...new Set(tokens)].filter(Boolean);
};

const sendPush = async (title, body, tag) => {
  const tokens = await getAllTokens();
  if (!tokens.length) return;
  await getMessaging().sendEachForMulticast({
    notification: { title, body },
    data: { tag },
    tokens
  });
};

export const onNewOrder = onDocumentCreated(
  { document: "orders/{orderId}", region: "asia-southeast1" },
  async event => {
    const o = event.data?.data();
    if (!o) return;
    // Skip quotes (bao gia)
    if (o.isQuote || (o.id && o.id.startsWith("BG"))) return;
    const name = o.name || "Khach hang";
    const id = o.id || event.params.orderId;
    await sendPush("Don hang moi — BLTK", name + " (" + id + ")", "order-" + id);
  }
);

export const onNewPayment = onDocumentCreated(
  { document: "txns/{txnId}", region: "asia-southeast1" },
  async event => {
    const t = event.data?.data();
    if (!t) return;
    if (!["PhieuThu", "PhieuChi"].includes(t.kind)) return;
    const label = t.kind === "PhieuThu" ? "Phieu thu" : "Phieu chi";
    const who = t.from || t.to || "";
    const amt = t.amount ? Math.abs(t.amount).toLocaleString("vi-VN") + "d" : "";
    await sendPush(label + " moi — BLTK", [who, amt].filter(Boolean).join(" — "), "txn-" + (t.id || event.params.txnId));
  }
);
