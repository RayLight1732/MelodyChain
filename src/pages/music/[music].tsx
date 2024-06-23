import { MusicPlayer, MusicPreview } from "@/components/music";
import { Music, getMusicDetail } from "@/libs/music";
import { useRouter } from "next/router";
import React, { useEffect, useState } from "react";

//TODO useSWR
export default function MusicView() {
  const router = useRouter();
  const musicId = router.query.music as string;
  const [music, setMusic] = useState<Music | null | undefined>();
  useEffect(() => {
    let ignore = false;
    const func = async () => {
      const detail = await getMusicDetail(musicId);
      if (!ignore) {
        setMusic(detail);
      }
    };
    func();
    return () => {
      ignore = true;
    };
  }, [musicId]);

  if (music == null) {
    return <p>存在しない曲です</p>;
  } else {
    return (
      <>
        <MusicPreview music={music} />
        <MusicPlayer music={music} />
      </>
    );
  }
}
