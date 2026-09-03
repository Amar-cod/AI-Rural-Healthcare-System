# BRAIN.md — Phase 2 Execution Plan

**This continues from the original BRAIN.md (Phase 0–6, complete). These are sub-phases of "Phase 2" as a whole — treat each as its own mini-phase with the same discipline: build → test → summary → update this file → stop → confirm → next.**

Give Antigravity all 4 Phase 2 docs (`PRD_PHASE2.md`, `DESIGN_PHASE2.md`, `ARCHITECTURE_PHASE2.md`, this file) plus the original 4 docs, since this extends the existing repo. Always tell Antigravity explicitly: **"Inspect the existing repository first. Do not create duplicate architecture — extend what exists."**

---

## Phase 2A — Doctor Patient Priority Dashboard
**Model:** `gemini-3-pro` — reconciling the new 4-tier priority with existing AI-session priority (see ARCHITECTURE_PHASE2 §3) needs real reasoning, not pure boilerplate.
- [x] `Patient.currentPriority` denormalized field + recalculation logic.
- [x] `GET /api/doctors/patients` (+ `?priority=` filter).
- [x] `PatientPriorityList.jsx` — sortable/filterable list per DESIGN_PHASE2 §2.
- [x] Critical tier (above High) with pulsing indicator, doctor-escalation action.

**Done when:** Doctor can view, sort, and filter their full patient list by priority, and manually escalate any patient to Critical.

---

## Phase 2B — Medication & Health Reminders [X]
**Model:** `gemini-3-flash` — CRUD + scheduling logic, not especially risky.
- [x] `MedicationSchedule` + `Reminder` models.
- [x] Auto-generate a `MedicationSchedule` when a doctor finalizes a prescription (hook into existing Phase 5 prescription-finalize flow).
- [x] `GET /api/patients/me/reminders`, `PATCH /api/reminders/:id`.
- [x] Patient "My Reminders" page per DESIGN_PHASE2 §3.
- [x] Web Push subscription + `pushService.js` (VAPID keys in `.env`).

**Done when:** Finishing a prescription auto-creates reminders; patient sees them, can mark complete, and (if subscribed) gets a push notification.

---

## Phase 2C — ASHA Worker Role
**Model:** `gemini-3-flash` — mirrors the existing role-guard pattern from Phase 1, low risk.
- [x] Add `asha_worker` to `User` role enum.
- [x] `Village` + `AshaWorkerProfile` models.
- [x] ASHA login, role guard, lavender-accented dashboard shell.
- [x] `GET /api/asha/villages` (assigned villages only).
- [x] Admin: simple UI to create villages and assign ASHA workers to them (needed before ASHA can do anything).

**Done when:** An ASHA worker logs in and sees only their assigned village(s), nothing else.

---

## Phase 2D — ASHA Registration + Photo/Report Upload [X]
**Model:** `gemini-3-pro` — file upload security (multer validation, storage paths) deserves more care than flash typically gives unprompted.
- [x] `PatientRecord` model.
- [x] Resident registration/update form + duplicate-check UX (DESIGN_PHASE2 §4).
- [x] Camera capture (`getUserMedia`) + document upload, `multer`-validated (type/size).
- [x] `POST /api/asha/patients`, `POST /api/asha/patients/:id/photo`, `POST /api/asha/patients/:id/report`.
- [x] IndexedDB offline queue (`offlineQueue.js`) + sync-on-reconnect + online/offline badge (DESIGN_PHASE2 §8).

**Done when:** An ASHA worker can register a resident, capture a photo, upload a document — all while offline — and it syncs correctly once back online, with no duplicate record created for an existing resident.

---

## Phase 2E — Village-Linked Patient History
**Model:** `gemini-3-pro` — authorization logic (doctor ↔ patient ↔ village) is exactly the kind of place bugs hide.
- [x] Extend `GET /api/patients/:id/history` to include `PatientRecord` entries.
- [x] `GET /api/villages/:id/history` (admin/doctor only).
- [x] Doctor "Find Patient" gets a village filter; Patient Profile gets an "ASHA Field Records" tab (DESIGN_PHASE2 §5).
- [x] **Explicit security test required** (see below).

