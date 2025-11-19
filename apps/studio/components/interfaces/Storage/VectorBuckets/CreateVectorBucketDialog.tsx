import { zodResolver } from '@hookform/resolvers/zod'
import { PermissionAction } from '@supabase/shared-types/out/constants'
import { Plus } from 'lucide-react'
import { useEffect, useState } from 'react'
import { SubmitHandler, useForm } from 'react-hook-form'
import { toast } from 'sonner'
import z from 'zod'

import { useParams } from 'common'
import { ButtonTooltip } from 'components/ui/ButtonTooltip'
import { InlineLink } from 'components/ui/InlineLink'
import { useSchemaCreateMutation } from 'data/database/schema-create-mutation'
import { useS3VectorsWrapperCreateMutation } from 'data/storage/s3-vectors-wrapper-create-mutation'
import { useVectorBucketCreateMutation } from 'data/storage/vector-bucket-create-mutation'
import { useVectorBucketsQuery } from 'data/storage/vector-buckets-query'
import { useSendEventMutation } from 'data/telemetry/send-event-mutation'
import { useAsyncCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { useSelectedOrganizationQuery } from 'hooks/misc/useSelectedOrganization'
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
  FormControl_Shadcn_,
  FormField_Shadcn_,
  Input_Shadcn_,
} from 'ui'
import { Admonition } from 'ui-patterns/admonition'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import { inverseValidBucketNameRegex, validBucketNameRegex } from '../CreateBucketModal.utils'
import { useS3VectorsWrapperExtension } from './useS3VectorsWrapper'
import { getVectorBucketFDWSchemaName } from './VectorBuckets.utils'

const FormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Please provide a name for your bucket')
    .max(100, 'Bucket name should be below 100 characters')
    .superRefine((name, ctx) => {
      if (!validBucketNameRegex.test(name)) {
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
})

const formId = 'create-storage-bucket-form'

export type CreateBucketForm = z.infer<typeof FormSchema>

export const CreateVectorBucketDialog = () => {
  const { ref } = useParams()
  const { data: org } = useSelectedOrganizationQuery()
  const { data: project } = useSelectedProjectQuery()
  const [isLoading, setIsLoading] = useState(false)

  const [visible, setVisible] = useState(false)
  const { can: canCreateBuckets } = useAsyncCheckPermissions(PermissionAction.STORAGE_WRITE, '*')

  const { data } = useVectorBucketsQuery({ projectRef: ref })

  const form = useForm<CreateBucketForm>({
    resolver: zodResolver(FormSchema),
    defaultValues: { name: '' },
  })

  const { mutate: sendEvent } = useSendEventMutation()
  const { mutateAsync: createVectorBucket } = useVectorBucketCreateMutation({
    onError: () => {},
  })

  const { state: wrappersExtensionState } = useS3VectorsWrapperExtension()

  const { mutateAsync: createS3VectorsWrapper } = useS3VectorsWrapperCreateMutation()

  const { mutateAsync: createSchema } = useSchemaCreateMutation({
    onError: () => {},
  })

  const onSubmit: SubmitHandler<CreateBucketForm> = async (values) => {
    if (!ref) return console.error('Project ref is required')

    const hasExistingBucket = (data?.vectorBuckets ?? []).some(
      (x) => x.vectorBucketName === values.name
    )
    if (hasExistingBucket) return toast.error('Bucket name already exists')

    setIsLoading(true)
    try {
      await createVectorBucket({ projectRef: ref, bucketName: values.name })
    } catch (error: any) {
      toast.error(`Failed to create vector bucket: ${error.message}`)
      setIsLoading(false)
      return
    }

    try {
      if (wrappersExtensionState === 'installed') {
        await createS3VectorsWrapper({ bucketName: values.name })

        await createSchema({
          projectRef: project?.ref,
          connectionString: project?.connectionString,
          name: getVectorBucketFDWSchemaName(values.name),
        })
      }
    } catch (error: any) {
      toast.warning(
        `Failed to create vector bucket integration: ${error.message}. The bucket will be created but you will need to manually install the integration.`
      )
    }
    setIsLoading(false)

    sendEvent({
      action: 'storage_bucket_created',
      properties: { bucketType: 'vector' },
      groups: { project: ref ?? 'Unknown', organization: org?.slug ?? 'Unknown' },
    })
    toast.success(`Successfully created vector bucket ${values.name}`)
    form.reset()
    setVisible(false)
  }

  useEffect(() => {
    if (!visible) form.reset()
  }, [visible])

  return (
    <Dialog open={visible} onOpenChange={setVisible}>
      <DialogTrigger asChild>
        <ButtonTooltip
          block
          size="tiny"
          type="primary"
          className="w-fit"
          icon={<Plus size={14} />}
          disabled={!canCreateBuckets}
          tabIndex={!canCreateBuckets ? -1 : 0}
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
          New bucket
        </ButtonTooltip>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create vector bucket</DialogTitle>
        </DialogHeader>

        <DialogSectionSeparator />

        <Form_Shadcn_ {...form}>
          <form id={formId} onSubmit={form.handleSubmit(onSubmit)}>
            <DialogSection className="flex flex-col gap-y-4">
              <FormField_Shadcn_
                key="name"
                name="name"
                control={form.control}
                render={({ field }) => (
                  <FormItemLayout
                    name="name"
                    label="Bucket name"
                    labelOptional="Cannot be changed after creation"
                    description="A target schema will be created that matches this name."
                  >
                    <FormControl_Shadcn_>
                      <Input_Shadcn_
                        id="name"
                        data-1p-ignore
                        data-lpignore="true"
                        data-form-type="other"
                        data-bwignore
                        {...field}
                        placeholder="Enter bucket name"
                      />
                    </FormControl_Shadcn_>
                  </FormItemLayout>
                )}
              />
              <Admonition type="default">
                <p>
                  Supabase will install the{' '}
                  {wrappersExtensionState !== 'installed' ? 'Wrappers extension and ' : ''}
                  S3 Vectors Wrapper integration on your behalf.{' '}
                  <InlineLink href={`${DOCS_URL}/guides/database/extensions/wrappers/s3-vectors`}>
                    Learn more
                  </InlineLink>
                  .
                </p>
              </Admonition>
            </DialogSection>
          </form>
        </Form_Shadcn_>

        <DialogFooter>
          <Button type="default" disabled={isLoading} onClick={() => setVisible(false)}>
            Cancel
          </Button>
          <Button form={formId} htmlType="submit" loading={isLoading}>
            Create
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
