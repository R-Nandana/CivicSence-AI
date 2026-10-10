import React from 'react';
import { ShieldCheck, UserCheck, LogOut, Sparkles, Activity, Layers } from 'lucide-react';

export default function Navbar({ user, onLogout, onOpenAuth, activeTab, setActiveTab, onToggleViewMode }) {
  return (
    <header style={{
      borderBottom: '1px solid var(--border-color)',
      background: 'rgba(9, 13, 22, 0.85)',
      backdropFilter: 'blur(12px)',
      position: 'sticky',
      top: 0,
      zIndex: 50
    }}>
      <div style={{
        maxWidth: '1300px',
        margin: '0 auto',
        padding: '14px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        {/* Brand Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '38px',
            height: '38px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #4f46e5 0%, #06b6d4 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontWeight: 800,
            fontSize: '1.2rem',
            boxShadow: '0 4px 12px rgba(79, 70, 229, 0.35)'
          }}>
            C
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '1.2rem', fontWeight: 800, letterSpacing: '-0.02em', color: '#fff' }}>CivicSense</span>
              <span className="badge badge-purple" style={{ fontSize: '0.65rem' }}>Phase I NLP</span>
            </div>
            <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Complaint Intelligence & Resolution System</p>
          </div>
        </div>

        {/* Role-Based Portal Navigation Tabs */}
        {user?.role === 'citizen' && (
          <div style={{ display: 'flex', gap: '6px', background: 'rgba(255,255,255,0.04)', padding: '4px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
            <button
              className="btn"
              style={{
                padding: '6px 14px',
                fontSize: '0.82rem',
                borderRadius: '8px',
                background: (!activeTab || activeTab === 'complaints') ? '#4f46e5' : 'transparent',
                color: (!activeTab || activeTab === 'complaints') ? '#fff' : 'var(--text-muted)'
              }}
              onClick={() => setActiveTab('complaints')}
            >
              <UserCheck size={15} /> Citizen Complaint Portal
            </button>

            <button
              className="btn"
              style={{
                padding: '6px 14px',
                fontSize: '0.82rem',
                borderRadius: '8px',
                background: activeTab === 'multilingual' ? 'rgba(14, 165, 233, 0.2)' : 'transparent',
                color: activeTab === 'multilingual' ? '#38bdf8' : 'var(--text-muted)'
              }}
              onClick={() => setActiveTab('multilingual')}
            >
              Universal MT
            </button>

            <button
              className="btn"
              style={{
                padding: '6px 14px',
                fontSize: '0.82rem',
                borderRadius: '8px',
                background: activeTab === 'qachat' ? 'rgba(79, 70, 229, 0.2)' : 'transparent',
                color: activeTab === 'qachat' ? '#818cf8' : 'var(--text-muted)'
              }}
              onClick={() => setActiveTab('qachat')}
            >
              QA & Chatbot
            </button>
          </div>
        )}

        {user?.role === 'officer' && (
          <div style={{ display: 'flex', gap: '6px', background: 'rgba(255,255,255,0.04)', padding: '4px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
            <button
              className="btn"
              style={{
                padding: '6px 14px',
                fontSize: '0.82rem',
                borderRadius: '8px',
                background: activeTab === 'officer' ? '#059669' : 'transparent',
                color: activeTab === 'officer' ? '#fff' : 'var(--text-muted)'
              }}
              onClick={() => setActiveTab('officer')}
            >
              <ShieldCheck size={15} /> Officer Control Center
            </button>

            <button
              className="btn"
              style={{
                padding: '6px 14px',
                fontSize: '0.82rem',
                borderRadius: '8px',
                background: activeTab === 'eda' ? 'rgba(168, 85, 247, 0.2)' : 'transparent',
                color: activeTab === 'eda' ? '#c084fc' : 'var(--text-muted)'
              }}
              onClick={() => setActiveTab('eda')}
            >
              <Activity size={15} /> EDA & Model Metrics
            </button>

            <button
              className="btn"
              style={{
                padding: '6px 14px',
                fontSize: '0.82rem',
                borderRadius: '8px',
                background: activeTab === 'marketbasket' ? 'rgba(245, 158, 11, 0.2)' : 'transparent',
                color: activeTab === 'marketbasket' ? '#fbbf24' : 'var(--text-muted)'
              }}
              onClick={() => setActiveTab('marketbasket')}
            >
              Market Basket
            </button>
          </div>
        )}


        {/* User Session / Auth Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Toggle between 1st UI and 21-Screen Suite */}
          {onToggleViewMode && (
            <button
              className="btn"
              style={{
                padding: '6px 14px',
                fontSize: '0.78rem',
                fontWeight: 700,
                borderRadius: '8px',
                background: 'rgba(56, 189, 248, 0.12)',
                border: '1px solid rgba(56, 189, 248, 0.35)',
                color: '#38bdf8',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                cursor: 'pointer'
              }}
              onClick={onToggleViewMode}
              title="Switch to 21-Screen Dedicated Intelligence Suite"
            >
              <Sparkles size={14} color="#38bdf8" />
              <span>21-Screen Suite</span>
            </button>
          )}

          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              {user.role === 'citizen' && (
                <button
                  className="btn"
                  style={{
                    padding: '6px 14px',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    background: 'rgba(13, 148, 136, 0.15)',
                    border: '1px solid rgba(13, 148, 136, 0.4)',
                    color: '#2dd4bf',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    borderRadius: '8px',
                    cursor: 'pointer'
                  }}
                  onClick={() => onOpenAuth('officer')}
                  title="Sign In as Municipal Officer"
                >
                  <ShieldCheck size={14} color="#2dd4bf" />
                  <span>Municipal Officer Login</span>
                </button>
              )}

              <div style={{ textAlign: 'right' }}>
                <p style={{ fontSize: '0.85rem', fontWeight: 600, color: '#fff' }}>{user.name}</p>
                <span className={`badge ${user.role === 'officer' ? 'badge-green' : 'badge-blue'}`} style={{ fontSize: '0.65rem' }}>
                  {user.role}
                </span>
              </div>
              <button className="btn btn-secondary" style={{ padding: '8px 12px' }} onClick={onLogout} title="Logout">
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                className="btn btn-secondary"
                style={{ padding: '7px 16px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px' }}
                onClick={() => onOpenAuth('citizen')}
              >
                <UserCheck size={14} color="#60a5fa" /> Citizen Sign In
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

