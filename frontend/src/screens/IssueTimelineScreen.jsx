import React, { useState, useEffect } from 'react';
import { 
  Clock, FileText, CheckCircle2, AlertTriangle, Shield, 
  Image as ImageIcon, Search, ArrowRight, User 
} from 'lucide-react';
import { api } from '../services/api';

export default function IssueTimelineScreen({ selectedComplaintId }) {
  const [complaintId, setComplaintId] = useState(selectedComplaintId || '');
  const [complaints, setComplaints] = useState([]);
  const [timeline, setTimeline] = useState([]);
  const [complaintDetails, setComplaintDetails] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadMyComplaints();
  }, []);

  useEffect(() => {
    if (selectedComplaintId) {
      setComplaintId(selectedComplaintId);
      loadTimeline(selectedComplaintId);
    }
  }, [selectedComplaintId]);

  const loadMyComplaints = async () => {
    try {
      const data = await api.getMyComplaints();
      setComplaints(data || []);
      if (!selectedComplaintId && data?.length > 0) {
        setComplaintId(data[0].complaint_id);
        loadTimeline(data[0].complaint_id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const loadTimeline = async (id) => {
    if (!id) return;
    setLoading(true);
    try {
      const [tlRes, fullRes] = await Promise.all([
        api.getComplaintTimeline(id).catch(() => ({ timeline: [] })),
        api.getComplaintFullDetails(id).catch(() => ({ complaint: null }))
      ]);
      setTimeline(tlRes.timeline || []);
      setComplaintDetails(fullRes.complaint || null);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getEventIcon = (type) => {
    switch (type) {
      case 'SUBMISSION':
        return { icon: FileText, color: '#60a5fa', bg: 'rgba(37, 99, 235, 0.2)' };
      case 'STATUS_CHANGE':
        return { icon: Shield, color: '#38bdf8', bg: 'rgba(6, 182, 212, 0.2)' };
      case 'EVIDENCE_UPLOAD':
        return { icon: ImageIcon, color: '#34d399', bg: 'rgba(16, 185, 129, 0.2)' };
      case 'OFFICER_VALIDATION':
        return { icon: CheckCircle2, color: '#c084fc', bg: 'rgba(168, 85, 247, 0.2)' };
      case 'INCONSISTENCY_FLAG':
        return { icon: AlertTriangle, color: '#f87171', bg: 'rgba(239, 68, 68, 0.2)' };
      default:
        return { icon: Clock, color: '#fbbf24', bg: 'rgba(245, 158, 11, 0.2)' };
    }
  };

  return (
    <div style={{ padding: '28px', maxWidth: '1200px', margin: '0 auto' }}>
      
      {/* Title */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
          <span className="badge badge-blue">Audit Log</span>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#fff' }}>
            Issue Evolution & Resolution Audit Timeline
          </h1>
        </div>
        <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>
          Chronological audit trail tracking the complete lifecycle: citizen report, AI classification, officer validation,
          evidence submissions, resolution claims, and potential follow-up inconsistency alerts.
        </p>
      </div>

      {/* Complaint Selector Bar */}
      <div className="glass-panel" style={{ padding: '18px 24px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
        <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#cbd5e1' }}>Select Issue to Track:</span>
        <select
          value={complaintId}
          onChange={(e) => {
            setComplaintId(e.target.value);
            loadTimeline(e.target.value);
          }}
          className="select-field"
          style={{ maxWidth: '420px', padding: '8px 14px' }}
        >
          {complaints.map(c => (
            <option key={c.complaint_id} value={c.complaint_id}>
              {c.complaint_id} — {c.predicted_category} ({c.status})
            </option>
          ))}
        </select>

        <button
          onClick={() => loadTimeline(complaintId)}
          className="btn btn-secondary"
          style={{ padding: '8px 16px', fontSize: '0.82rem' }}
        >
          <Search size={14} /> Refresh Timeline
        </button>
      </div>

      {/* Complaint Overview Card */}
      {complaintDetails && (
        <div className="glass-panel" style={{ padding: '20px 24px', marginBottom: '28px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, color: '#60a5fa', fontSize: '1.1rem' }}>
                  {complaintDetails.complaint_id}
                </span>
                <span className="badge badge-purple">{complaintDetails.predicted_category}</span>
                <span className="badge badge-blue">{complaintDetails.status}</span>
              </div>
              <p style={{ fontSize: '0.95rem', color: '#f1f5f9', marginTop: '6px' }}>
                "{complaintDetails.original_text}"
              </p>
              <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: '6px' }}>
                Location: <strong>{complaintDetails.location}</strong> | Submitted: {complaintDetails.created_at}
              </div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>AI Confidence</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#34d399' }}>
                {(complaintDetails.confidence * 100).toFixed(1)}%
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Vertical Interactive Timeline */}
      <div className="glass-panel" style={{ padding: '32px 28px' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff', marginBottom: '24px' }}>
          Chronological Event Progression ({timeline.length} Events)
        </h3>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>Building event progression...</div>
        ) : timeline.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
            No timeline events recorded yet for this complaint.
          </div>
        ) : (
          <div style={{ position: 'relative', paddingLeft: '32px' }}>
            {/* Vertical Guide Line */}
            <div style={{
              position: 'absolute',
              left: '12px',
              top: '10px',
              bottom: '10px',
              width: '2px',
              background: 'linear-gradient(180deg, #3b82f6 0%, #10b981 50%, #6366f1 100%)'
            }} />

            {timeline.map((evt, idx) => {
              const iconMeta = getEventIcon(evt.event_type);
              const IconComp = iconMeta.icon;

              return (
                <div key={idx} style={{ position: 'relative', marginBottom: '32px' }}>
                  {/* Timeline Node Bullet */}
                  <div style={{
                    position: 'absolute',
                    left: '-32px',
                    top: '2px',
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    background: iconMeta.bg,
                    border: `2px solid ${iconMeta.color}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: iconMeta.color
                  }}>
                    <IconComp size={12} />
                  </div>

                  {/* Event Content Card */}
                  <div style={{
                    background: 'rgba(15, 23, 42, 0.6)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '12px',
                    padding: '16px 20px',
                    marginLeft: '8px'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <span style={{ fontWeight: 700, color: '#fff', fontSize: '0.95rem' }}>
                        {evt.title}
                      </span>
                      <span style={{ fontSize: '0.72rem', color: '#94a3b8', fontFamily: 'var(--font-mono)' }}>
                        {evt.timestamp ? new Date(evt.timestamp).toLocaleString() : 'Timestamp'}
                      </span>
                    </div>

                    <p style={{ fontSize: '0.85rem', color: '#cbd5e1', lineHeight: 1.5, marginBottom: '8px' }}>
                      {evt.description}
                    </p>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.72rem', color: '#94a3b8' }}>
                      <User size={12} color="#64748b" />
                      <span>Actor: <strong>{evt.actor_name || 'System AI'}</strong> ({evt.actor_role})</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}
