# Cryptojacking Detection Dashboard - Comprehensive Detailed Descriptions

## 1. DASHBOARD OVERVIEW & STATISTICS SECTION

### Dashboard Purpose and Context

The Cryptojacking Detection Research Dashboard represents a comprehensive analytical platform designed to investigate, visualize, and validate a sophisticated hybrid machine learning system capable of detecting cryptocurrency mining attacks occurring within web browsers. This dashboard serves multiple critical functions: it presents aggregated statistics about the analyzed website corpus, visualizes the performance characteristics of two complementary machine learning models, displays feature importance rankings that provide interpretability and insights into the nature of cryptojacking attacks, and enables interactive exploration of individual test cases to validate the decision-making process.

The research context is essential for understanding the dashboard's design and the significance of its metrics. Cryptocurrency mining has evolved into a substantial criminal enterprise. While early mining required specialized hardware (GPUs and ASICs), the emergence of WASM (WebAssembly) and optimized JavaScript engines made browser-based mining economically viable. Malicious actors discovered that embedding mining scripts into popular websites allowed them to commandeer the collective computing power of millions of site visitors, converting computational cycles directly into cryptocurrency revenue. Unlike traditional malware that damages systems or steals data—activities users can theoretically detect—cryptojacking operates silently in the background. Users experience only degraded performance, accelerated battery drain, increased CPU heat and noise, and elevated electricity bills. The invisibility and the subtle-yet-pervasive harm make cryptojacking particularly insidious as a threat vector.

### Statistics Cards - Detailed Interpretation

#### Card 1: Total Websites Analyzed
**Icon:** 🌐 | **Display Value:** Number | **Unit:** Analyzed

**In-Depth Explanation:**

This metric aggregates all unique URLs that have been processed through the complete detection pipeline during the research investigation. Each URL counted here has undergone rigorous analysis comprising two parallel monitoring streams conducted simultaneously: First, a dynamic web monitoring phase using a headless Chromium browser that executes the website's HTML, CSS, and JavaScript for 12 seconds while instrumenting all relevant Web APIs to detect cryptojacking-specific behaviors. During this phase, JavaScript API hooking intercepts calls to WebSocket, WebAssembly, cryptographic hash functions, Worker constructors, and message-passing mechanisms. Second, concurrent system resource monitoring through psutil collects 34 system-level performance metrics sampled at regular intervals, creating a detailed statistical profile of CPU, memory, network, and disk I/O behavior during the website's execution.

The Total Websites count represents the breadth and scale of validation performed. Research-grade cryptojacking detection studies typically analyze 1,000-10,000+ websites to ensure sufficient statistical representation across diverse website categories and computational profiles. The dataset should encompass: (1) high-traffic social media and news sites where cryptojacking prevalence is well-documented; (2) e-commerce sites with varying server loads; (3) entertainment and streaming platforms with legitimate resource-intensive content; (4) low-traffic niche sites with minimal baseline computation; (5) known-malicious sites deliberately seeded to test detection capabilities. This diversity ensures the trained models generalize across different web contexts rather than overfitting to specific website types or computational patterns.

**Operational Implications:**

A larger total count indicates broader experimental coverage and greater confidence in the model's generalizability. However, total count alone doesn't ensure quality—the composition of that count matters significantly. Ideally, the dataset should be stratified by website category, traffic volume, and cryptojacking prevalence to avoid bias toward any particular subset. The ratio of benign to malicious sites within this total also influences model training—if the split is extreme (e.g., 98% benign), the model requires careful handling of class imbalance through techniques like weighted loss functions or stratified sampling.

#### Card 2: Benign Websites (Safe Classification)
**Icon:** ✅ | **Display Value:** Number | **Unit:** Safe websites

**Comprehensive Explanation:**

The Benign counter quantifies websites classified as safe by the hybrid detection system—sites that demonstrated no indicators of cryptocurrency mining or related malicious activity. A website reaches benign classification through successful passage of both pipeline stages: Stage 1 (CPU Model) evaluates the 34 system metrics collected during monitoring. If the model's probability score falls below the decision threshold (typically 0.5), indicating benign classification, the website is immediately labeled safe and second-stage analysis is skipped—an optimization that reduces computational overhead. If the CPU model outputs a probability above threshold (suggesting potential cryptojacking), the analysis proceeds to Stage 2 where the Web Model evaluates the 7 JavaScript behavioral indicators; a benign result from this confirmation stage also leads to final benign classification.

The psychological and operational significance of the benign count cannot be overstated. In security systems, false positives—legitimate websites incorrectly flagged as threats—create a directly observable cost to users: blocked content, security warnings, lost functionality. Users experiencing high false positive rates will disable or uninstall security tools, reducing effectiveness for actual threats. Research on security tool adoption consistently shows that tools generating false positives face poor user acceptance and retention regardless of detection accuracy. Therefore, maintaining a high benign count while preserving high detection rates represents a critical operational success metric. The ratio of benign-to-total websites approaches the system's false positive rate when ground truth labels are available (benign count divided by all truly-benign websites yields FP rate).

**Legitimate Activities Correctly Classified as Benign:**

