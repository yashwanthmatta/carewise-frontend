# FollowThrough Health design system (v3)

**One rule:** calm, clear and honest. Every colour, size and motion helps someone understand a health report. None of it decorates.

- **Website:** the source of truth is `ui.css`. It loads after the older `styles.css`, which it overrides where they differ.
- **Phone app:** uses the same tokens, mirrored in `src/theme.ts` in the mobile repo.

## Colour

| Token | Value | Use |
|---|---|---|
| `--ft-bg` | `#f9f8f5` | Page background (warm white) |
| `--ft-surface` | `#ffffff` | Cards, inputs |
| `--ft-surface-2` | `#f3f2ee` | Quiet areas: tab track, aside, hover |
| `--ft-surface-brand` | `#eef7f5` | The upload card, the two-step code box |
| `--ft-ink` | `#15191a` | Text |
| `--ft-ink-2` | `#45504d` | Secondary text (8.3:1 on the background) |
| `--ft-ink-3` | `#5b6663` | Captions (5.9:1 on white) |
| `--ft-line` / `--ft-line-strong` | `#e6e3dc` / `#d0cbc1` | Borders, input borders |
| `--ft-brand` / `--ft-brand-strong` | `#0f766e` / `#0b5c55` | Primary buttons, links, focus (white text 5.5:1) |
| `--ft-brand-soft` | `#e3f2ef` | Selected tab on phones, avatar |
| `--ft-attention` / `-ink` / `-soft` | `#b45309` / `#7c3a06` / `#fdf4e7` | "Outside the lab's range" accents and chips; "confirm your email" |
| `--ft-danger` / `-soft` | `#b42318` / `#fdf0ee` | Errors, Delete my account, existing urgent and critical states |
| `--ft-info-soft` | `#eef3f8` | Neutral status messages (sign-in answers) |

**Medical-meaning rules:**
- Colour never carries meaning on its own. Every chip has words ("High", "Far above the lab's range").
- Amber means "outside the lab's printed range". It does not mean urgent.
- Red is used only where the existing, separately tested safety rules already say urgent or critical. The redesign did not add any new urgency colouring.
- Green is not used to signal "healthy".

## Type

**Fonts:**
- Text: DM Sans (already loaded).
- Headings: Inter Tight (self-hosted).
- Lab values use tabular numbers.

| Token | Size | Use |
|---|---|---|
| `--ft-text-2xl` | clamp(2.4rem, 5.2vw, 4.1rem) | Homepage headline only |
| `--ft-text-xl` | clamp(1.6rem, 2.6vw, 2.1rem) | Screen headings |
| `--ft-text-lg` | 1.25rem | Card headings |
| `--ft-text-md` | 17px | Body (minimum for reading text) |
| `--ft-text-sm` | 15px | Secondary text, buttons |
| `--ft-text-xs` | 13px | Captions, hints, chips (never body text) |

## Space, shape, depth

- **Spacing** follows a 4px grid: `--ft-space-1` to `--ft-space-8` = 4, 8, 12, 16, 24, 32, 48, 64px.
- **Corner radius:** 10px small, 14px inputs and cards, 20px panels, and a full pill for buttons and tabs.
- **Shadows:**
  - `sm` for controls.
  - `md` for panels.
  - `lg` only for floating things (the More menu, the phone tab bar).

## Components (website)

| Component | Class | Notes |
|---|---|---|
| Primary button | `.primary-button` | Teal, at least 48px tall, presses to 98%. Only one primary per view. |
| Secondary button | `.secondary-button` | White with a border, at least 44px tall. |
| Danger button | `.danger-button` | Soft red, only for destructive actions. |
| Text link button | `.link-button` | For in-flow actions such as "Forgot password?". |
| Busy state | `.is-busy` + `aria-busy="true"` | Spinner next to the label, so the label never jumps. |
| Field | `.field`, `.field-label`, `.field-hint` | Label above, hint below, never a placeholder alone. |
| Password | `.password-wrap` + `[data-password-toggle]` | Show/Hide with `aria-pressed`. |
| Segmented tabs | `.auth-tabs [role=tab]` | Arrow keys move between tabs. |
| Status message | `.auth-status` | Hidden when empty. `role="status"` so screen readers announce it. |
| Disclosure | `<details>` with a chevron | Used for "I have a reset code" and "Privacy and data controls". |
| Header nav | `.site-nav .quick-nav` | Segmented control on desktop; a fixed bottom bar with 48px targets on phones. |
| Action menu | `.result-more-actions` | `<details>` popover for secondary result actions. |
| Badges | `.sync-badge` | Neutral by default; teal when verified; amber when action is needed. |

## Motion

- **Timing:** 150ms for hovers and presses; 220ms for screen and card entrances (fade plus 8px rise), using an ease-out curve. The More menu pops in 150ms.
- **Result cards:** stagger in by 40ms each, capped at 160ms.
- **Numbers never animate.** No loading effect suggests progress that isn't measured. Nothing implies a clinician has reviewed something when one hasn't.
- **Reduced motion:** with `prefers-reduced-motion: reduce`, all animation and transition is effectively off, and the spinner becomes a static ring.
- **Libraries:**
  - Website: the vanilla JavaScript site uses CSS animations rather than the Motion library. That is lighter, needs no new script origin under the security policy, and gives the same result for these simple transitions.
  - Phone app: uses React Native's built-in `Animated` and `LayoutAnimation`; web Motion does not run there.

## Accessibility checklist for every new screen

- [ ] Text contrast at least 4.5:1 (3:1 for 24px and larger)
- [ ] Every input has a visible label; errors and answers are announced through `role="status"`
- [ ] Touch targets at least 44×44px, with 8px between them
- [ ] Visible focus ring (`--ft-focus`) on every control
- [ ] Works with the keyboard only; tabs answer to arrow keys
- [ ] Reduced motion respected
- [ ] No horizontal scrolling at 320px
- [ ] axe-core finds no violations (automated only; follow with a VoiceOver or TalkBack pass)
