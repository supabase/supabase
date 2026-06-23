import { Globe, Network } from 'lucide-react'
import { ToggleGroup, ToggleGroupItem } from 'ui'

export type InfrastructureDiagramView = 'diagram' | 'globe'

interface InfrastructureDiagramViewToggleProps {
  view: InfrastructureDiagramView
  onViewChange: (view: InfrastructureDiagramView) => void
}

export const InfrastructureDiagramViewToggle = ({
  view,
  onViewChange,
}: InfrastructureDiagramViewToggleProps) => {
  return (
    <ToggleGroup
      type="single"
      value={view}
      className="rounded-lg border border-default bg-surface-100 p-0.5 shadow-lg"
      onValueChange={(next: InfrastructureDiagramView) => {
        if (next) onViewChange(next)
      }}
    >
      <ToggleGroupItem
        value="diagram"
        size="sm"
        className="h-7 px-2 data-[state=on]:bg-surface-200"
        aria-label="Infrastructure diagram"
      >
        <Network size={14} strokeWidth={1.5} />
      </ToggleGroupItem>
      <ToggleGroupItem
        value="globe"
        size="sm"
        className="h-7 px-2 data-[state=on]:bg-surface-200"
        aria-label="Infrastructure globe"
      >
        <Globe size={14} strokeWidth={1.5} />
      </ToggleGroupItem>
    </ToggleGroup>
  )
}
