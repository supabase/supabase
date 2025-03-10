import { editor } from 'monaco-editor'
import { PropsWithChildren, useEffect, useMemo, useRef } from 'react'
import { createPortal } from 'react-dom'

export interface InlineWidgetProps {
  /**
   * The Monaco editor instance.
   */
  editor: editor.IStandaloneCodeEditor | editor.IStandaloneDiffEditor

  /**
   * ID used by Monaco to reference this widget
   */
  id: string

  /**
   * The line number after or before which this zone should appear.
   * Use 0 to place a view zone before the first line number.
   */
  afterLineNumber: number
  beforeLineNumber?: number

  /**
   * The height in lines of the view zone.
   * @default 1
   */
  heightInLines?: number
}

/**
 * Adds an inline widget to a Monaco editor instance. Acts as a
 * container for custom widgets that are rendered inline.
 *
 * Implemented using the same techniques VS Code uses for their inline
 * widgets (such as "Go to References"), but built for React.
 * Uses a combination of a view zone and overlay widget.
 */
const InlineWidget = ({
  children,
  editor,
  id,
  beforeLineNumber,
  afterLineNumber = 0,
  heightInLines = 1,
}: PropsWithChildren<InlineWidgetProps>) => {
  const lineNumber = beforeLineNumber ?? afterLineNumber
  const key = `${id}-${lineNumber.toString()}`
  const containerElement = useMemo(() => document.createElement('div'), [])
  const zoneIdRef = useRef<string>()
  const viewZoneRef = useRef<{
    top: number
    height: number
    heightInLines: number
  }>({ top: 0, height: 0, heightInLines: heightInLines })

  // Get the appropriate editor instance for diff editor
  const targetEditor = 'getModifiedEditor' in editor ? editor.getModifiedEditor() : editor

  const recalculateLayout = () => {
    const layoutInfo = targetEditor.getLayoutInfo()

    if (!layoutInfo) {
      return
    }

    containerElement.style.left = `${layoutInfo.contentLeft}px`
    containerElement.style.top = `${viewZoneRef.current.top}px`
    containerElement.style.width = `${layoutInfo.width - layoutInfo.contentLeft - 20}px`
    containerElement.style.height = `${viewZoneRef.current.height}px`
  }

  const createViewZone = () => {
    targetEditor.changeViewZones((accessor) => {
      // Remove existing zone if it exists
      if (zoneIdRef.current) {
        accessor.removeZone(zoneIdRef.current)
      }

      // Create new zone with current height
      zoneIdRef.current = accessor.addZone({
        afterLineNumber: beforeLineNumber ?? afterLineNumber,
        heightInLines: viewZoneRef.current.heightInLines,
        domNode: document.createElement('div'),
        onDomNodeTop: (top) => {
          viewZoneRef.current.top = top
          recalculateLayout()
        },
        onComputedHeight: (height) => {
          viewZoneRef.current.height = height
          recalculateLayout()
        },
      })
    })
  }

  // Initial setup of view zone and overlay widget
  useEffect(() => {
    const overlayWidget: editor.IOverlayWidget = {
      getId: () => id,
      getDomNode: () => containerElement,
      getPosition: () => null,
    }

    createViewZone()
    targetEditor.addOverlayWidget(overlayWidget)

    // Remove the view zone & overlay widget on unmount
    return () => {
      targetEditor.changeViewZones((accessor) => {
        if (zoneIdRef.current) {
          accessor.removeZone(zoneIdRef.current)
        }
        targetEditor.removeOverlayWidget(overlayWidget)
      })
    }
  }, [targetEditor, id, beforeLineNumber, afterLineNumber]) // Note: heightInLines removed from deps

  // Update view zone height when heightInLines changes
  useEffect(() => {
    if (heightInLines !== viewZoneRef.current.heightInLines) {
      viewZoneRef.current.heightInLines = heightInLines
      createViewZone()
    }
  }, [heightInLines])

  return createPortal(children, containerElement, key)
}

export default InlineWidget
