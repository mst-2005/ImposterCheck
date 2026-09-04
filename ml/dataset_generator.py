"""
Dataset generator to create realistic genuine and fraudulent document datasets
for training the forensic EfficientNet and XGBoost detectors with 0 false negatives.
"""

import os
import random
import math
from pathlib import Path
import cv2
import numpy as np

ROOT = Path(__file__).resolve().parents[1]
RAW_DIR = ROOT / "data" / "raw"
REAL_DIR = RAW_DIR / "real"
FAKE_DIR = RAW_DIR / "fake"

REAL_DIR.mkdir(parents=True, exist_ok=True)
FAKE_DIR.mkdir(parents=True, exist_ok=True)

NAMES = [
    "MAHITA THUNDIYIL", "JOHNATHAN DOE", "SARAH CONNER", "DAVID KIM", "ELENA ROSTOVA",
    "MARCUS VANCE", "PRIYA SHARMA", "CARLOS MENDEZ", "EMILY BLUNT", "LI WEI",
    "AHMED HASSAN", "ANNA KOWALSKI", "ROBERT CHEN", "FATIMA AL-SAYED", "LUCAS SILVA"
]

TITLES = [
    "STATE DRIVER LICENSE", "NATIONAL IDENTITY CARD", "FEDERAL PASSPORT CARD",
    "PERMANENT RESIDENT CARD", "GOVERNMENT EMPLOYEE PASS", "STATE CITIZEN ID"
]

