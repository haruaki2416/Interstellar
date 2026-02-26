class UVHandler {
  constructor(config) {
    this.config = config;
  }

  rewriteUrl(url) {
    try {
      return this.config.prefix + this.config.encodeUrl(url);
    } catch {
      return url;
    }
  }

  async fetch(url, options = {}) {
    const encoded = this.rewriteUrl(url);
    return fetch(encoded, options);
  }

  handleElement(element, attribute) {
    const value = element.getAttribute(attribute);
    if (!value) return;

    try {
      const rewritten = this.rewriteUrl(value);
      element.setAttribute(attribute, rewritten);
    } catch {
      // ignore rewrite errors
    }
  }
}

self.UVHandler = UVHandler;
