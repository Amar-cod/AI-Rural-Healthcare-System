# ARCHITECTURE.md — Phase 2 Additions

**Extends the original ARCHITECTURE.md. Reuses existing auth, JWT, role-guard, Socket.IO, and Gemini-service infrastructure — this is additive, not a rebuild.**

## 1. New/Changed Tech Choices

| Need | Choice | Why |
|---|---|---|
| Translation | **No separate API** — Gemini itself, prompted in the target language | Fewer keys, fewer moving parts, Gemini already multilingual |
| Voice (multi-language) | Browser Web Speech API, `lang` parameter set per selection (e.g. `hi-IN`, `ta-IN`) | Free; support varies by language — must feature-detect |
| ASHA offline queue | IndexedDB (via `idb` library, free) in the browser for the ASHA dashboard only | Free, no backend cost, standard offline-first pattern |
| Push reminders | Web Push API (`web-push` npm package, free, uses VAPID keys you generate yourself — no paid service) | Free alternative to SMS |
| Photo/document storage | `server/uploads/asha/{villageId}/{patientId}/` locally, OR Cloudinary free tier if you want cloud storage | Matches existing local-storage pattern from Phase 5 prescriptions |
| File upload handling | `multer` (Node, free) with strict file size (e.g. 5MB) and MIME-type whitelist (jpg/png/pdf only) | Security requirement from the spec |
| QR code generation | `qrcode` npm package (free, local generation, no API) | For the stable patient Health ID |

## 2. New/Changed Database Models

**User** (extend existing): add `"asha_worker"` to the `role` enum.

**Village** (new): `_id, name, district, state, assignedAshaWorkerIds[]`

**AshaWorkerProfile** (new): `userId, assignedVillageIds[]`

