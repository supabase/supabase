import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/router'
import { SubmitHandler, useForm } from 'react-hook-form'
import { toast } from 'sonner'
import z from 'zod'

import { useParams } from 'common'
import { InlineLink } from 'components/ui/InlineLink'
import { useDatabaseExtensionEnableMutation } from 'data/database-extensions/database-extension-enable-mutation'
import { useAnalyticsBucketCreateMutation } from 'data/storage/analytics-bucket-create-mutation'
import { useAnalyticsBucketsQuery } from 'data/storage/analytics-buckets-query'
import { useIcebergWrapperCreateMutation } from 'data/storage/iceberg-wrapper-create-mutation'
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
import { Admonition } from 'ui-patterns'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import { BUCKET_TYPES } from '../Storage.constants'
import { useIcebergWrapperExtension } from './AnalyticsBucketDetails/useIcebergWrapper'
import {
  reservedPrefixes,
  reservedSuffixes,
  validBucketNameRegex,
} from './CreateAnalyticsBucketModal.utils'

const FormSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(3, 'Bucket name should be at least 3 characters')
      .max(63, 'Bucket name should be up to 63 characters')
      .refine(
        (value) => !value.endsWith(' '),
        'The name of the bucket cannot end with a whitespace'
      )
      .refine(
        (value) => value !== 'public',
        '"public" is a reserved name. Please choose another name'
      ),
  })
  .superRefine((data, ctx) => {
    if (reservedPrefixes.test(data.name)) {
      const [match] = data.name.match(reservedPrefixes) ?? []
      return ctx.addIssue({
        path: ['name'],
        code: z.ZodIssueCode.custom,
        message: `Bucket name cannot start with "${match}"`,
      })
    }

    if (reservedSuffixes.test(data.name)) {
      const [match] = data.name.match(reservedSuffixes) ?? []
      return ctx.addIssue({
        path: ['name'],
        code: z.ZodIssueCode.custom,
        message: `Bucket name cannot end with "${match}"`,
      })
    }

    if (/[A-Z]/.test(data.name)) {
      return ctx.addIssue({
        path: ['name'],
        code: z.ZodIssueCode.custom,
        message: 'Bucket name can only be lowercase characters',
      })
    }

    if (!validBucketNameRegex.test(data.name)) {
      if (!/^[a-z0-9]/.test(data.name)) {
        return ctx.addIssue({
          path: ['name'],
          code: z.ZodIssueCode.custom,
          message: 'Bucket name must start with a lowercase letter or number.',
        })
      }

      if (!/[a-z0-9]$/.test(data.name)) {
        return ctx.addIssue({
          path: ['name'],
          code: z.ZodIssueCode.custom,
          message: 'Bucket name must end with a lowercase letter or number.',
        })
      }

      const [match] = data.name.match(/[^a-z0-9-]/) ?? []
      return ctx.addIssue({
        path: ['name'],
        code: z.ZodIssueCode.custom,
        message: !!match
          ? `Bucket name cannot contain the "${match}" character`
          : 'Bucket name contains an invalid special character',
      })
    }
  })

const formId = 'create-analytics-storage-bucket-form'

export type CreateAnalyticsBucketForm = z.infer<typeof FormSchema>

interface CreateAnalyticsBucketModalProps {
  open: boolean
  onOpenChange: (value: boolean) => void
}

