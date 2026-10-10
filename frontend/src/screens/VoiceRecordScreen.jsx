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
  const [errorMsg, setErrorMsg] = useState('');

  const mediaRecorderRef = useRef(null);
  const timerRef = useRef(null);

  const startRecording = async () => {
    setErrorMsg('');
    setResult(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      const chunks = [];
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/wav' });
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
      setErrorMsg('');
    }
  };

  const handleTranscribe = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const formData = new FormData();
      if (audioBlob) {
        formData.append('file', audioBlob, 'voice_complaint.wav');
      }
      formData.append('language', selectedLanguage);

      const res = await api.transcribeAudio(formData);
      setResult(res);
      if (onTranscriptionReady) onTranscriptionReady(res.transcript);
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
          <span className="badge badge-rose">Concept 5</span>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#fff' }}>
            Voice Complaint Recording & Speech Recognition
          </h1>
        </div>
        <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>
          Record audio or upload an audio file. CivicSense extracts acoustic waveform metrics (RMS energy, duration, frequency)
          and converts your spoken words into natural language text for automated complaint classification.
        </p>
      </div>

      {/* Main Recording Card */}
      <div className="glass-panel" style={{ padding: '36px', textAlign: 'center', marginBottom: '28px' }}>
        
        {/* Language Selection */}
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '28px' }}>
          <span style={{ fontSize: '0.82rem', color: '#94a3b8', fontWeight: 600 }}>Audio Input Language:</span>
          <select
            value={selectedLanguage}
            onChange={(e) => setSelectedLanguage(e.target.value)}
            className="select-field"
            style={{ width: 'auto', padding: '6px 12px', fontSize: '0.82rem' }}
          >
            <option value="en-IN">English (India) - en-IN</option>
            <option value="ta-IN">Tamil - ta-IN</option>
            <option value="en-US">English (US) - en-US</option>
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
              color: '#fff',
              cursor: 'pointer',
              boxShadow: recording ? '0 0 30px rgba(239, 68, 68, 0.6)' : '0 6px 20px rgba(37, 99, 235, 0.4)',
              transition: 'all 0.2s ease'
            }}
          >
            {recording ? <Square size={36} /> : <Mic size={38} />}
          </button>

          <div style={{ fontSize: '1.2rem', fontWeight: 800, color: recording ? '#f87171' : '#fff' }}>
            {recording ? `Recording: ${recordingDuration}s` : (audioBlob ? 'Audio Captured' : 'Click to Speak')}
          </div>

          <p style={{ color: '#94a3b8', fontSize: '0.82rem', maxWidth: '400px' }}>
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
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#fff' }}>
              Automatic Speech Recognition (ASR) Output
            </h3>
          </div>

          <div style={{
            background: 'rgba(15, 23, 42, 0.6)',
            padding: '18px 22px',
            borderRadius: '12px',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            marginBottom: '20px'
          }}>
            <span style={{ fontSize: '0.72rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700 }}>
              Recognized Speech Transcript
            </span>
            <p style={{ fontSize: '1.15rem', fontWeight: 700, color: '#60a5fa', marginTop: '6px', lineHeight: 1.5 }}>
              "{result.transcript}"
            </p>
            <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '8px' }}>
              Engine: {result.engine} | Language: {result.language}
            </div>
          </div>

          {/* Acoustic Features */}
          {result.audio_features && (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: '12px',
              marginBottom: '24px'
            }}>
              <div style={{ background: 'rgba(15, 23, 42, 0.5)', padding: '14px', borderRadius: '10px' }}>
                <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>RMS Energy (Intensity)</span>
                <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#34d399' }}>
                  {result.audio_features.rms_energy}
                </div>
                <span style={{ fontSize: '0.68rem', color: '#64748b' }}>Voiced speech indicator</span>
              </div>

              <div style={{ background: 'rgba(15, 23, 42, 0.5)', padding: '14px', borderRadius: '10px' }}>
                <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Sample Rate</span>
                <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#60a5fa' }}>
                  {result.audio_features.sample_rate_hz} Hz
                </div>
                <span style={{ fontSize: '0.68rem', color: '#64748b' }}>Standard acoustic rate</span>
              </div>

              <div style={{ background: 'rgba(15, 23, 42, 0.5)', padding: '14px', borderRadius: '10px' }}>
                <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Audio Duration</span>
                <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#fbbf24' }}>
                  {result.audio_features.duration_seconds}s
                </div>
                <span style={{ fontSize: '0.68rem', color: '#64748b' }}>Total speech duration</span>
              </div>

              <div style={{ background: 'rgba(15, 23, 42, 0.5)', padding: '14px', borderRadius: '10px' }}>
                <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Speech Activity</span>
                <div style={{ fontSize: '1.3rem', fontWeight: 800, color: result.audio_features.is_voiced ? '#34d399' : '#f87171' }}>
                  {result.audio_features.is_voiced ? 'Voiced Active' : 'Low Energy'}
                </div>
                <span style={{ fontSize: '0.68rem', color: '#64748b' }}>Acoustic threshold check</span>
              </div>
            </div>
          )}

          {/* Route to complaint submission */}
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={() => onNavigate('text-submission')}
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
