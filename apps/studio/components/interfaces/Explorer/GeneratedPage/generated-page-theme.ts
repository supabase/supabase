// These roles come from packages/ui/build/css/source/semantic.css and the light/dark
// theme files. Read their computed values so the frame uses Studio's current theme,
// including appearance overrides, without duplicating color formulas or their inputs.
const GENERATED_PAGE_COLOR_VARIABLES = [
  '--background',
  '--foreground',
  '--card',
  '--card-foreground',
  '--popover',
  '--popover-foreground',
  '--primary',
  '--primary-foreground',
  '--secondary',
  '--secondary-foreground',
  '--muted',
  '--muted-foreground',
  '--tertiary',
  '--tertiary-foreground',
  '--accent',
  '--accent-foreground',
  '--field',
  '--control',
  '--control-raised',
  '--border',
  '--input',
  '--border-control-hover',
  '--ring',
  '--warning',
  '--warning-foreground',
  '--destructive',
  '--destructive-foreground',
  '--info',
  '--info-foreground',
  '--border-brand',
  '--border-warning',
  '--border-destructive',
  '--border-info',
  '--brand-link',
  '--brand-default',
  '--brand-400',
  '--brand-500',
  '--brand-600',
] as const

const GENERATED_PAGE_TYPOGRAPHY_VARIABLES = [
  '--spacing',
  '--text-xs',
  '--text-xs--line-height',
  '--text-sm',
  '--text-sm--line-height',
  '--text-base',
  '--text-base--line-height',
  '--text-lg',
  '--text-lg--line-height',
  '--text-xl',
  '--text-xl--line-height',
  '--text-2xl',
  '--text-2xl--line-height',
  '--font-weight-medium',
  '--font-sans',
  '--font-heading',
  '--font-mono',
  '--font-source-code-pro',
  '--tracking-tight',
  '--tracking-wider',
  '--radius-md',
  '--radius-lg',
] as const

// Font faces loaded in Studio are not inherited by the sandbox. Keep each font
// variable usable on its own when those named faces are unavailable in the frame.
const FONT_FALLBACKS: Partial<Record<string, string>> = {
  '--font-sans': 'ui-sans-serif, system-ui, sans-serif',
  '--font-heading': 'ui-sans-serif, system-ui, sans-serif',
  '--font-mono': 'ui-monospace, Menlo, Consolas, monospace',
  '--font-source-code-pro': 'ui-monospace, Menlo, Consolas, monospace',
}

export function buildGeneratedPageThemeStyles(
  styles: Pick<CSSStyleDeclaration, 'getPropertyValue'>
): string {
  const colorScheme =
    styles.getPropertyValue('--helpers-os-appearance').trim().toLowerCase() === 'dark'
      ? 'dark'
      : 'light'
  const declarations = [
    ...GENERATED_PAGE_COLOR_VARIABLES,
    ...GENERATED_PAGE_TYPOGRAPHY_VARIABLES,
  ].flatMap((name) => {
    const value = styles.getPropertyValue(name).trim()
    if (!value) return []
    const fallback = FONT_FALLBACKS[name]
    const resolvedValue = fallback ? `${value}, ${fallback}` : value
    // CSS escapes keep even a literal closing style tag inside the style element.
    return [`${name}: ${resolvedValue.replace(/</g, '\\3c ')};`]
  })

  return `:root { color-scheme: ${colorScheme}; ${declarations.join('\n')} }`
}
