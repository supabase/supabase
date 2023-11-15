import dayjs from 'dayjs'
import { observer } from 'mobx-react-lite'
import Link from 'next/link'
import { useState } from 'react'
import { Alert, Button, IconExternalLink, IconSearch, Input, SidePanel } from 'ui'

import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import Table from 'components/to-be-cleaned/Table'
import CodeEditor from 'components/ui/CodeEditor'
import ShimmeringLoader from 'components/ui/ShimmeringLoader'
import { DatabaseMigration, useMigrationsQuery } from 'data/database/migrations-query'
import MigrationsEmptyState from './MigrationsEmptyState'

const Migrations = () => {
  const [search, setSearch] = useState('')
  const [selectedMigration, setSelectedMigration] = useState<DatabaseMigration>()

  const { project } = useProjectContext()
  const { data, isLoading, isSuccess, isError, error } = useMigrationsQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })
  const migrations =
    search.length === 0
      ? data?.result ?? []
      : data?.result.filter(
          (migration) => migration.version.includes(search) || migration.name?.includes(search)
        ) ?? []

  return (
    <>
      <div>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="mb-1 text-xl text-foreground">Database Migrations</h3>
            <div className="text-sm text-foreground-lighter">
              History of migrations that have been run on your database
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button asChild type="default" icon={<IconExternalLink strokeWidth={1.5} />}>
              <Link
                href="https://supabase.com/docs/guides/getting-started/local-development#database-migrations"
                target="_blank"
                rel="noreferrer"
              >
                Documentation
              </Link>
            </Button>
          </div>
        </div>

        {isLoading && (
          <div className="space-y-2">
            <ShimmeringLoader />
            <ShimmeringLoader className="w-3/4" />
            <ShimmeringLoader className="w-1/2" />
          </div>
        )}

        <div>
          {isError && (
            <Alert
              withIcon
              variant="warning"
              title="Failed to retrieve migration history for database"
              actions={[
                <Button key="contact-support" asChild type="default" className="ml-4">
                  <Link
                    href={`/support/new?ref=${project?.ref}&category=dashboard_bug&subject=Unable%20to%20view%20database%20migrations`}
                  >
                    Contact support
                  </Link>
                </Button>,
              ]}
            >
              <p className="mb-1">
                Try refreshing your browser, but if the issue persists, please reach out to us via
                support.
              </p>
              <p>Error: {(error as any)?.message ?? 'Unknown'}</p>
            </Alert>
          )}
          {isSuccess && (
            <div>
              {data.result.length <= 0 && <MigrationsEmptyState />}

              {data.result.length > 0 && (
                <>
                  <div className="w-80 mb-4">
                    <Input
                      size="small"
                      placeholder="Search for a migration"
                      value={search}
                      onChange={(e: any) => setSearch(e.target.value)}
                      icon={<IconSearch size="tiny" />}
                    />
                  </div>
                  <Table
                    head={[
                      <Table.th key="version" style={{ width: '180px' }}>
                        Version
                      </Table.th>,
                      <Table.th key="version">Name</Table.th>,
                      <Table.th key="version">Inserted at (UTC)</Table.th>,
                      <Table.th key="buttons"></Table.th>,
                    ]}
                    body={
                      migrations.length > 0 ? (
                        migrations.map((migration) => {
                          // [Joshen] LEFT OFF HERE
                          const insertedAt = dayjs(migration.version, 'YYYYMMDDHHmmss').format(
                            'DD MMM YYYY, HH:mm:ss'
                          )

                          return (
                            <Table.tr key={migration.version}>
                              <Table.td>{migration.version}</Table.td>
                              <Table.td
                                className={
                                  (migration?.name ?? '').length === 0
                                    ? '!text-foreground-lighter'
                                    : ''
                                }
                              >
                                {migration?.name ?? 'Name not available'}
                              </Table.td>
                              <Table.td>{insertedAt}</Table.td>
                              <Table.td align="right">
                                <Button
                                  type="default"
                                  onClick={() => setSelectedMigration(migration)}
                                >
                                  View migration SQL
                                </Button>
                              </Table.td>
                            </Table.tr>
                          )
                        })
                      ) : (
                        <Table.tr>
                          <Table.td colSpan={3}>
                            <p className="text-sm text-foreground">No results found</p>
                            <p className="text-sm text-foreground-light">
                              Your search for "{search}" did not return any results
                            </p>
                          </Table.td>
                        </Table.tr>
                      )
                    }
                  />
                </>
              )}
            </div>
          )}
        </div>
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

export default observer(Migrations)
