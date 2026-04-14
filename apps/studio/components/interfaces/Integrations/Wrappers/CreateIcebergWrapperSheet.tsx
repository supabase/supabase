import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useMemo, useRef, useState } from 'react'
import { SubmitHandler, useForm, useWatch } from 'react-hook-form'
import { toast } from 'sonner'
import {
  Button,
  Card,
  CardContent,
  Form_Shadcn_,
  FormControl_Shadcn_,
  FormField_Shadcn_,
  Input_Shadcn_,
  RadioGroupStacked,
  RadioGroupStackedItem,
  SheetFooter,
  SheetHeader,
  SheetSection,
  SheetTitle,
} from 'ui'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import {
  PageSection,
  PageSectionContent,
  PageSectionDescription,
  PageSectionMeta,
  PageSectionSummary,
  PageSectionTitle,
} from 'ui-patterns/PageSection'
import * as z from 'zod'

import { CreateWrapperSheetProps } from './CreateWrapperSheet'
import InputField from './InputField'
import { useSchemaCreateMutation } from '@/data/database/schema-create-mutation'
import { useSchemasQuery } from '@/data/database/schemas-query'
import { useFDWCreateMutation } from '@/data/fdw/fdw-create-mutation'
import { useSendEventMutation } from '@/data/telemetry/send-event-mutation'
import { useSelectedOrganizationQuery } from '@/hooks/misc/useSelectedOrganization'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'

const FORM_ID = 'create-wrapper-form'

const S3TableSchema = z.object({
  target: z.literal('S3Tables'),
  source_schema: z.string().min(1, 'Please provide a namespace name'),
  wrapper_name: z.string().min(1, 'Please provide a name for your wrapper'),
  target_schema: z.string().min(1, 'Please provide an unique target schema'),
  vault_aws_access_key_id: z.string().min(1, 'Required'),
  vault_aws_secret_access_key: z.string().min(1, 'Required'),
  region_name: z.string().min(1, 'Required'),
  vault_aws_s3table_bucket_arn: z.string().min(1, 'Required'),
})
type S3TableSchemaType = z.infer<typeof S3TableSchema>

const R2CatalogSchema = z.object({
  target: z.literal('R2Catalog'),
  source_schema: z.string().min(1, 'Please provide a namespace name'),
  wrapper_name: z.string().min(1, 'Please provide a name for your wrapper'),
  target_schema: z.string().min(1, 'Please provide an unique target schema'),
  vault_aws_access_key_id: z.string().min(1, 'Required'),
  vault_aws_secret_access_key: z.string().min(1, 'Required'),
  vault_token: z.string().min(1, 'Required'),
  warehouse: z.string().min(1, 'Required'),
  s3: z.object({ endpoint: z.string().min(1, 'Required') }),
  catalog_uri: z.string().min(1, 'Required'),
})
type R2CatalogSchemaType = z.infer<typeof R2CatalogSchema>

const IcebergRestCatalogSchema = z.object({
  target: z.literal('IcebergRestCatalog'),
  source_schema: z.string().min(1, 'Please provide a namespace name'),
  wrapper_name: z.string().min(1, 'Please provide a name for your wrapper'),
  target_schema: z.string().min(1, 'Please provide an unique target schema'),
  vault_aws_access_key_id: z.string().optional(),
  vault_aws_secret_access_key: z.string().optional(),
  region_name: z.string().optional(),
  vault_aws_s3table_bucket_arn: z.string().optional(),
  vault_token: z.string().optional(),
  warehouse: z.string().optional(),
  s3: z.object({ endpoint: z.string().min(1, 'Required') }),
  catalog_uri: z.string().optional(),
})
type IcebergRestCatalogSchemaType = z.infer<typeof IcebergRestCatalogSchema>

const formSchema = z.discriminatedUnion('target', [
  S3TableSchema,
  R2CatalogSchema,
  IcebergRestCatalogSchema,
])

type FormSchema = z.infer<typeof formSchema>

const targetFields: Record<Target, { name: string; required: boolean }[]> = {
  S3Tables: [
    { name: 'vault_aws_access_key_id', required: true },
    { name: 'vault_aws_secret_access_key', required: true },
    { name: 'region_name', required: true },
    { name: 'vault_aws_s3table_bucket_arn', required: true },
  ],
  R2Catalog: [
    { name: 'vault_aws_access_key_id', required: true },
    { name: 'vault_aws_secret_access_key', required: true },
    { name: 'vault_token', required: true },
    { name: 'warehouse', required: true },
    { name: 's3.endpoint', required: true },
    { name: 'catalog_uri', required: true },
  ],
  IcebergRestCatalog: [
    { name: 'vault_aws_access_key_id', required: false },
    { name: 'vault_aws_secret_access_key', required: false },
    { name: 'region_name', required: false },
    { name: 'vault_aws_s3table_bucket_arn', required: false },
    { name: 'vault_token', required: false },
    { name: 'warehouse', required: false },
    { name: 's3.endpoint', required: false },
    { name: 'catalog_uri', required: false },
  ],
} as const

