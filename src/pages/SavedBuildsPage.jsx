// ─── Saved Builds Page ──────────────────────────────────────────────────────
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchSavedBuilds, deleteSavedBuild } from '../api.js';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

const TYPE_ICONS = { CPU: '🔲', GPU: '🎮', Motherboard: '🔌', RAM: '💾', Storage: '💿', PSU: '⚡', Cooling: '❄️' };

export default function SavedBuildsPage() {
  const navigate = useNavigate();
  const [builds, setBuilds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  const [deleting, setDeleting] = useState(null);

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

    // Title
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

    // Components Table
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

    // Summary
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

    // Compatibility
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

    // Capabilities
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

    // Footer
    const pageHeight = doc.internal.pageSize.getHeight();
    doc.setFontSize(8);
    doc.setTextColor(149, 165, 166);
    doc.text('PC Builder System (India Edition) - All prices in INR', pageWidth / 2, pageHeight - 10, { align: 'center' });

    doc.save(`PC_Build_${new Date(build.createdAt).toISOString().slice(0, 10)}.pdf`);
  };

  if (loading) {
    return (
      <div className="loading-page"><div className="loading-spinner" /><p>Loading saved builds...</p></div>
    );
  }

  return (
    <div className="saved-builds-page">
      <div className="saved-builds-header">
        <button className="btn-back" onClick={() => navigate('/')}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
          Back to Builder
        </button>
        <h1 className="saved-builds-title">💾 Your Saved Builds</h1>
        <p className="saved-builds-subtitle">{builds.length} build{builds.length !== 1 ? 's' : ''} saved</p>
      </div>

      {builds.length === 0 ? (
        <div className="saved-builds-empty">
          <div className="empty-icon">📦</div>
          <h2>No Saved Builds Yet</h2>
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

              {/* Expanded Details */}
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
  );
}
