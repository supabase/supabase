import { ArrowDownWideNarrow, ChevronDown, Mail, Search, User } from 'lucide-react'
import { useState } from 'react'
import { Badge, Button, cn } from 'ui'

// ─── Auth Menu Definition ───────────────────────────────────────────────

interface AuthMenuItem {
  name: string
  key: string
  label?: string
  disabled?: boolean
}

interface AuthMenuGroup {
  title: string
  items: AuthMenuItem[]
}

const AUTH_MENU: AuthMenuGroup[] = [
  {
    title: 'Manage',
    items: [
      { name: 'Users', key: 'users' },
      { name: 'OAuth Apps', key: 'oauth-apps', disabled: true },
    ],
  },
  {
    title: 'Notifications',
    items: [{ name: 'Email', key: 'email', disabled: true }],
  },
  {
    title: 'Configuration',
    items: [
      { name: 'Policies', key: 'policies', disabled: true },
      { name: 'Sign In / Providers', key: 'sign-in-up', disabled: true },
      { name: 'OAuth Server', key: 'oauth-server', label: 'Beta', disabled: true },
      { name: 'Sessions', key: 'sessions', disabled: true },
      { name: 'Rate Limits', key: 'rate-limits', disabled: true },
      { name: 'Multi-Factor', key: 'mfa', disabled: true },
      { name: 'URL Configuration', key: 'url-configuration', disabled: true },
      { name: 'Attack Protection', key: 'protection', disabled: true },
      { name: 'Auth Hooks', key: 'hooks', label: 'Beta', disabled: true },
      { name: 'Audit Logs', key: 'audit-logs', disabled: true },
      { name: 'Performance', key: 'performance', disabled: true },
    ],
  },
]

// ─── Mock User Data ─────────────────────────────────────────────────────

function mockUUID(seed: number): string {
  const hex = (n: number) => n.toString(16).padStart(8, '0')
  return `${hex(seed)}-${hex(seed * 7).slice(0, 4)}-${hex(seed * 13).slice(0, 4)}-${hex(seed * 17).slice(0, 4)}-${hex(
    seed * 23
  )
    .padStart(12, '0')
    .slice(0, 12)}`
}

function mockTimestamp(seed: number): string {
  const base = new Date('2025-10-04T13:30:00-0400')
  base.setSeconds(base.getSeconds() + seed * 43200 * Math.sin(seed + 1))
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const months = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ]
  const d = days[base.getDay()]
  const dd = String(base.getDate()).padStart(2, '0')
  const mon = months[base.getMonth()]
  const yyyy = base.getFullYear()
  const hh = String(base.getHours()).padStart(2, '0')
  const mm = String(base.getMinutes()).padStart(2, '0')
  const ss = String(base.getSeconds()).padStart(2, '0')
  return `${d} ${dd} ${mon} ${yyyy} ${hh}:${mm}:${ss} GMT-0400`
}

interface MockAuthUser {
  id: string
  displayName: string | null
  email: string
  phone: string | null
  provider: string
  providerType: string
  createdAt: string
  lastSignInAt: string | null
}

const MOCK_NAMES: (string | null)[] = [
  'Alice Johnson',
  'Bob Smith',
  'Carol Williams',
  'Dave Brown',
  'Eve Davis',
  'Frank Wilson',
  'Grace Lee',
  'Henry Taylor',
  'Ivy Chen',
  'Jack Martin',
  'Karen White',
  'Leo Garcia',
  'Mia Robinson',
  'Noah Clark',
  'Olivia Hall',
  'Paul Adams',
  'Quinn Foster',
  'Ruby Scott',
  'Sam Turner',
  'Tina Brooks',
  'Uma Patel',
  'Victor Hayes',
  'Wendy Ross',
  'Xander Cole',
]

const MOCK_EMAILS = MOCK_NAMES.map((name) => {
  const [first, last] = name!.toLowerCase().split(' ')
  return `${first}.${last}@example.com`
})

