import { Key } from 'lucide-react'

const columns = [
  { name: 'id', format: 'int8', isPrimaryKey: true },
  { name: 'created_at', format: 'timestamptz' },
  { name: 'name', format: 'text' },
  { name: 'email', format: 'text' },
  { name: 'role', format: 'text' },
  { name: 'is_active', format: 'bool' },
  { name: 'avatar_url', format: 'text' },
]

const rows = [
  {
    id: 1,
    created_at: '2024-01-15 09:23:41+00',
    name: 'Alice Johnson',
    email: 'alice@example.com',
    role: 'admin',
    is_active: 'true',
    avatar_url: 'https://i.pravatar.cc/150?u=alice',
  },
  {
    id: 2,
    created_at: '2024-01-15 10:45:12+00',
    name: 'Bob Smith',
    email: 'bob@example.com',
    role: 'editor',
    is_active: 'true',
    avatar_url: 'https://i.pravatar.cc/150?u=bob',
  },
  {
    id: 3,
    created_at: '2024-02-03 14:12:08+00',
    name: 'Carol Williams',
    email: 'carol@example.com',
    role: 'viewer',
    is_active: 'false',
    avatar_url: 'https://i.pravatar.cc/150?u=carol',
  },
  {
    id: 4,
    created_at: '2024-02-14 08:33:55+00',
    name: 'David Brown',
    email: 'david@example.com',
    role: 'editor',
    is_active: 'true',
    avatar_url: 'NULL',
  },
  {
    id: 5,
    created_at: '2024-03-01 16:07:29+00',
    name: 'Eve Martinez',
    email: 'eve@example.com',
    role: 'admin',
    is_active: 'true',
    avatar_url: 'https://i.pravatar.cc/150?u=eve',
  },
  {
    id: 6,
    created_at: '2024-03-10 11:52:44+00',
    name: 'Frank Lee',
    email: 'frank@example.com',
    role: 'viewer',
    is_active: 'true',
    avatar_url: 'https://i.pravatar.cc/150?u=frank',
  },
  {
    id: 7,
    created_at: '2024-03-22 07:18:03+00',
    name: 'Grace Kim',
    email: 'grace@example.com',
    role: 'editor',
    is_active: 'false',
    avatar_url: 'https://i.pravatar.cc/150?u=grace',
  },
  {
    id: 8,
    created_at: '2024-04-05 13:41:17+00',
    name: 'Henry Chen',
    email: 'henry@example.com',
    role: 'viewer',
    is_active: 'true',
    avatar_url: 'https://i.pravatar.cc/150?u=henry',
  },
  {
    id: 9,
    created_at: '2024-04-12 09:05:33+00',
    name: 'Isla Patel',
    email: 'isla@example.com',
    role: 'admin',
    is_active: 'true',
    avatar_url: 'https://i.pravatar.cc/150?u=isla',
  },
  {
    id: 10,
    created_at: '2024-04-18 15:22:07+00',
    name: 'Jack Rivera',
    email: 'jack@example.com',
    role: 'editor',
    is_active: 'false',
    avatar_url: 'NULL',
  },
]

const EDITED_ROW = 1
const EDITED_COL = 'created_at'

export function SpreadsheetIllustration() {
  return (
    <div className="relative w-full">
      <table className="w-full border-collapse text-[13px]" style={{ minWidth: 900 }}>
        <thead>
          <tr className="bg-surface-200">
            {columns.map((col) => (
              <th
                key={col.name}
                className="border-b border-r last:border-r-0 border-default px-3 py-1.5 text-left font-normal"
              >
                <div className="flex items-center gap-1.5 overflow-hidden">
                  {col.isPrimaryKey && (
                    <Key size={12} strokeWidth={2} className="text-brand rotate-45 shrink-0" />
                  )}
                  <span className="text-foreground text-xs truncate font-medium">{col.name}</span>
                  <span className="text-foreground-light text-xs truncate">{col.format}</span>
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className="bg-surface-75">
              {columns.map((col) => {
                const value = String(row[col.name as keyof typeof row])
                const isNull = value === 'NULL'
                const isEdited = row.id === EDITED_ROW && col.name === EDITED_COL

                return (
                  <td
                    key={col.name}
                    className={`border-b border-r last:border-r-0 border-secondary px-3 py-1.5 max-w-[200px] ${
                      isEdited ? 'bg-brand/10' : ''
                    }`}
                  >
                    <span
                      className={`block truncate ${isNull ? 'text-foreground-muted italic' : 'text-foreground'}`}
                    >
                      {value}
                    </span>
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>

      {/* Floating cell editor */}
      <div className="absolute top-[42px] left-[105px] w-[280px] rounded-lg border border-strong bg-surface-200 shadow-2xl overflow-hidden z-10">
        <div className="px-3 py-2.5 border-b border-default">
          <div className="rounded bg-brand-400/20 px-2 py-1 text-[11px] text-foreground font-mono">
            2024-01-15 09:23:41.206064+00
          </div>
        </div>
        <div className="px-3 py-2.5 flex flex-col gap-1">
          <span className="text-[10px] text-foreground-muted">Formatted value:</span>
          <span className="text-[12px] text-foreground font-mono">
            15 Jan 2024 09:23:41 (+0000)
          </span>
        </div>
        <div className="px-3 pb-3 flex flex-col gap-1.5">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <kbd className="flex items-center justify-center w-6 h-6 rounded border border-default bg-surface-300 text-foreground-light text-[10px]">
                ↵
              </kbd>
              <span className="text-[11px] text-foreground-muted">Save changes</span>
            </div>
            <div className="ml-auto">
              <div className="rounded border border-default bg-surface-100 px-2.5 py-1 text-[10px] text-foreground-light">
                Set to NOW
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <kbd className="flex items-center justify-center px-1.5 h-6 rounded border border-default bg-surface-300 text-foreground-light text-[10px]">
              Esc
            </kbd>
            <span className="text-[11px] text-foreground-muted">Cancel changes</span>
          </div>
        </div>
      </div>
    </div>
  )
}
