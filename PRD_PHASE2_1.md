# PRD — Phase 2: Advanced Features (RHCS)

**Builds on top of the completed Phase 0–6 system. This does NOT replace the original PRD.md — it extends it.**

---

## 1. Why Phase 2

Phase 1 (original build) proved the core loop: patient → AI triage → doctor → prescription → records. Phase 2 turns this into a genuinely connected **rural healthcare workflow**:
- Doctors get a real triage tool (priority-sorted patient list, not just AI sessions).
- Patients aren't left alone after a prescription (reminders).
- The system reaches people who never open the app themselves — via **ASHA workers** doing village-level fieldwork.
- The AI assistant becomes usable by people who don't read/type English — multilingual + voice.

## 2. New Persona

**Asha (ASHA Worker, village health fieldworker)** — assigned to 1–2 villages, visits homes, has patchy internet, needs to register residents, capture basic health info, and flag concerns to a doctor — often for people who will never independently use the patient app.

## 3. Feature Set (from your spec, organized by sub-phase)

### 2A — Doctor Patient Priority Dashboard
- Continuous, filterable/sortable patient list: name, current problem, relevant history, appointment/queue status, AI summary (if any), **Priority: Critical/High/Medium/Routine**, last update time, follow-up status.
- Priority is **decision support only** — system calculates an initial value from red-flag rules, doctor can always override (this already exists for AI-session priority in Phase 1; 2A generalizes it to the doctor's *whole* patient list, not just AI-triaged sessions).

### 2B — Medication & Health Reminders
- Doctor's prescription → auto-generates a `MedicationSchedule` (medicine, dosage, frequency, start/end date).
- Reminders fire for medicine times and for check-up/follow-up dates.
- Patient can mark a reminder complete.
- Course auto-ends on end date, or can be updated/extended only by an authorized doctor.

### 2C — ASHA Worker Role
- New role: `asha_worker`, tied to one or more assigned villages.
- ASHA can register/update residents (name, age, gender, approved demographic fields), capture basic health observations.

### 2D — ASHA Photo/Report Upload
- Camera capture (device camera, with consent) and document upload, securely stored, linked to patient + village + ASHA worker metadata.
- Duplicate detection: before creating a new resident record, check for an existing match (by phone number / stable ID, not name alone).

### 2E — Village-Linked Patient History
- Doctor can search patients by name/ID, optionally filter by village.
- Patient history now includes ASHA field records alongside consultations/prescriptions/reports.
- **Backend must enforce** that a doctor/patient can only see records they're authorized for — village filter is a convenience, not a security boundary.

### 2F — Multilingual Chatbot (text)
- Language selector next to chat: English, Hindi, Tamil, Malayalam, Telugu, Bengali, Marathi, Gujarati, Kannada, Punjabi, Odia, Assamese.
- Gemini generates both the conversation *and* the structured JSON summary in the selected language (see Architecture doc for prompt approach) — no separate translation API needed.

### 2G — Voice Input/Output (multilingual)
- Flow: Language select → mic → Speech-to-Text → AI → response → Text-to-Speech in that language.
- UI states: Listening / Processing / Speaking, shown clearly.
- **Fallback:** if the browser doesn't support voice for a selected language, disable the mic button and show a text-input-only notice — never fail silently.

### 2H — Structured Symptom Picker + Safer Guidance
- Quick-select common symptoms (Fever, Headache, Body pain, Cough, Cold, Sore throat, Vomiting, Diarrhea, Weakness, Dizziness, Breathing difficulty, Chest pain, Abdominal pain) alongside free text/voice.
- Red flags checked **first**, before any general guidance.
- If red flags present → urgent-care recommendation + hand off to doctor workflow (same as Phase 1's high-priority path).
- If no red flags → general **non-diagnostic self-care information** only, pulled from a reviewed ruleset (see Architecture §5) — never framed as a confirmed diagnosis, always ends with "see a doctor if this persists or worsens."

### 2I — Integration Testing & Polish
- End-to-end test of every role interacting correctly with every new feature.
- Responsive + empty/loading/error states for all new screens (same bar as original Phase 6).

## 4. Safety Boundary (extended from Phase 1 — still non-negotiable)
> The AI collects symptoms, checks red flags first, and gives general non-diagnostic self-care information only when no red flags are present. It never confirms a diagnosis, never independently prescribes medication, and always recommends a doctor when symptoms persist, worsen, or are ambiguous. All AI interactions are stored for doctor review. Medical wording and any self-care guidance content must be reviewed by a qualified healthcare professional before any real-world deployment — for the hackathon/college demo, this is clearly labeled as unreviewed placeholder guidance.

## 5. Recommended Additions for Realism (see table above, summarized)
1. ASHA dashboard as an offline-capable PWA (only the ASHA section — not the whole app).
2. Gemini-native translation instead of a separate translation API.
3. Explicit per-language voice-support check with text fallback.
4. Auto-generated stable Health ID + QR code per patient.
5. Free Web Push for reminders instead of paid SMS.
6. Village-level analytics view for Admin.
7. `symptomGuidance.json` as an editable, reviewed config — not hardcoded logic.

## 6. Out of Scope for Phase 2
- Real SMS/telephony.
- Offline support for anything *other than* the ASHA worker flow.
- Automatic medicine dispensing/pharmacy integration (still just a request, as in Phase 1).
- Full clinical review of AI wording (flagged as a pre-deployment requirement, not a hackathon deliverable).
