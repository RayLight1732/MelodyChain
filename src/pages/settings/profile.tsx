import { Area, CropAreaSelector, ImageCropDialog, cropImage } from "@/components/image";
import { useMyHeaderImage, useMyProfile, useMyProfileImage } from "@/components/profile";
import { CountableTextArea, CustomDialog, showFileChoosePopup, usePageLeaveConfirmation } from "@/components/utlis";
import {
  DEFAULT_HEADER_HEIGHT,
  DEFAULT_HEADER_WIDTH,
  DEFAULT_PROFILE_HEIGHT,
  DEFAULT_PROFILE_WIDTH,
  FetchResult,
  FetchStatus,
  HEADER_RATIO,
  getPartArray,
  indexToPartId,
  indexToPartName,
} from "@/libs/utils";
import Head from "next/head";
import { Dispatch, FormEvent, ForwardedRef, LegacyRef, MutableRefObject, RefObject, SetStateAction, forwardRef, use, useCallback, useEffect, useMemo, useRef, useState } from "react";

export default function ProfileEditor() {
  const [profile, setProfile] = useMyProfile();
  const headerBlobRef = useRef<Blob>(null);
  const [profileImage, setProfileImage] = useMyProfileImage();

  const profileBlobRef = useRef<Blob>(null);
  const [headerImage, setHeaderImage] = useMyHeaderImage();
  const nameComponentRef = useRef<HTMLDivElement>(null);

  const nameValueState = useState("");
  const favoriteValueState = useState("");
  const partValueState = useState<Array<number>>([]);

  const [isErrorDialogShown, showErrorDialog] = useState(false); //エラーが発生した時用
  const [isWarnDialogShown, showWarnDialog] = useState(false); //編集中のページ離脱警告

  const showDialog = useCallback(() => {
    return (
      !!profileBlobRef.current ||
      !!headerBlobRef.current ||
      profile.getContent()?.name != nameValueState[0] ||
      profile.getContent()?.favorite != favoriteValueState[0] ||
      !isSame(profile.getContent()?.part, partValueState[0])
    );
  }, [profile, profileBlobRef.current, headerBlobRef.current, nameValueState[0], favoriteValueState[0], partValueState[0]]);

  const dialogFactory = useCallback((onConfirm: () => void, oncancel: () => void) => {
    return (
      <div className="flex flex-col bg-white max-w-80 w-[80vw] p-8 rounded-xl">
        <p className="mx-auto text-warn text-lg font-bold">編集内容を破棄しますか</p>
        <p className="mx-auto mt-2 text-secondary ">この操作は取り消しできません。編集内容は失われます。</p>
        <button className="w-40 mt-8 border-2 border-warn bg-warn text-white rounded-full px-2 mx-auto text-xl focus:outline-none" onClick={onConfirm}>
          破棄
        </button>
        <button className="w-40 mt-8 border-2 border-secondary rounded-full px-2 mx-auto text-xl focus:outline-none" onClick={oncancel}>
          キャンセル
        </button>
      </div>
    );
  }, []);

  const confirmDialog = usePageLeaveConfirmation(showDialog, dialogFactory);

  const submitHandler = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!nameValueState || nameValueState[0].length == 0) {
      nameComponentRef.current?.scrollIntoView();
    } else {
      const promiseList: Array<Promise<any>> = [];
      promiseList.push(setProfile(nameValueState[0], favoriteValueState[0], partValueState[0]));
      if (headerBlobRef.current) {
        promiseList.push(setHeaderImage(headerBlobRef.current));
      }
      if (profileBlobRef.current) {
        promiseList.push(setProfileImage(profileBlobRef.current));
      }
      try {
        const result = await Promise.all(promiseList);
        for (const fetchResult of result) {
          if (fetchResult && fetchResult.getState() === FetchStatus.ERROR) {
            showErrorDialog(true);
            break;
          }
        }
      } catch (e) {
        console.error(e);
        showErrorDialog(true);
      }
    }
  };
  return (
    <>
      <Head>
        <title>MelodyChain-プロフィールの編集</title>
      </Head>
      {confirmDialog}
      <CustomDialog isOpen={isErrorDialogShown} onClose={() => showErrorDialog(false)}>
        <div className="flex flex-col bg-white max-w-80 w-[80vw] p-8 rounded-xl">
          <p className="text-warn text-lg font-bold">エラー:</p>
          <p className="mt-2 text-secondary text-lg">プロフィールの更新に失敗しました。</p>
          <button className="w-40 mt-8 border-2 border-secondary rounded-full px-2 mx-auto text-xl focus:outline-none" onClick={() => showErrorDialog(false)}>
            閉じる
          </button>
        </div>
      </CustomDialog>
      <CustomDialog isOpen={isWarnDialogShown} onClose={() => showWarnDialog(false)}>
        <div className="flex flex-col bg-white max-w-80 w-[80vw] p-8 rounded-xl">
          <p className="mx-auto text-warn text-lg font-bold">編集内容を破棄しますか</p>
          <p className="mx-auto mt-2 text-secondary ">この操作は取り消しできません。編集内容は失われます。</p>
          <button className="w-40 mt-8 border-2 border-warn bg-warn text-white rounded-full px-2 mx-auto text-xl focus:outline-none" onClick={() => showWarnDialog(false)}>
            破棄
          </button>
          <button className="w-40 mt-8 border-2 border-secondary rounded-full px-2 mx-auto text-xl focus:outline-none" onClick={() => showWarnDialog(false)}>
            キャンセル
          </button>
        </div>
      </CustomDialog>
      <form onSubmit={submitHandler}>
        <ImageSection headerBlobRef={headerBlobRef} profileBlobRef={profileBlobRef} currentHeaderUrl={headerImage.getContent()} currentProfileUrl={profileImage.getContent()}></ImageSection>
        <div className="w-full aspect-[2.618/0.305] flex flex-wrap"></div>
        <div className="mt-4 mx-5 flex flex-col mb-10">
          <CountableTextArea
            defaultValue={profile.getContent()?.name}
            state={nameValueState}
            ref={nameComponentRef}
            id="name"
            placeholder="名前"
            maxLength={20}
            rows={1}
            pattern={/^[^\n]*$/}
            required={true}
          ></CountableTextArea>
          <CountableTextArea defaultValue={profile.getContent()?.favorite} state={favoriteValueState} id="favorite" placeholder="好きなアーティスト" maxLength={50} rows={2}></CountableTextArea>
          <div className="my-2">
            <PartSelector defaultValue={profile.getContent()?.part} state={partValueState}></PartSelector>
          </div>

          <button type="submit" className=" bg-black text-white w-fit mx-auto py-2 px-4 rounded-full text-xl disabled:bg-secondary" disabled={nameValueState[0].length == 0}>
            更新
          </button>
        </div>
      </form>
    </>
  );
}
ProfileEditor.requireProfile = true;

