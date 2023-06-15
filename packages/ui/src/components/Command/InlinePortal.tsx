import { PropsWithChildren } from 'react'
import { createPortal } from 'react-dom'

export interface TextSelectionPortalProps {
  parentElement: Element
  selectionRange: Range
}

/**
 * Injects children into a parent element positioned under the selected text.
 *
 * Allows you to render a elements inline next to selected text.
 */
const InlinePortal = ({
  children,
  parentElement,
  selectionRange,
}: PropsWithChildren<TextSelectionPortalProps>) => {
  // Selection start and end nodes must be descendants of the parent
  if (
    !parentElement?.contains(selectionRange.startContainer) ||
    !parentElement.contains(selectionRange.endContainer)
  ) {
    return null
  }

  const selectionBounds = selectionRange.getBoundingClientRect()
  const parentBounds = parentElement.getBoundingClientRect()

  const relativeBounds = new DOMRect(
    selectionBounds.x - parentBounds.x,
    selectionBounds.y - parentBounds.y,
    selectionBounds.width,
    selectionBounds.height
  )

  const { top, left, height } = relativeBounds

  // Inject children into the parent positioned under the selected text
  return createPortal(
    <div tabIndex={0} style={{ top: top + height, left }} className="absolute h-2">
      {children}
    </div>,
    parentElement
  )
}

export default InlinePortal
