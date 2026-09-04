import re
import json
import os
import logging
import requests
from typing import Dict, Any, List, Optional
from app.config import settings
from app.nlp.validator import validate_adr_report_completeness
from app.nlp.causality import calculate_naranjo_score

logger = logging.getLogger(__name__)

# Common Clinical Dictionaries for NER & Rule-based extraction
KNOWN_DRUGS = {
    "amoxicillin": {"route": "Oral", "default_unit": "mg", "class": "Antibiotic"},
    "amoxicillin-clavulanate": {"route": "Oral", "default_unit": "mg", "class": "Antibiotic"},
    "augmentin": {"route": "Oral", "default_unit": "mg", "class": "Antibiotic"},
    "lisinopril": {"route": "Oral", "default_unit": "mg", "class": "ACE Inhibitor"},
    "enalapril": {"route": "Oral", "default_unit": "mg", "class": "ACE Inhibitor"},
    "ramipril": {"route": "Oral", "default_unit": "mg", "class": "ACE Inhibitor"},
    "atorvastatin": {"route": "Oral", "default_unit": "mg", "class": "Statin"},
    "rosuvastatin": {"route": "Oral", "default_unit": "mg", "class": "Statin"},
    "simvastatin": {"route": "Oral", "default_unit": "mg", "class": "Statin"},
    "metformin": {"route": "Oral", "default_unit": "mg", "class": "Antidiabetic"},
    "ibuprofen": {"route": "Oral", "default_unit": "mg", "class": "NSAID"},
    "naproxen": {"route": "Oral", "default_unit": "mg", "class": "NSAID"},
    "aspirin": {"route": "Oral", "default_unit": "mg", "class": "Antiplatelet / NSAID"},
    "allopurinol": {"route": "Oral", "default_unit": "mg", "class": "Xanthine Oxidase Inhibitor"},
    "warfarin": {"route": "Oral", "default_unit": "mg", "class": "Anticoagulant"},
    "clarithromycin": {"route": "Oral", "default_unit": "mg", "class": "Macrolide Antibiotic"},
    "ciprofloxacin": {"route": "Oral", "default_unit": "mg", "class": "Fluoroquinolone"},
    "azithromycin": {"route": "Oral", "default_unit": "mg", "class": "Macrolide Antibiotic"},
    "carbamazepine": {"route": "Oral", "default_unit": "mg", "class": "Anticonvulsant"},
    "phenytoin": {"route": "Oral", "default_unit": "mg", "class": "Anticonvulsant"},
    "methotrexate": {"route": "Oral", "default_unit": "mg", "class": "DMARD / Immunosuppressant"},
    "vancomycin": {"route": "Intravenous", "default_unit": "mg", "class": "Glycopeptide Antibiotic"},
    "penicillin": {"route": "Intravenous", "default_unit": "mg", "class": "Antibiotic"},
    "ceftriaxone": {"route": "Intravenous", "default_unit": "g", "class": "Cephalosporin"},
    "epinephrine": {"route": "Intramuscular", "default_unit": "mg", "class": "Adrenergic Agonist"},
    "hydrocortisone": {"route": "Intravenous", "default_unit": "mg", "class": "Corticosteroid"},
    "tramadol": {"route": "Oral", "default_unit": "mg", "class": "Opioid Analgesic"},
    "furosemide": {"route": "Oral", "default_unit": "mg", "class": "Loop Diuretic"},
    "amlodipine": {"route": "Oral", "default_unit": "mg", "class": "Calcium Channel Blocker"},
    "omeprazole": {"route": "Oral", "default_unit": "mg", "class": "Proton Pump Inhibitor"},
    "pantoprazole": {"route": "Oral", "default_unit": "mg", "class": "Proton Pump Inhibitor"}
}

