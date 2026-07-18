import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCi1bYtNOP3y2kOse252_bh2NgiVNZuaas",
  authDomain: "browser-88d26.firebaseapp.com",
  projectId: "browser-88d26",
  storageBucket: "browser-88d26.firebasestorage.app",
  messagingSenderId: "370721273975",
  appId: "1:370721273975:web:584877942c928f41676e72"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, "septt");
