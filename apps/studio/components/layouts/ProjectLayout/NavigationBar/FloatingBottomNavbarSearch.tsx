import { useParams } from 'common'
import { AdvisorButton } from 'components/layouts/AppLayout/AdvisorButton'
import { AssistantButton } from 'components/layouts/AppLayout/AssistantButton'
import HelpButton from 'components/layouts/AppLayout/HelpButton'
import { InlineEditorButton } from 'components/layouts/AppLayout/InlineEditorButton'
import { SIDEBAR_KEYS } from 'components/layouts/ProjectLayout/LayoutSidebar/LayoutSidebarProvider'
import { AnimatePresence } from 'framer-motion'
import { Menu, Search, X } from 'lucide-react'
import { useRouter } from 'next/router'
import { useCallback, useLayoutEffect, useRef, useState } from 'react'
import { useSidebarManagerSnapshot } from 'state/sidebar-manager-state'
import { Button, cn } from 'ui'

import { ButtonTooltip } from '../../../ui/ButtonTooltip'
import { HelpDropdown } from '../LayoutHeader/HelpDropdown/HelpDropdown'
import { useMobileSidebarSheet } from '../LayoutSidebar/MobileSidebarSheetContext'

const DRAG_THRESHOLD_PX = 8
const GAP_FROM_BOTTOM = 50
/** Fraction of viewport the sheet does not cover when open (sheet is h-[85dvh], so gap is 15%) */
const SHEET_OPEN_GAP_FRACTION = 0.15

