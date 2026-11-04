import { zodResolver } from '@hookform/resolvers/zod'
import { useId, useMemo } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { toast } from 'sonner'
import {
  Button,
  Form,
  FormControl,
  FormField,
  FormInputGroupInput,
  Input,
  InputGroup,
  InputGroupAddon,
  InputGroupText,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetSection,
  SheetTitle,
  Switch,
} from 'ui'
import { CodeBlock } from 'ui-patterns/CodeBlock'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import { z } from 'zod'

import {
  buildLifecycleRequestPreview,
  getOtherRuleIds,
  toRuleValues,
  upsertRule,
  withRule,
} from './BucketLifecycleRules.utils'
import { MIN_NONCURRENT_DAYS } from '@/components/interfaces/Storage/FilesBuckets/BucketVersioningFields/BucketVersioningFields.lifecycle'
import { S3_MAX_NONCURRENT_VERSIONS } from '@/components/interfaces/Storage/FilesBuckets/FilesBucket.schema'
import { DiscardChangesConfirmationDialog } from '@/components/ui-patterns/Dialogs/DiscardChangesConfirmationDialog'
import type { BucketLifecycleRule } from '@/data/storage/bucket-lifecycle-query'
import { useBucketLifecycleUpdateMutation } from '@/data/storage/bucket-lifecycle-update-mutation'
import type { Bucket } from '@/data/storage/buckets-query'
import { useConfirmOnClose } from '@/hooks/ui/useConfirmOnClose'
import { useTrack } from '@/lib/telemetry/track'

/** S3 caps lifecycle rule IDs at 255 characters. */
const MAX_RULE_ID_LENGTH = 255

const createRuleSchema = (otherRuleIds: string[]) =>
  z.object({
    id: z
      .string()
      .trim()
      .max(MAX_RULE_ID_LENGTH, `Must be ${MAX_RULE_ID_LENGTH} characters or fewer`)
      .refine((id) => !otherRuleIds.includes(id), 'Must be unique within the bucket'),
    enabled: z.boolean(),
    noncurrentDays: z
      .union([
        z.literal(''),
        z.number().int().gte(MIN_NONCURRENT_DAYS, `Must be at least ${MIN_NONCURRENT_DAYS} day`),
      ])
      // An explicit boolean keeps TS from inferring a type guard that narrows out ''.
      .refine((days): boolean => days !== '', 'Required'),
    newerNoncurrentVersions: z.union([
      z.literal(''),
      z
        .number()
        .int()
        .gte(1, 'Must be at least 1 version')
        .lte(S3_MAX_NONCURRENT_VERSIONS, `Cannot exceed ${S3_MAX_NONCURRENT_VERSIONS} versions`),
    ]),
  })

type RuleFormValues = z.infer<ReturnType<typeof createRuleSchema>>

const toFieldValue = (rawInput: string): '' | number => {
  const digits = rawInput.replace(/[^0-9]/g, '')
  return digits === '' ? '' : Number(digits)
}

const toFormValues = (rule?: BucketLifecycleRule): RuleFormValues => {
  const values = toRuleValues(rule)
  return {
    id: values.id,
    enabled: values.status === 'Enabled',
    noncurrentDays: values.noncurrentDays,
    newerNoncurrentVersions: values.newerNoncurrentVersions ?? '',
  }
}

interface LifecycleRuleSheetProps {
  projectRef: string
  bucket: Bucket
  rules: BucketLifecycleRule[]
  /** `null` adds a new rule, otherwise the position of the rule being edited. */
  index: number | null
  onClose: () => void
}

