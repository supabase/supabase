import * as React from 'react'

export function useFocusRef<T extends HTMLOrSVGElement>(isCellSelected: boolean) {
  const ref = React.useRef<T>(null)
  React.useLayoutEffect(() => {
    if (!isCellSelected) return
    ref.current?.focus({ preventScroll: true })
  }, [isCellSelected])

  return ref
}
