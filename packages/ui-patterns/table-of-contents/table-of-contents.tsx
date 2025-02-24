'use client'

import React from 'react'

interface TOCItem {
  id: string
  title: string
  level: number
}

interface TableOfContentsProps {
  items: TOCItem[]
}

export default function TableOfContents({ items }: TableOfContentsProps) {
  // Initialize state with the first item's id or empty string
  const [activeId, setActiveId] = React.useState(() => items?.[0]?.id || '')
  const observerRef = React.useRef<IntersectionObserver | null>(null)

  React.useEffect(() => {
    // Safety check
    if (!items || items.length === 0) return

    const headings = items.map((item) => document.getElementById(item.id)).filter(Boolean)

    const callback = (entries: IntersectionObserverEntry[]) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && entry.target.id) {
          setActiveId(entry.target.id)
        }
      })
    }

    observerRef.current = new IntersectionObserver(callback, {
      rootMargin: '-20% 0% -35% 0%',
      threshold: [0.5],
    })

    headings.forEach((heading) => {
      if (heading) {
        observerRef.current?.observe(heading)
      }
    })

    return () => {
      observerRef.current?.disconnect()
    }
  }, [items])

  const handleClick = React.useCallback((id: string) => {
    const element = document.getElementById(id)
    if (element) {
      const top = element.getBoundingClientRect().top + window.scrollY - 100
      window.scrollTo({ top, behavior: 'smooth' })
      setActiveId(id)
    }
  }, [])

  // Safety check for rendering
  if (!items || items.length === 0) {
    return null
  }

  // Safe calculation of transform value
  const activeIndex = Math.max(
    0,
    items.findIndex((item) => item.id === activeId)
  )
  const transformValue = activeIndex * (28 + 8)

  return (
    <nav aria-label="Table of contents" className="fixed right-4 top-20 hidden w-64 lg:block">
      <div className="relative border-l border-border pl-4">
        {/* Trail effect */}
        <div
          className="absolute left-[-1px] top-0 w-[1px] transition-all duration-300 ease-out"
          style={{
            height: '28px',
            transform: `translateY(${transformValue}px)`,
            transitionDelay: '40ms',
            backgroundColor: 'rgba(100, 100, 100, 0.5)',
          }}
        />
        <div
          className="absolute left-[-1px] top-0 w-[1px] transition-all duration-300 ease-out"
          style={{
            height: '28px',
            transform: `translateY(${transformValue}px)`,
            transitionDelay: '80ms',
            backgroundColor: 'rgba(100, 100, 100, 0.2)',
          }}
        />
        {/* Primary indicator */}
        <div
          className="absolute left-[-1px] top-0 w-[1px] bg-primary transition-all duration-200 ease-out"
          style={{
            height: '28px',
            transform: `translateY(${transformValue}px)`,
          }}
        />
        <ul className="space-y-2 text-sm">
          {items.map((item) => (
            <li
              key={item.id}
              style={{
                paddingLeft: `${(item.level - 2) * 12}px`,
              }}
            >
              <button
                className={`block h-[28px] py-1 text-left hover:text-primary ${
                  activeId === item.id ? 'font-medium text-primary' : 'text-muted-foreground'
                }`}
                onClick={() => handleClick(item.id)}
              >
                {item.title}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  )
}
