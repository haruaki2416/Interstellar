self.addEventListener('install', event => {
  console.log('Dummy SW installed');
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  console.log('Dummy SW activated');
});
