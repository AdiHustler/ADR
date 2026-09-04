from fastapi import APIRouter, HTTPException, Depends
from typing import Dict, Any, List
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas import (
    AIExtractionRequest,
    AIExtractionResponse,
    NaranjoEvaluationRequest,
    NaranjoEvaluationResponse,
    AIChatRequest,
    AIChatResponse
)
from app.nlp.extractor import process_clinical_narrative
from app.nlp.validator import validate_adr_report_completeness
from app.nlp.causality import calculate_naranjo_score, NARANJO_QUESTIONS
from app.nlp.chat_engine import process_chat_message

router = APIRouter(prefix="/ai", tags=["AI & NLP Module"])

CLINICAL_SCENARIOS = [
    {
        "id": "scenario_1_amoxicillin",
        "title": "Scenario 1: Amoxicillin Anaphylaxis (Max Hospital, New Delhi)",
        "description": "Acute onset of facial swelling, severe itching, and dyspnea after oral antibiotic.",
        "category": "Allergy / Hypersensitivity",
        "narrative": "A 35-year-old female patient developed facial swelling, severe itching, and difficulty breathing 45 minutes after taking oral Amoxicillin 500mg at Max Super Speciality Hospital, New Delhi. The medicine was stopped immediately and the patient received emergency treatment with intramuscular epinephrine and IV hydrocortisone in the emergency department. Patient had no prior history of penicillin allergy."
    },
    {
        "id": "scenario_2_rash_itching",
        "title": "Scenario 2: Cutaneous Skin Rash (Apollo Hospitals, Mumbai)",
        "description": "Itching and erythematous rash two days post initiation.",
        "category": "Dermatologic",
        "narrative": "A patient at Apollo Hospitals, Mumbai, developed severe itching and a red rash two days after starting amoxicillin 500mg twice daily for sinusitis. Amoxicillin was discontinued, and the rash improved significantly over the next 48 hours."
    },
    {
        "id": "scenario_3_lisinopril_cough",
        "title": "Scenario 3: Lisinopril Cough (Fortis Hospital, Bangalore)",
        "description": "Persistent dry hacking cough secondary to ACE-inhibitor therapy.",
        "category": "Respiratory",
        "narrative": "A 62-year-old male with hypertension at Fortis Hospital, Bangalore, developed a dry hacking cough 3 weeks after starting Lisinopril 10mg PO daily. Concomitant meds: Atorvastatin 20mg daily. Lisinopril was discontinued and cough resolved within 7 days."
    },
    {
        "id": "scenario_4_allopurinol_dress",
        "title": "Scenario 4: Allopurinol DRESS Syndrome (Medanta, Gurugram)",
        "description": "High fever, extensive exfoliative rash, and acute transaminitis.",
        "category": "Severe Cutaneous Reaction",
        "narrative": "A 48yo female patient with acute gout at Medanta Medicity, Gurugram, was prescribed Allopurinol 300mg daily. On day 14, she developed high fever (39.2C), extensive peeling rash, and elevated ALT/AST (ALT: 420 U/L, AST: 380 U/L) consistent with DRESS syndrome. Patient was hospitalized in ICU. Allopurinol stopped immediately."
    },
    {
        "id": "scenario_5_warfarin_interaction",
        "title": "Scenario 5: Warfarin + Clarithromycin (KIMS Hospital, Hyderabad)",
        "description": "Severe hematuria and epistaxis due to CYP3A4 macrolide interaction.",
        "category": "Drug Interaction",
        "narrative": "A 72-year-old female on Warfarin 5mg daily for atrial fibrillation at KIMS Hospital, Hyderabad, developed gross hematuria and epistaxis 4 days after adding Clarithromycin 500mg twice daily for pneumonia. Laboratory tests revealed INR elevated at 7.8. Admitted to hospital for emergency reversal."
    }
]

@router.post("/extract", response_model=AIExtractionResponse)
def extract_adr_from_text(payload: AIExtractionRequest):
    if not payload.clinical_narrative.strip():
        raise HTTPException(status_code=400, detail="Clinical narrative cannot be empty")
    
    result = process_clinical_narrative(payload.clinical_narrative, payload.api_key)
    return result

@router.post("/validate")
def validate_report_completeness(report_data: Dict[str, Any]):
    missing_fields, completeness_score, ich_met = validate_adr_report_completeness(report_data)
    return {
        "missing_fields": missing_fields,
        "completeness_score": completeness_score,
        "ich_criteria_met": ich_met
    }

@router.get("/naranjo-questions")
def get_naranjo_questions():
    return NARANJO_QUESTIONS

@router.post("/causality", response_model=NaranjoEvaluationResponse)
def evaluate_naranjo_causality(payload: NaranjoEvaluationRequest):
    score, category, interpretation = calculate_naranjo_score(payload.answers)
    return {
        "total_score": score,
        "category": category,
        "interpretation": interpretation,
        "details": {
            "answers_evaluated": payload.answers,
            "max_possible_score": 13,
            "min_possible_score": -4
        }
    }

@router.get("/scenarios")
def get_clinical_scenarios():
    return CLINICAL_SCENARIOS

@router.post("/chat", response_model=AIChatResponse)
def ai_pharmacovigilance_chat(payload: AIChatRequest, db: Session = Depends(get_db)):
    """
    Interactive Clinical Pharmacovigilance Chat Endpoint.
    Connects to live ADR case registry and clinical knowledge base with offline-first fallback.
    """
    messages_dicts = [{"role": m.role, "content": m.content} for m in payload.messages]
    result = process_chat_message(
        messages=messages_dicts,
        context=payload.context,
        db=db,
        api_key=payload.api_key
    )
    return result

