import React, { useState, useEffect } from 'react';
import { GitFork, Search, Sparkles, Layers, MapPin, Clock, ArrowRight, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { api } from '../services/api';

export default function RelatedComplaintsScreen({ onNavigate, onSelectComplaint }) {
  const [complaintText, setComplaintText] = useState('Streetlight not working near the bus stand for three days');
  const [category, setCategory] = useState('Streetlights');
  const [location, setLocation] = useState('Bus Stand');
  const [loading, setLoading] = useState(false);
  const [matches, setMatches] = useState([]);
  const [issueGroups, setIssueGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);

  const loadGroups = async () => {
    try {
      const grps = await api.getIssueGroups();
      setIssueGroups(grps || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadGroups();
    handleCheck();
  }, []);

  const handleCheck = async (e) => {
    e?.preventDefault();
    if (!complaintText.trim()) return;
    setLoading(true);
    try {
      const res = await api.checkRelatedComplaints(complaintText, category, location);
      setMatches(res.matches || []);
    } catch (err) {
      alert(err.message || 'Related complaint check failed');
    } finally {
      setLoading(false);
    }
  };

  const getRelationBadge = (type) => {
    switch (type) {
      case 'LIKELY_DUPLICATE':
        return { label: 'Likely Duplicate', class: 'badge-amber' };
      case 'FOLLOW_UP_PERSISTING':
        return { label: 'Follow-Up Persisting', class: 'badge-rose' };
      case 'NEW_ISSUE_SAME_LOCATION':
        return { label: 'New Issue Same Location', class: 'badge-purple' };
      case 'NEW_REPORT_SAME_ISSUE':
      default:
        return { label: 'New Report Same Issue', class: 'badge-blue' };
    }
  };

  return (
    <div style={{ padding: '28px', maxWidth: '1400px', margin: '0 auto' }}>
      
      {/* Title */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
          <span className="badge badge-purple">Core Differentiator</span>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#fff' }}>
            Related Complaints & Issue Evolution Matching
          </h1>
        </div>
        <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>
          Distinguishes between duplicates, independent co-reports, persistent follow-ups, and localized infrastructure hotspots
          using TF-IDF cosine similarity, entity overlap, and temporal proximity.
        </p>
      </div>

      {/* Interactive Matcher */}
      <div className="glass-panel" style={{ padding: '24px', marginBottom: '28px' }}>
        <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#fff', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Search size={18} color="#60a5fa" /> Test Related-Issue Matching Pipeline
        </h3>

        <form onSubmit={handleCheck} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr auto', gap: '12px', marginBottom: '20px' }}>
          <input
            type="text"
            value={complaintText}
            onChange={(e) => setComplaintText(e.target.value)}
            placeholder="Complaint text..."
            className="input-field"
          />
          <input
            type="text"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="Category..."
            className="input-field"
          />
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Location..."
            className="input-field"
          />
          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary"
            style={{ padding: '10px 20px', whiteSpace: 'nowrap' }}
          >
            <Sparkles size={15} /> {loading ? 'Scanning...' : 'Find Related'}
          </button>
        </form>

        {/* Results Grid */}
        <div>
          <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#cbd5e1', marginBottom: '12px' }}>
            Historical Matches Found ({matches.length})
          </h4>

          {matches.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>
              No related issues detected above similarity threshold.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {matches.map((m, idx) => {
                const badge = getRelationBadge(m.relationship_type);
                return (
                  <div
                    key={idx}
                    style={{
                      background: 'rgba(15, 23, 42, 0.6)',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: '12px',
                      padding: '16px 20px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#60a5fa', fontSize: '0.85rem' }}>
                          {m.existing_complaint_id}
                        </span>
                        <span className={`badge ${badge.class}`}>{badge.label}</span>
                        <span className="badge badge-blue">{m.predicted_category}</span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '0.82rem', color: '#94a3b8' }}>Composite Match:</span>
                        <span style={{ fontSize: '1rem', fontWeight: 800, color: '#34d399' }}>
                          {(m.composite_score * 100).toFixed(1)}%
                        </span>
                      </div>
                    </div>

                    <p style={{ fontSize: '0.9rem', color: '#f1f5f9', lineHeight: 1.4 }}>
                      "{m.original_text}"
                    </p>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', color: '#94a3b8', borderTop: '1px solid rgba(255, 255, 255, 0.05)', paddingTop: '8px' }}>
                      <div style={{ display: 'flex', gap: '16px' }}>
                        <span>Location: <strong>{m.location || 'Unspecified'}</strong></span>
                        <span>Status: <strong>{m.existing_status}</strong></span>
                        <span>Delta: <strong>{m.days_delta} days</strong></span>
                      </div>
                      <div style={{ color: '#38bdf8', fontStyle: 'italic' }}>
                        {m.rationale}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Issue Groups Cluster View */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff', marginBottom: '14px' }}>
          Active Clustered Issue Groups
        </h3>

        {issueGroups.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>
            No issue groups formed yet. When citizens submit related complaints, clusters form automatically.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="civic-table">
              <thead>
                <tr>
                  <th>Group ID</th>
                  <th>Cluster Title</th>
                  <th>Category</th>
                  <th>Location</th>
                  <th>Complaints Count</th>
                  <th>Relation Type</th>
                  <th>Similarity</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {issueGroups.map(grp => (
                  <tr key={grp.group_id}>
                    <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#60a5fa' }}>
                      {grp.group_id}
                    </td>
                    <td style={{ fontWeight: 600, color: '#fff' }}>{grp.title}</td>
                    <td><span className="badge badge-purple">{grp.category}</span></td>
                    <td style={{ color: '#94a3b8' }}>{grp.location}</td>
                    <td style={{ fontWeight: 700, color: '#34d399' }}>{grp.complaint_ids?.length || 0}</td>
                    <td>
                      <span className={`badge ${getRelationBadge(grp.relation_type).class}`}>
                        {grp.relation_type}
                      </span>
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)', color: '#38bdf8' }}>
                      {(grp.similarity_score * 100).toFixed(1)}%
                    </td>
                    <td>
                      <button
                        onClick={() => {
                          if (onSelectComplaint && grp.primary_complaint_id) {
                            onSelectComplaint(grp.primary_complaint_id);
                          }
                          onNavigate('issue-timeline');
                        }}
                        className="btn btn-secondary"
                        style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                      >
                        Timeline <ArrowRight size={12} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
