import React, { useState } from 'react';
import { ShieldCheck, UserCheck, Lock, Mail, User, AlertCircle, Sparkles, ArrowRight, Activity, Globe, Mic, CheckCircle2 } from 'lucide-react';
import { api } from '../services/api';

export default function LoginPage({ onLoginSuccess, onExploreEda }) {
  const [selectedRole, setSelectedRole] = useState('citizen'); // 'citizen' or 'officer'
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('citizen@civicsense.org');
  const [password, setPassword] = useState('citizen123');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

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
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'row',
      background: '#090d16',
      color: '#fff',
      overflow: 'hidden'
    }}>

      {/* LEFT PANEL: CivicSense Branding & Smart City Visual (Split Screen) */}
      <div style={{
        flex: 1.1,
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '50px 60px',
        backgroundImage: `linear-gradient(135deg, rgba(9, 13, 22, 0.88) 0%, rgba(13, 21, 39, 0.82) 50%, rgba(15, 23, 42, 0.92) 100%), url('/civicsense_city_hero.jpg')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        borderRight: '1px solid rgba(255, 255, 255, 0.1)'
      }}>
        {/* Top Brand Tag */}
        <div>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '12px',
            background: 'rgba(255, 255, 255, 0.08)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            padding: '8px 18px',
            borderRadius: '9999px',
            marginBottom: '28px'
          }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, #2563eb 0%, #0d9488 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontWeight: 800,
              fontSize: '1.05rem',
              boxShadow: '0 4px 12px rgba(37, 99, 235, 0.4)'
            }}>
              C
            </div>
            <span style={{ fontSize: '1.1rem', fontWeight: 800, color: '#fff' }}>CivicSense AI</span>
            <span style={{
              background: 'rgba(37, 99, 235, 0.3)',
              color: '#93c5fd',
              fontSize: '0.65rem',
              fontWeight: 800,
              padding: '2px 8px',
              borderRadius: '9999px',
              textTransform: 'uppercase'
            }}>
              Academic NLP System
            </span>
          </div>

          <h1 style={{
            fontSize: '2.7rem',
            fontWeight: 800,
            lineHeight: 1.18,
            color: '#fff',
            letterSpacing: '-0.03em',
            marginBottom: '18px',
            maxWidth: '560px'
          }}>
            NLP-Based Civic Complaint Intelligence & Urban Issue Monitoring
          </h1>

          <p style={{
            color: '#cbd5e1',
            fontSize: '1.02rem',
            lineHeight: 1.6,
            maxWidth: '520px',
            marginBottom: '32px'
          }}>
            A production-style academic platform integrating multiclass text classification,
            domain NER, speech acoustics, cross-lingual translation, computer vision evidence
            verification, related issue evolution tracking, and resolution monitoring.
          </p>

          {/* Key Metric Pills */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '14px', maxWidth: '480px' }}>
            <div style={{
              padding: '14px 18px',
              borderRadius: '12px',
              background: 'rgba(15, 23, 42, 0.75)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(8px)'
            }}>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#60a5fa' }}>1,044 Records</div>
              <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>NYC 311 Verified Civic Dataset</div>
            </div>

            <div style={{
              padding: '14px 18px',
              borderRadius: '12px',
              background: 'rgba(15, 23, 42, 0.75)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(8px)'
            }}>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#34d399' }}>8 Categories</div>
              <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>TF-IDF + Softmax Logistic Regression</div>
            </div>

            <div style={{
              padding: '14px 18px',
              borderRadius: '12px',
              background: 'rgba(15, 23, 42, 0.75)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(8px)'
            }}>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fbbf24' }}>6 NLP Concepts</div>
              <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>Classification, NER, Multilingual, MT, ASR, QA</div>
            </div>

            <div style={{
              padding: '14px 18px',
              borderRadius: '12px',
              background: 'rgba(15, 23, 42, 0.75)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(8px)'
            }}>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#f43f5e' }}>CV Evidence</div>
              <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>Image & Keyframe Consistency Verification</div>
            </div>
          </div>
        </div>

        {/* Bottom Banner */}
        <div style={{
          marginTop: '40px',
          paddingTop: '20px',
          borderTop: '1px solid rgba(255, 255, 255, 0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          color: '#94a3b8',
          fontSize: '0.8rem'
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
        background: '#0d1527',
        overflowY: 'auto'
      }}>
        <div style={{ width: '100%', maxWidth: '440px' }}>

          {/* Role Selection Tabs */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '10px',
            marginBottom: '24px'
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
                background: !isOfficer ? '#2563eb' : 'rgba(255, 255, 255, 0.05)',
                color: !isOfficer ? '#fff' : '#94a3b8',
                border: !isOfficer ? '1px solid #3b82f6' : '1px solid rgba(255, 255, 255, 0.1)',
                cursor: 'pointer',
                fontWeight: 700,
                fontSize: '0.9rem',
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
                background: isOfficer ? '#0d9488' : 'rgba(255, 255, 255, 0.05)',
                color: isOfficer ? '#fff' : '#94a3b8',
                border: isOfficer ? '1px solid #14b8a6' : '1px solid rgba(255, 255, 255, 0.1)',
                cursor: 'pointer',
                fontWeight: 700,
                fontSize: '0.9rem',
                transition: 'all 0.2s ease'
              }}
            >
              <ShieldCheck size={18} /> Municipal Officer
            </button>
          </div>

          {/* Form Header */}
          <div style={{ marginBottom: '24px' }}>
            <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#fff', marginBottom: '6px' }}>
              {isRegister ? 'Create Citizen Account' : (isOfficer ? 'Officer Sign In' : 'Citizen Sign In')}
            </h2>
            <p style={{ color: '#94a3b8', fontSize: '0.88rem' }}>
              {isRegister 
                ? 'Join CivicSense to report issues and track resolutions.' 
                : (isOfficer ? 'Enter municipal credentials to review and resolve issues.' : 'Access your complaints, upload evidence, and monitor status.')}
            </p>
          </div>

          {/* Error Message */}
          {errorMsg && (
            <div style={{
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '8px',
              padding: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              color: '#f87171',
              fontSize: '0.85rem',
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
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '6px' }}>
                  Full Name
                </label>
                <div style={{ position: 'relative' }}>
                  <User size={16} color="#94a3b8" style={{ position: 'absolute', left: '14px', top: '14px' }} />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Jane Citizen"
                    className="input-field"
                    style={{ paddingLeft: '40px' }}
                  />
                </div>
              </div>
            )}

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '6px' }}>
                Email Address
              </label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} color="#94a3b8" style={{ position: 'absolute', left: '14px', top: '14px' }} />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@civicsense.org"
                  className="input-field"
                  style={{ paddingLeft: '40px' }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '6px' }}>
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} color="#94a3b8" style={{ position: 'absolute', left: '14px', top: '14px' }} />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="input-field"
                  style={{ paddingLeft: '40px' }}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn"
              style={{
                width: '100%',
                padding: '12px',
                background: isOfficer ? 'linear-gradient(135deg, #0f766e 0%, #14b8a6 100%)' : 'linear-gradient(135deg, #2563eb 0%, #3b82f6 100%)',
                color: '#fff',
                fontSize: '0.95rem',
                fontWeight: 700,
                borderRadius: '10px',
                boxShadow: '0 4px 14px rgba(37, 99, 235, 0.3)',
                marginTop: '6px'
              }}
            >
              {loading ? 'Authenticating...' : (isRegister ? 'Complete Registration' : 'Sign In to Portal')}
            </button>
          </form>

          {/* Quick 1-Click Academic Demo Logins */}
          <div style={{ marginTop: '24px', paddingTop: '20px', borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '10px', textAlign: 'center' }}>
              Academic Evaluation Quick Logins
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <button
                type="button"
                onClick={() => handleQuickDemoLogin('citizen')}
                disabled={loading}
                className="btn btn-secondary"
                style={{ fontSize: '0.8rem', padding: '9px 12px', borderRadius: '8px' }}
              >
                <UserCheck size={14} color="#60a5fa" /> Citizen Demo
              </button>
              <button
                type="button"
                onClick={() => handleQuickDemoLogin('officer')}
                disabled={loading}
                className="btn btn-secondary"
                style={{ fontSize: '0.8rem', padding: '9px 12px', borderRadius: '8px' }}
              >
                <ShieldCheck size={14} color="#2dd4bf" /> Officer Demo
              </button>
            </div>
          </div>

          {/* Toggle Register / Login */}
          {!isOfficer && (
            <div style={{ marginTop: '20px', textAlign: 'center', fontSize: '0.85rem', color: '#94a3b8' }}>
              {isRegister ? (
                <span>
                  Already registered?{' '}
                  <button
                    onClick={() => setIsRegister(false)}
                    style={{ background: 'none', border: 'none', color: '#60a5fa', fontWeight: 600, cursor: 'pointer' }}
                  >
                    Sign In
                  </button>
                </span>
              ) : (
                <span>
                  Need a citizen account?{' '}
                  <button
                    onClick={() => setIsRegister(true)}
                    style={{ background: 'none', border: 'none', color: '#60a5fa', fontWeight: 600, cursor: 'pointer' }}
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
                color: '#94a3b8',
                fontSize: '0.78rem',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              Explore EDA & Open Data in Guest Mode <ArrowRight size={12} />
            </button>
          </div>

        </div>
      </div>

    </div>
  );
}