The model must accurately differentiate actual benign sites from those performing computationally legitimate activities that might appear suspicious if judged by metrics alone. Video playback requires sustained CPU usage for decoding and rendering; WebGL graphics applications require intensive GPU/CPU computation; real-time data visualization updates the DOM frequently and performs complex calculations; machine learning inference in the browser (TensorFlow.js, ONNX models) exhibits patterns nearly indistinguishable from mining via system metrics alone (sustained CPU, memory allocation, potential WebAssembly usage). The hybrid approach's second stage explicitly addresses this challenge: these legitimate applications might trigger the CPU model but fail to exhibit the specific behavioral signature of mining (WebSocket for pool communication + hash functions + worker coordination), allowing correct benign classification. The benign count thus reflects the model's success in understanding application context, not just resource consumption in isolation.

#### Card 3: Malicious Websites (Threats Detected)
**Icon:** ⚠️ | **Display Value:** Number | **Unit:** Threats detected

**In-Depth Analysis:**

The Malicious counter represents websites successfully identified as harboring cryptocurrency mining operations or related threats—true positive detections where the system correctly flagged genuine attacks. This count directly correlates to the system's recall metric (sensitivity), which measures the proportion of actual malicious websites correctly identified. A website enters the malicious classification when the hybrid system detects convergent evidence of mining activity: the CPU model identifies statistical anomalies in resource consumption patterns characteristic of mining (elevated sustained CPU, abnormal memory behavior, network patterns consistent with pool communication), and in confirmation, the Web Model detects behavioral signatures specific to mining implementations (WebSocket connections combined with cryptographic functions, WebAssembly compilation associated with worker threads, or specific API patterns known to be used by mining frameworks).

Cryptojacking implementations encountered in real-world detection exhibit significant diversity reflecting various attacker sophistication levels and technical objectives. Early implementations used simple, openly available mining engines like Coinhive (now defunct) that made little effort at obfuscation. These generate unmistakable signatures: direct WebSocket connections to known mining pool servers, explicit WebAssembly module loading containing miner code, obvious worker thread creation for parallel hashing. Modern implementations employ much greater sophistication: dynamic code generation and obfuscation making static analysis difficult, proxied pool connections obscuring true communication targets, time-delayed activation avoiding rapid detection, adaptive difficulty adjustment based on system capabilities, and techniques to reduce CPU usage to avoid user perception (limiting thread count, inserting computational delays). Despite these evasion attempts, the hybrid system captures attacks through behavioral pattern recognition: mining pool communication still requires WebSocket or HTTP long-polling establishing detectable patterns, even with obfuscation; cryptographic hash functions fundamental to mining cannot be entirely hidden from JavaScript API instrumentation; worker threads for parallel computation, while disguisable through code transformation, still manifest behavioral signatures at the system level.

**Ground Truth and Validation:**

The accuracy of malicious classification depends critically on ground truth labels used for validation. Research-grade validation typically employs multiple truth sources: (1) Public cryptojacking blocklists curated by security organizations (e.g., coin-hive.com domains, known malicious script repositories); (2) Deliberate seeding of known mining implementations in test environments to create controlled ground truth; (3) Manual investigation of flagged sites through automated rule systems and human expert review. The malicious count against verified ground truth directly yields recall (sensitivity) metrics, establishing confidence that the system detects real attacks rather than creating false alarms.

**Security Trade-offs:**

In security contexts, the cost of false negatives (malicious sites incorrectly classified as benign) typically exceeds the cost of false positives. A missed cryptojacking attack silently steals computing resources indefinitely, compounding damage over time. A false alarm, while annoying, can be investigated and cleared by the user or administrator. This asymmetric cost structure motivates configuration toward higher recall even at the cost of lower precision, reflected in the willingness to accept moderate false positive rates to minimize missed threats.

---

## 2. CPU MODEL ANALYSIS - COMPREHENSIVE SECTION

### CPU Model Architecture and Purpose

The CPU Model forms the first and computationally most efficient stage of the hybrid detection pipeline, operating on 34 system-level performance metrics to identify statistical anomalies characteristic of cryptocurrency mining. The fundamental hypothesis underlying this model reflects a critical observation: cryptocurrency mining is computationally demanding work fundamentally requiring intensive and sustained CPU utilization. Whether targeting proof-of-work chains like Bitcoin (SHA-256 hashing), Monero (CryptoNight algorithm), or other cryptocurrencies, mining scripts must execute billions of hash computations per second. This intense computational demand manifests inescapably in measurable system resource consumption patterns that statistical machine learning can discriminate from other workloads.

### Feature Set: The 34 System Metrics

**CPU Metrics Category (4 features):**
- `cpu_idle`: Percentage of CPU cycles spent idle, no processes executing
- `cpu_user`: Percentage of CPU cycles in user-space application code execution
- `cpu_system`: Percentage of CPU cycles in kernel-space system operations
- `cpu_total`: Aggregate non-idle CPU percentage (user + system)

