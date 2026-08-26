from collections import Counter
from typing import Dict, Any, List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.database import get_db
from app.models import ADRReport
from app.schemas import DashboardStats, ADRReportResponse

router = APIRouter(prefix="/analytics", tags=["Pharmacovigilance Analytics"])

@router.get("/dashboard", response_model=DashboardStats)
def get_dashboard_metrics(db: Session = Depends(get_db)):
    reports = db.query(ADRReport).all()
    total_reports = len(reports)
    serious_reports = sum(1 for r in reports if r.is_serious)
    pending_review = sum(1 for r in reports if r.status in ["DRAFT", "AI_EXTRACTED", "PENDING_REVIEW"])
    verified_approved = sum(1 for r in reports if r.status in ["VERIFIED_APPROVED", "SUBMITTED"])
    
    avg_completeness = (sum(r.completeness_score for r in reports) / total_reports) if total_reports > 0 else 0.0

    # Top Suspected Drugs
    drug_counts = Counter()
    for r in reports:
        for med in (r.suspected_medicines or []):
            if isinstance(med, dict) and med.get("drug_name"):
                drug_counts[med["drug_name"].strip().title()] += 1
    
    top_suspected_drugs = [
        {"name": drug, "count": count}
        for drug, count in drug_counts.most_common(6)
    ]

    # Top Adverse Reactions
    reaction_counts = Counter()
    for r in reports:
        for rxn in (r.reactions or []):
            if isinstance(rxn, dict) and rxn.get("term"):
                reaction_counts[rxn["term"].strip()] += 1
                
    top_reactions = [
        {"term": rxn, "count": count}
        for rxn, count in reaction_counts.most_common(6)
    ]

    # Seriousness Criteria Breakdown
    seriousness_dist = {
        "Life Threatening": sum(1 for r in reports if r.seriousness_life_threatening),
        "Hospitalization": sum(1 for r in reports if r.seriousness_hospitalization),
        "Disability": sum(1 for r in reports if r.seriousness_disability),
        "Other Medically Important": sum(1 for r in reports if r.seriousness_other_medically_important),
        "Death": sum(1 for r in reports if r.seriousness_death),
        "Non-Serious": sum(1 for r in reports if not r.is_serious)
    }

    # Status Distribution
    status_dist = {
        "DRAFT": sum(1 for r in reports if r.status == "DRAFT"),
        "AI_EXTRACTED": sum(1 for r in reports if r.status == "AI_EXTRACTED"),
        "PENDING_REVIEW": sum(1 for r in reports if r.status == "PENDING_REVIEW"),
        "VERIFIED_APPROVED": sum(1 for r in reports if r.status == "VERIFIED_APPROVED"),
        "SUBMITTED": sum(1 for r in reports if r.status == "SUBMITTED")
    }

    # Causality Distribution
    causality_dist = {
        "Definite": sum(1 for r in reports if r.causality_category == "Definite"),
        "Probable": sum(1 for r in reports if r.causality_category == "Probable"),
        "Possible": sum(1 for r in reports if r.causality_category == "Possible"),
        "Doubtful": sum(1 for r in reports if r.causality_category == "Doubtful")
    }

    recent_reports = db.query(ADRReport).order_by(desc(ADRReport.created_at)).limit(6).all()

    return {
        "total_reports": total_reports,
        "serious_reports": serious_reports,
        "pending_review": pending_review,
        "verified_approved": verified_approved,
        "avg_completeness_score": round(avg_completeness, 1),
        "top_suspected_drugs": top_suspected_drugs,
        "top_reactions": top_reactions,
        "seriousness_distribution": seriousness_dist,
        "status_distribution": status_dist,
        "causality_distribution": causality_dist,
        "recent_reports": recent_reports
    }
