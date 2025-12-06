import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { SubmitHandler, useForm } from 'react-hook-form'
import { toast } from 'sonner'
import z from 'zod'

import { useParams } from 'common'
import { DocsButton } from 'components/ui/DocsButton'
import { InlineLinkClassName } from 'components/ui/InlineLink'
import { useFDWImportForeignSchemaMutation } from 'data/fdw/fdw-import-foreign-schema-mutation'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { DOCS_URL } from 'lib/constants'
import {
  Button,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogSection,
  DialogSectionSeparator,
  DialogTitle,
  DialogTrigger,
  Form_Shadcn_,
  FormField_Shadcn_,
  Select_Shadcn_,
  SelectContent_Shadcn_,
  SelectItem_Shadcn_,
  SelectTrigger_Shadcn_,
  SelectValue_Shadcn_,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from 'ui'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import { getAnalyticsBucketFDWServerName } from './AnalyticsBucketDetails.utils'
import { useAnalyticsBucketAssociatedEntities } from './useAnalyticsBucketAssociatedEntities'

export const UpdateForeignSchemaDialog = ({
  namespace,
  tables,
}: {
  namespace: string
  tables: string[]
}) => {
  const { ref: projectRef, bucketId } = useParams()
  const { data: project } = useSelectedProjectQuery()

  const [isOpen, setIsOpen] = useState(false)

  const { icebergWrapper } = useAnalyticsBucketAssociatedEntities({ bucketId })
  const connectedForeignTablesForNamespace = (icebergWrapper?.tables ?? []).filter((x) =>
    x.options[0].startsWith(`table=${namespace}.`)
  )
  const schemasAssociatedWithNamespace = [
    ...new Set(connectedForeignTablesForNamespace.map((x) => x.schema)),
  ]

  const serverName = getAnalyticsBucketFDWServerName(bucketId ?? '')

  const FormSchema = z.object({
    schema: z.string().trim().min(1, 'Schema name is required'),
  })
  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: { schema: schemasAssociatedWithNamespace[0] },
    values: { schema: schemasAssociatedWithNamespace[0] },
  })

  const { mutateAsync: importForeignSchema, isPending: isUpdating } =
    useFDWImportForeignSchemaMutation()

  const onSubmit: SubmitHandler<z.infer<typeof FormSchema>> = async (values) => {
    if (!projectRef) return console.error('Project ref is required')

    try {
      await importForeignSchema({
        projectRef,
        connectionString: project?.connectionString,
        serverName: serverName,
        sourceSchema: namespace,
        targetSchema: values.schema,
      })

      toast.success(`Successfully updated "${values.schema}" schema!`)
      setIsOpen(false)
    } catch (error: any) {
      toast.error(`Failed to update schema: ${error.message}`)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button type="default">Update schema tables</Button>
      </DialogTrigger>
      <DialogContent size="medium" aria-describedby={undefined}>
        <Form_Shadcn_ {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <DialogHeader>
              <DialogTitle>Update schema to expose foreign tables</DialogTitle>
            </DialogHeader>
            <DialogSectionSeparator />
            <DialogSection className="flex flex-col gap-y-4">
              <p className="text-sm">
                {tables.length > 1 ? (
                  <>
                    There are{' '}
                    <Tooltip>
                      <TooltipTrigger>
                        <span className={InlineLinkClassName}>{tables.length} tables</span>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-64 text-center" side="bottom">
                        {tables.join(', ')}
                      </TooltipContent>
                    </Tooltip>{' '}
                    that aren't included in the Iceberg Foreign Data Wrapper. Update the wrapper to
                    create foreign tables for all unexposed tables. This will let you query the
                    tables from Postgres.
                  </>
                ) : (
                  `The table "${tables[0]}" in the "${namespace}" namespace is not yet included in the Iceberg Foreign Data Wrapper. The schema can be updated to expose this table as a foreign table.`
                )}
              </p>

              {schemasAssociatedWithNamespace.length > 1 ? (
                <FormField_Shadcn_
                  control={form.control}
                  name="schema"
                  render={({ field }) => (
                    <FormItemLayout
                      layout="vertical"
                      label="Select which Postgres schema to update"
                    >
                      <Select_Shadcn_
                        value={field.value}
                        onValueChange={(val) => field.onChange(val)}
                      >
                        <SelectTrigger_Shadcn_>
                          <SelectValue_Shadcn_ />
                        </SelectTrigger_Shadcn_>
                        <SelectContent_Shadcn_>
                          {schemasAssociatedWithNamespace.map((x) => (
                            <SelectItem_Shadcn_ key={x} value={x}>
                              {x}
                            </SelectItem_Shadcn_>
                          ))}
                        </SelectContent_Shadcn_>
                      </Select_Shadcn_>
                    </FormItemLayout>
                  )}
                />
              ) : (
                <p className="text-sm">
                  Confirm to update foreign schema on the "{namespace}" namespace?
                </p>
              )}
            </DialogSection>
            <DialogFooter className="!justify-between">
              <DocsButton href={`${DOCS_URL}/guides/storage/analytics/query-with-postgres`} />
              <div className="flex items-center gap-x-2">
                <Button type="default" disabled={isUpdating} onClick={() => setIsOpen(false)}>
                  Cancel
                </Button>
                <Button htmlType="submit" type="primary" loading={isUpdating}>
                  Update schema
                </Button>
              </div>
            </DialogFooter>
          </form>
        </Form_Shadcn_>
      </DialogContent>
    </Dialog>
  )
}
