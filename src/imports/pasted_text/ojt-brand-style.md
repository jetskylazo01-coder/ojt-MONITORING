---
name: Professional OJT Monitor
colors:
  surface: '#f8f9ff'
  surface-dim: '#ccdbf3'
  surface-bright: '#f8f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eff4ff'
  surface-container: '#e6eeff'
  surface-container-high: '#dce9ff'
  surface-container-highest: '#d5e3fc'
  on-surface: '#0d1c2e'
  on-surface-variant: '#464553'
  inverse-surface: '#233144'
  inverse-on-surface: '#eaf1ff'
  outline: '#777584'
  outline-variant: '#c8c4d5'
  surface-tint: '#544fc0'
  primary: '#1f108e'
  on-primary: '#ffffff'
  primary-container: '#3730a3'
  on-primary-container: '#a9a7ff'
  inverse-primary: '#c3c0ff'
  secondary: '#006a61'
  on-secondary: '#ffffff'
  secondary-container: '#86f2e4'
  on-secondary-container: '#006f66'
  tertiary: '#0f009f'
  on-tertiary: '#ffffff'
  tertiary-container: '#2a28bb'
  on-tertiary-container: '#a6a8ff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#e2dfff'
  primary-fixed-dim: '#c3c0ff'
  on-primary-fixed: '#0f0069'
  on-primary-fixed-variant: '#3b35a7'
  secondary-fixed: '#89f5e7'
  secondary-fixed-dim: '#6bd8cb'
  on-secondary-fixed: '#00201d'
  on-secondary-fixed-variant: '#005049'
  tertiary-fixed: '#e1e0ff'
  tertiary-fixed-dim: '#c0c1ff'
  on-tertiary-fixed: '#07006c'
  on-tertiary-fixed-variant: '#2f2ebe'
  background: '#f8f9ff'
  on-background: '#0d1c2e'
  surface-variant: '#d5e3fc'
typography:
  display-lg:
    fontFamily: Hanken Grotesk
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Hanken Grotesk
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Hanken Grotesk
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  title-md:
    fontFamily: Hanken Grotesk
    fontSize: 18px
    fontWeight: '500'
    lineHeight: 24px
  body-lg:
    fontFamily: Hanken Grotesk
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Hanken Grotesk
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-md:
    fontFamily: Hanken Grotesk
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.05em
  label-sm:
    fontFamily: Hanken Grotesk
    fontSize: 11px
    fontWeight: '500'
    lineHeight: 14px
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  base: 4px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  container-margin: 16px
  gutter: 12px
---

## Brand & Style

The design system is anchored in a **Corporate Modern** aesthetic, prioritizing clarity, efficiency, and professional trust. It is designed specifically for an On-the-Job Training (OJT) context, where students need to log hours quickly and supervisors need to verify data without friction.

The visual language balances the rigor of an enterprise tool with the accessibility of a modern mobile app. It utilizes high-quality white space, a systematic grid, and a disciplined color application to reduce cognitive load. The emotional response should be one of "structured productivity"—users should feel that their progress is being tracked accurately and professionally.

## Colors

The palette is built on a foundation of **Indigo** and **Teal** to evoke stability and growth.

- **Primary (Indigo):** Used for key branding elements, primary navigation states, and authoritative headers. It establishes the "corporate" tone.
- **Secondary/Accent (Teal):** Reserved for primary action buttons (e.g., "Clock In," "Submit Report"). This bright accent draws the eye to the most important task on the screen.
- **Neutral (Slate Grays):** A comprehensive range of slates is used for text, borders, and secondary icons to maintain a sophisticated, non-distracting environment.
- **Status Colors:** Standardized green, amber, and red are used for training status indicators (Completed, Pending, Overdue) but are slightly desaturated to fit the professional palette.

## Typography

This design system uses **Hanken Grotesk** across all levels. It is a clean, sharp, contemporary sans-serif that excels in readability on small screens while maintaining a modern, precise character.

- **Scale:** Headlines use tighter tracking and heavier weights to create a strong information hierarchy.
- **Utility:** Labels for data points (e.g., "Total Hours," "Company Name") use an uppercase style with slightly increased letter spacing to differentiate them from interactive body text.
- **Mobile Optimization:** Large display sizes are capped at 32px to ensure they don't wrap awkwardly on smaller devices.

## Layout & Spacing

The layout is optimized for mobile-first interaction, following a **4px baseline grid**. 

- **Safe Margins:** A standard 16px (md) horizontal margin is applied to all screens to ensure content doesn't hit the bezel.
- **Touch Targets:** All interactive elements maintain a minimum height of 44px for accessibility.
- **Information Density:** For data-heavy lists (like attendance logs), the vertical spacing is tightened to 8px (sm) to allow more information to be visible at once without scrolling.
- **Visual Grouping:** Related items are grouped in cards with 16px internal padding, separated by 12px gutters.

## Elevation & Depth

To maintain a "clean and efficient" feel, the design system avoids heavy shadows in favor of **Tonal Layers** and **Low-Contrast Outlines**.

- **Surface Levels:** The primary background uses a very light slate tint (`#F8FAFC`). Interactive cards and containers use a pure white surface.
- **Borders:** Containers are defined by 1px solid borders in a light gray (`#E2E8F0`). This creates a structured, grid-like appearance suitable for a productivity tool.
- **Subtle Elevation:** Only the most critical floating elements (like a "Clock In" FAB or a Bottom Sheet) use a soft, highly diffused shadow (Blur: 10px, Opacity: 5%) to indicate they sit above the main content layer.

## Shapes

The shape language is **Soft** but disciplined. 

- **Buttons & Inputs:** Use a 0.25rem (4px) corner radius. This conveys a professional, slightly technical feel compared to pill-shaped or fully rounded elements.
- **Cards:** Main content containers use a 0.5rem (8px) radius to provide a gentle distinction from the edge of the screen.
- **Progress Bars:** Use a fully rounded (pill) end-cap to contrast with the angularity of the containers, making the data feel more dynamic and approachable.

## Components

### Buttons
- **Primary Action:** Solid Teal background with white text. High-contrast, used for the main OJT task (e.g., "Submit Log").
- **Secondary Action:** Ghost style with Indigo border and text. Used for navigation or less critical tasks.
- **Tertiary:** Indigo text only, no border. Used for "Cancel" or "View Details."

### Input Fields
- Structured with a persistent top-aligned label in `label-md` style.
- 1px Slate-200 border that changes to Indigo-600 on focus.
- Error states utilize a desaturated red border with a helper text label below.

### Cards & Lists
- **Log Cards:** Used for daily entries. Features a left-accent border color indicating status (e.g., Green for approved, Amber for pending).
- **Stat Chips:** Small, rounded-sm containers with light tinted backgrounds (e.g., light Indigo) used for displaying "Hours Rendered" or "Days Remaining."

### Specialized OJT Components
- **Time-Tracker Toggle:** A large, prominent toggle or button at the top of the dashboard for Clocking In/Out, utilizing the primary accent color.
- **Progress Ring:** A circular visualization for OJT completion percentage, centered in the dashboard for immediate feedback.
- **Signature Pad:** A dedicated modal component for supervisors to provide digital sign-offs on logs, utilizing a clean white canvas with a slate-colored "Clear" button.