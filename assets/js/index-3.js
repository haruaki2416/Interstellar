// index-3.js (Scramjet version)

// Scramjet does NOT use UV service workers, so remove registration entirely.

// Detect if running inside /d
let xl;

try {
  xl = window.top.location.pathname === "/d";
} catch {
  try {
    xl = window.parent.location.pathname === "/d";
  } catch {
    xl = false;
  }
}

const form = document.getElementById("fv");
const input = document.getElementById("input");

if (form && input) {
  form.addEventListener("submit", async event => {
    event.preventDefault();
    try {
      if (xl) processUrl(input.value, "");
      else processUrl(input.value, "/d");
    } catch {
      processUrl(input.value, "/d");
    }
  });
}

function processUrl(value, path) {
  let url = value.trim();
  const engine = localStorage.getItem("engine");
  const searchUrl = engine ? engine : "https://duckduckgo.com/?q=";

  // Build full URL
  if (!isUrl(url)) {
    url = searchUrl + url;
  } else if (!(url.startsWith("https://") || url.startsWith("http://"))) {
    url = `https://${url}`;
  }

  // Scramjet uses normal encodeURIComponent
  const encoded = encodeURIComponent(url);

  // Save for other pages if needed
  sessionStorage.setItem("GoUrl", encoded);

  const dy = localStorage.getItem("dy");

  // Scramjet routing
  if (dy === "true") {
    window.location.href = `/scramjet/${encoded}`;
  } else if (path) {
    location.href = path;
  } else {
    window.location.href = `/scramjet/${encoded}`;
  }
}

function go(value) {
  processUrl(value, "/d");
}

function blank(value) {
  processUrl(value);
}

function dy(value) {
  processUrl(value, `/scramjet/${encodeURIComponent(value)}`);
}

function isUrl(val = "") {
  if (/^http(s?):\/\//.test(val) || (val.includes(".") && val.substr(0, 1) !== " ")) {
    return true;
  }
  return false;
}
