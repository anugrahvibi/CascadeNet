# CascadeNet 3.0 — Intelligent Critical Infrastructure & Cascade Failure Simulation

> **Hackathena Hackathon Project** | Wayanad District, Kerala, India
> An AI/ML and Geospatial decision-support system that models how flood hazards propagate cascading failures across power grid, water supply, and healthcare infrastructure, and optimizes strategic investments using dynamic programming.

---

## 🧭 Project Overview

CascadeNet 3.0 is a full-stack, emergency response and infrastructure hardening planning application. In extreme weather events, critical infrastructure elements (e.g., water pumps, hospitals, roads) fail not only due to direct inundation but also due to upstream supply line breakages (e.g., a flooded substation disabling municipal water pumps, which subsequently paralyzes emergency hospitals).

CascadeNet addresses this by:
1. **Predicting Flood Hazards:** Forecasting localized water elevation and arrival timelines per zone using an **LSTM model** (and a physics-informed fallback).
2. **Simulating Cascades:** Replaying event-driven failure cascades across a **NetworkX Directed Graph** over a 24-hour window for an ensemble of 100 scenarios.
3. **Optimizing Actionability:** Mapping risks to department-specific emergency checklists (Dam operations, NDRF rescue, District Collector evacuations) grounded in Central Water Commission (CWC) and NDMA protocols.
4. **Strategizing Budgets:** Running a **0/1 Knapsack dynamic programming algorithm** to maximize lives saved per rupee under arbitrary budget caps.
5. **Interactive 3D Visualizations:** Serving geospatial grids and dynamic boundary datasets to a React + Vite Mapbox WebGL frontend.

---

## 🧱 System Architecture

```
                                +---------------------------+
                                |  Interactive 3D Frontend  |
                                |  (Vite + React + Mapbox)   |
                                +-------------+-------------+
                                              |  API Requests
                                              v
                                +-------------+-------------+
                                |      FastAPI Backend      |
                                |  (Python + MongoDB Cache) |
                                +-------------+-------------+
                                              |
                       +----------------------+----------------------+
                       |                                             |
                       v                                             v
        +--------------+--------------+               +--------------+--------------+
        |        AI/ML Engine         |               |      Geospatial Engine      |
        |  (NetworkX, RF, LSTM, DP)   |               |   (Rasterio, SciPy Splines) |
        +--------------+--------------+               +--------------+--------------+
                       |                                             |
                       v                                             v
               • Dependency Graph                             • Sentinel-2 GeoTIFF
               • Hazard Generator                             • Spline Interpolation
               • Cascade Propagator                           • Voronoi Tessellations
               • ROI Budget Optimizer                         • Geovisual Asset Export
```

---

## 📂 Repository Directory Layout

The codebase is organized into modular directories representing each system tier:

```text
📁 CascadeNet/
├── 📁 AI_ML/                       # Core AI/ML pipeline models
│   ├── 📁 data/                    # JSON/CSV coordinates, infrastructure nodes, and historic logs
│   ├── 📁 outputs/                 # Auto-generated 100-scenario simulation results
│   ├── 📁 src/
│   │   ├── 📁 api/                 # FastAPI routing wrappers (main_wayanad.py)
│   │   └── 📁 models/              # Model logic scripts (LSTM, Graph Analytics, ROI, etc.)
│   ├── 📄 API_GUIDE.md             # Developer handbook for REST endpoints
│   ├── 📄 run_pipeline_wayanad.py  # Standalone CLI tool to run the pipeline
│   └── 📄 requirements.txt         # Core ML dependencies (TensorFlow, Scikit-Learn)
│
├── 📁 Backend/                     # Main Web API Server
│   ├── 📁 app/                     # App logic, MongoDB config, routers, schemas
│   └── 📄 requirements.txt         # Backend server dependencies
│
├── 📁 Frontend_New_Final/          # Main Web Dashboard App
│   ├── 📁 src/                     # React components, Mapbox integration, hooks, UI styling
│   ├── 📄 vite.config.ts           # Vite configuration
│   └── 📄 package.json             # Node dependencies
│
├── 📁 Geospatial model/            # GIS mapping & satellite rendering module
│   ├── 📁 Geovisuals/              # Pre-rendered static/animated mapping assets
│   ├── 🐍 geo_flood_model.py       # Core GIS execution script
│   ├── 🗺️ wayanad_boundary.geojson # Administrative boundary shapefile of Wayanad
│   └── 📄 requirements.txt         # GIS dependencies (Geopandas, Rasterio)
│
└── 📄 README.md                    # This master documentation file
```

