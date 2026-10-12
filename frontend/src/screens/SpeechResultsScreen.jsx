import React from 'react';
import { Mic, Activity, CheckCircle2, Volume2, ShieldCheck, Zap } from 'lucide-react';

const BENCHMARK_SAMPLES = [
  {
    id: "AUDIO-CIVIC-001",
    issue: "Streetlights",
    duration: "3.8s",
    rms: "420.5",
    ref: "the streetlight near bus stop is off for three days",
    hyp: "the streetlight near bus stop is off for 3 days",
    wer: "10.00%",
    accuracy: "90.0%"
  },
  {
    id: "AUDIO-CIVIC-002",
    issue: "Water Supply",
    duration: "4.2s",
    rms: "512.1",
    ref: "drinking water pipeline leaking heavily near anna nagar",
    hyp: "drinking water pipeline leaking heavily near anna nagar",
    wer: "0.00%",
    accuracy: "100.0%"
  },
  {
    id: "AUDIO-CIVIC-003",
    issue: "Waste Management",
    duration: "4.5s",
    rms: "380.0",
    ref: "garbage dump not cleaned on 5th cross street since monday",
    hyp: "garbage dumb not cleaned on fifth cross street since monday",
    wer: "20.00%",
    accuracy: "80.0%"
  },
  {
    id: "AUDIO-CIVIC-004",
    issue: "Roads",
    duration: "4.0s",
    rms: "465.3",
    ref: "huge pothole on main road causing severe traffic jam",
    hyp: "huge pothole on main road causing severe traffic jam",
    wer: "0.00%",
    accuracy: "100.0%"
  },
  {
    id: "AUDIO-CIVIC-005",
    issue: "Drainage",
    duration: "4.6s",
    rms: "490.8",
    ref: "open drainage sewer overflowing opposite government school",
    hyp: "open drainage sewer overflow opposite government school",
    wer: "14.29%",
    accuracy: "85.7%"
  }
];

export default function SpeechResultsScreen() {
  return (
    <div style={{ padding: '28px', maxWidth: '1400px', margin: '0 auto' }}>
      
      {/* Title */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
          <span className="badge badge-rose">Concept 5</span>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-main)' }}>
            Speech Processing & Word Error Rate (WER) Evaluation
          </h1>
        </div>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          Evaluates Automatic Speech Recognition (ASR) acoustic feature extraction and transcription fidelity on real-world civic voice queries.
        </p>
      </div>

      {/* Aggregate KPI Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '16px',
        marginBottom: '28px'
      }}>
        <div className="glass-panel" style={{ padding: '20px' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Mean WER Error Rate</span>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--secondary)', marginTop: '4px' }}>8.86%</div>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>Levenshtein word distance metric</span>
        </div>

        <div className="glass-panel" style={{ padding: '20px' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Mean Speech Accuracy</span>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--accent-green)', marginTop: '4px' }}>91.1%</div>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>Fidelity across test benchmarks</span>
        </div>

        <div className="glass-panel" style={{ padding: '20px' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Acoustic Integrity</span>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#c084fc', marginTop: '4px' }}>100% Pass</div>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>All samples digitized & voiced</span>
        </div>

        <div className="glass-panel" style={{ padding: '20px' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Evaluation Metric</span>
          <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--accent-amber)', marginTop: '10px' }}>Levenshtein WER</div>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>(S + D + I) / N_words</span>
        </div>
      </div>

      {/* Benchmark Benchmark Samples Table */}
      <div className="glass-panel" style={{ padding: '24px', marginBottom: '28px' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '6px' }}>
          Acoustic & Word Error Rate Benchmark Suite
        </h3>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '18px' }}>
          Measured from `evaluation/evaluate_speech.py` against reference ground truth speech recordings
        </p>

        <div style={{ overflowX: 'auto' }}>
          <table className="civic-table">
            <thead>
              <tr>
                <th>Sample ID</th>
                <th>Category</th>
                <th>Duration / Energy</th>
                <th>Ground Truth Reference</th>
                <th>ASR Transcript Hypothesis</th>
                <th>WER</th>
                <th>Accuracy</th>
              </tr>
            </thead>
            <tbody>
              {BENCHMARK_SAMPLES.map((s, idx) => (
                <tr key={idx}>
                  <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--primary-light)', fontSize: '0.8rem' }}>
                    {s.id}
                  </td>
                  <td>
                    <span className="badge badge-purple">{s.issue}</span>
                  </td>
                  <td style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                    <div>{s.duration}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>RMS: {s.rms}</div>
                  </td>
                  <td style={{ color: 'var(--text-muted)' }}>"{s.ref}"</td>
                  <td style={{ color: 'var(--accent-green)', fontWeight: 600 }}>"{s.hyp}"</td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: Number(s.wer.replace('%','')) > 10 ? 'var(--accent-amber)' : 'var(--accent-green)' }}>
                    {s.wer}
                  </td>
                  <td style={{ fontWeight: 800, color: 'var(--text-main)' }}>
                    {s.accuracy}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Formula & Architectural Explanation */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '10px' }}>
          Word Error Rate (WER) Methodology
        </h3>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
          Word Error Rate measures speech recognition error using dynamic programming minimum edit distance:
          <code style={{ background: 'var(--panel-bg)', padding: '2px 8px', borderRadius: '4px', margin: '0 6px', color: 'var(--primary-light)' }}>
            WER = (Substitutions + Deletions + Insertions) / Total Reference Words
          </code>.
          Acoustic waveform extraction verifies Root Mean Square (RMS) energy to discard non-speech ambient silence and background noise before model transcription.
        </p>
      </div>

    </div>
  );
}

