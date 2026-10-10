import React, { useState, useEffect } from 'react';
import { ShoppingCart, TrendingUp, Link, BarChart2, RefreshCw, Info } from 'lucide-react';
import { api } from '../services/api';

const CAT_COLORS = {
  'Roads': '#f59e0b', 'Waste Management': '#10b981', 'Water Supply': '#3b82f6',
  'Drainage': '#8b5cf6', 'Streetlights': '#eab308', 'Sanitation': '#06b6d4',
  'Traffic': '#ef4444', 'Public Infrastructure': '#6366f1'
};

const ALL_CATS = ['Roads', 'Waste Management', 'Water Supply', 'Drainage', 'Streetlights', 'Sanitation', 'Traffic', 'Public Infrastructure'];

function HeatmapCell({ value, max }) {
  const ratio = max > 0 ? value / max : 0;
  const alpha = 0.08 + ratio * 0.85;
  return (
    <td style={{
      width: 52, height: 38, textAlign: 'center', fontSize: '0.72rem',
      background: value === 0 ? 'transparent' : `rgba(79,70,229,${alpha})`,
      color: ratio > 0.5 ? '#fff' : (value > 0 ? '#a78bfa' : 'var(--text-dim)'),
      border: '1px solid rgba(255,255,255,0.05)', fontWeight: value > 0 ? 600 : 400,
      transition: 'background 0.3s'
    }}>
      {value || '—'}
    </td>
  );
}

