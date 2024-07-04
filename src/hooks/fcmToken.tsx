import { getFCMToken, registerToken } from "@/libs/messaging";
import { ReactNode, createContext, useCallback, useContext, useEffect, useState } from "react";

const fcmTokenContext = createContext({ token: "", permissionStatus: "", request: () => {} });

export function FCMTokenContextProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState("");
  const [permissionStatus, setNotificationPermissionStatus] = useState(Notification.permission);
  const request = useCallback(() => {
    Notification.requestPermission().then(setNotificationPermissionStatus);
  }, []);
  useEffect(() => {
    var ignore = false;
    const retrieveToken = async () => {
      try {
        if (typeof window !== "undefined" && "serviceWorker" in navigator) {
          console.log("permissionStatus", permissionStatus);
          if (permissionStatus === "granted") {
            const currentToken = await getFCMToken();
            if (!ignore) {
              if (currentToken) {
                console.log("set token");
                setToken(currentToken);
                registerToken(currentToken);
              } else {
                console.log("No registration token available. Request permission to generate one.");
              }
            }
          }
        }
      } catch (error) {
        console.log("Error retrieving token:", error);
      }
    };

    retrieveToken();
    return () => {
      ignore = true;
    };
  }, [permissionStatus]);

  return <fcmTokenContext.Provider value={{ token, permissionStatus, request }}>{children}</fcmTokenContext.Provider>;
}

export function useFcmToken(): { token: string; permissionStatus: string; request: () => void } {
  return useContext(fcmTokenContext);
}
