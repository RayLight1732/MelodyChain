import { useRouter } from "next/router";
import React, { FC, ReactElement, ReactNode } from "react";

export default function Home() {
  const router = useRouter();
  router.push("/top");
}

Home.onAuthenticated = () => {
  console.log("on authenticated");
};

Home.onNotAuthenticated = () => {
  console.log("on not authenticated");
};
