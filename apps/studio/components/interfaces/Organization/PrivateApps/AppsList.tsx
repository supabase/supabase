import { usePlatformAppDeleteMutation } from 'data/platform-apps/platform-app-delete-mutation'
import dayjs from 'dayjs'
import { AppWindow, Key, MoreVertical, Plus, Trash } from 'lucide-react'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import {
  Button,
  Card,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableHeadSort,
  TableRow,
} from 'ui'
import { EmptyStatePresentational } from 'ui-patterns'
import { TimestampInfo } from 'ui-patterns/TimestampInfo'

import { DeleteAppModal } from './DeleteAppModal'
import { PrivateApp, usePrivateApps } from './PrivateAppsContext'
import { ViewAppSheet } from './ViewAppSheet'

type AppsSort = 'created_at:asc' | 'created_at:desc'

const handleSortChange = (
  currentSort: AppsSort,
  column: string,
  setSort: (s: AppsSort) => void
) => {
  const [currentCol, currentOrder] = currentSort.split(':')
  if (currentCol === column) {
    setSort(`${column}:${currentOrder === 'asc' ? 'desc' : 'asc'}` as AppsSort)
  } else {
    setSort(`${column}:asc` as AppsSort)
  }
}

interface AppsListProps {
  onCreateApp: () => void
}

export function AppsList({ onCreateApp }: AppsListProps) {
  const { apps, isLoading, slug, removeInstallationsByAppId } = usePrivateApps()
  const { mutate: deleteApp, isPending: isDeleting } = usePlatformAppDeleteMutation({
    onSuccess: (_, vars) => {
      toast.success(`Deleted app`)
      removeInstallationsByAppId(vars.appId)
      if (appToDelete?.id === vars.appId) setAppToDelete(null)
    },
  })

  const [sort, setSort] = useState<AppsSort>('created_at:desc')
  const onSortChange = (column: string) => handleSortChange(sort, column, setSort)
  const [viewApp, setViewApp] = useState<PrivateApp | null>(null)
  const [appToDelete, setAppToDelete] = useState<PrivateApp | null>(null)

  const sortedApps = useMemo(() => {
    const [, order] = sort.split(':')
    return [...apps].sort((a, b) => {
      const diff = new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      return order === 'asc' ? diff : -diff
    })
  }, [apps, sort])

  function handleDelete() {
    if (!appToDelete || !slug) return
    deleteApp({ slug, appId: appToDelete.id })
  }

  return (
    <>
      {isLoading ? (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="max-w-xs">Name</TableHead>
                <TableHead className="w-48">Created</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.from({ length: 3 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell>
                    <div className="h-4 w-32 bg-surface-300 rounded animate-pulse" />
                  </TableCell>
                  <TableCell>
                    <div className="h-4 w-24 bg-surface-300 rounded animate-pulse" />
                  </TableCell>
                  <TableCell />
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      ) : apps.length === 0 ? (
        <EmptyStatePresentational
          icon={AppWindow}
          title="No private apps yet"
          description="Create a private app to generate scoped access tokens for your organization."
        >
          <Button type="primary" icon={<Plus size={14} />} onClick={onCreateApp}>
            Create app
          </Button>
        </EmptyStatePresentational>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead className="w-48">
                  <TableHeadSort column="created_at" currentSort={sort} onSortChange={onSortChange}>
                    Created
                  </TableHeadSort>
                </TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedApps.map((app) => (
                <TableRow key={app.id}>
                  <TableCell>
                    <p className="text-left max-w-[48ch] truncate block">{app.name}</p>
                  </TableCell>
                  <TableCell>
                    <TimestampInfo
                      utcTimestamp={app.created_at}
                      label={dayjs(app.created_at).fromNow()}
                      className="text-sm text-foreground-light whitespace-nowrap"
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button type="default" icon={<MoreVertical size={14} />} className="w-7" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" side="bottom" className="w-44">
                        <DropdownMenuItem className="gap-x-2" onClick={() => setViewApp(app)}>
                          <Key size={14} />
                          View permissions
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="!text-destructive gap-x-2"
                          onClick={() => setAppToDelete(app)}
                        >
                          <Trash size={14} />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      <ViewAppSheet
        app={viewApp}
        visible={viewApp !== null}
        onClose={() => setViewApp(null)}
        onDeleted={() => setViewApp(null)}
      />

      <DeleteAppModal
        app={appToDelete}
        visible={appToDelete !== null}
        onClose={() => setAppToDelete(null)}
        onConfirm={handleDelete}
        isLoading={isDeleting}
      />
    </>
  )
}
