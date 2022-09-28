import { FC, useCallback, KeyboardEvent, ReactNode } from 'react'

interface BlockKeysProps {
  value: string | null
  children: ReactNode
  onEscape?: (value: string | null) => void
  onEnter?: (value: string | null) => void
}

/**
 * Blocks key events from propagating
 * We use this with cell editor to allow editor component to handle keys.
 * Example: press enter to add newline on textEditor
 */
export const BlockKeys: FC<BlockKeysProps> = ({ value, children, onEscape, onEnter }) => {
  const handleKeyDown = useCallback(
    (ev: KeyboardEvent<HTMLDivElement>) => {
      switch (ev.key) {
        case 'Escape':
          ev.stopPropagation()
          if (onEscape) onEscape(value)
          break
        case 'Enter':
          ev.stopPropagation()
          if (!ev.shiftKey && onEnter) {
            ev.preventDefault()
            onEnter(value)
          }
          break
      }
    },
    [value]
  )

  function onBlur() {
    if (onEnter) onEnter(value)
  }

  return (
    <div onKeyDown={handleKeyDown} onBlur={onBlur}>
      {children}
    </div>
  )
}
