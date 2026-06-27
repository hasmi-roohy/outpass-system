# Outpass Management System

Role-based college outpass management system for student movement requests,
warden review, parent approval, gate face scanning, scan logs, and admin
operations.

## Features

- Student outpass application and request history
- One active outpass per student
- Maximum 6 used outpasses per student per month
- Warden 1 review, reject, forward-to-parent, call approve, and cancel actions
- Parent approval/rejection from one-click email links
- Warden 2 gate scanner for exit and return face verification
- Manual gate override after a failed face scan with a required reason
- Admin dashboards for students, wardens, outpasses, scan logs, and assignments
- Missing Warden 1 / Warden 2 assignment warnings for admins
- Pagination for larger admin and outpass lists
- Student chatbot for common outpass questions
- Scheduled cleanup for no parent response, expired outpasses, and late returns

## Roles

| Role | Main Access |
| --- | --- |
| Student | Apply, cancel eligible requests, track status |
| Warden 1 | Review assigned students, forward to parents, call approve, cancel |
| Warden 2 | Search assigned students, scan exit and return, manual override |
| Parent | Approve or decline from secure email links |
| Admin | Manage users, assignments, all outpasses, and scan logs |

## Workflow

```text
Student applies
  -> Warden 1 reviews
  -> Warden 1 forwards email links to parents
  -> Parent approves or declines
  -> Warden 2 scans student face at exit
  -> Warden 2 scans student face at return
```

Normal status flow:

```text
pending -> warden_forwarded -> approved -> out -> returned
```

Other possible statuses:

```text
rejected, cancelled, expired, late_return
```

## Tech Stack

| Area | Technology |
| --- | --- |
| Frontend | React, Vite, React Router, Axios |
| Backend | Node.js, Express, Mongoose |
| Database | MongoDB |
| AI Service | Python, FastAPI, DeepFace, OpenCV |
| Email | Nodemailer with Gmail app password |
| Auth | JWT with role-based authorization |
| Scheduler | node-cron |
| Image Backup | Cloudinary |

## Project Structure

```text
outpass-system/
|-- client/       React frontend
|-- server/       Express API, models, controllers, routes
|-- ai-service/   FastAPI face recognition and chatbot service
|-- README.md
```

## Prerequisites

- Node.js and npm
- Python 3
- MongoDB local or MongoDB Atlas
- Gmail app password for `EMAIL_PASS`
- Cloudinary account for face image backup

## Environment Files

Create `client/.env`:

```env
VITE_API_URL=http://localhost:5000/api
```

Create `server/.env`:

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/outpass-system
JWT_SECRET=replace_with_a_long_random_secret
CLIENT_URL=http://localhost:5173
SERVER_URL=http://localhost:5000
AI_SERVICE_URL=http://localhost:8000
AI_SERVICE_API_KEY=replace_with_same_key_as_ai_service_if_used
EMAIL_USER=your_gmail_address
EMAIL_PASS=your_gmail_app_password
SMTP_TLS_REJECT_UNAUTHORIZED=false
```

Create `ai-service/.env`:

```env
EXPRESS_URL=http://localhost:5000
AI_SERVICE_API_KEY=replace_with_same_key_as_server_if_used
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
FACE_MODEL=Facenet512
FACE_DETECTOR=opencv
FACE_DISTANCE_METRIC=cosine
FACE_THRESHOLD=
FACE_MIN_SIZE=160
FACE_MIN_BLUR=25
FACE_MIN_BRIGHTNESS=35
FACE_MAX_BRIGHTNESS=220
FACE_MAX_DIMENSION=900
```

Never commit `.env` files or real credentials.

## Setup

```powershell
cd client
npm install
cd ..\server
npm install
cd ..\ai-service
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

## Run Locally

Open three terminals:

```powershell
# Terminal 1
cd ai-service
.\venv\Scripts\Activate.ps1
uvicorn main:app --reload --port 8000
```

```powershell
# Terminal 2
cd server
npm run dev
```

```powershell
# Terminal 3
cd client
npm run dev
```

Open:

```text
http://localhost:5173
```

## Important Local Email Note

Parent approval email buttons use `SERVER_URL`.

For same-laptop testing:

```env
SERVER_URL=http://localhost:5000
```

If a parent opens the email on another phone or laptop, `localhost` will not
point to your backend. Use a deployed backend or your laptop's LAN IP on the
same Wi-Fi.

## Main URLs

| Service | URL |
| --- | --- |
| Frontend | `http://localhost:5173` |
| Backend API | `http://localhost:5000/api` |
| Backend health | `http://localhost:5000/health` |
| AI service | `http://localhost:8000` |
| FastAPI docs | `http://localhost:8000/docs` |

## Checks

```powershell
cd server
npm test
cd client
npm run build
npm run lint
cd ..
python -m py_compile ai-service/face/face_utils.py ai-service/routes/face.py ai-service/main.py
```

Check duplicate active outpasses:

```powershell
cd server
npm run check:active-duplicates
```

## Production Notes

- Use MongoDB Atlas or another hosted MongoDB for deployed backend.
- Set `SERVER_URL` to the deployed backend URL so parent email buttons work.
- Set `CLIENT_URL` to the deployed frontend URL.
- Use strong `JWT_SECRET`.
- Keep `.env` values only in the hosting provider environment settings.
- Gmail SMTP is acceptable for demos, but a transactional email provider is
  better for real production.
- Face recognition quality depends on lighting, camera quality, and the
  registered reference image.

## Git Safety

The repository ignores:

```gitignore
.env
**/.env
node_modules/
**/node_modules/
dist/
**/dist/
venv/
**/venv/
__pycache__/
**/__pycache__/
**/face/known_faces/
**/face/temp/
```

If any secret was ever pushed to GitHub, rotate that secret. `.gitignore` only
prevents future tracking.

## Current Test Status

Last local checks performed:

- Backend tests passed
- Frontend production build passed
- AI service Python compile check passed

## License

No license has been selected yet.