**Memory Metrics Category (7 features):**
- `mem_available`: Quantity of memory available for allocation by new processes
- `mem_buffered`: Memory allocated to OS disk I/O buffering
- `mem_cached`: Memory allocated to filesystem caching
- `mem_free`: Unallocated memory (subset of available)
- `mem_total`: Total system RAM quantity
- `mem_used`: Memory currently allocated to processes
- `mem_used_percent`: Percentage of total memory currently allocated

**Network I/O Metrics Category (6 features):**
- `net_eth0_bytes_recv`: Total bytes received on primary network interface
- `net_eth0_bytes_sent`: Total bytes transmitted on primary network interface
- `net_eth0_dropin`: Dropped inbound packets
- `net_eth0_dropout`: Dropped outbound packets
- `net_eth0_packets_recv`: Count of inbound packets received
- `net_eth0_packets_sent`: Count of outbound packets transmitted

**Disk I/O Metrics Category (4 features):**
- `diskio_sda_read_bytes`: Bytes read from disk subsystem
- `diskio_sda_write_bytes`: Bytes written to disk subsystem
- `diskio_sda_read_time`: Time spent in disk read operations
- `diskio_sda_write_time`: Time spent in disk write operations

**Process and Load Metrics Category (10 features):**
- `proc_loadavg_1min`: Average process run queue length over 1 minute
- `proc_loadavg_5min`: Average process run queue length over 5 minutes
- `proc_loadavg_15min`: Average process run queue length over 15 minutes
- `proc_num_threads`: Total thread count across all processes
- `proc_num_running`: Processes currently executing on CPU
- `proc_num_sleeping`: Processes waiting on I/O or other resources
- `proc_num_stopped`: Stopped processes (typically from debugging)
- `proc_num_zombie`: Zombie processes awaiting parent cleanup
- `uptime`: Total system uptime since boot

**System Configuration Metrics Category (3 features):**
- `cpu_frequency`: CPU clock frequency in MHz
- `cpu_count`: Total number of CPU cores

### Model: Random Forest Classifier

**Algorithm Selection Rationale:**

The Random Forest algorithm was selected for the CPU model based on multiple criteria particularly relevant to security research contexts. First, Random Forests provide inherent feature importance through ensemble variable importance calculations, directly addressing the critical need for interpretability in security systems—decision-makers require understanding of why a site was flagged to have confidence in the system and to investigate potential biases or attack evolutions. Second, the ensemble approach through bootstrap aggregating naturally handles the modest dataset sizes typical in security research (typically 1,000-10,000 training samples) without excessive overfitting compared to deep neural networks. Third, Random Forests demonstrate robust performance with mixed feature scales without requiring careful normalization, enabling experiments with raw system metrics. Fourth, the probabilistic outputs enable confidence scoring and threshold adjustment for operational tuning of precision/recall trade-offs.

### CPU Model Visualizations: Detailed Interpretation

#### Visualization 1: Feature Importance Analysis
**File:** feature_importance.png | **Chart Type:** Horizontal Bar Chart

**Purpose and Interpretation:**

Feature importance represents the relative contribution of each of the 34 metrics to the model's classification decisions, computed through aggregating information gain (or Gini importance) across all decision trees in the ensemble. This visualization directly addresses a core question for security researchers and practitioners: "What aspects of system behavior does the model actually learn as indicative of cryptojacking?" Feature importance rankings validate that learned patterns align with domain knowledge while potentially revealing surprising secondary signals.

**Expected Feature Importance Hierarchy:**

**Tier 1 - Dominant Features (CPU Metrics):**
CPU-related metrics (cpu_user, cpu_system, cpu_total) typically dominate feature importance rankings, collectively accounting for 40-60% of total importance weight. This primacy reflects cryptojacking's fundamental nature: mining algorithms execute compute-intensive hash functions requiring CPU cycles. When a mining script activates multiple JavaScript Web Worker threads, each worker thread consumes available CPU cores, elevating cpu_user percentage toward system saturation. The dominance of CPU metrics in feature importance validates that the model has learned the correct attack signature rather than spurious correlations—this alignment between model decisions and domain understanding provides confidence in deployment.

**Tier 2 - Secondary Features (Memory Metrics):**
Memory metrics (mem_used, mem_available, mem_used_percent, mem_buffered, mem_cached) typically constitute the second-most important category (15-30% combined importance). This secondary importance reflects memory allocation patterns characteristic of mining operations. Each JavaScript Web Worker thread maintains its own execution context requiring stack memory (typically several MB per worker). Mining scripts coordinating multiple workers accumulate substantial memory footprint. Additionally, mining algorithms process streams of work assignments and maintain intermediate computation state, requiring buffers. The model learns that sustained elevated memory allocation correlated with high CPU usage signals mining more strongly than either metric alone, representing a multi-signal pattern recognition achievement.

**Tier 3 - Tertiary Features (Network Metrics):**
Network metrics (net_bytes_sent, net_bytes_recv, net_packets_sent, net_packets_recv) typically show moderate importance (8-15% combined) reflecting mining pool communication patterns. Modern mining architectures maintain persistent TCP connections with mining pool servers over which they receive work assignments and transmit completed work shares. These communications generate detectable network I/O patterns: repeated small packets in roughly periodic patterns (work requests and share submissions), distinct from typical web browsing which tends toward bursty traffic (page loads followed by idle periods). However, network metrics rank lower than CPU/memory because some mining implementations employ local work caching strategies reducing communication frequency.

