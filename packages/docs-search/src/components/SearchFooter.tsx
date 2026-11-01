import { KeyboardShortcut } from 'ui'

import { resolveSearchLabels } from './labels'
import type { SearchLabels } from './types'

export interface SearchFooterProps {
  labels?: Partial<Pick<SearchLabels, 'navigate' | 'open'>>
}

export function SearchFooter({ labels }: SearchFooterProps) {
  const { navigate, open } = resolveSearchLabels(labels)

  return (
    <footer
      aria-hidden
      className="flex items-center justify-end gap-3 border-t px-4 py-2.5 text-xs text-foreground-lighter mx-px max-lg:hidden"
    >
      <span className="flex items-center gap-1.5">
        {navigate}
        <KeyboardShortcut keys={['ArrowUp']} />
        <KeyboardShortcut keys={['ArrowDown']} />
      </span>
      <span className="h-3 w-px bg-border" />
      <span className="flex items-center gap-1.5">
        {open}
        <KeyboardShortcut keys={['Enter']} />
      </span>
    </footer>
  )
}
