# Quick Reference Guide - Project Architecture Summary

## One-Page System Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│    CRYPTOJACKING DETECTION USING HYBRID MACHINE LEARNING            │
│              (Chrome Extension + Python ML Backend)                  │
└─────────────────────────────────────────────────────────────────────┘

INPUT:  Browser tabs from active user session
        ↓
        ├─ Web Behavior Analysis (7 features)
        │  └─ Playwright + API Hooking (12 seconds)
        │     • WebSocket, WASM, Hash functions, Workers
        │     • Message loop & postMessage activity
        │
        ├─ System Metrics Collection (34 features)
        │  └─ psutil monitoring
        │     • CPU, Memory, Network, Disk I/O, Process load
        │
STAGE 1: CPU Model (Random Forest, 100 trees, 34 features)
        │
        ├─ Benign (0) → RESULT: SAFE ✓
        │
        └─ Suspicious (1) → Continue to Stage 2
                ↓
STAGE 2: Web Model (Random Forest, 100 trees, 7 features)
        │
        ├─ Benign (0) → RESULT: SAFE (False Positive) ✓
        │
        └─ Crypto (1) → RESULT: CRYPTOJACKING ⚠️

OUTPUT: JSON with verdict + confidence + timestamp
        ↓
        └─ Save to dataset_enriched.json (persistent)
           Display in Chrome Extension popup
```

---

## Key Files to Know

| File | Purpose | Language | Type |
|------|---------|----------|------|
| `ARCHITECTURE.md` | Detailed system design | Markdown | Reference |
| `DATA_FLOW_AND_TECH_STACK.md` | Complete data flow + tech stack | Markdown | Reference |
| `RESEARCH_PAPER_TEMPLATE.md` | ChatGPT prompts + research outline | Markdown | Reference |
| `extension/` | Chrome browser extension | JavaScript | Code |
| `server/server.js` | Express API server | JavaScript | Code |
| `server/cpu_model.py` | CPU metrics + inference | Python | Code |
| `server/web_model.py` | Web predictions | Python | Code |
| `collector/monitor.js` | Playwright-based web analysis | JavaScript | Code |
| `ml model/cpu_model.ipynb` | CPU model training | Jupyter | Training |
| `ml model/web_model1.ipynb` | Web model training | Jupyter | Training |

---

## Quick Stats

| Metric | Value |
|--------|-------|
| **System Metrics** | 34 features |
| **Web Behavior Features** | 7 features |
| **CPU Model Accuracy** | ~100% (training) |
| **Web Model Accuracy** | 99.875% (test) |
| **Analysis Time per URL** | ~13-15 seconds |
| **CPU Model Inference** | <100ms |
| **Web Model Inference** | <10ms |
| **Datasets (Web)** | ~4000 samples |
| **Random Forest Trees** | 100 each model |
| **Supported Browser** | Chrome/Chromium |

---

## Technology Stack Summary

```
FRONTEND:
  • Chrome Extension (Manifest v3)
  • HTML5 + CSS3 + Vanilla JavaScript
  • Communicates via HTTP POST

BACKEND:
  • Node.js Runtime
  • Express.js Framework
  • Playwright for headless browser
  • Child process for Python integration

DATA COLLECTION:
  • psutil (system metrics)
  • Playwright API hooks (web behavior)

ML INFERENCE:
  • scikit-learn (Random Forest)
  • joblib (model loading)
  • pandas (data handling)

STORAGE:
  • JSON files (results)
  • PKL files (models)

PROTOCOLS:
  • HTTP/REST (extension ↔ server)
  • IPC (server ↔ Python)
