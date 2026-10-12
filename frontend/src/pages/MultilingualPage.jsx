import React, { useState } from 'react';
import { Globe, Zap, Languages, ArrowRight, CheckCircle, Volume2, Copy, Check, Sparkles, RefreshCw } from 'lucide-react';
import { api } from '../services/api';

const SUPPORTED_LANGUAGES = [
  { group: 'Auto', items: [{ code: 'auto', label: '✨ Auto-Detect (100+ Languages)' }] },
  { 
    group: '🇮🇳 Indian Regional Languages', 
    items: [
      { code: 'Tamil', label: 'தமிழ் (Tamil)', flag: '🇮🇳', sample: 'எங்கள் பகுதியில் மூன்று நாட்களாக குடிநீர் வரவில்லை.' },
      { code: 'Tanglish', label: 'Tanglish (Romanized Tamil)', flag: '🇮🇳', sample: 'Bus stand pakkathula streetlight 4 days ah work aagala.' },
      { code: 'Hindi', label: 'हिन्दी (Hindi)', flag: '🇮🇳', sample: 'हमारे इलाके में 3 दिनों से पानी की आपूर्ति नहीं आ रही है।' },
      { code: 'Telugu', label: 'తెలుగు (Telugu)', flag: '🇮🇳', sample: 'మా వీధిలో మూడు రోజుల నుండి చెత్త సేకరణ జరగలేదు.' },
      { code: 'Kannada', label: 'ಕನ್ನಡ (Kannada)', flag: '🇮🇳', sample: 'ನಮ್ಮ ಪ್ರದೇಶದಲ್ಲಿ ನಾಲ್ಕು ದಿನಗಳಿಂದ ಬೀದಿ ದೀಪ ಕೆಲಸ ಮಾಡುತ್ತಿಲ್ಲ.' },
      { code: 'Malayalam', label: 'മലയാളം (Malayalam)', flag: '🇮🇳', sample: 'ഞങ്ങളുടെ പ്രദേശത്ത് ശുദ്ധജല വിതരണം മുടങ്ങിയിട്ട് മൂന്ന് ദിവസമായി.' },
      { code: 'Bengali', label: 'বাংলা (Bengali)', flag: '🇮🇳', sample: 'আমাদের এলাকায় ড্রেনের নোংরা জল রাস্তায় উপচে পড়ছে।' },
      { code: 'Marathi', label: 'मराठी (Marathi)', flag: '🇮🇳', sample: 'आमच्या भागात गेल्या चार दिवसांपासून पथदिवा बंद आहे.' },
      { code: 'Gujarati', label: 'ગુજરાતી (Gujarati)', flag: '🇮🇳', sample: 'અમારા મુખ્ય રસ્તા પર મોટો ખાડો પડી ગયો છે.' },
      { code: 'Punjabi', label: 'ਪੰਜਾਬੀ (Punjabi)', flag: '🇮🇳', sample: 'ਸਾਡੇ ਇਲਾਕੇ ਵਿੱਚ ਤਿੰਨ ਦਿਨਾਂ ਤੋਂ ਕੂੜਾ ਨਹੀਂ ਚੁੱਕਿਆ ਗਿਆ।' },
      { code: 'Urdu', label: 'اردو (Urdu)', flag: '🇮🇳', sample: 'ہمارے علاقے میں چار دنوں سے اسٹریٹ لائٹ بند پڑی ہے۔' }
    ]
  },
  {
    group: '🌍 Global International Languages',
    items: [
      { code: 'Spanish', label: 'Español (Spanish)', flag: '🇪🇸', sample: 'Hay baches enormes en la calle principal desde hace días.' },
      { code: 'French', label: 'Français (French)', flag: '🇫🇷', sample: 'Notre rue est pleine de nids-de-poule depuis une semaine.' },
      { code: 'German', label: 'Deutsch (German)', flag: '🇩🇪', sample: 'Die Straßenlaterne in der Nähe der Haltestelle ist seit Tagen defekt.' },
      { code: 'Arabic', label: 'العربية (Arabic)', flag: '🇸🇦', sample: 'الصرف الصحي يفيض في شارعنا منذ ثلاثة أيام.' },
      { code: 'Chinese', label: '中文 (Mandarin)', flag: '🇨🇳', sample: '公交车站附近的街灯已经有四天不亮了。' },
      { code: 'Japanese', label: '日本語 (Japanese)', flag: '🇯🇵', sample: 'バス停近くの街灯が4日間点灯していません。' },
      { code: 'Russian', label: 'Русский (Russian)', flag: '🇷🇺', sample: 'На главной улице уже неделю не убирают мусор.' },
      { code: 'English', label: 'English (Standard)', flag: '🇬🇧', sample: 'The streetlight near the central bus terminal has been damaged.' }
    ]
  }
];

