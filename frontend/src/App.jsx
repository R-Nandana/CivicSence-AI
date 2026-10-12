import React, { useState, useEffect } from 'react';

// 1st Classic UI Components
import Navbar from './components/Navbar';
import CitizenPortal from './pages/CitizenPortal';
import OfficerPortal from './pages/OfficerPortal';
import EdaView from './pages/EdaView';
import MultilingualPage from './pages/MultilingualPage';
import MarketBasketPage from './pages/MarketBasketPage';
import QAChatPage from './pages/QAChatPage';
import AuthModal from './pages/AuthModal';

// Authentication & Split-Screen Login Page
import LoginPage from './pages/LoginPage';

// Intelligence Workspace Components
import Sidebar from './components/Sidebar';
import TopNav from './components/TopNav';
import CitizenDashboardScreen from './screens/CitizenDashboardScreen';
import TextSubmissionScreen from './screens/TextSubmissionScreen';
import TextClassificationScreen from './screens/TextClassificationScreen';
import NerResultsScreen from './screens/NerResultsScreen';
import MultilingualScreen from './screens/MultilingualScreen';
import TranslationResultsScreen from './screens/TranslationResultsScreen';
import VoiceRecordScreen from './screens/VoiceRecordScreen';
import SpeechResultsScreen from './screens/SpeechResultsScreen';
import ImageEvidenceScreen from './screens/ImageEvidenceScreen';
import VideoEvidenceScreen from './screens/VideoEvidenceScreen';
import RelatedComplaintsScreen from './screens/RelatedComplaintsScreen';
import IssueTimelineScreen from './screens/IssueTimelineScreen';
import ResolutionAlertsScreen from './screens/ResolutionAlertsScreen';
import HumanValidationScreen from './screens/HumanValidationScreen';
import AdminAnalyticsScreen from './screens/AdminAnalyticsScreen';
import DatabaseQaScreen from './screens/DatabaseQaScreen';
import QaAnalyticsScreen from './screens/QaAnalyticsScreen';
import EdaDashboardScreen from './screens/EdaDashboardScreen';

