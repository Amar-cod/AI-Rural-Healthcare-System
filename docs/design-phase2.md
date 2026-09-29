# DESIGN.md — Phase 2 Additions

**Extends the original DESIGN.md — same color tokens, fonts, and component library (shadcn/ui + Tailwind + lucide-react) carry forward. This file only covers what's new.**

## 1. New Role Accent — ASHA Worker

| Token | Hex | Use |
|---|---|---|
| `--accent-soft-lavender` | `#F1EEFA` | ASHA-role background accent (distinct from patient-blue/doctor-green/admin-amber) |
| `--brand-asha` | `#8B7FD1` | ASHA primary buttons/active states |

Nav icon theme: a home/village icon (e.g. `lucide-react`'s `Home` or `MapPin`).

## 2. Doctor Patient Priority Dashboard (2A)

- Replace/extend the existing "AI Triage Priority Queue" (Phase 1) with a fuller **Patient Priority List**:
  - Each row/card: patient photo initial, name, current problem (short), priority badge (now 4 levels: **Critical / High / Medium / Routine** — add a distinct "Critical" tier above High, using a deeper red `#C1121F` with a small pulsing dot indicator, reserved for AI-flagged emergencies or explicit doctor escalation), last updated timestamp, follow-up due indicator (small calendar icon if a follow-up is due).
  - Sort/filter controls at top: by priority, by "needs follow-up", by village (once 2E ships).
  - Clicking a row opens the existing patient history drawer (from Phase 5), now also showing ASHA field records (2E).

## 3. Medication & Reminders (2B)

- **Patient-side "My Reminders" page** (new, under `features/patient/Reminders`):
  - Card per active medication: name, dosage/instructions, frequency, days remaining, a checklist of today's doses with a tap-to-complete checkbox.
  - Upcoming follow-up/check-up shown as a distinct card type (calendar icon, date, "Mark attended" once past).
  - Completed/expired courses collapse into a "History" section, not deleted.
- Use `--priority-routine` green for "on track", `--priority-medium` amber for "due today", `--priority-high` red-orange for "missed/overdue".

## 4. ASHA Worker Dashboard (2C, 2D)

New top-level dashboard, lavender-accented, three main sections:
1. **My Villages** — list of assigned villages, resident count per village, quick "Register New Resident" CTA.
2. **Village Patients** — searchable list of registered residents in the selected village, each showing last visit date and a flag if any observation needs doctor attention.
3. **Resident Registration/Update form** — name, age, gender, approved demographic fields, health observations (structured fields + free text), camera capture button (opens device camera via `getUserMedia`), document upload (drag-drop or file picker with type/size limit shown).
   - **Duplicate check UX:** as the ASHA types a phone number, show a live "possible existing match" suggestion before creating a new record.
   - Every save shows a clear success/offline-queued indicator (see §6).

## 5. Village-Linked Patient History (2E)

- Doctor's "Find Patient" search bar gets a **Village filter dropdown** alongside name/ID search.
- Patient Profile page gets a new tab: **ASHA Field Records** (alongside existing Consultations / Prescriptions / Reports tabs), showing timestamped field observations, uploaded photos (as a thumbnail gallery), and which ASHA worker/village they came from.

## 6. Multilingual Chat + Voice (2F, 2G)

- Language selector: a compact flag/label dropdown pinned at the top of the AI Assistant screen, next to (not replacing) the existing safety disclaimer banner.
- Mic button behavior:
  - **Listening** state: pulsing mic icon, waveform-style animation.
  - **Processing** state: existing typing-indicator style (from Phase 1).
  - **Speaking** state: small speaker icon animates while TTS plays; tapping it again cancels playback.
  - If the selected language has no browser voice support: mic button greys out with a tooltip "Voice not available in this language — please type," text input stays fully functional.

## 7. Symptom Quick-Select (2H)

- Above the chat input: a horizontally scrollable row of symptom chips (Fever, Headache, Body pain, Cough, Cold, Sore throat, Vomiting, Diarrhea, Weakness, Dizziness, Breathing difficulty, Chest pain, Abdominal pain), multi-select, tapping adds it to the conversation as if typed.
- Chest pain / Breathing difficulty chips get a subtle red outline by default (visual pre-signal that these are high-attention symptoms even before AI processes them).

## 8. ASHA Offline Indicator (new pattern)

- A small persistent badge in the ASHA dashboard header: green Wi-Fi icon "Online" / grey crossed-out icon "Offline — N records queued to sync."
- Never block data entry when offline — always queue locally and sync silently when back online, with a toast confirming "3 records synced" when it happens.

## 9. Accessibility Notes (extended)
- Symptom chips and language selector must be fully operable via keyboard/screen reader (not just touch).
- Priority badges keep color + text + icon (never color alone), now across 4 tiers instead of 3 — make sure Critical vs High remains visually distinguishable to color-blind users (add a small pulsing dot to Critical, not just a darker red).
