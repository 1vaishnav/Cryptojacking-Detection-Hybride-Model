# Cryptojacking Detection System - Full Architecture

## 1. System Overview

A **Hybrid Machine Learning-based Cryptojacking Detection System** that combines:
- **CPU-level Analysis** (System Resource Metrics)
- **Web-level Analysis** (JavaScript Behavior Detection)
- **Chrome Extension** (Client-side Data Collection)
- **Backend Server** (Central Processing & ML Pipeline)

---

## 2. Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                        USER'S BROWSER                               │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │           CHROME EXTENSION (Manifest v3)                     │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │  │
│  │  │ Popup UI     │  │ Background   │  │ Content      │       │  │
│  │  │ popup.html   │  │ Service      │  │ Script       │       │  │
│  │  │ popup.js     │  │ background.js│  │ content.js   │       │  │
│  │  │ style.css    │  │              │  │              │       │  │
│  │  └──────────────┘  └──────────────┘  └──────────────┘       │  │
│  │                                                               │  │
│  │  ┌─────────────────────────────────────────────────────┐    │  │
│  │  │  Data Collection                                    │    │  │
│  │  │  • URL from active tabs                             │    │  │
│  │  │  • System metrics (CPU, memory, network)            │    │  │
│  │  │  • Web behavior indicators                          │    │  │
│  │  └─────────────────────────────────────────────────────┘    │  │
│  │                             ▼                                │  │
│  │  ┌─────────────────────────────────────────────────────┐    │  │
│  │  │  POST /tabs Request                                │    │  │
│  │  │  {tabs: ["url1", "url2", ...]}                     │    │  │
│  │  └─────────────────────────────────────────────────────┘    │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                             │                                       │
│                   HTTP POST (localhost:3000)                        │
│                             ▼                                       │
└─────────────────────────────────────────────────────────────────────┘