**Done when:** A doctor can find a patient, filter by village, and see ASHA records alongside consultations — and a doctor/patient CANNOT access another patient's history by manipulating an ID (test this directly via API, not just UI).

---

## Phase 2F — Multilingual Chatbot (text)
**Model:** `claude-sonnet-4-5-thinking` (medium) if available — prompt engineering across 12 languages while preserving the strict JSON safety contract from Phase 1 is delicate. Fall back to `gemini-3-pro` if Claude quota is unavailable.
- [x] Extend `geminiService.js` per ARCHITECTURE_PHASE2 §4 (language-aware prompt, English-keyed JSON).
- [x] Language selector UI.
- [x] Test the safety boundary (no-diagnosis refusal, red-flag JSON) in at least 3 different languages, not just English.

**Done when:** Switching language changes the conversation language, but the doctor's dashboard still receives correctly-parsed priority/summary data regardless of language selected — and the no-diagnosis refusal still holds in non-English languages.

---

## Phase 2G — Voice Input/Output (multilingual)
**Model:** `gemini-3-pro`
- [x] Feature-detect voice support per selected language before enabling mic (ARCHITECTURE_PHASE2 §4).
- [x] Listening/Processing/Speaking UI states (DESIGN_PHASE2 §6).
- [x] Text fallback when unsupported.

**Done when:** Voice works end-to-end in at least English + Hindi (test these two thoroughly), and gracefully degrades to text-only for any language your browser doesn't support — never a silent failure.

---

## Phase 2H — Symptom Database + Safer Guidance
**Model:** `claude-sonnet-4-5-thinking` (high) if available, else `gemini-3-pro` — this is the second-most safety-critical phase after Phase 1's original AI triage; take the same care.
- [x] `Symptom` model + seed script from `symptomGuidance.json`.
- [x] Symptom quick-select chips (DESIGN_PHASE2 §7).
- [x] Red-flag-first check, then general non-diagnostic guidance only if no red flags, sourced from the reviewed config file — never generated ad-hoc by the model for this specific step.
- [x] Every interaction stored for doctor review (reuse `AISession`/`PatientRecord` as appropriate).

**Done when:** Selecting Fever + Headache + Body pain triggers duration/red-flag questions first; if no red flags, general self-care info appears clearly labeled "not a diagnosis," with a persistent "see a doctor if this persists or worsens" note.

---

## Phase 2I — Integration Testing & Polish
**Model:** `gemini-3-flash`
- [x] Full cross-role test: Patient (multilingual/voice) → AI → Doctor (priority list, village filter) → ASHA (offline registration synced in) → Admin (village management, analytics if built).
- [x] Responsive + empty/loading/error states for every new screen.
- [x] Update root README/demo script to include the new ASHA + multilingual + reminders flow.

**Done when:** A single rehearsed run-through touches every Phase 2 feature without manual DB edits or restarts.

---

## Model Assignment Quick Reference (Phase 2)

| Sub-phase | Model | Risk level |
|---|---|---|
| 2A Priority Dashboard | `gemini-3-pro` | Medium (reconciling two priority systems) |
| 2B Reminders | `gemini-3-flash` | Low |
| 2C ASHA Role | `gemini-3-flash` | Low |
| 2D ASHA Upload + Offline | `gemini-3-pro` | Medium-High (file security + offline sync) |
| 2E Village History | `gemini-3-pro` | Medium-High (cross-patient authorization) |
| 2F Multilingual Text | `claude-sonnet-4-5-thinking` (med) → `gemini-3-pro` fallback | High (safety contract across languages) |
| 2G Voice | `gemini-3-pro` | Medium |
| 2H Safer Symptom Guidance | `claude-sonnet-4-5-thinking` (high) → `gemini-3-pro` fallback | **Highest** (safety-critical, same tier as original Phase 4) |
| 2I Polish | `gemini-3-flash` | Low |

**Golden rule (unchanged):** don't start the next sub-phase until the current one's "Done when" is actually demoed working — this matters even more in Phase 2 since features are more interdependent (reminders depend on prescriptions, village history depends on ASHA data existing, etc.).