function PartSelector({ defaultValue = [], state }: { defaultValue?: Array<number>; state: [Array<number>, Dispatch<SetStateAction<Array<number>>>] }) {
  const dramState = useState(false);
  const baseState = useState(false);
  const guiterState = useState(false);
  const melodyState = useState(false);
  useEffect(() => {
    state[1](getPartArray(dramState[0], baseState[0], guiterState[0], melodyState[0]));
  }, [dramState[0], baseState[0], guiterState[0], melodyState[0]]);

  return (
    <>
      <p className="text-lg">担当パート</p>
      {[0, 1, 2, 3].map((value) => {
        <PartItem checked={state[0].includes(value)} partName={indexToPartName(value)} id={indexToPartId(value)} state={dramState} defaultChecked={defaultValue.includes(value)}></PartItem>;
      })}
    </>
  );
}

function PartItem({ partName, id, defaultChecked = false, state }: { defaultChecked?: boolean; partName: string; id: string; checked?: boolean; state: [boolean, Dispatch<SetStateAction<boolean>>] }) {
  const [checked, setChecked] = state;
  useEffect(() => {
    setChecked(defaultChecked);
  }, [defaultChecked]);
  return (
    <div className="flex items-center">
      <label className="relative flex items-center p-2 rounded-full cursor-pointer" htmlFor={id}>
        <input
          type="checkbox"
          className="before:content[''] peer relative h-5 w-5 cursor-pointer appearance-none rounded-md border border-blue-gray-200 transition-all before:absolute before:top-2/4 before:left-2/4 before:block before:h-8 before:w-8 before:-translate-y-2/4 before:-translate-x-2/4 before:rounded-full before:bg-blue-gray-500 before:opacity-0 before:transition-opacity checked:border-gray-900 checked:bg-gray-900 before:bg-gray-900 hover:before:opacity-10"
          id={id}
          name={id}
          checked={checked}
          onChange={(e) => {
            setChecked(e.target.checked);
          }}
        />
        <span className="absolute text-white transition-opacity opacity-0 pointer-events-none top-2/4 left-2/4 -translate-y-2/4 -translate-x-2/4 peer-checked:opacity-100">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor" stroke="currentColor" strokeWidth="1">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
          </svg>
        </span>
      </label>
      <label className="mt-px font-light text-gray-700 cursor-pointer select-none" htmlFor={id}>
        {partName}
      </label>
    </div>
  );
}

