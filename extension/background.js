// background.js
// Listens for popup requests, posts to Node server, returns response to popup

const SERVER_TABS_ENDPOINT = "http://localhost:3000/tabs";

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg && msg.action === "scanTab" && msg.url) {
    const payload = { tabs: [msg.url], features: msg.features || null };

    fetch(SERVER_TABS_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
      .then((r) => r.json())
      .then((data) => {
        console.log("Server response:", data);
        // send response back to popup (if present)
        sendResponse({ ok: true, data });
        // optionally show desktop notification
        const final = data.results && data.results[0] && data.results[0].finalVerdict;
        if (final && final !== "benign") {
          chrome.notifications.create({
            type: "basic",
            iconUrl: "icon48.png",
            title: "Cryptojacking Alert",
            message: `${msg.url}\nVerdict: ${final}`,
          });
        }
      })
      .catch((err) => {
        console.error("Error contacting server:", err);
        sendResponse({ ok: false, error: err.toString() });
      });

    // Required for async sendResponse
    return true;
  }
});