MEDDRA_REACTIONS = {
    "rash": {"term": "Skin rash", "pt": "Rash", "soc": "Skin and subcutaneous tissue disorders"},
    "red rash": {"term": "Erythematous rash", "pt": "Rash erythematous", "soc": "Skin and subcutaneous tissue disorders"},
    "itching": {"term": "Severe pruritus / itching", "pt": "Pruritus", "soc": "Skin and subcutaneous tissue disorders"},
    "pruritus": {"term": "Pruritus", "pt": "Pruritus", "soc": "Skin and subcutaneous tissue disorders"},
    "urticaria": {"term": "Urticaria / Hives", "pt": "Urticaria", "soc": "Skin and subcutaneous tissue disorders"},
    "hives": {"term": "Urticaria / Hives", "pt": "Urticaria", "soc": "Skin and subcutaneous tissue disorders"},
    "facial swelling": {"term": "Facial swelling / Angioedema", "pt": "Face oedema", "soc": "Skin and subcutaneous tissue disorders"},
    "swelling of face": {"term": "Facial swelling / Angioedema", "pt": "Face oedema", "soc": "Skin and subcutaneous tissue disorders"},
    "lip swelling": {"term": "Lip angioedema", "pt": "Lip oedema", "soc": "Skin and subcutaneous tissue disorders"},
    "angioedema": {"term": "Angioedema", "pt": "Angioedema", "soc": "Immune system disorders"},
    "difficulty breathing": {"term": "Dyspnea / Difficulty breathing", "pt": "Dyspnoea", "soc": "Respiratory, thoracic and mediastinal disorders"},
    "shortness of breath": {"term": "Shortness of breath", "pt": "Dyspnoea", "soc": "Respiratory, thoracic and mediastinal disorders"},
    "wheezing": {"term": "Wheezing / Bronchospasm", "pt": "Bronchospasm", "soc": "Respiratory, thoracic and mediastinal disorders"},
    "anaphylaxis": {"term": "Anaphylactic reaction", "pt": "Anaphylactic reaction", "soc": "Immune system disorders"},
    "cough": {"term": "Dry cough", "pt": "Cough", "soc": "Respiratory, thoracic and mediastinal disorders"},
    "dry cough": {"term": "Persistent dry cough", "pt": "Cough", "soc": "Respiratory, thoracic and mediastinal disorders"},
    "fever": {"term": "Pyrexia / Fever", "pt": "Pyrexia", "soc": "General disorders and administration site conditions"},
    "high fever": {"term": "High pyrexia", "pt": "Pyrexia", "soc": "General disorders and administration site conditions"},
    "jaundice": {"term": "Jaundice", "pt": "Jaundice", "soc": "Hepatobiliary disorders"},
    "elevated liver enzymes": {"term": "Drug-induced liver injury / Elevated ALT/AST", "pt": "Hepatic enzyme increased", "soc": "Investigations"},
    "elevated alt/ast": {"term": "Elevated liver enzymes (ALT/AST)", "pt": "Alanine aminotransferase increased", "soc": "Investigations"},
    "dress": {"term": "DRESS syndrome (Drug Reaction with Eosinophilia and Systemic Symptoms)", "pt": "Drug reaction with eosinophilia and systemic symptoms", "soc": "Immune system disorders"},
    "sjs": {"term": "Stevens-Johnson Syndrome (SJS)", "pt": "Stevens-Johnson syndrome", "soc": "Skin and subcutaneous tissue disorders"},
    "peeling rash": {"term": "Exfoliative dermatitis / Peeling rash", "pt": "Dermatitis exfoliative", "soc": "Skin and subcutaneous tissue disorders"},
    "hematuria": {"term": "Gross hematuria", "pt": "Haematuria", "soc": "Renal and urinary disorders"},
    "epistaxis": {"term": "Epistaxis (Nosebleed)", "pt": "Epistaxis", "soc": "Respiratory, thoracic and mediastinal disorders"},
    "bleeding": {"term": "Hemorrhage / Bleeding", "pt": "Haemorrhage", "soc": "Vascular disorders"},
    "nausea": {"term": "Nausea", "pt": "Nausea", "soc": "Gastrointestinal disorders"},
    "vomiting": {"term": "Vomiting", "pt": "Vomiting", "soc": "Gastrointestinal disorders"},
    "diarrhea": {"term": "Diarrhea", "pt": "Diarrhoea", "soc": "Gastrointestinal disorders"},
    "dizziness": {"term": "Dizziness / Presyncope", "pt": "Dizziness", "soc": "Nervous system disorders"},
    "headache": {"term": "Headache", "pt": "Headache", "soc": "Nervous system disorders"},
    "muscle pain": {"term": "Myalgia / Muscle pain", "pt": "Myalgia", "soc": "Musculoskeletal and connective tissue disorders"},
    "myalgia": {"term": "Myalgia", "pt": "Myalgia", "soc": "Musculoskeletal and connective tissue disorders"},
    "rhabdomyolysis": {"term": "Rhabdomyolysis", "pt": "Rhabdomyolysis", "soc": "Musculoskeletal and connective tissue disorders"}
}

