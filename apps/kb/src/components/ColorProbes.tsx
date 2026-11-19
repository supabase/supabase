export interface ColorProbesProps {
  probes: Record<string, string>
}

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

export const ColorProbes = ({ probes }: ColorProbesProps) => (
  <span aria-hidden className="hidden">
    {Object.entries(probes).map(([role, probeClass]) => (
      <span key={role} data-probe={role} className={probeClass} />
    ))}
  </span>
)
