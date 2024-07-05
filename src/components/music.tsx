import { Music, getAuthorProfileURLs } from "@/libs/music";
import { MouseEventHandler, useEffect, useMemo, useRef, useState } from "react";

import { InfiniteScrollViewer, PlayButton, SpinningLoader } from "./utlis";
import { useRouter } from "next/router";
import { useGoodCounter, useGoodHistory, useInvolvedMusic, useMusicDetail, useThumbnailURL, useTrackURL, useTrackURLs, useUploadedMusic, useViewCounter } from "@/hooks/music";
import { indexToPartName } from "@/libs/utils";
import { useScrollHistory } from "@/hooks/scroll";
import { AudioManager, useAudioManager } from "@/hooks/audioManager";
import { useProfileImage, useProfileImageById } from "@/hooks/profile";
import { list } from "postcss";

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
      className="cursor-pointer hover:bg-secondary p-1 rounded-md"
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
        className="cursor-pointer hover:bg-hprimary p-1 rounded-md border border-secondary m-1 mb-2"
      >
        <MusicPreview music={music}></MusicPreview>
        <MusicInfo music={music} inclementViewCount={inclementViewCount}></MusicInfo>
        <AllPlayTrackPlayer audioManager={audioManager}></AllPlayTrackPlayer>
      </div>
    </>
  );
}
//TODO error handling
export function MusicPreview({ music }: { music?: Music | null | undefined }) {
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
  const { data: urls } = useTrackURLs(music);

  const audioManager = useAudioManager(music.id, urls);
  return (
    <ul>
      <MultipleTrackPlayer size={music.authorIDs.length} audioManager={audioManager} authorIDs={music.authorIDs}></MultipleTrackPlayer>
      <AllPlayTrackPlayer audioManager={audioManager}></AllPlayTrackPlayer>
    </ul>
  );
}

/**
 * 登録されたパート全ての再生用のコンポーネント
 * authorIDs:undefined->描画待機 null->画像なし
 * @param param0
 */
export function MultipleTrackPlayer({ size, authorIDs, audioManager }: { size: number; authorIDs: Array<string | undefined | null>; audioManager: AudioManager | null }) {
  const list = [];
  for (let i = 0; i < size; i++) {
    var authorID = authorIDs[i];
    const noImage = authorID === null;
    authorID = authorID === null ? undefined : authorID;
    list.push(
      <TrackPlayer
        playing={audioManager?.isPlaying(i) ?? false}
        text={indexToPartName(i)}
        key={i}
        onClick={(e) => {
          e.stopPropagation();
          audioManager?.setPlay(i, !audioManager.isPlaying(i));
        }}
        isLoadEnded={audioManager?.isLoadEnded(i) ?? false}
        authorUid={authorID}
        noImage={noImage}
      ></TrackPlayer>
    );
  }
  return list;
}

/**
 * 一括再生用のコンポーネント
 * @param param0
 * @returns
 */
export function AllPlayTrackPlayer({ audioManager }: { audioManager: AudioManager | null }) {
  return (
    <TrackPlayer
      playing={audioManager?.isPlaying(4) ?? false}
      text="全て再生"
      key={100}
      onClick={(e) => {
        e.stopPropagation();
        audioManager?.setPlayAll(!audioManager.isPlayingAll());
      }}
      noImage={true}
      isLoadEnded={audioManager?.isLoadEnded(4) ?? false}
    ></TrackPlayer>
  );
}

function TrackPlayer({
  onClick,
  playing,
  text,
  noImage = false,
  isLoadEnded,
  authorUid,
}: {
  noImage?: boolean;
  playing: boolean;
  onClick: MouseEventHandler<any>;
  text: string;
  isLoadEnded: boolean;
  authorUid?: string | undefined;
}) {
  const router = useRouter();
  const { data: imageSrc } = useProfileImageById(authorUid);
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

/**
 *
 * uid 対象のUUID
 * loadFirst マウント時に読み込むかどうか
 * @returns
 */
export function GoodHistory({ uid, loadFirst = false }: { uid: string; loadFirst?: boolean }) {
  const { history, loadNext } = useGoodHistory(uid);
  useEffect(() => {
    if (loadFirst) {
      loadNext();
    }
  }, []);
  const router = useRouter();
  useScrollHistory("good/" + router.pathname);
  return (
    <InfiniteScrollViewer
      loadNext={loadNext}
      loaded={history.map((it) => (
        <JumpableMusicPreviewById musicId={it} key={it}></JumpableMusicPreviewById>
      ))}
    ></InfiniteScrollViewer>
  );
}

export function InvolvedMusic({ uid, loadFirst = false }: { uid: string; loadFirst?: boolean }) {
  const { history, loadNext } = useInvolvedMusic(uid);
  const router = useRouter();
  useEffect(() => {
    if (loadFirst) {
      loadNext();
    }
  }, []);
  useScrollHistory("involved/" + router.pathname);
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
  const router = useRouter();
  useScrollHistory(router.pathname);
  return (
    <InfiniteScrollViewer
      loadNext={loadNext}
      loaded={history.map((it) => (
        <PlayableMusicPreview music={it} key={it.id}></PlayableMusicPreview>
      ))}
    ></InfiniteScrollViewer>
  );
}
