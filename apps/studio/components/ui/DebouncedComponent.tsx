import { useEffect, useRef, useState } from 'react'

interface DebouncedComponentProps {
  value: any
  delay?: number
  fallback?: React.ReactNode
  children: React.ReactNode
}

export function DebouncedComponent({
  value,
  delay = 500,
  fallback = <div className="text-sm">Loading...</div>,
  children,
}: DebouncedComponentProps) {
  const [shouldRender, setShouldRender] = useState(false)
  const timeoutRef = useRef<NodeJS.Timeout>()
  const prevValueRef = useRef(value)
  const isInitialMount = useRef(true)

  useEffect(() => {
    if (isInitialMount.current || prevValueRef.current !== value) {
      setShouldRender(false)
      prevValueRef.current = value

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }

      timeoutRef.current = setTimeout(() => {
        setShouldRender(true)
        isInitialMount.current = false
      }, delay)
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [value, delay])

  return shouldRender ? children : fallback
}
