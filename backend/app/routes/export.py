import io
import json
import datetime
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import Response, StreamingResponse
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import ADRReport

# ReportLab imports for PDF generation
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle

router = APIRouter(prefix="/reports", tags=["Export & Regulatory Reports"])

@router.get("/{report_id}/export/e2b")
def export_e2b_json(report_id: int, db: Session = Depends(get_db)):
    report = db.query(ADRReport).filter(ADRReport.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="ADR Report not found")

    # Build ICH E2B(R3) compatible JSON representation
    e2b_payload = {
        "ichicsr": {
            "safetyreportversion": "1",
            "safetyreportid": report.report_number,
            "primarysourcecountry": report.reporter_country or "US",
            "occurcountry": report.reporter_country or "US",
            "transmissiondate": datetime.datetime.utcnow().strftime("%Y%m%d%H%M%S"),
            "reporttype": "1", # Spontaneous report
            "serious": "1" if report.is_serious else "2",
            "seriousnesscriteria": {
                "seriousnessdeath": "1" if report.seriousness_death else "2",
                "seriousnesslifethreatening": "1" if report.seriousness_life_threatening else "2",
                "seriousnesshospitalization": "1" if report.seriousness_hospitalization else "2",
                "seriousnessdisabling": "1" if report.seriousness_disability else "2",
                "seriousnesscongenitalanomali": "1" if report.seriousness_congenital_anomaly else "2",
                "seriousnessother": "1" if report.seriousness_other_medically_important else "2"
            },
            "primarysource": {
                "reportername": report.reporter_name,
                "qualification": report.reporter_role,
                "reporterorganization": report.reporter_institution,
                "reporteremail": report.reporter_contact
            },
            "patient": {
                "patientinitial": report.patient_identifier,
                "patientonsetage": str(report.patient_age) if report.patient_age else None,
                "patientonsetageunit": "801" if report.patient_age_unit == "Years" else "802",
                "patientsex": "1" if report.patient_gender == "Male" else ("2" if report.patient_gender == "Female" else "0"),
                "patientweight": str(report.patient_weight_kg) if report.patient_weight_kg else None,
                "patientmedicalhistorytext": report.medical_history
            },
            "medicalhistory": {
                "history": report.medical_history,
                "allergies": report.known_allergies
            },
            "drug": [
                {
                    "drugcharacterization": "1", # Suspected
                    "medicinalproduct": med.get("drug_name"),
                    "drugdosagetext": med.get("dose"),
                    "drugadministrationroute": med.get("route"),
                    "drugindication": med.get("indication"),
                    "drugstartdate": med.get("start_date"),
                    "drugenddate": med.get("stop_date"),
                    "actiontakendrug": report.dechallenge_action,
                    "drugrecurrence": report.rechallenge_outcome
                }
                for med in (report.suspected_medicines or [])
            ] + [
                {
                    "drugcharacterization": "2", # Concomitant
                    "medicinalproduct": med.get("drug_name"),
                    "drugdosagetext": med.get("dose"),
                    "drugadministrationroute": med.get("route"),
                    "drugindication": med.get("indication")
                }
                for med in (report.concomitant_medicines or [])
            ],
            "reaction": [
                {
                    "primarysourcereaction": rxn.get("term"),
                    "reactionmeddrapt": rxn.get("meddra_pt"),
                    "reactionstartdate": rxn.get("time_to_onset") or report.reaction_onset_date,
                    "reactionoutcome": rxn.get("outcome") or report.reaction_outcome
                }
                for rxn in (report.reactions or [])
            ],
            "causalityassessment": {
                "causalitymethod": report.causality_method,
                "causalityscore": report.causality_score,
                "causalityresult": report.causality_category
            },
            "narrative": {
                "narrativeincludeclinical": report.clinical_narrative,
                "verificationstatus": report.status,
                "verifiedat": report.verified_at.isoformat() if report.verified_at else None,
                "verificationnotes": report.verification_notes
            }
        }
    }

    formatted_json = json.dumps(e2b_payload, indent=2)
    return Response(
        content=formatted_json,
        media_type="application/json",
        headers={"Content-Disposition": f"attachment; filename={report.report_number}_E2B.json"}
    )