**Tier 4 - Contextual Features (Disk I/O, Process Load, System Info):**
Disk I/O metrics (read/write bytes and times) and process load metrics (proc_loadavg, process counts) typically show lower individual importance (1-8% each) as mining is primarily in-memory computation with minimal disk interaction except during script initialization. However, these features contribute secondary signals in ensemble voting—during mining script loading, disk I/O spikes; on systems with high baseline load, process load metrics provide normalization context.

**Interpreting Importance Patterns:**

If CPU metrics dominate (>50% combined), this validates the model has learned the correct attack signature. If surprisingly, network or disk features showed highest importance, this would suggest either: (a) the training dataset contained systematic artifacts rather than true cryptojacking, or (b) specific cryptojacking variants in the dataset exhibited unusual behavioral patterns (e.g., disk-based caching). Such unexpected patterns would warrant investigation and validation before production deployment.

**Use in Research Reporting:**

Include the feature importance chart with specific importance percentages to demonstrate: (1) the model learns realistic, interpretable patterns; (2) CPU metrics are the dominant signal for cryptojacking detection; (3) the detection approach is scientifically sound, not discovering spurious correlations. Highlight Tier 1 features explicitly to support the narrative that resource consumption is the fundamental cryptojacking signature.

#### Visualization 2: Precision-Recall Curve
**File:** precision_recall_curve.png | **Chart Type:** Line Graph

**Theoretical Foundation:**

The Precision-Recall (PR) curve represents one of the most operationally relevant performance metrics for binary classification in imbalanced domains. Precision (Y-axis) answers: "When the model predicts cryptojacking, what fraction of those predictions are correct?" Mathematically: Precision = TP/(TP+FP) where TP = true positives (correctly identified malicious sites) and FP = false positives (legitimate sites incorrectly flagged). Recall (X-axis) answers: "Of all actual cryptojacking sites in the test set, what fraction did the model identify?" Mathematically: Recall = TP/(TP+FN) where FN = false negatives (missed attacks). The curve plots precision against recall as the decision threshold varies from 0 (classify all as malicious, maximizing recall but minimizing precision) to 1 (classify all as benign, minimizing recall but maximizing precision).

**Why Precision-Recall Replaces ROC in Imbalanced Domains:**

In perfectly balanced datasets (50% positive, 50% negative), the Receiver Operating Characteristic (ROC) curve provides good visualization. However, cryptojacking detection inherently involves class imbalance—approximately 70-85% of websites are benign, while only 15-30% contain mining. In such imbalanced scenarios, ROC curves become misleading because they average performance across both classes, and the dominant benign class can obscure poor performance on the minority malicious class. Consider a naive classifier that predicts "benign" for every website in an 80% benign dataset: it achieves 80% accuracy and 50% AUC-ROC (random performance)—misleadingly moderate metrics. However, such a classifier achieves 0% recall (misses all attacks) and undefined precision (makes no positive predictions). The PR curve cannot be deceived by such naive strategies; high AUPRC (Area Under PR Curve) demands demonstration of both detection capability (high recall) and practical usability (high precision).

**Reading the Curve—Ideal Performance Profile:**

An ideal precision-recall curve for cryptojacking detection shows: (1) high precision (>0.85) maintained across middle to high recall values (0.6-0.95 range), indicating the model makes few false alarms while catching most attacks; (2) Area Under the PR Curve (AUPRC) >0.9 indicating overall strong performance. A curve that drops sharply toward low precision at high recall indicates the model must generate many false alarms to catch all attacks—operationally undesirable. A curve that plateaus at moderate recall suggests the model struggles with harder-to-detect variants.

**Operational Threshold Selection:**

The PR curve enables informed threshold selection balancing precision and recall for specific operational contexts. For applications prioritizing user experience and trust (e.g., browser security extension), an operating point with high precision (0.90+) might be chosen even if recall drops to 0.80—the system will rarely produce false alarms but might miss some attacks. For applications prioritizing security (e.g., ISP-level detection), a point with higher recall (0.90+) might be chosen even with lower precision (0.75), accepting more investigation overhead to minimize missed threats.

**Use in Research Reporting:**

Present the PR curve with specific AUPRC value and highlight the actual operating point used in the system. State something like: "At the selected operating threshold, the model achieves 92% precision and 88% recall, indicating high-confidence threat identification with manageable false positive rate." This concrete specification makes the results reproducible and allows comparison with alternative approaches.

#### Visualization 3: Prediction Distribution
**File:** prediction_distribution.png | **Chart Type:** Histogram (Dual Distribution)

**Statistical Interpretation:**

The Prediction Distribution visualization shows probability score outputs binned into intervals (e.g., 0-0.1, 0.1-0.2, ... 0.9-1.0) separately for benign and malicious test samples. Rather than showing summary metrics, this chart reveals the model's internal decision-making distribution, exposing model calibration quality and decision confidence.

**Ideal Distribution Pattern:**

