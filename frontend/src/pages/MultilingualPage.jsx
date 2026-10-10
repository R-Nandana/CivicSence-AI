import React, { useState } from 'react';
import { Globe, Zap, Languages, ArrowRight, CheckCircle } from 'lucide-react';
import { api } from '../services/api';

const SAMPLE_INPUTS = [
  { lang: 'Tamil (Script)', text: 'எங்கள் பகுதியில் மூன்று நாட்களாக குடிநீர் வரவில்லை.', flag: '🇮🇳' },
  { lang: 'Tanglish', text: 'Bus stand pakkathula streetlight 4 days ah work aagala.', flag: '🇮🇳' },
  { lang: 'Hindi', text: 'हमारे इलाके में 3 दिनों से पानी नहीं आ रहा है।', flag: '🇮🇳' },
  { lang: 'French', text: 'Notre rue est pleine de nids-de-poule depuis une semaine.', flag: '🇫🇷' },
  { lang: 'Spanish', text: 'Hay baches enormes en la calle principal desde hace días.', flag: '🇪🇸' },
  { lang: 'Arabic', text: 'الصرف الصحي يفيض في شارعنا منذ ثلاثة أيام.', flag: '🇸🇦' },
  { lang: 'Bengali', text: 'আমাদের এলাকায় তিন দিন ধরে পানি সরবরাহ নেই।', flag: '🇧🇩' },
  { lang: 'Telugu', text: 'మా వీధిలో మూడు రోజుల నుండి చెత్త సేకరణ లేదు.', flag: '🇮🇳' },
];

const ENGINE_COLORS = {
  'Google Gemini 1.5 Flash (LLM)': '#4f46e5',
  'Google Translate (deep_translator)': '#0ea5e9',
  'Domain Rule-Based MT': '#f59e0b',
  'identity': '#10b981',
};

