import React from 'react';
import { ShieldCheck, UserCheck, Activity, Cpu, Sparkles, CheckCircle2, LogOut } from 'lucide-react';

export default function TopNav({ activeScreen, user, onSwitchRole, onLogout, onToggleViewMode }) {
  const getScreenTitle = (id) => {
    const titles = {
      "login": "CivicSense Secure Authentication & Login",
      "citizen-dashboard": "Citizen Complaint Dashboard",
      "text-submission": "Live Text Complaint Submission",
      "voice-record": "Voice Complaint Recording & ASR",
      "image-upload": "Image Evidence Submission",
      "video-upload": "Video Evidence Submission",
      "issue-timeline": "Issue Evolution & Audit Timeline",
      "text-classification": "Concept 1: Text Classification (TF-IDF + Softmax)",
      "ner-results": "Concept 2: Named Entity Recognition (NER)",
      "multilingual": "Concept 3: Multilingual NLP & Tanglish",
      "translation": "Concept 4: Domain Machine Translation (BLEU)",
      "speech-results": "Concept 5: Speech Processing & Acoustic WER",
      "qa-interface": "Concept 6: Database-Grounded Question Answering",
      "qa-analytics": "QA Query Analytics & Grounded Audit Logs",
      "image-analysis": "Computer Vision: Image Evidence Verification",
      "video-analysis": "Computer Vision: Video Keyframe Evidence Verification",
      "admin-dashboard": "Municipal Officer Control Center & Analytics",
      "related-complaints": "Related Complaints & Issue Evolution Matching",
      "resolution-alerts": "Resolution Monitoring & Inconsistency Alerts",
      "human-validation": "Human-in-the-Loop AI Validation & Feedback",
      "eda-dashboard": "Exploratory Data Analysis (EDA) & NYC 311 ETL"
    };
    return titles[id] || "CivicSense AI Portal";
  };

  const isOfficer = user?.role === 'officer';

  return (
    <header style={{
      height: '64px',
      background: 'rgba(10, 15, 29, 0.95)',
      backdropFilter: 'blur(12px)',
      borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 28px',
      position: 'sticky',
      top: 0,
      zIndex: 30
    }}>
      {/* Current Screen Title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <h2 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#fff', letterSpacing: '-0.01em' }}>
          {getScreenTitle(activeScreen)}
        </h2>
        <span style={{
          fontSize: '0.68rem',
          padding: '2px 8px',
          borderRadius: '9999px',
          background: 'rgba(16, 185, 129, 0.15)',
          color: '#34d399',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          display: 'flex',
          alignItems: 'center',
          gap: '4px'
        }}>
          <CheckCircle2 size={11} /> Models Ready
        </span>
      </div>

      {/* Right Actions & Role Toggle */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        {/* Quick Academic Role Switcher */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          background: 'rgba(255, 255, 255, 0.05)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '8px',
          padding: '2px'
        }}>
          <button
            onClick={() => onSwitchRole('citizen')}
            style={{
              padding: '4px 10px',
              fontSize: '0.72rem',
              fontWeight: 700,
              borderRadius: '6px',
              border: 'none',
              cursor: 'pointer',
              background: !isOfficer ? '#2563eb' : 'transparent',
              color: !isOfficer ? '#fff' : '#94a3b8',
              transition: 'all 0.15s ease'
            }}
          >
            Citizen Mode
          </button>
          <button
            onClick={() => onSwitchRole('officer')}
            style={{
              padding: '4px 10px',
              fontSize: '0.72rem',
              fontWeight: 700,
              borderRadius: '6px',
              border: 'none',
              cursor: 'pointer',
              background: isOfficer ? '#0d9488' : 'transparent',
              color: isOfficer ? '#fff' : '#94a3b8',
              transition: 'all 0.15s ease'
            }}
          >
            Officer Mode
          </button>
        </div>

        {/* Switch to Classic Portal (1st UI) */}
        {onToggleViewMode && (
          <button
            onClick={onToggleViewMode}
            title="Switch to Classic Portal (1st UI)"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              fontSize: '0.74rem',
              fontWeight: 700,
              background: 'rgba(99, 102, 241, 0.15)',
              color: '#a5b4fc',
              border: '1px solid rgba(99, 102, 241, 0.35)',
              borderRadius: '8px',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            <Sparkles size={13} color="#a5b4fc" />
            <span>Classic 1st UI</span>
          </button>
        )}

        {/* User Capsule */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '4px 12px',
          background: 'rgba(255, 255, 255, 0.04)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
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
          <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#f8fafc' }}>
            {user?.name || (isOfficer ? 'Municipal Officer' : 'Active Citizen')}
          </span>
        </div>

        {/* Sign Out / View Login Button */}
        {onLogout && (
          <button
            onClick={onLogout}
            title="Sign Out & Return to Login Screen"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              fontSize: '0.75rem',
              fontWeight: 700,
              background: 'rgba(239, 68, 68, 0.12)',
              color: '#f87171',
              border: '1px solid rgba(239, 68, 68, 0.28)',
              borderRadius: '8px',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(239, 68, 68, 0.25)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(239, 68, 68, 0.12)';
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
