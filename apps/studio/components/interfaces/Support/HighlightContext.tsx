import { parseAsBoolean, useQueryState } from 'nuqs'
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  type PropsWithChildren,
} from 'react'

interface HighlightProjectRefContextValue<T extends HTMLElement = HTMLDivElement> {
  ref: React.RefObject<T>
  shouldHighlightRef: boolean
  setShouldHighlightRef: (value: boolean) => void
  scrollToRef: () => void
}

const HighlightProjectRefContext = createContext<HighlightProjectRefContextValue | undefined>(
  undefined
)

export function HighlightProjectRefProvider({ children }: PropsWithChildren) {
  const projectRefContainerRef = useRef<HTMLDivElement>(null)
  const [shouldHighlightRef, setShouldHighlightRef] = useQueryState(
    'highlightRef',
    parseAsBoolean.withDefault(false).withOptions({ clearOnDefault: true })
  )

  const scrollToRef = useCallback(() => {
    projectRefContainerRef.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
      inline: 'center',
    })
  }, [])

  const ctx = useMemo(
    () => ({
      ref: projectRefContainerRef,
      shouldHighlightRef,
      setShouldHighlightRef,
      scrollToRef,
    }),
    [shouldHighlightRef, setShouldHighlightRef, scrollToRef]
  )

  return (
    <HighlightProjectRefContext.Provider value={ctx}>
      {children}
    </HighlightProjectRefContext.Provider>
  )
}

export function useHighlightProjectRefContext() {
  const context = useContext(HighlightProjectRefContext)
  if (!context) {
    throw new Error(
      'useHighlightProjectRefContext must be used within a HighlightProjectRefProvider'
    )
  }
  return context
}
