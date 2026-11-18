# Apple iOS Human Interface Guidelines Design System

## 1. Overview
The ApxForge Funds platform implements Apple iOS HIG styling across all user surfaces, supporting both Light and Dark dynamic system appearances.

## 2. Typography
- **Font Stack**: `-apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display", sans-serif`
- **Large Title**: `34px` bold, tight tracking (`-0.02em`)
- **Title 1**: `28px` bold
- **Title 2**: `22px` bold
- **Title 3**: `20px` semibold
- **Headline**: `17px` semibold
- **Body**: `17px` regular
- **Callout**: `16px` regular
- **Subheadline**: `15px` regular
- **Footnote**: `13px` regular
- **Caption 1**: `12px` regular
- **Section Headers**: `11px` uppercase, semibold, wide tracking (`0.06em`), secondary color

## 3. Color Tokens
All colors are defined via dynamic CSS variables in `app/globals.css` and mapped to Tailwind `ios-*` utilities.

| Token | Light Theme | Dark Theme | Purpose |
|-------|-------------|------------|---------|
| `ios-bg` | `#F2F2F7` | `#000000` | Primary app canvas |
| `ios-card` | `#FFFFFF` | `#1C1C1E` | Inset group & card containers |
| `ios-grouped` | `#F2F2F7` | `#000000` | Grouped list background |
| `ios-separator` | `rgba(60,60,67,0.29)` | `rgba(84,84,88,0.65)` | Inset list dividers |
| `ios-hairline` | `rgba(60,60,67,0.15)` | `rgba(84,84,88,0.35)` | 1px boundary rules |
| `ios-text` | `#000000` | `#FFFFFF` | Primary text label |
| `ios-secondary-text` | `#8E8E93` | `#8E8E93` | Secondary metadata |
| `ios-blue` | `#007AFF` | `#0A84FF` | Primary action / link |
| `ios-green` | `#34C759` | `#30D158` | Gains / Low risk / Success |
| `ios-red` | `#FF3B30` | `#FF453A` | Losses / High risk / Danger |
| `ios-orange` | `#FF9500` | `#FF9F0A` | Moderate risk / Warning |
| `ios-yellow` | `#FFCC00` | `#FFD60A` | Caution / Highlights |
| `ios-purple` | `#AF52DE` | `#BF5AF2` | ML models / Predictions |
| `ios-teal` | `#5AC8FA` | `#64D2FF` | Statistics / Quant metrics |
| `ios-indigo` | `#5856D6` | `#5E5CE6` | Backtesting / Analytics |

## 4. Materials & Surfaces
- **Frosted Glass Header & Navigation**: `backdrop-filter: saturate(180%) blur(20px)` with semi-transparent tint (`--ios-glass`).
- **Cards & Inset Groups**: Radius `18px`, padded `16px-20px`, flat hairline stroke, subtle diffused elevation.
- **Modals & Action Sheets**: Radius `24px` top corners, slide-up spring animation with dim backdrop overlay.

## 5. Interaction & Motion
- **Press Scale**: Active elements shrink slightly on touch/mouse-down: `scale(0.97)` with `0.15s ease-out`.
- **Framer Motion Springs**:
  - Transition: `type: "spring", stiffness: 300, damping: 30`.
- **Accessibility**: Honors `prefers-reduced-motion: reduce` by replacing springs with immediate cross-fades.

## 6. Components Library
- `Card`: Rounded 18px elevated content container.
- `List` & `ListRow`: iOS Grouped inset lists with optional chevrons and trailing badges.
- `Segmented`: Apple-style sliding pill segmented control.
- `Sheet`: Bottom sheet modal with smooth spring entrance.
- `Toggle`: iOS smooth toggle switch.
- `Button`: Primary filled, tinted, and subtle variants.
- `Input` & `Select`: Inset styled form controls with clear focus rings.
- `TabBar` & `Sidebar`: Desktop responsive sidebar collapsing to mobile bottom tab bar.
- `CommandPalette`: Keyboard shortcut `Cmd/Ctrl+K` spotlight search.
- `ShortcutsModal`: `?` key help overlay.