export default function App() {
  const [user, setUser] = useState(null);
  
  // Theme state: 'dark' | 'light'
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('civicsense_theme') || 'dark';
  });

  // View Mode: 'suite' (Default Workspace) vs 'classic' (Classic Portal)
  const [viewMode, setViewMode] = useState('suite');
  
  // 1st UI Navigation Tab
  const [classicTab, setClassicTab] = useState('complaints');
  
  // Suite Active Screen
  const [activeScreen, setActiveScreen] = useState('citizen-dashboard');
  const [selectedComplaintId, setSelectedComplaintId] = useState(null);
  
  // Auth Modal State
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalRole, setAuthModalRole] = useState('citizen');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('civicsense_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  useEffect(() => {
    // Check local storage for authenticated session
    const savedUser = localStorage.getItem('civicsense_user');
    const token = localStorage.getItem('civicsense_token');
    if (savedUser && token) {
      try {
        const parsed = JSON.parse(savedUser);
        setUser(parsed);
        if (parsed.role === 'officer') {
          setActiveScreen('admin-dashboard');
          setClassicTab('officer');
        } else {
          setActiveScreen('citizen-dashboard');
          setClassicTab('complaints');
        }
      } catch (e) {
        localStorage.removeItem('civicsense_user');
        localStorage.removeItem('civicsense_token');
      }
    }
  }, []);

  const handleLoginSuccess = (loggedInUser) => {
    setUser(loggedInUser);
    setAuthModalOpen(false);
    if (loggedInUser.role === 'officer') {
      setActiveScreen('admin-dashboard');
      setClassicTab('officer');
    } else {
      setActiveScreen('citizen-dashboard');
      setClassicTab('complaints');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('civicsense_token');
    localStorage.removeItem('civicsense_user');
    setUser(null);
    setActiveScreen('citizen-dashboard');
    setClassicTab('complaints');
  };

  const handleSwitchRole = (newRole) => {
    if (newRole === 'officer' && user?.role === 'citizen') {
      handleOpenAuth('officer');
      return;
    }
    const updated = {
      ...user,
      role: newRole,
      name: newRole === 'officer' ? 'Municipal Officer' : 'Jane Citizen',
      email: newRole === 'officer' ? 'officer@civicsense.org' : 'citizen@civicsense.org'
    };
    setUser(updated);
    localStorage.setItem('civicsense_user', JSON.stringify(updated));
    if (newRole === 'officer') {
      setActiveScreen('admin-dashboard');
      setClassicTab('officer');
    } else {
      setActiveScreen('citizen-dashboard');
      setClassicTab('complaints');
    }
  };

  const handleOpenAuth = (role = 'citizen') => {
    setAuthModalRole(role);
    setAuthModalOpen(true);
  };

  // If user is not logged in, render the Split-Screen Login Page
  if (!user) {
    return (
      <LoginPage
        onLoginSuccess={handleLoginSuccess}
        onExploreEda={() => {
          const guest = { name: "Guest Reviewer", email: "guest@civicsense.org", role: "officer" };
          setUser(guest);
          setViewMode('suite');
          setActiveScreen('eda-dashboard');
        }}
        theme={theme}
        onToggleTheme={toggleTheme}
      />
    );
  }

  // =========================================================================
  // MODE 1: CLASSIC PORTAL UI
  // =========================================================================
  if (viewMode === 'classic') {
    const renderClassicContent = () => {
      if (user.role === 'citizen') {
        switch (classicTab) {
          case 'multilingual':
            return <MultilingualPage />;
          case 'qachat':
            return <QAChatPage />;
          case 'complaints':
          default:
            return <CitizenPortal user={user} onOpenAuth={handleOpenAuth} />;
        }
      }

      // Officer Tabs: strictly Officer Control Center, EDA, Market Basket
      switch (classicTab) {
        case 'officer':
          return <OfficerPortal user={user} onOpenAuth={handleOpenAuth} />;
        case 'eda':
          return <EdaView />;
        case 'marketbasket':
          return <MarketBasketPage />;
        default:
          return <OfficerPortal user={user} onOpenAuth={handleOpenAuth} />;
      }
    };

    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg-dark)', color: 'var(--text-main)', display: 'flex', flexDirection: 'column' }}>
        <Navbar
          user={user}
          onLogout={handleLogout}
          onOpenAuth={handleOpenAuth}
          activeTab={classicTab}
          setActiveTab={setClassicTab}
          onToggleViewMode={() => setViewMode('suite')}
          theme={theme}
          onToggleTheme={toggleTheme}
        />

        <main style={{ flex: 1, padding: '24px', maxWidth: '1400px', width: '100%', margin: '0 auto' }}>
          {renderClassicContent()}
        </main>

        <AuthModal
          isOpen={authModalOpen}
          onClose={() => setAuthModalOpen(false)}
          onLoginSuccess={handleLoginSuccess}
          initialRole={authModalRole}
        />
      </div>
    );
  }

  // =========================================================================
  // MODE 2: ROLE-SEPARATED INTELLIGENCE WORKSPACE UI
  // =========================================================================
  const renderSuiteScreen = () => {
    // ── ROLE PROTECTION: Citizens cannot access internal officer screens ──
    const officerOnlyScreens = [
      'admin-dashboard',
      'related-complaints',
      'resolution-alerts',
      'human-validation',
      'eda-dashboard',
      'qa-analytics',
      'text-classification',
      'ner-results',
      'speech-results',
      'translation',
      'image-analysis',
      'video-analysis'
    ];
    if (user?.role === 'citizen' && officerOnlyScreens.includes(activeScreen)) {
      return (
        <CitizenDashboardScreen
          onNavigate={setActiveScreen}
          onSelectComplaint={(id) => {
            setSelectedComplaintId(id);
            setActiveScreen('issue-timeline');
          }}
        />
      );
    }

    // ── ROLE PROTECTION: Officers do not file complaints or view citizen filing ──
    const citizenOnlyScreens = [
      'citizen-dashboard',
      'text-submission',
      'voice-record',
      'image-upload',
      'video-upload'
    ];
    if (user?.role === 'officer' && citizenOnlyScreens.includes(activeScreen)) {
      return <AdminAnalyticsScreen />;
    }

    switch (activeScreen) {
      // 1. Citizen Screens
      case 'citizen-dashboard':
        return (
          <CitizenDashboardScreen
            onNavigate={setActiveScreen}
            onSelectComplaint={(id) => {
              setSelectedComplaintId(id);
              setActiveScreen('issue-timeline');
            }}
          />
        );
      case 'text-submission':
        return (
          <TextSubmissionScreen
            onNavigate={setActiveScreen}
            onComplaintCreated={(comp) => {
              setSelectedComplaintId(comp.complaint_id);
            }}
          />
        );
      case 'voice-record':
        return (
          <VoiceRecordScreen
            onNavigate={setActiveScreen}
            onTranscriptionReady={(txt) => {
              setActiveScreen('text-submission');
            }}
          />
        );
      case 'image-upload':
        return <ImageEvidenceScreen initialComplaintId={selectedComplaintId} user={user} />;
      case 'video-upload':
        return <VideoEvidenceScreen user={user} />;
      case 'issue-timeline':
        return <IssueTimelineScreen selectedComplaintId={selectedComplaintId} />;
      case 'multilingual':
        return <MultilingualScreen onNavigate={setActiveScreen} />;
      case 'qa-interface':
        return <DatabaseQaScreen onNavigate={setActiveScreen} />;

      // 2. Municipal Officer Screens
      case 'admin-dashboard':
        return <AdminAnalyticsScreen />;
      case 'related-complaints':
        return (
          <RelatedComplaintsScreen
            onNavigate={setActiveScreen}
            onSelectComplaint={(id) => {
              setSelectedComplaintId(id);
              setActiveScreen('issue-timeline');
            }}
          />
        );
      case 'resolution-alerts':
        return <ResolutionAlertsScreen user={user} />;
      case 'human-validation':
        return <HumanValidationScreen user={user} />;
      case 'image-analysis':
        return <ImageEvidenceScreen initialComplaintId={selectedComplaintId} user={user} />;
      case 'video-analysis':
        return <VideoEvidenceScreen user={user} />;
      case 'eda-dashboard':
        return <EdaDashboardScreen />;
      case 'text-classification':
        return <TextClassificationScreen />;
      case 'ner-results':
        return <NerResultsScreen />;
      case 'speech-results':
        return <SpeechResultsScreen />;
      case 'translation':
        return <TranslationResultsScreen />;
      case 'qa-analytics':
        return <QaAnalyticsScreen />;

      default:
        return user?.role === 'officer' ? <AdminAnalyticsScreen /> : <CitizenDashboardScreen onNavigate={setActiveScreen} />;
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-dark)', color: 'var(--text-main)', transition: 'background 0.25s ease, color 0.25s ease' }}>
      {/* Role-Specific Interactive Sidebar Navigation */}
      <Sidebar
        activeScreen={activeScreen}
        setActiveScreen={setActiveScreen}
        user={user}
        onLogout={handleLogout}
      />

      {/* Main Content Workspace */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Top Navigation */}
        <TopNav
          activeScreen={activeScreen}
          user={user}
          onSwitchRole={handleSwitchRole}
          onLogout={handleLogout}
          onToggleViewMode={() => setViewMode('classic')}
          theme={theme}
          onToggleTheme={toggleTheme}
        />

        {/* Scrollable Screen Content Area */}
        <main style={{ flex: 1, background: 'var(--bg-dark)', overflowY: 'auto', transition: 'background 0.25s ease' }}>
          {renderSuiteScreen()}
        </main>

        {/* Smart City Footer */}
        <footer style={{
          borderTop: '1px solid var(--border-color)',
          padding: '14px 28px',
          background: 'var(--topbar-bg)',
          fontSize: '0.8rem',
          color: 'var(--text-dim)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '10px',
          transition: 'background 0.25s ease'
        }}>
          <div>
            <strong style={{ color: 'var(--text-main)' }}>CivicSense AI</strong> — Smart City Urban Grievance Intelligence & Resolution System
          </div>
          <div style={{ fontSize: '0.75rem' }}>
            {user?.role === 'officer' ? 'Municipal Officer Active Session' : 'Citizen Grievance Services'}
          </div>
        </footer>
      </div>
    </div>
  );
}
