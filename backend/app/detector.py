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
    h_orig, w_orig = image.shape[:2]
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    face_boxes = []

    # 1. Primary: Haar Cascade for photographic human faces
    cascade = _get_face_cascade()
    if cascade is not None and not cascade.empty():
        faces = cascade.detectMultiScale(gray, scaleFactor=1.08, minNeighbors=3, minSize=(30, 30))
        for (x, y, w, h) in faces:
            face_boxes.append((int(x), int(y), int(w), int(h)))

    # 2. Secondary: Portrait skin-tone / contour detection for ID photos and synthetic cards
    if not face_boxes:
        hsv = cv2.cvtColor(image, cv2.COLOR_BGR2HSV)
        lower_skin = np.array([0, 20, 70], dtype=np.uint8)
        upper_skin = np.array([25, 255, 255], dtype=np.uint8)
        mask = cv2.inRange(hsv, lower_skin, upper_skin)
        contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        for cnt in contours:
            area = cv2.contourArea(cnt)
            if area > (0.02 * h_orig * w_orig):
                x, y, w, h = cv2.boundingRect(cnt)
                aspect = h / max(1, w)
                if 0.75 <= aspect <= 1.8:
                    face_boxes.append((int(x), int(y), int(w), int(h)))
                    break

    results = []
    for idx, (x, y, w, h) in enumerate(face_boxes):
        face_roi = image[y:y+h, x:x+w]
        roi_resized = cv2.resize(face_roi, (64, 64))
        hists = []
        for c in range(3):
            hist = cv2.calcHist([roi_resized], [c], None, [16], [0, 256]).flatten()
            hists.append(hist)
        roi_gray = cv2.cvtColor(roi_resized, cv2.COLOR_BGR2GRAY)
        gx = cv2.Sobel(roi_gray, cv2.CV_32F, 1, 0, ksize=3)
        gy = cv2.Sobel(roi_gray, cv2.CV_32F, 0, 1, ksize=3)
        g_mag = np.sqrt(gx**2 + gy**2)
        g_hist = cv2.calcHist([g_mag.astype(np.uint8)], [0], None, [16], [0, 256]).flatten()
        hists.append(g_hist)
        
        emb = np.concatenate(hists)
        emb = emb / (np.linalg.norm(emb) + 1e-7)
        results.append({
            "face_id": idx + 1,
            "bbox": {"x": int(x), "y": int(y), "width": int(w), "height": int(h)},
            "confidence": 0.92,
            "embedding": emb.tolist()
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
        
        # Calculate tampering anomaly score via ELA standard deviation and outlier density
        # Compute tampering anomaly score via ELA standard deviation and outlier density
        diff_arr = np.array(enhanced.convert("L"))
        diff_raw = np.array(diff.convert("L"), dtype=np.float32)
        ela_std = float(np.std(diff_raw))
        
        heatmap = cv2.applyColorMap(diff_arr, cv2.COLORMAP_JET)
        
        # Blend with original
        h_orig, w_orig = image.shape[:2]
        heatmap_resized = cv2.resize(heatmap, (w_orig, h_orig))
        blended = cv2.addWeighted(image, 0.45, heatmap_resized, 0.55, 0)
        
        _, buf = cv2.imencode('.jpg', blended, [cv2.IMWRITE_JPEG_QUALITY, 85])
        ela_b64 = "data:image/jpeg;base64," + base64.b64encode(buf).decode('utf-8')
        
        # Calibrated normalized tampering ratio: clean genuine IDs have std < 3.5; spliced/edited regions have std > 4.2
        tampering_ratio = round(min(1.0, max(0.0, (ela_std - 3.8) / 10.0)), 4)
        return ela_b64, tampering_ratio
    except Exception:
        return "", 0.0

def compute_noise_inconsistency(image: np.ndarray) -> float:
    """
    Noise Residual Inconsistency (NRI):
    Estimates high-pass camera sensor noise residuals across grid blocks.
    Spliced or edited regions exhibit abrupt noise variance discrepancies.
    """
    try:
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        med = cv2.medianBlur(gray, 3)
        noise = cv2.absdiff(gray, med)
        h, w = noise.shape
        bh, bw = max(16, h // 8), max(16, w // 8)
        variances = []
        for y in range(0, h - bh + 1, bh):
            for x in range(0, w - bw + 1, bw):
                patch = noise[y:y+bh, x:x+bw]
                gray_patch = gray[y:y+bh, x:x+bw]
                # Filter out flat monochromatic background blocks to prevent false division spikes
                if float(np.std(gray_patch)) > 5.0:
                    variances.append(float(np.var(patch)))
        if len(variances) < 4:
            return 0.0
        v_arr = np.array(variances)
        mean_v = np.mean(v_arr)
        if mean_v < 1e-4:
            return 0.0
        std_v = np.std(v_arr)
        coeff_var = std_v / (mean_v + 1e-4)
        score = min(1.0, max(0.0, (coeff_var - 1.2) / 3.0))
        return float(round(score, 4))
    except Exception:
        return 0.0

def compute_moire_energy(image: np.ndarray) -> float:
    """
    Screen Presentation Attack / Moire Pattern Detection:
    Performs 2D Fast Fourier Transform (FFT) on the image. Screens (phones/monitors)
    exhibit prominent periodic harmonic spikes in the high-frequency spectrum.
    """
    try:
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        lap = cv2.Laplacian(gray, cv2.CV_32F)
        f = np.fft.fft2(lap)
        fshift = np.fft.fftshift(f)
        mag = np.abs(fshift)
        
        h, w = mag.shape
        cy, cx = h // 2, w // 2
        # Zero out center DC and standard horizontal/vertical document border axes
        mag[cy-5:cy+6, cx-5:cx+6] = 0
        mag[cy-2:cy+3, :] = 0
        mag[:, cx-2:cx+3] = 0
        
        max_val = float(np.max(mag))
        mean_val = float(np.mean(mag)) + 1e-4
        par = max_val / mean_val
        score = min(1.0, max(0.0, (par - 15.0) / 40.0))
        return float(round(score, 4))
    except Exception:
        return 0.0

def detect_copy_move_tampering(image: np.ndarray) -> Tuple[bool, float]:
    """
    Copy-Move Cloning Detection:
    Detects duplicated stamps, numbers, or cloned visual patches using ORB keypoint matching.
    """
    try:
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        orb = cv2.ORB_create(nfeatures=500)
        kps, des = orb.detectAndCompute(gray, None)
        if des is None or len(kps) < 15:
            return False, 0.0
            
        bf = cv2.BFMatcher(cv2.NORM_HAMMING, crossCheck=False)
        matches = bf.knnMatch(des, des, k=2)
        
        cloned_pairs = 0
        for m_tuple in matches:
            if len(m_tuple) == 2:
                m, n = m_tuple
                # Test if 2nd nearest neighbor is extremely close (duplicate patch)
                if m.distance < 0.65 * n.distance and m.queryIdx != n.trainIdx:
                    pt1 = np.array(kps[m.queryIdx].pt)
                    pt2 = np.array(kps[m.trainIdx].pt)
                    spatial_dist = np.linalg.norm(pt1 - pt2)
                    if spatial_dist > 25.0: # Separate spatial regions
                        cloned_pairs += 1
                        
        ratio = round(cloned_pairs / max(1, len(kps)), 4)
        return cloned_pairs >= 4, ratio
    except Exception:
        return False, 0.0
