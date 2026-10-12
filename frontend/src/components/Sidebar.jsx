import React, { useState, useEffect, useMemo } from 'react';
import { 
  LayoutDashboard, FileText, Mic, Image as ImageIcon, Video, 
  GitFork, Clock, AlertTriangle, CheckSquare, BarChart3, 
  HelpCircle, Activity, Globe, Languages, Shield, LogOut,
  Sparkles, Layers, Search, Database, ChevronDown, ChevronRight,
  Filter, Eye, Cpu
} from 'lucide-react';
import { api } from '../services/api';

export default function Sidebar({ activeScreen, setActiveScreen, user, onLogout }) {
  const isOfficer = user?.role === 'officer';
  const [searchTerm, setSearchTerm] = useState('');
  const [collapsedGroups, setCollapsedGroups] = useState({});
  const [pendingAlertsCount, setPendingAlertsCount] = useState(3);

  useEffect(() => {
    if (!isOfficer) return;
    const fetchPendingAlerts = () => {
      api.getResolutionStats()
        .then(stats => {
          if (stats && typeof stats.pending_count === 'number') {
            setPendingAlertsCount(stats.pending_count);
          }
        })
        .catch(() => {});
    };
    fetchPendingAlerts();
    const interval = setInterval(fetchPendingAlerts, 8000);
    return () => clearInterval(interval);
  }, [isOfficer]);

  const toggleGroup = (title) => {
    setCollapsedGroups(prev => ({
      ...prev,
      [title]: !prev[title]
    }));
  };

  // Strictly segregated Navigation Architecture based on Authenticated Role
  const navGroups = useMemo(() => {
    if (!isOfficer) {
      // â”€â”€ CITIZEN ROLE NAVIGATION (Pure Citizen Services) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
      return [
        {
          title: "Citizen Services",
          badge: "Active",
          items: [
            { id: "citizen-dashboard", label: "My Grievances Dashboard", icon: LayoutDashboard },
            { id: "text-submission", label: "File Municipal Grievance", icon: FileText },
            { id: "voice-record", label: "Voice Complaint Recording", icon: Mic },
            { id: "image-upload", label: "Attach Photo Evidence", icon: ImageIcon },
            { id: "video-upload", label: "Attach Video Evidence", icon: Video },
            { id: "issue-timeline", label: "Track Issues & Timeline", icon: Clock },
          ]
        },
        {
          title: "AI Help & Multilingual",
          badge: "100+ Lang",
          items: [
            { id: "multilingual", label: "Language Hub & Translation", icon: Globe },
            { id: "qa-interface", label: "Citizen AI Helpdesk", icon: HelpCircle },
          ]
        }
      ];
    }

    // â”€â”€ MUNICIPAL OFFICER NAVIGATION (Operations, Evidence Triage & Intelligence) â”€â”€â”€
    return [
      {
        title: "Municipal Operations",
        badge: "Admin",
        items: [
          { id: "admin-dashboard", label: "Operations Command Center", icon: BarChart3 },
          { id: "related-complaints", label: "Duplicate & Issue Clusters", icon: GitFork },
          { 
            id: "resolution-alerts", 
            label: "Resolution Audit Alerts", 
            icon: AlertTriangle, 
            alertBadge: pendingAlertsCount > 0 ? `${pendingAlertsCount} Alerts` : null 
          },
          { id: "human-validation", label: "Officer Verification & Feedback", icon: CheckSquare },
        ]
      },
      {
        title: "Evidence Inspection Lab",
        badge: "Computer Vision",
        items: [
          { id: "image-analysis", label: "Photo Evidence Inspector", icon: Eye },
          { id: "video-analysis", label: "Video Keyframe Inspector", icon: Video },
        ]
      },
      {
        title: "City Intelligence & Analytics",
        badge: "AI Core",
        items: [
          { id: "eda-dashboard", label: "City Analytics & Ingestion", icon: Database },
          { id: "text-classification", label: "AI Classification Engine", icon: Layers },
          { id: "ner-results", label: "Named Entity Extraction", icon: Search },
          { id: "speech-results", label: "Voice Acoustic Metrics", icon: Mic },
          { id: "translation", label: "Cross-Lingual Benchmarks", icon: Languages },
          { id: "qa-analytics", label: "Knowledge Base & Audits", icon: Activity },
        ]
      }
    ];
  }, [isOfficer, pendingAlertsCount]);

  // Filter items based on user search term
  const filteredGroups = useMemo(() => {
    if (!searchTerm.trim()) return navGroups;
    const query = searchTerm.toLowerCase();
    return navGroups.map(group => ({
      ...group,
      items: group.items.filter(item => item.label.toLowerCase().includes(query))
    })).filter(group => group.items.length > 0);
  }, [navGroups, searchTerm]);

  return (
    <aside style={{
      width: '280px',
      minWidth: '280px',
      background: 'var(--sidebar-bg)',
      borderRight: '1px solid var(--border-color)',
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      position: 'sticky',
      top: 0,
      zIndex: 40,
      overflowY: 'auto',
      transition: 'background 0.25s ease, border-color 0.25s ease'
    }}>
      {/* Brand Header */}
      <div style={{
        padding: '20px 20px 16px 20px',
        borderBottom: '1px solid var(--border-color)',
        display: 'flex',
        alignItems: 'center',
        gap: '12px'
      }}>
        <div style={{
          width: '38px',
          height: '38px',
          borderRadius: '10px',
          background: isOfficer 
            ? 'linear-gradient(135deg, #0d9488 0%, #059669 100%)' 
            : 'linear-gradient(135deg, #2563eb 0%, #4f46e5 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#fff',
          fontWeight: 800,
          fontSize: '1.2rem',
          boxShadow: isOfficer ? '0 4px 14px rgba(13, 148, 136, 0.35)' : '0 4px 14px rgba(37, 99, 235, 0.35)'
        }}>
          C
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
              CivicSense
            </span>
            <span style={{
              background: isOfficer ? 'rgba(13, 148, 136, 0.18)' : 'rgba(37, 99, 235, 0.18)',
              color: isOfficer ? '#2dd4bf' : '#60a5fa',
              fontSize: '0.62rem',
              fontWeight: 800,
              padding: '2px 6px',
              borderRadius: '4px',
              border: `1px solid ${isOfficer ? 'rgba(13, 148, 136, 0.35)' : 'rgba(37, 99, 235, 0.35)'}`
            }}>
              AI
            </span>
          </div>
          <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', margin: 0 }}>
            {isOfficer ? 'Municipal Operations Center' : 'Citizen Grievance Portal'}
          </p>
        </div>
      </div>

      {/* User Status Capsule Card */}
      <div style={{
        margin: '14px 16px 10px 16px',
        padding: '12px 14px',
        background: isOfficer ? 'rgba(13, 148, 136, 0.1)' : 'rgba(37, 99, 235, 0.1)',
        border: `1px solid ${isOfficer ? 'rgba(13, 148, 136, 0.3)' : 'rgba(37, 99, 235, 0.3)'}`,
        borderRadius: '12px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            background: isOfficer ? '#0d9488' : '#2563eb',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '0.85rem',
            fontWeight: 800
          }}>
            {user?.name?.[0]?.toUpperCase() || 'U'}
          </div>
          <div>
            <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-main)', lineHeight: 1.2 }}>
              {user?.name || (isOfficer ? 'Officer' : 'Citizen')}
            </div>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-dim)', marginTop: 2 }}>
              {user?.email || (isOfficer ? 'officer@civicsense.org' : 'citizen@civicsense.org')}
            </div>
          </div>
        </div>
        <span style={{
          fontSize: '0.62rem',
          fontWeight: 800,
          textTransform: 'uppercase',
          padding: '2px 8px',
          borderRadius: '20px',
          background: isOfficer ? '#0f766e' : '#1d4ed8',
          color: '#fff'
        }}>
          {isOfficer ? 'Officer' : 'Citizen'}
        </span>
      </div>

      {/* Interactive Quick Filter / Search Input */}
      <div style={{ padding: '0 16px 10px 16px' }}>
        <div style={{ position: 'relative' }}>
          <Search size={14} color="var(--text-dim)" style={{ position: 'absolute', left: '10px', top: '10px' }} />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Quick search modules..."
            style={{
              width: '100%',
              padding: '8px 12px 8px 30px',
              fontSize: '0.78rem',
              borderRadius: '8px',
              background: 'var(--panel-bg)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-main)',
              outline: 'none',
              transition: 'all 0.2s ease'
            }}
          />
        </div>
      </div>

      {/* Navigation Groups */}
      <div style={{ flex: 1, padding: '4px 12px 16px 12px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {filteredGroups.map((group, gIdx) => {
          const isCollapsed = !!collapsedGroups[group.title];

          return (
            <div key={gIdx}>
              {/* Group Header Button (Collapsible) */}
              <button
                onClick={() => toggleGroup(group.title)}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '4px 8px 6px 8px',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  textAlign: 'left'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{
                    fontSize: '0.68rem',
                    fontWeight: 800,
                    color: 'var(--text-dim)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.07em'
                  }}>
                    {group.title}
                  </span>
                  {group.badge && (
                    <span style={{
                      fontSize: '0.58rem',
                      padding: '1px 5px',
                      borderRadius: '4px',
                      background: 'var(--panel-bg)',
                      color: 'var(--text-dim)',
                      fontWeight: 700
                    }}>
                      {group.badge}
                    </span>
                  )}
                </div>
                {isCollapsed ? <ChevronRight size={13} color="var(--text-dim)" /> : <ChevronDown size={13} color="var(--text-dim)" />}
              </button>

              {/* Group Items */}
              {!isCollapsed && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', marginTop: '2px' }}>
                  {group.items.map((item) => {
                    const IconComponent = item.icon;
                    const isActive = activeScreen === item.id;

                    return (
                      <button
                        key={item.id}
                        onClick={() => setActiveScreen(item.id)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          width: '100%',
                          padding: '9px 12px',
                          borderRadius: '9px',
                          background: isActive 
                            ? (isOfficer ? 'var(--sidebar-active-officer-bg)' : 'var(--sidebar-active-bg)')
                            : 'transparent',
                          color: isActive 
                            ? (isOfficer ? 'var(--sidebar-active-officer-text)' : 'var(--sidebar-active-text)') 
                            : 'var(--text-muted)',
                          border: isActive 
                            ? `1px solid ${isOfficer ? 'var(--sidebar-active-officer-border)' : 'var(--sidebar-active-border)'}` 
                            : '1px solid transparent',
                          cursor: 'pointer',
                          textAlign: 'left',
                          fontSize: '0.84rem',
                          fontWeight: isActive ? 700 : 500,
                          transition: 'all 0.15s ease'
                        }}
                        onMouseEnter={(e) => {
                          if (!isActive) {
                            e.currentTarget.style.background = 'var(--panel-bg)';
                            e.currentTarget.style.color = 'var(--text-main)';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!isActive) {
                            e.currentTarget.style.background = 'transparent';
                            e.currentTarget.style.color = 'var(--text-muted)';
                          }
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <IconComponent 
                            size={16} 
                            color={isActive ? (isOfficer ? 'var(--sidebar-active-officer-text)' : 'var(--sidebar-active-text)') : 'var(--text-dim)'} 
                          />
                          <span>{item.label}</span>
                        </div>

                        {item.alertBadge && (
                          <span style={{
                            fontSize: '0.62rem',
                            fontWeight: 800,
                            padding: '2px 6px',
                            borderRadius: '9999px',
                            background: 'rgba(239, 68, 68, 0.18)',
                            color: '#ef4444',
                            border: '1px solid rgba(239, 68, 68, 0.3)'
                          }}>
                            {item.alertBadge}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer / System Status & Logout */}
      <div style={{
        padding: '14px 16px',
        borderTop: '1px solid var(--border-color)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: 'var(--panel-bg)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 8px #10b981' }} />
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>
            {isOfficer ? 'Municipal Engine' : 'Grievance Core'}
          </span>
        </div>
        <button
          onClick={onLogout}
          style={{
            padding: '6px 12px',
            fontSize: '0.75rem',
            background: 'rgba(239, 68, 68, 0.12)',
            color: '#ef4444',
            border: '1px solid rgba(239, 68, 68, 0.25)',
            borderRadius: '6px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            fontWeight: 600
          }}
        >
          <LogOut size={13} /> Exit
        </button>
      </div>
    </aside>
  );
}

