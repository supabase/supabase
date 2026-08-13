import { Badge } from 'ui'

import { EndpointRow } from './EndpointRow'
import { getSharedPathPrefix } from './TokenCapabilities.utils'
import type { EnabledEndpoint } from '@/data/scoped-access-tokens/permission-scope-map-query'

interface CapabilityCardBodyProps {
  endpoints: EnabledEndpoint[]
  mcpTools: string[]
}

export const CapabilityCardBody = ({ endpoints, mcpTools }: CapabilityCardBodyProps) => {
  if (endpoints.length === 0 && mcpTools.length === 0) {
    return (
      <p className="text-xs text-foreground-lighter">
        No API endpoints or MCP tools are enabled by this capability yet.
      </p>
    )
  }

  const sharedPrefix = getSharedPathPrefix(endpoints.map((endpoint) => endpoint.path))
  const methodColumnWidth = `${Math.max(0, ...endpoints.map((endpoint) => endpoint.method.length)) + 2}ch`

  return (
    <div className="flex flex-col gap-4 mt-4">
      {endpoints.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <h3 className="text-xs tracking-wide text-foreground-lighter">API endpoints</h3>
          <div className="divide-y">
            {endpoints.map((endpoint) => (
              <EndpointRow
                key={endpoint.raw}
                method={endpoint.method}
                path={endpoint.path}
                sharedPrefix={sharedPrefix}
                methodColumnWidth={methodColumnWidth}
              />
            ))}
          </div>
        </div>
      )}
      {mcpTools.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <h3 className="text-xs tracking-wide text-foreground-lighter">MCP tools</h3>
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