```

---

## How to Use These Documents

### For Your Research Paper:

1. **Start with `RESEARCH_PAPER_TEMPLATE.md`**
   - Copy ChatGPT prompts
   - Customize with your actual metrics
   - Paste into ChatGPT for each section

2. **Reference `ARCHITECTURE.md` for Technical Details**
   - Copy component descriptions
   - Include system diagram in paper
   - Reference feature list

3. **Use `DATA_FLOW_AND_TECH_STACK.md` for Methodology**
   - Copy data flow description
   - Use tech stack table
   - Include in methods section

### For Presentations/Demos:

- Show the high-level architecture diagram
- Explain the two-stage pipeline
- Demonstrate with real URLs
- Show accuracy metrics

### For Future Development:

- Architecture is modular (easy to swap models)
- Can add more features to either stage
- Can integrate with more browsers
- Can implement backend APIs

---

## Writing Your Paper - Quick Checklist

### Section-by-Section

**[✓] Abstract (150-250 words)**
- Problem: Cryptojacking threat
- Solution: Hybrid ML detection
- Innovation: Two-stage pipeline
- Results: 99.875% accuracy
- Significance: Practical protection

**[✓] Introduction (2-3 pages)**
- Define cryptojacking
- Show the problem's importance
- Motivate the solution
- State research questions
- List contributions

**[✓] Related Work (3-4 pages)**
- Existing detection methods
- ML for malware detection
- Browser security approaches
- Position your work

**[✓] Methodology (3-4 pages)**
- Data collection (extension, web monitoring, system metrics)
- Feature engineering (7 + 34 features)
- Model selection (Random Forest)
- Pipeline architecture (two-stage design)
- Evaluation metrics (accuracy, precision, recall, F1, AUC)

**[✓] Results (2-3 pages)**
- CPU model performance
- Web model performance
- Ensemble results
- Feature importance
- Comparison analysis

**[✓] Discussion (2-3 pages)**
- Interpret findings
- Discuss advantages/limitations
- Address evasion techniques
- Practical deployment considerations
- Future research directions

**[✓] Conclusion (0.75-1 page)**
- Summarize contributions
- Reiterate significance
- Call for adoption/future work

---

## Important Notes for Your Paper

### What Makes This Unique

1. **Hybrid Approach**: Unlike single-stage methods, uses CPU + Web behavior
2. **Two-Stage Pipeline**: More efficient than analyzing everything
3. **Practical Integration**: Chrome extension for real users
4. **Open Source**: Reproducible, shareable implementation
5. **High Accuracy**: 99.875% on tested dataset

### Key Advantages to Highlight

- ✅ Real-time detection on active tabs
- ✅ No cloud transmission (privacy-friendly)
- ✅ Minimal computational overhead with Stage 1 filtering
- ✅ Interpretable models (Random Forest features matter)
- ✅ Easy deployment (one-click browser extension)

### Limitations to Address

- ⚠️ Only works in Chrome/Chromium
- ⚠️ 12-second analysis window (tradeoff with real-time)
- ⚠️ May miss sophisticated evasion techniques
- ⚠️ Limited to JavaScript-based monitoring
- ⚠️ Dataset bias (if trained on specific cryptojacking types)

---

## How to Present Your Work

### Elevator Pitch (30 seconds)
"We built a machine learning system that detects cryptojacking in real-time. A Chrome extension monitors active browser tabs and analyzes them through a two-stage pipeline: first checking for suspicious CPU patterns, then confirming with web behavior analysis. We achieved 99.875% accuracy on our test dataset."

### Short Version (2 minutes)
1. Problem: Cryptojacking costs users processing power and electricity
2. Solution: Real-time detection using machine learning
3. Approach: Two-stage pipeline combining system metrics + web behavior
4. Implementation: Chrome extension with Python ML backend
5. Results: 99.875% accuracy, ~15 seconds per URL analysis
6. Impact: Practical protection for end users

### Technical Deep Dive (10 minutes)
- Discuss both models in detail
- Show the pipeline decision logic
- Explain feature engineering
- Present performance metrics
- Discuss limitations and future work

---

## Files to Include With Your Paper

### Code & Implementation
- `/extension/` - Chrome extension code
- `/server/server.js` - Main API
- `/server/cpu_model.py` - CPU inference
- `/server/web_model.py` - Web inference

### Models
- `rf_model.pkl` - CPU model
- `cryptojacking_detector_7feat.pkl` - Web model

### Data (if publishable)
- `/ml model/dataset/` - Training datasets
- `dataset_enriched.json` - Sample results

### Documentation
- This summary + the three markdown files
- Notebooks: cpu_model.ipynb, web_model1.ipynb

---

## Dataset Information to Report

### CPU Model Dataset
```
Source: System monitoring + cryptojacking samples
Normal Samples: [FILL IN YOUR COUNT]
Abnormal Samples: [FILL IN YOUR COUNT]
Total Samples: [FILL IN YOUR COUNT]
Features: 34 system metrics
Train-Test Split: 80-20
Preprocessing: StandardScaler normalization
```

### Web Model Dataset
```
Source: Benign websites + crypto-mining sites
Benign Samples: ~2000
Crypto Samples: ~2000
Total Samples: ~4000
Features: 7 web behavior indicators
Train-Test Split: 80-20
Preprocessing: None (binary/normalized)
```

---

## Performance Metrics to Report

**CPU Model:**
- Training Accuracy: [INSERT]
- Test Accuracy: [INSERT]
- Precision: [INSERT]
- Recall: [INSERT]
- F1-Score: [INSERT]

**Web Model:**
- Training Accuracy: 100%
- Test Accuracy: 99.875%
- Precision: [INSERT]
- Recall: [INSERT]
- F1-Score: [INSERT]

**Ensemble System:**
- Overall Accuracy: [INSERT]
- False Positive Rate: [INSERT]
- False Negative Rate: [INSERT]
- Average Latency: ~15 seconds/URL

---

## Common Questions & Answers

**Q: Why two models instead of one big model?**
A: Efficiency. CPU model is fast (~100ms) and filters most benign sites. Web model only runs (~10ms) when needed, reducing average processing time and false positives.

**Q: Why Random Forest?**
A: Interpretable (feature importance), robust to overfitting, handles mixed feature types, no need for scaling (for web model), ensemble voting reduces variance.

**Q: Why 12 seconds of monitoring?**
A: Tradeoff between capturing actual behavior and user experience. Longer = more accuracy but worse UX. Shorter = faster but may miss behavior.

**Q: Why 34 CPU features?**
A: Comprehensive system profiling. Cryptojacking has specific signatures: high CPU, high memory, network spikes, disk I/O patterns. More features = more signal.

**Q: Why only 7 web features?**
A: Focused on key cryptojacking indicators: cryptographic operations, parallel execution, worker usage. Simpler model = faster inference.

---

## Next Steps

1. **Gather Actual Metrics**: Fill in your exact accuracy numbers
2. **Prepare Datasets**: Document your training data sources
3. **Run Analysis**: Extract feature importance from your models
4. **Write Using Templates**: Use the ChatGPT prompts provided
5. **Add Visuals**: Include confusion matrices, ROC curves
6. **Compile References**: Gather 30-50 academic citations
7. **Review & Polish**: Proofread for academic standards
8. **Share & Celebrate**: Your first ML security paper! 🎉

---

## Support Files Provided

Three detailed markdown files have been created in your project root:

1. **ARCHITECTURE.md** (detailed)
   - Full system architecture with ASCII diagrams
   - Component descriptions
   - Data flow details
   - Technology stack
   - Dataset schema
   - Deployment information

2. **DATA_FLOW_AND_TECH_STACK.md** (comprehensive)
   - End-to-end workflow with all steps
   - Technology stack by tier
   - Performance summary
   - Key advantages

3. **RESEARCH_PAPER_TEMPLATE.md** (ChatGPT-ready)
   - Mermaid diagrams
   - ChatGPT prompts for each section
   - Sample tables for your paper
   - Key talking points
   - Recommended paper structure
   - Academic writing best practices

**Use these files as your reference library for writing and presenting your work!**

