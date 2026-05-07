#!/usr/bin/env node
/**
 * Emits packages/config/css/colors.css and packages/config/css/aliases.css
 * from packages/ui/build/css/tw-extend/color.js. Run from packages/config/.
 *
 * - colors.css holds the @theme block of --color-* design tokens. Tailwind
 *   v4 uses these to generate bg-{name}, text-{name}, border-{name}, etc.
 *   Names use the prefixed form (e.g. --color-foreground-light) so they
 *   match the v3 extend.colors keys.
 * - aliases.css holds @utility blocks for the *stripped* names that the
 *   v3 textColor/backgroundColor/borderColor overrides used to provide
 *   (e.g. text-light, bg-default, border-strong). Each alias is scoped
 *   to a single utility namespace, so they don't pollute --color-*.
 */

const fs = require('node:fs')
const path = require('node:path')

const colorEntries = require('../../ui/build/css/tw-extend/color.js')

// Per-utility prefix for stripped aliases.
const NAMESPACE_TO_PROPERTY = {
  foreground: { utility: 'text', property: 'color' },
  background: { utility: 'bg', property: 'background-color' },
  border: { utility: 'border', property: 'border-color' },
}

const themeLines = []
const aliasBlocks = []

for (const [key, { cssVariable }] of Object.entries(colorEntries)) {
  // Skip entries whose cssVariable references a non-existent --core-* variable.
  // These were dead in the v3 setup too — no source code uses bg-colors-* or
  // bg-variables-colors-* utilities, and the underlying CSS variables don't
  // exist in any theme file.
  if (/var\(--core-/.test(cssVariable)) continue

  // Always emit the prefixed --color-* token so v4 generates utilities for it
  // (e.g. text-foreground-light, bg-background-surface-100, border-border-strong).
  const themeKey = key.replace(/-DEFAULT$/, '')
  themeLines.push(`  --color-${themeKey}: hsl(${cssVariable});`)

  // Emit a stripped alias for foreground/background/border namespaces so
  // existing source code that uses bg-default / text-light / border-strong
  // keeps working.
  const firstDash = key.indexOf('-')
  if (firstDash === -1) continue
  const namespace = key.slice(0, firstDash)
  const remainder = key.slice(firstDash + 1)
  const ns = NAMESPACE_TO_PROPERTY[namespace]
  if (!ns) continue

  const aliasName =
    remainder === 'DEFAULT' ? 'default' : remainder.replace(/-DEFAULT$/, '').toLowerCase()
  // The utility name is e.g. "text-default", "bg-overlay-hover", "border-strong".
  const fullAlias = `${ns.utility}-${aliasName}`
  aliasBlocks.push(`@utility ${fullAlias} {\n  ${ns.property}: hsl(${cssVariable});\n}`)
}

// Hand-rolled additions that don't come from tw-extend/color.js.

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

// Miscellaneous semantic colors retained from ui.config.js extend.colors.
themeLines.push(`  --color-hi-contrast: hsl(var(--foreground-default));`)
themeLines.push(`  --color-lo-contrast: hsl(var(--background-alternative-default));`)
// `bg-studio` was a v3 backgroundColor alias.
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
 * bg-{name} / text-{name} / border-{name} / ring-{name} utilities for
 * each entry. Source mappings come from packages/ui/build/css/tw-extend/color.js
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
 * Stripped-name aliases for the prefixed --color-* tokens. The v3 config
 * exposed both prefixed (\`bg-background-surface-100\`) and stripped
 * (\`bg-default\`, \`text-light\`, \`border-strong\`) utilities. The prefixed
 * forms are auto-generated from colors.css; this file restores the stripped
 * aliases so existing source code keeps compiling unchanged.
 */

${aliasBlocks.join('\n')}
`

const outDir = path.resolve(__dirname, '..', 'css')
fs.writeFileSync(path.join(outDir, 'colors.css'), colorsCss)
fs.writeFileSync(path.join(outDir, 'aliases.css'), aliasesCss)
console.log(`wrote ${path.join(outDir, 'colors.css')} (${colorsCss.split('\n').length} lines)`)
console.log(`wrote ${path.join(outDir, 'aliases.css')} (${aliasesCss.split('\n').length} lines)`)
