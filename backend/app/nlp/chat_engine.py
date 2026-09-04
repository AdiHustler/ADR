import re
import json
import logging
import requests
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session

from app.config import settings
from app.models import ADRReport
from app.nlp.causality import NARANJO_QUESTIONS
from app.nlp.extractor import KNOWN_DRUGS, MEDDRA_REACTIONS

logger = logging.getLogger(__name__)

# Drug Safety Knowledge Base for clinical responses
DRUG_SAFETY_KNOWLEDGE = {
    "amoxicillin": {
        "class": "Beta-lactam Aminopenicillin Antibiotic",
        "common_adrs": ["Maculopapular cutaneous rash", "Urticaria / Hives", "Diarrhea", "Nausea"],
        "serious_adrs": ["Anaphylactic reaction / Angioedema (Immune system)", "Stevens-Johnson Syndrome (SJS)", "Drug Reaction with Eosinophilia and Systemic Symptoms (DRESS)"],
        "meddra_pts": ["Rash", "Urticaria", "Anaphylactic reaction", "Face oedema", "Pruritus"],
        "monitoring": "Observe for immediate signs of IgE-mediated hypersensitivity (dyspnea, wheezing, hypotension). Immediate dechallenge and epinephrine administration required if anaphylaxis occurs.",
        "interactions": "Increases methotrexate toxicity via competitive renal tubular secretion; may decrease efficacy of oral contraceptives."
    },
    "lisinopril": {
        "class": "Angiotensin Converting Enzyme (ACE) Inhibitor",
        "common_adrs": ["Dry hacking intractable cough (due to bradykinin accumulation)", "Dizziness / Postural hypotension", "Headache"],
        "serious_adrs": ["Head and neck angioedema (life-threatening airway compromise)", "Severe hyperkalemia", "Acute renal failure"],
        "meddra_pts": ["Cough", "Angioedema", "Hyperkalaemia", "Hypotension", "Renal impairment"],
        "monitoring": "Monitor serum potassium and serum creatinine at baseline and 1-2 weeks after initiation. Rechallenge is strictly contraindicated if angioedema occurs.",
        "interactions": "Concurrent potassium supplements or spironolactone markedly elevates risk of severe hyperkalemia; NSAIDs attenuate antihypertensive efficacy."
    },
    "warfarin": {
        "class": "Vitamin K Antagonist Anticoagulant",
        "common_adrs": ["Minor mucosal bleeding", "Epistaxis", "Ecchymosis / Bruising", "Microscopic hematuria"],
        "serious_adrs": ["Major intracranial hemorrhage", "Gross gastrointestinal hemorrhage", "Warfarin-induced skin necrosis", "Purple toe syndrome"],
        "meddra_pts": ["Haemorrhage", "Haematuria", "Epistaxis", "International normalised ratio increased"],
        "monitoring": "Frequent INR monitoring (therapeutic target usually 2.0–3.0). Rapid reversal with Vitamin K, 4-factor Prothrombin Complex Concentrate (PCC), or FFP if INR > 5 with bleeding.",
        "interactions": "Potentiated by CYP2C9/CYP3A4 inhibitors (Clarithromycin, Fluconazole, Metronidazole, Amiodarone) causing sudden toxic INR spikes; inhibited by enzyme inducers (Rifampin, Carbamazepine)."
    },
    "allopurinol": {
        "class": "Xanthine Oxidase Inhibitor (Urate Lowering)",
        "common_adrs": ["Maculopapular rash", "Gastrointestinal upset", "Diarrhea"],
        "serious_adrs": ["Allopurinol Hypersensitivity Syndrome (AHS) / DRESS", "Toxic Epidermal Necrolysis (TEN) / SJS", "Acute drug-induced hepatotoxicity"],
        "meddra_pts": ["Drug reaction with eosinophilia and systemic symptoms", "Stevens-Johnson syndrome", "Hepatic enzyme increased", "Pyrexia"],
        "monitoring": "Pre-treatment HLA-B*58:01 testing recommended in high-risk ethnic groups. Immediate discontinuation upon first emergence of skin rash or fever.",
        "interactions": "Markedly inhibits mercaptopurine and azathioprine metabolism; dose of azathioprine must be reduced by 66–75%."
    },
    "atorvastatin": {
        "class": "HMG-CoA Reductase Inhibitor (Statin)",
        "common_adrs": ["Myalgia without CK elevation", "Mild transaminitis", "Dyspepsia", "Headache"],
        "serious_adrs": ["Rhabdomyolysis with acute kidney injury", "Immune-mediated necrotizing myopathy (anti-HMGCR antibodies)"],
        "meddra_pts": ["Myalgia", "Rhabdomyolysis", "Blood creatine phosphokinase increased", "Alanine aminotransferase increased"],
        "monitoring": "Baseline ALT and CK; check CK immediately if unexplained muscle pain, tenderness, or brown urine develops.",
        "interactions": "CYP3A4 substrates/inhibitors (Clarithromycin, Itraconazole, Protease inhibitors) elevate statin levels and rhabdomyolysis risk."
    },
    "metformin": {
        "class": "Biguanide Antihyperglycemic",
        "common_adrs": ["Gastrointestinal intolerance", "Diarrhea", "Abdominal cramping", "Metallic taste", "Vitamin B12 deficiency"],
        "serious_adrs": ["Metformin-associated lactic acidosis (MALA)"],
        "meddra_pts": ["Diarrhoea", "Lactic acidosis", "Vitamin B12 deficiency", "Abdominal discomfort"],
        "monitoring": "Evaluate eGFR regularly; discontinue if eGFR < 30 mL/min/1.73m² or prior to iodinated radiocontrast procedures.",
        "interactions": "Cimetidine and cationic drugs may compete for renal tubular transport; alcohol increases lactic acidosis risk."
    },
    "clarithromycin": {
        "class": "Macrolide Antibiotic (Potent CYP3A4 Inhibitor)",
        "common_adrs": ["Dysgeusia / Metallic taste", "Nausea", "Diarrhea"],
        "serious_adrs": ["QT prolongation / Torsades de Pointes", "Severe drug-drug interactions resulting in toxicity of co-administered agents", "Hepatotoxicity"],
        "meddra_pts": ["Electrocardiogram QT prolonged", "Ventricular tachycardia", "Haemorrhage"],
        "monitoring": "Check baseline QTc interval; cross-check all concomitant medications for CYP3A4 metabolism.",
        "interactions": "Strong inhibitor of CYP3A4 and P-glycoprotein: sharply elevates levels of Warfarin (bleeding risk), Statins (rhabdomyolysis), and Digoxin."
    }
}

