import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, HelpCircle, Send, Bot, User, Trash2, Sparkles, BookOpen, ChevronDown, ChevronUp } from 'lucide-react';
import { api } from '../services/api';

const CATEGORY_COLORS = {
  Roads: '#f59e0b', 'Water Supply': '#3b82f6', Drainage: '#8b5cf6',
  Streetlights: '#eab308', 'Waste Management': '#10b981', Sanitation: '#06b6d4',
  Traffic: '#ef4444', 'Public Infrastructure': '#6366f1', General: '#6b7280', Technical: '#ec4899'
};

const SUGGESTED_QUESTIONS = [
  'How do I report a pothole?',
  'What languages can I use to submit?',
  'How does the AI classify complaints?',
  'What is the resolution time for water supply?',
  'Who handles drainage problems?',
  'What is NER in CivicSense?',
  'How does market basket analysis help?',
];

export default function QAChatPage() {
  const [activeTab, setActiveTab] = useState('chat');

  // QA State
  const [qaQuestion, setQaQuestion] = useState('');
  const [qaResult, setQaResult] = useState(null);
  const [qaLoading, setQaLoading] = useState(false);
  const [faqs, setFaqs] = useState([]);
  const [faqsLoaded, setFaqsLoaded] = useState(false);
  const [expandedFaq, setExpandedFaq] = useState(null);

  // Chat State
  const [chatMessages, setChatMessages] = useState([
    {
      role: 'assistant',
      content: "👋 Hello! I'm CivicAssist, your AI-powered civic governance chatbot. I can help you file complaints, understand the AI pipeline, or answer questions about municipal services. How can I help you today?",
      timestamp: new Date().toISOString()
    }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [sessionId] = useState(() => `session_${Date.now()}`);
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const loadFaqs = async () => {
    if (faqsLoaded) return;
    try {
      const res = await api.getAllFaqs();
      setFaqs(res.faqs || []);
      setFaqsLoaded(true);
    } catch (e) {
      setFaqs([]);
    }
  };

  useEffect(() => {
    if (activeTab === 'qa') loadFaqs();
  }, [activeTab]);

  const handleQA = async (q = null) => {
    const question = q || qaQuestion;
    if (!question.trim()) return;
    setQaLoading(true);
    setQaResult(null);
    if (q) setQaQuestion(q);
    try {
      const res = await api.askQuestion(question);
      setQaResult(res);
    } catch (e) {
      setQaResult({ error: e.message });
    } finally {
      setQaLoading(false);
    }
  };

  const handleChat = async () => {
    if (!chatInput.trim() || chatLoading) return;
    const userMsg = chatInput.trim();
    setChatInput('');
    setChatMessages(prev => [...prev, { role: 'user', content: userMsg, timestamp: new Date().toISOString() }]);
    setChatLoading(true);
    try {
      const res = await api.chatMessage(userMsg, sessionId);
      setChatMessages(prev => [...prev, {
        role: 'assistant',
        content: res.response,
        intent: res.intent,
        engine: res.engine,
        timestamp: res.timestamp
      }]);
    } catch (e) {
      setChatMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please ensure the backend is running.',
        timestamp: new Date().toISOString()
      }]);
    } finally {
      setChatLoading(false);
    }
  };

  const clearChat = async () => {
    try { await api.clearChatSession(sessionId); } catch (e) {}
    setChatMessages([{
      role: 'assistant',
      content: "Session cleared! I'm ready for a fresh conversation. How can I help you?",
      timestamp: new Date().toISOString()
    }]);
  };

  const tabStyle = (tab) => ({
    padding: '10px 22px', borderRadius: '10px', border: 'none', cursor: 'pointer',
    fontSize: '0.88rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '7px',
    transition: 'all 0.2s',
    background: activeTab === tab ? 'linear-gradient(135deg, #4f46e5, #06b6d4)' : 'rgba(255,255,255,0.05)',
    color: activeTab === tab ? '#fff' : 'var(--text-muted)',
    boxShadow: activeTab === tab ? '0 4px 14px rgba(79,70,229,0.35)' : 'none'
  });

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '28px 20px' }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
          <div style={{
            width: 44, height: 44, borderRadius: 12,
            background: 'linear-gradient(135deg, #4f46e5, #06b6d4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <Sparkles size={22} color="#fff" />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-main)' }}>
              AI Question Answering & Chatbot
            </h1>
            <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              Concept 6 (QA System) + Concept 7 (Chatbot) — Powered by Google Gemini 1.5 Flash
            </p>
          </div>
        </div>
        {/* Tab Switch */}
        <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
          <button style={tabStyle('chat')} onClick={() => setActiveTab('chat')}>
            <MessageCircle size={16} /> Chatbot
          </button>
          <button style={tabStyle('qa')} onClick={() => setActiveTab('qa')}>
            <HelpCircle size={16} /> Question Answering
          </button>
        </div>
      </div>

      {/* ── CHATBOT TAB ── */}
      {activeTab === 'chat' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 20 }}>
          {/* Chat Window */}
          <div className="card" style={{ padding: 0, display: 'flex', flexDirection: 'column', height: 580 }}>
            {/* Chat Header */}
            <div style={{
              padding: '16px 20px', borderBottom: '1px solid var(--border-color)',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              background: 'rgba(79,70,229,0.08)', borderRadius: '12px 12px 0 0'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: '50%',
                  background: 'linear-gradient(135deg, #4f46e5, #06b6d4)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  <Bot size={18} color="#fff" />
                </div>
                <div>
                  <p style={{ margin: 0, fontWeight: 700, color: 'var(--text-main)', fontSize: '0.9rem' }}>CivicAssist AI</p>
                  <p style={{ margin: 0, fontSize: '0.72rem', color: '#10b981' }}>● Online — Gemini Powered</p>
                </div>
              </div>
              <button onClick={clearChat} style={{
                background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)',
                color: '#ef4444', borderRadius: 8, padding: '6px 12px', cursor: 'pointer',
                fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: 5
              }}>
                <Trash2 size={13} /> Clear
              </button>
            </div>

            {/* Messages */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
              {chatMessages.map((msg, i) => (
                <div key={i} style={{
                  display: 'flex', gap: 10, flexDirection: msg.role === 'user' ? 'row-reverse' : 'row',
                  alignItems: 'flex-end'
                }}>
                  <div style={{
                    width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
                    background: msg.role === 'user'
                      ? 'linear-gradient(135deg, #06b6d4, #3b82f6)'
                      : 'linear-gradient(135deg, #4f46e5, #7c3aed)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    {msg.role === 'user' ? <User size={15} color="#fff" /> : <Bot size={15} color="#fff" />}
                  </div>
                  <div style={{ maxWidth: '78%' }}>
                    <div style={{
                      padding: '10px 14px', borderRadius: msg.role === 'user' ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                      background: msg.role === 'user'
                        ? 'linear-gradient(135deg, rgba(6,182,212,0.2), rgba(59,130,246,0.2))'
                        : 'rgba(255,255,255,0.06)',
                      border: '1px solid',
                      borderColor: msg.role === 'user' ? 'rgba(6,182,212,0.25)' : 'rgba(255,255,255,0.08)',
                      fontSize: '0.88rem', color: '#e2e8f0', lineHeight: 1.55
                    }}>
                      {msg.content}
                    </div>
                    {msg.engine && (
                      <p style={{ margin: '3px 0 0 4px', fontSize: '0.68rem', color: 'var(--text-dim)' }}>
                        {msg.engine} {msg.intent && `· ${msg.intent}`}
                      </p>
                    )}
                  </div>
                </div>
              ))}
              {chatLoading && (
                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  <div style={{
                    width: 30, height: 30, borderRadius: '50%',
                    background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    <Bot size={15} color="#fff" />
                  </div>
                  <div style={{
                    padding: '10px 16px', borderRadius: '14px 14px 14px 4px',
                    background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)',
                    display: 'flex', gap: 5, alignItems: 'center'
                  }}>
                    {[0,1,2].map(n => (
                      <div key={n} style={{
                        width: 7, height: 7, borderRadius: '50%', background: '#4f46e5',
                        animation: `bounce 1.2s ease-in-out ${n * 0.2}s infinite`
                      }} />
                    ))}
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Input */}
            <div style={{
              padding: '14px 16px', borderTop: '1px solid var(--border-color)',
              display: 'flex', gap: 10
            }}>
              <input
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleChat()}
                placeholder="Ask about civic issues, complaints, or the AI system..."
                style={{
                  flex: 1, background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border-color)',
                  borderRadius: 10, padding: '10px 14px', color: '#fff', fontSize: '0.88rem',
                  outline: 'none'
                }}
              />
              <button onClick={handleChat} disabled={chatLoading || !chatInput.trim()} style={{
                background: 'linear-gradient(135deg, #4f46e5, #06b6d4)',
                border: 'none', borderRadius: 10, padding: '10px 16px',
                cursor: chatLoading ? 'not-allowed' : 'pointer',
                opacity: chatLoading || !chatInput.trim() ? 0.5 : 1
              }}>
                <Send size={17} color="#fff" />
              </button>
            </div>
          </div>

          {/* Quick Questions Sidebar */}
          <div className="card" style={{ padding: 18, height: 'fit-content' }}>
            <p style={{ margin: '0 0 14px', fontWeight: 700, color: '#fff', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: 7 }}>
              <Sparkles size={15} color="#a78bfa" /> Quick Questions
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {SUGGESTED_QUESTIONS.map((q, i) => (
                <button key={i} onClick={() => { setChatInput(q); }}
                  style={{
                    background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border-color)',
                    borderRadius: 8, padding: '8px 12px', color: 'var(--text-muted)', fontSize: '0.78rem',
                    textAlign: 'left', cursor: 'pointer', transition: 'all 0.2s', lineHeight: 1.4
                  }}
                  onMouseEnter={e => { e.target.style.background = 'rgba(79,70,229,0.15)'; e.target.style.color = '#c4b5fd'; }}
                  onMouseLeave={e => { e.target.style.background = 'rgba(255,255,255,0.04)'; e.target.style.color = 'var(--text-muted)'; }}
                >
                  {q}
                </button>
              ))}
            </div>
            <div style={{ marginTop: 18, padding: 12, background: 'rgba(16,185,129,0.08)', borderRadius: 10, border: '1px solid rgba(16,185,129,0.2)' }}>
              <p style={{ margin: 0, fontSize: '0.75rem', color: '#34d399', fontWeight: 600 }}>Concept 7: Chatbot</p>
              <p style={{ margin: '4px 0 0', fontSize: '0.72rem', color: 'var(--text-dim)' }}>
                Multi-turn conversation with session memory. Intent detection + Gemini LLM. Rule-based fallback when offline.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── QA TAB ── */}
      {activeTab === 'qa' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 20 }}>
          {/* QA Panel */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Question Input */}
            <div className="card" style={{ padding: 24 }}>
              <h2 style={{ margin: '0 0 16px', fontSize: '1.1rem', fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', gap: 8 }}>
                <HelpCircle size={18} color="#4f46e5" /> Ask a Civic Question
              </h2>
              <div style={{ display: 'flex', gap: 10 }}>
                <input
                  value={qaQuestion}
                  onChange={e => setQaQuestion(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleQA()}
                  placeholder="e.g. How does the AI classify my complaint?"
                  style={{
                    flex: 1, background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border-color)',
                    borderRadius: 10, padding: '11px 14px', color: '#fff', fontSize: '0.9rem', outline: 'none'
                  }}
                />
                <button onClick={() => handleQA()} disabled={qaLoading || !qaQuestion.trim()} className="btn btn-primary"
                  style={{ padding: '11px 20px', opacity: qaLoading ? 0.6 : 1 }}>
                  {qaLoading ? '...' : 'Ask'}
                </button>
              </div>

              {/* Suggested Questions */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginTop: 14 }}>
                {SUGGESTED_QUESTIONS.slice(0, 4).map((q, i) => (
                  <button key={i} onClick={() => handleQA(q)} style={{
                    background: 'rgba(79,70,229,0.1)', border: '1px solid rgba(79,70,229,0.25)',
                    borderRadius: 20, padding: '5px 12px', color: '#a78bfa', fontSize: '0.75rem',
                    cursor: 'pointer'
                  }}>
                    {q}
                  </button>
                ))}
              </div>
            </div>

            {/* Answer Result */}
            {qaLoading && (
              <div className="card" style={{ padding: 24, textAlign: 'center' }}>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>🔍 Searching knowledge base + querying Gemini...</div>
              </div>
            )}
            {qaResult && !qaResult.error && (
              <div className="card" style={{ padding: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#34d399' }}>
                    {qaResult.engine}
                  </span>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                      Confidence: {((qaResult.confidence || 0) * 100).toFixed(0)}%
                    </span>
                    {qaResult.category && (
                      <span style={{
                        background: `${CATEGORY_COLORS[qaResult.category] || '#6b7280'}22`,
                        border: `1px solid ${CATEGORY_COLORS[qaResult.category] || '#6b7280'}44`,
                        color: CATEGORY_COLORS[qaResult.category] || '#9ca3af',
                        borderRadius: 6, padding: '2px 8px', fontSize: '0.72rem', fontWeight: 600
                      }}>
                        {qaResult.category}
                      </span>
                    )}
                  </div>
                </div>
                <p style={{ margin: '0 0 4px', fontWeight: 700, color: 'var(--text-muted)', fontSize: '0.8rem' }}>Q: {qaResult.question}</p>
                <div style={{
                  padding: 16, background: 'rgba(79,70,229,0.08)', borderRadius: 10,
                  border: '1px solid rgba(79,70,229,0.2)', marginTop: 8
                }}>
                  <p style={{ margin: 0, color: '#e2e8f0', lineHeight: 1.65, fontSize: '0.92rem' }}>{qaResult.answer}</p>
                </div>
                {qaResult.related_faqs?.length > 0 && (
                  <div style={{ marginTop: 14 }}>
                    <p style={{ margin: '0 0 8px', fontSize: '0.78rem', color: 'var(--text-dim)', fontWeight: 600 }}>Related Questions:</p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {qaResult.related_faqs.map((f, i) => (
                        <button key={i} onClick={() => handleQA(f.question)} style={{
                          background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)',
                          borderRadius: 20, padding: '4px 10px', color: 'var(--text-muted)', fontSize: '0.72rem', cursor: 'pointer'
                        }}>
                          {f.question}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
            {qaResult?.error && (
              <div className="card" style={{ padding: 16, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
                <p style={{ margin: 0, color: '#f87171', fontSize: '0.85rem' }}>Error: {qaResult.error}</p>
              </div>
            )}
          </div>

          {/* FAQ Browser */}
          <div className="card" style={{ padding: 18, maxHeight: 600, overflowY: 'auto' }}>
            <p style={{ margin: '0 0 14px', fontWeight: 700, color: '#fff', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: 7 }}>
              <BookOpen size={15} color="#a78bfa" /> FAQ Knowledge Base
            </p>
            {!faqsLoaded && <p style={{ color: 'var(--text-dim)', fontSize: '0.82rem' }}>Loading FAQs...</p>}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {faqs.map((faq, i) => (
                <div key={i} style={{
                  background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border-color)',
                  borderRadius: 10, overflow: 'hidden'
                }}>
                  <button onClick={() => setExpandedFaq(expandedFaq === i ? null : i)} style={{
                    width: '100%', padding: '10px 12px', background: 'none', border: 'none',
                    color: '#c4b5fd', fontSize: '0.78rem', textAlign: 'left', cursor: 'pointer',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 6, fontWeight: 600
                  }}>
                    <span>{faq.question}</span>
                    {expandedFaq === i ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                  </button>
                  {expandedFaq === i && (
                    <div style={{ padding: '0 12px 12px', borderTop: '1px solid var(--border-color)' }}>
                      <p style={{ margin: '10px 0 8px', fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.55 }}>{faq.answer}</p>
                      <button onClick={() => { handleQA(faq.question); setActiveTab('qa'); }} style={{
                        background: 'rgba(79,70,229,0.15)', border: '1px solid rgba(79,70,229,0.3)',
                        borderRadius: 6, padding: '4px 10px', color: '#a78bfa', fontSize: '0.7rem', cursor: 'pointer'
                      }}>
                        Ask this ↗
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div style={{ marginTop: 14, padding: 12, background: 'rgba(79,70,229,0.08)', borderRadius: 10, border: '1px solid rgba(79,70,229,0.2)' }}>
              <p style={{ margin: 0, fontSize: '0.75rem', color: '#818cf8', fontWeight: 600 }}>Concept 6: QA System</p>
              <p style={{ margin: '4px 0 0', fontSize: '0.72rem', color: 'var(--text-dim)' }}>
                Generative QA via Gemini + BM25-style extractive retrieval from {faqs.length} FAQ entries.
              </p>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes bounce {
          0%, 80%, 100% { transform: scale(0); opacity: 0.3; }
          40% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
