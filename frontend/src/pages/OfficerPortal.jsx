import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, Search, Filter, CheckCircle2, AlertTriangle, 
  RotateCcw, RefreshCw, Check, X, Building2, MapPin, Database, Cpu
} from 'lucide-react';
import { api } from '../services/api';

const CIVIC_CATEGORIES = [
  "Roads",
  "Waste Management",
  "Water Supply",
  "Drainage",
  "Streetlights",
  "Sanitation",
  "Traffic",
  "Public Infrastructure"
];

export default function OfficerPortal({ user, onOpenAuth }) {
  const [complaints, setComplaints] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedSource, setSelectedSource] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  
  // Validation Modal State
  const [validatingComplaint, setValidatingComplaint] = useState(null);
  const [correctCategory, setCorrectCategory] = useState('');
  const [validationNotes, setValidationNotes] = useState('');
  const [validatingLoading, setValidatingLoading] = useState(false);
  const [actionSuccess, setActionSuccess] = useState('');
  const [activeSubTab, setActiveSubTab] = useState('all'); // 'all' or 'validated'
  const [validatedList, setValidatedList] = useState([]);

  const loadData = async () => {
    if (!user || user.role !== 'officer') return;
    setLoading(true);
    try {
      const [complaintData, statsData, feedbackData] = await Promise.all([
        api.getAdminComplaints({
          category: selectedCategory,
          source: selectedSource,
          status: selectedStatus,
          search: searchTerm,
          limit: 200
        }),
        api.getAdminStats(),
        api.getValidatedFeedback()
      ]);
      setComplaints(complaintData);
      setStats(statsData);
      setValidatedList(feedbackData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && user.role === 'officer') {
      loadData();
    }
  }, [user, selectedCategory, selectedSource, selectedStatus]);

  const handleStatusChange = async (complaintId, newStatus) => {
    try {
      await api.updateComplaintStatus(complaintId, newStatus);
      setActionSuccess(`Status updated to ${newStatus}`);
      setTimeout(() => setActionSuccess(''), 3000);
      loadData();
    } catch (err) {
      alert(err.message || 'Status update failed');
    }
  };

  const handleValidateSubmit = async (e) => {
    e.preventDefault();
    if (!validatingComplaint || !correctCategory) return;
    setValidatingLoading(true);
    try {
      await api.validatePrediction(
        validatingComplaint.complaint_id,
        validatingComplaint.predicted_category,
        correctCategory,
        validationNotes
      );
      setActionSuccess(`AI prediction validated & saved to feedback collection.`);
      setTimeout(() => setActionSuccess(''), 3000);
      setValidatingComplaint(null);
      setValidationNotes('');
      loadData();
    } catch (err) {
      alert(err.message || 'Validation submission failed');
    } finally {
      setValidatingLoading(false);
    }
  };

  if (!user || user.role !== 'officer') {
    return (
      <div style={{ maxWidth: '600px', margin: '60px auto', textAlign: 'center', padding: '40px' }} className="glass-panel">
        <ShieldCheck size={48} color="#f59e0b" style={{ margin: '0 auto 16px' }} />
        <h2 style={{ color: '#fff', fontSize: '1.4rem', marginBottom: '10px' }}>Officer / Administrative Access Required</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '20px' }}>
          Please sign in with municipal officer credentials to access complaint management, validation feedback loops, and resolution controls.
        </p>
        <button
          className="btn"
          style={{ background: '#059669', color: '#fff', padding: '12px 24px', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '8px' }}
          onClick={() => onOpenAuth('officer')}
        >
          <ShieldCheck size={18} /> Open Municipal Officer Login
        </button>
      </div>
    );
  }


  return (
    <div style={{ maxWidth: '1300px', margin: '0 auto', padding: '30px 20px' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#fff', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <ShieldCheck size={28} color="#10b981" /> Municipal Officer Control Center
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Review AI predictions, validate category classifications, inspect entities, and update resolution states.
          </p>
        </div>
        <button className="btn btn-secondary" onClick={loadData} disabled={loading}>
          <RefreshCw size={15} className={loading ? 'spin' : ''} /> Refresh Data
        </button>
      </div>

      {actionSuccess && (
        <div style={{ padding: '12px 16px', borderRadius: '10px', background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.4)', color: '#34d399', fontSize: '0.9rem', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <CheckCircle2 size={18} /> {actionSuccess}
        </div>
      )}

      {/* KPI Cards */}
      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '24px' }}>
          <div className="glass-panel" style={{ padding: '18px' }}>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Total Complaints in DB</p>
            <p style={{ fontSize: '1.8rem', fontWeight: 800, color: '#fff' }}>{stats.total_complaints}</p>
            <span style={{ fontSize: '0.72rem', color: '#818cf8' }}>NYC 311 + Live Submissions</span>
          </div>

          <div className="glass-panel" style={{ padding: '18px' }}>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Live Citizen Submissions</p>
            <p style={{ fontSize: '1.8rem', fontWeight: 800, color: '#34d399' }}>{stats.user_submitted_count}</p>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>Via CivicSense Portal</span>
          </div>

          <div className="glass-panel" style={{ padding: '18px' }}>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>NYC 311 Dataset Records</p>
            <p style={{ fontSize: '1.8rem', fontWeight: 800, color: '#60a5fa' }}>{stats.dataset_count}</p>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>Processed Open Data</span>
          </div>

          <div className="glass-panel" style={{ padding: '18px' }}>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Validated AI Feedback</p>
            <p style={{ fontSize: '1.8rem', fontWeight: 800, color: '#c084fc' }}>{stats.validated_feedback_count}</p>
            <span style={{ fontSize: '0.72rem', color: '#c084fc' }}>Candidates for Retraining</span>
          </div>
        </div>
      )}

      {/* Navigation Sub-Tabs */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <button
          className="btn"
          style={{
            background: activeSubTab === 'all' ? 'var(--primary)' : 'rgba(255,255,255,0.05)',
            color: '#fff',
            fontSize: '0.85rem'
          }}
          onClick={() => setActiveSubTab('all')}
        >
          All Complaints Queue ({complaints.length})
        </button>

        <button
          className="btn"
          style={{
            background: activeSubTab === 'validated' ? '#a855f7' : 'rgba(255,255,255,0.05)',
            color: '#fff',
            fontSize: '0.85rem'
          }}
          onClick={() => setActiveSubTab('validated')}
        >
          Officer Validated Feedback Log ({validatedList.length})
        </button>
      </div>

      {activeSubTab === 'all' && (
        <>
          {/* Filters Bar */}
          <div className="glass-panel" style={{ padding: '16px', marginBottom: '20px', display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
            <div style={{ flex: '1 1 240px', position: 'relative' }}>
              <input
                type="text"
                className="input-field"
                placeholder="Search text, ID, or location..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && loadData()}
              />
            </div>

            <select
              className="select-field"
              style={{ width: 'auto', flex: '1 1 160px' }}
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              <option value="">All Categories</option>
              {CIVIC_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>

            <select
              className="select-field"
              style={{ width: 'auto', flex: '1 1 160px' }}
              value={selectedSource}
              onChange={(e) => setSelectedSource(e.target.value)}
            >
              <option value="">All Sources</option>
              <option value="User_Submitted">User Submitted</option>
              <option value="NYC_311_Dataset">NYC 311 Dataset</option>
            </select>

            <select
              className="select-field"
              style={{ width: 'auto', flex: '1 1 140px' }}
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
            >
              <option value="">All Statuses</option>
              <option value="New">New</option>
              <option value="In Progress">In Progress</option>
              <option value="Resolved">Resolved</option>
              <option value="Rejected">Rejected</option>
            </select>

            <button className="btn btn-primary" onClick={loadData} style={{ padding: '10px 18px' }}>
              <Search size={15} /> Filter
            </button>
          </div>

          {/* Complaints Table */}
          <div className="glass-panel" style={{ overflow: 'hidden' }}>
            <table className="civic-table">
              <thead>
                <tr>
                  <th>ID / Source</th>
                  <th>Complaint Text</th>
                  <th>AI Predicted Category</th>
                  <th>Location & Entities</th>
                  <th>Status</th>
                  <th>Officer Actions</th>
                </tr>
              </thead>
              <tbody>
                {complaints.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                      No matching complaints found.
                    </td>
                  </tr>
                ) : (
                  complaints.map((c) => (
                    <tr key={c.complaint_id}>
                      <td>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: '#818cf8', fontWeight: 600, display: 'block' }}>
                          {c.complaint_id}
                        </span>
                        <span className={`badge ${c.source === 'User_Submitted' ? 'badge-amber' : 'badge-blue'}`} style={{ fontSize: '0.62rem', marginTop: '4px' }}>
                          {c.source === 'User_Submitted' ? 'Live User' : 'NYC 311'}
                        </span>
                      </td>
                      <td style={{ maxWidth: '300px', fontSize: '0.85rem' }}>
                        <p style={{ marginBottom: '4px' }}>{c.original_text}</p>
                        <span className={`badge ${c.language === 'Tamil' ? 'badge-rose' : c.language === 'Tanglish' ? 'badge-purple' : 'badge-cyan'}`} style={{ fontSize: '0.62rem' }}>
                          {c.language}
                        </span>
                      </td>
                      <td>
                        <span className="badge badge-green" style={{ fontSize: '0.78rem' }}>
                          {c.predicted_category}
                        </span>
                        <span style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-dim)', marginTop: '3px' }}>
                          Conf: {Math.round((c.confidence || 0) * 100)}%
                        </span>
                      </td>
                      <td style={{ maxWidth: '220px' }}>
                        <p style={{ fontSize: '0.8rem', color: '#fff', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <MapPin size={12} color="#60a5fa" /> {c.location || 'Not Specified'}
                        </p>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3px' }}>
                          {c.entities && c.entities.map((e, idx) => (
                            <span key={idx} className="badge badge-purple" style={{ fontSize: '0.6rem' }}>
                              {e.entity_type}: {e.entity_text}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td>
                        <select
                          className="select-field"
                          style={{ padding: '6px 10px', fontSize: '0.78rem', width: '120px' }}
                          value={c.status}
                          onChange={(e) => handleStatusChange(c.complaint_id, e.target.value)}
                        >
                          <option value="New">New</option>
                          <option value="In Progress">In Progress</option>
                          <option value="Resolved">Resolved</option>
                          <option value="Rejected">Rejected</option>
                        </select>
                      </td>
                      <td>
                        <button
                          className="btn btn-secondary"
                          style={{ padding: '6px 10px', fontSize: '0.75rem', gap: '4px' }}
                          onClick={() => {
                            setValidatingComplaint(c);
                            setCorrectCategory(c.predicted_category);
                          }}
                        >
                          <Check size={13} color="#34d399" /> Validate AI
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Validated Feedback Log Sub-Tab */}
      {activeSubTab === 'validated' && (
        <div className="glass-panel" style={{ padding: '20px' }}>
          <h3 style={{ fontSize: '1.1rem', color: '#fff', marginBottom: '14px' }}>
            Officer-Validated Training Candidate Log
          </h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
            These records have been reviewed by municipal officers and logged in the <code>validated_feedback</code> collection for future model retraining cycles without polluting production with unverified noise.
          </p>

          <table className="civic-table">
            <thead>
              <tr>
                <th>Complaint ID</th>
                <th>Original AI Prediction</th>
                <th>Officer Validated Category</th>
                <th>Validated By</th>
                <th>Validation Timestamp</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              {validatedList.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                    No validated feedback recorded yet. Validate a complaint from the main queue!
                  </td>
                </tr>
              ) : (
                validatedList.map((fb, idx) => (
                  <tr key={idx}>
                    <td style={{ fontFamily: 'var(--font-mono)', color: '#818cf8', fontSize: '0.8rem' }}>{fb.complaint_id}</td>
                    <td><span className="badge badge-amber">{fb.original_prediction}</span></td>
                    <td><span className="badge badge-green">{fb.correct_category}</span></td>
                    <td style={{ fontSize: '0.85rem', color: '#fff' }}>{fb.validated_by}</td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>{new Date(fb.validation_date).toLocaleString()}</td>
                    <td style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{fb.notes || '-'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* AI Validation Modal */}
      {validatingComplaint && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(6px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          padding: '20px'
        }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '520px', padding: '24px', background: '#0f172a' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '1.15rem', color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle2 size={18} color="#10b981" /> Validate / Correct AI Prediction
              </h3>
              <button className="btn btn-outline" style={{ padding: '4px 8px' }} onClick={() => setValidatingComplaint(null)}>
                <X size={16} />
              </button>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '8px', marginBottom: '16px', border: '1px solid var(--border-color)' }}>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Complaint ID: {validatingComplaint.complaint_id}</p>
              <p style={{ fontSize: '0.88rem', color: '#fff', marginTop: '4px' }}>"{validatingComplaint.original_text}"</p>
            </div>

            <form onSubmit={handleValidateSubmit}>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                  Original AI Prediction:
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className="badge badge-amber">{validatingComplaint.predicted_category}</span>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>
                    ({Math.round((validatingComplaint.confidence || 0) * 100)}% confidence)
                  </span>
                </div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '6px' }}>
                  Correct / Verified Category:
                </label>
                <select
                  className="select-field"
                  value={correctCategory}
                  onChange={(e) => setCorrectCategory(e.target.value)}
                  required
                >
                  {CIVIC_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '6px' }}>
                  Officer Validation Notes (Optional):
                </label>
                <textarea
                  className="textarea-field"
                  rows={2}
                  value={validationNotes}
                  onChange={(e) => setValidationNotes(e.target.value)}
                  placeholder="E.g., Confirmed road damage near bus stand requiring asphalt patch."
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setValidatingComplaint(null)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-success" disabled={validatingLoading}>
                  {validatingLoading ? 'Saving Feedback...' : 'Confirm Validation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
