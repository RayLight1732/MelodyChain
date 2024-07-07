import { onAuthStateChanged, signOut } from "@/libs/auth";
import React, { Dispatch, ReactNode, SetStateAction, useEffect, useMemo, useRef, useState } from "react";
import Login from "./login";
import { Loading } from "./loading";
import Link from "next/link";
import { auth } from "@/libs/initialize";
import { useMyProfile, useMyProfileImage, useMyUid } from "./profile";
import dynamic from "next/dynamic";
import { Profile } from "@/libs/profile";
import { useNotifications } from "@/hooks/notificationProvider";
import { subscribeLastWatchTime } from "@/libs/notification";
import { useRouter } from "next/router";
import { list } from "postcss";
import DataProvider from "./dataProvider";

export function Header({ showBackButton = false }: { showBackButton?: boolean }) {
  const uid = useMyUid();
  const [profile] = useMyProfile();
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const notifications = useNotifications();
  const [newNotisCount, setNewNotisCount] = useState(0);
  const [lastWatchTime, setLastWatchTime] = useState<Date | null | undefined>();

  const router = useRouter();

  useEffect(() => {
    return subscribeLastWatchTime((date) => {
      setLastWatchTime(date);
      console.log("set last watch time", date);
    });
  }, []);

  useEffect(() => {
    console.log("lastWatchTime", lastWatchTime);
    if (lastWatchTime) {
      const newNotifications = notifications.filter((it) => it.date > lastWatchTime);
      setNewNotisCount(newNotifications.length);
    } else if (lastWatchTime === null) {
      setNewNotisCount(notifications.length);
    }
  }, [lastWatchTime, notifications]);

  return (
    <header className="border-b-2 divide-solid border-accent z-50">
      <div className="flex justify-between items-center px-5 py-2.5 bg-primary">
        <div
          className="cursor-pointer"
          onClick={() => {
            setSidebarOpen(true);
          }}
        >
          <img src="/images/logo_small.png" alt="" className="w-[60px] h-[60px]" />
        </div>
        <div className="relative cursor-pointer">
          <img
            src="/images/bell.png"
            alt=""
            onClick={() => {
              router.push("/notification");
            }}
          />
          {newNotisCount != 0 ? (
            <div className="outline outline-2 outline-primary bg-[#ef5350] rounded-full absolute bottom-0 right-0 w-5 h-5 flex items-center justify-center transform translate-x-1/2 translate-y-1/2 ">
              <p className="text-sm text-primary">{newNotisCount}</p>
            </div>
          ) : null}
        </div>
      </div>
      <Sidebar setSidebarOpen={setSidebarOpen} isSidebarOpen={isSidebarOpen} profile={profile.getContent()}></Sidebar>
      {showBackButton ? <BackButton isFirstTime={false}></BackButton> : null}
    </header>
  );
}

function Sidebar({ setSidebarOpen, isSidebarOpen, profile }: { profile: Profile | null; isSidebarOpen: boolean; setSidebarOpen: Dispatch<SetStateAction<boolean>> }) {
  const rounter = useRouter();
  return (
    <div
      className={`top-0 left-0 h-full w-full absolute bg-black/40 z-50 transition-opacity duration-300 ${isSidebarOpen ? "opacity-100" : "opacity-0 pointer-events-none"}`}
      onClick={() => {
        setSidebarOpen(false);
      }}
    >
      <div className={`h-full bg-primary transition-transform duration-300 transform ${isSidebarOpen ? "translate-x-0 w-48" : "-translate-x-full w-0"}`}>
        <div className="px-1 py-2.5 space-y-3">
          <p className="mx-5 text-xl font-semibold">{profile?.name}</p>

          {/* <button
            className="font-semibold hover:bg-hsecondary w-full text-left px-6 py-1 rounded-md"
            onClick={() => {
              rounter.push("/settings");
            }}
          >
            設定
          </button> */}
          <button
            className="font-semibold hover:bg-hsecondary w-full text-left px-6 py-1 rounded-md"
            onClick={() => {
              signOut();
            }}
          >
            ログアウト
          </button>
        </div>
      </div>
    </div>
  );
}

function BackButton({ isFirstTime }: { isFirstTime: boolean }) {
  const router = useRouter();

  return (
    <div className="w-full border-t-2 border-secondary pl-1">
      <div
        className="rounded-full w-10 h-10 hover:bg-hprimary relative cursor-pointer"
        onClick={() => {
          if (isFirstTime) {
            router.push("/");
          } else {
            router.back();
          }
        }}
      >
        <div className="bg-back w-10 h-10 absolute -translate-x-[1px] blur-0"></div>
      </div>
    </div>
  );
}

export function Footer() {
  const profileURL: string = useMyProfileImage()[0].getContent() ?? "/images/tmp-profile.png";
  const uid = useMyUid();
  const router = useRouter();
  const uidFromURL = router.query.profile as string;
  console.log(router.asPath);
  return (
    <footer className="grid grid-cols-3 px-5 py-2.5 border-t-2 divide-solid border-accent bg-primary z-40">
      <div className={router.asPath == "/top" ? "bg-hsecondary rounded-full" : ""}>
        <Link href="/top" className="text-center flex justify-center h-full">
          <img src="/images/home.svg" className="w-[35px] h-[35px] m-auto block" alt="top" />
        </Link>
      </div>
      <div className={router.asPath == "/music" ? "bg-hsecondary rounded-full" : ""}>
        <Link href="/music">
          <img src="/images/headphones.png" className="w-[45px] h-[45px] m-auto" alt="detail" />
        </Link>
      </div>
      <div className={uidFromURL == uid ? "bg-hsecondary rounded-full" : ""}>
        <Link href={`/profile/${auth.currentUser?.uid}`}>
          <img src={profileURL} className="w-[45px] h-[45px] rounded-full m-auto" alt="profile" />
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
  showBackButton = false,
}: {
  onAuthenticated?: () => void;
  onNotAuthenticated?: () => void;
  requireProfile?: boolean;
  children: ReactNode;
  showBackButton?: boolean;
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
      <DataProvider showBackButton={showBackButton} loadingComponent={loadingComponent} requireProfile={requireProfile} uid={auth.currentUser!.uid}>
        {children}
      </DataProvider>
    );
  } else if (authState == 2) {
    return <Login />;
  } else {
    return <h1>error</h1>;
  }
}
