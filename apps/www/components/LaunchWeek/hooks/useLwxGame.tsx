import { useEffect, useState } from 'react'
import useConfData from './use-conf-data'

export const VALID_KEYS = [
  'a',
  'b',
  'c',
  'd',
  'e',
  'f',
  'g',
  'h',
  'i',
  'j',
  'k',
  'l',
  'm',
  'n',
  'o',
  'p',
  'q',
  'r',
  's',
  't',
  'u',
  'v',
  'w',
  'x',
  'y',
  'z',
]

const useLwxGame = (showCustomizationForm?: boolean) => {
  const [isGameMode, setIsGameMode] = useState(false)
  const { ticketState } = useConfData()

  function onKeyDown(event: KeyboardEvent) {
    if (showCustomizationForm) return

    if (event.key === 'Escape') {
      setIsGameMode(false)
    }

    const newKey = event.key.toLocaleLowerCase()

    if (!(event.metaKey || event.ctrlKey) && VALID_KEYS.includes(newKey)) {
      if (!isGameMode) setIsGameMode(true)
    }
  }

  useEffect(() => {
    if (!showCustomizationForm) window.addEventListener('keydown', onKeyDown)

    return () => window.removeEventListener('keydown', onKeyDown)
  }, [showCustomizationForm])

  return { isGameMode, setIsGameMode }
}

export default useLwxGame
