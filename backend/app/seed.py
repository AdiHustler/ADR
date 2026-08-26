import datetime
from sqlalchemy.orm import Session
from app.database import Base, engine, SessionLocal
from app.models import User, ADRReport, AuditLog
from app.routes.auth import get_password_hash
from app.nlp.validator import validate_adr_report_completeness

def seed_database():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    # Check if already seeded
    if db.query(User).count() > 0:
        db.close()
        return

    print("Seeding database with default healthcare users and ADR cases...")

    # 1. Create Users
    users = [
        User(
            username="dr_sharma",
            email="r.sharma@maxmedical.in",
            full_name="Dr. Rajesh Sharma, MD",
            role="Physician",
            department="Internal Medicine / Cardiology",
            institution="Max Super Speciality Hospital",
            hashed_password=get_password_hash("password123")
        ),
        User(
            username="pharm_patel",
            email="a.patel@apollohospitals.in",
            full_name="Ananya Patel, PharmD",
            role="Clinical Pharmacist",
            department="Clinical Pharmacy & Toxicology",
            institution="Apollo Hospitals",
            hashed_password=get_password_hash("password123")
        ),
        User(
            username="pv_gupta",
            email="v.gupta@ipc.gov.in",
            full_name="Dr. Vikram Gupta, MD, PhD",
            role="Pharmacovigilance Officer",
            department="Global Drug Safety & PV",
            institution="Indian Pharmacopoeia Commission (IPC)",
            hashed_password=get_password_hash("password123")
        )
    ]
    for u in users:
        db.add(u)
    db.commit()
    for u in users:
        db.refresh(u)

    user_map = {u.username: u.id for u in users}

    # 2. Create Realistic ADR Reports
    sample_reports = [
        {
            "report_number": "ADR-2026-0001",
            "patient_identifier": "PT-35F",
            "patient_age": 35,
            "patient_age_unit": "Years",
            "patient_gender": "Female",
            "patient_weight_kg": 64.0,
            "medical_history": "Sinusitis, No prior known drug allergies",
            "known_allergies": "None documented",
            "clinical_narrative": "A 35-year-old female patient developed facial swelling, severe itching, and difficulty breathing 45 minutes after taking oral Amoxicillin 500mg. The medicine was stopped immediately and the patient received emergency treatment with IM epinephrine and IV hydrocortisone in the emergency department.",
            "suspected_medicines": [
                {
                    "drug_name": "Amoxicillin",
                    "dose": "500 mg",
                    "unit": "mg",
                    "route": "Oral",
                    "frequency": "Twice daily",
                    "start_date": "2026-08-20",
                    "stop_date": "2026-08-20",
                    "indication": "Acute maxillary sinusitis",
                    "batch_no": "AMX-88921-A",
                    "manufacturer": "GlaxoSmithKline",
                    "is_suspected": True
                }
            ],
            "concomitant_medicines": [
                {
                    "drug_name": "Epinephrine",
                    "dose": "0.3 mg",
                    "route": "Intramuscular",
                    "indication": "Emergency rescue for anaphylactoid reaction"
                }
            ],
            "reactions": [
                {
                    "term": "Facial swelling / Angioedema",
                    "meddra_pt": "Face oedema",
                    "onset_date": "2026-08-20",
                    "time_to_onset": "45 minutes after taking",
                    "outcome": "Recovered",
                    "description": "Rapid onset bilateral periorbital and labial angioedema."
                },
                {
                    "term": "Dyspnea / Difficulty breathing",
                    "meddra_pt": "Dyspnoea",
                    "onset_date": "2026-08-20",
                    "time_to_onset": "45 minutes after taking",
                    "outcome": "Recovered",
                    "description": "Laryngeal tightness and inspiratory stridor."
                },
                {
                    "term": "Severe pruritus / itching",
                    "meddra_pt": "Pruritus",
                    "onset_date": "2026-08-20",
                    "time_to_onset": "45 minutes after taking",
                    "outcome": "Recovered",
                    "description": "Diffuse erythematous pruritus over trunk and arms."
                }
            ],
            "reaction_onset_date": "2026-08-20",
            "reaction_outcome": "Recovered",
            "is_serious": True,
            "seriousness_death": False,
            "seriousness_life_threatening": True,
            "seriousness_hospitalization": True,
            "seriousness_disability": False,
            "seriousness_congenital_anomaly": False,
            "seriousness_other_medically_important": True,
            "seriousness_details": "Life-threatening allergic angioedema requiring acute epinephrine in ED.",
            "dechallenge_action": "Medicine discontinued",
            "dechallenge_outcome": "Reaction abated",
            "rechallenge_action": "Not reintroduced",
            "rechallenge_outcome": "Not applicable",
            "causality_method": "Naranjo Algorithm",
            "causality_score": 7,
            "causality_category": "Probable",
            "naranjo_answers": {"q1": 1, "q2": 2, "q3": 1, "q4": 0, "q5": 2, "q6": 0, "q7": 0, "q8": 0, "q9": 0, "q10": 1},
            "lab_findings": "Elevated serum tryptase 18.4 ug/L in acute phase.",
            "reporter_name": "Dr. Rajesh Sharma, MD",
            "reporter_role": "Physician",
            "reporter_contact": "r.sharma@maxmedical.in",
            "reporter_institution": "Max Super Speciality Hospital",
            "reporter_country": "India",
            "status": "VERIFIED_APPROVED",
            "verified_by_user_id": user_map["dr_sharma"],
            "verified_at": datetime.datetime.utcnow() - datetime.timedelta(days=2),
            "verification_notes": "Clinical timeline and acute presentation confirm IgE-mediated beta-lactam hypersensitivity. Verified and approved.",
            "created_by_user_id": user_map["dr_sharma"]
        },
        {
            "report_number": "ADR-2026-0002",
            "patient_identifier": "PT-62M",
            "patient_age": 62,
            "patient_age_unit": "Years",
            "patient_gender": "Male",
            "patient_weight_kg": 82.0,
            "medical_history": "Essential hypertension, Hyperlipidemia",
            "known_allergies": "NKDA",
            "clinical_narrative": "62-year-old male with hypertension developed dry hacking cough 3 weeks after starting Lisinopril 10mg PO daily. Concomitant meds: Atorvastatin 20mg. Lisinopril was discontinued and cough resolved within 7 days.",
            "suspected_medicines": [
                {
                    "drug_name": "Lisinopril",
                    "dose": "10 mg",
                    "unit": "mg",
                    "route": "Oral",
                    "frequency": "Once daily",
                    "start_date": "2026-07-10",
                    "stop_date": "2026-08-01",
                    "indication": "Essential hypertension",
                    "batch_no": "LIS-44012",
                    "manufacturer": "Lupin",
                    "is_suspected": True
                }
            ],
            "concomitant_medicines": [
                {
                    "drug_name": "Atorvastatin",
                    "dose": "20 mg",
                    "route": "Oral",
                    "indication": "Hyperlipidemia"
                }
            ],
            "reactions": [
                {
                    "term": "Dry cough",
                    "meddra_pt": "Cough",
                    "onset_date": "2026-08-01",
                    "time_to_onset": "3 weeks after starting",
                    "outcome": "Recovered",
                    "description": "Non-productive intractable hacking cough, worse at night."
                }
            ],
            "reaction_onset_date": "2026-08-01",
            "reaction_outcome": "Recovered",
            "is_serious": False,
            "seriousness_death": False,
            "seriousness_life_threatening": False,
            "seriousness_hospitalization": False,
            "seriousness_disability": False,
            "seriousness_congenital_anomaly": False,
            "seriousness_other_medically_important": False,
            "seriousness_details": "Non-serious class effect of ACE inhibitor therapy.",
            "dechallenge_action": "Medicine discontinued",
            "dechallenge_outcome": "Reaction abated",
            "rechallenge_action": "Not reintroduced",
            "rechallenge_outcome": "Not applicable",
            "causality_method": "Naranjo Algorithm",
            "causality_score": 6,
            "causality_category": "Probable",
            "naranjo_answers": {"q1": 1, "q2": 2, "q3": 1, "q4": 0, "q5": 2, "q6": 0, "q7": 0, "q8": 0, "q9": 0, "q10": 0},
            "lab_findings": "Chest X-ray clear, no signs of infection or pulmonary congestion.",
            "reporter_name": "Ananya Patel, PharmD",
            "reporter_role": "Clinical Pharmacist",
            "reporter_contact": "a.patel@apollohospitals.in",
            "reporter_institution": "Apollo Hospitals",
            "reporter_country": "India",
            "status": "SUBMITTED",
            "verified_by_user_id": user_map["pharm_patel"],
            "verified_at": datetime.datetime.utcnow() - datetime.timedelta(days=5),
            "verification_notes": "Classic ACE-inhibitor induced bradykinin cough. Switched patient to ARB (Losartan).",
            "created_by_user_id": user_map["pharm_patel"]
        },
        {
            "report_number": "ADR-2026-0003",
            "patient_identifier": "PT-48F",
            "patient_age": 48,
            "patient_age_unit": "Years",
            "patient_gender": "Female",
            "patient_weight_kg": 58.0,
            "medical_history": "Recurrent gouty arthritis, CKD Stage 2",
            "known_allergies": "Sulfa drugs",
            "clinical_narrative": "48yo female with acute gout was prescribed Allopurinol 300mg daily. On day 14, developed high fever (39.2C), extensive peeling rash, and elevated ALT/AST consistent with DRESS syndrome. Hospitalized in ICU. Drug stopped immediately.",
            "suspected_medicines": [
                {
                    "drug_name": "Allopurinol",
                    "dose": "300 mg",
                    "unit": "mg",
                    "route": "Oral",
                    "frequency": "Once daily",
                    "start_date": "2026-08-05",
                    "stop_date": "2026-08-19",
                    "indication": "Gout prophylaxis",
                    "batch_no": "ALP-9912",
                    "manufacturer": "Teva",
                    "is_suspected": True
                }
            ],
            "concomitant_medicines": [],
            "reactions": [
                {
                    "term": "DRESS syndrome (Drug Reaction with Eosinophilia and Systemic Symptoms)",
                    "meddra_pt": "Drug reaction with eosinophilia and systemic symptoms",
                    "time_to_onset": "14 days after starting",
                    "outcome": "Recovering",
                    "description": "Maculopapular morbilliform exanthem with facial edema and lymphadenopathy."
                },
                {
                    "term": "High pyrexia",
                    "meddra_pt": "Pyrexia",
                    "time_to_onset": "14 days after starting",
                    "outcome": "Recovering",
                    "description": "Spiking fevers up to 39.2 C."
                },
                {
                    "term": "Drug-induced liver injury / Elevated ALT/AST",
                    "meddra_pt": "Hepatic enzyme increased",
                    "time_to_onset": "14 days after starting",
                    "outcome": "Recovering",
                    "description": "Transaminitis ALT 420 U/L, AST 380 U/L, Eosinophils 1.8 x 10^9/L."
                }
            ],
            "reaction_onset_date": "2026-08-19",
            "reaction_outcome": "Recovering",
            "is_serious": True,
            "seriousness_death": False,
            "seriousness_life_threatening": True,
            "seriousness_hospitalization": True,
            "seriousness_disability": False,
            "seriousness_congenital_anomaly": False,
            "seriousness_other_medically_important": True,
            "seriousness_details": "Severe SCAR reaction (DRESS) requiring ICU admission and systemic corticosteroids.",
            "dechallenge_action": "Medicine discontinued",
            "dechallenge_outcome": "Reaction abated",
            "rechallenge_action": "Not reintroduced",
            "rechallenge_outcome": "Not applicable",
            "causality_method": "Naranjo Algorithm",
            "causality_score": 8,
            "causality_category": "Probable",
            "naranjo_answers": {"q1": 1, "q2": 2, "q3": 1, "q4": 0, "q5": 2, "q6": 0, "q7": 0, "q8": 0, "q9": 1, "q10": 1},
            "lab_findings": "ALT 420 U/L, AST 380 U/L, Eosinophil count 1800/uL (22%), HLA-B*58:01 positive.",
            "reporter_name": "Dr. Vikram Gupta, MD, PhD",
            "reporter_role": "Pharmacovigilance Officer",
            "reporter_contact": "v.gupta@ipc.gov.in",
            "reporter_institution": "Indian Pharmacopoeia Commission (IPC)",
            "reporter_country": "India",
            "status": "PENDING_REVIEW",
            "created_by_user_id": user_map["pv_gupta"]
        }
    ]

    for rep_data in sample_reports:
        missing_fields, comp_score, ich_met = validate_adr_report_completeness(rep_data)
        rep = ADRReport(
            **rep_data,
            ai_missing_fields=missing_fields,
            completeness_score=comp_score,
            ich_criteria_met=ich_met
        )
        db.add(rep)
        db.flush()
        audit = AuditLog(
            report_id=rep.id,
            user_id=rep_data["created_by_user_id"],
            action="INITIAL_SEED",
            details="System seeded clinical pharmacovigilance case record."
        )
        db.add(audit)

    db.commit()
    db.close()
    print("Database seeding completed successfully.")

if __name__ == "__main__":
    seed_database()
