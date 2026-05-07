#!/usr/bin/env node
/**
 * Emits packages/config/css/colors.css and packages/config/css/aliases.css
 * from packages/ui/build/css/tw-extend/color.js. Run from packages/config/.
 *
 * - colors.css holds the @theme block of --color-* design tokens. Tailwind
 *   v4 uses these to generate bg-{name}, text-{name}, border-{name},
 *   ring-{name}, plus directional border variants like border-r-{name}.
 *   Names use the prefixed form (e.g. --color-foreground-light) so they
 *   match the v3 extend.colors keys, plus stripped forms (--color-light,
 *   --color-strong) for stripped names that only belong to one namespace.
 * - aliases.css holds @utility blocks for stripped names that COLLIDE
 *   between text/bg/border (default, muted, alternative, control,
 *   overlay, button). Each one had a different color in v3, so we can't
 *   share a --color-* token; the @utility scopes the value to a single
 *   utility namespace. Directional variants for border-* aliases are
 *   included for the cases actually used in source code.
 */

const fs = require('node:fs')
const path = require('node:path')

// Snapshot of the v3 tw-extend/color.js (was deleted alongside the migration).
// Kept here as a generation source so the script remains runnable.
const colorEntries = require('./tw-extend-color-snapshot.js')

const NAMESPACE_TO_UTIL = {
  foreground: { utility: 'text', property: 'color', cssVar: '--foreground-' },
  background: { utility: 'bg', property: 'background-color', cssVar: '--background-' },
  border: { utility: 'border', property: 'border-color', cssVar: '--border-' },
}

// Stripped names that exist in multiple namespaces with different colors.
// These get static @utility blocks instead of --color-* tokens.
const CONFLICTING_STRIPPED_NAMES = new Set([
  'default',
  'muted',
  'alternative',
  'control',
  'overlay',
  'button',
])

// Directional border-color variants observed in source code grep. Add to this
// set if a future class like `border-r-default` shows up.
const DIRECTIONAL_BORDER_VARIANTS = {
  default: ['b'],
  muted: ['b', 't'],
  strong: ['r'], // strong is non-conflicting so it goes through --color-*; included here
  // for completeness even though it'll be auto-generated.
}

const themeLines = []
const aliasBlocks = []
const seenStripped = new Map() // stripped name → namespace count

// First pass: classify each entry by stripped name.
for (const [key, { cssVariable }] of Object.entries(colorEntries)) {
  if (/var\(--core-/.test(cssVariable)) continue

  const firstDash = key.indexOf('-')
  if (firstDash === -1) continue
  const ns = key.slice(0, firstDash)
  const remainder = key.slice(firstDash + 1)
  if (!NAMESPACE_TO_UTIL[ns]) continue

  const stripped =
    remainder === 'DEFAULT' ? 'default' : remainder.replace(/-DEFAULT$/, '').toLowerCase()
  seenStripped.set(stripped, (seenStripped.get(stripped) ?? 0) + 1)
}

// Second pass: emit tokens / utilities.
for (const [key, { cssVariable }] of Object.entries(colorEntries)) {
  if (/var\(--core-/.test(cssVariable)) continue

  // Always emit the prefixed --color-* token so v4 generates utilities like
  // text-foreground-light, bg-background-surface-100, border-border-strong.
  const themeKey = key.replace(/-DEFAULT$/, '')
  themeLines.push(`  --color-${themeKey}: hsl(${cssVariable});`)

  const firstDash = key.indexOf('-')
  if (firstDash === -1) continue
  const ns = key.slice(0, firstDash)
  const remainder = key.slice(firstDash + 1)
  const nsInfo = NAMESPACE_TO_UTIL[ns]
  if (!nsInfo) continue

  const stripped =
    remainder === 'DEFAULT' ? 'default' : remainder.replace(/-DEFAULT$/, '').toLowerCase()

  if (CONFLICTING_STRIPPED_NAMES.has(stripped) || seenStripped.get(stripped) > 1) {
    // Static utility scoped to one namespace.
    const fullAlias = `${nsInfo.utility}-${stripped}`
    aliasBlocks.push(`@utility ${fullAlias} {\n  ${nsInfo.property}: hsl(${cssVariable});\n}`)

    // Emit directional border variants for the cases actually used in source.
    if (ns === 'border' && DIRECTIONAL_BORDER_VARIANTS[stripped]) {
      for (const dir of DIRECTIONAL_BORDER_VARIANTS[stripped]) {
        const sideMap = { r: 'right', l: 'left', t: 'top', b: 'bottom' }
        const side = sideMap[dir]
        if (!side) continue
        aliasBlocks.push(
          `@utility border-${dir}-${stripped} {\n  border-${side}-color: hsl(${cssVariable});\n}`
        )
      }
    }
  } else {
    // Non-conflicting: emit a stripped --color-{stripped} token. Tailwind
    // auto-generates text-/bg-/border-/border-{r,l,t,b,x,y}- variants.
    themeLines.push(`  --color-${stripped}: hsl(${cssVariable});`)
  }
}

// --- Hand-rolled additions that don't come from tw-extend/color.js ---

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
    themeLines.push(`  --color-${hue}-${i * 100}: var(--colors-${hue}${i});`)
    themeLines.push(`  --color-${hue}A-${i * 100}: var(--colors-${hue}A${i});`)
  }
}
// blackA / whiteA — neutral alpha scales.
for (let i = 1; i <= 12; i++) {
  themeLines.push(`  --color-blackA-${i * 100}: var(--colors-blackA${i});`)
  themeLines.push(`  --color-whiteA-${i * 100}: var(--colors-whiteA${i});`)
}

