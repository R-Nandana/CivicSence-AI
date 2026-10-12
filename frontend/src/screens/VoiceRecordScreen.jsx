import React, { useState, useRef } from 'react';
import { Mic, Square, Upload, Play, CheckCircle2, AlertCircle, ArrowRight, Volume2, Sparkles } from 'lucide-react';
import { api } from '../services/api';

export default function VoiceRecordScreen({ onNavigate, onTranscriptionReady }) {
  const [recording, setRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [selectedLanguage, setSelectedLanguage] = useState('en-IN');
  const [translation, setTranslation] = useState(null);
  const [translating, setTranslating] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const mediaRecorderRef = useRef(null);
  const timerRef = useRef(null);
  const mimeTypeRef = useRef('audio/webm');

  const startRecording = async () => {
    setErrorMsg('');
    setResult(null);
    setTranslation(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // Use browser-supported MIME type — MediaRecorder never produces real WAV
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/ogg;codecs=opus')
        ? 'audio/ogg;codecs=opus'
        : 'audio/webm';
      mimeTypeRef.current = mimeType;
      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;

      const chunks = [];
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: mimeType });
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
      };

      mediaRecorder.start();
      setRecording(true);
      setRecordingDuration(0);

      timerRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);
    } catch (err) {
      setErrorMsg('Microphone access was denied or is unavailable. You can upload an audio file below.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      clearInterval(timerRef.current);
      setRecording(false);
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAudioBlob(file);
      setAudioUrl(URL.createObjectURL(file));
      setResult(null);
      setTranslation(null);
      setErrorMsg('');
    }
  };

  const handleTranscribe = async () => {
    setLoading(true);
    setErrorMsg('');
    setTranslation(null);
    try {
      const formData = new FormData();
      if (audioBlob) {
        // Derive correct file extension from the actual recorded MIME type
        const mime = mimeTypeRef.current || audioBlob.type || 'audio/webm';
        const ext = mime.includes('ogg') ? 'ogg' : mime.includes('mp4') ? 'mp4' : 'webm';
        formData.append('file', audioBlob, `voice_complaint.${ext}`);
      }
      formData.append('language', selectedLanguage);

      const res = await api.transcribeAudio(formData);
      setResult(res);
      if (onTranscriptionReady) onTranscriptionReady(res.transcript);

      // Auto-translate if not plain English
      if (res?.transcript && selectedLanguage !== 'en-IN' && selectedLanguage !== 'en-US' && selectedLanguage !== 'en-GB') {
        setTranslating(true);
        try {
          const trans = await api.translateLLM(res.transcript, selectedLanguage, 'English');
          setTranslation(trans);
        } catch (tErr) {
          console.warn('Auto-translation failed', tErr);
        } finally {
          setTranslating(false);
        }
      }
    } catch (err) {
      setErrorMsg(err.message || 'Speech transcription failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '28px', maxWidth: '1100px', margin: '0 auto' }}>
      
      {/* Title */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-main)' }}>
            Voice Complaint Recording &amp; Speech Recognition
          </h1>
        </div>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          Record audio or upload an audio file in any Indian or international language. CivicSense extracts acoustic waveform metrics
          and automatically transcribes and translates spoken words into standard English for complaint resolution.
        </p>
      </div>

      {/* Main Recording Card */}
      <div className="glass-panel" style={{ padding: '36px', textAlign: 'center', marginBottom: '28px' }}>
        
        {/* Language Selection */}
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', marginBottom: '28px', flexWrap: 'wrap', justifyContent: 'center' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 700 }}>🌐 Audio Spoken Language:</span>
          <select
            value={selectedLanguage}
            onChange={(e) => setSelectedLanguage(e.target.value)}
            className="select-field"
            style={{ 
              width: 'auto', 
              padding: '8px 14px', 
              fontSize: '0.85rem',
              borderRadius: '8px',
              background: 'var(--input-bg)',
              color: 'var(--primary)',
              border: '1px solid var(--border-color)',
              fontWeight: 600
            }}
          >
            <optgroup label="🇮🇳 Indian Regional Languages">
              <option value="en-IN">English (India) - en-IN</option>
              <option value="ta-IN">à®¤à®®à®¿à®´à¯ (Tamil) - ta-IN</option>
              <option value="hi-IN">à¤¹à¤¿à¤¨à¥à¤¦à¥€ (Hindi) - hi-IN</option>
              <option value="te-IN">à°¤à±†à°²à±à°—à± (Telugu) - te-IN</option>
              <option value="kn-IN">à²•à²¨à³à²¨à²¡ (Kannada) - kn-IN</option>
              <option value="ml-IN">മലയാളം (Malayalam) - ml-IN</option>
              <option value="bn-IN">বাংলা (Bengali) - bn-IN</option>
              <option value="mr-IN">मराठी (Marathi) - mr-IN</option>
              <option value="gu-IN">àª—à«àªœàª°àª¾àª¤à«€ (Gujarati) - gu-IN</option>
              <option value="pa-IN">ਪੰਜਾਬੀ (Punjabi) - pa-IN</option>
              <option value="ur-IN">اردو (Urdu) - ur-IN</option>
            </optgroup>
            <optgroup label="🌐 International Languages">
              <option value="en-US">English (US) - en-US</option>
              <option value="en-GB">English (UK) - en-GB</option>
              <option value="es-ES">Español (Spanish) - es-ES</option>
              <option value="fr-FR">Français (French) - fr-FR</option>
              <option value="de-DE">Deutsch (German) - de-DE</option>
              <option value="ar-SA">العربية (Arabic) - ar-SA</option>
              <option value="zh-CN">中文 (Mandarin) - zh-CN</option>
              <option value="ja-JP">日本語 (Japanese) - ja-JP</option>
            </optgroup>
          </select>
        </div>

        {/* Big Record Button */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '18px', marginBottom: '24px' }}>
          <button
            type="button"
            onClick={recording ? stopRecording : startRecording}
            style={{
              width: '90px',
              height: '90px',
              borderRadius: '50%',
              background: recording ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' : 'linear-gradient(135deg, #2563eb 0%, #06b6d4 100%)',
              border: recording ? '4px solid rgba(239, 68, 68, 0.4)' : '4px solid rgba(37, 99, 235, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-main)',
              cursor: 'pointer',
              boxShadow: recording ? '0 0 30px rgba(239, 68, 68, 0.6)' : '0 6px 20px rgba(37, 99, 235, 0.4)',
              transition: 'all 0.2s ease'
            }}
          >
            {recording ? <Square size={36} /> : <Mic size={38} />}
          </button>

          <div style={{ fontSize: '1.2rem', fontWeight: 800, color: recording ? '#f87171' : 'var(--text-main)' }}>
            {recording ? `Recording: ${recordingDuration}s` : (audioBlob ? 'Audio Captured' : 'Click to Speak')}
          </div>

          <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', maxWidth: '400px' }}>
            {recording 
              ? 'Speak clearly into your microphone describing the physical civic issue.' 
              : 'Press the microphone button to record, or upload an audio file below.'}
          </p>
        </div>

        {/* Audio Player if available */}
        {audioUrl && (
          <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'center' }}>
            <audio controls src={audioUrl} style={{ width: '100%', maxWidth: '400px' }} />
          </div>
        )}

        {/* Action Controls */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <label className="btn btn-secondary" style={{ cursor: 'pointer' }}>
            <Upload size={15} /> Upload Audio File (.wav, .mp3)
            <input type="file" accept="audio/*" onChange={handleFileUpload} style={{ display: 'none' }} />
          </label>

          <button
            onClick={handleTranscribe}
            disabled={loading}
            className="btn btn-primary"
            style={{ padding: '10px 24px', background: 'linear-gradient(135deg, #e11d48 0%, #f43f5e 100%)' }}
          >
            <Sparkles size={16} /> {loading ? 'Transcribing...' : 'Transcribe & Extract Acoustic Features'}
          </button>
        </div>

        {errorMsg && (
          <div style={{
            marginTop: '20px',
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '8px',
            padding: '10px 14px',
            color: '#f87171',
            fontSize: '0.82rem'
          }}>
            {errorMsg}
          </div>
        )}
      </div>

      {/* Transcription Results Card */}
      {result && (
        <div className="glass-panel" style={{ padding: '28px', borderColor: 'rgba(16, 185, 129, 0.4)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <CheckCircle2 size={22} color="#34d399" />
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)' }}>
              Automatic Speech Recognition (ASR) Output
            </h3>
          </div>

          <div style={{
            background: 'var(--panel-bg)',
            padding: '18px 22px',
            borderRadius: '12px',
            border: '1px solid var(--border-color)',
            marginBottom: '16px'
          }}>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
              Recognized Speech Transcript ({result.language})
            </span>
            <p style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--primary)', marginTop: '6px', lineHeight: 1.5 }}>
              "{result.transcript}"
            </p>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: '8px' }}>
              Engine: {result.engine} | Language: {result.language}
            </div>
          </div>

          {translating && (
            <div style={{ padding: '14px', background: 'rgba(79, 70, 229, 0.12)', borderRadius: '12px', border: '1px solid rgba(79, 70, 229, 0.3)', marginBottom: '16px', color: 'var(--primary-light)', fontSize: '0.85rem' }}>
              🔄 Translating transcript to standard English for municipal officer review...
            </div>
          )}

          {translation && (
            <div style={{
              background: 'linear-gradient(135deg, rgba(79, 70, 229, 0.15) 0%, rgba(14, 165, 233, 0.15) 100%)',
              padding: '18px 22px',
              borderRadius: '12px',
              border: '1px solid rgba(99, 102, 241, 0.35)',
              marginBottom: '20px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--secondary)', textTransform: 'uppercase', fontWeight: 800 }}>
                  🌐 Automatic English Translation (For Municipal Officers)
                </span>
                <span className="badge badge-purple" style={{ fontSize: '0.65rem' }}>
                  {translation.engine || 'Universal NLP'}
                </span>
              </div>
              <p style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)', marginTop: '4px', lineHeight: 1.5 }}>
                "{translation.translated_text}"
              </p>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '6px' }}>
                Detected: {translation.detected_language || selectedLanguage} → Standard English | Confidence: {((translation.confidence || 0.95)*100).toFixed(0)}%
              </div>
            </div>
          )}

          {/* Acoustic Features */}
          {result.audio_features && (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: '12px',
              marginBottom: '24px'
            }}>
              <div style={{ background: 'var(--panel-bg)', padding: '14px', borderRadius: '10px' }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>RMS Energy (Intensity)</span>
                <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--accent-green)' }}>
                  {result.audio_features.rms_energy}
                </div>
                <span style={{ fontSize: '0.68rem', color: 'var(--text-dim)' }}>Voiced speech indicator</span>
              </div>

              <div style={{ background: 'var(--panel-bg)', padding: '14px', borderRadius: '10px' }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Sample Rate</span>
                <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--primary)' }}>
                  {result.audio_features.sample_rate_hz} Hz
                </div>
                <span style={{ fontSize: '0.68rem', color: 'var(--text-dim)' }}>Standard acoustic rate</span>
              </div>

              <div style={{ background: 'var(--panel-bg)', padding: '14px', borderRadius: '10px' }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Audio Duration</span>
                <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--accent-amber)' }}>
                  {result.audio_features.duration_seconds}s
                </div>
                <span style={{ fontSize: '0.68rem', color: 'var(--text-dim)' }}>Total speech duration</span>
              </div>

              <div style={{ background: 'var(--panel-bg)', padding: '14px', borderRadius: '10px' }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Speech Activity</span>
                <div style={{ fontSize: '1.3rem', fontWeight: 800, color: result.audio_features.is_voiced ? 'var(--accent-green)' : '#f87171' }}>
                  {result.audio_features.is_voiced ? 'Voiced Active' : 'Low Energy'}
                </div>
                <span style={{ fontSize: '0.68rem', color: 'var(--text-dim)' }}>Acoustic threshold check</span>
              </div>
            </div>
          )}

          {/* Route to complaint submission */}
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={() => {
                if (onTranscriptionReady) {
                  onTranscriptionReady(translation?.translated_text || result.transcript);
                }
                onNavigate('text-submission');
              }}
              className="btn btn-primary"
            >
              Route Transcript to Complaint Filing <ArrowRight size={15} />
            </button>
            <button
              onClick={() => onNavigate('speech-results')}
              className="btn btn-secondary"
            >
              View WER Speech Evaluation Benchmark
            </button>
          </div>
        </div>
      )}

    </div>
  );
}

