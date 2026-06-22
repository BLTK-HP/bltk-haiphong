import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDvEP0STMSxNaGapQcrCHpEYK_BJyRWNsY",
  authDomain: "bltk-haiphong.firebaseapp.com",
  projectId: "bltk-haiphong",
  storageBucket: "bltk-haiphong.firebasestorage.app",
  messagingSenderId: "504031112600",
  appId: "1:504031112600:web:c1f757f313f8d9ae550fed"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
