import { onAuthStateChanged } from "@/libs/auth";
import React, { ReactNode, useEffect, useMemo, useState } from "react";
import Login from "./login";
import { Loading } from "./loading";
import Link from "next/link";
import { auth } from "@/libs/initialize";
import { useMyProfileImage } from "./profile";
import dynamic from "next/dynamic";

export function Header() {
  return (
    <header className="flex justify-between items-center px-5 py-2.5 border-b-2 divide-solid border-secondary bg-white z-40">
      <div className="logo left-logo">
        <img src="/images/logo_small.png" alt="" className="w-[90px] h-auto" />
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
