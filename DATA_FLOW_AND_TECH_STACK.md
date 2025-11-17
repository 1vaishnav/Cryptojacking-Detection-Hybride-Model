# Cryptojacking Detection System - Data Flow & Tech Stack Diagram

## Complete System Flow with Technology Stack

```
┌─────────────────────────────────────────────────────────────────────────┐
│                       END-TO-END WORKFLOW                               │
└─────────────────────────────────────────────────────────────────────────┘

STEP 1: USER INTERACTION
───────────────────────────────────────────────────────────────────────────
┌──────────────────────────┐
│   User Opens Browser     │
│   (Chrome/Chromium)      │
└────────────┬─────────────┘
             │
             ▼
┌──────────────────────────────────────────────┐
│  Chrome Extension Loaded (Manifest v3)       │
│  ┌──────────────────────────────────────┐   │
│  │ Service Worker Running (Background)  │   │
│  │ Monitoring for User Action           │   │
│  └──────────────────────────────────────┘   │
└────────────┬─────────────────────────────────┘
             │
             ▼
┌──────────────────────────────────────────────┐
│  User Clicks Extension Icon (or Action)      │
│  popup.js → Collects Active Tab URLs         │
│  {                                            │
│    tabs: [                                    │
│      "https://example.com",                   │
│      "https://suspicious-site.com",          │
│      ...                                      │
│    ]                                          │
│  }                                            │
└────────────┬─────────────────────────────────┘
             │
             ▼
┌──────────────────────────────────────────────┐
│  HTTP POST to Server                         │
│  http://localhost:3000/tabs                  │
│  (CORS enabled, JSON payload)                │
└────────────┬─────────────────────────────────┘


STEP 2: SERVER-SIDE PROCESSING
───────────────────────────────────────────────────────────────────────────
             │
             ▼
┌─────────────────────────────────────────────────────────────┐
│           EXPRESS SERVER (Node.js)                          │
│           Port: 3000                                        │
│           Framework: Express.js, Body-Parser, CORS          │
└─────────────────────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────────┐
│  Route: POST /tabs                                          │
│  Handler: app.post("/tabs", async (req, res) => {...})     │
│                                                              │
│  For each URL in tabs array:                                │
└─────────────────────────────────────────────────────────────┘
             │
    ┌────────┴────────┐
    │ FOR EACH URL    │
    └────────┬────────┘
             │
             ▼
┌──────────────────────────────────────────────────────────────┐
│  PARALLEL COLLECTION PHASE                                   │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ A) WEB BEHAVIOR ANALYSIS (12 seconds)                  │ │
│  │    ┌──────────────────────────────────────────────┐   │ │
│  │    │ Playwright (chromium)                        │   │ │
│  │    │ • Launch headless browser                    │   │ │
│  │    │ • Navigate to URL                            │   │ │
│  │    │ • Inject API hooks (Worker, WASM, etc.)     │   │ │
│  │    │ • Listen for console messages                │   │ │
│  │    │ • Track WebSocket frames                     │   │ │
│  │    │ • Collect 7 web features                     │   │ │
│  │    │ • Output: webFeatures object                 │   │ │
│  │    └──────────────────────────────────────────────┘   │ │
│  │                                                         │ │
│  │  Web Features Output:                                  │ │
│  │  {                                                     │ │
│  │    websocket: 1,          // Used?                     │ │
│  │    wasm: 1,               // WASM compiled?            │ │
│  │    hash_function: 1,      // Hash functions used?      │ │
│  │    webworkers: 0,         // Workers used?             │ │
│  │    messageloop_load: 0.3, // Event loop activity       │ │
│  │    postmessage_load: 0.5, // PostMessage traffic       │ │
│  │    parallel_functions: 1  // Parallel execution?       │ │
│  │  }                                                     │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ B) SYSTEM METRICS COLLECTION (Concurrent)             │ │
│  │    ┌──────────────────────────────────────────────┐   │ │
│  │    │ psutil (Python Library)                      │   │ │
│  │    │ • cpu_times_percent() → CPU metrics          │   │ │
│  │    │ • virtual_memory() → Memory metrics           │   │ │
│  │    │ • disk_io_counters() → Disk I/O             │   │ │
│  │    │ • net_io_counters() → Network I/O            │   │ │
│  │    │ • getloadavg() → System load                 │   │ │
│  │    │ • Collect 34 features                        │   │ │
│  │    │ • Output: metrics object                     │   │ │
│  │    └──────────────────────────────────────────────┘   │ │
│  │                                                         │ │
│  │  System Metrics Output (34 features):                   │ │
│  │  {                                                     │ │
│  │    cpu_idle: 45.2,                                    │ │
│  │    cpu_user: 30.5,                                    │ │
│  │    cpu_system: 15.3,                                  │ │
│  │    cpu_total: 45.8,                                   │ │
│  │    mem_available: 8589934592,                         │ │
│  │    mem_used: 6442450944,                              │ │
│  │    mem_used_percent: 42.3,                            │ │
│  │    net_bytes_recv: 1024000,                           │ │
│  │    net_bytes_sent: 512000,                            │ │
│  │    diskio_read_bytes: 2048000,                        │ │
│  │    ... (28 more features)                             │ │
│  │  }                                                     │ │
│  └────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────┘


STEP 3: MACHINE LEARNING INFERENCE
───────────────────────────────────────────────────────────────────────────
             │
             ▼
┌──────────────────────────────────────────────────────────────┐
│  STAGE 1: CPU MODEL INFERENCE                                │
│  ┌────────────────────────────────────────────────────────┐ │
│  │                                                         │ │
│  │  Input: 34 System Metrics                              │ │
│  │         ├─ CPU Usage Patterns                          │ │
│  │         ├─ Memory Allocation Behavior                  │ │
│  │         ├─ Network I/O Patterns                        │ │
│  │         ├─ Disk I/O Operations                         │ │
│  │         └─ Process Load Metrics                        │ │
│  │                                                         │ │
│  │  Model: rf_model.pkl (scikit-learn RandomForest)      │ │
│  │  • n_estimators: 100 trees                             │ │
│  │  • max_depth: auto                                     │ │
│  │  • Training Data: Normal + Abnormal system metrics    │ │
│  │  • Accuracy: ~100% on training                         │ │
│  │                                                         │ │
│  │  Process:                                              │ │
│  │  1. Scale/normalize metrics                            │ │
│  │  2. Pass through 100 decision trees                    │ │
│  │  3. Aggregate predictions (voting)                     │ │
│  │  4. Output probability                                 │ │
│  │                                                         │ │
│  │  Output:                                               │ │
│  │  {                                                     │ │
│  │    prediction: 0 or 1,  // 0=benign, 1=suspicious    │ │
│  │    label: "benign" | "cryptojack_detected",          │ │
│  │    prob: 0.0-1.0        // Confidence score           │ │
│  │  }                                                     │ │
│  │                                                         │ │
│  └────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────┘
             │
             ▼
┌──────────────────────────────────────────────────────────────┐
│  DECISION GATE: Check CPU Prediction                         │
│                                                              │
│  if (cpuPrediction === 0) {                                  │
│    // CPU Model says: NORMAL                                │
│    ├─ Skip Web Model (optimization)                         │
│    ├─ Verdict: BENIGN ✓                                     │
│    └─ Return early                                          │
│  } else {                                                    │
│    // CPU Model says: SUSPICIOUS                            │
│    ├─ Proceed to Stage 2 (Web Model)                        │
│    └─ Verify with behavioral analysis                       │
│  }                                                           │
└──────────────────────────────────────────────────────────────┘
             │
             ▼
┌──────────────────────────────────────────────────────────────┐
│  STAGE 2: WEB MODEL INFERENCE (Only if CPU suspicious)      │
│  ┌────────────────────────────────────────────────────────┐ │
│  │                                                         │ │
│  │  Input: 7 Web Behavior Features                        │ │
│  │         ├─ WebSocket Usage                             │ │
│  │         ├─ WebAssembly Compilation                     │ │
│  │         ├─ Cryptographic Hash Functions                │ │
│  │         ├─ Web Workers (Threading)                     │ │
│  │         ├─ Message Loop Load                           │ │
│  │         ├─ PostMessage Traffic                         │ │
│  │         └─ Parallel Functions                          │ │
│  │                                                         │ │
│  │  Model: cryptojacking_detector_7feat.pkl               │ │
│  │  • Framework: scikit-learn RandomForest                │ │
│  │  • n_estimators: 100 trees                             │ │
│  │  • Training Data: 4000 samples                         │ │
│  │  │  ├─ Benign: benign_set.csv                          │ │
│  │  │  └─ Crypto: crypto_set.csv                          │ │
│  │  • Test Accuracy: 99.875%                              │ │
│  │                                                         │ │
│  │  Process:                                              │ │
│  │  1. Validate all 7 features present                    │ │
│  │  2. Pass through 100 decision trees                    │ │
│  │  3. Aggregate predictions                              │ │
│  │  4. Output classification                              │ │
│  │                                                         │ │
│  │  Output:                                               │ │
│  │  {                                                     │ │
│  │    prediction: 0 or 1,  // 0=benign, 1=crypto        │ │
│  │    label: "benign" | "cryptojack_detected"           │ │
│  │  }                                                     │ │
│  │                                                         │ │
│  └────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────┘


STEP 4: RESULT SYNTHESIS & STORAGE
───────────────────────────────────────────────────────────────────────────
             │
             ▼
┌──────────────────────────────────────────────────────────────┐
│  ENSEMBLE DECISION LOGIC                                     │
│                                                              │
│  CPU Result  │  Web Result  │  Final Verdict               │
│  ─────────────────────────────────────────────────────────  │
│  BENIGN      │  (skipped)   │  ✓ BENIGN                    │
│  SUSPICIOUS  │  BENIGN      │  ✓ BENIGN (False positive)   │
│  SUSPICIOUS  │  CRYPTO      │  ⚠️  CRYPTOJACK DETECTED     │
│                                                              │
│  Final Record Object:                                        │
│  {                                                           │
│    url: "https://example.com",                              │
│    metrics: { ...34 system metrics... },                    │
│    cpu_model: {                                              │
│      prediction: 0,                                          │
│      label: "benign",                                        │
│      prob: 0.98                                              │
│    },                                                        │
│    web_model: {                                              │
│      prediction: 0,                                          │
│      label: "benign"                                         │
│    },                                                        │
│    finalVerdict: "benign",                                   │
│    timestamp: "2025-11-15T10:30:45.123Z"                    │
│  }                                                           │
└──────────────────────────────────────────────────────────────┘
             │
             ▼
┌──────────────────────────────────────────────────────────────┐
│  PERSISTENT STORAGE                                          │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  collector/dataset_enriched.json                       │ │
│  │                                                         │ │
│  │  Format: JSON Array                                    │ │
│  │  • Append new results                                  │ │
│  │  • Deduplication by URL                                │ │
│  │  • Preserves historical records                        │ │
│  │  • Used for:                                           │ │
│  │    ├─ Future model retraining                          │ │
│  │    ├─ Performance analysis                             │ │
│  │    ├─ Trend detection                                  │ │
│  │    └─ Audit trail                                      │ │
│  │                                                         │ │
│  │  File Operations:                                      │ │
│  │  1. Read existing data (if file exists)                │ │
│  │  2. Check for duplicates (by URL)                      │ │
│  │  3. Append new unique results                          │ │
│  │  4. Write updated data back                            │ │
│  │  5. Log confirmation                                   │ │
│  │                                                         │ │
│  └────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────┘
             │
             ▼
┌──────────────────────────────────────────────────────────────┐
│  RESPONSE TO BROWSER EXTENSION                               │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  HTTP 200 OK                                            │ │
│  │  Content-Type: application/json                         │ │
│  │                                                         │ │
│  │  {                                                     │ │
│  │    results: [                                          │ │
│  │      {                                                 │ │
│  │        url: "https://example.com",                     │ │
│  │        verdict: "benign",                              │ │
│  │        cpu_pred: 0,                                    │ │
│  │        web_pred: null,                                 │ │
│  │        finalVerdict: "benign",                         │ │
│  │        timestamp: "2025-11-15T10:30:45.123Z"          │ │
│  │      },                                                │ │
│  │      {                                                 │ │
│  │        url: "https://suspicious-site.com",            │ │
│  │        verdict: "cryptojack_detected",                │ │
│  │        cpu_pred: 1,                                    │ │
│  │        web_pred: 1,                                    │ │
│  │        finalVerdict: "cryptojack_detected",           │ │
│  │        timestamp: "2025-11-15T10:30:58.456Z"          │ │
│  │      },                                                │ │
│  │      ...                                               │ │
│  │    ]                                                   │ │
│  │  }                                                     │ │
│  │                                                         │ │
│  └────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────┘
             │
             ▼
┌──────────────────────────────────────────────────────────────┐
│  EXTENSION UI UPDATE                                         │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  popup.js receives response                            │ │
│  │  • Parse results array                                 │ │
│  │  • Display verdict for each URL                        │ │
│  │  │  ✓ example.com - BENIGN (✓)                       │ │
│  │  │  ⚠️  suspicious-site.com - CRYPTOJACKING (⚠️)     │ │
│  │  • Color-code: Green (safe), Red (threat)              │ │
│  │  • Show analysis timestamp                             │ │
│  │  • Display confidence scores (if applicable)           │ │
│  │                                                         │ │
│  └────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────┘


═══════════════════════════════════════════════════════════════════════════
                           TECHNOLOGY STACK
═══════════════════════════════════════════════════════════════════════════

FRONTEND TIER
─────────────────────────────────────────────────────────────────────────
┌─────────────────────────────────────────────────────────────┐
│ Chrome Extension (Manifest v3)                              │
│ ┌──────────────────────────────────────────────────────┐   │
│ │ UI Framework: HTML5, CSS3, Vanilla JavaScript        │   │
│ │ Service Worker: background.js (persistent state)     │   │
│ │ Content Scripts: content.js (page inspection)        │   │
│ │ Popup: popup.html (user interface)                   │   │
│ │ Communication: fetch API + CORS                      │   │
│ └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘


BACKEND TIER
─────────────────────────────────────────────────────────────────────────
┌─────────────────────────────────────────────────────────────┐
│ Node.js Runtime Environment                                 │
│ ├─ Express.js (HTTP Server Framework)                       │
│ │  • Routing: POST /tabs                                    │
│ │  • Middleware: CORS, body-parser, express.static         │
│ │  • Port: 3000 (configurable via PORT env var)           │
│ │  • Error Handling: Try-catch, async/await                │
│ │                                                           │
│ ├─ Axios (HTTP Client)                                      │
│ │  • Timeout: 5000ms                                       │
│ │  • Used for: CPU Model API calls                         │
│ │                                                           │
│ ├─ Playwright (Browser Automation)                          │
│ │  • Engine: Chromium (headless)                           │
│ │  • Features: API hooking, event listening, JS injection  │
│ │  • Timeout: 12 seconds per URL                           │
│ │  • Sandboxing: --no-sandbox mode                         │
│ │                                                           │
│ ├─ ChildProcess (Python Integration)                       │
│ │  • Method: spawn (asynchronous process)                  │
│ │  • Models: cpu_model.py, web_model.py                   │
│ │  • Async Handling: Promise-based                         │
│ │                                                           │
│ └─ Socket.IO (Optional Real-time Communication)            │
│    • CORS: enabled                                         │
│    • Used for: Live monitoring (if enabled)                │
│                                                           │
└─────────────────────────────────────────────────────────────┘


DATA COLLECTION TIER
─────────────────────────────────────────────────────────────────────────
┌─────────────────────────────────────────────────────────────┐
│ Python Utilities                                            │
│ ├─ psutil (System Monitoring)                               │
│ │  • cpu_times_percent() - CPU usage breakdown              │
│ │  • virtual_memory() - RAM statistics                      │
│ │  • disk_io_counters() - Disk I/O metrics                 │
│ │  • net_io_counters() - Network I/O stats                 │
│ │  • getloadavg() - System load average                    │
│ │  • Process metrics - Running/sleeping/stopped processes   │
│ │                                                           │
│ ├─ joblib (Model Serialization)                             │
│ │  • Load pre-trained .pkl files                            │
│ │  • Fast binary format                                     │
│ │                                                           │
│ ├─ pandas (Data Processing)                                 │
│ │  • DataFrame creation from metrics                        │
│ │  • Feature alignment                                      │
│ │                                                           │
│ └─ sys/json (Utilities)                                     │
│    • Command-line arguments                                │
│    • JSON serialization                                    │
│                                                           │
└─────────────────────────────────────────────────────────────┘


ML INFERENCE TIER
─────────────────────────────────────────────────────────────────────────
┌─────────────────────────────────────────────────────────────┐
│ Python ML Stack                                             │
│ ├─ scikit-learn (Machine Learning)                          │
│ │  • RandomForestClassifier                                 │
│ │    ├─ CPU Model: 100 trees, 34 features                  │
│ │    ├─ Web Model: 100 trees, 7 features                   │
│ │    └─ Algorithm: Ensemble voting, bootstrap sampling      │
│ │                                                           │
│ ├─ joblib (Model Loading)                                   │
│ │  • rf_model.pkl (CPU model)                               │
│ │  • cryptojacking_detector_7feat.pkl (Web model)           │
│ │                                                           │
│ └─ numpy (Numerical Computing - implicit via sklearn)       │
│    • Matrix operations                                     │
│    • Feature scaling                                       │
│                                                           │
│ Models Training Environment:                                │
│ ├─ Jupyter Notebooks                                        │
│ │  • cpu_model.ipynb (34 features, normal + abnormal)      │
│ │  • web_model1.ipynb (7 features, benign + crypto)       │
│ │  • Dataset_cleaning.ipynb (preprocessing)                │
│ │                                                           │
│ └─ Datasets                                                 │
│    • CPU: final-normal-data-set.csv + final-anormal...    │
│    • Web: benign_set.csv + crypto_set.csv                 │
│                                                           │
└─────────────────────────────────────────────────────────────┘


STORAGE TIER
─────────────────────────────────────────────────────────────────────────
┌─────────────────────────────────────────────────────────────┐
│ File System Storage                                         │
│ ├─ dataset_enriched.json                                    │
│ │  • Format: JSON Array                                     │
│ │  • Records: Complete analysis results                     │
│ │  • Growth: Appends on each analysis                       │
│ │  • Size: Grows over time (periodic cleanup recommended)   │
│ │                                                           │
│ ├─ Model Files (.pkl binary)                                │
│ │  • rf_model.pkl (CPU model)                               │
│ │  • cryptojacking_detector_7feat.pkl (Web model)           │
│ │  • Size: Typically <10MB each                             │
│ │                                                           │
│ └─ Configuration Files                                      │
│    • package.json (Node dependencies)                      │
│    • requirements.txt (Python dependencies)                │
│                                                           │
└─────────────────────────────────────────────────────────────┘


COMMUNICATION PROTOCOLS
─────────────────────────────────────────────────────────────────────────
Extension ←→ Server:  HTTP/REST (localhost:3000)
                      • POST /tabs (JSON payload)
                      • CORS enabled
                      • Body size limit: 1MB

Server ←→ Python:     spawn/ChildProcess
                      • CLI arguments (JSON)
                      • stdout/stderr capture
                      • Promise-based async

Internal ML:          In-process inference
                      • joblib.load()
                      • sklearn.predict()
                      • In-memory (no network)


═══════════════════════════════════════════════════════════════════════════
```

---

## Performance Summary

| Component | Technology | Latency | Features |
|-----------|-----------|---------|----------|
| **Web Monitoring** | Playwright | 12 sec | 7 behavioral features |
| **System Metrics** | psutil | <1 sec | 34 system features |
| **CPU Model** | scikit-learn RF | <100ms | 34 input features |
| **Web Model** | scikit-learn RF | <10ms | 7 input features |
| **Total per URL** | Full stack | ~13-15 sec | Complete analysis |

---

## Key Advantages

✅ **Real-time Detection** - Analyzes active tabs on-demand
✅ **Hybrid Approach** - Combines CPU + Web behavior analysis
✅ **High Accuracy** - Web model: 99.875% test accuracy
✅ **Local Processing** - No cloud data transmission
✅ **Efficient Pipeline** - Web model only invoked when needed
✅ **Scalable** - Modular design allows independent updates
✅ **Persistent Data** - Historical results for future analysis

