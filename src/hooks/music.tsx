import { useMyUid } from "@/components/profile";
import {
  GoodHistory,
  Music,
  getGoodHistory,
  getInvolvedMusic,
  getUploadedMusic,
  getMusicDetail,
  getMusicURL,
  getThumbnailURL,
  incrementViewCount,
  setGoodPressed,
  subscribeGoodCounter,
  subscribeGoodCounterPressed,
  subscribeViewCounter,
  subscribeViewedMusic,
} from "@/libs/music";
import { DispatchedMusic } from "@/libs/profile";
import { DocumentData, DocumentSnapshot } from "firebase/firestore";
import { ReactNode, RefObject, createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import useSWR, { SWRResponse } from "swr";

/**
 * 楽曲の詳細を取得する
 * @param id 楽曲のid
 * @returns {SWRResponse<Music|null,any,any>}
 */
export function useMusicDetail(id: string) {
  return useSWR(id + "/detail", async () => await getMusicDetail(id));
}

/**
 * 音楽のトラックのURLを取得するためのフック
 * @param authorID 作曲者のID
 * @param musicRef 楽曲の参照
 */
export function useTrackURL(authorID: string | undefined | null, musicRef: string | undefined | null) {
  const key = authorID && musicRef ? `${authorID}/${musicRef}` : null;
  return useSWR(key, (arg: string) => {
    const [authorID, musicRef] = arg.split("/");
    return getMusicURL(authorID!, musicRef!);
  });
}

/**
 * 複数の音楽のトラックのURLをまとめて取得するためのフック
 * @param authorIDs 作曲者のIDの配列　長さ4まで
 * @param musicRefs 楽曲の参照の配列  長さ4まで
 * @returns 取得した結果
 */
export function useMultipleTrackURLs(authorIDs: Array<string>, musicRefs: Array<string>): { data: Array<string | undefined>; isLoading: boolean; error: any } {
  const [result, setResult] = useState({ data: new Array<string | undefined>(4), error: new Array<any>(4) });
  var isLoading = false;
  const tmpData = new Array<string | undefined>();
  const tmpErrors = new Array<any>();

  var tmpLoading = false;
  tmpLoading = useTrackURLInitializer(authorIDs[0], musicRefs[0], tmpData, tmpErrors);
  isLoading ||= tmpLoading;
  tmpLoading = useTrackURLInitializer(authorIDs[1], musicRefs[1], tmpData, tmpErrors);
  isLoading ||= tmpLoading;
  tmpLoading = useTrackURLInitializer(authorIDs[2], musicRefs[2], tmpData, tmpErrors);
  isLoading ||= tmpLoading;
  tmpLoading = useTrackURLInitializer(authorIDs[3], musicRefs[3], tmpData, tmpErrors);
  isLoading ||= tmpLoading;

  useEffect(() => {
    setResult({ data: [...tmpData], error: [...tmpErrors] });
  }, [...tmpData, ...tmpErrors]);
  return { data: result.data, isLoading: isLoading, error: result.data };
}

function useTrackURLInitializer(authorID: string | undefined, musicRef: string | undefined, dataList: Array<string | undefined>, errorList: Array<any>) {
  const { data, isLoading, error } = useTrackURL(authorID, musicRef);
  dataList.push(data);
  errorList.push(error);
  return isLoading;
}

/**
 * 音楽のトラックのURLをすべて取得するためのフック
 * @param music 音楽
 * @returns 音楽のトラックのURL
 */
export function useTrackURLs(music: Music): SWRResponse<Array<string>> {
  return useSWR(music.id + "/track", async () => {
    const promiseList = [];
    for (var i = 0; i < music.authorIDs.length; i++) {
      promiseList.push(getMusicURL(music.authorIDs[i]!, music.musicRefs[i]!));
    }
    return await Promise.all(promiseList);
  });
}

/**
 * 音楽のサムネイルを取得するためのフック
 * @param music 音楽
 * @returns サムネイルのURL
 */
export function useThumbnailURL(music: Music | null | undefined) {
  return useSWR(music ? music.id + "/thumbnail" : null, async (arg) => {
    return await getThumbnailURL(music!);
  });
}

export function useUploadedMusicExists(dispatched: DispatchedMusic): [boolean, boolean] {
  const [loading, setLoading] = useState(true);
  const [exists, setExists] = useState(false);
  useEffect(() => {
    var ignore = false;
    if (dispatched) {
      setLoading(true);
      const func = async () => {
        if (!ignore) {
          setLoading(false);
        }
      };
      func();
    }
    return () => {
      ignore = true;
      setLoading(false);
      setExists(false);
    };
  }, [dispatched]);
  return [loading, exists];
}

interface GoodCounter {
  count: number;
  isPressed: boolean;
  setPressed: (pressed: boolean) => void;
}

export function useGoodCounter(music: Music): GoodCounter {
  const uid = useMyUid();
  const [count, setCount] = useState(0);
  const [isPressed, setPressed] = useState(false);
  useEffect(() => {
    const unsubscriber1 = subscribeGoodCounter(music, setCount);
    const unsubscriber2 = subscribeGoodCounterPressed(music, uid, (isPressed) => {
      setPressed(isPressed);
    });
    return () => {
      unsubscriber1();
      unsubscriber2();
    };
  }, [music]);
  const setGoodPressed_ = useCallback(
    (pressed: boolean) => {
      setGoodPressed(music, uid, pressed);
    },
    [music]
  );

  return { count: count, isPressed: isPressed, setPressed: setGoodPressed_ };
}

export function useViewCounter(music: Music, inclement: boolean): number {
  const uid = useMyUid();

  const [count, setCount] = useState(0);
  useEffect(() => {
    const unsubscriber1 = subscribeViewedMusic(music, uid, (viewed) => {
      console.log(viewed);
      if (!viewed && inclement) {
        incrementViewCount(music, uid);
      }
    });
    const unsubscriber2 = subscribeViewCounter(music, setCount);
    return () => {
      unsubscriber1();
      unsubscriber2();
    };
  }, [music, inclement]);
  return count;
}

/**
 * いままで関わった楽曲の履歴
 */
interface Loader<T, U> {
  /**
   * いままで関わった楽曲の履歴のリスト(降順)
   */
  history: T[];
  /**
   * 次をロードするための関数
   * @returns 次が存在するかどうか
   */
  loadNext: () => Promise<boolean>;

  reload: () => Promise<void>;
  /**
   * 読み込まれたものの最後
   */
  last: U | null;
}

interface LoaderCache<T, U> {
  history: T[];
  last: U | null;
}

/**
 * T:返り値の型
 * U:lastの型
 * @param load U型の引数以降のT型のリストを取得する。
 * @param loaderCache キャッシュ
 * @returns
 */
function useLoader<T, U>(load: (last?: U | null) => Promise<{ newLoaded: T[]; last: U | null | undefined }>, loaderCache?: LoaderCache<T, U> | null): Loader<T, U> {
  const [loaded, setLoaded] = useState<T[]>(loaderCache?.history ?? []);
  const lastRef = useRef<U | null>(loaderCache?.last ?? null);
  const loadID = useRef(0);
  const isLoading = useRef(false);
  //ロード中の場合loadNextは呼び出されない
  //リロードされた場合、その結果が優先される
  const loadNext = useCallback(async () => {
    console.log("loadNext");
    if (!isLoading.current) {
      const newID = ++loadID.current;
      isLoading.current = true;
      const result = await load(lastRef.current);
      if (newID == loadID.current) {
        if (result.newLoaded.length > 0) {
          setLoaded((it) => it.concat(result.newLoaded));
          lastRef.current = result.last ?? null;
        }
        isLoading.current = false;
      }
      return result.newLoaded.length !== 0;
    } else {
      return true;
    }
  }, []);
  const reload = useCallback(async () => {
    lastRef.current = null;
    isLoading.current = false;
    loadNext();
  }, []);
  return {
    history: loaded,
    loadNext: loadNext,
    reload: reload,
    last: lastRef.current,
  };
}

class LoaderCacheMap {
  private cacheMap: { [key: string]: LoaderCache<any, any> } = {};

  get<T, U>(id: string): LoaderCache<T, U> | undefined {
    return this.cacheMap[id];
  }

  set(id: string, cache: LoaderCache<any, any>) {
    this.cacheMap[id] = cache;
  }
}

const musicCacheMapContext = createContext<LoaderCacheMap>(new LoaderCacheMap());

export function MusicCacheMapContextProvider({ children }: { children: ReactNode }) {
  const ref = useRef(new LoaderCacheMap());
  return <musicCacheMapContext.Provider value={ref.current}>{children}</musicCacheMapContext.Provider>;
}

/**
 * 今までにいいねをした楽曲を取得する
 * @param {string} uid 対象のUUID
 * @returns {Loader<string, Date>} いいねをした楽曲のUUID
 */
export function useGoodHistory(uid: string): Loader<string, Date> {
  const musicCacheMap = useContext(musicCacheMapContext);
  const musicLoader = useLoader<string, Date>(async (last) => {
    const result = await getGoodHistory(uid, last);
    return {
      newLoaded: result.map((it) => it.uid),
      last: result[result.length - 1]?.date,
    };
  }, musicCacheMap.get("good/" + uid));
  musicCacheMap.set("good/" + uid, { history: musicLoader.history, last: musicLoader.last });
  return musicLoader;
}

/**
 * いままで関わった楽曲を取得する
 * @param {string} uid 対象のUUID
 * @returns {Loader<Music, DocumentSnapshot<DocumentData, DocumentData> | null>}
 */
export function useInvolvedMusic(uid: string): Loader<Music, DocumentSnapshot<DocumentData, DocumentData> | null> {
  const musicCacheMap = useContext(musicCacheMapContext);
  const musicLoader = useLoader<Music, DocumentSnapshot<DocumentData, DocumentData>>(async (last) => await getInvolvedMusic(uid, last), musicCacheMap.get("involved/" + uid));
  musicCacheMap.set("involved/" + uid, { history: musicLoader.history, last: musicLoader.last });
  return musicLoader;
}

/**
 * 投稿された曲を取得する
 * @returns {Loader<Music, DocumentSnapshot<DocumentData, DocumentData> | null>}
 */
export function useUploadedMusic(): Loader<Music, DocumentSnapshot<DocumentData, DocumentData> | null> {
  const musicCacheMap = useContext(musicCacheMapContext);
  const musicLoader = useLoader(getUploadedMusic, musicCacheMap.get("uploaded"));
  musicCacheMap.set("uploaded", { history: musicLoader.history, last: musicLoader.last });
  return musicLoader;
}
