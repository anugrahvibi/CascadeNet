# CascadeNet — Geospatial Model Walkthrough

This document provides a comprehensive overview of the geospatial analysis and visualization module used in the CascadeNet application.

---

## 📂 Folder Locations & Contents

The geospatial model is stored at two duplicate locations in the codebase:
1. **Root Folder:** [CascadeNet/Geospatial model](file:///c:/Users/Athul%20VR/OneDrive/Desktop/Cascade%20net/CascadeNet/Geospatial%20model)
2. **AI/ML Src Folder:** [CascadeNet/AI_ML/src/models/Geospatial model](file:///c:/Users/Athul%20VR/OneDrive/Desktop/Cascade%20net/CascadeNet/AI_ML/src/models/Geospatial%20model)

Both directories contain the same file structure:

```text
📁 Geospatial model/
├── 📁 Geovisuals/                              # Pre-rendered visualization assets
│   ├── 🖼️ wayanad_satellite_flood_map.png      # 2018 peak flood static map
│   ├── 🎥 wayanad_cascade_animation.gif        # 24-hour cascading failure simulation GIF
│   └── 🖼️ wayanad_ensemble_heatmap.png         # 100-scenario mean flood & failure rate heatmap
├── 🐍 geo_flood_model.py                       # Core Python simulation & visualization script
├── 📄 requirements.txt                         # Geospatial python dependencies
└── 🗺️ wayanad_boundary.geojson                 # Administrative GIS boundary of Wayanad District
```

---

## ⚙️ Geospatial Dependencies

The script utilizes standard scientific and GIS libraries listed in [requirements.txt](file:///c:/Users/Athul%20VR/OneDrive/Desktop/Cascade%20net/CascadeNet/Geospatial%20model/requirements.txt):

* **GIS Vector/Raster processing:** `geopandas`, `rasterio`, `shapely`, `pyproj`, `osmnx`
* **Scientific computing:** `numpy`, `pandas`, `scipy` (for grid interpolation and Voronoi tessellations)
* **Visualization and Rendering:** `matplotlib`, `imageio` (for generating GIF animations), `pillow`, `folium`, `branca`

---

## 🧠 Core Component: `geo_flood_model.py`

[geo_flood_model.py](file:///c:/Users/Athul%20VR/OneDrive/Desktop/Cascade%20net/CascadeNet/Geospatial%20model/geo_flood_model.py) acts as the primary analytical engine. It reads datasets, interpolates flood surfaces, assesses infrastructure failures, and outputs maps.

### 1. Satellite Base Layer Configuration (`load_satellite`)
* Loads Sentinel-2 GeoTIFF data (`wayanad_satellite.tif`).
* Normalizes RGB bands (Red, Green, Blue) using a **2% linear stretch** to filter out atmospheric noise and boost color contrast for human verification.
* Gracefully falls back to a dummy bounding box (centered on Wayanad) if the satellite TIFF file is not found.

### 2. Flood Surface Modeling (`build_flood_surface`)
* Reads discrete depth observations (24 coordinates) from `flood_map_2018_wayanad.csv`.
* Interpolates these points into a continuous grid across Wayanad using **cubic spline interpolation** (`scipy.interpolate.griddata`).
* Restricts and clips the grid geometry using a spatial mask derived from the district boundary shapefile (`wayanad_boundary.geojson`).
* Applies a temporal sine-wave multiplier (`sin(pi * t / 24)`) to simulate the rise and fall of floodwaters over a 24-hour cycle.

### 3. Administrative Zoning via Voronoi Tessellation (`build_voronoi_zones`)
* Partitions Wayanad into administrative subdivisions using **Voronoi diagrams** (`scipy.spatial.Voronoi`) centered around regional coordinates (Kalpetta, Sulthan Bathery, Mananthavady, Vythiri, Panamaram, Ambalavayal).
* Intersects and clips the outer regions to the administrative district boundary.
* Overlays LSTM risk predictions (RED, ORANGE, GREEN) with transparent fills and borderlines.

### 4. Infrastructure Vulnerability Network (`compute_singularity_index` & `render_infrastructure`)
* Renders 25 critical infrastructure assets (Hospitals, Water Pumps, Substations, Roads, Communication Towers) and their dependency edges.
* Evaluates node status in real-time based on local flood depths:
  * **ACTIVE:** Flood depth below $70\%$ of node threshold.
  * **AT_RISK:** Flood depth between $70\%$ and $100\%$ of node threshold.
  * **BROKEN:** Flood depth exceeds threshold, or upstream dependencies are broken.
* Computes the **Singularity Index (SI)** for each node:
  $$\text{SI} = (\text{Betweenness Centrality} \times 0.45) + (\text{Degree Centrality} \times 0.25) + (\text{Population Impact} \times 0.30)$$
  Nodes with high SI values are represented as larger markers on the map, allowing emergency operators to easily spot critical vulnerabilities.

---

## 🎨 Visualizations Catalog (`Geovisuals/`)

The script produces three visualizations which are stored in the `Geovisuals/` directory:

| Asset | Description |
| :--- | :--- |
| **`wayanad_satellite_flood_map.png`** | Displays the peak flooding state (Hour 12) overlaying Sentinel-2 satellite imagery. Shows red/orange/green zones, node failures, and dynamic water depth color gradients. |
| **`wayanad_cascade_animation.gif`** | A 13-frame animated time-lapse (0h to 24h, in 2-hour increments) showing how flood rise propagates downstream failures across the infrastructure graph over time. |
| **`wayanad_ensemble_heatmap.png`** | A side-by-side comparative dashboard. **Left Panel:** Average water depth across 100 random hazard scenarios. **Right Panel:** Empirical node failure rates across all simulations, highlighting the top 5 most vulnerable network bottlenecks. |

---

## 🔗 API & Frontend Integration

The geospatial layers generated here match the WebGL components on the frontend application via endpoints in [main_wayanad.py](file:///c:/Users/Athul%20VR/OneDrive/Desktop/Cascade%20net/CascadeNet/AI_ML/src/api/main_wayanad.py):
* `/flood-grid/{hour}`: Returns high-resolution points as GeoJSON for Mapbox.
* `/scenario/{id}/hourly-states`: Supplies status updates for pins and connections to animate failure timelines.
* `/impact-zones/{hour}`: Provides impact circles representing affected populations.
