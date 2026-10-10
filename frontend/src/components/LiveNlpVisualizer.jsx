import React from 'react';
import { Cpu, Globe, Tag, MapPin, Wrench, Clock, Building2, CheckCircle2 } from 'lucide-react';

export default function LiveNlpVisualizer({ nlpData, title = "Integrated AI Intelligence Breakdown" }) {
  if (!nlpData) return null;

  const getEntityIcon = (type) => {
    switch (type) {
      case 'LOCATION': return <MapPin size={14} color="#60a5fa" />;
      case 'INFRASTRUCTURE': return <Wrench size={14} color="#f59e0b" />;
      case 'DURATION': return <Clock size={14} color="#a855f7" />;
      case 'DEPARTMENT': return <Building2 size={14} color="#10b981" />;
      default: return <Tag size={14} color="#94a3b8" />;
    }
  };

  const getEntityBadgeClass = (type) => {
    switch (type) {
      case 'LOCATION': return 'badge-blue';
      case 'INFRASTRUCTURE': return 'badge-amber';
      case 'DURATION': return 'badge-purple';
      case 'DEPARTMENT': return 'badge-green';
      default: return 'badge-cyan';
    }
  };

  const confidencePct = Math.round((nlpData.confidence || 0) * 100);

  return (
    <div className="glass-panel" style={{ padding: '20px', border: '1px solid rgba(99, 102, 241, 0.25)', background: 'rgba(15, 23, 42, 0.75)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Cpu size={18} color="var(--primary-light)" />
          <h3 style={{ fontSize: '1rem', color: '#fff' }}>{title}</h3>
        </div>
        <span className="badge badge-purple" style={{ fontSize: '0.7rem' }}>
          Pipeline v{nlpData.model_version || '1.0'}
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', marginBottom: '16px' }}>
        {/* Concept 3: Language Detection */}
        <div style={{ background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Globe size={13} /> Detected Language
          </p>
          <span className={`badge ${nlpData.language === 'Tamil' ? 'badge-rose' : nlpData.language === 'Tanglish' ? 'badge-purple' : 'badge-blue'}`}>
            {nlpData.language || 'English'}
          </span>
        </div>

        {/* Concept 1: Predicted Category */}
        <div style={{ background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Tag size={13} /> Predicted Category
          </p>
          <span className="badge badge-green" style={{ fontSize: '0.85rem' }}>
            {nlpData.predicted_category || 'General'}
          </span>
        </div>

        {/* Classifier Confidence */}
        <div style={{ background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Model Confidence</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ flex: 1, height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
              <div style={{ width: `${confidencePct}%`, height: '100%', background: 'linear-gradient(90deg, #6366f1, #10b981)' }} />
            </div>
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#fff' }}>{confidencePct}%</span>
          </div>
        </div>
      </div>

      {/* Concept 2: Named Entity Recognition Breakdown */}
      <div style={{ marginTop: '12px' }}>
        <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '8px', fontWeight: 600 }}>
          Extracted Civic Entities (NER):
        </p>
        
        {nlpData.entities && nlpData.entities.length > 0 ? (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {nlpData.entities.map((ent, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid var(--border-color)',
                  padding: '6px 10px',
                  borderRadius: '8px'
                }}
              >
                {getEntityIcon(ent.entity_type)}
                <span className={`badge ${getEntityBadgeClass(ent.entity_type)}`} style={{ fontSize: '0.65rem' }}>
                  {ent.entity_type}
                </span>
                <span style={{ fontSize: '0.85rem', color: '#fff', fontWeight: 500 }}>
                  {ent.entity_text}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)', fontStyle: 'italic' }}>
            No specific location or duration entity isolated in text.
          </p>
        )}
      </div>

      {/* Machine Translation Section */}
      {nlpData.translated_text && nlpData.translated_text !== nlpData.original_text && (
        <div style={{ marginTop: '14px', padding: '10px 14px', background: 'rgba(59, 130, 246, 0.08)', borderRadius: '8px', border: '1px solid rgba(59, 130, 246, 0.25)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
            <p style={{ fontSize: '0.74rem', color: '#93c5fd', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '5px' }}>
              <Globe size={13} /> Machine Translation (Cross-Lingual to English):
            </p>
            <span className="badge badge-blue" style={{ fontSize: '0.65rem' }}>
              {nlpData.translation_info?.engine || 'Machine Translation'}
            </span>
          </div>
          <p style={{ fontSize: '0.85rem', color: '#e2e8f0', fontWeight: 500, margin: 0 }}>
            "{nlpData.translated_text}"
          </p>
        </div>
      )}

      {/* Multilingual / Preprocessed Representation */}
      {nlpData.normalized_processing_text && nlpData.normalized_processing_text !== nlpData.original_text && (
        <div style={{ marginTop: '14px', paddingTop: '10px', borderTop: '1px dashed var(--border-color)' }}>
          <p style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginBottom: '4px' }}>
            Multilingual Canonical Processing Mapping:
          </p>
          <code style={{ fontSize: '0.78rem', color: '#93c5fd', background: 'rgba(0,0,0,0.3)', padding: '4px 8px', borderRadius: '4px', display: 'block' }}>
            {nlpData.normalized_processing_text}
          </code>
        </div>
      )}
    </div>
  );
}

