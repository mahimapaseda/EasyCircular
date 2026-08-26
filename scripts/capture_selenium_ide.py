#!/usr/bin/env python3
"""Capture real Selenium IDE 3.17.2 UI screenshots for thesis section 4.7.

The official IDE is an unpacked Chrome extension. Modern Chrome/Chromium no longer
loads Manifest V2 via --load-extension, so this script serves that same extension
UI over localhost (the real index.html + neo.js bundle) with a chrome.* shim,
opens easycircular.side, and screenshots the window.
"""

from __future__ import annotations

import http.server
import shutil
import threading
from functools import partial
from pathlib import Path

from playwright.sync_api import Page, sync_playwright

ROOT = Path(__file__).resolve().parents[1]
SIDE = ROOT / "docs" / "thesis" / "selenium" / "easycircular.side"
OUT = ROOT / "docs" / "thesis" / "figures"
SRC_EXT = Path.home() / "AppData" / "Local" / "Temp" / "selenium-ide-dl" / "unpacked-ide"
SERVE = Path.home() / "AppData" / "Local" / "Temp" / "selenium-ide-dl" / "serve-ide"

CHROME_SHIM = r"""
(function() {
  const storage = {};
  const noop = function() {};
  function maybeCb(cb, value) {
    if (typeof cb === "function") cb(value);
    return Promise.resolve(value);
  }
  const runtime = {
    id: "selenium-ide",
    lastError: undefined,
    getURL: function(p) { return new URL(String(p).replace(/^\//,''), location.origin).href; },
    getManifest: function() { return { name: "Selenium IDE", version: "3.17.2", manifest_version: 2 }; },
    sendMessage: function(msg, cb) { return maybeCb(typeof msg === "function" ? msg : cb, {}); },
    connect: function() {
      return { name: "", onMessage: { addListener: noop, removeListener: noop }, postMessage: noop, disconnect: noop, onDisconnect: { addListener: noop } };
    },
    onMessage: { addListener: noop, removeListener: noop, hasListener: function() { return false; } },
    onConnect: { addListener: noop, removeListener: noop },
    onInstalled: { addListener: noop, removeListener: noop },
    getBackgroundPage: function(cb) { return maybeCb(cb, window); },
  };
  const local = {
    get: function(keys, cb) {
      if (typeof keys === "function") { cb = keys; keys = null; }
      let out = Object.assign({}, storage);
      if (Array.isArray(keys)) {
        out = {};
        keys.forEach(function(k) { if (k in storage) out[k] = storage[k]; });
      } else if (keys && typeof keys === "object") {
        out = Object.assign({}, keys, storage);
      } else if (typeof keys === "string") {
        out = {};
        if (keys in storage) out[keys] = storage[keys];
      }
      return maybeCb(cb, out);
    },
    set: function(obj, cb) { Object.assign(storage, obj || {}); return maybeCb(cb); },
    remove: function(keys, cb) {
      (Array.isArray(keys) ? keys : [keys]).forEach(function(k) { delete storage[k]; });
      return maybeCb(cb);
    },
    clear: function(cb) { Object.keys(storage).forEach(function(k) { delete storage[k]; }); return maybeCb(cb); },
  };
  window.chrome = {
    runtime: runtime,
    storage: { local: local, sync: local },
    tabs: {
      query: function(q, cb) { if (typeof q === "function") { cb = q; } return maybeCb(cb, []); },
      create: function(opts, cb) { return maybeCb(cb, { id: 1, url: opts && opts.url }); },
      sendMessage: function(id, msg, cb) { return maybeCb(cb); },
      update: function(id, opts, cb) { return maybeCb(cb, { id: 1 }); },
      get: function(id, cb) { return maybeCb(cb, { id: 1 }); },
      onUpdated: { addListener: noop, removeListener: noop },
      onRemoved: { addListener: noop, removeListener: noop },
    },
    windows: {
      WINDOW_ID_CURRENT: -2,
      create: function(opts, cb) { return maybeCb(cb, { id: 1 }); },
      update: function(id, opts, cb) { return maybeCb(cb, { id: 1 }); },
      getCurrent: function(cb) { return maybeCb(typeof cb === "function" ? cb : undefined, { id: 1 }); },
    },
    downloads: { download: function(opts, cb) { return maybeCb(cb, 1); } },
    contextMenus: { create: noop, removeAll: noop, onClicked: { addListener: noop } },
    browserAction: { onClicked: { addListener: noop }, setIcon: noop, setTitle: noop, setBadgeText: noop },
    debugger: { attach: noop, detach: noop, sendCommand: noop, onEvent: { addListener: noop }, onDetach: { addListener: noop } },
    webNavigation: { onCommitted: { addListener: noop }, onCompleted: { addListener: noop } },
    i18n: { getMessage: function(k) { return k; }, getUILanguage: function() { return "en"; } },
    extension: { getURL: runtime.getURL, getBackgroundPage: function() { return window; } },
  };
  window.browser = window.chrome;
})();
"""

