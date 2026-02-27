// v3 - force redeploy
// v2 - clean version
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

  if (
    self.__uv$config &&
    self.__uv$config.prefix &&
    url.pathname.startsWith(self.__uv$config.prefix)
  ) {
    event.respondWith(self.__uv$config.fetch(event));
  }
});
