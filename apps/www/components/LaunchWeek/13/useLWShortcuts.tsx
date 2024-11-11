import { useEffect, useState } from 'react'

const useLWShortcuts = (disabled?: boolean) => {
  const [isPartyMode, setIsPartyMode] = useState<boolean>(false)

  function onKeyDown(event: KeyboardEvent) {
    if (disabled) return

    if (event.key === 'Escape') {
      setIsPartyMode(false)
    }

    if (event.key === 'Escape') {
      setIsPartyMode(false)
    }

    const newKey = event.key.toLocaleLowerCase()

    if (!(event.metaKey || event.ctrlKey) && newKey === 'p') {
      if (!isPartyMode) setIsPartyMode(true)
    }
  }

  useEffect(() => {
    if (!disabled) window.addEventListener('keydown', onKeyDown)

    return () => window.removeEventListener('keydown', onKeyDown)
  }, [disabled])

  return { isPartyMode, setIsPartyMode }
}

export default useLWShortcuts
