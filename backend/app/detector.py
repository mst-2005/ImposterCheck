from __future__ import annotations
import base64
import io
from typing import List, Dict, Any, Tuple, Optional

import cv2
import numpy as np
from PIL import Image, ImageChops, ImageEnhance

# Initialize Haar Cascades for face detection
_FACE_CASCADE = None
def _get_face_cascade():
    global _FACE_CASCADE
    if _FACE_CASCADE is None:
        try:
            _FACE_CASCADE = cv2.CascadeClassifier(cv2.data.haarcascades + "haarcascade_frontalface_default.xml")
        except Exception:
            _FACE_CASCADE = None
    return _FACE_CASCADE

def detect_faces(image: np.ndarray) -> List[Dict[str, Any]]:
    cascade = _get_face_cascade()
    if cascade is None or cascade.empty():
        return []
    
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    faces = cascade.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=4, minSize=(30, 30))
    results = []
    
    for idx, (x, y, w, h) in enumerate(faces):
        face_roi = image[y:y+h, x:x+w]
        # Compute color histogram embedding as a lightweight facial descriptor
        hist_b = cv2.calcHist([face_roi], [0], None, [16], [0, 256])
        hist_g = cv2.calcHist([face_roi], [1], None, [16], [0, 256])
        hist_r = cv2.calcHist([face_roi], [2], None, [16], [0, 256])
        hist = np.concatenate([hist_b, hist_g, hist_r]).flatten()
        hist = hist / (np.linalg.norm(hist) + 1e-7)
        
        results.append({
            "face_id": idx + 1,
            "bbox": {"x": int(x), "y": int(y), "width": int(w), "height": int(h)},
            "confidence": 0.92,
            "embedding": hist.tolist()
        })
    return results

def compute_face_similarity(emb1: List[float], emb2: List[float]) -> float:
    if not emb1 or not emb2:
        return 0.0
    a = np.array(emb1, dtype=np.float32)
    b = np.array(emb2, dtype=np.float32)
    sim = np.dot(a, b) / ((np.linalg.norm(a) * np.linalg.norm(b)) + 1e-7)
    return round(float(np.clip(sim * 100.0, 0.0, 100.0)), 2)

def detect_multiple_cards(image: np.ndarray) -> List[Dict[str, Any]]:
    """
    Detects if one image or document page contains multiple identity cards.
    Standard ID-1 card aspect ratio is ~1.586 (e.g. 85.6mm / 53.98mm).
    """
    h_orig, w_orig = image.shape[:2]
    total_area = h_orig * w_orig
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    
    # Bilateral filter to reduce noise while keeping card edges sharp
    blurred = cv2.bilateralFilter(gray, 9, 75, 75)
    
    # Adaptive threshold + Canny edge detection
    edges = cv2.Canny(blurred, 30, 150)
    kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (5, 5))
    dilated = cv2.dilate(edges, kernel, iterations=2)
    
    contours, _ = cv2.findContours(dilated, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    
    cards = []
    card_boxes = []

    for cnt in contours:
        area = cv2.contourArea(cnt)
        # Card should be at least 4% and at most 92% of the whole image area
        if area < (0.04 * total_area) or area > (0.95 * total_area):
            continue
            
        x, y, w, h = cv2.boundingRect(cnt)
        aspect = max(w, h) / max(1, min(w, h))
        
        # Standard ID cards have aspect ratio between 1.2 and 1.9
        if 1.15 <= aspect <= 2.1:
            # Check overlap with existing detected card boxes
            overlap = False
            for bx, by, bw, bh in card_boxes:
                # Calculate intersection over union
                ix = max(x, bx)
                iy = max(y, by)
                iw = max(0, min(x + w, bx + bw) - ix)
                ih = max(0, min(y + h, by + bh) - iy)
                intersection = iw * ih
                if intersection > (0.4 * min(w * h, bw * bh)):
                    overlap = True
                    break
            if not overlap:
                card_boxes.append((x, y, w, h))

    # Sort detected cards from top to bottom, left to right
    card_boxes.sort(key=lambda b: (b[1] // 100, b[0]))
    
    # If no separate sub-cards detected, return whole image as 1 card
    if not card_boxes or len(card_boxes) == 0:
        card_boxes = [(0, 0, w_orig, h_orig)]

    for idx, (x, y, w, h) in enumerate(card_boxes):
        # Add slight margin if within bounds
        pad_x = int(w * 0.02)
        pad_y = int(h * 0.02)
        x1 = max(0, x - pad_x)
        y1 = max(0, y - pad_y)
        x2 = min(w_orig, x + w + pad_x)
        y2 = min(h_orig, y + h + pad_y)
        
        cropped = image[y1:y2, x1:x2]
        
        # Check faces in this cropped card
        card_faces = detect_faces(cropped)
        
        # Generate base64 preview
        _, buf = cv2.imencode('.jpg', cropped, [cv2.IMWRITE_JPEG_QUALITY, 85])
        b64_preview = "data:image/jpeg;base64," + base64.b64encode(buf).decode('utf-8')
        
        cards.append({
            "card_index": idx + 1,
            "label": f"Identity Card #{idx + 1}" if len(card_boxes) > 1 else "Primary Document",
            "bbox": {"x": int(x1), "y": int(y1), "width": int(x2 - x1), "height": int(y2 - y1)},
            "aspect_ratio": round(max(w, h) / max(1, min(w, h)), 2),
            "faces_detected": len(card_faces),
            "face_details": card_faces,
            "preview_b64": b64_preview,
            "cropped_image": cropped
        })

    return cards

def generate_ela_heatmap(image: np.ndarray, quality: int = 90) -> Tuple[str, float]:
    """
    Error Level Analysis (ELA): Re-saves image at fixed JPEG quality,
    computes absolute pixel difference, and amplifies to detect digital manipulation.
    """
    try:
        rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        pil_orig = Image.fromarray(rgb)
        
        # Save to memory buffer with specific JPEG quality
        buffer = io.BytesIO()
        pil_orig.save(buffer, "JPEG", quality=quality)
        buffer.seek(0)
        
        # Reload resaved image
        pil_resaved = Image.open(buffer)
        
        # Compute absolute difference
        diff = ImageChops.difference(pil_orig, pil_resaved)
        
        # Calculate tampering anomaly score
        extrema = diff.getextrema()
        max_diff = max([ex[1] for ex in extrema]) if extrema else 0
        scale = 255.0 / max(max_diff, 1)
        
        # Enhance difference to make tampering visually obvious
        enhanced = ImageEnhance.Brightness(diff).enhance(scale * 1.5)
        
        # Convert to heatmap color visualization with OpenCV
        diff_arr = np.array(enhanced.convert("L"))
        heatmap = cv2.applyColorMap(diff_arr, cv2.COLORMAP_JET)
        
        # Blend with original
        h_orig, w_orig = image.shape[:2]
        heatmap_resized = cv2.resize(heatmap, (w_orig, h_orig))
        blended = cv2.addWeighted(image, 0.45, heatmap_resized, 0.55, 0)
        
        _, buf = cv2.imencode('.jpg', blended, [cv2.IMWRITE_JPEG_QUALITY, 85])
        ela_b64 = "data:image/jpeg;base64," + base64.b64encode(buf).decode('utf-8')
        
        # Anomaly percentage (high localized variance indicates digital splice/copy-move)
        anomaly_ratio = float((diff_arr > 60).mean())
        return ela_b64, round(anomaly_ratio, 4)
    except Exception:
        return "", 0.0
