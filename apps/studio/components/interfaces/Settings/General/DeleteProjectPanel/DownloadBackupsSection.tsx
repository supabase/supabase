import { useParams } from 'common'
import { getConnectionStrings } from 'components/interfaces/Connect/DatabaseSettings.utils'
import { usePoolerConfiguration } from 'components/interfaces/Connect/usePoolerConfiguration'
import { InlineLink } from 'components/ui/InlineLink'
import { useReadReplicasQuery } from 'data/read-replicas/replicas-query'
import {
  Accordion_Shadcn_,
  AccordionContent_Shadcn_,
  AccordionItem_Shadcn_,
  AccordionTrigger_Shadcn_,
  CodeBlock,
} from 'ui'

export const DownloadBackupsSection = () => {
  const { ref: projectRef } = useParams()

  const { data: databases } = useReadReplicasQuery({ projectRef })
  const primaryDatabase = (databases ?? []).find((db) => db.identifier === projectRef)

  const { sharedPoolerConfiguration } = usePoolerConfiguration({ projectRef })
  const supavisorConnectionStrings = getConnectionStrings({
    connectionInfo: {
      db_host: primaryDatabase?.db_host ?? '',
      db_name: primaryDatabase?.db_name ?? '',
      db_port: primaryDatabase?.db_port ?? 0,
      db_user: primaryDatabase?.db_user ?? '',
    },
    poolingInfo: {
      connectionString: sharedPoolerConfiguration?.connection_string ?? '',
      db_host: sharedPoolerConfiguration?.db_host ?? '',
      db_name: sharedPoolerConfiguration?.db_name ?? '',
      db_port: sharedPoolerConfiguration?.db_port ?? 0,
      db_user: sharedPoolerConfiguration?.db_user ?? '',
    },
    metadata: { projectRef },
  })
  const sessionPoolerConnectionString = supavisorConnectionStrings['pooler']['uri'].replace(
    '6543',
    '5432'
  )

  return (
    <Accordion_Shadcn_ collapsible type="single">
      <AccordionItem_Shadcn_ value="backups" className="border-b-0 px-5">
        <AccordionTrigger_Shadcn_ className="pb-2">
          <p className="text-sm">Download a backup of your database before deleting</p>
        </AccordionTrigger_Shadcn_>
        <AccordionContent_Shadcn_ className="[&>div]:flex [&>div]:flex-col [&>div]:gap-y-3">
          <p className="text-foreground-light text-sm">
            We recommend keeping a copy of your database backup prior to deleting. Backups can be
            retrieved from either the{' '}
            <InlineLink href={`/project/${projectRef}/database/backups/scheduled`}>
              database section
            </InlineLink>
            , or created via the{' '}
            <InlineLink href="https://supabase.com/docs/guides/platform/migrating-within-supabase/backup-restore">
              Supabase CLI
            </InlineLink>{' '}
            with these commands:
          </p>
          <div>
            <CodeBlock
              focusable={false}
              hideLineNumbers
              language="bash"
              value={`
supabase db dump --db-url ${sessionPoolerConnectionString} -f roles.sql --role-only &&
supabase db dump --db-url ${sessionPoolerConnectionString} -f schema.sql &&
supabase db dump --db-url ${sessionPoolerConnectionString} -f data.sql --use-copy --data-only
`.trim()}
              className="language-bash"
            />
          </div>
        </AccordionContent_Shadcn_>
      </AccordionItem_Shadcn_>
    </Accordion_Shadcn_>
  )
}
