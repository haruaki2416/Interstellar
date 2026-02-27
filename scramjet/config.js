self.__uv$config = {
  prefix: '/scramjet/g/',
  bare: '/bare/',
  encodeUrl: Ultraviolet.codec.xor.encode,
  decodeUrl: Ultraviolet.codec.xor.decode,
  bundle: '/scramjet/bundle.js',
  config: '/scramjet/config.js',
};

// Defer fetch assignment until UV is ready
Ultraviolet.ready.then(() => {
  self.__uv$config.fetch = (request) => Ultraviolet.fetch(request);
});
