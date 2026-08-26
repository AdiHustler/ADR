import datetime
import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import desc, or_

from app.database import get_db
from app.models import ADRReport, AuditLog, User
from app.schemas import (
    ADRReportCreate,
    ADRReportUpdate,
    ADRReportResponse,
    ADRReportVerify
)
from app.routes.auth import get_current_user
from app.nlp.validator import validate_adr_report_completeness

router = APIRouter(prefix="/reports", tags=["ADR Case Reports"])

def generate_report_number(db: Session) -> str:
    current_year = datetime.datetime.utcnow().year
    count = db.query(ADRReport).count() + 1
    return f"ADR-{current_year}-{count:04d}"

@router.post("", response_model=ADRReportResponse, status_code=status.HTTP_201_CREATED)
def create_report(
    report_in: ADRReportCreate,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user)
):
    rep_dict = report_in.dict()
    
    # Run automatic completeness check
    missing_fields, comp_score, ich_met = validate_adr_report_completeness(rep_dict)
    
    report_number = generate_report_number(db)
    user_id = current_user.id if current_user else None
    
    # Convert suspected_medicines and concomitant_medicines and reactions to json serializable
    new_report = ADRReport(
        report_number=report_number,
        patient_identifier=rep_dict.get("patient_identifier") or f"PT-{rep_dict.get('patient_age', 'XX')}{rep_dict.get('patient_gender', 'U')[0] if rep_dict.get('patient_gender') else 'X'}",
        patient_age=rep_dict.get("patient_age"),
        patient_age_unit=rep_dict.get("patient_age_unit", "Years"),
        patient_gender=rep_dict.get("patient_gender"),
        patient_weight_kg=rep_dict.get("patient_weight_kg"),
        medical_history=rep_dict.get("medical_history"),
        known_allergies=rep_dict.get("known_allergies"),
        clinical_narrative=rep_dict.get("clinical_narrative"),
        suspected_medicines=rep_dict.get("suspected_medicines", []),
        concomitant_medicines=rep_dict.get("concomitant_medicines", []),
        reactions=rep_dict.get("reactions", []),
        reaction_onset_date=rep_dict.get("reaction_onset_date"),
        reaction_outcome=rep_dict.get("reaction_outcome", "Recovering"),
        is_serious=rep_dict.get("is_serious", False),
        seriousness_death=rep_dict.get("seriousness_death", False),
        seriousness_life_threatening=rep_dict.get("seriousness_life_threatening", False),
        seriousness_hospitalization=rep_dict.get("seriousness_hospitalization", False),
        seriousness_disability=rep_dict.get("seriousness_disability", False),
        seriousness_congenital_anomaly=rep_dict.get("seriousness_congenital_anomaly", False),
        seriousness_other_medically_important=rep_dict.get("seriousness_other_medically_important", False),
        seriousness_details=rep_dict.get("seriousness_details"),
        dechallenge_action=rep_dict.get("dechallenge_action", "Medicine discontinued"),
        dechallenge_outcome=rep_dict.get("dechallenge_outcome", "Reaction abated"),
        rechallenge_action=rep_dict.get("rechallenge_action", "Not reintroduced"),
        rechallenge_outcome=rep_dict.get("rechallenge_outcome", "Not applicable"),
        causality_method=rep_dict.get("causality_method", "Naranjo Algorithm"),
        causality_score=rep_dict.get("causality_score", 0),
        causality_category=rep_dict.get("causality_category", "Possible"),
        naranjo_answers=rep_dict.get("naranjo_answers", {}),
        lab_findings=rep_dict.get("lab_findings"),
        additional_remarks=rep_dict.get("additional_remarks"),
        reporter_name=rep_dict.get("reporter_name") or (current_user.full_name if current_user else "Healthcare Professional"),
        reporter_role=rep_dict.get("reporter_role") or (current_user.role if current_user else "Physician"),
        reporter_contact=rep_dict.get("reporter_contact") or (current_user.email if current_user else "physician@hospital.org"),
        reporter_institution=rep_dict.get("reporter_institution") or (current_user.institution if current_user else "Metropolitan Medical Center"),
        reporter_country=rep_dict.get("reporter_country", "United States"),
        ai_raw_extraction=rep_dict.get("ai_raw_extraction", {}),
        ai_confidence_score=rep_dict.get("ai_confidence_score", 0.0),
        ai_missing_fields=missing_fields,
        completeness_score=comp_score,
        ich_criteria_met=ich_met,
        status=rep_dict.get("status", "DRAFT"),
        ai_clinical_summary=rep_dict.get("ai_clinical_summary"),
        created_by_user_id=user_id
    )
    db.add(new_report)
    db.flush()

    # Create Initial Audit Log
    audit = AuditLog(
        report_id=new_report.id,
        user_id=user_id,
        action="REPORT_CREATED",
        details=f"Draft report created with completeness {comp_score:.0f}%"
    )
    db.add(audit)
    db.commit()
    db.refresh(new_report)
    return new_report