function ImageSection({
  profileBlobRef,
  headerBlobRef,
  currentProfileUrl,
  currentHeaderUrl,
}: {
  profileBlobRef: MutableRefObject<Blob | null>;
  headerBlobRef: MutableRefObject<Blob | null>;
  currentProfileUrl: string | null;
  currentHeaderUrl: string | null;
}) {
  const [isProfileImageSelectorVisible, setProfileImageSelectorVisible] = useState(false);
  const [isHeaderImageSelectorVisible, setHeaderImageSelectorVisible] = useState(false);
  const profileImageSrc = useRef<string>("");
  const headerImageSrc = useRef<string>("");

  const profileBlobURL = useMemo(() => {
    if (profileBlobRef.current) {
      return URL.createObjectURL(profileBlobRef.current);
    } else {
      return null;
    }
  }, [profileBlobRef.current]);
  const profileImageURL = profileBlobURL ?? currentProfileUrl;
  const profileImageClickHandler = useCallback(() => {
    showFileChoosePopup("image/png,image/jpeg", (e) => {
      const files = (e.target as HTMLInputElement).files;
      if (files && files[0]) {
        profileImageSrc.current = URL.createObjectURL(files[0])!;
        setProfileImageSelectorVisible(true);
      }
    });
  }, [setProfileImageSelectorVisible]);

  const profileImg = (() => {
    if (profileImageURL) {
      return (
        <>
          <img className="absolute top-[70%] left-5 h-[61%] aspect-[1/1] bg-gray-500 rounded-full" src={profileImageURL}></img>
          <div className="absolute top-[70%] left-5 h-[61%] aspect-[1/1] bg-black bg-opacity-45 rounded-full flex align-middle justify-center cursor-pointer">
            <div className="m-auto w-[40%] aspect-square relative bg-white rounded-full flex align-middle justify-center">
              <img className="w-[50%]" src="/images/camera.svg"></img>
            </div>
          </div>
        </>
      );
    } else {
      return <div className="absolute top-[70%] left-5 h-[61%] aspect-[1/1] bg-gray-500 rounded-full cursor-pointer"></div>;
    }
  })();

  const headerBlobURL = useMemo(() => {
    if (headerBlobRef.current) {
      return URL.createObjectURL(headerBlobRef.current);
    } else {
      return null;
    }
  }, [headerBlobRef.current]);
  const headerImageURL = headerBlobURL ?? currentHeaderUrl;

  const headerImageClickHandler = useCallback(() => {
    showFileChoosePopup("image/png,image/jpeg", (e) => {
      const files = (e.target as HTMLInputElement).files;
      if (files && files[0]) {
        headerImageSrc.current = URL.createObjectURL(files[0])!;
        setHeaderImageSelectorVisible(true);
      }
    });
  }, [setHeaderImageSelectorVisible]);

  const headerImg = (() => {
    if (headerImageURL) {
      return (
        <>
          <img className="w-full aspect-[2.618/1] object-cover bg-gray-300" src={headerImageURL}></img>
          <div className="absolute top-0 w-full aspect-[2.618/1] object-cover  bg-black bg-opacity-45 flex justify-center align-middle cursor-pointer">
            <div className="m-auto h-[40%] aspect-square relative bg-white rounded-full flex align-middle justify-center">
              <img className="w-[50%]" src="/images/camera.svg"></img>
            </div>
          </div>
        </>
      );
    } else {
      return <div className="w-full aspect-[2.618/1] object-cover bg-gray-300"></div>;
    }
  })();
  return (
    <>
      {isProfileImageSelectorVisible ? (
        <ImageCropDialog
          blobRef={profileBlobRef}
          src={profileImageSrc.current}
          setDialogVisible={setProfileImageSelectorVisible}
          exportWidth={DEFAULT_PROFILE_WIDTH}
          exportHeight={DEFAULT_PROFILE_HEIGHT}
          rounded={true}
        ></ImageCropDialog>
      ) : null}
      {isHeaderImageSelectorVisible ? (
        <ImageCropDialog
          blobRef={headerBlobRef}
          src={headerImageSrc.current}
          setDialogVisible={setHeaderImageSelectorVisible}
          exportWidth={DEFAULT_HEADER_WIDTH}
          exportHeight={DEFAULT_HEADER_HEIGHT}
          rounded={false}
        ></ImageCropDialog>
      ) : null}
      <div className="relative w-full flex flex-col">
        <div onClick={headerImageClickHandler}>{headerImg}</div>
        <div onClick={profileImageClickHandler}>{profileImg}</div>
      </div>
    </>
  );
}

function isSame(part1?: Array<number>, part2?: Array<number>) {
  if (!part1 || !part2 || part1.length != part2.length) {
    return false;
  }
  for (var i = 0; i < part1.length; i++) {
    if (part2.indexOf(part1[i]!) == -1) {
      return false;
    }
  }
  return true;
}
