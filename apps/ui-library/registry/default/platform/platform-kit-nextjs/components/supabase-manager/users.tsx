import { AlertTriangle, Users as UsersIcon } from 'lucide-react'
import { useState } from 'react'

import { Alert, AlertDescription, AlertTitle } from '@/registry/default/components/ui/alert'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/registry/default/components/ui/select'
import { Skeleton } from '@/registry/default/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/registry/default/components/ui/table'
import { UsersGrowthChart } from '@/registry/default/platform/platform-kit-nextjs/components/users-growth-chart'
import { useListUsers } from '@/registry/default/platform/platform-kit-nextjs/hooks/use-users'

function formatDate(value?: string | null) {
  if (!value) return '—'
  return new Date(value).toLocaleString()
}

export function UsersManager() {
  const [timeRange, setTimeRange] = useState(90)
  const { data, isLoading, isError } = useListUsers(1, 100)
  const users = data?.users ?? []

  return (
    <div className="pb-8">
      <div className="flex items-center justify-between p-6 pt-4 lg:p-8 lg:pt-8">
        <div className="flex-1">
          <h1 className="text-base font-semibold lg:text-xl">Users</h1>
          <p className="mt-1 hidden text-sm text-muted-foreground lg:block lg:text-base">
            View user signups over time
          </p>
        </div>
        <Select value={String(timeRange)} onValueChange={(value) => setTimeRange(Number(value))}>
          <SelectTrigger className="w-[160px] rounded-lg sm:ml-auto" aria-label="Select a value">
            <SelectValue placeholder="Select time range" />
          </SelectTrigger>
          <SelectContent className="rounded-xl">
            <SelectItem value="90" className="rounded-lg">
              Last 90 days
            </SelectItem>
            <SelectItem value="30" className="rounded-lg">
              Last 30 days
            </SelectItem>
            <SelectItem value="7" className="rounded-lg">
              Last 7 days
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="px-8">
        <UsersGrowthChart timeRange={timeRange} />
      </div>

      <div className="px-6 pt-6 lg:px-8">
        <h2 className="font-semibold">Recent users</h2>
      </div>
      {isLoading && (
        <div className="space-y-2 p-4 px-6 lg:px-8">
          <Skeleton className="h-6 w-full" />
          <Skeleton className="h-6 w-full" />
          <Skeleton className="h-6 w-full" />
        </div>
      )}
      {isError && (
        <div className="px-6 py-4 lg:px-8">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Error loading users</AlertTitle>
            <AlertDescription>There was a problem loading your users.</AlertDescription>
          </Alert>
        </div>
      )}
      {!isLoading && users.length === 0 && !isError && (
        <div className="mx-6 mt-4 lg:mx-8">
          <Alert>
            <UsersIcon className="h-4 w-4" />
            <AlertTitle>No users yet</AlertTitle>
            <AlertDescription>Users will appear here once people sign up.</AlertDescription>
          </Alert>
        </div>
      )}
      {users.length > 0 && (
        <div className="mt-4 overflow-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="first:pl-6 lg:first:pl-8">Email</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="last:pr-6 lg:last:pr-8">Last sign in</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id} className="hover:bg-muted/50">
                  <TableCell className="first:pl-6 font-mono text-xs lg:first:pl-8">
                    {user.email ?? user.phone ?? user.id}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {formatDate(user.created_at)}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground last:pr-6 lg:last:pr-8">
                    {formatDate(user.last_sign_in_at)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
