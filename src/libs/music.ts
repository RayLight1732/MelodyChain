import { DocumentSnapshot, collection, doc, getDoc, getDocs, where, limit as funcLimit, startAfter as funcStartAfter, QuerySnapshot, setDoc, DocumentData, query, orderBy } from "firebase/firestore";
import { auth, db, rdb, storage } from "./initialize";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import {
  DataSnapshot,
  Query,
  Unsubscribe,
  endBefore,
  equalTo,
  get,
  increment,
  limitToFirst,
  limitToLast,
  off,
  onValue,
  orderByChild,
  query as rdbQuery,
  ref as rdbRef,
  remove,
  serverTimestamp,
  set,
  update,
} from "firebase/database";
import { getProfileImageUrlById } from "./profile";

export class Music {
  id: string;
  name: string;
  thumbnailRef: string;
  authorIDs: Array<string>;
  musicRefs: Array<string>;
  createdDate: Date;

  constructor(id: string, name: string, thumbnailRef: string, authorIDs: Array<string>, musicRefs: Array<string>, createdDate: Date) {
    this.id = id;
    this.name = name;
    this.thumbnailRef = thumbnailRef;
    this.authorIDs = authorIDs;
    this.musicRefs = musicRefs;
    this.createdDate = createdDate;
  }

  static getInstance(snapshot: DocumentSnapshot) {
    const data = snapshot.data()!;
    return new Music(data.id, data.name, data.thumbnailRef, data.authorIDs, data.musicRefs, data.date.toDate());
  }
}

export async function getMusicDetail(musicId: string) {
  const snapshot = await getDoc(doc(db, "music", musicId));
  if (snapshot.exists()) {
    return Music.getInstance(snapshot);
  } else {
    return null;
  }
}

function querySnapshotToMusicList(snapshot: QuerySnapshot): {
  musicList: Array<Music>;
  last: DocumentSnapshot<DocumentData, DocumentData> | null;
} {
  const musicList: Array<Music> = [];
  const docs = snapshot.docs;
  console.log("docs");
  for (const snapshot of docs) {
    console.log("snapshot");
    musicList.push(Music.getInstance(snapshot));
  }
  console.log("end");
  return {
    musicList: musicList,
    last: docs.length == 0 ? null : docs[docs.length - 1]!,
  };
}

/**
 * 関与した楽曲を取得する
 * @param {string} [uid] uid
 * @returns ドキュメントの配列 @see {@link https://firebase.google.com/docs/firestore/query-data/get-data?hl=ja}
 */
export async function getInvolvedMusic(
  uid: string,
  startAfter: any = null,
  limit = 2
): Promise<{
  musicList: Array<Music>;
  last: DocumentSnapshot<DocumentData, DocumentData> | null;
}> {
  //即時関数
  const q = (function () {
    if (startAfter) {
      console.log("start after", Music.getInstance(startAfter));
      return query(collection(db, "music"), where("authorIDs", "array-contains", uid), orderBy("date", "desc"), funcStartAfter(startAfter), funcLimit(limit));
    } else {
      return query(collection(db, "music"), where("authorIDs", "array-contains", uid), orderBy("date", "desc"), funcLimit(limit));
    }
  })();

  const querySnapshot = await getDocs(q);
  return querySnapshotToMusicList(querySnapshot);
}

/**
 * 全ての楽曲の中からいくつかを取得する
 * @param {any} [startAfter] 指定したドキュメントの後から取得を開始する
 * @param {number} [limit=10] 取得する数
 * @returns スナップショット @see {@link https://firebase.google.com/docs/firestore/query-data/get-data?hl=ja}
 * for(const value of returnValue)で楽曲が取れる
 */
export async function getUploadedMusic(startAfter: any = null, limit = 10) {
  //即時関数
  const q = (function () {
    if (startAfter) {
      return query(collection(db, "music"), orderBy("date", "desc"), funcLimit(limit), funcStartAfter(startAfter));
    } else {
      return query(collection(db, "music"), orderBy("date", "desc"), funcLimit(limit));
    }
  })();

  return querySnapshotToMusicList(await getDocs(q));
}

/**
 * 楽曲のサムネイル用URLを取得する
 * @param {Music} music 楽曲
 * @returns {string} ダウンロード用URL
 */
export async function getThumbnailURL(music: Music) {
  return await getDownloadURL(ref(storage, music.thumbnailRef));
}

/**
 * パートのダウンロード用URLを取得する
 * @param {Music} music 楽曲
 * @returns {Array<URL>} ダウンロード用URLの配列
 */
export async function getMusicURLs(music: Music) {
  const urls = [];
  for (var i = 0; i < music.authorIDs.length; i++) {
    const url = await getMusicURL(music.authorIDs[i]!, music.musicRefs[i]!);
    urls.push(url);
  }
  return urls;
}

export async function getMusicURL(authorID: string, musicRef: string) {
  return await getDownloadURL(ref(storage, `users/${authorID}/music/${musicRef}`));
}

/**
 * 楽曲をアップロードする
 * @param {File} musicFile 担当パートの音楽
 * @param {string} [name] 楽曲の名前
 * @param {File} [thumbnail] サムネイル
 * @throws アップロードが失敗した場合エラー
 */
