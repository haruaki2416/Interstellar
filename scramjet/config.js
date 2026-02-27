self.__uv$config = {
  prefix: '/scramjet/g/',
  bare: '/bare/',
  encodeUrl: Ultraviolet.codec.xor.encode,
  decodeUrl: Ultraviolet.codec.xor.decode,
  handler: '/scramjet/uv.handler.js',
  bundle: '/scramjet/uv.bundle.js',
  config: '/scramjet/uv.config.js',
};
