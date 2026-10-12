import React from 'react';
import { ShieldCheck, UserCheck, LogOut, Sparkles, Activity, Layers, Sun, Moon } from 'lucide-react';

export default function Navbar({ user, onLogout, onOpenAuth, activeTab, setActiveTab, onToggleViewMode, theme = 'dark', onToggleTheme }) {
  const isOfficer = user?.role === 'officer';

  return (
    <header style={{
      borderBottom: '1px solid var(--border-color)',
      background: 'var(--topbar-bg)',
      backdropFilter: 'blur(12px)',
      position: 'sticky',
      top: 0,
      zIndex: 50,
      transition: 'background 0.25s ease'
    }}>
      <div style={{
        maxWidth: '1350px',
        margin: '0 auto',
        padding: '12px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '16px'
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
              <span style={{ fontSize: '1.2rem', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-main)' }}>CivicSense</span>
              <span className={`badge ${isOfficer ? 'badge-green' : 'badge-blue'}`} style={{ fontSize: '0.65rem' }}>
                {isOfficer ? 'Officer Workspace' : 'Citizen Portal'}
              </span>
            </div>
            <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Smart City Grievance Intelligence</p>
          </div>
        </div>

        {/* Role-Based Navigation Tabs */}
        {user?.role === 'citizen' && (
          <div style={{ display: 'flex', gap: '6px', background: 'var(--panel-bg)', padding: '4px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
            <button
              className="btn"
              style={{
                padding: '6px 14px',
                fontSize: '0.82rem',
                borderRadius: '8px',
                background: (!activeTab || activeTab === 'complaints') ? 'var(--primary)' : 'transparent',
                color: (!activeTab || activeTab === 'complaints') ? '#fff' : 'var(--text-muted)'
              }}
              onClick={() => setActiveTab('complaints')}
            >
              <UserCheck size={15} /> My Grievances
            </button>

            <button
              className="btn"
              style={{
                padding: '6px 14px',
                fontSize: '0.82rem',
                borderRadius: '8px',
                background: activeTab === 'multilingual' ? 'rgba(14, 165, 233, 0.2)' : 'transparent',
                color: activeTab === 'multilingual' ? '#0ea5e9' : 'var(--text-muted)'
              }}
              onClick={() => setActiveTab('multilingual')}
            >
              Multilingual Hub
            </button>

            <button
              className="btn"
              style={{
                padding: '6px 14px',
                fontSize: '0.82rem',
                borderRadius: '8px',
                background: activeTab === 'qachat' ? 'rgba(79, 70, 229, 0.2)' : 'transparent',
                color: activeTab === 'qachat' ? '#6366f1' : 'var(--text-muted)'
              }}
              onClick={() => setActiveTab('qachat')}
            >
              AI Helpdesk
            </button>
          </div>
        )}

        {user?.role === 'officer' && (
          <div style={{ display: 'flex', gap: '6px', background: 'var(--panel-bg)', padding: '4px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
            <button
              className="btn"
              style={{
                padding: '6px 14px',
                fontSize: '0.82rem',
                borderRadius: '8px',
                background: (!activeTab || activeTab === 'officer') ? '#0d9488' : 'transparent',
                color: (!activeTab || activeTab === 'officer') ? '#fff' : 'var(--text-muted)'
              }}
              onClick={() => setActiveTab('officer')}
            >
              <ShieldCheck size={15} /> Officer Operations
            </button>

            <button
              className="btn"
              style={{
                padding: '6px 14px',
                fontSize: '0.82rem',
                borderRadius: '8px',
                background: activeTab === 'eda' ? 'rgba(59, 130, 246, 0.2)' : 'transparent',
                color: activeTab === 'eda' ? '#3b82f6' : 'var(--text-muted)'
              }}
              onClick={() => setActiveTab('eda')}
            >
              City Analytics
            </button>

            <button
              className="btn"
              style={{
                padding: '6px 14px',
                fontSize: '0.82rem',
                borderRadius: '8px',
                background: activeTab === 'marketbasket' ? 'rgba(245, 158, 11, 0.2)' : 'transparent',
                color: activeTab === 'marketbasket' ? '#f59e0b' : 'var(--text-muted)'
              }}
              onClick={() => setActiveTab('marketbasket')}
            >
              Association Mining
            </button>
          </div>
        )}

        {/* User Session & Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          
          {/* Light / Dark Mode Toggle */}
          {onToggleTheme && (
            <button
              onClick={onToggleTheme}
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: 'var(--panel-bg)',
                border: '1px solid var(--border-color)',
                color: theme === 'dark' ? '#fbbf24' : '#4f46e5',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
            </button>
          )}

          {/* Switch to Dedicated Suite */}
          {onToggleViewMode && (
            <button
              className="btn"
              style={{
                padding: '6px 12px',
                fontSize: '0.78rem',
                fontWeight: 700,
                borderRadius: '8px',
                background: 'rgba(56, 189, 248, 0.12)',
                border: '1px solid var(--border-color)',
                color: '#0284c7',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                cursor: 'pointer'
              }}
              onClick={onToggleViewMode}
              title="Switch to Intelligence Workspace"
            >
              <Sparkles size={14} />
              <span>Full Workspace</span>
            </button>
          )}

          {user && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>{user.name}</p>
                <span className={`badge ${isOfficer ? 'badge-green' : 'badge-blue'}`} style={{ fontSize: '0.62rem', padding: '1px 6px' }}>
                  {user.role}
                </span>
              </div>
              <button className="btn btn-secondary" style={{ padding: '8px 10px' }} onClick={onLogout} title="Logout">
                <LogOut size={15} color="#ef4444" />
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