┌─────────────────────────────────────────────────────────────────────┐
│                      BACKEND SERVER                                 │
│                  (Node.js Express + Python)                         │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │            EXPRESS SERVER (server.js)                        │  │
│  │  ┌────────────────────────────────────────────────────────┐ │  │
│  │  │  POST /tabs Route Handler                              │ │  │
│  │  │  • Receives tab URLs from extension                    │ │  │
│  │  │  • Iterates through each URL                           │ │  │
│  │  └────────────────────────────────────────────────────────┘ │  │
│  │                       ▼                                      │  │
│  │  ┌────────────────────────────────────────────────────────┐ │  │
│  │  │  PLAYWRIGHT MONITOR (monitor.js)                       │ │  │
│  │  │  ┌──────────────────────────────────────────────────┐  │ │  │
│  │  │  │ 1. Launch headless browser                       │  │ │  │
│  │  │  │ 2. Navigate to URL                               │  │ │  │
│  │  │  │ 3. Inject API hooks for:                         │  │ │  │
│  │  │  │    • WebWorkers                                  │  │ │  │
│  │  │  │    • WebAssembly                                 │  │ │  │
│  │  │  │    • Crypto APIs                                 │  │ │  │
│  │  │  │    • Message Loops                               │  │ │  │
│  │  │  │ 4. Collect 7 web behavior features               │  │ │  │
│  │  │  │ 5. Monitor for 12 seconds                        │  │ │  │
│  │  │  └──────────────────────────────────────────────────┘  │ │  │
│  │  │                       ▼                                  │ │  │
│  │  │  Web Features Collected:                                │ │  │
│  │  │  • websocket (0/1)                                      │ │  │
│  │  │  • wasm (0/1)                                           │ │  │
│  │  │  • hash_function (0/1)                                  │ │  │
│  │  │  • webworkers (0/1)                                     │ │  │
│  │  │  • messageloop_load (float)                             │ │  │
│  │  │  • postmessage_load (float)                             │ │  │
│  │  │  • parallel_functions (0/1)                             │ │  │
│  │  └────────────────────────────────────────────────────────┘ │  │
│  │                       ▼                                      │  │
│  │  ┌────────────────────────────────────────────────────────┐ │  │
│  │  │  SYSTEM METRICS COLLECTION (psutil)                    │ │  │
│  │  │  ┌──────────────────────────────────────────────────┐  │ │  │
│  │  │  │ CPU Metrics (4 features)                         │  │ │  │
│  │  │  │ • cpu_idle, cpu_system, cpu_total, cpu_user      │  │ │  │
│  │  │  ├──────────────────────────────────────────────────┤  │ │  │
│  │  │  │ Memory Metrics (5 features)                      │  │ │  │
│  │  │  │ • mem_available, mem_buffered, mem_cached,       │  │ │  │
│  │  │  │   mem_free, mem_total, mem_used, mem_used_%      │  │ │  │
│  │  │  ├──────────────────────────────────────────────────┤  │ │  │
│  │  │  │ Network I/O (6 features)                         │  │ │  │
│  │  │  │ • bytes_recv, bytes_sent, dropin, dropout,       │  │ │  │
│  │  │  │   packets_recv, packets_sent                     │  │ │  │
│  │  │  ├──────────────────────────────────────────────────┤  │ │  │
│  │  │  │ Disk I/O (4 features)                            │  │ │  │
│  │  │  │ • read_bytes, write_bytes, read_time, write_time │  │ │  │
│  │  │  ├──────────────────────────────────────────────────┤  │ │  │
│  │  │  │ Process Load (5 features)                        │  │ │  │
│  │  │  │ • loadavg_1min, loadavg_5min, loadavg_15min,    │  │ │  │
│  │  │  │   num_threads, num_running/sleeping/stopped     │  │ │  │
│  │  │  ├──────────────────────────────────────────────────┤  │ │  │
│  │  │  │ System Info (3 features)                         │  │ │  │
│  │  │  │ • uptime, cpu_frequency, cpu_count               │  │ │  │
│  │  │  └──────────────────────────────────────────────────┘  │ │  │
│  │  │                                                          │ │  │
│  │  │  Total: 34 System Features                              │ │  │
│  │  └────────────────────────────────────────────────────────┘ │  │
│  │                       ▼                                      │  │
│  │  ┌────────────────────────────────────────────────────────┐ │  │
│  │  │  DUAL ML PIPELINE                                       │ │  │
│  │  │                                                          │ │  │
│  │  │  ┌─ STAGE 1: CPU MODEL ──────────────────────────────┐ │  │
│  │  │  │                                                    │ │  │
│  │  │  │  Input: 34 System Metrics                         │ │  │
│  │  │  │  Model: Random Forest Classifier                  │ │  │
│  │  │  │  • n_estimators: 100                              │ │  │
│  │  │  │  • File: rf_model.pkl                             │ │  │
│  │  │  │                                                    │ │  │
│  │  │  │  Prediction:                                       │ │  │
│  │  │  │  • 0 = Benign (Normal CPU usage)                  │ │  │
│  │  │  │  • 1 = Suspicious (High CPU usage detected)       │ │  │
│  │  │  │                                                    │ │  │
│  │  │  └────────────────────────────────────────────────────┘ │  │
│  │  │                       ▼                                  │  │
│  │  │           Is CPU Prediction = 1 (Suspicious)?            │  │
│  │  │                       │                                  │  │
│  │  │           ┌───────────┼───────────┐                      │  │
│  │  │           │ YES       │ NO        │                      │  │
│  │  │           ▼           ▼           │                      │  │
│  │  │  ┌──────────────┐  Benign ────────┘                      │  │
│  │  │  │ STAGE 2:     │                                        │  │
│  │  │  │ WEB MODEL    │                                        │  │
│  │  │  │              │                                        │  │
│  │  │  │ Input: 7     │                                        │  │
│  │  │  │ Web Features │                                        │  │
│  │  │  │              │                                        │  │
│  │  │  │ Model: Random│                                        │  │
│  │  │  │ Forest       │                                        │  │
│  │  │  │              │                                        │  │
│  │  │  │ Prediction:  │                                        │  │
│  │  │  │ • 0 = Benign │                                        │  │
│  │  │  │ • 1 = Crypto │                                        │  │
│  │  │  │   Detected   │                                        │  │
│  │  │  └──────────────┘                                        │  │
│  │  │           ▼                                              │  │
│  │  │  ┌──────────────────────────────────────────────────┐   │  │
│  │  │  │ FINAL VERDICT (Ensemble Decision)               │   │  │
│  │  │  │ CPU Normal + Web N/A = BENIGN                   │   │  │
│  │  │  │ CPU Suspicious + Web Benign = BENIGN            │   │  │
│  │  │  │ CPU Suspicious + Web Crypto = CRYPTOJACK        │   │  │
│  │  │  └──────────────────────────────────────────────────┘   │  │
│  │  └────────────────────────────────────────────────────────┘ │  │
│  │                       ▼                                      │  │
│  │  ┌────────────────────────────────────────────────────────┐ │  │
│  │  │  RESULT AGGREGATION                                     │ │  │
│  │  │  {                                                       │ │  │
│  │  │    url: "https://example.com",                          │ │  │
│  │  │    metrics: { 34 system metrics },                       │ │  │
│  │  │    cpu_model: { prediction, label, prob },              │ │  │
│  │  │    web_model: { prediction, label },                    │ │  │
│  │  │    finalVerdict: "benign" | "cryptojack_detected",      │ │  │
│  │  │    timestamp: "2025-11-15T10:30:00Z"                    │ │  │
│  │  │  }                                                       │ │  │
│  │  └────────────────────────────────────────────────────────┘ │  │
│  │                       ▼                                      │  │
│  │  ┌────────────────────────────────────────────────────────┐ │  │
│  │  │  PERSISTENT STORAGE                                     │ │  │
│  │  │  File: dataset_enriched.json                            │ │  │
│  │  │  • Appends results                                       │ │  │
│  │  │  • Avoids duplicates (by URL)                           │ │  │
│  │  │  • Maintains historical data                            │ │  │
│  │  └────────────────────────────────────────────────────────┘ │  │
│  │                                                              │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  RESPONSE TO EXTENSION                                       │  │
│  │  {                                                            │  │
│  │    results: [                                                │  │
│  │      { url, verdict, cpu_pred, web_pred, finalVerdict },    │  │
│  │      ...                                                      │  │
│  │    ]                                                          │  │
│  │  }                                                            │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 3. Component Details

