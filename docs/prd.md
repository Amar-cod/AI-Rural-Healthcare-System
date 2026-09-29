# PRD — Rural Healthcare Continuity System (RHCS)

**Version:** 1.0
**Prepared for:** Hackathon + College Major Project
**Status:** Approved for build

---

## 1. Problem Statement

Rural and underserved patients face fragmented, delayed, and hard-to-access healthcare:
- No structured way to discover or reach verified doctors.
- Critical cases sit in the same queue as routine ones, with no triage.
- Medical history (reports, prescriptions, past visits) is scattered or lost between visits.
- No visibility into appointment slots, follow-ups, or queue position.
- No fallback when a doctor is not immediately reachable.
- No guarantee that a "doctor" on the platform is actually qualified.
- Travel is a real barrier — remote consultation is often the only option.

## 2. Goal

Build a single role-based platform (Patient / Doctor / Admin) that:
1. Verifies doctors before they can practice on the platform.
2. Lets patients discover doctors, book appointments, and join queues.
3. Uses an AI assistant (Gemini) to intake symptoms and flag urgency **when a doctor isn't immediately available** — never to diagnose or prescribe.
4. Surfaces high-priority cases to doctors first.
5. Keeps a continuous, downloadable medical history per patient.
6. Supports telemedicine and a prescription-linked medicine request flow.

## 3. User Personas

| Persona | Need |
|---|---|
| **Rani (Patient, rural village)** | Wants to know if her symptoms are urgent, book a check-up without traveling twice, and keep all her reports in one place. |
| **Dr. Verma (Doctor)** | Wants to see who's actually urgent first, review history in one place, and generate prescriptions fast. |
| **Admin (District health coordinator)** | Wants to make sure only real, qualified doctors are active on the platform, and see platform health at a glance. |

## 4. Core Feature Set (from your spec — confirmed as MVP)

### Shared
- Role-based authentication (Patient / Doctor / Admin), JWT-secured.
- Doctor authorization workflow: Signup → Verification Pending → Admin Review → Approved/Rejected.

### Patient Dashboard
- Find & consult a verified doctor (list, specialization, availability filter).
- Appointment booking + rural check-up queue with live status.
- AI Healthcare Assistant (text + voice) for symptom intake, follow-up questions, red-flag detection, urgency tagging, case summary — **never diagnosis or prescription**.
- Medical history: past consultations, prescriptions, reports, follow-ups; report download (PDF).
- Telemedicine: request remote consult, audio/video, doctor can pre-review history.
- Medicine request: only after a valid prescription exists.

### Doctor Dashboard
- Registration + verification submission.
- Overview: total patients, today's appointments, pending consultations/follow-ups.
- Critical case prioritization: High / Medium / Routine, doctor can override AI-suggested priority.
- Full patient history view.
- Prescription + medical report generation, follow-up scheduling.

### Admin Dashboard
- Review doctor applications & credentials, approve/reject/deactivate.
- Status monitoring: pending / approved / rejected / inactive.
- Platform-level counts: patients, doctors, consultations.

## 5. AI Safety Boundary (non-negotiable, keep this explicit in the UI)
> The AI assistant collects and organizes symptom information and flags potential urgency. It does **not** diagnose, does **not** prescribe, and is always clearly labeled as non-clinical. A qualified doctor makes every final clinical decision.

## 6. Recommended Additions (beyond your original spec — optional but strong for judging)

| Addition | Why it matters | Effort |
|---|---|---|
| **Emergency / SOS flag** — if AI detects severe red flags (chest pain, breathing difficulty, etc.) and no doctor is free, show an immediate "seek emergency care now" screen with nearest facility info. | Closes a real safety gap: an AI chat alone shouldn't be the only response to a true emergency. | Low |
| **Multilingual UI + voice** (Hindi/regional language toggle via i18next; Web Speech API already supports multiple locales) | Rural India context — English-only excludes most real users. | Medium |
| **Offline-friendly PWA shell** (cache last-seen data, queue actions when back online) | Rural connectivity is patchy; strong "we thought about the real constraint" point for judges. | Medium |
| **Doctor ratings / feedback** after consultation | Basic trust signal, cheap to add. | Low |
| **Simple pharmacy/medicine availability flag** (mock data acceptable for hackathon) | Extends the "medicine request" feature into something visibly useful. | Low |
| **Admin analytics** — most common symptoms/village-level trend chart | Matches your "Future Scope" section, doable now with basic aggregation queries. | Low–Medium |

Pick 1–2 of these as your "stretch" features for the demo; don't try all of them.

## 7. Non-Functional Requirements
- **Security:** bcrypt password hashing, JWT auth, role-based route guards, input validation (`zod`/`express-validator`).
- **Privacy:** medical data only visible to the patient, their treating doctor, and admin (never other patients/doctors).
- **Performance:** dashboards should load under ~2s on 3G-equivalent throttling (test this — it's a rural product).
- **Accessibility:** large tap targets, high-contrast text, voice option for low-literacy users.
- **Cost:** entire stack must run on free tiers (see Architecture doc).

## 8. Success Metrics (for demo/judging)
- End-to-end flow completable live: patient signup → AI triage → doctor sees prioritized case → consult → prescription → PDF report → medicine request.
- Admin can approve a doctor live during the demo.
- Zero paid API keys required to run the project.

## 9. Out of Scope (explicitly, for MVP)
- Real SMS/telephony integration (future scope).
- Real payment processing.
- Government record integration.
- Native mobile apps (PWA is enough).

