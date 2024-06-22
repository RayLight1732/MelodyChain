import { onAuthStateChanged } from "@/libs/auth";
import React, { Dispatch, ReactNode, createContext, useContext, useEffect, useMemo, useState } from "react";
import Login from "./login";
import { Loading } from "./loading";
import Link from "next/link";
import { auth } from "@/libs/initialize";
import { Profile, getHeaderImageUrlById, getProfileImageUrlById, onProfileUpdated } from "@/libs/profile";
import { FetchResult, FetchStatus } from "@/libs/utils";
import { HeaderImageContextProvider, ProfileContextProvider, ProfileImageContextProvider, UidContextProvider, useMyHeaderImage, useMyProfile, useMyProfileImage } from "./profile";

export function Header() {
  return (
    <header className="flex justify-between items-center px-5 py-2.5 border-b-2 divide-solid border-secondary bg-white z-40">
      <div className="logo left-logo">
        <img src="/images/logo.png" alt="" className="w-[90px] h-auto" />
      </div>
      <div className="logo right-logo">
        <img src="/images/bell.png" alt="" />
      </div>
    </header>
  );
}

export function Footer() {
  const profileURL: string = useMyProfileImage()[0].getContent() ?? "/images/tmp-profile.png";
  return (
    <footer className="flex justify-between items-center px-5 py-2.5 border-t-2 divide-solid border-secondary bg-white z-40">
      <div>
        <Link href="/top">
          <img src="/images/home.png" alt="top" />
        </Link>
      </div>
      <div>
        <Link href="/music">
          <img src="/images/headphones.png" alt="detail" />
        </Link>
      </div>
      <div>
        <Link href={`/profile/${auth.currentUser?.uid}`}>
          <img src={profileURL} className="w-[65px] h-[65px] rounded-full" alt="profile" />
        </Link>
      </div>
    </footer>
  );
}

export function AuthStateManager({
  onAuthenticated,
  onNotAuthenticated,
  requireProfile = false,
  children,
}: {
  onAuthenticated?: () => void;
  onNotAuthenticated?: () => void;
  requireProfile?: boolean;
  children: ReactNode;
}) {
  //authState:0->init
  //authState:1->logined
  //authState:2->not logined
  const [authState, setAuthState] = useState<number>(0);

  useEffect(() => {
    console.log("on auth state changed");
    const unsubscribe = onAuthStateChanged(
      () => {
        setAuthState(1);
        if (onAuthenticated) {
          onAuthenticated();
        }
      },
      () => {
        setAuthState(2);
        if (onNotAuthenticated) {
          onNotAuthenticated();
        }
      }
    );

    return () => {
      console.log("cleanup");
      unsubscribe();
    };
  }, []);
  const loadingComponent = useMemo(() => <Loading />, []);
  if (authState == 0) {
    return loadingComponent;
  } else if (authState == 1) {
    return (
      <ProfileProvider loadingComponent={loadingComponent} requireProfile={requireProfile} uid={auth.currentUser!.uid}>
        {children}
      </ProfileProvider>
    );
  } else if (authState == 2) {
    return <Login />;
  } else {
    return <h1>error</h1>;
  }
}

export const audioContextProvider = createContext<AudioContext | null>(null);
//TODO フックにまとめる
function ProfileProvider({ uid, requireProfile, loadingComponent, children }: { uid: string; requireProfile: boolean; loadingComponent: ReactNode; children: ReactNode }) {
  const [audioContext] = useState(new AudioContext());
  useEffect(() => {
    const eventName = typeof document.ontouchend !== "undefined" ? "touchend" : "mouseup";
    document.addEventListener(eventName, initAudioContext);
    function initAudioContext() {
      document.removeEventListener(eventName, initAudioContext);
      // wake up AudioContext
      audioContext.resume();
      console.log("resume");
    }
    return () => {
      document.removeEventListener(eventName, initAudioContext);
    };
  });

  return (
    <audioContextProvider.Provider value={audioContext}>
      <UidContextProvider uid={uid}>
        <ProfileContextProvider uid={uid}>
          <ProfileImageContextProvider uid={uid}>
            <HeaderImageContextProvider uid={uid}>
              <ProfileLoadObserver requireProfile={requireProfile} loadingComponent={loadingComponent}>
                <div className="flex flex-col w-screen h-screen">
                  <Header></Header>
                  <div className="flex-grow overflow-y-auto w-screen" id="container">
                    {children}
                  </div>
                  <Footer></Footer>
                </div>
              </ProfileLoadObserver>
            </HeaderImageContextProvider>
          </ProfileImageContextProvider>
        </ProfileContextProvider>
      </UidContextProvider>
    </audioContextProvider.Provider>
  );
}

function ProfileLoadObserver({ requireProfile, loadingComponent, children }: { requireProfile: boolean; loadingComponent: ReactNode; children: ReactNode }) {
  const [myProfile] = useMyProfile();
  const [myProfileImage] = useMyProfileImage();
  const [myHeaderImage] = useMyHeaderImage();

  if (requireProfile) {
    if (myProfile.getState() == FetchStatus.INIT || myProfileImage.getState() == FetchStatus.INIT || myHeaderImage.getState() == FetchStatus.INIT) {
      return loadingComponent;
    } else {
      return children;
    }
  } else {
    return children;
  }
}
