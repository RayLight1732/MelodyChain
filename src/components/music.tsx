import { Music, getAuthorProfileURLs } from "@/libs/music";
import { MouseEventHandler, useEffect, useMemo, useState } from "react";

import { InfiniteScrollViewer, PlayButton, SpinningLoader } from "./utlis";
import { useRouter } from "next/router";
import { useGoodCounter, useGoodHistory, useInvolvedMusic, useMusicDetail, useThumbnailURL, useTrackURL, useTrackURLs, useUploadedMusic, useViewCounter } from "@/hooks/music";
import { indexToPartName } from "@/libs/utils";
import { useAudioManager } from "@/hooks/audioManager";

export function JumpableMusicPreviewById({ musicId }: { musicId: string }) {
  const { data, isLoading } = useMusicDetail(musicId);

  return <JumpableMusicPreview music={data}></JumpableMusicPreview>;
}

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

export function PlayableMusicPreview({ music }: { music: Music }) {
  const { data: urls } = useTrackURLs(music);
  const audioManager = useAudioManager(music.id, urls);
  const [inclementViewCount, setInclementViewCount] = useState(false);
  const router = useRouter();
  useEffect(() => {
    setInclementViewCount((value) => value || (audioManager?.isPlaying(4) ?? false));
  }, [audioManager?.isPlaying(4) ?? false]);
  return (
    <>
      <div
        onClick={(e) => {
          if (music) {
            router.push(`/music/${music.id}`);
          }
        }}
        className="cursor-pointer hover:bg-gray-100 p-1 rounded-md"
      >
        <MusicPreview music={music}></MusicPreview>
        <MusicInfo music={music} inclementViewCount={inclementViewCount}></MusicInfo>
        <TrackPlayer
          playing={audioManager?.isPlaying(4) ?? false}
          text="全て再生"
          key={100}
          onClick={(e) => {
            e.stopPropagation();
            audioManager?.togglePlayPoseAll();
          }}
          noImage={true}
          isLoadEnded={true}
        ></TrackPlayer>
      </div>
    </>
  );
}
//TODO error handling
export function MusicPreview({ music }: { music: Music | null | undefined }) {
  const { data: src } = useThumbnailURL(music);

  const ImageComponent = () => {
    if (src == null) {
      return (
        <>
          <div className="w-full aspect-[4/3] object-cover bg-gray-400 rounded-md"></div>
        </>
      );
    } else {
      return <img src={src} className="w-full aspect-[4/3] object-cover rounded-md"></img>;
    }
  };

  return (
    <div className="pb-4">
      <ImageComponent></ImageComponent>
      <p className="text-center pt-3 font-bold text-2xl ">{music?.name}</p>
    </div>
  );
}

export function MusicInfo({ music, className = "", inclementViewCount }: { music: Music; className?: string; inclementViewCount: boolean }) {
  const fmt = useMemo(() => {
    return new Intl.NumberFormat(window.navigator.language, { notation: "compact" });
  }, []);
  const { isPressed, count: goodCount, setPressed } = useGoodCounter(music);
  const [isMouseDown, setMouseDown] = useState(false);
  const viewCount = useViewCounter(music, inclementViewCount);
  return (
    <div className={"w-full flex justify-between px-4 " + className}>
      <p className="bg-secondary rounded-full px-4 py-2">{fmt.format(viewCount)}回試聴</p>
      <div
        onClick={(e) => {
          e.stopPropagation();
          setPressed(!isPressed);
        }}
        onMouseDown={() => {
          setMouseDown(true);
        }}
        onMouseUp={() => {
          setMouseDown(false);
        }}
        onMouseLeave={() => {
          setMouseDown(false);
        }}
        className="bg-secondary rounded-full px-4 py-2 flex cursor-pointer hover:bg-hsecondary"
      >
        <div className={"w-6 h-6 " + (isPressed || isMouseDown ? "bg-[url('/images/heart_red.svg')] animate-heart-animation" : "bg-[url('/images/heart.svg')]")}></div>
        <p className="select-none">{fmt.format(goodCount)}</p>
      </div>
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

export function GoodHistory({ uid }: { uid: string }) {
  const { history, loadNext } = useGoodHistory(uid);
  return (
    <InfiniteScrollViewer
      loadNext={loadNext}
      loaded={history.map((it) => (
        <JumpableMusicPreviewById musicId={it} key={it}></JumpableMusicPreviewById>
      ))}
    ></InfiniteScrollViewer>
  );
}

export function InvolvedMusic({ uid }: { uid: string }) {
  const { history, loadNext } = useInvolvedMusic(uid);
  return (
    <InfiniteScrollViewer
      loadNext={loadNext}
      loaded={history.map((it) => (
        <JumpableMusicPreview music={it} key={it.id}></JumpableMusicPreview>
      ))}
    ></InfiniteScrollViewer>
  );
}

export function UploadedMusic() {
  const { history, loadNext } = useUploadedMusic();
  return (
    <InfiniteScrollViewer
      loadNext={loadNext}
      loaded={history.map((it) => (
        <PlayableMusicPreview music={it} key={it.id}></PlayableMusicPreview>
      ))}
    ></InfiniteScrollViewer>
  );
}
