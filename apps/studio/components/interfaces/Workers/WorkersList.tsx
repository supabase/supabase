import { ChevronLeft, ChevronRight, Terminal } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useState } from 'react'
import {
  Badge,
  Button,
  Card,
  CardFooter,
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
import { WORKERS_REGION_SHORT } from './Workers.constants'
import type { Worker, WorkerAccess, WorkerBuildState } from './Workers.types'
import { filterWorkers, formatResources, getPage } from './Workers.utils'
import { WorkerStatePill } from './WorkerStatePill'
import { ButtonTooltip } from '@/components/ui/ButtonTooltip'

interface WorkersListProps {
  projectRef: string
  workers: Worker[]
  onDeploy: () => void
}

const STATE_FILTERS: { value: WorkerBuildState | 'all'; label: string }[] = [
  { value: 'all', label: 'All states' },
  { value: 'active', label: 'Active' },
  { value: 'building', label: 'Building' },
  { value: 'failed', label: 'Failed' },
]

const ACCESS_FILTERS: { value: WorkerAccess | 'all'; label: string }[] = [
  { value: 'all', label: 'All access' },
  { value: 'public', label: 'Public' },
  { value: 'private', label: 'Private' },
]

const PAGE_SIZE = 10

const parseStateFilter = (value: string): WorkerBuildState | 'all' =>
  STATE_FILTERS.find((option) => option.value === value)?.value ?? 'all'

const parseAccessFilter = (value: string): WorkerAccess | 'all' =>
  ACCESS_FILTERS.find((option) => option.value === value)?.value ?? 'all'

export const WorkersList = ({ projectRef, workers, onDeploy }: WorkersListProps) => {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [stateFilter, setStateFilter] = useState<WorkerBuildState | 'all'>('all')
  const [accessFilter, setAccessFilter] = useState<WorkerAccess | 'all'>('all')
  const [page, setPage] = useState(1)

  const filtered = filterWorkers(workers, {
    search,
    state: stateFilter,
    access: accessFilter,
  })
  const { items: paged, currentPage, totalPages, startIndex } = getPage(filtered, page, PAGE_SIZE)

  const resetToFirstPage = () => setPage(1)

  const workerPagePath = (name: string) => `/project/${projectRef}/workers/${name}`

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
            setStateFilter(parseStateFilter(value))
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
            setAccessFilter(parseAccessFilter(value))
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
          <Button variant="primary" icon={<Terminal />} onClick={onDeploy}>
            Deploy a worker
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
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-foreground-lighter">
                  No workers match your filters
                </TableCell>
              </TableRow>
            )}
            {paged.map((worker) => (
              <TableRow
                key={worker.name}
                className="cursor-pointer"
                onClick={() => router.push(workerPagePath(worker.name))}
              >
                <TableCell className="font-medium text-foreground">
                  <Link href={workerPagePath(worker.name)} onClick={(e) => e.stopPropagation()}>
                    {worker.name}
                  </Link>
                </TableCell>
                <TableCell>
                  <WorkerStatePill worker={worker} />
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
                  {formatResources(worker)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {filtered.length > 0 && (
          <CardFooter className="flex items-center justify-between border-t p-4">
            <p className="text-sm text-foreground-muted">
              Showing {startIndex + 1} to {startIndex + paged.length} of {filtered.length} worker
              {filtered.length === 1 ? '' : 's'}
            </p>
            <div className="flex items-center gap-x-2" aria-label="Pagination">
              <ButtonTooltip
                icon={<ChevronLeft />}
                aria-label="Previous page"
                variant="default"
                size="tiny"
                disabled={currentPage === 1}
                onClick={() => setPage(currentPage - 1)}
                tooltip={{
                  content: {
                    side: 'top',
                    text: currentPage === 1 ? 'Already on the first page' : undefined,
                  },
                }}
              />
              <span className="text-sm text-foreground-light tabular-nums">
                Page {currentPage} of {totalPages}
              </span>
              <ButtonTooltip
                icon={<ChevronRight />}
                aria-label="Next page"
                variant="default"
                size="tiny"
                disabled={currentPage >= totalPages}
                onClick={() => setPage(currentPage + 1)}
                tooltip={{
                  content: {
                    side: 'top',
                    text: currentPage >= totalPages ? 'Already on the last page' : undefined,
                  },
                }}
              />
            </div>
          </CardFooter>
        )}
      </Card>
    </div>
  )
}
