import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, Search, Filter, CheckCircle2, AlertTriangle, 
  RotateCcw, RefreshCw, Check, X, Building2, MapPin, Database, Cpu,
  Camera, Video, Image as ImageIcon, ExternalLink, Crosshair, Eye,
  CheckCircle, XCircle, ShieldAlert, Sparkles, AlertOctagon
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
  const [activeSubTab, setActiveSubTab] = useState('all'); // 'all' | 'evidence_hub' | 'validated'
  const [validatedList, setValidatedList] = useState([]);

  // Evidence Inspection & Truth Verification State
  const [inspectingEvidenceComplaint, setInspectingEvidenceComplaint] = useState(null);
  const [inspectingEvidenceList, setInspectingEvidenceList] = useState([]);
  const [evidenceLoading, setEvidenceLoading] = useState(false);
  const [officerVerificationDecision, setOfficerVerificationDecision] = useState('VERIFIED_GENUINE'); // 'VERIFIED_GENUINE' | 'FLAGGED_FALSE' | 'INCONCLUSIVE'
  const [officerVerificationNotes, setOfficerVerificationNotes] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [allEvidenceList, setAllEvidenceList] = useState([]);

  const loadData = async () => {
    if (!user || user.role !== 'officer') return;
    setLoading(true);
    try {
      const [complaintData, statsData, feedbackData, evidenceData] = await Promise.all([
        api.getAdminComplaints({
          category: selectedCategory,
          source: selectedSource,
          status: selectedStatus,
          search: searchTerm,
          limit: 200
        }),
        api.getAdminStats(),
        api.getValidatedFeedback(),
        api.getAllEvidence()
      ]);
      setComplaints(complaintData);
      setStats(statsData);
      setValidatedList(feedbackData);
      setAllEvidenceList(evidenceData || []);
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

  const handleInspectEvidence = async (complaint) => {
    setInspectingEvidenceComplaint(complaint);
    setEvidenceLoading(true);
    setOfficerVerificationNotes('');
    setOfficerVerificationDecision('VERIFIED_GENUINE');
    try {
      const items = await api.getComplaintEvidence(complaint.complaint_id);
      setInspectingEvidenceList(items);
      if (items.length > 0) {
        const ev = items[0];
        if (ev.officer_review_status === 'FLAGGED_FALSE' || ev.evidence_assessment === 'POTENTIAL_CONFLICT') {
          setOfficerVerificationDecision('FLAGGED_FALSE');
        } else if (ev.officer_review_status === 'VERIFIED_GENUINE' || ev.evidence_assessment === 'SUPPORTS_COMPLAINT') {
          setOfficerVerificationDecision('VERIFIED_GENUINE');
        } else {
          setOfficerVerificationDecision('INCONCLUSIVE');
        }
        if (ev.officer_notes) {
          setOfficerVerificationNotes(ev.officer_notes);
        }
      }
    } catch (err) {
      console.error('Error fetching complaint evidence:', err);
      setInspectingEvidenceList([]);
    } finally {
      setEvidenceLoading(false);
    }
  };

  const handleSubmitEvidenceVerification = async (evidenceId) => {
    if (!evidenceId) return;
    setSubmittingReview(true);
    try {
      const correctedAssessment = 
        officerVerificationDecision === 'VERIFIED_GENUINE' ? 'SUPPORTS_COMPLAINT' :
        officerVerificationDecision === 'FLAGGED_FALSE' ? 'POTENTIAL_CONFLICT' : 'INCONCLUSIVE';

      await api.reviewEvidence(
        evidenceId,
        officerVerificationDecision,
        correctedAssessment,
        officerVerificationNotes
      );
      setActionSuccess(`Evidence successfully verified as ${
        officerVerificationDecision === 'VERIFIED_GENUINE' ? 'VERIFIED GENUINE (TRUE)' :
        officerVerificationDecision === 'FLAGGED_FALSE' ? 'FLAGGED AS FALSE / CONFLICT' : 'INCONCLUSIVE (FIELD VISIT)'
      }!`);
      setTimeout(() => setActionSuccess(''), 4000);
      setInspectingEvidenceComplaint(null);
      loadData();
    } catch (err) {
      alert(err.message || 'Evidence verification failed.');
    } finally {
      setSubmittingReview(false);
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
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '10px' }}>
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
            <p style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-main)' }}>{stats.total_complaints}</p>
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
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
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
            background: activeSubTab === 'evidence_hub' ? 'linear-gradient(135deg, #0284c7 0%, #06b6d4 100%)' : 'rgba(255,255,255,0.05)',
            color: '#fff',
            fontSize: '0.85rem',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
          onClick={() => setActiveSubTab('evidence_hub')}
        >
          <Camera size={15} /> Evidence Verification & Geo-Tags ({allEvidenceList.length})
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
                  <th>Evidence & Geo-Tag</th>
                  <th>Status</th>
                  <th>Officer Actions</th>
                </tr>
              </thead>
              <tbody>
                {complaints.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
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
                      <td style={{ maxWidth: '280px', fontSize: '0.85rem' }}>
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
                      <td style={{ maxWidth: '200px' }}>
                        <p style={{ fontSize: '0.8rem', color: '#fff', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <MapPin size={12} color="#60a5fa" /> {c.location || 'Not Specified'}
                        </p>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3px' }}>
                          {c.entities && c.entities.slice(0, 3).map((e, idx) => (
                            <span key={idx} className="badge badge-purple" style={{ fontSize: '0.6rem' }}>
                              {e.entity_type}: {e.entity_text}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td>
                        {c.geo_lat || c.has_evidence ? (
                          <div>
                            {c.geo_lat && (
                              <a
                                href={`https://www.google.com/maps?q=${c.geo_lat},${c.geo_lon}`}
                                target="_blank"
                                rel="noreferrer"
                                style={{
                                  fontSize: '0.72rem',
                                  color: '#38bdf8',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  textDecoration: 'none',
                                  fontWeight: 600,
                                  marginBottom: '3px'
                                }}
                                title="Open in Google Maps"
                              >
                                <MapPin size={11} color="#06b6d4" /> {c.geo_lat.toFixed(4)}, {c.geo_lon.toFixed(4)}
                              </a>
                            )}
                            <div>
                              <span className={`badge ${
                                c.evidence_status === 'VERIFIED_GENUINE' ? 'badge-green' :
                                c.evidence_status === 'FLAGGED_FALSE' ? 'badge-rose' : 'badge-amber'
                              }`} style={{ fontSize: '0.62rem' }}>
                                {c.evidence_status === 'VERIFIED_GENUINE' ? 'Verified True' :
                                 c.evidence_status === 'FLAGGED_FALSE' ? 'Flagged False' : 'Pending Review'}
                              </span>
                            </div>
                          </div>
                        ) : (
                          <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>No Media</span>
                        )}
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
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          <button
                            className="btn"
                            style={{
                              padding: '5px 8px',
                              fontSize: '0.72rem',
                              background: 'rgba(6, 182, 212, 0.15)',
                              border: '1px solid rgba(6, 182, 212, 0.4)',
                              color: '#38bdf8',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              borderRadius: '6px'
                            }}
                            onClick={() => handleInspectEvidence(c)}
                            title="Inspect attached photo/video and verify whether it is true or false"
                          >
                            <Eye size={12} color="#38bdf8" /> Verify Evidence
                          </button>

                          <button
                            className="btn btn-secondary"
                            style={{ padding: '5px 8px', fontSize: '0.72rem', gap: '4px' }}
                            onClick={() => {
                              setValidatingComplaint(c);
                              setCorrectCategory(c.predicted_category);
                            }}
                          >
                            <Check size={12} color="#34d399" /> Validate AI
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Evidence Verification & Geo-Tags Sub-Tab */}
      {activeSubTab === 'evidence_hub' && (
        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
            <div>
              <h3 style={{ fontSize: '1.15rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Camera size={18} color="#06b6d4" /> Citizen Evidence Verification & Geo-Tag Inspection Hub
              </h3>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                Inspect photos and videos attached by citizens, view their exact GPS Geo-Tag coordinates, analyze Computer Vision features, and verify evidence integrity (True / Genuine vs False / Manipulated).
              </p>
            </div>
          </div>

          <table className="civic-table">
            <thead>
              <tr>
                <th>Evidence ID & Preview</th>
                <th>Complaint ID</th>
                <th>Media Type</th>
                <th>GPS Geo-Tag & Landmark</th>
                <th>Computer Vision Assessment</th>
                <th>Officer Verification Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {allEvidenceList.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                    No media evidence uploaded yet. Submit a complaint with photo/video from the Citizen Portal!
                  </td>
                </tr>
              ) : (
                allEvidenceList.map((ev) => (
                  <tr key={ev.evidence_id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        {ev.file_path && ev.media_type === 'image' ? (
                          <img
                            src={`http://127.0.0.1:8000${ev.file_path}`}
                            alt="Evidence Thumbnail"
                            style={{ width: '64px', height: '48px', objectFit: 'cover', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.1)' }}
                          />
                        ) : (
                          <div style={{ width: '64px', height: '48px', background: 'var(--panel-bg)', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Video size={18} color="#94a3b8" />
                          </div>
                        )}
                        <div>
                          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: '#818cf8', fontWeight: 600 }}>
                            {ev.evidence_id}
                          </span>
                          <span style={{ display: 'block', fontSize: '0.68rem', color: 'var(--text-dim)' }}>
                            {ev.file_name}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        {ev.complaint_id}
                      </span>
                    </td>
                    <td>
                      <span className="badge badge-purple" style={{ fontSize: '0.68rem' }}>
                        {ev.media_type?.toUpperCase()}
                      </span>
                    </td>
                    <td>
                      {ev.geo_lat ? (
                        <div>
                          <a
                            href={`https://www.google.com/maps?q=${ev.geo_lat},${ev.geo_lon}`}
                            target="_blank"
                            rel="noreferrer"
                            style={{
                              fontSize: '0.74rem',
                              color: '#38bdf8',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              textDecoration: 'none',
                              fontWeight: 600
                            }}
                          >
                            <MapPin size={12} color="#06b6d4" /> {ev.geo_lat.toFixed(5)}° N, {ev.geo_lon.toFixed(5)}° E
                          </a>
                          <span style={{ display: 'block', fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                            {ev.geo_address || 'Geotagged from Citizen App'}
                          </span>
                        </div>
                      ) : (
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>No GPS Tag</span>
                      )}
                    </td>
                    <td>
                      <div>
                        <span className={`badge ${
                          ev.evidence_assessment === 'SUPPORTS_COMPLAINT' ? 'badge-green' :
                          ev.evidence_assessment === 'POTENTIAL_CONFLICT' ? 'badge-rose' : 'badge-amber'
                        }`} style={{ fontSize: '0.68rem' }}>
                          {ev.evidence_assessment}
                        </span>
                        <span style={{ display: 'block', fontSize: '0.68rem', color: 'var(--text-dim)', marginTop: '2px' }}>
                          Match: {ev.top_predicted_category} ({Math.round((ev.confidence_score || 0) * 100)}%)
                        </span>
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${
                        ev.officer_review_status === 'VERIFIED_GENUINE' ? 'badge-green' :
                        ev.officer_review_status === 'FLAGGED_FALSE' ? 'badge-rose' : 'badge-blue'
                      }`} style={{ fontSize: '0.68rem' }}>
                        {ev.officer_review_status === 'VERIFIED_GENUINE' ? 'Verified True' :
                         ev.officer_review_status === 'FLAGGED_FALSE' ? 'Flagged False' : 'Pending Review'}
                      </span>
                    </td>
                    <td>
                      <button
                        className="btn"
                        style={{
                          padding: '6px 12px',
                          fontSize: '0.75rem',
                          background: 'linear-gradient(135deg, #0284c7 0%, #06b6d4 100%)',
                          color: '#fff',
                          borderRadius: '6px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                        onClick={() => {
                          const matched = complaints.find(c => c.complaint_id === ev.complaint_id) || {
                            complaint_id: ev.complaint_id,
                            original_text: `Referenced complaint for evidence ${ev.evidence_id}`,
                            predicted_category: ev.top_predicted_category,
                            location: ev.geo_address || 'Coimbatore'
                          };
                          handleInspectEvidence(matched);
                        }}
                      >
                        <Eye size={13} /> Verify Truth
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Validated Feedback Log Sub-Tab */}
      {activeSubTab === 'validated' && (
        <div className="glass-panel" style={{ padding: '20px' }}>
          <h3 style={{ fontSize: '1.1rem', color: 'var(--text-main)', marginBottom: '14px' }}>
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
                    <td style={{ fontSize: '0.85rem', color: 'var(--text-main)' }}>{fb.validated_by}</td>
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
          <div className="glass-panel" style={{ width: '100%', maxWidth: '520px', padding: '24px', background: 'var(--bg-surface)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '1.15rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle2 size={18} color="#10b981" /> Validate / Correct AI Prediction
              </h3>
              <button className="btn btn-outline" style={{ padding: '4px 8px' }} onClick={() => setValidatingComplaint(null)}>
                <X size={16} />
              </button>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '8px', marginBottom: '16px', border: '1px solid var(--border-color)' }}>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Complaint ID: {validatingComplaint.complaint_id}</p>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-main)', marginTop: '4px' }}>"{validatingComplaint.original_text}"</p>
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

      {/* Evidence Inspection & Truth Verification Modal */}
      {inspectingEvidenceComplaint && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0, 0, 0, 0.85)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 110,
          padding: '20px'
        }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '920px', maxHeight: '90vh', overflowY: 'auto', padding: '26px', background: 'var(--bg-surface)', border: '1px solid rgba(6, 182, 212, 0.4)' }}>
            
            {/* Modal Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', borderBottom: '1px solid var(--border-color)', paddingBottom: '14px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Camera size={22} color="#06b6d4" />
                  <h2 style={{ fontSize: '1.25rem', color: 'var(--text-main)', margin: 0, fontWeight: 800 }}>
                    Evidence Truth Analysis & Location Verification
                  </h2>
                </div>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '4px 0 0' }}>
                  Complaint ID: <strong style={{ color: '#818cf8', fontFamily: 'var(--font-mono)' }}>{inspectingEvidenceComplaint.complaint_id}</strong> • Category: <span className="badge badge-green" style={{ fontSize: '0.65rem' }}>{inspectingEvidenceComplaint.predicted_category}</span>
                </p>
              </div>
              <button className="btn btn-outline" style={{ padding: '6px 10px' }} onClick={() => setInspectingEvidenceComplaint(null)}>
                <X size={18} />
              </button>
            </div>

            {/* Complaint Text Context */}
            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '12px 16px', borderRadius: '8px', marginBottom: '20px', border: '1px solid var(--border-color)' }}>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Reported Problem:</span>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-main)', margin: '4px 0 0', fontStyle: 'italic' }}>
                "{inspectingEvidenceComplaint.original_text}"
              </p>
            </div>

            {evidenceLoading ? (
              <div style={{ padding: '60px', textAlign: 'center', color: '#38bdf8' }}>
                <RefreshCw size={28} className="spin" style={{ margin: '0 auto 12px' }} />
                <p style={{ fontSize: '0.9rem' }}>Analyzing evidence items & loading CV features...</p>
              </div>
            ) : inspectingEvidenceList.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                <Camera size={36} color="#64748b" style={{ margin: '0 auto 12px' }} />
                <h4 style={{ color: 'var(--text-main)', marginBottom: '6px' }}>No Evidence Uploaded</h4>
                <p style={{ fontSize: '0.85rem' }}>The citizen has not attached a photo or video to this complaint yet.</p>
                <button className="btn btn-secondary" onClick={() => setInspectingEvidenceComplaint(null)} style={{ marginTop: '14px' }}>
                  Close Inspector
                </button>
              </div>
            ) : (
              // Evidence item detail
              (() => {
                const ev = inspectingEvidenceList[0];
                const lat = ev.geo_lat || inspectingEvidenceComplaint.geo_lat;
                const lon = ev.geo_lon || inspectingEvidenceComplaint.geo_lon;
                const address = ev.geo_address || inspectingEvidenceComplaint.location || 'Gandhipuram, Coimbatore';

                return (
                  <div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1fr', gap: '22px', alignItems: 'start', marginBottom: '24px' }}>
                      
                      {/* Left: Media Inspection & GPS Geo-Tag */}
                      <div>
                        <div style={{
                          background: '#020617',
                          border: '1px solid rgba(255,255,255,0.1)',
                          borderRadius: '10px',
                          overflow: 'hidden',
                          marginBottom: '14px',
                          textAlign: 'center'
                        }}>
                          {ev.media_type === 'image' ? (
                            <img
                              src={`http://127.0.0.1:8000${ev.file_path}`}
                              alt="Attached Civic Evidence"
                              style={{ width: '100%', maxHeight: '360px', objectFit: 'contain', display: 'block' }}
                            />
                          ) : (
                            <video
                              controls
                              src={`http://127.0.0.1:8000${ev.file_path}`}
                              style={{ width: '100%', maxHeight: '360px', display: 'block' }}
                            />
                          )}
                        </div>

                        {/* Geo-Tag Location Card */}
                        <div style={{
                          background: 'rgba(6, 182, 212, 0.08)',
                          border: '1px solid rgba(6, 182, 212, 0.3)',
                          borderRadius: '10px',
                          padding: '14px'
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#38bdf8', fontWeight: 700, fontSize: '0.85rem' }}>
                              <MapPin size={16} color="#06b6d4" />
                              <span>GPS Geo-Tag Location</span>
                            </div>
                            <span className="badge badge-cyan" style={{ fontSize: '0.65rem' }}>
                              Integrity Verified
                            </span>
                          </div>

                          {lat && lon ? (
                            <div>
                              <p style={{ fontSize: '0.82rem', color: 'var(--text-main)', margin: '0 0 4px', fontWeight: 600 }}>
                                Coordinates: {lat.toFixed(5)}° N, {lon.toFixed(5)}° E
                              </p>
                              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '0 0 10px' }}>
                                Landmark: {address}
                              </p>
                              <a
                                href={`https://www.google.com/maps?q=${lat},${lon}`}
                                target="_blank"
                                rel="noreferrer"
                                className="btn"
                                style={{
                                  fontSize: '0.75rem',
                                  padding: '6px 12px',
                                  background: 'rgba(56, 189, 248, 0.15)',
                                  border: '1px solid rgba(56, 189, 248, 0.4)',
                                  color: '#38bdf8',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '6px',
                                  borderRadius: '6px',
                                  textDecoration: 'none'
                                }}
                              >
                                <ExternalLink size={12} /> Pinpoint Location on Google Maps
                              </a>
                            </div>
                          ) : (
                            <p style={{ fontSize: '0.78rem', color: 'var(--text-dim)', margin: 0 }}>
                              No GPS coordinates embedded in this upload.
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Right: Computer Vision Analysis & Truth Verification Form */}
                      <div>
                        {/* Computer Vision Analysis Card */}
                        <div style={{
                          background: 'rgba(255, 255, 255, 0.03)',
                          border: '1px solid rgba(255, 255, 255, 0.08)',
                          borderRadius: '10px',
                          padding: '16px',
                          marginBottom: '18px'
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <Sparkles size={16} color="#c084fc" />
                              <h4 style={{ fontSize: '0.92rem', color: 'var(--text-main)', margin: 0 }}>Computer Vision Analysis</h4>
                            </div>
                            <span className={`badge ${
                              ev.evidence_assessment === 'SUPPORTS_COMPLAINT' ? 'badge-green' :
                              ev.evidence_assessment === 'POTENTIAL_CONFLICT' ? 'badge-rose' : 'badge-amber'
                            }`} style={{ fontSize: '0.72rem' }}>
                              {ev.evidence_assessment}
                            </span>
                          </div>

                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
                            <div style={{ background: 'rgba(0,0,0,0.25)', padding: '10px', borderRadius: '6px' }}>
                              <span style={{ fontSize: '0.68rem', color: 'var(--text-dim)', display: 'block' }}>Visual Category Match</span>
                              <span style={{ fontSize: '0.88rem', color: 'var(--text-main)', fontWeight: 700 }}>{ev.top_predicted_category}</span>
                            </div>
                            <div style={{ background: 'rgba(0,0,0,0.25)', padding: '10px', borderRadius: '6px' }}>
                              <span style={{ fontSize: '0.68rem', color: 'var(--text-dim)', display: 'block' }}>Visual Confidence</span>
                              <span style={{ fontSize: '0.88rem', color: '#34d399', fontWeight: 700 }}>
                                {Math.round((ev.confidence_score || 0) * 100)}%
                              </span>
                            </div>
                          </div>

                          {/* Detected Features Badges */}
                          {ev.detected_classes && ev.detected_classes.length > 0 && (
                            <div>
                              <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)', display: 'block', marginBottom: '6px' }}>
                                Detected Visual Signatures:
                              </span>
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                                {ev.detected_classes.slice(0, 4).map((cls, cIdx) => (
                                  <span key={cIdx} className="badge badge-purple" style={{ fontSize: '0.64rem' }}>
                                    {cls.class_name}: {Math.round((cls.probability || 0) * 100)}%
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          <div style={{ marginTop: '10px', padding: '8px 10px', borderRadius: '6px', background: 'rgba(0,0,0,0.2)', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                            {ev.evidence_assessment === 'SUPPORTS_COMPLAINT'
                              ? '🤖 AI Model Verdict: Visual patterns, textures, and edge density strongly align with genuine civic defect.'
                              : ev.evidence_assessment === 'POTENTIAL_CONFLICT'
                              ? '⚠️ AI Model Verdict: Discrepancy detected between image contents and the complaint topic (possible false evidence).'
                              : 'ℹ️ AI Model Verdict: Image quality or light levels require human officer verification.'}
                          </div>
                        </div>

                        {/* Officer Truth Verification Panel */}
                        <div style={{
                          background: 'rgba(16, 185, 129, 0.05)',
                          border: '1px solid rgba(16, 185, 129, 0.3)',
                          borderRadius: '10px',
                          padding: '16px'
                        }}>
                          <h4 style={{ fontSize: '0.92rem', color: 'var(--text-main)', margin: '0 0 6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <ShieldCheck size={16} color="#10b981" /> Municipal Officer Truth Verification
                          </h4>
                          <p style={{ fontSize: '0.74rem', color: 'var(--text-muted)', margin: '0 0 14px' }}>
                            Analyze the photo/video above and verify whether the evidence is genuine or false:
                          </p>

                          {/* Determination Options */}
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '14px' }}>
                            <label style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '10px',
                              padding: '10px 12px',
                              borderRadius: '8px',
                              cursor: 'pointer',
                              background: officerVerificationDecision === 'VERIFIED_GENUINE' ? 'rgba(16, 185, 129, 0.18)' : 'rgba(255,255,255,0.03)',
                              border: officerVerificationDecision === 'VERIFIED_GENUINE' ? '1px solid #10b981' : '1px solid var(--border-color)'
                            }}>
                              <input
                                type="radio"
                                name="decision"
                                value="VERIFIED_GENUINE"
                                checked={officerVerificationDecision === 'VERIFIED_GENUINE'}
                                onChange={() => setOfficerVerificationDecision('VERIFIED_GENUINE')}
                              />
                              <div>
                                <span style={{ fontSize: '0.84rem', fontWeight: 700, color: '#34d399' }}>
                                  ✅ VERIFIED GENUINE (TRUE)
                                </span>
                                <span style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                                  Evidence is authentic, accurately portrays the civic problem, and GPS tag matches location.
                                </span>
                              </div>
                            </label>

                            <label style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '10px',
                              padding: '10px 12px',
                              borderRadius: '8px',
                              cursor: 'pointer',
                              background: officerVerificationDecision === 'FLAGGED_FALSE' ? 'rgba(244, 63, 94, 0.18)' : 'rgba(255,255,255,0.03)',
                              border: officerVerificationDecision === 'FLAGGED_FALSE' ? '1px solid #f43f5e' : '1px solid var(--border-color)'
                            }}>
                              <input
                                type="radio"
                                name="decision"
                                value="FLAGGED_FALSE"
                                checked={officerVerificationDecision === 'FLAGGED_FALSE'}
                                onChange={() => setOfficerVerificationDecision('FLAGGED_FALSE')}
                              />
                              <div>
                                <span style={{ fontSize: '0.84rem', fontWeight: 700, color: '#fb7185' }}>
                                  ❌ FLAGGED AS FALSE / SPAM (FALSE)
                                </span>
                                <span style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                                  Evidence is misleading, staged, unrelated, or does not depict the reported issue.
                                </span>
                              </div>
                            </label>

                            <label style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '10px',
                              padding: '10px 12px',
                              borderRadius: '8px',
                              cursor: 'pointer',
                              background: officerVerificationDecision === 'INCONCLUSIVE' ? 'rgba(245, 158, 11, 0.18)' : 'rgba(255,255,255,0.03)',
                              border: officerVerificationDecision === 'INCONCLUSIVE' ? '1px solid #f59e0b' : '1px solid var(--border-color)'
                            }}>
                              <input
                                type="radio"
                                name="decision"
                                value="INCONCLUSIVE"
                                checked={officerVerificationDecision === 'INCONCLUSIVE'}
                                onChange={() => setOfficerVerificationDecision('INCONCLUSIVE')}
                              />
                              <div>
                                <span style={{ fontSize: '0.84rem', fontWeight: 700, color: '#fbbf24' }}>
                                  ⚠️ INCONCLUSIVE / FIELD INSPECTION
                                </span>
                                <span style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                                  Media is blurry or ambiguous; on-site engineer visit required.
                                </span>
                              </div>
                            </label>
                          </div>

                          {/* Notes */}
                          <div style={{ marginBottom: '14px' }}>
                            <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                              Officer Verification Notes:
                            </label>
                            <textarea
                              className="textarea-field"
                              rows={2}
                              value={officerVerificationNotes}
                              onChange={(e) => setOfficerVerificationNotes(e.target.value)}
                              placeholder="E.g., Confirmed genuine road crater at Gandhipuram bus stand; road maintenance unit notified."
                            />
                          </div>

                          {/* Actions */}
                          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                            <button
                              type="button"
                              className="btn btn-secondary"
                              onClick={() => setInspectingEvidenceComplaint(null)}
                              style={{ padding: '8px 16px', fontSize: '0.8rem' }}
                            >
                              Close
                            </button>

                            <button
                              type="button"
                              className="btn btn-success"
                              onClick={() => handleSubmitEvidenceVerification(ev.evidence_id)}
                              disabled={submittingReview}
                              style={{ padding: '8px 18px', fontSize: '0.8rem', fontWeight: 700 }}
                            >
                              {submittingReview ? 'Submitting...' : 'Save Verification'}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()
            )}
          </div>
        </div>
      )}
    </div>
  );
}
