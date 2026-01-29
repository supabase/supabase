import { zodResolver } from '@hookform/resolvers/zod'
import { useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import * as z from 'zod'

import { useParams } from 'common'
import { Bucket, usePaginatedBucketsQuery } from 'data/storage/buckets-query'
import {
  Button,
  Card,
  CardContent,
  FormControl_Shadcn_,
  FormField_Shadcn_,
  Form_Shadcn_,
  FormMessage_Shadcn_,
  Input_Shadcn_,
  SelectContent_Shadcn_,
  SelectItem_Shadcn_,
  SelectTrigger_Shadcn_,
  SelectValue_Shadcn_,
  Select_Shadcn_,
} from 'ui'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'

const FormSchema = z
  .object({
    bucket: z.string().trim().min(1, 'Select a bucket'),
    prefix: z.string().trim().optional(),
    transitionToIAAfterDays: z.coerce.number().int().min(0).optional(),
    transitionToGlacierAfterDays: z.coerce.number().int().min(0).optional(),
    expireAfterDays: z.coerce.number().int().min(0).optional(),
    abortMultipartAfterDays: z.coerce.number().int().min(0).default(7),
  })
  .superRefine((data, ctx) => {
    const { transitionToIAAfterDays, transitionToGlacierAfterDays, expireAfterDays } = data

    if (
      typeof transitionToIAAfterDays === 'number' &&
      typeof transitionToGlacierAfterDays === 'number' &&
      transitionToGlacierAfterDays <= transitionToIAAfterDays
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'GLACIER_IR transition must be after STANDARD_IA transition',
        path: ['transitionToGlacierAfterDays'],
      })
    }

    // Expiration should always be after the last transition.
    if (typeof expireAfterDays === 'number' && typeof transitionToGlacierAfterDays === 'number') {
      if (expireAfterDays <= transitionToGlacierAfterDays) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Expiration must be after GLACIER_IR transition',
          path: ['expireAfterDays'],
        })
      }
    }

    if (
      typeof expireAfterDays === 'number' &&
      typeof transitionToGlacierAfterDays !== 'number' &&
      typeof transitionToIAAfterDays === 'number'
    ) {
      if (expireAfterDays <= transitionToIAAfterDays) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Expiration must be after STANDARD_IA transition',
          path: ['expireAfterDays'],
        })
      }
    }
  })

type FormValues = z.infer<typeof FormSchema>

/**
 * StorageTieringGenerator
 *
 * Supabase Storage runs on S3-compatible backends, but S3 lifecycle/tiering is configured at the bucket level.
 * Supabase Cloud does not currently apply bucket lifecycle configuration on users' behalf.
 *
 * This UI generates a copy/paste-able AWS S3 LifecycleConfiguration JSON for cost-saving tiering rules.
 */
