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

def test_zero_false_negatives_on_tampered_id():
    """
    Guarantees that a forged/spliced/tampered ID document is NEVER classified as PASS.
    """
    # Create base card
    card = np.full((380, 600, 3), (245, 248, 250), dtype=np.uint8)
    cv2.rectangle(card, (0, 0), (600, 60), (180, 80, 20), -1)
    cv2.putText(card, "STATE DRIVER LICENSE", (20, 40), cv2.FONT_HERSHEY_DUPLEX, 0.75, (255, 255, 255), 2)
    
    # Inject digital text splice with high noise & mismatched compression
    patch = np.full((34, 260, 3), (255, 255, 210), dtype=np.uint8)
    noise = np.random.randint(-40, 40, patch.shape, dtype=np.int16)
    patch = np.clip(patch.astype(np.int16) + noise, 0, 255).astype(np.uint8)
    cv2.putText(patch, "FORGED: IMPOSTER", (8, 24), cv2.FONT_HERSHEY_COMPLEX, 0.55, (160, 0, 0), 2)
    card[88:122, 165:425] = patch
    cv2.rectangle(card, (165, 88), (425, 122), (0, 0, 255), 1)
    
    res = screen(card, reference="MAHITA THUNDIYIL", filename="tampered_test.png")
    
    # Zero False Negative assertion: Must NEVER be PASS
    assert res["decision"] != "PASS", f"False Negative detected! Tampered document received decision: {res['decision']} (risk: {res['risk_score']})"
    assert res["risk_score"] >= 70.0
    assert "possible_digital_tampering" in res["signals"] or "inconsistent_noise_distribution" in res["signals"]

def test_screen_replay_attack_rejected():
    """
    Guarantees that photographing a screen (Moire presentation attack) is detected and rejected.
    """
    h, w = 380, 600
    card = np.full((h, w, 3), 200, dtype=np.uint8)
    y, x = np.mgrid[0:h, 0:w]
    moire = (25 * np.sin(x / 1.8) * np.cos(y / 1.8)).astype(np.int16)
    moire_3d = np.repeat(moire[:, :, np.newaxis], 3, axis=2)
    replayed = np.clip(card.astype(np.int16) + moire_3d, 0, 255).astype(np.uint8)
    
    res = screen(replayed, filename="screen_replay.png")
    assert res["decision"] in ["REJECT", "REVIEW"]
    assert res["tamper_analysis"]["moire_energy"] > 0.05
