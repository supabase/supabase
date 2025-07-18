import { zodResolver } from '@hookform/resolvers/zod'
import { snakeCase } from 'lodash'
import { useEffect, useState } from 'react'
import { SubmitHandler, useForm } from 'react-hook-form'
import { toast } from 'sonner'
import z from 'zod'

import { useParams } from 'common'
import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import { useSchemaCreateMutation } from 'data/database/schema-create-mutation'
import { useSchemasQuery } from 'data/database/schemas-query'
import { useFDWImportForeignSchemaMutation } from 'data/fdw/fdw-import-foreign-schema-mutation'
import {
  Button,
  Form_Shadcn_,
  FormControl_Shadcn_,
  FormField_Shadcn_,
  Input_Shadcn_,
  Modal,
} from 'ui'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import SchemaEditor from '../TableGridEditor/SidePanelEditor/SchemaEditor'

export interface ImportForeignSchemaDialogProps {
  bucketName: string
  namespace: string
  visible: boolean
  onClose: () => void
}

export const ImportForeignSchemaDialog = ({
  bucketName,
  namespace,
  visible,
  onClose,
}: ImportForeignSchemaDialogProps) => {
  const { project } = useProjectContext()
  const { ref } = useParams()
  const [loading, setLoading] = useState(false)
  const [createSchemaSheetOpen, setCreateSchemaSheetOpen] = useState(false)

  const { mutateAsync: importForeignSchema } = useFDWImportForeignSchemaMutation({
    onSuccess: () => {
      toast.success(`Successfully connected ${bucketName} to the database.`)
      onClose()
    },
  })

  const { data: schemas } = useSchemasQuery({ projectRef: project?.ref! })

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
      targetSchema: '',
    },
  })

  const { mutateAsync: createSchema } = useSchemaCreateMutation()

  const onSubmit: SubmitHandler<z.infer<typeof FormSchema>> = async (values) => {
    if (!ref) return console.error('Project ref is required')
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
        sourceNamespace: namespace,
        targetSchema: '',
      })
    }
  }, [visible, form, bucketName, namespace])

  return (
    <Modal
      hideFooter
      visible={visible}
      size="medium"
      header={
        <span>
          Connect namespace <span className="text-brand">{namespace}</span>
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
                <FormItemLayout label="Namespace" layout="vertical">
                  <FormControl_Shadcn_>
                    <Input_Shadcn_ {...field} placeholder="Enter namespace name" disabled />
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
                  description="Enter a schema name under which the Iceberg data will be accessible. The schema will be created."
                  layout="vertical"
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
              Save
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
