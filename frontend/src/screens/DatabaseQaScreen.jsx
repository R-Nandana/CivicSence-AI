import React, { useState, useEffect } from 'react';
import { 
  HelpCircle, Send, Sparkles, Database, CheckCircle2, 
  Search, Table, Clock, Filter, ArrowRight 
} from 'lucide-react';
import { api } from '../services/api';

const MANDATED_ACADEMIC_QUESTIONS = [
  "How many unresolved streetlight complaints are there?",
  "Which locations have recurring drainage complaints?",
  "Which issues were reported again after being marked resolved?",
  "Which complaints have new image or video evidence?",
  "How many complaints were submitted during a selected date range?"
];

export default function DatabaseQaScreen({ onNavigate }) {
  const [question, setQuestion] = useState("How many unresolved streetlight complaints are there?");
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  const handleAsk = async (qToAsk) => {
    const targetQ = qToAsk || question;
    if (!targetQ.trim()) return;
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await api.askDatabaseQA(targetQ);
      setResponse(res);
    } catch (err) {
      setErrorMsg(err.message || 'Database QA query failed.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    handleAsk(MANDATED_ACADEMIC_QUESTIONS[0]);
  }, []);

  return (
    <div style={{ padding: '28px', maxWidth: '1400px', margin: '0 auto' }}>
      
      {/* Title */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
          <span className="badge badge-cyan">Concept 6</span>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#fff' }}>
            Database-Grounded Civic Question Answering
          </h1>
        </div>
        <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>
          Controlled, verifiable question answering grounded directly in live municipal complaints, evidence records,
          and resolution audit logs. Returns factual natural language explanations alongside the exact supporting database records.
        </p>
      </div>

      {/* 1-Click Mandated Academic Question Buttons */}
      <div style={{ marginBottom: '20px' }}>
        <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', display: 'block', marginBottom: '10px' }}>
          Mandated Academic Scenarios (1-Click Query)
        </span>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {MANDATED_ACADEMIC_QUESTIONS.map((q, idx) => (
            <button
              key={idx}
              onClick={() => {
                setQuestion(q);
                handleAsk(q);
              }}
              className="btn btn-secondary"
              style={{
                fontSize: '0.8rem',
                padding: '8px 14px',
                borderRadius: '8px',
                borderColor: question === q ? '#06b6d4' : 'rgba(255, 255, 255, 0.1)',
                background: question === q ? 'rgba(6, 182, 212, 0.15)' : 'rgba(255, 255, 255, 0.04)',
                color: question === q ? '#22d3ee' : '#cbd5e1'
              }}
            >
              <Sparkles size={13} color="#22d3ee" /> {q}
            </button>
          ))}
        </div>
      </div>

      {/* Query Bar */}
      <div className="glass-panel" style={{ padding: '16px 20px', marginBottom: '28px' }}>
        <form onSubmit={(e) => { e.preventDefault(); handleAsk(); }} style={{ display: 'flex', gap: '12px' }}>
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Ask any civic question about complaints, recurrence, evidence, or resolution status..."
            className="input-field"
            style={{ flex: 1 }}
          />
          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary"
            style={{ padding: '10px 22px', background: 'linear-gradient(135deg, #0891b2 0%, #06b6d4 100%)' }}
          >
            <Send size={15} /> {loading ? 'Querying Database...' : 'Run Query'}
          </button>
        </form>
      </div>

      {errorMsg && (
        <div style={{ color: '#f87171', padding: '12px', background: 'rgba(239, 68, 68, 0.15)', borderRadius: '8px', marginBottom: '20px' }}>
          {errorMsg}
        </div>
      )}

      {/* Response Display */}
      {response && (
        <div>
          {/* Grounded Natural Language Answer Box */}
          <div className="glass-panel" style={{ padding: '24px', marginBottom: '28px', borderColor: 'rgba(6, 182, 212, 0.35)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle2 size={18} color="#22d3ee" />
                <span style={{ fontWeight: 800, color: '#fff', fontSize: '1rem' }}>
                  Grounded Factual Answer
                </span>
                <span className="badge badge-cyan">{response.detected_intent}</span>
              </div>

              <div style={{ display: 'flex', gap: '14px', fontSize: '0.75rem', color: '#94a3b8' }}>
                <span>Execution Time: <strong style={{ color: '#34d399' }}>{response.execution_time_ms} ms</strong></span>
                <span>Matched Records: <strong style={{ color: '#60a5fa' }}>{response.matched_record_count}</strong></span>
              </div>
            </div>

            <p style={{ fontSize: '1.1rem', fontWeight: 600, color: '#f1f5f9', lineHeight: 1.6, marginBottom: '16px' }}>
              {response.answer}
            </p>

            {/* Filter Criteria Pill Container */}
            <div style={{
              background: 'rgba(15, 23, 42, 0.6)',
              padding: '10px 16px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              fontSize: '0.78rem',
              color: '#94a3b8'
            }}>
              <Filter size={14} color="#06b6d4" />
              <span>Applied Verified Logic Filters:</span>
              <code style={{ color: '#22d3ee', fontFamily: 'var(--font-mono)' }}>
                {JSON.stringify(response.applied_filters)}
              </code>
            </div>
          </div>

          {/* Supporting Live Database Records Table */}
          <div className="glass-panel" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff' }}>
                  Supporting Live Database Records ({response.matched_record_count})
                </h3>
                <p style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                  Factual records retrieved from database justifying the conversational answer
                </p>
              </div>

              <button
                onClick={() => onNavigate('qa-analytics')}
                className="btn btn-secondary"
                style={{ fontSize: '0.78rem', padding: '6px 12px' }}
              >
                Inspect QA Query Logs & Latency <ArrowRight size={13} />
              </button>
            </div>

            {response.supporting_records?.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>
                No direct complaint rows met the exact filter constraints.
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table className="civic-table">
                  <thead>
                    <tr>
                      <th>Complaint ID</th>
                      <th>Category</th>
                      <th>Description</th>
                      <th>Location</th>
                      <th>Status</th>
                      <th>Source</th>
                    </tr>
                  </thead>
                  <tbody>
                    {response.supporting_records.slice(0, 15).map((r, idx) => (
                      <tr key={idx}>
                        <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#60a5fa', fontSize: '0.8rem' }}>
                          {r.complaint_id}
                        </td>
                        <td>
                          <span className="badge badge-purple">{r.predicted_category}</span>
                        </td>
                        <td style={{ maxWidth: '380px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {r.original_text}
                        </td>
                        <td style={{ color: '#94a3b8', fontSize: '0.82rem' }}>
                          {r.location || 'Unspecified'}
                        </td>
                        <td>
                          <span className="badge badge-blue">{r.status}</span>
                        </td>
                        <td style={{ fontSize: '0.75rem', color: '#64748b' }}>
                          {r.source}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
