// ─── Custom Result Page (India Edition) ─────────────────────────────────────
// Custom build validation with ₹ pricing and Save Build button.

import React, { useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { saveBuild } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';

const TYPE_ICONS = { CPU: '🔲', GPU: '🎮', Motherboard: '🔌', RAM: '💾', Storage: '💿', PSU: '⚡', Cooling: '❄️' };

export default function CustomResultPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { result } = location.state || {};
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  if (!result) {
    return (
      <div className="result-empty">
        <h2>No Build Data</h2>
        <p>Please build a custom PC from the home page first.</p>
        <Link to="/" className="btn-primary">Go Home</Link>
      </div>
    );
  }

  const { components: build, summary } = result;

  const handleSave = async () => {
    if (!isAuthenticated) { navigate('/login'); return; }
    setSaving(true);
    try {
      await saveBuild({ buildType: 'custom', components: build, summary });
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
          <div className="result-badge badge-custom">🔧 Custom Build</div>
          <h1 className="result-title">Your Custom PC Build</h1>
          <p className="result-meta">Total Cost: <strong className="text-green">₹{summary.totalPrice.toLocaleString('en-IN')}</strong></p>
        </div>
      </div>

      {/* Compatibility Check */}
      <section className="result-section">
        <h2 className="result-section-title"><span className="section-icon">🔍</span> Compatibility Check</h2>
        {summary.isCompatible ? (
          <div className="compat-card compat-success">
            <div className="compat-icon">✅</div>
            <div className="compat-content">
              <h3 className="compat-heading">All components are compatible</h3>
              <p className="compat-text">Great news! All your selected components work perfectly together. No issues detected.</p>
            </div>
          </div>
        ) : (
          <div className="compat-card compat-error">
            <div className="compat-icon">⚠️</div>
            <div className="compat-content">
              <h3 className="compat-heading">Compatibility Issues Found</h3>
              <p className="compat-text">The following issues were detected in your build:</p>
              <div className="compat-issues">
                {summary.compatibilityIssues.map((issue, i) => (
                  <div key={i} className={`compat-issue ${issue.type === 'warning' ? 'issue-warning' : 'issue-error'}`}>
                    <span className="issue-icon">{issue.type === 'warning' ? '⚠️' : '❌'}</span>
                    <span className="issue-text">{issue.message}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Selected Components */}
      <section className="result-section">
        <h2 className="result-section-title"><span className="section-icon">📋</span> Selected Component Summary</h2>
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
                    {comp.capacityWatts && <span className="spec-meta">🔋 {comp.capacityWatts}W</span>}
                    {comp.efficiency && <span className="spec-meta">✨ {comp.efficiency}</span>}
                    {comp.coolingType && <span className="spec-meta">❄️ {comp.coolingType}</span>}
                    {comp.storageType && <span className="spec-meta">💿 {comp.storageType}</span>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <div className="total-cost-bar">
          <span className="total-cost-label">Total Build Cost</span>
          <span className="total-cost-value">₹{summary.totalPrice.toLocaleString('en-IN')}</span>
        </div>
      </section>

      {/* Power Analysis */}
      <section className="result-section">
        <h2 className="result-section-title"><span className="section-icon">⚡</span> Power Analysis</h2>
        <div className="power-section">
          <div className="power-breakdown">
            <h3 className="power-sub-title">Individual Component Wattage</h3>
            {summary.powerBreakdown && summary.powerBreakdown.map((item, i) => (
              <div key={i} className="power-row">
                <span className="power-component">{TYPE_ICONS[item.component] || '📦'} {item.component}</span>
                <span className="power-name">{item.name}</span>
                <span className="power-wattage">{item.wattage}W</span>
              </div>
            ))}
            <div className="power-row power-total">
              <span className="power-component">Total Power Consumption</span>
              <span className="power-wattage total">{summary.totalPower}W</span>
            </div>
          </div>
          <div className="power-summary-cards">
            <div className="power-info-card">
              <div className="power-info-icon">⚡</div>
              <div className="power-info-label">Total Power Draw</div>
              <div className="power-info-value">{summary.totalPower}W</div>
            </div>
            <div className="power-info-card highlight">
              <div className="power-info-icon">🔋</div>
              <div className="power-info-label">Recommended PSU</div>
              <div className="power-info-value">{summary.recommendedPSUWattage}W</div>
              <div className="power-info-note">With 25% safety buffer</div>
            </div>
          </div>
        </div>
      </section>

      {/* Performance Summary */}
      <section className="result-section">
        <h2 className="result-section-title"><span className="section-icon">📊</span> System Performance Summary</h2>
        <div className="performance-grid">
          <div className="perf-card perf-level">
            <div className="perf-header">Performance Level</div>
            <div className={`perf-value perf-${summary.performanceCategory.toLowerCase().replace(/[\s-]/g, '')}`}>{summary.performanceCategory}</div>
          </div>
          <div className="perf-card">
            <div className="perf-header">Average Score</div>
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

      {/* Bottom Actions */}
      <div className="result-actions">
        <button className="btn-secondary" onClick={() => navigate('/')}>← Modify Build</button>
        <button className={`btn-primary btn-save ${saved ? 'btn-saved' : ''}`} onClick={handleSave} disabled={saving || saved}>
          {saved ? '✅ Build Saved!' : saving ? 'Saving...' : '💾 Save Build'}
        </button>
      </div>
    </div>
  );
}
