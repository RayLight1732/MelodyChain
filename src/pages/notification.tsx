import { useNotifications } from "@/hooks/notificationProvider";
import { Notification, getLastWatchTime, updateLastWatchTime } from "@/libs/notification";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";

export default function NotificationPage() {
  const [lastWatch, setLastWatch] = useState<Date | null | undefined>(undefined);
  useEffect(() => {
    var ignore = false;
    const f = async () => {
      const lastWatch = await getLastWatchTime();
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
    <div className="px-2 py-1">
      {notifications.map((n) => (
        <NotificationViewer notification={n} isNew={isNew(n, lastWatch)} key={n.id}></NotificationViewer>
      ))}
    </div>
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
  const router = useRouter();
  return (
    <div
      className="w-full border-secondary border border-x-0 border-t-0 px-6 py-3 hover:bg-hprimary cursor-pointer transition-colors duration-75"
      onClick={() => {
        if (notification.link) {
          router.push(notification.link);
        }
      }}
    >
      <p className="text-lg font-normal mb-2">{notification.title}</p>
      <p className="pl-1 text-accent whitespace-pre-wrap">{notification.body}</p>
      <p className=" text-right pl-1 text-accent">{notification.date.toLocaleString()}</p>
    </div>
  );
}
