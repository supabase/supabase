import { useEffect, useState } from 'react'
import { useKey } from 'react-use'
import { useCommandMenuOpen } from 'ui-patterns'
import useLwGame from '../hooks/useLwGame'
import useConfData from '../hooks/use-conf-data'

const useLWPartyMode = (disabled?: boolean) => {
  const [isPartyMode, setIsPartyMode] = useState<boolean>(true)
  const { ticketState } = useConfData()

  const isCommandMenuOpen = useCommandMenuOpen()
  const { isGameMode } = useLwGame()
  const enableTrigger = !disabled && !isCommandMenuOpen && !isGameMode

  useKey('p', () => enableTrigger && setIsPartyMode(!isPartyMode), {}, [
    isPartyMode,
    isCommandMenuOpen,
    isGameMode,
  ])

  useKey('Escape', () => !isGameMode && setIsPartyMode(false), {}, [isPartyMode, isGameMode])

  useEffect(() => {
    setIsPartyMode(isPartyMode)
  }, [ticketState])

  return { isPartyMode, setIsPartyMode }
}

export default useLWPartyMode
