import React, { useState } from 'react';
import { 
  Send, Sparkles, MapPin, AlertCircle, CheckCircle2, 
  HelpCircle, Layers, Search, ArrowRight 
} from 'lucide-react';
import { api } from '../services/api';

const SAMPLES = [
  {
    text: "The streetlight near the bus stand has not worked for four days.",
    loc: "City Central Bus Stand",
    cat: "Streetlights"
  },
  {
    text: "There is a huge pothole near Anna Nagar junction causing vehicle damage for past 2 weeks.",
    loc: "Anna Nagar Junction",
    cat: "Roads"
  },
  {
    text: "Open sewer manhole overflowing with black wastewater onto pedestrian road since yesterday.",
    loc: "7th Avenue and 34th Street",
    cat: "Drainage"
  },
  {
    text: "The garbage waste has not been collected from our street bin for five days and smells foul.",
    loc: "Gandhi Road Block B",
    cat: "Waste Management"
  },
  {
    text: "Drinking water supply pipeline broken with high pressure leak flooding the road.",
    loc: "Rajaji Salai Ward 4",
    cat: "Water Supply"
  },
  {
    text: "Bus stand pakkathula streetlight 4 days ah work aagala, full dark ah irukku.",
    loc: "Koyambedu Bus Terminal",
    cat: "Streetlights (Tanglish)"
  }
];

