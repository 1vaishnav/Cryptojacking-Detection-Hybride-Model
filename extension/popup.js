document.getElementById("scanBtn").addEventListener("click", async () => {
  const statusEl = document.getElementById("status");
  const loaderEl = document.getElementById("loader");
  const detailsEl = document.getElementById("details");

  detailsEl.style.display = "none";
  statusEl.textContent = "Scanning...";
  statusEl.className = "";
  loaderEl.style.display = "block";

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab) {
    alert("No active tab found.");
    return;
  }

  chrome.runtime.sendMessage({ action: "scanTab", url: tab.url }, (resp) => {
    loaderEl.style.display = "none";

    if (!resp) {
      statusEl.textContent = "Error: No response.";
      statusEl.className = "result-unknown";
      return;
    }

    if (!resp.ok) {
      statusEl.textContent = "Server Error";
      statusEl.className = "result-bad";
      return;
    }

    const result = resp.data?.results?.[0];
    if (!result) {
      statusEl.textContent = "No result received.";
      statusEl.className = "result-unknown";
      return;
    }

    // Set verdict colors
    if (result.finalVerdict === "Safe") {
      statusEl.className = "result-good";
    } else if (result.finalVerdict === "Malicious") {
      statusEl.className = "result-bad";
    } else {
      statusEl.className = "result-unknown";
    }

    statusEl.textContent = `Verdict: ${result.finalVerdict}`;

    detailsEl.style.display = "block";
    detailsEl.textContent = JSON.stringify(result, null, 2);
  });
});
