import { AuthStateManager } from "@/components/layout";
import { onAuthStateChanged } from "@/libs/auth";
import { auth } from "@/libs/initialize";
import { Profile, getHeaderImageUrl, getProfile, getProfileImageUrl, onProfileUpdated } from "@/libs/profile";
import { FetchStatus, FetchResult } from "@/libs/utils";
import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { Html } from "next/document";
import Head from "next/head";
import { Dispatch, SetStateAction, useEffect, useState } from "react";

interface MyAppProps {
  Component: {
    onAuthenticated: () => void;
    onNotAuthenticated: () => void;
    requireProfile: boolean;
  };
}

export default function App({ Component, pageProps }: AppProps & MyAppProps) {
  return (
    <>
      <Head>
        <meta charSet="UTF-8" name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>MolodyChain</title>
        <link href="https://fonts.googleapis.com/css2?family=Kaisei+HarunoUmi&family=Train+One&display=swap" rel="stylesheet"></link>
      </Head>
      <AuthStateManager requireProfile={Component.requireProfile} onAuthenticated={Component.onAuthenticated} onNotAuthenticated={Component.onNotAuthenticated}>
        <Component {...pageProps} />
      </AuthStateManager>
    </>
  );
}
