import { useState } from 'react'
import { useKey } from 'react-use'
import { useCommandMenuOpen } from 'ui-patterns'

const useLWPartyMode = (disabled?: boolean) => {
  const [isPartyMode, setIsPartyMode] = useState<boolean>(true)

  const isCommandMenuOpen = useCommandMenuOpen()
  const enableTrigger = !disabled && !isCommandMenuOpen

  useKey('p', () => enableTrigger && setIsPartyMode(!isPartyMode), {}, [
    isPartyMode,
    isCommandMenuOpen,
  ])

  useKey('Escape', () => setIsPartyMode(false), {}, [isPartyMode])

  return { isPartyMode, setIsPartyMode }
}

export default useLWPartyMode
