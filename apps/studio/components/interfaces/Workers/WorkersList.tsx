import { ChevronLeft, ChevronRight, MoreVertical, Pause, Play, Plus, Trash2 } from 'lucide-react'
import { useRouter } from 'next/router'
import { useState } from 'react'
import {
  Badge,
  Button,
  Card,
  CardFooter,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from 'ui'

import { RuntimeBadge } from './RuntimeBadge'
import { formatResources, WORKERS_REGION_SHORT } from './Workers.constants'
import type { Worker, WorkerAccess, WorkerState } from './Workers.types'
import { WorkerStatePill } from './WorkerStatePill'
import { deleteWorker, resumeWorker, suspendWorker } from '@/state/workers-mock-state'

interface WorkersListProps {
  projectRef: string
  workers: Worker[]
  onCreate: () => void
}

const STATE_FILTERS: { value: WorkerState | 'all'; label: string }[] = [
  { value: 'all', label: 'All states' },
  { value: 'active', label: 'Active' },
  { value: 'deploying', label: 'Deploying' },
  { value: 'suspended', label: 'Suspended' },
  { value: 'errored', label: 'Errored' },
]

const ACCESS_FILTERS: { value: WorkerAccess | 'all'; label: string }[] = [
  { value: 'all', label: 'All access' },
  { value: 'public', label: 'Public' },
  { value: 'private', label: 'Private' },
]

const PAGE_SIZE = 10

export const WorkersList = ({ projectRef, workers, onCreate }: WorkersListProps) => {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [stateFilter, setStateFilter] = useState<WorkerState | 'all'>('all')
  const [accessFilter, setAccessFilter] = useState<WorkerAccess | 'all'>('all')
  const [page, setPage] = useState(1)

  const filtered = workers.filter((worker) => {
    const matchesSearch = worker.name.toLowerCase().includes(search.trim().toLowerCase())
    const matchesState = stateFilter === 'all' || worker.state === stateFilter
    const matchesAccess = accessFilter === 'all' || worker.access === accessFilter
    return matchesSearch && matchesState && matchesAccess
  })

  // Derive the page window; clamp so deletions/filters never strand us on an empty page.
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const startIndex = (currentPage - 1) * PAGE_SIZE
  const paged = filtered.slice(startIndex, startIndex + PAGE_SIZE)

  // Reset to the first page whenever the filters change the result set.
  const resetToFirstPage = () => setPage(1)

  const openWorker = (name: string) => router.push(`/project/${projectRef}/workers/${name}`)

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <Input
          size="small"
          className="w-full md:w-64"
          placeholder="Search by name"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value)
            resetToFirstPage()
          }}
        />
        <Select
          value={stateFilter}
          onValueChange={(value) => {
            setStateFilter(value as WorkerState | 'all')
            resetToFirstPage()
          }}
        >
          <SelectTrigger size="small" className="w-full md:w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATE_FILTERS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={accessFilter}
          onValueChange={(value) => {
            setAccessFilter(value as WorkerAccess | 'all')
            resetToFirstPage()
          }}
        >
          <SelectTrigger size="small" className="w-full md:w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ACCESS_FILTERS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex items-center gap-3 md:ml-auto">
          <span className="text-sm text-foreground-lighter">
            {filtered.length} worker{filtered.length === 1 ? '' : 's'}
          </span>
          <Button variant="primary" icon={<Plus />} onClick={onCreate}>
            Create worker
          </Button>
        </div>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>State</TableHead>
              <TableHead>Runtime</TableHead>
              <TableHead>Access</TableHead>
              <TableHead className="hidden xl:table-cell">Region</TableHead>
              <TableHead className="hidden lg:table-cell">Resources</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-foreground-lighter">
                  No workers match your filters
                </TableCell>
              </TableRow>
            )}
            {paged.map((worker) => {
              const isActive = worker.state === 'active'
              const isSuspended = worker.state === 'suspended'
              return (
                <TableRow
                  key={worker.id}
                  className="cursor-pointer"
                  onClick={() => openWorker(worker.name)}
                >
                  <TableCell className="font-medium text-foreground">{worker.name}</TableCell>
                  <TableCell>
                    <WorkerStatePill state={worker.state} />
                  </TableCell>
                  <TableCell>
                    <RuntimeBadge runtime={worker.runtime} />
                  </TableCell>
                  <TableCell>
                    {worker.access === 'public' ? (
                      <Badge variant="success">Public</Badge>
                    ) : (
                      <Badge>Private</Badge>
                    )}
                  </TableCell>
                  <TableCell className="hidden text-foreground-light xl:table-cell">
                    {WORKERS_REGION_SHORT}
                  </TableCell>
                  <TableCell className="hidden text-foreground-light lg:table-cell">
                    {formatResources(worker.size, worker.instances)}
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-1">
                      {isActive && (
                        <Button
                          variant="text"
                          size="tiny"
                          icon={<Pause size={14} />}
                          title="Suspend"
                          className="px-1.5 text-foreground-lighter hover:text-foreground"
                          onClick={() => suspendWorker(projectRef, worker.id)}
                        />
                      )}
                      {isSuspended && (
                        <Button
                          variant="text"
                          size="tiny"
                          icon={<Play size={14} />}
                          title="Resume"
                          className="px-1.5 text-foreground-lighter hover:text-foreground"
                          onClick={() => resumeWorker(projectRef, worker.id)}
                        />
                      )}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="text"
                            size="tiny"
                            icon={<MoreVertical size={14} />}
                            className="px-1.5 text-foreground-lighter hover:text-foreground"
                          />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40">
                          <DropdownMenuItem onClick={() => openWorker(worker.name)}>
                            View worker
                          </DropdownMenuItem>
                          {isActive && (
                            <DropdownMenuItem onClick={() => suspendWorker(projectRef, worker.id)}>
                              Suspend
                            </DropdownMenuItem>
                          )}
                          {isSuspended && (
                            <DropdownMenuItem onClick={() => resumeWorker(projectRef, worker.id)}>
                              Resume
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="flex items-center gap-2 text-destructive focus:text-destructive"
                            onClick={() => deleteWorker(projectRef, worker.id)}
                          >
                            <Trash2 size={12} />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>

        {filtered.length > 0 && (
          <CardFooter className="flex items-center justify-between border-t p-4">
            <p className="text-sm text-foreground-muted">
              Showing {startIndex + 1} to {startIndex + paged.length} of {filtered.length} worker
              {filtered.length === 1 ? '' : 's'}
            </p>
            <div className="flex items-center gap-x-2" aria-label="Pagination">
              <Button
                icon={<ChevronLeft />}
                aria-label="Previous page"
                variant="default"
                size="tiny"
                disabled={currentPage === 1}
                onClick={() => setPage(currentPage - 1)}
              />
              <span className="text-sm text-foreground-light tabular-nums">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                icon={<ChevronRight />}
                aria-label="Next page"
                variant="default"
                size="tiny"
                disabled={currentPage >= totalPages}
                onClick={() => setPage(currentPage + 1)}
              />
            </div>
          </CardFooter>
        )}
      </Card>
    </div>
  )
}
