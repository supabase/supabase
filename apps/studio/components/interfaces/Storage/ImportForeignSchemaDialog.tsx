import { zodResolver } from '@hookform/resolvers/zod'
import { snakeCase } from 'lodash'
import { useEffect, useState } from 'react'
import { SubmitHandler, useForm } from 'react-hook-form'
import { toast } from 'sonner'
import z from 'zod'

import { useParams } from 'common'
import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import SchemaSelector from 'components/ui/SchemaSelector'
import { useFDWImportForeignSchemaMutation } from 'data/fdw/fdw-import-foreign-schema-mutation'
import { useIcebergNamespaceCreateMutation } from 'data/storage/iceberg-namespace-create-mutation'
import { getDecryptedValue } from 'data/vault/vault-secret-decrypted-value-query'
import {
  Button,
  Form_Shadcn_,
  FormControl_Shadcn_,
  FormField_Shadcn_,
  Input_Shadcn_,
  Modal,
  Switch,
} from 'ui'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'

export interface ImportForeignSchemaDialogProps {
  bucketName: string
  wrapperValues: Record<string, string>
  visible: boolean
  onClose: () => void
}

const FormSchema = z.object({
  bucketName: z.string().trim(),
  createNamespace: z.boolean(),
  sourceNamespace: z.string().trim(),
  targetSchema: z.string().trim(),
})

export type ImportForeignSchemaForm = z.infer<typeof FormSchema>

export const ImportForeignSchemaDialog = ({
  bucketName,
  wrapperValues,
  visible,
  onClose,
}: ImportForeignSchemaDialogProps) => {
  const { project } = useProjectContext()
  const { ref } = useParams()
  const [loading, setLoading] = useState(false)

  const { mutateAsync: createIcebergNamespace } = useIcebergNamespaceCreateMutation()

  const { mutateAsync: importForeignSchema } = useFDWImportForeignSchemaMutation({
    onSuccess: () => {
      toast.success(`Successfully connected ${bucketName} to the database.`)
      onClose()
    },
  })

  const form = useForm<ImportForeignSchemaForm>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      bucketName,
      createNamespace: false,
      sourceNamespace: 'default',
      targetSchema: 'public',
    },
  })

  const onSubmit: SubmitHandler<ImportForeignSchemaForm> = async (values) => {
    if (!ref) return console.error('Project ref is required')
    setLoading(true)

    const token = await getDecryptedValue({
      projectRef: project?.ref,
      connectionString: project?.connectionString,
      id: wrapperValues['vault_token'],
    })
    try {
      await createIcebergNamespace({
        catalogUri: wrapperValues['catalog_uri'],
        warehouse: wrapperValues['warehouse'],
        token: token[0].decrypted_secret,
        namespace: values.sourceNamespace,
      })

      await importForeignSchema({
        projectRef: ref,
        connectionString: project?.connectionString,
        serverName: `${snakeCase(values.bucketName)}_fdw_server`,
        sourceSchema: values.sourceNamespace,
        targetSchema: values.targetSchema,
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
        createNamespace: false,
        sourceNamespace: 'default',
        targetSchema: 'public',
      })
    }
  }, [visible, form, bucketName])

  return (
    <Modal
      hideFooter
      visible={visible}
      size="medium"
      header={
        <span>
          Connect namespace for <span className="text-brand">{bucketName}</span> bucket
        </span>
      }
      onCancel={() => onClose()}
    >
      <Form_Shadcn_ {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <Modal.Content className="flex flex-col gap-y-4">
            <FormField_Shadcn_
              control={form.control}
              name="sourceNamespace"
              render={({ field }) => (
                <FormItemLayout
                  label="Namespace"
                  description="Should match the namespace name when uploading data."
                  layout="vertical"
                >
                  <FormControl_Shadcn_>
                    <Input_Shadcn_ {...field} placeholder="Enter namespace name" />
                  </FormControl_Shadcn_>
                </FormItemLayout>
              )}
            />
            <FormField_Shadcn_
              control={form.control}
              name="createNamespace"
              render={({ field }) => (
                <FormItemLayout
                  label="Create a new namespace"
                  description="Create the namespace if it doesn't exist. If it exists, it will show an error."
                  layout="flex"
                >
                  <FormControl_Shadcn_>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      disabled={field.disabled}
                    />
                  </FormControl_Shadcn_>
                </FormItemLayout>
              )}
            />
            <FormField_Shadcn_
              control={form.control}
              name="targetSchema"
              render={({ field }) => (
                <FormItemLayout
                  label="Target Schema"
                  description="Database schema in which the Iceberg data will be shown."
                  layout="vertical"
                >
                  <SchemaSelector
                    portal={false}
                    size="small"
                    selectedSchemaName={field.value}
                    onSelectSchema={(schema) => field.onChange(schema)}
                  />
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
              Save
            </Button>
          </Modal.Content>
        </form>
      </Form_Shadcn_>
    </Modal>
  )
}
