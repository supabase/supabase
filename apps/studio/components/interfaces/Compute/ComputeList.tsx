import { ChevronLeft, ChevronRight, RefreshCw, Terminal } from 'lucide-react'
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

import { COMPUTE_REGION_SHORT } from './Compute.constants'
import type {
  ComputeInstance,
  ComputeInstanceAccess,
  ComputeInstanceBuildState,
} from './Compute.types'
import { filterComputeInstances, formatResources, getPage } from './Compute.utils'
import { ComputeInstanceStatePill } from './ComputeInstanceStatePill'
import { RuntimeBadge } from './RuntimeBadge'
import { ButtonTooltip } from '@/components/ui/ButtonTooltip'

interface ComputeListProps {
  projectRef: string
  instances: ComputeInstance[]
  onDeploy: () => void
  onRefresh: () => void
  isRefreshing: boolean
}

const STATE_FILTERS: { value: ComputeInstanceBuildState | 'all'; label: string }[] = [
  { value: 'all', label: 'All states' },
  { value: 'active', label: 'Active' },
  { value: 'building', label: 'Building' },
  { value: 'failed', label: 'Failed' },
]

const ACCESS_FILTERS: { value: ComputeInstanceAccess | 'all'; label: string }[] = [
  { value: 'all', label: 'All access' },
  { value: 'public', label: 'Public' },
  { value: 'private', label: 'Private' },
]

const PAGE_SIZE = 10

const parseStateFilter = (value: string): ComputeInstanceBuildState | 'all' =>
  STATE_FILTERS.find((option) => option.value === value)?.value ?? 'all'

const parseAccessFilter = (value: string): ComputeInstanceAccess | 'all' =>
  ACCESS_FILTERS.find((option) => option.value === value)?.value ?? 'all'

export const ComputeList = ({
  projectRef,
  instances,
  onDeploy,
  onRefresh,
  isRefreshing,
}: ComputeListProps) => {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [stateFilter, setStateFilter] = useState<ComputeInstanceBuildState | 'all'>('all')
  const [accessFilter, setAccessFilter] = useState<ComputeInstanceAccess | 'all'>('all')
  const [page, setPage] = useState(1)

  const filtered = filterComputeInstances(instances, {
    search,
    state: stateFilter,
    access: accessFilter,
  })
  const { items: paged, currentPage, totalPages, startIndex } = getPage(filtered, page, PAGE_SIZE)

  const resetToFirstPage = () => setPage(1)

  const computeInstancePagePath = (name: string) => `/project/${projectRef}/compute/${name}`

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
          <Button variant="default" icon={<RefreshCw />} loading={isRefreshing} onClick={onRefresh}>
            Refresh
          </Button>
          <Button variant="primary" icon={<Terminal />} onClick={onDeploy}>
            Deploy
          </Button>
        </div>
      </div>

      <Card>
        <Table className="table-fixed">
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead className="w-36">State</TableHead>
              <TableHead className="w-40">Runtime</TableHead>
              <TableHead className="w-28">Access</TableHead>
              <TableHead className="hidden w-20 xl:table-cell">Region</TableHead>
              <TableHead className="hidden w-48 lg:table-cell">Resources</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-foreground-lighter">
                  No instances match your filters
                </TableCell>
              </TableRow>
            )}
            {paged.map((instance) => (
              <TableRow
                key={instance.name}
                className="cursor-pointer"
                onClick={() => router.push(computeInstancePagePath(instance.name))}
              >
                <TableCell className="max-w-0 font-medium text-foreground">
                  <Link
                    href={computeInstancePagePath(instance.name)}
                    className="block truncate"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {instance.name}
                  </Link>
                </TableCell>
                <TableCell className="w-36">
                  <ComputeInstanceStatePill instance={instance} />
                </TableCell>
                <TableCell className="w-40 truncate">
                  <RuntimeBadge runtime={instance.runtime} />
                </TableCell>
                <TableCell className="w-28">
                  {instance.access === 'public' ? (
                    <Badge variant="success">Public</Badge>
                  ) : (
                    <Badge>Private</Badge>
                  )}
                </TableCell>
                <TableCell className="hidden w-20 truncate text-foreground-light xl:table-cell">
                  {COMPUTE_REGION_SHORT}
                </TableCell>
                <TableCell className="hidden w-48 truncate text-foreground-light lg:table-cell">
                  {formatResources(instance)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {filtered.length > 0 && (
          <CardFooter className="flex items-center justify-between border-t p-4">
            <p className="text-sm text-foreground-muted">
              Showing {startIndex + 1} to {startIndex + paged.length} of {filtered.length} instance
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