@router.get("", response_model=List[ADRReportResponse])
def get_reports(
    search: Optional[str] = None,
    status_filter: Optional[str] = Query(None, alias="status"),
    is_serious: Optional[bool] = None,
    drug_name: Optional[str] = None,
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db)
):
    query = db.query(ADRReport)

    if status_filter:
        query = query.filter(ADRReport.status == status_filter)
    if is_serious is not None:
        query = query.filter(ADRReport.is_serious == is_serious)
    if search:
        search_fmt = f"%{search}%"
        query = query.filter(
            or_(
                ADRReport.report_number.ilike(search_fmt),
                ADRReport.patient_identifier.ilike(search_fmt),
                ADRReport.clinical_narrative.ilike(search_fmt),
                ADRReport.reporter_name.ilike(search_fmt)
            )
        )

    reports = query.order_by(desc(ADRReport.created_at)).offset(skip).limit(limit).all()
    
    # Filter in-memory for drug_name if provided
    if drug_name:
        dn_lower = drug_name.lower()
        filtered = []
        for r in reports:
            meds = r.suspected_medicines or []
            if any(isinstance(m, dict) and dn_lower in m.get("drug_name", "").lower() for m in meds):
                filtered.append(r)
        return filtered

    return reports

@router.get("/{report_id}", response_model=ADRReportResponse)
def get_report(report_id: int, db: Session = Depends(get_db)):
    report = db.query(ADRReport).filter(ADRReport.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="ADR Report not found")
    return report

@router.put("/{report_id}", response_model=ADRReportResponse)
def update_report(
    report_id: int,
    report_in: ADRReportUpdate,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user)
):
    report = db.query(ADRReport).filter(ADRReport.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="ADR Report not found")

    rep_dict = report_in.dict()
    missing_fields, comp_score, ich_met = validate_adr_report_completeness(rep_dict)

    for key, value in rep_dict.items():
        if hasattr(report, key) and value is not None:
            setattr(report, key, value)

    report.ai_missing_fields = missing_fields
    report.completeness_score = comp_score
    report.ich_criteria_met = ich_met
    report.updated_at = datetime.datetime.utcnow()

    # Log update
    user_id = current_user.id if current_user else None
    audit = AuditLog(
        report_id=report.id,
        user_id=user_id,
        action="REPORT_UPDATED",
        details=f"Report updated by {current_user.full_name if current_user else 'Healthcare Professional'}"
    )
    db.add(audit)
    db.commit()
    db.refresh(report)
    return report

@router.post("/{report_id}/verify", response_model=ADRReportResponse)
def verify_report(
    report_id: int,
    verify_in: ADRReportVerify,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user)
):
    """
    Healthcare Professional Review & Approval workflow.
    Validates human sign-off on AI-suggested fields and transitions status to VERIFIED_APPROVED.
    """
    report = db.query(ADRReport).filter(ADRReport.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="ADR Report not found")

    user_id = current_user.id if current_user else None
    verifier_name = current_user.full_name if current_user else "Reviewing Clinician"

    if verify_in.approved:
        report.status = "VERIFIED_APPROVED"
        report.verified_by_user_id = user_id
        report.verified_at = datetime.datetime.utcnow()
        report.verification_notes = verify_in.verification_notes or "Reviewed and clinically approved by healthcare professional."
        action_name = "CLINICAL_APPROVAL"
        action_detail = f"Report approved and verified by {verifier_name}. Ready for pharmacovigilance submission."
    else:
        report.status = "PENDING_REVIEW"
        report.verification_notes = verify_in.verification_notes or "Sent back for further clinical information."
        action_name = "CHANGES_REQUESTED"
        action_detail = f"Reviewer requested modifications: {verify_in.verification_notes}"

    audit = AuditLog(
        report_id=report.id,
        user_id=user_id,
        action=action_name,
        details=action_detail
    )
    db.add(audit)
    db.commit()
    db.refresh(report)
    return report

@router.post("/{report_id}/submit", response_model=ADRReportResponse)
def submit_report(
    report_id: int,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user)
):
    report = db.query(ADRReport).filter(ADRReport.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="ADR Report not found")

    if not report.ich_criteria_met:
        raise HTTPException(
            status_code=400,
            detail="Cannot submit: Report does not meet the 4 ICH Minimum Reporting Criteria."
        )

    report.status = "SUBMITTED"
    user_id = current_user.id if current_user else None
    audit = AuditLog(
        report_id=report.id,
        user_id=user_id,
        action="SUBMITTED_TO_REGISTRY",
        details="Transmitted to National Pharmacovigilance Centre."
    )
    db.add(audit)
    db.commit()
    db.refresh(report)
    return report

@router.delete("/{report_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_report(
    report_id: int,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user)
):
    report = db.query(ADRReport).filter(ADRReport.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="ADR Report not found")

    db.delete(report)
    db.commit()
    return None
