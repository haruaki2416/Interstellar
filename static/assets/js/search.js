function splitPayload(url = "") {
  const index = url.search(/[?#]/);
  return index < 0 ? [url, ""] : [url.slice(0, index), url.slice(index)];
}

function xorKeyValue(key) {
  const value = /^\d+$/.test(key) ? Number(key) : parseInt(key, 36);
  return Number.isFinite(value) && value > 1 ? (value % 30) + 2 : 2;
}

const encoder = {
  // biome-ignore format: compact
  xor: { encode: (url, key) => url && encodeURIComponent(url.split("").map((char, index) => (index % xorKeyValue(key) ? String.fromCharCode(char.charCodeAt(0) ^ xorKeyValue(key)) : char)).join("")), decode: (url, key) => { const [value, tail] = splitPayload(url); if (!value) return value; const xorKey = xorKeyValue(key); return decodeURIComponent(value).split("").map((char, index) => (index % xorKey ? String.fromCharCode(char.charCodeAt(0) ^ xorKey) : char)).join("") + tail } },
};

window.encode = {
  xor: encoder.xor.encode,
};

window.decode = {
  xor: encoder.xor.decode,
};

let swReady = false;
let swReadyResolve;
const swReadyPromise = new Promise(resolve => {
  swReadyResolve = resolve;
});

function isTabsPage() {
  return document.body?.id === "no" || Boolean(document.getElementById("frame-container"));
}

window.addEventListener("load", async () => {
  if (!("serviceWorker" in navigator)) {
    swReady = true;
    swReadyResolve();
    return;
  }

  try {
    // Register on every app page, including /tabs: that page also makes /uv/ requests.
    const registration = await navigator.serviceWorker.register("/sw.js", {
      scope: "/",
    });
    await navigator.serviceWorker.ready;

    // An active registration does not guarantee this document is controlled yet.
    if (!navigator.serviceWorker.controller) {
      await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          navigator.serviceWorker.removeEventListener("controllerchange", onController);
          reject(new Error("Service worker activated but did not take control of this page"));
        }, 8000);
        function onController() {
          if (!navigator.serviceWorker.controller) return;
          clearTimeout(timeout);
          navigator.serviceWorker.removeEventListener("controllerchange", onController);
          resolve();
        }
        navigator.serviceWorker.addEventListener("controllerchange", onController);
        onController();
      });
    }

    console.info("[SW] page is controlled by", navigator.serviceWorker.controller?.scriptURL);
    swReady = true;
    swReadyResolve();
  } catch (err) {
    console.error("[SW] registration/control failed:", err);
    swReady = true;
    swReadyResolve();
  }
});

async function waitForServiceWorker() {
  if (!swReady) {
    await Promise.race([swReadyPromise, new Promise(resolve => setTimeout(resolve, 9000))]);
  }
  if ("serviceWorker" in navigator && !navigator.serviceWorker.controller) {
    throw new Error("The service worker is not controlling this page; proxy navigation was stopped.");
  }
}

const form = document.getElementById("search-form");
const input = document.getElementById("input");

if (form && input && !isTabsPage()) {
  form.addEventListener("submit", async event => {
    event.preventDefault();
    if (askOwningTabs(input.value)) return;
    try {
      if (isInTabMode) await navigate(input.value, "");
      else await navigate(input.value, "/tabs");
    } catch {
      await navigate(input.value, "/tabs");
    }
  });
}

function isScramjet(proxyOverride) {
  const choice = proxyOverride ?? store.get("proxy");
  return choice === "sj";
}

async function encodeUrl(url, proxyOverride) {
  if (isScramjet(proxyOverride)) {
    if (window.__ready) {
      await window.__ready;
    }
    if (window.__urls?.encodeUrl) {
      return window.__urls.encodeUrl(url);
    }
  }

  return `/uv/${__uv$config.encodeUrl ? __uv$config.encodeUrl(url) : window.encode.xor(url)}`;
}

async function checkBlocked(url) {
  let host;
  try {
    const parsed = new URL(url, window.location.origin);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return null;
    host = parsed.hostname;
  } catch {
    return null;
  }
  try {
    const response = await fetch("/filter/verdict", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ host }),
    });
    if (!response.ok) return null;
    const verdict = await response.json();
    return verdict.blocked ? verdict : null;
  } catch {
    return null;
  }
}

function blockPageUrl(url, verdict) {
  return `/block.html#${encodeURIComponent(`${verdict.source}|${url}`)}`;
}

window.blockPages = { check: checkBlocked, pageUrl: blockPageUrl };

async function navigate(value, path, proxyOverride) {
  await waitForServiceWorker();
  if (window.__settled) await window.__settled();

  let url = value.trim();
  const engine = store.get("engine");
  const searchUrl = engine ? engine : "https://duckduckgo.com/?q=";

  if (!isValidUrl(url)) {
    url = searchUrl + url;
  } else if (!(url.startsWith("https://") || url.startsWith("http://"))) {
    url = `https://${url}`;
  }

  const verdict = await checkBlocked(url);
  if (verdict) {
    const blockedPage = blockPageUrl(url, verdict);
    if (path) {
      sessionStorage.setItem("GoUrl", blockedPage);
      location.href = path;
    } else {
      location.href = blockedPage;
    }
    return;
  }

  const proxyChoice = proxyOverride ?? store.get("proxy");
  const proxyUrl = await encodeUrl(url, proxyChoice);
  sessionStorage.setItem("GoUrl", proxyUrl);

  if (path || !owningTabsWindow()) {
    location.href = path || "/tabs";
  } else {
    window.location.href = proxyUrl;
  }
}

function openUrl(value, proxyOverride) {
  navigate(value, "/tabs", proxyOverride);
}

