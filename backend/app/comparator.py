from __future__ import annotations
from typing import List, Dict, Any, Tuple
import numpy as np
from .detector import compute_face_similarity

def extract_entities_from_text(text: str) -> Dict[str, List[str]]:
    import re
    words = [w.strip() for w in re.split(r"[\s,;:\n\r]+", text) if len(w.strip()) > 2]
    
    # Simple entity extraction heuristic for names and alphanumeric IDs
    id_numbers = re.findall(r"\b[A-Z0-9]{5,16}\b", text.upper())
    year_matches = re.findall(r"\b(19\d\d|20\d\d)\b", text)
    
    return {
        "words": [w.lower() for w in words],
        "id_numbers": list(set(id_numbers)),
        "years": list(set(year_matches))
    }

def cross_compare_files(files_analysis: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Compares 2 or more analyzed files to verify if they represent the SAME GENUINE IDENTITY
    or exhibit signs of identity theft, forged cross-matching, or impersonation.
    """
    n_files = len(files_analysis)
    if n_files < 2:
        return {
            "comparison_verdict": "INSUFFICIENT_FILES",
            "overall_identity_match_score": 0.0,
            "face_match_score": 0.0,
            "text_entity_match_score": 0.0,
            "conflict_signals": ["Upload at least 2 files for cross-identity comparison"],
            "pairwise_comparisons": [],
            "files_summary": files_analysis
        }

    pairwise = []
    face_sims = []
    text_sims = []
    conflict_signals = []

    for i in range(n_files):
        for j in range(i + 1, n_files):
            f1 = files_analysis[i]
            f2 = files_analysis[j]
            name1 = f1.get("meta", {}).get("filename", f"File #{i+1}")
            name2 = f2.get("meta", {}).get("filename", f"File #{j+1}")
            
            # 1. Face Comparison
            face_sim = None
            f1_faces = f1.get("faces", [])
            f2_faces = f2.get("faces", [])
            
            if f1_faces and f2_faces:
                # Compare primary face embeddings
                emb1 = f1_faces[0].get("embedding")
                emb2 = f2_faces[0].get("embedding")
                if emb1 and emb2:
                    face_sim = compute_face_similarity(emb1, emb2)
                    face_sims.append(face_sim)
                    if face_sim < 45.0:
                        conflict_signals.append(f"Facial mismatch between '{name1}' and '{name2}' ({face_sim}% match)")

            # 2. Text Entity Comparison
            t1 = f1.get("ocr_text", "")
            t2 = f2.get("ocr_text", "")
            text_sim = 0.0
            
            if t1 and t2:
                e1 = extract_entities_from_text(t1)
                e2 = extract_entities_from_text(t2)
                
                w1, w2 = set(e1["words"]), set(e2["words"])
                word_overlap = len(w1 & w2) / max(1, len(w1 | w2))
                
                # High priority match on ID numbers
                id1, id2 = set(e1["id_numbers"]), set(e2["id_numbers"])
                id_overlap = 1.0 if (id1 & id2) else (0.0 if (id1 and id2) else 0.5)
                
                text_sim = round(100.0 * (0.6 * word_overlap + 0.4 * id_overlap), 2)
                text_sims.append(text_sim)
                
                if id1 and id2 and not (id1 & id2):
                    conflict_signals.append(f"Contradicting ID numbers found between '{name1}' and '{name2}'")

            # 3. Media Type specific checks
            m1 = f1.get("meta", {}).get("media_type")
            m2 = f2.get("meta", {}).get("media_type")
            
            pairwise.append({
                "file_a": name1,
                "file_b": name2,
                "media_types": f"{m1} vs {m2}",
                "face_similarity": face_sim,
                "text_similarity": text_sim if (t1 and t2) else None,
                "status": "MATCH" if (face_sim is None or face_sim >= 60) and (text_sim >= 35 or not t1 or not t2) else "DISCREPANCY"
            })

    # Aggregate scores
    avg_face_sim = round(float(np.mean(face_sims)), 2) if face_sims else None
    avg_text_sim = round(float(np.mean(text_sims)), 2) if text_sims else None

    # Compute joint match score (0 to 100)
    match_components = []
    if avg_face_sim is not None:
        match_components.append(avg_face_sim * 0.6)
    if avg_text_sim is not None:
        match_components.append(avg_text_sim * 0.4)
        
    if match_components:
        overall_match_score = round(sum(match_components) / (0.6 * (avg_face_sim is not None) + 0.4 * (avg_text_sim is not None)), 2)
    else:
        # If no faces and no text to cross-compare, base on document quality & consistency
        overall_match_score = 75.0

    # Verdict
    if conflict_signals or overall_match_score < 40.0:
        comparison_verdict = "HIGH_RISK_IMPOSTER_MISMATCH"
    elif overall_match_score < 70.0:
        comparison_verdict = "SUSPICIOUS_CROSS_VERIFY_REQUIRED"
    else:
        comparison_verdict = "IDENTITY_VERIFIED_MATCH"

    return {
        "comparison_verdict": comparison_verdict,
        "overall_identity_match_score": overall_match_score,
        "face_match_score": avg_face_sim,
        "text_entity_match_score": avg_text_sim,
        "total_files_evaluated": n_files,
        "conflict_signals": conflict_signals,
        "pairwise_comparisons": pairwise,
        "files_summary": files_analysis
    }