A well-calibrated, highly discriminative model exhibits a clear bimodal pattern: benign samples concentrate sharply in the 0.0-0.2 probability range (model is highly confident these are benign), while malicious samples concentrate sharply in the 0.8-1.0 range (model is highly confident these are malicious). Few predictions fall in the 0.4-0.6 uncertain middle range. This sharp separation indicates the model has learned clear, unambiguous decision patterns distinguishing cryptojacking from benign sites.

Mathematically, such separation reflects that the feature space is well-separated for the two classes—the 34 system metrics define distinct clusters in feature space for malicious vs. benign websites, enabling confident classification. Operationally, such clear separation permits straightforward threshold selection; a 0.5 threshold naturally separates the classes with high confidence, making operational implementation simple and robust.

**Problem Patterns Revealed by Distribution:**

Problematic patterns evident from prediction distribution analysis include: (1) Uniform or diffuse distribution across full 0.0-1.0 range indicates the model is uncertain about most samples, unable to learn clear class differences; (2) Overlapping distributions with both benign and malicious samples scattered across middle ranges indicates fundamental class ambiguity—either feature engineering is inadequate, or the classes genuinely lack distinguishing statistical characteristics; (3) Highly skewed distributions (e.g., all predictions near 0.5) with no separation indicate model failure or dataset issues requiring investigation.

**Security Implications:**

For a security system, well-separated prediction distributions translate directly to operational reliability. A system using this model can confidently block flagged sites knowing the model is making high-confidence decisions. Ambiguous distributions would require additional verification layers before taking security action, reducing system responsiveness and effectiveness.

**Use in Research Reporting:**

Present the prediction distribution histogram prominently. Quantify the separation numerically: "85% of benign predictions fall below probability 0.3, while 92% of malicious predictions exceed 0.7, demonstrating clear decision boundary separation." Such concrete numbers make the quality of learning immediately apparent and justify confidence in deployment.

#### Visualization 4: ROC Curve (Receiver Operating Characteristic)
**File:** roc_curve.png | **Chart Type:** Line Graph (with AUC Value)

**Theoretical Background:**

The ROC curve plots True Positive Rate (TPR, sensitivity, recall) on the Y-axis against False Positive Rate (FPR) on the X-axis, tracing performance across all possible decision thresholds from 0 (predict all benign) to 1 (predict all malicious). TPR = TP/(TP+FN) represents the proportion of actual attacks correctly identified. FPR = FP/(FP+TN) represents the proportion of benign sites incorrectly flagged. The curve's shape reveals how well the model discriminates between classes at every operating point.

**Ideal ROC Curve Characteristics:**

An ideal ROC curve for cryptojacking detection bends sharply toward the upper-left corner: at low FPR values (few false alarms), the TPR is already very high (many attacks caught), indicating excellent discrimination. The area under this curve (AUC) quantifies overall discrimination ability on a 0-1 scale: 0.5 represents random guessing (diagonal line), 1.0 represents perfect classification (reaching upper-left corner), >0.9 represents excellent discrimination, 0.8-0.9 represents good discrimination, <0.8 represents poor discrimination.

**Interpreting Specific ROC Curve Points:**

A point on the curve represents a specific operating threshold. For example, if the curve passes through (0.05, 0.90), it means: "By adjusting the decision threshold, we can achieve 90% TPR (detecting 90% of attacks) while accepting only 5% FPR (falsely flagging 5% of benign sites)." This point represents a reasonable operational compromise for many security contexts. If the curve reaches (0.02, 0.95), it indicates exceptional performance—95% attack detection with only 2% false alarms.

**Why ROC Works Well Here (Unlike Highly Imbalanced Cases):**

While ROC is less suitable than PR curves for highly imbalanced datasets, it remains valuable for this application because: (1) cryptojacking prevalence, while minority (20-30%), is substantial enough that balanced accuracy metrics are meaningful; (2) ROC's visual depiction of the complete threshold range helps understand operational options; (3) AUC-ROC provides a single scalar metric enabling comparison across models.

**Use in Research Reporting:**

Include the ROC curve with AUC value prominently displayed. State the actual operating point achieved by the system: "The model achieves AUC-ROC of 0.94, and the selected operating threshold yields 89% TPR with 6% FPR." This specification enables reproduction and comparison with baseline methods or alternative algorithms.

#### Visualization 5: Confusion Matrix
**File:** confusion_matrix.png | **Chart Type:** Heatmap / 2x2 Matrix

**Definition and Interpretation:**

The confusion matrix (also called contingency table or classification matrix) breaks down all test predictions into four categories:

```
                  Predicted Benign    Predicted Malicious
Actually Benign         TN (✓)              FP (✗)
Actually Malicious      FN (✗)              TP (✓)
```

Where: TN = True Negatives (correctly identified benign sites), FP = False Positives (incorrectly flagged benign sites), FN = False Negatives (missed attacks), TP = True Positives (correctly identified attacks).

**Derived Metrics:**

From the confusion matrix, multiple performance metrics are calculated:
- **Accuracy** = (TP + TN) / Total = overall correctness (misleading in imbalanced data)
- **Precision** = TP / (TP + FP) = correctness of positive predictions
- **Recall/Sensitivity** = TP / (TP + FN) = detection rate of positives
- **Specificity** = TN / (TN + FP) = correct rejection of negatives
- **F1-Score** = 2 × (Precision × Recall) / (Precision + Recall) = harmonic mean

