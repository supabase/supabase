import * as React from 'react'

function includes(array: string[], element: string) {
  return array.indexOf(element) >= 0
}

/**
 * Hook for listening on key events.
 *
 * @param {Object|Map} keyMap       Key names mapped to event handlers. If a key name exists, its
 *                                  default behavior will be suppressed.
 * @param {Array} whitelistNodes    If target element is in the whitelist nodes array, will not
 *                                  trigger shortcut event
 * @param {Array} whitelistClasses  If target class is in the whitelist classes array, will not
 *                                  trigger shortcut event
 */
export function useKeyboardShortcuts(
  keyMap: { [id: string]: (event: KeyboardEvent) => void },
  whitelistNodes: string[] = [],
  whitelistClasses: string[] = []
) {
  const [lastKeydown, setLastKeydown] = React.useState<string | null>()

  const handleKeydown = (event: any) => {
    if (
      !keyMap ||
      includes(whitelistNodes, event.target.nodeName) ||
      includes(whitelistClasses, event.target.className)
    ) {
      return
    }

    let keyPressed = getKeyPresses(event)

    if (keyMap[keyPressed]) {
      /**
       * combined keymap will trigger action on KeyDown event
       * while single keymap  will trigger action on KeyUp event
       */
      if (keyPressed.includes('+')) {
        event.preventDefault()
        keyMap[keyPressed](event)
        setLastKeydown(null)
      } else {
        setLastKeydown(event.key)
        event.preventDefault()
      }
    }
  }

  const handleKeyup = (event: any) => {
    if (!keyMap) return

    if (keyMap[event.key] && lastKeydown === event.key) {
      event.preventDefault()
      keyMap[event.key](event)
      setLastKeydown(null)
    }
  }

  function getKeyPresses(event: KeyboardEvent) {
    return event.metaKey && event.shiftKey
      ? `Command+Shift+${event.key}`
      : event.metaKey
        ? `Command+${event.key}`
        : event.shiftKey && event.key === 'Enter'
          ? `Shift+${event.key}`
          : event.ctrlKey && event.key
            ? `Control+${event.key}`
            : event.key
  }

  React.useEffect(() => {
    window.addEventListener('keydown', handleKeydown)
    window.addEventListener('keyup', handleKeyup)
    return () => {
      window.removeEventListener('keydown', handleKeydown)
      window.removeEventListener('keyup', handleKeyup)
    }
  })
}
