// monitor.js
/*const { chromium } = require("playwright");
const fetch = require("node-fetch");

async function monitor(url) {
  console.log(`🌐 Opening ${url}...`);
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60000 });

    // ==== Feature Extraction (only 5 features) ====
    let wasmDetected = await page.evaluate(() => typeof WebAssembly !== "undefined");
    let websocketDetected = await page.evaluate(() => typeof WebSocket !== "undefined");
    let webWorkersDetected = await page.evaluate(() => typeof Worker !== "undefined");
    let postMessageDetected = await page.evaluate(() => typeof window.postMessage !== "undefined");
    let hashFunctionDetected = await page.evaluate(() =>
      typeof window.crypto !== "undefined" || typeof window.SubtleCrypto !== "undefined"
    );

    // === Final feature vector ===
    const features = {
      wasm: wasmDetected ? 1 : 0,
      websocket: websocketDetected ? 1 : 0,
      webworkers: webWorkersDetected ? 1 : 0,
      postmessage_load: postMessageDetected ? 1 : 0,
      hash_function: hashFunctionDetected ? 1 : 0,
    };

    console.log("📊 Extracted features:", features);

    // === Send to API ===
    const response = await fetch("http://127.0.0.1:5000/predict", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(features),
    });

    const prediction = await response.json();
    console.log("🔮 Prediction:", prediction);
  } catch (err) {
    console.error("❌ Error while monitoring:", err.message);
  } finally {
    await browser.close();
  }
}

// Run from CLI
if (process.argv.length < 3) {
  console.error("Usage: node monitor.js <url>");
  process.exit(1);
}

const targetUrl = process.argv[2];
monitor(targetUrl);
*/
// monitor.js (Playwright-based, richer features + hybrid rule)
// Usage: node monitor.js <url>
// Requires: npm i playwright node-fetch
// After installing playwright package run: npx playwright install

const { chromium } = require('playwright');
const fetch = require('node-fetch'); // for sending to your Flask API (optional)

const API_ENDPOINT = 'http://127.0.0.1:5000/predict'; // change if needed
const COLLECT_SECONDS = 12; // how long to observe page activity (increase for more confidence)

function nowMs(){ return (new Date()).getTime(); }

