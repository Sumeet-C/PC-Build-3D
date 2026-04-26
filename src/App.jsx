// ─── PC Specs Generator – Main App ──────────────────────────────────────────
// Dashboard-style interface with component selectors, build controls,
// summary cards, and 3D visualization panel.

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import BuildScene from './components/BuildScene.jsx';
import {
  fetchComponents,
  generateBuild as apiFetchBuild,
  getBuildSummary,
} from './api.js';
import './App.css';

// ─── Component type order and abbreviations ─────────────────────────────────
const COMPONENT_TYPES = [
  'CPU',
  'GPU',
  'RAM',
  'Motherboard',
  'Storage',
  'PSU',
  'Case',
  'Cooling',
];

const TYPE_ABBREV = {
  CPU: 'CPU',
  GPU: 'GPU',
  RAM: 'RAM',
  Motherboard: 'MB',
  Storage: 'SSD',
  PSU: 'PSU',
  Case: 'CAS',
  Cooling: 'FAN',
};

// ─── SVG Icons (inline for zero dependencies) ──────────────────────────────
function CpuIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="4" y="4" width="16" height="16" rx="2" />
      <rect x="9" y="9" width="6" height="6" />
      <path d="M9 1v3M15 1v3M9 20v3M15 20v3M1 9h3M1 15h3M20 9h3M20 15h3" />
    </svg>
  );
}

function BoltIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M20 6L9 17l-5-5" />
    </svg>
  );
}

function AlertIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 9v4M12 17h.01" />
      <path d="M10.29 3.86l-8.6 14.88A2 2 0 003.4 21h17.2a2 2 0 001.71-2.26L13.71 3.86a2 2 0 00-3.42 0z" />
    </svg>
  );
}

function MergeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
    </svg>
  );
}

function ResetIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M1 4v6h6" />
      <path d="M3.51 15a9 9 0 102.13-9.36L1 10" />
    </svg>
  );
}

