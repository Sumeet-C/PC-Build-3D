// ─── Home Page (India Edition) ──────────────────────────────────────────────
// Smart PC Builder (AI Mode) + Custom PC Builder (Manual Mode). All prices in ₹.

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchComponents, postAIBuild, postCustomBuild } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';

const PURPOSE_OPTIONS = [
  { key: 'gaming', icon: '🎮', label: 'Gaming', desc: 'High FPS, AAA titles, ray tracing' },
  { key: 'office', icon: '💼', label: 'Office Work', desc: 'Word, Excel, email, browsing' },
  { key: 'programming', icon: '💻', label: 'Programming', desc: 'IDEs, Docker, VMs, compilation' },
  { key: 'photoEditing', icon: '📷', label: 'Photo Editing', desc: 'Photoshop, Lightroom, RAW files' },
  { key: 'videoEditing', icon: '🎬', label: 'Video Editing', desc: '4K/8K editing, Premiere, DaVinci' },
];

const COMPONENT_TYPES = ['CPU', 'GPU', 'Motherboard', 'RAM', 'Storage', 'PSU', 'Cooling'];

const TYPE_ICONS = {
  CPU: '🔲', GPU: '🎮', Motherboard: '🔌', RAM: '💾',
  Storage: '💿', PSU: '⚡', Cooling: '❄️',
};