export async function uploadMusic(musicFile: Blob, name: string | null = null, thumbnail: Blob | null = null) {
  const result = await auth.currentUser!.getIdTokenResult(true);

  const promiseList: Array<Promise<any>> = [];
  if (name) {
    const promise = setDoc(doc(db, "music_names", auth.currentUser!.uid), {
      name: name,
      ref: result.claims.ref,
    });
    promiseList.push(promise);
  }

  if (thumbnail) {
    const thumbnailRef = ref(storage, `users/${auth.currentUser!.uid}/thumbnail/${result.claims.ref}`);
    const promise = uploadBytes(thumbnailRef, thumbnail);
    promiseList.push(promise);
  }

  const storageRef = ref(storage, `users/${auth.currentUser!.uid}/music/${result.claims.ref}`);
  const promise = uploadBytes(storageRef, musicFile);
  promiseList.push(promise);

  await Promise.allSettled(promiseList);
}

export async function getAuthorProfileURLs(music: Music) {
  const result = Array<string | null>(music.authorIDs.length);
  const promiseList: Array<Promise<string>> = [];
  music.authorIDs.forEach((value, index) => {
    const promise = getProfileImageUrlById(value).then((url) => (result[index] = url));
    promiseList.push(promise);
  });
  await Promise.allSettled(promiseList);
  return result;
}

function createMusicGoodFlagRef(music: Music, uid: string): string {
  return `music/${music.id}/${uid}/good/flag`;
}

function createMusicGoodCounterRef(music: Music): string {
  return `music/${music.id}/good_counter`;
}

function createMusicViewFlagRef(music: Music, uid: string): string {
  return `music/${music.id}/${uid}/view/flag`;
}

function createMusicViewCounterRef(music: Music): string {
  return `music/${music.id}/view_counter`;
}

function createUserSideGoodTimestampRef(music: Music, uid: string): string {
  return `${createUserSideGoodRef(uid)}/${music.id}/timestamp`;
}

function createUserSideGoodRef(uid: string): string {
  return `user/${uid}/good`;
}

export function subscribeGoodCounter(music: Music, onChange: (value: number) => void): () => void {
  const musicGoodCounterRef = rdbRef(rdb, createMusicGoodCounterRef(music));
  return onValue(
    musicGoodCounterRef,
    (snapshot) => {
      onChange(snapshot.val() ?? 0);
    },
    () => {
      console.log("error in good counter");
    }
  );
}

export function subscribeGoodCounterPressed(music: Music, uid: string, onChange: (value: boolean) => void): Unsubscribe {
  const flagRef = rdbRef(rdb, createMusicGoodFlagRef(music, uid));
  const callback = (snapshot: DataSnapshot) => {
    onChange(snapshot.val() ?? false);
  };
  return onValue(flagRef, callback, () => {
    console.log("error in good flag");
  });
}

interface Updates {
  [key: string]: any;
}

export function setGoodPressed(music: Music, uid: string, pressed: boolean) {
  const flagRef = createMusicGoodFlagRef(music, uid);
  const musicGoodCounterRef = createMusicGoodCounterRef(music);
  const userSideGoodTimestampRef = createUserSideGoodTimestampRef(music, uid);
  const updates: Updates = {};
  if (pressed) {
    updates[flagRef] = true;
    updates[musicGoodCounterRef] = increment(1);
    updates[userSideGoodTimestampRef] = serverTimestamp();
  } else {
    updates[flagRef] = null;
    updates[musicGoodCounterRef] = increment(-1);
    updates[userSideGoodTimestampRef] = null;
    console.log(userSideGoodTimestampRef);
  }

  update(rdbRef(rdb), updates);
}

export function subscribeViewedMusic(music: Music, uid: string, onChange: (viewed: boolean) => void): Unsubscribe {
  const flagRef = rdbRef(rdb, createMusicViewFlagRef(music, uid));
  const callback = (snapshot: DataSnapshot) => {
    onChange(snapshot.val() ?? false);
  };
  return onValue(flagRef, callback, () => {
    console.log("error in viewed music");
  });
}

export function subscribeViewCounter(music: Music, onChange: (count: number) => void): Unsubscribe {
  const counterRef = rdbRef(rdb, createMusicViewCounterRef(music));
  return onValue(
    counterRef,
    (snapshot) => {
      onChange(snapshot.val() ?? 0);
    },
    () => {
      console.log("error in view counter");
    }
  );
}

export function incrementViewCount(music: Music, uid: string) {
  const flagRef = createMusicViewFlagRef(music, uid);
  const musicViewCounterRef = createMusicViewCounterRef(music);
  const updates: Updates = {};
  updates[flagRef] = true;
  updates[musicViewCounterRef] = increment(1);

  update(rdbRef(rdb), updates);
}

export class GoodHistory {
  private _uid: string;
  private _date: Date;
  constructor(uid: string, date: Date) {
    this._uid = uid;
    this._date = date;
  }

  get uid() {
    return this._uid;
  }

  get date() {
    return this._date;
  }
}

/**
 * いいねの履歴を取得する
 * @param {string} uid 対象のUUID
 * @param {Date} [before] この日付よりも前のものを取得する
 * @param {number} [limit=10] 読み込む履歴の数
 * @returns {Promise<GoodHistory[]>}
 */
export async function getGoodHistory(uid: string, before?: Date, limit: number = 4): Promise<GoodHistory[]> {
  const musicRef = rdbRef(rdb, createUserSideGoodRef(uid));
  var q: Query;
  if (before) {
    q = rdbQuery(musicRef, orderByChild("timestamp"), endBefore(before.getTime()), limitToLast(limit));
  } else {
    q = rdbQuery(musicRef, orderByChild("timestamp"), limitToLast(limit));
  }
  const snapshot = await get(q);
  const result: GoodHistory[] = [];
  snapshot.forEach((child) => {
    result.push(new GoodHistory(child.key, new Date(child.child("timestamp").val())));
  });
  return result.reverse();
}
