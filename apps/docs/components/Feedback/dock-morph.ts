import type { Transition } from 'framer-motion'
import { cn } from 'ui'

export const MORPH_TRANSITION: Transition = { type: 'spring', duration: 0.3, bounce: 0 }

const EASE_OUT = 'cubic-bezier(0.23, 1, 0.32, 1)'
const OPEN_MS = 260
const CLOSE_MS = 120
const GROW_SHARE = 0.6
const REVEAL_START = 0.3
const ITEM_MS = 200
const STAGGER_MS = 40
const TAB_PIECE_CLASSES = 'z-[1] rounded-t-lg border-b-0'
const BOX_PIECE_CLASSES = 'rounded-lg rounded-tl-none shadow-codeblock'

export const morphDock = ({
  from,
  dock,
}: {
  from: DOMRect
  dock: HTMLElement
}): (() => void) | null => {
  if (!canMorphFrom(from)) return null
  const dockRect = dock.getBoundingClientRect()
  const start = toFrame(from)
  const end = toFrame(dockRect)
  const shell = createShell({ dock, dockRect })

  const grow = shell.animate(
    [
      { ...start, easing: EASE_OUT },
      { ...end, opacity: 1, offset: GROW_SHARE },
      { ...end, opacity: 0 },
    ],
    OPEN_MS
  )
  // cancel rejects finished, so remove on both
  const removeShell = () => shell.remove()
  grow.finished.then(removeShell, removeShell)
  const reveal = dock.animate(
    [
      { opacity: 0 },
      { opacity: 0, offset: REVEAL_START },
      { opacity: 1, offset: GROW_SHARE },
      { opacity: 1 },
    ],
    OPEN_MS
  )
  // starts as the shell fades, since the shell covers the dock until then
  const items = [...dock.querySelectorAll<HTMLElement>('[data-dock-reveal]')].map((item, index) =>
    item.animate(
      [
        { opacity: 0, transform: 'translateY(4px)', filter: 'blur(2px)' },
        { opacity: 1, transform: 'translateY(0)', filter: 'blur(0px)' },
      ],
      {
        duration: ITEM_MS,
        delay: OPEN_MS * GROW_SHARE + index * STAGGER_MS,
        easing: EASE_OUT,
        fill: 'backwards',
      }
    )
  )
  return () => {
    grow.cancel()
    reveal.cancel()
    items.forEach((animation) => animation.cancel())
  }
}

export const fadeDockOut = (dock: HTMLElement): Promise<void> | null => {
  if (typeof dock.animate !== 'function') return null
  dock.style.pointerEvents = 'none'
  return dock
    .animate([{ opacity: 1 }, { opacity: 0 }], {
      duration: CLOSE_MS,
      easing: EASE_OUT,
      fill: 'forwards',
    })
    .finished.then(
      () => undefined,
      () => undefined
    )
}

const canMorphFrom = (rect: DOMRect): boolean => {
  if (typeof document.body.animate !== 'function') return false
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return false
  const { clientWidth, clientHeight } = document.documentElement
  const isVisible =
    rect.bottom > 0 && rect.right > 0 && rect.top < clientHeight && rect.left < clientWidth
  return rect.width > 0 && rect.height > 0 && isVisible
}

const toFrame = (rect: DOMRect): Keyframe => ({
  left: `${rect.left}px`,
  top: `${rect.top}px`,
  width: `${rect.width}px`,
  height: `${rect.height}px`,
})

const createShell = ({ dock, dockRect }: { dock: HTMLElement; dockRect: DOMRect }) => {
  const shell = document.createElement('div')
  shell.setAttribute('aria-hidden', 'true')
  shell.dataset.feedbackUi = ''
  shell.className = 'pointer-events-none fixed z-50'

  const tab = dock.querySelector('[data-dock-tab]')
  const box = dock.querySelector('[data-dock-box]')
  const pieces =
    tab && box
      ? [
          { rect: tab.getBoundingClientRect(), className: TAB_PIECE_CLASSES },
          { rect: box.getBoundingClientRect(), className: BOX_PIECE_CLASSES },
        ]
      : [{ rect: dockRect, className: 'shadow-codeblock', radius: getRadius(box) }]
  shell.append(...pieces.map((piece) => createPiece({ ...piece, bounds: dockRect })))
  document.body.append(shell)
  return shell
}

const createPiece = ({
  rect,
  bounds,
  className,
  radius,
}: {
  rect: DOMRect
  bounds: DOMRect
  className: string
  radius?: string
}): HTMLDivElement => {
  const piece = document.createElement('div')
  piece.className = cn('absolute border border-default bg-200', className)
  if (radius) piece.style.borderRadius = radius
  piece.style.left = `${((rect.left - bounds.left) / bounds.width) * 100}%`
  piece.style.top = `${((rect.top - bounds.top) / bounds.height) * 100}%`
  piece.style.width = `${(rect.width / bounds.width) * 100}%`
  piece.style.height = `${(rect.height / bounds.height) * 100}%`
  return piece
}

const getRadius = (box: Element | null): string =>
  box ? getComputedStyle(box).borderRadius : 'var(--radius-lg)'
