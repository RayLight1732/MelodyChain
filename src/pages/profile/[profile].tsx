import { GoodHistory, InvolvedMusic, JumpableMusicPreview } from "@/components/music";
import { useMyHeaderImage, useMyProfile, useMyProfileImage, useMyUid } from "@/components/profile";
import { Panel } from "@/components/utlis";
import { useGoodHistory } from "@/hooks/music";
import { useHeaderImage, useProfile, useProfileImage } from "@/hooks/profile";
import { Music, getInvolvedMusic } from "@/libs/music";
import { Profile } from "@/libs/profile";
import { indexToPartName, numPartToBoolPart } from "@/libs/utils";
import Head from "next/head";
import { useRouter } from "next/router";
import React, { ReactElement, useEffect, useMemo, useState } from "react";

export default function ProfileView() {
  const router = useRouter();
  const uidFromURL = router.query.profile as string;
  const uid = useMyUid();
  if (uid === uidFromURL) {
    return (
      <>
        <Head>
          <title>MelodyChain-プロフィール</title>
        </Head>
        <MyProfileView></MyProfileView>
      </>
    );
  } else {
    return (
      <>
        <Head>
          <title>MelodyChain-プロフィール</title>
        </Head>
        <OtherProfileView uid={uidFromURL}></OtherProfileView>
      </>
    );
  }
}

ProfileView.showBackButton = true;

function MyProfileView() {
  const [profile, setProfile] = useMyProfile();
  const [profileImage, setProfileImage] = useMyProfileImage();
  const [headerImage, setHeaderImage] = useMyHeaderImage();
  return <ProfileComponent isMypage={true} profile={profile.getContent()} imageURL={profileImage.getContent()} headerURL={headerImage.getContent()}></ProfileComponent>;
}

function OtherProfileView({ uid }: { uid: string }) {
  const { data, error, isLoading } = useProfile(uid);
  if (data === null) {
    return <h1>存在しないユーザーです:{uid}</h1>;
  } else if (data === undefined) {
    return <ProfileComponent isMypage={false} />;
  } else {
    return <ProfileWithImagesLoader profile={data} />;
  }
}

function ProfileWithImagesLoader({ profile }: { profile: Profile }) {
  const { data: imageURL, error: imageError } = useProfileImage(profile);
  const { data: headerURL, error: headerError } = useHeaderImage(profile);
  return <ProfileComponent isMypage={false} profile={profile} imageURL={imageURL} headerURL={headerURL} />;
}

function HeaderImage({ imageURL }: { imageURL: string | null | undefined }) {
  if (imageURL) {
    return <img className="w-full aspect-[2.618/1] object-cover bg-gray-300" src={imageURL}></img>;
  } else {
    return (
      <>
        <div className="w-full aspect-[2.618/1] object-cover bg-gray-300"></div>
      </>
    );
  }
}

function ProfileImage({ imageURL }: { imageURL: string | null | undefined }) {
  if (imageURL) {
    return <img className="absolute top-[70%] left-5 h-[61%] aspect-[1/1] bg-gray-500 rounded-full" src={imageURL}></img>;
  } else {
    return <div className="absolute top-[70%] left-5 h-[61%] aspect-[1/1] bg-gray-500 rounded-full"></div>;
  }
}

function ProfileComponent({
  profile,
  imageURL,
  headerURL,
  isMypage,
}: {
  profile?: Profile | undefined | null;
  imageURL?: string | undefined | null;
  headerURL?: string | undefined | null;
  isMypage: boolean;
}) {
  const router = useRouter();

  return (
    <>
      <div className="relative w-full flex flex-col">
        <HeaderImage imageURL={headerURL}></HeaderImage>
        <ProfileImage imageURL={imageURL}></ProfileImage>
      </div>
      <div className="w-full aspect-[2.618/0.305] flex flex-wrap">
        <div className="w-20 h-10 flex-grow"></div>
        {isMypage && (
          <p className=" my-auto mx-5 px-3 py-1 text font-bold break-words border rounded-full border-accent cursor-pointer hover:bg-hsecondary" onClick={() => router.push("/settings/profile")}>
            プロフィールを編集
          </p>
        )}
      </div>
      <div className="my-1 mx-5">
        <p className="text-3xl font-bold break-words">{profile?.name}</p>
        <div className="mx-1 my-4">
          <p>好きなアーティスト</p>
          <p className="ml-3 mt-1 break-words">{profile?.favorite}</p>
          <p className="mx-1 mt-4">担当パート</p>
          <ul className="ml-3 mt-1">
            <PartDisplay profile={profile} />
          </ul>
        </div>
      </div>
      <div className="my-6 mx-4">
        <div className=" border-secondary border rounded-md">
          <Panel
            selectors={["過去の作品", "いいね"]}
            nodes={[
              <div key="過去の作品">{profile ? <InvolvedMusic uid={profile.getUid()}></InvolvedMusic> : null}</div>,
              <div key="いいね">{profile ? <GoodHistory uid={profile.getUid()}></GoodHistory> : null}</div>,
            ]}
          ></Panel>
        </div>
      </div>
    </>
  );
}

function PartDisplay({ profile }: { profile?: Profile | null }) {
  if (profile) {
    return numPartToBoolPart(profile.part).map((playPart, index) => {
      if (playPart) {
        return <li key={index}>{indexToPartName(index)}</li>;
      } else {
        return <></>;
      }
    });
  } else {
    return <></>;
  }
}
