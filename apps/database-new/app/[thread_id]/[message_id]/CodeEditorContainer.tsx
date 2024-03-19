'use client'

import { cn } from 'ui'

import { useAppStateSnapshot } from '@/lib/state'
import { ReactNode } from 'react'

function CodeEditorContainer({ children }: { children: ReactNode }) {
  const snap = useAppStateSnapshot()

  return (
    <div
      className={cn(
        'grow flex flex-col h-full w-full xl:border-l pt-4',
        snap.hideCode ? 'max-w-0' : 'max-w-lg 2xl:max-w-xl'
      )}
    >
      {children}
    </div>
  )
}

export { CodeEditorContainer }
