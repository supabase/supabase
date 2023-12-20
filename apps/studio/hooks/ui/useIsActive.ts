import { useState, useEffect } from 'react'

/**
 * Returns boolean flag of whether a window is in focus
 */
export const useIsActive = () => {
  const [active, setActive] = useState<boolean>(false)

  // window listener
  const onFocus = () => setActive(true)
  const onBlur = () => setActive(false)
  useEffect(() => {
    window.addEventListener('focus', onFocus)
    window.addEventListener('blur', onBlur)
    // Specify how to clean up after this effect:
    return () => {
      window.removeEventListener('focus', onFocus)
      window.removeEventListener('blur', onBlur)
    }
  })

  return active
}
