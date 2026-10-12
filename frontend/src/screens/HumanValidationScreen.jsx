import React, { useState, useEffect } from 'react';
import { CheckSquare, ShieldCheck, CheckCircle2, RotateCcw, Search, Filter, AlertCircle } from 'lucide-react';
import { api } from '../services/api';

const CIVIC_CATEGORIES = [
  "Roads", "Waste Management", "Water Supply", "Drainage",
  "Streetlights", "Sanitation", "Traffic", "Public Infrastructure"
];

export default function HumanValidationScreen({ user }) {
  const [complaints, setComplaints] = useState([]);
  const [validatedFeedback, setValidatedFeedback] = useState([]);
  const [loading, setLoading] = useState(false);
  const [validatingComplaint, setValidatingComplaint] = useState(null);
  const [correctCategory, setCorrectCategory] = useState('');
  const [validationNotes, setValidationNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [comps, fb] = await Promise.all([
        api.getAdminComplaints({ limit: 100 }),
        api.getValidatedFeedback()
      ]);
      setComplaints(comps || []);
      setValidatedFeedback(fb || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenValidate = (comp) => {
    setValidatingComplaint(comp);
    setCorrectCategory(comp.predicted_category);
    setValidationNotes('');
    setSuccessMsg('');
  };

  const handleValidateSubmit = async (e) => {
    e.preventDefault();
    if (!validatingComplaint || !correctCategory) return;
    setSubmitting(true);
    try {
      await api.validatePrediction(
        validatingComplaint.complaint_id,
        validatingComplaint.predicted_category,
        correctCategory,
        validationNotes
      );
      setSuccessMsg(`AI prediction validated & logged for model retraining!`);
      setTimeout(() => setSuccessMsg(''), 4000);
      setValidatingComplaint(null);
      loadData();
    } catch (err) {
      alert(err.message || 'Validation failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ padding: '28px', maxWidth: '1400px', margin: '0 auto' }}>
      
      {/* Title */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
          <span className="badge badge-purple">Human-in-the-Loop</span>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-main)' }}>
            Human AI Validation & Model Improvement Pipeline
          </h1>
        </div>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          Municipal officers review, verify, or correct AI model classifications. Verified labels are securely stored in the
          `validated_feedback` collection for scheduled retraining, versioning, and deployment.
        </p>
      </div>

      {successMsg && (
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
          <CheckCircle2 size={18} /> {successMsg}
        </div>
      )}

      {/* Validation Modal / Active Card */}
      {validatingComplaint && (
        <div className="glass-panel" style={{ padding: '24px', marginBottom: '28px', borderColor: 'rgba(99, 102, 241, 0.4)' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '14px' }}>
            Verify / Correct Model Prediction: {validatingComplaint.complaint_id}
          </h3>

          <form onSubmit={handleValidateSubmit}>
            <div style={{ background: 'var(--panel-bg)', padding: '16px', borderRadius: '10px', marginBottom: '16px' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Complaint Narrative</span>
              <p style={{ fontSize: '1rem', color: 'var(--text-main)', marginTop: '4px' }}>
                "{validatingComplaint.original_text}"
              </p>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '8px' }}>
                Current Prediction: <strong style={{ color: 'var(--primary-light)' }}>{validatingComplaint.predicted_category}</strong> ({(validatingComplaint.confidence * 100).toFixed(1)}% certainty)
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '6px' }}>
                  Validated / Correct Category *
                </label>
                <select
                  value={correctCategory}
                  onChange={(e) => setCorrectCategory(e.target.value)}
                  className="select-field"
                >
                  {CIVIC_CATEGORIES.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '6px' }}>
                  Officer Verification Notes
                </label>
                <input
                  type="text"
                  value={validationNotes}
                  onChange={(e) => setValidationNotes(e.target.value)}
                  placeholder="e.g. Verified road pothole; dispatched crew"
                  className="input-field"
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="submit"
                disabled={submitting}
                className="btn btn-primary"
              >
                <CheckSquare size={16} /> {submitting ? 'Recording...' : 'Confirm & Save Training Candidate'}
              </button>
              <button
                type="button"
                onClick={() => setValidatingComplaint(null)}
                className="btn btn-secondary"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Two Tabs: Complaints to Validate vs Validated Feedback History */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '14px' }}>
          Complaints Pending Review & Validation ({complaints.length})
        </h3>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>Loading records...</div>
        ) : complaints.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-dim)' }}>No complaints available.</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="civic-table">
              <thead>
                <tr>
                  <th>Complaint ID</th>
                  <th>Predicted Category</th>
                  <th>Confidence</th>
                  <th>Description</th>
                  <th>Location</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {complaints.slice(0, 20).map(c => (
                  <tr key={c.complaint_id}>
                    <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--primary-light)' }}>{c.complaint_id}</td>
                    <td><span className="badge badge-purple">{c.predicted_category}</span></td>
                    <td style={{ color: 'var(--accent-green)', fontWeight: 700 }}>{(c.confidence * 100).toFixed(1)}%</td>
                    <td style={{ maxWidth: '300px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {c.original_text}
                    </td>
                    <td style={{ color: 'var(--text-muted)' }}>{c.location}</td>
                    <td><span className="badge badge-blue">{c.status}</span></td>
                    <td>
                      <button
                        onClick={() => handleOpenValidate(c)}
                        className="btn btn-secondary"
                        style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                      >
                        <CheckSquare size={12} /> Validate
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