INDEX_HTML = """<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Selenium IDE</title>
</head>
<body>
  <div id="root"></div>
  <script>{shim}</script>
  <script src="/assets/neo.js"></script>
</body>
</html>
"""


def prepare_serve_dir() -> Path:
    if not (SRC_EXT / "assets" / "neo.js").exists():
        raise SystemExit(f"Unpacked Selenium IDE not found at {SRC_EXT}")
    if SERVE.exists():
        shutil.rmtree(SERVE)
    shutil.copytree(SRC_EXT, SERVE)
    (SERVE / "index.html").write_text(
        INDEX_HTML.replace("{shim}", CHROME_SHIM),
        encoding="utf-8",
    )
    return SERVE


def start_server(directory: Path) -> tuple[http.server.ThreadingHTTPServer, int]:
    handler = partial(http.server.SimpleHTTPRequestHandler, directory=str(directory))
    server = http.server.ThreadingHTTPServer(("127.0.0.1", 0), handler)
    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()
    return server, server.server_address[1]


def capture(page: Page, name: str) -> Path:
    dest = OUT / name
    page.screenshot(path=str(dest), type="png")
    print(f"Wrote {dest}")
    return dest


def dismiss_welcome(page: Page) -> None:
    page.keyboard.press("Escape")
    page.wait_for_timeout(400)
    page.evaluate(
        """() => {
          document.querySelectorAll('.ReactModal__Overlay, .modal-overlay').forEach(el => {
            el.style.setProperty('display', 'none', 'important');
            el.style.setProperty('pointer-events', 'none', 'important');
          });
        }"""
    )
    page.wait_for_timeout(400)


def load_project(page: Page) -> None:
    page.wait_for_timeout(1500)
    if page.locator("input[type='file']").count():
        page.locator("input[type='file']").first.set_input_files(str(SIDE))
    else:
        open_existing = page.get_by_text("Open an existing project")
        if open_existing.count() == 0:
            print("Visible text:", page.inner_text("body")[:1500])
            capture(page, "selenium-ide-debug.png")
            raise SystemExit("Selenium IDE file input not found")
        with page.expect_file_chooser() as fc:
            open_existing.first.click()
        fc.value.set_files(str(SIDE))
    page.wait_for_timeout(1500)
    dismiss_welcome(page)
    if page.get_by_text("TC-UI-01").count() == 0:
        print("Visible text after load:", page.inner_text("body")[:1500])
        capture(page, "selenium-ide-debug.png")
        raise SystemExit("Project did not appear in the IDE")


def main() -> int:
    OUT.mkdir(parents=True, exist_ok=True)
    serve = prepare_serve_dir()
    server, port = start_server(serve)
    url = f"http://127.0.0.1:{port}/index.html"
    print(f"Serving Selenium IDE at {url}")

    with sync_playwright() as pw:
        browser = pw.chromium.launch(headless=False)
        page = browser.new_page(viewport={"width": 1280, "height": 800})
        page.on("pageerror", lambda err: print("PAGEERROR:", err))
        page.goto(url, wait_until="domcontentloaded")
        page.wait_for_timeout(2500)
        print("Title:", page.title())
        print("Text sample:", page.inner_text("body")[:800])
        try:
            load_project(page)
            capture(page, "selenium-ide-suite.png")
            test = page.get_by_text("TC-UI-03 Extract and generate summary")
            if test.count():
                test.first.click(force=True)
                page.wait_for_timeout(800)
            capture(page, "selenium-ide-commands.png")
            reject = page.get_by_text("TC-UI-04 Reject non-PDF")
            if reject.count():
                reject.first.click(force=True)
                page.wait_for_timeout(800)
            capture(page, "selenium-ide-log.png")
        finally:
            browser.close()
            server.shutdown()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
