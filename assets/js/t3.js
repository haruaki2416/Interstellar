// tabs.js (Scramjet version)

window.addEventListener("load", () => {
  const form = document.getElementById("fv");
  const input = document.getElementById("input");

  if (form && input) {
    form.addEventListener("submit", event => {
      event.preventDefault();
      const formValue = input.value.trim();
      const url = isUrl(formValue)
        ? prependHttps(formValue)
        : `https://duckduckgo.com/?q=${formValue}`;
      processUrl(url);
    });
  }

  function processUrl(url) {
    const encoded = encodeURIComponent(url);
    sessionStorage.setItem("GoUrl", encoded);

    const iframeContainer = document.getElementById("frame-container");
    const activeIframe = Array.from(
      iframeContainer.querySelectorAll("iframe")
    ).find(iframe => iframe.classList.contains("active"));

    if (!activeIframe) return;

    activeIframe.src = `/scramjet/${encoded}`;
    activeIframe.dataset.tabUrl = url;
    if (input) input.value = url;
  }

  function isUrl(val = "") {
    return /^http(s?):\/\//.test(val) || (val.includes(".") && val[0] !== " ");
  }

  function prependHttps(url) {
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      return `https://${url}`;
    }
    return url;
  }
});

document.addEventListener("DOMContentLoaded", () => {
  const addTabButton = document.getElementById("add-tab");
  const tabList = document.getElementById("tab-list");
  const iframeContainer = document.getElementById("frame-container");

  let tabCounter = 1;

  if (addTabButton) {
    addTabButton.addEventListener("click", () => {
      createNewTab();
      Load();
    });
  }

  function createNewTab() {
    const newTab = document.createElement("li");
    const tabTitle = document.createElement("span");
    const newIframe = document.createElement("iframe");

    newIframe.sandbox =
      "allow-same-origin allow-scripts allow-forms allow-pointer-lock allow-modals allow-orientation-lock allow-presentation allow-storage-access-by-user-activation";

    tabTitle.textContent = `New Tab ${tabCounter}`;
    tabTitle.className = "t";

    newTab.dataset.tabId = tabCounter;
    newTab.addEventListener("click", switchTab);
    newTab.setAttribute("draggable", true);

    const closeButton = document.createElement("button");
    closeButton.classList.add("close-tab");
    closeButton.innerHTML = "&#10005;";
    closeButton.addEventListener("click", closeTab);

    newTab.appendChild(tabTitle);
    newTab.appendChild(closeButton);
    tabList.appendChild(newTab);

    const allTabs = Array.from(tabList.querySelectorAll("li"));
    allTabs.forEach(tab => tab.classList.remove("active"));

    const allIframes = Array.from(iframeContainer.querySelectorAll("iframe"));
    allIframes.forEach(iframe => iframe.classList.remove("active"));

    newTab.classList.add("active");
    newIframe.dataset.tabId = tabCounter;
    newIframe.classList.add("active");

    newIframe.addEventListener("load", () => {
      const title = newIframe.contentDocument?.title || "";
      tabTitle.textContent = title.length <= 1 ? "Tab" : title;

      newIframe.contentWindow.open = url => {
        const encoded = encodeURIComponent(url);
        sessionStorage.setItem("URL", `/scramjet/${encoded}`);
        createNewTab();
        return null;
      };

      Load();
    });

    const goUrl = sessionStorage.getItem("GoUrl");
    const url = sessionStorage.getItem("URL");

    if (tabCounter === 0 || tabCounter === 1) {
      if (goUrl !== null) {
        newIframe.src = `/scramjet/${goUrl}`;
      } else {
        newIframe.src = "/";
      }
    } else if (tabCounter > 1) {
      if (url !== null) {
        newIframe.src = url;
        sessionStorage.removeItem("URL");
      } else if (goUrl !== null) {
        newIframe.src = `/scramjet/${goUrl}`;
      } else {
        newIframe.src = "/";
      }
    }

    iframeContainer.appendChild(newIframe);
    tabCounter += 1;
  }

  function closeTab(event) {
    event.stopPropagation();
    const tabId = event.target.closest("li").dataset.tabId;

    const tabToRemove = tabList.querySelector(`[data-tab-id='${tabId}']`);
    const iframeToRemove = iframeContainer.querySelector(
      `[data-tab-id='${tabId}']`
    );

    if (tabToRemove && iframeToRemove) {
      tabToRemove.remove();
      iframeToRemove.remove();

      const remainingTabs = Array.from(tabList.querySelectorAll("li"));

      if (remainingTabs.length === 0) {
        tabCounter = 0;
        const input = document.getElementById("input");
        if (input) input.value = "";
      } else {
        const nextTab = remainingTabs[0];
        const nextIframe = iframeContainer.querySelector(
          `[data-tab-id='${nextTab.dataset.tabId}']`
        );

        remainingTabs.forEach(tab => tab.classList.remove("active"));
        nextTab.classList.add("active");

        const allIframes = Array.from(
          iframeContainer.querySelectorAll("iframe")
        );
        allIframes.forEach(iframe => iframe.classList.remove("active"));

        if (nextIframe) nextIframe.classList.add("active");
      }
    }
  }

  function switchTab(event) {
    const tabId = event.target.closest("li").dataset.tabId;

    const allTabs = Array.from(tabList.querySelectorAll("li"));
    allTabs.forEach(tab => tab.classList.remove("active"));

    const allIframes = Array.from(iframeContainer.querySelectorAll("iframe"));
    allIframes.forEach(iframe => iframe.classList.remove("active"));

    const selectedTab = tabList.querySelector(`[data-tab-id='${tabId}']`);
    const selectedIframe = iframeContainer.querySelector(
      `[data-tab-id='${tabId}']`
    );

    if (selectedTab) selectedTab.classList.add("active");
    if (selectedIframe) selectedIframe.classList.add("active");

    Load();
  }

  let dragTab = null;

  tabList.addEventListener("dragstart", event => {
    dragTab = event.target.closest("li");
  });

  tabList.addEventListener("dragover", event => {
    event.preventDefault();
    const targetTab = event.target.closest("li");
    if (targetTab && targetTab !== dragTab) {
      const targetIndex = Array.from(tabList.children).indexOf(targetTab);
      const dragIndex = Array.from(tabList.children).indexOf(dragTab);
      if (targetIndex < dragIndex) {
        tabList.insertBefore(dragTab, targetTab);
      } else {
        tabList.insertBefore(dragTab, targetTab.nextSibling);
      }
    }
  });

  tabList.addEventListener("dragend", () => {
    dragTab = null;
  });

  createNewTab();
});

