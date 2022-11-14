import React from 'react'
import * as Collapsible from '@radix-ui/react-collapsible'
import * as Progress from '@radix-ui/react-progress'
import { ChevronDownIcon, CheckCircledIcon, MagicWandIcon, UpdateIcon } from '@radix-ui/react-icons'

import { solveStep } from './steps'
const headerHeight = 96

export function Chapters({ stepIndex, chapterIndex, chapters }) {
  return (
    <div className="px-4" style={{ color: '#bbb' }}>
      {chapters.map((chapter, i) => (
        <Chapter
          chapter={chapter}
          key={i}
          index={i}
          current={chapterIndex}
          stepIndex={stepIndex}
        ></Chapter>
      ))}
    </div>
  )
}

export function Chapter({ index, current, stepIndex, chapter }) {
  const progress = Math.min(
    100,
    (100 * Math.max(stepIndex - chapter.startAtIndex, 0)) / chapter.stepCount
  )
  const isCurrentChapter = index == current
  return (
    <>
      <div
        style={{
          background: '#232323',
          margin: '0 -8px',
          padding: '2px 8px',
          height: headerHeight,
          color: '#ddd',
          ...(isCurrentChapter ? { position: 'sticky', top: 0 } : {}),
        }}
      >
        <h2 className="text-2xl my-4">{chapter.title}</h2>
        <Progress.Root
          value={progress}
          max={100}
          className="bg-brand-900"
          style={{
            borderRadius: 999,
            width: '100%',
            height: 12,
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <Progress.Indicator
            className="bg-neutral-700"
            style={{
              width: '100%',
              height: '100%',
              transition: 'transform 660ms cubic-bezier(0.65, 0, 0.35, 1)',
              transform: `translateX(${progress}%)`,
            }}
          />
        </Progress.Root>
      </div>
      {chapter.content.map((child, j) => (
        <React.Fragment key={j}>
          {child.type === 'step' ? <Step currentIndex={stepIndex} step={child} /> : child}
        </React.Fragment>
      ))}
    </>
  )
}

function Step({ currentIndex, step }) {
  const i = step.stepIndex
  const done = i < currentIndex
  const current = i == currentIndex
  const future = i > currentIndex
  const [open, setOpen] = React.useState(false)
  return (
    <Collapsible.Root
      className={`border rounded-lg p-4 my-4 ${
        current ? 'bg-neutral-800 border-brand-900 text-white' : 'border-neutral-600'
      }`}
      style={{
        padding: 6,
        margin: '6px -6px',
        ...(current ? { position: 'sticky', bottom: 4, top: headerHeight } : {}),
      }}
      open={current || open}
      onOpenChange={(open) => setOpen(open)}
    >
      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
        <span style={{ flex: 1, lineHeight: '17px' }}>{step.header}</span>
        <Collapsible.Trigger
          className={`bg-none border-none ${step.children && !current ? 'block' : 'hidden'}`}
        >
          <ChevronDownIcon style={{ color: 'currentcolor' }} />
        </Collapsible.Trigger>
        <button
          onClick={solveStep}
          className={`${
            step.solution && current && !step.loading ? 'block hover:text-brand-900' : 'hidden'
          }`}
        >
          <MagicWandIcon height={18} width={18} />
        </button>
        <div className={`${current && step.loading ? 'block animate-spin' : 'hidden'}`}>
          <UpdateIcon height={18} width={18} />
        </div>
        <CheckCircledIcon
          height={18}
          width={18}
          className={`${done ? 'text-brand-900' : 'hidden'}`}
        />
      </div>

      {step.children && (
        <Collapsible.Content style={{ padding: '8px 0' }}>{step.children}</Collapsible.Content>
      )}
    </Collapsible.Root>
  )
}