def clean_json_text(text: str) -> str:
    text = text.strip()
    if text.startswith("```json"):
        text = text[7:]
    elif text.startswith("```"):
        text = text[3:]
    if text.endswith("```"):
        text = text[:-3]
    return text.strip()

def extract_with_llm(clinical_text: str, api_key: Optional[str] = None) -> Optional[Dict[str, Any]]:
    """
    Attempts extraction using Google Gemini or OpenRouter API if configured.
    """
    key = api_key or settings.GEMINI_API_KEY or settings.OPENROUTER_API_KEY
    if not key:
        return None

    prompt = f"""
You are an expert Clinical Pharmacovigilance NLP engine. Extract structured ADR information from the following clinical narrative into valid JSON.

Clinical narrative:
\"\"\"{clinical_text}\"\"\"

Output JSON strictly following this schema:
{{
  "patient_age": int or null,
  "patient_age_unit": "Years" or "Months" or "Days",
  "patient_gender": "Male" or "Female" or "Other" or null,
  "patient_weight_kg": float or null,
  "ai_clinical_summary": string or null,
  "medical_history": string or null,
  "suspected_medicines": [
    {{
      "drug_name": string,
      "dose": string or null,
      "unit": string or null,
      "route": string or null,
      "frequency": string or null,
      "start_date": string or null,
      "stop_date": string or null,
      "indication": string or null,
      "batch_no": string or null,
      "is_suspected": true
    }}
  ],
  "concomitant_medicines": [
    {{
      "drug_name": string,
      "dose": string or null,
      "route": string or null,
      "indication": string or null
    }}
  ],
  "reactions": [
    {{
      "term": string,
      "meddra_pt": string or null,
      "time_to_onset": string or null,
      "outcome": "Recovered" or "Recovering" or "Not Recovered" or "Fatal" or "Unknown",
      "description": string or null
    }}
  ],
  "reaction_onset_date": string or null,
  "reaction_outcome": string or null,
  "is_serious": boolean,
  "seriousness_criteria": {{
    "death": boolean,
    "life_threatening": boolean,
    "hospitalization": boolean,
    "disability": boolean,
    "congenital_anomaly": boolean,
    "other_medically_important": boolean
  }},
  "seriousness_details": string or null,
  "dechallenge_action": string ("Medicine discontinued" / "Dose reduced" / "Dose not changed" / "Unknown"),
  "dechallenge_outcome": string ("Reaction abated" / "Reaction did not abate" / "Inconclusive" / "Not applicable"),
  "rechallenge_action": string ("Not reintroduced" / "Medicine reintroduced" / "Unknown"),
  "rechallenge_outcome": string ("Not applicable" / "Reaction recurred" / "Reaction did not recur"),
  "lab_findings": string or null
}}
Return ONLY valid JSON.
"""

    # If OpenRouter Key
    if key.startswith("sk-or-"):
        try:
            url = "https://openrouter.ai/api/v1/chat/completions"
            headers = {
                "Authorization": f"Bearer {key}",
                "Content-Type": "application/json",
                "HTTP-Referer": "http://localhost:5173",
                "X-Title": "ADR-Sentinel AI"
            }
            payload = {
                "model": "openrouter/free",
                "messages": [{"role": "user", "content": prompt}],
                "response_format": {"type": "json_object"}
            }
            res = requests.post(url, json=payload, headers=headers, timeout=15)
            if res.status_code == 200:
                data = res.json()
                text_content = data["choices"][0]["message"]["content"]
                return json.loads(clean_json_text(text_content))
            else:
                logger.warning(f"OpenRouter extraction returned HTTP {res.status_code}: {res.text[:200]}")
        except Exception as ex:
            logger.warning(f"OpenRouter extraction failed: {ex}")
    else:
        # Default Google Gemini API
        try:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={key}"
            payload = {
                "contents": [{"parts": [{"text": prompt}]}],
                "generationConfig": {"temperature": 0.1, "responseMimeType": "application/json"}
            }
            res = requests.post(url, json=payload, timeout=15)
            if res.status_code == 200:
                data = res.json()
                text_content = data["candidates"][0]["content"]["parts"][0]["text"]
                return json.loads(clean_json_text(text_content))
            else:
                logger.warning(f"Gemini extraction returned HTTP {res.status_code}: {res.text[:200]}")
        except Exception as ex:
            logger.warning(f"Gemini extraction failed: {ex}")

    return None


