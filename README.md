# AI Rural Healthcare System

A comprehensive, AI-driven healthcare platform designed specifically for rural and low-resource environments. This system bridges the gap between field workers (ASHAs), patients, and doctors using cutting-edge AI triage, offline-first capabilities, and multilingual voice interfaces.

## 🌟 Key Features (Phase 1 & Phase 2)

### 1. Multilingual Voice AI Triage
Patients can interact with the AI assistant in **12 different regional languages**. 
- **Voice-to-Text & Text-to-Speech:** Patients can speak to the AI in their native language and hear the responses read back to them.
- **Intelligent Triage:** The AI safely collects symptoms, duration, and severity.
- **Safety Boundary:** The AI is strictly prevented from diagnosing or prescribing. If it detects "Red Flag" symptoms (e.g., chest pain), it immediately escalates the priority to Critical and outputs a hardcoded emergency warning instead of generated text.
- **Symptom Quick-Select:** A horizontally scrollable row of chips allows patients to tap symptoms (with Red Flag symptoms visually outlined in red).

### 2. ASHA Worker Offline-First Field App
ASHA (Accredited Social Health Activist) workers are the backbone of rural healthcare.
- **Offline Registration & Reporting:** ASHAs can register new patients, log vital signs, and upload photos of physical symptoms or local test reports even with **zero internet connection**.
- **Background Sync:** The app uses a Service Worker and IndexedDB to securely queue all data locally. The moment the device reconnects to the internet, the queue silently syncs to the server.
- **Village Patient Lists:** ASHAs can view the complete list of residents they are responsible for in their assigned village.

### 3. Doctor Priority Dashboard & Village Filtering
Doctors face overwhelming patient loads. The dashboard helps them focus on the most critical cases first.
- **AI-Powered Priority Queue:** Patients are automatically sorted into Routine, Medium, High, or Critical based on the AI's triage summary.
- **Village-Level Filtering:** Doctors can filter the queue by specific villages to coordinate care or spot local outbreaks.
- **Comprehensive Patient History:** The drawer opens to reveal a tabbed interface containing:
  - AI Consultation Summaries
  - ASHA Field Records (including vital signs and photo uploads)
  - Past Prescriptions

### 4. Automated SMS Reminders
Medication adherence is a major challenge in rural areas.
- **Cron Jobs:** A background job runs daily to check active prescriptions.
- **Twilio SMS:** The system automatically dispatches SMS reminders to patients to take their medicine or attend their follow-up appointments.

### 5. Admin Village Management
- Admins can create new Villages (District, State) and register ASHA workers.
- Admins assign ASHA workers to specific villages, ensuring correct data access and routing.

---

## 🚀 How to Run the Demo (End-to-End Script)

Follow this script to demonstrate the full capabilities of the system.

### Prerequisites
Make sure both servers are running:
1. Terminal 1 (Backend): `cd server && npm run dev`
2. Terminal 2 (Frontend): `cd client && npm run dev`
3. Ensure MongoDB Atlas is connected and Twilio credentials are in `.env`.

### Step 1: Admin Setup
1. Go to `http://localhost:5173/` and log in as the default admin (`admin@example.com` / `password`).
2. **Create a Village**: Go to the Admin Dashboard and add a village (e.g., "Malanpur").
3. **Register ASHA**: Create a new ASHA worker (e.g., "asha1@example.com").
4. **Assign ASHA**: Assign the newly created ASHA to the "Malanpur" village.
5. Log out.

### Step 2: ASHA Field Work (Offline Demonstration)
1. Log in as the ASHA worker (`asha1@example.com`).
2. **Go Offline:** Open Chrome DevTools (F12) -> Network tab -> Change "No throttling" to "Offline".
3. **Register Patient:** Notice the header says "Offline". Click "Register New Resident" under Malanpur.
4. Fill out the registration form for a new patient (e.g., "Ramesh") and submit. The toast will say "Saved offline".
5. **Upload Photo:** Go to Ramesh's profile and add a new Field Record. Upload a photo of a rash and log vitals. Submit.
6. **Go Online:** In DevTools, switch back to "No throttling". Within seconds, the header will turn green ("Online") and a toast will confirm "2 records synced successfully."
7. Log out.

### Step 3: Patient AI Triage (Multilingual & Voice)
1. Log in as the newly created patient (Ramesh).
2. Go to the **AI Symptom Assistant**.
3. **Language & Chips:** Change the language dropdown to **Hindi**. Notice the UI updates.
4. **Voice Input:** Click the microphone icon. Speak a symptom in Hindi (e.g., "मुझे बुखार है").
5. **Safety Boundary:** The AI will respond in Hindi and read it out loud. Next, click the **"Chest pain"** quick-select chip (outlined in red) and send it.
6. The AI will intercept this Red Flag and immediately output an URGENT WARNING, escalating the priority.
7. Click "Submit to Doctor". Log out.

### Step 4: Doctor Review & Prescription
1. Log in as the doctor (`doctor@example.com`).
2. **Dashboard:** You will see Ramesh at the very top of the list with a **CRITICAL** pulsing badge.
3. **Filters:** Use the Village dropdown to filter by "Malanpur".
4. **History:** Expand Ramesh's drawer. Click through the tabs:
   - **AI Consultations:** Shows the Hindi chat summary (translated/keyed in English for the doctor).
   - **ASHA Field Records:** Shows the vitals and the rash photo uploaded earlier.
5. **Prescribe:** Click "Start Telemedicine Consult". Write a prescription and set the duration to 5 days. Submit.

### Step 5: SMS Reminders
1. Open your terminal where the backend is running.
2. The cron job runs every minute (or as configured). Watch the console for `Running Daily Reminders Job`.
3. It will detect the active prescription and fire off an SMS to Ramesh's registered phone number via Twilio.

---

## 🛠 Tech Stack
- **Frontend:** React, Vite, Tailwind CSS, IndexedDB, Web Speech API
- **Backend:** Node.js, Express, MongoDB (Mongoose)
- **AI/LLM:** Google Gemini Flash
- **Cloud/Services:** Cloudinary (Photos), Twilio (SMS)
