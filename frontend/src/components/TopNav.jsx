import React from 'react';
import { ShieldCheck, UserCheck, Activity, Cpu, Sparkles, CheckCircle2, LogOut, Sun, Moon } from 'lucide-react';

export default function TopNav({ activeScreen, user, onSwitchRole, onLogout, onToggleViewMode, theme = 'dark', onToggleTheme }) {
  const getScreenTitle = (id) => {
    const titles = {
      "login": "CivicSense Secure Authentication Portal",
      "citizen-dashboard": "Citizen Grievance & Issue Tracking Hub",
      "text-submission": "File New Municipal Grievance",
      "voice-record": "Voice Grievance Recording & Speech-to-Text",
      "image-upload": "Photo Evidence Attachment",
      "video-upload": "Video Evidence Attachment",
      "issue-timeline": "Grievance Evolution & Audit Timeline",
      "text-classification": "AI Grievance Classification Engine",
      "ner-results": "Civic Named Entity Recognition (NER)",
      "multilingual": "Universal Multilingual NLP & Translation Hub",
      "translation": "Cross-Lingual Machine Translation & BLEU",
      "speech-results": "Voice Acoustic Analytics & Speech Benchmarks",
      "qa-interface": "Database-Grounded Citizen AI Helpdesk",
      "qa-analytics": "Municipal Knowledge Base & Query Audits",
      "image-analysis": "Visual Evidence Verification Lab",
      "video-analysis": "Video Keyframe Evidence Inspection",
      "admin-dashboard": "Municipal Operations Command Center & Analytics",
      "related-complaints": "Duplicate & Related Issue Cluster Intelligence",
      "resolution-alerts": "Resolution Monitoring & Audit Alerts",
      "human-validation": "Officer Verification & Active Learning Review",
      "eda-dashboard": "City Grievance Open Data & ETL Analytics"
    };
    return titles[id] || "CivicSense AI Smart City Portal";
  };

  const isOfficer = user?.role === 'officer';

  return (
    <header style={{
      height: '64px',
      background: 'var(--topbar-bg)',
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
      borderBottom: '1px solid var(--header-border)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 28px',
      position: 'sticky',
      top: 0,
      zIndex: 30,
      transition: 'background 0.25s ease, border-color 0.25s ease'
    }}>
      {/* Current Screen Title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <h2 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.01em', margin: 0 }}>
          {getScreenTitle(activeScreen)}
        </h2>
        <span style={{
          fontSize: '0.68rem',
          padding: '2px 8px',
          borderRadius: '9999px',
          background: 'rgba(16, 185, 129, 0.15)',
          color: '#10b981',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          fontWeight: 600
        }}>
          <CheckCircle2 size={11} /> Models Ready
        </span>
      </div>

      {/* Right Actions & Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        
        {/* Interactive Light / Dark Mode Toggle Button */}
        {onToggleTheme && (
          <button
            onClick={onToggleTheme}
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            style={{
              width: '38px',
              height: '38px',
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
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        )}

        {/* View Switcher: Classic 1st UI */}
        {onToggleViewMode && (
          <button
            onClick={onToggleViewMode}
            title="Switch to Classic Portal"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              fontSize: '0.74rem',
              fontWeight: 700,
              background: 'rgba(99, 102, 241, 0.12)',
              color: 'var(--primary)',
              border: '1px solid var(--border-color)',
              borderRadius: '8px',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            <Sparkles size={13} />
            <span>Classic View</span>
          </button>
        )}

        {/* User Capsule */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '4px 12px',
          background: 'var(--panel-bg)',
          border: '1px solid var(--border-color)',
          borderRadius: '9999px'
        }}>
          <div style={{
            width: '28px',
            height: '28px',
            borderRadius: '50%',
            background: isOfficer ? '#0f766e' : '#1d4ed8',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '0.75rem',
            fontWeight: 800
          }}>
            {user?.name?.[0]?.toUpperCase() || 'U'}
          </div>
          <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-main)' }}>
            {user?.name || (isOfficer ? 'Municipal Officer' : 'Citizen')}
          </span>
          <span className={`badge ${isOfficer ? 'badge-green' : 'badge-blue'}`} style={{ fontSize: '0.62rem', padding: '1px 6px' }}>
            {isOfficer ? 'OFFICER' : 'CITIZEN'}
          </span>
        </div>

        {/* Sign Out Button */}
        {onLogout && (
          <button
            onClick={onLogout}
            title="Sign Out"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              fontSize: '0.75rem',
              fontWeight: 700,
              background: 'rgba(239, 68, 68, 0.12)',
              color: '#ef4444',
              border: '1px solid rgba(239, 68, 68, 0.28)',
              borderRadius: '8px',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            <LogOut size={13} />
            <span>Sign Out</span>
          </button>
        )}
      </div>
    </header>
  );
}

