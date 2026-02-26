importScripts('/uv/uv.bundle.js');
importScripts('/uv/uv.handler.js');
importScripts('/uv/uv.client.js');
importScripts('/uv/uv.config.js');

const config = self.__uv$config;
const handler = new self.UVHandler(config);

self.addEventListener('fetch', event => {
  const req = event.request;

  // Skip service worker and extension URLs
  if (
    req.url.startsWith('chrome-extension://') ||
    req.url.includes('/sw.js') ||
    req.url.includes('/register-sw.js')
  ) {
    return;
  }

  event.respondWith(
    (async () => {
      try {
        const url = new URL(req.url);

        // Proxy only http/https
        if (url.protocol === 'http:' || url.protocol === 'https:') {
          return handler.fetch(req.url, {
            method: req.method,
            headers: req.headers,
            body: req.method !== 'GET' ? await req.clone().arrayBuffer() : undefined,
            redirect: 'follow'
          });
        }

        // Otherwise, normal fetch
        return fetch(req);
      } catch (err) {
        return fetch(req);
      }
    })()
  );
});
