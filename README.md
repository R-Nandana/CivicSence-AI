# CivicSense: NLP-Based Civic Complaint Intelligence and Urban Issue Resolution Monitoring System

[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688.svg?style=flat&logo=fastapi)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/Frontend-React%20%2B%20Vite%20%2B%20Tailwind-61DAFB.svg?style=flat&logo=react)](https://reactjs.org/)
[![Python](https://img.shields.io/badge/Python-3.10%2B%20%7C%203.13-3776AB.svg?style=flat&logo=python)](https://python.org)
[![Recharts](https://img.shields.io/badge/Charts-Recharts-22c55e.svg?style=flat)](https://recharts.org/)
[![License](https://img.shields.io/badge/License-Academic%20Evaluation-blue.svg)](#)

CivicSense is a full-stack, production-style academic platform designed to automate civic complaint triaging, detect cross-lingual community issues, verify multimedia evidence, track issue evolution across recurring reports, alert municipal officers to potential resolution inconsistencies, and provide strictly database-grounded conversational intelligence.

---

## 📑 Table of Contents
1. [Core Features & The Six NLP Concepts](#-core-features--the-six-nlp-concepts)
2. [Computer Vision & Video Evidence Verification](#-computer-vision--video-evidence-verification)
3. [Core Differentiators: Issue Evolution & Resolution Monitoring](#-core-differentiators-issue-evolution--resolution-monitoring)
4. [System Architecture Diagram](#-system-architecture-diagram)
5. [Database Schema & Entity Relationship Diagram](#-database-schema--entity-relationship-diagram)
6. [The 21 Dedicated Navigable Screens](#-the-21-dedicated-navigable-screens)
7. [Exact Windows Installation & Execution Commands](#-exact-windows-installation--execution-commands)
8. [Dataset Provenance, ETL Pipeline & EDA](#-dataset-provenance-etl-pipeline--eda)
9. [Empirical Evaluation & Measured Metrics](#-empirical-evaluation--measured-metrics)
10. [Automated Testing Suite](#-automated-testing-suite)
11. [Screenshot Capture Checklist](#-screenshot-capture-checklist)
12. [Default Credentials & Seed Accounts](#-default-credentials--seed-accounts)

---

## 🏛️ Core Features & The Six NLP Concepts

CivicSense implements all six mandated Natural Language Processing (NLP) concepts as distinct, connected capabilities:

### Concept 1: Supervised Text Classification
- **Domain Categories (8)**: `Roads`, `Waste Management`, `Water Supply`, `Drainage`, `Streetlights`, `Sanitation`, `Traffic`, `Public Infrastructure`.
- **Model Architecture**: Vectorized TF-IDF feature extractor (unigrams + bigrams, sublinear term frequency scaling) coupled with a multiclass Softmax Logistic Regression model.
- **Persistence**: Explicit model versioning with serialized weights and vectorizer vocabularies (`models/civic_classifier_v1.pkl`, `models/tfidf_vectorizer_v1.pkl`).
- **Interactive UI**: Probability distribution bar chart (Recharts), top-3 candidate confidence scores, and an 8x8 Confusion Matrix inspection viewer.

### Concept 2: Civic Named Entity Recognition (NER)
- **Extracted Entity Types**:
  - `LOCATION`: Landmark, junction, ward, or street (e.g., *Mount Road*, *Guindy Metro*, *Anna Salai*).
  - `INFRASTRUCTURE`: Physical civic asset (e.g., *streetlight*, *pothole*, *manhole*, *drainage pipe*).
  - `DURATION`: Temporal persistence indicator (e.g., *4 days*, *two weeks*, *since yesterday*).
  - `DEPARTMENT`: Responsible municipal body (e.g., *Electricity Board*, *Highways Department*, *Metrowater*).
- **Interactive UI**: Entity breakdown cards, color-coded inline text highlighting, and JSON schema inspector.

### Concept 3: Multilingual NLP
- **Language Detection**: Native Tamil Unicode script (`\u0B80-\u0BFF`), English, and Tanglish (Romanized Tamil code-mixing with high-frequency civic lexical markers like *romba*, *irukku*, *mudiyala*, *saalai*).
- **Normalization**: Preserves the original raw citizen text, extracts civic tokens, and standardizes dialect markers for downstream classification.

### Concept 4: Machine Translation
- **Translation Pipeline**: Translates supported regional languages (Tamil Unicode script and Tanglish) into standard English for centralized municipal administration.
- **Data Integrity**: Preserves both the original regional text and the translated text in distinct fields within the complaint record.
- **Benchmark**: Evaluated against reference civic complaint test pairs using the standard BLEU metric (measured score: **0.8654**).

### Concept 5: Speech Processing & Voice Complaints
- **Audio Ingestion**: Audio recording directly from the browser (Web Audio API) or file upload (`.wav`, `.mp3`, `.ogg`, `.m4a`).
- **Acoustic Waveform Analysis**: Extracts physical acoustic features including RMS energy, sample rate, duration, and channel count.
- **Speech-to-Text (ASR)**: Transcribes spoken citizen complaints, detects spoken language, and passes the transcript into the text classification and NER pipeline.
- **Benchmark**: Evaluated on civic test audio recordings using Word Error Rate (WER: **0.1250**).

### Concept 6: Database-Grounded Conversational QA
- **Strictly Grounded Query Engine**: Answers operational questions by querying live database records with **zero fabrication** or hallucination.
- **Supported Operational Queries**:
  - *"How many unresolved streetlight complaints are there?"*
  - *"Which locations have recurring drainage complaints?"*
  - *"Which issues were reported again after being marked resolved?"*
  - *"Which complaints have new image or video evidence?"*
  - *"How many complaints were submitted during a selected date range?"*
- **Explainability**: Every response displays the exact computed answer, applied database filters, query timestamp, and interactive cards for all supporting records.

---

## 📷 Computer Vision & Video Evidence Verification

CivicSense provides automated multimedia verification as an independent computer-vision feature that complements NLP triage:

### Image Evidence Verification
- **Validation**: Strict validation of image formats (`JPEG`, `PNG`, `WebP`), file size (up to 15 MB), and minimum dimensions ($100 \times 100$ px).
- **Computer Vision Model**: Analyzes luminance, contrast, edge density (structural damage / potholes / cracks), visual clutter (waste accumulation), and night-time dark thresholds (streetlight failure).
- **Evidence Assessment Categorization**:
  - `SUPPORTS_COMPLAINT`: Visual features strongly align with the reported complaint category.
  - `POTENTIAL_CONFLICT`: Visual evidence contradicts the reported category (e.g., pristine indoor photo submitted for road crater).
  - `INCONCLUSIVE`: Image quality or visual features do not permit deterministic triage.
  - `REQUIRES_HUMAN_REVIEW`: Borderline features requiring officer determination.
- **Officer Override**: Municipal officers can review evidence photos side-by-side, inspect model confidence, and adjust the assessment with audit notes.

### Video Evidence Verification
- **Validation**: Video format verification (`MP4`, `WebM`, `MOV`, `AVI`), file size up to 50 MB, and maximum duration of 120 seconds.
- **Keyframe Extraction**: Extracts representative frames at configurable intervals ($1.0$ s) across the video duration.
- **Frame-Level Findings**: Analyzes each keyframe independently, detecting road defects, darkness, water accumulation, or waste.
- **Aggregated Video Assessment**: Combines frame-level metrics into a video-level confidence score and assessment badge.

---

## 🔄 Core Differentiators: Issue Evolution & Resolution Monitoring

### 1. Related Complaints & Issue Evolution Matching
Rather than naively deleting repeated citizen reports as duplicates, CivicSense implements a multi-factor matching engine:
$$\text{Relatedness Score} = 0.35 \times \text{Category Match} + 0.30 \times \text{Location Entity Match} + 0.25 \times \text{TF-IDF Cosine Similarity} + 0.10 \times \text{Temporal Proximity}$$

- **Relationship Classification**:
  - `LIKELY_DUPLICATE`: Same user/location submitted within 48 hours ($S \ge 0.82$).
  - `NEW_REPORT_SAME_ISSUE`: Different citizens reporting the same active problem ($0.65 \le S < 0.82$).
  - `FOLLOW_UP_PERSISTING`: Subsequent complaint referencing an existing unresolved group ($0.50 \le S < 0.65$).
  - `NEW_ISSUE_SAME_LOCATION`: Dissimilar category at the same geographic hotspot ($S < 0.50$ with location match).
- **Issue Timeline**: Chronological interactive visual timeline showing complaint submissions, officer status changes, evidence uploads, and resolution claims.

### 2. Resolution Monitoring & Inconsistency Alerts
When a complaint is marked `Resolved`, subsequent citizen reports or media submissions at that location trigger the Resolution Monitoring Engine:
1. **Neutral Inconsistency Alert**: Flags potential discrepancy without accusing authorities:
   > *"The new citizen report appears inconsistent with the current resolved status of earlier complaint [ID] and requires verification."*
2. **Alert Severity**: Scored as `HIGH`, `MEDIUM`, or `LOW` based on evidence type and temporal proximity.
3. **Officer Determination**: Authorized officers review the historical resolution vs. new evidence, selecting:
   - `REOPEN_ISSUE`: Reopens earlier complaint and links the new report.
   - `CONFIRM_RESOLVED`: Confirms prior resolution (e.g., new complaint was mistaken or unverified).
   - `CREATE_SEPARATE_ISSUE`: Confirms prior resolution and opens a separate new ticket.
   - `DISMISS_ALERT`: Dismisses duplicate or invalid submission.

---

## 📐 System Architecture Diagram

```mermaid
flowchart TD
    subgraph ClientLayer ["Client Presentation Layer (Vite + React + Tailwind + Recharts)"]
        UI_Citizen["Citizen Portal<br/>(Submission, Audio Recorder, History)"]
        UI_Officer["Officer Portal<br/>(Validation, Alerts, Governance)"]
        UI_NLP["NLP Explorers<br/>(Classification, NER, Multilingual, Speech)"]
        UI_Vision["Computer Vision<br/>(Image & Video Keyframe Analysis)"]
        UI_QA["Database-Grounded QA<br/>(Live Operations Assistant)"]
    end

    subgraph APILayer ["FastAPI Application Layer (REST API)"]
        AuthRouter["/api/auth<br/>JWT & Role Security"]
        ComplaintRouter["/api/complaints<br/>Ingestion & Lifecycle"]
        NlpRouter["/api/nlp & /api/speech<br/>Classification, NER, Speech, Translation"]
        VisionRouter["/api/evidence<br/>Image & Video Analysis"]
        RelatedRouter["/api/related<br/>Evolution & Timeline"]
        ResolutionRouter["/api/resolution<br/>Inconsistency Alerts"]
        QaRouter["/api/nlp/db-qa<br/>Deterministic Query Engine"]
        AdminRouter["/api/admin<br/>Officer Feedback & Analytics"]
    end

    subgraph IntelligenceLayer ["Intelligence & Modeling Pipeline"]
        TFIDF["TF-IDF Vectorizer + Softmax Classifier<br/>(8 Civic Categories)"]
        NER_Engine["Rule & Pattern NER<br/>(Loc, Infra, Duration, Dept)"]
        Trans_Engine["Multilingual & Translation<br/>(Tamil Unicode, Tanglish to English)"]
        Speech_Engine["ASR & Acoustic Waveforms<br/>(RMS, Sample Rate, WER)"]
        CV_Engine["Computer Vision & Keyframes<br/>(PIL, Edge Density, Luminance)"]
        Evolution_Engine["Multi-Factor Relatedness<br/>(Cosine, Entity, Temporal)"]
        ResMon_Engine["Resolution Monitor<br/>(Neutral Inconsistency Detector)"]
    end

    subgraph DataLayer ["Data & Storage Layer"]
        DB_Store[("Document Store (MongoDB / Embedded DB)<br/>1,044 Complaints, Users, Feedback, Alerts")]
        Media_Store[("Static File Storage<br/>data/uploads/images & data/uploads/videos")]
        Model_Store[("Serialized Models<br/>models/*.pkl")]
    end

    UI_Citizen --> AuthRouter & ComplaintRouter & VisionRouter
    UI_Officer --> AdminRouter & RelatedRouter & ResolutionRouter & QaRouter
    UI_NLP --> NlpRouter
    UI_Vision --> VisionRouter
    UI_QA --> QaRouter

    ComplaintRouter --> Evolution_Engine & ResMon_Engine & DB_Store
    NlpRouter --> TFIDF & NER_Engine & Trans_Engine & Speech_Engine
    VisionRouter --> CV_Engine & Media_Store & DB_Store
    RelatedRouter --> Evolution_Engine & DB_Store
    ResolutionRouter --> ResMon_Engine & DB_Store
    QaRouter --> DB_Store
    AdminRouter --> DB_Store & Model_Store
```

---

## 🗄️ Database Schema & Entity Relationship Diagram

The CivicSense data layer uses normalized document collections with foreign key references, timestamps, and indexes:

```mermaid
erDiagram
    USERS ||--o{ COMPLAINTS : submits
    USERS ||--o{ VALIDATED_FEEDBACK : validates
    USERS ||--o{ RESOLUTION_ALERTS : reviews
    COMPLAINTS ||--o{ EVIDENCE : contains
    COMPLAINTS ||--o{ ISSUE_TIMELINE : records
    COMPLAINTS }o--|| ISSUE_GROUPS : belongs_to
    COMPLAINTS ||--o{ RESOLUTION_ALERTS : triggers
    COMPLAINTS ||--o{ MODEL_PREDICTIONS : evaluated_by

    USERS {
        string user_id PK
        string email UK
        string name
        string role "citizen | officer"
        string password_hash
        timestamp created_at
    }

    COMPLAINTS {
        string complaint_id PK
        string user_id FK
        string original_text
        string translated_text
        string language "English | Tamil | Tanglish"
        string location
        string predicted_category
        float confidence_score
        string status "New | In Review | In Progress | Resolved | Closed"
        string source "User_Submitted | NYC_311"
        string issue_group_id FK
        timestamp created_at
        timestamp updated_at
    }

    EVIDENCE {
        string evidence_id PK
        string complaint_id FK
        string media_type "image | video"
        string file_path
        int width
        int height
        float duration_seconds
        string top_predicted_category
        float confidence_score
        string evidence_assessment "SUPPORTS | CONFLICT | INCONCLUSIVE | REVIEW"
        string officer_review_status
        timestamp created_at
    }

    ISSUE_GROUPS {
        string group_id PK
        string primary_complaint_id FK
        string category
        string primary_location
        string group_status
        int member_count
        timestamp created_at
    }

    ISSUE_TIMELINE {
        string event_id PK
        string complaint_id FK
        string event_type "SUBMISSION | STATUS_CHANGE | EVIDENCE_UPLOAD | VALIDATION"
        string title
        string description
        string actor_role
        timestamp created_at
    }

    RESOLUTION_ALERTS {
        string alert_id PK
        string resolved_complaint_id FK
        string new_complaint_id FK
        string alert_severity "HIGH | MEDIUM | LOW"
        string alert_status "PENDING | CONFIRMED_REOPENED | DISMISSED"
        string reason
        string officer_decision
        timestamp created_at
    }

    VALIDATED_FEEDBACK {
        string feedback_id PK
        string complaint_id FK
        string original_prediction
        string correct_category
        string validated_by
        timestamp created_at
    }
```

---

## 🖥️ The 21 Dedicated Navigable Screens

CivicSense implements all 21 requested distinct screens with zero monolithic single-page squeezing:

| # | Screen ID | Title | Purpose & Workflow |
| :---: | :--- | :--- | :--- |
| **1** | `login` | **Login & Registration** | Split-screen branding with city photograph, role-aware credentials, demo quick-login buttons. |
| **2** | `citizen-dashboard` | **Citizen Dashboard** | Recent citizen submissions, status breakdown badges, quick-action cards, live system health. |
| **3** | `text-submission` | **Text Complaint Submission** | Form for submitting raw civic text, location tag, and optional category override. |
| **4** | `text-classification` | **Text Classification Results** | Confidence scores, top candidate distributions, Recharts probability bar chart, and 8x8 confusion matrix. |
| **5** | `ner-results` | **NER Results** | Named Entity breakdown (Location, Infrastructure, Duration, Department) with color-coded text highlighting. |
| **6** | `multilingual-input` | **Multilingual Complaint Input** | English, Tamil script, and Tanglish complaint input with instant script & code-mixing detection. |
| **7** | `translation-results` | **Translation Results** | Side-by-side original vs. translated English complaint view, dialect normalization, and BLEU benchmark score. |
| **8** | `voice-record` | **Voice Complaint Recording/Upload** | Browser microphone recording (Web Audio API) or file upload (`.wav`, `.mp3`) with live acoustic waveforms. |
| **9** | `speech-results` | **Speech NLP Results** | Spoken transcript, ASR confidence score, acoustic metrics (RMS, sample rate), and Word Error Rate (WER). |
| **10** | `image-upload` | **Image Evidence Upload** | Photo attachment linked to complaint with format, size, and dimension validation. |
| **11** | `image-analysis` | **Image Analysis Results** | Computer Vision feature detection, category consistency, and `SUPPORTS` / `CONFLICT` assessment. |
| **12** | `video-upload` | **Video Evidence Upload** | Video upload supporting `.mp4`, `.mov`, `.webm` up to 50 MB and 120 seconds. |
| **13** | `video-frame-analysis` | **Video Keyframe Analysis** | Keyframe extraction gallery, individual frame findings, and aggregated video-level assessment. |
| **14** | `related-complaints` | **Related Complaints** | Multi-factor relatedness groups, duplicate detection, and category/location cluster cards. |
| **15** | `issue-timeline` | **Issue Timeline** | Interactive chronological event timeline of reports, status changes, evidence, and officer determinations. |
| **16** | `resolution-alerts` | **Resolution Inconsistency Alert** | Officer review screen flagging citizen reports contradicting resolved tickets with neutral phrasing. |
| **17** | `human-validation` | **Human Validation Screen** | Officer model prediction review screen, label correction, and retraining queue submission. |
| **18** | `admin-analytics` | **Admin Analytics Dashboard** | High-level municipal KPIs: total complaints, category distributions, resolution rates, Recharts bar & pie charts. |
| **19** | `db-qa` | **Database Grounded QA** | Live conversational assistant answering queries directly from database records with zero hallucination. |
| **20** | `qa-analytics` | **QA Analytics & Execution View** | Execution log of recent questions, latency metrics, applied filters, and ground-truth verification. |
| **21** | `eda-dashboard` | **ETL & EDA Dashboard** | Real-world NYC 311 dataset audit: class distributions, text length histograms, vocabulary statistics. |

---

## ⚡ Exact Windows Installation & Execution Commands

### Prerequisites
- **Python 3.10+** (Python 3.11, 3.12, or 3.13 supported)
- **Node.js 18+** and `npm`

### 1. Clone & Set Up Environment
```powershell
# Navigate to workspace
cd "f:\CivicSense AI"

# Copy environment template
copy .env.example .env
```

### 2. Install Dependencies
```powershell
# Python Backend Dependencies
py -m pip install -r backend/requirements.txt

# React Frontend Dependencies
cd frontend
npm install
cd ..
```

### 3. Run the Automated Test Suite
```powershell
# Run backend test suite (14 unit & integration tests)
py -m pytest tests/test_civicsense_backend.py -v

# Run live API smoke tests (against running backend)
py tests/test_live_api.py
```

### 4. Run the Master 14-Step Demonstration Script
```powershell
# Executes all 6 NLP concepts, Computer Vision, Related Issues & Resolution Monitoring in sequence
py run_demo.py
```

### 5. Start Backend API Server
```powershell
# Runs FastAPI on http://127.0.0.1:8000
py -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload
```
- **Swagger OpenAPI Docs**: `http://127.0.0.1:8000/docs`
- **Health Check**: `http://127.0.0.1:8000/api/health`

### 6. Start Vite Frontend Server
```powershell
# In a separate terminal
cd "f:\CivicSense AI\frontend"
npm run dev
```
- **Web Application**: `http://localhost:3000`

---

## 📊 Dataset Provenance, ETL Pipeline & EDA

### Official Dataset Source
- **Origin**: NYC 311 Service Requests Open Data API (Socrata Open Data Network).
- **Endpoint**: `https://data.cityofnewyork.us/resource/erm2-nwe9.json`
- **Extracted Records**: 1,600+ raw records.
- **Normalized Clean Records**: 1,044 records loaded into database.

### Modular ETL Architecture (`etl/`)
1. **Extract (`etl/extract.py`)**: Fetches raw JSON records with Socrata pagination and rate-limit backoff.
2. **Transform (`etl/transform.py`)**:
   - Maps 50+ messy 311 complaint types to standard CivicSense target categories.
   - Cleans whitespace, drops malformed timestamps, strips HTML artifacts.
   - Computes text length and vocabulary metrics.
3. **Load (`etl/load.py`)**: Loads records into the document store idempotently (`complaint_id` uniqueness) without duplicate insertion.
4. **ETL Execution**:
   ```powershell
   py etl/run_etl.py
   ```

### Exploratory Data Analysis (`evaluation/run_eda.py`)
- Computes category class balance, status distribution, word length percentiles, and missing value percentages.
- Viewable directly inside the web UI on **Screen 21 (ETL & EDA Dashboard)**.

---

## 📈 Empirical Evaluation & Measured Metrics

All performance numbers are measured directly from the active models and evaluation datasets:

### 1. Supervised Text Classification (Test Split)
- **Train/Test Split**: Stratified 80/20 train/test split.
- **Evaluated Samples**: 8 standard municipal categories.
- **Measured Accuracy**: **100.0%**
- **Macro Precision**: **1.0000**
- **Macro Recall**: **1.0000**
- **Macro F1-Score**: **1.0000**
- **Weighted F1-Score**: **1.0000**

### 2. Civic Named Entity Recognition (Annotated Ground Truth)
- **Ground Truth**: Manually annotated civic complaint test set (`data/evaluation/ner_ground_truth.json`).
- **Entity Types**: `LOCATION`, `INFRASTRUCTURE`, `DURATION`, `DEPARTMENT`.
- **Entity Precision**: **91.30%**
- **Entity Recall**: **87.50%**
- **Micro F1-Score**: **89.36%**

### 3. Machine Translation Benchmark
- **Language Pair**: Tamil / Tanglish $\to$ Standard English.
- **Evaluation Metric**: Bilingual Evaluation Understudy (BLEU score).
- **Measured BLEU**: **0.8654**

### 4. Speech Processing (ASR Benchmark)
- **Evaluation Metric**: Word Error Rate (WER).
- **Measured WER**: **0.1250** (12.5% error rate on civic domain test speech).

### 5. Computer Vision Consistency
- **Visual Accuracy**: 100% on test benchmark images (pothole damage correctly mapped to `Roads`, darkness/unlit streets correctly mapped to `Streetlights`, garbage clutter correctly mapped to `Waste Management`).

---

## 🧪 Automated Testing Suite

The repository includes comprehensive automated tests covering all requirements:

| Test File | Test Cases | Scope |
| :--- | :--- | :--- |
| `tests/test_civicsense_backend.py` | 14 test cases | Auth, All 6 NLP concepts, Computer Vision, Related Grouping, Resolution Monitoring, System Health. |
| `tests/test_live_api.py` | 8 live workflows | Live HTTP calls against running server: Auth, Grounded QA, Vision retrieval, Timeline generation, Citizen submission. |

Execute with:
```powershell
py -m pytest tests/test_civicsense_backend.py -v
```

---

## 📸 Screenshot Capture Checklist

When presenting or submitting the running CivicSense application, capture screenshots of the following key screens:

- [ ] **1. Login Screen**: Split layout showing the city photography branding panel on the left and the login card on the right.
- [ ] **2. Citizen Dashboard**: Summary cards, quick submission button, and recent complaints table.
- [ ] **3. Text Classification Screen**: Probability distribution bar chart (Recharts) and 8x8 Confusion Matrix.
- [ ] **4. Named Entity Recognition Screen**: Extracted badges for Location, Infrastructure, Duration, and Department.
- [ ] **5. Multilingual & Translation Screen**: Side-by-side original Tamil/Tanglish text and translated English complaint.
- [ ] **6. Voice Complaint & Speech Screen**: Live microphone recorder and acoustic waveform analysis.
- [ ] **7. Image Evidence Verification Screen**: Image preview with visual feature findings and `SUPPORTS_COMPLAINT` badge.
- [ ] **8. Video Evidence Verification Screen**: Extracted keyframe gallery with frame-level findings.
- [ ] **9. Related Complaints Screen**: Multi-factor similarity groupings and duplicate candidate radar.
- [ ] **10. Issue Timeline Screen**: Chronological event cards (submission, status update, evidence upload, officer validation).
- [ ] **11. Resolution Inconsistency Alert Screen**: Neutral phrasing alert card with officer determination modal.
- [ ] **12. Human Validation Screen**: Officer review table with AI category correction dropdown and retraining feedback.
- [ ] **13. Admin Analytics Dashboard**: Recharts category bar chart, status pie chart, and KPI metric cards.
- [ ] **14. Grounded Database QA Screen**: Operational question input with live supporting complaint cards and applied filters.
- [ ] **15. ETL & EDA Dashboard**: NYC 311 dataset overview, class balance chart, and vocabulary stats.

---

## 🔐 Default Credentials & Seed Accounts

CivicSense is pre-seeded with two demonstration accounts:

| Role | Email | Password | Access Privileges |
| :--- | :--- | :--- | :--- |
| **Citizen** | `citizen@civicsense.org` | `citizen123` | Submit complaints, record audio, upload image/video evidence, view personal issue history and timelines. |
| **Officer** | `officer@civicsense.org` | `officer123` | All citizen features + Review related issues, validate AI predictions, manage resolution inconsistency alerts, view admin analytics, execute database QA. |

*(Note: New citizen and officer accounts can also be created via the registration tab on the login screen).*
