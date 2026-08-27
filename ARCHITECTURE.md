# ARCHITECTURE.md — Rural Healthcare Continuity System

## 1. Tech Stack (100% free tier)

| Layer | Choice | Why |
|---|---|---|
| Frontend | React (Vite) + TailwindCSS + shadcn/ui | Fast dev, free, great component reuse across 3 dashboards |
| State/Data fetching | React Query (TanStack Query) | Caching, loading/error states out of the box |
| Backend | Node.js + Express | Simple, huge free ecosystem, easy AI/DB integration |
| Database | MongoDB Atlas (M0 free cluster) via Mongoose | Free, flexible schema fits medical records well |
| Auth | JWT + bcrypt | Free, no vendor dependency |
| AI Chatbot | Google Gemini API (`gemini-2.0-flash` or `gemini-1.5-flash`) — **free tier** | Free key, strong structured-output/JSON mode, good reasoning for symptom triage |
| Voice (STT/TTS) | Browser **Web Speech API** (`SpeechRecognition` + `SpeechSynthesis`) | Zero cost, zero key, built into Chrome/Edge |
| Video calling | PeerJS (WebRTC) | Free, no signaling server cost for small scale |
| Real-time queue updates | Socket.IO | Free, simple pub/sub for queue position + priority updates |
| PDF generation | `pdfkit` (Node) | Free, generates prescriptions/reports server-side |
| File/report storage | MongoDB GridFS or local `/uploads` (Cloudinary free tier optional) | No cost |
| Email (optional) | Nodemailer + Gmail app password | Free |
| Hosting (demo) | Frontend: Vercel/Netlify free — Backend: Render free tier — DB: MongoDB Atlas free | $0 to run |

## 2. High-Level System Diagram (described)

```
                        ┌─────────────────────────┐
                        │        Frontend          │
                        │  React + Tailwind (SPA)  │
                        │  Patient / Doctor / Admin│
                        │        dashboards        │
                        └────────────┬─────────────┘
                                     │ REST (Axios) + Socket.IO
                        ┌────────────▼─────────────┐
                        │      Express API          │
                        │  /auth /patients /doctors  │
                        │  /appointments /queue      │
                        │  /ai /consultations        │
                        │  /prescriptions /reports   │
                        │  /admin                    │
                        └───┬───────────┬───────────┘
                            │           │
              ┌─────────────▼───┐   ┌───▼───────────────┐
              │ MongoDB Atlas    │   │ Gemini API         │
              │ (Mongoose models)│   │ (symptom triage,   │
              │                  │   │  case summaries)   │
              └──────────────────┘   └────────────────────┘
                            │
                 ┌──────────▼───────────┐
                 │ Browser Web Speech    │
                 │ API (client-side STT/ │
                 │ TTS, no server hop)   │
                 └───────────────────────┘
```

## 3. Folder Structure

```
rural-healthcare-system/
├── client/                      # React frontend
│   ├── src/
│   │   ├── assets/
│   │   ├── components/
│   │   │   ├── ui/               # shadcn components
│   │   │   ├── common/           # Navbar, Sidebar, PriorityBadge, etc.
│   │   ├── features/
│   │   │   ├── auth/
│   │   │   ├── patient/          # dashboard, find-doctor, appointments, ai-assistant, records
│   │   │   ├── doctor/           # dashboard, queue, patient-history, prescriptions
│   │   │   ├── admin/            # doctor-review, platform-stats
│   │   ├── hooks/
│   │   ├── lib/                  # axios instance, socket instance
│   │   ├── context/              # AuthContext
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── .env                      # VITE_API_URL
│   └── package.json
│
├── server/                       # Node/Express backend
│   ├── src/
│   │   ├── config/               # db.js, gemini.js
│   │   ├── models/                # User, Doctor, Patient, Appointment,
│   │   │                            Queue, Consultation, Prescription,
│   │   │                            Report, MedicineRequest, AISession
│   │   ├── controllers/
│   │   ├── routes/
│   │   ├── middleware/            # auth.js (JWT), role.js, errorHandler.js
│   │   ├── services/              # geminiService.js, pdfService.js, priorityEngine.js
│   │   ├── sockets/                # queueSocket.js
│   │   └── server.js
│   ├── .env                       # MONGO_URI, JWT_SECRET, GEMINI_API_KEY
│   └── package.json
│
└── docs/                          # PRD.md, DESIGN.md, ARCHITECTURE.md, BRAIN.md
```

