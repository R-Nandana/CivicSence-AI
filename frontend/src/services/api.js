/**
 * CivicSense API Client Service
 * Connects frontend UI to FastAPI backend endpoints.
 */

const API_BASE = '/api';

function getAuthHeaders() {
  const token = localStorage.getItem('civicsense_token');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
}

async function handleResponse(res) {
  let data = null;
  const text = await res.text();
  if (text) {
    try {
      data = JSON.parse(text);
    } catch (e) {
      data = { detail: text };
    }
  }
  
  if (!res.ok) {
    const errorMsg = data?.detail || `Server error (${res.status}): Backend may be starting or offline.`;
    throw new Error(errorMsg);
  }
  
  return data;
}

export const api = {
  // Auth
  async login(email, password) {
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      return await handleResponse(res);
    } catch (err) {
      if (err.message.includes('Failed to fetch') || err.message.includes('NetworkError')) {
        throw new Error('Cannot reach FastAPI backend server on port 8000. Please start the backend.');
      }
      throw err;
    }
  },

  async register(name, email, password, role = 'citizen') {
    try {
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, role })
      });
      return await handleResponse(res);
    } catch (err) {
      if (err.message.includes('Failed to fetch') || err.message.includes('NetworkError')) {
        throw new Error('Cannot reach FastAPI backend server on port 8000. Please start the backend.');
      }
      throw err;
    }
  },

  async getMe() {
    try {
      const res = await fetch(`${API_BASE}/auth/me`, {
        headers: { ...getAuthHeaders() }
      });
      if (!res.ok) return null;
      return await handleResponse(res);
    } catch {
      return null;
    }
  },

  // NLP Live Prediction
  async predict(complaint, location = '') {
    const res = await fetch(`${API_BASE}/predict`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      },
      body: JSON.stringify({ complaint, location })
    });
    return await handleResponse(res);
  },

  // Citizen Complaint Submission
  async submitComplaint(complaint_text, location = '') {
    const res = await fetch(`${API_BASE}/complaints`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      },
      body: JSON.stringify({ complaint_text, location })
    });
    return await handleResponse(res);
  },

  async getMyComplaints() {
    const res = await fetch(`${API_BASE}/complaints/my`, {
      headers: { ...getAuthHeaders() }
    });
    return await handleResponse(res);
  },

  async getComplaintFullDetails(complaintId) {
    const res = await fetch(`${API_BASE}/complaints/${complaintId}/full`, {
      headers: { ...getAuthHeaders() }
    });
    return await handleResponse(res);
  },

  // Officer / Admin Endpoints
  async getAdminComplaints(filters = {}) {
    const params = new URLSearchParams();
    if (filters.category) params.append('category', filters.category);
    if (filters.source) params.append('source', filters.source);
    if (filters.status) params.append('status', filters.status);
    if (filters.search) params.append('search', filters.search);
    params.append('limit', filters.limit || 200);

    const res = await fetch(`${API_BASE}/admin/complaints?${params.toString()}`, {
      headers: { ...getAuthHeaders() }
    });
    return await handleResponse(res);
  },

  async updateComplaintStatus(complaintId, status) {
    const res = await fetch(`${API_BASE}/admin/complaints/${complaintId}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      },
      body: JSON.stringify({ status })
    });
    return await handleResponse(res);
  },

  async validatePrediction(complaintId, originalPrediction, correctCategory, notes = '') {
    const res = await fetch(`${API_BASE}/admin/validate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      },
      body: JSON.stringify({
        complaint_id: complaintId,
        original_prediction: originalPrediction,
        correct_category: correctCategory,
        notes
      })
    });
    return await handleResponse(res);
  },

  async getValidatedFeedback() {
    const res = await fetch(`${API_BASE}/admin/validated-feedback`, {
      headers: { ...getAuthHeaders() }
    });
    return await handleResponse(res);
  },

  async getAdminStats() {
    const res = await fetch(`${API_BASE}/admin/stats`, {
      headers: { ...getAuthHeaders() }
    });
    return await handleResponse(res);
  },

  // EDA Statistics
  async getEdaSummary() {
    const res = await fetch(`${API_BASE}/eda/summary`);
    return await handleResponse(res);
  },

  // Machine Translation
  async translateText(text, sourceLanguage = null) {
    const res = await fetch(`${API_BASE}/nlp/translate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, source_language: sourceLanguage })
    });
    return await handleResponse(res);
  },

  // Speech-to-Text / Audio Upload
  async transcribeAudio(formData) {
    const res = await fetch(`${API_BASE}/nlp/speech-to-text`, {
      method: 'POST',
      headers: { ...getAuthHeaders() },
      body: formData
    });
    return await handleResponse(res);
  },

  // LLM Universal Translation
  async translateLLM(text, sourceLanguage = null) {
    const res = await fetch(`${API_BASE}/nlp/translate-llm`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, source_language: sourceLanguage })
    });
    return await handleResponse(res);
  },

  async detectLanguage(text) {
    const res = await fetch(`${API_BASE}/nlp/detect-language`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text })
    });
    return await handleResponse(res);
  },

  async askQuestion(question, context = null) {
    const res = await fetch(`${API_BASE}/nlp/qa`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question, context })
    });
    return await handleResponse(res);
  },

  async getAllFaqs() {
    const res = await fetch(`${API_BASE}/nlp/qa/faqs`);
    return await handleResponse(res);
  },

  async chatMessage(message, sessionId = 'default') {
    const res = await fetch(`${API_BASE}/nlp/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, session_id: sessionId })
    });
    return await handleResponse(res);
  },

  async clearChatSession(sessionId) {
    const res = await fetch(`${API_BASE}/nlp/chat/clear/${sessionId}`, { method: 'DELETE' });
    return await handleResponse(res);
  },

  async runMarketBasket(minSupport = 0.15, minConfidence = 0.5, minLift = 1.0) {
    const res = await fetch(`${API_BASE}/nlp/market-basket`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ min_support: minSupport, min_confidence: minConfidence, min_lift: minLift })
    });
    return await handleResponse(res);
  },

  // Computer Vision & Evidence Verification
  async uploadImageEvidence(complaintId, file, geoLat = null, geoLon = null, geoAddress = '') {
    const formData = new FormData();
    formData.append('complaint_id', complaintId);
    formData.append('file', file);
    if (geoLat !== null && geoLat !== undefined) formData.append('geo_lat', geoLat);
    if (geoLon !== null && geoLon !== undefined) formData.append('geo_lon', geoLon);
    if (geoAddress) formData.append('geo_address', geoAddress);
    const res = await fetch(`${API_BASE}/evidence/upload-image`, {
      method: 'POST',
      headers: { ...getAuthHeaders() },
      body: formData
    });
    return await handleResponse(res);
  },

  async uploadVideoEvidence(complaintId, file, geoLat = null, geoLon = null, geoAddress = '') {
    const formData = new FormData();
    formData.append('complaint_id', complaintId);
    formData.append('file', file);
    if (geoLat !== null && geoLat !== undefined) formData.append('geo_lat', geoLat);
    if (geoLon !== null && geoLon !== undefined) formData.append('geo_lon', geoLon);
    if (geoAddress) formData.append('geo_address', geoAddress);
    const res = await fetch(`${API_BASE}/evidence/upload-video`, {
      method: 'POST',
      headers: { ...getAuthHeaders() },
      body: formData
    });
    return await handleResponse(res);
  },

  async getComplaintEvidence(complaintId) {
    const res = await fetch(`${API_BASE}/evidence/complaint/${complaintId}`, {
      headers: { ...getAuthHeaders() }
    });
    return await handleResponse(res);
  },

  async getAllEvidence() {
    const res = await fetch(`${API_BASE}/evidence/all`, {
      headers: { ...getAuthHeaders() }
    });
    return await handleResponse(res);
  },

  async reviewEvidence(evidenceId, reviewStatus, correctedAssessment = null, notes = '') {
    const res = await fetch(`${API_BASE}/evidence/${evidenceId}/review`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      },
      body: JSON.stringify({
        officer_review_status: reviewStatus,
        corrected_assessment: correctedAssessment,
        officer_notes: notes
      })
    });
    return await handleResponse(res);
  },

  // Related Complaints & Issue Timeline
  async checkRelatedComplaints(complaintText, category = '', location = '') {
    const res = await fetch(`${API_BASE}/related/check`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      },
      body: JSON.stringify({
        complaint_text: complaintText,
        category,
        location
      })
    });
    return await handleResponse(res);
  },

  async getIssueGroups() {
    const res = await fetch(`${API_BASE}/related/groups`, {
      headers: { ...getAuthHeaders() }
    });
    return await handleResponse(res);
  },

  async getIssueGroupDetail(groupId) {
    const res = await fetch(`${API_BASE}/related/groups/${groupId}`, {
      headers: { ...getAuthHeaders() }
    });
    return await handleResponse(res);
  },

  async getComplaintTimeline(complaintId) {
    const res = await fetch(`${API_BASE}/related/timeline/${complaintId}`, {
      headers: { ...getAuthHeaders() }
    });
    return await handleResponse(res);
  },

  // Resolution Monitoring & Inconsistency Alerts
  async getResolutionAlerts(status = null) {
    const url = status ? `${API_BASE}/resolution/alerts?status=${status}` : `${API_BASE}/resolution/alerts`;
    const res = await fetch(url, {
      headers: { ...getAuthHeaders() }
    });
    return await handleResponse(res);
  },

  async determineResolutionAlert(alertId, decision, notes = '') {
    const res = await fetch(`${API_BASE}/resolution/alerts/${alertId}/determine`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      },
      body: JSON.stringify({ decision, notes })
    });
    return await handleResponse(res);
  },

  async getResolutionStats() {
    const res = await fetch(`${API_BASE}/resolution/stats`, {
      headers: { ...getAuthHeaders() }
    });
    return await handleResponse(res);
  },

  // Concept 6: Database-Grounded Question Answering
  async askDatabaseQA(question) {
    const res = await fetch(`${API_BASE}/nlp/db-qa`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      },
      body: JSON.stringify({ question })
    });
    return await handleResponse(res);
  },

  async getDatabaseQASamples() {
    const res = await fetch(`${API_BASE}/nlp/db-qa/samples`);
    return await handleResponse(res);
  },

  async getDatabaseQALogs() {
    const res = await fetch(`${API_BASE}/nlp/db-qa/logs`, {
      headers: { ...getAuthHeaders() }
    });
    return await handleResponse(res);
  }
};
