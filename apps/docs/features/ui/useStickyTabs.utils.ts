import { useCallback, useRef } from 'react'
import { useInView } from 'react-intersection-observer'

const useSticky = <Element extends HTMLElement>({
  enabled = true,
  style = {} as CSSStyleDeclaration,
}: {
  enabled?: boolean
  style?: CSSStyleDeclaration
} = {}) => {
  const stickyRef = useRef<Element>(null)

  const handleSticking = useCallback(
    (inView: boolean) => {
      if (!stickyRef.current) return

      if (inView) {
        stickyRef.current.style.position = 'sticky'
        stickyRef.current.style.top = '100px'
        stickyRef.current.style.zIndex = '5'

        for (const property in style) {
          // @ts-ignore
          stickyRef.current.style[property] = style[property]
        }
      } else {
        stickyRef.current.style.position = ''
        stickyRef.current.style.top = ''
        stickyRef.current.style.zIndex = ''
        for (const property in style) {
          // @ts-ignore
          stickyRef.current.style[property] = ''
        }
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [JSON.stringify(style)]
  )

  const { ref: observedRef, inView } = useInView({
    threshold: 0.1,
    onChange: handleSticking,
    skip: !enabled,
  })

  return {
    inView,
    observedRef,
    stickyRef,
  }
}

export { useSticky }
