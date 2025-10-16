import dayjs from 'dayjs'
import Link from 'next/link'
import { useState } from 'react'

import CodeEditor from 'components/ui/CodeEditor/CodeEditor'
import ShimmeringLoader from 'components/ui/ShimmeringLoader'
import { DatabaseMigration, useMigrationsQuery } from 'data/database/migrations-query'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { Search } from 'lucide-react'
import {
  Button,
  Card,
  Input,
  SidePanel,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from 'ui'
import { Admonition } from 'ui-patterns'
import MigrationsEmptyState from './MigrationsEmptyState'

const Migrations = () => {
  const [search, setSearch] = useState('')
  const [selectedMigration, setSelectedMigration] = useState<DatabaseMigration>()

  const { data: project } = useSelectedProjectQuery()
  const { data, isLoading, isSuccess, isError, error } = useMigrationsQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })
  const migrations =
    search.length === 0
      ? data ?? []
      : data?.filter(
          (migration) => migration.version.includes(search) || migration.name?.includes(search)
        ) ?? []

  return (
    <>
      {isLoading && (
        <div className="space-y-2">
          <ShimmeringLoader />
          <ShimmeringLoader className="w-3/4" />
          <ShimmeringLoader className="w-1/2" />
        </div>
      )}

      <div>
        {isError && (
          <Admonition
            type="warning"
            title="Failed to retrieve migration history for database"
            description={
              <>
                <p className="mb-1">
                  Try refreshing your browser, but if the issue persists for more than a few
                  minutes, please reach out to us via support.
                </p>
                <p className="mb-4">Error: {(error as any)?.message ?? 'Unknown'}</p>
              </>
            }
          >
            <Button key="contact-support" asChild type="default">
              <Link
                href={`/support/new?projectRef=${project?.ref}&category=dashboard_bug&subject=Unable%20to%20view%20database%20migrations`}
              >
                Contact support
              </Link>
            </Button>
          </Admonition>
        )}
        {isSuccess && (
          <div>
            {data.length <= 0 && <MigrationsEmptyState />}

            {data.length > 0 && (
              <>
                <div className="w-80 mb-4">
                  <Input
                    size="small"
                    placeholder="Search for a migration"
                    value={search}
                    onChange={(e: any) => setSearch(e.target.value)}
                    icon={<Search size="14" />}
                  />
                </div>
                <Card>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead key="version" style={{ width: '180px' }}>
                          Version
                        </TableHead>
                        <TableHead key="version">Name</TableHead>
                        <TableHead key="version">Inserted at (UTC)</TableHead>
                        <TableHead key="buttons"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {migrations.length > 0 ? (
                        migrations.map((migration) => {
                          // [Joshen] LEFT OFF HERE
                          const insertedAt = dayjs(migration.version, 'YYYYMMDDHHmmss').format(
                            'DD MMM YYYY, HH:mm:ss'
                          )

                          return (
                            <TableRow key={migration.version}>
                              <TableCell>{migration.version}</TableCell>
                              <TableCell
                                className={
                                  (migration?.name ?? '').length === 0
                                    ? '!text-foreground-lighter'
                                    : ''
                                }
                              >
                                {migration?.name ?? 'Name not available'}
                              </TableCell>
                              <TableCell>{insertedAt}</TableCell>
                              <TableCell align="right">
                                <Button
                                  type="default"
                                  onClick={() => setSelectedMigration(migration)}
                                >
                                  View migration SQL
                                </Button>
                              </TableCell>
                            </TableRow>
                          )
                        })
                      ) : (
                        <TableRow>
                          <TableCell colSpan={3}>
                            <p className="text-sm text-foreground">No results found</p>
                            <p className="text-sm text-foreground-light">
                              Your search for "{search}" did not return any results
                            </p>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </Card>
              </>
            )}
          </div>
        )}
      </div>

      <SidePanel
        size="large"
        visible={selectedMigration !== undefined}
        header={`Migration: ${selectedMigration?.version}`}
        onCancel={() => setSelectedMigration(undefined)}
        customFooter={
          <div className="flex items-center justify-end p-4 border-t border-overlay-border">
            <Button type="default" onClick={() => setSelectedMigration(undefined)}>
              Close
            </Button>
          </div>
        }
      >
        <div className="h-full">
          <div className="relative h-full">
            <CodeEditor
              isReadOnly
              id={selectedMigration?.version ?? ''}
              language="pgsql"
              defaultValue={selectedMigration?.statements?.join('\n')}
            />
          </div>
        </div>
      </SidePanel>
    </>
  )
}

export default Migrations
