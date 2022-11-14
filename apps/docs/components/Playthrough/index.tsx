import React from 'react'
import { Chapters } from './chapter'
import { useSubscription } from './watcher'
import { allSteps, chapters } from './steps-data'
import { stepWatcher } from './store'

stepWatcher.notify(allSteps[7])

export function Playthrough() {
  const step = useSubscription(stepWatcher)

  const show = step.show()
  return (
    <div className="w-full h-screen flex relative overflow-hidden">
      <div className="absolute inset-0 flex">
        <div
          className="overflow-hidden rounded m-3"
          style={{ width: '40%', background: '#232323', colorScheme: 'dark' }}
        >
          <section className="relative overflow-auto text-white h-full">
            <h1 className="text-4xl p-4 mt-4">Quickstart: Next.js</h1>
            <Chapters
              chapters={chapters}
              stepIndex={step.stepIndex}
              chapterIndex={step.chapterIndex}
            />
          </section>
        </div>
        <section
          className="m-3 ml-0 rounded overflow-hidden"
          style={{ width: '60%', background: '#232323' }}
        >
          {show}
        </section>
      </div>
    </div>
  )
}