export const StorageTieringGenerator = () => {
  const { ref: projectRef } = useParams()

  const { data: buckets, isFetching } = usePaginatedBucketsQuery({ projectRef, limit: 1000 })

  const form = useForm<FormValues>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      bucket: '',
      prefix: '',
      transitionToIAAfterDays: 30,
      transitionToGlacierAfterDays: 90,
      expireAfterDays: undefined,
      abortMultipartAfterDays: 7,
    },
  })

  const values = form.watch()

  type LifecycleRule = {
    ID: string
    Status: 'Enabled' | 'Disabled'
    Filter: { Prefix?: string }
    AbortIncompleteMultipartUpload: { DaysAfterInitiation: number }
    Transitions?: Array<{ Days: number; StorageClass: string }>
    Expiration?: { Days: number }
  }

  const lifecycleJson = useMemo(() => {
    const prefix = values.prefix?.trim() || undefined

    // Build a single rule. Keep this minimal and explicit.
    const rule: LifecycleRule = {
      ID: 'supabase-studio-tiering-rule',
      Status: 'Enabled',
      Filter: prefix ? { Prefix: prefix } : {},
      AbortIncompleteMultipartUpload: {
        DaysAfterInitiation: values.abortMultipartAfterDays ?? 7,
      },
    }

    const transitions: Array<{ Days: number; StorageClass: string }> = []
    if (typeof values.transitionToIAAfterDays === 'number') {
      transitions.push({ Days: values.transitionToIAAfterDays, StorageClass: 'STANDARD_IA' })
    }
    if (typeof values.transitionToGlacierAfterDays === 'number') {
      transitions.push({ Days: values.transitionToGlacierAfterDays, StorageClass: 'GLACIER_IR' })
    }
    if (transitions.length > 0) rule.Transitions = transitions

    if (typeof values.expireAfterDays === 'number') {
      rule.Expiration = { Days: values.expireAfterDays }
    }

    return JSON.stringify({ Rules: [rule] }, null, 2)
  }, [
    values.prefix,
    values.transitionToIAAfterDays,
    values.transitionToGlacierAfterDays,
    values.expireAfterDays,
    values.abortMultipartAfterDays,
  ])

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(lifecycleJson)
      toast.success('Copied lifecycle JSON')
    } catch {
      toast.error('Failed to copy')
    }
  }

  const bucketOptions = (buckets?.pages.flatMap((page) => page) ?? []).map((b: Bucket) => ({
    id: b.id,
    name: b.name,
  }))

  return (
    <Card>
      <CardContent className="space-y-6">
        <div>
          <p className="text-sm text-foreground-light">
            Cost-saving storage tiering in AWS is typically configured via S3 bucket lifecycle rules.
            Supabase Cloud doesn’t currently apply lifecycle configuration automatically, but you can use this
            generator to create rules and apply them in AWS.
          </p>
        </div>

        <Form_Shadcn_ {...form}>
          <form className="space-y-4">
            <FormField_Shadcn_
              name="bucket"
              control={form.control}
              render={({ field }) => (
                <FormItemLayout label="Bucket" layout="flex-row-reverse">
                  <FormControl_Shadcn_>
                    <Select_Shadcn_
                      value={field.value}
                      onValueChange={field.onChange}
                      disabled={isFetching}
                    >
                      <SelectTrigger_Shadcn_>
                        <SelectValue_Shadcn_ placeholder={isFetching ? 'Loading…' : 'Select a bucket'} />
                      </SelectTrigger_Shadcn_>
                      <SelectContent_Shadcn_>
                        {bucketOptions.map((b) => (
                          <SelectItem_Shadcn_ key={b.id} value={b.name}>
                            {b.name}
                          </SelectItem_Shadcn_>
                        ))}
                      </SelectContent_Shadcn_>
                    </Select_Shadcn_>
                  </FormControl_Shadcn_>
                  <FormMessage_Shadcn_ />
                </FormItemLayout>
              )}
            />

            <FormField_Shadcn_
              name="prefix"
              control={form.control}
              render={({ field }) => (
                <FormItemLayout
                  label="Prefix (optional)"
                  description="Apply rule only to objects under this prefix (e.g. uploads/, logs/, backups/)."
                  layout="flex-row-reverse"
                >
                  <FormControl_Shadcn_>
                    <Input_Shadcn_ placeholder="uploads/" {...field} />
                  </FormControl_Shadcn_>
                </FormItemLayout>
              )}
            />

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <FormField_Shadcn_
                name="transitionToIAAfterDays"
                control={form.control}
                render={({ field }) => (
                  <FormItemLayout label="Transition to STANDARD_IA after (days)" layout="flex-row-reverse">
                    <FormControl_Shadcn_>
                      <Input_Shadcn_ type="number" min={0} {...field} />
                    </FormControl_Shadcn_>
                    <FormMessage_Shadcn_ />
                  </FormItemLayout>
                )}
              />

              <FormField_Shadcn_
                name="transitionToGlacierAfterDays"
                control={form.control}
                render={({ field }) => (
                  <FormItemLayout label="Transition to GLACIER_IR after (days)" layout="flex-row-reverse">
                    <FormControl_Shadcn_>
                      <Input_Shadcn_ type="number" min={0} {...field} />
                    </FormControl_Shadcn_>
                    <FormMessage_Shadcn_ />
                  </FormItemLayout>
                )}
              />

              <FormField_Shadcn_
                name="expireAfterDays"
                control={form.control}
                render={({ field }) => (
                  <FormItemLayout
                    label="Expire after (days)"
                    description="Optional: permanently delete objects after N days."
                    layout="flex-row-reverse"
                  >
                    <FormControl_Shadcn_>
                      <Input_Shadcn_ type="number" min={0} {...field} value={field.value ?? ''} />
                    </FormControl_Shadcn_>
                    <FormMessage_Shadcn_ />
                  </FormItemLayout>
                )}
              />

              <FormField_Shadcn_
                name="abortMultipartAfterDays"
                control={form.control}
                render={({ field }) => (
                  <FormItemLayout
                    label="Abort incomplete multipart uploads after (days)"
                    description="Prevents cost leakage from abandoned multipart uploads."
                    layout="flex-row-reverse"
                  >
                    <FormControl_Shadcn_>
                      <Input_Shadcn_ type="number" min={0} {...field} />
                    </FormControl_Shadcn_>
                  </FormItemLayout>
                )}
              />
            </div>

            <FormItemLayout
              label="Generated AWS S3 LifecycleConfiguration JSON"
              description="Apply this in AWS S3 (Bucket → Management → Lifecycle rules) or via the AWS CLI/SDK."
              layout="vertical"
            >
              <pre
                data-testid="storage-tiering-json"
                className="text-xs p-3 bg-surface-100 border rounded overflow-auto max-h-72"
              >
                {lifecycleJson}
              </pre>
              <div className="flex items-center gap-2">
                <Button type="default" onClick={onCopy} disabled={!values.bucket}>
                  Copy JSON
                </Button>
              </div>
            </FormItemLayout>
          </form>
        </Form_Shadcn_>
      </CardContent>
    </Card>
  )
}
