/*import { getMessaging, onBackgroundMessage } from "firebase/messaging/sw";
import { firebaseApp } from "./initialize";

console.log("service worker");

onBackgroundMessage(getMessaging(firebaseApp), (payload) => {
  console.log("[firebase-messaging-sw.js] Received background message ", payload);
  self.registration.showNotification("Title", { body: "Test body" });
});*/

import { getToken } from "firebase/messaging";
import { auth, db, messaging, rdb } from "./initialize";
import { get, ref as rdbRef } from "firebase/database";
import { deleteField, doc, serverTimestamp, setDoc, updateDoc } from "firebase/firestore";
async function getVapidKey(): Promise<string> {
  const snapshot = await get(rdbRef(rdb, "vapidKey"));
  return snapshot.val();
}

/**
 * トークンを取得する。事前にパーミッションのチェックが必要
 * @returns メッセージング用のトークン
 */
export async function getFCMToken(): Promise<string | null> {
  try {
    const vapidKey = await getVapidKey();
    return await getToken(messaging, { vapidKey: vapidKey });
  } catch (e) {
    return null;
  }
}

function getTokenDoc(uid: string) {
  return doc(db, "tokens", uid);
}

export function registerToken(token: string): Promise<void> {
  console.log("register token", token);
  return setDoc(
    getTokenDoc(auth.currentUser!.uid),
    {
      [token]: {
        token: token,
        tokentimeStamp: serverTimestamp(),
      },
    },
    { merge: true }
  );
}

export function unregisterToken(token: string): Promise<void> {
  return updateDoc(getTokenDoc(auth.currentUser!.uid), token, deleteField());
}
