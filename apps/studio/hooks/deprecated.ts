import { useRef, useEffect, useState } from 'react'
import { includes } from 'lodash'
import TooltipListener from 'components/to-be-cleaned/TooltipListener'

/**
 * Hook for listening to clicks outside of the target element.
 *
 * @param   {Function}      onClickOutside
 *
 * @returns {Object}        Ref for the target element
 */

function clickOutsideListener(onClickOutside: any) {
  const ref = useRef(null)

  const handleNavigate = (event: any) => {
    if (
      !ref.current ||
      ref.current === event.target ||
      (ref.current as any).contains(event.target)
    ) {
      return
    }

    onClickOutside(event)
  }

  useEffect(() => {
    document.body.addEventListener('click', handleNavigate)

    return () => {
      document.body.removeEventListener('click', handleNavigate)
    }
  })

  return ref
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
function useKeyboardShortcuts(keyMap: any, whitelistNodes = [], whitelistClasses = []) {
  const [lastKeydown, setLastKeydown] = useState()

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
        // @ts-ignore
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
      // @ts-ignore
      setLastKeydown(null)
    }
  }

  function getKeyPresses(event: any) {
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

  useEffect(() => {
    document.body.addEventListener('keydown', handleKeydown)
    document.body.addEventListener('keyup', handleKeyup)
    return () => {
      document.body.removeEventListener('keydown', handleKeydown)
      document.body.removeEventListener('keyup', handleKeyup)
    }
  })
}

function isMounted() {
  const isMounted = useRef(false)
  // @ts-ignore
  useEffect(() => {
    isMounted.current = true
    return () => (isMounted.current = false)
  }, [])
  return isMounted
}

function getWindowDimensions() {
  if (typeof window === 'undefined' || !window) return { width: 0, height: 0 }

  const { innerWidth: width, innerHeight: height } = window
  return { width, height }
}

function useWindowDimensions() {
  const [windowDimensions, setWindowDimensions] = useState(getWindowDimensions())

  useEffect(() => {
    function handleResize() {
      setWindowDimensions(getWindowDimensions())
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return windowDimensions
}

function usePrevious(value: any) {
  const ref = useRef()
  useEffect(() => {
    ref.current = value
  })
  return ref.current
}

export {
  clickOutsideListener,
  useKeyboardShortcuts,
  isMounted,
  TooltipListener,
  useWindowDimensions,
  usePrevious,
}
