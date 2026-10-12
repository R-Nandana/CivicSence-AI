import React, { useState } from 'react';
import { ShieldCheck, UserCheck, Lock, Mail, User, AlertCircle, Sparkles, ArrowRight, Sun, Moon } from 'lucide-react';
import { api } from '../services/api';

export default function LoginPage({ onLoginSuccess, onExploreEda, theme = 'dark', onToggleTheme }) {
  const [selectedRole, setSelectedRole] = useState('citizen'); // 'citizen' or 'officer'
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('citizen@civicsense.org');
  const [password, setPassword] = useState('citizen123');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const isDark = theme === 'dark';

  const colors = {
    bgPage: isDark ? '#090d16' : '#f0f4f8',
    leftBg: isDark
      ? `linear-gradient(135deg, rgba(4, 7, 18, 0.94) 0%, rgba(9, 14, 30, 0.90) 50%, rgba(11, 18, 36, 0.95) 100%), url('/civicsense_city_hero.jpg')`
      : `linear-gradient(135deg, rgba(248, 250, 252, 0.94) 0%, rgba(241, 245, 249, 0.91) 50%, rgba(226, 232, 240, 0.95) 100%), url('/civicsense_city_hero.jpg')`,
    leftBorder: isDark ? '1px solid rgba(255, 255, 255, 0.12)' : '1px solid rgba(0, 0, 0, 0.08)',
    tagBg: isDark ? 'rgba(9, 13, 22, 0.75)' : 'rgba(255, 255, 255, 0.92)',
    tagBorder: isDark ? '1px solid rgba(56, 189, 248, 0.35)' : '1px solid rgba(37, 99, 235, 0.25)',
    tagText: isDark ? '#ffffff' : '#0f172a',
    headingText: isDark ? '#ffffff' : '#0f172a',
    paraText: isDark ? '#e2e8f0' : '#334155',
    cardBg: isDark ? 'rgba(15, 23, 42, 0.85)' : '#ffffff',
    cardBorder: isDark ? '1px solid rgba(255, 255, 255, 0.14)' : '1px solid rgba(0, 0, 0, 0.09)',
    cardShadow: isDark ? '0 4px 20px rgba(0, 0, 0, 0.4)' : '0 4px 16px rgba(15, 23, 42, 0.06)',
    cardLabelText: isDark ? '#e2e8f0' : '#475569',
    rightBg: isDark ? '#0d1527' : '#ffffff',
    rightBorder: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(0, 0, 0, 0.08)',
    formTitle: isDark ? '#ffffff' : '#0f172a',
    formSubtitle: isDark ? '#cbd5e1' : '#475569',
    inputLabel: isDark ? '#e2e8f0' : '#1e293b',
    inputBg: isDark ? 'rgba(15, 23, 42, 0.85)' : '#f8fafc',
    inputBorder: isDark ? '1px solid rgba(255, 255, 255, 0.18)' : '1px solid #cbd5e1',
    inputText: isDark ? '#ffffff' : '#0f172a',
    demoLoginsLabel: isDark ? '#cbd5e1' : '#475569',
    demoBtnBg: isDark ? 'rgba(255, 255, 255, 0.08)' : '#f8fafc',
    demoBtnBorder: isDark ? '1px solid rgba(255, 255, 255, 0.16)' : '1px solid #cbd5e1',
    demoBtnText: isDark ? '#ffffff' : '#0f172a',
    footerText: isDark ? '#cbd5e1' : '#475569',
    footerLink: isDark ? '#60a5fa' : '#2563eb',
    municipalLink: isDark ? '#94a3b8' : '#64748b',
    municipalLinkHover: isDark ? '#38bdf8' : '#0f172a',
    metrics: {
      records: isDark ? '#60a5fa' : '#2563eb',
      categories: isDark ? '#34d399' : '#059669',
      concepts: isDark ? '#fbbf24' : '#d97706',
      cv: isDark ? '#f43f5e' : '#e11d48'
    }
  };

  const handleRoleSelect = (role) => {
    setSelectedRole(role);
    setErrorMsg('');
    if (role === 'officer') {
      setEmail('officer@civicsense.org');
      setPassword('officer123');
    } else {
      setEmail('citizen@civicsense.org');
      setPassword('citizen123');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      let data;
      if (isRegister) {
        data = await api.register(name, email, password, selectedRole);
      } else {
        data = await api.login(email, password);
      }

      localStorage.setItem('civicsense_token', data.access_token);
      localStorage.setItem('civicsense_user', JSON.stringify(data.user));
      onLoginSuccess(data.user);
    } catch (err) {
      setErrorMsg(err.message || 'Authentication failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemoLogin = async (role) => {
    setLoading(true);
    setErrorMsg('');
    const demoEmail = role === 'officer' ? 'officer@civicsense.org' : 'citizen@civicsense.org';
    const demoPassword = role === 'officer' ? 'officer123' : 'citizen123';

    try {
      const data = await api.login(demoEmail, demoPassword);
      localStorage.setItem('civicsense_token', data.access_token);
      localStorage.setItem('civicsense_user', JSON.stringify(data.user));
      onLoginSuccess(data.user);
    } catch (err) {
      setErrorMsg(err.message || 'Demo login failed.');
    } finally {
      setLoading(false);
    }
  };

  const isOfficer = selectedRole === 'officer';

  return (
    <div className="login-page" style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'row',
      background: colors.bgPage,
      color: colors.headingText,
      overflow: 'hidden',
      transition: 'background-color 0.25s ease, color 0.25s ease'
    }}>

      {/* LEFT PANEL: CivicSense Branding & Smart City Visual (Split Screen) */}
      <div style={{
        flex: 1.15,
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '40px 50px',
        backgroundImage: colors.leftBg,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        borderRight: colors.leftBorder,
        transition: 'all 0.25s ease'
      }}>
        {/* Top Brand Tag */}
        <div>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '12px',
            background: colors.tagBg,
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            border: colors.tagBorder,
            padding: '8px 18px',
            borderRadius: '9999px',
            marginBottom: '20px'
          }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, #2563eb 0%, #0d9488 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              fontWeight: 800,
              fontSize: '1.05rem',
              boxShadow: '0 4px 12px rgba(37, 99, 235, 0.5)'
            }}>
              C
            </div>
            <span style={{ fontSize: '1.1rem', fontWeight: 800, color: colors.tagText }}>CivicSense AI</span>
            <span style={{
              background: isDark ? 'rgba(37, 99, 235, 0.35)' : 'rgba(37, 99, 235, 0.15)',
              color: isDark ? '#93c5fd' : '#1d4ed8',
              fontSize: '0.65rem',
              fontWeight: 800,
              padding: '2px 8px',
              borderRadius: '9999px',
              textTransform: 'uppercase'
            }}>
              Academic NLP System
            </span>
          </div>

          <h1 className="login-heading" style={{
            fontSize: '2.5rem',
            fontWeight: 800,
            lineHeight: 1.18,
            color: colors.headingText,
            letterSpacing: '-0.03em',
            marginBottom: '14px',
            maxWidth: '560px',
            textShadow: isDark ? '0 2px 10px rgba(0, 0, 0, 0.5)' : 'none'
          }}>
            NLP-Based Civic Complaint Intelligence & Urban Monitoring
          </h1>

          <p style={{
            color: colors.paraText,
            fontSize: '0.98rem',
            lineHeight: 1.55,
            maxWidth: '520px',
            marginBottom: '22px',
            fontWeight: 500
          }}>
            A production-style academic platform integrating multiclass text classification,
            domain NER, speech acoustics, cross-lingual translation, computer vision evidence
            verification, related issue evolution tracking, and resolution monitoring.
          </p>

          {/* PICTURE CARD IN LOGIN PAGE */}
          <div style={{
            marginBottom: '24px',
            maxWidth: '520px',
            borderRadius: '16px',
            overflow: 'hidden',
            border: isDark ? '2px solid rgba(56, 189, 248, 0.35)' : '2px solid rgba(37, 99, 235, 0.25)',
            boxShadow: isDark ? '0 16px 36px rgba(0, 0, 0, 0.6), 0 0 20px rgba(13, 148, 136, 0.3)' : '0 12px 28px rgba(15, 23, 42, 0.12)',
            position: 'relative'
          }}>
            <img 
              src="/civicsense_city_hero.jpg" 
              alt="CivicSense Urban Surveillance & City Monitoring" 
              style={{
                width: '100%',
                height: '210px',
                objectFit: 'cover',
                display: 'block'
              }} 
            />
            <div style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              background: 'linear-gradient(180deg, transparent 0%, rgba(9, 13, 22, 0.95) 100%)',
              padding: '12px 18px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#38bdf8' }}>
                🏙️ Smart Urban Surveillance & Infrastructure Monitoring
              </span>
              <span style={{
                fontSize: '0.68rem',
                color: '#34d399',
                background: 'rgba(16, 185, 129, 0.25)',
                border: '1px solid rgba(16, 185, 129, 0.5)',
                padding: '2px 8px',
                borderRadius: '6px',
                fontWeight: 700
              }}>
                Live City Feed
              </span>
            </div>
          </div>

          {/* Key Metric Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', maxWidth: '520px' }}>
            <div className="login-metric-card" style={{
              padding: '12px 16px',
              borderRadius: '12px',
              background: colors.cardBg,
              border: colors.cardBorder,
              boxShadow: colors.cardShadow,
              backdropFilter: 'blur(8px)'
            }}>
              <div style={{ fontSize: '1.3rem', fontWeight: 800, color: colors.metrics.records }}>1,044 Records</div>
              <div className="login-metric-label" style={{ fontSize: '0.78rem', color: colors.cardLabelText, fontWeight: 600 }}>NYC 311 Verified Civic Dataset</div>
            </div>

            <div className="login-metric-card" style={{
              padding: '12px 16px',
              borderRadius: '12px',
              background: colors.cardBg,
              border: colors.cardBorder,
              boxShadow: colors.cardShadow,
              backdropFilter: 'blur(8px)'
            }}>
              <div style={{ fontSize: '1.3rem', fontWeight: 800, color: colors.metrics.categories }}>8 Categories</div>
              <div className="login-metric-label" style={{ fontSize: '0.78rem', color: colors.cardLabelText, fontWeight: 600 }}>TF-IDF + Softmax Logistic Regression</div>
            </div>

            <div className="login-metric-card" style={{
              padding: '14px 18px',
              borderRadius: '12px',
              background: colors.cardBg,
              border: colors.cardBorder,
              boxShadow: colors.cardShadow,
              backdropFilter: 'blur(8px)'
            }}>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: colors.metrics.concepts }}>6 NLP Concepts</div>
              <div className="login-metric-label" style={{ fontSize: '0.78rem', color: colors.cardLabelText, fontWeight: 600 }}>Classification, NER, Multilingual, MT, ASR, QA</div>
            </div>

            <div className="login-metric-card" style={{
              padding: '14px 18px',
              borderRadius: '12px',
              background: colors.cardBg,
              border: colors.cardBorder,
              boxShadow: colors.cardShadow,
              backdropFilter: 'blur(8px)'
            }}>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: colors.metrics.cv }}>CV Evidence</div>
              <div className="login-metric-label" style={{ fontSize: '0.78rem', color: colors.cardLabelText, fontWeight: 600 }}>Image & Keyframe Consistency Verification</div>
            </div>
          </div>
        </div>

        {/* Bottom Banner */}
        <div style={{
          marginTop: '36px',
          paddingTop: '18px',
          borderTop: colors.leftBorder,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          color: colors.paraText,
          fontSize: '0.82rem',
          fontWeight: 600
        }}>
          <span>CivicSense Intelligence v1.2</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }} />
            Uvicorn / FastAPI Backend Active
          </span>
        </div>
      </div>

      {/* RIGHT PANEL: Clean Login & Registration Card (Split Screen) */}
      <div style={{
        flex: 0.9,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '40px 50px',
        background: colors.rightBg,
        borderLeft: colors.rightBorder,
        overflowY: 'auto',
        position: 'relative',
        transition: 'all 0.25s ease'
      }}>

        {/* Top Right Controls: Theme Toggle */}
        <div style={{ position: 'absolute', top: '24px', right: '32px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          {onToggleTheme && (
            <button
              onClick={onToggleTheme}
              title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 14px',
                borderRadius: '9999px',
                background: isDark ? 'rgba(255, 255, 255, 0.08)' : '#f1f5f9',
                border: isDark ? '1px solid rgba(255, 255, 255, 0.15)' : '1px solid #cbd5e1',
                color: isDark ? '#fbbf24' : '#4f46e5',
                cursor: 'pointer',
                fontSize: '0.8rem',
                fontWeight: 700,
                transition: 'all 0.2s ease'
              }}
            >
              {isDark ? <Sun size={15} /> : <Moon size={15} />}
              <span>{isDark ? 'Light Mode' : 'Dark Mode'}</span>
            </button>
          )}
        </div>

        <div style={{ width: '100%', maxWidth: '440px', marginTop: '12px' }}>

          {/* Role Selection Tabs */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '10px',
            marginBottom: '20px'
          }}>
            <button
              type="button"
              onClick={() => handleRoleSelect('citizen')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '12px',
                borderRadius: '10px',
                background: !isOfficer ? '#2563eb' : (isDark ? 'rgba(255, 255, 255, 0.05)' : '#f1f5f9'),
                color: !isOfficer ? '#ffffff' : (isDark ? '#cbd5e1' : '#334155'),
                border: !isOfficer ? '1px solid #3b82f6' : (isDark ? '1px solid rgba(255, 255, 255, 0.12)' : '1px solid #cbd5e1'),
                cursor: 'pointer',
                fontWeight: 700,
                fontSize: '0.88rem',
                transition: 'all 0.2s ease'
              }}
            >
              <UserCheck size={18} /> Citizen Portal
            </button>

            <button
              type="button"
              onClick={() => handleRoleSelect('officer')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '12px',
                borderRadius: '10px',
                background: isOfficer ? '#0d9488' : (isDark ? 'rgba(255, 255, 255, 0.05)' : '#f1f5f9'),
                color: isOfficer ? '#ffffff' : (isDark ? '#cbd5e1' : '#334155'),
                border: isOfficer ? '1px solid #14b8a6' : (isDark ? '1px solid rgba(255, 255, 255, 0.12)' : '1px solid #cbd5e1'),
                cursor: 'pointer',
                fontWeight: 700,
                fontSize: '0.88rem',
                transition: 'all 0.2s ease'
              }}
            >
              <ShieldCheck size={18} /> Municipal Officer
            </button>
          </div>

          {/* Form Header */}
          <div style={{ marginBottom: '24px' }}>
            <h2 className="login-heading" style={{ fontSize: '1.6rem', fontWeight: 800, color: colors.formTitle, marginBottom: '6px' }}>
              {isRegister ? 'Create Citizen Account' : (isOfficer ? 'Officer Sign In' : 'Citizen Sign In')}
            </h2>
            <p style={{ color: colors.formSubtitle, fontSize: '0.88rem', fontWeight: 500 }}>
              {isRegister 
                ? 'Join CivicSense to report issues and track resolutions.' 
                : (isOfficer ? 'Enter municipal credentials to review and resolve issues.' : 'Access your complaints, upload evidence, and monitor status.')}
            </p>
          </div>

          {/* Error Message */}
          {errorMsg && (
            <div style={{
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              borderRadius: '8px',
              padding: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              color: '#ef4444',
              fontSize: '0.85rem',
              fontWeight: 600,
              marginBottom: '20px'
            }}>
              <AlertCircle size={18} />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Login / Register Form */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {isRegister && (
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: colors.inputLabel, marginBottom: '6px' }}>
                  Full Name
                </label>
                <div style={{ position: 'relative' }}>
                  <User size={16} color={isDark ? "#94a3b8" : "#64748b"} style={{ position: 'absolute', left: '14px', top: '14px' }} />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Jane Citizen"
                    className="input-field"
                    style={{
                      paddingLeft: '40px',
                      background: colors.inputBg,
                      border: colors.inputBorder,
                      color: colors.inputText
                    }}
                  />
                </div>
              </div>
            )}

            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: colors.inputLabel, marginBottom: '6px' }}>
                Email Address
              </label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} color={isDark ? "#94a3b8" : "#64748b"} style={{ position: 'absolute', left: '14px', top: '14px' }} />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@civicsense.org"
                  className="input-field"
                  style={{
                    paddingLeft: '40px',
                    background: colors.inputBg,
                    border: colors.inputBorder,
                    color: colors.inputText
                  }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: colors.inputLabel, marginBottom: '6px' }}>
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} color={isDark ? "#94a3b8" : "#64748b"} style={{ position: 'absolute', left: '14px', top: '14px' }} />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="input-field"
                  style={{
                    paddingLeft: '40px',
                    background: colors.inputBg,
                    border: colors.inputBorder,
                    color: colors.inputText
                  }}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
              style={{
                width: '100%',
                padding: '13px',
                background: isOfficer ? 'linear-gradient(135deg, #0f766e 0%, #14b8a6 100%)' : 'linear-gradient(135deg, #2563eb 0%, #3b82f6 100%)',
                color: '#ffffff',
                fontSize: '0.95rem',
                fontWeight: 700,
                borderRadius: '10px',
                boxShadow: '0 4px 14px rgba(37, 99, 235, 0.35)',
                marginTop: '6px'
              }}
            >
              {loading ? 'Authenticating...' : (isRegister ? 'Complete Registration' : 'Sign In to Portal')}
            </button>
          </form>

          {/* Quick Academic Demo Logins */}
          <div style={{ marginTop: '22px', paddingTop: '18px', borderTop: colors.rightBorder }}>
            <div style={{ fontSize: '0.74rem', fontWeight: 700, color: colors.demoLoginsLabel, textTransform: 'uppercase', marginBottom: '10px', textAlign: 'center', letterSpacing: '0.04em' }}>
              Academic Evaluation Demo Quick Logins
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <button
                type="button"
                onClick={() => handleQuickDemoLogin('citizen')}
                disabled={loading}
                className="btn"
                style={{
                  fontSize: '0.82rem',
                  padding: '11px 12px',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  background: colors.demoBtnBg,
                  border: colors.demoBtnBorder,
                  color: colors.demoBtnText,
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                <UserCheck size={15} color="#2563eb" /> Citizen Demo
              </button>
              <button
                type="button"
                onClick={() => handleQuickDemoLogin('officer')}
                disabled={loading}
                className="btn"
                style={{
                  fontSize: '0.82rem',
                  padding: '11px 12px',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  background: colors.demoBtnBg,
                  border: colors.demoBtnBorder,
                  color: colors.demoBtnText,
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                <ShieldCheck size={15} color="#0d9488" /> Officer Demo
              </button>
            </div>
          </div>

          {/* Toggle Register / Login */}
          {!isOfficer && (
            <div style={{ marginTop: '20px', textAlign: 'center', fontSize: '0.86rem', color: colors.footerText }}>
              {isRegister ? (
                <span>
                  Already registered?{' '}
                  <button
                    onClick={() => setIsRegister(false)}
                    style={{ background: 'none', border: 'none', color: colors.footerLink, fontWeight: 700, cursor: 'pointer', textDecoration: 'underline' }}
                  >
                    Sign In
                  </button>
                </span>
              ) : (
                <span>
                  Need a citizen account?{' '}
                  <button
                    onClick={() => setIsRegister(true)}
                    style={{ background: 'none', border: 'none', color: colors.footerLink, fontWeight: 700, cursor: 'pointer', textDecoration: 'underline' }}
                  >
                    Register here
                  </button>
                </span>
              )}
            </div>
          )}

          {/* Guest EDA link */}
          <div style={{ marginTop: '14px', textAlign: 'center' }}>
            <button
              onClick={onExploreEda}
              style={{
                background: 'none',
                border: 'none',
                color: colors.footerText,
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              Explore EDA & Open Data in Guest Mode <ArrowRight size={13} />
            </button>
          </div>

          {/* Subtle Municipal Authority Link */}
          {!isOfficer && (
            <div style={{ marginTop: '22px', paddingTop: '14px', borderTop: colors.rightBorder, textAlign: 'center' }}>
              <button
                type="button"
                onClick={() => handleRoleSelect('officer')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: colors.municipalLink,
                  fontSize: '0.74rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'color 0.2s ease'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.color = colors.municipalLinkHover; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = colors.municipalLink; }}
              >
                <Lock size={12} /> Authorized Municipal Authority / Department Login
              </button>
            </div>
          )}

        </div>
      </div>

    </div>
  );
}
