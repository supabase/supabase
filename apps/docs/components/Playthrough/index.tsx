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
    <div className="w-full h-screen flex relative overflow-hidden">
      <div className="absolute inset-0 flex">
        <div
          className="overflow-hidden rounded m-3"
          style={{ width: '40%', maxWidth: '65ch', background: '#232323', colorScheme: 'dark' }}
        >
          <section className="prose relative overflow-auto text-white h-full">
            <h1 className="px-4 mt-8">Quickstart: Next.js</h1>
            <Chapters
              chapters={chapters}
              stepIndex={step.stepIndex}
              chapterIndex={step.chapterIndex}
            />
          </section>
        </div>
        <section className="m-3 ml-0 rounded overflow-hidden" style={{ width: '60%' }}>
          {show}
        </section>
      </div>
    </div>
  )
}
