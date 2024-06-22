import { DocumentSnapshot, FirestoreError, doc, getDoc, onSnapshot, serverTimestamp, setDoc, updateDoc } from "firebase/firestore";
import { auth, db, storage } from "./initialize";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { FetchResult, FetchStatus as FetchStatue } from "./utils";
import useSWR from "swr";

export class DispatchedMusic {
  private part: number;
  private authorIds: Array<string>;
  private previousRefs: Array<string>;
  private dataRef: string; //アップロード先
  private tempo: number;
  private limit: Date;

  constructor(data: any) {
    this.part = data.part;
    this.authorIds = data.authorIDs;
    this.previousRefs = data.previousRefs;
    this.dataRef = data.dataRef;
    this.tempo = data.tempo;
    this.limit = new Date(data.limit.seconds * 1000);
  }

  getPart = () => this.part;

  getAuthorIds = () => this.authorIds;

  getPreviousRefs = () => this.previousRefs;

  getDataRef = () => this.dataRef;
  getTempo = () => this.tempo;

  getLimit = () => this.limit;
}

export class Profile {
  name: string;
  private uid: string;
  favorite: string;
  part: Array<number>;
  private dispatchedMusic: DispatchedMusic | null;

  constructor(uid: string, name: string, favorite: string, part: Array<number>, date: Date, dispatchedMusic: DispatchedMusic | null) {
    this.uid = uid;
    this.name = name;
    this.favorite = favorite;
    this.part = part;
    this.dispatchedMusic = dispatchedMusic;
  }

  getUid = () => this.uid;

  getDispatchedMusic = () => this.dispatchedMusic;

  static getInstance(snapshot: DocumentSnapshot) {
    const data = snapshot.data();
    if (data) {
      let dispatchedMusic: DispatchedMusic | null = null;
      if (data.dispatch) {
        console.log("dispatch", data.dispatch);
        if (data.dispatch.state == "dispatched") {
          dispatchedMusic = new DispatchedMusic(data.dispatch);
        }
      }
      return new Profile(data.uid, data.name, data.favorite, data.part, data.date, dispatchedMusic);
    } else {
      return null;
    }
  }
}

/**
 * プロフィール画像の参照を取得する
 * @param {string} [uid=ログインしているユーザーのuid] 対象のuid
 * @returns プロフィール画像の参照
 */
function getProfileImageRef(uid: string) {
  return ref(storage, "users/" + uid + "/profile");
}

function getHeaderImageRef(uid: string) {
  return ref(storage, "users/" + uid + "/header");
}

/**
 *
 * @param {Profile} [profile] プロフィール
 * @returns {URL} プロフィール画像のURL
 * @throws データが取得できなかった時エラー
 */
export async function getProfileImageUrl(profile: Profile) {
  return getProfileImageUrlById(profile.getUid());
}

export async function getProfileImageUrlById(uid: string) {
  return await getDownloadURL(getProfileImageRef(uid));
}

export async function getHeaderImageUrl(profile: Profile) {
  return await getDownloadURL(getHeaderImageRef(profile.getUid()));
}

export async function getHeaderImageUrlById(uid: string) {
  return await getDownloadURL(getHeaderImageRef(uid));
}

/**
 * プロフィールをアップロードする
 * @param {Profile} profile プロフィール
 * @returns アップロードが成功した場合true,そうでないならfalse
 */
export async function uploadProfile(name: string, favorite: string, part: number[]) {
  //ユーザーデータのアップロード
  if (await isExists()) {
    await updateDoc(doc(db, "users", auth.currentUser!.uid), {
      name: name,
      favorite: favorite,
      part: part,
    });
  } else {
    await setDoc(doc(db, "users", auth.currentUser!.uid), {
      uid: auth.currentUser!.uid,
      name: name,
      favorite: favorite,
      part: part,
      dispatch: {
        state: "init",
        limit: serverTimestamp(),
      },
    });
  }
}

export async function uploadProfieImage(uid: string, data: Blob | Uint8Array | ArrayBuffer) {
  uploadBytes(getProfileImageRef(uid), data);
}

export async function uploadHeaderImage(uid: string, data: Blob | Uint8Array | ArrayBuffer) {
  uploadBytes(getHeaderImageRef(uid), data);
}

/**
 * プロフィールを取得する
 * @param {string}[uid=ログインしているユーザー] 対象のuid
 * @returns プロフィール returnValue.data().[name/favorite/part]でそれぞれの値を取得することができる
 */
export async function getProfile(uid: string) {
  const snapshot = await getDoc(doc(db, "users", uid));
  if (snapshot.exists()) {
    return Profile.getInstance(snapshot);
  } else {
    return null;
  }
}

export async function isExists() {
  return (await getDoc(doc(db, "users", auth.currentUser!.uid))).exists();
}

interface ResultObserver {
  uid: string;
  listener: (result: FetchResult<Profile>) => void;
}

export function onProfileUpdated(uid: string, observer: (profile: Profile | null) => void, error?: (error: FirestoreError) => void) {
  return onSnapshot(
    doc(db, "users", uid),
    (snapshot) => {
      observer(Profile.getInstance(snapshot));
    },
    (error_) => {
      if (error) {
        error(error_);
      }
    }
  );
}

export function useProfile(uid: string) {
  return useSWR(`user/${uid}/profile`, async (arg: string) => {
    return await getProfile(uid);
  });
}

export function useProfileImage(profile: Profile) {
  return useSWR(`user/${profile.getUid()}/profile/image`, async (arg: string) => {
    return await getProfileImageUrlById(profile.getUid());
  });
}

export function useHeaderImage(profile: Profile) {
  return useSWR(`user/${profile.getUid()}/profile/header`, async (arg: string) => {
    return await getHeaderImageUrlById(profile.getUid());
  });
}