export default function TextSubmissionScreen({ onNavigate, onComplaintCreated }) {
  const [complaintText, setComplaintText] = useState('');
  const [location, setLocation] = useState('');
  const [previewData, setPreviewData] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submittedResult, setSubmittedResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  const handlePredictPreview = async () => {
    if (!complaintText.trim() || complaintText.trim().length < 5) {
      setErrorMsg('Please enter at least 5 characters to analyze.');
      return;
    }
    setPreviewLoading(true);
    setErrorMsg('');
    try {
      const res = await api.predict(complaintText, location);
      setPreviewData(res);
    } catch (err) {
      setErrorMsg(err.message || 'AI prediction failed.');
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!complaintText.trim() || complaintText.trim().length < 5) {
      setErrorMsg('Complaint description must contain at least 5 characters.');
      return;
    }
    setSubmitting(true);
    setErrorMsg('');
    try {
      const res = await api.submitComplaint(complaintText, location);
      setSubmittedResult(res);
      if (onComplaintCreated) onComplaintCreated(res);
    } catch (err) {
      setErrorMsg(err.message || 'Submission failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const applySample = (sample) => {
    setComplaintText(sample.text);
    setLocation(sample.loc);
    setPreviewData(null);
    setSubmittedResult(null);
    setErrorMsg('');
  };

  return (
    <div style={{ padding: '28px', maxWidth: '1200px', margin: '0 auto' }}>
      
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#fff', marginBottom: '6px' }}>
          Submit New Civic Complaint
        </h1>
        <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>
          Describe the physical municipal problem. The CivicSense NLP pipeline will classify the issue into 1 of 8 categories,
          extract named entities, check geographic verifiability, and link related cluster timelines.
        </p>
      </div>

      {/* Quick Test Samples */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '10px' }}>
          Quick Academic Test Scenarios (1-Click Fill)
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {SAMPLES.map((s, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => applySample(s)}
              className="btn btn-secondary"
              style={{ fontSize: '0.78rem', padding: '6px 12px', borderRadius: '8px' }}
            >
              <Sparkles size={12} color="#60a5fa" /> {s.cat}
            </button>
          ))}
        </div>
      </div>

      {submittedResult ? (
        /* Submission Success Card */
        <div className="glass-panel" style={{ padding: '32px', textAlign: 'center', borderColor: 'rgba(16, 185, 129, 0.4)' }}>
          <div style={{
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            background: 'rgba(16, 185, 129, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 18px auto'
          }}>
            <CheckCircle2 size={32} color="#34d399" />
          </div>

          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#fff', marginBottom: '8px' }}>
            Complaint Successfully Registered!
          </h2>

          <div style={{
            display: 'inline-block',
            padding: '6px 16px',
            borderRadius: '9999px',
            background: 'rgba(37, 99, 235, 0.2)',
            border: '1px solid rgba(96, 165, 250, 0.4)',
            fontFamily: 'var(--font-mono)',
            fontSize: '1rem',
            fontWeight: 800,
            color: '#60a5fa',
            marginBottom: '18px'
          }}>
            {submittedResult.complaint_id}
          </div>

          <div style={{
            maxWidth: '600px',
            margin: '0 auto 24px auto',
            background: 'rgba(15, 23, 42, 0.6)',
            padding: '16px 20px',
            borderRadius: '12px',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            textAlign: 'left'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ color: '#94a3b8', fontSize: '0.82rem' }}>Category:</span>
              <span style={{ fontWeight: 700, color: '#fff' }}>{submittedResult.predicted_category}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ color: '#94a3b8', fontSize: '0.82rem' }}>AI Confidence:</span>
              <span style={{ fontWeight: 700, color: '#34d399' }}>{(submittedResult.confidence * 100).toFixed(1)}%</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ color: '#94a3b8', fontSize: '0.82rem' }}>Location:</span>
              <span style={{ fontWeight: 600, color: '#cbd5e1' }}>{submittedResult.location}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#94a3b8', fontSize: '0.82rem' }}>Status:</span>
              <span className="badge badge-amber">{submittedResult.status}</span>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
            <button
              onClick={() => onNavigate('issue-timeline')}
              className="btn btn-primary"
            >
              View Issue Evolution Timeline <ArrowRight size={15} />
            </button>
            <button
              onClick={() => onNavigate('image-upload')}
              className="btn btn-secondary"
            >
              Attach Media Evidence
            </button>
            <button
              onClick={() => {
                setSubmittedResult(null);
                setComplaintText('');
                setLocation('');
                setPreviewData(null);
              }}
              className="btn btn-outline"
            >
              Submit Another
            </button>
          </div>
        </div>
      ) : (
        /* Form Layout with Side-by-Side Real-Time NLP Preview */
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '24px' }}>
          
          {/* Left: Input Form */}
          <div className="glass-panel" style={{ padding: '24px' }}>
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '18px' }}>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#cbd5e1', marginBottom: '8px' }}>
                  Problem Description *
                </label>
                <textarea
                  rows={5}
                  required
                  value={complaintText}
                  onChange={(e) => setComplaintText(e.target.value)}
                  placeholder="e.g., The streetlight near the bus stand has not worked for four days..."
                  className="textarea-field"
                  style={{ resize: 'vertical' }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px', fontSize: '0.75rem', color: '#64748b' }}>
                  <span>Supports English, Tamil & Tanglish</span>
                  <span>{complaintText.length} characters</span>
                </div>
              </div>

              <div style={{ marginBottom: '22px' }}>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#cbd5e1', marginBottom: '8px' }}>
                  Location / Nearby Landmark (Optional)
                </label>
                <div style={{ position: 'relative' }}>
                  <MapPin size={16} color="#94a3b8" style={{ position: 'absolute', left: '14px', top: '14px' }} />
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g., Near Bus Stand, Anna Nagar Main Road"
                    className="input-field"
                    style={{ paddingLeft: '40px' }}
                  />
                </div>
                <span style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '4px', display: 'block' }}>
                  If left empty, CivicSense NER will automatically attempt to extract the landmark from your text.
                </span>
              </div>

              {errorMsg && (
                <div style={{
                  background: 'rgba(239, 68, 68, 0.15)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  borderRadius: '8px',
                  padding: '10px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  color: '#f87171',
                  fontSize: '0.82rem',
                  marginBottom: '18px'
                }}>
                  <AlertCircle size={16} />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn btn-primary"
                  style={{ flex: 1 }}
                >
                  <Send size={15} /> {submitting ? 'Submitting...' : 'Register Complaint'}
                </button>
                <button
                  type="button"
                  onClick={handlePredictPreview}
                  disabled={previewLoading}
                  className="btn btn-secondary"
                  style={{ padding: '10px 16px' }}
                >
                  <Sparkles size={15} color="#60a5fa" /> {previewLoading ? 'Analyzing...' : 'Test AI Preview'}
                </button>
              </div>
            </form>
          </div>

          {/* Right: Live NLP Preview */}
          <div className="glass-panel" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#fff', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sparkles size={18} color="#60a5fa" /> Real-Time NLP Intelligence Preview
            </h3>

            {previewLoading ? (
              <div style={{ textAlign: 'center', padding: '40px 0', color: '#94a3b8' }}>
                <div style={{ marginBottom: '8px' }}>Running TF-IDF + NER Models...</div>
              </div>
            ) : previewData ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '14px', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                  <span style={{ fontSize: '0.72rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700 }}>Predicted Category</span>
                  <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#60a5fa', marginTop: '2px' }}>
                    {previewData.predicted_category}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#34d399', fontWeight: 600 }}>
                    Confidence Score: {(previewData.confidence * 100).toFixed(1)}%
                  </div>
                </div>

                <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '14px', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                  <span style={{ fontSize: '0.72rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700 }}>Extracted Civic Entities</span>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '8px' }}>
                    {previewData.entities?.length > 0 ? (
                      previewData.entities.map((e, idx) => (
                        <span key={idx} className="badge badge-purple" style={{ fontSize: '0.72rem' }}>
                          <strong>{e.entity_type}:</strong> {e.entity_text}
                        </span>
                      ))
                    ) : (
                      <span style={{ fontSize: '0.78rem', color: '#64748b' }}>No explicit entities isolated</span>
                    )}
                  </div>
                </div>

                <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '14px', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                  <span style={{ fontSize: '0.72rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700 }}>Detected Language</span>
                  <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#f1f5f9', marginTop: '2px' }}>
                    {previewData.language || 'English'}
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ padding: '30px 10px', textAlign: 'center', color: '#64748b', fontSize: '0.85rem' }}>
                <Layers size={32} color="#475569" style={{ margin: '0 auto 10px auto' }} />
                Click "Test AI Preview" or type a description above to see instant classification and entity extraction.
              </div>
            )}
          </div>

        </div>
      )}

    </div>
  );
}
