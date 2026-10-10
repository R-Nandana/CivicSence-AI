import React, { useState, useEffect } from 'react';
import { 
  Video, Upload, CheckCircle2, AlertTriangle, Eye, 
  Film, Sparkles, Clock, RefreshCw, ShieldCheck 
} from 'lucide-react';
import { api } from '../services/api';

export default function VideoEvidenceScreen({ user }) {
  const [complaintId, setComplaintId] = useState('');
  const [myComplaints, setMyComplaints] = useState([]);
  const [file, setFile] = useState(null);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [recentVideos, setRecentVideos] = useState([]);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const loadData = async () => {
    try {
      const [comps, allEv] = await Promise.all([
        api.getMyComplaints().catch(() => []),
        api.getAllEvidence().catch(() => [])
      ]);
      setMyComplaints(comps || []);
      const vids = (allEv || []).filter(e => e.media_type === 'video');
      setRecentVideos(vids);
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
      setVideoPreviewUrl(URL.createObjectURL(f));
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
      setErrorMsg('Please select a video file.');
      return;
    }

    setUploading(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const res = await api.uploadVideoEvidence(complaintId, file);
      setSuccessMsg('Video successfully processed and representative keyframes extracted!');
      setSelectedVideo(res.evidence);
      loadData();
    } catch (err) {
      setErrorMsg(err.message || 'Video analysis failed.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={{ padding: '28px', maxWidth: '1400px', margin: '0 auto' }}>
      
      {/* Title */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
          <span className="badge badge-rose">Computer Vision</span>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#fff' }}>
            Video Evidence Keyframe Extraction & Analysis
          </h1>
        </div>
        <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>
          Ingests short video recordings, samples representative keyframes at configurable temporal intervals,
          analyzes each frame for civic indicators, and combines frame findings into an aggregated evidence assessment.
        </p>
      </div>

      {/* Two Column Layout: Upload + Keyframe Findings */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '28px' }}>
        
        {/* Upload Card */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Upload size={18} color="#f43f5e" /> Upload Video Evidence
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

            <div style={{
              border: '2px dashed rgba(255, 255, 255, 0.15)',
              borderRadius: '12px',
              padding: '24px',
              textAlign: 'center',
              background: 'rgba(15, 23, 42, 0.4)',
              marginBottom: '18px',
              position: 'relative'
            }}>
              <input
                type="file"
                accept="video/*"
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
              {videoPreviewUrl ? (
                <div>
                  <video controls src={videoPreviewUrl} style={{ maxHeight: '180px', borderRadius: '8px', maxWidth: '100%' }} />
                  <div style={{ fontSize: '0.8rem', color: '#f43f5e', fontWeight: 600, marginTop: '8px' }}>{file?.name}</div>
                </div>
              ) : (
                <div>
                  <Film size={36} color="#64748b" style={{ margin: '0 auto 10px auto' }} />
                  <div style={{ fontWeight: 600, color: '#cbd5e1', fontSize: '0.9rem' }}>
                    Click or drag short video file here
                  </div>
                  <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Supports MP4, WEBM, MOV (Max 50MB)</span>
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
              style={{ width: '100%', padding: '12px', background: 'linear-gradient(135deg, #e11d48 0%, #f43f5e 100%)' }}
            >
              <Sparkles size={16} /> {uploading ? 'Extracting Keyframes...' : 'Process Video & Analyze Keyframes'}
            </button>
          </form>
        </div>

        {/* Frame-Level Findings Panel */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Film size={18} color="#fb7185" /> Video Frame Analysis & Findings
          </h3>

          {selectedVideo ? (
            <div>
              {/* Overall Video Verdict */}
              <div style={{
                background: 'rgba(15, 23, 42, 0.6)',
                padding: '16px 20px',
                borderRadius: '12px',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                marginBottom: '18px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <span style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700 }}>
                    Aggregated Video Assessment
                  </span>
                  <span className={`badge ${selectedVideo.evidence_assessment === 'SUPPORTS_COMPLAINT' ? 'badge-green' : 'badge-amber'}`}>
                    {selectedVideo.evidence_assessment}
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                  <div>
                    <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Dominant Category</span>
                    <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#60a5fa' }}>{selectedVideo.top_predicted_category}</div>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Aggregated Certainty</span>
                    <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#34d399' }}>{(selectedVideo.confidence_score * 100).toFixed(1)}%</div>
                  </div>
                </div>
              </div>

              {/* Sampled Keyframes Grid */}
              <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#cbd5e1', marginBottom: '10px' }}>
                Sampled Keyframes ({selectedVideo.frame_findings?.length || 0} Frames)
              </h4>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {selectedVideo.frame_findings?.map((ff, idx) => (
                  <div
                    key={idx}
                    style={{
                      background: 'rgba(255, 255, 255, 0.03)',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: '8px',
                      padding: '10px 14px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span className="badge badge-purple" style={{ fontSize: '0.65rem' }}>
                        Frame {ff.frame_index} ({ff.frame_timestamp})
                      </span>
                      <span style={{ fontWeight: 600, color: '#fff', fontSize: '0.85rem' }}>
                        {ff.top_category}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '0.78rem', color: '#34d399', fontWeight: 700 }}>
                        {(ff.confidence * 100).toFixed(1)}%
                      </span>
                      <span className={`badge ${ff.assessment === 'SUPPORTS_COMPLAINT' ? 'badge-green' : 'badge-amber'}`} style={{ fontSize: '0.65rem' }}>
                        {ff.assessment}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: '#64748b' }}>
              <Film size={42} color="#475569" style={{ margin: '0 auto 12px auto' }} />
              <p>Upload a video or select an existing recording below to view keyframe extractions.</p>
            </div>
          )}
        </div>

      </div>

      {/* Video Records Table */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff', marginBottom: '14px' }}>
          Recorded Video Evidence Log
        </h3>

        {recentVideos.length === 0 ? (
          <div style={{ color: '#64748b', textAlign: 'center', padding: '20px' }}>No video evidence recorded yet.</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="civic-table">
              <thead>
                <tr>
                  <th>Evidence ID</th>
                  <th>Complaint ID</th>
                  <th>Duration</th>
                  <th>Keyframes</th>
                  <th>Top Category</th>
                  <th>Assessment</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {recentVideos.map(v => (
                  <tr key={v.evidence_id}>
                    <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#fb7185', fontSize: '0.8rem' }}>
                      {v.evidence_id}
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)', color: '#cbd5e1' }}>
                      {v.complaint_id}
                    </td>
                    <td>{v.duration_seconds}s</td>
                    <td>{v.frame_findings?.length || 0} sampled</td>
                    <td style={{ fontWeight: 600, color: '#fff' }}>{v.top_predicted_category}</td>
                    <td>
                      <span className={`badge ${v.evidence_assessment === 'SUPPORTS_COMPLAINT' ? 'badge-green' : 'badge-amber'}`}>
                        {v.evidence_assessment}
                      </span>
                    </td>
                    <td>
                      <button
                        onClick={() => setSelectedVideo(v)}
                        className="btn btn-secondary"
                        style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                      >
                        <Eye size={12} /> Inspect Frames
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
