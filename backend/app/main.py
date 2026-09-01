from __future__ import annotations
from pathlib import Path
from typing import List, Optional

from fastapi import FastAPI, File, UploadFile, Form, Header, HTTPException, Body, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles

from .schemas import LoginRequest, SignUpRequest, SocialLoginRequest, UrlScreenRequest
from .auth import (
    signup_user, login_user, social_login, get_current_user_from_token,
    add_scan_to_history, get_history, clear_history
)
from .services import screen_media, screen_url_target, compare_multiple

app = FastAPI(
    title="The Imposter Check - NextGen Multi-Modal Identity Verification",
    version="2.0.0",
    description="Enterprise Multi-Modal Fraud Detection Platform supporting Live Photos, Videos, Slow-mo, Timelapse, Audios, PDF, DOCX, URLs, Multi-Card Extraction, and Cross-Identity Multi-File Comparison."
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

WEB = Path(__file__).resolve().parent.parent / "web"

@app.get("/health")
def health():
    return {"status": "ok", "version": "2.0.0", "engine": "The Imposter Check AI Active"}

# ----------------- AUTHENTICATION ENDPOINTS -----------------

@app.post("/api/v1/auth/signup")
def handle_signup(req: SignUpRequest):
    try:
        res = signup_user(req.name, req.email, req.password, req.role or "Forensic Analyst")
        return res
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail="Registration error occurred")

@app.post("/api/v1/auth/login")
def handle_login(req: LoginRequest):
    try:
        res = login_user(req.email, req.password)
        return res
    except ValueError as e:
        raise HTTPException(status_code=401, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail="Authentication error occurred")

@app.post("/api/v1/auth/social")
def handle_social_login(req: SocialLoginRequest):
    try:
        res = social_login(req.provider, req.email, req.name)
        return res
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Social login error: {str(e)}")

@app.get("/api/v1/auth/me")
def handle_get_me(authorization: Optional[str] = Header(None)):
    if not authorization:
        raise HTTPException(status_code=401, detail="Authentication required")
    token = authorization.replace("Bearer ", "").strip()
    user = get_current_user_from_token(token)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    return {"user": user}

# ----------------- AUDIT & HISTORY ENDPOINTS -----------------

@app.get("/api/v1/history")
def handle_get_history(authorization: Optional[str] = Header(None)):
    user_id = None
    if authorization:
        token = authorization.replace("Bearer ", "").strip()
        user = get_current_user_from_token(token)
        if user:
            user_id = user["id"]
    return {"history": get_history(user_id)}

@app.post("/api/v1/history/clear")
def handle_clear_history():
    clear_history()
    return {"status": "history_cleared"}

# ----------------- SCREENING ENDPOINTS -----------------

@app.post("/api/v1/screen")
async def screen_document(
    file: UploadFile = File(...),
    reference: str = Form(""),
    authorization: Optional[str] = Header(None)
):
    try:
        raw = await file.read()
        filename = file.filename or "uploaded_media"
        content_type = file.content_type or ""
        
        result = screen_media(raw, filename, content_type, reference)
        
        # Save to user history
        user_id = None
        if authorization:
            token = authorization.replace("Bearer ", "").strip()
            user = get_current_user_from_token(token)
            if user:
                user_id = user["id"]
        add_scan_to_history(user_id, result)
        
        return result
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Document screening error: {str(e)}")

@app.post("/api/v1/screen-url")
async def screen_url(
    req: UrlScreenRequest,
    authorization: Optional[str] = Header(None)
):
    try:
        result = screen_url_target(req.url, req.reference or "")
        
        user_id = None
        if authorization:
            token = authorization.replace("Bearer ", "").strip()
            user = get_current_user_from_token(token)
            if user:
                user_id = user["id"]
        add_scan_to_history(user_id, result)
        
        return result
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"URL inspection failed: {str(e)}")

@app.post("/api/v1/compare")
async def compare_documents(
    files: List[UploadFile] = File(...),
    reference: str = Form(""),
    authorization: Optional[str] = Header(None)
):
    try:
        if len(files) < 2:
            raise HTTPException(status_code=400, detail="Please upload at least 2 files to compare.")
            
        files_data = []
        for f in files:
            raw = await f.read()
            files_data.append((raw, f.filename or "file", f.content_type or ""))
            
        result = compare_multiple(files_data, reference)
        
        user_id = None
        if authorization:
            token = authorization.replace("Bearer ", "").strip()
            user = get_current_user_from_token(token)
            if user:
                user_id = user["id"]
        add_scan_to_history(user_id, result)
        
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Cross-comparison error: {str(e)}")

