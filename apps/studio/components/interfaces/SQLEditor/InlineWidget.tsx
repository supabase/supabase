import { editor } from 'monaco-editor'
import { PropsWithChildren, useEffect, useMemo } from 'react'
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

  // Get the appropriate editor instance for diff editor
  const targetEditor = 'getModifiedEditor' in editor ? editor.getModifiedEditor() : editor

  useEffect(() => {
    let zoneId: string
    let viewZoneTop = 0
    let viewZoneHeight = 0

    const overlayWidget: editor.IOverlayWidget = {
      getId: () => id,
      getDomNode: () => containerElement,
      getPosition: () => null,
    }

    const recalculateLayout = () => {
      const layoutInfo = targetEditor.getLayoutInfo()

      if (!layoutInfo) {
        return
      }

      containerElement.style.left = `${layoutInfo.contentLeft}px`
      containerElement.style.top = `${viewZoneTop}px`
      containerElement.style.width = `${layoutInfo.width - layoutInfo.contentLeft}px`
      containerElement.style.height = `${viewZoneHeight}px`
    }

    targetEditor.changeViewZones((accessor) => {
      zoneId = accessor.addZone({
        afterLineNumber: beforeLineNumber ?? afterLineNumber,
        heightInLines,
        domNode: document.createElement('div'),
        onDomNodeTop: (top) => {
          viewZoneTop = top
          recalculateLayout()
        },
        onComputedHeight: (height) => {
          viewZoneHeight = height
          recalculateLayout()
        },
      })

      targetEditor.addOverlayWidget(overlayWidget)
    })

    // Remove the view zone & overlay widget on unmount
    return () => {
      targetEditor.changeViewZones((accessor) => {
        accessor.removeZone(zoneId)
        targetEditor.removeOverlayWidget(overlayWidget)
      })
    }
  }, [targetEditor, id, beforeLineNumber, afterLineNumber, heightInLines, containerElement])

  return createPortal(children, containerElement, key)
}

export default InlineWidget
