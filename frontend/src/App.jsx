import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import TopNav from './components/TopNav';
import LoginPage from './pages/LoginPage';

// Screen Components
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
  const [activeScreen, setActiveScreen] = useState('citizen-dashboard');
  const [selectedComplaintId, setSelectedComplaintId] = useState(null);

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
        } else {
          setActiveScreen('citizen-dashboard');
        }
      } catch (e) {
        localStorage.removeItem('civicsense_user');
        localStorage.removeItem('civicsense_token');
      }
    }
  }, []);

  const handleLoginSuccess = (loggedInUser) => {
    setUser(loggedInUser);
    if (loggedInUser.role === 'officer') {
      setActiveScreen('admin-dashboard');
    } else {
      setActiveScreen('citizen-dashboard');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('civicsense_token');
    localStorage.removeItem('civicsense_user');
    setUser(null);
    setActiveScreen('citizen-dashboard');
  };

  const handleSwitchRole = (newRole) => {
    if (!user) return;
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
    } else {
      setActiveScreen('citizen-dashboard');
    }
  };

  // If user is not logged in, render the Split-Screen Login Page
  if (!user) {
    return (
      <LoginPage
        onLoginSuccess={handleLoginSuccess}
        onExploreEda={() => {
          // Guest Explore Mode
          const guest = { name: "Guest Reviewer", email: "guest@civicsense.org", role: "officer" };
          setUser(guest);
          setActiveScreen('eda-dashboard');
        }}
      />
    );
  }

  // Render the Selected Screen
  const renderScreen = () => {
    switch (activeScreen) {
      // 0. Authentication Screen
      case 'login':
        return (
          <LoginPage
            onLoginSuccess={(u) => {
              handleLoginSuccess(u);
              setActiveScreen(u.role === 'officer' ? 'admin-dashboard' : 'citizen-dashboard');
            }}
            onExploreEda={() => {
              const guest = { name: "Guest Reviewer", email: "guest@civicsense.org", role: "officer" };
              setUser(guest);
              setActiveScreen('eda-dashboard');
            }}
          />
        );

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

      // 2. Computer Vision Evidence Screens
      case 'image-upload':
      case 'image-analysis':
        return <ImageEvidenceScreen initialComplaintId={selectedComplaintId} user={user} />;
      case 'video-upload':
      case 'video-analysis':
        return <VideoEvidenceScreen user={user} />;

      // 3. NLP Concepts 1 - 6
      case 'text-classification':
        return <TextClassificationScreen />;
      case 'ner-results':
        return <NerResultsScreen />;
      case 'multilingual':
        return <MultilingualScreen onNavigate={setActiveScreen} />;
      case 'translation':
        return <TranslationResultsScreen />;
      case 'speech-results':
        return <SpeechResultsScreen />;
      case 'qa-interface':
        return <DatabaseQaScreen onNavigate={setActiveScreen} />;
      case 'qa-analytics':
        return <QaAnalyticsScreen />;

      // 4. Governance & Core Differentiators
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
      case 'issue-timeline':
        return <IssueTimelineScreen selectedComplaintId={selectedComplaintId} />;
      case 'resolution-alerts':
        return <ResolutionAlertsScreen user={user} />;
      case 'human-validation':
        return <HumanValidationScreen user={user} />;
      case 'eda-dashboard':
        return <EdaDashboardScreen />;

      default:
        return <CitizenDashboardScreen onNavigate={setActiveScreen} />;
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#090d16', color: '#f8fafc' }}>
      {/* Dark Navy Sidebar Navigation */}
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
        />

        {/* Scrollable Screen Content Area */}
        <main style={{ flex: 1, background: '#090d16', overflowY: 'auto' }}>
          {renderScreen()}
        </main>

        {/* Academic Footer */}
        <footer style={{
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          padding: '16px 28px',
          background: 'rgba(9, 13, 22, 0.98)',
          fontSize: '0.8rem',
          color: '#64748b',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '10px'
        }}>
          <div>
            <strong style={{ color: '#fff' }}>CivicSense AI</strong> — NLP-Based Civic Complaint Intelligence & Resolution Monitoring System
          </div>
          <div>
            Powered by <strong>TF-IDF Softmax Classifier</strong> + <strong>NER</strong> + <strong>Acoustics & WER</strong> + <strong>CV Keyframes</strong> + <strong>Database QA</strong>
          </div>
        </footer>
      </div>
    </div>
  );
}
