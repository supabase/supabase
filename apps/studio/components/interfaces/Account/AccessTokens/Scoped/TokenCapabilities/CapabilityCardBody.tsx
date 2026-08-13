import { useState } from 'react'
import { Badge } from 'ui'

import { EndpointRow } from './EndpointRow'
import { MAX_VISIBLE_ENDPOINT_ROWS } from './TokenCapabilities.constants'
import { getSharedPathPrefix } from './TokenCapabilities.utils'
import type { EnabledEndpoint } from '@/data/scoped-access-tokens/permission-scope-map-query'

interface CapabilityCardBodyProps {
  endpoints: EnabledEndpoint[]
  mcpTools: string[]
}

export const CapabilityCardBody = ({ endpoints, mcpTools }: CapabilityCardBodyProps) => {
  const [showAllEndpoints, setShowAllEndpoints] = useState(false)

  if (endpoints.length === 0 && mcpTools.length === 0) {
    return (
      <p className="text-xs text-foreground-lighter">
        No API endpoints or MCP tools are enabled by this capability yet.
      </p>
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
    <div className="flex flex-col gap-4">
      {endpoints.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <p className="text-[11px] font-mono uppercase tracking-wide text-foreground-lighter">
            API endpoints
          </p>
          <div className="divide-y">
            {visibleEndpoints.map((endpoint) => (
              <EndpointRow
                key={endpoint.raw}
                method={endpoint.method}
                path={endpoint.path}
                sharedPrefix={sharedPrefix}
                methodColumnWidth={methodColumnWidth}
              />
            ))}
          </div>
          {hiddenEndpointCount > 0 && (
            <button
              type="button"
              tabIndex={0}
              onClick={() => setShowAllEndpoints(true)}
              className="self-start text-xs text-foreground-light hover:text-foreground"
            >
              Show all {endpoints.length}
            </button>
          )}
        </div>
      )}
      {mcpTools.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <p className="text-[11px] font-mono uppercase tracking-wide text-foreground-lighter">
            MCP tools
          </p>
          <div className="flex flex-wrap gap-1.5">
            {mcpTools.map((tool) => (
              <Badge key={tool} variant="default">
                {tool}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
