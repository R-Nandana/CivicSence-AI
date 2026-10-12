import React, { useState, useEffect } from 'react';
import { 
  AlertTriangle, ShieldCheck, CheckCircle2, RotateCcw, 
  Eye, RefreshCw, Clock, ArrowRight, MessageSquare 
} from 'lucide-react';
import { api } from '../services/api';

export default function ResolutionAlertsScreen({ user }) {
  const [alerts, setAlerts] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [decisionNotes, setDecisionNotes] = useState('');
  const [decisionLoading, setDecisionLoading] = useState(false);
  const [actionSuccess, setActionSuccess] = useState('');

  const isOfficer = user?.role === 'officer';

  const loadAlerts = async () => {
    setLoading(true);
    try {
      const [alertsData, statsData] = await Promise.all([
        api.getResolutionAlerts().catch(() => []),
        api.getResolutionStats().catch(() => null)
      ]);
      setAlerts(alertsData || []);
      setStats(statsData);
      if (alertsData?.length > 0 && !selectedAlert) {
        setSelectedAlert(alertsData[0]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAlerts();
  }, []);

  const handleDetermine = async (decision) => {
    if (!selectedAlert) return;
    setDecisionLoading(true);
    try {
      await api.determineResolutionAlert(selectedAlert.alert_id, decision, decisionNotes);
      setActionSuccess(`Resolution determination recorded: ${decision}`);
      setTimeout(() => setActionSuccess(''), 4000);
      setDecisionNotes('');
      loadAlerts();
    } catch (err) {
      alert(err.message || 'Determination failed.');
    } finally {
      setDecisionLoading(false);
    }
  };

  return (
    <div style={{ padding: '28px', maxWidth: '1400px', margin: '0 auto' }}>
      
      {/* Title */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
          <span className="badge badge-rose">Core Differentiator</span>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-main)' }}>
            Resolution Monitoring & Inconsistency Alert Center
          </h1>
        </div>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          Flags potential inconsistencies when citizens file follow-up complaints or media evidence for issues previously claimed 'Resolved'.
          Maintains an objective, neutral audit trail for municipal review.
        </p>
      </div>

      {/* KPI Stats */}
      {stats && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '16px',
          marginBottom: '28px'
        }}>
          <div className="glass-panel" style={{ padding: '20px' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Total Inconsistency Alerts</span>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '4px' }}>{stats.total_alerts}</div>
          </div>
          <div className="glass-panel" style={{ padding: '20px' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Pending Verification</span>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--accent-amber)', marginTop: '4px' }}>{stats.pending_count}</div>
          </div>
          <div className="glass-panel" style={{ padding: '20px' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Confirmed Unresolved</span>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: '#f87171', marginTop: '4px' }}>{stats.confirmed_unresolved_count}</div>
          </div>
          <div className="glass-panel" style={{ padding: '20px' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Dismissed / Valid</span>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--accent-green)', marginTop: '4px' }}>{stats.dismissed_count}</div>
          </div>
        </div>
      )}

      {actionSuccess && (
        <div style={{
          background: 'rgba(16, 185, 129, 0.15)',
          border: '1px solid rgba(16, 185, 129, 0.4)',
          borderRadius: '10px',
          padding: '14px 18px',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          color: 'var(--accent-green)',
          fontWeight: 600
        }}>
          <CheckCircle2 size={18} /> {actionSuccess}
        </div>
      )}

      {/* Main Inspection View */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '24px', marginBottom: '28px' }}>
        
        {/* Left: Detailed Alert Inspection */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertTriangle size={18} color="#fbbf24" /> Inconsistency Case Evaluation
          </h3>

          {selectedAlert ? (
            <div>
              {/* Alert Neutral Message Banner */}
              <div style={{
                background: 'rgba(245, 158, 11, 0.12)',
                border: '1px solid rgba(245, 158, 11, 0.35)',
                borderRadius: '10px',
                padding: '14px 18px',
                marginBottom: '20px',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '12px'
              }}>
                <AlertTriangle size={20} color="#fbbf24" style={{ marginTop: '2px', flexShrink: 0 }} />
                <div>
                  <div style={{ fontWeight: 800, color: 'var(--accent-amber)', fontSize: '0.9rem', marginBottom: '2px' }}>
                    Potential Resolution Inconsistency Detected
                  </div>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                    "{selectedAlert.alert_message}"
                  </p>
                </div>
              </div>

              {/* Side-by-Side Comparison: Claimed Resolved vs New Citizen Submission */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '20px' }}>
                {/* Original Complaint */}
                <div style={{ background: 'var(--panel-bg)', padding: '16px', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700 }}>Historical Claim</span>
                    <span className="badge badge-green">Marked Resolved</span>
                  </div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--primary-light)', fontSize: '0.85rem', marginBottom: '6px' }}>
                    {selectedAlert.original_complaint_id}
                  </div>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                    {selectedAlert.original_complaint?.original_text || "Original resolved record"}
                  </p>
                </div>

                {/* Follow-up Complaint */}
                <div style={{ background: 'var(--panel-bg)', padding: '16px', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700 }}>New Follow-Up Report</span>
                    <span className="badge badge-rose">Active Recurrence</span>
                  </div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#fb7185', fontSize: '0.85rem', marginBottom: '6px' }}>
                    {selectedAlert.followup_complaint_id}
                  </div>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                    {selectedAlert.followup_complaint?.original_text || "New citizen follow-up complaint"}
                  </p>
                </div>
              </div>

              {/* Officer Determination Controls */}
              <div style={{ background: 'var(--panel-bg)', padding: '18px', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, display: 'block', marginBottom: '10px' }}>
                  Municipal Officer Determination
                </span>

                <textarea
                  rows={2}
                  value={decisionNotes}
                  onChange={(e) => setDecisionNotes(e.target.value)}
                  placeholder="Enter audit verification explanation or dispatch notes..."
                  className="textarea-field"
                  style={{ marginBottom: '12px', fontSize: '0.85rem' }}
                />

                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  <button
                    onClick={() => handleDetermine('CONFIRM_REOPEN')}
                    disabled={decisionLoading}
                    className="btn"
                    style={{ background: '#dc2626', color: '#ffffff', fontSize: '0.82rem', padding: '8px 16px' }}
                  >
                    Confirm Unresolved (Reopen Ticket)
                  </button>

                  <button
                    onClick={() => handleDetermine('DISMISS_ALERT')}
                    disabled={decisionLoading}
                    className="btn btn-secondary"
                    style={{ fontSize: '0.82rem', padding: '8px 16px' }}
                  >
                    Dismiss Alert (Repair Verified)
                  </button>
                </div>
              </div>

            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-dim)' }}>
              <AlertTriangle size={42} color="#475569" style={{ margin: '0 auto 12px auto' }} />
              <p>No resolution alerts currently require action.</p>
            </div>
          )}
        </div>

        {/* Right: Alerts Queue Table */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '14px' }}>
            Inconsistency Alerts Queue ({alerts.length})
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {alerts.map((alt) => {
              const isSelected = selectedAlert?.alert_id === alt.alert_id;
              return (
                <div
                  key={alt.alert_id}
                  onClick={() => setSelectedAlert(alt)}
                  style={{
                    background: isSelected ? 'rgba(37, 99, 235, 0.18)' : 'var(--panel-bg)',
                    border: isSelected ? '1px solid rgba(96, 165, 250, 0.4)' : '1px solid var(--border-color)',
                    borderRadius: '10px',
                    padding: '12px 14px',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--primary-light)', fontSize: '0.8rem' }}>
                      {alt.alert_id}
                    </span>
                    <span className={`badge ${alt.status === 'PENDING_VERIFICATION' ? 'badge-amber' : 'badge-green'}`} style={{ fontSize: '0.62rem' }}>
                      {alt.status}
                    </span>
                  </div>

                  <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '4px' }}>
                    {alt.category} — {alt.location}
                  </div>

                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    Orig: {alt.original_complaint_id} ➔ New: {alt.followup_complaint_id}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

    </div>
  );
}

