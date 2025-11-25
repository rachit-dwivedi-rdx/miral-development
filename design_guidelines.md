# MIRAL Design Guidelines

## Design Approach

**Selected Approach:** Design System with Linear/Notion-inspired aesthetics for productivity applications

**Rationale:** MIRAL is a utility-focused practice tool requiring clarity, efficiency, and minimal distraction during active sessions. Drawing from Linear's precision and Notion's information density while maintaining focus on real-time feedback.

**Core Principles:**
- Clarity over decoration - minimize visual noise during practice sessions
- Information hierarchy that guides attention to critical feedback
- Professional, confidence-inspiring aesthetic appropriate for serious skill development

---

## Typography System

**Font Families:**
- Primary: Inter (via Google Fonts) - all UI elements, body text, metrics
- Monospace: JetBrains Mono - timestamps, numeric data, transcripts

**Type Scale:**
- Hero/Main Headings: text-4xl, font-semibold (Practice Session title)
- Section Headings: text-2xl, font-semibold (Report sections, Dashboard cards)
- Subsection/Card Titles: text-lg, font-medium
- Body Text: text-base, font-normal
- Metrics/Data: text-sm, font-medium (real-time indicators)
- Helper Text: text-xs, font-normal

---

## Layout System

**Spacing Primitives:** Use Tailwind units of 2, 4, 6, and 8 consistently
- Component padding: p-4, p-6
- Section spacing: space-y-6, space-y-8
- Card gaps: gap-4, gap-6
- Margins: m-4, m-8

**Grid System:**
- Practice Screen: Single column with sidebar (video occupies primary space)
- Dashboard: 3-column grid on desktop (grid-cols-1 md:grid-cols-2 lg:grid-cols-3)
- Reports: 2-column layout for comparison metrics (grid-cols-1 lg:grid-cols-2)

**Container Widths:**
- Practice session: max-w-7xl (needs space for video + metrics)
- Report view: max-w-6xl
- Dashboard: max-w-7xl

---

## Component Library

### Practice Session Screen

**Video Feed Component:**
- Large central video container (16:9 aspect ratio preferred)
- Rounded corners: rounded-lg
- Subtle border treatment
- Position: Takes 60-70% of screen width on desktop, full width on mobile
- Overlay feedback indicators in corners (non-intrusive)

**Real-time Metrics Sidebar:**
- Fixed height, scrollable if needed
- Contains live feedback cards stacked vertically (space-y-4)
- Each metric card: p-4, rounded-md, minimal shadow
- Icon + Label + Live Value layout
- Color-coded indicators using opacity variations (not specific colors)

**Active Feedback Alerts:**
- Toast-style notifications that appear briefly
- Position: Bottom-center of video feed
- Pill-shaped: px-6 py-3, rounded-full
- Auto-dismiss after 3-4 seconds
- Examples: "Maintain eye contact", "Slow down slightly"

**Recording Controls:**
- Bottom bar beneath video
- Large, clear Start/Stop button (circular, prominent)
- Timer display (monospace font, text-xl)
- Secondary controls: Pause, Settings icons

### Performance Report Screen

**Report Header:**
- Session metadata: date, duration, topic
- Overall confidence score prominently displayed (large numeric value)
- Quick stats row: 4 key metrics in grid (eye contact %, WPM, filler words, emotion score)

**Detailed Metrics Sections:**
- Each section in its own card (p-6, space-y-4)
- Section order: Confidence Score → Eye Contact → Speech Analysis → Emotion Timeline → Transcript → Recommendations

**Data Visualization Areas:**
- Timeline charts for emotion tracking (horizontal progress-style visualization)
- Bar indicators for percentage metrics (simple progress bars)
- Number badges for counts (filler words, pauses)
- Line spacing in transcript: leading-relaxed for readability

**Strengths & Weaknesses Cards:**
- Two-column layout on desktop
- Bulleted lists with clear visual separation
- Icon indicators (checkmark for strengths, alert for areas to improve)

**Comparison Section:**
- Table layout comparing current session vs. previous sessions
- 3-column: Metric | This Session | Previous Average
- Highlight improvements with subtle directional indicators

### Dashboard Screen

**Session History Cards:**
- Card grid layout (3 columns desktop, 2 tablet, 1 mobile)
- Each card shows: thumbnail placeholder, date, duration, confidence score
- Hover state: subtle lift effect
- Card content: p-4, space-y-2

**Progress Chart Section:**
- Full-width area at top of dashboard
- Simple line chart showing confidence scores over time
- X-axis: Session dates, Y-axis: Score (0-100)
- Minimal grid lines, clean aesthetic

**Stats Overview Row:**
- 4 stat cards in grid above session history
- Large number display (text-3xl, font-bold)
- Label below (text-sm)
- Examples: Total Sessions, Average Score, Total Practice Time, Improvement %

### Navigation

**Top Navigation Bar:**
- Clean horizontal layout
- Logo/Brand left-aligned
- Navigation links center (Practice, Dashboard, Reports)
- User profile right-aligned
- Height: h-16, padding: px-6
- Sticky positioning: sticky top-0

### Forms & Inputs

**Session Setup Form:**
- Vertical stack of fields (space-y-4)
- Input fields: p-3, rounded-md, border
- Labels: text-sm, font-medium, mb-2
- Helper text: text-xs below inputs
- Primary action button: Large, full-width on mobile, fixed-width on desktop

### Modals & Overlays

**Session Complete Modal:**
- Centered overlay
- Card container: p-8, max-w-lg, rounded-lg
- Celebration message + score
- Two CTAs: View Full Report (primary), Start New Session (secondary)

**Settings Panel:**
- Slide-in from right
- Full-height sidebar: w-96
- Section groups with dividers
- Toggle switches and dropdowns for preferences

---

## Responsive Behavior

**Breakpoints:**
- Mobile (base): Single column, stacked layouts
- Tablet (md): 2-column grids where appropriate
- Desktop (lg): Full multi-column layouts, sidebar navigation

**Practice Session Adaptations:**
- Mobile: Video full-width, metrics below (vertical scroll)
- Desktop: Video + sidebar side-by-side

**Dashboard Adaptations:**
- Mobile: Single column cards, full-width stats
- Desktop: Multi-column grids, condensed stat row

---

## Animation & Transitions

**Minimal, Purposeful Motion:**
- Page transitions: None (instant navigation for speed)
- Card hovers: Subtle scale (scale-105) on dashboard cards only
- Real-time metrics: Number counter animations on value changes
- Alert toasts: Slide-up entrance, fade-out exit
- Loading states: Simple spinner, no elaborate animations

**Avoid:**
- Parallax effects
- Complex scroll-triggered animations
- Decorative motion that distracts from practice sessions

---

## Images

**Hero Image:** Not applicable - this is a functional application, not a marketing site

**Dashboard Placeholders:**
- Session thumbnail placeholders: 16:9 ratio boxes with subtle icon (camera symbol)
- Empty state illustrations: Simple line-art style illustration for "No sessions yet" state

**Report Section:**
- Optionally include small visual representation of user during session (snapshot from recording)
- Position: Top-right of report header

---

## Accessibility Notes

- Maintain consistent focus indicators across all interactive elements
- Ensure real-time alerts are announced to screen readers
- Provide text alternatives for all metric visualizations
- Keyboard navigation for all recording controls
- High contrast ratios for all text elements

---

This design creates a professional, distraction-free environment for serious practice while providing rich data visualization for performance analysis.