### 3.1 Chrome Extension

**Location**: `extension/`

**Files**:
- `manifest.json` - Extension configuration (Manifest v3)
- `popup.html/js/css` - User interface
- `background.js` - Service worker (non-persistent background logic)
- `content.js` - Content script injected into web pages

**Capabilities**:
- Reads currently active browser tabs
- Communicates with local server
- Displays detection results to user
- Maintains user session state

**Permissions**:
- `tabs` - Access to tab information
- `activeTab` - Current active tab
- `scripting` - Inject scripts into pages
- `host_permissions` - Communication with localhost and all URLs

---

### 3.2 Backend Server Architecture

**Location**: `server/`

**Core Components**:

#### 3.2.1 Express Server (server.js)
```
POST /tabs
├─ Receive tab URLs from extension
├─ For each URL:
│  ├─ Call monitor(url) → Playwright-based web analysis
│  ├─ Call callCpuModelApi() → CPU metrics analysis
│  └─ Combine results → Save to dataset_enriched.json
└─ Return aggregated results
```

#### 3.2.2 Web Monitoring Module (monitor.js)
- **Framework**: Playwright (Chromium-based)
- **Technique**: API Hooking
- **Duration**: 12 seconds per URL
- **Features Collected**:
  1. `websocket` - WebSocket usage detection
  2. `wasm` - WebAssembly compilation
  3. `hash_function` - Cryptographic hash operations
  4. `webworkers` - Multi-threaded execution
  5. `messageloop_load` - Event loop activity
  6. `postmessage_load` - Cross-context messaging
  7. `parallel_functions` - Parallel computation

#### 3.2.3 CPU Metrics Module (cpu_model.py)
- **Framework**: psutil
- **Metrics Collected**: 34 features across 7 categories
  - CPU usage patterns
  - Memory allocation
  - Network I/O patterns
  - Disk I/O operations
  - Process load metrics
  - System information

---

### 3.3 Machine Learning Models

**Location**: `ml model/`

#### 3.3.1 CPU Model
- **File**: `cpu_model.pkl` (Random Forest)
- **Input Features**: 34 system metrics
- **Training Data**:
  - Normal: `final-normal-data-set.csv`
  - Abnormal: `final-anormal-data-set.csv`
- **Accuracy**: ~100% on training, validated performance
- **Threshold**: 0.5 (binary classification)
- **Output**: 
  - 0 = Benign (normal resource usage)
  - 1 = Suspicious (anomalous resource usage)

#### 3.3.2 Web Model
- **File**: `cryptojacking_detector_7feat.pkl` (Random Forest)
- **Input Features**: 7 web behavior indicators
- **Training Data**:
  - Benign: `benign_set.csv`
  - Crypto: `crypto_set.csv`
- **Accuracy**: 99.875% on testing data
- **Output**:
  - 0 = Benign (normal web behavior)
  - 1 = Cryptojacking detected (suspicious web behavior)

---

### 3.4 Detection Pipeline (Two-Stage Ensemble)

```
URL → [STAGE 1: CPU MODEL]
              │
              ├─ Benign (pred=0) → FINAL: BENIGN ✓
              │
              └─ Suspicious (pred=1) → [STAGE 2: WEB MODEL]
                                              │
                                              ├─ Benign (pred=0) → FINAL: BENIGN ✓
                                              │
                                              └─ Crypto (pred=1) → FINAL: CRYPTOJACKING ⚠️
```

**Rationale**: 
- CPU model acts as initial gate (fast, low false positives)
- Web model confirms only when CPU is suspicious (reduces computational cost)
- Combined approach reduces false positives while maintaining high detection rate

---

### 3.5 Data Flow

