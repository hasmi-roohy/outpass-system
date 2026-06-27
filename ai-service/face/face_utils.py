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

FACE_MODEL = os.getenv("FACE_MODEL", "Facenet512")
FACE_DETECTOR = os.getenv("FACE_DETECTOR", "opencv")
FACE_DISTANCE_METRIC = os.getenv("FACE_DISTANCE_METRIC", "cosine")
FACE_THRESHOLD = os.getenv("FACE_THRESHOLD")
FACE_MIN_SIZE = int(os.getenv("FACE_MIN_SIZE", "160"))
FACE_MIN_BLUR = float(os.getenv("FACE_MIN_BLUR", "25"))
FACE_MIN_BRIGHTNESS = float(os.getenv("FACE_MIN_BRIGHTNESS", "35"))
FACE_MAX_BRIGHTNESS = float(os.getenv("FACE_MAX_BRIGHTNESS", "220"))
FACE_MAX_DIMENSION = int(os.getenv("FACE_MAX_DIMENSION", "900"))

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
            model_name        = FACE_MODEL,
            detector_backend  = FACE_DETECTOR,
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
def preprocess_image(img):
    height, width = img.shape[:2]
    largest_side = max(width, height)

    if largest_side > FACE_MAX_DIMENSION:
        scale = FACE_MAX_DIMENSION / largest_side
        img = cv2.resize(
            img,
            (int(width * scale), int(height * scale)),
            interpolation=cv2.INTER_AREA
        )

    lab = cv2.cvtColor(img, cv2.COLOR_BGR2LAB)
    l_channel, a_channel, b_channel = cv2.split(lab)
    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
    enhanced_l = clahe.apply(l_channel)
    enhanced = cv2.merge((enhanced_l, a_channel, b_channel))
    return cv2.cvtColor(enhanced, cv2.COLOR_LAB2BGR)

def validate_image_quality(img):
    height, width = img.shape[:2]
    if width < FACE_MIN_SIZE or height < FACE_MIN_SIZE:
        return False, "Image is too small. Move closer to the camera."

    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    brightness = float(np.mean(gray))
    if brightness < FACE_MIN_BRIGHTNESS:
        return False, "Image is too dark. Improve lighting and try again."
    if brightness > FACE_MAX_BRIGHTNESS:
        return False, "Image is too bright. Avoid strong backlight and try again."

    blur_score = float(cv2.Laplacian(gray, cv2.CV_64F).var())
    if blur_score < FACE_MIN_BLUR:
        return False, "Image is blurry. Hold still and try again."

    return True, ""

def detect_face_count(img):
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    cascade_path = os.path.join(cv2.data.haarcascades, "haarcascade_frontalface_default.xml")
    detector = cv2.CascadeClassifier(cascade_path)
    faces = detector.detectMultiScale(
        gray,
        scaleFactor=1.1,
        minNeighbors=5,
        minSize=(60, 60)
    )
    return len(faces)

def save_image(path, img):
    cv2.imwrite(path, img, [int(cv2.IMWRITE_JPEG_QUALITY), 95])

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

        img = preprocess_image(img)
        is_valid, quality_message = validate_image_quality(img)
        if not is_valid:
            return { "success": False, "message": quality_message }

        face_count = detect_face_count(img)
        if face_count == 0:
            return { "success": False, "message": "No clear face detected. Face the camera and try again." }
        if face_count > 1:
            return { "success": False, "message": "Multiple faces detected. Register one person at a time." }

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
        save_image(img_path, img)
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
            return { "matched": False, "confidence": 0, "message": "Invalid image" }

        img = preprocess_image(img)
        is_valid, quality_message = validate_image_quality(img)
        if not is_valid:
            return { "matched": False, "confidence": 0, "message": quality_message }

        face_count = detect_face_count(img)
        if face_count == 0:
            return { "matched": False, "confidence": 0, "message": "No clear face detected. Face the camera and try again." }
        if face_count > 1:
            return { "matched": False, "confidence": 0, "message": "Multiple faces detected. Scan only the student." }

        save_image(temp_path, img)

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

        verify_options = {
            "img1_path": temp_path,
            "img2_path": stored_path,
            "model_name": FACE_MODEL,
            "detector_backend": FACE_DETECTOR,
            "enforce_detection": True,
            "distance_metric": FACE_DISTANCE_METRIC
        }

        if FACE_THRESHOLD:
            verify_options["threshold"] = float(FACE_THRESHOLD)

        result = DeepFace.verify(**verify_options)

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