## 4. Core Database Models (Mongoose, simplified)

**User** (base auth): `_id, name, email, passwordHash, role [patient|doctor|admin], phone, language, createdAt`

**DoctorProfile**: `userId, specialization, qualifications, licenseNumber, verificationStatus [pending|approved|rejected], availability[], rating, createdAt`

**Appointment**: `patientId, doctorId, type [checkup|followup|telemedicine], date, timeSlot, status [requested|confirmed|completed|cancelled]`

**QueueEntry**: `patientId, doctorId, appointmentId (optional), joinedAt, status [waiting|in-consult|done], position`

**AISession**: `patientId, messages[] {role, text, timestamp}, symptomsSummary, redFlags[], suggestedPriority [high|medium|routine], status [in-progress|handed-off]`

**Consultation**: `patientId, doctorId, aiSessionId (optional), notes, finalPriority, date`

**Prescription**: `consultationId, patientId, doctorId, medicines[] {name, dosage, instructions}, createdAt`

**Report**: `patientId, doctorId, consultationId, title, fileUrl/fileRef, createdAt`

**MedicineRequest**: `patientId, prescriptionId, requestedMedicines[], status [pending|fulfilled], createdAt`

## 5. Key API Routes (REST)

```
POST   /api/auth/signup                 (role: patient/doctor)
POST   /api/auth/login
GET    /api/auth/me

GET    /api/doctors                     (list approved doctors, filter by specialization)
POST   /api/doctors/apply               (doctor submits verification)
PATCH  /api/admin/doctors/:id/status    (approve/reject/deactivate — admin only)

POST   /api/appointments                (book appointment)
GET    /api/appointments/mine
POST   /api/queue/join
GET    /api/queue/:doctorId             (live queue, also pushed via Socket.IO)

POST   /api/ai/chat                     (send message → Gemini → structured response)
POST   /api/ai/session/:id/handoff      (finalize summary, send to doctor)

GET    /api/patients/:id/history        (doctor/patient/admin, role-checked)
POST   /api/consultations
PATCH  /api/consultations/:id/priority  (doctor overrides AI priority)

POST   /api/prescriptions
POST   /api/reports                     (generates PDF via pdfService)
GET    /api/reports/:id/download

POST   /api/medicine-requests
GET    /api/admin/stats                 (platform counts)
```

## 6. Gemini Integration Pattern (symptom triage)

Server-side `geminiService.js` sends a system-style prompt instructing Gemini to:
1. Ask structured follow-up questions (one at a time).
2. Detect red-flag keywords/symptoms.
3. Never output a diagnosis or medicine name.
4. On completion, return **strict JSON**: `{ summary, duration, redFlags: [], suggestedPriority: "high"|"medium"|"routine" }`.

This JSON is what populates the doctor's priority queue — the doctor can always override it (stored separately as `finalPriority` on the Consultation).

## 7. Environment Variables (`.env`, never commit)

```
# server/.env
MONGO_URI=your_mongodb_atlas_connection_string
JWT_SECRET=your_random_secret
GEMINI_API_KEY=your_free_gemini_api_key
CLIENT_URL=http://localhost:5173
PORT=5000

# client/.env
VITE_API_URL=http://localhost:5000/api
```

## 8. Security Checklist
- Role middleware on every protected route (`requireRole('doctor')`, etc.).
- Patient medical data only queryable by: that patient, their assigned doctor, and admin.
- Rate-limit `/api/ai/chat` (e.g., `express-rate-limit`) to protect the free Gemini quota.
- Validate all inputs (`zod`) before hitting the DB or Gemini.
