import { throttle } from 'lodash'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useInView } from 'react-intersection-observer'

const useSticky = ({
  enabled = true,
  style = {} as CSSStyleDeclaration,
  scrollContainer,
}: {
  enabled?: boolean
  style?: CSSStyleDeclaration
  scrollContainer?: string | HTMLElement
} = {}) => {
  const [inView, setInView] = useState(false)
  const stickyRef = useRef<HTMLDivElement>(null)
  const { ref: observedRef } = useInView({
    threshold: 0.1,
    onChange: (inView) => (inView ? setInView(true) : setInView(false)),
    skip: !enabled,
  })

  const scrollHandler = useCallback(
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
          // eslint-disable-next-line react-hooks/exhaustive-deps
        }
      : () => {},
    [enabled, inView, JSON.stringify(style)]
  )

  const throttledScrollHandler = useMemo(() => throttle(scrollHandler, 300), [scrollHandler])

  useEffect(() => {
    if (!enabled) return

    const elem =
      scrollContainer instanceof HTMLElement
        ? scrollContainer
        : (scrollContainer && document.getElementById(scrollContainer)) || document

    elem.addEventListener('scroll', throttledScrollHandler)
    return () => elem.removeEventListener('scroll', throttledScrollHandler)
  }, [enabled, throttledScrollHandler, scrollContainer])

  return {
    inView,
    observedRef,
    stickyRef,
  }
}

export { useSticky }
