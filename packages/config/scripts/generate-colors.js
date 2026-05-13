#!/usr/bin/env node
/**
 * Emits packages/config/css/colors.css and packages/config/css/theme.css
 * from packages/config/scripts/tw-extend-color-snapshot.js. Run from
 * packages/config/.
 *
 * - colors.css holds a :root block that declares the Radix/scale --color-*
 *   tokens, forwarding each one to its underlying --colors-{hue}{n} source
 *   var (which switches across light/dark themes via radix-vars.css). This
 *   is where the actual runtime value lives. Brand steps 200..600 forward
 *   to the semantic hsl(var(--brand-{step})) triplet instead of the raw
 *   --colors-brand{n} scale value.
 * - theme.css holds the @theme inline block of --color-* design tokens
 *   that Tailwind v4 uses to generate bg-{name}, text-{name}, border-{name},
 *   ring-{name}, plus directional border variants like border-r-{name}.
 *   Semantic tokens wrap their source HSL triplet in hsl(); Radix/scale
 *   tokens self-reference the matching var declared in :root (colors.css)
 *   so theme switching works at runtime without re-registering utilities.
 *   The file also contains hand-curated namespaced utility blocks
 *   (--background-color-*, --border-color-*, --text-color-*) that only
 *   generate utilities for a single Tailwind namespace, plus a deprecated
 *   --color-border-* block.
 */

const fs = require('node:fs')
const path = require('node:path')

// Snapshot of the v3 tw-extend/color.js (was deleted alongside the migration).
// Kept here as a generation source so the script remains runnable.
const colorEntries = require('./tw-extend-color-snapshot.js')

const themeLines = []
const rootLines = []

