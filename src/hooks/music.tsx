import { Music, getMusicURL, getThumbnailURL } from "@/libs/music";
import { DispatchedMusic } from "@/libs/profile";
import { useContext, useEffect, useState } from "react";
import useSWR, { SWRResponse } from "swr";

/**
 * 音楽のトラックのURLを取得するためのフック
 * @param authorID 作曲者のID
 * @param musicRef 楽曲の参照
 */
export function useTrackURL(authorID: string | undefined | null, musicRef: string | undefined | null) {
  const key = !authorID || !musicRef ? null : `${authorID}/${musicRef}`;
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
  return useSWR(music.id, async () => {
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
  return useSWR(music, async (arg) => {
    return await getThumbnailURL(arg);
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