export default function MultilingualPage() {
  const [inputText, setInputText] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [batchResults, setBatchResults] = useState([]);
  const [batchLoading, setBatchLoading] = useState(false);

  const handleTranslate = async (text = null) => {
    const t = text || inputText;
    if (!t.trim()) return;
    setLoading(true);
    setError('');
    setResult(null);
    if (text) setInputText(text);
    try {
      const res = await api.translateLLM(t);
      setResult(res);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const runBatchDemo = async () => {
    setBatchLoading(true);
    setBatchResults([]);
    for (const sample of SAMPLE_INPUTS) {
      try {
        const res = await api.translateLLM(sample.text);
        setBatchResults(prev => [...prev, { ...sample, result: res }]);
      } catch (e) {
        setBatchResults(prev => [...prev, { ...sample, error: e.message }]);
      }
    }
    setBatchLoading(false);
  };

  const engineColor = (engine) => ENGINE_COLORS[engine] || '#6b7280';

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '28px 20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 28 }}>
        <div style={{
          width: 50, height: 50, borderRadius: 14,
          background: 'linear-gradient(135deg, #0ea5e9, #4f46e5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 8px 24px rgba(14,165,233,0.35)'
        }}>
          <Globe size={26} color="#fff" />
        </div>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.65rem', fontWeight: 800, color: '#fff' }}>
            Universal Multilingual NLP
          </h1>
          <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            Concept 2 (Enhanced) — 100+ Language Detection & Translation via Google Gemini 1.5 Flash
          </p>
        </div>
      </div>

      {/* Feature Pills */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 24 }}>
        {[
          { text: '100+ Languages', color: '#4f46e5' },
          { text: 'Gemini LLM Primary', color: '#8b5cf6' },
          { text: 'Tamil / Tanglish Support', color: '#f59e0b' },
          { text: 'deep_translator Fallback', color: '#0ea5e9' },
          { text: 'Auto Language Detection', color: '#10b981' },
        ].map(({ text, color }) => (
          <span key={text} style={{
            background: `${color}18`, border: `1px solid ${color}44`,
            color, borderRadius: 20, padding: '5px 14px', fontSize: '0.78rem', fontWeight: 600
          }}>
            {text}
          </span>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* Input Panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="card" style={{ padding: 24 }}>
            <h2 style={{ margin: '0 0 16px', fontSize: '1rem', fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Languages size={17} color="#0ea5e9" /> Enter Complaint in Any Language
            </h2>
            <textarea
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              placeholder="Type in any language — Tamil, Hindi, French, Arabic, Bengali, Tanglish, or any other..."
              rows={5}
              style={{
                width: '100%', background: 'rgba(255,255,255,0.05)',
                border: '1px solid var(--border-color)', borderRadius: 10,
                padding: '12px 14px', color: '#fff', fontSize: '0.9rem',
                outline: 'none', resize: 'vertical', lineHeight: 1.6, boxSizing: 'border-box'
              }}
            />
            <button
              onClick={() => handleTranslate()}
              disabled={loading || !inputText.trim()}
              className="btn btn-primary"
              style={{ width: '100%', marginTop: 12, padding: '11px', opacity: loading ? 0.7 : 1 }}
            >
              {loading ? '🔄 Detecting & Translating...' : '🌐 Detect Language & Translate'}
            </button>
          </div>

          {/* Quick Sample Buttons */}
          <div className="card" style={{ padding: 20 }}>
            <p style={{ margin: '0 0 12px', fontWeight: 700, color: '#fff', fontSize: '0.88rem' }}>
              🧪 Try Sample Complaints
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              {SAMPLE_INPUTS.map((s, i) => (
                <button key={i} onClick={() => handleTranslate(s.text)} style={{
                  background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border-color)',
                  borderRadius: 9, padding: '9px 12px', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 10, textAlign: 'left'
                }}>
                  <span style={{ fontSize: '1.1rem' }}>{s.flag}</span>
                  <div>
                    <p style={{ margin: 0, fontSize: '0.72rem', color: '#0ea5e9', fontWeight: 700 }}>{s.lang}</p>
                    <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>{s.text.substring(0, 55)}...</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Result Panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Translation Result */}
          {error && (
            <div className="card" style={{ padding: 20, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)' }}>
              <p style={{ margin: 0, color: '#f87171', fontSize: '0.85rem' }}>Error: {error}</p>
            </div>
          )}

          {loading && (
            <div className="card" style={{ padding: 32, textAlign: 'center' }}>
              <Globe size={32} color="#4f46e5" style={{ marginBottom: 12, animation: 'spin 2s linear infinite' }} />
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: 0 }}>
                Querying Gemini for language detection & translation...
              </p>
            </div>
          )}

          {result && !loading && (
            <>
              {/* Detected Language */}
              <div className="card" style={{ padding: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                  <h3 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 700, color: '#fff' }}>Detection Result</h3>
                  <span style={{
                    background: `${engineColor(result.engine)}18`,
                    border: `1px solid ${engineColor(result.engine)}44`,
                    color: engineColor(result.engine),
                    borderRadius: 20, padding: '3px 10px', fontSize: '0.72rem', fontWeight: 600
                  }}>
                    {result.engine}
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                  <div style={{ padding: 14, background: 'rgba(255,255,255,0.04)', borderRadius: 10, border: '1px solid var(--border-color)' }}>
                    <p style={{ margin: '0 0 4px', fontSize: '0.7rem', color: 'var(--text-dim)' }}>Detected Language</p>
                    <p style={{ margin: 0, fontWeight: 800, fontSize: '1.1rem', color: '#0ea5e9' }}>
                      {result.detected_language}
                    </p>
                  </div>
                  <div style={{ padding: 14, background: 'rgba(255,255,255,0.04)', borderRadius: 10, border: '1px solid var(--border-color)' }}>
                    <p style={{ margin: '0 0 4px', fontSize: '0.7rem', color: 'var(--text-dim)' }}>Confidence</p>
                    <p style={{ margin: 0, fontWeight: 800, fontSize: '1.1rem', color: '#10b981' }}>
                      {((result.confidence || 0) * 100).toFixed(0)}%
                    </p>
                  </div>
                </div>

                {/* Original → Translated */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div style={{ padding: 14, background: 'rgba(255,255,255,0.03)', borderRadius: 10, border: '1px solid var(--border-color)' }}>
                    <p style={{ margin: '0 0 6px', fontSize: '0.7rem', color: 'var(--text-dim)', fontWeight: 600 }}>
                      ORIGINAL ({result.detected_language})
                    </p>
                    <p style={{ margin: 0, fontSize: '0.88rem', color: '#e2e8f0', lineHeight: 1.6 }}>
                      {result.original_text}
                    </p>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'center' }}>
                    <ArrowRight size={20} color="#4f46e5" />
                  </div>

                  <div style={{ padding: 14, background: 'rgba(79,70,229,0.1)', borderRadius: 10, border: '1px solid rgba(79,70,229,0.25)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                      <CheckCircle size={13} color="#10b981" />
                      <p style={{ margin: 0, fontSize: '0.7rem', color: '#10b981', fontWeight: 600 }}>ENGLISH TRANSLATION</p>
                    </div>
                    <p style={{ margin: 0, fontSize: '0.92rem', color: '#fff', lineHeight: 1.6, fontWeight: 500 }}>
                      {result.translated_text}
                    </p>
                  </div>
                </div>

                {result.is_translated && (
                  <p style={{ margin: '10px 0 0', fontSize: '0.72rem', color: 'var(--text-dim)' }}>
                    ✅ Translated successfully · {result.supported_languages}
                  </p>
                )}
              </div>
            </>
          )}

          {!result && !loading && !error && (
            <div className="card" style={{ padding: 40, textAlign: 'center', border: '2px dashed var(--border-color)' }}>
              <Globe size={40} color="var(--text-dim)" style={{ marginBottom: 12 }} />
              <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.9rem' }}>
                Enter text above or click a sample to see universal language detection & translation
              </p>
            </div>
          )}

          {/* How It Works */}
          <div className="card" style={{ padding: 18 }}>
            <p style={{ margin: '0 0 12px', fontWeight: 700, color: '#fff', fontSize: '0.88rem' }}>
              ⚙️ Translation Pipeline
            </p>
            {[
              { step: '1', label: 'Gemini LLM', desc: 'Primary — detects language & translates', color: '#4f46e5' },
              { step: '2', label: 'deep_translator', desc: 'Fallback — Google Translate API', color: '#0ea5e9' },
              { step: '3', label: 'Rule-Based MT', desc: 'Tanglish domain dictionary', color: '#f59e0b' },
              { step: '4', label: 'Identity', desc: 'English text passed through unchanged', color: '#10b981' },
            ].map(({ step, label, desc, color }) => (
              <div key={step} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 10 }}>
                <div style={{
                  width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                  background: `${color}22`, border: `1px solid ${color}66`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.65rem', fontWeight: 700, color
                }}>{step}</div>
                <div>
                  <span style={{ fontSize: '0.78rem', fontWeight: 700, color }}>{label}</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginLeft: 6 }}>{desc}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Batch Demo */}
      <div className="card" style={{ padding: 24, marginTop: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: '#fff' }}>
            🌍 Batch Multilingual Demo — All Sample Languages
          </h3>
          <button onClick={runBatchDemo} disabled={batchLoading} style={{
            background: 'rgba(14,165,233,0.15)', border: '1px solid rgba(14,165,233,0.35)',
            color: '#38bdf8', borderRadius: 9, padding: '8px 18px', cursor: 'pointer',
            fontSize: '0.82rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 7
          }}>
            <Zap size={14} /> {batchLoading ? 'Running...' : 'Run All'}
          </button>
        </div>

        {batchResults.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {batchResults.map((item, i) => (
              <div key={i} style={{
                padding: 14, background: 'rgba(255,255,255,0.03)',
                borderRadius: 10, border: '1px solid var(--border-color)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <span style={{ fontSize: '1rem' }}>{item.flag}</span>
                  <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#0ea5e9' }}>{item.lang}</span>
                  {item.result && (
                    <>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>→</span>
                      <span style={{
                        background: `${engineColor(item.result.engine)}18`,
                        border: `1px solid ${engineColor(item.result.engine)}44`,
                        color: engineColor(item.result.engine),
                        borderRadius: 12, padding: '2px 8px', fontSize: '0.68rem', fontWeight: 600
                      }}>
                        {item.result.engine}
                      </span>
                    </>
                  )}
                </div>
                {item.result && (
                  <p style={{ margin: 0, fontSize: '0.82rem', color: '#e2e8f0', lineHeight: 1.55 }}>
                    <span style={{ color: 'var(--text-dim)' }}>EN: </span>{item.result.translated_text}
                  </p>
                )}
                {item.error && (
                  <p style={{ margin: 0, fontSize: '0.78rem', color: '#f87171' }}>{item.error}</p>
                )}
              </div>
            ))}
          </div>
        )}
        {batchLoading && batchResults.length === 0 && (
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', fontSize: '0.85rem' }}>
            Processing all languages...
          </p>
        )}
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
