import { useEffect, useState } from 'react'

const VALID_KEYS = [
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

const useLwxGame = () => {
  const [isGameMode, setIsGameMode] = useState(false)

  function onKeyDown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      setIsGameMode(false)
    }

    const newKey = event.key.toLocaleLowerCase()

    if (!(event.metaKey || event.ctrlKey) && VALID_KEYS.includes(newKey)) {
      if (!isGameMode) setIsGameMode(true)
    }
  }

  useEffect(() => {
    window.addEventListener('keydown', onKeyDown)

    return () => {
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [])

  return { isGameMode, setIsGameMode }
}

export default useLwxGame
