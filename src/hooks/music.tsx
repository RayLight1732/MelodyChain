import { audioContextProvider } from "@/components/layout";
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
  for (var i = 0; i < 4; i++) {
    const { data, isLoading: isLoading_, error: error_ } = useTrackURL(authorIDs[i], musicRefs[i]);
    tmpData.push(data);
    isLoading ||= isLoading_;
    tmpErrors.push(error_);
  }

  useEffect(() => {
    setResult({ data: [...tmpData], error: [...tmpErrors] });
  }, [...tmpData, ...tmpErrors]);
  //TODO　どうにかする
  return { data: result.data, isLoading: isLoading, error: result.data };
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

//part:0 ドラム 1ベース 2ギター 3メロディー 4全部
class AudioManager {
  audioStateList: Array<AudioState>;
  private audioCtx: AudioContext;
  private offset = 0;
  constructor(audioStateList: Array<AudioState>, audioCtx: AudioContext) {
    this.audioStateList = audioStateList;
    for (const audioState of audioStateList) {
      audioState.onEnded = () => {
        this.onEnd(audioState.part);
      };
    }
    this.audioCtx = audioCtx;
    this.getAudioState = this.getAudioState.bind(this);
    this.isPlaying = this.isPlaying.bind(this);
    this.updateState = this.updateState.bind(this);
    this.togglePlayPose = this.togglePlayPose.bind(this);
    this.togglePlayPoseAll = this.togglePlayPoseAll.bind(this);
    this.onEnd = this.onEnd.bind(this);
  }

  private getAudioState(part: number): AudioState | null {
    for (const audioState of this.audioStateList) {
      if (audioState.part == part) {
        return audioState;
      }
    }
    return null;
  }

  isPlaying(part: number): boolean {
    return this.getAudioState(part)?.isPlaying() ?? false;
  }

  updateState(part: number, isPlaying: boolean, syncOther: boolean, firstSyncPlay: boolean) {
    this.audioStateList.forEach((v) => {
      if (v.part == part) {
        v.setPlaying(isPlaying, syncOther, firstSyncPlay, this.audioCtx, this.offset);
      }
    });
  }

  togglePlayPose(part: number) {
    if (this.isPlaying(4)) {
      const currentPlaying = this.audioStateList.filter((v) => v.part != part && v.hasAudio() && v.isPlaying());

      if (currentPlaying.length == 0) {
        this.togglePlayPoseAll();
      } else {
        const target = this.getAudioState(part);
        if (target) {
          this.updateState(part, !target.isPlaying(), true, false);
        }
      }
    } else {
      this.audioStateList.forEach((v) => {
        if (v.part == part) {
          v.setPlaying(!v.isPlaying(), false, false, this.audioCtx);
        } else if (v.part != 4) {
          v.setPlaying(false, false, false, this.audioCtx);
        }
        return v;
      });
    }
  }

  togglePlayPoseAll() {
    this.offset = -1;
    const isPlayingAll = this.isPlaying(4);
    if (isPlayingAll) {
      //全て再生ボタンが押されている場合
      this.audioStateList.forEach((v) => {
        v.setPlaying(false, false, false, this.audioCtx);
      });
    } else {
      //全て再生ボタンが押されていない場合
      this.audioStateList.forEach((v) => {
        if (v.part != 4 && this.offset === -1) {
          this.offset = v.setPlaying(true, true, true, this.audioCtx);
        } else {
          v.setPlaying(true, true, false, this.audioCtx, this.offset);
        }
      });
    }
  }

  onEnd(part: number) {
    if (this.isPlaying(4)) {
      const playing = this.audioStateList.filter((v) => v.part != 4 && v.part != part).filter((v) => v.isPlaying());
      if (playing.length === 0) {
        this.togglePlayPoseAll();
      } else {
        this.updateState(part, false, false, false);
      }
    } else {
      this.updateState(part, false, false, false);
    }
  }

  isLoadEnded(part: number): boolean {
    if (part == 4) {
      return true;
    } else {
      return this.getAudioState(part)?.isLoadEnded() ?? false;
    }
  }
}

class AudioState {
  part: number;
  private playing: boolean;
  private trackSource: AudioBufferSourceNode | null = null;
  private buffer: AudioBuffer | null | undefined;
  private isLoading: boolean;
  onEnded: () => void = () => {};
  private innerOnEnded: () => void;
  private updateState: (playing: boolean) => void;
  constructor(part: number, playing: boolean, isLoading: boolean, updateState: (playing: boolean) => void, buffer: AudioBuffer | null | undefined) {
    this.part = part;
    this.playing = playing;
    this.isLoading = isLoading;
    this.innerOnEnded = () => {
      this.onEnded();
      console.log("on ended");
    };
    this.updateState = updateState;
    this.buffer = buffer;
  }