const FloatingBottomNavbarSearch = ({ hideMobileMenu }: { hideMobileMenu?: boolean }) => {
  const {
    content: sheetContent,
    isOpen: isSheetOpen,
    setContent: setSheetContent,
  } = useMobileSidebarSheet()
  const { activeSidebar, openSidebar, clearActiveSidebar } = useSidebarManagerSnapshot()
  const { ref: projectRef } = useParams()
  const router = useRouter()
  const pathname = router.asPath?.split('?')[0] ?? router.pathname
  const showMenuButton = pathname.startsWith('/project/') || pathname.startsWith('/org/')

  const handleNavClickCapture = useCallback(
    (e: React.MouseEvent) => {
      const target = (e.target as HTMLElement).closest?.('[data-sidebar-id]')
      const sidebarId = target?.getAttribute('data-sidebar-id')
      if (sidebarId && activeSidebar?.id !== sidebarId) {
        e.preventDefault()
        e.stopPropagation()
        openSidebar(sidebarId)
        setSheetContent(sidebarId)
      }
    },
    [activeSidebar?.id, openSidebar, setSheetContent]
  )

  const [position, setPosition] = useState<{ x: number; y: number } | null>(null)
  const dragStartRef = useRef<{
    x: number
    y: number
    startX: number
    startY: number
    pointerId: number
  } | null>(null)
  const navRef = useRef<HTMLElement | null>(null)
  const [navSize, setNavSize] = useState({ width: 0, height: 0 })

  useLayoutEffect(() => {
    const el = navRef.current
    if (!el) return
    const measure = () => {
      const rect = el.getBoundingClientRect()
      setNavSize((prev) =>
        prev.width !== rect.width || prev.height !== rect.height
          ? { width: rect.width, height: rect.height }
          : prev
      )
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  useLayoutEffect(() => {
    if (!isSheetOpen) return
    const raf = requestAnimationFrame(() => {
      const el = navRef.current
      if (!el) return
      const rect = el.getBoundingClientRect()
      setNavSize((prev) =>
        prev.width !== rect.width || prev.height !== rect.height
          ? { width: rect.width, height: rect.height }
          : prev
      )
    })
    return () => cancelAnimationFrame(raf)
  }, [isSheetOpen])

  const applyMove = useCallback((clientX: number, clientY: number) => {
    const state = dragStartRef.current
    if (!state) return
    const { x, y, startX, startY } = state
    const dist = Math.hypot(clientX - startX, clientY - startY)
    if (dist < DRAG_THRESHOLD_PX) return
    const dx = clientX - startX
    const dy = clientY - startY
    const rect = navRef.current?.getBoundingClientRect()
    const w = rect?.width ?? 200
    const h = rect?.height ?? 48
    const maxX = typeof window !== 'undefined' ? window.innerWidth - w : 0
    const maxY = typeof window !== 'undefined' ? window.innerHeight - h : 0
    const nextX = Math.max(0, Math.min(maxX, x + dx))
    const nextY = Math.max(0, Math.min(maxY, y + dy))
    setPosition({ x: nextX, y: nextY })
  }, [])

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault()
      e.stopPropagation()
      const rect = navRef.current?.getBoundingClientRect()
      if (!rect) return
      const currentX = position?.x ?? rect.left
      const currentY = position?.y ?? rect.top
      const pointerId = e.pointerId
      dragStartRef.current = {
        x: currentX,
        y: currentY,
        startX: e.clientX,
        startY: e.clientY,
        pointerId,
      }

      const onWindowPointerMove = (moveEvent: PointerEvent) => {
        const state = dragStartRef.current
        if (!state || state.pointerId !== moveEvent.pointerId) return
        const dist = Math.hypot(moveEvent.clientX - state.startX, moveEvent.clientY - state.startY)
        if (dist >= DRAG_THRESHOLD_PX) {
          const el = navRef.current
          if (el?.setPointerCapture) el.setPointerCapture(moveEvent.pointerId)
        }
        applyMove(moveEvent.clientX, moveEvent.clientY)
      }
      const onWindowPointerUpOrCancel = (upEvent: PointerEvent) => {
        if (dragStartRef.current?.pointerId !== upEvent.pointerId) return
        const target = upEvent.target as HTMLElement
        if (target?.releasePointerCapture) target.releasePointerCapture(upEvent.pointerId)
        window.removeEventListener('pointermove', onWindowPointerMove)
        window.removeEventListener('pointerup', onWindowPointerUpOrCancel)
        window.removeEventListener('pointercancel', onWindowPointerUpOrCancel)
        dragStartRef.current = null
      }
      window.addEventListener('pointermove', onWindowPointerMove)
      window.addEventListener('pointerup', onWindowPointerUpOrCancel)
      window.addEventListener('pointercancel', onWindowPointerUpOrCancel)
    },
    [position, applyMove]
  )

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      applyMove(e.clientX, e.clientY)
    },
    [applyMove]
  )

  const { width: navW, height: navH } = navSize
  const vw = typeof window !== 'undefined' ? window.innerWidth : 0
  const vh = typeof window !== 'undefined' ? window.innerHeight : 0
  const centerX = vw > 0 && navW > 0 ? vw / 2 - navW / 2 : 0
  const sheetOpenGapPx = vh * SHEET_OPEN_GAP_FRACTION
  const topWhenSheetOpen = vh > 0 ? sheetOpenGapPx / 2 - navH / 2 : 0
  const defaultYClosed = vh > 0 ? vh - GAP_FROM_BOTTOM - (navH > 0 ? navH : 56) : 0

  const style: React.CSSProperties = (() => {
    const dragging = dragStartRef.current !== null
    const transition = dragging
      ? 'transform 0ms, z-index 0s'
      : 'transform 300ms cubic-bezier(0.4, 0, 0.2, 1), z-index 0s'
    const base = {
      zIndex: isSheetOpen ? 101 : 41,
      transition,
      touchAction: 'none',
    }

    const menuSheetOpen = isSheetOpen
    if (position === null) {
      return {
        ...base,
        left: '50%',
        top: 0,
        transform: menuSheetOpen
          ? `translate(-50%, ${topWhenSheetOpen}px)`
          : `translate(-50%, ${defaultYClosed}px)`,
      }
    }
    if (menuSheetOpen) {
      return {
        ...base,
        left: 0,
        top: 0,
        transform: `translate(${centerX}px, ${topWhenSheetOpen}px)`,
      }
    }
    return {
      ...base,
      left: 0,
      top: 0,
      transform: `translate(${position.x}px, ${position.y}px)`,
    }
  })()

  const handleSetSheetContent = (content: string) => {
    clearActiveSidebar()
    setSheetContent(content)
  }

  return (
    <nav
      ref={navRef}
      aria-label="Floating navigation"
      className={cn(
        'flex pointer-events-auto cursor-grab active:cursor-grabbing flex-row items-centerw-auto',
        'gap-2',
        'fixed md:hidden'
      )}
      style={style}
      onClickCapture={handleNavClickCapture}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
    >
      <div
        className={cn(
          'flex pointer-events-auto cursor-grab active:cursor-grabbing flex-row items-center justify-between w-auto rounded-full',
          'bg-overlay/80 backdrop-blur-md px-2.5 py-2 gap-2',
          'border border-strong shadow-[0px_3px_6px_-2px_rgba(0,0,0,0.07),0px_10px_30px_0px_rgba(0,0,0,0.10)]'
        )}
      >
        <AnimatePresence initial={false}>
          <ButtonTooltip
            type={sheetContent === 'search' ? 'secondary' : 'outline'}
            size="tiny"
            id="search-trigger"
            className={cn(
              'rounded-full w-[32px] h-[32px] flex items-center justify-center p-0 text-foreground-light',
              sheetContent === 'search' && 'text-background'
            )}
            tooltip={{
              content: {
                text: 'Search',
              },
            }}
            onClick={() => handleSetSheetContent('search')}
          >
            <Search size={16} strokeWidth={1} />
          </ButtonTooltip>
          {isSheetOpen && (
            <>
              {!!projectRef && (
                <>
                  <span data-sidebar-id={SIDEBAR_KEYS.AI_ASSISTANT}>
                    <AssistantButton />
                  </span>
                  <span data-sidebar-id={SIDEBAR_KEYS.EDITOR_PANEL}>
                    <InlineEditorButton />
                  </span>
                </>
              )}
              <span data-sidebar-id={SIDEBAR_KEYS.ADVISOR_PANEL}>
                <AdvisorButton projectRef={projectRef} />
              </span>
              <span data-sidebar-id={SIDEBAR_KEYS.HELP_PANEL}>
                <HelpButton />
              </span>
            </>
          )}
          {showMenuButton && !hideMobileMenu && (
            <ButtonTooltip
              title="Menu dropdown button"
              id="menu"
              type={sheetContent === 'menu' ? 'secondary' : 'default'}
              className={cn(
                'flex lg:hidden rounded-full min-w-[30px] w-[30px] h-[30px] data-[state=open]:bg-overlay-hover/30',
                sheetContent !== 'menu' && '!bg-surface-300'
              )}
              tooltip={{
                content: {
                  text: 'Menu',
                },
              }}
              icon={<Menu />}
              onClick={() => handleSetSheetContent('menu')}
            />
          )}
        </AnimatePresence>
      </div>
      <AnimatePresence initial={false}>
        <Button
          title="close"
          type="text"
          className={cn(
            'flex flex-row items-center justify-center rounded-full',
            'bg-overlay/50 backdrop-blur-md my-auto !p-1 gap-2',
            'border border-strong shadow-[0px_3px_6px_-2px_rgba(0,0,0,0.07),0px_10px_30px_0px_rgba(0,0,0,0.10)]',
            '!w-10 !h-10 !min-w-10 !min-h-10',
            'rounded-full',
            !isSheetOpen && 'hidden'
          )}
          icon={<X />}
          onClick={() => handleSetSheetContent(null)}
        />
      </AnimatePresence>
    </nav>
  )
}

export default FloatingBottomNavbarSearch
