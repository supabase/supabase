import { useEffect, useMemo, useRef, useState } from 'react'
import { traceDataSets } from './data/trace-data'
import { MarkerDetail } from './details/marker-detail'
import SpanDetail from './span-detail'
import { Minimap } from './timeline/minimap'
import { TimelineCursor, type TimelineCursorRef } from './timeline/timeline-cursor'
import { TimelineHeader } from './timeline/timeline-header'
import { TimelineMarker } from './timeline/timeline-marker'
import { TimelineRuler } from './timeline/timeline-ruler'
import { TimelineSpan } from './timeline/timeline-span'
import type { Marker, TraceData } from './types/trace'
import {
  calculateAbsoluteRow,
  calculateTotalRows,
  layoutSpans,
  type LayoutSpan,
} from './utils/layout-algorithm'

interface TraceViewerProps {
  traceData?: TraceData
}

export default function TraceViewer({ traceData: initialTraceData }: TraceViewerProps) {
  // State for selected data set
  const [selectedDataSetId, setSelectedDataSetId] = useState('hierarchical')

  // Get the current trace data based on selection
  const traceData = useMemo(() => {
    if (initialTraceData) return initialTraceData
    const selectedDataSet = traceDataSets.find((ds) => ds.id === selectedDataSetId)
    return selectedDataSet?.data || traceDataSets[0].data
  }, [initialTraceData, selectedDataSetId])

  const [selectedSpan, setSelectedSpan] = useState<LayoutSpan | null>(null)
  const [selectedMarker, setSelectedMarker] = useState<Marker | null>(null)
  const [hoveredTime, setHoveredTime] = useState<number | null>(null)
  const [zoomLevel, setZoomLevel] = useState(1)
  const [viewportWidth, setViewportWidth] = useState(0)
  const [scrollPosition, setScrollPosition] = useState(0)
  const [viewportPercentage, setViewportPercentage] = useState(100)
  const [visibleSpans, setVisibleSpans] = useState<LayoutSpan[]>([])
  const [showTimestamps, setShowTimestamps] = useState(true)
  const timelineRef = useRef<HTMLDivElement>(null)
  const minimapRef = useRef<HTMLDivElement>(null)
  const lastClickRef = useRef<{ time: number; spanId: string } | null>(null)
  const timelineContentRef = useRef<HTMLDivElement>(null)
  const lastMousePositionRef = useRef<{ x: number; y: number } | null>(null)
  const cursorRef = useRef<TimelineCursorRef>(null)

  // Reset selected span when changing data sets
  useEffect(() => {
    setSelectedSpan(null)
    setSelectedMarker(null)
    setZoomLevel(1)
    setScrollPosition(0)
  }, [selectedDataSetId])

  // Process spans with layout algorithm
  const layoutedSpans = useMemo(() => layoutSpans(traceData.spans), [traceData.spans])

  // Calculate absolute row positions for each span
  const spanAbsoluteRows = useMemo(() => {
    const rows: Record<string, number> = {}
    for (const span of layoutedSpans) {
      rows[span.id] = calculateAbsoluteRow(span, layoutedSpans)
    }
    return rows
  }, [layoutedSpans])

  // Calculate total number of rows needed
  const totalRows = useMemo(() => calculateTotalRows(layoutedSpans), [layoutedSpans])

  // Add toggle function
  const handleToggleTimestamps = () => {
    setShowTimestamps((prev) => !prev)
  }

  // Handle data set selection
  const handleSelectDataSet = (id: string) => {
    setSelectedDataSetId(id)
  }

  // Update viewport width and percentage on resize or zoom change
  useEffect(() => {
    const updateViewportDimensions = () => {
      if (timelineRef.current) {
        const newViewportWidth = timelineRef.current.clientWidth
        setViewportWidth(newViewportWidth)

        // Calculate what percentage of the total timeline is visible
        const totalWidth = newViewportWidth * zoomLevel
        const newViewportPercentage = (newViewportWidth / totalWidth) * 100
        setViewportPercentage(newViewportPercentage)
      }
    }

    updateViewportDimensions()
    window.addEventListener('resize', updateViewportDimensions)
    return () => window.removeEventListener('resize', updateViewportDimensions)
  }, [zoomLevel])

  // Update scroll position and visible spans when timeline is scrolled
  useEffect(() => {
    const handleScroll = () => {
      if (timelineRef.current) {
        const newScrollPosition = timelineRef.current.scrollLeft
        setScrollPosition(newScrollPosition)
        updateVisibleSpans(newScrollPosition)

        // Only update the hoveredTime if we have a last known mouse position
        if (lastMousePositionRef.current && hoveredTime !== null && cursorRef.current) {
          const rect = timelineRef.current.getBoundingClientRect()
          const x = lastMousePositionRef.current.x - rect.left

          // Only continue if the mouse is within the viewport
          if (x >= 0 && x <= rect.width) {
            // Account for scroll position
            const scrollLeft = timelineRef.current.scrollLeft || 0

            // Calculate the time position in the same way as handleTimelineHover
            const totalWidth = rect.width * zoomLevel
            const timePosition = ((scrollLeft + x) / totalWidth) * traceData.duration

            // Update cursor directly using the imperative method
            cursorRef.current.updatePosition(timePosition)

            // Also update state to keep it in sync
            setHoveredTime(timePosition)
          }
        }
      }
    }

    // Add a handler for when scrolling stops to ensure cursor remains visible
    const handleScrollEnd = () => {
      // Make sure the cursor is still visible if it should be
      if (lastMousePositionRef.current && hoveredTime !== null && cursorRef.current) {
        cursorRef.current.updatePosition(hoveredTime)
      }
    }

    const timelineElement = timelineRef.current
    if (timelineElement) {
      timelineElement.addEventListener('scroll', handleScroll)

      // Set up scroll end detection using a debounced event
      let scrollEndTimer: NodeJS.Timeout
      const scrollEndDetection = () => {
        clearTimeout(scrollEndTimer)
        scrollEndTimer = setTimeout(handleScrollEnd, 100) // 100ms after scrolling stops
      }

      timelineElement.addEventListener('scroll', scrollEndDetection)

      return () => {
        timelineElement.removeEventListener('scroll', handleScroll)
        timelineElement.removeEventListener('scroll', scrollEndDetection)
        clearTimeout(scrollEndTimer)
        // Clean up any pending animation frame
        if (cursorRef.current) {
          cursorRef.current.updatePosition(null)
        }
      }
    }
  }, [zoomLevel, viewportWidth, layoutedSpans, hoveredTime, traceData.duration])

  // Update visible spans based on scroll position
  const updateVisibleSpans = (currentScrollPosition: number) => {
    if (!timelineRef.current) return

    const totalWidth = viewportWidth * zoomLevel
    const startTime = (currentScrollPosition / totalWidth) * traceData.duration
    const endTime = ((currentScrollPosition + viewportWidth) / totalWidth) * traceData.duration

    const newVisibleSpans = layoutedSpans.filter(
      (span) =>
        (span.startTime >= startTime && span.startTime <= endTime) || // Start is in viewport
        (span.endTime >= startTime && span.endTime <= endTime) || // End is in viewport
        (span.startTime <= startTime && span.endTime >= endTime) // Span encompasses viewport
    )

    setVisibleSpans(newVisibleSpans)
  }

  // Initialize visible spans
  useEffect(() => {
    if (layoutedSpans.length > 0) {
      updateVisibleSpans(scrollPosition)
    }
  }, [traceData, zoomLevel, viewportWidth, layoutedSpans])

  // Handle timeline hover to show timestamp
  const handleTimelineHover = (e: React.MouseEvent) => {
    try {
      // Store the current mouse position for use during scrolling
      lastMousePositionRef.current = { x: e.clientX, y: e.clientY }

      if (timelineRef.current) {
        const rect = timelineRef.current.getBoundingClientRect()
        const x = e.clientX - rect.left

        // Account for scroll position
        const scrollLeft = timelineRef.current.scrollLeft || 0

        // Calculate the actual position in the timeline considering scroll and zoom
        const totalWidth = rect.width * zoomLevel

        // Calculate the time position based on visible area and scroll
        const timePosition = ((scrollLeft + x) / totalWidth) * traceData.duration

        // Update cursor directly using the imperative method
        if (cursorRef.current) {
          cursorRef.current.updatePosition(timePosition)
        }

        // Also update state to keep it in sync
        setHoveredTime(timePosition)
      }
    } catch (error) {
      console.error('Error in handleTimelineHover:', error)
      setHoveredTime(null)
      if (cursorRef.current) {
        cursorRef.current.updatePosition(null)
      }
    }
  }

  // Handle minimap click to navigate to that position
  const handleMinimapClick = (e: React.MouseEvent) => {
    try {
      if (minimapRef.current && timelineRef.current) {
        const rect = minimapRef.current.getBoundingClientRect()
        const clickX = e.clientX - rect.left
        const clickPercentage = clickX / rect.width

        // Calculate the target scroll position
        const totalWidth = timelineRef.current.scrollWidth
        const targetScrollPosition = totalWidth * clickPercentage - viewportWidth / 2

        // Scroll to the target position
        timelineRef.current.scrollLeft = Math.max(0, targetScrollPosition)
      }
    } catch (error) {
      console.error('Error in handleMinimapClick:', error)
    }
  }

  // Handle timeline mouse leave
  const handleTimelineLeave = () => {
    setHoveredTime(null)
    if (cursorRef.current) {
      cursorRef.current.updatePosition(null)
    }
  }

  // Handle span click with special handling for double clicks
  const handleSpanClick = (e: React.MouseEvent, span: LayoutSpan) => {
    try {
      e.stopPropagation()

      const now = Date.now()
      const lastClick = lastClickRef.current

      // Check if this is a double click (same span, within 300ms)
      if (lastClick && lastClick.spanId === span.id && now - lastClick.time < 300) {
        // Double click behavior: maximize the span
        handleSpanDoubleClick(span)
        lastClickRef.current = null
      } else {
        // Single click behavior: select the span
        setSelectedSpan(span)
        setSelectedMarker(null)
        lastClickRef.current = { time: now, spanId: span.id }
      }
    } catch (error) {
      console.error('Error in handleSpanClick:', error)
    }
  }

  // Handle marker click
  const handleMarkerClick = (e: React.MouseEvent, marker: Marker) => {
    try {
      e.stopPropagation()
      setSelectedMarker(marker)
      setSelectedSpan(null)
    } catch (error) {
      console.error('Error in handleMarkerClick:', error)
    }
  }

  // Handle span double click to maximize it
  const handleSpanDoubleClick = (span: LayoutSpan) => {
    try {
      if (!timelineRef.current) return

      // Calculate new zoom level to make the span fill most of the viewport
      const spanDuration = span.endTime - span.startTime
      const newZoomLevel = (viewportWidth * 0.8) / spanDuration

      setZoomLevel(newZoomLevel)
      setSelectedSpan(span)

      // Scroll to center the span
      if (timelineRef.current) {
        const scrollPosition =
          (span.startTime / traceData.duration) * timelineRef.current.scrollWidth
        timelineRef.current.scrollLeft =
          scrollPosition - viewportWidth / 2 + (spanDuration * newZoomLevel) / 2
      }
    } catch (error) {
      console.error('Error in handleSpanDoubleClick:', error)
    }
  }

  // Handle zoom in/out
  const handleZoomIn = () => {
    setZoomLevel((prev) => Math.min(prev * 1.5, 10))
  }

  const handleZoomOut = () => {
    setZoomLevel((prev) => Math.max(prev / 1.5, 0.5))
  }

  // Close the detail panel
  const handleCloseDetailPanel = () => {
    setSelectedSpan(null)
    setSelectedMarker(null)
  }

  // Calculate timeline width based on zoom level
  const timelineWidth = `${Math.max(100, 100 * zoomLevel)}%`

  // Calculate the visible portion for the minimap
  const visiblePortionStart =
    zoomLevel > 1 ? (scrollPosition / (viewportWidth * zoomLevel)) * 100 : 0
  const visiblePortionWidth = Math.min(viewportPercentage, 100)

  // Calculate if a span's end is beyond the viewport
  const isSpanEndBeyondViewport = (span: LayoutSpan) => {
    if (!timelineRef.current) return false

    const totalWidth = viewportWidth * zoomLevel
    const endTimePosition = (span.endTime / traceData.duration) * totalWidth

    return endTimePosition > scrollPosition + viewportWidth
  }

  // Calculate the timeline height based on total rows
  const timelineHeight = totalRows * 28 + 20 // 28px per row + 20px padding

  const { duration } = traceData

  return (
    <div className="bg-black text-white h-full flex flex-col">
      {/* Header with search and controls */}
      <TimelineHeader
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        showTimestamps={showTimestamps}
        onToggleTimestamps={handleToggleTimestamps}
        selectedDataSetId={selectedDataSetId}
        onSelectDataSet={handleSelectDataSet}
      />

      {/* Minimap */}
      <Minimap
        spans={layoutedSpans}
        duration={traceData.duration}
        visiblePortionStart={visiblePortionStart}
        visiblePortionWidth={visiblePortionWidth}
        onClick={handleMinimapClick}
        minimapRef={minimapRef}
        spanAbsoluteRows={spanAbsoluteRows}
      />

      {/* Main content area with timeline and details */}
      <div className="flex flex-col md:flex-row flex-1">
        {/* Timeline view */}
        <div
          className="flex-1 overflow-x-auto overflow-y-auto relative"
          onMouseMove={handleTimelineHover}
          onMouseLeave={handleTimelineLeave}
          ref={timelineRef}
        >
          <div
            className="relative flex flex-col h-full"
            style={{ width: timelineWidth, minWidth: '100%', minHeight: '100%' }}
          >
            {/* Timeline ruler */}
            <TimelineRuler duration={traceData.duration} showTimestamps={showTimestamps} />

            {/* Spans container with cursor */}
            <div
              ref={timelineContentRef}
              className="relative flex-grow overflow-y-auto"
              style={{
                height: `${timelineHeight}px`,
                clipPath: 'inset(0 0 0 0)', // Use clipPath instead of overflow to allow tooltips to escape
              }}
            >
              {/* Timeline cursor */}
              <TimelineCursor
                ref={cursorRef}
                hoveredTime={hoveredTime}
                duration={duration}
                showTimestamps={showTimestamps}
              />

              {/* Spans */}
              {layoutedSpans.map((span) => (
                <TimelineSpan
                  key={span.id}
                  span={span}
                  duration={traceData.duration}
                  isSelected={selectedSpan?.id === span.id}
                  isVisible={visibleSpans.some((s) => s.id === span.id)}
                  endBeyondViewport={isSpanEndBeyondViewport(span)}
                  onClick={handleSpanClick}
                  showTimestamps={showTimestamps}
                  absoluteRow={spanAbsoluteRows[span.id]}
                />
              ))}

              {/* Markers */}
              {traceData.markers?.map((marker) => (
                <TimelineMarker
                  key={marker.id}
                  marker={marker}
                  duration={traceData.duration}
                  isSelected={selectedMarker?.id === marker.id}
                  onClick={handleMarkerClick}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Detail panel */}
        {selectedSpan && <SpanDetail span={selectedSpan as any} onClose={handleCloseDetailPanel} />}
        {selectedMarker && (
          <MarkerDetail marker={selectedMarker} onClose={handleCloseDetailPanel} />
        )}
      </div>
    </div>
  )
}
