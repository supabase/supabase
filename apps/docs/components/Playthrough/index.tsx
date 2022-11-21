import React from 'react'
import { Chapters } from './Chapter'
import { useSubscription } from './watcher'
import { allSteps, chapters } from './steps-data'
import { stepWatcher } from './store'

stepWatcher.notify(allSteps[0])

export function Playthrough() {
  const step = useSubscription(stepWatcher)

  const show = step.show()
  return (
    <div className="w-full flex relative">
      <div className="flex w-full">
        <div className=" m-3" style={{ width: '40%', maxWidth: '65ch', colorScheme: 'dark' }}>
          <section className="prose relative h-full dark:prose-dark">
            <h1 className="px-4 mt-8">Quickstart: Next.js</h1>
            <Chapters
              chapters={chapters}
              stepIndex={step.stepIndex}
              chapterIndex={step.chapterIndex}
            />
          </section>
        </div>
        <section
          className="m-3 ml-0 rounded overflow-hidden flex-1 sticky"
          style={{ height: 'calc(100vh - 84px)', top: 74 }}
        >
          {show}
        </section>
      </div>
    </div>
  )
}
