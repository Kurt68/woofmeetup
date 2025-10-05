# CSS Variables Quick Reference

## Woof Meetup Design System

---

## 🎨 Colors

### Primary Palette

```css
--color-primary: #ffc0cb; /* Pink - main brand color */
--color-primary-rgb: 255, 192, 203; /* For rgba() usage */
--color-secondary: #53c8a0; /* Teal - accent color */
--color-secondary-rgb: 83, 200, 160; /* For rgba() usage */
--color-accent: #b51010; /* Red - call-to-action */
```

**Usage:**

```css
.button {
  background-color: var(--color-primary);
  color: var(--color-white);
}

.overlay {
  background-color: rgba(var(--color-primary-rgb), 0.5);
}
```

### Neutral Colors

```css
--color-white: #ffffff;
--color-black: #000000;
--color-gray-light: #f8f9fa;
--color-gray-border: #f0f0f0;
--color-gray-skeleton: whitesmoke;
--color-gray-divider: #eee;
--color-gray-text: #666;
--color-text-dark: #333;
```

### Semantic Colors

```css
/* Error States */
--color-error: hsl(0, 100%, 70%);
--color-error-dark: #c62828;

/* Warning States */
--color-warning: #f59e0b;
--color-warning-bg: #fef3c7;
--color-warning-text: #92400e;

/* Success States */
--color-success: #15803d;
--color-success-bg: #f0fdf4;
--color-success-border: #bbf7d0;
```

**Usage:**

```css
.error-message {
  color: var(--color-error);
  background-color: var(--color-error-bg);
}

.success-alert {
  color: var(--color-success);
  border: 1px solid var(--color-success-border);
}
```

### Pink Variations

```css
--color-pink-light: rgba(255, 193, 203, 0.3);
--color-pink-border: rgb(255, 193, 203);
--color-pink-disabled: rgba(255, 192, 203, 0.85);
--color-pink-bubble: rgb(255, 241, 243);
```

---

## 📏 Spacing Scale

```css
--spacing-xs: 0.25rem; /* 4px */
--spacing-sm: 0.5rem; /* 8px */
--spacing-md: 1rem; /* 16px */
--spacing-lg: 1.5rem; /* 24px */
--spacing-xl: 2rem; /* 32px */
--spacing-2xl: 3rem; /* 48px */
```

**Usage:**

```css
.card {
  padding: var(--spacing-lg);
  margin-bottom: var(--spacing-md);
}

.button {
  padding: var(--spacing-sm) var(--spacing-lg);
}
```

**Guidelines:**

- Use `xs` for tight spacing (icon gaps, small padding)
- Use `sm` for compact layouts
- Use `md` for standard spacing (default)
- Use `lg` for comfortable spacing
- Use `xl` for section spacing
- Use `2xl` for major section breaks

---

## 🔤 Typography

### Font Families

```css
--font-primary: 'Readex Pro', sans-serif;
--font-secondary: 'Poor Story', system-ui;
```

### Font Sizes

```css
--font-size-xs: 12px; /* Small labels */
--font-size-sm: 13px; /* Secondary text */
--font-size-base: 15px; /* Body text, buttons */
--font-size-md: 16px; /* Navigation */
--font-size-lg: 17px; /* Input fields */
--font-size-xl: 18px; /* Subheadings */
--font-size-2xl: 60px; /* Main title */
--font-size-warning: 4rem; /* Error icons */
```

**Usage:**

```css
body {
  font-family: var(--font-primary);
  font-size: var(--font-size-base);
}

h1 {
  font-size: var(--font-size-2xl);
}

.label {
  font-size: var(--font-size-sm);
}
```

---

## 🔲 Border Radius

```css
--radius-sm: 8px; /* Small elements */
--radius-md: 10px; /* Cards, modals */
--radius-lg: 25px; /* Rounded buttons */
--radius-xl: 30px; /* Primary buttons */
--radius-2xl: 40px; /* Navigation buttons */
--radius-full: 50px; /* Circular elements */
```

**Usage:**

```css
.card {
  border-radius: var(--radius-md);
}

.button-primary {
  border-radius: var(--radius-xl);
}

.avatar {
  border-radius: var(--radius-full);
}
```

---

## ⚡ Transitions

```css
--transition-fast: 0.2s ease;
--transition-normal: 0.3s ease;
```

**Usage:**

```css
.button {
  transition: background-color var(--transition-normal);
}

.tooltip {
  transition: opacity var(--transition-fast);
}
```

---

## 🌑 Shadows

```css
--shadow-sm: 0 4px 12px rgba(0, 0, 0, 0.15);
--shadow-md: 0 1rem 2rem rgba(0, 0, 0, 0.3);
--shadow-modal: rgba(0, 0, 0, 0.16) 0px 10px 36px 0px, rgba(0, 0, 0, 0.06) 0px 0px
    0px 1px;
```

