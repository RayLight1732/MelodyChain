import { FetchStatus } from "@/libs/utils";
import { HeaderImageContextProvider, ProfileContextProvider, ProfileImageContextProvider, UidContextProvider, useMyHeaderImage, useMyProfile, useMyProfileImage } from "./profile";
import { Footer, Header } from "./layout";
import { ReactNode, useEffect, useRef, useState } from "react";
import { AudioContextProvider } from "@/hooks/context";
import { ScrollHostoryContextProvider } from "@/hooks/scroll";
import { CountercacheContextProvider, MusicCacheMapContextProvider } from "@/hooks/music";
import { FCMTokenContextProvider } from "@/hooks/fcmToken";
import { NotificationContextProvider } from "@/hooks/notificationProvider";
import ProfileEditor from "@/pages/settings/profile";

export default function DataProvider({
  uid,
  requireProfile,
  loadingComponent,
  children,
  showBackButton = false,
}: {
  uid: string;
  requireProfile: boolean;
  loadingComponent: ReactNode;
  children: ReactNode;
  showBackButton?: boolean;
}) {
  const scrollOriginRef = useRef<HTMLDivElement | null>(null);
  return (
    <AudioContextProvider>
      <UidContextProvider uid={uid}>
        <ProfileContextProvider uid={uid}>
          <ProfileImageContextProvider uid={uid}>
            <HeaderImageContextProvider uid={uid}>
              <MusicCacheMapContextProvider>
                <ScrollHostoryContextProvider scrollOriginRef={scrollOriginRef}>
                  <ProfileLoadObserver requireProfile={requireProfile} loadingComponent={loadingComponent}>
                    <FCMTokenContextProvider>
                      <CountercacheContextProvider>
                        <NotificationContextProvider>
                          <ProfileLoadObserver requireProfile={requireProfile} loadingComponent={loadingComponent}>
                            <div className="bg-primary flex flex-col w-screen max-w-[30rem] mx-auto h-[100dvh]">
                              <Header showBackButton={showBackButton}></Header>
                              <div ref={scrollOriginRef} className="flex-grow overflow-y-auto w-screen max-w-[30rem]" id="container">
                                {children}
                              </div>
                              <Footer></Footer>
                            </div>
                          </ProfileLoadObserver>
                        </NotificationContextProvider>
                      </CountercacheContextProvider>
                    </FCMTokenContextProvider>
                  </ProfileLoadObserver>
                </ScrollHostoryContextProvider>
              </MusicCacheMapContextProvider>
            </HeaderImageContextProvider>
          </ProfileImageContextProvider>
        </ProfileContextProvider>
      </UidContextProvider>
    </AudioContextProvider>
  );
}

/**
 * 自分のプロフィールが読み込まれているかを監視する
 * 読み込まれていなかった場合、ローディング画面を表示する
 * @param param0
 * @returns
 */
function ProfileLoadObserver({ requireProfile, loadingComponent, children }: { requireProfile: boolean; loadingComponent: ReactNode; children: ReactNode }) {
  const [myProfile] = useMyProfile();
  const [myProfileImage] = useMyProfileImage();
  const [myHeaderImage] = useMyHeaderImage();
  if (myProfile.getState() == FetchStatus.SUCCESS && myProfile.getContent() == null) {
    return (
      <div className="bg-primary flex flex-col w-screen max-w-[30rem] mx-auto h-[100dvh]">
        <ProfileEditor></ProfileEditor>
      </div>
    );
  } else if (myProfile.getState() == FetchStatus.INIT || myProfileImage.getState() == FetchStatus.INIT || myHeaderImage.getState() == FetchStatus.INIT) {
    return loadingComponent;
  } else {
    return children;
  }
}
