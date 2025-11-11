# Woof Meetup - Responsive Design & CSS Architecture Guide

## Phase 1: Foundation - Responsive Design System

This document outlines the new responsive design system implemented in Phase 1, focusing on mobile-first architecture, standardized units, and modern CSS techniques.

---

## Table of Contents

1. [Breakpoint System](#breakpoint-system)
2. [Unit Standardization](#unit-standardization)
3. [Typography System](#typography-system)
4. [Container Queries](#container-queries)
5. [Migration Guide](#migration-guide)
6. [Best Practices](#best-practices)

---

## Breakpoint System

### Centralized Breakpoints

All responsive breakpoints are now defined in `styles/breakpoints.css` and accessible via CSS variables:

```css
:root {
  --breakpoint-xs: 320px; /* Extra small - Mobile devices */
  --breakpoint-sm: 640px; /* Small - Tablets (landscape) */
  --breakpoint-md: 768px; /* Medium - Tablets (portrait) & small laptops */
  --breakpoint-lg: 1024px; /* Large - Desktops */
  --breakpoint-xl: 1280px; /* Extra Large - Wide desktops */
  --breakpoint-2xl: 1536px; /* 2XL - Ultra-wide displays */
}
```

### Usage Examples

```css
/* Mobile-first approach: base styles apply to all sizes */
.card {
  display: block;
  width: 100%;
  padding: var(--spacing-sm);
}

/* Tablet and up */
@media (min-width: var(--breakpoint-sm)) {
  .card {
    display: grid;
    grid-template-columns: 1fr 1fr;
    padding: var(--spacing-md);
  }
}

/* Desktop and up */
@media (min-width: var(--breakpoint-lg)) {
  .card {
    grid-template-columns: repeat(3, 1fr);
    padding: var(--spacing-lg);
  }
}
```

### Mobile-First Principle

Always write base styles for mobile, then enhance with media queries:

```css
/* ✅ CORRECT - Mobile-first */
.element {
  font-size: var(--font-size-base);
}

@media (min-width: 640px) {
  .element {
    font-size: var(--font-size-lg);
  }
}

/* ❌ AVOID - Desktop-first */
@media (max-width: 639px) {
  .element {
    font-size: var(--font-size-base);
  }
}
```

---

## Unit Standardization

### Preferred Units by Use Case

| Use Case              | Unit            | Example                    | Notes                                         |
| --------------------- | --------------- | -------------------------- | --------------------------------------------- |
| **Font sizes**        | `rem`           | `1.125rem` (18px)          | Respects user zoom settings                   |
| **Spacing**           | `rem`           | `var(--spacing-md)`        | Consistent scale throughout                   |
| **Border radius**     | `rem` or `%`    | `0.625rem` or `50%`        | Responsive curve scaling                      |
| **Borders**           | `px`            | `1px`                      | Fine details should stay fixed                |
| **Line heights**      | unitless        | `1.5`                      | Always unitless for font metrics              |
| **Content width**     | `rem` or `%`    | `var(--max-content-width)` | Constraint sizing                             |
| **Viewport-relative** | `vw`/`vh`/`dvh` | `100dvh`                   | Use `dvh` on mobile (dynamic viewport height) |

### Why rem?

- **User Zoom Friendly**: Respects user's font-size preferences
- **Accessibility**: Better for users with vision impairments
- **Scalability**: Easy to adjust global scaling by changing `html { font-size }`
- **Maintenance**: One change affects entire system

### Base Font Size

```css
html {
  font-size: 16px; /* Reference: 1rem = 16px */
}
```

This ensures `1rem = 16px` across all browsers and devices.

---

## Typography System

### Font Size Variables

All typography is now defined with rem units and includes fluid typography for headings:

```css
:root {
  /* Fixed sizes for UI elements */
  --font-size-xs: 0.75rem; /* 12px */
  --font-size-sm: 0.8125rem; /* 13px */
  --font-size-base: 0.9375rem; /* 15px */
  --font-size-md: 1rem; /* 16px */
  --font-size-lg: 1.0625rem; /* 17px */
  --font-size-xl: 1.125rem; /* 18px */

  /* Fluid headings - scale automatically with viewport */
  --font-size-h1: clamp(1.875rem, 5vw, 3.75rem); /* 30px - 60px */
  --font-size-h2: clamp(1.5rem, 4vw, 2.5rem); /* 24px - 40px */
  --font-size-h3: clamp(1.25rem, 3vw, 2rem); /* 20px - 32px */
  --font-size-h4: clamp(1.125rem, 2.5vw, 1.75rem); /* 18px - 28px */
}
```

### Fluid Typography

Fluid typography automatically scales between viewport sizes:

```css
/* Heading scales from 30px on mobile to 60px on large screens */
h1 {
  font-size: var(--font-size-h1);
  /* clamp(min, preferred, max) */
  /* 1.875rem = min, 5vw = preferred scale, 3.75rem = max */
}
```

### Using Typography

```jsx
// React component with semantic headings
<h1>Page Title</h1>  {/* Uses --font-size-h1 (fluid) */}
<h2>Section Title</h2> {/* Uses --font-size-h2 (fluid) */}
<p>Body text</p>       {/* Uses --font-size-body-fluid */}
<span className="text-sm">Small text</span> {/* font-size-sm */}
```

### Line Heights & Font Weights

```css
:root {
  /* Line Heights */
  --line-height-tight: 1.25; /* For headings */
  --line-height-normal: 1.5; /* For body text (default) */
  --line-height-relaxed: 1.75; /* For accessibility/comfort */
  --line-height-loose: 2; /* For special emphasis */

  /* Font Weights */
  --font-weight-light: 200;
  --font-weight-normal: 400;
  --font-weight-medium: 500;
  --font-weight-semibold: 600;
  --font-weight-bold: 700;
  --font-weight-extrabold: 800;
}
```

---

## Container Queries

Container queries allow components to respond to their **container's width** rather than the viewport size. This enables true component-level responsiveness.

### Enabling Container Queries

```css
.card-container {
  container-type: inline-size;
}
```

### Usage Example

```css
/* Single column - small containers */
@container (max-width: 399px) {
  .card {
    display: flex;
    flex-direction: column;
    padding: var(--spacing-sm);
  }
}

/* Two columns - medium containers */
@container (min-width: 400px) {
  .card {
    display: grid;
    grid-template-columns: auto 1fr;
    gap: var(--spacing-md);
    padding: var(--spacing-md);
  }
}

/* Three columns - large containers */
@container (min-width: 600px) {
  .card {
    grid-template-columns: repeat(3, 1fr);
    padding: var(--spacing-lg);
  }
}
```

### When to Use Container Queries vs Media Queries

| Scenario                     | Use               | Reason                      |
| ---------------------------- | ----------------- | --------------------------- |
| Full-page layout changes     | Media queries     | Viewport-based transitions  |
| Sidebar/sidebar-less layouts | Media queries     | Global layout shift         |
| Card/component sizing        | Container queries | Context-dependent rendering |
| Modal dialogs                | Container queries | Self-contained sizing       |
| Chat bubbles                 | Container queries | Message-specific width      |
| Forms in various containers  | Container queries | Form adapts to its space    |

---

## Migration Guide

### Converting Old px-based Styles

#### Before (px-based)

```css
.component {
  font-size: 16px;
  padding: 12px 24px;
  border-radius: 8px;
  margin-top: 32px;
}
```

#### After (rem-based)

```css
.component {
  font-size: var(--font-size-md); /* 16px = 1rem */
  padding: var(--spacing-button-sm-v) var(--spacing-button-sm-h);
  border-radius: var(--radius-sm); /* 8px = 0.5rem */
  margin-top: var(--spacing-xl); /* 32px = 2rem */
}
```

### Converting Old Media Queries

#### Before (Desktop-first)

```css
.element {
  width: 50%;
}

@media (max-width: 639px) {
  .element {
    width: 100%;
  }
}
```

#### After (Mobile-first)

```css
.element {
  width: 100%;
}

@media (min-width: var(--breakpoint-sm)) {
  .element {
    width: 50%;
  }
}
```

---

## Best Practices

### 1. Use Spacing Variables Consistently

```css
/* ✅ GOOD */
.card {
  padding: var(--spacing-lg);
  margin-bottom: var(--spacing-md);
  gap: var(--spacing-sm);
}

/* ❌ AVOID */
.card {
  padding: 24px;
  margin-bottom: 16px;
  gap: 8px;
}
```

### 2. Leverage Fluid Typography for Headings

```css
/* ✅ GOOD - Heading automatically scales */
h1 {
  font-size: var(--font-size-h1);
}

/* ❌ AVOID - Fixed sizes on different screens */
h1 {
  font-size: 2.5rem;
}

@media (max-width: 639px) {
  h1 {
    font-size: 1.875rem;
  }
}
```

### 3. Mobile-First Breakpoints

```css
/* ✅ GOOD - Base mobile, enhance up */
.grid {
  display: grid;
  grid-template-columns: 1fr;
}

@media (min-width: var(--breakpoint-md)) {
  .grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

/* ❌ AVOID - Desktop-first from negative breakpoints */
.grid {
  grid-template-columns: repeat(3, 1fr);
}

@media (max-width: 767px) {
  .grid {
    grid-template-columns: 1fr;
  }
}
```

### 4. Use Dynamic Viewport Height on Mobile

```css
/* ✅ GOOD - Respects mobile browser chrome */
.hero {
  min-height: 100dvh; /* dynamic viewport height */
}

/* ❌ AVOID - Doesn't account for browser address bar */
.hero {
  min-height: 100vh;
}
```

### 5. Safe Area Insets for Notched Devices

```css
/* ✅ GOOD - Respects notches and rounded corners */
body {
  padding-left: var(--safe-area-inset-left);
  padding-right: var(--safe-area-inset-right);
}

/* Applied in breakpoints.css automatically via env() */
```

### 6. Container Queries for Component Libraries

```css
/* Component is responsive to its container, not viewport */
.message-bubble {
  container-type: inline-size;
  width: 100%;
}

@container (min-width: 300px) {
  .message-bubble {
    display: flex;
    gap: var(--spacing-sm);
  }
}
```

### 7. Avoid Hardcoded Values

```css
/* ✅ GOOD */
.sidebar {
  margin-left: var(--spacing-2xl);
  width: calc(var(--spacing-xl) * 2);
}

/* ❌ AVOID */
.sidebar {
  margin-left: 48px;
  width: 64px;
}
```

### 8. Use max-width for Content Containers

```css
/* ✅ GOOD - Content never gets too wide */
main {
  max-width: var(--max-content-width);
  margin: 0 auto;
  padding: var(--spacing-lg);
}

/* ❌ AVOID - Full width on ultra-wide displays */
main {
  width: 100%;
  padding: var(--spacing-lg);
}
```

---

## Quick Reference

### Breakpoint Variables

```css
--breakpoint-xs: 320px; /* Mobile */
--breakpoint-sm: 640px; /* Tablet */
--breakpoint-md: 768px; /* Small laptop */
--breakpoint-lg: 1024px; /* Desktop */
--breakpoint-xl: 1280px; /* Wide desktop */
--breakpoint-2xl: 1536px; /* Ultra-wide */
```

### Common Media Query Snippets

```css
/* Tablet and up */
@media (min-width: var(--breakpoint-sm)) {
}

/* Small laptop and up */
@media (min-width: var(--breakpoint-md)) {
}

/* Desktop and up */
@media (min-width: var(--breakpoint-lg)) {
}

/* Wide desktop and up */
@media (min-width: var(--breakpoint-xl)) {
}

/* Ultra-wide only */
@media (min-width: var(--breakpoint-2xl)) {
}
```

### Spacing Variables

```css
--spacing-xxs: 0.125rem; /* 2px */
--spacing-xs: 0.25rem; /* 4px */
--spacing-sm: 0.5rem; /* 8px */
--spacing-md: 1rem; /* 16px */
--spacing-lg: 1.5rem; /* 24px */
--spacing-xl: 2rem; /* 32px */
--spacing-2xl: 3rem; /* 48px */
```

---

## Testing Responsive Design

### Browser DevTools

1. Open Chrome DevTools (`F12`)
2. Toggle device toolbar (`Ctrl+Shift+M` / `Cmd+Shift+M`)
3. Test at each breakpoint:
   - Mobile: 320px - 639px
   - Tablet: 640px - 1023px
   - Desktop: 1024px+

### Test Cases

- [ ] Content readable on mobile (320px)
- [ ] Layout adapts at tablet breakpoint (640px)
- [ ] Multi-column layouts work on desktop (1024px+)
- [ ] Typography scales smoothly (fluid)
- [ ] Touch targets ≥ 44px height on mobile
- [ ] No horizontal scrolling on any viewport
- [ ] Images scale responsively
- [ ] Modals readable at all sizes

---

## Next Steps (Phase 2+)

- [ ] Convert component CSS files to use rem + breakpoints
- [ ] Implement semantic HTML (header, nav, article, section)
- [ ] Add aspect-ratio properties to images
- [ ] Convert hardcoded values to variables
- [ ] Implement CSS Grid layouts
- [ ] Add lazy loading to images
- [ ] Performance audit with Lighthouse

---

## Resources

- [MDN: Media Queries](https://developer.mozilla.org/en-US/docs/Web/CSS/Media_Queries)
- [MDN: Container Queries](https://developer.mozilla.org/en-US/docs/Web/CSS/Container_queries)
- [MDN: CSS Custom Properties](https://developer.mozilla.org/en-US/docs/Web/CSS/--*)
- [Fluid Typography Calculator](https://www.fluid-type-scale.com/)
- [The Clamp() CSS Function](https://ishadeed.com/article/css-clamp/)
