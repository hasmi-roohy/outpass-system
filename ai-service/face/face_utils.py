import os
import cv2
import uuid
import numpy as np
from deepface import DeepFace
import base64
import cloudinary
import cloudinary.uploader
import cloudinary.api
from dotenv import load_dotenv

load_dotenv()

# ─────────────────────────────────────
# Cloudinary config
# ─────────────────────────────────────
cloudinary.config(
    cloud_name = os.getenv('CLOUDINARY_CLOUD_NAME'),
    api_key    = os.getenv('CLOUDINARY_API_KEY'),
    api_secret = os.getenv('CLOUDINARY_API_SECRET'),
    secure     = True
)

# ─────────────────────────────────────
# Local fallback dirs (for DeepFace verify)
# We still save locally for fast verification
# but ALSO backup to Cloudinary
# ─────────────────────────────────────
STUDENT_FACES_DIR = os.path.join("face", "known_faces", "students")
PARENT_FACES_DIR  = os.path.join("face", "known_faces", "parents")
TEMP_DIR          = os.path.join("face", "temp")

# Create temp dir on startup
os.makedirs(TEMP_DIR, exist_ok=True)

# ─────────────────────────────────────
# Warm up DeepFace model on startup
# ─────────────────────────────────────
def warmup_model():
    try:
        print("⏳ Warming up DeepFace model...")
        blank       = np.zeros((100, 100, 3), dtype=np.uint8)
        warmup_path = os.path.abspath(os.path.join(TEMP_DIR, "warmup.jpg"))
        cv2.imwrite(warmup_path, blank)
        DeepFace.verify(
            img1_path         = warmup_path,
            img2_path         = warmup_path,
            model_name        = "VGG-Face",
            enforce_detection = False
        )
        if os.path.exists(warmup_path):
            os.remove(warmup_path)
        print("✅ DeepFace model warmed up and ready")
    except Exception as e:
        print(f"⚠️ Warmup warning (non-fatal): {e}")

warmup_model()

# ─────────────────────────────────────
# Helper — base64 to image
# ─────────────────────────────────────
def base64_to_image(base64_string):
    try:
        if "," in base64_string:
            base64_string = base64_string.split(",")[1]
        img_bytes = base64.b64decode(base64_string)
        img_array = np.frombuffer(img_bytes, dtype=np.uint8)
        img       = cv2.imdecode(img_array, cv2.IMREAD_COLOR)
        return img
    except Exception as e:
        print(f"❌ base64_to_image error: {e}")
        return None

# ─────────────────────────────────────
# Upload image to Cloudinary
# ─────────────────────────────────────
def upload_to_cloudinary(img_path, public_id):
    try:
        result = cloudinary.uploader.upload(
            img_path,
            public_id       = public_id,
            folder          = "outpass_faces",
            overwrite       = True,
            resource_type   = "image"
        )
        print(f"✅ Cloudinary upload: {result['secure_url']}")
        return result['secure_url']
    except Exception as e:
        print(f"⚠️ Cloudinary upload failed (non-fatal): {e}")
        return None

# ─────────────────────────────────────
# Download face from Cloudinary if missing locally
# ─────────────────────────────────────
def ensure_local_face(stored_path, cloudinary_id):
    if os.path.exists(stored_path):
        return True

    try:
        import urllib.request
        # Build Cloudinary URL
        url = cloudinary.CloudinaryImage(cloudinary_id).build_url()
        os.makedirs(os.path.dirname(stored_path), exist_ok=True)
        urllib.request.urlretrieve(url, stored_path)
        print(f"✅ Downloaded face from Cloudinary: {stored_path}")
        return True
    except Exception as e:
        print(f"❌ Could not download from Cloudinary: {e}")
        return False

# ─────────────────────────────────────
# Register face — save locally + Cloudinary
# ─────────────────────────────────────
def register_face(base64_image, student_id, face_type="student", parent_index=None):
    try:
        img = base64_to_image(base64_image)
        if img is None:
            return { "success": False, "message": "Invalid image" }

        # ── Build local path ──
        if face_type == "student":
            folder   = os.path.join(STUDENT_FACES_DIR, student_id)
            filename = "photo.jpg"
            cloudinary_id = f"students/{student_id}/photo"
        else:
            folder   = os.path.join(PARENT_FACES_DIR, student_id)
            filename = f"parent_{parent_index}.jpg"
            cloudinary_id = f"parents/{student_id}/parent_{parent_index}"

        os.makedirs(folder, exist_ok=True)
        img_path = os.path.abspath(os.path.join(folder, filename))

        # ── Save locally ──
        cv2.imwrite(img_path, img)
        print(f"✅ Face saved locally: {img_path}")

        # ── Backup to Cloudinary ──
        cloudinary_url = upload_to_cloudinary(img_path, cloudinary_id)

        return {
            "success":       True,
            "message":       "Face registered successfully",
            "cloudinary_url": cloudinary_url
        }

    except Exception as e:
        print(f"❌ register_face error: {e}")
        return { "success": False, "message": str(e) }

# ─────────────────────────────────────
# Verify face — with race condition fix
# ─────────────────────────────────────
def verify_face(base64_image, student_id, face_type="student", parent_index=None):
    # ← Unique temp file per request — fixes race condition
    temp_filename = f"scan_{uuid.uuid4().hex}.jpg"
    temp_path     = os.path.abspath(os.path.join(TEMP_DIR, temp_filename))

    try:
        img = base64_to_image(base64_image)
        if img is None:
            return { "matched": False, "confidence": 0 }

        cv2.imwrite(temp_path, img)

        # ── Build stored path ──
        if face_type == "student":
            stored_path   = os.path.join(STUDENT_FACES_DIR, student_id, "photo.jpg")
            cloudinary_id = f"outpass_faces/students/{student_id}/photo"
        else:
            stored_path   = os.path.join(
                PARENT_FACES_DIR, student_id, f"parent_{parent_index}.jpg"
            )
            cloudinary_id = f"outpass_faces/parents/{student_id}/parent_{parent_index}"

        stored_path = os.path.abspath(stored_path)

        print(f"🔍 Looking for face at: {stored_path}")

        # ── If not local, try downloading from Cloudinary ──
        if not os.path.exists(stored_path):
            print(f"⚠️ Local face not found, trying Cloudinary...")
            found = ensure_local_face(stored_path, cloudinary_id)
            if not found:
                print(f"❌ Face not found anywhere: {stored_path}")
                return {
                    "matched":   False,
                    "confidence": 0,
                    "message":   "No face registered for this person"
                }

        print(f"✅ Found face, verifying...")

        result = DeepFace.verify(
            img1_path         = temp_path,
            img2_path         = stored_path,
            model_name        = "VGG-Face",
            enforce_detection = False,
            distance_metric   = "cosine",
            threshold         = 0.50
        )

        matched    = result["verified"]
        distance   = result["distance"]
        confidence = round((1 - distance) * 100, 2)

        print(f"📊 Distance:   {round(distance, 4)}")
        print(f"📊 Confidence: {confidence}%")
        print(f"📊 Matched:    {matched}")

        return {
            "matched":    matched,
            "confidence": confidence
        }

    except Exception as e:
        print(f"❌ verify_face error: {e}")
        return { "matched": False, "confidence": 0 }

    finally:
        # ← Always clean up temp file
        if os.path.exists(temp_path):
            os.remove(temp_path)