---

## ⚙️ Core Modules & Model Logic

### 1. The Predictive Layer (`AI_ML/src/models/`)

Detailed walkthroughs of the model files can be found in [models_walkthrough.md](file:///c:/Users/Athul%20VR/OneDrive/Desktop/Cascade%20net/CascadeNet/AI_ML/src/models/models_walkthrough.md):

* **`lstm_predictor_wayanad.py` (LSTM Forecasting Engine):** Matches time-series variables (GPM rainfall, WRIS river gauge, Banasura Sagar outflow) to predict zone-specific flood probability, peak water height, and remaining lead times. Falls back to a physics-informed exponential smoothing algorithm if TensorFlow is absent.
* **`dependency_graph.py` (Network Graph Builder):** Assembles a directed infrastructure dependency graph of Wayanad using NetworkX. Edge weights (failure probabilities) are assigned using a **Random Forest Classifier** trained on historical logs based on physical distance and supply relations.
* **`hazard_generator.py` (Hazard Generator):** Simulates the spatial-temporal water envelope over 24 hours peaking at hour 12 using a sine wave. Generates 100 random peak-multiplier variations ($0.8\times$ to $1.2\times$ baseline) to establish probability scenarios.
* **`cascade_propagator.py` (Cascade Simulator):** Event-driven simulator that runs the 24-hour cycle. Commences node failure if local depth violates the node threshold, or if parent nodes failed, and schedules child node failures. Runs in parallel using a `multiprocessing` worker pool.
* **`graph_analytics.py` (Network Science Engine):** Evaluates Betweenness, PageRank, Closeness, and Degree centralities to compute a composite **Singularity Index (SI)**, highlighting high-leverage node bottlenecks for operations staff.
* **`roi_calculator.py` (Resource Allocation Optimizer):** Calculates Lives-Saved-Per-Rupee of interventions:
  $$\text{ROI} = \frac{\text{Baseline Impact (pop-hours)} - \text{Hardened Impact (pop-hours)}}{\text{Cost}}$$
  Employs a **0/1 Knapsack dynamic programming algorithm** to select the optimal selection of node protections given a fixed budget ceiling.
* **`action_router.py` (Actionability Router):** Implements a rules-based table that routes LSTM inputs to structured command actions for four key stakeholders (Dam Safety, NDRF, Collector, Highways) grounded in official CWC & NDMA documents.

### 2. The Geospatial Layer (`Geospatial model/`)

Detailed documentation is available in [geospatial_model_walkthrough.md](file:///c:/Users/Athul%20VR/OneDrive/Desktop/Cascade%20net/CascadeNet/Geospatial%20model/geospatial_model_walkthrough.md):

* **Sentinel-2 Registration (`rasterio`):** Visualizes satellite imagery overlays applying a 2% contrast stretch.
* **Continuous Surface Interpolation (`scipy.interpolate.griddata`):** Builds a high-resolution grid using cubic splines from scattered sensor gauges, clipped via geopandas to `wayanad_boundary.geojson`.
* **GIS Visual Exports (`Geovisuals/`):** Generates:
  * `wayanad_satellite_flood_map.png`: High-contrast static representation of 2018 peak inundation.
  * `wayanad_cascade_animation.gif`: 24-hour animated time-lapse of failure propagation.
  * `wayanad_ensemble_heatmap.png`: Comparison panels highlighting mean flood depths and node vulnerability frequencies.

---

