import { useEffect, useState } from 'react'

const useShortcut = (shortcutKeys: string[], callback: (event: KeyboardEvent) => void) => {
  const [pressedKeys, setPressedKeys] = useState(new Set<string>())

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase()
      const keys = shortcutKeys.map((key) => key.toLowerCase())

      // Add key to pressedKeys
      setPressedKeys((prevKeys) => new Set(prevKeys).add(key))

      // Check if all keys are pressed
      const allKeysPressed = keys.every((key) => {
        if (key === 'meta') return event.metaKey
        if (key === 'control') return event.ctrlKey
        if (key === 'shift') return event.shiftKey
        if (key === 'alt') return event.altKey
        return pressedKeys.has(key)
      })

      if (allKeysPressed) {
        event.preventDefault()
        callback(event)
      }
    }

    const handleKeyUp = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase()
      setPressedKeys((prevKeys) => {
        const newKeys = new Set(prevKeys)
        newKeys.delete(key)
        return newKeys
      })
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [shortcutKeys, callback, pressedKeys])

  return null
}

export default useShortcut