export const CreateAnalyticsBucketModal = ({
  open,
  onOpenChange,
}: CreateAnalyticsBucketModalProps) => {
  const router = useRouter()
  const { ref } = useParams()
  const { data: org } = useSelectedOrganizationQuery()
  const { data: project } = useSelectedProjectQuery()
  const { extension: wrappersExtension, state: wrappersExtensionState } =
    useIcebergWrapperExtension()

  const { data: buckets = [] } = useAnalyticsBucketsQuery({ projectRef: ref })
  const wrappersExtenstionNeedsUpgrading = wrappersExtensionState === 'needs-upgrade'

  const { mutate: sendEvent } = useSendEventMutation()

  const { mutateAsync: createAnalyticsBucket, isPending: isCreatingAnalyticsBucket } =
    useAnalyticsBucketCreateMutation({
      // [Joshen] Silencing the error here as it's being handled in onSubmit
      onError: () => {},
    })

  const { mutateAsync: createIcebergWrapper, isPending: isCreatingIcebergWrapper } =
    useIcebergWrapperCreateMutation()

  const { mutateAsync: enableExtension, isPending: isEnablingExtension } =
    useDatabaseExtensionEnableMutation()

  const config = BUCKET_TYPES['analytics']
  const isCreating = isEnablingExtension || isCreatingIcebergWrapper || isCreatingAnalyticsBucket

  const form = useForm<CreateAnalyticsBucketForm>({
    resolver: zodResolver(FormSchema),
    defaultValues: { name: '' },
  })

  const onSubmit: SubmitHandler<CreateAnalyticsBucketForm> = async (values) => {
    if (!ref) return console.error('Project ref is required')
    if (!project) return console.error('Project details is required')
    if (!wrappersExtension) return console.error('Unable to find wrappers extension')

    const hasExistingBucket = buckets.some((x) => x.name === values.name)
    if (hasExistingBucket) return toast.error('Bucket name already exists')

    try {
      await createAnalyticsBucket({
        projectRef: ref,
        bucketName: values.name,
      })

      if (wrappersExtensionState === 'not-installed') {
        await enableExtension({
          projectRef: project?.ref,
          connectionString: project?.connectionString,
          name: wrappersExtension.name,
          schema: wrappersExtension.schema ?? 'extensions',
          version: wrappersExtension.default_version,
        })
      }

      await createIcebergWrapper({ bucketName: values.name })

      sendEvent({
        action: 'storage_bucket_created',
        properties: { bucketType: 'analytics' },
        groups: { project: ref ?? 'Unknown', organization: org?.slug ?? 'Unknown' },
      })

      form.reset()
      toast.success(`Created bucket “${values.name}”`)
      onOpenChange(false)
    } catch (error: any) {
      toast.error(`Failed to create bucket: ${error.message}`)
    }
  }

  const handleClose = () => {
    form.reset()
    onOpenChange(false)
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(open) => {
        if (!open) handleClose()
      }}
    >
      <DialogContent size="medium" aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle>Create {config.singularName} bucket</DialogTitle>
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
                    className="p-5"
                    label="Bucket name"
                    labelOptional="Cannot be changed after creation"
                    description="Must be between 3–63 characters. Only lowercase letters, numbers, and hyphens are allowed."
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

              {wrappersExtenstionNeedsUpgrading ? (
                <Admonition
                  type="warning"
                  className="border-x-0 border-b-0 rounded-none"
                  title="Wrappers extension must be updated for Iceberg Wrapper support"
                >
                  <p className="prose max-w-full text-sm !leading-normal">
                    Update the <code className="text-code-inline">wrappers</code> extension by
                    upgrading your project from your{' '}
                    <InlineLink href={`/project/${ref}/settings/infrastructure`}>
                      project settings
                    </InlineLink>{' '}
                    before creating an Analytics bucket.{' '}
                    <InlineLink href={`${DOCS_URL}/guides/database/extensions/wrappers/iceberg`}>
                      Learn more
                    </InlineLink>
                    .
                  </p>
                </Admonition>
              ) : (
                <Admonition type="default" className="border-x-0 border-b-0 rounded-none">
                  <p className="!leading-normal">
                    Supabase will install the{' '}
                    {wrappersExtensionState !== 'installed' ? 'Wrappers extension and ' : ''}
                    Iceberg Wrapper integration on your behalf.{' '}
                    <InlineLink href={`${DOCS_URL}/guides/database/extensions/wrappers/iceberg`}>
                      Learn more
                    </InlineLink>
                    .
                  </p>
                </Admonition>
              )}
            </DialogSection>
          </form>
        </Form_Shadcn_>

        <DialogFooter>
          <Button type="default" disabled={isCreating} onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            form={formId}
            htmlType="submit"
            loading={isCreating}
            disabled={wrappersExtenstionNeedsUpgrading || isCreating}
          >
            Create bucket
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
