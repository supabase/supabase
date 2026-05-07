import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { SubmitHandler, useForm } from 'react-hook-form'
import { toast } from 'sonner'
import z from 'zod'

import { useParams } from 'common'
import { DocsButton } from 'components/ui/DocsButton'
import { useSchemaCreateMutation } from 'data/database/schema-create-mutation'
import { useSchemasQuery } from 'data/database/schemas-query'
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
  Input_Shadcn_,
} from 'ui'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import { getAnalyticsBucketFDWServerName } from './AnalyticsBucketDetails.utils'

// Create foreign tables for namespace tables
export const InitializeForeignSchemaDialog = ({ namespace }: { namespace: string }) => {
  const { ref: projectRef, bucketId } = useParams()
  const { data: project } = useSelectedProjectQuery()
  const { data: schemas } = useSchemasQuery({ projectRef })

  const [isOpen, setIsOpen] = useState(false)
  const [isCreating, setIsCreating] = useState(false)

  const serverName = getAnalyticsBucketFDWServerName(bucketId ?? '')

  const FormSchema = z.object({
    schema: z
      .string()
      .trim()
      .min(1, 'Schema name is required')
      .refine((val) => !schemas?.find((s) => s.name === val), {
        message: 'This schema already exists. Please specify a unique schema name.',
      }),
  })
  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: { schema: '' },
  })

  const { mutateAsync: createSchema } = useSchemaCreateMutation()
  const { mutateAsync: importForeignSchema } = useFDWImportForeignSchemaMutation()

  const onSubmit: SubmitHandler<z.infer<typeof FormSchema>> = async (values) => {
    if (!projectRef) return console.error('Project ref is required')

    try {
      setIsCreating(true)

      await createSchema({
        projectRef,
        connectionString: project?.connectionString,
        name: values.schema,
      })

      await importForeignSchema({
        projectRef,
        connectionString: project?.connectionString,
        serverName: serverName,
        sourceSchema: namespace,
        targetSchema: values.schema,
      })

      toast.success(
        `Successfully created "${values.schema}" schema! Data from tables in the "${namespace}" namespace can now be queried from there.`
      )
      setIsOpen(false)
    } catch (error: any) {
      toast.error(`Failed to expose tables: ${error.message}`)
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button type="default">Query from Postgres</Button>
      </DialogTrigger>
      <DialogContent size="medium" aria-describedby={undefined}>
        <Form_Shadcn_ {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <DialogHeader>
              <DialogTitle>Query this namespace from Postgres</DialogTitle>
            </DialogHeader>
            <DialogSectionSeparator />
            <DialogSection className="flex flex-col gap-y-4">
              <p className="text-sm">
                Iceberg data can be queried from Postgres with the Iceberg Foreign Data Wrapper.
                Create a Postgres schema to expose tables from the "{namespace}" namespace as
                foreign tables.
              </p>
              <FormField_Shadcn_
                control={form.control}
                name="schema"
                render={({ field }) => (
                  <FormItemLayout layout="vertical" label="Schema name">
                    <Input_Shadcn_ {...field} placeholder="Provide a name for your schema" />
                  </FormItemLayout>
                )}
              />
            </DialogSection>
            <DialogFooter className="!justify-between">
              <DocsButton href={`${DOCS_URL}/guides/storage/analytics/query-with-postgres`} />
              <div className="flex items-center gap-x-2">
                <Button type="default" disabled={isCreating} onClick={() => setIsOpen(false)}>
                  Cancel
                </Button>
                <Button htmlType="submit" type="primary" loading={isCreating}>
                  Create schema
                </Button>
              </div>
            </DialogFooter>
          </form>
        </Form_Shadcn_>
      </DialogContent>
    </Dialog>
  )
}
