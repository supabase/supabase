'use client'

import { closestCenter, DndContext, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import type { DragEndEvent } from '@dnd-kit/core'
import { horizontalListSortingStrategy, SortableContext, useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Ellipsis, Pencil, Plus, Save, Trash2, X } from 'lucide-react'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  Button,
  cn,
  Input_Shadcn_,
  Popover_Shadcn_,
  PopoverContent_Shadcn_,
  PopoverTrigger_Shadcn_,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from 'ui'

import { TypeBadge } from './TypeBadge'
import { useV2Params } from '@/app/v2/V2ParamsContext'
import { useTabsScroll } from '@/components/layouts/Tabs/Tabs.utils'
import {
  CATEGORY_DOMAIN,
  CATEGORY_LABELS,
  useV2DashboardStore,
  type DataTab,
} from '@/stores/v2-dashboard'

const NEW_TAB_ID = 'data:new'
const FAVORITE_VIEWS_KEY = 'v2-favorite-views'

type FavoriteView = {
  id: string
  title: string
  description: string
  tabs: DataTab[]
  createdAt: number
}

/** Returns the most specific (longest-path) tab that the current pathname is under. */
function useActiveTab(dataTabs: DataTab[], pathname: string | null): DataTab | null {
  if (!pathname) return null
  const matches = dataTabs.filter((t) => pathname === t.path || pathname.startsWith(t.path + '/'))
  if (matches.length === 0) return null
  return matches.reduce((best, t) => (t.path.length > best.path.length ? t : best))
}

function SortableDataTab({
  tab,
  isActive,
  onNavigate,
  onClose,
}: {
  tab: DataTab
  isActive: boolean
  onNavigate: () => void
  onClose: (e: Pick<React.MouseEvent, 'preventDefault' | 'stopPropagation'>) => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: tab.id,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <button
      type="button"
      ref={setNodeRef}
      style={style}
      aria-current={isActive ? 'page' : undefined}
      className={cn(
        'group relative flex items-center gap-1.5 pl-2.5 pr-2 py-1.5 border-r border-border shrink-0 h-full max-w-[200px] cursor-pointer select-none',
        isActive
          ? 'bg-background text-foreground after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2px] after:bg-foreground'
          : 'text-foreground-lighter hover:text-foreground hover:bg-sidebar-accent/50',
        isDragging && 'opacity-80 z-10'
      )}
      onClick={onNavigate}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onNavigate()
        }
      }}
      {...attributes}
      {...listeners}
    >
      <TypeBadge domain={tab.domain} type={tab.type} />
      <span className="flex-1 min-w-0 truncate text-xs">{tab.label}</span>
      <button
        type="button"
        onClick={(e) => onClose(e)}
        className="-ml-0.5 opacity-0 group-hover:opacity-100 p-0.5 rounded hover:!bg-sidebar-accent text-foreground-lighter hover:text-foreground shrink-0"
        aria-label={`Close ${tab.label}`}
      >
        <X className="h-3 w-3" />
      </button>
    </button>
  )
}

