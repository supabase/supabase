// Browser CSS equivalents of the heading/text utilities and base rules in
// packages/config/typography.css. The iframe has no Tailwind processor; sizes and
// weights use the active Studio tokens captured by buildGeneratedPageThemeStyles.
export const GENERATED_PAGE_TYPOGRAPHY_STYLES = `
  :root {
    --font-sans: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
    --font-heading: var(--font-sans);
    --font-source-code-pro: ui-monospace, Menlo, Consolas, monospace;
    --font-mono: var(--font-source-code-pro);
  }
  html, body {
    font-family: var(--font-sans);
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }
  button, input, select, textarea {
    font-family: inherit;
  }
  code, pre, kbd, samp, .font-mono {
    font-family: var(--font-mono);
  }
  .font-sans {
    font-family: var(--font-sans);
  }
  .font-heading {
    font-family: var(--font-heading);
  }
  h1, h2, h3, h4, h5, h6 {
    margin: 0;
    font-weight: inherit;
  }
  h1, h2, h3, h4, h5, h6,
  .heading-title, .heading-section, .heading-subSection, .heading-default, .heading-compact {
    scroll-margin-top: calc(var(--spacing, 0.25rem) * 20);
  }
  h1, .heading-title {
    font-size: var(--text-2xl, 1.375rem);
    line-height: var(--text-2xl--line-height, calc(2 / 1.5));
    letter-spacing: var(--tracking-tight, -0.025em);
  }
  h2, .heading-section {
    font-size: var(--text-xl, 1.125rem);
    line-height: var(--text-xl--line-height, calc(1.75 / 1.25));
  }
  body, h3, .heading-subSection, .text-default {
    font-size: var(--text-base, 0.9375rem);
    line-height: var(--text-base--line-height, 1.5);
  }
  h4, h5, .heading-default {
    font-size: var(--text-sm, 0.8125rem);
    line-height: var(--text-sm--line-height, calc(1.25 / 0.875));
  }
  h6, small, .heading-compact, .heading-meta, .text-compact {
    font-size: var(--text-xs, 0.75rem);
    line-height: var(--text-xs--line-height, calc(1 / 0.75));
  }
  h4, h5, h6, strong, .heading-default, .heading-compact, .heading-meta {
    font-weight: var(--font-weight-medium, 500);
  }
  .heading-meta {
    font-family: var(--font-mono);
    text-transform: uppercase;
    letter-spacing: var(--tracking-wider, 0.05em);
  }
  .text-subTitle {
    font-size: var(--text-lg, 1rem);
    line-height: var(--text-lg--line-height, calc(1.75 / 1.125));
  }
`
