//参考
//https://www.mbloging.com/post/implementing-firebase-push-notifications-in-next-js-a-step-by-step-guide

importScripts("https://www.gstatic.com/firebasejs/10.5.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.5.0/firebase-messaging-compat.js");

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCJMFqxaQixVdqcDa4hUDW26RrVz3_Meow",
  authDomain: "melody-chain.firebaseapp.com",
  projectId: "melody-chain",
  storageBucket: "melody-chain.appspot.com",
  messagingSenderId: "826270602514",
  appId: "1:826270602514:web:f54ce41f6ab7538fe08fcb",
};

var dispatchNotification = true;
var composedNotification = true;

firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log("on background message");
  // console.log('[firebase-messaging-sw.js] Received background message ', payload);

  const { title, body, image, icon, type, ...restPayload } = payload.data;
  const notificationOptions = {
    body,
    icon: image || "/icon-256x256.png", // path to your "fallback" firebase notification logo
    data: restPayload,
  };
  if (type == 0 && !dispatchNotification) {
    return;
  } else if (type == 1 && !composedNotification) {
    return;
  }
  return self.registration.showNotification(title, notificationOptions);
});

self.addEventListener("notificationclick", (event) => {
  if (event?.notification?.data && event?.notification?.data?.link) {
    self.clients.openWindow(event.notification.data.link);
  }

  // close notification after click
  event.notification.close();
});
