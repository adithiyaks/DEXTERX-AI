<div align="center">
  <img width="247" height="59" alt="Screenshot 2026-05-12 172125" src="https://github.com/user-attachments/assets/f2379f46-f04e-4194-905e-b66fb57c7bea" />

  
  <h1>DEXTERX AI // FORENSIC TRIAGE ENGINE</h1>
  <p>A multimodal, real-time investigation platform for law enforcement and first responders.</p>

  <img src="https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white" />
  <img src="https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=FastAPI&logoColor=white" />
  <img src="https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white" />
  <img src="https://img.shields.io/badge/YOLOv8-FF0000?style=for-the-badge&logo=ultralytics&logoColor=white" />
  <img src="https://img.shields.io/badge/Flutter-02569B?style=for-the-badge&logo=flutter&logoColor=white" />
  <img src="https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white" />
</div>

<br />

## 🚨 Overview

DEXTERX is a unified forensic intelligence system designed to ingest chaotic crime scene data and output structured tactical directives. By fusing **Thermodynamic Time-of-Death (ToD) algorithms** with **YOLOv8 Computer Vision** and a **Large Language Model (Qwen)**, DEXTERX autonomously cross-references biological realities with digital footprints to catch witness contradictions in real-time.

---

## 📸 System Interface

> *Note to developers: Replace the placeholder image links below with your actual project screenshots. Drop the image files into your repo (e.g., in a `/docs/images` folder) and update the paths.*

### 1. The Command Dashboard
The master triage view featuring the 3D biological hologram and the AI insight panels.


<img width="1920" height="1080" alt="Screenshot (126)" src="https://github.com/user-attachments/assets/008e7f03-3d1d-44e1-9b98-a032cc402bc9" />


<br/>

### 2. Digital Correlation Node Graph
Force-directed network graph mapping suspects, victims, cameras, and physical evidence.

<img width="312" height="257" alt="Screenshot 2026-05-12 172409" src="https://github.com/user-attachments/assets/c4b2b648-9a14-46df-8304-4167b9e92ccd" />


### 3. DEXTERX Field Agent (Mobile App)
The Flutter companion app for on-scene first responders featuring voice dictation and CCTV upload.

<img width="500" height="1200" alt="Mobile App Screenshot" src="https://github.com/user-attachments/assets/12a07fb6-fd04-4be1-8c9e-22febf5e5c64" />

<br/>

---

## ✨ Core Features

* **Omni-Scene Ingestion:** Accepts field text reports, autopsy PDFs, and raw `.mp4` CCTV footage simultaneously.
* **Biological Triage Engine:** Calculates highly accurate Time of Death windows using Newton's Law of Cooling (Hepatic vs. Ambient delta).
* **YOLOv8 Video Intercept:** Frame-by-frame object tracking to automatically extract suspects, vehicles, and weapons from security footage.
* **Automated Contradiction Detection:** The cognitive engine flags discrepancies between mathematical ToD and witness testimony.
* **Tactical Action Plan (TAP):** Generates actionable interrogation questions and perimeter directives for officers on the ground.

---

## 🏗️ System Architecture

DEXTERX utilizes a **Split Architecture** deployment for maximum performance and stability during heavy AI workloads.

* **Frontend (Vercel):** Next.js App Router, Tailwind CSS, Framer Motion, Recharts, React Force Graph.
* **Backend (Railway/Render):** Python FastAPI, Ultralytics (YOLOv8), PyMuPDF, psycopg2.
* **Cognitive Engine:** Qwen 2.5 7B Instruct (via Featherless AI).
* **Database:** PostgreSQL (JSONB schema).
* **Mobile Agent:** Flutter, Camera, Speech-to-Text.

---

## 🚀 Quick Start / Installation

### Prerequisites
* Python 3.10+
* Node.js 18+
* Flutter SDK

### 1. Backend Setup (FastAPI)
```bash
# Navigate to the backend root directory (where main.py is located)
# Create and activate virtual environment
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate

# Install requirements
pip install -r requirements.txt

# Run the server
uvicorn main:app --reload

## 2. Frontend Setup (Next.js)

> Assumes you are inside the `aiventra` frontend directory.

### Install Dependencies

```bash
# Navigate to frontend directory
cd aiventra

# Install npm packages
npm install
```

### Configure Environment Variables

Create a `.env.local` file for local development.

```bash
cat <<EOF > .env.local
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000
EOF
```

> Replace the URL if your backend is hosted elsewhere.

### Start the Frontend Server

```bash
npm run dev
```

The frontend will usually run at:

```text
http://localhost:3000
```

---

## 3. Mobile Setup (Flutter)

> Assumes your Flutter project is inside the `field_agent` directory.

### Install Dependencies

```bash
# Navigate to Flutter project
cd field_agent

# Clean previous builds
flutter clean

# Install packages
flutter pub get
```

### Optional: Generate Launcher Icons

```bash
flutter pub run flutter_launcher_icons
```

### Run the Mobile App

```bash
# Launch app on connected device/emulator
flutter run
```

---

## 4. Backend Environment Variables

Create a `.env` file in the backend root directory.

```bash
cat <<EOF > .env
# Featherless AI Configuration
FEATHERLESS_API_KEY=your_featherless_api_key_here

# PostgreSQL Database Configuration
# Format:
# postgresql://<user>:<password>@<host>:<port>/<dbname>

DATABASE_URL=postgresql://postgres:password@localhost:5432/dexterx

# Optional Server Port
PORT=8000
EOF
```

---

## 5. Secure Your Secrets

Prevent leaking API keys and credentials by adding `.env` to `.gitignore`.

```bash
echo ".env" >> .gitignore
```

---

## ✅ Project Services

| Service | Default URL |
|---|---|
| Backend (FastAPI) | `http://127.0.0.1:8000` |
| Frontend (Next.js) | `http://localhost:3000` |
| Flutter App | Runs on emulator/device |

---

## ✅ Final Notes

- Ensure PostgreSQL is running before starting the backend.
- Replace placeholder credentials with actual values.
- Keep API keys private and never commit them to GitHub.
- Start the backend before running the frontend or Flutter app.

---
