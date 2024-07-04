import { GoogleAuthProvider, Unsubscribe, signOut as fbSignOut, signInWithPopup, signInWithRedirect } from "firebase/auth";
import { auth, db } from "./initialize";
import { CollectionReference, collection, deleteDoc, doc, onSnapshot, serverTimestamp, setDoc } from "firebase/firestore";
import { getToken } from "firebase/messaging";
import { getFCMToken, unregisterToken } from "./messaging";

const vapidKey = "BPsx8odGYwd3o7Crq-ekf29o9PoLn3SJ30fBgqS3Q76jkFjcptMseaAVIripyTmHo8yUQAc1Z2UxbgrlzRrEtRY";

function getUserTokenCollection(uid: string): CollectionReference {
  return collection(db, "users", uid, "token");
}

/**
 * 初期化が終わった際や、ログイン状態が更新された際に呼び出される
 * @param {} onAuthenticated ログインが完了している際に呼び出されるコールバック
 * @param {} onNotAuthenticated ログインが完了していない際に呼び出されるコールバック
 */
export function onAuthStateChanged(onAuthenticated: () => void, onNotAuthenticated: () => void): Unsubscribe {
  return auth.onAuthStateChanged((user) => {
    if (!user) {
      onNotAuthenticated();
    } else {
      onAuthenticated();
    }
  });
}

/**
 * サインアウトを行う
 * @returns サインアウトが正常に行われたかどうか
 */
export async function signOut(): Promise<boolean> {
  const currentUser = auth.currentUser;
  try {
    if (currentUser) {
      const token = await getFCMToken();
      const promises = [];
      promises.push(fbSignOut(auth));
      if (token) {
        promises.push(unregisterToken(token));
      }
      await Promise.allSettled(promises);
      return true;
    } else {
      return false;
    }
  } catch (e) {
    console.error(e);
    return false;
  }
}

const provider = new GoogleAuthProvider();
provider.setCustomParameters({
  prompt: "select_account",
});

export function loginWithGoogle() {
  console.log("login");
  if (process.env.NODE_ENV == "development") {
    signInWithPopup(auth, provider);
  } else {
    signInWithRedirect(auth, provider);
  }
}
