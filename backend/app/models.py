import datetime
from sqlalchemy import Column, Integer, String, Text, Boolean, Float, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from app.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    full_name = Column(String(100), nullable=False)
    role = Column(String(50), default="Physician")  # Physician, Clinical Pharmacist, Nurse, PV Officer, Regulatory Specialist
    department = Column(String(100), default="Internal Medicine")
    institution = Column(String(150), default="General University Hospital")
    hashed_password = Column(String(255), nullable=False)
    is_active = Column(Boolean, default=True)
    is_admin = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    reports_created = relationship("ADRReport", back_populates="created_by", foreign_keys="ADRReport.created_by_user_id")
    reports_verified = relationship("ADRReport", back_populates="verified_by", foreign_keys="ADRReport.verified_by_user_id")
    audit_logs = relationship("AuditLog", back_populates="user")


class ADRReport(Base):
    __tablename__ = "adr_reports"

    id = Column(Integer, primary_key=True, index=True)
    report_number = Column(String(50), unique=True, index=True, nullable=False)
    
    # 1. Patient Details
    patient_identifier = Column(String(50), nullable=True) # e.g. PT-35F or Initials
    patient_age = Column(Integer, nullable=True)
    patient_age_unit = Column(String(20), default="Years") # Years, Months, Days
    patient_gender = Column(String(20), nullable=True) # Male, Female, Other, Unknown
    patient_weight_kg = Column(Float, nullable=True)
    medical_history = Column(Text, nullable=True)
    known_allergies = Column(Text, nullable=True)
    
    # Raw Clinical Note entered
    clinical_narrative = Column(Text, nullable=True)
    
    # 2. Suspected & Concomitant Drugs (Stored as structured JSON)
    suspected_medicines = Column(JSON, default=list) # [{drug_name, dose, unit, route, frequency, start_date, stop_date, indication, batch_no, manufacturer}]
    concomitant_medicines = Column(JSON, default=list) # [{drug_name, dose, route, start_date, stop_date, indication}]
    
    # 3. Adverse Reaction Information
    reactions = Column(JSON, default=list) # [{term, meddra_pt, onset_date, duration, time_to_onset, outcome, description}]
    reaction_onset_date = Column(String(50), nullable=True)
    reaction_outcome = Column(String(50), default="Recovering") # Recovered, Recovering, Not Recovered, Fatal, Unknown
    
    # 4. Seriousness Criteria
    is_serious = Column(Boolean, default=False)
    seriousness_death = Column(Boolean, default=False)
    seriousness_life_threatening = Column(Boolean, default=False)
    seriousness_hospitalization = Column(Boolean, default=False)
    seriousness_disability = Column(Boolean, default=False)
    seriousness_congenital_anomaly = Column(Boolean, default=False)
    seriousness_other_medically_important = Column(Boolean, default=False)
    seriousness_details = Column(Text, nullable=True)
    
    # 5. Dechallenge & Rechallenge Actions
    dechallenge_action = Column(String(50), default="Medicine discontinued") # Discontinued, Dose Reduced, Dose Not Changed, N/A, Unknown
    dechallenge_outcome = Column(String(50), default="Reaction abated") # Reaction abated, Did not abate, Inconclusive, N/A
    rechallenge_action = Column(String(50), default="Not reintroduced") # Reintroduced, Not reintroduced, Unknown
    rechallenge_outcome = Column(String(50), default="Not applicable") # Reaction recurred, Did not recur, Inconclusive, N/A
    
    # 6. Causality Assessment (e.g. Naranjo Scale)
    causality_method = Column(String(50), default="Naranjo Algorithm")
    causality_score = Column(Integer, default=0)
    causality_category = Column(String(50), default="Possible") # Definite, Probable, Possible, Doubtful
    naranjo_answers = Column(JSON, default=dict) # {q1: 1, q2: 2, ...}
    
    # 7. Relevant Lab Tests & Findings
    lab_findings = Column(Text, nullable=True)
    additional_remarks = Column(Text, nullable=True)
    
    # 8. Reporter Details
    reporter_name = Column(String(100), nullable=True)
    reporter_role = Column(String(50), default="Physician")
    reporter_contact = Column(String(100), nullable=True)
    reporter_institution = Column(String(150), nullable=True)
    reporter_country = Column(String(50), default="United States")
    
    # 9. AI Assistance & Quality Metrics
    ai_raw_extraction = Column(JSON, default=dict)
    ai_confidence_score = Column(Float, default=0.0) # 0.0 to 1.0
    ai_missing_fields = Column(JSON, default=list) # List of missing recommended fields
    completeness_score = Column(Float, default=0.0) # 0 to 100%
    ich_criteria_met = Column(Boolean, default=False) # 4 ICH minimum criteria met
    ai_clinical_summary = Column(Text, nullable=True)
    
    # 10. Status & Human Review Verification
    status = Column(String(50), default="DRAFT") # DRAFT, AI_EXTRACTED, PENDING_REVIEW, CHANGES_REQUESTED, VERIFIED_APPROVED, REJECTED, SUBMITTED
    verified_by_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    verified_at = Column(DateTime, nullable=True)
    verification_notes = Column(Text, nullable=True)
    admin_feedback = Column(Text, nullable=True)
    
    created_by_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
    
    created_by = relationship("User", foreign_keys=[created_by_user_id], back_populates="reports_created")
    verified_by = relationship("User", foreign_keys=[verified_by_user_id], back_populates="reports_verified")
    audit_logs = relationship("AuditLog", back_populates="report", cascade="all, delete-orphan")


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    report_id = Column(Integer, ForeignKey("adr_reports.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    action = Column(String(100), nullable=False) # e.g., CREATED, AI_EXTRACTED, FIELD_MODIFIED, NARANJO_ASSESSED, VERIFIED, SUBMITTED
    details = Column(Text, nullable=True)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)

    report = relationship("ADRReport", back_populates="audit_logs")
    user = relationship("User", back_populates="audit_logs")
