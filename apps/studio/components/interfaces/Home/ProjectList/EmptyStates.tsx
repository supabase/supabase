import { Plus } from 'lucide-react'
import Link from 'next/link'

import { useIsFeatureEnabled } from 'hooks/misc/useIsFeatureEnabled'
import {
  Button,
  Card,
  cn,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from 'ui'
import { ShimmeringCard } from './ShimmeringCard'

export const NoFilterResults = ({
  filterStatus,
  resetFilterStatus,
  className,
}: {
  filterStatus: string[]
  resetFilterStatus?: () => void
  className?: string
}) => {
  return (
    <div
      className={cn(
        'bg-surface-100 px-4 md:px-6 py-4 rounded flex items-center justify-between border border-default',
        className
      )}
    >
      <div className="space-y-1">
        {/* [Joshen] Just keeping it simple for now unless we decide to extend this to other statuses */}
        <p className="text-sm text-foreground">
          {filterStatus.length === 0
            ? `No projects found`
            : `No ${filterStatus[0] === 'INACTIVE' ? 'paused' : 'active'} projects found`}
        </p>
        <p className="text-sm text-foreground-light">
          Your search for projects with the specified status did not return any results
        </p>
      </div>
      {resetFilterStatus !== undefined && (
        <Button type="default" onClick={() => resetFilterStatus()}>
          Reset filter
        </Button>
      )}
    </div>
  )
}

export const LoadingTableView = () => {
  return (
    <Card>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Project</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Compute</TableHead>
            <TableHead>Region</TableHead>
            <TableHead>Created</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {[...Array(3)].map((_, i) => (
            <TableRow key={i}>
              <TableCell>
                <Skeleton className="bg-surface-400 h-4 w-32"></Skeleton>
              </TableCell>
              <TableCell>
                <Skeleton className="bg-surface-400 h-4 w-16"></Skeleton>
              </TableCell>
              <TableCell>
                <Skeleton className="bg-surface-400 h-4 w-20"></Skeleton>
              </TableCell>
              <TableCell>
                <Skeleton className="bg-surface-400 h-4 w-20"></Skeleton>
              </TableCell>
              <TableCell>
                <Skeleton className="bg-surface-400 h-4 w-24"></Skeleton>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  )
}

export const LoadingCardView = () => {
  return (
    <ul className="w-full mx-auto grid grid-cols-1 gap-4 sm:grid-cols-1 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
      <ShimmeringCard />
      <ShimmeringCard />
    </ul>
  )
}

export const NoProjectsState = ({ slug }: { slug: string }) => {
  const projectCreationEnabled = useIsFeatureEnabled('projects:create')

  return (
    <div className="col-span-4 space-y-4 rounded-lg border border-dashed p-6 text-center">
      <div className="space-y-1">
        <p>No projects</p>
        <p className="text-sm text-foreground-light">Get started by creating a new project.</p>
      </div>

      {projectCreationEnabled && (
        <Button asChild icon={<Plus />}>
          <Link href={`/new/${slug}`}>New Project</Link>
        </Button>
      )}
    </div>
  )
}
