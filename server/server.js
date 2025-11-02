// server/server.js
// Node server with local Python integration for web_model.py

const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const axios = require("axios");
const { spawn } = require("child_process");
const http = require("http");
const { Server } = require("socket.io");
const { monitor } = require("../collector/monitor");

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

app.use(cors());
app.use(bodyParser.json({ limit: "1mb" }));
app.use(express.static(path.join(__dirname, "public")));

const PORT = process.env.PORT || 3000;
const SAVE_PATH = path.join(__dirname, "../collector/dataset_enriched.json");
const CPU_MODEL_API = process.env.CPU_MODEL_API || "http://127.0.0.1:8000/check";
const API_TIMEOUT = 5000;

// ---------------- CPU MODEL CALLS ----------------
async function callCpuModelApi(metrics) {
  const resp = await axios.post(CPU_MODEL_API, metrics, { timeout: API_TIMEOUT });
  return resp.data;
}

function callCpuModelLocal() {
  return new Promise((resolve, reject) => {
    const scriptPath = path.join(__dirname, "cpu_model.py");
    const py = spawn("python", [scriptPath], { cwd: __dirname });

    let stdout = "";
    let stderr = "";

    py.stdout.on("data", (data) => (stdout += data.toString()));
    py.stderr.on("data", (data) => (stderr += data.toString()));

    py.on("close", (code) => {
      if (stderr.trim()) console.warn("CPU Model Error (stderr):", stderr.trim());
      try {
        const parsed = JSON.parse(stdout.trim());
        resolve(parsed);
      } catch {
        resolve({ raw: stdout.trim() });
      }
    });

    py.on("error", reject);
  });
}

// ---------------- WEB MODEL CALL (LOCAL) ----------------
function callWebModelLocal(webFeatures) {
  return new Promise((resolve, reject) => {
    const scriptPath = path.join(__dirname, "web_model.py");
    const py = spawn("python", [scriptPath, JSON.stringify(webFeatures)], { cwd: __dirname });

    let stdout = "";
    let stderr = "";

    py.stdout.on("data", (data) => (stdout += data.toString()));
    py.stderr.on("data", (data) => (stderr += data.toString()));

    py.on("close", (code) => {
      if (stderr.trim()) console.warn("Web Model Error:", stderr.trim());
      const output = stdout.trim().toLowerCase();
      if (output.includes("crypto")) resolve({ prediction: 1, label: "cryptojack_detected" });
      else resolve({ prediction: 0, label: "benign" });
    });

    py.on("error", reject);
  });
}

// ---------------- HELPERS ----------------
function saveResults(results) {
  try {
    fs.writeFileSync(SAVE_PATH, JSON.stringify(results, null, 2));
    console.log("📁 Results saved to", SAVE_PATH);
  } catch (err) {
    console.warn("⚠️ Could not save results:", err.message || err);
  }
}

function normalizeCpuResponse(cpuModelResponse) {
  let cpuPred = cpuModelResponse.prediction ?? 0;
  let cpuLabel = cpuModelResponse.label ?? "benign";
  let cpuProb = cpuModelResponse.prob ?? null;

  if (typeof cpuPred !== "number") {
    const raw = (cpuModelResponse.raw || "").toLowerCase();
    if (raw.includes("crypto")) cpuPred = 1, cpuLabel = "cryptojack_detected";
    else cpuPred = 0, cpuLabel = "benign";
  }

  return { cpuPred, cpuLabel, cpuProb };
}

// ---------------- MAIN ROUTE ----------------
app.post("/tabs", async (req, res) => {
  const tabs = req.body.tabs || [];
  if (!tabs.length) return res.status(400).json({ error: "No tabs provided" });

  console.log(`\n📥 Received ${tabs.length} tab(s) from extension.`);
  const results = [];

  for (const url of tabs) {
    console.log(`\n🔍 Monitoring: ${url}`);
    try {
      const collected = await monitor(url);
      const metrics = collected?.metrics || {};

      let cpuModelResponse;
      try {
        cpuModelResponse = await callCpuModelApi(metrics);
      } catch {
        cpuModelResponse = await callCpuModelLocal();
      }

      const { cpuPred, cpuLabel } = normalizeCpuResponse(cpuModelResponse);
      console.log(`CPU verdict for ${url}: ${cpuLabel}`);

      let webModelResponse = null;
      let finalVerdict = cpuLabel;

      if (cpuPred === 1) {
        console.log("⚠️ Suspicious CPU — invoking local web model...");
        const webFeatures = {
          websocket: 1, wasm: 1, hash_function: 1,
          webworkers: 0, messageloop_load: 0.3,
          postmessage_load: 0.5, parallel_functions: 1
        };
        webModelResponse = await callWebModelLocal(webFeatures);
        finalVerdict = webModelResponse.label;
      } else {
        console.log("✅ CPU benign — skipping web model.");
      }

      const record = { url, metrics, cpu_model: cpuModelResponse, web_model: webModelResponse, finalVerdict, timestamp: new Date().toISOString() };
      results.push(record);
      console.log("✅ Final verdict for", url, "→", finalVerdict);
      console.log("-------------------------------------------");
    } catch (err) {
      console.error("❌ Error processing:", err.message || err);
    }
  }

  saveResults(results);
  io.emit("newDetection", results);
  res.json({ status: "ok", processed: results.length, results });
});

// ---------------- HEALTH + SERVER ----------------
app.get("/health", (req, res) => res.json({ status: "ok", time: new Date().toISOString() }));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

server.listen(PORT, () => {
  console.log(`🚀 Server + Dashboard running at http://localhost:${PORT}`);
  console.log("Waiting for URLs from Chrome extension...");
});
