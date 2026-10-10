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
        return { label: 'Supports Complaint', class: 'badge-green', color: '#34d399' };
      case 'POTENTIAL_CONFLICT':
        return { label: 'Potential Conflict', class: 'badge-rose', color: '#fb7185' };
      case 'INCONCLUSIVE':
        return { label: 'Inconclusive', class: 'badge-amber', color: '#fbbf24' };
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
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#fff' }}>
            Image Evidence Verification & Scene Analysis
          </h1>
        </div>
        <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>
          Uploads physical photographic evidence and executes computer vision feature extraction to determine whether visual indicators
          corroborate the reported complaint category.
        </p>
      </div>

      {/* Two Column Layout: Upload Card + Live Analysis Result */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '28px' }}>
        
        {/* Upload Card */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Upload size={18} color="#60a5fa" /> Upload Photographic Evidence
          </h3>

          <form onSubmit={handleUpload}>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#cbd5e1', marginBottom: '6px' }}>
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
              border: '2px dashed rgba(255, 255, 255, 0.15)',
              borderRadius: '12px',
              padding: '28px',
              textAlign: 'center',
              background: 'rgba(15, 23, 42, 0.4)',
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
                  <span style={{ fontSize: '0.8rem', color: '#60a5fa', fontWeight: 600 }}>{file?.name}</span>
                </div>
              ) : (
                <div>
                  <ImageIcon size={36} color="#64748b" style={{ margin: '0 auto 10px auto' }} />
                  <div style={{ fontWeight: 600, color: '#cbd5e1', fontSize: '0.9rem' }}>
                    Click or drag image file here
                  </div>
                  <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Supports JPG, PNG, WEBP (Max 15MB)</span>
                </div>
              )}
            </div>

            {errorMsg && (
              <div style={{ color: '#f87171', fontSize: '0.82rem', marginBottom: '14px' }}>
                {errorMsg}
              </div>
            )}

            {successMsg && (
              <div style={{ color: '#34d399', fontSize: '0.82rem', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
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
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sparkles size={18} color="#34d399" /> Vision Model Findings & Assessment
          </h3>

          {selectedAnalysis ? (
            <div>
              {/* Evidence Verdict Card */}
              <div style={{
                background: 'rgba(15, 23, 42, 0.6)',
                padding: '20px',
                borderRadius: '12px',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                marginBottom: '18px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <span style={{ fontSize: '0.78rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700 }}>
                    Evidence Assessment Verdict
                  </span>
                  <span className={`badge ${getAssessmentBadge(selectedAnalysis.evidence_assessment).class}`}>
                    {getAssessmentBadge(selectedAnalysis.evidence_assessment).label}
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', marginBottom: '14px' }}>
                  <div>
                    <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Detected Category</span>
                    <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#60a5fa' }}>
                      {selectedAnalysis.top_predicted_category}
                    </div>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Visual Certainty</span>
                    <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#34d399' }}>
                      {(selectedAnalysis.confidence_score * 100).toFixed(1)}%
                    </div>
                  </div>
                </div>

                <div style={{ fontSize: '0.82rem', color: '#cbd5e1', lineHeight: 1.5, background: 'rgba(0,0,0,0.25)', padding: '10px 14px', borderRadius: '8px' }}>
                  <strong>Model Version:</strong> {selectedAnalysis.model_version} | <strong>Officer Review:</strong> {selectedAnalysis.officer_review_status}
                </div>
              </div>

              {/* Photo Preview if loaded */}
              {selectedAnalysis.file_path && (
                <div style={{ marginBottom: '14px', textAlign: 'center' }}>
                  <img
                    src={selectedAnalysis.file_path}
                    alt="Evidence Analysis"
                    style={{ maxHeight: '180px', borderRadius: '8px', maxWidth: '100%', objectFit: 'cover' }}
                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                  />
                </div>
              )}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: '#64748b' }}>
              <ImageIcon size={42} color="#475569" style={{ margin: '0 auto 12px auto' }} />
              <p>Upload an image on the left or select an existing evidence item below to inspect computer vision scores.</p>
            </div>
          )}
        </div>

      </div>

      {/* Recent Evidence Records Table */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff', marginBottom: '14px' }}>
          Recent Evidence Verification Records
        </h3>

        {recentEvidence.length === 0 ? (
          <div style={{ color: '#64748b', textAlign: 'center', padding: '20px' }}>No media evidence uploaded yet.</div>
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
                      <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#60a5fa', fontSize: '0.8rem' }}>
                        {ev.evidence_id}
                      </td>
                      <td style={{ fontFamily: 'var(--font-mono)', color: '#cbd5e1' }}>
                        {ev.complaint_id}
                      </td>
                      <td>
                        <span className="badge badge-blue">{ev.media_type}</span>
                      </td>
                      <td style={{ fontWeight: 600, color: '#fff' }}>
                        {ev.top_predicted_category}
                      </td>
                      <td style={{ color: '#34d399', fontWeight: 700 }}>
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
                        <button
                          onClick={() => setSelectedAnalysis(ev)}
                          className="btn btn-secondary"
                          style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                        >
                          <Eye size={12} /> Inspect
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
