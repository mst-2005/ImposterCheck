from __future__ import annotations
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field

class LoginRequest(BaseModel):
    email: str
    password: str

class SignUpRequest(BaseModel):
    name: str
    email: str
    password: str
    role: Optional[str] = "Forensic Analyst"

class SocialLoginRequest(BaseModel):
    provider: str
    email: Optional[str] = None
    name: Optional[str] = None

class AuthResponse(BaseModel):
    token: str
    user: Dict[str, Any]

class UserProfile(BaseModel):
    id: str
    name: str
    email: str
    role: str
    avatar: str
    bio: Optional[str] = ""
    organization: Optional[str] = ""
    badge_id: Optional[str] = ""
    preferences: Optional[Dict[str, Any]] = None

class ProfileUpdateRequest(BaseModel):
    name: Optional[str] = None
    role: Optional[str] = None
    avatar: Optional[str] = None
    bio: Optional[str] = None
    organization: Optional[str] = None
    badge_id: Optional[str] = None
    preferences: Optional[Dict[str, Any]] = None

class UrlScreenRequest(BaseModel):
    url: str
    reference: Optional[str] = ""

class CardSegment(BaseModel):
    card_index: int
    label: str
    bbox: Dict[str, int]
    aspect_ratio: float
    faces_detected: int
    face_details: List[Dict[str, Any]]
    preview_b64: Optional[str] = None

class ScreenResponse(BaseModel):
    decision: str
    risk_score: float
    ocr_text: str
    quality: dict
    signals: List[str]
    models: dict
    meta: Dict[str, Any]
    segmented_cards: Optional[List[Dict[str, Any]]] = None
    faces: Optional[List[Dict[str, Any]]] = None
    tamper_analysis: Optional[Dict[str, Any]] = None
    video_dynamics: Optional[Dict[str, Any]] = None
    audio_biometrics: Optional[Dict[str, Any]] = None

class CompareResponse(BaseModel):
    comparison_verdict: str
    overall_identity_match_score: float
    face_match_score: Optional[float] = None
    text_entity_match_score: Optional[float] = None
    total_files_evaluated: int
    conflict_signals: List[str]
    pairwise_comparisons: List[Dict[str, Any]]
    files_summary: List[Dict[str, Any]]