// Reload
function reload() {
  const activeIframe = document.querySelector("#frame-container iframe.active");
  if (activeIframe) {
    activeIframe.src = activeIframe.src;
    Load();
  } else {
    console.error("No active iframe found");
  }
}

// Popout
function popout() {
  const activeIframe = document.querySelector("#frame-container iframe.active");
  if (!activeIframe) {
    console.error("No active iframe found");
    return;
  }

  const newWindow = window.open("about:blank", "_blank");
  if (!newWindow) return;

  const name =
    localStorage.getItem("name") || "My Drive - Google Drive";
  const icon =
    localStorage.getItem("icon") ||
    "https://ssl.gstatic.com/docs/doclist/images/drive_2022q3_32dp.png";

  newWindow.document.title = name;
  const link = newWindow.document.createElement("link");
  link.rel = "icon";
  link.href = encodeURI(icon);
  newWindow.document.head.appendChild(link);

  const newIframe = newWindow.document.createElement("iframe");
  const style = newIframe.style;
  style.position = "fixed";
  style.top = style.bottom = style.left = style.right = 0;
  style.border = style.outline = "none";
  style.width = style.height = "100%";

  newIframe.src = activeIframe.src;
  newWindow.document.body.appendChild(newIframe);
}

// Eruda toggle
function eToggle() {
  const activeIframe = document.querySelector("#frame-container iframe.active");
  if (!activeIframe) {
    console.error("No active iframe found");
    return;
  }

  const erudaWindow = activeIframe.contentWindow;
  if (!erudaWindow) {
    console.error("No content window found for the active iframe");
    return;
  }

  if (erudaWindow.eruda) {
    if (erudaWindow.eruda._isInit) {
      erudaWindow.eruda.destroy();
    } else {
      console.error("Eruda is not initialized in the active iframe");
    }
  } else {
    const erudaDocument = activeIframe.contentDocument;
    if (!erudaDocument) {
      console.error("No content document found for the active iframe");
      return;
    }
    const script = erudaDocument.createElement("script");
    script.src = "https://cdn.jsdelivr.net/npm/eruda";
    script.onload = () => {
      if (!erudaWindow.eruda) {
        console.error("Failed to load Eruda in the active iframe");
        return;
      }
      erudaWindow.eruda.init();
      erudaWindow.eruda.show();
    };
    erudaDocument.head.appendChild(script);
  }
}

