import {
  getMonitoringAgent,
  getScheduleLabel,
  getScheduleMarks,
} from '~/data/monitoring-agents.utils'

type AgentWatchScheduleProps = {
  id: string
}

function DaySchedule({
  marks,
  cadence,
}: {
  marks: ReturnType<typeof getScheduleMarks>['marks']
  cadence: string
}) {
  const labeled = marks.filter((mark) => mark.label)

  return (
    <div className="space-y-2" role="img" aria-label={`Scheduled ${cadence} across a 24-hour day`}>
      <div className="relative h-4">
        {labeled.map((mark) => {
          const index = marks.findIndex((item) => item.key === mark.key)
          return (
            <span
              key={mark.key}
              className="absolute text-xs text-foreground-muted"
              style={{ left: `${(index / marks.length) * 100}%` }}
            >
              {mark.label}
            </span>
          )
        })}
      </div>
      <div className="flex h-8 gap-px">
        {marks.map((mark) => (
          <span key={mark.key} className="h-full min-w-0 flex-1 rounded-[2px] bg-brand/80" />
        ))}
      </div>
    </div>
  )
}

function WeekSchedule({
  marks,
  cadence,
}: {
  marks: ReturnType<typeof getScheduleMarks>['marks']
  cadence: string
}) {
  return (
    <div
      className="grid grid-cols-7 gap-2"
      role="img"
      aria-label={`Scheduled ${cadence} across a week`}
    >
      {marks.map((mark) => (
        <div key={mark.key} className="flex flex-col items-center gap-2">
          <div className="flex h-16 w-full flex-col rounded-md bg-surface-200 p-1">
            <span className="h-3 w-full rounded-[2px] bg-brand/80" />
          </div>
          <span className="text-xs text-foreground-muted">{mark.label}</span>
        </div>
      ))}
    </div>
  )
}

function AgentWatchSchedule({ id }: AgentWatchScheduleProps) {
  const agent = getMonitoringAgent(id)
  const { window, marks } = getScheduleMarks(agent.schedule.intervalMinutes)
  const title = getScheduleLabel(agent)

  return (
    <div className="not-prose my-6 rounded-lg border bg-surface-75 p-4">
      <p className="mb-4 text-sm text-foreground">{title}</p>
      {window === 'week' ? (
        <WeekSchedule marks={marks} cadence={agent.schedule.cadence} />
      ) : (
        <DaySchedule marks={marks} cadence={agent.schedule.cadence} />
      )}
      <p className="mt-4 text-sm text-foreground-light">{agent.schedule.onDemand}</p>
    </div>
  )
}

export { AgentWatchSchedule }
export type { AgentWatchScheduleProps }
