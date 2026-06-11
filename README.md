# Outpass Management System

A role-based college outpass management application that handles student leave
requests, warden review, parent approval, and gate entry/exit verification.

The system includes face recognition for students and parents, email-based
approval links, role-based dashboards, scan logs, and a student chatbot.

## Features

### Student

- Apply for an outpass with destination, reason, dates, and times
- Track current and previous outpass requests
- View approval status
- Ask the chatbot about outpass-related questions

### Warden 1

- Review assigned students' outpass requests
- Forward requests to parents or reject them
- View requests with no parent response
- Approve after confirming with a parent by phone
- View the complete outpass history of assigned students

### Parent

- Open a unique approval link received by email
- Verify identity using face recognition
- Approve or reject the outpass request

### Warden 2 / Gate Warden

- Search for an approved outpass using the student's roll number
- Verify the student's face when leaving and returning
- Record exit and return scan logs
- Apply a documented manual override when face verification fails

### Admin

- Manage students, wardens, and admins
- Assign wardens to students
- Register student and parent faces
- View dashboard statistics, all outpasses, and scan logs

## Outpass Workflow

```text
Student submits request
        |
        v
Warden 1 reviews request
        |
        v
Request is forwarded to parents
        |
        v
Parent verifies face and responds
        |
        v
Approved student completes exit face scan
        |
        v
Student completes return face scan
```

The normal status flow is:

```text
pending -> warden_forwarded -> approved -> out -> returned
```

An outpass may also become `rejected`, `cancelled`, `expired`, or
`late_return`.

## Architecture

```text
React + Vite client
        |
        v
Node.js + Express API
        |
        +---- MongoDB
        |
        +---- FastAPI AI service
                 |
                 +---- DeepFace face recognition
                 +---- Intent-based chatbot
```

## Technology Stack

- **Frontend:** React, Vite, React Router, Axios
- **Backend:** Node.js, Express, MongoDB, Mongoose
- **Authentication:** JSON Web Tokens and role-based authorization
- **AI service:** Python, FastAPI, DeepFace, OpenCV, scikit-learn
- **Face image storage:** Local storage with Cloudinary backup
- **Email notifications:** Nodemailer with Gmail
- **Scheduled tasks:** Node Cron

## Project Structure

```text
outpass-system/
|-- client/       # React frontend
|-- server/       # Express API and MongoDB models
|-- ai-service/   # FastAPI face recognition and chatbot service
`-- README.md
```

## Prerequisites

Install the following before running the project:

- Node.js and npm
- Python 3 and pip
- MongoDB, either locally or through MongoDB Atlas
- A Gmail account with an app password for email notifications
- A Cloudinary account for face image backup

## Environment Variables

Create `server/.env`:

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_long_random_secret
CLIENT_URL=http://localhost:5173
AI_SERVICE_URL=http://localhost:8000
EMAIL_USER=your_email_address
EMAIL_PASS=your_gmail_app_password
```

Create `ai-service/.env`:

```env
EXPRESS_URL=http://localhost:5000
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
```

> Never commit `.env` files, passwords, API keys, face images, or other
> personal data to GitHub.

## Installation

### 1. Install frontend dependencies

```powershell
cd client
npm install
```

### 2. Install backend dependencies

```powershell
cd ..\server
npm install
```

### 3. Install AI service dependencies

```powershell
cd ..\ai-service
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
pip install cloudinary python-dotenv
```

## Running the Application

Open three PowerShell terminals from the project root.

### Terminal 1: AI service

```powershell
cd ai-service
.\venv\Scripts\Activate.ps1
uvicorn main:app --reload --port 8000
```

### Terminal 2: Express server

```powershell
cd server
npm run dev
```

### Terminal 3: React client

```powershell
cd client
npm run dev
```

Open `http://localhost:5173` in a browser.

## API Services

| Service | Default URL |
| --- | --- |
| React client | `http://localhost:5173` |
| Express API | `http://localhost:5000` |
| Express health check | `http://localhost:5000/health` |
| FastAPI service | `http://localhost:8000` |
| FastAPI documentation | `http://localhost:8000/docs` |

## Automatic Checks

The Express server runs scheduled checks to:

- Alert Warden 1 when parents have not responded within one hour
- Mark approved outpasses as expired after their expiry time
- Mark students who have not returned by the expiry time as late returns

## Security Before Pushing to GitHub

The current project contains local environment files and generated face data.
Before publishing the repository, ensure these patterns are in `.gitignore`:

```gitignore
.env
**/.env
node_modules/
**/node_modules/
venv/
**/venv/
__pycache__/
**/__pycache__/
**/face/known_faces/
**/face/temp/
```

If an `.env` file has already been committed, adding it to `.gitignore` is not
enough. Remove it from Git tracking and rotate every exposed secret before
publishing the repository.

## Current Limitations

- The project is intended as a prototype and should receive a security review
  before production deployment.
- Face recognition quality depends on lighting, camera quality, and the
  registered reference image.
- Email delivery depends on Gmail credentials and sending limits.
- Automated tests have not yet been added.

## License

This project is currently unlicensed. Add a license before distributing or
accepting external contributions.