/** Mounted only while open, so each rule starts from its own stored values. */
export const LifecycleRuleSheet = ({
  projectRef,
  bucket,
  rules,
  index,
  onClose,
}: LifecycleRuleSheetProps) => {
  const formId = useId()
  const track = useTrack()
  const isNewRule = index === null

  const otherRuleIds = useMemo(() => getOtherRuleIds(rules, index), [rules, index])
  const schema = useMemo(() => createRuleSchema(otherRuleIds), [otherRuleIds])

  const form = useForm<RuleFormValues>({
    resolver: zodResolver(schema),
    defaultValues: toFormValues(index === null ? undefined : rules[index]),
  })

  const {
    confirmOnClose,
    handleOpenChange,
    modalProps: closeConfirmationModalProps,
  } = useConfirmOnClose({
    checkIsDirty: () => form.formState.isDirty,
    onClose,
  })

  const [id, enabled, noncurrentDays, newerNoncurrentVersions] = useWatch({
    control: form.control,
    name: ['id', 'enabled', 'noncurrentDays', 'newerNoncurrentVersions'],
  })

  // Mirrors the body a save sends, including the half-typed values it would reject.
  const draftRule = {
    ...(id.trim().length > 0 ? { id: id.trim() } : {}),
    status: enabled ? 'Enabled' : 'Disabled',
    filter: {},
    noncurrent_version_expiration: {
      noncurrent_days: noncurrentDays === '' ? null : noncurrentDays,
      ...(newerNoncurrentVersions === ''
        ? {}
        : { newer_noncurrent_versions: newerNoncurrentVersions }),
    },
  }
  const requestPreview = buildLifecycleRequestPreview({
    projectRef,
    bucketId: bucket.id,
    rules: withRule(rules, index, draftRule),
  })

  const { mutate: updateLifecycle, isPending } = useBucketLifecycleUpdateMutation({
    onSuccess: (_data, variables) => {
      const status = enabled ? 'Enabled' : 'Disabled'
      track(
        isNewRule
          ? 'storage_bucket_lifecycle_rule_created'
          : 'storage_bucket_lifecycle_rule_updated',
        { ruleStatus: status, ruleCount: variables.rules.length }
      )
      toast.success(isNewRule ? 'Lifecycle rule added' : 'Lifecycle rule updated')
      onClose()
    },
    onError: (error) => {
      toast.error(`Failed to save lifecycle rule: ${error.message}`)
    },
  })

  const handleSubmit = (values: RuleFormValues) => {
    // The schema's refine already rejects an empty age.
    if (values.noncurrentDays === '') return

    updateLifecycle({
      projectRef,
      bucketId: bucket.id,
      rules: upsertRule(rules, index, {
        id: values.id,
        status: values.enabled ? 'Enabled' : 'Disabled',
        noncurrentDays: values.noncurrentDays,
        newerNoncurrentVersions:
          values.newerNoncurrentVersions === '' ? null : values.newerNoncurrentVersions,
      }),
    })
  }

  return (
    <>
      <Sheet open onOpenChange={handleOpenChange}>
        <SheetContent
          showClose={false}
          size="default"
          className="flex h-full w-full max-w-full flex-col gap-0 sm:w-[560px]! sm:max-w-[560px]"
        >
          <SheetHeader>
            <SheetTitle>{isNewRule ? 'Add lifecycle rule' : 'Edit lifecycle rule'}</SheetTitle>
            <SheetDescription>
              Expires noncurrent versions of objects in{' '}
              <span className="text-foreground">{bucket.name}</span>
            </SheetDescription>
          </SheetHeader>

          <Form {...form}>
            <form
              id={formId}
              className="flex-1 overflow-y-auto"
              onSubmit={form.handleSubmit(handleSubmit)}
            >
              <SheetSection className="flex flex-col gap-y-6">
                <FormField
                  control={form.control}
                  name="id"
                  render={({ field }) => (
                    <FormItemLayout
                      layout="vertical"
                      label="Rule ID"
                      labelOptional={<code className="text-xs">id</code>}
                      description="Must be unique within the bucket. Leave blank to have Storage generate one."
                    >
                      <FormControl>
                        <Input {...field} placeholder="e.g. expire-noncurrent-versions" />
                      </FormControl>
                    </FormItemLayout>
                  )}
                />

                <FormField
                  control={form.control}
                  name="enabled"
                  render={({ field }) => (
                    <FormItemLayout
                      layout="flex-row-reverse"
                      // label="Enabled"
                      label={
                        <>
                          Enabled <code className="text-xs ml-1">status</code>
                        </>
                      }
                      description="A disabled rule is kept but not applied"
                    >
                      <FormControl>
                        <Switch
                          aria-label="Enabled"
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItemLayout>
                  )}
                />

                <FormItemLayout
                  layout="vertical"
                  label="Scope"
                  labelOptional={<code className="text-xs">filter</code>}
                  description="Rules apply to every object in the bucket. Prefix filters aren't supported in private alpha."
                >
                  <Input readOnly disabled value="Whole bucket" aria-label="Scope" />
                </FormItemLayout>

                <FormField
                  control={form.control}
                  name="noncurrentDays"
                  render={({ field }) => (
                    <FormItemLayout
                      layout="vertical"
                      label="Noncurrent days"
                      labelOptional={<code className="text-xs">noncurrent_days</code>}
                      description="Days after a version becomes noncurrent before it expires"
                    >
                      <FormControl>
                        <InputGroup>
                          <FormInputGroupInput
                            name={field.name}
                            ref={field.ref}
                            onBlur={field.onBlur}
                            type="number"
                            inputMode="numeric"
                            value={field.value}
                            onChange={(e) => field.onChange(toFieldValue(e.target.value))}
                          />
                          <InputGroupAddon align="inline-end">
                            <InputGroupText>days</InputGroupText>
                          </InputGroupAddon>
                        </InputGroup>
                      </FormControl>
                    </FormItemLayout>
                  )}
                />

                <FormField
                  control={form.control}
                  name="newerNoncurrentVersions"
                  render={({ field }) => (
                    <FormItemLayout
                      layout="vertical"
                      label="Newer noncurrent versions"
                      labelOptional={<code className="text-xs">newer_noncurrent_versions</code>}
                      description="Keeps this many of the newest noncurrent versions, whatever their age. Leave blank to expire every version past the age."
                    >
                      <FormControl>
                        <InputGroup>
                          <FormInputGroupInput
                            name={field.name}
                            ref={field.ref}
                            onBlur={field.onBlur}
                            type="number"
                            inputMode="numeric"
                            placeholder="—"
                            value={field.value}
                            onChange={(e) => field.onChange(toFieldValue(e.target.value))}
                          />
                          <InputGroupAddon align="inline-end">
                            <InputGroupText>versions</InputGroupText>
                          </InputGroupAddon>
                        </InputGroup>
                      </FormControl>
                    </FormItemLayout>
                  )}
                />
              </SheetSection>

              <SheetSection className="flex flex-col gap-y-2 border-t">
                <div className="flex flex-col gap-y-0.5">
                  <p className="text-sm text-foreground">Request</p>
                  <p className="text-sm text-foreground-lighter">
                    Saving replaces the bucket's whole lifecycle configuration, so every rule is
                    sent
                  </p>
                </div>
                <CodeBlock
                  title={`${requestPreview.method} ${requestPreview.path}`}
                  language={requestPreview.body ? 'json' : 'http'}
                  className="border-none"
                  value={
                    requestPreview.body ??
                    'No request body — removes the bucket’s lifecycle configuration'
                  }
                  hideLineNumbers
                  wrapLongLines
                  wrapperClassName="[&_pre]:max-h-80"
                />
              </SheetSection>
            </form>
          </Form>

          <SheetFooter className="mt-auto w-full border-t py-4">
            <Button onClick={confirmOnClose} disabled={isPending}>
              Cancel
            </Button>
            <Button variant="primary" form={formId} type="submit" loading={isPending}>
              {isNewRule ? 'Add rule' : 'Save rule'}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
      <DiscardChangesConfirmationDialog {...closeConfirmationModalProps} />
    </>
  )
}
