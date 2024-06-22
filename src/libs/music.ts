import { DocumentSnapshot, collection, doc, getDoc, getDocs, orderBy, query, where, limit as funcLimit, startAfter as funcStartAfter, QuerySnapshot, setDoc, DocumentData } from "firebase/firestore";
import { auth, db, storage } from "./initialize";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { getProfileImageUrl, getProfileImageUrlById } from "./profile";

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
    return new Music(data.id, data.name, data.thumbnailRef, data.authorIDs, data.musicRefs, data.date);
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
  limit = 10,
  startAfter: any = null
): Promise<{
  musicList: Array<Music>;
  last: DocumentSnapshot<DocumentData, DocumentData> | null;
}> {
  //即時関数
  const q = (function () {
    if (startAfter) {
      return query(collection(db, "music"), where("authorIDs", "array-contains", uid), orderBy("date", "desc"), funcLimit(limit), funcStartAfter(startAfter));
    } else {
      return query(collection(db, "music"), where("authorIDs", "array-contains", uid), orderBy("date", "desc"), funcLimit(limit));
    }
  })();

  const querySnapshot = await getDocs(q);
  querySnapshot.forEach((mu) => {
    console.log(mu.data()?.name);
  });
  return querySnapshotToMusicList(querySnapshot);
}

/**
 * 全ての楽曲の中からいくつかを取得する
 * @param {number} [limit=10] 取得する数
 * @param {} [startAfter] 指定したドキュメントの後から取得を開始する
 * @returns スナップショット @see {@link https://firebase.google.com/docs/firestore/query-data/get-data?hl=ja}
 * for(const value of returnValue)で楽曲が取れる
 */
export async function getMusic(limit = 10, startAfter: any = null) {
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

/**
 * 割り当てられた楽曲を投稿済みかどうか
 */
export async function uploaded() {}
