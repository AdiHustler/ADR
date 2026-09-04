from typing import List, Optional, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict

# --- User Schemas ---
class UserBase(BaseModel):
    username: str
    email: str
    full_name: str
    role: str = "Physician"
    department: Optional[str] = "Internal Medicine"
    institution: Optional[str] = "General University Hospital"

class UserCreate(UserBase):
    password: str

class UserLogin(BaseModel):
    username: str
    password: str

class UserResponse(UserBase):
    id: int
    is_active: bool
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse


# --- Sub-entities for ADR Report ---
class SuspectedMedicine(BaseModel):
    drug_name: str
    dose: Optional[str] = None
    unit: Optional[str] = "mg"
    route: Optional[str] = "Oral"
    frequency: Optional[str] = "Once daily"
    start_date: Optional[str] = None
    stop_date: Optional[str] = None
    indication: Optional[str] = None
    batch_no: Optional[str] = None
    manufacturer: Optional[str] = None
    is_suspected: bool = True

class ConcomitantMedicine(BaseModel):
    drug_name: str
    dose: Optional[str] = None
    route: Optional[str] = "Oral"
    start_date: Optional[str] = None
    stop_date: Optional[str] = None
    indication: Optional[str] = None

class ReactionDetail(BaseModel):
    term: str
    meddra_pt: Optional[str] = None
    onset_date: Optional[str] = None
    duration: Optional[str] = None
    time_to_onset: Optional[str] = None
    outcome: Optional[str] = "Recovering"
    description: Optional[str] = None


# --- AI Extraction & Validation Schemas ---
class AIExtractionRequest(BaseModel):
    clinical_narrative: str
    patient_id: Optional[str] = None
    api_key: Optional[str] = None

class ExtractedField(BaseModel):
    value: Any
    confidence: float
    source_snippet: Optional[str] = None
    is_suggested: bool = True

class MissingFieldItem(BaseModel):
    field: str
    category: str # 'mandatory_ich', 'important_clinical', 'recommended'
    description: str
    suggested_action: str

class AIExtractionResponse(BaseModel):
    patient_age: Optional[int] = None
    patient_age_unit: Optional[str] = "Years"
    patient_gender: Optional[str] = None
    patient_weight_kg: Optional[float] = None
    medical_history: Optional[str] = None
    suspected_medicines: List[SuspectedMedicine] = []
    concomitant_medicines: List[ConcomitantMedicine] = []
    reactions: List[ReactionDetail] = []
    reaction_onset_date: Optional[str] = None
    reaction_outcome: Optional[str] = "Recovering"
    is_serious: bool = False
    seriousness_criteria: Dict[str, bool] = {}
    action_taken: Optional[str] = "Medicine discontinued"
    dechallenge_action: Optional[str] = "Medicine discontinued"
    dechallenge_outcome: Optional[str] = "Reaction abated"
    rechallenge_action: Optional[str] = "Not reintroduced"
    rechallenge_outcome: Optional[str] = "Not applicable"
    confidence_score: float = 0.0
    field_provenance: Dict[str, Any] = {}
    missing_fields: List[MissingFieldItem] = []
    completeness_score: float = 0.0
    ich_criteria_met: bool = False
    naranjo_estimate: Optional[Dict[str, Any]] = None
    ai_clinical_summary: Optional[str] = None


class NaranjoEvaluationRequest(BaseModel):
    answers: Dict[str, int] # e.g. {"q1": 1, "q2": 2, ...}

class NaranjoEvaluationResponse(BaseModel):
    total_score: int
    category: str # Definite (>=9), Probable (5-8), Possible (1-4), Doubtful (<=0)
    interpretation: str
    details: Dict[str, Any]


