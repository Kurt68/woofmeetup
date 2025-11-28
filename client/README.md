# 🐕 Woof Meetup - Client

React frontend for Woof Meetup, a social platform for dog owners to connect, chat, and arrange meetups.

## 📚 Documentation

- **[Development Guide](../docs/DEVELOPMENT.md)** - Setup and local development
- **[Responsive Design Guide](./src/styles/RESPONSIVE_DESIGN_GUIDE.md)** - CSS architecture and breakpoints
- **[CSS Variables Reference](./src/styles/CSS_VARIABLES_REFERENCE.md)** - Design system and color scheme
- **[Sentry Setup](./SENTRY_SETUP.md)** - Error tracking configuration
- **Component Documentation** - See individual component READMEs:
  - [Auth Components](./src/components/auth/README.md)
  - [Chat Components](./src/components/chat/README.md)
  - [Dashboard Components](./src/components/dashboard/README.md)
  - [Onboarding Components](./src/components/onboarding/README.md)

## 🚀 Quick Start

```bash
npm install
npm run dev
```

Visit **http://localhost:5173** in your browser.

## 🛠️ Available Scripts

```bash
# Development
npm run dev              # Start Vite dev server with HMR

# Production
npm run build            # Build optimized bundle
npm run preview          # Preview production build locally

# Code Quality
npm run lint             # Run ESLint with max-warnings=0

# Bundle Analysis
npm run build:analyze    # Analyze bundle size with visualization
npm run build:report     # Generate detailed build report
```

**Note:** Client linting is strict (max-warnings: 0). To fix common issues:
```bash
npm run lint -- --fix
```

## 📦 Tech Stack

- **React 18** - UI framework
- **Vite 7** - Build tool with HMR
- **Zustand** - State management
- **React Router** - Client-side routing
- **Socket.io Client** - Real-time messaging
- **Axios** - HTTP client
- **Stripe Elements** - Payment integration
- **Cloudflare Turnstile** - CAPTCHA
- **Lucide React** - Icon library
- **React Spring** - Animation library
- **Sentry** - Error tracking

## 🏗️ Project Structure

```
src/
├── components/         # Reusable UI components
│   ├── auth/          # Authentication modal and forms
│   ├── chat/          # Real-time messaging interface
│   ├── dashboard/     # Swipe matching interface
│   ├── onboarding/    # Profile creation and editing
│   ├── layout/        # Navigation and layout
│   └── upload/        # Image upload components
├── pages/             # Page components for routing
├── hooks/             # Custom React hooks
├── store/             # Zustand state management
├── services/          # API client and utilities
├── styles/            # CSS files and design tokens
├── App.jsx            # Main app component
└── main.jsx           # React DOM entry point
```

## 🎨 Styling

- **Modern CSS** with nesting (no preprocessors)
- **Container Queries** for component-relative layouts
- **Clamp Functions** for fluid responsive sizing
- **CSS Variables** for design system

See [CSS Variables Reference](./src/styles/CSS_VARIABLES_REFERENCE.md) for complete design token documentation.

## 🔒 Security

- CSRF protection tokens
- Secure cookie-based authentication
- Input validation and sanitization
- Content Security Policy headers

## 📊 State Management

Uses **Zustand** for lightweight state management:

- `useAuthStore` - User authentication state
- `useChatStore` - Messaging state
- `useDashboardStore` - Matching and discovery state

## 🧪 Testing

End-to-end tests with Playwright are in the root `/tests` directory.

```bash
npm run test:e2e        # Run tests headless
npm run test:e2e:ui     # Run with UI
npm run test:e2e:debug  # Debug mode
```

## 🐛 Troubleshooting

**Hot Module Replacement (HMR) not working?**

If changes aren't reflected in the browser, try:

```bash
# Hard refresh the browser (Cmd+Shift+R or Ctrl+Shift+R)
# Or restart the dev server:
npm run dev
```

**Build file size too large?**

Check the bundle analysis:

```bash
npm run build:analyze
```

**Port 5173 already in use?**

```bash
lsof -ti:5173 | xargs kill -9
npm run dev
```

## 📚 Related Documentation

- [Main README](../README.md) - Project overview
- [Development Guide](../docs/DEVELOPMENT.md) - Full setup and testing
- [Sentry Error Tracking](./SENTRY_SETUP.md) - Monitoring configuration

---

**Happy coding! 🐕**
