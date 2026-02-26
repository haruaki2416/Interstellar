class UVClient {
  constructor(config) {
    this.config = config;
  }

  encode(url) {
    return this.config.prefix + this.config.encodeUrl(url);
  }

  decode(url) {
    return this.config.decodeUrl(
      url.replace(this.config.prefix, '')
    );
  }

  fetch(url, options = {}) {
    return fetch(this.encode(url), options);
  }

  rewrite(url) {
    try {
      return this.encode(url);
    } catch {
      return url;
    }
  }
}

self.UVClient = UVClient;
