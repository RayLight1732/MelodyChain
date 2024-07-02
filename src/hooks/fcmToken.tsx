import { getFCMToken, registerToken } from "@/libs/messaging";
import { ReactNode, createContext, useCallback, useContext, useEffect, useState } from "react";

const fcmTokenContext = createContext({ token: "", permissionStatus: "", request: () => {} });

export function FCMTokenContextProvider({ uid, children }: { uid: string; children: ReactNode }) {
  const [token, setToken] = useState("");
  const [permissionStatus, setNotificationPermissionStatus] = useState(Notification.permission);
  const request = useCallback(() => {
    Notification.requestPermission().then(setNotificationPermissionStatus);
  }, []);
  useEffect(() => {
    const retrieveToken = async () => {
      try {
        if (typeof window !== "undefined" && "serviceWorker" in navigator) {
          if (permissionStatus === "granted") {
            const currentToken = await getFCMToken();
            if (currentToken) {
              setToken(currentToken);
              registerToken(currentToken);
            } else {
              console.log("No registration token available. Request permission to generate one.");
            }
          }
        }
      } catch (error) {
        console.log("Error retrieving token:", error);
      }
    };

    retrieveToken();
  }, [permissionStatus]);

  return <fcmTokenContext.Provider value={{ token, permissionStatus, request }}>{children}</fcmTokenContext.Provider>;
}

export function useFcmToken(): { token: string; permissionStatus: string; request: () => void } {
  return useContext(fcmTokenContext);
}
