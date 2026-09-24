// The Studio color tokens a generated page receives, with what each one is for. The same
// list drives the injected `:root` block and the token table in the assistant's prompt, so
// the model is only ever told about variables that actually exist in the frame.
//
// These are the final semantic colors from packages/ui/build/css/source/semantic.css,
// which derives them from the inputs set in themes/light.css and themes/dark.css. The
// inputs themselves (hue, chroma, contrast, alphas) and the legacy stepped scales are left
// out. Values are read as computed, so the frame follows Studio's current theme, including
// appearance overrides, without duplicating the color formulas.
export const GENERATED_PAGE_COLOR_TOKENS = [
  // Surfaces, from the page up.
  { name: '--background', use: 'Page background' },
  { name: '--card', use: 'Surface one step above the page' },
  { name: '--card-foreground', use: 'Text on `--card`' },
  { name: '--popover', use: 'Surface two steps up: menus, popovers, tooltips' },
  { name: '--popover-foreground', use: 'Text on `--popover`' },
  { name: '--secondary', use: 'Surface three steps up: secondary button, nested panel' },
  { name: '--secondary-foreground', use: 'Text on `--secondary`' },

  // Text.
  { name: '--foreground', use: 'Body text and headings' },
  {
    name: '--muted-foreground',
    use: 'Secondary text: labels, captions, table headers, units, timestamps',
  },
  { name: '--tertiary-foreground', use: 'Least prominent text: placeholders, disabled text' },

  // Translucent fills, weakest to strongest. They layer over any surface.
  { name: '--muted', use: 'Faint fill: table header row, code block, tag' },
  { name: '--accent', use: 'Hover and selected fill for rows, list items, quiet buttons' },
  { name: '--accent-foreground', use: 'Text on `--accent`' },
  { name: '--tertiary', use: 'Strongest neutral fill: pressed state, progress track' },

  // Controls.
  { name: '--field', use: 'Background of inputs and textareas' },
  { name: '--control', use: 'Background of selects and default buttons' },
  { name: '--input', use: 'Border of inputs, selects, and default buttons' },
  { name: '--border-control-hover', use: 'Border of a control on hover' },
  { name: '--ring', use: 'Focus outline' },

  // Primary (Supabase green).
  { name: '--primary', use: 'Brand color: links, active indicators, positive status' },
  { name: '--primary-hover', use: '`--primary` on hover' },
  { name: '--primary-foreground', use: 'Text on a `--primary` fill' },
  { name: '--primary-bright', use: 'Bright brand accent: chart series, live indicators' },
  { name: '--primary-solid', use: 'Fill of the one primary button' },
  { name: '--primary-solid-hover', use: '`--primary-solid` on hover' },
  { name: '--primary-solid-foreground', use: 'Text on `--primary-solid`' },

  // Status.
  { name: '--destructive', use: 'Error and destructive state: text, icon, or fill' },
  { name: '--destructive-hover', use: '`--destructive` fill on hover' },
  { name: '--destructive-foreground', use: 'Text on a `--destructive` fill' },
  { name: '--warning', use: 'Warning state: text, icon, or fill' },
  { name: '--warning-hover', use: '`--warning` fill on hover' },
  { name: '--warning-foreground', use: 'Text on a `--warning` fill' },
  { name: '--info', use: 'Informational state: text, icon, or fill' },
  { name: '--info-foreground', use: 'Text on an `--info` fill' },

  // Borders.
  { name: '--border', use: 'Borders and dividers' },
  { name: '--border-destructive', use: 'Border of an error-tinted surface' },
  { name: '--border-warning', use: 'Border of a warning-tinted surface' },
  { name: '--border-info', use: 'Border of an info-tinted surface' },
  { name: '--border-primary-bright', use: 'Border of a brand-tinted surface' },
] as const

export function buildGeneratedPageThemeStyles(
  styles: Pick<CSSStyleDeclaration, 'getPropertyValue'>
): string {
  const colorScheme =
    styles.getPropertyValue('--helpers-os-appearance').trim().toLowerCase() === 'dark'
      ? 'dark'
      : 'light'
  const declarations = GENERATED_PAGE_COLOR_TOKENS.flatMap(({ name }) => {
    const value = styles.getPropertyValue(name).trim()
    if (!value) return []
    // CSS escapes keep even a literal closing style tag inside the style element.
    return [`${name}: ${value.replace(/</g, '\\3c ')};`]
  })

  return `:root { color-scheme: ${colorScheme}; ${declarations.join('\n')} }`
}
