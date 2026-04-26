// ─── Express API Server ─────────────────────────────────────────────────────
// Serves the PC component catalog and build generator endpoints.
// Supports MongoDB persistence with an in-memory seeded fallback.

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import seedData from './seed/components.js';
import { generateBuild, computeSummary } from './services/buildService.js';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 4000;

// ─── Mongoose Schema ────────────────────────────────────────────────────────
const componentSchema = new mongoose.Schema({
  name: String,
  type: String,
  price: Number,
  wattage: Number,
  performanceScore: Number,
  model_path: String,
  // compatibility fields
  socket: String,
  ramType: String,
  formFactor: String,
  lengthMm: Number,
  maxGpuLengthMm: Number,
  capacityWatts: Number,
  capacityGB: Number,
  storageType: String,
  coolingType: String,
  socketSupport: [String],
  efficiency: String,
});

const Component = mongoose.model('Component', componentSchema);

// ─── Data Source ─────────────────────────────────────────────────────────────
let useDB = false;
let inMemoryComponents = [...seedData];

async function connectDB() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.log('⚡ No MONGODB_URI found – using in-memory component store');
    return;
  }
  try {
    await mongoose.connect(uri);
    console.log('✅ Connected to MongoDB');
    useDB = true;

    // Seed if collection is empty
    const count = await Component.countDocuments();
    if (count === 0) {
      await Component.insertMany(seedData);
      console.log(`📦 Seeded ${seedData.length} components into MongoDB`);
    }
  } catch (err) {
    console.warn('⚠️  MongoDB connection failed – falling back to in-memory store');
    console.warn(err.message);
  }
}

async function getAllComponents() {
  if (useDB) {
    return Component.find().lean();
  }
  return inMemoryComponents;
}

async function getComponentsByType(type) {
  if (useDB) {
    return Component.find({ type }).lean();
  }
  return inMemoryComponents.filter((c) => c.type === type);
}

// ─── API Routes ─────────────────────────────────────────────────────────────

// Health check
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    database: useDB ? 'mongodb' : 'in-memory',
    componentCount: inMemoryComponents.length,
    timestamp: new Date().toISOString(),
  });
});

// Get all components or filter by type query param
app.get('/api/components', async (req, res) => {
  try {
    const components = await getAllComponents();
    res.json(components);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get components by type
app.get('/api/components/:type', async (req, res) => {
  try {
    const type = req.params.type;
    const components = await getComponentsByType(type);
    res.json(components);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Generate an auto-compatible build
app.post('/api/build/generate', async (req, res) => {
  try {
    const { budget, purpose } = req.body;
    const components = await getAllComponents();
    const result = generateBuild(components, { budget, purpose });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Compute summary for a manually-selected build
app.post('/api/build/summary', async (req, res) => {
  try {
    const { build } = req.body;
    if (!build || typeof build !== 'object') {
      return res.status(400).json({ error: 'build object is required' });
    }
    const summary = computeSummary(build);
    res.json(summary);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Start Server ───────────────────────────────────────────────────────────
async function start() {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`🚀 API server running on http://localhost:${PORT}`);
    console.log(`   Health: http://localhost:${PORT}/api/health`);
  });
}

start();
