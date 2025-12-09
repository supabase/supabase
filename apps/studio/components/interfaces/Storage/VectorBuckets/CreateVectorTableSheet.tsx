import { zodResolver } from '@hookform/resolvers/zod'
import { PermissionAction } from '@supabase/shared-types/out/constants'
import { Plus, Trash2 } from 'lucide-react'
import { parseAsBoolean, useQueryState } from 'nuqs'
import { useEffect } from 'react'
import { SubmitHandler, useFieldArray, useForm } from 'react-hook-form'
import { toast } from 'sonner'
import z from 'zod'
import { DOCS_URL } from 'lib/constants'
import { ButtonTooltip } from 'components/ui/ButtonTooltip'
import { DocsButton } from 'components/ui/DocsButton'
import { useFDWImportForeignSchemaMutation } from 'data/fdw/fdw-import-foreign-schema-mutation'
import { useVectorBucketIndexCreateMutation } from 'data/storage/vector-bucket-index-create-mutation'
import { useAsyncCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import {
  Button,
  Form_Shadcn_,
  FormControl_Shadcn_,
  FormField_Shadcn_,
  Input_Shadcn_,
  RadioGroupStacked,
  RadioGroupStackedItem,
  Separator,
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetSection,
  SheetTitle,
  SheetTrigger,
} from 'ui'
import { Admonition } from 'ui-patterns'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import { inverseValidBucketNameRegex } from '../CreateBucketModal.utils'
import { getVectorBucketFDWSchemaName } from './VectorBuckets.utils'
import { useS3VectorsWrapperInstance } from './useS3VectorsWrapperInstance'

const isStagingLocal = process.env.NEXT_PUBLIC_ENVIRONMENT !== 'prod'

const BUCKET_INDEX_NAME_REGEX = /^[a-z0-9](?:[a-z0-9.-]{1,61})?[a-z0-9]$/

const DISTANCE_METRICS = [
  {
    value: 'cosine',
    label: 'Cosine',
    description: 'Measures similarity between two vectors, based on directions, not magnitude.',
  },
  {
    value: 'euclidean',
    label: 'Euclidean',
    description:
      'Measures straight-line distance between two vectors, using both directions and magnitudes.',
  },
] as const

const FormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(3, 'Name must be at least 3 characters')
    .max(63, 'Name must be below 63 characters')
    .refine(
      (value) => value !== 'public',
      '"public" is a reserved name. Please choose another name'
    )
    .superRefine((name, ctx) => {
      if (!BUCKET_INDEX_NAME_REGEX.test(name)) {
        const [match] = name.match(inverseValidBucketNameRegex) ?? []
        ctx.addIssue({
          path: [],
          code: z.ZodIssueCode.custom,
          message: !!match
            ? `Bucket name cannot contain the "${match}" character`
            : 'Bucket name contains an invalid special character',
        })
      }
    }),
  dimension: z
    .number()
    .int('Dimension must be an integer')
    .min(1, 'Dimension must be at least 1')
    .max(4096, 'Dimension must be at most 4096'),
  distanceMetric: z.enum(['cosine', 'euclidean'], {
    required_error: 'Please select a distance metric',
  }),
  metadataKeys: z
    .array(
      z.object({
        value: z.string().min(1, 'The metadata key needs to be at least 1 character long'),
      })
    )
    .default([]),
})

const formId = 'create-vector-table-form'

export type CreateVectorTableForm = z.infer<typeof FormSchema>

interface CreateVectorTableSheetProps {
  bucketName?: string
}