export default function MarketBasketPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [minSupport, setMinSupport] = useState(0.15);
  const [minConfidence, setMinConfidence] = useState(0.50);
  const [minLift, setMinLift] = useState(1.0);
  const [activeView, setActiveView] = useState('overview');

  const runAnalysis = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.runMarketBasket(minSupport, minConfidence, minLift);
      setData(res);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { runAnalysis(); }, []);

  const getCoMatrix = () => {
    if (!data?.co_occurrence_matrix) return {};
    return data.co_occurrence_matrix;
  };

  const maxCoOcc = () => {
    const mat = getCoMatrix();
    let max = 0;
    for (const a of ALL_CATS) for (const b of ALL_CATS) {
      if (a !== b) max = Math.max(max, mat[a]?.[b] || 0);
    }
    return max;
  };

  const tabStyle = (t) => ({
    padding: '8px 18px', borderRadius: 8, border: 'none', cursor: 'pointer',
    fontSize: '0.82rem', fontWeight: 600, transition: 'all 0.2s',
    background: activeView === t ? 'linear-gradient(135deg,#4f46e5,#8b5cf6)' : 'rgba(255,255,255,0.05)',
    color: activeView === t ? '#fff' : 'var(--text-muted)'
  });

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '28px 20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            width: 48, height: 48, borderRadius: 14,
            background: 'linear-gradient(135deg, #8b5cf6, #ec4899)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 8px 24px rgba(139,92,246,0.35)'
          }}>
            <ShoppingCart size={24} color="#fff" />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.65rem', fontWeight: 800, color: '#fff' }}>Market Basket Analysis</h1>
            <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              Concept 8 — Apriori Association Rule Mining on Civic Complaint Co-occurrences
            </p>
          </div>
        </div>
        <button onClick={runAnalysis} disabled={loading} style={{
          background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.35)',
          color: '#c4b5fd', borderRadius: 10, padding: '10px 18px', cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: 7, fontSize: '0.85rem', fontWeight: 600
        }}>
          <RefreshCw size={15} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
          {loading ? 'Mining...' : 'Re-run Analysis'}
        </button>
      </div>

      {/* Parameter Controls */}
      <div className="card" style={{ padding: 20, marginBottom: 20 }}>
        <p style={{ margin: '0 0 14px', fontWeight: 700, color: '#fff', fontSize: '0.9rem' }}>Apriori Parameters</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 20 }}>
          {[
            { label: 'Min Support', val: minSupport, set: setMinSupport, min: 0.05, step: 0.05, color: '#f59e0b',
              desc: 'Fraction of baskets containing the itemset' },
            { label: 'Min Confidence', val: minConfidence, set: setMinConfidence, min: 0.3, step: 0.05, color: '#10b981',
              desc: 'P(B|A) — how often B appears when A is present' },
            { label: 'Min Lift', val: minLift, set: setMinLift, min: 0.5, step: 0.25, color: '#8b5cf6',
              desc: 'How much more likely than random co-occurrence' },
          ].map(({ label, val, set, min, step, color, desc }) => (
            <div key={label}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: '0.82rem', fontWeight: 600, color }}>{label}</span>
                <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#fff' }}>{val.toFixed(2)}</span>
              </div>
              <input type="range" min={min} max={0.95} step={step} value={val}
                onChange={e => set(parseFloat(e.target.value))}
                style={{ width: '100%', accentColor: color }}
              />
              <p style={{ margin: '4px 0 0', fontSize: '0.7rem', color: 'var(--text-dim)' }}>{desc}</p>
            </div>
          ))}
        </div>
        <button onClick={runAnalysis} disabled={loading} className="btn btn-primary" style={{ marginTop: 16, padding: '9px 20px' }}>
          {loading ? 'Analyzing...' : '▶ Apply & Mine Rules'}
        </button>
      </div>

      {error && (
        <div style={{ padding: 14, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 10, marginBottom: 16 }}>
          <p style={{ margin: 0, color: '#f87171', fontSize: '0.85rem' }}>Error: {error}. Make sure the backend server is running.</p>
        </div>
      )}

      {data && (
        <>
          {/* KPI Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 20 }}>
            {[
              { label: 'Baskets Analyzed', value: data.total_baskets, icon: <ShoppingCart size={17} />, color: '#4f46e5' },
              { label: 'Association Rules', value: data.rules?.length || 0, icon: <Link size={17} />, color: '#8b5cf6' },
              { label: 'Frequent Itemsets', value: data.frequent_itemsets?.length || 0, icon: <TrendingUp size={17} />, color: '#10b981' },
              { label: 'Top Pairs Found', value: data.top_pairs?.length || 0, icon: <BarChart2 size={17} />, color: '#f59e0b' },
            ].map(({ label, value, icon, color }) => (
              <div key={label} className="card" style={{ padding: 18, textAlign: 'center' }}>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 8, color }}>{icon}</div>
                <div style={{ fontSize: '2rem', fontWeight: 800, color: '#fff' }}>{value}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{label}</div>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-dim)', marginTop: 2 }}>{data.data_source}</div>
              </div>
            ))}
          </div>

          {/* View Toggle */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            {['overview', 'heatmap', 'rules', 'insights'].map(t => (
              <button key={t} style={tabStyle(t)} onClick={() => setActiveView(t)}>
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>

          {/* Overview */}
          {activeView === 'overview' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              {/* Top Pairs */}
              <div className="card" style={{ padding: 20 }}>
                <h3 style={{ margin: '0 0 14px', fontSize: '0.95rem', fontWeight: 700, color: '#fff' }}>
                  🔗 Top Co-Occurring Pairs
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {data.top_pairs?.slice(0, 6).map((pair, i) => (
                    <div key={i}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <span style={{ fontSize: '0.82rem', color: '#e2e8f0', fontWeight: 600 }}>{pair.pair_str}</span>
                        <span style={{ fontSize: '0.78rem', color: '#a78bfa', fontWeight: 700 }}>{pair.co_occurrence_rate}%</span>
                      </div>
                      <div style={{ height: 6, background: 'rgba(255,255,255,0.08)', borderRadius: 4, overflow: 'hidden' }}>
                        <div style={{
                          height: '100%', borderRadius: 4,
                          background: 'linear-gradient(90deg, #8b5cf6, #ec4899)',
                          width: `${pair.co_occurrence_rate}%`, transition: 'width 0.8s ease'
                        }} />
                      </div>
                      <p style={{ margin: '2px 0 0', fontSize: '0.68rem', color: 'var(--text-dim)' }}>
                        {pair.co_occurrence_count} of {data.total_baskets} baskets
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Item Frequency */}
              <div className="card" style={{ padding: 20 }}>
                <h3 style={{ margin: '0 0 14px', fontSize: '0.95rem', fontWeight: 700, color: '#fff' }}>
                  📊 Category Frequency
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {Object.entries(data.item_frequencies_pct || {}).map(([cat, pct]) => (
                    <div key={cat}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                        <span style={{ fontSize: '0.8rem', color: CAT_COLORS[cat] || '#94a3b8', fontWeight: 600 }}>{cat}</span>
                        <span style={{ fontSize: '0.78rem', color: '#fff', fontWeight: 700 }}>{pct}%</span>
                      </div>
                      <div style={{ height: 5, background: 'rgba(255,255,255,0.07)', borderRadius: 3, overflow: 'hidden' }}>
                        <div style={{
                          height: '100%', borderRadius: 3,
                          background: CAT_COLORS[cat] || '#6366f1',
                          width: `${Math.min(pct, 100)}%`, transition: 'width 0.8s ease'
                        }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Heatmap */}
          {activeView === 'heatmap' && (
            <div className="card" style={{ padding: 24, overflowX: 'auto' }}>
              <h3 style={{ margin: '0 0 4px', fontSize: '0.95rem', fontWeight: 700, color: '#fff' }}>
                Co-Occurrence Heatmap
              </h3>
              <p style={{ margin: '0 0 16px', fontSize: '0.78rem', color: 'var(--text-dim)' }}>
                Cell values = number of baskets where both categories co-occurred. Darker = stronger association.
              </p>
              <table style={{ borderCollapse: 'collapse', width: '100%' }}>
                <thead>
                  <tr>
                    <th style={{ width: 140, fontSize: '0.72rem', color: 'var(--text-dim)', textAlign: 'right', paddingRight: 10 }}></th>
                    {ALL_CATS.map(cat => (
                      <th key={cat} style={{ width: 52, fontSize: '0.62rem', color: CAT_COLORS[cat], textAlign: 'center', writingMode: 'vertical-rl', transform: 'rotate(180deg)', padding: '6px 2px' }}>
                        {cat}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {ALL_CATS.map(rowCat => (
                    <tr key={rowCat}>
                      <td style={{ fontSize: '0.72rem', color: CAT_COLORS[rowCat], fontWeight: 600, textAlign: 'right', paddingRight: 10, whiteSpace: 'nowrap' }}>
                        {rowCat}
                      </td>
                      {ALL_CATS.map(colCat => (
                        <HeatmapCell
                          key={colCat}
                          value={rowCat === colCat ? 0 : (getCoMatrix()[rowCat]?.[colCat] || 0)}
                          max={maxCoOcc()}
                        />
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Rules Table */}
          {activeView === 'rules' && (
            <div className="card" style={{ padding: 24 }}>
              <h3 style={{ margin: '0 0 4px', fontSize: '0.95rem', fontWeight: 700, color: '#fff' }}>
                Association Rules (sorted by Lift)
              </h3>
              <p style={{ margin: '0 0 16px', fontSize: '0.78rem', color: 'var(--text-dim)' }}>
                Lift &gt; 1 means the co-occurrence is more frequent than random chance.
              </p>
              {data.rules?.length === 0 && (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  No rules found with current parameters. Try lowering min_support or min_confidence.
                </p>
              )}
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
                      {['Rule (A → B)', 'Support', 'Confidence', 'Lift', 'Interpretation'].map(h => (
                        <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data.rules?.slice(0, 15).map((rule, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid var(--border-color)' }}>
                        <td style={{ padding: '10px 14px' }}>
                          <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#e2e8f0' }}>
                            {rule.antecedent_str}
                          </span>
                          <span style={{ color: '#a78bfa', margin: '0 8px' }}>→</span>
                          <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#34d399' }}>
                            {rule.consequent_str}
                          </span>
                        </td>
                        <td style={{ padding: '10px 14px', fontSize: '0.82rem', color: '#f59e0b', fontWeight: 600 }}>
                          {(rule.support * 100).toFixed(1)}%
                        </td>
                        <td style={{ padding: '10px 14px', fontSize: '0.82rem', color: '#10b981', fontWeight: 600 }}>
                          {(rule.confidence * 100).toFixed(1)}%
                        </td>
                        <td style={{ padding: '10px 14px', fontSize: '0.82rem', color: '#8b5cf6', fontWeight: 700 }}>
                          {rule.lift.toFixed(2)}×
                        </td>
                        <td style={{ padding: '10px 14px', fontSize: '0.73rem', color: 'var(--text-muted)', maxWidth: 280, lineHeight: 1.4 }}>
                          {rule.interpretation}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Insights */}
          {activeView === 'insights' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {data.insights?.map((insight, i) => (
                <div key={i} className="card" style={{
                  padding: '18px 20px', display: 'flex', gap: 14, alignItems: 'flex-start',
                  borderLeft: `3px solid ${['#f59e0b','#10b981','#8b5cf6','#06b6d4'][i % 4]}`
                }}>
                  <Info size={18} color={['#f59e0b','#10b981','#8b5cf6','#06b6d4'][i % 4]} style={{ flexShrink: 0, marginTop: 2 }} />
                  <p style={{ margin: 0, fontSize: '0.9rem', color: '#e2e8f0', lineHeight: 1.65 }}>{insight}</p>
                </div>
              ))}
              <div className="card" style={{ padding: 20, background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.2)' }}>
                <h4 style={{ margin: '0 0 8px', color: '#c4b5fd', fontSize: '0.9rem' }}>📚 Academic Note</h4>
                <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-dim)', lineHeight: 1.65 }}>
                  <strong style={{ color: '#a78bfa' }}>Market Basket Analysis</strong> in CivicSense applies the <strong style={{ color: '#a78bfa' }}>Apriori algorithm</strong> — 
                  originally designed for retail transaction analysis — to civic complaint data. 
                  Each "basket" represents a set of complaint categories reported within the same geographic area or time period. 
                  Association rules of the form <code style={{ color: '#34d399', background: 'rgba(52,211,153,0.1)', padding: '1px 6px', borderRadius: 4 }}>A → B</code> reveal 
                  infrastructure interdependencies, enabling proactive joint maintenance planning.
                </p>
              </div>
            </div>
          )}
        </>
      )}

      {!data && !loading && !error && (
        <div className="card" style={{ padding: 40, textAlign: 'center' }}>
          <ShoppingCart size={40} color="var(--text-dim)" style={{ marginBottom: 12 }} />
          <p style={{ color: 'var(--text-muted)' }}>Click "Mine Rules" to start Market Basket Analysis</p>
        </div>
      )}

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
