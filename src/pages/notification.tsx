import { useNotifications } from "@/hooks/notificationProvider";
import { Notification, getLastWatchTime, updateLastWatchTime } from "@/libs/notification";
import { useEffect, useState } from "react";

export default function NotificationPage() {
  const [lastWatch, setLastWatch] = useState<Date | null | undefined>(undefined);
  useEffect(() => {
    var ignore = false;
    const f = async () => {
      const lastWatch = await getLastWatchTime();
      setLastWatch(lastWatch);
      if (!ignore) {
        setLastWatch(lastWatch);
        updateLastWatchTime();
      }
    };
    f();
    return () => {
      ignore = true;
    };
  }, []);
  const notifications = useNotifications();

  return (
    <>
      {notifications.map((n) => (
        <NotificationViewer notification={n} isNew={isNew(n, lastWatch)} key={n.id}></NotificationViewer>
      ))}
    </>
  );
}

function isNew(notification: Notification, lastWatch: Date | null | undefined): boolean {
  if (lastWatch === undefined) {
    return false;
  } else if (lastWatch === null) {
    return true;
  } else {
    return notification.date > lastWatch;
  }
}

function NotificationViewer({ notification, isNew }: { notification: Notification; isNew: boolean }) {
  return (
    <div className="w-full">
      <h1>{notification.title}</h1>
      <p>{notification.body}</p>
    </div>
  );
}
