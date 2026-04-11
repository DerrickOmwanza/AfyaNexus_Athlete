# AfyaNexus UI/UX Audit

## Scope
This document reviews the current AfyaNexus frontend user interface and experience across:
- Landing page
- Login page
- Registration page
- Dashboard shell and role-specific dashboards
- Shared UI components and visual styling

It is based on the current `client/` source files, including page components, layout, shared widgets, and global styling.

---

## 1. Global Branding and Styling

### Colors and visual identity
- Brand palette is defined in `client/app/globals.css` and `client/tailwind.config.ts`.
- Primary colors:
  - `brand-blue` (#1E3A8A)
  - `brand-green` (#10B981)
  - `brand-orange` (#F97316)
  - `brand-gray` (#F3F4F6)
- The UI uses a clean white card surface for content against light gray backgrounds.
- Accent and alert states are color-coded consistently across cards and badges.

### Typography and base styles
- Global font stack: `Inter`, `Segoe UI`, Arial, sans-serif.
- Body uses `#111827` dark text on light backgrounds.
- Custom scrollbar styling is added for WebKit browsers.

### Tailwind configuration
- Tailwind content is sourced from `./app/**/*` and `./components/**/*`.
- Custom brand colors are extended in the Tailwind theme.

---

## 2. Navigation and Page Structure

### Dashboard layout
Located in `client/app/dashboard/layout.tsx`.
- Wraps dashboard routes in an authenticated shell.
- Uses `AuthContext` and redirect logic to enforce login.
- Provides a persistent sidebar and top bar.
- Main content is placed inside `main` with padding and scroll support.

### Sidebar
Defined in `client/components/Sidebar.tsx`.
- Role-based navigation for athlete, coach, and nutritionist.
- Highlights active route with a green background and white text.
- Includes settings and sign-out actions at the bottom.
- Uses iconography from `lucide-react`.

### Top bar
Defined in `client/components/TopBar.tsx`.
- Displays a welcome message and user name.
- Shows a T70 sync status badge for athletes.
- Includes a notification bell and initials avatar.
- Top bar is simple and uncluttered.

---

## 3. Public Pages

### Landing page
File: `client/app/page.tsx`
- Full-screen hero with bold title, subtitle, and CTA buttons.
- Two primary CTAs:
  - Sign In
  - Create Account
- Three feature cards communicate the platform roles.
- UX is minimal and straightforward.

### Login page
File: `client/app/(auth)/login/page.tsx`
- Centered card layout on a blue background.
- Role selection uses segmented buttons for athlete, coach, nutritionist.
- Standard email/password fields.
- Error feedback appears above the form.
- Link to registration is provided.

### Registration page
File: `client/app/(auth)/register/page.tsx`
- Similar card layout to login.
- Role choice controls registration fields.
- Athlete role reveals specialization, coach, and nutritionist selectors.
- Uses onboarding options loaded from `/auth/onboarding-options`.
- Validates password confirmation and minimum length.

### UX observations for auth flow
- Role selection is prominent and functional.
- Visual contrast between page background and form card is strong.
- The sign-in and register forms are consistent.
- There is limited inline guidance; field help text is minimal.

---

## 4. Athlete Experience

### Athlete dashboard
File: `client/app/dashboard/athlete/page.tsx`
- Hero section includes a dashboard title and CTA buttons.
- Uses four stat cards for sleep, soreness, mood, and last workout.
- Displays a wearable status card.
- Injury risk gauge summarizes current risk.
- Shows a training intensity line chart.
- Includes recent recovery logs in a table.

### Athlete activity pages
Files:
- `client/app/dashboard/athlete/training-log/page.tsx`
- `client/app/dashboard/athlete/recovery-log/page.tsx`
- `client/app/dashboard/athlete/wearable/page.tsx`

#### Training log
- Form-based entry with workout type select, intensity slider, duration input, and notes.
- Success and error messages shown in contextual alerts.
- After save, it redirects back to the dashboard.

#### Recovery log
- Morning check-in form with sleep, soreness slider, mood dropdown, numbness checkbox, and notes.
- Good use of descriptive labels and range interaction.

#### Wearable sync
- Device registration and manual sync interface.
- Includes history of wearable entries and a dedicated Health Connect import mock flow.
- Has both sync success and failure feedback.

### UX observations for athlete flows
- Good data-focused dashboard layout with multiple widgets.
- Forms are clean but some inputs could be more compact.
- Feedback states are visible and straightforward.
- There is no clear guidance for first-time athletes beyond the dashboard cards.

---

## 5. Coach Experience

### Coach dashboard
File: `client/app/dashboard/coach/page.tsx`
- Summary cards for total athletes and risk breakdown.
- High-risk alerts panel for quick visibility.
- Athletes table with specialization, risk score, and links.

### Coach athlete list
File: `client/app/dashboard/coach/athletes/page.tsx`
- Search input for filtering by name or specialization.
- Table of athletes with risk levels and quick navigation.
- Good detail density and readable row styling.

### UX observations for coach flows
- Dashboard is clearly organized around risk management.
- The search/filter experience is useful for scaling athlete rosters.
- High-risk alerts are easy to scan.
- The current design is efficient but could be improved with clearer action hierarchy for urgent items.

---

## 6. Nutritionist Experience

### Nutritionist dashboard
File: `client/app/dashboard/nutritionist/page.tsx`
- Summary panel for registered athletes, active plans, and review needs.
- Athletes list with route links to individual dashboards.

### Diet plans page
File: `client/app/dashboard/nutritionist/diet-plans/page.tsx`
- Create new diet plan form with athlete picker and recommendations.
- Filter chips for athlete-specific plan lists.
- Diet plan cards show plan name, athlete, recommendations, and created date.

### UX observations for nutritionist flows
- Good vertical workflow for plan creation and review.
- The form is functional but could use richer guidance for macros and plan structure.
- The filter pills support quick triage.

---

## 7. Shared UI Components

### StatCard
File: `client/components/ui/StatCard.tsx`
- Reusable card with label, value, and optional subtext.
- Accent mapping supports blue, green, and orange states.
- Simple and consistent.

### InjuryRiskGauge
File: `client/components/ui/InjuryRiskGauge.tsx`
- Visual bar and color-coded risk level badge.
- Includes dynamic messaging for High/Medium/Low states.
- Good use of status visualization.

### Sidebar and TopBar
- `Sidebar` handles role-based navigation and active route highlighting.
- `TopBar` provides user context and sync status.
- Both contribute to a consistent dashboard shell.

---

## 8. UX Strengths
- Strong visual consistency using brand color palette.
- Clear role separation and tailored dashboards.
- Effective use of cards, tables, and charts.
- Onboarding role selection is integrated into login/register flow.
- Dashboard layout provides quick access to high-priority tasks.

---

## 9. UX Weaknesses and Improvement Opportunities

### General issues
- No explicit mobile navigation pattern is visible for dashboard sidebar collapse.
- Some role selector buttons are not keyboard-native radio controls.
- Authentication pages lack progressive validation and contextual help.
- Error messages are generic in some cases.

### Landing page
- Minimal content and weak social proof or trust cues.
- CTAs are clear but there is no secondary hero messaging for benefits or features.

### Dashboard UX
- Data tables have no sorting, pagination, or action toolbar.
- The injury risk gauge is good, but the dashboard lacks clear next-step guidance.
- Charts are functional but could benefit from explicit legends and comparisons.

### Athlete experience
- Recovery and training forms are useful, but the experience is form-heavy.
- Wearable sync relies on manual entry rather than automated device pairing.
- The dashboard could show a clearer progression path (e.g., "Next action: Log today’s recovery").

### Coach/Nutritionist experience
- The coach and nutritionist dashboards are practical, but the layout feels more like an internal admin panel.
- There is opportunity to add richer summary cards, alerts, and workflow callouts.

### Accessibility and readability
- Color contrast is mostly good, but some gray text and subtle borders may be weak on lower-end displays.
- Button groups and custom controls should be reviewed for screen-reader friendliness.

---

## 10. Recommended UX Improvements

### Immediate improvements
- Add a mobile-responsive sidebar/hamburger navigation for dashboards.
- Introduce stronger landing page messaging with benefit sections, testimonials, or product highlights.
- Replace role-selection button groups with accessible segmented controls or radio groups.
- Add inline validation for auth forms and contextual field help text.
- Add document-level page headings and breadcrumbs inside dashboard sections.

### Dashboard enhancements
- Add action cards or status banners for high-risk athletes and next recommended steps.
- Introduce common UI patterns for tables: sort, search, filters, and pagination.
- Add reusable `InfoCard`, `DataTable`, and `FormSection` components for consistency.
- Improve chart labeling and add tooltips or summary stats.
- Add a mobile-first responsive layout for each dashboard.

### Athlete journey
- Add a first-time setup checklist for athletes.
- Surface training/recovery history more clearly with timeline cards.
- Make wearable sync onboarding more straightforward with step guidance.

### Coach / nutritionist workflows
- Add workflow panels like “Review this week” or “Action required.”
- Expand athlete detail pages to include quick actions and risk mitigation guidance.
- Improve diet plan UX with templates and macro recommendation presets.

---

## 11. File Map for Current UI

- `client/app/page.tsx` — Landing page
- `client/app/(auth)/login/page.tsx` — Login page
- `client/app/(auth)/register/page.tsx` — Registration page
- `client/app/layout.tsx` — Root layout and auth provider
- `client/app/dashboard/layout.tsx` — Protected dashboard shell
- `client/components/Sidebar.tsx` — Role-based sidebar
- `client/components/TopBar.tsx` — Dashboard header bar
- `client/components/ui/StatCard.tsx` — Dashboard stat card
- `client/components/ui/InjuryRiskGauge.tsx` — Risk visualization
- `client/app/dashboard/athlete/page.tsx` — Athlete home
- `client/app/dashboard/athlete/training-log/page.tsx` — Athlete training form
- `client/app/dashboard/athlete/recovery-log/page.tsx` — Athlete recovery form
- `client/app/dashboard/athlete/wearable/page.tsx` — Athlete wearable sync
- `client/app/dashboard/coach/page.tsx` — Coach home
- `client/app/dashboard/coach/athletes/page.tsx` — Coach athlete list
- `client/app/dashboard/nutritionist/page.tsx` — Nutritionist home
- `client/app/dashboard/nutritionist/diet-plans/page.tsx` — Nutritionist plan management
- `client/app/globals.css` — Global styling
- `client/tailwind.config.ts` — Tailwind theme config

---

## 12. Next Steps
1. Prioritize the user journeys to improve first: landing → auth → athlete dashboard.
2. Add low-fidelity UI wireframes for the updated dashboard shell and role-specific actions.
3. Implement shared components for cards, inputs, and table states.
4. Validate accessibility and responsive behavior across breakpoints.

This report can now serve as a baseline for a UI redesign or incremental UX improvements.
