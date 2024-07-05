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

export function useDispatchNotification(): [boolean, (sendNotification: boolean) => void] {
  const [valuse, setValue] = useState(true); //画面再描画のため
  var value = localStorage.getItem("DispatchNotification");
  var bValue = true;
  if (value == "true") {
    bValue = true;
  } else if (value == "false") {
    bValue = false;
  } else {
    bValue = true;
  }
  return [
    bValue,
    (sendNotification: boolean) => {
      setValue(sendNotification);
      localStorage.setItem("DispatchNotification", sendNotification.toString());
    },
  ];
}

export function useComposedNotification(): [boolean, (sendNotification: boolean) => void] {
  const [valuse, setValue] = useState(true); //画面再描画のため
  var value = localStorage.getItem("ComposedNotification");
  var bValue = true;
  if (value == "true") {
    bValue = true;
  } else if (value == "false") {
    bValue = false;
  } else {
    bValue = true;
  }
  return [
    bValue,
    (sendNotification: boolean) => {
      setValue(sendNotification);
      localStorage.setItem("ComposedNotification", sendNotification.toString());
    },
  ];
}
