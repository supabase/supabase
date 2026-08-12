import { useState } from 'react'
import { cn } from 'ui'

import { EndpointRow } from './EndpointRow'
import { MAX_VISIBLE_ENDPOINT_ROWS } from './TokenCapabilities.constants'
import { getSharedPathPrefix } from './TokenCapabilities.utils'
import type { EnabledEndpoint } from '@/data/scoped-access-tokens/permission-scope-map-query'

interface CapabilityCardBodyProps {
  endpoints: EnabledEndpoint[]
  mcpTools: string[]
}

/**
 * One bordered container holding two labelled, independently-tabled groups — endpoints and MCP
 * tools — rather than a single table with interleaved header rows, per the two-table a11y pattern.
 */
export const CapabilityCardBody = ({ endpoints, mcpTools }: CapabilityCardBodyProps) => {
  const [showAllEndpoints, setShowAllEndpoints] = useState(false)

  if (endpoints.length === 0 && mcpTools.length === 0) {
    return (
      <div className="rounded-md border px-3 py-4 text-center text-xs text-foreground-lighter">
        No Management API endpoints or MCP tools are enabled by this capability yet.
      </div>
    )
  }

  const sharedPrefix = getSharedPathPrefix(endpoints.map((endpoint) => endpoint.path))
  const methodColumnWidth = `${Math.max(0, ...endpoints.map((endpoint) => endpoint.method.length)) + 2}ch`
  const visibleEndpoints = endpoints.slice(
    0,
    showAllEndpoints ? endpoints.length : MAX_VISIBLE_ENDPOINT_ROWS
  )
  const hiddenEndpointCount = endpoints.length - visibleEndpoints.length

  return (
    <div className="overflow-hidden rounded-md border">
      {endpoints.length > 0 && (
        <div>
          <div className="flex items-center justify-between border-b bg-surface-200 px-3 py-1.5">
            <span className="text-[11px] font-mono uppercase tracking-wide text-foreground-lighter">
              Management API endpoints
            </span>
            <span className="text-[11px] text-foreground-lighter">{endpoints.length}</span>
          </div>
          <table className="w-full" aria-label="Management API endpoints">
            <tbody className="divide-y">
              {visibleEndpoints.map((endpoint) => (
                <EndpointRow
                  key={endpoint.raw}
                  method={endpoint.method}
                  path={endpoint.path}
                  sharedPrefix={sharedPrefix}
                  methodColumnWidth={methodColumnWidth}
                />
              ))}
            </tbody>
          </table>
          {hiddenEndpointCount > 0 && (
            <button
              type="button"
              tabIndex={0}
              onClick={() => setShowAllEndpoints(true)}
              className="w-full border-t px-3 py-1.5 text-left text-xs text-foreground-light hover:text-foreground"
            >
              Show all {endpoints.length}
            </button>
          )}
        </div>
      )}
      {mcpTools.length > 0 && (
        <div className={cn(endpoints.length > 0 && 'border-t border-strong')}>
          <div className="flex items-center justify-between border-b bg-surface-200 px-3 py-1.5">
            <span className="text-[11px] font-mono uppercase tracking-wide text-foreground-lighter">
              MCP tools
            </span>
            <span className="text-[11px] text-foreground-lighter">{mcpTools.length}</span>
          </div>
          <table className="w-full" aria-label="MCP tools">
            <tbody className="divide-y">
              {mcpTools.map((tool) => (
                <tr key={tool}>
                  <td className="w-1/3 px-3 py-1.5 align-top font-mono text-xs text-foreground">
                    {tool}
                  </td>
                  {/* No description field exists yet for MCP tools — stubbed rather than fabricated. */}
                  <td className="px-3 py-1.5 text-xs text-foreground-lighter">
                    No description available
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
