# AI-Assisted Adverse Drug Reaction (ADR) Reporting System

A clinical Pharmacovigilance (PV) and Adverse Drug Reaction (ADR) reporting platform with **human-in-the-loop AI assistance**. Designed to reduce documentation burden for physicians, clinical pharmacists, nurses, and pharmacovigilance officers while maintaining rigorous regulatory compliance (ICH E2B(R3), CIOMS I, and MedDRA standards).

---

## 🌟 Key Features

### 1. Dual-Mode Case Entry
- **Free-Text Clinical Notes Assistant**: Paste unstructured physician narratives, discharge summaries, or emergency notes. The AI engine instantly extracts structured parameters (patient demographics, suspected drug, dose, route, adverse reaction terms, time to onset, seriousness criteria, and dechallenge actions).
- **Pre-Loaded Clinical Test Scenarios**: Includes 1-click real-world clinical cases (Amoxicillin Anaphylaxis, Lisinopril Intractable Cough, Allopurinol DRESS Syndrome, Warfarin + Clarithromycin Interaction, Cutaneous Rash).
- **Interactive 6-Step Clinical Form**: For direct structured data entry with field-level provenance badges.

### 2. Missing Information & ICH Minimum Criteria Detector
- Evaluates against the **ICH 4 Minimum Reporting Criteria**:
  1. Identifiable Patient
  2. Identifiable Reporter
  3. Suspected Medicine
  4. Adverse Event
- Calculates a real-time **Completeness & Quality Index (0–100%)**.
- Provides an interactive checklist highlighting missing mandatory and recommended clinical parameters with 1-click corrective suggestions.

### 3. Naranjo ADR Probability Algorithm
- Built-in **10-question causality assessment calculator**.
- Computes probability score and categorizes causality into **Definite ($\ge 9$)**, **Probable ($5–8$)**, **Possible ($1–4$)**, or **Doubtful ($\le 0$)**.

### 4. Human Review & Verification Workspace
- AI suggestions are explicitly badged as "AI Suggested" until officially reviewed and confirmed by a healthcare professional.
- Verification workflow captures clinician notes, digital sign-off, timestamp, and audit trail.

### 5. Standard Regulatory Exports
- **CIOMS Form I (PDF)**: Printable, publication-ready regulatory adverse event document.
- **ICH E2B(R3) Export (JSON)**: Interoperable electronic transmission standard for global pharmacovigilance databases.

### 6. Pharmacovigilance Surveillance & Analytics
- Metric counters (Total Reports, Serious Events, Pending Review, Approved).
- Signal detection charts for top culprit medications and frequent MedDRA reaction terms.
- Seriousness and causality distributions.

---

## 🏗️ Architecture & Technology Stack

```
┌────────────────────────────────────────────────────────────────────────┐
│                        React + TypeScript Frontend                     │
│  - Vite + React 18 + TypeScript                                        │
│  - Tailwind CSS (Clinical Theme) + Lucide Icons                        │
│  - Dual Entry (Narrative NLP + 6-Step Wizard)                          │
│  - Real-time Completeness Checklist & Naranjo Modal                    │
│  - CIOMS PDF & E2B(R3) JSON Downloaders                                │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ REST API
┌───────────────────────────────────▼────────────────────────────────────┐
│                        FastAPI Python Backend                          │
│  - FastAPI 0.115 + SQLAlchemy 2.0 + SQLite                             │
│  - Hybrid Clinical NLP Engine:                                         │
│      • LLM Provider (Google Gemini / OpenAI if API key provided)       │
│      • Clinical Regex & Heuristic Rule Engine (Zero-dependency)        │
│  - ICH E2B Completeness & Missing Fields Validator                     │
│  - Naranjo Causality Assessment Calculator                             │
│  - ReportLab CIOMS I PDF Generator & E2B Exporter                      │
│  - JWT Authentication with Demo Personas                               │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 🚀 Getting Started

### Prerequisites
- **Python 3.10+** (Tested on Python 3.13)
- **Node.js 18+** & **npm**

### Quick Launch (Windows)
Double-click `run_app.bat` or run:
```bash
.\run_app.bat
```

### Manual Setup

#### 1. Backend
```bash
cd backend
python -m venv venv
.\venv\Scripts\activate      # On Windows (or source venv/bin/activate on Linux/Mac)
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
- API Base URL: `http://localhost:8000`
- Interactive Swagger Docs: `http://localhost:8000/docs`

#### 2. Frontend
```bash
cd frontend
npm install
npm run dev
```
- Web Application: `http://localhost:5173`

---

## 👥 Demo Clinical Accounts

| Persona | Name | Role | Department | Password |
| :--- | :--- | :--- | :--- | :--- |
| **Attending Physician** | Dr. Sarah Jenkins, MD | Physician | Cardiology / Internal Med | `password123` |
| **Clinical Pharmacist** | Alex Rivera, PharmD, BCPS | Pharmacist | Clinical Pharmacy & Tox | `password123` |
| **PV Officer** | Dr. Marcus Vance, MD, PhD | PV Officer | Global Drug Safety | `password123` |

---

## 🧪 Testing

Run the automated backend test suite:
```bash
cd backend
.\venv\Scripts\pytest
```

All tests cover:
- Capstone clinical narrative extraction (Amoxicillin anaphylaxis, cutanous rash, Lisinopril cough)
- Naranjo causality scoring algorithms
- ICH E2B missing field detector
- Report verification and status transitions
- CIOMS PDF generation & E2B JSON serialization

---

## 👥 Authors & Credits

**AI-Assisted Adverse Drug Reaction (ADR) Reporting System** was built by:
- **Priyansh Sharma**
- **Pushkar Madan**

