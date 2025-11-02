// collector/monitor.js
// Exports an async monitor(url) function that returns the 7-feature object.
//
// Usage (from server): const { monitor } = require('../collector/monitor');
//                       await monitor('https://example.com');

const { chromium } = require("playwright");
const fetch = require("node-fetch");

const API_ENDPOINT = "http://127.0.0.1:5000/predict";
const COLLECT_SECONDS = 12;

async function monitor(url) {
  if (!url) throw new Error("monitor(url) called without url");

  console.log(`🌐 [monitor] Opening ${url} ...`);
  const browser = await chromium.launch({ headless: true, args: ["--no-sandbox"] });
  const context = await browser.newContext({ ignoreHTTPSErrors: true });
  const page = await context.newPage();

  // initialize counters in node context (we will update via console messages)
  const metrics = {
    websocket: 0,
    wasm: 0,
    hash_function: 0,
    webworkers: 0,
    messageloop_load: 0,
    postmessage_load: 0,
    parallel_functions: 0
  };

  try {
    // intercept websockets
    page.on("websocket", ws => {
      metrics.websocket++;
      // increment message loop load roughly when frames are received (best-effort)
      ws.on("framereceived", () => { metrics.messageloop_load++; });
    });

    // Listen to console messages (we will inject logs from page)
    page.on("console", msg => {
      const text = msg.text();
      if (text.includes("OUTGUARD: wasm")) metrics.wasm++;
      if (text.includes("OUTGUARD: hash")) metrics.hash_function++;
      if (text.includes("OUTGUARD: worker")) metrics.webworkers++;
      if (text.includes("OUTGUARD: postMessage")) metrics.postmessage_load++;
      if (text.includes("OUTGUARD: timer")) metrics.messageloop_load++;
    });

    // Inject script early to hook APIs and emit console logs the server listens for
    await page.addInitScript(() => {
      // Hook Worker
      (function() {
        const OrigWorker = window.Worker;
        if (!OrigWorker) return;
        function WrappedWorker(...args) {
          try { console.log("OUTGUARD: worker"); } catch(_) {}
          return new OrigWorker(...args);
        }
        WrappedWorker.prototype = OrigWorker.prototype;
        window.Worker = WrappedWorker;
      })();

      // Hook postMessage
      (function() {
        const origPost = window.postMessage;
        window.postMessage = function(...args) {
          try { console.log("OUTGUARD: postMessage"); } catch(_) {}
          return origPost.apply(this, args);
        };
      })();

      // Hook crypto.subtle.digest
      (function() {
        try {
          if (window.crypto && window.crypto.subtle && window.crypto.subtle.digest) {
            const origDigest = window.crypto.subtle.digest;
            window.crypto.subtle.digest = function(...a) {
              try { console.log("OUTGUARD: hash"); } catch(_) {}
              return origDigest.apply(this, a);
            };
          }
        } catch(_) {}
      })();

      // Hook setTimeout/setInterval to signal timer use
      (function() {
        const origSetTimeout = window.setTimeout;
        window.setTimeout = function(...a) {
          try { console.log("OUTGUARD: timer"); } catch(_) {}
          return origSetTimeout.apply(this, a);
        };
        const origSetInterval = window.setInterval;
        window.setInterval = function(...a) {
          try { console.log("OUTGUARD: timer"); } catch(_) {}
          return origSetInterval.apply(this, a);
        };
      })();

      // Optionally detect WebAssembly instantiation via override
      (function() {
        try {
          const origInstantiate = WebAssembly.instantiate;
          if (origInstantiate) {
            WebAssembly.instantiate = function(...a) {
              try { console.log("OUTGUARD: wasm"); } catch(_) {}
              return origInstantiate.apply(this, a);
            };
          }
        } catch(_) {}
      })();
    });

    // Navigate and wait
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60000 }).catch(e => {
      console.warn(`[monitor] page.goto warning: ${e.message || e}`);
    });

    console.log(`⏱ [monitor] Collecting activity for ${COLLECT_SECONDS}s ...`);
    await page.waitForTimeout(COLLECT_SECONDS * 1000);

    // compute parallel_functions heuristically
    metrics.parallel_functions = metrics.hash_function + metrics.webworkers + metrics.postmessage_load;

    console.log("📊 [monitor] Extracted features:", metrics);

    // Send to Flask API (if available) and return API response + metrics
    let apiResponse = null;
    try {
      const resp = await fetch(API_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(metrics)
      });
      apiResponse = await resp.json();
      console.log("🔮 [monitor] API response:", apiResponse);
    } catch (err) {
      console.warn("[monitor] Could not reach Flask API:", err.message || err);
    }

    await browser.close();
    return { metrics, apiResponse };
  } catch (err) {
    try { await browser.close(); } catch(_) {}
    throw err;
  }
}

// Export
module.exports = { monitor };
