import { useState } from 'react'

import { useParams } from 'common'
import { Filter, Sort, SupaTable } from 'components/grid/types'
import { getConnectionStrings } from 'components/interfaces/Connect/DatabaseSettings.utils'
import { useReadReplicasQuery } from 'data/read-replicas/replicas-query'
import { getAllTableRowsSql } from 'data/table-rows/table-rows-query'
import { pluckObjectFields } from 'lib/helpers'
import { RoleImpersonationState, wrapWithRoleImpersonation } from 'lib/role-impersonation'
import { useRoleImpersonationStateSnapshot } from 'state/role-impersonation-state'
import {
  Button,
  cn,
  CodeBlock,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogSection,
  DialogSectionSeparator,
  DialogTitle,
  Tabs_Shadcn_,
  TabsContent_Shadcn_,
  TabsList_Shadcn_,
  TabsTrigger_Shadcn_,
} from 'ui'
import { Admonition } from 'ui-patterns'

interface ExportDialogProps {
  table?: SupaTable
  filters?: Filter[]
  sorts?: Sort[]
  ignoreRoleImpersonation?: boolean

  open: boolean
  onOpenChange: (open: boolean) => void
}

export const ExportDialog = ({
  table,
  filters = [],
  sorts = [],
  ignoreRoleImpersonation = false,
  open,
  onOpenChange,
}: ExportDialogProps) => {
  const { ref: projectRef } = useParams()
  const roleImpersonationState = useRoleImpersonationStateSnapshot()

  const [selectedTab, setSelectedTab] = useState<string>('csv')

  const { data: databases } = useReadReplicasQuery({ projectRef })
  const primaryDatabase = (databases ?? []).find((db) => db.identifier === projectRef)
  const DB_FIELDS = ['db_host', 'db_name', 'db_port', 'db_user', 'inserted_at']
  const emptyState = { db_user: '', db_host: '', db_port: '', db_name: '' }

  const connectionInfo = pluckObjectFields(primaryDatabase || emptyState, DB_FIELDS)
  const { db_host, db_port, db_user, db_name } = connectionInfo

  const connectionStrings = getConnectionStrings({
    connectionInfo,
    metadata: { projectRef },
    // [Joshen] We don't need any pooler details for this context, we only want direct
    poolingInfo: { connectionString: '', db_host: '', db_name: '', db_port: 0, db_user: '' },
  })

  const outputName = `${table?.name}_rows`
  const queryChains = !table ? undefined : getAllTableRowsSql({ table, sorts, filters })
  const query = !!queryChains
    ? ignoreRoleImpersonation
      ? queryChains.toSql()
      : wrapWithRoleImpersonation(
          queryChains.toSql(),
          roleImpersonationState as RoleImpersonationState
        )
    : ''

  const csvExportCommand = `
${connectionStrings.direct.psql} -c "COPY (${query}) TO STDOUT WITH CSV HEADER DELIMITER ',';" > ${outputName}.csv`.trim()

  const sqlExportCommand = `
pg_dump -h ${db_host} -p ${db_port} -d ${db_name} -U ${db_user} --table="${table?.schema}.${table?.name}" --data-only --column-inserts > ${outputName}.sql
  `.trim()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Export table data via CLI</DialogTitle>
        </DialogHeader>

        <DialogSectionSeparator />

        <DialogSection className="flex flex-col gap-y-4">
          <p className="text-sm">
            We highly recommend using <code>{selectedTab === 'csv' ? 'psql' : 'pg_dump'}</code> to
            export your table data, in particular if your table is relatively large. This can be
            done via the following command that you can run in your terminal:
          </p>

          <Tabs_Shadcn_ value={selectedTab} onValueChange={setSelectedTab}>
            <TabsList_Shadcn_ className="gap-x-3">
              <TabsTrigger_Shadcn_ value="csv">As CSV</TabsTrigger_Shadcn_>
              <TabsTrigger_Shadcn_ value="sql">As SQL</TabsTrigger_Shadcn_>
            </TabsList_Shadcn_>
            <TabsContent_Shadcn_ value="csv">
              <CodeBlock
                hideLineNumbers
                wrapperClassName={cn('[&_pre]:px-4 [&_pre]:py-3')}
                language="bash"
                value={csvExportCommand}
                className="[&_code]:text-[12px] [&_code]:text-foreground"
              />
            </TabsContent_Shadcn_>
            <TabsContent_Shadcn_ value="sql">
              <CodeBlock
                hideLineNumbers
                wrapperClassName={cn('[&_pre]:px-4 [&_pre]:py-3')}
                language="bash"
                value={sqlExportCommand}
                className="[&_code]:text-[12px] [&_code]:text-foreground"
              />
              <Admonition
                type="note"
                className="mt-2"
                title="Filters are not supported when exporting as SQL via pg_dump"
                description="If you'd like to export as SQL, we recommend creating a view first then exporting the data from there via pg_dump instead"
              />
            </TabsContent_Shadcn_>
          </Tabs_Shadcn_>

          <p className="text-sm">
            You will be prompted for your database password, and the output file{' '}
            <code>
              {outputName}.{selectedTab}
            </code>{' '}
            will be saved in the current directory that your terminal is in.
          </p>

          {selectedTab === 'sql' && (
            <p className="text-sm text-foreground-light">
              Note: <code>pg_dump</code> needs to match your project's Postgres version. If you run
              into a server version mismatch error, you will need to update <code>pg_dump</code>{' '}
              before running the command.
            </p>
          )}
        </DialogSection>
        <DialogFooter>
          <Button type="default" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
