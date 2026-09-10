import { RefCallback, useCallback, useRef, useState } from 'react'

// [Joshen] Copying from uidotdev/usehooks instead of installing the whole package
// https://github.com/uidotdev/usehooks/blob/945436df0037bc21133379a5e13f1bd73f1ffc36/index.js#L512
export function useIntersectionObserver<T extends Element>(
  options: {
    root?: Element | Document | null
    rootMargin?: string
    threshold?: number | number[]
  } = {}
): [RefCallback<T>, IntersectionObserverEntry | null] {
  const { threshold = 1, root = null, rootMargin = '0px' } = options
  const [entry, setEntry] = useState<IntersectionObserverEntry | null>(null)

  const previousObserver = useRef<IntersectionObserver | null>(null)

  const customRef = useCallback(
    (node) => {
      if (previousObserver.current) {
        previousObserver.current.disconnect()
        previousObserver.current = null
      }

      if (node?.nodeType === Node.ELEMENT_NODE) {
        const observer = new IntersectionObserver(
          ([entry]) => {
            setEntry(entry)
          },
          { threshold, root, rootMargin }
        )

        observer.observe(node)
        previousObserver.current = observer
      }
    },
    [threshold, root, rootMargin]
  )

  return [customRef, entry]
}
