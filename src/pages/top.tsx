import { JumpableMusicPreview, MusicPreview } from "@/components/music";
import { Music, getMusic } from "@/libs/music";
import { useEffect, useState } from "react";

export default function Top() {
  const [loadedMusic, setLoadedMusic] = useState<Music[]>([]);
  useEffect(() => {
    let ignore = false;
    getMusic()
      .then((result) => {
        if (!ignore) {
          setLoadedMusic(result.musicList);
        }
      })
      .catch((e) => {
        console.error(e);
      });
    return () => {
      ignore = true;
    };
  }, []);
  /*
  for (var i = 0; i < 12; i++) {
    musicList.push(new Music((Math.random() * 10000).toString(), "タイトル", "ref", [""], [""], new Date()));
  }*/
  const musicPreviews = [];
  for (const music of loadedMusic) {
    musicPreviews.push(<JumpableMusicPreview music={music} key={music.id}></JumpableMusicPreview>);
  }
  return <>{musicPreviews}</>;
}
