import { useFcmToken } from "@/hooks/fcmToken";
import { useComposedNotification, useDispatchNotification, useNotifications } from "@/hooks/notificationProvider";
import { useState } from "react";

export default function Settings() {
  return (
    <div className="m-6">
      <p className="text-2xl font-bold my-2">設定</p>
      <NotificationPanel></NotificationPanel>
    </div>
  );
}

function NotificationPanel() {
  const { permissionStatus, request } = useFcmToken();
  return (
    <div className="p-6  border-secondary border-t-2">
      <div className=" text-xl font-bold">プッシュ通知</div>
      {(() => {
        if (permissionStatus == "granted") {
          return (
            <>
              <DispatchNotification></DispatchNotification>
              <ComposedNotification></ComposedNotification>
            </>
          );
        } else if (permissionStatus == "denied") {
          return <p className="m-2">デバイス/ブラウザの設定から通知をオンにしてください</p>;
        } else {
          return (
            <p
              className="m-2 underline text-[#0000ee] cursor-pointer"
              onClick={() => {
                request();
              }}
            >
              通知をオンにする
            </p>
          );
        }
      })()}
    </div>
  );
}

function DispatchNotification() {
  const [send, setSend] = useDispatchNotification();
  return (
    <div className="flex items-center">
      <label className="relative flex items-center p-2 rounded-full cursor-pointer" htmlFor={"dispatch"}>
        <input
          id="dispatch"
          type="checkbox"
          className="before:content[''] peer relative h-5 w-5 cursor-pointer appearance-none rounded-md border border-blue-gray-200 transition-all before:absolute before:top-2/4 before:left-2/4 before:block before:h-8 before:w-8 before:-translate-y-2/4 before:-translate-x-2/4 before:rounded-full before:bg-blue-gray-500 before:opacity-0 before:transition-opacity checked:border-gray-900 checked:bg-gray-900 before:bg-gray-900 hover:before:opacity-10"
          checked={send}
          onChange={(e) => {
            setSend(e.target.checked);
          }}
        />
        <span className="absolute text-primary transition-opacity opacity-0 pointer-events-none top-2/4 left-2/4 -translate-y-2/4 -translate-x-2/4 peer-checked:opacity-100">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor" stroke="currentColor" strokeWidth="1">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
          </svg>
        </span>
      </label>
      <p className="ml-3">割り当て通知</p>
    </div>
  );
}

function ComposedNotification() {
  const [send, setSend] = useComposedNotification();
  return (
    <div className="flex items-center">
      <label className="relative flex items-center p-2 rounded-full cursor-pointer" htmlFor={"composed"}>
        <input
          id="composed"
          type="checkbox"
          className="before:content[''] peer relative h-5 w-5 cursor-pointer appearance-none rounded-md border border-blue-gray-200 transition-all before:absolute before:top-2/4 before:left-2/4 before:block before:h-8 before:w-8 before:-translate-y-2/4 before:-translate-x-2/4 before:rounded-full before:bg-blue-gray-500 before:opacity-0 before:transition-opacity checked:border-gray-900 checked:bg-gray-900 before:bg-gray-900 hover:before:opacity-10"
          checked={send}
          onChange={(e) => {
            setSend(e.target.checked);
          }}
        />
        <span className="absolute text-primary transition-opacity opacity-0 pointer-events-none top-2/4 left-2/4 -translate-y-2/4 -translate-x-2/4 peer-checked:opacity-100">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor" stroke="currentColor" strokeWidth="1">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
          </svg>
        </span>
      </label>
      <p className="ml-3">完成通知</p>
    </div>
  );
}