// Emit prefixed --color-* tokens for every semantic entry in the snapshot.
// `foo-DEFAULT` becomes `--color-foo`; everything else keeps its full key.
// `border-*` entries are intentionally skipped here — they live in the
// deprecated --color-border-* block in `namespacedTokens` below, which is
// curated by hand (the snapshot has more border entries than we want to
// expose as the legacy `--color-border-*` namespace).
for (const [key, { cssVariable }] of Object.entries(colorEntries)) {
  if (/var\(--core-/.test(cssVariable)) continue
  if (key.startsWith('border-')) continue
  const themeKey = key.replace(/-DEFAULT$/, '')
  themeLines.push(`  --color-${themeKey}: hsl(${cssVariable});`)
}

// --- Hand-rolled additions that don't come from the snapshot ---

// Radix hue palettes — each --color-{hue}-{step} resolves to the raw hue var.
const radixHues = [
  'amber',
  'blue',
  'crimson',
  'gold',
  'gray',
  'green',
  'indigo',
  'orange',
  'pink',
  'purple',
  'red',
  'slate',
  'tomato',
  'violet',
  'yellow',
]
for (const hue of radixHues) {
  for (let i = 1; i <= 12; i++) {
    const solid = `--color-${hue}-${i * 100}`
    const alpha = `--color-${hue}A-${i * 100}`
    rootLines.push(`  ${solid}: var(--colors-${hue}${i});`)
    rootLines.push(`  ${alpha}: var(--colors-${hue}A${i});`)
    themeLines.push(`  ${solid}: var(${solid});`)
    themeLines.push(`  ${alpha}: var(${alpha});`)
  }
}

// blackA / whiteA — neutral alpha scales.
for (let i = 1; i <= 12; i++) {
  const black = `--color-blackA-${i * 100}`
  const white = `--color-whiteA-${i * 100}`
  rootLines.push(`  ${black}: var(--colors-blackA${i});`)
  rootLines.push(`  ${white}: var(--colors-whiteA${i});`)
  themeLines.push(`  ${black}: var(${black});`)
  themeLines.push(`  ${white}: var(${white});`)
}

// Supabase scale + scaleA. Underlying --colors-scale{n} / --colors-scaleA{n}
// are aliases (defined in radix-vars.css) that switch between slate/gray
// across light/dark themes.
for (let i = 1; i <= 12; i++) {
  const solid = `--color-scale-${i * 100}`
  const alpha = `--color-scaleA-${i * 100}`
  rootLines.push(`  ${solid}: var(--colors-scale${i});`)
  rootLines.push(`  ${alpha}: var(--colors-scaleA${i});`)
  themeLines.push(`  ${solid}: var(${solid});`)
  themeLines.push(`  ${alpha}: var(${alpha});`)
}

// Supabase brand scale. Steps 200..600 are semantic: they forward to
// hsl(var(--brand-{step})) so light/dark themes can override the value.
// The other steps fall back to the raw --colors-brand{n} scale and get
// a self-referencing entry in theme.css; the semantic steps are already
// emitted to themeLines by the snapshot pass above (brand-200..600,
// brand-DEFAULT, brand-link), so we don't re-emit them here.
const SEMANTIC_BRAND_STEPS = new Set([2, 3, 4, 5, 6])
for (let i = 1; i <= 12; i++) {
  const solid = `--color-brand-${i * 100}`
  if (SEMANTIC_BRAND_STEPS.has(i)) {
    rootLines.push(`  ${solid}: hsl(var(--brand-${i * 100}));`)
  } else {
    rootLines.push(`  ${solid}: var(--colors-brand${i});`)
    themeLines.push(`  ${solid}: var(${solid});`)
  }
}

// Sidebar shadcn semantic tokens.
themeLines.push(`  --color-sidebar: hsl(var(--sidebar-background));`)
themeLines.push(`  --color-sidebar-foreground: hsl(var(--sidebar-foreground));`)
themeLines.push(`  --color-sidebar-primary: hsl(var(--sidebar-primary));`)
themeLines.push(`  --color-sidebar-primary-foreground: hsl(var(--sidebar-primary-foreground));`)
themeLines.push(`  --color-sidebar-accent: hsl(var(--sidebar-accent));`)
themeLines.push(`  --color-sidebar-accent-foreground: hsl(var(--sidebar-accent-foreground));`)
themeLines.push(`  --color-sidebar-border: hsl(var(--sidebar-border));`)
themeLines.push(`  --color-sidebar-ring: hsl(var(--sidebar-ring));`)

// Misc semantic colors.
themeLines.push(`  --color-hi-contrast: hsl(var(--foreground-default));`)
themeLines.push(`  --color-lo-contrast: hsl(var(--background-alternative-default));`)

// Namespaced utility blocks — these intentionally use Tailwind v4's per-
// namespace --{property}-color-* keys so the values only generate utilities
// for a single namespace (bg-, border-, text-) rather than all of them.
const namespacedTokens = `  /*
   * This will generate colors only for bg utilities.
   */
  --background-color-200: hsl(var(--background-200));
  --background-color-default: hsl(var(--background-default));
  --background-color-muted: hsl(var(--background-muted));
  --background-color-alternative-200: hsl(var(--background-alternative-200));
  --background-color-alternative: hsl(var(--background-alternative-default));
  --background-color-selection: hsl(var(--background-selection));
  --background-color-control: hsl(var(--background-control));
  --background-color-surface-75: hsl(var(--background-surface-75));
  --background-color-surface-100: hsl(var(--background-surface-100));
  --background-color-surface-200: hsl(var(--background-surface-200));
  --background-color-surface-300: hsl(var(--background-surface-300));
  --background-color-surface-400: hsl(var(--background-surface-400));
  --background-color-overlay: hsl(var(--background-overlay-default));
  --background-color-overlay-hover: hsl(var(--background-overlay-hover));
  --background-color-button: hsl(var(--background-button-default));
  --background-color-dialog: hsl(var(--background-dialog-default));
  --background-color-dash-sidebar: hsl(var(--background-dash-sidebar));
  --background-color-dash-canvas: hsl(var(--background-dash-canvas));
  --background-color-studio: hsl(var(--background-200));

  /*
   * This will generate colors for all utilities, they'll have border in the name i.e. bg-border-overlay, text-border-muted
   * This usage should be discouraged and deprecated.
   */
  --color-border: hsl(var(--border-default));
  --color-border-overlay: hsl(var(--border-overlay));
  --color-border-muted: hsl(var(--border-muted));
  --color-border-control: hsl(var(--border-control));
  --color-border-strong: hsl(var(--border-strong));
  --color-border-stronger: hsl(var(--border-stronger));
  /*
   * This will generate colors only for border utilities
   * i.e. bg-muted and they'll only have border-color: var(--border-muted) rule
   */
  --border-color-default: hsl(var(--border-default));
  --border-color-overlay: hsl(var(--border-overlay));
  --border-color-muted: hsl(var(--border-muted));
  --border-color-control: hsl(var(--border-control));
  --border-color-strong: hsl(var(--border-strong));
  --border-color-stronger: hsl(var(--border-stronger));
  --border-color-secondary: hsl(var(--border-secondary));
  --border-color-alternative: hsl(var(--border-alternative));
  --border-color-button: hsl(var(--border-button-default));
  --border-color-button-hover: hsl(var(--border-button-hover));

  /* This will generate colors only for text utilities */
  --text-color-default: hsl(var(--foreground-default));
  --text-color-light: hsl(var(--foreground-light));
  --text-color-lighter: hsl(var(--foreground-lighter));
  --text-color-muted: hsl(var(--foreground-muted));
  --text-color-contrast: hsl(var(--foreground-contrast));`

// Misc design tokens (font, breakpoint, sizing, radius, transform-origin)
// that lived in tailwind.config.js / ui.config.js theme blocks.
const miscTokens = `  /* misc theme tokens — typography, breakpoints, sizing, transform-origin */
  --font-sans: var(
    --font-custom,
    Circular,
    custom-font,
    Helvetica Neue,
    Helvetica,
    Arial,
    sans-serif
  );
  --font-mono: var(--font-source-code-pro, Source Code Pro, Office Code Pro, Menlo, monospace);
  --breakpoint-xs: 480px;
  --width-listbox: 320px;
  --radius-panel: 6px;
  --spacing-content: 21px;
  --spacing-card: var(--card-padding-x);
  --transform-origin-dropdown: var(--radix-dropdown-menu-content-transform-origin);
  --transform-origin-popover: var(--radix-popover-menu-content-transform-origin);`

const colorsCss = `/*
 * Auto-generated by scripts/generate-colors.js — do not edit by hand.
 * Run \`node scripts/generate-colors.js\` from packages/config/ to refresh.
 *
 * Declares the Radix/scale --color-* CSS variables in :root, each forwarding
 * to its underlying --colors-{hue}{n} source (defined in radix-vars.css)
 * which switches between light/dark themes. theme.css references these
 * variables from its @theme inline block.
 */

:root {
${rootLines.join('\n')}
}
`

const themeCss = `/*
 * Auto-generated by scripts/generate-colors.js — do not edit by hand.
 * Run \`node scripts/generate-colors.js\` from packages/config/ to refresh.
 *
 * Defines every Tailwind v4 --color-* design token. Tailwind generates
 * bg-{name} / text-{name} / border-{name} / ring-{name} / border-{r,l,t,b}-{name}
 * utilities for each entry. Semantic tokens wrap their HSL triplet in hsl();
 * Radix/scale tokens self-reference the var declared in colors.css :root.
 * Source mappings: tw-extend-color-snapshot.js (semantic tokens) plus the
 * Radix and scale aliases from radix-vars.css.
 */

@theme inline {
${themeLines.join('\n')}

${namespacedTokens}

${miscTokens}
}
`

const outDir = path.resolve(__dirname, '..', 'css')
fs.writeFileSync(path.join(outDir, 'colors.css'), colorsCss)
fs.writeFileSync(path.join(outDir, 'theme.css'), themeCss)
console.log(`wrote ${path.join(outDir, 'colors.css')} (${colorsCss.split('\n').length} lines)`)
console.log(`wrote ${path.join(outDir, 'theme.css')} (${themeCss.split('\n').length} lines)`)
