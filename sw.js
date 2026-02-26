self.__uv$config = {
  prefix: '/uv/',
  bare: '/baremux/',
  epoxy: '/epoxy/',
  libcurl: '/libcurl/',
};

importScripts('/uv/uv.sw.js');

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', event => {
  event.waitUntil(self.clients.claim());
});
