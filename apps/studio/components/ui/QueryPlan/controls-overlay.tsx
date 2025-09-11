import { Label } from '@ui/components/shadcn/ui/label'
import { Checkbox } from '@ui/components/shadcn/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@ui/components/shadcn/ui/select'
import type { MetricsVisibility, HeatmapMode } from './contexts'

type Props = {
  metricsVisibility: MetricsVisibility
  setMetricsVisibility: (updater: (prev: MetricsVisibility) => MetricsVisibility) => void
  heatmapMode: HeatmapMode
  setHeatmapMode: (mode: HeatmapMode) => void
  showMiniMap?: boolean
  setShowMiniMap?: (show: boolean) => void
}

export const ControlsOverlay = ({
  metricsVisibility,
  setMetricsVisibility,
  heatmapMode,
  setHeatmapMode,
  showMiniMap,
  setShowMiniMap,
}: Props) => {
  return (
    <div className="absolute z-10 top-2 right-2 text-[10px] p-2 rounded bg-foreground-muted/20 backdrop-blur-sm border">
      <div className="flex flex-wrap gap-2 items-center">
        <Label className="inline-flex items-center gap-1">
          <Checkbox
            checked={metricsVisibility.time}
            onCheckedChange={(checked) =>
              setMetricsVisibility((v) => ({ ...v, time: Boolean(checked) }))
            }
          />
          <span>time</span>
        </Label>
        <Label className="inline-flex items-center gap-1">
          <Checkbox
            checked={metricsVisibility.rows}
            onCheckedChange={(checked) =>
              setMetricsVisibility((v) => ({ ...v, rows: Boolean(checked) }))
            }
          />
          <span>rows</span>
        </Label>
        <Label className="inline-flex items-center gap-1">
          <Checkbox
            checked={metricsVisibility.cost}
            onCheckedChange={(checked) =>
              setMetricsVisibility((v) => ({ ...v, cost: Boolean(checked) }))
            }
          />
          <span>cost</span>
        </Label>
        <Label className="inline-flex items-center gap-1">
          <Checkbox
            checked={metricsVisibility.buffers}
            onCheckedChange={(checked) =>
              setMetricsVisibility((v) => ({ ...v, buffers: Boolean(checked) }))
            }
          />
          <span>buffers</span>
        </Label>
        <Label className="inline-flex items-center gap-1">
          <Checkbox
            checked={metricsVisibility.output}
            onCheckedChange={(checked) =>
              setMetricsVisibility((v) => ({ ...v, output: Boolean(checked) }))
            }
          />
          <span>output</span>
        </Label>
        <div className="h-[14px] w-px bg-border mx-1" />
        <div className="flex items-center gap-x-1">
          <span>Heatmap:</span>
          <Select value={heatmapMode} onValueChange={(v) => setHeatmapMode(v as HeatmapMode)}>
            <SelectTrigger size="tiny" className="w-20">
              <SelectValue placeholder="none" />
            </SelectTrigger>
            <SelectContent align="end">
              <SelectItem value="none">none</SelectItem>
              <SelectItem value="time">time</SelectItem>
              <SelectItem value="rows">rows</SelectItem>
              <SelectItem value="cost">cost</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="h-[14px] w-px bg-border mx-1" />
        <Label className="inline-flex items-center gap-1">
          <Checkbox
            checked={!!showMiniMap}
            onCheckedChange={(checked) => setShowMiniMap?.(Boolean(checked))}
          />
          <span>Mini map</span>
        </Label>
      </div>
    </div>
  )
}
