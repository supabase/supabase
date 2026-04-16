'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { ChevronDown, Filter, Key, List } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Button } from 'ui'

const columns = [
  { name: 'id', format: 'int8', isPrimaryKey: true },
  { name: 'created_at', format: 'timestamptz' },
  { name: 'name', format: 'text' },
  { name: 'email', format: 'text' },
  { name: 'role', format: 'text' },
  { name: 'is_active', format: 'bool' },
  { name: 'avatar_url', format: 'text' },
]

type Row = {
  id: number
  created_at: string
  name: string
  email: string
  role: string
  is_active: boolean
  avatar_url: string
}

const initialRows: Row[] = [
  {
    id: 1,
    created_at: '2024-01-15 09:23:41+00',
    name: 'Alice Johnson',
    email: 'alice@example.com',
    role: 'admin',
    is_active: true,
    avatar_url: 'https://i.pravatar.cc/150?u=alice',
  },
  {
    id: 2,
    created_at: '2024-01-15 10:45:12+00',
    name: 'Bob Smith',
    email: 'bob@example.com',
    role: 'editor',
    is_active: true,
    avatar_url: 'https://i.pravatar.cc/150?u=bob',
  },
  {
    id: 3,
    created_at: '2024-02-03 14:12:08+00',
    name: 'Carol Williams',
    email: 'carol@example.com',
    role: 'viewer',
    is_active: false,
    avatar_url: 'https://i.pravatar.cc/150?u=carol',
  },
  {
    id: 4,
    created_at: '2024-02-14 08:33:55+00',
    name: 'David Brown',
    email: 'david@example.com',
    role: 'editor',
    is_active: true,
    avatar_url: 'NULL',
  },
  {
    id: 5,
    created_at: '2024-03-01 16:07:29+00',
    name: 'Eve Martinez',
    email: 'eve@example.com',
    role: 'admin',
    is_active: true,
    avatar_url: 'https://i.pravatar.cc/150?u=eve',
  },
  {
    id: 6,
    created_at: '2024-03-10 11:52:44+00',
    name: 'Frank Lee',
    email: 'frank@example.com',
    role: 'viewer',
    is_active: true,
    avatar_url: 'https://i.pravatar.cc/150?u=frank',
  },
  {
    id: 7,
    created_at: '2024-03-22 07:18:03+00',
    name: 'Grace Kim',
    email: 'grace@example.com',
    role: 'editor',
    is_active: false,
    avatar_url: 'https://i.pravatar.cc/150?u=grace',
  },
  {
    id: 8,
    created_at: '2024-04-05 13:41:17+00',
    name: 'Henry Chen',
    email: 'henry@example.com',
    role: 'viewer',
    is_active: true,
    avatar_url: 'https://i.pravatar.cc/150?u=henry',
  },
  {
    id: 9,
    created_at: '2024-04-12 09:05:33+00',
    name: 'Isla Patel',
    email: 'isla@example.com',
    role: 'admin',
    is_active: true,
    avatar_url: 'https://i.pravatar.cc/150?u=isla',
  },
  {
    id: 10,
    created_at: '2024-04-18 15:22:07+00',
    name: 'Jack Rivera',
    email: 'jack@example.com',
    role: 'editor',
    is_active: false,
    avatar_url: 'NULL',
  },
  {
    id: 11,
    created_at: '2024-05-02 11:48:19+00',
    name: 'Karen Nguyen',
    email: 'karen@example.com',
    role: 'viewer',
    is_active: true,
    avatar_url: 'https://i.pravatar.cc/150?u=karen',
  },
  {
    id: 12,
    created_at: '2024-05-09 08:14:52+00',
    name: "Liam O'Brien",
    email: 'liam@example.com',
    role: 'editor',
    is_active: true,
    avatar_url: 'https://i.pravatar.cc/150?u=liam',
  },
  {
    id: 13,
    created_at: '2024-05-21 17:33:28+00',
    name: 'Mia Tanaka',
    email: 'mia@example.com',
    role: 'admin',
    is_active: true,
    avatar_url: 'https://i.pravatar.cc/150?u=mia',
  },
  {
    id: 14,
    created_at: '2024-06-01 10:07:41+00',
    name: 'Noah Garcia',
    email: 'noah@example.com',
    role: 'viewer',
    is_active: false,
    avatar_url: 'https://i.pravatar.cc/150?u=noah',
  },
  {
    id: 15,
    created_at: '2024-06-14 14:55:03+00',
    name: 'Olivia Schmidt',
    email: 'olivia@example.com',
    role: 'editor',
    is_active: true,
    avatar_url: 'NULL',
  },
  {
    id: 16,
    created_at: '2024-06-23 06:29:17+00',
    name: 'Pablo Morales',
    email: 'pablo@example.com',
    role: 'viewer',
    is_active: true,
    avatar_url: 'https://i.pravatar.cc/150?u=pablo',
  },
  {
    id: 17,
    created_at: '2024-07-04 12:11:44+00',
    name: 'Quinn Foster',
    email: 'quinn@example.com',
    role: 'admin',
    is_active: true,
    avatar_url: 'https://i.pravatar.cc/150?u=quinn',
  },
  {
    id: 18,
    created_at: '2024-07-15 19:38:56+00',
    name: 'Ruby Aoki',
    email: 'ruby@example.com',
    role: 'editor',
    is_active: false,
    avatar_url: 'https://i.pravatar.cc/150?u=ruby',
  },
  {
    id: 19,
    created_at: '2024-07-28 07:52:10+00',
    name: 'Sam Walker',
    email: 'sam@example.com',
    role: 'viewer',
    is_active: true,
    avatar_url: 'https://i.pravatar.cc/150?u=sam',
  },
  {
    id: 20,
    created_at: '2024-08-03 16:04:33+00',
    name: 'Tara Singh',
    email: 'tara@example.com',
    role: 'admin',
    is_active: true,
    avatar_url: 'https://i.pravatar.cc/150?u=tara',
  },
]

