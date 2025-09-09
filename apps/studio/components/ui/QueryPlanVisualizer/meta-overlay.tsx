type Props = {
  planningTime?: number
  executionTime?: number
  jitTotalTime?: number
}

export const MetaOverlay = ({ planningTime, executionTime, jitTotalTime }: Props) => {
  if (planningTime === undefined && executionTime === undefined && jitTotalTime === undefined) {
    return null
  }
  return (
    <div className="absolute z-10 top-2 left-2 text-[10px] px-2 py-1 rounded bg-foreground-muted/20 backdrop-blur-sm border">
      <div className="flex gap-3">
        {planningTime !== undefined && <span>planning: {planningTime} ms</span>}
        {executionTime !== undefined && <span>exec: {executionTime} ms</span>}
        {jitTotalTime !== undefined && <span>jit: {jitTotalTime} ms</span>}
      </div>
    </div>
  )
}
