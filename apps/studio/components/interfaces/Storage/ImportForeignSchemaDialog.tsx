import { zodResolver } from '@hookform/resolvers/zod'
import { uniq } from 'lodash'
import { useEffect, useState } from 'react'
import { SubmitHandler, useForm } from 'react-hook-form'
import { toast } from 'sonner'
import z from 'zod'

import { useParams } from 'common'
import { useSchemaCreateMutation } from 'data/database/schema-create-mutation'
import { useSchemasQuery } from 'data/database/schemas-query'
import { useFDWImportForeignSchemaMutation } from 'data/fdw/fdw-import-foreign-schema-mutation'
import { useFDWUpdateMutation } from 'data/fdw/fdw-update-mutation'
import { getFDWs } from 'data/fdw/fdws-query'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { Button, Form_Shadcn_, FormField_Shadcn_, Input_Shadcn_, Modal, Separator } from 'ui'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import { formatWrapperTables } from '../Integrations/Wrappers/Wrappers.utils'
import { SchemaEditor } from '../TableGridEditor/SidePanelEditor/SchemaEditor'
import { getAnalyticsBucketFDWServerName } from './AnalyticsBuckets/AnalyticsBucketDetails/AnalyticsBucketDetails.utils'
import { useAnalyticsBucketAssociatedEntities } from './AnalyticsBuckets/AnalyticsBucketDetails/useAnalyticsBucketAssociatedEntities'
import { getDecryptedParameters } from './Storage.utils'

export interface ImportForeignSchemaDialogProps {
  namespace: string
  circumstance?: 'fresh' | 'clash'
  visible: boolean
  onClose: () => void
}

export const ImportForeignSchemaDialog = ({
  namespace,
  visible,
  onClose,
  circumstance = 'fresh',
}: ImportForeignSchemaDialogProps) => {
  const { ref, bucketId: bucketName } = useParams()
  const { data: project } = useSelectedProjectQuery()
  const [loading, setLoading] = useState(false)
  const [createSchemaSheetOpen, setCreateSchemaSheetOpen] = useState(false)

  const { data: schemas } = useSchemasQuery({ projectRef: project?.ref! })
  const { icebergWrapperMeta: wrapperMeta } = useAnalyticsBucketAssociatedEntities({
    projectRef: ref,
    bucketId: bucketName,
  })

  const { mutateAsync: createSchema } = useSchemaCreateMutation()
  const { mutateAsync: importForeignSchema } = useFDWImportForeignSchemaMutation({})
  const { mutateAsync: updateFDW } = useFDWUpdateMutation({
    onSuccess: () => {
      toast.success(`Successfully connected “${bucketName}” to the database.`)
      onClose()
    },
  })

  const FormSchema = z.object({
    bucketName: z.string().trim(),
    sourceNamespace: z.string().trim(),
    targetSchema: z
      .string()
      .trim()
      .min(1, 'Schema name is required')
      .refine(
        (val) => {
          return !schemas?.find((s) => s.name === val)
        },
        {
          message: 'This schema already exists. Please specify a unique schema name.',
        }
      ),
  })

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      bucketName,
      sourceNamespace: namespace,
      targetSchema: `fdw_analytics_${namespace}`,
    },
  })

  const onSubmit: SubmitHandler<z.infer<typeof FormSchema>> = async (values) => {
    const serverName = getAnalyticsBucketFDWServerName(values.bucketName)

    if (!ref) return console.error('Project ref is required')
    if (!wrapperMeta) return console.error('Wrapper meta is required')
    setLoading(true)

    try {
      await createSchema({
        projectRef: ref,
        connectionString: project?.connectionString,
        name: values.targetSchema,
      })

      await importForeignSchema({
        projectRef: ref,
        connectionString: project?.connectionString,
        serverName: serverName,
        sourceSchema: values.sourceNamespace,
        targetSchema: values.targetSchema,
      })

      const FDWs = await getFDWs({ projectRef: ref, connectionString: project?.connectionString })
      const wrapper = FDWs.find((fdw) => fdw.server_name === serverName)
      if (!wrapper) {
        throw new Error(`Foreign data wrapper with server name ${serverName} not found`)
      }

      const serverOptions = await getDecryptedParameters({
        ref: project?.ref,
        connectionString: project?.connectionString ?? undefined,
        wrapper,
        wrapperMeta,
      })

      const formValues: Record<string, string> = {
        wrapper_name: wrapper.name,
        server_name: wrapper.server_name,
        ...serverOptions,
      }

      const targetSchemas = (formValues['supabase_target_schema'] || '')
        .split(',')
        .map((s) => s.trim())

      const wrapperTables = formatWrapperTables(wrapper, wrapperMeta)

      await updateFDW({
        projectRef: project?.ref,
        connectionString: project?.connectionString,
        wrapper: wrapper,
        wrapperMeta: wrapperMeta,
        formState: {
          ...formValues,
          server_name: serverName,
          supabase_target_schema: uniq([...targetSchemas, values.targetSchema])
            .filter(Boolean)
            .join(','),
        },
        tables: wrapperTables,
      })
    } catch (error: any) {
      // error will be handled by the mutation onError callback
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (visible) {
      form.reset({
        bucketName,
        sourceNamespace: namespace,
        targetSchema: `fdw_analytics_${namespace}`,
      })
    }
  }, [visible, form, bucketName, namespace])

  return (
    <Modal
      hideFooter
      visible={visible}
      size="medium"
      header={<span>Create target schema</span>}
      onCancel={() => onClose()}
    >
      <Form_Shadcn_ {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <Modal.Content className="flex flex-col gap-y-4">
            <p className="text-sm">
              Namespace “<strong>{namespace}</strong>”{' '}
              {circumstance === 'fresh'
                ? 'must be linked to a new schema before tables can be paired.'
                : 'clashes with an existing database schema. Create a new schema to use as the destination for this data.'}
            </p>
            <Separator />
            <FormField_Shadcn_
              control={form.control}
              name="targetSchema"
              render={({ field }) => (
                <FormItemLayout
                  layout="vertical"
                  label="Target schema"
                  description="Where your analytics tables will be stored."
                >
                  <Input_Shadcn_ {...field} placeholder="Enter schema name" />
                </FormItemLayout>
              )}
            />
          </Modal.Content>
          <Modal.Separator />
          <Modal.Content className="flex items-center space-x-2 justify-end">
            <Button type="default" htmlType="button" disabled={loading} onClick={onClose}>
              Cancel
            </Button>
            <Button type="primary" htmlType="submit" loading={loading}>
              Create
            </Button>
          </Modal.Content>
        </form>
      </Form_Shadcn_>
      <SchemaEditor
        visible={createSchemaSheetOpen}
        closePanel={() => setCreateSchemaSheetOpen(false)}
        onSuccess={(schema) => {
          form.setValue('targetSchema', schema)
          setCreateSchemaSheetOpen(false)
        }}
      />
    </Modal>
  )
}
