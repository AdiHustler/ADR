import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.database import Base, engine
from app.seed import seed_database
from app.nlp.extractor import process_clinical_narrative
from app.nlp.causality import calculate_naranjo_score

@pytest.fixture(scope="session", autouse=True)
def setup_test_db():
    Base.metadata.create_all(bind=engine)
    seed_database()
    yield

@pytest.fixture
def client():
    with TestClient(app) as c:
        yield c

def test_nlp_extraction_capstone_case_1():
    narrative = (
        "A 35-year-old female patient developed facial swelling, severe itching, and difficulty breathing "
        "45 minutes after taking oral Amoxicillin 500mg. The medicine was stopped immediately and the patient "
        "received emergency treatment with intramuscular epinephrine."
    )
    result = process_clinical_narrative(narrative)
    
    assert result["patient_age"] == 35
    assert result["patient_gender"] == "Female"
    assert len(result["suspected_medicines"]) >= 1
    assert result["suspected_medicines"][0]["drug_name"].title() == "Amoxicillin"
    assert "500" in str(result["suspected_medicines"][0]["dose"])
    
    # Reactions
    reaction_terms = [r["term"] for r in result["reactions"]]
    assert any("swelling" in t.lower() or "angioedema" in t.lower() for t in reaction_terms)
    assert any("itching" in t.lower() or "pruritus" in t.lower() for t in reaction_terms)
    assert any("breathing" in t.lower() or "dyspnea" in t.lower() for t in reaction_terms)
    
    # Timing & Dechallenge & Seriousness
    assert result["dechallenge_action"] == "Medicine discontinued"
    assert result["is_serious"] is True
    assert result["seriousness_criteria"]["life_threatening"] is True
    assert result["completeness_score"] > 50.0

def test_nlp_extraction_capstone_case_2():
    narrative = "The patient developed severe itching and a red rash two days after starting amoxicillin."
    result = process_clinical_narrative(narrative)
    
    assert len(result["suspected_medicines"]) >= 1
    assert result["suspected_medicines"][0]["drug_name"].title() == "Amoxicillin"
    reaction_terms = [r["term"] for r in result["reactions"]]
    assert any("rash" in t.lower() for t in reaction_terms)
    assert any("itching" in t.lower() for t in reaction_terms)

def test_naranjo_scoring():
    answers = {"q1": 1, "q2": 2, "q3": 1, "q4": 2, "q5": 2, "q6": 0, "q7": 0, "q8": 0, "q9": 0, "q10": 1}
    score, category, interp = calculate_naranjo_score(answers)
    assert score == 9
    assert category == "Definite"

    answers_prob = {"q1": 1, "q2": 2, "q3": 1, "q4": 0, "q5": 2, "q6": 0, "q7": 0, "q8": 0, "q9": 0, "q10": 1}
    score_p, cat_p, _ = calculate_naranjo_score(answers_prob)
    assert score_p == 7
    assert cat_p == "Probable"

def test_api_health(client):
    res = client.get("/api/health")
    assert res.status_code == 200
    assert res.json()["status"] == "healthy"

def test_api_get_reports(client):
    res = client.get("/api/reports")
    assert res.status_code == 200
    reports = res.json()
    assert isinstance(reports, list)
    assert len(reports) >= 3

def test_api_analytics_dashboard(client):
    res = client.get("/api/analytics/dashboard")
    assert res.status_code == 200
    data = res.json()
    assert "total_reports" in data
    assert "top_suspected_drugs" in data
    assert "top_reactions" in data

def test_api_ai_extract_endpoint(client):
    res = client.post("/api/ai/extract", json={
        "clinical_narrative": "62-year-old male with hypertension developed dry cough 3 weeks after starting Lisinopril 10mg."
    })
    assert res.status_code == 200
    data = res.json()
    assert data["patient_age"] == 62
    assert data["patient_gender"] == "Male"
    assert data["suspected_medicines"][0]["drug_name"] == "Lisinopril"

def test_api_pdf_export(client):
    res = client.get("/api/reports/1/export/pdf")
    assert res.status_code == 200
    assert res.headers["content-type"] == "application/pdf"

def test_api_e2b_export(client):
    res = client.get("/api/reports/1/export/e2b")
    assert res.status_code == 200
    data = res.json()
    assert "ichicsr" in data
    assert data["ichicsr"]["safetyreportid"] == "ADR-2026-0001"
