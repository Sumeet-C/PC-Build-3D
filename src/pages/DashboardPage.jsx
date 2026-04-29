// ─── Dashboard Page ──────────────────────────────────────────────────────────
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { fetchSavedBuilds, deleteSavedBuild } from '../api.js';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

const TYPE_ICONS = { CPU: '🔲', GPU: '🎮', Motherboard: '🔌', RAM: '💾', Storage: '💿', PSU: '⚡', Cooling: '❄️' };

export default function DashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [builds, setBuilds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    loadBuilds();
  }, []);

  const loadBuilds = async () => {
    try {
      const data = await fetchSavedBuilds();
      setBuilds(data);
    } catch (err) {
      console.error('Failed to load builds:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this build?')) return;
    setDeleting(id);
    try {
      await deleteSavedBuild(id);
      setBuilds((prev) => prev.filter((b) => b._id !== id));
    } catch (err) {
      alert('Failed to delete build');
    } finally {
      setDeleting(null);
    }
  };

  const handleDownloadPDF = (build) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    doc.setFontSize(20);
    doc.setTextColor(41, 128, 185);
    doc.text('PC Builder System (India Edition)', pageWidth / 2, 20, { align: 'center' });

    doc.setFontSize(14);
    doc.setTextColor(44, 62, 80);
    const buildTitle = build.buildType === 'ai' ? `AI Build - ${build.purpose || 'Custom'}` : 'Custom Build';
    doc.text(buildTitle, pageWidth / 2, 30, { align: 'center' });

    doc.setFontSize(10);
    doc.setTextColor(127, 140, 141);
    doc.text(`Generated: ${new Date(build.createdAt).toLocaleDateString('en-IN')}`, pageWidth / 2, 37, { align: 'center' });

    const components = build.components || {};
    const tableData = Object.entries(components).map(([type, comp]) => [
      type, comp.name || '-', comp.specs || '-', comp.wattage ? `${comp.wattage}W` : '-',
      comp.price ? `Rs.${comp.price.toLocaleString('en-IN')}` : '-'
    ]);

    doc.autoTable({
      startY: 45,
      head: [['Component', 'Name', 'Specifications', 'Power', 'Price']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [41, 128, 185], textColor: 255, fontSize: 10 },
      bodyStyles: { fontSize: 9 },
      columnStyles: { 0: { fontStyle: 'bold', cellWidth: 28 }, 2: { cellWidth: 60 } },
    });

    let y = doc.lastAutoTable.finalY + 15;

    const summary = build.summary || {};
    doc.setFontSize(13);
    doc.setTextColor(44, 62, 80);
    doc.text('Build Summary', 14, y);
    y += 8;

    doc.setFontSize(10);
    doc.setTextColor(52, 73, 94);
    const summaryLines = [
      `Total Cost: Rs.${(build.totalPrice || 0).toLocaleString('en-IN')}`,
      `Total Power Consumption: ${build.totalPower || 0}W`,
      `Recommended PSU: ${summary.recommendedPSUWattage || '-'}W`,
      `Performance Level: ${summary.performanceCategory || '-'}`,
      `Average Score: ${summary.averagePerformance || '-'}/100`,
    ];
    summaryLines.forEach((line) => { doc.text(line, 14, y); y += 6; });

    y += 5;
    doc.setFontSize(13);
    doc.setTextColor(44, 62, 80);
    doc.text('Compatibility Status', 14, y);
    y += 8;
    doc.setFontSize(10);
    if (summary.isCompatible) {
      doc.setTextColor(39, 174, 96);
      doc.text('All components are compatible', 14, y);
    } else if (summary.compatibilityIssues && summary.compatibilityIssues.length > 0) {
      doc.setTextColor(231, 76, 60);
      summary.compatibilityIssues.forEach((issue) => { doc.text(`- ${issue.message}`, 14, y); y += 6; });
    }

    if (summary.capabilities) {
      y += 10;
      doc.setFontSize(13);
      doc.setTextColor(44, 62, 80);
      doc.text('Performance Capabilities', 14, y);
      y += 8;
      doc.setFontSize(10);
      doc.setTextColor(52, 73, 94);
      doc.text(`Gaming: ${summary.capabilities.gaming?.rating || '-'} (${summary.capabilities.gaming?.score || 0}/100)`, 14, y); y += 6;
      doc.text(`Editing: ${summary.capabilities.editing?.rating || '-'} (${summary.capabilities.editing?.score || 0}/100)`, 14, y); y += 6;
      doc.text(`General: ${summary.capabilities.general?.rating || '-'} (${summary.capabilities.general?.score || 0}/100)`, 14, y);
    }

    const pageHeight = doc.internal.pageSize.getHeight();
    doc.setFontSize(8);
    doc.setTextColor(149, 165, 166);
    doc.text('PC Builder System (India Edition) - All prices in INR', pageWidth / 2, pageHeight - 10, { align: 'center' });

    doc.save(`PC_Build_${new Date(build.createdAt).toISOString().slice(0, 10)}.pdf`);
  };

  // ─── Computed Stats ────────────────────────────────────────────────────────
  const totalBuilds = builds.length;
  const aiBuilds = builds.filter(b => b.buildType === 'ai').length;
  const customBuilds = builds.filter(b => b.buildType !== 'ai').length;
  const totalSpent = builds.reduce((sum, b) => sum + (b.totalPrice || 0), 0);
  const avgBudget = totalBuilds > 0 ? Math.round(totalSpent / totalBuilds) : 0;
  const latestBuild = builds.length > 0 ? builds[0] : null;

  const memberSince = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
    : 'April 2026';

  if (loading) {
    return (
      <div className="loading-page"><div className="loading-spinner" /><p>Loading dashboard...</p></div>
    );
  }

  return (
    <div className="dashboard-page">
      {/* ─── Dashboard Header ─── */}
      <div className="dash-header">
        <div className="dash-header-left">
          <div className="dash-avatar-lg">
            {user?.name?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          <div className="dash-header-info">
            <h1 className="dash-welcome">Welcome back, <span className="gradient-text">{user?.name || 'User'}</span></h1>
            <p className="dash-subtitle">{user?.email} • Member since {memberSince}</p>
          </div>
        </div>
        <button className="btn-primary" onClick={() => navigate('/')}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14"/></svg>
          New Build
        </button>
      </div>

      {/* ─── Stats Cards ─── */}
      <div className="dash-stats-grid">
        <div className="dash-stat-card">
          <div className="dash-stat-icon stat-icon-builds">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6"/><path d="M9 1v3M15 1v3M9 20v3M15 20v3M1 9h3M1 15h3M20 9h3M20 15h3"/></svg>
          </div>
          <div className="dash-stat-content">
            <span className="dash-stat-number">{totalBuilds}</span>
            <span className="dash-stat-label">Total Builds</span>
          </div>
        </div>
        <div className="dash-stat-card">
          <div className="dash-stat-icon stat-icon-ai">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2a2 2 0 012 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 017 7h1a1 1 0 011 1v3a1 1 0 01-1 1h-1.27A7 7 0 0112 22a7 7 0 01-7.73-3H3a1 1 0 01-1-1v-3a1 1 0 011-1h1a7 7 0 017-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 012-2z"/><circle cx="9" cy="14" r="1"/><circle cx="15" cy="14" r="1"/></svg>
          </div>
          <div className="dash-stat-content">
            <span className="dash-stat-number">{aiBuilds}</span>
            <span className="dash-stat-label">AI Builds</span>
          </div>
        </div>
        <div className="dash-stat-card">
          <div className="dash-stat-icon stat-icon-custom">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/></svg>
          </div>
          <div className="dash-stat-content">
            <span className="dash-stat-number">{customBuilds}</span>
            <span className="dash-stat-label">Custom Builds</span>
          </div>
        </div>
        <div className="dash-stat-card">
          <div className="dash-stat-icon stat-icon-budget">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>
          </div>
          <div className="dash-stat-content">
            <span className="dash-stat-number">₹{avgBudget.toLocaleString('en-IN')}</span>
            <span className="dash-stat-label">Avg. Budget</span>
          </div>
        </div>
      </div>

      {/* ─── Tabs ─── */}
      <div className="dash-tabs">
        <button className={`dash-tab ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
          Overview
        </button>
        <button className={`dash-tab ${activeTab === 'builds' ? 'active' : ''}`} onClick={() => setActiveTab('builds')}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/><polyline points="17,21 17,13 7,13 7,21"/><polyline points="7,3 7,8 15,8"/></svg>
          Saved Builds ({totalBuilds})
        </button>
      </div>

      {/* ─── Tab Content ─── */}
      {activeTab === 'overview' && (
        <div className="dash-overview">
          {/* Quick Actions */}
          <div className="dash-section">
            <h2 className="dash-section-title">
              <span className="section-icon">⚡</span> Quick Actions
            </h2>
            <div className="dash-actions-grid">
              <button className="dash-action-card" onClick={() => { navigate('/'); setTimeout(() => document.getElementById('smart-builder')?.scrollIntoView({ behavior: 'smooth' }), 300); }}>
                <div className="action-icon action-icon-ai">🤖</div>
                <div className="action-text">
                  <h3>AI Build</h3>
                  <p>Let AI pick the best components for your budget</p>
                </div>
                <svg className="action-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
              </button>
              <button className="dash-action-card" onClick={() => { navigate('/'); setTimeout(() => document.getElementById('custom-builder')?.scrollIntoView({ behavior: 'smooth' }), 300); }}>
                <div className="action-icon action-icon-custom">🔧</div>
                <div className="action-text">
                  <h3>Custom Build</h3>
                  <p>Hand-pick every component yourself</p>
                </div>
                <svg className="action-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
              </button>
            </div>
          </div>

          {/* Latest Build */}
          <div className="dash-section">
            <h2 className="dash-section-title">
              <span className="section-icon">🕐</span> Latest Build
            </h2>
            {latestBuild ? (
              <div className="dash-latest-card">
                <div className="latest-card-header">
                  <div className="latest-badge">{latestBuild.buildType === 'ai' ? '🤖 AI Build' : '🔧 Custom Build'}</div>
                  <span className="latest-date">
                    {new Date(latestBuild.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                </div>
                {latestBuild.purpose && <div className="latest-purpose">{latestBuild.purpose}</div>}
                <div className="latest-components">
                  {Object.entries(latestBuild.components || {}).slice(0, 4).map(([type, comp]) => (
                    <div key={type} className="latest-comp">
                      <span className="latest-comp-icon">{TYPE_ICONS[type] || '📦'}</span>
                      <span className="latest-comp-type">{type}</span>
                      <span className="latest-comp-name">{comp.name}</span>
                    </div>
                  ))}
                  {Object.keys(latestBuild.components || {}).length > 4 && (
                    <div className="latest-comp-more">+{Object.keys(latestBuild.components).length - 4} more components</div>
                  )}
                </div>
                <div className="latest-footer">
                  <div className="latest-price">₹{(latestBuild.totalPrice || 0).toLocaleString('en-IN')}</div>
                  <button className="btn-outline btn-sm" onClick={() => setActiveTab('builds')}>View All Builds →</button>
                </div>
              </div>
            ) : (
              <div className="dash-empty-state">
                <div className="empty-icon">🖥️</div>
                <h3>No builds yet</h3>
                <p>Create your first PC build to see it here!</p>
                <button className="btn-primary" onClick={() => navigate('/')}>Start Building</button>
              </div>
            )}
          </div>

          {/* Build Distribution */}
          {totalBuilds > 0 && (
            <div className="dash-section">
              <h2 className="dash-section-title">
                <span className="section-icon">📊</span> Build Distribution
              </h2>
              <div className="dash-distribution">
                <div className="distro-bar">
                  <div className="distro-fill distro-ai" style={{ width: `${totalBuilds > 0 ? (aiBuilds / totalBuilds) * 100 : 0}%` }}>
                    {aiBuilds > 0 && <span>AI ({aiBuilds})</span>}
                  </div>
                  <div className="distro-fill distro-custom" style={{ width: `${totalBuilds > 0 ? (customBuilds / totalBuilds) * 100 : 0}%` }}>
                    {customBuilds > 0 && <span>Custom ({customBuilds})</span>}
                  </div>
                </div>
                <div className="distro-legend">
                  <div className="legend-item"><span className="legend-dot legend-dot-ai"></span> AI Builds</div>
                  <div className="legend-item"><span className="legend-dot legend-dot-custom"></span> Custom Builds</div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'builds' && (
        <div className="dash-builds">
          {builds.length === 0 ? (
            <div className="dash-empty-state">
              <div className="empty-icon">📦</div>
              <h3>No Saved Builds Yet</h3>
              <p>Generate an AI build or create a custom build, then save it to see it here.</p>
              <button className="btn-primary" onClick={() => navigate('/')}>Start Building</button>
            </div>
          ) : (
            <div className="saved-builds-grid">
              {builds.map((build) => (
                <div key={build._id} className="saved-build-card">
                  <div className="saved-build-top">
                    <div className="saved-build-badge">{build.buildType === 'ai' ? '🤖 AI Build' : '🔧 Custom Build'}</div>
                    <span className="saved-build-date">{new Date(build.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                  </div>

                  {build.purpose && <div className="saved-build-purpose">{build.purpose}</div>}

                  <div className="saved-build-components">
                    {Object.entries(build.components || {}).map(([type, comp]) => (
                      <div key={type} className="saved-comp-row">
                        <span className="saved-comp-icon">{TYPE_ICONS[type] || '📦'}</span>
                        <span className="saved-comp-type">{type}</span>
                        <span className="saved-comp-name">{comp.name}</span>
                      </div>
                    ))}
                  </div>

                  <div className="saved-build-price">
                    <span>Total</span>
                    <span className="saved-price-value">₹{(build.totalPrice || 0).toLocaleString('en-IN')}</span>
                  </div>

                  {expandedId === build._id && (
                    <div className="saved-build-details">
                      <div className="detail-section">
                        <h4>⚡ Power: {build.totalPower || 0}W</h4>
                        <h4>📊 Performance: {build.summary?.performanceCategory || '-'}</h4>
                        <h4>🔍 Compatible: {build.summary?.isCompatible ? '✅ Yes' : '❌ Issues Found'}</h4>
                      </div>
                      {build.summary?.compatibilityIssues?.length > 0 && (
                        <div className="detail-issues">
                          {build.summary.compatibilityIssues.map((issue, i) => (
                            <div key={i} className={`detail-issue ${issue.type}`}>
                              {issue.type === 'error' ? '❌' : '⚠️'} {issue.message}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  <div className="saved-build-actions">
                    <button className="btn-outline btn-sm" onClick={() => setExpandedId(expandedId === build._id ? null : build._id)}>
                      {expandedId === build._id ? 'Hide Details' : 'View Details'}
                    </button>
                    <button className="btn-outline btn-sm btn-pdf" onClick={() => handleDownloadPDF(build)}>
                      📄 Download PDF
                    </button>
                    <button className="btn-outline btn-sm btn-danger" onClick={() => handleDelete(build._id)} disabled={deleting === build._id}>
                      {deleting === build._id ? '...' : '🗑️ Delete'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