// Open link in about:blank
function blank(value, proxyOverride) {
  navigate(value, "", proxyOverride);
}

function isValidUrl(val = "") {
  return /^http(s?):\/\//.test(val) || (val.includes(".") && val[0] !== " ");
}

(() => {
  // Full paths only, never concatenated: the build rewrites whole literals.
  const vendor = self.__deps || {};

  const BUILT_WISP = null;

  function unpackWisp(pieces, key) {
    const parts = [...pieces]
      .sort((a, b) => a[0] - b[0])
      .map(([, text]) => {
        const binary = atob(text.replace(/-/g, "+").replace(/_/g, "/"));
        return Uint8Array.from(binary, char => char.charCodeAt(0));
      });
    const bytes = new Uint8Array(parts.reduce((total, part) => total + part.length, 0));
    let at = 0;
    for (const part of parts) {
      bytes.set(part, at);
      at += part.length;
    }
    for (let i = 0; i < bytes.length; i++) bytes[i] ^= key[i % key.length];
    return new TextDecoder().decode(bytes);
  }

  const wispReachable = url =>
    new Promise(resolve => {
      let socket;
      const done = ok => {
        clearTimeout(timer);
        try {
          socket?.close();
        } catch {}
        resolve(ok);
      };
      const timer = setTimeout(() => done(false), 5000);
      try {
        socket = new WebSocket(url);
        socket.onopen = () => done(true);
        socket.onerror = () => done(false);
      } catch {
        done(false);
      }
    });

  async function pickBuiltWisp() {
    const lists = [BUILT_WISP.p, BUILT_WISP.f].map(list => list.map(pieces => unpackWisp(pieces, BUILT_WISP.k)));
    const all = lists.flat();
    if (all.length === 1) return all[0];
    for (const list of lists) {
      if (!list.length) continue;
      const reachable = await Promise.all(list.map(wispReachable));
      const index = reachable.indexOf(true);
      if (index >= 0) return list[index];
    }
    return all[0];
  }

  async function getWispUrl() {
    const custom = store.get("wisp-url")?.trim();
    if (custom && /^wss?:\/\//i.test(custom)) return custom;
    if (BUILT_WISP) return pickBuiltWisp();
    const protocol = location.protocol === "https:" ? "wss" : "ws";
    return `${protocol}://${location.host}/wisp/`;
  }

  function blockAwareEpoxy(transportPath) {
    return `
      const { default: EpoxyTransport } = await import(${JSON.stringify(transportPath)});
      class BlockAwareEpoxy extends EpoxyTransport {
        async request(...args) {
          try {
            return await super.request(...args);
          } catch (error) {
            const message = String(error?.message ?? error);
            const kind = message.includes("WispCloseReason(ServerStreamBlockedAddress") ? "blocked"
              : message.includes("WispCloseReason(ServerStreamUnreachable") ? "not-found" : null;
            if (!kind) throw error;
            return { status: 451, statusText: "Unavailable For Legal Reasons", headers: { "x-interstellar-block": kind }, body: null };
          }
        }
      }
      return [BlockAwareEpoxy, ${JSON.stringify(transportPath)}];
    `;
  }

  async function hashSignature(text) {
    const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
    return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, "0")).join("");
  }

  async function ensureTransport(connection, transportPath, options, rawSignature, manualCode) {
    const signature = await hashSignature(rawSignature);
    let current = "";
    try {
      current = await connection.getTransport();
    } catch {}

    if (current === transportPath && store.get("transport-signature") === signature) return;

    if (manualCode) await connection.setManualTransport(manualCode, options);
    else await connection.setTransport(transportPath, options);
    store.set("transport-signature", signature);
  }

  async function init() {
    const [{ BareMuxConnection }, { ScramjetController }] = await Promise.all([import(vendor.baremux), window.$scramjetLoadController()]);

    const scramjet = new ScramjetController(self.__scramjet$config);
    await scramjet.init();

    const wisp = await getWispUrl();
    const connection = new BareMuxConnection(vendor.baremuxWorker);
    if (store.get("transport") === "libcurl") {
      await ensureTransport(connection, vendor.libcurl, [{ websocket: wisp }], `${vendor.libcurl}|${wisp}`);
    } else {
      await ensureTransport(connection, vendor.epoxy, [{ wisp }], `${vendor.epoxy}|${wisp}|block-aware`, blockAwareEpoxy(vendor.epoxy));
    }

    window.__urls = {
      encodeUrl: url => scramjet.encodeUrl(url),
      decodeUrl: url => scramjet.decodeUrl(url),
    };
  }

  async function boot() {
    if (typeof window.$scramjetLoadController !== "function" || !self.__scramjet$config) return;
    try {
      await init();
    } catch (error) {
      console.error("Scramjet transport failed to start:", error);
    }
  }

  const domReady = document.readyState === "loading" ? new Promise(resolve => document.addEventListener("DOMContentLoaded", resolve, { once: true })) : Promise.resolve();

  window.__ready = domReady.then(boot);
})();

window.__settled = async (timeout = 8000) => {
  if (!window.__ready) return;
  await Promise.race([window.__ready.catch(() => {}), new Promise(resolve => setTimeout(resolve, timeout))]);
};

function owningTabsWindow() {
  try {
    const tabs = window.parent?.document?.getElementById("frame-container");
    return window.frameElement && tabs && window.frameElement.parentElement === tabs ? window.parent : null;
  } catch {
    return null;
  }
}

function askOwningTabs(value) {
  const tabs = owningTabsWindow();
  if (!tabs) return false;
  tabs.postMessage({ type: "interstellar:tabs-navigate", value }, location.origin);
  return true;
}
