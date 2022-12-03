import React from 'react'
import * as Collapsible from '@radix-ui/react-collapsible'
import * as Progress from '@radix-ui/react-progress'
import { stepWatcher } from './store'
import { useSubscription } from './watcher'
import { ChevronDownIcon, CheckCircledIcon, MagicWandIcon, UpdateIcon } from '@radix-ui/react-icons'
import { solveStep } from './steps'

const headerHeight = 96

export function Chapter({ chapterIndex, startAtIndex, chapterStepCount, title, children }) {
  const current = useSubscription(stepWatcher)
  const progress = Math.min(
    100,
    (100 * Math.max(current.stepIndex - startAtIndex, 0)) / chapterStepCount
  )
  const isCurrentChapter = chapterIndex == current.chapterIndex

  return (
    <>
      <div
        className="bg-white dark:bg-scale-200"
        style={{
          margin: '0 -8px',
          padding: '2px 8px',
          height: headerHeight,
          ...(isCurrentChapter ? { position: 'sticky', top: 60, zIndex: 10 } : {}),
        }}
      >
        <h2 className="text-2xl my-4">{title}</h2>
        <Progress.Root
          value={progress}
          max={100}
          className="bg-brand-800 dark:bg-brand-900"
          style={{
            borderRadius: 999,
            width: '100%',
            height: 12,
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <Progress.Indicator
            className="bg-neutral-300 dark:bg-neutral-700"
            style={{
              width: '100%',
              height: '100%',
              transition: 'transform 660ms cubic-bezier(0.65, 0, 0.35, 1)',
              transform: `translateX(${progress}%)`,
            }}
          />
        </Progress.Root>
      </div>
      {children}
    </>
  )
}

export function Step({ stepIndex, children, title }) {
  const currentStep = useSubscription(stepWatcher)
  const i = stepIndex
  const done = i < currentStep.stepIndex
  const current = i == currentStep.stepIndex
  const [open, setOpen] = React.useState(false)

  return (
    <Collapsible.Root
      className={`border rounded-lg p-4 my-4 ${
        current
          ? 'border-brand-900 text-black dark:text-white z-10 bg-white dark:bg-scale-200'
          : 'border-neutral-600'
      }`}
      style={{
        padding: 6,
        margin: '6px -6px',
        ...(current ? { position: 'sticky', bottom: 4, top: headerHeight + 60 } : {}),
      }}
      open={current || open}
      onOpenChange={(open) => setOpen(open)}
    >
      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
        <span style={{ flex: 1, lineHeight: '17px' }}>{title}</span>
        <Collapsible.Trigger
          className={`bg-none border-none ${children && !current ? 'block' : 'hidden'}`}
        >
          <ChevronDownIcon style={{ color: 'currentcolor' }} />
        </Collapsible.Trigger>
        <button
          onClick={solveStep}
          className={`${
            currentStep.solution && current && !currentStep.loading
              ? 'block hover:text-brand-900'
              : 'hidden'
          }`}
        >
          <MagicWandIcon height={18} width={18} />
        </button>
        <div
          className={`${current && currentStep.loading ? 'block animate-spin' : 'hidden'}`}
          style={{ animationDuration: '1.6s' }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            viewBox="0 0 24 24"
          >
            <path d="M12 2L12 6"></path>
            <path d="M12 18L12 22"></path>
            <path d="M4.93 4.93L7.76 7.76"></path>
            <path d="M16.24 16.24L19.07 19.07"></path>
            <path d="M2 12L6 12"></path>
            <path d="M18 12L22 12"></path>
            <path d="M4.93 19.07L7.76 16.24"></path>
            <path d="M16.24 7.76L19.07 4.93"></path>
          </svg>
        </div>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="18"
          height="18"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          className={`${done ? 'text-brand-900' : 'hidden'}`}
          viewBox="0 0 24 24"
        >
          <path d="M22 11.08V12a10 10 0 11-5.93-9.14"></path>
          <path d="M22 4L12 14.01 9 11.01"></path>
        </svg>
      </div>

      {children && (
        <Collapsible.Content style={{ padding: '8px 0' }}>{children}</Collapsible.Content>
      )}
    </Collapsible.Root>
  )
}
