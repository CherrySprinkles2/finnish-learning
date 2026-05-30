@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Manrope:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap');

:root {
  /* ---- Typography families ---- */
  --font-display: "Space Grotesk", "Segoe UI", system-ui, sans-serif;
  --font-body: "Manrope", "Segoe UI", system-ui, sans-serif;
  --font-mono: "JetBrains Mono", ui-monospace, "SF Mono", monospace;

  /* ---- Type scale (1.250 major third) ---- */
  --fs-display: 4.209rem;   /* 67px */
  --fs-h1: 3.157rem;        /* 51px */
  --fs-h2: 2.369rem;        /* 38px */
  --fs-h3: 1.777rem;        /* 28px */
  --fs-h4: 1.333rem;        /* 21px */
  --fs-body-lg: 1.125rem;   /* 18px */
  --fs-body: 1rem;          /* 16px */
  --fs-sm: 0.875rem;        /* 14px */
  --fs-xs: 0.75rem;         /* 12px */

  --lh-tight: 1.08;
  --lh-snug: 1.28;
  --lh-normal: 1.6;

  --tracking-tight: -0.02em;
  --tracking-normal: 0;
  --tracking-wide: 0.08em;

  --fw-regular: 400;
  --fw-medium: 500;
  --fw-semibold: 600;
  --fw-bold: 700;

  /* ---- Spacing (4px base) ---- */
  --space-1: 0.25rem;
  --space-2: 0.5rem;
  --space-3: 0.75rem;
  --space-4: 1rem;
  --space-5: 1.5rem;
  --space-6: 2rem;
  --space-7: 3rem;
  --space-8: 4rem;
  --space-9: 6rem;

  /* ---- Radius ---- */
  --radius-xs: 4px;
  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 18px;
  --radius-xl: 28px;
  --radius-full: 999px;

  /* ---- Elevation (tuned per-theme below for shadow color) ---- */
  --shadow-sm: 0 1px 2px rgba(0,0,0,0.4);
  --shadow-md: 0 8px 24px -8px rgba(0,0,0,0.55);
  --shadow-lg: 0 24px 64px -16px rgba(0,0,0,0.65);
}

[data-theme="revontuli"] {
  --bg-base: #090D14;
  --bg-inset: #0B0F17;
  --bg-surface: #0F141D;
  --bg-elevated: #161D28;
  --bg-overlay: #1E2632;

  --border-subtle: #1A222E;
  --border-default: #28323F;
  --border-strong: #3A4654;
  --border-focus: #5BD1A0;

  --text-primary: #EAEFF5;
  --text-secondary: #A4AFBD;
  --text-tertiary: #687585;
  --text-disabled: #444F5C;
  --text-on-accent: #04140E;
  --text-link: #72DBB0;

  --accent-subtle: #0E211B;
  --accent-muted: #18352B;
  --accent-primary: #5BD1A0;
  --accent-hover: #72DBB0;
  --accent-pressed: #46BC8C;
  --accent-emphasis: #8DE6C2;

  --glow-primary: rgba(91, 209, 160, 0.55);
  --glow-secondary: rgba(110, 139, 216, 0.45);
  --glow-base: #070A10;

  --success: #4FD08C;  --success-subtle: #102419;
  --warning: #E0B860;  --warning-subtle: #2A2212;
  --danger:  #E97B92;  --danger-subtle:  #2C1419;
  --info:    #66C2DA;  --info-subtle:    #0E2128;
}