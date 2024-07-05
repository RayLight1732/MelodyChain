import { AuthStateManager } from "@/components/layout";
import { firebaseApp } from "@/libs/initialize";
import "@/styles/globals.css";
import { getMessaging, onMessage } from "firebase/messaging";
import type { AppProps } from "next/app";
import Head from "next/head";
import { useEffect, useState } from "react";

interface MyAppProps {
  Component: {
    onAuthenticated: () => void;
    onNotAuthenticated: () => void;
    requireProfile: boolean;
    showBackButton: boolean;
  };
}

export default function App({ Component, pageProps }: AppProps & MyAppProps) {
  return (
    <>
      <Head>
        <meta charSet="UTF-8" name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>MolodyChain</title>
      </Head>
      <AuthStateManager
        showBackButton={Component.showBackButton}
        requireProfile={Component.requireProfile}
        onAuthenticated={Component.onAuthenticated}
        onNotAuthenticated={Component.onNotAuthenticated}
      >
        <Component {...pageProps} />
      </AuthStateManager>
    </>
  );
}
