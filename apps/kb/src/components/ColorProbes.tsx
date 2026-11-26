export interface ColorProbesProps {
  probes: Record<string, string>
}

export const ColorProbes = ({ probes }: ColorProbesProps) => (
  <span aria-hidden className="hidden">
    {Object.entries(probes).map(([role, probeClass]) => (
      <span key={role} data-probe={role} className={probeClass} />
    ))}
  </span>
)
