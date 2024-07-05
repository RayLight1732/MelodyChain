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
  console.log("on background message");
  // console.log('[firebase-messaging-sw.js] Received background message ', payload);

  const { title, body, image, icon, type, ...restPayload } = payload.data;
  const notificationOptions = {
    body,
    icon: image || "/icons/firebase-logo.png", // path to your "fallback" firebase notification logo
    data: restPayload,
  };
  var key = null;
  if (type == 0) {
    key = "DispatchNotification";
  } else if (type == 1) {
    key = "ComposedNotification";
  }
  if (key) {
    var value = localStorage.getItem(key);
    var bValue = true;
    if (value == "true") {
      bValue = true;
    } else if (value == "false") {
      bValue = false;
    } else {
      bValue = true;
    }
    if (!value) {
      return;
    }
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
