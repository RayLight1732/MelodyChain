import { onAuthStateChanged, signOut } from "@/libs/auth";
import React, { ReactNode, useEffect, useMemo, useState } from "react";
import Login from "./login";
import { Loading } from "./loading";
import Link from "next/link";
import { auth } from "@/libs/initialize";
import { useMyProfile, useMyProfileImage } from "./profile";
import dynamic from "next/dynamic";

export function Header() {
  const [profile] = useMyProfile();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <header className="flex justify-between items-center px-5 py-2.5 border-b-2 divide-solid border-accent bg-primary z-50">
      <div
        className="logo left-logo cursor-pointer"
        onClick={() => {
          setSidebarOpen(true);
        }}
      >
        <img src="/images/logo_small.png" alt="" className="w-[60px] h-[60px]" />
      </div>
      <div className="logo right-logo">
        <img src="/images/bell.png" alt="" />
      </div>
      <div
        className={`top-0 left-0 h-full w-full absolute bg-black/40 z-50 transition-opacity duration-300 ${sidebarOpen ? "opacity-100" : "opacity-0 pointer-events-none"}`}
        onClick={() => {
          setSidebarOpen(false);
        }}
      >
        <div className={`h-full bg-primary transition-transform duration-300 transform ${sidebarOpen ? "translate-x-0 w-48" : "-translate-x-full w-0"}`}>
          <div className="px-1 py-2.5 space-y-3">
            <p className="mx-5 text-xl font-semibold">{profile.getContent()?.name}</p>
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
    </header>
  );
}

export function Footer() {
  const profileURL: string = useMyProfileImage()[0].getContent() ?? "/images/tmp-profile.png";
  return (
    <footer className="grid grid-cols-3 px-5 py-2.5 border-t-2 divide-solid border-accent bg-primary z-40">
      <div>
        <Link href="/top" className="text-center flex justify-center h-full">
          <img src="/images/home.svg" className="w-[35px] h-[35px] m-auto block" alt="top" />
        </Link>
      </div>
      <div>
        <Link href="/music">
          <img src="/images/headphones.png" className="w-[45px] h-[45px] m-auto" alt="detail" />
        </Link>
      </div>
      <div>
        <Link href={`/profile/${auth.currentUser?.uid}`}>
          <img src={profileURL} className="w-[45px] h-[45px] rounded-full m-auto" alt="profile" />
        </Link>
      </div>
    </footer>
  );
}

const DataProvider = dynamic(() => import("./dataProvider"), {
  loading: () => <p>Loading...</p>,
});

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
      <DataProvider loadingComponent={loadingComponent} requireProfile={requireProfile} uid={auth.currentUser!.uid}>
        {children}
      </DataProvider>
    );
  } else if (authState == 2) {
    return <Login />;
  } else {
    return <h1>error</h1>;
  }
}
