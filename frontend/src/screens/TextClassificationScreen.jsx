import React, { useState } from 'react';
import { 
  Layers, BarChart2, CheckCircle2, Cpu, RefreshCw, Send, Sparkles 
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell 
} from 'recharts';
import { api } from '../services/api';

const CATEGORIES = [
  "Roads", "Waste Management", "Water Supply", "Drainage",
  "Streetlights", "Sanitation", "Traffic", "Public Infrastructure"
];

const COLORS = [
  "#3b82f6", "#10b981", "#06b6d4", "#a855f7",
  "#f59e0b", "#ec4899", "#6366f1", "#14b8a6"
];

// Pre-computed Confusion Matrix from evaluation/evaluate_classifier.py
const CONFUSION_MATRIX = [
  { actual: "Drainage", Drai: 10, Publ: 0, Road: 0, Sani: 0, Stre: 0, Traf: 0, Wast: 0, Wate: 0 },
  { actual: "Public Infra", Drai: 0, Publ: 39, Road: 0, Sani: 0, Stre: 0, Traf: 0, Wast: 0, Wate: 0 },
  { actual: "Roads", Drai: 0, Publ: 0, Road: 53, Sani: 0, Stre: 0, Traf: 0, Wast: 0, Wate: 0 },
  { actual: "Sanitation", Drai: 0, Publ: 0, Road: 0, Sani: 35, Stre: 0, Traf: 0, Wast: 0, Wate: 0 },
  { actual: "Streetlights", Drai: 0, Publ: 0, Road: 0, Sani: 0, Stre: 36, Traf: 0, Wast: 0, Wate: 0 },
  { actual: "Traffic", Drai: 0, Publ: 0, Road: 0, Sani: 0, Stre: 0, Traf: 16, Wast: 0, Wate: 0 },
  { actual: "Waste Mgmt", Drai: 0, Publ: 0, Road: 0, Sani: 0, Stre: 0, Traf: 0, Wast: 10, Wate: 0 },
  { actual: "Water Supply", Drai: 0, Publ: 0, Road: 0, Sani: 0, Stre: 0, Traf: 0, Wast: 0, Wate: 10 }
];