**Security-Focused Interpretation:**

From a security perspective, the confusion matrix reveals critical details: (1) **High TP** indicates successful attack detection—the fundamental security goal; (2) **Low FN** indicates few missed attacks, essential because undetected cryptojacking causes cumulative harm; (3) **Low FP** indicates system won't over-restrict legitimate sites, essential for user acceptance; (4) **High TN** indicates system permits legitimate traffic, essential for practical usability. The balance among these quadrants determines operational viability.

**Typical Values for Production Systems:**

A production cryptojacking detection system targeting deployment might aim for: TP ≈ 85-95% (catch most attacks), FN ≈ 5-15% (acceptable miss rate), FP ≈ 5-10% (low false alarm rate), TN ≈ 90-95% (permit most legitimate sites). These targets balance security (high TP, low FN) with usability (low FP, high TN).

**Use in Research Reporting:**

Present the confusion matrix with actual numerical values and percentages. Calculate and report the four key metrics (precision, recall, specificity, F1). Discuss trade-offs: "The system prioritizes recall, achieving 91% detection of actual attacks, accepting 8% false positive rate to minimize missed threats." Such transparent presentation supports reproducibility and enables readers to assess fitness for their own contexts.

---

## 3. HYBRID/WEB MODEL ANALYSIS SECTION

### Hybrid Model Architecture and Motivation

The Hybrid/Web Model forms the second stage of the detection pipeline, serving a critical confirmation function when the CPU model flags potential cryptojacking. This two-stage design addresses a fundamental challenge: system resource consumption alone, while characteristic of mining, is not exclusively diagnostic. Legitimate web applications can generate CPU/memory profiles superficially resembling mining—video decoding, WebGL graphics, real-time data processing, machine learning inference. The second stage adds a behavioral dimension: JavaScript API usage patterns that are specific to cryptocurrency mining implementations.

The hybrid model analyzes 7 JavaScript behavioral indicators that represent a comprehensive behavioral signature of browser-based mining: WebSocket usage indicates mining pool communication (miners must connect to pools to receive work assignments and submit completed work); WebAssembly indicates use of compiled cryptographic code for performance (mining algorithms in pure JavaScript would be orders of magnitude slower); cryptographic hash functions indicate mathematical operations characteristic of mining (few legitimate applications call SHA-256, Keccak, or other mining-specific hash functions from JavaScript); web workers indicate parallel computation coordination (mining scripts spawn workers to parallelize hash computation across available cores); message loop load and PostMessage frequency indicate inter-worker communication overhead (workers must coordinate work distribution and result aggregation); parallel function patterns indicate batch processing and throughput optimization.

### Hybrid Model Visualizations

#### Visualization 1: Hybrid Model Precision-Recall Curve
**File:** hybrid_precision_recall.png | **Chart Type:** Line Graph

**Comprehensive Explanation:**

The Hybrid Model Precision-Recall curve evaluates the web model's discriminative ability specifically in confirming second-stage attacks—cases where the CPU model flagged potential threats requiring behavioral verification. This curve thus has different meaning than the CPU model's PR curve: it doesn't measure standalone performance on all samples, but rather performance specifically on the subset of samples passing CPU model's first-stage filter (CPU-suspicious cases).

**Two-Stage Interpretation:**

Understanding this PR curve requires context of the two-stage architecture. Imagine analyzing 1000 websites: the CPU model flags approximately 200 as suspicious (for various reasons). The web model then evaluates only these 200, aiming to distinguish legitimate-but-resource-intensive applications (false positives from stage 1) from genuine mining operations (true positives that should be confirmed). If the web model achieves 95% precision and 90% recall on this 200-sample subset, it means: of websites the web model predicts as malicious, 95% are genuine mining; of genuinely malicious sites in the 200 flagged by CPU model, the web model identifies 90%.

**Practical Efficiency Implications:**

This two-stage architecture provides computational efficiency: analyzing Web APIs (stage 2) is computationally more intensive than analyzing system metrics (stage 1), requiring dynamic browser instrumentation. By filtering through the efficient CPU model first, the expensive web analysis is only performed on ~20% of sites (CPU-suspicious subset), reducing overall computational cost by ~80% compared to running web model on all sites. Yet by combining signals, the hybrid achieves higher accuracy than either model alone—the CPU model catches obvious attacks through resource signatures, while the web model catches sophisticated miners that carefully limit CPU usage by adding behavioral confirmation.

**Use in Research Reporting:**

Explain the two-stage interpretation clearly: "The second-stage web model achieves 94% precision and 87% recall specifically on samples flagged by the CPU model, confirming the efficiency of the two-stage approach. Combined with the first stage's filtering, the hybrid system achieves 91% overall precision and 88% overall recall while reducing computational cost by approximately 78% compared to single-model analysis."

#### Visualization 2: Hybrid Model ROC Curve
**File:** hybrid_roc.png | **Chart Type:** Line Graph (with AUC)

**Analytical Interpretation:**

