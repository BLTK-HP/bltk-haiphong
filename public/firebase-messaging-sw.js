// Service Worker for Firebase Cloud Messaging background push notifications
// Uses Firebase compat v10 SDK (last version with compat on CDN)
importScripts('https://www.gstatic.com/firebasejs/10.12.5/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.5/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyDvEP0STMSxNaGapQcrCHpEYK_BJyRWNsY",
  authDomain: "bltk-haiphong.firebaseapp.com",
  projectId: "bltk-haiphong",
  storageBucket: "bltk-haiphong.firebasestorage.app",
  messagingSenderId: "504031112600",
  appId: "1:504031112600:web:c1f757f313f8d9ae550fed"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage(payload => {
  const title = payload.notification?.title || "BLTK Hai Phong";
  const body = payload.notification?.body || "";
  self.registration.showNotification(title, {
    body,
    icon: "/logo.png",
    badge: "/logo.png",
    tag: payload.data?.tag || "bltk-notification",
    data: payload.data
  });
});
