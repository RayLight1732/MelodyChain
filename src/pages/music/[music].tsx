import { MusicInfo, MusicPlayer, MusicPreview } from "@/components/music";
import { useMusicDetail } from "@/hooks/music";
import { useRouter } from "next/router";
import React, { useEffect } from "react";

export default function MusicView() {
  const router = useRouter();
  const musicId = router.query.music as string;
  const { data, isLoading, error } = useMusicDetail(musicId);

  if (!isLoading && data == null) {
    return <p>存在しない曲です</p>;
  } else if (data != null) {
    return (
      <>
        <MusicPreview music={data} />
        <MusicInfo music={data} inclementViewCount={true}></MusicInfo>
        <MusicPlayer music={data} />
      </>
    );
  } else {
    return (
      <>
        <MusicPreview />
      </>
    );
  }
}

MusicView.showBackButton = true;