The Hybrid Model ROC curve specifically evaluates the web model's ability to discriminate malicious from benign using only JavaScript behavioral features, independent of CPU metrics. This curve reveals whether behavioral patterns alone provide diagnostic value, separate from resource consumption signatures.

**Feature Type Differences:**

Unlike CPU metrics which are continuous, high-resolution measurements (exact CPU percentage, memory bytes), web behavioral features are often binary or categorical: WebSocket is present/absent, WASM is compiled/not compiled, hash functions are called/not called. The discrete nature of these features creates different statistical properties. Benign sites either exhibit these characteristics (e.g., a photo editing app uses WASM but no WebSocket/cryptography), or they don't. Malicious sites typically exhibit multiple characteristics simultaneously (WebSocket + WASM + hash functions + workers together form mining signature).

**Behavioral Signature Strength:**

Research on real cryptojacking implementations shows that genuine mining exhibits a characteristic behavioral constellation: WebSocket presence (pool communication) combined with cryptographic functions (hashing) combined with web workers (parallelization) is rare in benign applications. Web developers rarely combine these specific capabilities unless building applications specifically involving peer-to-peer computation or advanced cryptography. This distinctiveness enables effective discrimination even with discrete features.

**AUC Interpretation for Web Model:**

A web model ROC AUC in the range 0.85-0.95 indicates good to excellent behavioral discrimination. The exact value depends on dataset composition—if the dataset contains many sophisticated benign applications (advanced graphics engines, complex computations), discrimination becomes harder. If the dataset is primarily simple websites with occasional mining, discrimination is easier.

**Use in Research Reporting:**

State the web model's standalone performance: "The web model alone achieves AUC-ROC of 0.89 using only JavaScript behavioral features, demonstrating that behavioral patterns provide independent diagnostic value. Combined with CPU model outputs, the hybrid system leverages complementary signals to achieve higher overall accuracy."

#### Visualization 3: Hybrid Model Feature Importance
**File:** hybrid_feature_importance.png | **Chart Type:** Bar Chart

**Behavioral Signal Ranking:**

The feature importance chart ranks the 7 web behavioral indicators by their contribution to the web model's classification decisions. Typical rankings show:

**Tier 1 - Strongest Indicators (Importance ~40-60% combined):**
WebSocket presence and cryptographic hash function usage typically dominate, collectively accounting for nearly half of decision importance. This ranking reflects domain knowledge: mining-pool communication via WebSocket is nearly diagnostic of mining (few benign applications establish persistent WebSocket connections to compute resources), and explicit hash function calls are highly specific to cryptographic operations that mining fundamentally requires. A benign site having neither WebSocket communication nor hash function calls almost certainly isn't mining. A site having both strongly suggests mining.

**Tier 2 - Secondary Indicators (Importance ~20-35% combined):**
WebAssembly usage and web worker instantiation provide secondary signals. Many legitimate applications use WASM (graphics engines, scientific computation, video processing), so WASM alone isn't diagnostic. Similarly, web workers are used for background computation in many legitimate applications. However, WASM combined with workers and hashing suggests mining more strongly than any individual indicator.

**Tier 3 - Tertiary Indicators (Importance ~5-20% combined):**
Message loop load and PostMessage frequency provide contextual signals of inter-worker coordination overhead typical during mining but also present in other parallel computation patterns. Parallel function patterns indicate throughput optimization, common in mining but also legitimate high-performance applications.

**Combined Pattern Recognition:**

The feature importance ranking demonstrates that the model leverages multiple behavioral signals holistically rather than depending on single indicators. This multi-signal approach provides robustness: a sophisticated miner that avoids one or two indicators (e.g., no persistent WebSocket but uses WebAssembly + workers + hashing) still generates sufficient other signals for detection.

**Use in Research Reporting:**

Present actual importance percentages: "WebSocket and cryptographic hash functions account for 52% of the web model's decision weight, confirming these as primary behavioral signatures of mining. Combined with WebAssembly and worker indicators (31%), the model learns a holistic behavioral pattern specific to cryptocurrency mining implementations." This ranking provides validation that learned patterns align with domain understanding.

---

## 4. TESTING & DATASET EXPLORATION SECTIONS

### Interactive Testing Section

The "Test Using Training Dataset Samples" section enables interactive validation of the hybrid model on known samples from the training/test dataset. Users select specific samples by index and execute analysis, receiving real-time feedback on: (1) The sample's feature values across all 41 features, displayed in structured format; (2) CPU model output: predicted class and confidence probability; (3) Web model output (if applicable): predicted class and confidence; (4) Final hybrid verdict; (5) Ground truth label if available for validation. This interactive capability serves multiple functions: (a) enables researchers to validate specific edge cases or unusual samples; (b) provides transparency into individual predictions for audit and debugging; (c) allows non-technical stakeholders to understand how the system processes real data; (d) supports model explanation and documentation for regulatory or security audits.

### Dataset Feature Visualization Section

#### Chart 1: Final Verdict Distribution
**Chart Type:** Pie or Doughnut Chart

**Composition Analysis:**

