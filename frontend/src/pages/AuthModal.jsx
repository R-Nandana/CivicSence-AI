import React, { useState, useEffect } from 'react';
import { X, Lock, Mail, User, ShieldCheck, UserCheck, AlertCircle, Sparkles } from 'lucide-react';
import { api } from '../services/api';

export default function AuthModal({ isOpen, onClose, onLoginSuccess, initialRole = 'citizen' }) {
  const [activeLoginRole, setActiveLoginRole] = useState(initialRole);
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Sync initialRole when modal opens
  useEffect(() => {
    if (isOpen) {
      setActiveLoginRole(initialRole);
      setIsRegister(false);
      setErrorMsg('');
      if (initialRole === 'officer') {
        setEmail('officer@civicsense.org');
        setPassword('officer123');
      } else {
        setEmail('citizen@civicsense.org');
        setPassword('citizen123');
      }
    }
  }, [isOpen, initialRole]);

  if (!isOpen) return null;

  const handleRoleTabSwitch = (role) => {
    setActiveLoginRole(role);
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
        data = await api.register(name, email, password, activeLoginRole);
      } else {
        data = await api.login(email, password);
      }
      
      localStorage.setItem('civicsense_token', data.access_token);
      localStorage.setItem('civicsense_user', JSON.stringify(data.user));
      onLoginSuccess(data.user);
      onClose();
    } catch (err) {
      setErrorMsg(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const isOfficer = activeLoginRole === 'officer';

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0, 0, 0, 0.78)',
      backdropFilter: 'blur(10px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 100,
      padding: '20px'
    }}>
      <div
        className="glass-panel"
        style={{
          width: '100%',
          maxWidth: '460px',
          padding: '28px',
          background: '#0b1120',
          border: isOfficer ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid rgba(99, 102, 241, 0.4)',
          boxShadow: isOfficer ? '0 12px 36px rgba(16, 185, 129, 0.15)' : '0 12px 36px rgba(99, 102, 241, 0.15)'
        }}
      >
        
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              background: isOfficer ? 'rgba(16, 185, 129, 0.2)' : 'rgba(99, 102, 241, 0.2)',
              border: isOfficer ? '1px solid #10b981' : '1px solid #6366f1',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              {isOfficer ? <ShieldCheck size={20} color="#10b981" /> : <UserCheck size={20} color="#818cf8" />}
            </div>
            <div>
              <h2 style={{ fontSize: '1.2rem', color: '#fff', margin: 0 }}>
                {isRegister
                  ? (isOfficer ? 'Register Officer Account' : 'Register Citizen Account')
                  : (isOfficer ? 'Municipal Officer Login' : 'Citizen Portal Login')
                }
              </h2>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>
                {isOfficer
                  ? 'Authorized department triage & AI validation controls'
                  : 'Submit natural language complaints & track resolution'
                }
              </p>
            </div>
          </div>
          <button className="btn btn-outline" style={{ padding: '6px 10px' }} onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        {/* Separate Portal Selector Tabs */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '6px',
          background: 'rgba(255,255,255,0.04)',
          padding: '4px',
          borderRadius: '10px',
          border: '1px solid var(--border-color)',
          marginBottom: '16px'
        }}>
          <button
            type="button"
            className="btn"
            style={{
              padding: '8px',
              fontSize: '0.8rem',
              borderRadius: '6px',
              background: !isOfficer ? 'var(--primary)' : 'transparent',
              color: !isOfficer ? '#fff' : 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
            onClick={() => handleRoleTabSwitch('citizen')}
          >
            <UserCheck size={14} /> Citizen Portal
          </button>

          <button
            type="button"
            className="btn"
            style={{
              padding: '8px',
              fontSize: '0.8rem',
              borderRadius: '6px',
              background: isOfficer ? '#059669' : 'transparent',
              color: isOfficer ? '#fff' : 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
            onClick={() => handleRoleTabSwitch('officer')}
          >
            <ShieldCheck size={14} /> Officer / Admin
          </button>
        </div>

        {/* Demo Auto-fill Helper Banner */}
        <div style={{
          marginBottom: '16px',
          padding: '10px 14px',
          background: isOfficer ? 'rgba(16, 185, 129, 0.08)' : 'rgba(99, 102, 241, 0.08)',
          borderRadius: '8px',
          border: isOfficer ? '1px solid rgba(16, 185, 129, 0.25)' : '1px solid rgba(99, 102, 241, 0.25)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div>
            <p style={{ fontSize: '0.72rem', color: isOfficer ? '#a7f3d0' : '#c7d2fe', margin: 0, fontWeight: 600 }}>
              {isOfficer ? 'Officer Demo Account:' : 'Citizen Demo Account:'}
            </p>
            <code style={{ fontSize: '0.74rem', color: '#fff' }}>
              {isOfficer ? 'officer@civicsense.org / officer123' : 'citizen@civicsense.org / citizen123'}
            </code>
          </div>
          <button
            type="button"
            className="btn btn-secondary"
            style={{ fontSize: '0.7rem', padding: '4px 8px' }}
            onClick={() => handleRoleTabSwitch(activeLoginRole)}
          >
            Reset Demo
          </button>
        </div>

        {errorMsg && (
          <div style={{ padding: '10px', borderRadius: '8px', background: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.3)', color: '#fb7185', fontSize: '0.82rem', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <AlertCircle size={15} /> {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {isRegister && (
            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                Full Name:
              </label>
              <input
                type="text"
                className="input-field"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={isOfficer ? "Officer Divya Ramesh" : "Anand Kumar"}
                required
              />
            </div>
          )}

          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
              Email Address:
            </label>
            <input
              type="email"
              className="input-field"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={isOfficer ? "officer@civicsense.org" : "citizen@civicsense.org"}
              required
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
              Password:
            </label>
            <input
              type="password"
              className="input-field"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            className="btn"
            style={{
              width: '100%',
              padding: '12px',
              marginBottom: '14px',
              background: isOfficer ? '#059669' : 'var(--primary)',
              color: '#fff',
              fontWeight: 600,
              fontSize: '0.9rem'
            }}
            disabled={loading}
          >
            {loading
              ? 'Authenticating...'
              : isRegister
                ? (isOfficer ? 'Create Officer Account' : 'Create Citizen Account')
                : (isOfficer ? 'Sign In as Officer' : 'Sign In as Citizen')
            }
          </button>

          <div style={{ textAlign: 'center' }}>
            <button
              type="button"
              style={{ background: 'none', border: 'none', color: isOfficer ? '#34d399' : '#818cf8', fontSize: '0.82rem', cursor: 'pointer' }}
              onClick={() => setIsRegister(!isRegister)}
            >
              {isRegister
                ? 'Already registered? Sign In instead'
                : `Don't have an account? Register as ${isOfficer ? 'Officer' : 'Citizen'}`
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
