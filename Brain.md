# BRAIN.md — Execution Plan & Phase Breakdown

This is the build order to hand to Antigravity (or follow yourself) so nothing gets built out of dependency order. Each phase produces something demoable — don't skip ahead.

---

## Phase 0 — Setup & Foundations
**Goal:** Repo, environment, and design tokens exist; nothing role-specific yet.
- [x] Init `client/` (Vite + React + Tailwind + shadcn/ui) and `server/` (Express) in one repo.
- [x] Set up MongoDB Atlas free cluster, get `MONGO_URI`.
- [x] Get free Gemini API key from Google AI Studio.
- [x] Create `.env` files (never commit — add to `.gitignore`).
- [x] Implement Tailwind theme config from `DESIGN.md` (colors, fonts).
- [x] Basic Express server with `/health` route, MongoDB connection confirmed.

Status: Completed on 2026-08-28 — Initialized client and server, configured Tailwind and Mongoose.

**Done when:** `npm run dev` on both client and server works, DB connects, blank themed app renders.

---

## Phase 1 — Auth & Role Foundation
**Goal:** All three roles can sign up/log in and land on an empty dashboard shell.
- [ ] `User` model + signup/login/JWT middleware.
- [ ] Role-based route protection (frontend route guards + backend middleware).
- [ ] Patient signup, Doctor signup (goes to "pending" state), Admin seeded manually (not public signup).
- [ ] Empty dashboard shells per role, styled per `DESIGN.md` role accents.

**Done when:** You can register as a patient, register as a doctor (lands on "verification pending" screen), and log in as a seeded admin.

---

## Phase 2 — Doctor Verification Workflow (Admin ↔ Doctor)
**Goal:** The core trust mechanism works end-to-end.
- [ ] `DoctorProfile` model, doctor application form (specialization, qualifications, license number).
- [ ] Admin dashboard: applications table (Pending/Approved/Rejected), approve/reject action.
- [ ] Only approved doctors appear in the public doctor directory.

**Done when:** A doctor applies, admin approves them live, doctor now appears in patient's "Find a Doctor" list.

---

## Phase 3 — Appointments, Queue & Patient Core
**Goal:** Patients can find, book, and queue.
- [ ] Doctor directory + filters (specialization, availability).
- [ ] Appointment booking (date/time slot selection).
- [ ] Queue join + live position (Socket.IO push).
- [ ] Patient dashboard: upcoming appointment card, queue status card.

**Done when:** A patient can pick a doctor, book a slot or join a queue, and see live status update.

---

## Phase 4 — AI Assistant + Voice + Priority Engine
**Goal:** The centerpiece feature — this is what will impress judges most, budget real time here.
- [ ] `geminiService.js`: structured prompt, strict JSON response contract (see `ARCHITECTURE.md §6`).
- [ ] Chat UI with disclaimer banner, mic button (Web Speech API `SpeechRecognition`), spoken responses (`SpeechSynthesis`).
- [ ] `AISession` model saving conversation + summary + red flags + suggested priority.
- [ ] Hand-off: session summary appears in doctor's Priority Queue, sorted High → Medium → Routine.
- [ ] Doctor can override priority (`finalPriority` field).
- [ ] (Stretch) Emergency SOS screen if red flags are severe and no doctor is available.

**Done when:** A patient describes symptoms by voice or text, gets a priority-tagged summary, and it appears correctly sorted on the doctor's queue.

---

## Phase 5 — Consultation, Records, Telemedicine, Medicine Request
**Goal:** Close the loop from consult to prescription to medicine request.
- [ ] Doctor: patient history drawer, consultation notes, prescription generator.
- [ ] `pdfService.js` (pdfkit) → generate prescription/report PDFs, downloadable by patient.
- [ ] Telemedicine: PeerJS video/audio room, doctor can open patient history in a side panel during the call.
- [ ] Medicine request: patient selects from an existing prescription only (validate server-side — no free-text medicine requests).

**Done when:** Full loop works — consult → prescription → PDF download → medicine request submitted.

---

## Phase 6 — Polish, Testing & Demo Prep
**Goal:** Ready to present.
- [ ] Responsive pass (test on an actual phone, not just resized browser).
- [ ] Empty states, loading states, error states for every screen.
- [ ] Seed demo data (a few doctors, patients, sample consultations) so the demo isn't starting from zero.
- [ ] Rehearse the exact demo script: patient signup → AI triage (say a "high priority" symptom on purpose) → doctor sees it top of queue → consult → prescription → download PDF → medicine request → admin approves a new doctor live.
- [ ] Write the pitch: lead with the *safety boundary* (AI triages, never diagnoses) — judges and evaluators care about this a lot in health-tech.
- [ ] (If time remains) implement 1 "Recommended Addition" from `PRD.md §6` — multilingual toggle is usually the highest-impact, lowest-effort pick.

---

## Suggested Time Allocation (adjust to your deadline)
| Phase | % of total time |
|---|---|
| 0 – Setup | 5% |
| 1 – Auth/Roles | 10% |
| 2 – Doctor Verification | 10% |
| 3 – Appointments/Queue | 15% |
| 4 – AI + Voice + Priority | 25% (this is your differentiator — don't shortchange it) |
| 5 – Consult/Records/Telemedicine/Medicine | 20% |
| 6 – Polish/Demo | 15% |

## Golden Rule
Don't start Phase *N+1* until Phase *N*'s "Done when" checkbox is real and demoable — a half-built AI assistant on top of a half-built queue system is what breaks live demos.
