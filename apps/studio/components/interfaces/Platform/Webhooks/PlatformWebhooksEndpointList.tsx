import { createNavigationHandler } from 'lib/navigation'
import { ChevronRight, Eye, MoreVertical, Plus, Search, Trash2 } from 'lucide-react'
import { useRouter } from 'next/router'
import { useMemo, useState } from 'react'
import {
  Badge,
  Button,
  Card,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableHeadSort,
  TableRow,
} from 'ui'
import { EmptyStatePresentational, TimestampInfo } from 'ui-patterns'
import { Input } from 'ui-patterns/DataInputs/Input'

import type { WebhookEndpoint } from './PlatformWebhooks.types'

interface PlatformWebhooksEndpointListProps {
  filteredEndpoints: WebhookEndpoint[]
  search: string
  webhooksHref: string
  onCreateEndpoint: () => void
  onDeleteEndpoint: (endpointId: string) => void
  onSearchChange: (value: string) => void
  onViewEndpoint: (endpointId: string) => void
}

export const PlatformWebhooksEndpointList = ({
  filteredEndpoints,
  search,
  webhooksHref,
  onCreateEndpoint,
  onDeleteEndpoint,
  onSearchChange,
  onViewEndpoint,
}: PlatformWebhooksEndpointListProps) => {
  const router = useRouter()
  const formatEventCount = (eventTypes: string[]) => {
    if (eventTypes.includes('*')) return 'All events'
    if (eventTypes.length === 1) return '1 event'
    return `${eventTypes.length} events`
  }
  const [sort, setSort] = useState<'status:asc' | 'status:desc' | 'created:asc' | 'created:desc'>(
    'created:desc'
  )

  const [sortColumn, sortDirection] = sort.split(':') as ['status' | 'created', 'asc' | 'desc']

  const getAriaSort = (column: 'status' | 'created') => {
    if (sortColumn !== column) return 'none'
    return sortDirection === 'asc' ? 'ascending' : 'descending'
  }

  const handleSortChange = (column: 'status' | 'created') => {
    if (sortColumn !== column) {
      setSort(`${column}:asc`)
      return
    }

    setSort(`${column}:${sortDirection === 'asc' ? 'desc' : 'asc'}`)
  }

  const sortedEndpoints = useMemo(() => {
    const items = [...filteredEndpoints]

    items.sort((a, b) => {
      if (sortColumn === 'status') {
        const statusA = a.enabled ? 'enabled' : 'disabled'
        const statusB = b.enabled ? 'enabled' : 'disabled'
        const comparison = statusA.localeCompare(statusB)

        if (comparison !== 0) return sortDirection === 'asc' ? comparison : -comparison
      }

      const createdComparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      return sortDirection === 'asc' ? createdComparison : -createdComparison
    })

    return items
  }, [filteredEndpoints, sortColumn, sortDirection])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-foreground text-xl">Endpoints</h2>
      </div>
      <div className="flex items-center justify-between gap-x-2">
        <Input
          placeholder="Search endpoints"
          size="tiny"
          icon={<Search />}
          value={search}
          className="w-full lg:w-52"
          onChange={(event) => onSearchChange(event.target.value)}
        />
        <Button type="primary" icon={<Plus />} onClick={onCreateEndpoint}>
          New endpoint
        </Button>
      </div>

      {filteredEndpoints.length === 0 ? (
        <EmptyStatePresentational
          title="No endpoints yet"
          description="Create an endpoint to start receiving webhook deliveries."
        >
          <Button type="default" onClick={onCreateEndpoint}>
            Create endpoint
          </Button>
        </EmptyStatePresentational>
      ) : (
        <Card className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead aria-sort={getAriaSort('status')}>
                  <TableHeadSort column="status" currentSort={sort} onSortChange={handleSortChange}>
                    Status
                  </TableHeadSort>
                </TableHead>
                <TableHead>URL</TableHead>
                <TableHead>Events</TableHead>
                <TableHead aria-sort={getAriaSort('created')}>
                  <TableHeadSort
                    column="created"
                    currentSort={sort}
                    onSortChange={handleSortChange}
                  >
                    Created
                  </TableHeadSort>
                </TableHead>
                <TableHead className="w-20"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedEndpoints.map((endpoint) => (
                <TableRow
                  key={endpoint.id}
                  className="relative cursor-pointer inset-focus"
                  onClick={createNavigationHandler(
                    `${webhooksHref}/${encodeURIComponent(endpoint.id)}`,
                    router
                  )}
                  onAuxClick={createNavigationHandler(
                    `${webhooksHref}/${encodeURIComponent(endpoint.id)}`,
                    router
                  )}
                  onKeyDown={createNavigationHandler(
                    `${webhooksHref}/${encodeURIComponent(endpoint.id)}`,
                    router
                  )}
                  tabIndex={0}
                >
                  <TableCell>
                    <Badge variant={endpoint.enabled ? 'success' : 'default'}>
                      {endpoint.enabled ? 'Enabled' : 'Disabled'}
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-[420px]">
                    <p className="truncate">{endpoint.url}</p>
                    {endpoint.description && (
                      <p className="text-xs text-foreground-lighter truncate mt-0.5">
                        {endpoint.description}
                      </p>
                    )}
                  </TableCell>
                  <TableCell className="max-w-[280px] truncate">
                    {formatEventCount(endpoint.eventTypes)}
                  </TableCell>
                  <TableCell>
                    <TimestampInfo className="text-sm" utcTimestamp={endpoint.createdAt} />
                    <p className="text-xs text-foreground-lighter mt-0.5">
                      by {endpoint.createdBy}
                    </p>
                  </TableCell>
                  <TableCell className="text-right">
                    <div
                      className="flex justify-end items-center h-full gap-3"
                      onClick={(event) => event.stopPropagation()}
                      onKeyDown={(event) => event.stopPropagation()}
                    >
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            type="default"
                            icon={<MoreVertical />}
                            className="w-7 hit-area-2"
                          />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent side="bottom" align="end" className="w-40">
                          <DropdownMenuItem
                            className="gap-x-2"
                            onClick={() => {
                              onViewEndpoint(endpoint.id)
                            }}
                          >
                            <Eye size={14} />
                            <span>View details</span>
                          </DropdownMenuItem>

                          <DropdownMenuItem
                            className="gap-x-2"
                            onClick={() => onDeleteEndpoint(endpoint.id)}
                          >
                            <Trash2 size={14} />
                            <span>Delete</span>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                      <ChevronRight
                        aria-hidden={true}
                        size={14}
                        className="text-foreground-muted/60"
                      />
                      <button tabIndex={-1} className="sr-only">
                        Go to endpoint details
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  )
}
