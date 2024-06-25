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
import { DocumentSnapshot } from "firebase/firestore";
import { useCallback, useEffect, useRef, useState } from "react";
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
  //TODO　どうにかする
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
 * いいねをした楽曲の履歴
 */
interface GoodHistoryLoader {
  /**
   * いいねをした楽曲のidのリスト(降順)
   */
  history: string[];
  /**
   * 次をロードするための関数
   * @returns 次が存在するかどうか
   */
  loadNext: () => Promise<boolean>;
}

/**
 * 今までにいいねをした楽曲を取得する
 * @param {string} uid 対象のUUID
 * @returns {GoodHistoryLoader}
 */
export function useGoodHistory(uid: string): GoodHistoryLoader {
  const [goodHistory, setGoodHistory] = useState<GoodHistory[]>([]);
  const goodHistoryRef = useRef<GoodHistory[]>([]);
  const firstLoaded = useRef(false);
  goodHistoryRef.current = goodHistory;
  useEffect(() => {
    var ignore = false;
    getGoodHistory(uid)
      .then((value) => {
        if (!ignore) {
          setGoodHistory(goodHistory.concat(value));
          firstLoaded.current = true;
        }
      })
      .catch((e) => {
        console.error(e);
      });
    return () => {
      ignore = true;
    };
  }, []);
  const [result, setResult] = useState<string[]>([]);
  useEffect(() => {
    setResult(goodHistory.map((it) => it.uid));
  }, [goodHistory]);

  const loadNext = useCallback(async () => {
    if (firstLoaded.current) {
      console.log("current", goodHistoryRef.current);
      console.log("date", goodHistoryRef.current[goodHistoryRef.current.length - 1]?.date);
      const result = await getGoodHistory(uid, goodHistoryRef.current[goodHistoryRef.current.length - 1]?.date);
      setGoodHistory((it) => it.concat(result));
      return result.length !== 0;
    } else {
      return true;
    }
  }, []);

  return {
    history: result,
    loadNext: loadNext,
  };
}

/**
 * いままで関わった楽曲の履歴
 */
interface InvolvedMusicLoader {
  /**
   * いままで関わった楽曲の履歴のリスト(降順)
   */
  history: Music[];
  /**
   * 次をロードするための関数
   * @returns 次が存在するかどうか
   */
  loadNext: () => Promise<boolean>;
}

/**
 * いままで関わった楽曲を取得する
 * @param {string} uid 対象のUUID
 * @returns {InvolvedMusicLoader}
 */
export function useInvolvedMusic(uid: string): InvolvedMusicLoader {
  const [involvedMusic, setInvolvedMusic] = useState<Music[]>([]);
  const involvedMusicRef = useRef<Music[]>([]);
  const lastMusicRef = useRef<DocumentSnapshot | null>(null);
  involvedMusicRef.current = involvedMusic;
  const firstLoaded = useRef(false);
  useEffect(() => {
    var ignore = false;
    getInvolvedMusic(uid)
      .then((result) => {
        if (!ignore) {
          setInvolvedMusic(result.musicList);
          lastMusicRef.current = result.last;
          firstLoaded.current = true;
        }
      })
      .catch((e) => {
        console.error(e);
      });
    return () => {
      ignore = true;
    };
  }, []);

  const loadNext = useCallback(async () => {
    if (firstLoaded.current) {
      const result = await getInvolvedMusic(uid, lastMusicRef.current);
      console.log("result", result);
      setInvolvedMusic((it) => it.concat(result.musicList));
      lastMusicRef.current = result.last;
      return result.musicList.length !== 0;
    } else {
      return true;
    }
  }, []);

  return {
    history: involvedMusic,
    loadNext: loadNext,
  };
}

/**
 * 投稿された楽曲を取得する
 */
interface InvolvedMusicLoader {
  /**
   * 投稿された楽曲のリスト
   */
  history: Music[];
  /**
   * 次をロードするための関数
   * @returns 次が存在するかどうか
   */
  loadNext: () => Promise<boolean>;
}

export function useUploadedMusic() {
  const [involvedMusic, setInvolvedMusic] = useState<Music[]>([]);
  const involvedMusicRef = useRef<Music[]>([]);
  const lastMusicRef = useRef<DocumentSnapshot | null>(null);
  involvedMusicRef.current = involvedMusic;
  const firstLoaded = useRef(false);
  useEffect(() => {
    var ignore = false;
    getUploadedMusic()
      .then((result) => {
        if (!ignore) {
          setInvolvedMusic(result.musicList);
          lastMusicRef.current = result.last;
          firstLoaded.current = true;
        }
      })
      .catch((e) => {
        console.error(e);
      });
    return () => {
      ignore = true;
    };
  }, []);

  const loadNext = useCallback(async () => {
    if (firstLoaded.current) {
      const result = await getUploadedMusic(lastMusicRef.current);
      console.log("result", result);
      setInvolvedMusic((it) => it.concat(result.musicList));
      lastMusicRef.current = result.last;
      return result.musicList.length !== 0;
    } else {
      return true;
    }
  }, []);

  return {
    history: involvedMusic,
    loadNext: loadNext,
  };
}
