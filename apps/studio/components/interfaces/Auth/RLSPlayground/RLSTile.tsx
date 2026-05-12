import { X } from 'lucide-react'
import {
  Button,
  cn,
  Select_Shadcn_,
  SelectContent_Shadcn_,
  SelectItem_Shadcn_,
  SelectTrigger_Shadcn_,
  SelectValue_Shadcn_,
} from 'ui'
import { GenericSkeletonLoader } from 'ui-patterns/ShimmeringLoader'

import { isAuthenticatedWithoutUser, type LocalTile } from './RLSPlayground'
import type { User } from '@/data/auth/users-infinite-query'
import type { TileResult } from '@/lib/rls-sandbox/sandbox-core'

function roleLabelFor(tile: LocalTile): string {
  switch (tile.role) {
    case 'anon':
      return 'Anonymous'
    case 'service_role':
      return 'Service role'
    case 'authenticated':
      return tile.userEmail || 'Authenticated'
  }
}

interface RLSTileProps {
  tile: LocalTile
  result: TileResult | null
  isLoading: boolean
  users: User[]
  onChangeRole: (tileId: string, role: LocalTile['role']) => void
  onChangeUser: (tileId: string, userId: string, userEmail: string) => void
  onRemove: (tileId: string) => void
}

export function RLSTile({
  tile,
  result,
  isLoading,
  users,
  onChangeRole,
  onChangeUser,
  onRemove,
}: RLSTileProps) {
  const columns = result?.rows?.[0] ? Object.keys(result.rows[0]) : []

  return (
    <div className="flex flex-col border rounded-lg overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2 bg-surface-100 border-b">
        <Select_Shadcn_
          value={tile.role}
          onValueChange={(v) => onChangeRole(tile.id, v as LocalTile['role'])}
        >
          <SelectTrigger_Shadcn_ size="tiny" className="w-36 shrink-0">
            <SelectValue_Shadcn_ />
          </SelectTrigger_Shadcn_>
          <SelectContent_Shadcn_>
            <SelectItem_Shadcn_ value="anon">Anonymous</SelectItem_Shadcn_>
            <SelectItem_Shadcn_ value="authenticated">Authenticated</SelectItem_Shadcn_>
            <SelectItem_Shadcn_ value="service_role">Service role</SelectItem_Shadcn_>
          </SelectContent_Shadcn_>
        </Select_Shadcn_>

        {tile.role === 'authenticated' && (
          <Select_Shadcn_
            value={tile.userId ?? ''}
            onValueChange={(userId) => {
              const user = users.find((u) => u.id === userId)
              if (user?.id) onChangeUser(tile.id, user.id, user.email ?? user.id)
            }}
          >
            <SelectTrigger_Shadcn_ size="tiny" className="w-56 shrink-0">
              <SelectValue_Shadcn_ placeholder="Pick a user to impersonate…" />
            </SelectTrigger_Shadcn_>
            <SelectContent_Shadcn_>
              {users.length === 0 && (
                <SelectItem_Shadcn_ value="__none__" disabled>
                  No users found
                </SelectItem_Shadcn_>
              )}
              {users
                .flatMap((u) => (u.id ? [{ id: u.id, email: u.email }] : []))
                .map((u) => (
                  <SelectItem_Shadcn_ key={u.id} value={u.id}>
                    {u.email ?? u.id}
                  </SelectItem_Shadcn_>
                ))}
            </SelectContent_Shadcn_>
          </Select_Shadcn_>
        )}

        <div className="flex-1 min-w-0">
          {isAuthenticatedWithoutUser(tile) ? (
            <span className="text-xs text-warning truncate">No user selected — runs as anon</span>
          ) : result && !result.error ? (
            <span className="text-xs text-foreground-lighter">
              {result.rows.length} row{result.rows.length === 1 ? '' : 's'}
            </span>
          ) : result?.error ? (
            <span className="text-xs text-destructive truncate">{result.error}</span>
          ) : null}
        </div>

        <span className="text-xs text-foreground-lighter shrink-0 hidden sm:block">
          {roleLabelFor(tile)}
        </span>

        <Button
          type="text"
          icon={<X size={12} />}
          className="px-1 shrink-0"
          onClick={() => onRemove(tile.id)}
        />
      </div>

      {/* Results */}
      <div className="overflow-auto max-h-64">
        {isLoading ? (
          <div className="p-3">
            <GenericSkeletonLoader />
          </div>
        ) : result === null ? (
          <div className="flex items-center justify-center h-16 text-foreground-lighter text-sm">
            Run a query to see results
          </div>
        ) : result.error ? (
          <div className="p-3 text-sm text-destructive font-mono whitespace-pre-wrap">
            {result.error}
          </div>
        ) : result.rows.length === 0 ? (
          <div className="flex items-center justify-center h-16 text-foreground-lighter text-sm">
            0 rows — blocked by RLS
          </div>
        ) : (
          <table className="w-full text-xs">
            <thead className="bg-surface-100 sticky top-0">
              <tr>
                {columns.map((col) => (
                  <th
                    key={col}
                    className="px-3 py-1.5 text-left font-medium text-foreground-light border-b whitespace-nowrap"
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {result.rows.map((row, i) => (
                <tr
                  key={i}
                  className={cn('border-b last:border-0', i % 2 === 0 ? '' : 'bg-surface-100/50')}
                >
                  {columns.map((col) => (
                    <td
                      key={col}
                      className="px-3 py-1.5 text-foreground font-mono max-w-[240px] truncate"
                      title={String(row[col] ?? '')}
                    >
                      {row[col] === null ? (
                        <span className="text-foreground-lighter italic">null</span>
                      ) : (
                        String(row[col])
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
