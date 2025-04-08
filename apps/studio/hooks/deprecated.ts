import TooltipListener from 'components/to-be-cleaned/TooltipListener'
import { useEffect, useRef } from 'react'

function usePrevious(value: any) {
  const ref = useRef()
  useEffect(() => {
    ref.current = value
  })
  return ref.current
}

export { TooltipListener, usePrevious }
