import React from 'react'
import { useSubscription } from './watcher'
import { setSteps, stepWatcher } from './store'
import { setCurrentPath } from './file-system'

export function Playthrough({ children, steps }) {
  setSteps(steps)
  const step = useSubscription(stepWatcher)

  return (
    <div className="w-full flex relative">
      <div className="flex w-full">
        <section
          className="m-3 prose relative h-full dark:prose-dark"
          style={{ width: '40%', maxWidth: '65ch' }}
        >
          <div className="px-4 relative" style={{ marginBottom: 'calc(50vh)' }}>
            {children}
          </div>
        </section>
        <section
          className="m-3 ml-0 rounded overflow-hidden flex-1 sticky"
          style={{ height: 'calc(100vh - 84px)', top: 74 }}
        >
          {step.show()}
        </section>
      </div>
    </div>
  )
}

export function GoToFile({ path }) {
  let safePath = path.startsWith('/') ? path.slice(1) : path
  return (
    <button
      className="underline decoration-green-900 decoration-dotted underline-offset-[3px]"
      onClick={() => setCurrentPath(safePath)}
    >
      {safePath}
    </button>
  )
}
