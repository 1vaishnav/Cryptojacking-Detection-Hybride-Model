// popup.js
document.getElementById("scan").addEventListener("click", async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab) return alert("No active tab found.");

  const url = tab.url;
  // Show immediate feedback
  document.getElementById("status").textContent = "Scanning...";

  // Ask background to scan this tab
  chrome.runtime.sendMessage({ action: "scanTab", url }, (resp) => {
    if (!resp) {
      document.getElementById("status").textContent = "No response from background.";
      return;
    }
    if (!resp.ok) {
      document.getElementById("status").textContent = "Server error: " + (resp.error || "unknown");
      return;
    }

    // Show server result
    const data = resp.data;
    // data.results[0].finalVerdict expected; adapt if different
    const result = data.results && data.results[0] ? data.results[0] : null;
    if (result) {
      document.getElementById("status").textContent = `Verdict: ${result.finalVerdict || "unknown"}`;
      document.getElementById("details").textContent = JSON.stringify(result, null, 2);
    } else {
      document.getElementById("status").textContent = "No result returned.";
    }
  });
});
