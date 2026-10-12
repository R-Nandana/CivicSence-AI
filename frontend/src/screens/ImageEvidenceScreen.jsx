import React, { useState, useEffect } from 'react';
import { 
  Upload, Image as ImageIcon, CheckCircle2, AlertTriangle, 
  HelpCircle, Eye, ShieldCheck, RefreshCw, Send, Sparkles 
} from 'lucide-react';
import { api } from '../services/api';

export default function ImageEvidenceScreen({ initialComplaintId, user }) {
  const [complaintId, setComplaintId] = useState(initialComplaintId || '');
  const [myComplaints, setMyComplaints] = useState([]);
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [recentEvidence, setRecentEvidence] = useState([]);
  const [selectedAnalysis, setSelectedAnalysis] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [verifySuccess, setVerifySuccess] = useState('');

  const isOfficer = user?.role === 'officer';

  const loadData = async () => {
    try {
      const [comps, allEv] = await Promise.all([
        api.getMyComplaints().catch(() => []),
        api.getAllEvidence().catch(() => [])
      ]);
      setMyComplaints(comps || []);
      setRecentEvidence(allEv || []);
      if (!complaintId && comps?.length > 0) {
        setComplaintId(comps[0].complaint_id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleVerifyEvidence = async (evidenceId, status, assessment) => {
    setVerifying(true);
    setVerifySuccess('');
    try {
      await api.reviewEvidence(evidenceId, status, assessment, `Officer verified as ${status}`);
      setVerifySuccess(`Evidence ${evidenceId} successfully verified: ${status}`);
      setSelectedAnalysis(prev => prev ? { ...prev, officer_review_status: status, evidence_assessment: assessment } : null);
      setRecentEvidence(prev => prev.map(item => item.evidence_id === evidenceId ? { ...item, officer_review_status: status, evidence_assessment: assessment } : item));
      setTimeout(() => setVerifySuccess(''), 5000);
    } catch (err) {
      alert(err.message || 'Evidence verification failed');
    } finally {
      setVerifying(false);
    }
  };

  const handleFileChange = (e) => {
    const f = e.target.files[0];
    if (f) {
      setFile(f);
      setPreviewUrl(URL.createObjectURL(f));
      setErrorMsg('');
      setSuccessMsg('');
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!complaintId.trim()) {
      setErrorMsg('Please enter or select a Complaint ID.');
      return;
    }
    if (!file) {
      setErrorMsg('Please select an image file to upload.');
      return;
    }

    setUploading(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const res = await api.uploadImageEvidence(complaintId, file);
      setSuccessMsg('Image evidence analyzed and verified!');
      setSelectedAnalysis(res.evidence);
      loadData();
    } catch (err) {
      setErrorMsg(err.message || 'Image analysis failed.');
    } finally {
      setUploading(false);
    }
  };

  const getAssessmentBadge = (assessment) => {
    switch (assessment) {
      case 'SUPPORTS_COMPLAINT':
        return { label: 'Supports Complaint', class: 'badge-green', color: 'var(--accent-green)' };
      case 'POTENTIAL_CONFLICT':
        return { label: 'Potential Conflict', class: 'badge-rose', color: '#fb7185' };
      case 'INCONCLUSIVE':
        return { label: 'Inconclusive', class: 'badge-amber', color: 'var(--accent-amber)' };
      case 'REQUIRES_HUMAN_REVIEW':
      default:
        return { label: 'Requires Human Review', class: 'badge-purple', color: '#c084fc' };
    }
  };

  return (
    <div style={{ padding: '28px', maxWidth: '1400px', margin: '0 auto' }}>
      
      {/* Title */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
          <span className="badge badge-green">Computer Vision</span>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-main)' }}>
            Image Evidence Verification & Scene Analysis
          </h1>
        </div>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          Uploads physical photographic evidence and executes computer vision feature extraction to determine whether visual indicators
          corroborate the reported complaint category.
        </p>
      </div>

      {/* Two Column Layout: Upload Card + Live Analysis Result */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '28px' }}>
        
        {/* Upload Card */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Upload size={18} color="#60a5fa" /> Upload Photographic Evidence
          </h3>

          <form onSubmit={handleUpload}>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '6px' }}>
                Associated Complaint ID *
              </label>
              {myComplaints.length > 0 ? (
                <select
                  value={complaintId}
                  onChange={(e) => setComplaintId(e.target.value)}
                  className="select-field"
                  style={{ marginBottom: '8px' }}
                >
                  {myComplaints.map(c => (
                    <option key={c.complaint_id} value={c.complaint_id}>
                      {c.complaint_id} — {c.predicted_category} ({c.location})
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  required
                  value={complaintId}
                  onChange={(e) => setComplaintId(e.target.value)}
                  placeholder="e.g. CIV-USR-12345"
                  className="input-field"
                />
              )}
            </div>

            {/* Drag & Drop File Upload Area */}
            <div style={{
              border: '2px dashed var(--border-color)',
              borderRadius: '12px',
              padding: '28px',
              textAlign: 'center',
              background: 'var(--panel-bg)',
              marginBottom: '18px',
              position: 'relative',
              cursor: 'pointer'
            }}>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                style={{
                  position: 'absolute',
                  inset: 0,
                  opacity: 0,
                  cursor: 'pointer',
                  width: '100%',
                  height: '100%'
                }}
              />
              {previewUrl ? (
                <div>
                  <img
                    src={previewUrl}
                    alt="Evidence Preview"
                    style={{ maxHeight: '180px', borderRadius: '8px', margin: '0 auto 10px auto', display: 'block' }}
                  />
                  <span style={{ fontSize: '0.8rem', color: 'var(--primary-light)', fontWeight: 600 }}>{file?.name}</span>
                </div>
              ) : (
                <div>
                  <ImageIcon size={36} color="#64748b" style={{ margin: '0 auto 10px auto' }} />
                  <div style={{ fontWeight: 600, color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                    Click or drag image file here
                  </div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Supports JPG, PNG, WEBP (Max 15MB)</span>
                </div>
              )}
            </div>

            {errorMsg && (
              <div style={{ color: '#f87171', fontSize: '0.82rem', marginBottom: '14px' }}>
                {errorMsg}
              </div>
            )}

            {successMsg && (
              <div style={{ color: 'var(--accent-green)', fontSize: '0.82rem', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <CheckCircle2 size={16} /> {successMsg}
              </div>
            )}

            <button
              type="submit"
              disabled={uploading || !file}
              className="btn btn-primary"
              style={{ width: '100%', padding: '12px' }}
            >
              <Sparkles size={16} /> {uploading ? 'Analyzing Vision Features...' : 'Submit & Analyze Evidence'}
            </button>
          </form>
        </div>

        {/* Live Analysis Results Panel */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sparkles size={18} color="#34d399" /> Vision Model Findings & Assessment
          </h3>

          {selectedAnalysis ? (
            <div>
              {/* Evidence Verdict Card */}
              <div style={{
                background: 'var(--panel-bg)',
                padding: '20px',
                borderRadius: '12px',
                border: '1px solid var(--border-color)',
                marginBottom: '18px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                    Evidence Assessment Verdict
                  </span>
                  <span className={`badge ${getAssessmentBadge(selectedAnalysis.evidence_assessment).class}`}>
                    {getAssessmentBadge(selectedAnalysis.evidence_assessment).label}
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', marginBottom: '14px' }}>
                  <div>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Detected Category</span>
                    <div style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--primary-light)' }}>
                      {selectedAnalysis.top_predicted_category}
                    </div>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Visual Certainty</span>
                    <div style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--accent-green)' }}>
                      {(selectedAnalysis.confidence_score * 100).toFixed(1)}%
                    </div>
                  </div>
                </div>

                <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.5, background: 'var(--panel-bg)', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                  <strong>Model Version:</strong> {selectedAnalysis.model_version} | <strong>Officer Review:</strong> {selectedAnalysis.officer_review_status}
                </div>
              </div>

              {/* Photo Preview - Full Resolution Viewer */}
              {selectedAnalysis.file_path && (
                <div style={{ marginBottom: '18px' }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '8px' }}>
                    📷 Evidence Media — Officer View
                  </div>
                  {selectedAnalysis.media_type === 'video' ? (
                    <video
                      controls
                      src={`http://127.0.0.1:8000${selectedAnalysis.file_path}`}
                      style={{ width: '100%', maxHeight: '260px', borderRadius: '10px', border: '1px solid var(--border-color)', background: '#000', display: 'block' }}
                    />
                  ) : (
                    <a href={`http://127.0.0.1:8000${selectedAnalysis.file_path}`} target="_blank" rel="noopener noreferrer">
                      <img
                        src={`http://127.0.0.1:8000${selectedAnalysis.file_path}`}
                        alt="Evidence"
                        style={{ width: '100%', maxHeight: '260px', borderRadius: '10px', objectFit: 'contain', border: '1px solid var(--border-color)', background: 'var(--panel-bg)', display: 'block', cursor: 'zoom-in' }}
                        onError={(e) => { e.currentTarget.style.display = 'none'; }}
                      />
                    </a>
                  )}
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', marginTop: '6px', textAlign: 'center' }}>
                    {selectedAnalysis.file_name} • {selectedAnalysis.media_type?.toUpperCase()} • Click image to open full size
                  </div>
                </div>
              )}

              {/* Officer Verification Action Panel */}
              <div style={{
                background: 'var(--panel-bg)',
                border: '1px solid var(--border-color)',
                borderRadius: '12px',
                padding: '16px',
                marginTop: '16px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <ShieldCheck size={18} color="#10b981" />
                    <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-main)' }}>
                      Officer Verification Action
                    </span>
                  </div>
                  <span style={{
                    fontSize: '0.74rem',
                    fontWeight: 700,
                    padding: '3px 10px',
                    borderRadius: '9999px',
                    background: selectedAnalysis.officer_review_status === 'CONFIRMED' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                    color: selectedAnalysis.officer_review_status === 'CONFIRMED' ? '#10b981' : '#f59e0b',
                    border: selectedAnalysis.officer_review_status === 'CONFIRMED' ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid rgba(245, 158, 11, 0.4)'
                  }}>
                    {selectedAnalysis.officer_review_status || 'PENDING_REVIEW'}
                  </span>
                </div>

                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '12px' }}>
                  Compare the uploaded photo against complaint category and location. Click to record municipal verification.
                </p>

                {verifySuccess && (
                  <div style={{
                    padding: '8px 12px',
                    borderRadius: '8px',
                    background: 'rgba(16, 185, 129, 0.15)',
                    border: '1px solid rgba(16, 185, 129, 0.4)',
                    color: '#10b981',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    marginBottom: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}>
                    <CheckCircle2 size={15} /> {verifySuccess}
                  </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <button
                    onClick={() => handleVerifyEvidence(selectedAnalysis.evidence_id, 'CONFIRMED', 'SUPPORTS_COMPLAINT')}
                    disabled={verifying}
                    className="btn"
                    style={{
                      background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
                      color: '#ffffff',
                      fontSize: '0.82rem',
                      fontWeight: 700,
                      padding: '10px 14px',
                      borderRadius: '8px',
                      boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px'
                    }}
                  >
                    <CheckCircle2 size={15} /> {verifying ? 'Verifying...' : 'Verify Genuine Evidence'}
                  </button>

                  <button
                    onClick={() => handleVerifyEvidence(selectedAnalysis.evidence_id, 'OVERRIDDEN', 'POTENTIAL_CONFLICT')}
                    disabled={verifying}
                    className="btn"
                    style={{
                      background: 'rgba(239, 68, 68, 0.15)',
                      border: '1px solid rgba(239, 68, 68, 0.4)',
                      color: '#ef4444',
                      fontSize: '0.82rem',
                      fontWeight: 700,
                      padding: '10px 14px',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px'
                    }}
                  >
                    <AlertTriangle size={15} /> Flag Mismatch / Conflict
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-dim)' }}>
              <ImageIcon size={42} color="#475569" style={{ margin: '0 auto 12px auto' }} />
              <p>Upload an image on the left or select an existing evidence item below to inspect computer vision scores.</p>
            </div>
          )}
        </div>

      </div>

      {/* Recent Evidence Records Table */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '14px' }}>
          Recent Evidence Verification Records
        </h3>

        {recentEvidence.length === 0 ? (
          <div style={{ color: 'var(--text-dim)', textAlign: 'center', padding: '20px' }}>No media evidence uploaded yet.</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="civic-table">
              <thead>
                <tr>
                  <th>Evidence ID</th>
                  <th>Complaint ID</th>
                  <th>Type</th>
                  <th>Visual Category</th>
                  <th>Confidence</th>
                  <th>Assessment Verdict</th>
                  <th>Review Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {recentEvidence.map((ev) => {
                  const badge = getAssessmentBadge(ev.evidence_assessment);
                  return (
                    <tr key={ev.evidence_id}>
                      <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--primary-light)', fontSize: '0.8rem' }}>
                        {ev.evidence_id}
                      </td>
                      <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                        {ev.complaint_id}
                      </td>
                      <td>
                        <span className="badge badge-blue">{ev.media_type}</span>
                      </td>
                      <td style={{ fontWeight: 600, color: 'var(--text-main)' }}>
                        {ev.top_predicted_category}
                      </td>
                      <td style={{ color: 'var(--accent-green)', fontWeight: 700 }}>
                        {(ev.confidence_score * 100).toFixed(1)}%
                      </td>
                      <td>
                        <span className={`badge ${badge.class}`}>{badge.label}</span>
                      </td>
                      <td>
                        <span style={{ fontSize: '0.78rem', color: ev.officer_review_status === 'CONFIRMED' ? '#34d399' : '#fbbf24' }}>
                          {ev.officer_review_status}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button
                            onClick={() => setSelectedAnalysis(ev)}
                            className="btn btn-secondary"
                            style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                          >
                            <Eye size={12} /> Inspect
                          </button>
                          {ev.officer_review_status !== 'CONFIRMED' && (
                            <button
                              onClick={() => handleVerifyEvidence(ev.evidence_id, 'CONFIRMED', 'SUPPORTS_COMPLAINT')}
                              disabled={verifying}
                              className="btn"
                              style={{ padding: '4px 10px', fontSize: '0.75rem', background: '#059669', color: '#ffffff', fontWeight: 700 }}
                              title="Quick Verify as Genuine Ground Evidence"
                            >
                              <CheckCircle2 size={12} /> Verify
                            </button>
                          )}
                        </div>
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