# ----------------- SAMPLE DEMO FILES ENDPOINTS -----------------

SAMPLES_DIR = Path(__file__).resolve().parents[2] / "data" / "sample_inputs"

@app.get("/api/v1/samples")
def list_sample_files():
    if not SAMPLES_DIR.exists():
        return {"samples": []}
    files = sorted(list(SAMPLES_DIR.glob("*.*")))
    result = []
    descriptions = {
        "1_genuine_id_card.png": {"title": "Genuine ID Card (Photo)", "category": "Photo", "expected": "PASS", "desc": "Clean authentic driver license with security chip, face, and MRZ code."},
        "2_forged_tampered_id.png": {"title": "Forged Tampered ID (Photo)", "category": "Photo", "expected": "REJECT", "desc": "Tampered ID card with digitally spliced name patch and noise artifacts."},
        "3_multi_card_single_file.png": {"title": "Multi-Card in Single File (Photo)", "category": "Multi-Card", "expected": "PASS", "desc": "Contains 2 distinct ID cards (Passport Card + Driver License) on 1 desk."},
        "4_identity_dossier.pdf": {"title": "Identity Verification Dossier (PDF)", "category": "PDF Document", "expected": "PASS", "desc": "2-page PDF document with embedded credentials and utility address proof."},
        "5_employment_identity.docx": {"title": "Employment Verification (DOCX)", "category": "DOCX Document", "expected": "PASS", "desc": "Word document with employee details, data tables, and embedded badge."},
        "6_genuine_voice_sample.wav": {"title": "Human Voice Sample (Audio)", "category": "Audio", "expected": "PASS", "desc": "Audio sample with natural vocal modulation and pitch variance."},
        "7_ai_deepfake_voice_sample.wav": {"title": "AI Deepfake / TTS Voice (Audio)", "category": "Audio", "expected": "REJECT", "desc": "Synthesized audio with robotic spectral peaks and flat harmonic buzz."},
        "8_liveness_selfie_video.mp4": {"title": "Liveness Selfie Video (Video)", "category": "Video", "expected": "PASS", "desc": "Live motion video with nodding and blinking subject."},
        "9_timelapse_test_video.mp4": {"title": "Accelerated Timelapse (Video)", "category": "Video", "expected": "REVIEW", "desc": "High-velocity accelerated motion video test clip."},
        "10_slowmo_test_video.mp4": {"title": "Slow-Motion 60 FPS (Video)", "category": "Video", "expected": "PASS", "desc": "High framerate slow-motion video with subtle movements."},
        "11_match_alex_mercer_selfie.png": {"title": "Matching Face Selfie (Photo)", "category": "Comparison Set", "expected": "MATCH", "desc": "Selfie matching Alex Mercer ID (use in Multi-File Compare)."},
        "12_imposter_mismatch_selfie.png": {"title": "Imposter Different Face (Photo)", "category": "Comparison Set", "expected": "IMPOSTER", "desc": "Different subject selfie (use in Multi-File Compare to test mismatch)."}
    }
    for p in files:
        meta = descriptions.get(p.name, {"title": p.name, "category": "File", "expected": "N/A", "desc": "Sample test file"})
        result.append({
            "filename": p.name,
            "title": meta["title"],
            "category": meta["category"],
            "expected": meta["expected"],
            "description": meta["desc"],
            "size_bytes": p.stat().st_size,
            "url": f"/api/v1/samples/{p.name}"
        })
    return {"samples": result}

@app.get("/api/v1/samples/{filename}")
def get_sample_file(filename: str):
    target = (SAMPLES_DIR / filename).resolve()
    if not target.exists() or not str(target).startswith(str(SAMPLES_DIR.resolve())):
        raise HTTPException(status_code=404, detail="Sample file not found")
    return FileResponse(target, filename=filename)

# ----------------- STATIC UI MOUNT -----------------

app.mount("/static", StaticFiles(directory=WEB), name="static")

@app.get("/")
def index():
    return FileResponse(WEB / "index.html")
