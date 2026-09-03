from __future__ import annotations
from pathlib import Path
from typing import List, Optional

from fastapi import FastAPI, File, UploadFile, Form, Header, HTTPException, Body, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles

from .schemas import LoginRequest, SignUpRequest, SocialLoginRequest, UrlScreenRequest, ProfileUpdateRequest
from .auth import (
    signup_user, login_user, social_login, get_current_user_from_token,
    update_user_profile, add_scan_to_history, get_history, clear_history
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

@app.post("/api/v1/auth/profile")
@app.put("/api/v1/auth/profile")
def handle_update_profile(req: ProfileUpdateRequest, authorization: Optional[str] = Header(None)):
    if not authorization:
        raise HTTPException(status_code=401, detail="Authentication required")
    token = authorization.replace("Bearer ", "").strip()
    user = get_current_user_from_token(token)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    try:
        updated = update_user_profile(
            user_id=user["id"],
            name=req.name,
            role=req.role,
            avatar=req.avatar,
            bio=req.bio,
            organization=req.organization,
            badge_id=req.badge_id,
            preferences=req.preferences
        )
        return {"user": updated, "message": "Profile settings successfully saved"}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update profile: {str(e)}")

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
        
        if len(raw) == 0:
            raise HTTPException(status_code=400, detail="The selected file is empty (0 bytes). Please select a valid document or media file.")
        if len(raw) > 50 * 1024 * 1024:
            raise HTTPException(status_code=400, detail="File size exceeds the 50MB limit. Please upload a smaller file.")

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
    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Document screening error: {str(e)}")

@app.post("/api/v1/screen-url")
async def screen_url(
    req: UrlScreenRequest,
    authorization: Optional[str] = Header(None)
):
    try:
        url_clean = (req.url or "").strip()
        if not url_clean.startswith("http://") and not url_clean.startswith("https://"):
            raise HTTPException(status_code=400, detail="Invalid URL format. Please provide a complete URL starting with https:// or http://")
            
        result = screen_url_target(url_clean, req.reference or "")
        
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
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"URL inspection failed: {str(e)}")

@app.post("/api/v1/compare")
async def compare_documents(
    files: List[UploadFile] = File(...),
    reference: str = Form(""),
    authorization: Optional[str] = Header(None)
):
    try:
        if len(files) < 2:
            raise HTTPException(status_code=400, detail="At least 2 files (e.g. ID card and selfie) are required for cross-identity comparison.")
            
        files_data = []
        for idx, f in enumerate(files):
            raw = await f.read()
            if len(raw) == 0:
                raise HTTPException(status_code=400, detail=f"File #{idx+1} ('{f.filename}') is empty (0 bytes).")
            files_data.append((raw, f.filename or f"file_{idx+1}", f.content_type or ""))
            
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
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Multi-file comparison error: {str(e)}")

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
        "11_match_mahita_selfie.png": {"title": "Matching Face Selfie (Photo)", "category": "Comparison Set", "expected": "MATCH", "desc": "Selfie matching Mahita ID (use in Multi-File Compare)."},
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

@app.get("/logo.jpeg")
def logo():
    return FileResponse(WEB / "logo.jpeg")

@app.get("/")
def index():
    return FileResponse(WEB / "index.html")

