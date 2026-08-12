import { Badge } from 'ui'

import { splitEndpointPath } from './TokenCapabilities.utils'

interface EndpointRowProps {
  method: string
  path: string
  /** Shared leading segments across the group, rendered muted ahead of the distinguishing part. */
  sharedPrefix: string
  /** Sized by the caller for the longest method present in the group. */
  methodColumnWidth: string
}

/**
 * The muted prefix span shrinks with an end-ellipsis while the distinguishing segment stays
 * fixed-width — visually equivalent to truncating the full path in its middle, without needing to
 * measure pixel widths.
 */
export const EndpointRow = ({
  method,
  path,
  sharedPrefix,
  methodColumnWidth,
}: EndpointRowProps) => {
  const { prefix, distinguishing } = splitEndpointPath(path, sharedPrefix)
  const isMutating = method !== 'GET'

  return (
    <tr>
      <td className="px-3 py-1.5 align-top" style={{ width: methodColumnWidth }}>
        {isMutating ? (
          <Badge variant="warning">{method}</Badge>
        ) : (
          <span className="font-mono text-xs text-foreground-lighter">{method}</span>
        )}
      </td>
      <td className="min-w-0 px-3 py-1.5" title={path}>
        <div className="flex min-w-0 overflow-hidden whitespace-nowrap font-mono text-xs">
          {prefix !== '' && (
            <span className="overflow-hidden text-ellipsis text-foreground-lighter">{prefix}</span>
          )}
          <span className="shrink-0 text-foreground">{distinguishing}</span>
        </div>
      </td>
    </tr>
  )
}