// ─── App Component ──────────────────────────────────────────────────────────
export default function App() {
  // Component catalog from API
  const [catalog, setCatalog] = useState({});
  const [loading, setLoading] = useState(true);

  // Current build selections (keyed by type)
  const [build, setBuild] = useState({});

  // Build summary
  const [summary, setSummary] = useState(null);

  // Controls
  const [budget, setBudget] = useState(1500);
  const [purpose, setPurpose] = useState('gaming');

  // 3D scene state
  const [merged, setMerged] = useState(false);
  const [highlightedType, setHighlightedType] = useState(null);

  // ─── Load catalog on mount ────────────────────────────────────────────────
  useEffect(() => {
    async function load() {
      try {
        const components = await fetchComponents();
        // Group by type
        const grouped = {};
        for (const c of components) {
          if (!grouped[c.type]) grouped[c.type] = [];
          grouped[c.type].push(c);
        }
        setCatalog(grouped);
      } catch (err) {
        console.error('Failed to load components:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // ─── Recompute summary when build changes ────────────────────────────────
  useEffect(() => {
    const hasAny = Object.values(build).some((v) => v != null);
    if (!hasAny) {
      setSummary(null);
      return;
    }

    async function updateSummary() {
      try {
        const s = await getBuildSummary(build);
        setSummary(s);
      } catch {
        // Compute locally as fallback
        let totalPower = 0,
          totalPrice = 0,
          totalPerf = 0,
          count = 0;
        for (const p of Object.values(build)) {
          if (!p) continue;
          totalPower += p.wattage || 0;
          totalPrice += p.price || 0;
          totalPerf += p.performanceScore || 0;
          count++;
        }
        const avg = count > 0 ? totalPerf / count : 0;
        setSummary({
          totalPower,
          totalPrice,
          recommendedPSUWattage: Math.ceil(totalPower * 1.25),
          performanceCategory:
            avg >= 70 ? 'High-end' : avg >= 45 ? 'Mid-range' : 'Entry-level',
          averagePerformance: Math.round(avg),
          compatibilityIssues: [],
          isCompatible: true,
        });
      }
    }
    updateSummary();
  }, [build]);

  // ─── Select a component ───────────────────────────────────────────────────
  const selectComponent = useCallback(
    (type, componentName) => {
      if (!componentName) {
        setBuild((prev) => ({ ...prev, [type]: null }));
        return;
      }
      const items = catalog[type] || [];
      const comp = items.find((c) => c.name === componentName);
      setBuild((prev) => ({ ...prev, [type]: comp || null }));
      setMerged(false);
    },
    [catalog],
  );

  // ─── Generate build from API ──────────────────────────────────────────────
  const handleGenerate = useCallback(async () => {
    try {
      const result = await apiFetchBuild(budget, purpose);
      setBuild(result.build);
      setSummary(result.summary);
      setMerged(false);
    } catch (err) {
      console.error('Generate build failed:', err);
    }
  }, [budget, purpose]);

  // ─── Merge / Explode toggle ───────────────────────────────────────────────
  const handleMerge = useCallback(() => {
    setMerged((prev) => !prev);
  }, []);

  // ─── Reset ────────────────────────────────────────────────────────────────
  const handleReset = useCallback(() => {
    setBuild({});
    setSummary(null);
    setMerged(false);
    setHighlightedType(null);
  }, []);

  // ─── Determine if there are selected components ───────────────────────────
  const hasSelections = Object.values(build).some((v) => v != null);

  // ─── Loading screen ──────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner" />
        <p style={{ color: 'var(--text-secondary)' }}>Loading component catalog…</p>
      </div>
    );
  }

  return (
    <div className="app">
      {/* Header */}
      <header className="app-header">
        <div className="header-brand">
          <CpuIcon />
          <h1>PC Specs Generator</h1>
        </div>
        <div className="header-status">
          <span className="status-dot" />
          <span>System Ready</span>
        </div>
      </header>

      {/* Dashboard */}
      <div className="dashboard">
        {/* ─── Left Sidebar ──────────────────────────────────────────── */}
        <aside className="sidebar">
          {/* Controls Section */}
          <div className="sidebar-section">
            <div className="section-title">Build Configuration</div>

            <div className="controls-row" style={{ marginBottom: 12 }}>
              <div className="control-group">
                <label>Budget</label>
                <div className="budget-input">
                  <input
                    type="range"
                    min={300}
                    max={5000}
                    step={50}
                    value={budget}
                    onChange={(e) => setBudget(Number(e.target.value))}
                  />
                  <span className="budget-value">${budget}</span>
                </div>
              </div>
            </div>

            <div className="controls-row" style={{ marginBottom: 14 }}>
              <div className="control-group">
                <label>Purpose</label>
                <select
                  className="purpose-select"
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                >
                  <option value="budget">💰 Budget Build</option>
                  <option value="gaming">🎮 Gaming</option>
                  <option value="workstation">🖥️ Workstation</option>
                </select>
              </div>
            </div>

            <div className="actions-row">
              <button
                className="btn btn-primary"
                onClick={handleGenerate}
                id="btn-generate"
              >
                <BoltIcon />
                Generate Build
              </button>
              <button
                className="btn btn-merge"
                onClick={handleMerge}
                disabled={!hasSelections}
                id="btn-merge"
              >
                <MergeIcon />
                {merged ? 'Explode' : 'Merge'} Build
              </button>
            </div>

            <div className="actions-row" style={{ marginTop: 8 }}>
              <button
                className="btn btn-secondary"
                onClick={handleReset}
                id="btn-reset"
              >
                <ResetIcon />
                Reset
              </button>
            </div>
          </div>

          {/* Component Selectors */}
          <div className="sidebar-section">
            <div className="section-title">Components</div>
            <div className="component-selectors">
              {COMPONENT_TYPES.map((type) => {
                const options = catalog[type] || [];
                const selected = build[type];
                return (
                  <div
                    key={type}
                    className={`component-selector ${selected ? 'selected' : ''}`}
                    onMouseEnter={() => setHighlightedType(type)}
                    onMouseLeave={() => setHighlightedType(null)}
                  >
                    <div
                      className={`comp-type-badge ${type.toLowerCase()}`}
                    >
                      {TYPE_ABBREV[type]}
                    </div>
                    <div className="comp-selector-content">
                      <select
                        className="comp-selector-select"
                        value={selected?.name || ''}
                        onChange={(e) =>
                          selectComponent(type, e.target.value)
                        }
                        id={`select-${type.toLowerCase()}`}
                      >
                        <option value="">— Select {type} —</option>
                        {options.map((c) => (
                          <option key={c.name} value={c.name}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                      {selected && (
                        <div className="comp-selector-info">
                          <span className="comp-price">
                            ${selected.price}
                          </span>
                          <span className="comp-watt">
                            {selected.wattage}W
                          </span>
                          <span>Score: {selected.performanceScore}</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Summary Cards */}
          {summary && (
            <div className="sidebar-section">
              <div className="section-title">Build Summary</div>
              <div className="summary-grid">
                <div className="summary-card">
                  <div className="summary-card-label">Total Power</div>
                  <div className="summary-card-value power">
                    {summary.totalPower}W
                  </div>
                </div>
                <div className="summary-card">
                  <div className="summary-card-label">Recommended PSU</div>
                  <div className="summary-card-value psu">
                    {summary.recommendedPSUWattage}W
                  </div>
                </div>
                <div className="summary-card">
                  <div className="summary-card-label">Total Cost</div>
                  <div className="summary-card-value cost">
                    ${summary.totalPrice}
                  </div>
                </div>
                <div className="summary-card">
                  <div className="summary-card-label">Performance</div>
                  <div className="summary-card-value perf">
                    {summary.performanceCategory}
                  </div>
                  <div className="summary-card-sub">
                    Avg: {summary.averagePerformance}/100
                  </div>
                </div>
              </div>

              {/* Compatibility Status */}
              <div style={{ marginTop: 12 }}>
                {summary.isCompatible ? (
                  <div className="compat-banner ok">
                    <CheckIcon />
                    All components compatible
                  </div>
                ) : (
                  <div className="compat-banner error">
                    <AlertIcon />
                    <div>
                      Compatibility Issues
                      <ul className="compat-issues">
                        {summary.compatibilityIssues.map((issue, i) => (
                          <li key={i}>{issue}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </aside>

        {/* ─── Right Panel: 3D Scene ──────────────────────────────────── */}
        <main className="canvas-panel">
          <Suspense
            fallback={
              <div className="empty-3d">
                <div className="loading-spinner" />
                <p>Loading 3D scene…</p>
              </div>
            }
          >
            <BuildScene
              build={build}
              merged={merged}
              highlightedType={highlightedType}
              onSelectType={setHighlightedType}
            />
          </Suspense>

          <div className="canvas-label">
            {merged ? '🔩 Assembled View' : '📦 Exploded View'} •{' '}
            {Object.values(build).filter(Boolean).length} parts
            {highlightedType && ` • Viewing: ${highlightedType}`}
          </div>
        </main>
      </div>
    </div>
  );
}