@router.get("/{report_id}/export/pdf")
def export_cioms_pdf(report_id: int, db: Session = Depends(get_db)):
    report = db.query(ADRReport).filter(ADRReport.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="ADR Report not found")

    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        rightMargin=36,
        leftMargin=36,
        topMargin=36,
        bottomMargin=36
    )

    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        'TitleStyle',
        parent=styles['Heading1'],
        fontSize=16,
        leading=20,
        textColor=colors.HexColor('#0f766e'), # Teal
        spaceAfter=6
    )
    subtitle_style = ParagraphStyle(
        'SubtitleStyle',
        parent=styles['Normal'],
        fontSize=9,
        textColor=colors.HexColor('#475569'),
        spaceAfter=12
    )
    heading_style = ParagraphStyle(
        'HeadingStyle',
        parent=styles['Heading2'],
        fontSize=11,
        leading=14,
        textColor=colors.HexColor('#1e293b'),
        spaceBefore=8,
        spaceAfter=4
    )
    body_style = ParagraphStyle(
        'BodyStyle',
        parent=styles['Normal'],
        fontSize=8.5,
        leading=11,
        textColor=colors.HexColor('#334155')
    )
    badge_style = ParagraphStyle(
        'BadgeStyle',
        parent=styles['Normal'],
        fontSize=8,
        textColor=colors.HexColor('#0f766e'),
        alignment=2 # Right
    )

    story = []

    # Header
    story.append(Paragraph("ADVERSE DRUG REACTION REPORT (CIOMS I / E2B)", title_style))
    story.append(Paragraph(f"Case Reference: <b>{report.report_number}</b> | Status: <b>{report.status}</b> | Quality Index: <b>{report.completeness_score:.0f}%</b>", subtitle_style))
    story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor('#0f766e'), spaceAfter=8))

    # Patient & Reporter Info Table
    patient_info = [
        [
            Paragraph("<b>I. PATIENT INFORMATION</b>", heading_style),
            Paragraph("<b>IV. REPORTER DETAILS</b>", heading_style)
        ],
        [
            Paragraph(f"<b>Identifier / Initials:</b> {report.patient_identifier or 'N/A'}<br/>"
                      f"<b>Age:</b> {report.patient_age or 'Unspecified'} {report.patient_age_unit}<br/>"
                      f"<b>Gender:</b> {report.patient_gender or 'Unspecified'}<br/>"
                      f"<b>Weight:</b> {f'{report.patient_weight_kg} kg' if report.patient_weight_kg else 'Unspecified'}<br/>"
                      f"<b>Medical History:</b> {report.medical_history or 'None documented'}", body_style),
            Paragraph(f"<b>Reporter:</b> {report.reporter_name or 'N/A'}<br/>"
                      f"<b>Role / Dept:</b> {report.reporter_role or 'Physician'}<br/>"
                      f"<b>Institution:</b> {report.reporter_institution or 'N/A'}<br/>"
                      f"<b>Contact:</b> {report.reporter_contact or 'N/A'}<br/>"
                      f"<b>Date Generated:</b> {datetime.datetime.utcnow().strftime('%Y-%m-%d %H:%M UTC')}", body_style)
        ]
    ]
    t1 = Table(patient_info, colWidths=[270, 270])
    t1.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#f1f5f9')),
        ('PADDING', (0,0), (-1,-1), 4),
        ('BOX', (0,0), (-1,-1), 0.5, colors.HexColor('#cbd5e1')),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor('#e2e8f0'))
    ]))
    story.append(t1)
    story.append(Spacer(1, 8))

    # Suspected Drug Table
    story.append(Paragraph("<b>II. SUSPECTED MEDICINE(S) & CONCOMITANT DRUGS</b>", heading_style))
    med_rows = [
        [Paragraph("<b>Type</b>", body_style), Paragraph("<b>Drug Name</b>", body_style), Paragraph("<b>Dose & Route</b>", body_style), Paragraph("<b>Frequency</b>", body_style), Paragraph("<b>Indication</b>", body_style)]
    ]
    for m in (report.suspected_medicines or []):
        med_rows.append([
            Paragraph("<font color='#b91c1c'><b>SUSPECTED</b></font>", body_style),
            Paragraph(f"<b>{m.get('drug_name', 'N/A')}</b>", body_style),
            Paragraph(f"{m.get('dose', 'Unspecified')} ({m.get('route', 'Oral')})", body_style),
            Paragraph(m.get('frequency', 'N/A') or 'N/A', body_style),
            Paragraph(m.get('indication', 'N/A') or 'N/A', body_style)
        ])
    for cm in (report.concomitant_medicines or []):
        med_rows.append([
            Paragraph("<font color='#475569'>Concomitant</font>", body_style),
            Paragraph(cm.get('drug_name', 'N/A'), body_style),
            Paragraph(f"{cm.get('dose', 'Unspecified')} ({cm.get('route', 'Oral')})", body_style),
            Paragraph("N/A", body_style),
            Paragraph(cm.get('indication', 'N/A') or 'N/A', body_style)
        ])
    if len(med_rows) == 1:
        med_rows.append([Paragraph("No medications specified", body_style), Paragraph("-", body_style), Paragraph("-", body_style), Paragraph("-", body_style), Paragraph("-", body_style)])

    t2 = Table(med_rows, colWidths=[80, 140, 120, 90, 110])
    t2.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#f8fafc')),
        ('PADDING', (0,0), (-1,-1), 4),
        ('BOX', (0,0), (-1,-1), 0.5, colors.HexColor('#cbd5e1')),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor('#e2e8f0')),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE')
    ]))
    story.append(t2)
    story.append(Spacer(1, 8))

    # Adverse Reaction Details Table
    story.append(Paragraph("<b>III. ADVERSE REACTION & CLINICAL CHRONOLOGY</b>", heading_style))
    rxn_rows = [
        [Paragraph("<b>Reaction Term</b>", body_style), Paragraph("<b>MedDRA PT</b>", body_style), Paragraph("<b>Time to Onset</b>", body_style), Paragraph("<b>Outcome</b>", body_style)]
    ]
    for rxn in (report.reactions or []):
        rxn_rows.append([
            Paragraph(f"<b>{rxn.get('term', 'N/A')}</b>", body_style),
            Paragraph(rxn.get('meddra_pt', 'N/A') or 'N/A', body_style),
            Paragraph(rxn.get('time_to_onset', 'N/A') or (report.reaction_onset_date or 'N/A'), body_style),
            Paragraph(rxn.get('outcome', 'N/A') or (report.reaction_outcome or 'N/A'), body_style)
        ])
    if len(rxn_rows) == 1:
        rxn_rows.append([Paragraph("No reactions specified", body_style), Paragraph("-", body_style), Paragraph("-", body_style), Paragraph("-", body_style)])

    t3 = Table(rxn_rows, colWidths=[150, 150, 120, 120])
    t3.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#f8fafc')),
        ('PADDING', (0,0), (-1,-1), 4),
        ('BOX', (0,0), (-1,-1), 0.5, colors.HexColor('#cbd5e1')),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor('#e2e8f0')),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE')
    ]))
    story.append(t3)
    story.append(Spacer(1, 8))

    # Seriousness, Dechallenge & Causality Table
    story.append(Paragraph("<b>V. SERIOUSNESS, CAUSALITY & PHARMACOVIGILANCE METRICS</b>", heading_style))
    serious_tags = []
    if report.seriousness_life_threatening: serious_tags.append("Life-Threatening")
    if report.seriousness_hospitalization: serious_tags.append("Hospitalization")
    if report.seriousness_disability: serious_tags.append("Disability")
    if report.seriousness_death: serious_tags.append("Death")
    if report.seriousness_congenital_anomaly: serious_tags.append("Congenital Anomaly")
    if report.seriousness_other_medically_important: serious_tags.append("Medically Important")
    serious_summary = ", ".join(serious_tags) if serious_tags else ("NON-SERIOUS" if not report.is_serious else "SERIOUS (Unspecified)")

    summary_info = [
        [
            Paragraph(f"<b>Seriousness:</b> {serious_summary}<br/>"
                      f"<b>Dechallenge Action:</b> {report.dechallenge_action or 'N/A'}<br/>"
                      f"<b>Dechallenge Outcome:</b> {report.dechallenge_outcome or 'N/A'}", body_style),
            Paragraph(f"<b>Causality Method:</b> {report.causality_method} (Score: {report.causality_score})<br/>"
                      f"<b>Causality Assessment:</b> <b>{report.causality_category}</b><br/>"
                      f"<b>Rechallenge:</b> {report.rechallenge_action} ({report.rechallenge_outcome})", body_style)
        ]
    ]
    t4 = Table(summary_info, colWidths=[270, 270])
    t4.setStyle(TableStyle([
        ('PADDING', (0,0), (-1,-1), 5),
        ('BOX', (0,0), (-1,-1), 0.5, colors.HexColor('#cbd5e1')),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor('#e2e8f0')),
        ('VALIGN', (0,0), (-1,-1), 'TOP')
    ]))
    story.append(t4)
    story.append(Spacer(1, 8))

    # Narrative & Clinical Verification Signoff
    story.append(Paragraph("<b>VI. CLINICAL NARRATIVE & VERIFICATION AUDIT</b>", heading_style))
    narrative_text = report.clinical_narrative or "No raw narrative provided."
    verification_text = f"<b>Verification Status:</b> {report.status}<br/>" \
                        f"<b>Review Notes:</b> {report.verification_notes or 'Clinically reviewed and verified.'}<br/>" \
                        f"<b>Sign-off Timestamp:</b> {report.verified_at.strftime('%Y-%m-%d %H:%M UTC') if report.verified_at else 'Pending Verification'}"
    
    t5 = Table([
        [Paragraph(f"<b>Clinical Case Description:</b><br/>{narrative_text}", body_style)],
        [Paragraph(verification_text, body_style)]
    ], colWidths=[540])
    t5.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#f8fafc')),
        ('PADDING', (0,0), (-1,-1), 5),
        ('BOX', (0,0), (-1,-1), 0.5, colors.HexColor('#cbd5e1')),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor('#e2e8f0'))
    ]))
    story.append(t5)

    doc.build(story)
    buffer.seek(0)
    return StreamingResponse(
        buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={report.report_number}_CIOMS.pdf"}
    )
