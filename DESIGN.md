# DESIGN.md — UI/UX & Visual Design Spec

## 1. Design Principles
- **Calm, trustworthy, medical-but-not-clinical.** Avoid sterile hospital-white; use soft, warm-neutral light tones so it feels approachable to rural, possibly low-literacy users.
- **Clarity over density.** Big tap targets, short labels, icons + text (never icon-only for critical actions).
- **Priority is visual, not just textual.** Color + shape + position — a doctor should recognize a critical case in under a second.
- **Consistent across all three roles** — same design system, different accent per role for quick recognition.

## 2. Color Palette (light, human-eye-friendly)

| Token | Hex | Use |
|---|---|---|
| `--bg-primary` | `#F7FBFC` | App background (soft near-white, cool undertone) |
| `--bg-card` | `#FFFFFF` | Cards, panels |
| `--brand-primary` | `#2A9D8F` | Primary buttons, active states, links (calm teal — associated with health/care, not alarming) |
| `--brand-secondary` | `#5AB1BF` | Secondary accents, hover states |
| `--accent-soft-blue` | `#E8F4F8` | Section backgrounds, patient-role accent |
| `--accent-soft-green` | `#E6F4EA` | Success states, doctor-role accent |
| `--accent-soft-amber` | `#FFF4E0` | Admin-role accent, medium priority |
| `--priority-high` | `#E76F51` (bg `#FDEDEA`) | High priority / critical case badge |
| `--priority-medium` | `#F4A261` (bg `#FFF4E6`) | Medium priority badge |
| `--priority-routine` | `#2A9D8F` (bg `#E9F7F5`) | Routine badge |
| `--text-primary` | `#1F2937` | Main text |
| `--text-secondary` | `#6B7280` | Muted/secondary text |
| `--border` | `#E5EAEE` | Card borders, dividers |
| `--danger` | `#D64545` | Destructive actions (reject doctor, cancel) |

No pure black, no harsh saturated red as a background — reserve strong red only for the "critical/emergency" badge and destructive buttons, so it retains urgency.

## 3. Typography
- **Font:** `Inter` or `Poppins` (Google Fonts, free) — friendly, highly legible, good multilingual glyph support.
- Headings: 600–700 weight. Body: 400–500 weight.
- Base size 16px minimum (rural/older users) — do not go below 14px anywhere.
- Line height ≥ 1.5 for body text.

## 4. Layout System
- Tailwind CSS, 12-column responsive grid, mobile-first (assume many users are on phones, not desktops).
- Max content width 1280px on desktop; single-column stacking below 768px.
- Sidebar navigation on desktop (collapsible), bottom tab bar on mobile for the 3–4 primary sections per role.
- Cards with `rounded-2xl`, soft shadow (`shadow-sm`/`shadow-md`), generous padding (16–24px).

## 5. Component Library
- Use **shadcn/ui** (Tailwind-based, free, no license issues) as the base, customized to the palette above.
- Icon set: **lucide-react** (free, consistent stroke style).
- Charts (admin analytics): **Recharts**.

## 6. Role-Based Visual Identity
| Role | Accent background | Nav icon theme |
|---|---|---|
| Patient | Soft blue (`--accent-soft-blue`) | Heart / stethoscope |
| Doctor | Soft green (`--accent-soft-green`) | Clipboard / medical bag |
| Admin | Soft amber (`--accent-soft-amber`) | Shield / checklist |

This lets anyone glance at a screenshot and instantly know which dashboard it is — useful for your demo slides too.

## 7. Key Screens (wireframe-level spec)

### 7.1 Landing / Login
- Split screen: left = short value prop + illustration, right = login/signup with role toggle (Patient/Doctor). Admin login is a separate, unlisted route (`/admin/login`) — not advertised on the public landing page.

### 7.2 Patient Dashboard
- Top: greeting + "How are you feeling today?" → CTA into AI Assistant.
- Row of action cards: Find a Doctor | My Appointments | AI Assistant | My Records.
- Below: upcoming appointment card + queue position (if any) shown prominently.

### 7.3 AI Assistant Chat Screen
- Chat-style UI, mic button for voice input (Web Speech API), clear "AI Assistant — not a diagnosis" disclaimer pinned at top.
- At the end of intake: a summary card with urgency badge (High/Medium/Routine) shown to the patient before it's sent to a doctor, with a "Talk to a doctor now" CTA.

### 7.4 Doctor Dashboard
- Top: 4 stat cards (Total Patients / Today's Appointments / Pending Consults / Pending Follow-ups).
- **Priority Queue** as the visual centerpiece: a vertically sorted list, High priority cases pinned at top with a colored left-border strip (red/amber/teal), patient name, AI summary snippet, "Review" button.
- Patient history opens as a right-side drawer/panel (not full navigation away) so doctors keep queue context.

### 7.5 Admin Dashboard
- Doctor applications as a table/kanban (Pending / Approved / Rejected columns).
- Click into an application → credentials, approve/reject with one click + optional rejection reason.
- Platform stats as simple counter cards + a small trend chart.

## 8. Accessibility Checklist
- Color contrast ratio ≥ 4.5:1 for all text (verify priority badges especially).
- All interactive elements reachable/operable by keyboard.
- Voice input/output as a first-class alternative, not an afterthought.
- No information conveyed by color alone — always pair with icon/label (e.g., priority badges show both color and text "High").