export default function TextClassificationScreen() {
  const [inputText, setInputText] = useState('Deep pothole near the bus stand causing vehicle damage');
  const [loading, setLoading] = useState(false);
  const [prediction, setPrediction] = useState({
    predicted_category: 'Roads',
    confidence: 0.8286,
    model_version: 'v1.0.0',
    class_probabilities: {
      "Roads": 0.8286,
      "Public Infrastructure": 0.0483,
      "Sanitation": 0.0384,
      "Streetlights": 0.0249,
      "Traffic": 0.0181,
      "Waste Management": 0.0174,
      "Drainage": 0.0131,
      "Water Supply": 0.0113
    }
  });

  const handlePredict = async (e) => {
    e?.preventDefault();
    if (!inputText.trim()) return;
    setLoading(true);
    try {
      const res = await api.predict(inputText);
      setPrediction(res);
    } catch (err) {
      alert(err.message || 'Prediction failed');
    } finally {
      setLoading(false);
    }
  };

  const chartData = Object.entries(prediction.class_probabilities || {}).map(([cat, prob]) => ({
    category: cat,
    probability: Number((prob * 100).toFixed(1))
  })).sort((a, b) => b.probability - a.probability);

  return (
    <div style={{ padding: '28px', maxWidth: '1400px', margin: '0 auto' }}>
      
      {/* Title */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
          <span className="badge badge-blue">Concept 1</span>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#fff' }}>
            Text Classification & Softmax Probability Engine
          </h1>
        </div>
        <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>
          TF-IDF Feature Extraction (unigrams + bigrams, sublinear TF scaling, smooth IDF) + Multiclass Softmax Logistic Regression
          evaluating across all 8 civic municipal categories.
        </p>
      </div>

      {/* Live Classifier Tester */}
      <div className="glass-panel" style={{ padding: '24px', marginBottom: '28px' }}>
        <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#fff', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Sparkles size={18} color="#60a5fa" /> Live Inference Playground
        </h3>

        <form onSubmit={handlePredict} style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Type any complaint text to test classification..."
            className="input-field"
            style={{ flex: 1 }}
          />
          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary"
            style={{ whiteSpace: 'nowrap', padding: '10px 20px' }}
          >
            <Send size={15} /> {loading ? 'Classifying...' : 'Classify Text'}
          </button>
        </form>

        {/* Prediction Verdict Card */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '14px',
          background: 'rgba(15, 23, 42, 0.6)',
          padding: '18px 22px',
          borderRadius: '12px',
          border: '1px solid rgba(255, 255, 255, 0.08)'
        }}>
          <div>
            <span style={{ fontSize: '0.72rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700 }}>Predicted Category</span>
            <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#60a5fa', marginTop: '2px' }}>
              {prediction.predicted_category}
            </div>
          </div>
          <div>
            <span style={{ fontSize: '0.72rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700 }}>Model Confidence</span>
            <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#34d399', marginTop: '2px' }}>
              {(prediction.confidence * 100).toFixed(1)}%
            </div>
          </div>
          <div>
            <span style={{ fontSize: '0.72rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700 }}>Active Model Version</span>
            <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#c084fc', marginTop: '2px', fontFamily: 'var(--font-mono)' }}>
              {prediction.model_version || 'v1.0.0'}
            </div>
          </div>
          <div>
            <span style={{ fontSize: '0.72rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700 }}>Vocabulary Representation</span>
            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fbbf24', marginTop: '4px' }}>
              3,500 N-Grams
            </div>
          </div>
        </div>
      </div>

      {/* Two Column Layout: Probabilities Chart + Evaluation Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: '24px', marginBottom: '28px' }}>
        
        {/* Recharts Softmax Probabilities Bar Chart */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#fff', marginBottom: '6px' }}>
            Softmax Class Probabilities Distribution
          </h3>
          <p style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: '18px' }}>
            Normalizes class logits across all 8 civic categories via softmax function
          </p>

          <div style={{ width: '100%', height: '320px' }}>
            <ResponsiveContainer>
              <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 30, left: 90, bottom: 5 }}>
                <XAxis type="number" domain={[0, 100]} unit="%" stroke="#64748b" />
                <YAxis type="category" dataKey="category" stroke="#cbd5e1" fontSize={11} width={100} />
                <Tooltip
                  formatter={(val) => [`${val}%`, 'Probability']}
                  contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: '8px' }}
                />
                <Bar dataKey="probability" radius={[0, 6, 6, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Model Evaluation Metrics Report */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#fff', marginBottom: '6px' }}>
            Model Evaluation Metrics (Stratified Test Split)
          </h3>
          <p style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: '16px' }}>
            Measured on 209 unseen hold-out complaints (80/20 train-test ratio)
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', marginBottom: '20px' }}>
            <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '14px', borderRadius: '10px' }}>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Overall Accuracy</div>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#34d399' }}>100.0%</div>
            </div>
            <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '14px', borderRadius: '10px' }}>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Macro F1-Score</div>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#60a5fa' }}>1.000</div>
            </div>
            <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '14px', borderRadius: '10px' }}>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Precision Average</div>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#c084fc' }}>1.000</div>
            </div>
            <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '14px', borderRadius: '10px' }}>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Recall Average</div>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#fbbf24' }}>1.000</div>
            </div>
          </div>

          <div style={{ fontSize: '0.8rem', color: '#94a3b8', lineHeight: 1.6, background: 'rgba(255, 255, 255, 0.03)', padding: '14px', borderRadius: '8px' }}>
            <strong>Academic Provenance:</strong> Trained on NYC 311 Open Data Service Requests across 8 normalized categories.
            Uses L2 penalty regularization (λ=0.0001) and mini-batch stochastic gradient descent.
          </div>
        </div>

      </div>

      {/* Confusion Matrix Table */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#fff', marginBottom: '6px' }}>
          Multiclass Confusion Matrix (Holdout Test Set)
        </h3>
        <p style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: '16px' }}>
          Rows: Ground Truth Class | Columns: Predicted Class (209 test samples)
        </p>

        <div style={{ overflowX: 'auto' }}>
          <table className="civic-table" style={{ textAlign: 'center' }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left' }}>True Category</th>
                <th>Drainage</th>
                <th>Public Infra</th>
                <th>Roads</th>
                <th>Sanitation</th>
                <th>Streetlights</th>
                <th>Traffic</th>
                <th>Waste Mgmt</th>
                <th>Water Supply</th>
              </tr>
            </thead>
            <tbody>
              {CONFUSION_MATRIX.map((row, idx) => (
                <tr key={idx}>
                  <td style={{ textAlign: 'left', fontWeight: 700, color: '#f8fafc' }}>{row.actual}</td>
                  <td style={{ color: row.Drai > 0 ? '#34d399' : '#64748b', fontWeight: row.Drai > 0 ? 800 : 400 }}>{row.Drai}</td>
                  <td style={{ color: row.Publ > 0 ? '#34d399' : '#64748b', fontWeight: row.Publ > 0 ? 800 : 400 }}>{row.Publ}</td>
                  <td style={{ color: row.Road > 0 ? '#34d399' : '#64748b', fontWeight: row.Road > 0 ? 800 : 400 }}>{row.Road}</td>
                  <td style={{ color: row.Sani > 0 ? '#34d399' : '#64748b', fontWeight: row.Sani > 0 ? 800 : 400 }}>{row.Sani}</td>
                  <td style={{ color: row.Stre > 0 ? '#34d399' : '#64748b', fontWeight: row.Stre > 0 ? 800 : 400 }}>{row.Stre}</td>
                  <td style={{ color: row.Traf > 0 ? '#34d399' : '#64748b', fontWeight: row.Traf > 0 ? 800 : 400 }}>{row.Traf}</td>
                  <td style={{ color: row.Wast > 0 ? '#34d399' : '#64748b', fontWeight: row.Wast > 0 ? 800 : 400 }}>{row.Wast}</td>
                  <td style={{ color: row.Wate > 0 ? '#34d399' : '#64748b', fontWeight: row.Wate > 0 ? 800 : 400 }}>{row.Wate}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
