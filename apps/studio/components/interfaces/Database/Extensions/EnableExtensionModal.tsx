import { toast } from 'sonner'
import {
  Button,
  Card,
  CardContent,
  cn,
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
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

import { DocsButton } from '@/components/ui/DocsButton'
import { InlineLinkClassName } from '@/components/ui/InlineLink'
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
      <DialogContent size="small" aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle>Confirm to enable {extension.name}</DialogTitle>
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
            The following database extension will be enabled
          </p>

          <Card>
            <CardContent className="divide-y text-sm p-0">
              <div className="flex items-center justify-between px-4 py-2">
                <p className="text-foreground-lighter">Extension</p>
                <p className="text-foreground">{extension.name}</p>
              </div>
              <div className="flex items-center justify-between px-4 py-2">
                <p className="text-foreground-lighter">Schema</p>
                <p className="text-foreground">{defaultSchema ?? 'extensions'}</p>
              </div>
            </CardContent>
          </Card>

          <Collapsible>
            <CollapsibleTrigger
              className={cn(
                InlineLinkClassName,
                'text-xs text-foreground-lighter data-open:text-foreground-light'
              )}
            >
              Need to install this in a different schema?
            </CollapsibleTrigger>
            <CollapsibleContent className="[overflow-y:clip] data-closed:animate-collapsible-up data-open:animate-collapsible-down">
              <div className="my-2 text-xs text-foreground-light flex flex-col gap-y-1">
                <p>
                  Installing in the extensions schema is highly recommended since some extensions
                  are hard to move after installation.
                </p>
                <p>To use a different schema, run this in the SQL Editor:</p>
              </div>
              <CodeBlock
                language="pgsql"
                hideLineNumbers
                wrapperClassName={cn('[&_pre]:px-3 [&_pre]:py-3')}
                className="[&_code]:text-xs"
                value={`create extension schema target_schema if not exists ${extension.name}`}
              />
            </CollapsibleContent>
          </Collapsible>
        </DialogSection>

        <DialogFooter>
          <Button disabled={isEnabling} onClick={() => onCancel()}>
            Cancel
          </Button>
          <Button variant="primary" loading={isEnabling} onClick={() => onConfirmEnable()}>
            Enable extension
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
