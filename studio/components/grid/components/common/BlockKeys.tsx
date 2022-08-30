import * as React from 'react'

type BlockKeysProps = {
  onEscape?: (value: string | null) => void
  onEnter?: (value: string | null) => void
  value: string | null
}

/**
 * Blocks key events from propagating
 * We use this with cell editor to allow editor component to handle keys.
 * Example: press enter to add newline on textEditor
 */
export const BlockKeys: React.FC<BlockKeysProps> = ({ onEscape, onEnter, value, children }) => {
  const handleKeyDown = React.useCallback(
    (ev: React.KeyboardEvent<HTMLDivElement>) => {
      switch (ev.key) {
        case 'Escape':
          ev.stopPropagation()
          if (onEscape) onEscape(value)
          break
        case 'Enter':
          ev.stopPropagation()
          if (onEnter) onEnter(value)
          break
      }
    },
    [value]
  )

  function onBlur() {
    if (onEscape) onEscape(value)
  }

  return (
    <div onKeyDown={handleKeyDown} onBlur={onBlur}>
      {children}
    </div>
  )
}
