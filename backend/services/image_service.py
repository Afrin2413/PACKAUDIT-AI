import cv2
import numpy as np
from PIL import Image
from pathlib import Path
from typing import Tuple, Dict, Any, Optional
import uuid
import os
from config import UPLOAD_DIR

class ImageService:
    def __init__(self):
        self.upload_dir = UPLOAD_DIR
        self.upload_dir.mkdir(parents=True, exist_ok=True)

    def save_uploaded_file(self, file_bytes: bytes, original_filename: str) -> Tuple[Path, str]:
        """Saves uploaded raw image to disk with a clean UUID filename."""
        ext = Path(original_filename).suffix.lower()
        if ext not in [".jpg", ".jpeg", ".png", ".webp", ".bmp"]:
            ext = ".jpg"
        
        file_id = f"pkg_{uuid.uuid4().hex[:12]}{ext}"
        target_path = self.upload_dir / file_id
        
        with open(target_path, "wb") as f:
            f.write(file_bytes)
            
        return target_path, file_id

    def preprocess_image(self, image_path: Path) -> Tuple[Path, Dict[str, Any]]:
        """
        Executes an advanced computer vision preprocessing pipeline:
        1. Resizing with aspect preservation
        2. Grayscale conversion
        3. CLAHE (Contrast Limited Adaptive Histogram Equalization)
        4. Bilateral filtering (noise reduction preserving edges)
        5. Morphological sharpening
        6. Adaptive thresholding for high-contrast text segmentation
        """
        try:
            # Read image using OpenCV
            img = cv2.imread(str(image_path))
            if img is None:
                # Fallback to PIL
                pil_img = Image.open(image_path)
                img = cv2.cvtColor(np.array(pil_img), cv2.COLOR_RGB2BGR)

            orig_h, orig_w = img.shape[:2]

            # 1. Resize if too large or too small for OCR optimal DPI
            target_max = 1600
            scale = 1.0
            if max(orig_h, orig_w) > target_max:
                scale = target_max / max(orig_h, orig_w)
                new_w, new_h = int(orig_w * scale), int(orig_h * scale)
                img_resized = cv2.resize(img, (new_w, new_h), interpolation=cv2.INTER_AREA)
            elif max(orig_h, orig_w) < 800:
                scale = 1200 / max(orig_h, orig_w)
                new_w, new_h = int(orig_w * scale), int(orig_h * scale)
                img_resized = cv2.resize(img, (new_w, new_h), interpolation=cv2.INTER_CUBIC)
            else:
                img_resized = img.copy()

            # 2. Grayscale
            gray = cv2.cvtColor(img_resized, cv2.COLOR_BGR2GRAY)

            # 3. CLAHE for contrast enhancement under variable lighting
            clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
            contrast_enhanced = clahe.apply(gray)

            # 4. Bilateral Filter for edge-preserving denoising
            denoised = cv2.bilateralFilter(contrast_enhanced, d=7, sigmaColor=50, sigmaSpace=50)

            # 5. Sharpening kernel
            kernel_sharpening = np.array([[-1, -1, -1], 
                                          [-1,  9, -1],
                                          [-1, -1, -1]])
            sharpened = cv2.filter2D(denoised, -1, kernel_sharpening)

            # 6. Adaptive thresholding for optimal character boundaries
            thresh = cv2.adaptiveThreshold(
                sharpened, 255, 
                cv2.ADAPTIVE_THRESH_GAUSSIAN_C, 
                cv2.THRESH_BINARY, 11, 2
            )

            # Save processed preview image
            stem = image_path.stem
            proc_filename = f"{stem}_processed.png"
            proc_path = self.upload_dir / proc_filename
            cv2.imwrite(str(proc_path), sharpened)

            meta = {
                "original_width": orig_w,
                "original_height": orig_h,
                "processed_width": img_resized.shape[1],
                "processed_height": img_resized.shape[0],
                "scale_factor": scale,
                "clahe_applied": True,
                "denoising_applied": True,
                "sharpening_applied": True
            }

            return proc_path, meta

        except Exception as e:
            print(f"Preprocessing error: {e}")
            return image_path, {"error": str(e)}

image_service_instance = ImageService()
