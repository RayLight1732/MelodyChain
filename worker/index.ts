self.addEventListener("activate", function (event: ExtendableEvent) {
  // 新しいService Workerがアクティブになった時に古いキャッシュを削除
  event.waitUntil(
    caches.keys().then(function (cacheNames) {
      return Promise.all(
        cacheNames.map(function (cacheName) {
          return caches.delete(cacheName);
        })
      );
    })
  );
});

self.addEventListener("message", function (event) {
  /*
    console.log(`I got a message from browser. ${event.data}`);
    if (event.data.type === "DispatchNotification") {
      const data = event.data.payload;
      dispatchNotification = data == true;
    } else if (event.data.type === "ComposedNotification") {
      const data = event.data.payload;
      dispatchNotification = data == true;
    }*/
  console.log("message event");
});