def gather_database_context(db: Session, query_text: str) -> Dict[str, Any]:
    """Extracts relevant live statistics and records from the database to ground the AI response."""
    try:
        total_reports = db.query(ADRReport).count()
        serious_reports = db.query(ADRReport).filter(ADRReport.is_serious == True).count()
        pending_review = db.query(ADRReport).filter(ADRReport.status.in_(["DRAFT", "AI_EXTRACTED", "PENDING_REVIEW"])).count()
        verified_approved = db.query(ADRReport).filter(ADRReport.status.in_(["VERIFIED_APPROVED", "SUBMITTED"])).count()

        # Check for specific drug queries
        matching_reports = []
        q_lower = query_text.lower()
        for drug_name in ["amoxicillin", "lisinopril", "warfarin", "allopurinol", "atorvastatin", "metformin", "clarithromycin"]:
            if drug_name in q_lower:
                reps = db.query(ADRReport).filter(
                    ADRReport.clinical_narrative.ilike(f"%{drug_name}%") |
                    ADRReport.medical_history.ilike(f"%{drug_name}%")
                ).limit(3).all()
                for r in reps:
                    matching_reports.append({
                        "report_number": r.report_number,
                        "patient_identifier": r.patient_identifier,
                        "is_serious": r.is_serious,
                        "status": r.status,
                        "causality": r.causality_category,
                        "completeness": r.completeness_score
                    })

        return {
            "total_reports": total_reports,
            "serious_reports": serious_reports,
            "pending_review": pending_review,
            "verified_approved": verified_approved,
            "matching_case_count": len(matching_reports),
            "sample_cases": matching_reports[:3]
        }
    except Exception as e:
        logger.warning(f"Could not gather DB context: {e}")
        return {"total_reports": 0, "serious_reports": 0, "pending_review": 0, "verified_approved": 0}


