# Design system

Dark-first, high-contrast, quiet. The app is used standing up, in bad light,
with one hand, by someone who is mid-haircut. Clarity beats decoration.

The single rule: **if a value is not in this file, ask — do not invent it.**

## Colour

Tokens live in `apps/mobile/src/theme/tokens.ts`. Never hard-code a hex in a
component.

| Token | Value | Use |
| --- | --- | --- |
| `ink` | `#0E0E10` | app background (dark) |
| `paper` | `#FAF9F6` | primary text on dark, light surfaces |
| `brass` | `#C9A227` | primary accent, active state, money |
| `terracotta` | `#C8553D` | attention, destructive-but-reversible |
| `success` | `#1F7A4C` | paid, confirmed, captured |
| `danger` | `#B3261E` | errors, cancel, delete |
| `neutral.50 … 900` | see tokens | surfaces, borders, secondary text |

Rules:
- Gold (`brass`) is a signal, not a paint. One accent per screen.
- Status is never colour alone: pair it with a word or an icon.
- Text on `brass` and `terracotta` is `ink`, and must be checked at 4.5:1.
- Dark is the default; light follows the same tokens, not a second palette.

## Type

Azeret Mono only. Two weights: **400** body and **700** headings. No 500, no
italics.

Scale is a 1.333 ratio:

| Token | Size |
| --- | --- |
| `h1` | 4.210rem |
| `h2` | 3.157rem |
| `h3` | 2.369rem |
| `h4` | 1.777rem |
| `body` | 1.000rem |
| `small` | 0.750rem |

Mono is wide. Cap body measure at ~40 characters, use sentence case, and never
set a paragraph in `h1`.

## Layout

- 4px base grid. Spacing steps: 4, 8, 12, 16, 24, 32, 48.
- Screen padding 16px. Safe-area insets always respected.
- Touch targets at least 44×44px, with 8px between adjacent targets.
- Must work at **375px** wide. Nothing may need horizontal scrolling to read.
- One primary action per screen, in the thumb arc at the bottom.

## Components

Reuse before creating. Existing pieces: `Screen`, `Text`, `Button`, `Field`,
`Card`, `ListRow`, `Badge`, `EmptyState`, `Money`, `Token`.

Every screen that loads data handles four states, and they must all be
designed:

1. **loading** — skeleton or spinner, never a blank screen
2. **empty** — one sentence saying what to do next
3. **error** — what failed, and a retry that retries the right thing
4. **data** — the normal case

## Motion

Feedback only: press states, a sheet sliding in, a row confirming. 150–250ms,
ease-out, and always respect reduced-motion. No decorative animation, no
parallax, no bouncing money counters.

## Copy

English UI, Hinglish microcopy where it is the natural thing to say.

- Plain and short: "Bill", not "Generate invoice document".
- No exclamation marks. No emoji in UI copy.
- Say what happened, then what to do: "Payment not captured. Retry?"
- Numbers use Indian grouping (`₹1,25,000`) and never abbreviate inside a
  receipt.
- Buttons are verbs: "Confirm", "Send receipt", "Add service".

## Accessibility

Contrast 4.5:1 for body text, 3:1 for large text and UI borders. Every control
has a spoken label. Focus order follows visual order. The queue screen must be
readable at 200% text size without clipping the token number.
