const { ScramjetController } = $scramjetLoadController();

const scramjet = new ScramjetController({
    files: {
        wasm: "/scram/scramjet.wasm.wasm",
        all: "/scram/scramjet.all.js",
        sync: "/scram/scramjet.sync.js",
    },
    flags: {
        rewriterLogs: false,
        scramitize: false,
        cleanErrors: true,
        sourcemaps: true,
    },
});

scramjet.init();

// ❌ Removed duplicate service worker registration
// navigator.serviceWorker.register("./sw.js");

const connection = new BareMux.BareMuxConnection("/baremux/worker.js");
const flex = css`display: flex;`;
const col = css`flex-direction: column;`;

connection.setTransport(store.transport, [{ wisp: store.wispurl }]);

function Config() {
    this.css = `...`; // (unchanged CSS)

    function handleModalClose(modal) {
        modal.style.opacity = 0;
        setTimeout(() => {
            modal.close();
            modal.style.opacity = 1;
        }, 250);
    }

    return html`
      <dialog class="cfg" style="background-color: #121212; color: white; border-radius: 8px;">
        <div style="align-self: end">
          <div class=${[flex, "buttons"]}>
            <button on:click=${() => {
                            connection.setTransport("/baremod/index.mjs", [store.bareurl]);
                            store.transport = "/baremod/index.mjs";
                        }}>use bare server 3</button>
            <button on:click=${() => {
                            connection.setTransport("/libcurl/index.mjs", [
                                { wisp: store.wispurl },
                            ]);
                            store.transport = "/libcurl/index.mjs";
                        }}>use libcurl.js</button>
              <button on:click=${() => {
                                connection.setTransport("/epoxy/index.mjs", [
                                    { wisp: store.wispurl },
                                ]);
                                store.transport = "/epoxy/index.mjs";
                            }}>use epoxy</button>
          </div>
        </div>
        <div class=${[flex, col, "input_row"]}>
          <label for="wisp_url_input">Wisp URL:</label>
          <input id="wisp_url_input" bind:value=${use(store.wispurl)} spellcheck="false"></input>
        </div>
        <div class=${[flex, col, "input_row"]}>
          <label for="bare_url_input">Bare URL:</label>
          <input id="bare_url_input" bind:value=${use(store.bareurl)} spellcheck="false"></input>
        </div>
        <div>${use(store.transport)}</div>
        <div class=${[flex, "buttons", "centered"]}>
          <button on:click=${() => handleModalClose(this.root)}>close</button>
        </div>
      </dialog>
  `;
}

function BrowserApp() {
    this.css = `...`; // (unchanged CSS)
    this.url = store.url;

    const frame = scramjet.createFrame();

    this.mount = () => {
        let body = btoa(
            `<body style="background: #000; color: #fff">Welcome to <i>Scramjet</i>! Type in a URL in the omnibox above and press enter to get started.</body>`
        );
        frame.go(`data:text/html;base64,${body}`);
    };

    frame.addEventListener("urlchange", (e) => {
        if (!e.url) return;
        this.url = e.url;
    });

    const handleSubmit = () => {
        this.url = this.url.trim();
        if (!this.url.startsWith("http")) {
            this.url = "https://" + this.url;
        }
        return frame.go(this.url);
    };

    const cfg = h(Config);
    document.body.appendChild(cfg);
    this.githubURL = `https://github.com/MercuryWorkshop/scramjet/commit/${$scramjetVersion.build}`;

    return html`
      <div>
        <div class=${[flex, "nav"]}>
          <button on:click=${() => cfg.showModal()}>config</button>
          <button on:click=${() => frame.back()}>&lt;-</button>
          <button on:click=${() => frame.forward()}>-&gt;</button>
          <button on:click=${() => frame.reload()}>&#x21bb;</button>

          <input class="bar" autocomplete="off" autocapitalize="off" autocorrect="off" 
          bind:value=${use(this.url)} on:input=${(e) => {
                        this.url = e.target.value;
                    }} on:keyup=${(e) => e.keyCode == 13 && (store.url = this.url) && handleSubmit()}></input>

          <button on:click=${() => window.open(scramjet.encodeUrl(this.url))}>open</button>

          <p class="version">
            <b>scramjet</b> ${$scramjetVersion.version} <a href=${use(this.githubURL)}>${$scramjetVersion.build}</a>
          </p>
        </div>
        ${frame.frame}
      </div>
    `;
}

window.addEventListener("load", async () => {
    const root = document.getElementById("app");
    try {
        root.replaceWith(h(BrowserApp));
    } catch (e) {
        root.replaceWith(document.createTextNode("" + e));
        throw e;
    }
    function b64(buffer) {
        let binary = "";
        const bytes = new Uint8Array(buffer);
        const len = bytes.byteLength;
        for (let i = 0; i < len; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return btoa(binary);
    }
    const arraybuffer = await (await fetch("/assets/scramjet.png")).arrayBuffer();
    console.log(
        "%cb",
        `
      background-image: url(data:image/png;base64,${b64(arraybuffer)});
      color: transparent;
      padding-left: 200px;
      padding-bottom: 100px;
      background-size: contain;
      background-position: center center;
      background-repeat: no-repeat;
  `
    );
});
