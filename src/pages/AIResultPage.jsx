// ─── AI Result Page (India Edition) ─────────────────────────────────────────
// Displays AI-generated build with ₹ pricing and Save Build button.

import React, { useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { saveBuild } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';

const TYPE_ICONS = { CPU: '🔲', GPU: '🎮', Motherboard: '🔌', RAM: '💾', Storage: '💿', PSU: '⚡', Cooling: '❄️' };

export default function AIResultPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { result, budget, purpose } = location.state || {};
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  if (!result) {
    return (
      <div className="result-empty">
        <h2>No Build Data</h2>
        <p>Please generate a build from the home page first.</p>
        <Link to="/" className="btn-primary">Go Home</Link>
      </div>
    );
  }

  const { build, summary, explanation } = result;

  const handleSave = async () => {
    if (!isAuthenticated) { navigate('/login'); return; }
    setSaving(true);
    try {
      await saveBuild({
        buildType: 'ai', purpose: result.purpose || purpose,
        components: build, summary, explanation,
      });
      setSaved(true);
    } catch (err) {
      alert('Failed to save build: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="result-page">
      {/* Header */}
      <div className="result-header">
        <button className="btn-back" onClick={() => navigate('/')}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
          Back to Builder
        </button>
        <div className="result-title-area">
          <div className="result-badge">🤖 AI Generated Build</div>
          <h1 className="result-title">Your {result.purpose || 'Gaming'} PC Build</h1>
          <p className="result-meta">Budget: <strong>₹{budget?.toLocaleString('en-IN')}</strong> | Total Cost: <strong className="text-green">₹{summary.totalPrice.toLocaleString('en-IN')}</strong></p>
        </div>
      </div>

      {/* Build Specs */}
      <section className="result-section">
        <h2 className="result-section-title"><span className="section-icon">🔧</span> Complete Build Specs</h2>
        <div className="specs-grid">
          {Object.entries(build).map(([type, comp]) => {
            if (!comp) return null;
            return (
              <div key={type} className="spec-card">
                <div className="spec-card-header">
                  <span className="spec-type-icon">{TYPE_ICONS[type] || '📦'}</span>
                  <div>
                    <h3 className="spec-type">{type}</h3>
                    <p className="spec-name">{comp.name}</p>
                  </div>
                  <span className="spec-price">₹{comp.price?.toLocaleString('en-IN')}</span>
                </div>
                <div className="spec-details">
                  {comp.specs && <p className="spec-info">{comp.specs}</p>}
                  <div className="spec-meta-row">
                    <span className="spec-meta">⚡ {comp.wattage}W</span>
                    {comp.socket && <span className="spec-meta">🔌 {comp.socket}</span>}
                    {comp.ramType && <span className="spec-meta">💾 {comp.ramType}</span>}
                    {comp.capacityGB && <span className="spec-meta">📊 {comp.capacityGB}GB</span>}
                    {comp.capacityWatts && <span className="spec-meta">🔋 {comp.capacityWatts}W capacity</span>}
                    {comp.efficiency && <span className="spec-meta">✨ {comp.efficiency}</span>}
                    {comp.coolingType && <span className="spec-meta">❄️ {comp.coolingType}</span>}
                    {comp.storageType && <span className="spec-meta">💿 {comp.storageType}</span>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Performance Summary */}
      <section className="result-section">
        <h2 className="result-section-title"><span className="section-icon">📊</span> System Performance Summary</h2>
        <div className="performance-grid">
          <div className="perf-card perf-main">
            <div className="perf-header">Suitable For</div>
            <div className="perf-value">{result.purpose || 'Gaming'}</div>
          </div>
          <div className="perf-card perf-level">
            <div className="perf-header">Performance Level</div>
            <div className={`perf-value perf-${summary.performanceCategory.toLowerCase().replace(/[\s-]/g, '')}`}>{summary.performanceCategory}</div>
          </div>
          <div className="perf-card">
            <div className="perf-header">Average Performance</div>
            <div className="perf-value">{summary.averagePerformance}/100</div>
            <div className="perf-bar"><div className="perf-bar-fill" style={{ width: `${summary.averagePerformance}%` }} /></div>
          </div>
          {summary.capabilities && (
            <>
              <div className="perf-card">
                <div className="perf-header">🎮 Gaming Capability</div>
                <div className="perf-value">{summary.capabilities.gaming.rating}</div>
                <div className="perf-bar"><div className="perf-bar-fill bar-gaming" style={{ width: `${summary.capabilities.gaming.score}%` }} /></div>
              </div>
              <div className="perf-card">
                <div className="perf-header">🎬 Editing Capability</div>
                <div className="perf-value">{summary.capabilities.editing.rating}</div>
                <div className="perf-bar"><div className="perf-bar-fill bar-editing" style={{ width: `${summary.capabilities.editing.score}%` }} /></div>
              </div>
              <div className="perf-card">
                <div className="perf-header">💼 General Performance</div>
                <div className="perf-value">{summary.capabilities.general.rating}</div>
                <div className="perf-bar"><div className="perf-bar-fill bar-general" style={{ width: `${summary.capabilities.general.score}%` }} /></div>
              </div>
            </>
          )}
        </div>
      </section>

      {/* Power Calculation */}
      <section className="result-section">
        <h2 className="result-section-title"><span className="section-icon">⚡</span> Power Calculation</h2>
        <div className="power-section">
          <div className="power-breakdown">
            <h3 className="power-sub-title">Component Power Draw</h3>
            {summary.powerBreakdown && summary.powerBreakdown.map((item, i) => (
              <div key={i} className="power-row">
                <span className="power-component">{TYPE_ICONS[item.component] || '📦'} {item.component}</span>
                <span className="power-name">{item.name}</span>
                <span className="power-wattage">{item.wattage}W</span>
              </div>
            ))}
            <div className="power-row power-total">
              <span className="power-component">Total Power Draw</span>
              <span className="power-wattage total">{summary.totalPower}W</span>
            </div>
          </div>
          <div className="power-summary-cards">
            <div className="power-info-card">
              <div className="power-info-icon">⚡</div>
              <div className="power-info-label">Total Consumption</div>
              <div className="power-info-value">{summary.totalPower}W</div>
            </div>
            <div className="power-info-card highlight">
              <div className="power-info-icon">🔋</div>
              <div className="power-info-label">Recommended PSU</div>
              <div className="power-info-value">{summary.recommendedPSUWattage}W</div>
              <div className="power-info-note">Includes 25% safety buffer</div>
            </div>
            {build.PSU && (
              <div className="power-info-card">
                <div className="power-info-icon">✅</div>
                <div className="power-info-label">Selected PSU</div>
                <div className="power-info-value">{build.PSU.capacityWatts}W</div>
                <div className="power-info-note">{build.PSU.efficiency}</div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* System Working Explanation */}
      <section className="result-section">
        <h2 className="result-section-title"><span className="section-icon">📝</span> System Working Explanation</h2>
        <div className="explanation-card">
          {explanation && explanation.split('\n\n').map((para, i) => (
            <p key={i} className="explanation-paragraph">{para}</p>
          ))}
        </div>
      </section>

      {/* Bottom Actions */}
      <div className="result-actions">
        <button className="btn-secondary" onClick={() => navigate('/')}>← Build Another PC</button>
        <button className={`btn-primary btn-save ${saved ? 'btn-saved' : ''}`} onClick={handleSave} disabled={saving || saved}>
          {saved ? '✅ Build Saved!' : saving ? 'Saving...' : '💾 Save Build'}
        </button>
      </div>
    </div>
  );
}
