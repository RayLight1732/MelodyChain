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

firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  // console.log('[firebase-messaging-sw.js] Received background message ', payload);

  const { title, body, image, icon, ...restPayload } = payload.data;
  const notificationOptions = {
    body,
    icon: image || "/icons/firebase-logo.png", // path to your "fallback" firebase notification logo
    data: restPayload,
  };
  return self.registration.showNotification(title, notificationOptions);
});

self.addEventListener("notificationclick", (event) => {
  if (event?.notification?.data && event?.notification?.data?.link) {
    self.clients.openWindow(event.notification.data.link);
  }

  // close notification after click
  event.notification.close();
});
