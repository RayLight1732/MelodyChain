import { FetchResult, FetchStatus, indexToPartName } from "@/libs/utils";
import { useMyProfile } from "./profile";
import { DispatchedMusic } from "@/libs/profile";
import { useMultipleTrackURLs } from "@/hooks/music";
import { TrackPlayer } from "./music";
import { useEffect, useState } from "react";
import { useAudioManager } from "@/hooks/audioManager";

export function useDispatchedMusic() {
  const [profile] = useMyProfile();
  return new FetchResult(profile.getState(), profile.getContent()?.getDispatchedMusic());
}

/**
 * まだ完成していない音楽用のプレイヤー
 */
export function WIPMusicPlayer({ id, authorIDs, musicRefs, newMusicFile, newPart }: { id: string; authorIDs: string[]; musicRefs: string[]; newMusicFile?: Blob | null; newPart: number }) {
  const size = authorIDs.length;

  const { data: urls } = useMultipleTrackURLs(authorIDs, musicRefs);
  const [newMusicURL, setNewMusicURL] = useState<string | null | undefined>();
  const [urlsWithNew, setUrlsWithNew] = useState<Array<string | null | undefined>>();
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
      {(() => {
        const list = [];
        for (let i = 0; i < size; i++) {
          list.push(
            <TrackPlayer
              playing={audioManager?.isPlaying(i) ?? false}
              text={indexToPartName(i)}
              key={i}
              onClick={() => audioManager?.togglePlayPose(i)}
              isLoadEnded={audioManager?.isLoadEnded(i) ?? false}
              noImage={true}
            ></TrackPlayer>
          );
        }
        return list;
      })()}
      {newMusicURL ? (
        <TrackPlayer
          playing={audioManager?.isPlaying(newPart) ?? false}
          text={indexToPartName(newPart)}
          onClick={() => audioManager?.togglePlayPose(newPart)}
          isLoadEnded={audioManager?.isLoadEnded(newPart) ?? false}
          noImage={true}
        ></TrackPlayer>
      ) : (
        <></>
      )}
      {size >= 2 ? (
        <TrackPlayer playing={audioManager?.isPlaying(4) ?? false} text="全て再生" key={100} onClick={() => audioManager?.togglePlayPoseAll()} noImage={true} isLoadEnded={true}></TrackPlayer>
      ) : (
        <></>
      )}
    </ul>
  );
}
