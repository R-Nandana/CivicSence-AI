import React from 'react';
import { 
  LayoutDashboard, FileText, Mic, Image as ImageIcon, Video, 
  GitFork, Clock, AlertTriangle, CheckSquare, BarChart3, 
  HelpCircle, Activity, Globe, Languages, Shield, LogOut,
  Sparkles, Layers, Search, Database
} from 'lucide-react';

export default function Sidebar({ activeScreen, setActiveScreen, user, onLogout }) {
  const isOfficer = user?.role === 'officer';

  const navGroups = [
    {
      title: "Authentication & Portal",
      items: [
        { id: "login", label: "0. Login & Registration", icon: Shield },
      ]
    },
    {
      title: "Citizen Services",
      items: [
        { id: "citizen-dashboard", label: "Citizen Dashboard", icon: LayoutDashboard },
        { id: "text-submission", label: "Submit Complaint", icon: FileText },
        { id: "voice-record", label: "Voice Complaint", icon: Mic },
        { id: "image-upload", label: "Upload Image Evidence", icon: ImageIcon },
        { id: "video-upload", label: "Upload Video Evidence", icon: Video },
        { id: "issue-timeline", label: "My Issues & Timeline", icon: Clock },
      ]
    },
    {
      title: "NLP Concepts (1 - 6)",
      items: [
        { id: "text-classification", label: "1. Text Classification", icon: Layers },
        { id: "ner-results", label: "2. Named Entity (NER)", icon: Search },
        { id: "multilingual", label: "3. Multilingual NLP", icon: Globe },
        { id: "translation", label: "4. Machine Translation", icon: Languages },
        { id: "speech-results", label: "5. Speech & Acoustics", icon: Mic },
        { id: "qa-interface", label: "6. Database-Grounded QA", icon: HelpCircle },
        { id: "qa-analytics", label: "QA Query Analytics", icon: Activity },
      ]
    },
    {
      title: "Computer Vision Evidence",
      items: [
        { id: "image-analysis", label: "Image Visual Analysis", icon: ImageIcon },
        { id: "video-analysis", label: "Video Frame Analysis", icon: Video },
      ]
    },
    {
      title: "Officer & Governance",
      items: [
        { id: "admin-dashboard", label: "Officer KPI Dashboard", icon: BarChart3, officerOnly: true },
        { id: "related-complaints", label: "Related Complaints", icon: GitFork },
        { id: "resolution-alerts", label: "Resolution Alerts", icon: AlertTriangle, badge: "Alerts" },
        { id: "human-validation", label: "Human AI Validation", icon: CheckSquare, officerOnly: true },
        { id: "eda-dashboard", label: "ETL & EDA Analytics", icon: Database },
      ]
    }
  ];

  return (
    <aside style={{
      width: '280px',
      minWidth: '280px',
      background: 'linear-gradient(180deg, #090d16 0%, #0d1527 100%)',
      borderRight: '1px solid rgba(255, 255, 255, 0.08)',
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      position: 'sticky',
      top: 0,
      zIndex: 40,
      overflowY: 'auto'
    }}>
      {/* Brand Header */}
      <div style={{
        padding: '20px 20px 16px 20px',
        borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
        display: 'flex',
        alignItems: 'center',
        gap: '12px'
      }}>
        <div style={{
          width: '36px',
          height: '36px',
          borderRadius: '10px',
          background: 'linear-gradient(135deg, #2563eb 0%, #0d9488 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#fff',
          fontWeight: 800,
          fontSize: '1.1rem',
          boxShadow: '0 4px 12px rgba(37, 99, 235, 0.35)'
        }}>
          C
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontWeight: 800, fontSize: '1.05rem', color: '#fff', letterSpacing: '-0.02em' }}>
              CivicSense
            </span>
            <span style={{
              background: 'rgba(37, 99, 235, 0.2)',
              color: '#60a5fa',
              fontSize: '0.65rem',
              fontWeight: 700,
              padding: '2px 6px',
              borderRadius: '4px',
              border: '1px solid rgba(96, 165, 250, 0.3)'
            }}>
              AI
            </span>
          </div>
          <p style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Urban Complaint Intelligence</p>
        </div>
      </div>

      {/* User Role Card */}
      <div style={{
        margin: '14px 16px 8px 16px',
        padding: '10px 14px',
        background: isOfficer ? 'rgba(13, 148, 136, 0.12)' : 'rgba(37, 99, 235, 0.12)',
        border: `1px solid ${isOfficer ? 'rgba(13, 148, 136, 0.3)' : 'rgba(37, 99, 235, 0.3)'}`,
        borderRadius: '10px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Shield size={16} color={isOfficer ? '#2dd4bf' : '#60a5fa'} />
          <div>
            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#fff' }}>
              {user?.name || (isOfficer ? 'Officer Portal' : 'Citizen Portal')}
            </div>
            <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>
              {user?.email || (isOfficer ? 'officer@civicsense.org' : 'citizen@civicsense.org')}
            </div>
          </div>
        </div>
        <span style={{
          fontSize: '0.65rem',
          fontWeight: 800,
          textTransform: 'uppercase',
          padding: '2px 6px',
          borderRadius: '4px',
          background: isOfficer ? '#0f766e' : '#1d4ed8',
          color: '#fff'
        }}>
          {user?.role || 'User'}
        </span>
      </div>

      {/* Navigation Sections */}
      <div style={{ flex: 1, padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
        {navGroups.map((group, gIdx) => (
          <div key={gIdx}>
            <div style={{
              fontSize: '0.68rem',
              fontWeight: 700,
              color: '#64748b',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              padding: '0 8px 6px 8px'
            }}>
              {group.title}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              {group.items.map((item) => {
                const IconComponent = item.icon;
                const isActive = activeScreen === item.id;
                const isRestricted = item.officerOnly && !isOfficer;

                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveScreen(item.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      background: isActive 
                        ? 'linear-gradient(90deg, rgba(37, 99, 235, 0.25) 0%, rgba(13, 148, 136, 0.15) 100%)' 
                        : 'transparent',
                      color: isActive ? '#60a5fa' : isRestricted ? '#475569' : '#cbd5e1',
                      border: isActive ? '1px solid rgba(96, 165, 250, 0.4)' : '1px solid transparent',
                      cursor: 'pointer',
                      textAlign: 'left',
                      fontSize: '0.84rem',
                      fontWeight: isActive ? 700 : 500,
                      transition: 'all 0.15s ease'
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                        e.currentTarget.style.color = '#fff';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.background = 'transparent';
                        e.currentTarget.style.color = isRestricted ? '#475569' : '#cbd5e1';
                      }
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <IconComponent size={16} color={isActive ? '#60a5fa' : '#94a3b8'} />
                      <span>{item.label}</span>
                    </div>

                    {item.badge && (
                      <span style={{
                        fontSize: '0.62rem',
                        fontWeight: 700,
                        padding: '1px 6px',
                        borderRadius: '9999px',
                        background: 'rgba(239, 68, 68, 0.2)',
                        color: '#f87171',
                        border: '1px solid rgba(239, 68, 68, 0.3)'
                      }}>
                        {item.badge}
                      </span>
                    )}

                    {item.officerOnly && (
                      <span style={{
                        fontSize: '0.58rem',
                        color: '#94a3b8',
                        background: 'rgba(255,255,255,0.06)',
                        padding: '2px 4px',
                        borderRadius: '4px'
                      }}>
                        OFFICER
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Footer / Logout */}
      <div style={{
        padding: '14px 16px',
        borderTop: '1px solid rgba(255, 255, 255, 0.06)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: 'rgba(9, 13, 22, 0.7)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }} />
          <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>FastAPI Live :8000</span>
        </div>
        <button
          onClick={onLogout}
          className="btn"
          style={{
            padding: '6px 12px',
            fontSize: '0.75rem',
            background: 'rgba(239, 68, 68, 0.12)',
            color: '#f87171',
            border: '1px solid rgba(239, 68, 68, 0.25)',
            borderRadius: '6px'
          }}
        >
          <LogOut size={13} /> Exit
        </button>
      </div>
    </aside>
  );
}
