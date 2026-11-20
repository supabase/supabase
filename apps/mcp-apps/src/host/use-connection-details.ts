import { useRef, useState } from 'react'
import { useAnnounce } from 'surfaces/common'
import type { DataPort } from 'surfaces/contract'
import { pickPublishableKey, type ConnectionState } from 'surfaces/project'

/**
 * A ready project's connection details, read the first time `open` is called
 * and kept from then on: opening the section again never reads them twice.
 * If they can't be read (`canRead` false, a missing tool, no enabled key or a
 * failed call), the state points to the dashboard instead. Both outcomes are
 * final, and both are announced to screen readers.
 */
export function useConnectionDetails({
  projectRef,
  data,
  canRead,
}: {
  projectRef: string
  data: Pick<DataPort, 'getProjectUrl' | 'getPublishableKeys'>
  /**
   * False when no tool call can reach this project: the server is scoped to
   * another project, or the host can't proxy tool calls. Reading would only fail.
   */
  canRead: boolean
}) {
  const announce = useAnnounce()
  const [connection, setConnection] = useState<ConnectionState>({ status: 'idle' })
  // Read synchronously, so two opens in quick succession start one read.
  const hasOpened = useRef(false)

  function showDashboard() {
    setConnection({ status: 'dashboard' })
    announce('Connection details are in the dashboard')
  }

  function open() {
    if (hasOpened.current) return
    hasOpened.current = true
    if (!canRead) return showDashboard()
    setConnection({ status: 'loading' })
    Promise.all([
      data.getProjectUrl({ project_id: projectRef }),
      data.getPublishableKeys({ project_id: projectRef }),
    ]).then(([{ url }, { keys }]) => {
      const key = pickPublishableKey(keys)
      if (!key) return showDashboard()
      setConnection({ status: 'details', url, key })
      announce('Connection details shown')
    }, showDashboard)
  }

  return { connection, open }
}
