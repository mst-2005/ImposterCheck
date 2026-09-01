from __future__ import annotations
import hashlib
import hmac
import json
import os
import time
import uuid
from pathlib import Path
from typing import Optional, Dict, Any, List

DATA_DIR = Path(__file__).resolve().parents[2] / "data"
USERS_FILE = DATA_DIR / "users.json"
HISTORY_FILE = DATA_DIR / "history.json"
SECRET_KEY = os.environ.get("AUTH_SECRET_KEY", "imposter-check-super-secret-key-2026")

DATA_DIR.mkdir(parents=True, exist_ok=True)

def _load_json(file_path: Path, default_value: Any) -> Any:
    if not file_path.exists():
        return default_value
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return default_value

def _save_json(file_path: Path, data: Any) -> None:
    try:
        with open(file_path, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2)
    except Exception as e:
        print(f"Error saving {file_path}: {e}")

def _hash_password(password: str) -> str:
    salt = "imposter_salt_2026"
    return hashlib.sha256((password + salt).encode("utf-8")).hexdigest()

def _generate_token(user_id: str, email: str) -> str:
    payload = f"{user_id}:{email}:{int(time.time())}:{uuid.uuid4().hex[:8]}"
    sig = hmac.new(SECRET_KEY.encode(), payload.encode(), hashlib.sha256).hexdigest()
    return f"{payload}:{sig}"

def _verify_token(token: str) -> Optional[Dict[str, str]]:
    try:
        parts = token.split(":")
        if len(parts) != 5:
            return None
        user_id, email, ts_str, nonce, sig = parts
        payload = f"{user_id}:{email}:{ts_str}:{nonce}"
        expected_sig = hmac.new(SECRET_KEY.encode(), payload.encode(), hashlib.sha256).hexdigest()
        if not hmac.compare_digest(sig, expected_sig):
            return None
        return {"user_id": user_id, "email": email}
    except Exception:
        return None

# Seed initial demo user if users.json is empty
def _ensure_initial_users():
    users = _load_json(USERS_FILE, {})
    demo_id = "user_demo_001"
    # Ensure Mahita is always present as the primary demo user
    users[demo_id] = {
        "id": demo_id,
        "name": "Mahita",
        "email": "mahita@impostercheck.ai",
        "password_hash": _hash_password("password123"),
        "role": "Lead Identity Specialist",
        "avatar": "https://api.dicebear.com/7.x/bottts/svg?seed=Mahita",
        "created_at": time.strftime("%Y-%m-%d %H:%M:%S"),
        "provider": "local"
    }
    _save_json(USERS_FILE, users)

_ensure_initial_users()


def signup_user(name: str, email: str, password: str, role: str = "Forensic Analyst") -> Dict[str, Any]:
    users = _load_json(USERS_FILE, {})
    email_clean = email.strip().lower()
    for uid, u in users.items():
        if u.get("email", "").lower() == email_clean:
            raise ValueError("An account with this email address already exists.")
    
    user_id = f"user_{uuid.uuid4().hex[:10]}"
    avatar = f"https://api.dicebear.com/7.x/bottts/svg?seed={name.replace(' ', '')}"
    new_user = {
        "id": user_id,
        "name": name.strip(),
        "email": email_clean,
        "password_hash": _hash_password(password),
        "role": role.strip() or "Forensic Analyst",
        "avatar": avatar,
        "created_at": time.strftime("%Y-%m-%d %H:%M:%S"),
        "provider": "local"
    }
    users[user_id] = new_user
    _save_json(USERS_FILE, users)
    
    token = _generate_token(user_id, email_clean)
    return {
        "token": token,
        "user": {
            "id": user_id,
            "name": new_user["name"],
            "email": new_user["email"],
            "role": new_user["role"],
            "avatar": new_user["avatar"]
        }
    }