# --- ADR Report CRUD Schemas ---
class ADRReportCreate(BaseModel):
    patient_identifier: Optional[str] = None
    patient_age: Optional[int] = None
    patient_age_unit: Optional[str] = "Years"
    patient_gender: Optional[str] = None
    patient_weight_kg: Optional[float] = None
    medical_history: Optional[str] = None
    known_allergies: Optional[str] = None
    clinical_narrative: Optional[str] = None
    suspected_medicines: List[SuspectedMedicine] = []
    concomitant_medicines: List[ConcomitantMedicine] = []
    reactions: List[ReactionDetail] = []
    reaction_onset_date: Optional[str] = None
    reaction_outcome: Optional[str] = "Recovering"
    is_serious: bool = False
    seriousness_death: bool = False
    seriousness_life_threatening: bool = False
    seriousness_hospitalization: bool = False
    seriousness_disability: bool = False
    seriousness_congenital_anomaly: bool = False
    seriousness_other_medically_important: bool = False
    seriousness_details: Optional[str] = None
    dechallenge_action: Optional[str] = "Medicine discontinued"
    dechallenge_outcome: Optional[str] = "Reaction abated"
    rechallenge_action: Optional[str] = "Not reintroduced"
    rechallenge_outcome: Optional[str] = "Not applicable"
    causality_method: Optional[str] = "Naranjo Algorithm"
    causality_score: Optional[int] = 0
    causality_category: Optional[str] = "Possible"
    naranjo_answers: Optional[Dict[str, int]] = {}
    lab_findings: Optional[str] = None
    additional_remarks: Optional[str] = None
    reporter_name: Optional[str] = None
    reporter_role: Optional[str] = "Physician"
    reporter_contact: Optional[str] = None
    reporter_institution: Optional[str] = None
    reporter_country: Optional[str] = "United States"
    ai_raw_extraction: Optional[Dict[str, Any]] = {}
    ai_confidence_score: Optional[float] = 0.0
    ai_missing_fields: Optional[List[Dict[str, Any]]] = []
    completeness_score: Optional[float] = 0.0
    ich_criteria_met: Optional[bool] = False
    status: Optional[str] = "DRAFT"
    ai_clinical_summary: Optional[str] = None

class ADRReportUpdate(ADRReportCreate):
    pass

class ADRReportVerify(BaseModel):
    verification_notes: Optional[str] = None
    approved: bool = True

class AuditLogResponse(BaseModel):
    id: int
    action: str
    details: Optional[str] = None
    timestamp: datetime
    user: Optional[UserResponse] = None
    model_config = ConfigDict(from_attributes=True)

class ADRReportResponse(ADRReportCreate):
    id: int
    report_number: str
    status: str
    verified_by_user_id: Optional[int] = None
    verified_at: Optional[datetime] = None
    verification_notes: Optional[str] = None
    created_by_user_id: Optional[int] = None
    created_at: datetime
    updated_at: datetime
    created_by: Optional[UserResponse] = None
    verified_by: Optional[UserResponse] = None
    audit_logs: List[AuditLogResponse] = []
    model_config = ConfigDict(from_attributes=True)


# --- Analytics Schemas ---
class DashboardStats(BaseModel):
    total_reports: int
    serious_reports: int
    pending_review: int
    verified_approved: int
    avg_completeness_score: float
    top_suspected_drugs: List[Dict[str, Any]]
    top_reactions: List[Dict[str, Any]]
    seriousness_distribution: Dict[str, int]
    status_distribution: Dict[str, int]
    causality_distribution: Dict[str, int]
    recent_reports: List[ADRReportResponse]


# --- AI Chat Schemas ---
class AIChatMessage(BaseModel):
    role: str # "user", "assistant", "system"
    content: str

class AIChatRequest(BaseModel):
    messages: List[AIChatMessage]
    context: Optional[Dict[str, Any]] = None # current report, active screen, filters
    api_key: Optional[str] = None

class AIChatResponse(BaseModel):
    reply: str
    suggested_actions: Optional[List[str]] = []
    context_used: Optional[Dict[str, Any]] = None
    source: str = "clinical_engine" # "gemini", "openrouter", "clinical_engine"

