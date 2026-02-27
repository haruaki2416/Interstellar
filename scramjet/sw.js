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

  // Only intercept if prefix matches
  if (
    self.__uv$config &&
    self.__uv$config.prefix &&
    url.pathname.startsWith(self.__uv$config.prefix)
  ) {
    // Instead of real proxying, return a debug HTML page
    const debugHtml = `
      <html>
        <body>
          <h1>🛠️ Intercepted by Service Worker!</h1>
          <p><strong>URL:</strong> ${url.href}</p>
          <p><strong>Prefix matched:</strong> ${self.__uv$config.prefix}</p>
        </body>
      </html>
    `;
    event.respondWith(new Response(debugHtml, {
      headers: { 'Content-Type': 'text/html' }
    }));
  }
});