This chart displays the proportion of benign vs. malicious classifications across the entire dataset. In a real research context, typical distributions show approximately 75-80% benign and 20-25% malicious, reflecting actual web cryptojacking prevalence. Such imbalanced composition reflects reality: most websites are legitimate, only a minority harbor mining scripts.

**Significance of Class Imbalance:**

The imbalanced composition is not a problem to be "fixed"—it represents the actual threat environment. Attempting to artificially balance the dataset (e.g., through downsampling benign sites) would create unrealistic performance estimates. Instead, imbalance must be properly handled through metrics (using PR curves, AUPRC, balanced accuracy rather than simple accuracy) and techniques (class weighting, stratified sampling) that specifically address imbalance. The chart's display of actual proportions demonstrates that the research honestly reflects reality rather than artificially simplifying the problem.

**Use in Reporting:**

Include this chart to establish dataset realism and justify the use of imbalance-aware evaluation metrics. Explain: "The dataset reflects actual web threat prevalence, with 78% benign and 22% malicious classifications, necessitating imbalance-aware evaluation metrics like precision-recall curves and stratified cross-validation rather than simple accuracy."

#### Chart 2: Hybrid Features Usage Frequency
**Chart Type:** Stacked Bar or Grouped Bar Chart

**Feature Presence Patterns:**

This chart displays the frequency of each of the 7 web behavioral features, separated by class (benign vs. malicious). Typical patterns show:

- **WebSocket:** High in malicious (~80%+), low in benign (~5-10%)
- **WASM:** Moderate in malicious (~60-70%), low-moderate in benign (~15-25%)
- **Hash Functions:** Very high in malicious (~85%+), rare in benign (<5%)
- **Web Workers:** Moderate in both classes (~30-40%)
- **PostMessage/MessageLoop/Parallel Functions:** Similar frequency in both (~20-40%)

**Discriminative Signal Quality:**

The disparity in WebSocket and hash function presence between classes demonstrates strong discriminative signals. Features that appear equally frequent in both classes (like PostMessage) provide less individual discriminative power but still contribute to ensemble decisions.

**Use in Reporting:**

Present feature frequency data with commentary: "WebSocket and cryptographic hash function presence differ dramatically between classes (80%+ in malicious vs. <5% in benign), representing strong discriminative signals. Features with similar prevalence in both classes (web workers, message patterns) contribute secondary discrimination through ensemble methods." This explains why multi-signal ensemble approaches outperform single-indicator detection.

#### Chart 3: CPU Usage Distribution
**Chart Type:** Overlaid Histogram or Density Plot

**Distribution Comparison:**

This chart compares the distribution of CPU usage (`cpu_total` metric) separately for benign and malicious sites. Typical patterns show benign sites clustering in the 0-40% CPU range (background browsing with intermittent interactive tasks), while malicious sites show broader, higher-peaked distributions (50-95%+ CPU usage during active mining).

**Statistical Overlap and Why Two-Stage Models Are Necessary:**

While distributions clearly differ on average, significant overlap exists—some benign sites (graphics applications, video decoders) use 60%+ CPU continuously, while some malicious sites (CPU-conservative miners) intentionally limit usage to avoid detection, falling into 40-60% range. This overlap demonstrates why CPU metrics alone are insufficient and why behavioral confirmation (stage 2) adds essential discrimination value. A website showing 55% CPU could be either a graphics-intensive game (benign) or a careful miner (malicious)—only behavioral analysis can reliably distinguish.

**Use in Reporting:**

Display the overlaid histograms prominently: "CPU usage distributions show overlap between classes, demonstrating that CPU metrics alone cannot definitively classify sites. The two-stage pipeline addresses this limitation by confirming CPU-based suspicions through behavioral analysis."

### Data Table and Exploration

The interactive data table displays individual records from the dataset with columns for URL, final verdict, CPU model output, web model output, feature values (WebSocket, WASM, hash functions, workers), timestamp, and action buttons. Users can search by URL or verdict and sort by any column to identify patterns. For example, sorting by CPU usage and filtering for benign class reveals the marginal benign sites that approach malicious CPU ranges, or filtering for malicious class reveals mining variants with surprisingly low CPU usage, enabling targeted analysis of difficult edge cases. This interactive exploration capability supports hypothesis generation and validation during research iterations.

---

## 5. SUMMARY AND RESEARCH IMPLICATIONS

The cryptojacking detection dashboard integrates multiple complementary analysis layers—system metrics, machine learning models, behavioral patterns, and interactive exploration tools—to address a significant cybersecurity challenge through principled machine learning methodology. The two-stage hybrid approach combines the computational efficiency of stage-1 system metric filtering with the diagnostic strength of stage-2 behavioral confirmation, achieving practical balances between security (high detection rate) and usability (low false positive rate). Feature importance rankings validate that learned patterns correspond to domain understanding, building confidence in the approach's scientific rigor. Comprehensive performance visualization across multiple metrics (precision-recall, ROC, confusion matrix, prediction distributions) enables stakeholders with different priorities to assess fitness for their contexts. The interactive exploration capability enables researchers to investigate specific cases, validate edge conditions, and iterate on model refinements. Together, these elements create a research platform suitable for investigating cryptojacking detection comprehensively and reproducibly.

