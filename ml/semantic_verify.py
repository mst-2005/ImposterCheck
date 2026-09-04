"""
Sentence-BERT semantic similarity helper.
The model is downloaded by sentence-transformers on first use.
"""
def semantic_similarity(text_a: str, text_b: str) -> float:
    from sentence_transformers import SentenceTransformer, util
    model=SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2")
    a=model.encode(text_a,convert_to_tensor=True,normalize_embeddings=True)
    b=model.encode(text_b,convert_to_tensor=True,normalize_embeddings=True)
    return float(util.cos_sim(a,b).item())
