import type { ReactNode } from 'react'
import { KeyboardShortcut } from 'ui'

import { resolveSearchLabels } from './labels'
import type { SearchLabels } from './types'

export interface SearchFooterProps {
  labels?: Partial<Pick<SearchLabels, 'navigate' | 'open'>>
  children?: ReactNode
}

export function SearchFooter({ labels, children }: SearchFooterProps) {
  const { navigate, open } = resolveSearchLabels(labels)

  return (
    <footer className="flex items-center gap-3 border-t px-4 py-2.5 text-xs text-foreground-lighter mx-px">
      {children}
      <span aria-hidden className="ml-auto flex items-center gap-3 max-lg:hidden">
        <span className="flex items-center gap-1.5">
          {navigate}
          <KeyboardShortcut keys={['ArrowUp', 'ArrowDown']} variant="keycaps" />
        </span>
        <span className="h-3 w-px bg-border" />
        <span className="flex items-center gap-1.5">
          {open}
          <KeyboardShortcut keys={['Enter']} variant="keycaps" />
        </span>
      </span>
    </footer>
  )
}
