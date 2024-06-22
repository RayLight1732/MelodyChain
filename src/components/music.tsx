import { Music, getAuthorProfileURLs, getMusicDetail, getMusicURLs, getThumbnailURL } from "@/libs/music";
import { Dispatch, MouseEventHandler, ReactElement, SetStateAction, useContext, useEffect, useMemo, useRef, useState } from "react";
import { buffer, text } from "stream/consumers";
import { PlayButton, SpinningLoader } from "./utlis";
import { useRouter } from "next/router";
import useSWR from "swr";
import { error } from "console";
import { audioContextProvider } from "./layout";
import { useAudioManager, useMultipleTrackURLs, useThumbnailURL, useTrackURLs } from "@/hooks/music";
import { indexToPartName } from "@/libs/utils";

export function JumpableMusicPreview({ music }: { music: Music | null | undefined }) {
  const router = useRouter();
  return (
    <div
      onClick={(e) => {
        if (music) {
          router.push(`/music/${music.id}`);
        }
      }}
      className="cursor-pointer hover:bg-gray-100 p-1 rounded-md"
    >
      <MusicPreview music={music}></MusicPreview>
    </div>
  );
}
//TODO error handling
export function MusicPreview({ music }: { music: Music | null | undefined }) {
  const { data: src } = useThumbnailURL(music);

  const ImageComponent = () => {
    if (src == null) {
      return (
        <>
          <div className="w-full aspect-[4/3] object-cover bg-gray-400"></div>
        </>
      );
    } else {
      return <img src={src} className="w-full aspect-[4/3] object-cover"></img>;
    }
  };

  return (
    <div className="pb-4">
      <ImageComponent></ImageComponent>
      <p className="text-center pt-2">{music?.name}</p>
    </div>
  );
}

export function MusicPlayer({ music }: { music: Music }) {
  const size = music.musicRefs.length;
  const { data: urls } = useTrackURLs(music);
  const [authorProfileImages, setAuthorProfileImages] = useState<Array<string | null>>([]);
  useEffect(() => {
    let ignore = false;
    getAuthorProfileURLs(music)
      .then((result) => {
        setAuthorProfileImages(result);
      })
      .catch((e) => {
        console.error(e);
      });
    return () => {
      ignore = true;
    };
  }, [music]);

  const audioManager = useAudioManager(music.id, urls);
  return (
    <ul>
      {(() => {
        const list = [];
        for (let i = 0; i < size; i++) {
          list.push(
            <TrackPlayer
              imageSrc={authorProfileImages[i]}
              playing={audioManager?.isPlaying(i) ?? false}
              text={indexToPartName(i)}
              key={i}
              onClick={() => audioManager?.togglePlayPose(i)}
              isLoadEnded={audioManager?.isLoadEnded(i) ?? false}
              authorUid={music.authorIDs[i]}
            ></TrackPlayer>
          );
        }
        return list;
      })()}
      <TrackPlayer playing={audioManager?.isPlaying(4) ?? false} text="全て再生" key={100} onClick={() => audioManager?.togglePlayPoseAll()} noImage={true} isLoadEnded={true}></TrackPlayer>
    </ul>
  );
}

export function TrackPlayer({
  onClick,
  playing,
  text,
  imageSrc,
  noImage = false,
  isLoadEnded,
  authorUid,
}: {
  noImage?: boolean;
  playing: boolean;
  onClick: MouseEventHandler<any>;
  text: string;
  imageSrc?: string | null;
  isLoadEnded: boolean;
  authorUid?: string | undefined;
}) {
  const router = useRouter();

  return (
    <li className="flex items-center m-4">
      {noImage ? (
        <div className="rounded-full w-[15%] aspect-square" />
      ) : imageSrc ? (
        <div
          onClick={() => {
            if (authorUid) {
              router.push("/profile/" + authorUid);
            }
          }}
          className="rounded-full w-[15%] aspect-square select-none cursor-pointer"
          style={{ backgroundImage: `url(${imageSrc})`, backgroundSize: "contain" }}
        />
      ) : (
        <div className="rounded-full w-[15%] aspect-square bg-gray-400" />
      )}

      <span className="flex-1 mx-10 text-center select-none">{text}</span>
      {isLoadEnded ? (
        <PlayButton playing={playing} onClick={onClick} className="rounded-full w-[15%] aspect-square cursor-pointer" />
      ) : (
        <SpinningLoader className="rounded-full w-[15%] aspect-square" />
      )}
    </li>
  );
}
