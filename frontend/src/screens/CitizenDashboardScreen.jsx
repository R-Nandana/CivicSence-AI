import React, { useState, useEffect } from 'react';
import { 
  FileText, Mic, Image as ImageIcon, Video, Clock, CheckCircle2, 
  AlertCircle, ArrowRight, MapPin, Eye, PlusCircle, RefreshCw 
} from 'lucide-react';
import { api } from '../services/api';

export default function CitizenDashboardScreen({ onNavigate, onSelectComplaint }) {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadComplaints = async () => {
    setLoading(true);
    try {
      const data = await api.getMyComplaints();
      setComplaints(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadComplaints();
  }, []);

  const total = complaints.length;
  const inProgress = complaints.filter(c => c.status === 'In Progress').length;
  const resolved = complaints.filter(c => c.status === 'Resolved').length;
  const pending = complaints.filter(c => c.status === 'New' || c.status === 'In Review').length;

  return (
    <div style={{ padding: '28px', maxWidth: '1400px', margin: '0 auto' }}>
      
      {/* Welcome Banner */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.15) 0%, rgba(13, 148, 136, 0.15) 100%)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '16px',
        padding: '24px 28px',
        marginBottom: '28px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#fff', marginBottom: '6px' }}>
            Citizen Grievance & Issue Resolution Hub
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '0.9rem', maxWidth: '650px' }}>
            Report municipal concerns using text, speech audio, or photo/video evidence.
            Every issue is automatically analyzed by the CivicSense NLP & Computer Vision pipeline.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={() => onNavigate('text-submission')}
            className="btn btn-primary"
            style={{ padding: '10px 18px', fontSize: '0.88rem' }}
          >
            <PlusCircle size={16} /> New Complaint
          </button>
          <button
            onClick={loadComplaints}
            className="btn btn-secondary"
            style={{ padding: '10px 14px' }}
          >
            <RefreshCw size={15} />
          </button>
        </div>
      </div>

      {/* KPI Summary Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '16px',
        marginBottom: '28px'
      }}>
        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.78rem', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase' }}>Total Filed</span>
            <FileText size={18} color="#60a5fa" />
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#fff' }}>{total}</div>
          <span style={{ fontSize: '0.72rem', color: '#64748b' }}>Active in database</span>
        </div>

        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.78rem', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase' }}>In Review / New</span>
            <AlertCircle size={18} color="#fbbf24" />
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#fbbf24' }}>{pending}</div>
          <span style={{ fontSize: '0.72rem', color: '#64748b' }}>Awaiting officer dispatch</span>
        </div>

        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.78rem', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase' }}>In Progress</span>
            <Clock size={18} color="#38bdf8" />
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#38bdf8' }}>{inProgress}</div>
          <span style={{ fontSize: '0.72rem', color: '#64748b' }}>Field crew assigned</span>
        </div>

        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.78rem', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase' }}>Resolved</span>
            <CheckCircle2 size={18} color="#34d399" />
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#34d399' }}>{resolved}</div>
          <span style={{ fontSize: '0.72rem', color: '#64748b' }}>Verified resolution</span>
        </div>
      </div>

      {/* Quick Launch Cards */}
      <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff', marginBottom: '14px' }}>
        Quick Complaint Actions
      </h3>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
        gap: '16px',
        marginBottom: '32px'
      }}>
        <div
          onClick={() => onNavigate('text-submission')}
          className="glass-panel"
          style={{ padding: '20px', cursor: 'pointer', transition: 'all 0.2s ease' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px' }}>
            <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(37, 99, 235, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FileText size={20} color="#60a5fa" />
            </div>
            <div>
              <div style={{ fontWeight: 700, color: '#fff', fontSize: '0.95rem' }}>Text Complaint</div>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Type description in English or Tamil</div>
            </div>
          </div>
          <p style={{ fontSize: '0.8rem', color: '#cbd5e1', marginBottom: '12px' }}>
            Analyzes category (1 of 8), extracts location, duration, and municipal department.
          </p>
          <span style={{ fontSize: '0.75rem', color: '#60a5fa', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            Submit Now <ArrowRight size={13} />
          </span>
        </div>

        <div
          onClick={() => onNavigate('voice-record')}
          className="glass-panel"
          style={{ padding: '20px', cursor: 'pointer', transition: 'all 0.2s ease' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px' }}>
            <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(168, 85, 247, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Mic size={20} color="#c084fc" />
            </div>
            <div>
              <div style={{ fontWeight: 700, color: '#fff', fontSize: '0.95rem' }}>Voice Recording</div>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Speech-to-Text & ASR Acoustics</div>
            </div>
          </div>
          <p style={{ fontSize: '0.8rem', color: '#cbd5e1', marginBottom: '12px' }}>
            Record audio or upload WAV file to compute RMS energy, duration, and WER benchmark.
          </p>
          <span style={{ fontSize: '0.75rem', color: '#c084fc', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            Record Voice <ArrowRight size={13} />
          </span>
        </div>

        <div
          onClick={() => onNavigate('image-upload')}
          className="glass-panel"
          style={{ padding: '20px', cursor: 'pointer', transition: 'all 0.2s ease' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px' }}>
            <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ImageIcon size={20} color="#34d399" />
            </div>
            <div>
              <div style={{ fontWeight: 700, color: '#fff', fontSize: '0.95rem' }}>Image Evidence</div>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Computer Vision Verification</div>
            </div>
          </div>
          <p style={{ fontSize: '0.8rem', color: '#cbd5e1', marginBottom: '12px' }}>
            Upload photograph to corroborate complaint with SUPPORTS_COMPLAINT assessment.
          </p>
          <span style={{ fontSize: '0.75rem', color: '#34d399', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            Upload Photo <ArrowRight size={13} />
          </span>
        </div>

        <div
          onClick={() => onNavigate('video-upload')}
          className="glass-panel"
          style={{ padding: '20px', cursor: 'pointer', transition: 'all 0.2s ease' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px' }}>
            <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(244, 63, 94, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Video size={20} color="#fb7185" />
            </div>
            <div>
              <div style={{ fontWeight: 700, color: '#fff', fontSize: '0.95rem' }}>Video Evidence</div>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Keyframe Extraction & Scoring</div>
            </div>
          </div>
          <p style={{ fontSize: '0.8rem', color: '#cbd5e1', marginBottom: '12px' }}>
            Samples 5 representative video keyframes to establish verified timeline corroboration.
          </p>
          <span style={{ fontSize: '0.75rem', color: '#fb7185', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            Upload Video <ArrowRight size={13} />
          </span>
        </div>
      </div>

      {/* Complaint History Table */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#fff' }}>My Submitted Complaints</h3>
            <p style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Live issues tracked in the municipal resolution queue</p>
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>Loading citizen complaints...</div>
        ) : complaints.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
            <FileText size={36} color="#64748b" style={{ margin: '0 auto 12px auto' }} />
            <p>No complaints submitted yet.</p>
            <button
              onClick={() => onNavigate('text-submission')}
              className="btn btn-primary"
              style={{ marginTop: '14px', fontSize: '0.82rem', padding: '8px 16px' }}
            >
              Submit Your First Complaint
            </button>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="civic-table">
              <thead>
                <tr>
                  <th>Complaint ID</th>
                  <th>Predicted Category</th>
                  <th>Description</th>
                  <th>Location</th>
                  <th>Confidence</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {complaints.map((c) => {
                  const statusColors = {
                    "New": "badge-amber",
                    "In Review": "badge-purple",
                    "In Progress": "badge-blue",
                    "Resolved": "badge-green",
                    "Rejected": "badge-rose"
                  };
                  const badgeClass = statusColors[c.status] || "badge-blue";

                  return (
                    <tr key={c.complaint_id}>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem', fontWeight: 700, color: '#60a5fa' }}>
                        {c.complaint_id}
                      </td>
                      <td>
                        <span style={{ fontWeight: 600, color: '#f1f5f9' }}>{c.predicted_category}</span>
                      </td>
                      <td style={{ maxWidth: '320px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {c.original_text}
                      </td>
                      <td style={{ color: '#94a3b8', fontSize: '0.82rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <MapPin size={13} color="#64748b" />
                          <span>{c.location || "Unspecified"}</span>
                        </div>
                      </td>
                      <td>
                        <span style={{ fontSize: '0.82rem', color: '#34d399', fontWeight: 600 }}>
                          {(c.confidence * 100).toFixed(1)}%
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${badgeClass}`}>{c.status}</span>
                      </td>
                      <td>
                        <button
                          onClick={() => {
                            if (onSelectComplaint) onSelectComplaint(c.complaint_id);
                            onNavigate('issue-timeline');
                          }}
                          className="btn btn-secondary"
                          style={{ padding: '4px 10px', fontSize: '0.75rem', borderRadius: '6px' }}
                        >
                          <Eye size={12} /> Timeline
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