def login_user(email: str, password: str) -> Dict[str, Any]:
    users = _load_json(USERS_FILE, {})
    email_clean = email.strip().lower()
    target_user = None
    for uid, u in users.items():
        if u.get("email", "").lower() == email_clean:
            target_user = u
            break
            
    if not target_user:
        raise ValueError("Invalid email or password.")
        
    pwd_hash = _hash_password(password)
    if target_user.get("password_hash") != pwd_hash:
        raise ValueError("Invalid email or password.")
        
    token = _generate_token(target_user["id"], target_user["email"])
    return {
        "token": token,
        "user": {
            "id": target_user["id"],
            "name": target_user["name"],
            "email": target_user["email"],
            "role": target_user.get("role", "Forensic Analyst"),
            "avatar": target_user.get("avatar", "https://api.dicebear.com/7.x/bottts/svg?seed=User")
        }
    }

def social_login(provider: str, email: Optional[str] = None, name: Optional[str] = None) -> Dict[str, Any]:
    users = _load_json(USERS_FILE, {})
    provider_clean = provider.lower()
    
    if not email:
        email = f"{provider_clean}.user@{provider_clean}.auth.internal"
    email_clean = email.strip().lower()
    
    if not name:
        name = f"{provider.capitalize()} Verified User"
        
    target_user = None
    for uid, u in users.items():
        if u.get("email", "").lower() == email_clean:
            target_user = u
            break
            
    if not target_user:
        user_id = f"user_{provider_clean}_{uuid.uuid4().hex[:8]}"
        avatar = f"https://api.dicebear.com/7.x/bottts/svg?seed={name.replace(' ', '')}"
        target_user = {
            "id": user_id,
            "name": name.strip(),
            "email": email_clean,
            "password_hash": "",
            "role": f"{provider.capitalize()} Authenticated User",
            "avatar": avatar,
            "created_at": time.strftime("%Y-%m-%d %H:%M:%S"),
            "provider": provider_clean
        }
        users[user_id] = target_user
        _save_json(USERS_FILE, users)
        
    token = _generate_token(target_user["id"], target_user["email"])
    return {
        "token": token,
        "user": {
            "id": target_user["id"],
            "name": target_user["name"],
            "email": target_user["email"],
            "role": target_user.get("role", "Forensic Analyst"),
            "avatar": target_user.get("avatar", "")
        }
    }

def get_current_user_from_token(token: str) -> Optional[Dict[str, Any]]:
    payload = _verify_token(token)
    if not payload:
        return None
    users = _load_json(USERS_FILE, {})
    user = users.get(payload["user_id"])
    if not user:
        return None
    return {
        "id": user["id"],
        "name": user["name"],
        "email": user["email"],
        "role": user.get("role", "Forensic Analyst"),
        "avatar": user.get("avatar", "")
    }

def add_scan_to_history(user_id: Optional[str], scan_result: Dict[str, Any]) -> None:
    history = _load_json(HISTORY_FILE, [])
    item = {
        "id": f"scan_{uuid.uuid4().hex[:12]}",
        "user_id": user_id or "anonymous",
        "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
        "decision": scan_result.get("decision", "REVIEW"),
        "risk_score": scan_result.get("risk_score", 0),
        "file_name": scan_result.get("meta", {}).get("filename", "Uploaded document"),
        "file_type": scan_result.get("meta", {}).get("media_type", "image"),
        "cards_detected": len(scan_result.get("segmented_cards", [])) if "segmented_cards" in scan_result else 1,
        "is_multi_file": scan_result.get("is_multi_file", False),
        "summary": f"{scan_result.get('decision')} (Risk: {scan_result.get('risk_score')}%)"
    }
    history.insert(0, item)
    if len(history) > 100:
        history = history[:100]
    _save_json(HISTORY_FILE, history)

def get_history(user_id: Optional[str] = None) -> List[Dict[str, Any]]:
    history = _load_json(HISTORY_FILE, [])
    if user_id and user_id != "all":
        return [h for h in history if h.get("user_id") in (user_id, "anonymous")]
    return history

def clear_history() -> None:
    _save_json(HISTORY_FILE, [])
