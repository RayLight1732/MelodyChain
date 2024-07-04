import { ImageCropDialog } from "@/components/image";
import { WIPMusicPlayer, useDispatchedMusic } from "@/components/uploader";
import { CountableTextArea, showFileChoosePopup } from "@/components/utlis";
import { useAudioContext } from "@/hooks/context";
import { uploadMusic } from "@/libs/music";
import { DEFAULT_THUMBNAIL_HEIGHT, DEFAULT_THUMBNAIL_WIDTH, FetchStatus, indexToPartName } from "@/libs/utils";
import { Dispatch, ReactElement, SetStateAction, useCallback, useEffect, useRef, useState } from "react";

const acceptType = "audio/wav,audio/mpeg,audio/midi";
const beat = 4;
const measure = 8;

export default function Dispatched(): ReactElement {
  const dispatchedMusic = useDispatchedMusic();
  const [uploaded, setUploaded] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isValidating, duration, error] = useAudioBufferSourceNode(selectedFile);
  const [thumbnailBlob, setThumbnailBlob] = useState<Blob | null>(null);

  const nameState = useState<string>("");
  if (dispatchedMusic.getState() === FetchStatus.INIT) {
    return <></>;
  } else if (uploaded) {
    return (
      <div className="w-full h-full flex">
        <p className="text-xl align-middle text-center m-auto block">アップロードが完了しました</p>
      </div>
    );
  } else if (dispatchedMusic.getState() === FetchStatus.SUCCESS) {
    const content = dispatchedMusic.getContent();
    if (content) {
      return (
        <>
          <div className="p-5">
            <p className="text-center">あなたは{indexToPartName(content.getPart())}パート担当です</p>
            <p className="text-center pb-3">{`${beat}拍子 ${measure}小節の音楽を投稿してください`}</p>
            <p className="text-center pb-3">BPM:{content.getTempo()}</p>
            <p className="text-center">
              期限 {content.getLimit().getMonth() + 1}月{content.getLimit().getDate()}日{content.getLimit().getHours()}時{content.getLimit().getMinutes()}分
            </p>
          </div>
          <div className="flex align-middle flex-col">
            <FileSelectButton selectedFile={selectedFile} setSelectedFile={setSelectedFile} isValidFile={!error} isValidating={isValidating}></FileSelectButton>
            <WarnMessage fileSelected={selectedFile != null} isValidFile={!error} isValidating={isValidating} tempo={content.getTempo()} duration={duration}></WarnMessage>
          </div>
          <WIPMusicPlayer newPart={content.getPart()} id={content.getDataRef()} authorIDs={content.getAuthorIds()} musicRefs={content.getPreviousRefs()} newMusicFile={selectedFile}></WIPMusicPlayer>

          {content.getPart() == 3 ? (
            <div className="m-4">
              <p>サムネイル</p>
              <ThumbnailSelector thumbnailBlob={thumbnailBlob} setThumbnailBlob={setThumbnailBlob}></ThumbnailSelector>
              <CountableTextArea className="my-4" state={nameState} id="name" placeholder="名前" maxLength={20} rows={1} pattern={/^[^\n]*$/} required={true}></CountableTextArea>
            </div>
          ) : null}

          <UploadButton part={content.getPart()} isValidFile={!isValidating && !error} file={selectedFile} setUploaded={setUploaded} thumbnail={thumbnailBlob} title={nameState[0]}></UploadButton>
        </>
      );
    } else {
      return (
        <div className="w-full h-full flex">
          <p className="text-xl align-middle text-center m-auto block">担当する音楽が割り当てられていません</p>
        </div>
      );
    }
  } else {
    return <p>Error</p>;
  }
}

function FileSelectButton({
  selectedFile,
  setSelectedFile,
  isValidFile,
  isValidating,
}: {
  selectedFile: File | null;
  setSelectedFile: Dispatch<SetStateAction<File | null>>;
  isValidFile: boolean;
  isValidating: boolean;
}) {
  //TODO ローディング状態
  return (
    <div
      className={
        (selectedFile && !isValidFile ? "bg-[#882323d5] line-through hover:bg-[#bd0000]" : "bg-[#007bff] hover:bg-[#0026ffab]") +
        " m-auto py-2.5 px-5 rounded-md text-primary cursor-pointer  overflow-hidden overflow-ellipsis max-w-60 primaryspace-nowrap select-none"
      }
      onClick={(e) =>
        showFileChoosePopup(acceptType, (e) => {
          const files = (e.target as HTMLInputElement).files;
          if (files && files[0]) {
            setSelectedFile(files[0]);
          }
        })
      }
    >
      {selectedFile ? selectedFile.name : "ファイルを選択"}
    </div>
  );
}