export const CreateVectorTableSheet = ({ bucketName }: CreateVectorTableSheetProps) => {
  const { data: project } = useSelectedProjectQuery()

  const [visible, setVisible] = useQueryState(
    'newTable',
    parseAsBoolean.withDefault(false).withOptions({ history: 'push', clearOnDefault: true })
  )
  const { can: canCreateBuckets } = useAsyncCheckPermissions(PermissionAction.STORAGE_WRITE, '*')

  const { data: wrapperInstance } = useS3VectorsWrapperInstance({ bucketId: bucketName })

  // [Joshen] Can remove this once this restriction is removed
  const showIndexCreationNotice = isStagingLocal && !!project && project?.region !== 'us-east-1'

  const defaultValues = {
    name: '',
    dimension: undefined,
    distanceMetric: 'cosine' as 'cosine' | 'euclidean',
    metadataKeys: [],
  }
  const form = useForm<CreateVectorTableForm>({
    resolver: zodResolver(FormSchema),
    defaultValues,
    values: defaultValues as any,
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'metadataKeys',
  })

  const { mutateAsync: createVectorBucketTable, isPending: isCreatingVectorBucketTable } =
    useVectorBucketIndexCreateMutation()

  const { mutateAsync: importForeignSchema, isPending: isImportingForeignSchema } =
    useFDWImportForeignSchemaMutation({
      onError: () => {},
    })
  const isCreating = isCreatingVectorBucketTable || isImportingForeignSchema

  const onSubmit: SubmitHandler<CreateVectorTableForm> = async (values) => {
    if (!project?.ref) return console.error('Project ref is required')
    if (!bucketName) return

    try {
      await createVectorBucketTable({
        projectRef: project.ref,
        bucketName: bucketName,
        indexName: values.name,
        dataType: 'float32',
        dimension: values.dimension!,
        distanceMetric: values.distanceMetric,
        metadataKeys: values.metadataKeys.map((key) => key.value),
      })
    } catch (error: any) {
      toast.error(`Failed to create vector table: ${error.message}`)
      return
    }

    try {
      if (wrapperInstance) {
        await importForeignSchema({
          projectRef: project.ref,
          connectionString: project?.connectionString,
          serverName: wrapperInstance.server_name,
          sourceSchema: getVectorBucketFDWSchemaName(bucketName),
          targetSchema: getVectorBucketFDWSchemaName(bucketName),
          schemaOptions: [`bucket_name '${bucketName}'`],
        })
      }
    } catch (error: any) {
      toast.warning(`Failed to connect vector table to the database: ${error.message}`)
    }

    toast.success(`Successfully created vector table “${values.name}”`)
    form.reset()

    setVisible(false)
  }

  useEffect(() => {
    if (!visible) {
      form.reset()
    }
  }, [visible])

  return (
    <Sheet open={visible} onOpenChange={setVisible}>
      <SheetTrigger asChild>
        <ButtonTooltip
          block
          size="tiny"
          type="primary"
          className="w-fit"
          icon={<Plus size={14} />}
          disabled={!canCreateBuckets}
          onClick={() => setVisible(true)}
          tooltip={{
            content: {
              side: 'bottom',
              text: !canCreateBuckets
                ? 'You need additional permissions to create buckets'
                : undefined,
            },
          }}
        >
          Create table
        </ButtonTooltip>
      </SheetTrigger>

      <SheetContent size="default" className="flex flex-col gap-0 p-0">
        <SheetHeader>
          <SheetTitle>Create vector table</SheetTitle>
        </SheetHeader>

        {showIndexCreationNotice && (
          <Admonition
            type="warning"
            className="border-x-0 border-t-0 rounded-none"
            title="Vector table creation is currently only supported for projects in us-east-1"
            description={`This is only applicable to projects on local/staging (Project is currently in ${project.region})`}
          />
        )}

        <Form_Shadcn_ {...form}>
          <form
            id={formId}
            onSubmit={form.handleSubmit(onSubmit)}
            className="overflow-auto flex-grow px-0"
          >
            <SheetSection className="flex flex-col gap-y-4">
              <FormField_Shadcn_
                key="name"
                name="name"
                control={form.control}
                render={({ field }) => (
                  <FormItemLayout
                    name="name"
                    label="Name"
                    description="Must be between 3–63 characters. Valid characters are a-z, 0-9, hyphens, and periods."
                    layout="horizontal"
                  >
                    <FormControl_Shadcn_>
                      <Input_Shadcn_
                        id="name"
                        data-1p-ignore
                        data-lpignore="true"
                        data-form-type="other"
                        data-bwignore
                        {...field}
                        placeholder="Enter a table name"
                      />
                    </FormControl_Shadcn_>
                  </FormItemLayout>
                )}
              />
            </SheetSection>
            <Separator />
            <SheetSection className="flex flex-col gap-y-4">
              <FormField_Shadcn_
                key="dimension"
                name="dimension"
                control={form.control}
                render={({ field }) => (
                  <FormItemLayout
                    name="dimension"
                    label="Dimension"
                    description="Must be an integer between 1–4096."
                    layout="horizontal"
                  >
                    <FormControl_Shadcn_>
                      <Input_Shadcn_
                        id="dimension"
                        type="number"
                        placeholder="Enter a numeric value"
                        {...field}
                        onChange={(e) => {
                          const value = e.target.value
                          field.onChange(value === '' ? undefined : Number(value))
                        }}
                        value={field.value ?? ''}
                      />
                    </FormControl_Shadcn_>
                  </FormItemLayout>
                )}
              />

              <FormField_Shadcn_
                key="distanceMetric"
                name="distanceMetric"
                control={form.control}
                render={({ field }) => (
                  <FormItemLayout
                    name="distanceMetric"
                    label="Distance metric"
                    layout="horizontal"
                    className="gap-1"
                  >
                    <FormControl_Shadcn_>
                      <RadioGroupStacked
                        id="distance_metric"
                        name="distance_metric"
                        value={field.value}
                        disabled={field.disabled}
                        onValueChange={field.onChange}
                      >
                        {DISTANCE_METRICS.map((metric) => (
                          <RadioGroupStackedItem
                            key={metric.value}
                            id={metric.value}
                            value={metric.value}
                            label={metric.label}
                            description={metric.description}
                            showIndicator={true}
                          ></RadioGroupStackedItem>
                        ))}
                      </RadioGroupStacked>
                    </FormControl_Shadcn_>
                  </FormItemLayout>
                )}
              />
            </SheetSection>
            <Separator />
            <SheetSection className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-sm text-foreground">Metadata keys</label>
                <DocsButton
                  href={`${DOCS_URL}/guides/storage/vector/storing-vectors#metadata-best-practices`}
                />
              </div>
              <div className="space-y-2">
                {fields.map((field, index) => (
                  <div key={field.id} className="flex items-start gap-2">
                    <div className="flex-1">
                      <FormField_Shadcn_
                        control={form.control}
                        name={`metadataKeys.${index}.value`}
                        render={({ field }) => (
                          <FormItemLayout
                            name={`metadataKeys.${index}.value`}
                            description={
                              index === fields.length - 1
                                ? 'Must be between 1–63 characters and unique within this table.'
                                : undefined
                            }
                            layout="vertical"
                          >
                            <FormControl_Shadcn_>
                              <Input_Shadcn_
                                {...field}
                                value={field.value}
                                size="small"
                                className="w-full"
                                placeholder="Enter a metadata key name"
                                data-1p-ignore
                                data-lpignore="true"
                                data-form-type="other"
                                data-bwignore
                              />
                            </FormControl_Shadcn_>
                          </FormItemLayout>
                        )}
                      />
                    </div>
                    <Button
                      type="text"
                      className="w-[34px] h-[34px]" // Match the height of the input
                      size="tiny"
                      icon={<Trash2 size={12} />}
                      onClick={() => remove(index)}
                    />
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-center rounded border border-strong border-dashed py-3">
                <Button type="default" size="tiny" onClick={() => append({ value: '' })}>
                  Add metadata key
                </Button>
              </div>
            </SheetSection>
          </form>
        </Form_Shadcn_>

        <SheetFooter>
          <Button type="default" disabled={isCreating} onClick={() => setVisible(false)}>
            Cancel
          </Button>
          <Button
            form={formId}
            htmlType="submit"
            loading={isCreating}
            disabled={isCreating || !bucketName}
          >
            Create
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