const TARGET_LANGUAGES = [
  { code: 'English', label: 'English (Official Municipal Standard)' },
  { code: 'Tamil', label: 'தமிழ் (Tamil)' },
  { code: 'Hindi', label: 'हिन्दी (Hindi)' },
  { code: 'Telugu', label: 'తెలుగు (Telugu)' },
  { code: 'Spanish', label: 'Español (Spanish)' },
  { code: 'French', label: 'Français (French)' }
];

const ENGINE_COLORS = {
  'Google Gemini 1.5 Flash (LLM)': '#6366f1',
  'Google Translate (deep_translator)': '#0ea5e9',
  'Domain Rule-Based MT': '#f59e0b',
  'identity': '#10b981',
};

export default function MultilingualPage() {
  const [inputText, setInputText] = useState('Bus stand pakkathula streetlight 4 days ah work aagala.');
  const [sourceLang, setSourceLang] = useState('Tanglish');
  const [targetLang, setTargetLang] = useState('English');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [batchResults, setBatchResults] = useState([]);
  const [batchLoading, setBatchLoading] = useState(false);

  const handleTranslate = async (textToTranslate = null, src = null, tgt = null) => {
    const text = textToTranslate !== null ? textToTranslate : inputText;
    const sLang = src !== null ? src : sourceLang;
    const tLang = tgt !== null ? tgt : targetLang;

    if (!text.trim()) return;
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const res = await api.translateLLM(text, sLang === 'auto' ? null : sLang, tLang);
      setResult(res);
    } catch (e) {
      setError(e.message || 'Translation failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectSample = (sample) => {
    setInputText(sample.sample);
    setSourceLang(sample.code);
    handleTranslate(sample.sample, sample.code, targetLang);
  };

  const handleCopy = () => {
    if (result?.translated_text) {
      navigator.clipboard.writeText(result.translated_text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const speakText = (text, langCode = 'en-US') => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.95;
      window.speechSynthesis.speak(utterance);
    }
  };

  const runBatchDemo = async () => {
    setBatchLoading(true);
    setBatchResults([]);
    const allSamples = SUPPORTED_LANGUAGES.flatMap(g => g.items).filter(i => i.sample);
    for (const s of allSamples) {
      try {
        const res = await api.translateLLM(s.sample, s.code, 'English');
        setBatchResults(prev => [...prev, { ...s, result: res }]);
      } catch (e) {
        setBatchResults(prev => [...prev, { ...s, error: e.message }]);
      }
    }
    setBatchLoading(false);
  };

  const engineColor = (engine) => ENGINE_COLORS[engine] || '#6b7280';

  return (
    <div style={{ maxWidth: 1150, margin: '0 auto', padding: '28px 20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            width: 52, height: 52, borderRadius: 16,
            background: 'linear-gradient(135deg, #0ea5e9, #6366f1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 8px 24px rgba(14,165,233,0.35)'
          }}>
            <Globe size={28} color="#fff" />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-main)' }}>
              Universal Multilingual NLP & Language Selector
            </h1>
            <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.86rem' }}>
              Select any Indian or International language for citizen complaint submission & municipal translation
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span className="badge badge-purple" style={{ padding: '6px 14px', fontSize: '0.78rem' }}>
            <Sparkles size={13} style={{ marginRight: 5 }} /> 100+ Languages Supported
          </span>
        </div>
      </div>

      {/* Quick Language Switcher Pills */}
      <div style={{ marginBottom: 22 }}>
        <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 700, margin: '0 0 10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          ⚡ Quick Select Language & Test Civic Complaint:
        </p>
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 6 }}>
          {SUPPORTED_LANGUAGES.flatMap(g => g.items).filter(i => i.sample).map(item => (
            <button
              key={item.code}
              onClick={() => handleSelectSample(item)}
              style={{
                background: sourceLang === item.code ? 'rgba(14, 165, 233, 0.25)' : 'var(--panel-bg)',
                border: sourceLang === item.code ? '1px solid #38bdf8' : '1px solid var(--border-color)',
                color: sourceLang === item.code ? '#38bdf8' : 'var(--text-main)',
                borderRadius: 20,
                padding: '6px 14px',
                fontSize: '0.78rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                whiteSpace: 'nowrap',
                transition: 'all 0.2s ease'
              }}
            >
              <span>{item.flag}</span>
              <span>{item.code}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main 2-Column Interface */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 22 }}>
        
        {/* Left Column: Input Panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="card" style={{ padding: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Languages size={18} color="#0ea5e9" /> Source Language & Input
              </h2>
            </div>

            {/* Language Dropdown Selectors */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700, marginBottom: 6, textTransform: 'uppercase' }}>
                  Input Language
                </label>
                <select
                  value={sourceLang}
                  onChange={(e) => setSourceLang(e.target.value)}
                  className="select-field"
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: 8,
                    background: 'var(--input-bg)',
                    color: 'var(--secondary)',
                    border: '1px solid var(--border-color)',
                    fontSize: '0.84rem',
                    fontWeight: 600
                  }}
                >
                  {SUPPORTED_LANGUAGES.map((group, idx) => (
                    <optgroup key={idx} label={group.group}>
                      {group.items.map(item => (
                        <option key={item.code} value={item.code}>
                          {item.label}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700, marginBottom: 6, textTransform: 'uppercase' }}>
                  Target Output Language
                </label>
                <select
                  value={targetLang}
                  onChange={(e) => setTargetLang(e.target.value)}
                  className="select-field"
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: 8,
                    background: 'var(--input-bg)',
                    color: 'var(--text-main)',
                    border: '1px solid var(--border-color)',
                    fontSize: '0.84rem',
                    fontWeight: 600
                  }}
                >
                  {TARGET_LANGUAGES.map(tgt => (
                    <option key={tgt.code} value={tgt.code}>
                      {tgt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Textarea */}
            <textarea
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              placeholder="Type or paste complaint in selected language (Tamil, Hindi, Telugu, Tanglish, Spanish, French, etc.)..."
              rows={6}
              style={{
                width: '100%',
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid var(--border-color)',
                borderRadius: 10,
                padding: '14px',
                color: '#fff',
                fontSize: '0.92rem',
                outline: 'none',
                resize: 'vertical',
                lineHeight: 1.6,
                boxSizing: 'border-box'
              }}
            />

            <button
              onClick={() => handleTranslate()}
              disabled={loading || !inputText.trim()}
              className="btn btn-primary"
              style={{
                width: '100%',
                marginTop: 14,
                padding: '12px',
                fontSize: '0.92rem',
                fontWeight: 700,
                background: 'linear-gradient(135deg, #0ea5e9 0%, #6366f1 100%)',
                opacity: loading ? 0.7 : 1
              }}
            >
              {loading ? '🔄 Translating via Civic NLP Engine...' : '🌐 Translate to Selected Language'}
            </button>
          </div>

          {/* Pipeline Details */}
          <div className="card" style={{ padding: 20 }}>
            <p style={{ margin: '0 0 14px', fontWeight: 700, color: '#fff', fontSize: '0.88rem' }}>
              ⚙️ Multilingual Translation Pipeline Architecture
            </p>
            {[
              { step: '1', label: 'User Language Selection / Auto Detection', desc: 'Accepts 100+ native scripts & Romanized code-mixing', color: '#0ea5e9' },
              { step: '2', label: 'Google Gemini 1.5 Flash (LLM)', desc: 'Contextual high-accuracy civic semantic translation', color: '#6366f1' },
              { step: '3', label: 'deep_translator Neural Engine', desc: 'Zero-API-key fallback ensuring 100% online availability', color: '#38bdf8' },
              { step: '4', label: 'Civic Domain Parallel Dictionary', desc: 'Deterministic offline lexicon for municipal civic terms', color: '#f59e0b' },
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
                  <span style={{ fontSize: '0.74rem', color: 'var(--text-dim)', marginLeft: 6 }}>{desc}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Result Panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {error && (
            <div className="card" style={{ padding: 20, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)' }}>
              <p style={{ margin: 0, color: '#f87171', fontSize: '0.85rem' }}>Error: {error}</p>
            </div>
          )}

          {loading && (
            <div className="card" style={{ padding: 48, textAlign: 'center' }}>
              <Globe size={38} color="#0ea5e9" style={{ marginBottom: 14, animation: 'spin 2s linear infinite' }} />
              <p style={{ color: '#e2e8f0', fontSize: '0.95rem', margin: '0 0 6px', fontWeight: 700 }}>
                Processing Multilingual Translation...
              </p>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', margin: 0 }}>
                Executing neural language detection, phonological normalization & cross-lingual mapping
              </p>
            </div>
          )}

          {result && !loading && (
            <div className="card" style={{ padding: 22 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <CheckCircle size={18} color="#10b981" /> Translation Result
                </h3>
                <span style={{
                  background: `${engineColor(result.engine)}18`,
                  border: `1px solid ${engineColor(result.engine)}44`,
                  color: engineColor(result.engine),
                  borderRadius: 20, padding: '4px 12px', fontSize: '0.72rem', fontWeight: 600
                }}>
                  {result.engine}
                </span>
              </div>

              {/* Badges Metrics */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 18 }}>
                <div style={{ padding: 12, background: 'rgba(255,255,255,0.04)', borderRadius: 10, border: '1px solid var(--border-color)' }}>
                  <p style={{ margin: '0 0 4px', fontSize: '0.68rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 700 }}>Source Language</p>
                  <p style={{ margin: 0, fontWeight: 800, fontSize: '1rem', color: '#0ea5e9' }}>
                    {result.detected_language}
                  </p>
                </div>
                <div style={{ padding: 12, background: 'rgba(255,255,255,0.04)', borderRadius: 10, border: '1px solid var(--border-color)' }}>
                  <p style={{ margin: '0 0 4px', fontSize: '0.68rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 700 }}>Target Output</p>
                  <p style={{ margin: 0, fontWeight: 800, fontSize: '1rem', color: '#a5b4fc' }}>
                    {result.target_language || targetLang}
                  </p>
                </div>
                <div style={{ padding: 12, background: 'rgba(255,255,255,0.04)', borderRadius: 10, border: '1px solid var(--border-color)' }}>
                  <p style={{ margin: '0 0 4px', fontSize: '0.68rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 700 }}>Confidence</p>
                  <p style={{ margin: 0, fontWeight: 800, fontSize: '1rem', color: '#10b981' }}>
                    {((result.confidence || 0.95) * 100).toFixed(0)}%
                  </p>
                </div>
              </div>

              {/* Original & Translated Blocks */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ padding: 16, background: 'var(--panel-bg)', borderRadius: 10, border: '1px solid var(--border-color)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', fontWeight: 700, textTransform: 'uppercase' }}>
                      ORIGINAL COMPLAINT ({result.detected_language})
                    </span>
                    <button
                      onClick={() => speakText(result.original_text)}
                      title="Listen to original text"
                      style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 2 }}
                    >
                      <Volume2 size={16} />
                    </button>
                  </div>
                  <p style={{ margin: 0, fontSize: '0.92rem', color: 'var(--text-main)', lineHeight: 1.6 }}>
                    {result.original_text}
                  </p>
                </div>

                <div style={{ display: 'flex', justifyContent: 'center' }}>
                  <ArrowRight size={22} color="#6366f1" />
                </div>

                <div style={{
                  padding: 16,
                  background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.12) 0%, rgba(14, 165, 233, 0.12) 100%)',
                  borderRadius: 10,
                  border: '1px solid rgba(99, 102, 241, 0.35)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{ fontSize: '0.72rem', color: '#38bdf8', fontWeight: 800, textTransform: 'uppercase' }}>
                      TRANSLATED OUTPUT ({result.target_language || targetLang})
                    </span>
                    <div style={{ display: 'flex', gap: 10 }}>
                      <button
                        onClick={() => speakText(result.translated_text)}
                        title="Listen to translation"
                        style={{ background: 'none', border: 'none', color: '#38bdf8', cursor: 'pointer', padding: 2 }}
                      >
                        <Volume2 size={16} />
                      </button>
                      <button
                        onClick={handleCopy}
                        title="Copy translation"
                        style={{ background: 'none', border: 'none', color: copied ? '#10b981' : '#38bdf8', cursor: 'pointer', padding: 2, display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.75rem' }}
                      >
                        {copied ? <Check size={16} /> : <Copy size={16} />}
                        {copied && 'Copied!'}
                      </button>
                    </div>
                  </div>
                  <p style={{ margin: 0, fontSize: '1.05rem', color: '#fff', lineHeight: 1.6, fontWeight: 600 }}>
                    {result.translated_text}
                  </p>
                </div>
              </div>
            </div>
          )}

          {!result && !loading && !error && (
            <div className="card" style={{ padding: 48, textAlign: 'center', border: '2px dashed var(--border-color)' }}>
              <Globe size={42} color="var(--text-dim)" style={{ marginBottom: 14 }} />
              <h3 style={{ margin: '0 0 6px', color: '#fff', fontSize: '1.05rem' }}>Select Language & Translate</h3>
              <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.85rem' }}>
                Choose any source language above, enter or pick a sample complaint, and view the AI cross-lingual translation.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Batch Multilingual Demo */}
      <div className="card" style={{ padding: 24, marginTop: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#fff' }}>
              🌍 Batch Demonstration Across 10+ Languages
            </h3>
            <p style={{ margin: '4px 0 0', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              Translate complaints across Tamil, Hindi, Telugu, Kannada, French, Spanish, Arabic simultaneously
            </p>
          </div>
          <button onClick={runBatchDemo} disabled={batchLoading} style={{
            background: 'rgba(14,165,233,0.15)', border: '1px solid rgba(14,165,233,0.35)',
            color: '#38bdf8', borderRadius: 9, padding: '8px 18px', cursor: 'pointer',
            fontSize: '0.82rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 7
          }}>
            <Zap size={14} /> {batchLoading ? 'Processing Batch...' : 'Run All Languages'}
          </button>
        </div>

        {batchResults.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 12 }}>
            {batchResults.map((item, i) => (
              <div key={i} style={{
                padding: 14, background: 'rgba(255,255,255,0.03)',
                borderRadius: 10, border: '1px solid var(--border-color)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <span style={{ fontSize: '1.1rem' }}>{item.flag}</span>
                  <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#0ea5e9' }}>{item.code}</span>
                  {item.result && (
                    <span style={{
                      marginLeft: 'auto',
                      background: `${engineColor(item.result.engine)}18`,
                      border: `1px solid ${engineColor(item.result.engine)}44`,
                      color: engineColor(item.result.engine),
                      borderRadius: 12, padding: '2px 8px', fontSize: '0.65rem', fontWeight: 600
                    }}>
                      {item.result.engine}
                    </span>
                  )}
                </div>
                <p style={{ margin: '0 0 6px', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  {item.sample}
                </p>
                {item.result && (
                  <p style={{ margin: 0, fontSize: '0.85rem', color: '#38bdf8', fontWeight: 600, lineHeight: 1.5 }}>
                    → {item.result.translated_text}
                  </p>
                )}
                {item.error && (
                  <p style={{ margin: 0, fontSize: '0.78rem', color: '#f87171' }}>{item.error}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
