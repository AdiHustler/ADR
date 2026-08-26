from typing import Dict, Any, List, Tuple

def validate_adr_report_completeness(data: Dict[str, Any]) -> Tuple[List[Dict[str, str]], float, bool]:
    """
    Validates completeness of an ADR report against Pharmacovigilance guidelines (ICH E2B / WHO).
    Returns: (missing_fields, completeness_score, ich_criteria_met)
    """
    missing_fields = []
    total_points = 100
    deductions = 0
    
    # 1. Check ICH 4 Minimum Criteria
    # Criterion 1: Identifiable Patient
    has_patient = bool(
        data.get("patient_identifier") or 
        data.get("patient_age") or 
        data.get("patient_gender")
    )
    if not has_patient:
        missing_fields.append({
            "field": "patient_identifier",
            "category": "mandatory_ich",
            "description": "Patient identifier, age, or gender is missing.",
            "suggested_action": "Provide patient age, initials, or MRN."
        })
        deductions += 25

    # Criterion 2: Identifiable Reporter
    has_reporter = bool(
        data.get("reporter_name") or 
        data.get("reporter_role") or 
        data.get("reporter_institution")
    )
    if not has_reporter:
        missing_fields.append({
            "field": "reporter_name",
            "category": "mandatory_ich",
            "description": "Reporter information is missing.",
            "suggested_action": "Enter reporter name, role (e.g. Physician/Pharmacist), or institution."
        })
        deductions += 20

    # Criterion 3: Suspected Medicine
    suspected_meds = data.get("suspected_medicines", [])
    has_suspected_med = False
    if isinstance(suspected_meds, list) and len(suspected_meds) > 0:
        for med in suspected_meds:
            if isinstance(med, dict) and med.get("drug_name"):
                has_suspected_med = True
                break
    
    if not has_suspected_med:
        missing_fields.append({
            "field": "suspected_medicines",
            "category": "mandatory_ich",
            "description": "No suspected medicine has been identified.",
            "suggested_action": "Add at least one suspected drug name."
        })
        deductions += 25

    # Criterion 4: Adverse Reaction
    reactions = data.get("reactions", [])
    has_reaction = False
    if isinstance(reactions, list) and len(reactions) > 0:
        for r in reactions:
            if isinstance(r, dict) and r.get("term"):
                has_reaction = True
                break
                
    if not has_reaction:
        missing_fields.append({
            "field": "reactions",
            "category": "mandatory_ich",
            "description": "Adverse reaction term/description is missing.",
            "suggested_action": "Specify the clinical reaction symptoms (e.g., Skin rash, Angioedema)."
        })
        deductions += 25

    ich_criteria_met = has_patient and has_reporter and has_suspected_med and has_reaction

    # 2. Check Clinical Quality / Secondary Fields
    # Onset latency / date
    if not data.get("reaction_onset_date"):
        has_time_to_onset = any(
            isinstance(r, dict) and r.get("time_to_onset") for r in reactions
        ) if isinstance(reactions, list) else False
        
        if not has_time_to_onset:
            missing_fields.append({
                "field": "reaction_onset_date",
                "category": "important_clinical",
                "description": "Date or time of onset after drug initiation has not been specified.",
                "suggested_action": "Add reaction onset date or latency (e.g. 2 days after initiation)."
            })
            deductions += 10

    # Drug dose and route check
    if has_suspected_med:
        incomplete_dosing = any(
            isinstance(m, dict) and (not m.get("dose") or not m.get("route"))
            for m in suspected_meds
        )
        if incomplete_dosing:
            missing_fields.append({
                "field": "drug_dose_route",
                "category": "important_clinical",
                "description": "Dose or route of administration is missing for suspected medicine.",
                "suggested_action": "Specify dose (e.g., 500 mg) and route (e.g., Oral, IV)."
            })
            deductions += 8

    # Dechallenge action & outcome
    if not data.get("dechallenge_action") or data.get("dechallenge_action") == "Unknown":
        missing_fields.append({
            "field": "dechallenge_action",
            "category": "important_clinical",
            "description": "Action taken regarding the suspected medicine (Dechallenge) is unrecorded.",
            "suggested_action": "Indicate if drug was discontinued, reduced, or maintained."
        })
        deductions += 5

    # Medical history / known allergies
    if not data.get("medical_history") and not data.get("known_allergies"):
        missing_fields.append({
            "field": "medical_history",
            "category": "recommended",
            "description": "Relevant patient medical history and known drug allergies are empty.",
            "suggested_action": "Enter baseline comorbidities or note 'None known'."
        })
        deductions += 4

    # Batch / Lot number
    if has_suspected_med:
        has_batch = any(
            isinstance(m, dict) and m.get("batch_no")
            for m in suspected_meds
        )
        if not has_batch:
            missing_fields.append({
                "field": "batch_no",
                "category": "recommended",
                "description": "Medication batch/lot number and manufacturer are not documented.",
                "suggested_action": "Enter lot/batch number if available from packaging/EHR."
            })
            deductions += 3

    # Calculate final completeness score bounded between 0 and 100
    completeness_score = max(0.0, min(100.0, float(total_points - deductions)))
    
    return missing_fields, completeness_score, ich_criteria_met