def extract_with_rules(clinical_text: str) -> Dict[str, Any]:
    """
    Robust rule-based and regular expression clinical NLP engine.
    Extracts demographics, medications, reaction terms, onset delays, dechallenge, and seriousness.
    """
    text_lower = clinical_text.lower()
    provenance = {}

    # 1. Patient Age & Gender Extraction
    patient_age = None
    patient_age_unit = "Years"
    patient_gender = None
    patient_weight_kg = None

    # Age matchers: e.g. "35-year-old", "35 yo", "aged 35", "35 year old", "35 M", "35-yo female"
    age_match = re.search(r'\b(\d{1,3})\s*(?:-| )(?:year[s]?-old|yo|yr[s]?|years of age)\b', text_lower)
    if not age_match:
        age_match = re.search(r'\baged\s+(\d{1,3})\b', text_lower)
    if not age_match:
        age_match = re.search(r'\b(\d{1,3})\s*(?:m|f|male|female)\b', text_lower)
        
    if age_match:
        patient_age = int(age_match.group(1))
        provenance["patient_age"] = {"snippet": age_match.group(0), "confidence": 0.95}

    # Months age check (e.g. 6-month-old infant)
    infant_match = re.search(r'\b(\d{1,2})\s*(?:-| )month[s]?-old\b', text_lower)
    if infant_match:
        patient_age = int(infant_match.group(1))
        patient_age_unit = "Months"
        provenance["patient_age"] = {"snippet": infant_match.group(0), "confidence": 0.95}

    # Gender matchers
    if re.search(r'\b(female|woman|girl|she|her)\b', text_lower):
        patient_gender = "Female"
        provenance["patient_gender"] = {"snippet": "female/woman context", "confidence": 0.95}
    elif re.search(r'\b(male|man|boy|he|his)\b', text_lower):
        patient_gender = "Male"
        provenance["patient_gender"] = {"snippet": "male/man context", "confidence": 0.95}

    # Weight matchers: e.g. "weighing 70 kg", "weight 65kg", "72 kg"
    weight_match = re.search(r'\b(?:weight|weighing|wt)[:\s]*(\d{2,3}(?:\.\d)?)\s*(?:kg|kilos|kilograms)\b', text_lower)
    if weight_match:
        patient_weight_kg = float(weight_match.group(1))
        provenance["patient_weight_kg"] = {"snippet": weight_match.group(0), "confidence": 0.90}

    # 2. Medical History & Allergies
    med_history_items = []
    history_patterns = [
        r'(?:history of|past medical history|known case of|hx of|comorbidities include)\s+([^.\n]+)',
        r'(?:hypertension|diabetes|asthma|copd|atrial fibrillation|gout|chronic kidney disease|cad)'
    ]
    for pattern in history_patterns:
        matches = re.finditer(pattern, text_lower)
        for m in matches:
            med_history_items.append(m.group(0).strip())
            
    medical_history = ", ".join(list(set(med_history_items))) if med_history_items else None
    if medical_history:
        provenance["medical_history"] = {"snippet": medical_history, "confidence": 0.85}

    # 3. Medications (Suspected vs Concomitant)
    suspected_medicines = []
    concomitant_medicines = []
    found_drugs = []

    # Find known drugs in text
    for drug_name, drug_info in KNOWN_DRUGS.items():
        if re.search(rf'\b{re.escape(drug_name)}\b', text_lower):
            found_drugs.append((drug_name, drug_info))

    # Generic drug mention matcher if no known drug found
    generic_drug_match = re.search(r'\b(?:taking|prescribed|started on|received|administered|after taking)\s+([A-Za-z]+(?:\s+[A-Za-z]+)?)\b', text_lower)
    if not found_drugs and generic_drug_match:
        candidate = generic_drug_match.group(1).strip()
        if candidate.lower() not in ["a", "the", "medicine", "medication", "drug", "emergency", "treatment", "oral"]:
            found_drugs.append((candidate.title(), {"route": "Oral", "default_unit": "mg", "class": "Medication"}))

    # Dosing and route extraction for found drugs
    for drug_key, info in found_drugs:
        drug_display_name = drug_key.title()
        
        # Look for dosage near drug name: e.g. "Amoxicillin 500mg", "500 mg Amoxicillin", "10 mg daily"
        dose_val = None
        unit_val = info.get("default_unit", "mg")
        route_val = info.get("route", "Oral")
        frequency_val = "Once daily"
        
        dose_regex = rf'(?:{re.escape(drug_key)}[,\s]*(\d+(?:\.\d+)?)\s*(mg|g|mcg|ml|iu|units)|(\d+(?:\.\d+)?)\s*(mg|g|mcg|ml|iu|units)[,\s]*{re.escape(drug_key)})'
        dose_match = re.search(dose_regex, text_lower)
        if dose_match:
            d_val = dose_match.group(1) or dose_match.group(3)
            d_unit = dose_match.group(2) or dose_match.group(4)
            dose_val = d_val
            unit_val = d_unit

        # Route matching
        if re.search(rf'\b(?:po|oral|orally)\b', text_lower):
            route_val = "Oral"
        elif re.search(rf'\b(?:iv|intravenous|intravenously)\b', text_lower):
            route_val = "Intravenous"
        elif re.search(rf'\b(?:im|intramuscular)\b', text_lower):
            route_val = "Intramuscular"
        elif re.search(rf'\b(?:sc|subcutaneous)\b', text_lower):
            route_val = "Subcutaneous"
        elif re.search(rf'\b(?:topical|applied to skin)\b', text_lower):
            route_val = "Topical"

        # Frequency matching
        if re.search(r'\b(?:bid|twice daily|2 times daily)\b', text_lower):
            frequency_val = "Twice daily"
        elif re.search(r'\b(?:tid|three times daily)\b', text_lower):
            frequency_val = "Three times daily"
        elif re.search(r'\b(?:qid|four times daily)\b', text_lower):
            frequency_val = "Four times daily"
        elif re.search(r'\b(?:prn|as needed)\b', text_lower):
            frequency_val = "As needed"
        elif re.search(r'\b(?:qd|daily|once daily)\b', text_lower):
            frequency_val = "Once daily"

        # Distinguish emergency rescue medicines vs suspected culprit
        is_rescue = drug_key.lower() in ["epinephrine", "hydrocortisone", "diphenhydramine", "naloxone", "antidote"]
        is_concomitant = bool(re.search(rf'(?:concomitant|also taking|chronic|baseline|on chronic)\s+.*?\b{re.escape(drug_key)}\b', text_lower))
        
        med_entry = {
            "drug_name": drug_display_name,
            "dose": f"{dose_val} {unit_val}" if dose_val else None,
            "unit": unit_val,
            "route": route_val,
            "frequency": frequency_val,
            "start_date": None,
            "stop_date": None,
            "indication": None,
            "batch_no": None,
            "is_suspected": not is_rescue and not is_concomitant
        }

        if is_concomitant or is_rescue:
            concomitant_medicines.append({
                "drug_name": drug_display_name,
                "dose": f"{dose_val} {unit_val}" if dose_val else None,
                "route": route_val,
                "start_date": None,
                "stop_date": None,
                "indication": "Rescue Treatment" if is_rescue else "Comorbid Condition"
            })
        else:
            suspected_medicines.append(med_entry)

    # If generic medicine was mentioned but no specific drug name found
    if not suspected_medicines and not concomitant_medicines:
        if "medicine" in text_lower or "drug" in text_lower:
            suspected_medicines.append({
                "drug_name": "Suspected Medication (Unspecified)",
                "dose": None,
                "unit": "mg",
                "route": "Oral",
                "frequency": "Once daily",
                "start_date": None,
                "stop_date": None,
                "indication": None,
                "batch_no": None,
                "is_suspected": True
            })

    # 4. Reactions & Symptoms Detection (MedDRA mapping)
    extracted_reactions = []
    for reaction_key, meddra_info in MEDDRA_REACTIONS.items():
        if re.search(rf'\b{re.escape(reaction_key)}\b', text_lower):
            extracted_reactions.append({
                "term": meddra_info["term"],
                "meddra_pt": meddra_info["pt"],
                "time_to_onset": None,
                "outcome": "Recovering",
                "description": f"Extracted clinical symptom matching MedDRA PT '{meddra_info['pt']}'"
            })

    # Generic reaction extraction if no dictionary match
    if not extracted_reactions:
        symptom_match = re.search(r'\b(?:developed|presented with|suffered from|complained of|experienced)\s+([^.]+)', text_lower)
        if symptom_match:
            raw_symptom = symptom_match.group(1).strip()
            extracted_reactions.append({
                "term": raw_symptom.capitalize(),
                "meddra_pt": "Adverse event",
                "time_to_onset": None,
                "outcome": "Recovering",
                "description": raw_symptom
            })

    # 5. Timing / Onset Latency Detection
    time_to_onset = None
    onset_match = re.search(r'\b(\d+\s*(?:minutes?|hours?|days?|weeks?|months?)\s+(?:after|following|post|of starting|of taking))\b', text_lower)
    if not onset_match:
        onset_match = re.search(r'\b(?:on day|within)\s+(\d+\s*(?:minutes?|hours?|days?|weeks?))\b', text_lower)
    if not onset_match:
        onset_match = re.search(r'\b(?:after|latency:?)\s+(\d+\s*(?:minutes?|hours?|days?|weeks?))\b', text_lower)
        
    if onset_match:
        time_to_onset = onset_match.group(0)
        provenance["time_to_onset"] = {"snippet": time_to_onset, "confidence": 0.90}
        for r in extracted_reactions:
            r["time_to_onset"] = time_to_onset

    # 6. Seriousness Criteria Evaluation
    seriousness = {
        "death": bool(re.search(r'\b(death|died|fatal|succumbed)\b', text_lower)),
        "life_threatening": bool(re.search(r'\b(life-threatening|anaphylaxis|emergency treatment|intubated|resuscitation|icu|intensive care|epinephrine)\b', text_lower)),
        "hospitalization": bool(re.search(r'\b(hospitalized|hospitalised|admitted|admission|emergency department|ed visit)\b', text_lower)),
        "disability": bool(re.search(r'\b(disability|permanent damage|incapacitated)\b', text_lower)),
        "congenital_anomaly": bool(re.search(r'\b(congenital|birth defect|teratogenic)\b', text_lower)),
        "other_medically_important": bool(re.search(r'\b(dress syndrome|sjs|rhabdomyolysis|severe|acute liver failure|emergency)\b', text_lower))
    }
    is_serious = any(seriousness.values())

    # 7. Dechallenge Action & Outcome
    dechallenge_action = "Medicine discontinued"
    dechallenge_outcome = "Reaction abated"

    if re.search(r'\b(stopped|discontinued|withheld|ceased|terminated|medicine was stopped|drug was stopped)\b', text_lower):
        dechallenge_action = "Medicine discontinued"
    elif re.search(r'\b(dose reduced|reduced the dose|tapered)\b', text_lower):
        dechallenge_action = "Dose reduced"
    elif re.search(r'\b(dose continued|maintained|not changed)\b', text_lower):
        dechallenge_action = "Dose not changed"

    if re.search(r'\b(resolved|abated|improved|recovered|disappeared|subsided|cleared)\b', text_lower):
        dechallenge_outcome = "Reaction abated"
    elif re.search(r'\b(did not improve|persisted|worsened|did not abate)\b', text_lower):
        dechallenge_outcome = "Reaction did not abate"

    # 8. Rechallenge Action & Outcome
    rechallenge_action = "Not reintroduced"
    rechallenge_outcome = "Not applicable"

    if re.search(r'\b(rechallenged|restarted|readministered|resumed)\b', text_lower):
        rechallenge_action = "Medicine reintroduced"
        if re.search(r'\b(recurred|reappeared|relapsed|worsened again)\b', text_lower):
            rechallenge_outcome = "Reaction recurred"
        elif re.search(r'\b(did not recur|tolerated without issue)\b', text_lower):
            rechallenge_outcome = "Reaction did not recur"

    # 9. Lab Findings
    lab_findings = None
    lab_match = re.search(r'\b(?:inr|alt|ast|creatinine|wbc|eosinophils|potassium|sodium|platelets|lab results?|findings?)[:\s]+([^.\n]+)', text_lower)
    if lab_match:
        lab_findings = lab_match.group(0).strip()

    # Pre-calculate estimated Naranjo answers based on clinical text
    naranjo_estimate_answers = {
        "q1": 1, # Known literature reports for reaction
        "q2": 2 if time_to_onset or "after" in text_lower else 1, # Temporal sequence
        "q3": 1 if dechallenge_outcome == "Reaction abated" else 0, # Dechallenge improvement
        "q4": 2 if rechallenge_outcome == "Reaction recurred" else 0, # Rechallenge
        "q5": 0, # Alternative causes
        "q6": 0, # Placebo
        "q7": 0, # Toxic levels
        "q8": 0, # Dose response
        "q9": 0, # Previous exposure
        "q10": 1 if lab_findings else 0 # Objective evidence
    }
    nar_score, nar_cat, nar_interp = calculate_naranjo_score(naranjo_estimate_answers)

    # Generate dynamic clinical summary as a fallback
    drug_names = ", ".join([m["drug_name"] for m in suspected_medicines]) if suspected_medicines else "unspecified medication"
    reaction_terms = ", ".join([r["term"] for r in extracted_reactions]) if extracted_reactions else "adverse symptoms"
    severity_str = "serious" if is_serious else "non-serious"
    
    summary_parts = [
        f"A {patient_age or 'unspecified'}-year-old {patient_gender or 'patient'} developed {reaction_terms} after taking {drug_names}."
    ]
    if time_to_onset:
        summary_parts.append(f"Onset of symptoms occurred {time_to_onset}.")
    if dechallenge_action:
        summary_parts.append(f"Management involved {dechallenge_action.lower()}, which resulted in the reaction being {dechallenge_outcome.lower() if dechallenge_outcome else 'unspecified'} (dechallenge).")
    if lab_findings:
        summary_parts.append(f"Relevant laboratory findings: {lab_findings}.")
    summary_parts.append(f"This is classified as a {severity_str} adverse drug reaction with an estimated Naranjo score of {nar_score} ({nar_cat}).")
    
    ai_clinical_summary = " ".join(summary_parts)

    extraction_result = {
        "patient_age": patient_age,
        "patient_age_unit": patient_age_unit,
        "patient_gender": patient_gender,
        "patient_weight_kg": patient_weight_kg,
        "ai_clinical_summary": ai_clinical_summary,
        "medical_history": medical_history,
        "suspected_medicines": suspected_medicines,
        "concomitant_medicines": concomitant_medicines,
        "reactions": extracted_reactions,
        "reaction_onset_date": time_to_onset,
        "reaction_outcome": "Recovered" if dechallenge_outcome == "Reaction abated" else "Recovering",
        "is_serious": is_serious,
        "seriousness_criteria": seriousness,
        "seriousness_details": "Life-threatening allergic/adverse event requiring acute clinical intervention" if is_serious else None,
        "action_taken": dechallenge_action,
        "dechallenge_action": dechallenge_action,
        "dechallenge_outcome": dechallenge_outcome,
        "rechallenge_action": rechallenge_action,
        "rechallenge_outcome": rechallenge_outcome,
        "lab_findings": lab_findings,
        "confidence_score": 0.92,
        "field_provenance": provenance,
        "naranjo_estimate": {
            "score": nar_score,
            "category": nar_cat,
            "interpretation": nar_interp,
            "suggested_answers": naranjo_estimate_answers
        }
    }

    return extraction_result


def process_clinical_narrative(clinical_text: str, api_key: Optional[str] = None) -> Dict[str, Any]:
    """
    Main entry point for processing clinical narrative.
    Tries LLM first (if configured), falls back seamlessly to rule engine,
    and runs missing fields validator & completeness checks.
    """
    # 1. Try LLM or fallback to Rules
    extracted = extract_with_llm(clinical_text, api_key)
    if not extracted:
        extracted = extract_with_rules(clinical_text)

    # 2. Run Completeness and Missing Fields Validator
    missing_fields, completeness_score, ich_criteria_met = validate_adr_report_completeness(extracted)
    
    extracted["missing_fields"] = missing_fields
    extracted["completeness_score"] = completeness_score
    extracted["ich_criteria_met"] = ich_criteria_met

    return extracted
