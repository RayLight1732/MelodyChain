import { FetchResult, FetchStatus, indexToPartName } from "@/libs/utils";
import { useMyProfile } from "./profile";
import { DispatchedMusic } from "@/libs/profile";
import { useMultipleTrackURLs } from "@/hooks/music";
import { useEffect, useState } from "react";
import { useAudioManager } from "@/hooks/audioManager";
import { AllPlayTrackPlayer, MultipleTrackPlayer } from "./music";

export function useDispatchedMusic() {
  const [profile] = useMyProfile();
  return new FetchResult(profile.getState(), profile.getContent()?.getDispatchedMusic());
}

/**
 * まだ完成していない音楽用のプレイヤー
 */
export function WIPMusicPlayer({ id, authorIDs, musicRefs, newMusicFile, newPart }: { id: string; authorIDs: string[]; musicRefs: string[]; newMusicFile?: Blob | null; newPart: number }) {
  const { data: urls } = useMultipleTrackURLs(authorIDs, musicRefs);
  const [newMusicURL, setNewMusicURL] = useState<string | null | undefined>();
  const [urlsWithNew, setUrlsWithNew] = useState<Array<string | null | undefined>>();
  const size = authorIDs.length + (newMusicURL ? 1 : 0);
  useEffect(() => {
    if (newMusicFile) {
      setNewMusicURL(URL.createObjectURL(newMusicFile));
    }
    //TODO revoke
    return () => {
      setNewMusicURL(null);
    };
  }, [newMusicFile]);
  useEffect(() => {
    const tmp = [...urls];
    if (newMusicURL) {
      tmp[newPart] = newMusicURL;
    }
    setUrlsWithNew(tmp);
  }, [urls, newMusicURL, newPart]);

  const audioManager = useAudioManager(id, urlsWithNew);
  return (
    <ul>
      <MultipleTrackPlayer size={size} audioManager={audioManager} authorIDs={[null, null, null, null]}></MultipleTrackPlayer>
      {size >= 2 ? <AllPlayTrackPlayer audioManager={audioManager}></AllPlayTrackPlayer> : <></>}
    </ul>
  );
}
