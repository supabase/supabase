import { zodResolver } from '@hookform/resolvers/zod'
import { PermissionAction } from '@supabase/shared-types/out/constants'
import { ExternalLink, Lock, Plus, Trash2, X } from 'lucide-react'
import { useState } from 'react'
import { SubmitHandler, useFieldArray, useForm } from 'react-hook-form'
import { toast } from 'sonner'
import z from 'zod'

import { useParams } from 'common'
import { ButtonTooltip } from 'components/ui/ButtonTooltip'
import { useVectorBucketCreateMutation } from 'data/storage/vector-bucket-create-mutation'
import { useAsyncCheckPermissions } from 'hooks/misc/useCheckPermissions'
import {
  Button,
  cn,
  Form_Shadcn_,
  FormControl_Shadcn_,
  FormField_Shadcn_,
  FormItem_Shadcn_,
  FormMessage_Shadcn_,
  Input_Shadcn_,
  RadioGroup_Shadcn_,
  RadioGroupItem_Shadcn_,
  Separator,
  Sheet,
  SheetClose,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetSection,
  SheetTitle,
  SheetTrigger,
} from 'ui'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import { inverseValidBucketNameRegex, validBucketNameRegex } from '../CreateBucketModal.utils'

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
    if (!validBucketNameRegex.test(data.name)) {
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

interface CreateVectorIndexSheetProps {
  bucketName: string
}

export const CreateVectorIndexSheet = ({ bucketName }: CreateVectorIndexSheetProps) => {
  const { ref } = useParams()
  const { mutate: createVectorBucket, isLoading: isCreating } = useVectorBucketCreateMutation()
  const [visible, setVisible] = useState(false)
  const { can: canCreateBuckets } = useAsyncCheckPermissions(PermissionAction.STORAGE_WRITE, '*')
  const form = useForm<CreateVectorTableForm>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      name: '',
      targetSchema: '',
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
      await createVectorBucket({
        projectRef: ref,
        bucketName: values.name,
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

      <SheetContent size="default" showClose={false} className="flex flex-col gap-0">
        <SheetHeader className="py-3 flex flex-row justify-between items-center border-b-0">
          <div className="flex flex-row gap-3 items-center">
            <SheetClose
              className={cn(
                'text-muted hover:text ring-offset-background transition-opacity hover:opacity-100',
                'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
                'disabled:pointer-events-none data-[state=open]:bg-secondary',
                'transition'
              )}
            >
              <X className="h-3 w-3" />
              <span className="sr-only">Close</span>
            </SheetClose>
            <SheetTitle className="truncate">Create vector index</SheetTitle>
          </div>
        </SheetHeader>

        <Separator />

        <Form_Shadcn_ {...form}>
          <form
            id={formId}
            onSubmit={form.handleSubmit(onSubmit)}
            className="overflow-auto flex-grow px-0"
          >
            <SheetSection className="space-y-4">
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
                    description="The bucket name will be used as the target schema for this table."
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
                          <Lock className="h-4 w-4 text-foreground-lighter" />
                        </div>
                      </div>
                    </FormControl_Shadcn_>
                  </FormItemLayout>
                )}
              />
            </SheetSection>
            <Separator />
            <SheetSection className="space-y-4">
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
                  <FormItemLayout name="distanceMetric" label="Distance metric" layout="horizontal">
                    <FormControl_Shadcn_>
                      <RadioGroup_Shadcn_
                        value={field.value}
                        onValueChange={field.onChange}
                        className="space-y-3"
                      >
                        <div className="flex items-start space-x-3">
                          <RadioGroupItem_Shadcn_
                            value="cosine"
                            id="distance-cosine"
                            className="mt-0.5"
                          />
                          <label htmlFor="distance-cosine" className="cursor-pointer flex flex-col">
                            <span className="text-sm font-medium text-foreground">Cosine</span>
                            <span className="text-sm text-foreground-light">
                              Measures similarity between two vectors, based on directions, not
                              magnitude.
                            </span>
                          </label>
                        </div>
                        <div className="flex items-start space-x-3">
                          <RadioGroupItem_Shadcn_
                            value="euclidean"
                            id="distance-euclidean"
                            className="mt-0.5"
                          />
                          <label
                            htmlFor="distance-euclidean"
                            className="cursor-pointer flex flex-col"
                          >
                            <span className="text-sm font-medium text-foreground">Euclidean</span>
                            <span className="text-sm text-foreground-light">
                              Measures straight-line distance between two vectors, using both
                              directions and magnitudes.
                            </span>
                          </label>
                        </div>
                      </RadioGroup_Shadcn_>
                    </FormControl_Shadcn_>
                  </FormItemLayout>
                )}
              />
            </SheetSection>
            <Separator />
            <SheetSection>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-foreground">Metadata keys</label>
                  <a
                    href="https://supabase.com/docs/guides/storage/vector"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-brand hover:underline inline-flex items-center gap-1"
                  >
                    About keys
                    <ExternalLink className="h-3 w-3" />
                  </a>
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
                              />
                            </FormControl_Shadcn_>
                            <FormMessage_Shadcn_ />
                          </FormItem_Shadcn_>
                        )}
                      />
                      <Button
                        type="default"
                        size="small"
                        icon={<Trash2 />}
                        onClick={() => remove(index)}
                      />
                    </div>
                  ))}
                </div>

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
