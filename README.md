# PC Specifications Generator with Interactive 3D Visualization

A full-stack web application for generating compatible PC builds with an interactive 3D visualization of the assembled components.

![Tech Stack](https://img.shields.io/badge/React-18-blue) ![Tech Stack](https://img.shields.io/badge/Three.js-R170-green) ![Tech Stack](https://img.shields.io/badge/Express-4-yellow) ![Tech Stack](https://img.shields.io/badge/MongoDB-Optional-orange)

## Features

- **Component Catalog** — 30+ sample components across 8 categories (CPU, GPU, RAM, Motherboard, Storage, PSU, Case, Cooling)
- **Smart Build Generator** — Auto-selects compatible parts based on budget and purpose (Budget, Gaming, Workstation)
- **Compatibility Validation** — Checks socket compatibility, RAM type, GPU clearance, PSU capacity, cooler support
- **Build Summary** — Total power draw, recommended PSU wattage, total cost, and performance category
- **Interactive 3D Scene** — Transparent procedural geometry rendered with React Three Fiber
- **Merge Build Animation** — Smoothly assembles all components into a realistic PC layout
- **In-Memory Fallback** — Works without MongoDB configured

## Quick Start

```bash
# Install dependencies
npm install

# Run frontend + backend together
npm run dev
```

The frontend opens at `http://localhost:5173` and the API runs at `http://localhost:4000`.

## Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start frontend and backend concurrently |
| `npm run client` | Start Vite dev server only |
| `npm run server` | Start Express API only |
| `npm run build` | Build production frontend bundle |
| `npm run preview` | Preview production build |

## API Endpoints

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/health` | Server health check |
| GET | `/api/components` | List all components |
| GET | `/api/components/:type` | List components by type (CPU, GPU, etc.) |
| POST | `/api/build/generate` | Auto-generate compatible build |
| POST | `/api/build/summary` | Compute summary for manual build |

### POST /api/build/generate

```json
{
  "budget": 1500,
  "purpose": "gaming"
}
```

### POST /api/build/summary

```json
{
  "build": {
    "CPU": { "name": "...", "wattage": 65, "price": 174, ... },
    "GPU": { ... }
  }
}
```

## MongoDB Setup (Optional)

The app works out of the box with an in-memory component store. To enable MongoDB persistence:

1. Create a `.env` file in the project root (see `.env.example`)
2. Set `MONGODB_URI` to your MongoDB connection string:

```env
MONGODB_URI=mongodb://localhost:27017/pc-specs-generator
PORT=4000
```

3. The server will auto-seed the database on first run if the collection is empty.

## Project Structure

```
├── server/
│   ├── index.js                 # Express API server
│   ├── seed/
│   │   └── components.js        # Component catalog data
│   └── services/
│       └── buildService.js      # Build generation logic
├── src/
│   ├── main.jsx                 # React entry point
│   ├── App.jsx                  # Main dashboard UI
│   ├── App.css                  # Dashboard styles
│   ├── index.css                # Global reset & tokens
│   ├── api.js                   # API client
│   └── components/
│       └── BuildScene.jsx       # 3D visualization scene
├── public/
│   └── models/
│       └── README.md            # Placeholder for GLB assets
├── index.html
├── package.json
├── vite.config.js
└── .env.example
```

## 3D Visualization

Components are rendered as **procedural transparent geometry** — no GLB files required:

| Component | Shape |
|-----------|-------|
| CPU | Flat chip block with pin grid |
| GPU | Long rectangle with fan tori |
| RAM | Thin vertical sticks (x2) |
| Motherboard | Flat board with socket area |
| Storage | Small flat rectangle |
| PSU | Box with vent grill |
| Case | Large wireframe outer shell |
| Cooling | Cylinder with spinning fan blades |

### Interactions
- **Drag** to rotate the scene
- **Scroll** to zoom
- **Right-click + drag** to pan
- **Click** a component to highlight it
- **Hover** a selector to highlight in 3D
- **Merge Build** assembles all parts into final layout
- **Explode** separates parts for inspection

## Tech Stack

- **Frontend:** React 18, Three.js, React Three Fiber, @react-three/drei
- **Backend:** Node.js, Express 4
- **Database:** MongoDB with Mongoose (optional, in-memory fallback)
- **Build Tool:** Vite 6
