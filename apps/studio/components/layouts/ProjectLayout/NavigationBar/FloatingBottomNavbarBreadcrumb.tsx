import { useParams } from 'common'
import { generateAuthMenu } from 'components/layouts/AuthLayout/AuthLayout.utils'
import { generateDatabaseMenu } from 'components/layouts/DatabaseLayout/DatabaseMenu.utils'
import { getSectionKeyFromPathname } from 'components/layouts/ProjectLayout/MobileMenuContent/getSectionKeyFromPathname'
import { generateSettingsMenu } from 'components/layouts/ProjectSettingsLayout/SettingsMenu.utils'
import { AnimatePresence } from 'framer-motion'
import { useSelectedOrganizationQuery } from 'hooks/misc/useSelectedOrganization'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { Menu, X } from 'lucide-react'
import { useRouter } from 'next/router'
import { useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useSidebarManagerSnapshot } from 'state/sidebar-manager-state'
import { Button, cn } from 'ui'

import { useMobileSidebarSheet } from '../LayoutSidebar/MobileSidebarSheetContext'

/** Section key → top-level nav label (matches NavigationBar.utils / MobileMenuContent) */
const SECTION_TOP_LEVEL_LABELS: Record<string, string> = {
  editor: 'Table Editor',
  sql: 'SQL Editor',
  database: 'Database',
  auth: 'Authentication',
  storage: 'Storage',
  functions: 'Edge Functions',
  realtime: 'Realtime',
  advisors: 'Advisors',
  observability: 'Observability',
  logs: 'Logs',
  api: 'API Docs',
  integrations: 'Integrations',
  settings: 'Project Settings',
}

/** Org scope: path segment → breadcrumb label (matches OrgMenuContent / Sidebar OrganizationLinks) */
const ORG_PAGE_LABELS: Record<string, string> = {
  team: 'Team',
  integrations: 'Integrations',
  usage: 'Usage',
  billing: 'Billing',
  general: 'Organization settings',
  audit: 'Audit',
  documents: 'Documents',
  apps: 'Apps',
  security: 'Security',
  sso: 'SSO',
}

function findPageLabelInGroups(
  groups: Array<{ items?: Array<{ key?: string; name?: string }> }>,
  segment: string
): string | null {
  for (const group of groups) {
    for (const item of group.items ?? []) {
      if (item.key === segment && item.name) return item.name
    }
  }
  return null
}

function humanizeSegment(segment: string): string {
  return segment
    .split(/[-_]/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
}

const DRAG_THRESHOLD_PX = 8
const GAP_FROM_BOTTOM = 50
/** Fraction of viewport the sheet does not cover when open (sheet is h-[85dvh], so gap is 15%) */
const SHEET_OPEN_GAP_FRACTION = 0.15

const FloatingBottomNavbarBreadcrumb = ({ hideMobileMenu }: { hideMobileMenu?: boolean }) => {
  const {
    content: sheetContent,
    isOpen: isSheetOpen,
    setContent: setSheetContent,
  } = useMobileSidebarSheet()
  const { activeSidebar, openSidebar, clearActiveSidebar } = useSidebarManagerSnapshot()
  const { ref: projectRef } = useParams()
  const { data: project } = useSelectedProjectQuery()
  const { data: selectedOrg } = useSelectedOrganizationQuery()
  const router = useRouter()
  const pathname = router.asPath?.split('?')[0] ?? router.pathname

  const showMenuButton = pathname.startsWith('/project/') || pathname.startsWith('/org/')

  const { topLevelLabel, pageLabel } = useMemo(() => {
    const segments = pathname.split('/').filter(Boolean)

    // Organization list: /organizations
    if (pathname === '/organizations' || pathname.startsWith('/organizations/')) {
      return {
        topLevelLabel: 'Organizations',
        pageLabel: null as string | null,
      }
    }

    // Org scope: /org/[slug] or /org/[slug]/team, etc.
    if (pathname.startsWith('/org/')) {
      const slugSegment = segments[1]
      const pageSegment = segments[2] ?? null
      const topLevel = selectedOrg?.name ?? (slugSegment ? 'Organization' : 'Organizations')
      const page: string | null =
        pageSegment == null || pageSegment === slugSegment
          ? 'Projects'
          : ORG_PAGE_LABELS[pageSegment] ?? humanizeSegment(pageSegment)
      return {
        topLevelLabel: topLevel,
        pageLabel: pageSegment == null ? 'Projects' : page,
      }
    }

    // Project scope: /project/[ref]/...
    const sectionKey = getSectionKeyFromPathname(pathname)
    const pageSegment = pathname.split('/')[4] ?? null

    if (!sectionKey) {
      return {
        topLevelLabel: 'Project Overview',
        pageLabel: null as string | null,
      }
    }

    const topLevel = SECTION_TOP_LEVEL_LABELS[sectionKey] ?? humanizeSegment(sectionKey)

    let page: string | null = null
    if (pageSegment) {
      if (sectionKey === 'database' && project) {
        const groups = generateDatabaseMenu(project)
        page = findPageLabelInGroups(groups, pageSegment)
      } else if (sectionKey === 'auth' && projectRef) {
        const groups = generateAuthMenu(projectRef)
        page = findPageLabelInGroups(groups, pageSegment)
      } else if (sectionKey === 'settings' && projectRef) {
        const groups = generateSettingsMenu(projectRef, project)
        page = findPageLabelInGroups(groups, pageSegment)
      }
      if (!page) page = humanizeSegment(pageSegment)
    }

    return { topLevelLabel: topLevel, pageLabel: page }
  }, [pathname, project, projectRef, selectedOrg?.name])

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
          'bg-overlay/80 backdrop-blur-md h-12 p-4 py-2 gap-4',
          'border border-strong shadow-[0px_3px_6px_-2px_rgba(0,0,0,0.07),0px_10px_30px_0px_rgba(0,0,0,0.10)]'
        )}
      >
        <AnimatePresence initial={false}>
          <div className="flex min-w-0 flex-col items-start text-left">
            <span className="truncate text-xs font-medium text-foreground leading-tight">
              {topLevelLabel}
            </span>
            {pageLabel && (
              <span className="truncate text-xs text-foreground-lighter leading-tight">
                {pageLabel}
              </span>
            )}
          </div>
          {showMenuButton && !hideMobileMenu && (
            <Button
              title="Menu dropdown button"
              type={sheetContent === 'menu' ? 'secondary' : 'default'}
              className={cn(
                'flex lg:hidden -mr-2 rounded-full min-w-[36px] w-[36px] h-[36px] data-[state=open]:bg-overlay-hover/30',
                sheetContent !== 'menu' && '!bg-surface-300'
              )}
              icon={sheetContent === 'menu' ? <X /> : <Menu />}
              onClick={() => {
                if (sheetContent === 'menu') {
                  setSheetContent(null)
                } else {
                  clearActiveSidebar()
                  setSheetContent('menu')
                }
              }}
            />
          )}
        </AnimatePresence>
      </div>
      {/* <AnimatePresence initial={false}>
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
          onClick={() => {
            clearActiveSidebar()
            setSheetContent(null)
          }}
        />
      </AnimatePresence> */}
    </nav>
  )
}

export default FloatingBottomNavbarBreadcrumb
