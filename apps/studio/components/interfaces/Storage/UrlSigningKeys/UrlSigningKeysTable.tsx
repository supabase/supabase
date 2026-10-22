import type { ReactNode } from 'react'
import { Card, cn, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from 'ui'

import { getUrlSigningKeyAlgorithmLabel } from './UrlSigningKeys.utils'
import { CopyableKey } from '@/components/interfaces/JwtSecrets/jwt-secret-keys-table/copyable-key'
import type { UrlSigningKey } from '@/data/storage/url-signing-keys-query'

interface UrlSigningKeysTableProps {
  keys: UrlSigningKey[]
  /** Label shown above each key ID, e.g. "Active" */
  statusLabel: string
  /** Dims the row, used for every status except the key that signs new URLs */
  dimmed?: boolean
  emptyState?: { title: string; description: string }
  renderActions?: (key: UrlSigningKey) => ReactNode
}

export const UrlSigningKeysTable = ({
  keys,
  statusLabel,
  dimmed = false,
  emptyState,
  renderActions,
}: UrlSigningKeysTableProps) => {
  const isEmpty = keys.length === 0

  return (
    <Card>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className={cn('w-[315px]', isEmpty && 'text-foreground-muted')}>
              Key
            </TableHead>
            <TableHead className={cn(isEmpty && 'text-foreground-muted')}>Algorithm</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {isEmpty && emptyState && (
            <TableRow className="[&>td]:hover:bg-inherit">
              <TableCell colSpan={3}>
                <p className="text-sm text-foreground">{emptyState.title}</p>
                <p className="text-sm text-foreground-lighter">{emptyState.description}</p>
              </TableCell>
            </TableRow>
          )}
          {keys.map((key) => (
            <TableRow
              key={key.kid}
              className={cn(dimmed ? 'border-b border-dashed border-border' : 'border-b')}
            >
              <TableCell className="whitespace-nowrap">
                <p className={cn(dimmed && 'text-foreground-lighter')}>{statusLabel}</p>
                <CopyableKey keyId={key.kid} />
              </TableCell>
              <TableCell className="text-foreground-light">
                {getUrlSigningKeyAlgorithmLabel(key.type)}
              </TableCell>
              <TableCell>
                <div className="flex items-center justify-end gap-x-2">{renderActions?.(key)}</div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  )
}
