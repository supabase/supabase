import { BoxPlus } from 'icons'
import { Plus } from 'lucide-react'
import Link from 'next/link'

import { useIsFeatureEnabled } from 'hooks/misc/useIsFeatureEnabled'
import { BASE_PATH } from 'lib/constants'
import {
  Button,
  Card,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from 'ui'
import { EmptyStatePresentational } from 'ui-patterns'
import { ShimmeringCard } from './ShimmeringCard'

export const Header = () => {
  return (
    <div className="border-default border-b p-3">
      <div className="flex items-center space-x-2">
        <Link href="/projects">
          <img
            src={`${BASE_PATH}/img/supabase-logo.svg`}
            alt="Supabase"
            className="border-default rounded border p-1 hover:border-white"
            style={{ height: 24 }}
          />
        </Link>
      </div>
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
    <EmptyStatePresentational
      icon={BoxPlus}
      title="Create a project"
      description="Launch a complete backend built on Postgres."
    >
      {projectCreationEnabled && (
        <Button size="tiny" type="default" asChild icon={<Plus />}>
          <Link href={`/new/${slug}`}>New project</Link>
        </Button>
      )}
    </EmptyStatePresentational>
  )
}

export const NoOrganizationsState = () => {
  return (
    <EmptyStatePresentational
      title="Create an organization"
      description="Manage your team and projects in one place."
    >
      <Button size="tiny" type="primary" asChild icon={<Plus />}>
        <Link href="/new">New organization</Link>
      </Button>
    </EmptyStatePresentational>
  )
}