```
USER BROWSER
    │
    ├─ Extension collects open tabs
    │
    └─ POST to http://localhost:3000/tabs
            │
            ├─ For each URL:
            │   │
            │   ├─ Launch Playwright browser
            │   │   │
            │   │   ├─ Inject API hooks
            │   │   ├─ Monitor for 12 seconds
            │   │   └─ Collect 7 web features
            │   │
            │   ├─ Collect 34 system metrics (psutil)
            │   │
            │   ├─ Pass metrics to CPU Model
            │   │   └─ Get CPU prediction
            │   │
            │   ├─ If CPU suspicious:
            │   │   └─ Pass web features to Web Model
            │   │       └─ Get Web prediction
            │   │
            │   └─ Combine predictions
            │
            └─ Save to dataset_enriched.json
                    │
                    └─ Return results to extension
```

---

## 4. Technology Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | JavaScript (Chrome Manifest v3) | Client-side monitoring & UI |
| **Backend** | Node.js + Express.js | API server & orchestration |
| **Browser Automation** | Playwright (Chromium) | Headless web analysis |
| **System Monitoring** | psutil (Python) | CPU/Memory/Network metrics |
| **ML Framework** | scikit-learn (Random Forest) | Predictive models |
| **Data Format** | JSON | Data serialization |
| **Storage** | JSON files | Persistent storage |
| **Protocol** | HTTP/REST | Client-server communication |

---

## 5. Dataset Schema

### 5.1 Result Record
```json
{
  "url": "https://example.com",
  "metrics": {
    "cpu_idle": 45.2,
    "cpu_user": 30.5,
    "mem_available": 8589934592,
    "mem_used_percent": 42.3,
    "net_bytes_recv": 1024000,
    ...
  },
  "cpu_model": {
    "prediction": 0,
    "label": "benign",
    "prob": 0.95
  },
  "web_model": {
    "prediction": 0,
    "label": "benign"
  },
  "finalVerdict": "benign",
  "timestamp": "2025-11-15T10:30:00Z"
}
```

---

## 6. Key Features

### 6.1 Hybrid Detection
- Combines system-level and web-level analysis
- Reduces false positives through two-stage verification
- Leverages both resource anomalies and behavior patterns

### 6.2 Real-time Monitoring
- Analyzes active browser tabs on-demand
- Minimal latency (~15-20 seconds per URL analysis)
- Non-blocking background execution

### 6.3 Persistent Learning
- Stores all analysis results in `dataset_enriched.json`
- Enables historical analysis and model retraining
- Prevents duplicate analysis

### 6.4 Scalability
- Modular architecture allows independent component updates
- ML models can be retrained offline
- Extension can monitor multiple tabs simultaneously

---

## 7. Model Performance Metrics

| Model | Accuracy | Features | Training Data |
|-------|----------|----------|----------------|
| **CPU Model** | ~100% (train) | 34 system metrics | Combined normal/abnormal CSV |
| **Web Model** | 99.875% (test) | 7 web behaviors | 4000 samples (benign + crypto) |

---

## 8. Deployment Architecture

```
Local Machine
├─ Browser (with Extension)
│  └─ Manifest v3 Chrome Extension
├─ Node.js Server (Port 3000)
│  ├─ Express API
│  ├─ Playwright Runner
│  └─ Result Storage
└─ Python Modules
   ├─ cpu_model.py (System metrics)
   └─ web_model.py (Web predictions)

Models
├─ rf_model.pkl (34-feature CPU model)
└─ cryptojacking_detector_7feat.pkl (7-feature web model)

Data
└─ dataset_enriched.json (Historical results)
```

---

## 9. Security Considerations

1. **Local Execution**: All processing happens locally (no cloud transmission)
2. **HTTPS Handling**: Extension ignores HTTPS errors for analysis
3. **Sandboxed Browser**: Playwright runs in headless, sandboxed mode
4. **URL-based Deduplication**: Prevents duplicate analysis of same URLs
5. **No User Data Collection**: Only monitors resource usage patterns

---

## 10. Future Enhancement Opportunities

1. **Real-time Alerts**: Push notifications for detected cryptojacking
2. **Whitelist/Blacklist**: Manage trusted and malicious domains
3. **Extended ML Models**: 
   - Add SVM, Isolation Forest, or Neural Networks
   - Implement ensemble voting
4. **Cloud Integration**: Optional backend sync and distributed analysis
5. **Advanced Analytics**: 
   - Time-series anomaly detection
   - Behavioral clustering
   - Signature extraction
6. **Browser API Logging**: More granular web behavior tracking

---

## 11. Running the System

### Prerequisites
- Node.js (v14+)
- Python (v3.8+)
- Chrome/Chromium browser
- Trained models (.pkl files)

### Startup
```bash
# Terminal 1: Start backend server
cd server
npm install
node server.js

# Terminal 2: Load extension in Chrome
# chrome://extensions/
# Load unpacked → select extension/ folder
```

### Usage
1. Click extension popup
2. View currently open tabs
3. Click "Analyze" or equivalent
4. Extension sends tabs to server
5. Server analyzes each URL
6. Results returned and displayed

---

