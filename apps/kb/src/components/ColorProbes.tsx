export interface ColorProbesProps {
  probes: Record<string, string>
}

export const readProbeColor = (probeRoot: HTMLElement, role: string): string => {
  const probe = probeRoot.querySelector<HTMLElement>(`[data-probe="${role}"]`)
  return probe ? getComputedStyle(probe).color : 'transparent'
}

export const ColorProbes = ({ probes }: ColorProbesProps) => (
  <span aria-hidden className="hidden">
    {Object.entries(probes).map(([role, probeClass]) => (
      <span key={role} data-probe={role} className={probeClass} />
    ))}
  </span>
)
