import { Profile, getHeaderImageUrlById, getProfile, getProfileImageUrlById } from "@/libs/profile";
import useSWR from "swr";

export function useProfile(uid: string) {
  return useSWR(`user/${uid}/profile`, async (arg: string) => {
    return await getProfile(uid);
  });
}

export function useProfileImage(profile: Profile) {
  return useProfileImageById(profile.getUid());
}

export function useProfileImageById(uid: string | null | undefined) {
  return useSWR(uid ? `user/${uid}/profile/image` : null, async (arg: string) => {
    return await getProfileImageUrlById(uid!);
  });
}

export function useHeaderImage(profile: Profile) {
  return useSWR(`user/${profile.getUid()}/profile/header`, async (arg: string) => {
    return await getHeaderImageUrlById(profile.getUid());
  });
}

export function useHeaderImageById(uid: string | null | undefined) {
  return useSWR(uid ? `user/${uid}/profile/header` : null, async (arg: string) => {
    return await getHeaderImageUrlById(uid!);
  });
}
