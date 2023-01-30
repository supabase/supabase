import { useState, useEffect } from 'react'

const ACTION_KEY_DEFAULT = ['Ctrl ', 'Control']
const ACTION_KEY_APPLE = ['⌘', 'Command']

export function useActionKey() {
  let [actionKey, setActionKey] = useState()

  useEffect(() => {
    if (typeof navigator !== 'undefined') {
      if (/(Mac|iPhone|iPod|iPad)/i.test(navigator.platform)) {
        // @ts-ignore
        setActionKey(ACTION_KEY_APPLE)
      } else {
        // @ts-ignore
        setActionKey(ACTION_KEY_DEFAULT)
      }
    }
  }, [])

  return actionKey
}
