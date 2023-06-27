import { PropsWithChildren, useEffect, useState } from 'react'
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
  const [isOpen, setIsOpen] = useState(true)

  const selectionBounds = selectionRange.getBoundingClientRect()
  const parentBounds = parentElement.getBoundingClientRect()

  const relativeBounds = new DOMRect(
    selectionBounds.x - parentBounds.x,
    selectionBounds.y - parentBounds.y,
    selectionBounds.width,
    selectionBounds.height
  )

  const { top, left, height } = relativeBounds

  useEffect(() => {
    const focusElement = selectionRange.startContainer.parentElement

    if (!focusElement) {
      return
    }

    const focusClasses = ['relative', 'z-30']

    if (isOpen) {
      focusElement.classList.add(...focusClasses)
    }

    focusElement.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
    })

    return () => {
      focusElement.classList.remove(...focusClasses)
    }
  }, [isOpen])

  useEffect(() => {
    setIsOpen(true)
  }, [selectionRange])

  if (!isOpen) {
    return null
  }

  // Selection start and end nodes must be descendants of the parent
  if (
    !parentElement?.contains(selectionRange.startContainer) ||
    !parentElement.contains(selectionRange.endContainer)
  ) {
    return null
  }

  const marginTop = 10

  // Inject children into the parent positioned under the selected text
  return createPortal(
    <>
      <div
        className="fixed top-0 left-0 w-full h-full z-20 bg-white dark:[background-color:rgb(0_0_0_/_var(--tw-bg-opacity))] bg-opacity-50 backdrop-blur-sm transition"
        onClick={() => setIsOpen(false)}
      />
      <div
        tabIndex={0}
        style={{ top: top + height + marginTop, left }}
        className="absolute z-30 w-full max-w-3xl"
      >
        {children}
      </div>
    </>,
    parentElement
  )
}

export default InlinePortal
