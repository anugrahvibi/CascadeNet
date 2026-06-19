# CascadeNet — AI/ML Models Folder Walkthrough

This document provides a technical walkthrough of the core predictive, simulation, and analytical models located in the [AI_ML/src/models](file:///c:/Users/Athul%20VR/OneDrive/Desktop/Cascade%20net/CascadeNet/AI_ML/src/models) folder.

---

## 📂 File Architecture

The models folder contains the core logic of the CascadeNet risk-routing pipeline:

```text
📁 AI_ML/src/models/
├── 🐍 action_router.py          # Actionability Layer (Pre-loaded NDMA/CWC protocols)
├── 🐍 cascade_propagator.py     # 24-Hour cascade simulator (Sequential/Multiprocessing)
├── 🐍 dependency_graph.py      # NetworkX infrastructure graph & Random Forest edge weights
├── 🐍 graph_analytics.py        # Network Science Centrality metrics (Singularity Index)
├── 🐍 hazard_generator.py       # Sine temporal flood simulator & ensemble generator
├── 🐍 lstm_predictor_wayanad.py # Time-series LSTM predictor (with physics-informed fallback)
├── 🐍 roi_calculator.py         # Cost-benefit ROI metrics & Knapsack optimization
└── 🐍 visual_report.py          # Chart generation utilities (Matplotlib)
```

---

## 🧠 Model Breakdown & Logic

### 1. [dependency_graph.py](file:///c:/Users/Athul%20VR/OneDrive/Desktop/Cascade%20net/CascadeNet/AI_ML/src/models/dependency_graph.py)
* **Purpose:** Builds the physical infrastructure graph of Wayanad (Substations, Water Pumps, Hospitals, Roads, and Communication Towers).
* **Random Forest Integration:** Trains a `RandomForestClassifier` on historical failure logs (`historical_failures_wayanad.csv`) using connectivity distance and dependency type to assign dynamically computed failure-probability weights to each directed edge.
* **Hooks:** Exposes `harden_node(node_id)` (sets threshold to infinity for What-If analysis) and `soften_node()` to undo hardening.

### 2. [hazard_generator.py](file:///c:/Users/Athul%20VR/OneDrive/Desktop/Cascade%20net/CascadeNet/AI_ML/src/models/hazard_generator.py)
* **Purpose:** Dictates flood rise and recession over a 24-hour cycle.
* **Temporal Function:** 
  $$\text{Depth}(t) = \text{Base Depth} \times \text{Peak Multiplier} \times \sin\left(\frac{\pi \cdot t}{24}\right)$$
* **Ensemble Generation:** Creates $100$ scenarios with random peak multipliers ($0.8$ to $1.2$ times baseline) categorized into `LOW`, `MODERATE`, `HIGH`, and `EXTREME` severity bounds.

### 3. [cascade_propagator.py](file:///c:/Users/Athul%20VR/OneDrive/Desktop/Cascade%20net/CascadeNet/AI_ML/src/models/cascade_propagator.py)
* **Purpose:** Event-driven simulator that models failure cascades cascading across infrastructure.
* **Failure Logic:** A node fails if its local flood depth exceeds its predefined threshold, or if its upstream dependencies failed in the preceding hour.
* **Performance:** Executes scenarios in parallel using Python's `multiprocessing` pool, then outputs sorted failure logs (worst-case first).

### 4. [lstm_predictor_wayanad.py](file:///c:/Users/Athul%20VR/OneDrive/Desktop/Cascade%20net/CascadeNet/AI_ML/src/models/lstm_predictor_wayanad.py)
* **Purpose:** High-fidelity predictor forecasting local water depths and evacuation lead times.
* **LSTM Architecture:** Leverages TensorFlow/Keras to build a sequence model mapping multi-source variables (rainfall, river level, reservoir outflow) to flood events.
* **Physics-Informed Fallback:** Contains a rules-based weighted scoring engine that bypasses TensorFlow/Keras if the system lacks hardware support, ensuring zero downtime.
* **Explainability (XAI):** Attributes risk weights back to input categories (e.g., local rainfall vs. dam releases).

### 5. [action_router.py](file:///c:/Users/Athul%20VR/OneDrive/Desktop/Cascade%20net/CascadeNet/AI_ML/src/models/action_router.py)
* **Purpose:** Maps LSTM predictions to actionable emergency protocols.
* **Rules-Based Engine:** Translates alert levels (RED, ORANGE, GREEN) to specific agency checklists grounded in CWC (Central Water Commission) and NDMA (National Disaster Management Authority) SOPs:
  1. **Dam Controller:** Spillway discharge schedules based on capacity levels.
  2. **NDRF Rescue:** Deployment and staging coordinates.
  3. **District Collector:** Section 144 declarations and relief camp activation.
  4. **Highway Department:** Road diversions and low-lying drainage pump deployments.

### 6. [graph_analytics.py](file:///c:/Users/Athul%20VR/OneDrive/Desktop/Cascade%20net/CascadeNet/AI_ML/src/models/graph_analytics.py)
* **Purpose:** Identifies "Structural Singularities" where a single component failure will cause total systemic collapse.
* **Metrics:** Computes Betweenness, PageRank, Closeness, and Degree centralities to construct a weighted **Singularity Index (SI)**:
  $$\text{SI} = (\text{Betweenness} \times 0.4) + (\text{PageRank} \times 0.3) + (\text{Closeness} \times 0.2) + (\text{Degree} \times 0.1)$$
* **Output:** Sorts critical infrastructure bottlenecks and generates advisory instructions.

### 7. [roi_calculator.py](file:///c:/Users/Athul%20VR/OneDrive/Desktop/Cascade%20net/CascadeNet/AI_ML/src/models/roi_calculator.py)
* **Purpose:** Optimizes investment decisions under resource constraints.
* **ROI Formula:** Computes cost-effectiveness by comparing baseline vs. hardened cascading simulation outputs:
  $$\text{Lives-Saved-Per-Rupee} = \frac{\text{Baseline Impact (pop-hours)} - \text{Hardened Impact (pop-hours)}}{\text{Intervention Cost}}$$
* **Knapsack Optimization:** Uses a **0/1 Knapsack dynamic programming algorithm** to select the combination of infrastructure assets that maximizes total lives saved under any arbitrary budget ceiling.

### 8. [visual_report.py](file:///c:/Users/Athul%20VR/OneDrive/Desktop/Cascade%20net/CascadeNet/AI_ML/src/models/visual_report.py)
* **Purpose:** Renders graphs and diagrams for evaluation overlays.
* **Visuals Generated:**
  * `structural_vulnerability.png`: Horizontal bar chart outlining mathematical bottlenecks by Singularity Index.
  * `roi_impact.png`: Vertical bar comparing baseline (unprotected) vs. optimized budget allocation outcomes.
  * `lead_time_distribution.png`: Stem plot displaying warning times (evacuation response windows) across administrative zones.