export default function HomePage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const [selectedPurpose, setSelectedPurpose] = useState('gaming');
  const [budget, setBudget] = useState(50000);
  const [aiLoading, setAiLoading] = useState(false);

  const [catalog, setCatalog] = useState({});
  const [customSelections, setCustomSelections] = useState({});
  const [customLoading, setCustomLoading] = useState(false);
  const [catalogLoading, setCatalogLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const items = await fetchComponents();
        const grouped = {};
        for (const c of items) {
          if (!grouped[c.type]) grouped[c.type] = [];
          grouped[c.type].push(c);
        }
        setCatalog(grouped);
      } catch (err) {
        console.error('Failed to load components:', err);
      } finally {
        setCatalogLoading(false);
      }
    })();
  }, []);

  const handleAIBuild = async () => {
    if (!isAuthenticated) { navigate('/login'); return; }
    setAiLoading(true);
    try {
      const result = await postAIBuild(selectedPurpose, budget);
      navigate('/ai-result', { state: { result, budget, purpose: selectedPurpose } });
    } catch (err) {
      console.error('AI Build failed:', err);
      alert('Failed to generate build. Please try again.');
    } finally {
      setAiLoading(false);
    }
  };

  const handleCustomBuild = async () => {
    if (!isAuthenticated) { navigate('/login'); return; }
    const hasAny = Object.values(customSelections).some((v) => v);
    if (!hasAny) { alert('Please select at least one component.'); return; }
    setCustomLoading(true);
    try {
      const result = await postCustomBuild(customSelections);
      navigate('/custom-result', { state: { result } });
    } catch (err) {
      console.error('Custom Build failed:', err);
      alert('Failed to analyze build. Please try again.');
    } finally {
      setCustomLoading(false);
    }
  };

  const handleCustomSelect = (type, name) => {
    setCustomSelections((prev) => ({ ...prev, [type]: name || null }));
  };

  const selectedCustomCount = Object.values(customSelections).filter(Boolean).length;

  return (
    <div className="home-page">
      {/* ─── Hero Banner ─────────────────────────────────────────── */}
      <section className="hero-section">
        <div className="hero-content">
          <h1 className="hero-title">
            Build Your Perfect <span className="gradient-text">PC</span>
          </h1>
          <p className="hero-subtitle">
            AI-powered recommendations or full manual control — you choose.
            India Edition with realistic ₹ pricing.
          </p>
          <div className="hero-stats">
            <div className="hero-stat">
              <span className="stat-number">{Object.values(catalog).flat().length}</span>
              <span className="stat-label">Components</span>
            </div>
            <div className="hero-stat">
              <span className="stat-number">5</span>
              <span className="stat-label">Build Modes</span>
            </div>
            <div className="hero-stat">
              <span className="stat-number">100%</span>
              <span className="stat-label">Compatibility Check</span>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Section 1: Smart PC Builder (AI Mode) ───────────────── */}
      <section className="builder-section" id="smart-builder">
        <div className="section-header">
          <div className="section-badge">🤖 AI MODE</div>
          <h2 className="section-title">Smart PC Builder</h2>
          <p className="section-subtitle">Build a PC Based on Your Needs</p>
        </div>

        <div className="ai-builder-content">
          <div className="purpose-grid">
            {PURPOSE_OPTIONS.map((opt) => (
              <button
                key={opt.key}
                className={`purpose-card ${selectedPurpose === opt.key ? 'selected' : ''}`}
                onClick={() => setSelectedPurpose(opt.key)}
              >
                <div className="purpose-icon">{opt.icon}</div>
                <h3 className="purpose-label">{opt.label}</h3>
                <p className="purpose-desc">{opt.desc}</p>
                {selectedPurpose === opt.key && (
                  <div className="purpose-check">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M20 6L9 17l-5-5" /></svg>
                  </div>
                )}
              </button>
            ))}
          </div>

          <div className="budget-section">
            <div className="budget-header">
              <label className="budget-label">Your Budget</label>
              <span className="budget-amount">₹{budget.toLocaleString('en-IN')}</span>
            </div>
            <input
              type="range" className="budget-slider"
              min={15000} max={500000} step={5000}
              value={budget} onChange={(e) => setBudget(Number(e.target.value))}
            />
            <div className="budget-range">
              <span>₹15,000</span>
              <span>₹5,00,000</span>
            </div>
          </div>

          <button className="btn-primary btn-build" onClick={handleAIBuild} disabled={aiLoading}>
            {aiLoading ? (
              <><div className="btn-spinner" /><span>Generating Build...</span></>
            ) : (
              <><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" /></svg><span>BUILD NOW</span></>
            )}
          </button>
        </div>
      </section>

      {/* ─── Divider ─── */}
      <div className="section-divider">
        <div className="divider-line" />
        <span className="divider-text">OR</span>
        <div className="divider-line" />
      </div>

      {/* ─── Section 2: Custom PC Builder (Manual Mode) ──────────── */}
      <section className="builder-section" id="custom-builder">
        <div className="section-header">
          <div className="section-badge badge-custom">🔧 MANUAL MODE</div>
          <h2 className="section-title">Custom PC Builder</h2>
          <p className="section-subtitle">Build Your Own PC</p>
        </div>

        <div className="custom-builder-content">
          {catalogLoading ? (
            <div className="loading-inline">
              <div className="loading-spinner" />
              <p>Loading components from database...</p>
            </div>
          ) : (
            <>
              <div className="component-selector-grid">
                {COMPONENT_TYPES.map((type) => (
                  <div key={type} className="component-selector">
                    <div className="selector-header">
                      <span className="selector-icon">{TYPE_ICONS[type]}</span>
                      <label className="selector-label">{type}</label>
                    </div>
                    <select
                      className="selector-dropdown"
                      value={customSelections[type] || ''}
                      onChange={(e) => handleCustomSelect(type, e.target.value)}
                    >
                      <option value="">— Select {type} —</option>
                      {(catalog[type] || []).map((c) => (
                        <option key={c.name} value={c.name}>
                          {c.name} — ₹{c.price.toLocaleString('en-IN')}
                        </option>
                      ))}
                    </select>
                    {customSelections[type] && (
                      <div className="selector-selected">✓ {customSelections[type]}</div>
                    )}
                  </div>
                ))}
              </div>

              <div className="custom-build-footer">
                <div className="selected-count">
                  <span className="count-number">{selectedCustomCount}</span>
                  <span className="count-label">/ {COMPONENT_TYPES.length} components selected</span>
                </div>
                <button
                  className="btn-primary btn-build btn-custom"
                  onClick={handleCustomBuild}
                  disabled={customLoading || selectedCustomCount === 0}
                >
                  {customLoading ? (
                    <><div className="btn-spinner" /><span>Analyzing Build...</span></>
                  ) : (
                    <><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z" /></svg><span>BUILD MY PC</span></>
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </section>
    </div>
  );
}
