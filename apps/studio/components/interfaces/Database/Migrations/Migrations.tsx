import { SupportCategories } from '@supabase/shared-types/out/constants'
import { SupportLink } from 'components/interfaces/Support/SupportLink'
import CodeEditor from 'components/ui/CodeEditor/CodeEditor'
import { InlineLink } from 'components/ui/InlineLink'
import { DatabaseMigration, useMigrationsQuery } from 'data/database/migrations-query'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { DOCS_URL } from 'lib/constants'
import { parseMigrationVersion } from 'lib/migration-utils'
import { Search } from 'lucide-react'
import { useState } from 'react'
import {
  Button,
  Card,
  cn,
  SidePanel,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from 'ui'
import { Admonition, TimestampInfo } from 'ui-patterns'
import { Input } from 'ui-patterns/DataInputs/Input'
import { ShimmeringLoader } from 'ui-patterns/ShimmeringLoader'

import { MigrationsEmptyState } from './MigrationsEmptyState'

const Migrations = () => {
  const [search, setSearch] = useState('')
  const [selectedMigration, setSelectedMigration] = useState<DatabaseMigration>()

  const { data: project } = useSelectedProjectQuery()
  const {
    data = [],
    isPending: isLoading,
    isSuccess,
    isError,
    error,
  } = useMigrationsQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })
  const migrations =
    search.length === 0
      ? data
      : data.filter(
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
              <SupportLink
                queryParams={{
                  projectRef: project?.ref,
                  category: SupportCategories.DASHBOARD_BUG,
                  subject: 'Unable to view database migrations',
                }}
              >
                Contact support
              </SupportLink>
            </Button>
          </Admonition>
        )}
        {isSuccess && (
          <div>
            {data.length <= 0 && <MigrationsEmptyState />}

            {data.length > 0 && (
              <div className="flex flex-col gap-y-4">
                <Input
                  size="tiny"
                  placeholder="Search for a migration"
                  value={search}
                  className="w-full lg:w-52"
                  onChange={(e: any) => setSearch(e.target.value)}
                  icon={<Search />}
                />
                <Card>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead key="version" style={{ width: '180px' }}>
                          Version
                        </TableHead>
                        <TableHead key="name">Name</TableHead>
                        <TableHead key="insertedAt">Inserted at (UTC)</TableHead>
                        <TableHead key="buttons" />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {migrations.length > 0 ? (
                        migrations.map((migration) => {
                          const versionDayjs = parseMigrationVersion(migration.version)
                          const label = versionDayjs
                            ? versionDayjs.format('DD MMM YYYY, HH:mm:ss')
                            : 'Unknown'
                          const insertedAt = versionDayjs ? versionDayjs.toISOString() : undefined

                          return (
                            <TableRow key={migration.version}>
                              <TableCell>{migration.version}</TableCell>
                              <TableCell
                                className={cn(
                                  (migration?.name ?? '').length === 0 && '!text-foreground-lighter'
                                )}
                              >
                                {migration?.name ?? 'Name not available'}
                              </TableCell>
                              <TableCell>
                                <Tooltip>
                                  <TooltipTrigger>
                                    {!!insertedAt ? (
                                      <TimestampInfo
                                        className="text-sm"
                                        label={label}
                                        utcTimestamp={insertedAt}
                                      />
                                    ) : (
                                      <p className="text-foreground-lighter">Unknown</p>
                                    )}
                                  </TooltipTrigger>
                                  {!insertedAt && (
                                    <TooltipContent side="right" className="w-64 text-center">
                                      This migration was not generated via the{' '}
                                      <InlineLink
                                        href={`${DOCS_URL}/guides/deployment/database-migrations`}
                                      >
                                        Supabase CLI
                                      </InlineLink>{' '}
                                      and hence we're unable to parse when this migration was
                                      inserted at.
                                    </TooltipContent>
                                  )}
                                </Tooltip>
                              </TableCell>
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
              </div>
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
