'use client'

import { mergeRefs, useAnchorObserver, useOnChange } from 'common'
import { createContext, forwardRef, useContext, useMemo, useRef } from 'react'
import type { AnchorHTMLAttributes, ReactNode, RefObject } from 'react'
import scrollIntoView from 'scroll-into-view-if-needed'

import type { TableOfContents } from './server/get-toc'

export const ActiveAnchorContext = createContext<string[]>([])

const ScrollContext = createContext<RefObject<HTMLElement | null>>({
  current: null,
})

/**
 * The estimated active heading ID
 */
export function useActiveAnchor(): string | undefined {
  return useContext(ActiveAnchorContext).at(-1)
}

/**
 * The id of visible anchors
 */
export function useActiveAnchors(): string[] {
  return useContext(ActiveAnchorContext)
}

export interface AnchorProviderProps {
  toc: TableOfContents
  /**
   * Only accept one active item at most
   *
   * @defaultValue true
   */
  single?: boolean
  children?: ReactNode
}

export interface ScrollProviderProps {
  /**
   * Scroll into the view of container when active
   */
  containerRef: RefObject<HTMLElement | null>

  children?: ReactNode
}

export function ScrollProvider({
  containerRef,
  children,
}: ScrollProviderProps): React.ReactElement {
  return <ScrollContext.Provider value={containerRef}>{children}</ScrollContext.Provider>
}

export function AnchorProvider({
  toc,
  single = true,
  children,
}: AnchorProviderProps): React.ReactElement {
  const headings = useMemo(() => {
    return toc.map((item) => item.url.split('#')[1])
  }, [toc])

  return (
    <ActiveAnchorContext.Provider value={useAnchorObserver(headings, single)}>
      {children}
    </ActiveAnchorContext.Provider>
  )
}

export interface TOCItemProps extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> {
  href: string

  onActiveChange?: (v: boolean) => void
}

export const TOCItem = forwardRef<HTMLAnchorElement, TOCItemProps>(
  ({ onActiveChange, ...props }, ref) => {
    const containerRef = useContext(ScrollContext)

    const anchors = useActiveAnchors()
    const anchorRef = useRef<HTMLAnchorElement>(null)
    const mergedRef = mergeRefs(anchorRef, ref)

    const isActive = anchors.includes(props.href.slice(1))

    useOnChange(isActive, (v) => {
      const element = anchorRef.current

      if (!element) return

      if (v && containerRef.current) {
        scrollIntoView(element, {
          behavior: 'smooth',
          block: 'center',
          inline: 'center',
          scrollMode: 'always',
          boundary: containerRef.current,
        })
      }

      onActiveChange?.(v)
    })

    return (
      <a ref={mergedRef} data-active={isActive} {...props}>
        {props.children}
      </a>
    )
  }
)

TOCItem.displayName = 'TOCItem'
