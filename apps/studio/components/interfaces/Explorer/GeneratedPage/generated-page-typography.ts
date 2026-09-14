// Base element styles for the frame, derived from packages/config/typography.css.
//
// Deliberately minimal. This sets what a plain `<h2>` or `<body>` looks like so an
// unstyled page already reads as Studio, and stops there — no utility classes, no
// component classes. The generated page writes its own CSS against the theme tokens
// captured by buildGeneratedPageThemeStyles.
//
// An earlier version shipped a `studio-*` component kit alongside this. It was removed:
// handing the model a ready-made card class made "one card per item" the path of least
// resistance, and no amount of prose telling it not to reach for that class outweighed
// having provided it.
export const GENERATED_PAGE_TYPOGRAPHY_STYLES = `
  :root {
    --font-sans: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
    --font-heading: var(--font-sans);
    --font-source-code-pro: ui-monospace, Menlo, Consolas, monospace;
    --font-mono: var(--font-source-code-pro);
  }
  html, body {
    font-family: var(--font-sans);
    background: var(--background);
    color: var(--foreground);
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }
  body {
    margin: 0;
    font-size: var(--text-base, 0.9375rem);
    line-height: var(--text-base--line-height, 1.5);
  }
  *, *::before, *::after { box-sizing: border-box; }
  button, input, select, textarea { font-family: inherit; }
  code, pre, kbd, samp { font-family: var(--font-mono); }
  /*
   * A three-step scale, not the six this once injected and not the two that replaced them.
   * Six sizes gave a page no hierarchy, only noise; collapsing every heading to body size
   * flattened it the other way, since a semibold heading at body size barely reads as a
   * heading at all.
   *
   * So: h2 keeps a real step above body for section headings, h3 and below separate by
   * weight alone, and the largest step is shared between h1 and whatever prominent figure
   * the page leads with — a page spends its biggest size once, on one or the other.
   */
  h1, h2, h3, h4, h5, h6 {
    margin: 0;
    font-size: var(--text-base, 0.9375rem);
    line-height: var(--text-base--line-height, 1.5);
    font-weight: var(--font-weight-semibold, 600);
  }
  h1 {
    font-size: var(--text-2xl, 1.375rem);
    line-height: var(--text-2xl--line-height, calc(2 / 1.5));
    letter-spacing: var(--tracking-tight, -0.025em);
  }
  h2 {
    font-size: var(--text-xl, 1.125rem);
    line-height: var(--text-xl--line-height, calc(1.75 / 1.25));
  }
  small {
    font-size: var(--text-sm, 0.8125rem);
    line-height: var(--text-sm--line-height, calc(1.25 / 0.875));
  }
  strong { font-weight: var(--font-weight-semibold, 600); }
  [hidden] { display: none; }
`
