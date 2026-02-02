import { useParams } from 'common'
import { DocsButton } from 'components/ui/DocsButton'
import { FDWTable } from 'data/fdw/fdws-query'
import { SqlEditor } from 'icons'
import { DOCS_URL } from 'lib/constants'
import Link from 'next/link'
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
  DialogTrigger,
} from 'ui'

interface InsertDataDialogProps {
  table: string
  fdwTable: FDWTable
}

export const InsertDataDialog = ({ table, fdwTable }: InsertDataDialogProps) => {
  const { ref } = useParams()

  const sql = /* SQL */ `
insert into ${fdwTable.schema}.${fdwTable.name} (
  -- specify columns
) 
values (
  -- specify values for each column
);
`.trim()

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button type="default">Insert data</Button>
      </DialogTrigger>
      <DialogContent aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle>
            Insert data into <code className="text-code-inline">{table}</code>
          </DialogTitle>
        </DialogHeader>

        <DialogSectionSeparator />

        <DialogSection className="flex flex-col gap-y-2">
          <p className="text-sm">
            The Iceberg Foreign Data Wrapper (FDW) supports inserting data into Iceberg tables using
            standard SQL <code className="text-code-inline">INSERT</code> statements.
          </p>
          <p className="text-sm">
            Use the following SQL snippet to insert data into your iceberg table:
          </p>
        </DialogSection>

        <DialogSectionSeparator />

        <DialogSection className="!p-0">
          <CodeBlock
            hideLineNumbers
            wrapperClassName={cn('[&_pre]:px-4 [&_pre]:py-3 [&>pre]:rounded-none [&>pre]:border-0')}
            className="[&_code]:text-foreground"
            language="sql"
            value={sql}
          />
        </DialogSection>

        <DialogFooter>
          <DocsButton
            href={`${DOCS_URL}/guides/database/extensions/wrappers/iceberg#data-insertion`}
          />
          <Button asChild type="default" icon={<SqlEditor />}>
            <Link href={`/project/${ref}/sql/new?content=${encodeURIComponent(sql)}`}>
              Open in SQL Editor
            </Link>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
