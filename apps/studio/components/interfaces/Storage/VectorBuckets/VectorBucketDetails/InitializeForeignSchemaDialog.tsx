import { zodResolver } from '@hookform/resolvers/zod'
import { useQueryClient } from '@tanstack/react-query'
import { useParams } from 'common'
import { formatWrapperTables } from 'components/interfaces/Integrations/Wrappers/Wrappers.utils'
import { DocsButton } from 'components/ui/DocsButton'
import { useSchemaCreateMutation } from 'data/database/schema-create-mutation'
import { useSchemasQuery } from 'data/database/schemas-query'
import { useFDWImportForeignSchemaMutation } from 'data/fdw/fdw-import-foreign-schema-mutation'
import { useFDWUpdateMutation } from 'data/fdw/fdw-update-mutation'
import { fdwKeys } from 'data/fdw/keys'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { DOCS_URL } from 'lib/constants'
import { parseAsBoolean, useQueryState } from 'nuqs'
import { useState } from 'react'
import { SubmitHandler, useForm } from 'react-hook-form'
import { toast } from 'sonner'
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
  FormField_Shadcn_,
  Form_Shadcn_,
  Input_Shadcn_,
} from 'ui'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import z from 'zod'

import { getDecryptedParameters } from '../../Storage.utils'
import { useS3VectorsWrapperExtension } from '../useS3VectorsWrapper'
import { useS3VectorsWrapperInstance } from '../useS3VectorsWrapperInstance'
import { isGreaterThanOrEqual } from '@/lib/semver'

// Create foreign tables for vector bucket
export const InitializeForeignSchemaDialog = () => {
  const queryClient = useQueryClient()
  const { ref: projectRef, bucketId } = useParams()
  const { data: project } = useSelectedProjectQuery()
  const { data: schemas } = useSchemasQuery({ projectRef })

  const [isOpen, setIsOpen] = useQueryState('initForeignSchema', parseAsBoolean.withDefault(false))
  const [isCreating, setIsCreating] = useState(false)

  const { data: wrapperInstance, meta: wrapperMeta } = useS3VectorsWrapperInstance({ bucketId })
  const { extension: wrappersExtension } = useS3VectorsWrapperExtension()
  const updatedImportForeignSchemaSyntax = !!wrappersExtension?.installed_version
    ? isGreaterThanOrEqual(wrappersExtension.installed_version, '0.5.7')
    : false

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
  const { mutateAsync: updateFDW } = useFDWUpdateMutation()

  const onSubmit: SubmitHandler<z.infer<typeof FormSchema>> = async (values) => {
    if (!projectRef) return console.error('Project ref is required')
    if (!bucketId) return console.error('Bucket ID is required')
    if (!wrapperInstance) return console.error('Wrapper instance is required')

    try {
      setIsCreating(true)

      await createSchema({
        projectRef,
        connectionString: project?.connectionString,
        name: values.schema,
      })

      const serverOptions = await getDecryptedParameters({
        ref: project?.ref,
        connectionString: project?.connectionString ?? undefined,
        wrapper: wrapperInstance,
        wrapperMeta,
      })

      const wrapperTables = formatWrapperTables(wrapperInstance, wrapperMeta)

      await updateFDW({
        projectRef: project?.ref,
        connectionString: project?.connectionString,
        wrapper: wrapperInstance,
        wrapperMeta: wrapperMeta,
        formState: {
          wrapper_name: wrapperInstance.name,
          server_name: wrapperInstance.server_name,
          supabase_target_schema: values.schema,
          ...serverOptions,
        },
        tables: wrapperTables,
        skipInvalidation: true,
      })

      await importForeignSchema({
        projectRef,
        connectionString: project?.connectionString,
        serverName: wrapperInstance.server_name,
        sourceSchema: updatedImportForeignSchemaSyntax ? bucketId : values.schema,
        targetSchema: values.schema,
        schemaOptions: updatedImportForeignSchemaSyntax ? undefined : [`bucket_name '${bucketId}'`],
      })

      toast.success(
        `Successfully created "${values.schema}" schema! Data from tables in this bucket can now be queried from there.`
      )
      setIsOpen(false)

      await queryClient.invalidateQueries({
        queryKey: fdwKeys.list(projectRef),
        refetchType: 'all',
      })
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
              <DialogTitle>Query this vector bucket from Postgres</DialogTitle>
            </DialogHeader>
            <DialogSectionSeparator />
            <DialogSection className="flex flex-col gap-y-4">
              <p className="text-sm">
                Data from vector tables can be queried from Postgres with the S3 Vectors Wrapper.
                Create a Postgres schema to expose tables from the "{bucketId}" bucket as foreign
                tables.
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
              <DocsButton href={`${DOCS_URL}/guides/storage/vector/querying-vectors`} />
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
