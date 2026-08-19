import { AnimatePresence } from 'framer-motion'
import { useEffect, useRef } from 'react'
import { useFormContext, type Control } from 'react-hook-form'
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

import type { BucketVersioningFormValues } from './BucketVersioningFields.schema'
import { ExpirationModeToggle } from './ExpirationModeToggle'
import type { ExpirationMode } from './StorageVersioning.constants'
import { FormSectionCollapse } from '@/components/ui/FormSectionCollapse'

const toFieldValue = (rawInput: string): '' | number => {
  const digits = rawInput.replace(/[^0-9]/g, '')
  return digits === '' ? '' : Number(digits)
}

interface LifecyclePolicySectionProps {
  control: Control<BucketVersioningFormValues>
  hasDays: boolean
  hasVersions: boolean
  mode: ExpirationMode
  onModeChange: (mode: ExpirationMode) => void
}

export const LifecyclePolicySection = ({
  control,
  hasDays,
  hasVersions,
  mode,
  onModeChange,
}: LifecyclePolicySectionProps) => {
  const { setValue } = useFormContext<BucketVersioningFormValues>()
  const hasNoPolicy = !hasDays && !hasVersions
  const hasBothConditions = hasDays && hasVersions

  // S3 requires the noncurrent-days condition on any noncurrent-count rule, so
  // clear an orphaned cap the moment the age field flips from set to unset. Only
  // on the actual flip, not on mount — a bucket opened with a stale
  // `{ days: null, versions: N }` shouldn't silently lose N, and the input stays
  // disabled meanwhile so the value is visible.
  const prevHasDaysRef = useRef(hasDays)
  useEffect(() => {
    const wasSet = prevHasDaysRef.current
    prevHasDaysRef.current = hasDays
    if (wasSet && !hasDays) setValue('max_noncurrent_versions', '', { shouldDirty: true })
  }, [hasDays, setValue])

  return (
    <div className="flex flex-col gap-y-2">
      <div className="flex flex-col gap-y-0.5">
        <p className="text-sm font-medium text-foreground">Lifecycle policy</p>
        <p className="text-sm text-foreground-lighter">Automatically expire noncurrent versions</p>
      </div>

      <FormField
        name="version_expiry_days"
        control={control}
        render={({ field }) => (
          <FormItemLayout
            name="version_expiry_days"
            label="Noncurrent version expiration"
            layout="flex-row-reverse"
          >
            <FormControl>
              <InputGroup>
                <FormInputGroupInput
                  id={field.name}
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
            name="max_noncurrent_versions"
            label="Retained noncurrent versions"
            description={hasDays ? undefined : 'Requires an expiration age to be set.'}
            layout="flex-row-reverse"
            className={hasDays ? undefined : 'opacity-60'}
          >
            <FormControl>
              <InputGroup>
                <FormInputGroupInput
                  id={field.name}
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
            <ExpirationModeToggle mode={mode} onModeChange={onModeChange} />
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
