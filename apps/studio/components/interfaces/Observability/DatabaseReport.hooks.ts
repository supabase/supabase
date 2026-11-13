import { useEffect } from 'react'

const CHART_LAYOUT_OBSERVATION_DURATION = 10_000
const CHART_LAYOUT_OBSERVATION_CANCEL_EVENTS = [
  'keydown',
  'pointerdown',
  'touchstart',
  'wheel',
] as const

const isChartFullyVisible = (target: HTMLElement) => {
  const targetBounds = target.getBoundingClientRect()
  const scrollContainerBounds = target.closest('main')?.getBoundingClientRect()
  const viewportTop = scrollContainerBounds?.top ?? 0
  const viewportBottom = scrollContainerBounds?.bottom ?? window.innerHeight

  return targetBounds.top >= viewportTop && targetBounds.bottom <= viewportBottom
}

export const useDatabaseChartDeepLink = (chart?: string) => {
  useEffect(() => {
    if (chart === undefined) return

    let chartTargetObserver: MutationObserver | undefined
    let resizeObserver: ResizeObserver | undefined
    let stopObservingTimer: number | undefined

    const stopDeepLink = () => {
      if (stopObservingTimer !== undefined) window.clearTimeout(stopObservingTimer)
      chartTargetObserver?.disconnect()
      resizeObserver?.disconnect()
      CHART_LAYOUT_OBSERVATION_CANCEL_EVENTS.forEach((eventName) =>
        window.removeEventListener(eventName, stopDeepLink, true)
      )
    }

    CHART_LAYOUT_OBSERVATION_CANCEL_EVENTS.forEach((eventName) =>
      window.addEventListener(eventName, stopDeepLink, true)
    )

    const scrollToChart = () => {
      const target = document.getElementById(chart)
      if (target === null) return false

      chartTargetObserver?.disconnect()
      target.scrollIntoView({ behavior: 'smooth', block: 'center' })

      const chartList = target.parentElement
      if (chartList === null) return true

      resizeObserver = new ResizeObserver(() => {
        if (!isChartFullyVisible(target)) {
          target.scrollIntoView({ behavior: 'auto', block: 'center' })
        }
      })
      resizeObserver.observe(chartList)
      stopObservingTimer = window.setTimeout(stopDeepLink, CHART_LAYOUT_OBSERVATION_DURATION)
      return true
    }

    if (!scrollToChart()) {
      chartTargetObserver = new MutationObserver(scrollToChart)
      chartTargetObserver.observe(document.body, { childList: true, subtree: true })
    }

    return stopDeepLink
  }, [chart])
}

export const useDatabaseSelectionFromUrl = (
  db: string | undefined,
  setSelectedDatabaseId: (databaseId: string) => void
) => {
  useEffect(() => {
    if (db === undefined) return

    const timeout = window.setTimeout(() => setSelectedDatabaseId(db), 100)
    return () => window.clearTimeout(timeout)
  }, [db, setSelectedDatabaseId])
}
