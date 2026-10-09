import { ident, safeSql } from '@supabase/pg-meta'
import { toast } from 'sonner'
import {
  Button,
  Card,
  CardContent,
  cn,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogSection,
  DialogSectionSeparator,
  DialogTitle,
} from 'ui'
import { Admonition } from 'ui-patterns/Admonition'
import { CodeBlock } from 'ui-patterns/CodeBlock'
import {
  DialogDisclosure,
  DialogDisclosureContent,
  DialogDisclosureTrigger,
} from 'ui-patterns/DialogDisclosure'

import { DocsButton } from '@/components/ui/DocsButton'
import { useDatabaseExtensionEnableMutation } from '@/data/database-extensions/database-extension-enable-mutation'
import { type DatabaseExtension } from '@/data/database-extensions/database-extensions-query'
import { useIsOrioleDb, useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'
import { DOCS_URL } from '@/lib/constants'

const orioleExtCallOuts = ['vector', 'postgis']

interface EnableExtensionModalProps {
  visible: boolean
  extension: DatabaseExtension
  onCancel: () => void
}

export const EnableExtensionModal = ({
  visible,
  extension,
  onCancel,
}: EnableExtensionModalProps) => {
  const isOrioleDb = useIsOrioleDb()

  const { data: project } = useSelectedProjectQuery()

  // [Joshen] Hard-coding pg_cron here as this is enforced on our end (Not via pg_available_extension_versions)
  const defaultSchema =
    extension.name === 'pg_cron' ? 'pg_catalog' : extension.default_version_schema
  const hasFixedSchema = defaultSchema != null

  const { mutate: enableExtension, isPending: isEnabling } = useDatabaseExtensionEnableMutation({
    onSuccess: () => {
      toast.success(`Extension "${extension.name}" is now enabled`)
      onCancel()
    },
    onError: (error) => {
      toast.error(`Failed to enable ${extension.name}: ${error.message}`)
    },
  })

  const onConfirmEnable = async () => {
    if (project === undefined) return console.error('Project is required')

    enableExtension({
      projectRef: project.ref,
      connectionString: project?.connectionString,
      schema: defaultSchema ?? 'extensions',
      name: extension.name,
      version: extension.default_version,
      cascade: true,
    })
  }

  return (
    <Dialog
      open={visible}
      onOpenChange={(open: boolean) => {
        if (!open) onCancel()
      }}
    >
      <DialogContent size="small" className="min-w-0 overflow-hidden" aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle>Enable {extension.name}</DialogTitle>
        </DialogHeader>

        <DialogSectionSeparator />

        {isOrioleDb && orioleExtCallOuts.includes(extension.name) && (
          <Admonition
            type="default"
            title="Extension is limited by OrioleDB"
            className="border-x-0 border-t-0 rounded-none"
          >
            <span className="block">
              {extension.name} cannot be accelerated by indexes on tables that are using the
              OrioleDB access method
            </span>
            <DocsButton abbrev={false} className="mt-2" href={`${DOCS_URL}`} />
          </Admonition>
        )}

        <DialogSection className="flex flex-col gap-y-4">
          <p className="text-sm text-foreground-light">
            {hasFixedSchema
              ? 'This extension must be installed in the schema below.'
              : 'This extension will be installed in the schema below.'}
          </p>

          <Card>
            <CardContent className="divide-y text-sm p-0">
              <div className="flex items-center justify-between px-3 py-2.5">
                <p className="text-foreground-lighter">Extension</p>
                <code className="text-code-inline">{extension.name}</code>
              </div>
              <div className="flex items-center justify-between px-3 py-2.5">
                <p className="text-foreground-lighter">Schema</p>
                <code data-testid="enable-extension-schema" className="text-code-inline">
                  {defaultSchema ?? 'extensions'}
                </code>
              </div>
            </CardContent>
          </Card>
        </DialogSection>

        {!hasFixedSchema && (
          <>
            <DialogSectionSeparator />
            <DialogDisclosure>
              <DialogDisclosureTrigger className="py-4 px-4 md:px-5">
                <span>Install in a different schema</span>
              </DialogDisclosureTrigger>
              <DialogDisclosureContent>
                <DialogSection className="pt-1 min-w-0 flex flex-col gap-y-3">
                  <div className="text-sm text-foreground-light flex flex-col gap-y-3">
                    <p>
                      Installing in <code className="text-code-inline">public</code> can expose
                      extension tables through the Data API. You may need support to enable RLS on
                      those tables or move the extension.
                    </p>
                    <p>
                      For another schema, cancel and use the SQL Editor. Replace{' '}
                      <code className="text-code-inline">target_schema</code> with an existing
                      schema name.
                    </p>
                  </div>
                  <CodeBlock
                    language="pgsql"
                    hideLineNumbers
                    wrapLongLines
                    wrapperClassName={cn('min-w-0 max-w-full [&_pre]:px-3 [&_pre]:py-3')}
                    className="[&_code]:text-xs"
                    value={safeSql`create extension if not exists ${ident(extension.name)} schema target_schema;`}
                  />
                </DialogSection>
              </DialogDisclosureContent>
            </DialogDisclosure>
          </>
        )}

        <DialogFooter>
          <Button disabled={isEnabling} onClick={() => onCancel()}>
            Cancel
          </Button>
          <Button variant="primary" loading={isEnabling} onClick={() => onConfirmEnable()}>
            Enable
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
