import { auth } from "@/libs/initialize";
import { Profile, getHeaderImageUrlById, getProfileImageUrlById, onProfileUpdated, uploadHeaderImage, uploadProfieImage, uploadProfile } from "@/libs/profile";
import { FetchResult, FetchStatus } from "@/libs/utils";
import { set } from "firebase/database";
import { Dispatch, ReactNode, SetStateAction, createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

const UidContext = createContext<string>("");

const ProfileContext = createContext<FetchResult<Profile>>(FetchResult.getDefaultInstance());

const ProfileImageContext = createContext<[FetchResult<string>, (data: Blob) => Promise<FetchResult<string>>]>([FetchResult.getDefaultInstance(), async (data) => FetchResult.getDefaultInstance()]);

const HeaderImageContext = createContext<[FetchResult<string>, (data: Blob) => Promise<FetchResult<string>>]>([FetchResult.getDefaultInstance(), async (data) => FetchResult.getDefaultInstance()]);

export function UidContextProvider({ uid, children }: { uid: string; children?: ReactNode }) {
  return <UidContext.Provider value={uid}>{children}</UidContext.Provider>;
}

export function ProfileContextProvider({ uid, children }: { uid: string; children?: ReactNode }) {
  const [profile, setProfile] = useState<FetchResult<Profile>>(FetchResult.getDefaultInstance());
  useEffect(() => {
    const unsubscribe = onProfileUpdated(
      uid,
      (profile) => {
        setProfile(new FetchResult(FetchStatus.SUCCESS, profile));
        console.log("set profile");
      },
      (error) => {
        console.error(error.message);
        setProfile(new FetchResult<Profile>(FetchStatus.ERROR, null));
      }
    );
    return unsubscribe;
  }, [uid]);
  return <ProfileContext.Provider value={profile}>{children}</ProfileContext.Provider>;
}

export function ProfileImageContextProvider({ uid, children }: { uid: string; children?: ReactNode }) {
  const [profileImage, setProfileImage] = useState<FetchResult<string>>(FetchResult.getDefaultInstance());
  useEffect(() => {
    let ignore = false;
    getProfileImageUrlById(uid)
      .then((result) => {
        if (!ignore) {
          setProfileImage(new FetchResult(FetchStatus.SUCCESS, result));
        }
      })
      .catch((e) => {
        if (!ignore) {
          console.error(e);
          setProfileImage(new FetchResult<string>(FetchStatus.ERROR, null));
        }
      });
    return () => {
      ignore = true;
    };
  }, [uid]);
  const setter = useImageSetter(uid, setProfileImage, uploadProfieImage);
  return <ProfileImageContext.Provider value={[profileImage, setter]}>{children}</ProfileImageContext.Provider>;
}

export function HeaderImageContextProvider({ uid, children }: { uid: string; children?: ReactNode }) {
  const [headerImage, setHeaderImage] = useState<FetchResult<string>>(FetchResult.getDefaultInstance());
  useEffect(() => {
    let ignore = false;
    getHeaderImageUrlById(uid)
      .then((result) => {
        if (!ignore) {
          setHeaderImage(new FetchResult(FetchStatus.SUCCESS, result));
        }
      })
      .catch((e) => {
        console.error(e);
        if (!ignore) {
          setHeaderImage(new FetchResult<string>(FetchStatus.ERROR, null));
        }
      });
    return () => {
      ignore = true;
    };
  }, [uid]);
  const setter = useImageSetter(uid, setHeaderImage, uploadHeaderImage);
  return <HeaderImageContext.Provider value={[headerImage, setter]}>{children}</HeaderImageContext.Provider>;
}

function useImageSetter(uid: string, stateSetter: (value: SetStateAction<FetchResult<string>>) => void, uploader: (uid: string, data: Blob) => Promise<void>) {
  return useCallback(
    async (data: Blob) => {
      return await uploader(uid, data)
        .then(() => {
          const result = new FetchResult(FetchStatus.SUCCESS, URL.createObjectURL(data));
          stateSetter(new FetchResult(FetchStatus.SUCCESS, URL.createObjectURL(data)));
          return result;
        })
        .catch((e) => {
          console.error(e);
          return new FetchResult<string>(FetchStatus.ERROR, null);
        });
    },
    [uid]
  );
}

export function useMyUid() {
  return useContext(UidContext);
}

export function useMyProfile(): [FetchResult<Profile>, (name: string, favorite: string, part: Array<number>) => Promise<void>] {
  const profile = useContext(ProfileContext);
  return [profile, uploadProfile];
}

export function useMyProfileImage() {
  return useContext(ProfileImageContext);
}

export function useMyHeaderImage() {
  return useContext(HeaderImageContext);
}

function fetchImage<T>(uid: string, getter: (uid: string) => Promise<T | null>, setState: Dispatch<SetStateAction<FetchResult<T>>>) {
  getter(uid)
    .then((result) => {
      setState(new FetchResult<T>(FetchStatus.SUCCESS, result));
    })
    .catch((e) => {
      console.error(e);
      setState(new FetchResult<T>(FetchStatus.ERROR, null));
    });
}
