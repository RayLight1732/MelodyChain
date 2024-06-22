import {
  GoogleAuthProvider,
  Unsubscribe,
  signOut as fbSignOut,
  signInWithRedirect,
} from "firebase/auth";
import { auth, db } from "./initialize";
import {
  CollectionReference,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import { getToken } from "firebase/messaging";

const vapidKey =
  "BPsx8odGYwd3o7Crq-ekf29o9PoLn3SJ30fBgqS3Q76jkFjcptMseaAVIripyTmHo8yUQAc1Z2UxbgrlzRrEtRY";

function getUserTokenCollection(uid: string): CollectionReference {
  return collection(db, "users", uid, "token");
}

/**
 * 初期化が終わった際や、ログイン状態が更新された際に呼び出される
 * @param {} onAuthenticated ログインが完了している際に呼び出されるコールバック
 * @param {} onNotAuthenticated ログインが完了していない際に呼び出されるコールバック
 */
export function onAuthStateChanged(
  onAuthenticated: () => void,
  onNotAuthenticated: () => void
): Unsubscribe {
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
 * @throws サインアウトに失敗した場合、エラーが発生する
 */
export async function signOut() {
  const currentUser = auth.currentUser;
  if (currentUser) {
    const promise1 = fbSignOut(auth);
    /*
    const token = await getToken(messaging, {
      vapidKey: vapidKey,
    });*/
    const token = null;
    if (token) {
      const promise2 = deleteDoc(
        doc(getUserTokenCollection(currentUser.uid), token)
      );
      await Promise.allSettled([promise1, promise2]);
    }
  }
}

/**
 * トークンを登録する
 */
export async function registerToken() {
  const currentUser = auth.currentUser;
  if (currentUser) {
    console.log("registor token");
    /*
    const token = await getToken(messaging, {
      vapidKey: vapidKey,
    });*/
    const token = null;
    if (token) {
      setDoc(doc(getUserTokenCollection(currentUser.uid), token), {
        token: token,
        timestamp: serverTimestamp(),
      });
    } else {
      //Show permission request
    }
  }
}

const provider = new GoogleAuthProvider();
provider.setCustomParameters({
  prompt: "select_account",
});

export function loginWithGoogle() {
  console.log("login");
  signInWithRedirect(auth, provider);
}
