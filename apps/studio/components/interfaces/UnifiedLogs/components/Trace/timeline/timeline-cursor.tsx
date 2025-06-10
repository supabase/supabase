'use client'

import type React from 'react'
import { forwardRef, useImperativeHandle, useRef, useEffect } from 'react'
import { cn, Tooltip, TooltipContent, TooltipTrigger } from 'ui'

interface TimelineCursorProps {
  hoveredTime: number | null
  duration: number
  showTimestamps: boolean
}

export interface TimelineCursorRef {
  updatePosition: (time: number | null) => void
}

export const TimelineCursor = forwardRef<TimelineCursorRef, TimelineCursorProps>(
  function TimelineCursor({ hoveredTime, duration, showTimestamps }, ref) {
    const cursorElementRef = useRef<HTMLDivElement>(null)
    const timeRef = useRef<number | null>(hoveredTime)

    // Sync the ref value with the prop
    useEffect(() => {
      timeRef.current = hoveredTime
      // When hoveredTime changes via props, ensure the cursor is visible
      if (cursorElementRef.current && hoveredTime !== null) {
        cursorElementRef.current.style.display = 'block'
        cursorElementRef.current.style.left = `${(hoveredTime / duration) * 100}%`
        cursorElementRef.current.style.opacity = '1'
      }
    }, [hoveredTime, duration])

    // Expose method to directly update cursor position
    useImperativeHandle(
      ref,
      () => ({
        updatePosition: (time: number | null) => {
          if (!cursorElementRef.current) return
          timeRef.current = time

          if (time === null) {
            cursorElementRef.current.style.display = 'none'
            return
          }

          cursorElementRef.current.style.display = 'block'
          cursorElementRef.current.style.left = `${(time / duration) * 100}%`
          cursorElementRef.current.style.opacity = '1'
        },
      }),
      [duration]
    )

    if (hoveredTime === null) return null

    return (
      <Tooltip open={showTimestamps}>
        <TooltipTrigger asChild>
          <div
            ref={cursorElementRef}
            className={cn(
              'absolute inset-0 pointer-events-none h-full z-40 bg-border',
              'opacity-100' // Always visible when rendered
            )}
            style={{
              left: `${(hoveredTime / duration) * 100}%`,
              width: '1px',
              transition: 'none',
              willChange: 'left',
            }}
          />
        </TooltipTrigger>
        <TooltipContent
          side="top"
          sideOffset={1}
          align="center"
          className="bg-surface-75 text-foreground-lighter px-2 py-0.5 rounded-full text-xs whitespace-nowrap border"
        >
          {hoveredTime.toFixed(2)}ms
        </TooltipContent>
      </Tooltip>
    )
  }
)
