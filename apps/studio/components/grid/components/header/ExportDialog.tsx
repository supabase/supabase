import { useParams } from 'common'
import { getConnectionStrings } from 'components/interfaces/Connect/DatabaseSettings.utils'
import { useReadReplicasQuery } from 'data/read-replicas/replicas-query'
import { pluckObjectFields } from 'lib/helpers'
import { useTableEditorTableStateSnapshot } from 'state/table-editor-table'
import {
  cn,
  CodeBlock,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogSection,
  DialogSectionSeparator,
  DialogTitle,
} from 'ui'

interface ExportDialogProps {
  format?: 'csv' | 'sql'
  onOpenChange: (open: boolean) => void
}

export const ExportDialog = ({ format, onOpenChange }: ExportDialogProps) => {
  const { ref: projectRef } = useParams()
  const snap = useTableEditorTableStateSnapshot()
  console.log(snap.table)

  const { data: databases } = useReadReplicasQuery({ projectRef })
  const primaryDatabase = (databases ?? []).find((db) => db.identifier === projectRef)
  const DB_FIELDS = ['db_host', 'db_name', 'db_port', 'db_user', 'inserted_at']
  const emptyState = { db_user: '', db_host: '', db_port: '', db_name: '' }
  const connectionInfo = pluckObjectFields(primaryDatabase || emptyState, DB_FIELDS)

  const connectionStrings = getConnectionStrings({
    connectionInfo,
    metadata: { projectRef },
    // [Joshen] We don't need any pooler details for this context, we only want direct
    poolingInfo: { connectionString: '', db_host: '', db_name: '', db_port: 0, db_user: '' },
  })

  const csvExportCommand = `
${connectionStrings.direct.psql} -c "COPY (SELECT * FROM "${snap.table.schema}"."${snap.table.name}") TO STDOUT WITH CSV HEADER DELIMITER ',';" > test.csv
`.trim()

  return (
    <Dialog open={!!format} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            Export table data to {format?.toUpperCase()} via <code>psql</code>
          </DialogTitle>
          <DialogDescription>World</DialogDescription>
        </DialogHeader>

        <DialogSectionSeparator />

        <DialogSection className="flex flex-col gap-y-4">
          <p className="text-sm">
            We highly recommend using <code>psql</code> to export your table data, in particular if
            your table is relatively large. This can be done via the following command that you can
            run in your terminal:
          </p>

          <CodeBlock
            wrapperClassName={cn('[&_pre]:px-4 [&_pre]:py-3')}
            language="bash"
            value={format === 'csv' ? csvExportCommand : 'hello'}
            className="[&_code]:text-[12px] [&_code]:text-foreground"
            hideLineNumbers
            onCopyCallback={() => {}}
          />
        </DialogSection>
      </DialogContent>
    </Dialog>
  )
}
