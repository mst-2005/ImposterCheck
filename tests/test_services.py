import io
import cv2
import numpy as np
import pytest
from backend.app.services import image_quality, reference_similarity, screen, screen_media, compare_multiple
from backend.app.detector import detect_multiple_cards, detect_faces, generate_ela_heatmap, compute_face_similarity
from backend.app.auth import signup_user, login_user, social_login, get_current_user_from_token

def test_quality():
    im = np.zeros((100, 100, 3), dtype=np.uint8)
    q = image_quality(im)
    assert "brightness" in q
    assert "contrast" in q
    assert "blur_score" in q
    assert "glare_ratio" in q

def test_similarity():
    assert reference_similarity("John Doe 123", "John Doe 123") == 100.0
    assert reference_similarity("Jane Smith", "Alice Smith") > 0.0

def test_multi_card_detection():
    # Create an image containing two distinct card-like rectangles
    canvas = np.full((600, 800, 3), 40, dtype=np.uint8)
    # Card 1 (ID-1 ratio ~1.58: 240x150)
    cv2.rectangle(canvas, (50, 50), (350, 250), (220, 220, 220), -1)
    cv2.putText(canvas, "ID CARD 1", (70, 120), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 0, 0), 2)
    # Card 2
    cv2.rectangle(canvas, (420, 320), (740, 520), (230, 230, 230), -1)
    cv2.putText(canvas, "ID CARD 2", (440, 400), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 0, 0), 2)
    
    cards = detect_multiple_cards(canvas)
    assert len(cards) >= 1
    assert "preview_b64" in cards[0]

def test_ela_tampering_heatmap():
    im = np.full((200, 200, 3), 128, dtype=np.uint8)
    b64_map, anomaly = generate_ela_heatmap(im)
    assert b64_map.startswith("data:image/jpeg;base64,")
    assert isinstance(anomaly, float)

def test_auth_lifecycle():
    email = f"test_{np.random.randint(1000, 9999)}@forensics.org"
    reg = signup_user("Dr. Evelyn Reed", email, "SecurePass123!")
    assert "token" in reg
    assert reg["user"]["name"] == "Dr. Evelyn Reed"
    
    auth_user = get_current_user_from_token(reg["token"])
    assert auth_user is not None
    assert auth_user["email"] == email
    
    # Test Login
    login = login_user(email, "SecurePass123!")
    assert "token" in login
    
    # Test Social Login
    social = social_login("google", "test.google@domain.com", "Google Analyst")
    assert "token" in social
    assert social["user"]["name"] == "Google Analyst"

def test_multi_file_comparison():
    # File 1: Dummy ID Card image
    im1 = np.full((300, 450, 3), 200, dtype=np.uint8)
    cv2.putText(im1, "PASSPORT JOHN DOE 987654", (30, 150), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 0, 0), 2)
    _, buf1 = cv2.imencode('.png', im1)
    
    # File 2: Matching selfie/document
    im2 = np.full((300, 450, 3), 210, dtype=np.uint8)
    cv2.putText(im2, "JOHN DOE VERIFIED 987654", (30, 150), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 0, 0), 2)
    _, buf2 = cv2.imencode('.png', im2)
    
    res = compare_multiple([
        (buf1.tobytes(), "id_card.png", "image/png"),
        (buf2.tobytes(), "selfie.png", "image/png")
    ], reference="JOHN DOE")
    
    assert res["is_multi_file"] is True
    assert "comparison" in res
    assert res["comparison"]["total_files_evaluated"] == 2
    assert res["decision"] in ["PASS", "REVIEW", "REJECT"]
