importScripts('/scramjet/bundle.js');
importScripts('/scramjet/config.js');

self.addEventListener('install', event => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', event => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  console.log('[SW] Fetching:', url.href); // Debug log

  if (
    self.__uv$config &&
    self.__uv$config.prefix &&
    url.pathname.startsWith(self.__uv$config.prefix)
  ) {
    console.log('[SW] Intercepted by UV:', url.href); // Debug log
    event.respondWith(self.__uv$config.fetch(event));
  }
});