const namePool = [
  'Uri Petrov',
  'Vera Costa',
  'Will Chang',
  'Xena Müller',
  'Yuki Sato',
  'Zara Ahmed',
  'Felix Braun',
  'Luna Park',
  'Oscar Diaz',
  'Nina Rossi',
]
const rolePool = ['admin', 'editor', 'viewer']
const editableFields = ['name', 'email', 'role', 'is_active'] as const
const nameEdits = [
  'Alex Turner',
  'Sofia Reyes',
  'Marcus Cole',
  'Priya Sharma',
  'Leo Zhang',
  'Dana Okafor',
]
const emailEdits = [
  'updated@example.com',
  'new.email@example.com',
  'changed@example.com',
  'modified@example.com',
]

function randomTimestamp(): string {
  const m = String(Math.floor(Math.random() * 12) + 1).padStart(2, '0')
  const d = String(Math.floor(Math.random() * 28) + 1).padStart(2, '0')
  const h = String(Math.floor(Math.random() * 24)).padStart(2, '0')
  const min = String(Math.floor(Math.random() * 60)).padStart(2, '0')
  const sec = String(Math.floor(Math.random() * 60)).padStart(2, '0')
  return `2025-${m}-${d} ${h}:${min}:${sec}+00`
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function formatCellValue(value: unknown): string {
  if (value === null || value === undefined) return 'NULL'
  if (typeof value === 'boolean') return value.toString()
  return String(value)
}

// ── Stable identity for each row instance ──
// Every row gets a unique _uid that never changes and is never reused.
let uidCounter = 0
type URow = Row & { _uid: string }

function stampRow(row: Row): URow {
  return { ...row, _uid: `u${++uidCounter}` }
}

// ── Flash state: at most one thing highlighted at a time ──
type Flash = {
  type: 'modify' | 'add' | 'delete'
  uid: string // row _uid
  col?: string // column name, only for 'modify'
} | null

export function VisualDemo() {
  // All rows carry a stable _uid used as the sole React key.
  const [initialStamped] = useState<URow[]>(() => initialRows.map(stampRow))
  const [rows, setRows] = useState<URow[]>(initialStamped)
  const [introComplete, setIntroComplete] = useState(false)
  const [flash, setFlash] = useState<Flash>(null)
  const [isInView, setIsInView] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const observer = new IntersectionObserver(([entry]) => setIsInView(entry.isIntersecting), {
      threshold: 0.1,
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  // Map from _uid → stagger order for intro animation
  const introOrder = useRef<Record<string, number>>({})
  if (Object.keys(introOrder.current).length === 0) {
    initialStamped.forEach((r, i) => {
      introOrder.current[r._uid] = i
    })
  }

  // Mutable refs so the action loop never needs to re-create.
  const rowsRef = useRef(rows)
  rowsRef.current = rows
  const nextId = useRef(initialRows.length + 1)
  const deleted = useRef<URow[]>([])

  // Per-cell version counter: bumped on every modify so the AnimatePresence
  // key always changes, even if the display value happens to stay the same.
  const cellVer = useRef<Record<string, number>>({})
  function bumpCellVer(uid: string, col: string) {
    const k = `${uid}.${col}`
    cellVer.current[k] = (cellVer.current[k] || 0) + 1
  }
  function getCellVer(uid: string, col: string) {
    return cellVer.current[`${uid}.${col}`] || 0
  }

  // ── Intro stagger ──
  const introMs = (initialRows.length * 0.025 + 0.36) * 1000 + 200
  useEffect(() => {
    const t = setTimeout(() => setIntroComplete(true), introMs)
    return () => clearTimeout(t)
  }, [introMs])

  // ── Action loop — one action at a time, only while in view ──
  useEffect(() => {
    if (!introComplete || !isInView) return
    let cancelled = false
    let timer: ReturnType<typeof setTimeout>

    function schedule() {
      const delay = 1500 + Math.random() * 2500
      timer = setTimeout(() => {
        if (cancelled) return
        runAction(() => {
          if (!cancelled) schedule()
        })
      }, delay)
    }

    function runAction(onDone: () => void) {
      const cur = rowsRef.current
      const actions = ['modify', 'modify', 'delete', 'add'] as const
      let action = pick(actions)
      if (action === 'delete' && cur.length <= 20) action = 'add'

      if (action === 'modify') {
        const row = pick(cur)
        const field = pick(editableFields)
        const updated = { ...row }

        if (field === 'name') updated.name = pick(nameEdits)
        else if (field === 'email') {
          const u = updated.name.toLowerCase().split(' ')[0]
          updated.email = Math.random() > 0.5 ? `${u}@example.com` : pick(emailEdits)
        } else if (field === 'role') {
          updated.role = pick(rolePool.filter((r) => r !== updated.role))
        } else {
          updated.is_active = !updated.is_active
        }

        bumpCellVer(row._uid, field)
        setFlash({ type: 'modify', uid: row._uid, col: field })
        setRows((prev) => prev.map((r) => (r._uid === row._uid ? updated : r)))

        setTimeout(() => {
          setFlash(null)
          onDone()
        }, 800)
        return
      }

      if (action === 'delete') {
        const row = pick(cur)
        // Flash red and remove simultaneously — flash stays visible during exit animation
        setFlash({ type: 'delete', uid: row._uid })
        deleted.current.push(row)
        setRows((prev) => prev.filter((r) => r._uid !== row._uid))

        setTimeout(() => {
          setFlash(null)
          onDone()
        }, 600)
        return
      }

      // ── add ──
      let base: Row
      if (deleted.current.length > 0 && Math.random() > 0.3) {
        const i = Math.floor(Math.random() * deleted.current.length)
        base = { ...deleted.current[i], id: nextId.current++ }
        deleted.current.splice(i, 1)
      } else {
        const name = pick(namePool)
        const u = name.toLowerCase().split(' ')[0]
        base = {
          id: nextId.current++,
          created_at: randomTimestamp(),
          name,
          email: `${u}@example.com`,
          role: pick(rolePool),
          is_active: Math.random() > 0.3,
          avatar_url: Math.random() > 0.2 ? `https://i.pravatar.cc/150?u=${u}` : 'NULL',
        }
      }

      const newRow = stampRow(base)
      setFlash({ type: 'add', uid: newRow._uid })
      setRows((prev) => {
        const pos = Math.floor(Math.random() * (prev.length + 1))
        const next = [...prev]
        next.splice(pos, 0, newRow)
        return next
      })

      setTimeout(() => {
        setFlash(null)
        onDone()
      }, 800)
    }

    schedule()
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [introComplete, isInView])

  return (
    <div ref={containerRef} className="border-t border-border relative">
      <div className="mx-auto max-w-[var(--container-max-w,75rem)] px-6 pb-16 md:pb-24">
        <div className="-translate-y-16 relative w-full aspect-[16/9]">
          {/* Gradient blob behind card */}
          <div
            className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[105%] w-[102%] rounded-[300px] blur-[50px] dark:blur-[24px] dark:saturate-[0.4] dark:brightness-50"
            style={{
              backgroundImage:
                'linear-gradient(90deg, rgba(62, 207, 142, 0.2) 0%, rgba(151, 62, 198, 0.2) 50%, rgba(62, 207, 142, 0.2) 100%)',
            }}
          />
          {/* Card */}
          <div
            className="relative z-10 w-full h-full rounded-xl border border-border bg-surface-75 overflow-hidden flex flex-col"
            style={{
              boxShadow:
                '0 0 0 0.5px var(--shadow-border-color), 0 149px 199px 0 rgba(0,0,0,0.07), 0 62.249px 83.137px 0 rgba(0,0,0,0.05), 0 33.281px 44.449px 0 rgba(0,0,0,0.04), 0 18.657px 24.918px 0 rgba(0,0,0,0.04), 0 9.909px 13.234px 0 rgba(0,0,0,0.03), 0 4.123px 5.507px 0 rgba(0,0,0,0.02)',
            }}
          >
            {/* Toolbar */}
            <div className="flex items-center gap-2 px-1.5 h-10 border-b border-default bg-surface-200 shrink-0">
              <button className="flex items-center gap-1.5 px-2 py-1 rounded text-xs text-foreground-light hover:text-foreground transition-colors">
                <Filter size={14} strokeWidth={1.5} />
                <span>Filter</span>
              </button>
              <button className="flex items-center gap-1.5 px-2 py-1 rounded text-xs text-foreground-light hover:text-foreground transition-colors">
                <List size={14} strokeWidth={1.5} />
                <span>Sort</span>
              </button>
              <Button
                size="tiny"
                className="ml-auto"
                iconRight={<ChevronDown size={12} strokeWidth={2} />}
              >
                Insert
              </Button>
            </div>

            {/* Grid */}
            <div
              className="overflow-hidden"
              style={{
                maskImage: 'linear-gradient(to bottom, rgba(0,0,0,0.85) 60%, transparent 100%)',
                WebkitMaskImage:
                  'linear-gradient(to bottom, rgba(0,0,0,0.85) 60%, transparent 100%)',
              }}
            >
              <div className="overflow-hidden">
                <table
                  className="w-full border-collapse text-[13px] !mt-0"
                  style={{ minWidth: 900 }}
                >
                  <thead>
                    <tr className="bg-surface-200">
                      {columns.map((col) => (
                        <th
                          key={col.name}
                          className="border-b border-r last:border-r-0 border-default px-3 py-1.5 text-left font-normal"
                        >
                          <div className="flex items-center gap-1.5 overflow-hidden">
                            {col.isPrimaryKey && (
                              <Key
                                size={12}
                                strokeWidth={2}
                                className="text-brand rotate-45 shrink-0"
                              />
                            )}
                            <span className="text-foreground text-xs truncate font-medium">
                              {col.name}
                            </span>
                            <span className="text-foreground-light text-xs truncate">
                              {col.format}
                            </span>
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <AnimatePresence initial={true}>
                      {rows.map((row) => (
                        <motion.tr
                          key={row._uid}
                          layout
                          className="bg-surface-75"
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={
                            !introComplete
                              ? {
                                  opacity: {
                                    duration: 0.36,
                                    delay: (introOrder.current[row._uid] ?? 0) * 0.025,
                                    ease: [0.25, 0.1, 0.25, 1],
                                  },
                                  height: { duration: 0 },
                                }
                              : {
                                  layout: { duration: 0.3, ease: [0.25, 0.1, 0.25, 1] },
                                  opacity: { duration: 0.2 },
                                  height: { duration: 0.3 },
                                }
                          }
                        >
                          {columns.map((col) => {
                            const value = row[col.name as keyof Row]
                            const displayValue = formatCellValue(value)
                            const isNull = displayValue === 'NULL'
                            const isBool = col.format === 'bool'

                            const isModifiedCell =
                              flash?.type === 'modify' &&
                              flash.uid === row._uid &&
                              flash.col === col.name
                            const isAddedRow = flash?.type === 'add' && flash.uid === row._uid
                            const isDeletedRow = flash?.type === 'delete' && flash.uid === row._uid

                            const cellBg = isDeletedRow
                              ? 'hsl(var(--destructive-default) / 0.15)'
                              : isModifiedCell || isAddedRow
                                ? 'hsl(var(--brand-default) / 0.15)'
                                : undefined

                            const ver = getCellVer(row._uid, col.name)

                            return (
                              <td
                                key={col.name}
                                className="border-b border-r last:border-r-0 border-secondary px-3 py-1.5 max-w-[200px] transition-colors duration-500"
                                style={cellBg ? { backgroundColor: cellBg } : undefined}
                              >
                                <AnimatePresence mode="wait" initial={false}>
                                  <motion.span
                                    key={`${row._uid}.${col.name}.${ver}`}
                                    className={`block truncate ${
                                      isNull ? 'text-foreground-muted italic' : 'text-foreground'
                                    }`}
                                    initial={{ opacity: 0, y: 4 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -4 }}
                                    transition={{ duration: 0.15 }}
                                  >
                                    {isNull
                                      ? 'NULL'
                                      : isBool
                                        ? value
                                          ? 'true'
                                          : 'false'
                                        : displayValue}
                                  </motion.span>
                                </AnimatePresence>
                              </td>
                            )
                          })}
                        </motion.tr>
                      ))}
                    </AnimatePresence>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