  hasAudio = () => {
    return this.buffer !== null;
  };

  isLoadEnded = () => {
    return !this.isLoading;
  };

  setPlaying = (play: boolean, syncOther: boolean, firstSyncPlay: boolean, audioCtx?: AudioContext, offset: number = 0): number => {
    const oldValue = this.playing;
    console.log(play, this.part);
    let currentTime = -1;
    this.playing = play;
    if (play) {
      if (this.buffer) {
        console.log("found buffer");
        if (this.trackSource) {
          //すでに存在する=再生している場合停止
          this.trackSource.onended = () => {};
          this.trackSource.stop();
          console.log("stop1", this.part);
        }
        this.trackSource = new AudioBufferSourceNode(audioCtx!, { buffer: this.buffer });
        this.trackSource.connect(audioCtx!.destination);
        this.trackSource.onended = this.innerOnEnded;
      }
    }

    console.log("trackSource is", !!this.trackSource);
    if (this.trackSource) {
      if (play) {
        if (syncOther) {
          currentTime = audioCtx!.currentTime;
          console.log("sync other:", currentTime);
          if (firstSyncPlay) {
            this.trackSource.start(0);
            console.log("start1");
          } else {
            this.trackSource.start(0, currentTime - offset);
            console.log("start2");
          }
          this.updateState(this.playing);
        } else {
          this.trackSource.start();
          console.log("start3");
          this.updateState(this.playing);
        }
      } else {
        console.log("on stop", this.part);
        if (oldValue) {
          //すでに再生されていた場合
          this.trackSource.stop();
          console.log("stop2", this.part);
          this.trackSource = null;
          console.log("set source null");
          this.updateState(this.playing);
        }
      }
    }
    return currentTime;
  };

  isPlaying() {
    return this.playing;
  }
}

function getFetcher(url: string | undefined | null, audioCtx: AudioContext) {
  if (url) {
    return async () => {
      const response = await fetch(url, {
        mode: "cors",
      });
      if (!response) {
        console.error("resopnse is null");
      }
      const arrayBuffer = await response.arrayBuffer();
      if (!arrayBuffer) {
        console.error("array buffer is null");
      }
      const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
      if (!audioBuffer) {
        console.error("audio buffer is null");
      }
      return audioBuffer;
    };
  } else {
    return null;
  }
}

function useAudioState(part: number, url: string | null | undefined, audioCtx: AudioContext): AudioState | null {
  //const { data, error, isLoading } = useSWR(url, getFetcher(url, audioCtx));
  const { data, error, isLoading } = useSWR(url, getFetcher(url, audioCtx));
  const [isPlaying, setPlaying] = useState(false);
  const [audioState, setAudioState] = useState<AudioState | null>(null);
  useEffect(() => {
    const audioState = new AudioState(part, isPlaying, isLoading || !data, (playing) => setPlaying(playing), data);
    setAudioState(audioState);
    return () => {
      audioState.setPlaying(false, false, false);
      setAudioState(null);
    };
  }, [isLoading, data]);
  return audioState;
}

export function useAudioContext(): AudioContext {
  return useContext(audioContextProvider)!;
}

export function useAudioManager(musicId: string, urls: Array<string | undefined | null> | undefined): AudioManager | null {
  const audioCtx = useAudioContext();

  const dramState = useAudioState(0, urls ? urls[0] : null, audioCtx);
  const baseState = useAudioState(1, urls ? urls[1] : null, audioCtx);
  const guiterState = useAudioState(2, urls ? urls[2] : null, audioCtx);
  const melodyState = useAudioState(3, urls ? urls[3] : null, audioCtx);

  const [isAllPlaying, setAllPlaying] = useState(false);
  const [allPlayState, setAllPlayState] = useState<AudioState | null>(null);
  useEffect(() => {
    const melodyState = new AudioState(4, isAllPlaying, false, (playing) => setAllPlaying(playing), null);
    setAllPlayState(melodyState);
    return () => {
      melodyState.setPlaying(false, false, false);
      setAllPlayState(null);
    };
  }, [urls]);

  const [audioManager, setAudioManager] = useState<AudioManager | null>(null);
  useEffect(() => {
    let ignore = false;
    const array: Array<AudioState> = [];
    if (dramState) {
      array.push(dramState);
    }
    if (baseState) {
      array.push(baseState);
    }
    if (guiterState) {
      array.push(guiterState);
    }
    if (melodyState) {
      array.push(melodyState);
    }
    if (allPlayState) {
      array.push(allPlayState);
    }

    const audioManager = new AudioManager(array, audioCtx);
    setAudioManager(audioManager);
  }, [dramState, baseState, guiterState, melodyState, allPlayState]);
  return audioManager;
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
