import { useCallback, useMemo, useRef, useState } from 'react'
import { useInView } from 'react-intersection-observer'

const useSticky = <Element extends HTMLElement>({
  enabled = true,
  style = {} as CSSStyleDeclaration,
}: {
  enabled?: boolean
  style?: CSSStyleDeclaration
} = {}) => {
  const [inView, setInView] = useState(false)
  const stickyRef = useRef<Element>(null)
  const { ref: observedRef } = useInView({
    threshold: 0.1,
    onChange: (inView) => (inView ? setInView(true) : setInView(false)),
    skip: !enabled,
  })

  const handleSticking = useCallback(
    enabled
      ? () => {
          if (!stickyRef.current) return

          const top = stickyRef.current.getBoundingClientRect().top
          if (top > 0) return

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
        }
      : () => {},
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [enabled, inView, JSON.stringify(style)]
  )

  /**
   * Change the sticking behavior when the containing element scrolls in and out
   * of sight.
   */
  useMemo(() => {
    handleSticking()
  }, [inView])

  return {
    inView,
    observedRef,
    stickyRef,
  }
}

export { useSticky }
