import { useParams } from 'common'
import { AnimatePresence } from 'framer-motion'
import { useEffect, useRef } from 'react'
import type { UseFormReturn } from 'react-hook-form'
import {
  FormControl,
  FormField,
  FormInputGroupInput,
  InputGroup,
  InputGroupAddon,
  InputGroupText,
} from 'ui'
import { Admonition } from 'ui-patterns/Admonition'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import { ShimmeringLoader } from 'ui-patterns/ShimmeringLoader'

import type { BucketFormValues } from '../FilesBucket.schema'
import { ExpirationModeToggle } from './ExpirationModeToggle'
import type { ExpirationMode } from '@/components/interfaces/Storage/StorageVersioning.constants'
import { AlertError } from '@/components/ui/AlertError'
import { FormSectionCollapse } from '@/components/ui/FormSectionCollapse'

const toFieldValue = (rawInput: string): '' | number => {
  const digits = rawInput.replace(/[^0-9]/g, '')
  return digits === '' ? '' : Number(digits)
}

const SectionHeading = () => (
  <div className="flex flex-col gap-y-0.5">
    <p className="text-sm font-medium text-foreground">Lifecycle policy</p>
    <p className="text-sm text-foreground-lighter">Automatically expire noncurrent versions</p>
  </div>
)

interface LifecyclePolicySectionProps {
  form: UseFormReturn<BucketFormValues>
  hasDays: boolean
  hasVersions: boolean
  mode: ExpirationMode
  /** The stored policy is still in flight, so there is nothing truthful to show yet. */
  isLoading?: boolean
  /** The stored policy holds rules these fields cannot represent, let alone round-trip. */
  isUnsupported?: boolean
  /** The stored policy could not be read, so the fields would be showing a guess. */
  error?: { message: string } | null
}

export const LifecyclePolicySection = ({
  form,
  hasDays,
  hasVersions,
  mode,
  isLoading = false,
  isUnsupported = false,
  error,
}: LifecyclePolicySectionProps) => {
  const { ref } = useParams()
  const { control, setValue } = form
  const hasNoPolicy = !hasDays && !hasVersions
  const hasBothConditions = hasDays && hasVersions

  // S3 requires a noncurrent-days condition on any noncurrent-count rule. Only on the
  // actual flip, not on mount, so a bucket opened with a stale cap doesn't silently lose it.
  const prevHasDaysRef = useRef(hasDays)
  useEffect(() => {
    const wasSet = prevHasDaysRef.current
    prevHasDaysRef.current = hasDays
    if (wasSet && !hasDays) setValue('max_noncurrent_versions', '', { shouldDirty: true })
  }, [hasDays, setValue])

  if (isLoading) {
    return (
      <div className="flex flex-col gap-y-2" aria-busy="true" aria-label="Loading lifecycle policy">
        <SectionHeading />
        <ShimmeringLoader className="h-9 py-0" />
        <ShimmeringLoader className="h-9 py-0" delayIndex={1} />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col gap-y-2">
        <SectionHeading />
        <AlertError
          error={error}
          subject="Failed to retrieve the lifecycle policy"
          projectRef={ref}
        />
      </div>
    )
  }

  if (isUnsupported) {
    return (
      <div className="flex flex-col gap-y-2">
        <SectionHeading />
        <Admonition
          type="default"
          title="Lifecycle policy set outside the dashboard"
          description="It uses rules the dashboard cannot show, so saving leaves the policy as it is. Manage it with the S3 or Storage API."
        />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-y-2">
      <SectionHeading />

      <FormField
        name="version_expiry_days"
        control={control}
        render={({ field }) => (
          <FormItemLayout label="Noncurrent version expiration" layout="flex-row-reverse">
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
                  <InputGroupText>days</InputGroupText>
                </InputGroupAddon>
              </InputGroup>
            </FormControl>
          </FormItemLayout>
        )}
      />

      <FormField
        name="max_noncurrent_versions"
        control={control}
        render={({ field }) => (
          <FormItemLayout
            label="Retained noncurrent versions"
            description={hasDays ? undefined : 'Requires an expiration age to be set.'}
            layout="flex-row-reverse"
            className={hasDays ? undefined : 'opacity-60'}
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
                  disabled={!hasDays}
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

      <AnimatePresence initial={false}>
        {hasBothConditions && (
          <FormSectionCollapse key="mode">
            <ExpirationModeToggle
              mode={mode}
              onModeChange={(value) => setValue('expiration_mode', value, { shouldDirty: true })}
            />
          </FormSectionCollapse>
        )}

        {hasNoPolicy && (
          <FormSectionCollapse key="no-policy">
            <Admonition
              type="warning"
              className="mt-2"
              title="No lifecycle policy"
              description="Lifecycle policies are recommended to manage and reduce storage costs for noncurrent versions."
            />
          </FormSectionCollapse>
        )}
      </AnimatePresence>
    </div>
  )
}