def execute_llm_chat(messages: List[Dict[str, str]], clinical_context_str: str, api_key: Optional[str] = None) -> Optional[Dict[str, Any]]:
    """Calls Gemini or OpenRouter with comprehensive clinical pharmacovigilance prompting."""
    key = api_key or settings.GEMINI_API_KEY or settings.OPENROUTER_API_KEY
    if not key:
        return None

    system_prompt = f"""You are ADR-Sentinel Copilot, an authoritative Clinical Pharmacovigilance & Drug Safety Medical Specialist.
Your mission is to assist physicians, clinical pharmacists, nurses, and PV officers in:
1. Evaluating Adverse Drug Reactions (ADRs) and potential causality using the Naranjo Algorithm and WHO-UMC criteria.
2. Checking drug-drug interactions, CYP450 metabolism risks, and MedDRA terminology (PT and SOC).
3. Auditing ICH E2B(R3) 4 Minimum Criteria (Identifiable Patient, Reporter, Suspected Drug, Adverse Reaction).
4. Explaining dechallenge and rechallenge pharmacology.
5. Providing accurate, structured clinical summaries with action-oriented guidance.

Grounding Pharmacovigilance Context:
{clinical_context_str}

Guidelines:
- Format your response using clean GitHub Markdown with clear headers, bullet points, and highlighted clinical warnings.
- Always be accurate, objective, and clinically grounded.
- If referencing database numbers or cases, use the context provided.
- Always include a brief clinical disclaimer that AI assists but does not replace licensed medical judgement.
"""

    # OpenRouter API
    if key.startswith("sk-or-"):
        try:
            url = "https://openrouter.ai/api/v1/chat/completions"
            headers = {
                "Authorization": f"Bearer {key}",
                "Content-Type": "application/json",
                "HTTP-Referer": "http://localhost:5173",
                "X-Title": "ADR-Sentinel AI"
            }
            llm_messages = [{"role": "system", "content": system_prompt}] + messages
            payload = {
                "model": "openrouter/free",
                "messages": llm_messages,
                "temperature": 0.2,
                "max_tokens": 1200
            }
            res = requests.post(url, json=payload, headers=headers, timeout=15)
            if res.status_code == 200:
                data = res.json()
                reply_text = data["choices"][0]["message"]["content"]
                return {"reply": reply_text, "source": "openrouter"}
            else:
                logger.warning(f"OpenRouter returned {res.status_code}: {res.text[:200]}")
        except Exception as ex:
            logger.warning(f"OpenRouter chat call failed: {ex}")

    # Google Gemini API
    else:
        try:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={key}"
            contents = []
            for m in messages:
                role = "user" if m.get("role") == "user" else "model"
                contents.append({"role": role, "parts": [{"text": m.get("content", "")}]})
            
            payload = {
                "systemInstruction": {"parts": [{"text": system_prompt}]},
                "contents": contents,
                "generationConfig": {"temperature": 0.2, "maxOutputTokens": 1200}
            }
            res = requests.post(url, json=payload, timeout=15)
            if res.status_code == 200:
                data = res.json()
                reply_text = data["candidates"][0]["content"]["parts"][0]["text"]
                return {"reply": reply_text, "source": "gemini"}
            else:
                logger.warning(f"Gemini API returned {res.status_code}: {res.text[:200]}")
        except Exception as ex:
            logger.warning(f"Gemini chat call failed: {ex}")

    return None


