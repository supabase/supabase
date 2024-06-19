import React, { TableHTMLAttributes, useEffect, useRef, useState } from 'react'
import { cn } from 'ui'

type TableProps = TableHTMLAttributes<HTMLTableElement>

const Table = ({ children, ...props }: TableProps) => {
  const containerRef = useRef(null)
  const [showShadow, setShowShadow] = useState(true)

  const handleScroll = () => {
    const container = containerRef.current

    if (container) {
      const { scrollWidth, scrollLeft, offsetWidth } = container
      const isAtEnd = scrollWidth - scrollLeft - 2 < offsetWidth
      setShowShadow(!isAtEnd)
    }
  }

  useEffect(() => {
    containerRef?.current?.addEventListener('scroll', handleScroll)
    return () => containerRef?.current?.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <div className="relative">
      <span
        className={cn(
          'block md:hidden absolute inset-0 left-auto w-5 bg-gradient-to-r from-transparent to-background transition-opacity opacity-100',
          !showShadow && 'opacity-0 duration-300'
        )}
      />
      <div ref={containerRef} className="w-full overflow-x-auto break-normal">
        <table {...props}>{children}</table>
      </div>
    </div>
  )
}

export default Table
