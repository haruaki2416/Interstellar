(() => {
  const UV = Ultraviolet;
  const encoder = UV.codec.xor.encode;
  const decoder = UV.codec.xor.decode;

  self.__uv$config = self.__uv$config || {
    prefix: '/uv/',
    bare: '/baremux/',
    handler: '/uv/uv.handler.js',
    client: '/uv/uv.client.js',
    bundle: '/uv/uv.bundle.js',
    config: '/uv/uv.config.js',
    sw: '/uv/uv.sw.js',
  };

  UV.bundle = {
    encodeUrl: encoder,
    decodeUrl: decoder,
    createUrl: (url) => self.__uv$config.prefix + encoder(url),
    resolve: (url) => decoder(url.replace(self.__uv$config.prefix, '')),
  };
})();
