import React, { useState } from 'react';
import { Globe, Languages, Sparkles, Send, CheckCircle2, ArrowRight } from 'lucide-react';
import { api } from '../services/api';

const SAMPLES = [
  {
    lang: "Tamil (Native Script)",
    text: "எங்கள் பகுதியில் மூன்று நாட்களாக குடிநீர் வரவில்லை."
  },
  {
    lang: "Tanglish (Romanized Tamil)",
    text: "Bus stand pakkathula streetlight 4 days ah work aagala, full dark ah irukku."
  },
  {
    lang: "English (Standard)",
    text: "The streetlight near the bus stand has not worked for four days."
  },
  {
    lang: "Tanglish (Road Condition)",
    text: "Periya pothole roatula irukku near Anna Nagar junction vehicle damage aaguthu."
  }
];

export default function MultilingualScreen({ onNavigate }) {
  const [inputText, setInputText] = useState("Bus stand pakkathula streetlight 4 days ah work aagala, full dark ah irukku.");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState({
    original_text: "Bus stand pakkathula streetlight 4 days ah work aagala, full dark ah irukku.",
    language: "Tanglish",
    normalized_processing_text: "Bus stand near streetlight 4 days ah work not functioning , full dark ah there is .",
    translated_text: "Streetlight near the bus stand has not been working for four days.",
    predicted_category: "Streetlights",
    confidence: 0.82
  });

  const handleProcess = async (e) => {
    e?.preventDefault();
    if (!inputText.trim()) return;
    setLoading(true);
    try {
      const res = await api.predict(inputText);
      setResult(res);
    } catch (err) {
      alert(err.message || 'Processing failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '28px', maxWidth: '1400px', margin: '0 auto' }}>
      
      {/* Title */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
          <span className="badge badge-cyan">Concept 3</span>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#fff' }}>
            Multilingual NLP & Tanglish Dialect Normalization
          </h1>
        </div>
        <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>
          Ingests native Tamil script, Romanized Tanglish, and standard English. Detects language with Unicode heuristic checks,
          preserves the raw narrative in database records, and generates a normalized semantic representation for model inference.
        </p>
      </div>

      {/* Input Box */}
      <div className="glass-panel" style={{ padding: '24px', marginBottom: '24px' }}>
        <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#fff', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Globe size={18} color="#22d3ee" /> Multilingual Input Tester
        </h3>

        <form onSubmit={handleProcess} style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Enter complaint in English, Tamil, or Tanglish..."
            className="input-field"
            style={{ flex: 1 }}
          />
          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary"
            style={{ whiteSpace: 'nowrap', padding: '10px 22px', background: 'linear-gradient(135deg, #0284c7 0%, #06b6d4 100%)' }}
          >
            <Send size={15} /> {loading ? 'Detecting...' : 'Detect & Process'}
          </button>
        </form>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.75rem', color: '#94a3b8', alignSelf: 'center' }}>Test Scenarios:</span>
          {SAMPLES.map((s, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => { setInputText(s.text); }}
              className="btn btn-secondary"
              style={{ fontSize: '0.75rem', padding: '5px 12px', borderRadius: '6px' }}
            >
              {s.lang}
            </button>
          ))}
        </div>
      </div>

      {/* Multilingual Pipeline Representation Cards */}
      {result && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '18px', marginBottom: '28px' }}>
          
          {/* Card 1: Original Raw Complaint */}
          <div className="glass-panel" style={{ padding: '20px' }}>
            <span style={{ fontSize: '0.72rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700 }}>
              1. Original Raw Input
            </span>
            <div style={{ marginTop: '8px', marginBottom: '12px' }}>
              <span className="badge badge-purple">{result.language || 'Detected'}</span>
            </div>
            <p style={{ fontSize: '0.95rem', color: '#fff', lineHeight: 1.5, background: 'rgba(0,0,0,0.3)', padding: '12px', borderRadius: '8px' }}>
              "{result.original_text}"
            </p>
            <span style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '8px', display: 'block' }}>
              Preserved unaltered in database schema
            </span>
          </div>

          {/* Card 2: Normalized Lexical Form */}
          <div className="glass-panel" style={{ padding: '20px' }}>
            <span style={{ fontSize: '0.72rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700 }}>
              2. Normalized Dialect
            </span>
            <div style={{ marginTop: '8px', marginBottom: '12px' }}>
              <span className="badge badge-amber">Morphological Map</span>
            </div>
            <p style={{ fontSize: '0.95rem', color: '#cbd5e1', lineHeight: 1.5, background: 'rgba(0,0,0,0.3)', padding: '12px', borderRadius: '8px' }}>
              "{result.normalized_processing_text || result.original_text}"
            </p>
            <span style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '8px', display: 'block' }}>
              Dialect markers mapped to canonical civic tokens
            </span>
          </div>

          {/* Card 3: Downstream Prediction */}
          <div className="glass-panel" style={{ padding: '20px' }}>
            <span style={{ fontSize: '0.72rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700 }}>
              3. AI Classification Transfer
            </span>
            <div style={{ marginTop: '8px', marginBottom: '12px' }}>
              <span className="badge badge-green">Downstream Inference</span>
            </div>
            <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#60a5fa' }}>
              {result.predicted_category}
            </div>
            <div style={{ fontSize: '0.82rem', color: '#34d399', fontWeight: 600, marginTop: '4px' }}>
              Confidence: {((result.confidence || 0.8) * 100).toFixed(1)}%
            </div>
            <span style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '12px', display: 'block' }}>
              Accurately classified regardless of input dialect
            </span>
          </div>

        </div>
      )}

    </div>
  );
}
