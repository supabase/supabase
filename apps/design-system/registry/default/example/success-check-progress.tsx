import { SuccessCheck } from 'ui'

const STEPS = ['Preparing', 'Upgrading', 'Finalising']

export default function SuccessCheckProgress() {
  const completedThrough = 1

  return (
    <div className="flex flex-col gap-3">
      {STEPS.map((step, index) => {
        const isCompleted = index < completedThrough
        const isCurrent = index === completedThrough

        return (
          <div key={step} className="flex items-center gap-3">
            {isCompleted ? (
              <SuccessCheck />
            ) : (
              <span
                className={`flex size-5 shrink-0 items-center justify-center rounded-full border ${
                  isCurrent ? 'border-foreground' : 'border-muted bg-overlay-hover'
                }`}
              />
            )}
            <span
              className={`text-sm ${
                isCurrent
                  ? 'text-foreground'
                  : isCompleted
                    ? 'text-foreground-light'
                    : 'text-foreground-lighter'
              }`}
            >
              {isCurrent ? `${step}…` : isCompleted ? `${step} complete` : step}
            </span>
          </div>
        )
      })}
    </div>
  )
}
