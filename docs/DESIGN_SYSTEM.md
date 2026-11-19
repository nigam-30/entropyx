# Design System

This defines the visual language of your product. Without it, screens can use different fonts,
spacing, colors, buttons, or corner styles. A design system gives the agent a consistent visual
vocabulary.

## 1. Design Direction
Style: Technical / Minimal / Cybersecurity Premium
Mood: Precise, trustworthy, resilient, and focused. Evokes high-assurance cryptography without visual clutter.
Design Principles:
- **Instant Clarity**: Present high-entropy strings and cryptographic metrics with high contrast and zero visual ambiguity.
- **Security-First Ergonomics**: Actionable security states (auto-lock, clipboard copy, breach warnings) must have immediate and clear visual feedback.
- **Zero Distraction**: Clean monochrome surfaces with targeted functional accents (Emerald for security, Amber for warnings, Rose for critical alerts).

## 2. Brand
Brand Name: EntropyX (Cryptographic Suite & Zero-Knowledge Vault)
Logo: Shield icon with a central cryptographic key glyph (`ShieldCheck` / `LockKeyhole`). Always accompanied by crisp monospace status badging.
Brand Voice: Authoritative, technical, concise, and uncompromising on user privacy and mathematical rigor.

## 3. Color Palette
Primary: #4F46E5 (Indigo 600 - Action and emphasis)
Secondary: #0EA5E9 (Sky 500 - Interactive secondary highlights)
Background: #F8FAFC (Slate 50 - Ultra-clean technical backdrop)
Surface: #FFFFFF (Pure White - High elevation containers and cards)
Text: #0F172A (Slate 900 - High-contrast readable typography)
Muted Text: #64748B (Slate 500 - Auxiliary labels, meta details)
Border: #E2E8F0 (Slate 200 - Clean structural division)
Success: #10B981 (Emerald 500 - Cryptographic strength, safe status)
Warning: #F59E0B (Amber 500 - Moderate entropy, cautionary hints)
Error: #EF4444 (Rose 500 - Weak passwords, lock states, failures)

## 4. Typography
Font Family: Inter, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif
Heading Font: Inter, -apple-system, sans-serif
Body Font: system-ui, -apple-system, sans-serif
Monospace Font: 'JetBrains Mono', 'Cascadia Code', ui-monospace, 'SF Mono', Menlo, Consolas, monospace
H1: 28px (1.75rem) / SemiBold (600) / Line Height: 1.2
H2: 20px (1.25rem) / Medium (500) / Line Height: 1.3
H3: 16px (1.00rem) / Medium (500) / Line Height: 1.4
Body: 14px (0.875rem) / Regular (400) / Line Height: 1.5
Small: 12px (0.75rem) / Regular (400) or Medium (500) / Line Height: 1.4

## 5. Spacing
Base Unit: 4px
Spacing Scale: 4px / 8px / 12px / 16px / 24px / 32px / 48px / 64px / 96px

## 6. Border Radius
Small: 6px (rounded-md)
Medium: 10px (rounded-lg)
Large: 16px (rounded-2xl)
Pill: 9999px (rounded-full)

## 7. Shadows
Small: 0 1px 2px 0 rgb(0 0 0 / 0.05) (shadow-sm)
Medium: 0 4px 6px -1px rgb(0 0 0 / 0.07), 0 2px 4px -2px rgb(0 0 0 / 0.07) (shadow-md)
Large: 0 10px 15px -3px rgb(15 23 42 / 0.08), 0 4px 6px -4px rgb(15 23 42 / 0.04) (shadow-lg)

## 8. Buttons
Primary Button: Solid Indigo 600 (`#4F46E5`), text white, font medium, rounded-xl, hover:bg-indigo-700, active:scale-[0.98], transition-all duration-150.
Secondary Button: Surface white, border Slate 200, text Slate 700, hover:bg-slate-50, hover:border-slate-300, rounded-xl.
Danger Button: Solid Rose 600 (`#E11D48`), text white, font medium, hover:bg-rose-700, rounded-xl.
Disabled: Opacity 50%, cursor not-allowed, pointer-events none, grayscale-20.
Loading: Opacity 80%, cursor-wait with inline spinning SVG loader, disabled interaction.

## 9. Inputs
Default: Background white, border 1px solid Slate 200, text Slate 900, rounded-xl, padding 10px 14px, font-size 14px.
Focus: Border color Indigo 500, ring 3px ring-indigo-500/20, outline none.
Error: Border color Rose 500, ring 3px ring-rose-500/20, text Slate 900.
Disabled: Background Slate 100, border Slate 200, text Slate 400, cursor not-allowed.
Placeholder: Text Slate 400, font regular.

## 10. Cards
- Padding: 20px (mobile: 16px, desktop: 24px)
- Border: 1px solid #E2E8F0 (Slate 200)
- Radius: 16px (rounded-2xl)
- Shadow: `0 10px 25px -5px rgba(226, 232, 240, 0.6)` (soft subtle elevation)
- Background: #FFFFFF (White)

## 11. Navigation
Header: Sticky top container, minimal layout with application branding, live C++ backend engine health indicator pill, and segmented tab toggle (`Generator` vs `Vault`).
Sidebar: None (Single-column centered ergonomic canvas max-w-2xl).
Mobile Navigation: Segmented full-width tab switcher pinned beneath header, touch-friendly hit target (min 44px).

## 12. States
Loading: Smooth pulse animation (`animate-pulse`) or rotating icon spinner with text indicator.
Empty: Centered icon, gentle muted typography, actionable CTA button (e.g., "Generate and Save First Password").
Error: Rose tinted badge/banner with specific, non-leaking error description.
Success: Emerald badge with checkmark and transient auto-dismissing toast (e.g., "Copied to clipboard!").
Disabled: Low contrast, muted border, inert pointer events.

## 13. Icons
Icon Library: Lucide React (`lucide-react`)
Default Size: 18px (small: 14px, medium: 18px, large: 24px)
Icon Style: Outline, 2px stroke width, rounded caps and joins.

## 14. Responsive Design
Mobile: Single column, fluid width, 16px outer gutter, stacked control toggles.
Tablet: Centered card layout (max-w-xl), inline multi-column options.
Desktop: Centered optimal card width (max-w-2xl), expanded monospace visualizer, split strength meter metrics.
Breakpoints:
Mobile: < 640px (sm)
Tablet: 640px - 1024px (md)
Desktop: > 1024px (lg)

## 15. Accessibility
- Use semantic HTML (`<main>`, `<header>`, `<button>`, `<nav>`, `<section>`).
- Maintain WCAG AAA contrast ratio ($\ge 7:1$) for monospace password characters and UI text against surfaces.
- Support full keyboard navigation with visible focus rings (`ring-2 ring-indigo-500`).
- Provide visible focus states on all interactive controls.
- Provide accessible `aria-label` attributes for icon-only action buttons (Copy, Regenerate, Delete).
- Do not rely only on color: Strength meter combines color cues (Red/Yellow/Green) with textual labels and numerical Shannon entropy values.
