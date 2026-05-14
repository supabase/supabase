import { SupportCategories } from '@supabase/shared-types/out/constants'
import JSZip from 'jszip'
import { Archive, Download, Search } from 'lucide-react'
import { useRef, useState } from 'react'
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
import { SupportLink } from '@/components/interfaces/Support/SupportLink'
import { DatePicker } from '@/components/ui/DatePicker'
import CodeEditor from '@/components/ui/CodeEditor/CodeEditor'
import { InlineLink } from '@/components/ui/InlineLink'
import { DatabaseMigration, useMigrationsQuery } from '@/data/database/migrations-query'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'
import { DOCS_URL } from '@/lib/constants'
import {
  downloadTextFile,
  filterMigrationsByDateRange,
  formatMigrationVersionLabel,
  getMigrationFilename,
  getMigrationSqlContent,
  parseMigrationVersion,
} from '@/lib/migration-utils'
import { SHORTCUT_IDS } from '@/state/shortcuts/registry'
import { useShortcut } from '@/state/shortcuts/useShortcut'

const Migrations = () => {
  const [search, setSearch] = useState('')
  const [selectedMigration, setSelectedMigration] = useState<DatabaseMigration>()
  const [dateFrom, setDateFrom] = useState<string | null>(null)
  const [dateTo, setDateTo] = useState<string | null>(null)
  const [isExporting, setIsExporting] = useState(false)
  const searchInputRef = useRef<HTMLInputElement>(null)

  useShortcut(
    SHORTCUT_IDS.LIST_PAGE_FOCUS_SEARCH,
    () => {
      searchInputRef.current?.focus()
      searchInputRef.current?.select()
    },
    { label: 'Search migrations' }
  )

  useShortcut(SHORTCUT_IDS.LIST_PAGE_RESET_FILTERS, () => setSearch(''))

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

  // Original search filter — untouched
  const searchFiltered =
    search.length === 0
      ? data
      : (data.filter(
          (migration) => migration.version.includes(search) || migration.name?.includes(search)
        ) ?? [])

  // Additional date range filter on top of search
  const migrations = filterMigrationsByDateRange(searchFiltered, dateFrom, dateTo)

  const hasDateFilter = dateFrom !== null || dateTo !== null

  async function handleDownloadZip() {
    if (migrations.length === 0) return
    setIsExporting(true)
    try {
      const zip = new JSZip()
      migrations.forEach((migration, index) => {
        zip.file(
          getMigrationFilename(index, migrations.length, migration),
          getMigrationSqlContent(migration)
        )
      })
      const blob = await zip.generateAsync({ type: 'blob' })
      const url = URL.createObjectURL(blob)
      const anchor = document.createElement('a')
      anchor.href = url
      anchor.download = 'migrations.zip'
      anchor.click()
      URL.revokeObjectURL(url)
    } finally {
      setIsExporting(false)
    }
  }

  function handleDownloadSql() {
    if (migrations.length === 0) return
    const parts = migrations.map((migration, index) => {
      const filename = getMigrationFilename(index, migrations.length, migration)
      return `-- ============================================================\n-- File: ${filename}\n-- ============================================================\n${getMigrationSqlContent(migration)}`
    })
    downloadTextFile('migrations.sql', parts.join('\n'))
  }

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
                <p className="mb-4">Error: {error?.message ?? 'Unknown'}</p>
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
                {/* Toolbar: search (original) + date filter + export buttons (new) */}
                <div className="flex flex-wrap items-center gap-2">
                  <Input
                    ref={searchInputRef}
                    size="tiny"
                    placeholder="Search for a migration"
                    value={search}
                    className="w-full lg:w-52"
                    onChange={(e: any) => setSearch(e.target.value)}
                    icon={<Search />}
                  />

                  {/* Date filter — new */}
                  <DatePicker
                    hideTime={false}
                    selectsRange
                    hideClear={false}
                    from={dateFrom ?? undefined}
                    to={dateTo ?? undefined}
                    triggerButtonSize="tiny"
                    triggerButtonType={hasDateFilter ? 'primary' : 'default'}
                    maxDate={new Date()}
                    onChange={({ from, to }) => {
                      setDateFrom(from ?? null)
                      setDateTo(to ?? null)
                    }}
                  >
                    {hasDateFilter ? 'Date filter active' : 'Filter by date'}
                  </DatePicker>
                  {hasDateFilter && (
                    <Button
                      type="text"
                      size="tiny"
                      onClick={() => { setDateFrom(null); setDateTo(null) }}
                    >
                      Clear
                    </Button>
                  )}

                  {/* Export buttons — new */}
                  {migrations.length > 0 && (
                    <div className="flex items-center gap-2 ml-auto">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            type="default"
                            size="tiny"
                            icon={<Download size={14} />}
                            onClick={handleDownloadSql}
                          >
                            Download SQL
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="bottom">
                          Download {migrations.length} migration{migrations.length !== 1 ? 's' : ''} as a single SQL file
                        </TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            type="default"
                            size="tiny"
                            icon={<Archive size={14} />}
                            loading={isExporting}
                            onClick={handleDownloadZip}
                          >
                            Download ZIP
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="bottom">
                          Download {migrations.length} migration{migrations.length !== 1 ? 's' : ''} as numbered SQL files in a ZIP
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  )}
                </div>

                {/* Table — original, untouched except per-row download button added */}
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
                        migrations.map((migration, index) => {
                          const versionDayjs = parseMigrationVersion(migration.version)
                          const label = formatMigrationVersionLabel(migration.version)
                          const insertedAt = versionDayjs ? versionDayjs.toISOString() : undefined

                          return (
                            <TableRow key={migration.version}>
                              <TableCell>{migration.version}</TableCell>
                              <TableCell
                                className={cn(
                                  (migration?.name ?? '').length === 0 && 'text-foreground-lighter!'
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
                                <div className="flex items-center justify-end gap-2">
                                  {/* Per-row download — new */}
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        type="text"
                                        size="tiny"
                                        icon={<Download size={14} />}
                                        onClick={() =>
                                          downloadTextFile(
                                            getMigrationFilename(index, migrations.length, migration),
                                            getMigrationSqlContent(migration)
                                          )
                                        }
                                      />
                                    </TooltipTrigger>
                                    <TooltipContent side="left">
                                      Download as SQL
                                    </TooltipContent>
                                  </Tooltip>

                                  {/* Original button — untouched */}
                                  <Button
                                    type="default"
                                    onClick={() => setSelectedMigration(migration)}
                                  >
                                    View migration SQL
                                  </Button>
                                </div>
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

      {/* Side panel — original, completely untouched */}
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
              defaultValue={
                selectedMigration?.statements?.join(';\n') +
                (selectedMigration?.statements?.length ? ';' : '')
              }
            />
          </div>
        </div>
      </SidePanel>
    </>
  )
}

export default Migrations