**Patient** (extend existing — if a separate Patient model doesn't exist yet, extend User for patients): add `villageId (optional, ref Village)`, `healthId (unique, auto-generated, e.g. RHCS-2026-00042)`.

**PatientRecord** (new — this is the ASHA field-record model, distinct from `Consultation`): `patientId, villageId, collectedBy (ashaWorkerId), symptoms[], observations (text), attachments[] {type, url, uploadedAt}, createdAt`

**MedicationSchedule** (new): `patientId, prescriptionId, medicineName, dosage, instructions, frequency, timesPerDay[], startDate, endDate, status [active|completed|updated]`

**Reminder** (new): `patientId, type [medication|followup|checkup], scheduledTime, relatedRecordId (MedicationSchedule or Appointment), completed (bool), completedAt`

**Symptom** (new): `canonicalName, translations {en, hi, ta, ...}, aliases[], category, isRedFlag (bool), reviewedGuidance {en, hi, ...}` — seeded once from `symptomGuidance.json` (see §5).

**Report** (existing, no change needed — already generic enough per Phase 1 model).

## 3. Priority Calculation — Reconciling 2A with Phase 1

Phase 1 already computes `suggestedPriority` (high/medium/routine) per AI session. Phase 2A asks for a **4-tier** system (Critical/High/Medium/Routine) across the doctor's *entire* patient list, not just AI sessions. Resolve this as:

- Add a `"critical"` tier **above** high, triggered only by: (a) an AI session red flag combined with no doctor review within a configurable time window (e.g. 15 minutes unreviewed), or (b) a doctor manually escalating a case to Critical.
- The Doctor's Patient Priority List (2A) is a **new, broader view** that aggregates: active AI sessions, upcoming/overdue appointments, and any patient with a recent `PatientRecord` flagged by an ASHA worker as concerning — all normalized into one priority list, not a replacement for the existing Consultation-based queue.
- Store the doctor-facing priority as `Patient.currentPriority` (denormalized field, recalculated on relevant events) so the list can be queried cheaply without recomputing from scratch on every load.

## 4. Multilingual Gemini Prompting (2F, 2G)

Extend `geminiService.js`: accept a `language` parameter (ISO code, e.g. `hi`, `ta`, `bn`). Prepend to the existing Phase 1 system prompt:
```
Respond to the patient ONLY in {languageName}. Ask your questions in
{languageName}. However, the final structured JSON summary object's
KEYS must remain in English exactly as specified (summary, duration,
redFlags, suggestedPriority) — only the VALUES (the actual text) should
be in {languageName} where applicable, so the doctor's dashboard can
still parse and route it correctly regardless of language.
```
This keeps the doctor-facing data structure stable while the patient-facing conversation is fully localized.

For voice: before enabling the mic button, run a quick feature check:
```javascript
const voices = window.speechSynthesis.getVoices();
const supported = voices.some(v => v.lang.startsWith(langCode));
```
If unsupported, disable mic, show text-only fallback (per DESIGN.md §6).

## 5. Reviewed Symptom Guidance Config (2H)

Create `server/src/config/symptomGuidance.json` — a single editable file, NOT hardcoded in controller logic:
```json
{
  "fever": {
    "isRedFlagCombo": false,
    "generalGuidance": {
      "en": "Rest, stay hydrated, monitor temperature. See a doctor if fever exceeds 3 days or crosses 103°F/39.4°C.",
      "hi": "आराम करें, पानी पीते रहें, तापमान पर नज़र रखें। यदि बुखार 3 दिन से अधिक रहे या 103°F/39.4°C से ऊपर जाए तो डॉक्टर से मिलें।"
    }
  }
}
```
`aiController.js` reads this file (not the Gemini call itself) to attach a "general guidance" block to the *no red flag* path only — keeps this content auditable/editable by a non-technical reviewer (your project mentor, or an actual clinician) without touching code.

## 6. New API Routes

```
# Doctor priority list (2A)
GET    /api/doctors/patients                    (full list, joined priority)
GET    /api/doctors/patients?priority=critical  (filtered)

# Reminders (2B)
GET    /api/patients/me/reminders
POST   /api/reminders                            (system-generated on prescription finalize; also manual by doctor)
PATCH  /api/reminders/:id                         (mark complete)
POST   /api/reminders/subscribe                   (register Web Push subscription)

# ASHA (2C, 2D)
GET    /api/asha/villages                         (assigned villages for logged-in ASHA)
POST   /api/asha/patients                         (register/update resident)
POST   /api/asha/patients/:id/photo               (multer upload, validated)
POST   /api/asha/patients/:id/report               (multer upload, validated)
GET    /api/asha/villages/:id/patients            (village patient list)

# Village-linked history (2E)
GET    /api/patients/:id/history                  (extend existing route to include PatientRecord + village)
GET    /api/villages/:id/history                   (village-level aggregate, admin/doctor only)

# AI (2F, 2G, 2H — extend existing)
POST   /api/ai/chat                                (add "language" field to request body)
POST   /api/ai/symptoms                            (quick-select symptom submission, same pipeline as chat)
```

## 7. Folder Additions

```
client/src/features/
├── asha/
│   ├── AshaDashboard.jsx
│   ├── VillagePatients.jsx
│   ├── PatientRegistration.jsx
│   ├── CameraCapture.jsx
│   ├── ReportUpload.jsx
│   └── offlineQueue.js          # IndexedDB queue logic
├── patient/
│   └── Reminders/
│       └── RemindersPage.jsx
├── doctor/
│   └── PatientPriorityList.jsx   # new, sits alongside existing AI Triage Queue

server/src/
├── models/
│   ├── Village.js
│   ├── AshaWorkerProfile.js
│   ├── PatientRecord.js
│   ├── MedicationSchedule.js
│   ├── Reminder.js
│   └── Symptom.js
├── config/
│   └── symptomGuidance.json
├── controllers/
│   ├── ashaController.js
│   ├── reminderController.js
│   └── villageController.js
├── routes/
│   ├── ashaRoutes.js
│   ├── reminderRoutes.js
│   └── villageRoutes.js
├── services/
│   ├── pushService.js             # web-push wrapper
│   └── qrService.js               # health ID QR generation
```

## 8. Security Requirements (extend existing checklist)
- Every ASHA route checks `req.user.assignedVillageIds` includes the target village — an ASHA worker for Village A must never read/write Village B's patients.
- `multer` file filter rejects anything other than `image/jpeg`, `image/png`, `application/pdf`; max size 5MB; reject on both frontend (UX) and backend (real enforcement).
- `GET /api/patients/:id/history` and `/api/villages/:id/history` re-verify the requester's role + relationship to that patient/village server-side on every call — never trust a village/patient ID passed from the frontend as sufficient authorization.
- VAPID keys (for Web Push) go in `server/.env` like every other secret — never in source.
