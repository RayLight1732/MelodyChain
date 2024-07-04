import { Notification, subscribeNotification } from "@/libs/notification";
import { ReactNode, createContext, useContext, useEffect, useState } from "react";

const notificationContext = createContext<Notification[]>([]);

export function NotificationContextProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  useEffect(() => {
    return subscribeNotification((newNotifications) => {
      setNotifications(newNotifications);
      console.log("set notification");
    });
  }, []);

  return <notificationContext.Provider value={notifications}>{children}</notificationContext.Provider>;
}

export function useNotifications() {
  return useContext(notificationContext);
}