**Usage:**

```css
.card {
  box-shadow: var(--shadow-sm);
}

.modal {
  box-shadow: var(--shadow-modal);
}

.polaroid:hover {
  box-shadow: var(--shadow-md);
}
```

---

## 📚 Z-Index Scale

```css
--z-base: 1;
--z-dropdown: 999;
--z-overlay: 1000;
--z-modal: 1001;
--z-tooltip: 9999;
```

**Usage:**

```css
.dropdown {
  z-index: var(--z-dropdown);
}

.modal-overlay {
  z-index: var(--z-overlay);
}

.modal {
  z-index: var(--z-modal);
}
```

**Guidelines:**

- Never use arbitrary z-index values
- Always use the scale for consistency
- If you need a new layer, add it to the scale

---

## 💡 Common Patterns

### Button Styles

```css
.primary-button {
  color: var(--color-white);
  background-color: var(--color-primary);
  border-radius: var(--radius-xl);
  padding: var(--spacing-sm) var(--spacing-lg);
  font-size: var(--font-size-base);
  transition: background-color var(--transition-normal);
}

.primary-button:hover {
  background-color: var(--color-secondary);
}
```

### Card Styles

```css
.card {
  background-color: var(--color-white);
  border-radius: var(--radius-md);
  padding: var(--spacing-lg);
  box-shadow: var(--shadow-sm);
}
```

### Input Styles

```css
.input {
  border: 1px solid var(--color-primary);
  border-radius: var(--radius-sm);
  padding: var(--spacing-sm);
  font-size: var(--font-size-lg);
  font-family: var(--font-primary);
}

.input:focus {
  border-color: var(--color-secondary);
  outline: none;
}
```

### Modal Styles

```css
.modal {
  background-color: var(--color-white);
  border-radius: var(--radius-md);
  padding: var(--spacing-xl);
  box-shadow: var(--shadow-modal);
  z-index: var(--z-modal);
}

.modal-overlay {
  background-color: rgba(var(--color-black-rgb), 0.5);
  z-index: var(--z-overlay);
}
```

---

## 🎯 Best Practices

### ✅ DO

```css
/* Use semantic variable names */
.button {
  background-color: var(--color-primary);
}

/* Use spacing scale */
.card {
  padding: var(--spacing-lg);
}

/* Use rgba with RGB component variables */
.overlay {
  background-color: rgba(var(--color-primary-rgb), 0.5);
}
```

### ❌ DON'T

```css
/* Don't use hardcoded colors */
.button {
  background-color: #ffc0cb; /* ❌ */
}

/* Don't use arbitrary spacing */
.card {
  padding: 23px; /* ❌ */
}

/* Don't use magic numbers */
.element {
  z-index: 9999999; /* ❌ */
}
```

---

## 🔄 Migration Guide

### Before (Hardcoded)

```css
.button {
  color: white;
  background-color: pink;
  border-radius: 30px;
  padding: 12px 30px;
  font-size: 15px;
}
```

### After (Using Variables)

```css
.button {
  color: var(--color-white);
  background-color: var(--color-primary);
  border-radius: var(--radius-xl);
  padding: 12px 30px; /* Keep specific button padding */
  font-size: var(--font-size-base);
}
```

---

## 🌈 Creating Theme Variants

### Light Theme (Default)

Already defined in `:root`

### Dark Theme (Example)

```css
[data-theme='dark'] {
  --color-primary: #ff8fa3;
  --color-secondary: #6ee7b7;
  --color-white: #1a1a1a;
  --color-black: #ffffff;
  --color-gray-light: #2d2d2d;
  --color-text-dark: #e5e5e5;
}
```

### High Contrast Theme (Example)

```css
[data-theme='high-contrast'] {
  --color-primary: #ff0066;
  --color-secondary: #00ff99;
  --color-white: #000000;
  --color-black: #ffffff;
}
```

---

## 🐛 Troubleshooting

### Variable Not Working?

1. Check spelling: `var(--color-primary)` not `var(--color-primery)`
2. Ensure variable is defined in `:root`
3. Check browser DevTools to see computed value
4. Verify no typos in variable name

### Color Looks Wrong?

1. Check if using RGB component for rgba: `rgba(var(--color-primary-rgb), 0.5)`
2. Verify opacity value is between 0 and 1
3. Check for conflicting styles with higher specificity

### Spacing Inconsistent?

1. Use spacing scale variables consistently
2. Avoid mixing px values with rem-based scale
3. Check for !important declarations overriding styles

---

## 📞 Support

For questions or issues:

1. Check this reference guide
2. Review `CSS_REFACTORING_STATUS.md` for detailed information
3. Consult the team's design system documentation
4. Ask in the development team channel

---

**Last Updated:** Current Session  
**Version:** 1.0  
**Maintainer:** Development Team
