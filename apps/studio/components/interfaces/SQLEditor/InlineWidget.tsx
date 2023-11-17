import { editor } from 'monaco-editor'
import { PropsWithChildren, useEffect, useMemo } from 'react'
import { createPortal } from 'react-dom'

export interface InlineWidgetProps {
  /**
   * The Monaco editor instance.
   */
  editor: editor.IStandaloneCodeEditor

  /**
   * ID used by Monaco to reference this widget
   */
  id: string

  /**
   * The line number after which this zone should appear.
   * Use 0 to place a view zone before the first line number.
   */
  afterLineNumber: number

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
  afterLineNumber,
  heightInLines = 1,
}: PropsWithChildren<InlineWidgetProps>) => {
  const key = `${id}-${afterLineNumber.toString()}`

  const containerElement = useMemo(() => document.createElement('div'), [])

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
      const layoutInfo = editor.getLayoutInfo()

      if (!layoutInfo) {
        return
      }

      containerElement.style.left = `${layoutInfo.contentLeft}px`
      containerElement.style.top = `${viewZoneTop}px`
      containerElement.style.width = `${layoutInfo.width - layoutInfo.contentLeft}px`
      containerElement.style.height = `${viewZoneHeight}px`
    }

    editor.changeViewZones((accessor) => {
      zoneId = accessor.addZone({
        afterLineNumber,
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

      editor.addOverlayWidget(overlayWidget)
    })

    // Remove the view zone & overlay widget on unmount
    return () => {
      editor.changeViewZones((accessor) => {
        accessor.removeZone(zoneId)
        editor.removeOverlayWidget(overlayWidget)
      })
    }
  }, [editor, id, afterLineNumber, heightInLines, containerElement])

  return createPortal(children, containerElement, key)
}

export default InlineWidget
