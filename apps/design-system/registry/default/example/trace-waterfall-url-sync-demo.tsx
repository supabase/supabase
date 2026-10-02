import { useCallback, useSyncExternalStore } from 'react'
import { Trace } from 'ui-patterns/Trace'

import { createSampleTrace } from './trace-sample'

const sample = createSampleTrace()
const PARAM = 'span'

function subscribe(callback: () => void) {
  window.addEventListener('popstate', callback)
  return () => window.removeEventListener('popstate', callback)
}

function readSpanParam() {
  return new URLSearchParams(window.location.search).get(PARAM)
}

function useUrlSelection() {
  const selectedId = useSyncExternalStore(subscribe, readSpanParam, () => null)
  const setSelectedId = useCallback((id: string | null) => {
    const url = new URL(window.location.href)
    if (id) url.searchParams.set(PARAM, id)
    else url.searchParams.delete(PARAM)
    window.history.replaceState(window.history.state, '', url)
    window.dispatchEvent(new PopStateEvent('popstate'))
  }, [])
  return { selectedId, setSelectedId }
}

export default function TraceWaterfallUrlSyncDemo() {
  const { selectedId, setSelectedId } = useUrlSelection()

  return (
    <div className="flex w-full flex-col gap-2">
      <p className="font-mono text-xs text-foreground-light">
        ?{PARAM}={selectedId ?? '(none)'}
      </p>
      <Trace.Root trace={sample} selectedId={selectedId} onSelectedIdChange={setSelectedId}>
        <div className="flex h-72 overflow-hidden rounded-md border border-default">
          <Trace.Waterfall treeWidth={240} className="min-w-0 flex-1 rounded-none border-0">
            <Trace.Ruler />
            <Trace.Rows rowHeight={26}>
              <Trace.Cell />
              <Trace.Lane>
                <Trace.Bar />
              </Trace.Lane>
            </Trace.Rows>
          </Trace.Waterfall>
          <Trace.Inspector className="w-72 shrink-0" />
        </div>
      </Trace.Root>
    </div>
  )
}