export function DataTabBar() {
  const router = useRouter()
  const pathname = usePathname()
  const { projectRef } = useV2Params()
  const { dataTabs, openDataTab, closeDataTab, reorderDataTabs, replaceDataTabs } =
    useV2DashboardStore()
  const [viewsOpen, setViewsOpen] = useState(false)
  const [saveDialogOpen, setSaveDialogOpen] = useState(false)
  const [viewTitle, setViewTitle] = useState('')
  const [viewDescription, setViewDescription] = useState('')
  const [favoriteViews, setFavoriteViews] = useState<FavoriteView[]>([])
  const [isApplyingView, setIsApplyingView] = useState(false)
  const [pendingViewPath, setPendingViewPath] = useState<string | null>(null)
  const [confirmActionOpen, setConfirmActionOpen] = useState(false)
  const [pendingAction, setPendingAction] = useState<'delete' | 'override' | null>(null)
  const [selectedView, setSelectedView] = useState<FavoriteView | null>(null)

  // Show tabs for any opened data view (list + detail)
  const visibleTabs = dataTabs.filter((t) => t.type === 'detail' || t.type === 'list')
  // Always call hooks before any early return
  const activeTab = useActiveTab(visibleTabs, pathname)
  const chooserPath = projectRef ? `/v2/project/${projectRef}/data` : '#'
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 4 },
    })
  )
  const { tabsListRef } = useTabsScroll({ activeTab: activeTab?.id, tabCount: visibleTabs.length })
  const storageKey = useMemo(
    () => (projectRef ? `${FAVORITE_VIEWS_KEY}:${projectRef}` : FAVORITE_VIEWS_KEY),
    [projectRef]
  )

  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      const raw = localStorage.getItem(storageKey)
      if (!raw) {
        setFavoriteViews([])
        return
      }
      const parsed = JSON.parse(raw) as FavoriteView[]
      setFavoriteViews(Array.isArray(parsed) ? parsed : [])
    } catch {
      setFavoriteViews([])
    }
  }, [storageKey])

  useEffect(() => {
    if (!isApplyingView || !pendingViewPath || !pathname) return
    // Re-enable tab auto-registration only once navigation reached the target view.
    if (pathname === pendingViewPath || pathname.startsWith(`${pendingViewPath}/`)) {
      setIsApplyingView(false)
      setPendingViewPath(null)
    }
  }, [isApplyingView, pendingViewPath, pathname])

  // Manage temporary chooser tab lifecycle.
  useEffect(() => {
    if (isApplyingView) return
    if (!projectRef || !pathname) return
    const hasNewTab = dataTabs.some((t) => t.id === NEW_TAB_ID)
    const isChooser = pathname === chooserPath

    if (isChooser && !hasNewTab) {
      openDataTab({
        id: NEW_TAB_ID,
        label: 'New',
        type: 'list',
        category: 'chooser',
        domain: 'db',
        path: chooserPath,
      })
      return
    }

    if (!isChooser && hasNewTab) {
      closeDataTab(NEW_TAB_ID)
    }
  }, [projectRef, pathname, chooserPath, dataTabs, openDataTab, closeDataTab, isApplyingView])

  // Auto-register tabs for direct deep links to single-data list views (e.g. /data/users).
  useEffect(() => {
    if (isApplyingView) return
    if (!projectRef || !pathname) return

    const base = `/v2/project/${projectRef}/data/`
    if (!pathname.startsWith(base)) return

    const rest = pathname.slice(base.length)
    const [category, detailKey] = rest.split('/')
    if (!category || category === 'tables') return
    if (!(category in CATEGORY_LABELS)) return

    if (category === 'edge-functions' && detailKey) {
      const id = `edge-function:${detailKey}`
      if (dataTabs.some((t) => t.id === id)) return
      openDataTab({
        id,
        label: detailKey,
        type: 'detail',
        category,
        domain: CATEGORY_DOMAIN[category] ?? 'fn',
        path: `${base}${category}/${detailKey}`,
      })
      return
    }

    if (dataTabs.some((t) => t.id === category)) return
    openDataTab({
      id: category,
      label: CATEGORY_LABELS[category] ?? category,
      type: 'list',
      category,
      domain: CATEGORY_DOMAIN[category] ?? 'db',
      path: `${base}${category}`,
    })
  }, [projectRef, pathname, openDataTab, dataTabs, isApplyingView])

  const closeTabAndRoute = (tab: DataTab) => {
    closeDataTab(tab.id)
    if (activeTab?.id === tab.id) {
      const remaining = visibleTabs.filter((t) => t.id !== tab.id)
      if (remaining.length > 0) {
        const idx = visibleTabs.indexOf(tab)
        const next = remaining[Math.min(idx, remaining.length - 1)]
        router.push(next.path)
      } else {
        router.push(chooserPath)
      }
    }
  }

  const handleClose = (
    tab: DataTab,
    e: Pick<React.MouseEvent, 'preventDefault' | 'stopPropagation'>
  ) => {
    e.preventDefault()
    e.stopPropagation()
    closeTabAndRoute(tab)
  }

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return
    reorderDataTabs(String(active.id), String(over.id))
  }

  const saveFavoriteViews = (views: FavoriteView[]) => {
    setFavoriteViews(views)
    if (typeof window === 'undefined') return
    try {
      localStorage.setItem(storageKey, JSON.stringify(views))
    } catch {
      // Ignore localStorage write failures
    }
  }

  const handleSaveNewView = () => {
    const title = viewTitle.trim()
    if (!title) return
    const tabsToSave = visibleTabs.filter((t) => t.id !== NEW_TAB_ID)
    const next: FavoriteView[] = [
      {
        id: `view:${Date.now()}`,
        title,
        description: viewDescription.trim(),
        tabs: tabsToSave,
        createdAt: Date.now(),
      },
      ...favoriteViews,
    ]
    saveFavoriteViews(next.slice(0, 30))
    setViewTitle('')
    setViewDescription('')
    setSaveDialogOpen(false)
    setViewsOpen(false)
  }

  const handleApplyView = (view: FavoriteView) => {
    const tabsToApply = view.tabs.filter((t) => t.id !== NEW_TAB_ID)
    const firstTab = tabsToApply[0]
    const nextPath = firstTab?.path ?? chooserPath

    // Switch views in two explicit steps:
    // 1) Clear current session tabs
    // 2) Apply saved composition and navigate to first tab
    setIsApplyingView(true)
    setPendingViewPath(nextPath)
    replaceDataTabs([])
    setTimeout(() => {
      replaceDataTabs(tabsToApply)
      router.push(nextPath)
    }, 0)
    setViewsOpen(false)
  }

  const openConfirmAction = (action: 'delete' | 'override', view: FavoriteView) => {
    setPendingAction(action)
    setSelectedView(view)
    setConfirmActionOpen(true)
  }

  const handleConfirmAction = () => {
    if (!pendingAction || !selectedView) return
    if (pendingAction === 'delete') {
      const next = favoriteViews.filter((v) => v.id !== selectedView.id)
      saveFavoriteViews(next)
    }
    if (pendingAction === 'override') {
      const tabsToSave = visibleTabs.filter((t) => t.id !== NEW_TAB_ID)
      const next = favoriteViews.map((v) =>
        v.id === selectedView.id
          ? {
              ...v,
              tabs: tabsToSave,
              createdAt: Date.now(),
            }
          : v
      )
      saveFavoriteViews(next)
    }
    setConfirmActionOpen(false)
    setPendingAction(null)
    setSelectedView(null)
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <div className="border-b border-border bg-background shrink-0 min-h-[33px] flex items-stretch">
        <div ref={tabsListRef} className="min-w-0 flex-1 overflow-x-auto h-full">
          <div className="flex items-center w-max h-full">
            <SortableContext
              items={visibleTabs.map((t) => t.id)}
              strategy={horizontalListSortingStrategy}
            >
              {visibleTabs.map((tab) => (
                <SortableDataTab
                  key={tab.id}
                  tab={tab}
                  isActive={activeTab?.id === tab.id}
                  onNavigate={() => router.push(tab.path)}
                  onClose={(e) => handleClose(tab, e)}
                />
              ))}
            </SortableContext>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={() => {
                    if (!dataTabs.some((t) => t.id === NEW_TAB_ID)) {
                      openDataTab({
                        id: NEW_TAB_ID,
                        label: 'New',
                        type: 'list',
                        category: 'chooser',
                        domain: 'db',
                        path: chooserPath,
                      })
                    }
                    router.push(chooserPath)
                  }}
                  className="sticky right-0 z-10 shrink-0 h-full aspect-square flex items-center justify-center border-l border-border text-foreground-lighter hover:text-foreground hover:bg-sidebar-accent/50 bg-background transition-colors"
                  aria-label="Open data chooser"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs px-2">
                New tab
              </TooltipContent>
            </Tooltip>
          </div>
        </div>
        <Popover_Shadcn_ open={viewsOpen} onOpenChange={setViewsOpen}>
          <Tooltip>
            <TooltipTrigger asChild>
              <PopoverTrigger_Shadcn_ asChild>
                <button
                  type="button"
                  className="shrink-0 h-full aspect-square flex items-center justify-center border-l border-border text-foreground-lighter hover:text-foreground hover:bg-sidebar-accent/50 bg-background transition-colors"
                  aria-label="Favourite views"
                  title="Favourite views"
                >
                  <Ellipsis className="h-4 w-4" />
                </button>
              </PopoverTrigger_Shadcn_>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs">
              Favourite views
            </TooltipContent>
          </Tooltip>
          <PopoverContent_Shadcn_ align="end" side="bottom" className="w-72 p-2">
            <div className="px-1 py-1 text-xs font-medium text-foreground-lighter">
              Favourite views
            </div>
            <div className="max-h-64 overflow-y-auto">
              {favoriteViews.length === 0 ? (
                <div className="py-3 text-xs text-foreground-lighter">No saved views yet.</div>
              ) : (
                favoriteViews.map((view) => (
                  <div
                    key={view.id}
                    className="group w-full rounded px-2 py-1.5 text-left hover:bg-sidebar-accent/50"
                  >
                    <div className="flex items-start gap-2">
                      <button
                        type="button"
                        onClick={() => handleApplyView(view)}
                        className="min-w-0 flex-1 text-left"
                      >
                        <div className="text-xs text-foreground truncate">{view.title}</div>
                        {view.description && (
                          <div className="text-[11px] text-foreground-lighter truncate">
                            {view.description}
                          </div>
                        )}
                      </button>
                      <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity shrink-0">
                        <button
                          type="button"
                          className="p-1 rounded hover:bg-sidebar-accent text-foreground-lighter hover:text-foreground"
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            openConfirmAction('override', view)
                          }}
                          aria-label={`Override ${view.title}`}
                          title="Override with current tabs"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          className="p-1 rounded hover:bg-sidebar-accent text-foreground-lighter hover:text-destructive"
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            openConfirmAction('delete', view)
                          }}
                          aria-label={`Delete ${view.title}`}
                          title="Delete view"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="pt-2 mt-2 border-t border-border">
              <Button
                type="default"
                size="tiny"
                block
                onClick={() => {
                  setViewsOpen(false)
                  setSaveDialogOpen(true)
                }}
                icon={<Save className="h-4 w-4" />}
              >
                Save new view
              </Button>
            </div>
          </PopoverContent_Shadcn_>
        </Popover_Shadcn_>
      </div>
      <AlertDialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
        <AlertDialogContent size="small">
          <AlertDialogHeader>
            <AlertDialogTitle>Save new view</AlertDialogTitle>
            <AlertDialogDescription>
              Save the current tabs composition as a favourite view.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-3 px-5 pb-4">
            <div className="space-y-1">
              <label htmlFor="save-view-title" className="text-xs text-foreground-light">
                View title
              </label>
              <Input_Shadcn_
                id="save-view-title"
                value={viewTitle}
                onChange={(e) => setViewTitle(e.target.value)}
                placeholder="e.g. Auth investigation"
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="save-view-description" className="text-xs text-foreground-light">
                Description
              </label>
              <Input_Shadcn_
                id="save-view-description"
                value={viewDescription}
                onChange={(e) => setViewDescription(e.target.value)}
                placeholder="Optional notes"
              />
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setViewTitle('')
                setViewDescription('')
              }}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleSaveNewView} disabled={viewTitle.trim().length === 0}>
              Save view
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AlertDialog open={confirmActionOpen} onOpenChange={setConfirmActionOpen}>
        <AlertDialogContent size="small">
          <AlertDialogHeader>
            <AlertDialogTitle>
              {pendingAction === 'delete' ? 'Delete saved view' : 'Override saved view'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {pendingAction === 'delete'
                ? `Are you sure you want to delete "${selectedView?.title ?? 'this view'}"?`
                : `Replace "${selectedView?.title ?? 'this view'}" with the current tab composition?`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setPendingAction(null)
                setSelectedView(null)
              }}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmAction}>
              {pendingAction === 'delete' ? 'Delete' : 'Override'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DndContext>
  )
}
