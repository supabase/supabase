export const WARP_PROBES = {
  line: 'text-border-stronger',
  surface: 'text-background',
  glyph: 'text-foreground-lighter',
  beam: 'text-brand',
} as const

export const TOPIC_SHAPE_PROBES = {
  line: 'text-glyph-strong',
  fill: 'text-background',
} as const

export const readProbeColor = (probeRoot: HTMLElement, role: string): string => {
  const probe = probeRoot.querySelector<HTMLElement>(`[data-probe="${role}"]`)
  return probe ? getComputedStyle(probe).color : 'transparent'
}

// the probes' colors change with the theme, so a canvas reads them again and redraws
export const observeTheme = (onChange: () => void): (() => void) => {
  const observer = new MutationObserver(onChange)
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
  return () => observer.disconnect()
}