function WarnMessage({ fileSelected, isValidFile, isValidating, tempo, duration }: { fileSelected: boolean; isValidFile: boolean; isValidating: boolean; tempo: number; duration: number }) {
  if (fileSelected) {
    if (!isValidating) {
      const className = "text-center text-warn p-2";
      if (!isValidFile) {
        return <p className={className}>エラー:音楽ファイル(.wav/.mp3/.midi)を選択してください</p>; //バツ
      } else if (Math.abs((beat * 60 * measure) / tempo - duration) >= 0.1) {
        return <p className={className}>警告:曲の長さが適していません</p>; //三角
      }
    }
  }
  return <p className="invisible">tmp</p>;
}

function canUploadFile(part: number, file: File | null, isValidFile: boolean, thumbnail: Blob | null, title: string): boolean {
  if (part == 3) {
    return file != null && isValidFile && thumbnail != null && title.length != 0;
  } else {
    return file != null && isValidFile;
  }
}

function UploadButton({
  part,
  isValidFile,
  file,
  thumbnail,
  title,
  className,
  setUploaded,
}: {
  part: number;
  thumbnail: Blob | null;
  title: string;
  isValidFile: boolean;
  file: File | null;
  className?: string;
  setUploaded: Dispatch<SetStateAction<boolean>>;
}) {
  className = "text-primary py-2.5 px-4 rounded-md select-none " + className;
  const [error, setError] = useState<any>();
  if (canUploadFile(part, file, isValidFile, thumbnail, title)) {
    const onClick = async () => {
      try {
        await uploadMusic(file!, title, thumbnail);
        setUploaded(true);
      } catch (e) {
        setError(e);
      }
    };
    return (
      //ぐるぐる
      <div className={"flex align-middle mt-10 flex-col " + className}>
        <div className={"bg-[#007bff] hover:bg-[#0026ffab] cursor-pointer m-auto py-2.5 px-5 rounded-md"} onClick={onClick}>
          アップロード
        </div>
        {error ? <p className="text-warn text-center p-2">エラー:投稿に失敗しました</p> : null}
      </div>
    );
  } else {
    return (
      <div className={"flex align-middle mt-10 flex-col " + className}>
        <div className="bg-[#b8daff] m-auto py-2.5 px-5 rounded-md">アップロード</div>
      </div>
    );
  }
}

function useAudioBufferSourceNode(file: File | null): [boolean, number, any] {
  const audioContext = useAudioContext();
  const [isValidating, setIsValidationg] = useState(false);
  const [dulation, setDulation] = useState(-1);
  const [error, setError] = useState<any>(null);
  useEffect(() => {
    var ignore = false;
    if (file) {
      setIsValidationg(true);
      const func = async () => {
        try {
          const buffer = await file.arrayBuffer();
          const decoded = await audioContext.decodeAudioData(buffer);
          if (!ignore) {
            setDulation(decoded.duration);
            setIsValidationg(false);
          }
        } catch (e) {
          if (!ignore) {
            setError(e);
            setIsValidationg(false);
          }
        }
      };
      func();
    } else {
      setDulation(0);
      setError(null);
    }
    return () => {
      ignore = true;
      setIsValidationg(false);
      setDulation(0);
      setError(null);
    };
  }, [file]);

  return [isValidating, dulation, error];
}

function ThumbnailSelector({ thumbnailBlob, setThumbnailBlob }: { thumbnailBlob: Blob | null; setThumbnailBlob: Dispatch<SetStateAction<Blob | null>> }) {
  const [isCropDialogVisible, setCropDialogVisible] = useState(false);
  const src = useRef<string | null>(null);
  const blobRef = useRef<Blob>(null);

  const [thumbnailURL, setThumbnailURL] = useState<string | null>(null);
  useEffect(() => {
    if (blobRef.current) {
      setThumbnailBlob(blobRef.current);
      setThumbnailURL(URL.createObjectURL(blobRef.current));
    }
    return () => {
      if (thumbnailURL) {
        URL.revokeObjectURL(thumbnailURL);
      }
    };
  }, [blobRef.current]);

  const imageClickHandler = useCallback(() => {
    showFileChoosePopup("image/png,image/jpeg", (e) => {
      const files = (e.target as HTMLInputElement).files;
      if (files && files[0]) {
        src.current = URL.createObjectURL(files[0])!;
        setCropDialogVisible(true);
      }
    });
  }, [setCropDialogVisible]);

  return (
    <>
      {isCropDialogVisible ? (
        <ImageCropDialog src={src.current!} setDialogVisible={setCropDialogVisible} blobRef={blobRef} exportHeight={DEFAULT_THUMBNAIL_HEIGHT} exportWidth={DEFAULT_THUMBNAIL_WIDTH} rounded={false} />
      ) : null}
      {thumbnailURL ? (
        <img className="cursor-pointer" src={thumbnailURL} style={{ aspectRatio: DEFAULT_THUMBNAIL_WIDTH / DEFAULT_THUMBNAIL_HEIGHT }} onClick={imageClickHandler}></img>
      ) : (
        <div className="bg-slate-700 cursor-pointer" style={{ aspectRatio: DEFAULT_THUMBNAIL_WIDTH / DEFAULT_THUMBNAIL_HEIGHT }} onClick={imageClickHandler}></div>
      )}
    </>
  );
}