// Fullscreen
function FS() {
  const activeIframe = document.querySelector("#frame-container iframe.active");
  if (activeIframe) {
    if (activeIframe.contentDocument.fullscreenElement) {
      activeIframe.contentDocument.exitFullscreen();
    } else {
      activeIframe.contentDocument.documentElement.requestFullscreen();
    }
  } else {
    console.error("No active iframe found");
  }
}

const fullscreenButton = document.getElementById("fullscreen-button");
if (fullscreenButton) fullscreenButton.addEventListener("click", FS);

// Home
function Home() {
  window.location.href = "./";
}
const homeButton = document.getElementById("home-page");
if (homeButton) homeButton.addEventListener("click", Home);

// Back
function goBack() {
  const activeIframe = document.querySelector("#frame-container iframe.active");
  if (activeIframe) {
    activeIframe.contentWindow.history.back();
    activeIframe.src = activeIframe.src;
    Load();
  } else {
    console.error("No active iframe found");
  }
}

// Forward
function goForward() {
  const activeIframe = document.querySelector("#frame-container iframe.active");
  if (activeIframe) {
    activeIframe.contentWindow.history.forward();
    activeIframe.src = activeIframe.src;
    Load();
  } else {
    console.error("No active iframe found");
  }
}

// Remove Nav
document.addEventListener("DOMContentLoaded", () => {
  const tb = document.getElementById("tabs-button");
  const nb = document.getElementById("right-side-nav");
  if (!tb || !nb) return;

  tb.addEventListener("click", () => {
    const activeIframe = document.querySelector("#frame-container iframe.active");
    if (!activeIframe) return;

    if (nb.style.display === "none") {
      nb.style.display = "";
      activeIframe.style.top = "10%";
      activeIframe.style.height = "90%";
      tb.querySelector("i").classList.remove("fa-magnifying-glass-plus");
      tb.querySelector("i").classList.add("fa-magnifying-glass-minus");
    } else {
      nb.style.display = "none";
      activeIframe.style.top = "5%";
      activeIframe.style.height = "95%";
      tb.querySelector("i").classList.remove("fa-magnifying-glass-minus");
      tb.querySelector("i").classList.add("fa-magnifying-glass-plus");
    }
  });
});

if (navigator.userAgent.includes("Chrome")) {
  window.addEventListener("resize", () => {
    if (navigator.keyboard && navigator.keyboard.lock) {
      navigator.keyboard.lock(["Escape"]);
    }
  });
}

// Load: update input based on current Scramjet URL
function Load() {
  const activeIframe = document.querySelector("#frame-container iframe.active");
  if (
    activeIframe &&
    activeIframe.contentWindow &&
    activeIframe.contentWindow.document.readyState === "complete"
  ) {
    const website = activeIframe.contentWindow.document.location.href;
    const input = document.getElementById("input");
    if (!input) return;

    if (website.includes("/scramjet/")) {
      const websitePath = website
        .replace(window.location.origin, "")
        .replace("/scramjet/", "");
      const decoded = decodeURIComponent(websitePath);
      input.value = decoded;
      localStorage.setItem("decoded", websitePath);
    } else {
      const websitePath = website.replace(window.location.origin, "");
      input.value = websitePath;
      localStorage.setItem("decoded", websitePath);
    }
  }
}
