import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useState } from 'react'
import { SubmitHandler, useForm } from 'react-hook-form'
import { toast } from 'sonner'
import z from 'zod'

import { useParams } from 'common'
import { InlineLink } from 'components/ui/InlineLink'
import { useDatabaseExtensionEnableMutation } from 'data/database-extensions/database-extension-enable-mutation'
import { useS3VectorsWrapperCreateMutation } from 'data/storage/s3-vectors-wrapper-create-mutation'
import { useVectorBucketCreateMutation } from 'data/storage/vector-bucket-create-mutation'
import { useVectorBucketsQuery } from 'data/storage/vector-buckets-query'
import { useSendEventMutation } from 'data/telemetry/send-event-mutation'
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
  Form_Shadcn_,
  FormControl_Shadcn_,
  FormField_Shadcn_,
  Input_Shadcn_,
} from 'ui'
import { Admonition } from 'ui-patterns/admonition'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import { validVectorBucketName } from './CreateVectorBucketDialog.utils'
import { useS3VectorsWrapperExtension } from './useS3VectorsWrapper'

const FormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(3, 'Bucket name should be at least 3 characters')
    .max(63, 'Bucket name should be up to 63 characters')
    .superRefine((name, ctx) => {
      if (!validVectorBucketName.test(name)) {
        if (/[A-Z]/.test(name)) {
          return ctx.addIssue({
            path: [],
            code: z.ZodIssueCode.custom,
            message: 'Bucket name can only be lowercase characters',
          })
        }

        if (!/^[a-z0-9]/.test(name)) {
          return ctx.addIssue({
            path: [],
            code: z.ZodIssueCode.custom,
            message: 'Bucket name must start with a lowercase letter or number.',
          })
        }

        if (!/[a-z0-9]$/.test(name)) {
          return ctx.addIssue({
            path: [],
            code: z.ZodIssueCode.custom,
            message: 'Bucket name must end with a lowercase letter or number.',
          })
        }

        const [match] = name.match(/[^a-z0-9-]/) ?? []
        return ctx.addIssue({
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

export const CreateVectorBucketDialog = ({
  visible,
  setVisible,
}: {
  visible: boolean
  setVisible: (visible: boolean) => void
}) => {
  const { ref } = useParams()
  const { data: org } = useSelectedOrganizationQuery()
  const { data: project } = useSelectedProjectQuery()
  const [isLoading, setIsLoading] = useState(false)

  const { data } = useVectorBucketsQuery({ projectRef: ref })

  const form = useForm<CreateBucketForm>({
    resolver: zodResolver(FormSchema),
    defaultValues: { name: '' },
  })

  const { mutate: sendEvent } = useSendEventMutation()
  const { mutateAsync: createVectorBucket } = useVectorBucketCreateMutation({
    onError: () => {},
  })

  const { extension: wrappersExtension, state: wrappersExtensionState } =
    useS3VectorsWrapperExtension()

  const { mutateAsync: createS3VectorsWrapper } = useS3VectorsWrapperCreateMutation()

  const { mutateAsync: enableExtension } = useDatabaseExtensionEnableMutation()

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
      if (!wrappersExtension) throw new Error('Unable to find wrappers extension.')
      if (wrappersExtensionState === 'not-installed') {
        // when it's not installed, we need to enable the extension and create the wrapper
        await enableExtension({
          projectRef: project?.ref!,
          connectionString: project?.connectionString,
          name: wrappersExtension.name,
          schema: wrappersExtension.schema ?? 'extensions',
          version: wrappersExtension.default_version,
        })
      }

      await createS3VectorsWrapper({ bucketName: values.name })
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
  }, [visible, form])

  return (
    <Dialog open={visible} onOpenChange={setVisible}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create vector bucket</DialogTitle>
        </DialogHeader>

        <DialogSectionSeparator />

        <Form_Shadcn_ {...form}>
          <form id={formId} onSubmit={form.handleSubmit(onSubmit)}>
            <DialogSection className="flex flex-col !p-0">
              <FormField_Shadcn_
                key="name"
                name="name"
                control={form.control}
                render={({ field }) => (
                  <FormItemLayout
                    name="name"
                    label="Bucket name"
                    className="px-5 py-5"
                    labelOptional="Cannot be changed after creation"
                    description="Must be between 3–63 characters. Only lowercase letters, numbers, and hyphens are allowed"
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

              <Admonition type="default" className="border-x-0 border-b-0 rounded-none">
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
