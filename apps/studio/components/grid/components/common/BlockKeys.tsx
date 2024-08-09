import { useClickedOutside } from 'hooks/ui/useClickedOutside'
import { KeyboardEvent, ReactNode, useCallback, useEffect, useRef } from 'react'

interface BlockKeysProps {
  value: string | null
  children: ReactNode
  onEscape?: (value: string | null) => void
  onEnter?: (value: string | null) => void
  ignoreOutsideClicks?: boolean
}

/**
 * Blocks key events from propagating
 * We use this with cell editor to allow editor component to handle keys.
 * Example: press enter to add newline on textEditor
 */
export const BlockKeys = ({
  value,
  children,
  onEscape,
  onEnter,
  ignoreOutsideClicks = false,
}: BlockKeysProps) => {
  const ref = useRef(null)
  const isClickedOutside = useClickedOutside(ref)

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

  useEffect(() => {
    if (ignoreOutsideClicks) return
    if (isClickedOutside && onEnter !== undefined) onEnter(value)
  }, [isClickedOutside])

  return (
    <div ref={ref} onKeyDown={handleKeyDown}>
      {children}
    </div>
  )
}
