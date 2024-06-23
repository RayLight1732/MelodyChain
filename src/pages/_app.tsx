import { AuthStateManager } from "@/components/layout";
import "@/styles/globals.css";
import type { AppProps } from "next/app";
import Head from "next/head";

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
      </Head>
      <AuthStateManager requireProfile={Component.requireProfile} onAuthenticated={Component.onAuthenticated} onNotAuthenticated={Component.onNotAuthenticated}>
        <Component {...pageProps} />
      </AuthStateManager>
    </>
  );
}
