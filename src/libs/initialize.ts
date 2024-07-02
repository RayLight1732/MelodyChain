import { getApps, getApp, initializeApp, FirebaseApp } from "firebase/app";
import { doc, getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";
import { getDatabase } from "firebase/database";
import { Messaging, getMessaging } from "firebase/messaging";

const firebaseConfig = {
  apiKey: "AIzaSyCJMFqxaQixVdqcDa4hUDW26RrVz3_Meow",
  authDomain: "melody-chain.firebaseapp.com",
  projectId: "melody-chain",
  storageBucket: "melody-chain.appspot.com",
  messagingSenderId: "826270602514",
  appId: "1:826270602514:web:f54ce41f6ab7538fe08fcb",
  databaseURL: "https://melody-chain-default-rtdb.firebaseio.com",
};

export const firebaseApp: FirebaseApp = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export function isNotificationGranted(): boolean {
  return Notification.permission === "granted";
}

export function isNotificationAsked(): boolean {
  return Notification.permission !== "default";
}

export const db = getFirestore(firebaseApp);
export const auth = getAuth();
export const storage = getStorage(firebaseApp);
export const rdb = getDatabase(firebaseApp);
//export const messaging = getMessaging(firebaseApp);
let messaging: Messaging;
if (typeof window !== "undefined") {
  messaging = getMessaging(firebaseApp);
}
export { messaging };
