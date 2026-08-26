from typing import Dict, Any, Tuple

# Standard Naranjo Algorithm Questions and Scores
NARANJO_QUESTIONS = [
    {
        "id": "q1",
        "question": "Are there previous conclusive reports on this reaction?",
        "options": {"yes": 1, "no": 0, "unknown": 0}
    },
    {
        "id": "q2",
        "question": "Did the adverse event appear after the suspected drug was administered?",
        "options": {"yes": 2, "no": -1, "unknown": 0}
    },
    {
        "id": "q3",
        "question": "Did the adverse reaction improve when the drug was discontinued or a specific antagonist was administered?",
        "options": {"yes": 1, "no": 0, "unknown": 0}
    },
    {
        "id": "q4",
        "question": "Did the adverse reaction reappear when the drug was readministered (rechallenge)?",
        "options": {"yes": 2, "no": -1, "unknown": 0}
    },
    {
        "id": "q5",
        "question": "Are there alternative causes (other than the drug) that could on their own have caused the reaction?",
        "options": {"yes": -1, "no": 2, "unknown": 0}
    },
    {
        "id": "q6",
        "question": "Did the reaction reappear when a placebo was given?",
        "options": {"yes": -1, "no": 1, "unknown": 0}
    },
    {
        "id": "q7",
        "question": "Was the drug detected in blood (or other fluids) in concentrations known to be toxic?",
        "options": {"yes": 1, "no": 0, "unknown": 0}
    },
    {
        "id": "q8",
        "question": "Was the reaction more severe when the dose was increased, or less severe when the dose was decreased?",
        "options": {"yes": 1, "no": 0, "unknown": 0}
    },
    {
        "id": "q9",
        "question": "Did the patient have a similar reaction to the same or similar drugs in any previous exposure?",
        "options": {"yes": 1, "no": 0, "unknown": 0}
    },
    {
        "id": "q10",
        "question": "Was the adverse event confirmed by any objective evidence (e.g. lab tests, clinical photos, biopsy)?",
        "options": {"yes": 1, "no": 0, "unknown": 0}
    }
]

def calculate_naranjo_score(answers: Dict[str, Any]) -> Tuple[int, str, str]:
    """
    Computes total Naranjo ADR Probability score and assigns category.
    Returns: (total_score, category, interpretation)
    Categories:
      - Definite: >= 9
      - Probable: 5 to 8
      - Possible: 1 to 4
      - Doubtful: <= 0
    """
    total = 0
    for q in NARANJO_QUESTIONS:
        qid = q["id"]
        val = answers.get(qid)
        if isinstance(val, int):
            total += val
        elif isinstance(val, str) and val.lower() in q["options"]:
            total += q["options"][val.lower()]
            
    if total >= 9:
        category = "Definite"
        interpretation = "The reaction followed a reasonable temporal sequence after a drug, followed a recognized response to the suspected drug, was confirmed by withdrawal, and could not be explained by characteristics of the patient's disease."
    elif total >= 5:
        category = "Probable"
        interpretation = "The reaction followed a reasonable temporal sequence after a drug, followed a recognized response to the suspected drug, was confirmed by withdrawal, and could not be reasonably explained by the known characteristics of the patient's clinical state."
    elif total >= 1:
        category = "Possible"
        interpretation = "The reaction followed a reasonable temporal sequence after a drug, but could also be explained by concurrent disease or other drugs or chemicals. Information on drug withdrawal may be lacking or unclear."
    else:
        category = "Doubtful"
        interpretation = "The reaction was likely related to factors other than the suspected drug, such as the patient's underlying condition or other concomitant factors."
        
    return total, category, interpretation