const MOCK_USERS: MockAuthUser[] = Array.from({ length: 24 }, (_, i) => ({
  id: mockUUID(i + 7700),
  displayName: MOCK_NAMES[i % MOCK_NAMES.length],
  email: MOCK_EMAILS[i % MOCK_EMAILS.length],
  phone: null,
  provider: 'Email',
  providerType: '-',
  createdAt: mockTimestamp(i),
  lastSignInAt: i % 7 === 0 ? null : mockTimestamp(i + 3),
}))

// ─── Users Table ────────────────────────────────────────────────────────

function UsersTable() {
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set())

  const toggleRow = (idx: number) => {
    setSelectedRows((prev) => {
      const next = new Set(prev)
      if (next.has(idx)) next.delete(idx)
      else next.add(idx)
      return next
    })
  }

  const allSelected = selectedRows.size === MOCK_USERS.length
  const someSelected = selectedRows.size > 0 && !allSelected

  const toggleAll = () => {
    if (selectedRows.size === MOCK_USERS.length) {
      setSelectedRows(new Set())
    } else {
      setSelectedRows(new Set(MOCK_USERS.map((_, i) => i)))
    }
  }

  return (
    <div className="flex flex-col h-full w-full">
      {/* Toolbar */}
      <div className="bg-surface-200 py-3 px-4 flex items-center justify-between gap-2 flex-shrink-0">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {/* Composed search input */}
          <div className="flex items-center h-[32px] rounded-md border border-default bg-control overflow-hidden">
            <div className="flex items-center justify-center px-2.5 border-r border-default">
              <Search size={14} strokeWidth={1.5} className="text-foreground-muted" />
            </div>
            <button className="flex items-center gap-1.5 px-3 text-xs text-foreground whitespace-nowrap border-r border-default h-full hover:bg-surface-200 transition-colors">
              Email address
              <ChevronDown size={12} strokeWidth={1.5} className="text-foreground-muted" />
            </button>
            <input
              type="text"
              placeholder="Search by email"
              className="h-full text-xs px-3 w-48 bg-transparent text-foreground placeholder:text-foreground-muted focus:outline-none border-none"
            />
          </div>

          <div className="flex items-center gap-1.5 text-xs text-foreground-light">
            <ArrowDownWideNarrow size={14} strokeWidth={1.5} />
            <span>Sorted by user ID</span>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Button
            type="primary"
            size="tiny"
            iconRight={<ChevronDown size={14} strokeWidth={1.5} />}
          >
            Add user
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto min-h-0">
        <table className="w-full border-collapse text-sm mt-0" style={{ minWidth: 1200 }}>
          <thead className="sticky top-0 z-10">
            <tr className="bg-surface-200 border-b border-default">
              {/* Checkbox + Avatar */}
              <th className="bg-surface-200 w-[95px] min-w-[95px] px-4" style={{ height: 36 }}>
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    ref={(el) => {
                      if (el) el.indeterminate = someSelected
                    }}
                    onChange={toggleAll}
                    className="h-4 w-4 cursor-pointer rounded border border-strong bg-control appearance-none checked:bg-foreground checked:border-foreground"
                    style={
                      allSelected || someSelected
                        ? {
                            backgroundImage: allSelected
                              ? "url(\"data:image/svg+xml,%3csvg viewBox='0 0 16 16' fill='white' xmlns='http://www.w3.org/2000/svg'%3e%3cpath d='M12.207 4.793a1 1 0 010 1.414l-5 5a1 1 0 01-1.414 0l-2-2a1 1 0 011.414-1.414L6.5 9.086l4.293-4.293a1 1 0 011.414 0z'/%3e%3c/svg%3e\")"
                              : "url(\"data:image/svg+xml,%3csvg viewBox='0 0 16 16' fill='white' xmlns='http://www.w3.org/2000/svg'%3e%3crect x='3' y='7' width='10' height='2' rx='1'/%3e%3c/svg%3e\")",
                            backgroundSize: '100% 100%',
                            backgroundPosition: 'center',
                            backgroundRepeat: 'no-repeat',
                          }
                        : undefined
                    }
                  />
                </div>
              </th>
              <th
                className="bg-surface-200 text-left text-xs text-foreground-light font-normal whitespace-nowrap px-3"
                style={{ height: 36, width: 280 }}
              >
                UID
              </th>
              <th
                className="bg-surface-200 text-left text-xs text-foreground-light font-normal whitespace-nowrap px-3"
                style={{ height: 36, width: 150 }}
              >
                Display name
              </th>
              <th
                className="bg-surface-200 text-left text-xs text-foreground-light font-normal whitespace-nowrap px-3"
                style={{ height: 36, width: 300 }}
              >
                Email
              </th>
              <th
                className="bg-surface-200 text-left text-xs text-foreground-light font-normal whitespace-nowrap px-3"
                style={{ height: 36 }}
              >
                Phone
              </th>
              <th
                className="bg-surface-200 text-left text-xs text-foreground-light font-normal whitespace-nowrap px-3"
                style={{ height: 36, minWidth: 150 }}
              >
                Providers
              </th>
              <th
                className="bg-surface-200 text-left text-xs text-foreground-light font-normal whitespace-nowrap px-3"
                style={{ height: 36, minWidth: 150 }}
              >
                Provider type
              </th>
              <th
                className="bg-surface-200 text-left text-xs text-foreground-light font-normal whitespace-nowrap px-3"
                style={{ height: 36, width: 260 }}
              >
                Created at
              </th>
              <th
                className="bg-surface-200 text-left text-xs text-foreground-light font-normal whitespace-nowrap px-3"
                style={{ height: 36, width: 260 }}
              >
                Last sign in at
              </th>
            </tr>
          </thead>
          <tbody>
            {MOCK_USERS.map((user, idx) => {
              const isSelected = selectedRows.has(idx)
              return (
                <tr
                  key={idx}
                  className={cn(
                    'group cursor-pointer transition-colors border-b border-default',
                    isSelected ? 'bg-surface-300' : 'bg-200 hover:bg-surface-200'
                  )}
                >
                  {/* Checkbox + Avatar */}
                  <td className="px-4" style={{ height: 44 }}>
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleRow(idx)}
                        className="h-4 w-4 cursor-pointer rounded border border-strong bg-control appearance-none checked:bg-foreground checked:border-foreground"
                        style={
                          isSelected
                            ? {
                                backgroundImage:
                                  "url(\"data:image/svg+xml,%3csvg viewBox='0 0 16 16' fill='white' xmlns='http://www.w3.org/2000/svg'%3e%3cpath d='M12.207 4.793a1 1 0 010 1.414l-5 5a1 1 0 01-1.414 0l-2-2a1 1 0 011.414-1.414L6.5 9.086l4.293-4.293a1 1 0 011.414 0z'/%3e%3c/svg%3e\")",
                                backgroundSize: '100% 100%',
                                backgroundPosition: 'center',
                                backgroundRepeat: 'no-repeat',
                              }
                            : undefined
                        }
                      />
                      <div className="w-6 h-6 rounded-full bg-surface-300 flex items-center justify-center flex-shrink-0">
                        <User size={14} strokeWidth={1.5} className="text-foreground-muted" />
                      </div>
                    </div>
                  </td>
                  <td
                    className="px-3 text-sm text-foreground whitespace-nowrap"
                    style={{ height: 44 }}
                  >
                    {user.id}
                  </td>
                  <td
                    className="px-3 text-sm text-foreground whitespace-nowrap"
                    style={{ height: 44 }}
                  >
                    {user.displayName ?? '-'}
                  </td>
                  <td
                    className="px-3 text-sm text-foreground whitespace-nowrap"
                    style={{ height: 44 }}
                  >
                    {user.email}
                  </td>
                  <td
                    className="px-3 text-sm text-foreground whitespace-nowrap"
                    style={{ height: 44 }}
                  >
                    {user.phone ?? '-'}
                  </td>
                  <td className="px-3 whitespace-nowrap" style={{ height: 44 }}>
                    <div className="flex items-center gap-1.5">
                      <div className="w-5 h-5 rounded-full bg-surface-300 flex items-center justify-center">
                        <Mail size={12} strokeWidth={1.5} className="text-foreground-muted" />
                      </div>
                      <span className="text-sm text-foreground">{user.provider}</span>
                    </div>
                  </td>
                  <td
                    className="px-3 text-sm text-foreground whitespace-nowrap"
                    style={{ height: 44 }}
                  >
                    {user.providerType}
                  </td>
                  <td
                    className="px-3 text-sm text-foreground whitespace-nowrap"
                    style={{ height: 44 }}
                  >
                    {user.createdAt}
                  </td>
                  <td className="px-3 text-sm whitespace-nowrap" style={{ height: 44 }}>
                    {user.lastSignInAt ? (
                      <span className="text-foreground">{user.lastSignInAt}</span>
                    ) : (
                      <span className="text-foreground-lighter">Waiting for verification</span>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="flex justify-between min-h-9 h-9 overflow-hidden items-center px-6 w-full border-t text-xs text-foreground-light flex-shrink-0">
        <span>Total: {MOCK_USERS.length} users</span>
      </div>
    </div>
  )
}

// ─── Auth Screen ────────────────────────────────────────────────────────

export function AuthScreen() {
  const [activeKey, setActiveKey] = useState('users')

  return (
    <div className="flex h-full w-full">
      {/* Product Menu / Sub-navbar */}
      <div
        className={cn(
          'flex flex-col h-full',
          'hide-scrollbar bg-dash-sidebar border-default border-r',
          'w-64 min-w-64 max-w-64'
        )}
      >
        {/* Title */}
        <div className="border-default flex min-h-[46px] items-center border-b px-6">
          <h4 className="text-lg">Authentication</h4>
        </div>

        {/* Menu */}
        <div className="flex flex-col space-y-8 overflow-y-auto">
          {AUTH_MENU.map((group, groupIdx) => (
            <div key={group.title}>
              <div className="my-6 space-y-8">
                <div className="mx-3">
                  {/* Group Title */}
                  <div className="flex space-x-3 mb-2 font-normal px-3">
                    <span className="text-sm text-foreground-lighter w-full uppercase font-mono">
                      {group.title}
                    </span>
                  </div>
                  {/* Items */}
                  <div>
                    {group.items.map((item) => {
                      const isActive = activeKey === item.key
                      return (
                        <button
                          key={item.key}
                          onClick={() => !item.disabled && setActiveKey(item.key)}
                          className={cn(
                            'w-full flex items-center gap-2 text-left px-3 py-1 text-sm transition group',
                            item.disabled
                              ? 'opacity-50 cursor-default pointer-events-none'
                              : 'cursor-pointer',
                            isActive
                              ? 'font-semibold bg-surface-200 text-foreground rounded-md'
                              : 'font-normal text-foreground-light hover:text-foreground'
                          )}
                        >
                          <div className="flex w-full items-center justify-between gap-1">
                            <span className="truncate flex-1 min-w-0">{item.name}</span>
                            {item.label && (
                              <Badge className="flex-shrink-0" variant="warning">
                                {item.label}
                              </Badge>
                            )}
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </div>
              </div>
              {groupIdx !== AUTH_MENU.length - 1 && (
                <div className="h-px w-full bg-border-overlay" />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-0">
        {activeKey === 'users' ? (
          <UsersTable />
        ) : (
          <div className="flex-1 flex items-center justify-center bg-surface-100">
            <p className="text-foreground-lighter text-sm">
              {AUTH_MENU.flatMap((g) => g.items).find((i) => i.key === activeKey)?.name}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
