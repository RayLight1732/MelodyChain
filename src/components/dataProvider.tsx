import { FetchStatus } from "@/libs/utils";
import { HeaderImageContextProvider, ProfileContextProvider, ProfileImageContextProvider, UidContextProvider, useMyHeaderImage, useMyProfile, useMyProfileImage } from "./profile";
import { Footer, Header } from "./layout";
import { ReactNode, useEffect, useState } from "react";
import { AudioContextProvider } from "@/hooks/context";

export default function DataProvider({ uid, requireProfile, loadingComponent, children }: { uid: string; requireProfile: boolean; loadingComponent: ReactNode; children: ReactNode }) {
  return (
    <AudioContextProvider>
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
    </AudioContextProvider>
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