def generate_clinical_engine_response(query_text: str, context: Optional[Dict[str, Any]] = None, db_context: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    """
    Intelligent local Clinical Pharmacovigilance Rule & Knowledge Engine.
    Provides deep, accurate, structured clinical responses when external LLMs are unavailable or offline.
    """
    q = query_text.lower().strip()
    db_info = db_context or {}

    # 1. Database Queries & Case Statistics
    if any(k in q for k in ["how many", "database", "stats", "cases in registry", "total reports", "serious events", "overview of cases", "registry summary"]):
        total = db_info.get("total_reports", 0)
        serious = db_info.get("serious_reports", 0)
        pending = db_info.get("pending_review", 0)
        approved = db_info.get("verified_approved", 0)
        serious_pct = round((serious / total * 100), 1) if total > 0 else 0

        reply = f"""### 📊 Pharmacovigilance Case Registry Intelligence

Here is the current live surveillance summary from the ADR Case Registry:

- **Total Registered Cases:** `{total}`
- **Serious Adverse Reactions:** `{serious}` ({serious_pct}% of total cases)
- **Awaiting Clinical Review / Verification:** `{pending}`
- **Verified & Approved for Regulatory Submission:** `{approved}`

#### Key Safety Insights:
1. **Expedited Reporting Required:** {serious} cases meet ICH regulatory seriousness criteria (e.g., life-threatening, hospitalization) requiring expedited 15-day submission.
2. **Clinical Verification Queue:** {pending} draft cases are currently in the human-in-the-loop review workflow awaiting attending physician or PV officer sign-off.
3. **ICH E2B(R3) Compliance:** All records are continuously audited for the 4 mandatory reporting criteria.

*Would you like me to filter cases by a specific culprit medication or seriousness criterion?*
"""
        return {
            "reply": reply,
            "suggested_actions": ["Show serious cases", "What are the top culprit medications?", "Check Amoxicillin cases"],
            "source": "clinical_engine"
        }

    # 2. Specific Drug Inquiries
    for drug_key, info in DRUG_SAFETY_KNOWLEDGE.items():
        if drug_key in q:
            reply = f"""### 💊 Drug Safety Profile: {drug_key.title()}

**Pharmacologic Class:** {info['class']}

#### ⚠️ Known Adverse Drug Reactions
- **Common / Mild-to-Moderate:** {', '.join(info['common_adrs'])}
- **Serious / Regulatory Significant:** {', '.join(info['serious_adrs'])}

#### 🏷️ MedDRA Preferred Terms (PT)
{', '.join([f'`{pt}`' for pt in info['meddra_pts']])}

#### 📋 Clinical Management & Action
- **Dechallenge Strategy:** {info['monitoring']}
- **Drug-Drug Interactions:** {info['interactions']}

> **PV Clinical Guidance:** When documenting an ADR for **{drug_key.title()}**, ensure precise time-to-onset (minutes vs days) and specify dechallenge response to validate Naranjo causality score.
"""
            return {
                "reply": reply,
                "suggested_actions": [f"Calculate Naranjo score for {drug_key.title()}", "Check drug interactions", "Explain ICH E2B criteria"],
                "source": "clinical_engine"
            }

    # 3. Drug Interactions
    if any(k in q for k in ["interaction", "interactions", "combine", "together", "taking with"]):
        if ("warfarin" in q and "clarithromycin" in q) or "macrolide" in q:
            reply = """### ⚠️ Major Drug-Drug Interaction: Warfarin + Clarithromycin

**Severity Level:** **HIGH / CRITICAL RISK**

#### 🔬 Mechanism of Interaction:
- **Clarithromycin** is a potent mechanism-based inhibitor of **CYP3A4** and moderately inhibits **CYP2C9**.
- It also alters gut microflora, reducing bacterial synthesis of Vitamin K.
- Co-administration causes acute accumulation of **(S)-Warfarin**, precipitating a dramatic increase in **INR (often > 7.0)** within 3 to 5 days.

#### 🚨 Clinical Manifestations:
- Gross hematuria, severe epistaxis, spontaneous hematomas, and potential life-threatening gastrointestinal or intracranial hemorrhage.

#### 🛡️ Management Recommendations:
1. **Avoid Combination:** Substitute Clarithromycin with an antibiotic that does not inhibit CYP enzymes (e.g., Cefuroxime or Azithromycin with caution).
2. **If Unavoidable:** Empirically reduce Warfarin dose by 30%–50% and perform serial INR checks every 48 hours.
3. **Rescue Therapy:** Oral/IV Vitamin K1 and 4-factor PCC (Kcentra) for emergency INR reversal.
"""
            return {
                "reply": reply,
                "suggested_actions": ["Review Warfarin safety profile", "Naranjo causality evaluation", "Check other interactions"],
                "source": "clinical_engine"
            }
        else:
            reply = """### 💊 Clinical Drug-Drug Interaction Checker

Common critical pharmacovigilance interaction mechanisms to monitor:

1. **CYP450 Enzyme Inhibition (e.g. Warfarin + Clarithromycin/Fluconazole):**
   - Rapidly elevates substrate concentrations, leading to toxicities like severe hemorrhages or statin-induced rhabdomyolysis.
2. **Pharmacodynamic Synergism (e.g. Lisinopril + Spironolactone / Potassium):**
   - Combined potassium-sparing mechanisms elevate risk of fatal cardiac arrhythmias secondary to severe hyperkalemia.
3. **Renal Clearance Competition (e.g. Methotrexate + NSAIDs / Penicillins):**
   - Reduced renal tubular clearance increases bone marrow suppression risk.

*To check a specific pair, ask: "What is the interaction between Warfarin and Clarithromycin?" or "Can Lisinopril be taken with Spironolactone?"*
"""
            return {
                "reply": reply,
                "suggested_actions": ["Warfarin + Clarithromycin interaction", "Lisinopril + Spironolactone risks", "Allopurinol + Azathioprine"],
                "source": "clinical_engine"
            }

    # 4. Naranjo Causality Assessment Algorithm
    if any(k in q for k in ["naranjo", "causality", "probability", "algorithm", "score", "definite", "probable"]):
        reply = r"""### 📐 Naranjo ADR Probability Algorithm Guide

The **Naranjo Algorithm** is a standardized 10-question instrument used globally to determine the likelihood that an adverse clinical event is causally related to a specific drug.

#### 📊 Scoring & Causality Categories:
| Total Score | Causality Classification | Clinical Meaning |
| :---: | :---: | :--- |
| **$\ge 9$** | **Definite** | Reaction confirmed by positive rechallenge, clear dechallenge, and no alternative explanation. |
| **$5 - 8$** | **Probable** | Reasonable temporal sequence, positive dechallenge, and consistent with known pharmacology. |
| **$1 - 4$** | **Possible** | Temporally plausible, but underlying disease or concomitant drugs could also explain it. |
| **$\le 0$** | **Doubtful** | Unlikely to be drug-related; alternative causes predominate. |

#### 🔑 Key Factors for High Score:
1. **Temporal Association:** Did symptoms begin after starting the medicine? (+2)
2. **Dechallenge:** Did symptoms abate upon discontinuing the drug? (+1)
3. **Alternative Causes:** Are other medical conditions ruled out? (+2)
4. **Previous Reaction:** Has the patient reacted to this drug before? (+1)

*You can use the built-in Naranjo Calculator directly in any ADR case file on this platform!*
"""
        return {
            "reply": reply,
            "suggested_actions": ["Calculate Naranjo score for Amoxicillin", "Explain ICH E2B minimum criteria", "What is DRESS syndrome?"],
            "source": "clinical_engine"
        }

    # 5. ICH E2B(R3) & CIOMS Compliance Standards
    if any(k in q for k in ["ich", "e2b", "cioms", "criteria", "regulatory", "mandatory", "standards"]):
        reply = """### 📋 Regulatory Standards: ICH E2B(R3) & CIOMS Form I

For an Adverse Drug Reaction report to be legally valid and accepted by health authorities (FDA, EMA, CDSCO, WHO-UMC), it must fulfill the **ICH 4 Minimum Criteria**:

1. **👤 Identifiable Patient:** Patient age, gender, initials, or patient identifier (e.g. `PT-35F`).
2. **👨‍⚕️ Identifiable Reporter:** Healthcare professional name, clinical role, institution, or contact email.
3. **💊 Suspected Medicinal Product:** At least one suspect drug name (brand or international nonproprietary name).
4. **⚠️ Adverse Event / Reaction:** At least one clinical symptom, diagnosis, or MedDRA reaction term.

#### ⏱️ Regulatory Reporting Timelines:
- **Serious & Unexpected ADRs:** Must be transmitted within **15 calendar days** of initial notification.
- **Non-Serious ADRs:** Periodic safety update reports (PSUR) or standard batch submission.

*ADR-Sentinel AI automatically calculates a real-time Completeness Index (0–100%) to verify these criteria before submission.*
"""
        return {
            "reply": reply,
            "suggested_actions": ["Check database compliance", "Generate CIOMS Form I", "Explain Naranjo algorithm"],
            "source": "clinical_engine"
        }

    # 6. Default / General Clinical Assistant Greeting
    reply = f"""### 👋 Hello! I am ADR-Sentinel AI Copilot

I am your clinical pharmacovigilance assistant, trained on ICH E2B(R3) guidelines, MedDRA adverse event terminology, and the Naranjo causality scoring algorithm.

#### 💡 Here are some things you can ask me:
- **Registry Insights:** *"How many serious cases do we have in the database?"*
- **Drug Safety Profiles:** *"What are the serious adverse reactions of Amoxicillin or Lisinopril?"*
- **Drug Interactions:** *"Explain the interaction between Warfarin and Clarithromycin."*
- **Causality Assessment:** *"How does the Naranjo algorithm work?"*
- **Regulatory Compliance:** *"What are the ICH 4 Minimum Reporting Criteria?"*

You can type your query or click the **Microphone icon** to speak your question directly!
"""
    return {
        "reply": reply,
        "suggested_actions": [
            "How many reports are in the registry?",
            "What are the risks of Amoxicillin?",
            "Warfarin + Clarithromycin interaction",
            "How does Naranjo scoring work?"
        ],
        "source": "clinical_engine"
    }


def process_chat_message(
    messages: List[Dict[str, str]],
    context: Optional[Dict[str, Any]] = None,
    db: Optional[Session] = None,
    api_key: Optional[str] = None
) -> Dict[str, Any]:
    """
    Orchestrates the AI chat flow:
    1. Extracts query and context
    2. Gathers live DB context
    3. Tries LLM (Gemini / OpenRouter)
    4. Falls back to robust clinical engine
    5. Formats response with suggested actions and context metadata
    """
    if not messages:
        return {
            "reply": "No messages received. Please ask a clinical or pharmacovigilance question.",
            "suggested_actions": ["How many reports are in the registry?", "Check Amoxicillin safety"],
            "source": "clinical_engine",
            "context_used": {}
        }

    latest_user_message = next((m.get("content", "") for m in reversed(messages) if m.get("role") == "user"), "")
    
    # Gather live DB grounding data
    db_context = {}
    if db:
        db_context = gather_database_context(db, latest_user_message)

    # Build context string for prompt
    context_str_parts = []
    if db_context:
        context_str_parts.append(f"Live ADR Database Stats: Total Reports={db_context.get('total_reports')}, Serious={db_context.get('serious_reports')}, Pending={db_context.get('pending_review')}")
        if db_context.get("sample_cases"):
            context_str_parts.append(f"Matching Cases in DB: {json.dumps(db_context.get('sample_cases'))}")
    if context:
        context_str_parts.append(f"Active User Screen Context: {json.dumps(context)}")
    
    clinical_context_str = "\n".join(context_str_parts)

    # Attempt External LLM if key is configured
    llm_result = execute_llm_chat(messages, clinical_context_str, api_key)
    if llm_result and llm_result.get("reply"):
        return {
            "reply": llm_result["reply"],
            "suggested_actions": [
                "Explain Naranjo causality criteria",
                "Check ICH E2B compliance",
                "Query ADR database"
            ],
            "source": llm_result["source"],
            "context_used": db_context
        }

    # High-quality offline Clinical Pharmacovigilance Engine fallback
    engine_result = generate_clinical_engine_response(latest_user_message, context, db_context)
    engine_result["context_used"] = db_context
    return engine_result