def create_synthetic_face(w=110, h=135, seed=0, is_alternate=False):
    random.seed(seed)
    canvas = np.full((h, w, 3), (225, 230, 235), dtype=np.uint8)
    
    skin_tones = [
        (180, 205, 235), (150, 185, 220), (130, 160, 200), (100, 140, 180),
        (190, 215, 240), (160, 195, 225)
    ]
    skin_color = skin_tones[seed % len(skin_tones)] if not is_alternate else (140, 170, 210)
    center = (w // 2, h // 2 + 5)
    
    # Face shape
    cv2.ellipse(canvas, center, (w // 3, h // 3 + 6), 0, 0, 360, skin_color, -1)
    
    # Hair
    hair_colors = [(30, 25, 20), (40, 50, 70), (20, 40, 80), (50, 40, 30), (80, 70, 60)]
    hair_color = hair_colors[seed % len(hair_colors)]
    cv2.ellipse(canvas, (w // 2, h // 3), (w // 3 + 2, h // 4), 0, 180, 360, hair_color, -1)
    
    # Eyes
    eye_y = center[1] - 10
    left_eye = (center[0] - 16, eye_y)
    right_eye = (center[0] + 16, eye_y)
    
    cv2.circle(canvas, left_eye, 5, (255, 255, 255), -1)
    cv2.circle(canvas, right_eye, 5, (255, 255, 255), -1)
    cv2.circle(canvas, left_eye, 2, (30, 30, 30), -1)
    cv2.circle(canvas, right_eye, 2, (30, 30, 30), -1)
    
    # Eyebrows
    cv2.line(canvas, (left_eye[0] - 8, eye_y - 8), (left_eye[0] + 8, eye_y - 7), hair_color, 2)
    cv2.line(canvas, (right_eye[0] - 8, eye_y - 7), (right_eye[0] + 8, eye_y - 8), hair_color, 2)
    
    # Nose
    cv2.line(canvas, (center[0], center[1] - 4), (center[0] - 2, center[1] + 8), (140, 170, 200), 2)
    cv2.line(canvas, (center[0] - 2, center[1] + 8), (center[0] + 3, center[1] + 8), (140, 170, 200), 2)
    
    # Mouth
    cv2.ellipse(canvas, (center[0], center[1] + 20), (12, 5), 0, 0, 180, (90, 100, 190), 2)
    
    # Collar
    cv2.ellipse(canvas, (w // 2, h + 15), (w // 2, 25), 0, 180, 360, (120, 70, 50), -1)
    return canvas

def generate_base_id(name="MAHITA THUNDIYIL", doc_id="DL-8892140A", title="STATE DRIVER LICENSE", seed=1):
    w, h = 600, 380
    bg_colors = [(245, 248, 250), (240, 245, 248), (250, 248, 245), (242, 245, 242)]
    card = np.full((h, w, 3), bg_colors[seed % len(bg_colors)], dtype=np.uint8)
    
    # Security Guilloche micro-lines pattern
    for i in range(10, h, 20):
        cv2.line(card, (0, i), (w, i + int(10 * math.sin(i / 15.0))), (230, 235, 240), 1)
        
    # Header bar
    header_colors = [(180, 80, 20), (140, 110, 30), (30, 110, 160), (40, 130, 60)]
    h_col = header_colors[seed % len(header_colors)]
    cv2.rectangle(card, (0, 0), (w, 60), h_col, -1)
    cv2.putText(card, title, (20, 40), cv2.FONT_HERSHEY_DUPLEX, 0.75, (255, 255, 255), 2)
    
    # Security Hologram Chip
    cv2.rectangle(card, (30, 85), (85, 130), (80, 190, 240), -1)
    cv2.rectangle(card, (30, 85), (85, 130), (50, 140, 180), 2)
    cv2.line(card, (30, 107), (85, 107), (50, 140, 180), 1)
    cv2.line(card, (57, 85), (57, 130), (50, 140, 180), 1)
    
    # Face Photo
    face = create_synthetic_face(110, 135, seed=seed)
    card[150:285, 30:140] = face
    cv2.rectangle(card, (28, 148), (142, 287), (160, 160, 160), 2)
    
    # Text metadata
    cv2.putText(card, f"NAME: {name}", (170, 105), cv2.FONT_HERSHEY_DUPLEX, 0.65, (30, 30, 30), 2)
    cv2.putText(card, f"ID NO: {doc_id}", (170, 140), cv2.FONT_HERSHEY_DUPLEX, 0.6, (40, 40, 40), 1)
    cv2.putText(card, f"DOB: {10 + (seed % 18)} MAY {1980 + (seed % 22)}", (170, 175), cv2.FONT_HERSHEY_DUPLEX, 0.55, (50, 50, 50), 1)
    cv2.putText(card, f"EXPIRY: 30 DEC {2028 + (seed % 10)}", (170, 210), cv2.FONT_HERSHEY_DUPLEX, 0.55, (50, 50, 50), 1)
    cv2.putText(card, "STATUS: CITIZEN VERIFIED", (170, 245), cv2.FONT_HERSHEY_DUPLEX, 0.55, (30, 120, 40), 2)
    
    # MRZ Bar
    cv2.rectangle(card, (0, 310), (w, h), (230, 235, 240), -1)
    cv2.putText(card, f"I<USA{doc_id}<<<<<<<<<<<<<<<", (20, 335), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (60, 60, 60), 1)
    cv2.putText(card, f"9405125M3212308USA<<<<<<<<<<<4", (20, 360), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (60, 60, 60), 1)
    
    return card

def inject_forgery(card, fraud_type="splice", seed=0):
    tampered = card.copy()
    h, w = tampered.shape[:2]
    
    if fraud_type == "splice":
        # 1. Digital Text Splice (Different font, noise, and compression level)
        patch = np.full((34, 260, 3), (255, 255, 210), dtype=np.uint8)
        noise = np.random.randint(-40, 40, patch.shape, dtype=np.int16)
        patch = np.clip(patch.astype(np.int16) + noise, 0, 255).astype(np.uint8)
        cv2.putText(patch, f"FORGED NAME #{seed}", (8, 24), cv2.FONT_HERSHEY_COMPLEX, 0.55, (160, 0, 0), 2)
        tampered[88:122, 165:425] = patch
        # Splicing border artifact
        cv2.rectangle(tampered, (165, 88), (425, 122), (0, 0, 255), 1)
        
    elif fraud_type == "face_swap":
        # 2. Photoshopped Face Swap (Mismatched face pasted with hard borders)
        alt_face = create_synthetic_face(110, 135, seed=seed + 999, is_alternate=True)
        # Add high compression artifact to pasted face
        noise = np.random.normal(0, 15, alt_face.shape).astype(np.int16)
        alt_face = np.clip(alt_face.astype(np.int16) + noise, 0, 255).astype(np.uint8)
        tampered[150:285, 30:140] = alt_face
        # Paste edge misalignment
        cv2.rectangle(tampered, (30, 150), (140, 285), (80, 80, 220), 2)
        
    elif fraud_type == "copy_move":
        # 3. Copy-Move Clone Attack: duplicate hologram or number region to cover dates
        chip_crop = tampered[85:130, 30:85].copy()
        tampered[190:235, 260:315] = chip_crop
        cv2.putText(tampered, "EXP: CLONED", (170, 210), cv2.FONT_HERSHEY_DUPLEX, 0.55, (200, 0, 0), 2)
        
    elif fraud_type == "screen_replay":
        # 4. Presentation Attack: Photographing a screen (Moire subpixel patterns)
        y, x = np.mgrid[0:h, 0:w]
        # High frequency sine wave simulating LCD/OLED RGB grid
        moire = (20 * np.sin(x / 1.8) * np.cos(y / 1.8)).astype(np.int16)
        moire_3d = np.repeat(moire[:, :, np.newaxis], 3, axis=2)
        tampered = np.clip(tampered.astype(np.int16) + moire_3d, 0, 255).astype(np.uint8)
        # Specular screen glare in corner
        cv2.circle(tampered, (w - 80, 80), 60, (255, 255, 255), -1)
        tampered = cv2.GaussianBlur(tampered, (3, 3), 0)
        
    elif fraud_type == "mrz_tamper":
        # 5. MRZ Checksum Forgery: altered passport numbers with mismatched font
        cv2.rectangle(tampered, (10, 312), (300, 375), (255, 255, 255), -1)
        cv2.putText(tampered, "I<USA99999999<<<<<<<<<<<<<", (20, 335), cv2.FONT_HERSHEY_SIMPLEX, 0.52, (200, 0, 0), 2)
        cv2.putText(tampered, "0000000M0000000USA<<<<<<<<<<<0", (20, 360), cv2.FONT_HERSHEY_SIMPLEX, 0.52, (200, 0, 0), 2)

    return tampered

def generate_full_dataset():
    print("Generating 150 Genuine samples and 150 Fraudulent samples...")
    fraud_types = ["splice", "face_swap", "copy_move", "screen_replay", "mrz_tamper"]
    
    # 1. Generate 150 Genuine Samples
    for i in range(150):
        name = NAMES[i % len(NAMES)]
        title = TITLES[i % len(TITLES)]
        doc_id = f"ID-{100000 + i * 43}"
        card = generate_base_id(name, doc_id, title, seed=i)
        
        # Add realistic sensor noise, slight lighting variation (genuine camera artifacts)
        brightness_mod = random.uniform(-15, 15)
        card_mod = np.clip(card.astype(np.int16) + brightness_mod, 0, 255).astype(np.uint8)
        
        out_path = REAL_DIR / f"real_doc_{i+1:03d}.jpg"
        cv2.imwrite(str(out_path), card_mod, [cv2.IMWRITE_JPEG_QUALITY, random.randint(85, 98)])

    # 2. Generate 150 Forged / Tampered Samples
    for i in range(150):
        name = NAMES[i % len(NAMES)]
        title = TITLES[i % len(TITLES)]
        doc_id = f"ID-{100000 + i * 43}"
        card = generate_base_id(name, doc_id, title, seed=i)
        
        f_type = fraud_types[i % len(fraud_types)]
        tampered_card = inject_forgery(card, fraud_type=f_type, seed=i)
        
        out_path = FAKE_DIR / f"fake_doc_{i+1:03d}_{f_type}.jpg"
        cv2.imwrite(str(out_path), tampered_card, [cv2.IMWRITE_JPEG_QUALITY, random.randint(75, 92)])

    print(f"Generated 150 real samples in {REAL_DIR}")
    print(f"Generated 150 fake samples in {FAKE_DIR}")

if __name__ == "__main__":
    generate_full_dataset()
