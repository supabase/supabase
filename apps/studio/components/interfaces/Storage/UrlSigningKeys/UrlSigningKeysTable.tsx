import { Key } from 'lucide-react'
import type { ReactNode } from 'react'
import { Card, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from 'ui'

import { getUrlSigningKeyAlgorithmLabel, getUrlSigningKeyStatusLabel } from './UrlSigningKeys.utils'
import type { UrlSigningKey } from '@/data/storage/url-signing-keys-query'

interface UrlSigningKeysTableProps {
  keys: UrlSigningKey[]
  renderActions?: (key: UrlSigningKey) => ReactNode
}

export const UrlSigningKeysTable = ({ keys, renderActions }: UrlSigningKeysTableProps) => (
  <Card>
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-1">
            <span className="sr-only">Icon</span>
          </TableHead>
          <TableHead>Key ID</TableHead>
          <TableHead>Algorithm</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="w-1">
            <span className="sr-only">Actions</span>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {keys.map((key) => (
          <TableRow key={key.kid}>
            <TableCell className="w-1">
              <Key size={16} className="text-foreground-muted" />
            </TableCell>
            <TableCell className="font-mono text-xs">{key.kid}</TableCell>
            <TableCell className="text-foreground-lighter">
              {getUrlSigningKeyAlgorithmLabel(key.type)}
            </TableCell>
            <TableCell className="text-foreground-lighter">
              {getUrlSigningKeyStatusLabel(key)}
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
