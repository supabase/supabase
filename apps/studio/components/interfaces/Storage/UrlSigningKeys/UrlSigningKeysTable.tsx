import { Key } from 'lucide-react'
import type { ReactNode } from 'react'
import { Card, cn, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from 'ui'

import { getUrlSigningKeyAlgorithmLabel } from './UrlSigningKeys.utils'
import type { UrlSigningKey } from '@/data/storage/url-signing-keys-query'

interface UrlSigningKeysTableProps {
  keys: UrlSigningKey[]
  emptyState?: { title: string; description: string }
  renderActions?: (key: UrlSigningKey) => ReactNode
}

export const UrlSigningKeysTable = ({
  keys,
  emptyState,
  renderActions,
}: UrlSigningKeysTableProps) => {
  const isEmpty = keys.length === 0

  return (
    <Card>
      <Table>
        <TableHeader>
          <TableRow>
            {!isEmpty && (
              <TableHead className="w-1">
                <span className="sr-only">Icon</span>
              </TableHead>
            )}
            <TableHead className={cn(isEmpty && 'text-foreground-muted')}>Key ID</TableHead>
            <TableHead className={cn(isEmpty && 'text-foreground-muted')}>Algorithm</TableHead>
            <TableHead className="w-1">
              <span className="sr-only">Actions</span>
            </TableHead>
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
            <TableRow key={key.kid}>
              <TableCell className="w-1">
                <Key size={16} className="text-foreground-muted" />
              </TableCell>
              <TableCell className="font-mono text-xs">{key.kid}</TableCell>
              <TableCell className="text-foreground-lighter">
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