type Target = 'S3Tables' | 'R2Catalog' | 'IcebergRestCatalog'

const INITIAL_VALUES = {
  wrapper_name: '',
  source_schema: '',
  target_schema: '',
  target: 'S3Tables',
  vault_aws_access_key_id: '',
  vault_aws_s3table_bucket_arn: '',
  vault_aws_secret_access_key: '',
  region_name: '',
} satisfies FormSchema

export const CreateIcebergWrapperSheet = ({
  wrapperMeta,
  onDirty,
  onClose,
  onCloseWithConfirmation,
}: CreateWrapperSheetProps) => {
  const { data: project } = useSelectedProjectQuery()
  const { data: org } = useSelectedOrganizationQuery()
  const { mutate: sendEvent } = useSendEventMutation()

  const { mutateAsync: createFDW, isPending: isCreatingWrapper } = useFDWCreateMutation({
    onSuccess: () => {
      toast.success(`Successfully created ${wrapperMeta?.label} foreign data wrapper`)
      onClose()
    },
  })

  const { data: schemas } = useSchemasQuery({
    projectRef: project?.ref!,
    connectionString: project?.connectionString,
  })

  const { mutateAsync: createSchema } = useSchemaCreateMutation()

  const form = useForm<FormSchema>({
    resolver: zodResolver(formSchema),
    defaultValues: INITIAL_VALUES,
  })
  const { resetField, formState, setError, watch } = form
  const { isDirty, isSubmitting } = formState

  useEffect(() => {
    onDirty(isDirty)
  }, [onDirty, isDirty])

  const currentTarget = useRef<FormSchema['target']>(INITIAL_VALUES.target)
  useEffect(() => {
    const subscription = watch((values) => {
      if (!values.target || values.target === currentTarget.current) return
      currentTarget.current = values.target

      const fields = targetFields[values.target]
      if (!fields) return

      wrapperMeta.server.options.forEach((option) => {
        // @ts-expect-error Can't reconcile with form schema
        resetField(option.name, { defaultValue: option.defaultValue ?? '' })
      })
    })

    return () => subscription.unsubscribe()
  }, [resetField, watch, wrapperMeta])

  const onSubmit: SubmitHandler<FormSchema> = async (values) => {
    const foundSchema = schemas?.find((s) => s.name === values.target_schema)
    if (foundSchema) {
      setError('target_schema', {
        type: 'validate',
        message: 'This schema already exists. Please specify a unique schema name.',
      })
      return
    }

    let formValues: Record<string, string> = {}
    if (values.target === 'R2Catalog' || values.target === 'IcebergRestCatalog') {
      const { s3, ...otherFormValues } = values
      formValues = otherFormValues
      formValues['s3.endpoint'] = s3.endpoint
    } else {
      formValues = values
    }

    try {
      await createSchema({
        projectRef: project?.ref,
        connectionString: project?.connectionString,
        name: values.target_schema,
      })

      await createFDW({
        projectRef: project?.ref,
        connectionString: project?.connectionString,
        wrapperMeta,
        formState: {
          ...formValues,
          server_name: `${values.wrapper_name}_server`,
          supabase_target_schema: values.target_schema,
        },
        mode: 'schema',
        tables: [],
        sourceSchema: values.source_schema,
        targetSchema: values.target_schema,
      })

      sendEvent({
        action: 'foreign_data_wrapper_created',
        properties: {
          wrapperType: wrapperMeta.label,
        },
        groups: {
          project: project?.ref ?? 'Unknown',
          organization: org?.slug ?? 'Unknown',
        },
      })
    } catch (error) {
      console.error(error)
      // The error will be handled by the mutation onError callback (toast.error)
    }
  }

  const isLoading = isCreatingWrapper || isSubmitting
  const wrapperName = useWatch({ name: 'wrapper_name', control: form.control })
  const target = useWatch({ name: 'target', control: form.control })

  const targetOptions = wrapperMeta.server.options
    .filter((option) => targetFields[target].find((field) => field.name === option.name))
    .map((option) => {
      return {
        ...option,
        required: !!targetFields[target].find((field) => field.name === option.name)?.required,
      }
    })
  return (
    <>
      <div className="h-full" tabIndex={-1}>
        <Form_Shadcn_ {...form}>
          <form
            id={FORM_ID}
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex flex-col h-full"
          >
            <SheetHeader>
              <SheetTitle>Create a {wrapperMeta.label} wrapper</SheetTitle>
            </SheetHeader>
            <SheetSection className="flex-grow overflow-y-auto">
              <PageSection>
                <PageSectionMeta>
                  <PageSectionSummary>
                    <PageSectionTitle>Wrapper Configuration</PageSectionTitle>
                  </PageSectionSummary>
                </PageSectionMeta>
                <PageSectionContent>
                  <Card>
                    <CardContent>
                      <FormField_Shadcn_
                        control={form.control}
                        name="wrapper_name"
                        render={({ field }) => (
                          <FormItemLayout
                            layout="horizontal"
                            label="Wrapper Name"
                            description={
                              wrapperName.length > 0 ? (
                                <>
                                  Your wrapper's server name will be{' '}
                                  <code className="text-code-inline">{wrapperName}_server</code>
                                </>
                              ) : (
                                ''
                              )
                            }
                          >
                            <FormControl_Shadcn_>
                              <Input_Shadcn_ {...field} />
                            </FormControl_Shadcn_>
                          </FormItemLayout>
                        )}
                      />
                    </CardContent>
                  </Card>
                </PageSectionContent>
              </PageSection>
              <PageSection>
                <PageSectionMeta>
                  <PageSectionSummary>
                    <PageSectionTitle>Data target</PageSectionTitle>
                  </PageSectionSummary>
                </PageSectionMeta>
                <PageSectionContent>
                  <Card>
                    <CardContent>
                      <FormField_Shadcn_
                        control={form.control}
                        name="target"
                        render={({ field }) => (
                          <FormItemLayout layout="vertical">
                            <div>
                              <RadioGroupStacked value={field.value} onValueChange={field.onChange}>
                                <RadioGroupStackedItem
                                  key="S3Tables"
                                  value="S3Tables"
                                  label="AWS S3 Tables"
                                  showIndicator={false}
                                >
                                  <div className="flex gap-x-5">
                                    <div className="flex flex-col">
                                      <p className="text-foreground-light text-left">
                                        AWS S3 storage that's optimized for analytics workloads.
                                      </p>
                                    </div>
                                  </div>
                                </RadioGroupStackedItem>
                                <RadioGroupStackedItem
                                  key="R2Catalog"
                                  value="R2Catalog"
                                  label="Cloudflare R2 Catalog"
                                  showIndicator={false}
                                >
                                  <div className="flex gap-x-5">
                                    <div className="flex flex-col">
                                      <p className="text-foreground-light text-left">
                                        Managed Apache Iceberg built directly into your R2 bucket.
                                      </p>
                                    </div>
                                  </div>
                                </RadioGroupStackedItem>
                                <RadioGroupStackedItem
                                  key="IcebergRestCatalog"
                                  value="IcebergRestCatalog"
                                  label="Iceberg REST Catalog"
                                  showIndicator={false}
                                >
                                  <div className="flex gap-x-5">
                                    <div className="flex flex-col">
                                      <p className="text-foreground-light text-left">
                                        Can be used with any S3-compatible storage.
                                      </p>
                                    </div>
                                  </div>
                                </RadioGroupStackedItem>
                              </RadioGroupStacked>
                            </div>
                          </FormItemLayout>
                        )}
                      />
                    </CardContent>
                  </Card>
                </PageSectionContent>
              </PageSection>

              <PageSection>
                <PageSectionMeta>
                  <PageSectionSummary>
                    <PageSectionTitle>{wrapperMeta.label} Configuration</PageSectionTitle>
                  </PageSectionSummary>
                </PageSectionMeta>
                <PageSectionContent>
                  <Card>
                    {targetOptions.map((option) =>
                      option.hidden ? (
                        <input
                          key={`${option.name}-${option.required}-${option.hidden}`}
                          type="hidden"
                          // @ts-expect-error Can't reconcile with form schema
                          {...form.register(option.name)}
                        />
                      ) : (
                        <CardContent key={`${option.name}-${option.required}-${option.hidden}`}>
                          <InputField control={form.control} option={option} />
                        </CardContent>
                      )
                    )}
                  </Card>
                </PageSectionContent>
              </PageSection>
              <PageSection>
                <PageSectionMeta>
                  <PageSectionSummary>
                    <PageSectionTitle>Foreign Schema</PageSectionTitle>
                    <PageSectionDescription>
                      You can query your data from the foreign tables in the specified schema after
                      the wrapper is created.
                    </PageSectionDescription>
                  </PageSectionSummary>
                </PageSectionMeta>
                <PageSectionContent>
                  <Card>
                    <CardContent>
                      {wrapperMeta.sourceSchemaOption && (
                        <InputField
                          control={form.control}
                          option={wrapperMeta.sourceSchemaOption}
                        />
                      )}
                    </CardContent>
                    <CardContent>
                      <InputField
                        control={form.control}
                        option={{
                          name: 'target_schema',
                          label: 'Specify a new schema to create all wrapper tables in',
                          description:
                            'A new schema will be created. For security purposes, the wrapper tables from the foreign schema cannot be created within an existing schema.',
                          required: true,
                          encrypted: false,
                          secureEntry: false,
                        }}
                      />
                    </CardContent>
                  </Card>
                </PageSectionContent>
              </PageSection>
            </SheetSection>

            <SheetFooter>
              <Button
                size="tiny"
                type="default"
                htmlType="button"
                onClick={onCloseWithConfirmation}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                size="tiny"
                type="primary"
                form={FORM_ID}
                htmlType="submit"
                loading={isLoading}
                disabled={isLoading || !isDirty}
              >
                Create wrapper
              </Button>
            </SheetFooter>
          </form>
        </Form_Shadcn_>
      </div>
    </>
  )
}