// Supabase scale + scaleA. Underlying --colors-scale{n} / --colors-scaleA{n}
// are aliases (defined in radix-vars.css) that switch between slate/gray
// across light/dark themes.
for (let i = 1; i <= 12; i++) {
  themeLines.push(`  --color-scale-${i * 100}: var(--colors-scale${i});`)
  themeLines.push(`  --color-scaleA-${i * 100}: var(--colors-scaleA${i});`)
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
aliasBlocks.push(`@utility bg-studio {\n  background-color: hsl(var(--background-200));\n}`)

// Misc design tokens (font, breakpoint, sizing, radius, transform-origin)
// that lived in tailwind.config.js / ui.config.js theme blocks.
const miscTokens = `  --font-sans: var(--font-custom, Circular, custom-font, Helvetica Neue, Helvetica, Arial, sans-serif);
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
 * Defines every Tailwind v4 --color-* design token. Tailwind generates
 * bg-{name} / text-{name} / border-{name} / ring-{name} / border-{r,l,t,b}-{name}
 * utilities for each entry. Source mappings: tw-extend-color-snapshot.js
 * (semantic tokens) plus the Radix and scale aliases from radix-vars.css.
 */

@theme {
${themeLines.join('\n')}

  /* misc theme tokens — typography, breakpoints, sizing, transform-origin */
${miscTokens}
}
`

const aliasesCss = `/*
 * Auto-generated by scripts/generate-colors.js — do not edit by hand.
 *
 * Stripped-name aliases for utility names that COLLIDE between text/bg/border
 * with different colors in v3 (default, muted, alternative, control, overlay,
 * button). Each @utility is scoped to one utility namespace so the colors
 * stay distinct. Directional border variants (border-{r,l,t,b}-default, etc.)
 * are emitted for cases actually used in source code; add to
 * DIRECTIONAL_BORDER_VARIANTS in scripts/generate-colors.js as new ones appear.
 */

${aliasBlocks.join('\n')}
`

const outDir = path.resolve(__dirname, '..', 'css')
fs.writeFileSync(path.join(outDir, 'colors.css'), colorsCss)
fs.writeFileSync(path.join(outDir, 'aliases.css'), aliasesCss)
console.log(`wrote ${path.join(outDir, 'colors.css')} (${colorsCss.split('\n').length} lines)`)
console.log(`wrote ${path.join(outDir, 'aliases.css')} (${aliasesCss.split('\n').length} lines)`)