async function monitor(url) {
  console.log(`🌐 Opening ${url} ...`);
  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
  const context = await browser.newContext({ ignoreHTTPSErrors: true });
  const page = await context.newPage();

  // Add init script so hooks exist before target page executes any code
  await page.addInitScript(() => {
    // counters
    window.___wsOpenCount = 0;
    window.___wsMsgCount = 0;
    window.___wasmInstantiateCount = 0;
    window.___workerCount = 0;
    window.___postMessageCount = 0;
    window.___hashDigestCount = 0;
    window.___wsFirstOpenTs = 0;

    // ---- Hook WebSocket to count opens and messages ----
    (function() {
      const OrigWS = window.WebSocket;
      if (!OrigWS) return;
      function WrappedWS(url, protocols) {
        const ws = protocols ? new OrigWS(url, protocols) : new OrigWS(url);
        try {
          window.___wsOpenCount = (window.___wsOpenCount || 0) + 1;
          if (!window.___wsFirstOpenTs) window.___wsFirstOpenTs = Date.now();
        } catch (_) {}
        // intercept onmessage to count messages
        const origAddEventListener = ws.addEventListener;
        ws.addEventListener = function(type, cb) {
          if (type === 'message') {
            const wrapped = function(ev) {
              try { window.___wsMsgCount = (window.___wsMsgCount || 0) + 1; } catch(_) {}
              try { cb.call(this, ev); } catch(e) {}
            };
            return origAddEventListener.call(this, type, wrapped);
          }
          return origAddEventListener.call(this, type, cb);
        };
        // intercept onmessage property
        Object.defineProperty(ws, 'onmessage', {
          set(fn) {
            const wrapped = function(ev) {
              try { window.___wsMsgCount = (window.___wsMsgCount || 0) + 1; } catch(_) {}
              try { fn && fn.call(this, ev); } catch(e) {}
            };
            // store it in a hidden field to avoid recursion
            this.__onm = wrapped;
          },
          get() { return this.__onm; }
        });
        return ws;
      }
      WrappedWS.prototype = OrigWS.prototype;
      window.WebSocket = WrappedWS;
    })();

    // ---- Hook WebAssembly.instantiate / compile ----
    (function() {
      try {
        const origInstantiate = WebAssembly.instantiate;
        const origCompile = WebAssembly.compile;
        WebAssembly.instantiate = function(...args) {
          try { window.___wasmInstantiateCount = (window.___wasmInstantiateCount || 0) + 1; } catch(_) {}
          return origInstantiate.apply(this, args);
        };
        WebAssembly.compile = function(...args) {
          try { window.___wasmInstantiateCount = (window.___wasmInstantiateCount || 0) + 1; } catch(_) {}
          return origCompile.apply(this, args);
        };
      } catch (_) {}
    })();

    // ---- Hook Worker creation ----
    (function() {
      const OrigWorker = window.Worker;
      if (!OrigWorker) return;
      function WrappedWorker(...args) {
        try { window.___workerCount = (window.___workerCount || 0) + 1; } catch(_) {}
        return new OrigWorker(...args);
      }
      WrappedWorker.prototype = OrigWorker.prototype;
      window.Worker = WrappedWorker;
    })();

    // ---- Hook postMessage usage on window (main thread messages) ----
    (function() {
      const origPost = window.postMessage;
      window.postMessage = function(...args) {
        try { window.___postMessageCount = (window.___postMessageCount || 0) + 1; } catch(_) {}
        return origPost.apply(this, args);
      };
    })();

    // ---- Hook SubtleCrypto.digest for detecting hash calls ----
    (function() {
      try {
        const subtle = window.crypto && window.crypto.subtle;
        if (subtle && subtle.digest) {
          const origDigest = subtle.digest;
          window.crypto.subtle.digest = function(...args) {
            try {
              // increment if digest called (used in mining or crypto ops)
              window.___hashDigestCount = (window.___hashDigestCount || 0) + 1;
            } catch(_) {}
            return origDigest.apply(this, args);
          };
        }
      } catch(_) {}
    })();
  });

  // navigate
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
  } catch (err) {
    console.error('❌ Failed to open site:', err.message || err);
    await browser.close();
    return;
  }

  // Let scripts run and accumulate data
  console.log(`⏱ Collecting activity for ${COLLECT_SECONDS}s ...`);
  await page.waitForTimeout(COLLECT_SECONDS * 1000);

  // Now gather metrics from page context
  const metrics = await page.evaluate((COLLECT_SECONDS) => {
  // count .wasm resources & total transfer size if available
  let wasmResources = performance.getEntriesByType('resource').filter(r => r.name && r.name.endsWith('.wasm'));
  let wasm_count = wasmResources.length;
  let wasm_bytes = 0;
  try {
    wasmResources.forEach(r => {
      if (r.transferSize) wasm_bytes += r.transferSize;
      else if (r.encodedBodySize) wasm_bytes += (r.encodedBodySize || 0);
    });
  } catch(_) {}

  // timestamps
  const firstWsTs = window.___wsFirstOpenTs || 0;
  const nowTs = Date.now();
  const observedSec = (nowTs - (firstWsTs || nowTs - (COLLECT_SECONDS*1000))) / 1000;

  // counters
  const wsOpen = window.___wsOpenCount || 0;
  const wsMsg = window.___wsMsgCount || 0;
  const workers = window.___workerCount || 0;
  const postmsg = window.___postMessageCount || 0;
  const hashCalls = window.___hashDigestCount || 0;
  const wasmInst = window.___wasmInstantiateCount || 0;

  const ws_msgs_per_sec = observedSec > 0 ? (wsMsg / observedSec) : 0;
  const postmsg_per_sec = observedSec > 0 ? (postmsg / observedSec) : 0;
  const hash_per_sec = observedSec > 0 ? (hashCalls / observedSec) : 0;

  const scriptCount = document.scripts ? document.scripts.length : 0;

  return {
    wasm_count,
    wasm_bytes,
    wasm_instantiations: wasmInst,
    websocket_open: wsOpen,
    websocket_msgs: wsMsg,
    websocket_msgs_per_sec: Number(ws_msgs_per_sec.toFixed(3)),
    webworkers: workers,
    postmessage_count: postmsg,
    postmessage_per_sec: Number(postmsg_per_sec.toFixed(3)),
    hash_calls: hashCalls,
    hash_per_sec: Number(hash_per_sec.toFixed(3)),
    scripts: scriptCount,
    observed_seconds: Number(observedSec.toFixed(2))
  };
}, COLLECT_SECONDS);  // 👈 pass it in here

  // build numeric feature vector (example of richer features)
  console.log('📊 Extracted metrics:', metrics);

  // Simple hybrid rule (example):
  // If there is Wasm instantiation AND at least one WS open AND >0 workers AND ws message rate > 0.5 => HIGH SUSPICION
  const ruleSuspicious = (metrics.wasm_instantiations > 0 || metrics.wasm_count > 0) &&
                         (metrics.websocket_open > 0) &&
                         (metrics.webworkers >= 1) &&
                         (metrics.websocket_msgs_per_sec > 0.5);

  if (ruleSuspicious) {
    console.log('⚠️ HYBRID RULE: Strong sign of cryptojacking (rule match).');
  } else {
    console.log('ℹ️ HYBRID RULE: No strong rule-trigger match.');
  }

  // OPTIONAL: send to your Flask API (if running)
  let apiResponse = null;
  try {
    // Map features to the fields your model expects. Adjust names/order to fit your trained model.
    const payload = {
      // keep both binary and numeric versions so ML can learn thresholds:
      wasm_binary: (metrics.wasm_count > 0 || metrics.wasm_instantiations > 0) ? 1 : 0,
      wasm_count: metrics.wasm_count,
      wasm_bytes: metrics.wasm_bytes,
      wasm_instantiations: metrics.wasm_instantiations,
      websocket_open: metrics.websocket_open,
      websocket_msgs: metrics.websocket_msgs,
      websocket_msgs_per_sec: metrics.websocket_msgs_per_sec,
      webworkers: metrics.webworkers,
      postmessage_count: metrics.postmessage_count,
      postmessage_per_sec: metrics.postmessage_per_sec,
      hash_calls: metrics.hash_calls,
      hash_per_sec: metrics.hash_per_sec,
      scripts: metrics.scripts,
      observed_seconds: metrics.observed_seconds,
      ruleSuspicious: ruleSuspicious ? 1 : 0
    };

    // Only send if your API exists. Wrap in try-catch to avoid crashing.
    const resp = await fetch(API_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    apiResponse = await resp.json();
    console.log('🔮 API response:', apiResponse);
  } catch (e) {
    console.log('⚠️ Could not send features to API (is it running?), skipping API send.');
  }

  await browser.close();

  // Final printout combining local rule + API
  return { metrics, ruleSuspicious, apiResponse };
}

module.exports = { monitor };   // export monitor function

// Run only if called directly from terminal
if (require.main === module) {
  const url = process.argv[2];
  if (!url) {
    console.error('Usage: node monitor.js <url>');
    process.exit(1);
  }

  monitor(url).then(result => {
    console.log('\n=== FINAL RESULT ===');
    console.log(JSON.stringify(result, null, 2));
  }).catch(err => {
    console.error('Error in monitor:', err);
  });
}

