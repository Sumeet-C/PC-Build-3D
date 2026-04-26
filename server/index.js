// ─── Express API Server (India Edition) ─────────────────────────────────────
// Auth (JWT), AI build, custom build, saved builds. All prices in ₹.

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import seedData from './seed/components.js';
import { generateBuild, computeSummary } from './services/buildService.js';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 4000;
const JWT_SECRET = process.env.JWT_SECRET || 'pc_builder_india_secret_2026';

// ─── Mongoose Schemas ───────────────────────────────────────────────────────

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

const componentSchema = new mongoose.Schema({
  name: String, type: String, price: Number, wattage: Number,
  performanceScore: Number, specs: String, socket: String,
  ramType: String, formFactor: String, lengthMm: Number,
  capacityWatts: Number, capacityGB: Number, storageType: String,
  coolingType: String, socketSupport: [String], efficiency: String,
});

const savedBuildSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  buildType: { type: String, enum: ['ai', 'custom'], default: 'custom' },
  purpose: String,
  components: mongoose.Schema.Types.Mixed,
  summary: mongoose.Schema.Types.Mixed,
  explanation: String,
  totalPrice: Number,
  totalPower: Number,
  createdAt: { type: Date, default: Date.now },
});

const User = mongoose.model('User', userSchema);
const Component = mongoose.model('Component', componentSchema);
const SavedBuild = mongoose.model('SavedBuild', savedBuildSchema);

// ─── Auth Middleware ────────────────────────────────────────────────────────

function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }
  try {
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token.' });
  }
}

// ─── Data Source ────────────────────────────────────────────────────────────

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
  if (useDB) return Component.find().lean();
  return inMemoryComponents;
}

// ─── Auth Routes ────────────────────────────────────────────────────────────

app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    if (useDB) {
      const existing = await User.findOne({ email: email.toLowerCase() });
      if (existing) return res.status(400).json({ error: 'Email already registered' });

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      const user = await User.create({ name, email: email.toLowerCase(), password: hashedPassword });
      const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '7d' });
      res.status(201).json({ token, user: { id: user._id, name: user.name, email: user.email } });
    } else {
      // In-memory fallback for auth
      const users = global._inMemoryUsers || [];
      if (users.find(u => u.email === email.toLowerCase())) {
        return res.status(400).json({ error: 'Email already registered' });
      }
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      const user = { _id: Date.now().toString(), name, email: email.toLowerCase(), password: hashedPassword };
      users.push(user);
      global._inMemoryUsers = users;
      const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '7d' });
      res.status(201).json({ token, user: { id: user._id, name: user.name, email: user.email } });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    let user;
    if (useDB) {
      user = await User.findOne({ email: email.toLowerCase() });
    } else {
      const users = global._inMemoryUsers || [];
      user = users.find(u => u.email === email.toLowerCase());
    }

    if (!user) return res.status(400).json({ error: 'Invalid email or password' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ error: 'Invalid email or password' });

    const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user._id, name: user.name, email: user.email } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/auth/me', verifyToken, async (req, res) => {
  try {
    let user;
    if (useDB) {
      user = await User.findById(req.userId).select('-password');
    } else {
      const users = global._inMemoryUsers || [];
      const found = users.find(u => u._id === req.userId);
      if (found) user = { _id: found._id, name: found.name, email: found.email };
    }
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ user: { id: user._id, name: user.name, email: user.email } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Component Routes ───────────────────────────────────────────────────────

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', database: useDB ? 'mongodb' : 'in-memory', timestamp: new Date().toISOString() });
});

app.get('/api/components', async (_req, res) => {
  try { res.json(await getAllComponents()); }
  catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/components/:type', async (req, res) => {
  try {
    const type = req.params.type;
    const components = useDB ? await Component.find({ type }).lean() : inMemoryComponents.filter(c => c.type === type);
    res.json(components);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── Build Routes ───────────────────────────────────────────────────────────

app.post('/api/ai-build', async (req, res) => {
  try {
    const { budget, purpose } = req.body;
    if (!budget || !purpose) return res.status(400).json({ error: 'budget and purpose are required' });
    const components = await getAllComponents();
    const result = generateBuild(components, { budget: Number(budget), purpose });
    res.json(result);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/custom-build', async (req, res) => {
  try {
    const { selectedComponents } = req.body;
    if (!selectedComponents || typeof selectedComponents !== 'object') {
      return res.status(400).json({ error: 'selectedComponents object is required' });
    }
    const allComponents = await getAllComponents();
    const build = {};
    for (const [type, name] of Object.entries(selectedComponents)) {
      if (!name) continue;
      const found = allComponents.find((c) => c.type === type && c.name === name);
      if (found) build[type] = found;
    }
    const summary = computeSummary(build);
    res.json({ components: build, summary });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── Saved Build Routes ─────────────────────────────────────────────────────

app.post('/api/save-build', verifyToken, async (req, res) => {
  try {
    const { buildType, purpose, components, summary, explanation } = req.body;
    if (!components) return res.status(400).json({ error: 'Build components are required' });

    const buildData = {
      userId: req.userId,
      buildType: buildType || 'custom',
      purpose: purpose || '',
      components,
      summary: summary || {},
      explanation: explanation || '',
      totalPrice: summary?.totalPrice || 0,
      totalPower: summary?.totalPower || 0,
    };

    if (useDB) {
      const saved = await SavedBuild.create(buildData);
      res.status(201).json(saved);
    } else {
      const builds = global._inMemoryBuilds || [];
      const saved = { _id: Date.now().toString(), ...buildData, createdAt: new Date() };
      builds.push(saved);
      global._inMemoryBuilds = builds;
      res.status(201).json(saved);
    }
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/saved-builds', verifyToken, async (req, res) => {
  try {
    let builds;
    if (useDB) {
      builds = await SavedBuild.find({ userId: req.userId }).sort({ createdAt: -1 }).lean();
    } else {
      const allBuilds = global._inMemoryBuilds || [];
      builds = allBuilds.filter(b => b.userId === req.userId).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }
    res.json(builds);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/saved-builds/:id', verifyToken, async (req, res) => {
  try {
    if (useDB) {
      const build = await SavedBuild.findOneAndDelete({ _id: req.params.id, userId: req.userId });
      if (!build) return res.status(404).json({ error: 'Build not found' });
    } else {
      const builds = global._inMemoryBuilds || [];
      const idx = builds.findIndex(b => b._id === req.params.id && b.userId === req.userId);
      if (idx === -1) return res.status(404).json({ error: 'Build not found' });
      builds.splice(idx, 1);
      global._inMemoryBuilds = builds;
    }
    res.json({ message: 'Build deleted successfully' });
  } catch (err) { res.status(500).json({ error: err.message }); }
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
