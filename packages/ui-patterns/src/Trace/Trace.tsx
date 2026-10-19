'use client'

import { createContext, use, useCallback, useMemo, useReducer, useRef } from 'react'

import type {
  DataContextValue,
  RootProps,
  TimeWindow,
  ViewAction,
  ViewContextValue,
  ViewState,
} from './types'
import { buildTraceIndex, clampWindow, computeMatchIds, isFullWindow } from './utils'

export const DataContext = createContext<DataContextValue | null>(null)
export const ViewContext = createContext<ViewContextValue | null>(null)

const EMPTY_SET: ReadonlySet<string> = new Set()

function viewReducer(state: ViewState, action: ViewAction): ViewState {
  switch (action.type) {
    case 'setWindow':
      return state.window === action.window ? state : { ...state, window: action.window }
    case 'select':
      return state.selectedId === action.id ? state : { ...state, selectedId: action.id }
    case 'hover':
      return state.hoveredId === action.id ? state : { ...state, hoveredId: action.id }
    case 'toggle': {
      const collapsed = new Set(state.collapsed)
      if (collapsed.has(action.id)) collapsed.delete(action.id)
      else collapsed.add(action.id)
      return { ...state, collapsed }
    }
    case 'expand': {
      if (!state.collapsed.has(action.id)) return state
      const collapsed = new Set(state.collapsed)
      collapsed.delete(action.id)
      return { ...state, collapsed }
    }
    case 'collapse': {
      if (state.collapsed.has(action.id)) return state
      const collapsed = new Set(state.collapsed)
      collapsed.add(action.id)
      return { ...state, collapsed }
    }
    case 'expandAll':
      return state.collapsed.size === 0 ? state : { ...state, collapsed: EMPTY_SET }
    case 'setCollapsed':
      return { ...state, collapsed: action.collapsed }
    case 'setQuery':
      return state.query === action.query ? state : { ...state, query: action.query }
    case 'collapseAll':
      return state
    default:
      return state
  }
}

export function Root({
  trace,
  selectedId: selectedIdProp,
  onSelectedIdChange,
  window: windowProp,
  onWindowChange,
  defaultCollapsed = EMPTY_SET,
  defaultQuery = '',
  children,
}: RootProps) {
  const index = useMemo(() => buildTraceIndex(trace.spans, trace.nowMs), [trace.spans, trace.nowMs])

  const [state, rawDispatch] = useReducer(
    viewReducer,
    null,
    (): ViewState => ({
      window: null,
      selectedId: null,
      hoveredId: null,
      collapsed: defaultCollapsed,
      query: defaultQuery,
    })
  )

  const bounds = index.bounds
  const isWindowControlled = windowProp !== undefined
  const isSelectionControlled = selectedIdProp !== undefined

  const latest = useRef({
    index,
    onSelectedIdChange,
    onWindowChange,
    isWindowControlled,
    isSelectionControlled,
  })
  latest.current = {
    index,
    onSelectedIdChange,
    onWindowChange,
    isWindowControlled,
    isSelectionControlled,
  }

  const dispatch = useCallback((action: ViewAction) => {
    const current = latest.current
    switch (action.type) {
      case 'select':
        current.onSelectedIdChange?.(action.id)
        if (!current.isSelectionControlled) rawDispatch(action)
        return
      case 'setWindow': {
        const b = current.index.bounds
        const next: TimeWindow = action.window === null ? b : clampWindow(action.window, b)
        current.onWindowChange?.(next)
        if (!current.isWindowControlled) {
          rawDispatch({ type: 'setWindow', window: isFullWindow(next, b) ? null : next })
        }
        return
      }
      case 'collapseAll': {
        const parents = new Set<string>()
        for (const [id, children] of current.index.childrenOf) {
          if (children.length > 0) parents.add(id)
        }
        rawDispatch({ type: 'setCollapsed', collapsed: parents })
        return
      }
      default:
        rawDispatch(action)
    }
  }, [])

  const window = useMemo<TimeWindow>(() => {
    const stored = isWindowControlled ? windowProp : state.window
    if (!stored) return bounds
    return clampWindow(stored, bounds)
  }, [isWindowControlled, windowProp, state.window, bounds])

  const selectedId = isSelectionControlled ? (selectedIdProp ?? null) : state.selectedId
  const matchIds = useMemo(() => computeMatchIds(index, state.query), [index, state.query])

  const view = useMemo<ViewContextValue>(
    () => ({
      window,
      bounds,
      isReset: isFullWindow(window, bounds),
      selectedId,
      hoveredId: state.hoveredId,
      collapsed: state.collapsed,
      query: state.query,
      matchIds,
      dispatch,
    }),
    [window, bounds, selectedId, state.hoveredId, state.collapsed, state.query, matchIds, dispatch]
  )

  return (
    <DataContext.Provider value={index}>
      <ViewContext.Provider value={view}>{children}</ViewContext.Provider>
    </DataContext.Provider>
  )
}

export function useData(): DataContextValue {
  const value = use(DataContext)
  if (!value) throw new Error('Trace parts must be rendered inside Trace.Root')
  return value
}

export function useView(): ViewContextValue {
  const value = use(ViewContext)
  if (!value) throw new Error('Trace parts must be rendered inside Trace.Root')
  return value
}
