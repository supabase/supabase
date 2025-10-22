import { zodResolver } from '@hookform/resolvers/zod'
import { PermissionAction } from '@supabase/shared-types/out/constants'
import { ExternalLink, Lock, Plus, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import { SubmitHandler, useFieldArray, useForm } from 'react-hook-form'
import { toast } from 'sonner'
import z from 'zod'

import { useParams } from 'common'
import { ButtonTooltip } from 'components/ui/ButtonTooltip'
import { useVectorBucketIndexCreateMutation } from 'data/storage/vector-bucket-index-create-mutation'
import { useAsyncCheckPermissions } from 'hooks/misc/useCheckPermissions'
import {
  Button,
  Form_Shadcn_,
  FormControl_Shadcn_,
  FormField_Shadcn_,
  FormItem_Shadcn_,
  FormMessage_Shadcn_,
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
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import { inverseValidBucketNameRegex } from '../CreateBucketModal.utils'

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

const FormSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(3, 'Name must be at least 3 characters')
      .max(63, 'Name must be below 63 characters')
      .refine(
        (value) => !value.endsWith(' '),
        'The name of the bucket cannot end with a whitespace'
      )
      .refine(
        (value) => value !== 'public',
        '"public" is a reserved name. Please choose another name'
      ),
    targetSchema: z.string().default('tdai_data'),
    dimension: z
      .number({
        required_error: 'Dimension is required',
        invalid_type_error: 'Dimension must be a number',
      })
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
  .superRefine((data, ctx) => {
    if (!BUCKET_INDEX_NAME_REGEX.test(data.name)) {
      const [match] = data.name.match(inverseValidBucketNameRegex) ?? []
      ctx.addIssue({
        path: ['name'],
        code: z.ZodIssueCode.custom,
        message: !!match
          ? `Bucket name cannot contain the "${match}" character`
          : 'Bucket name contains an invalid special character',
      })
    }
  })

const formId = 'create-vector-table-form'

export type CreateVectorTableForm = z.infer<typeof FormSchema>

interface CreateVectorTableSheetProps {
  bucketName: string
}

export const CreateVectorTableSheet = ({ bucketName }: CreateVectorTableSheetProps) => {
  const { ref } = useParams()
  const { mutateAsync: createVectorBucketTable, isLoading: isCreating } =
    useVectorBucketIndexCreateMutation({ onError: () => {} })
  const [visible, setVisible] = useState(false)
  const { can: canCreateBuckets } = useAsyncCheckPermissions(PermissionAction.STORAGE_WRITE, '*')
  const form = useForm<CreateVectorTableForm>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      name: '',
      targetSchema: bucketName,
      dimension: undefined,
      distanceMetric: 'cosine',
      metadataKeys: [],
    },
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'metadataKeys',
  })

  const onSubmit: SubmitHandler<CreateVectorTableForm> = async (values) => {
    if (!ref) return console.error('Project ref is required')

    try {
      await createVectorBucketTable({
        projectRef: ref,
        bucketName: values.targetSchema,
        indexName: values.name,
        dataType: 'float32',
        dimension: values.dimension!,
        distanceMetric: values.distanceMetric,
        metadataKeys: values.metadataKeys.map((key) => key.value),
      })

      toast.success(`Successfully created vector table ${values.name}`)
      form.reset()

      setVisible(false)
    } catch (error: any) {
      // For other errors, show a toast as fallback
      toast.error(`Failed to create vector table: ${error.message}`)
    }
  }

  const handleClose = () => {
    form.reset()
    setVisible(false)
  }

  return (
    <Sheet
      open={visible}
      onOpenChange={(open) => {
        if (!open) {
          handleClose()
        }
      }}
    >
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

      <SheetContent size="lg" className="flex flex-col gap-0 p-0">
        <SheetHeader>
          <SheetTitle>Create vector table</SheetTitle>
        </SheetHeader>

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
                        placeholder=""
                      />
                    </FormControl_Shadcn_>
                  </FormItemLayout>
                )}
              />

              <FormField_Shadcn_
                key="targetSchema"
                name="targetSchema"
                control={form.control}
                render={({ field }) => (
                  <FormItemLayout
                    name="targetSchema"
                    label="Target schema"
                    description="The bucket name will be used as the target schema."
                    layout="horizontal"
                  >
                    <FormControl_Shadcn_>
                      <div className="relative">
                        <Input_Shadcn_
                          id="targetSchema"
                          {...field}
                          value={bucketName}
                          disabled
                          className="pr-10"
                        />
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                          <Lock size={14} className="text-foreground-muted" />
                        </div>
                      </div>
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
                    description="Must be an integer between 1 and 4096."
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
                            label=""
                            showIndicator={false}
                          >
                            <div className="flex flex-col gap-y-1">
                              <p className="text-foreground text-left">{metric.label}</p>
                              <p className="text-foreground-lighter text-left">
                                {metric.description}
                              </p>
                            </div>
                          </RadioGroupStackedItem>
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
                <Link
                  href="https://supabase.com/docs/guides/storage/vector"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-link text-foreground-light hover:text-foreground inline-flex items-center gap-x-1.5"
                >
                  <span>About keys</span>
                  <ExternalLink className="text-foreground-lighter" size={14} />
                </Link>
              </div>

              <div className="space-y-2">
                {fields.map((field, index) => (
                  <div key={field.id} className="flex items-start gap-2">
                    <FormField_Shadcn_
                      control={form.control}
                      name={`metadataKeys.${index}.value`}
                      render={({ field }) => (
                        <FormItem_Shadcn_ className="flex-1">
                          <FormControl_Shadcn_>
                            <Input_Shadcn_
                              {...field}
                              value={field.value}
                              size="small"
                              className="w-full"
                              placeholder="Header value"
                              data-1p-ignore
                              data-lpignore="true"
                              data-form-type="other"
                              data-bwignore
                            />
                          </FormControl_Shadcn_>
                          <FormMessage_Shadcn_ />
                        </FormItem_Shadcn_>
                      )}
                    />
                    <Button
                      type="outline"
                      className="px-2"
                      size="small"
                      icon={<Trash2 className="w-2 h-2" size={12} />}
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
          <Button form={formId} htmlType="submit" loading={isCreating} disabled={isCreating}>
            Create
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
