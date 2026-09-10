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
import type { ComputeInstance, InstanceAccess, InstanceBuildState } from './Compute.types'
import { filterInstances, formatResources, getPage } from './Compute.utils'
import { InstanceStatePill } from './InstanceStatePill'
import { RuntimeBadge } from './RuntimeBadge'
import { ButtonTooltip } from '@/components/ui/ButtonTooltip'

interface ComputeListProps {
  projectRef: string
  instances: ComputeInstance[]
  onDeploy: () => void
  onRefresh: () => void
  isRefreshing: boolean
}

const STATE_FILTERS: { value: InstanceBuildState | 'all'; label: string }[] = [
  { value: 'all', label: 'All states' },
  { value: 'active', label: 'Active' },
  { value: 'building', label: 'Building' },
  { value: 'failed', label: 'Failed' },
]

const ACCESS_FILTERS: { value: InstanceAccess | 'all'; label: string }[] = [
  { value: 'all', label: 'All access' },
  { value: 'public', label: 'Public' },
  { value: 'private', label: 'Private' },
]

const PAGE_SIZE = 10

const parseStateFilter = (value: string): InstanceBuildState | 'all' =>
  STATE_FILTERS.find((option) => option.value === value)?.value ?? 'all'

const parseAccessFilter = (value: string): InstanceAccess | 'all' =>
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
  const [stateFilter, setStateFilter] = useState<InstanceBuildState | 'all'>('all')
  const [accessFilter, setAccessFilter] = useState<InstanceAccess | 'all'>('all')
  const [page, setPage] = useState(1)

  const filtered = filterInstances(instances, {
    search,
    state: stateFilter,
    access: accessFilter,
  })
  const { items: paged, currentPage, totalPages, startIndex } = getPage(filtered, page, PAGE_SIZE)

  const resetToFirstPage = () => setPage(1)

  const instancePagePath = (name: string) => `/project/${projectRef}/compute/${name}`

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
            Deploy an instance
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
                  No instances match your filters
                </TableCell>
              </TableRow>
            )}
            {paged.map((instance) => (
              <TableRow
                key={instance.name}
                className="cursor-pointer"
                onClick={() => router.push(instancePagePath(instance.name))}
              >
                <TableCell className="font-medium text-foreground">
                  <Link href={instancePagePath(instance.name)} onClick={(e) => e.stopPropagation()}>
                    {instance.name}
                  </Link>
                </TableCell>
                <TableCell>
                  <InstanceStatePill instance={instance} />
                </TableCell>
                <TableCell>
                  <RuntimeBadge runtime={instance.runtime} />
                </TableCell>
                <TableCell>
                  {instance.access === 'public' ? (
                    <Badge variant="success">Public</Badge>
                  ) : (
                    <Badge>Private</Badge>
                  )}
                </TableCell>
                <TableCell className="hidden text-foreground-light xl:table-cell">
                  {COMPUTE_REGION_SHORT}
                </TableCell>
                <TableCell className="hidden text-foreground-light lg:table-cell">
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
