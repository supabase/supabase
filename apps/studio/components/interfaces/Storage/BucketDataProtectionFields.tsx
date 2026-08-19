import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useRef, type ReactNode } from 'react'
import { useFormContext, useWatch } from 'react-hook-form'
import {
  DialogSection,
  DialogSectionSeparator,
  FormControl,
  FormField,
  FormInputGroupInput,
  InputGroup,
  InputGroupAddon,
  InputGroupText,
  RadioGroupStacked,
  RadioGroupStackedItem,
  Switch,
} from 'ui'
import { Admonition } from 'ui-patterns/Admonition'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'

import { UpgradeToPro } from '@/components/ui/UpgradeToPro'
import { useSelectedOrganizationQuery } from '@/hooks/misc/useSelectedOrganization'

import { type BucketProtectionFormValues } from './BucketDataProtectionFields.schema'
import {
  getVersioningPlanLimits,
  type BucketVersioningState,
  type ExpirationMode,
} from './StorageProtection.constants'

/**
 * Shared enter/exit for any form section that appears or disappears in
 * response to a toggle further up the form. Height + opacity so pushed
 * siblings slide in place rather than snapping. Wrap the parent with
 * `<AnimatePresence initial={false}>` so a section that's already open on
 * mount doesn't animate in on first paint.
 *
 * `overflow` is kept hidden only while the height is actually animating —
 * otherwise focus rings and outlines on nested inputs would be clipped by
 * the wrapper. `transitionEnd` on the "open" state flips overflow back to
 * visible once the enter animation settles; the "collapsed" state clips
 * again so the shrink is clean.
 */
const Collapse = ({ children }: { children: ReactNode }) => (
  <motion.div
    initial="collapsed"
    animate="open"
    exit="collapsed"
    variants={{
      collapsed: { opacity: 0, height: 0, overflow: 'hidden' },
      open: {
        opacity: 1,
        height: 'auto',
        overflow: 'hidden',
        transitionEnd: { overflow: 'visible' },
      },
    }}
    transition={{ duration: 0.18, ease: [0.4, 0, 0.2, 1] }}
  >
    {children}
  </motion.div>
)

interface BucketDataProtectionFieldsProps {
  /** The bucket's versioning state when the modal opened (unset when creating a new bucket, which is always `disabled`). */
  initialVersioningState?: BucketVersioningState
  /** The bucket's current retention-days setting when the modal opened, for tightening detection. */
  initialRetentionDays?: number | null
  /** The bucket's current max-versions setting when the modal opened, for tightening detection. */
  initialMaxVersions?: number | null
  /** Whether the bucket is public — public + versioned surfaces every version by default. */
  isPublicBucket?: boolean
}

export const BucketDataProtectionFields = ({
  initialVersioningState = 'disabled',
  initialRetentionDays,
  initialMaxVersions,
  isPublicBucket = false,
}: BucketDataProtectionFieldsProps) => {
  const { control, setValue } = useFormContext<BucketProtectionFormValues>()
  const { data: organization, isSuccess: isOrganizationLoaded } = useSelectedOrganizationQuery()

  const initialVersioningEnabled = initialVersioningState === 'enabled'
  // Versioning can't go back to a plain "disabled" state once it's ever been
  // turned on — turning the switch off on a bucket like this suspends it
  // instead, which only stops new noncurrent versions from being created.
  // Nothing already retained is affected, so unlike enabling for the first
  // time, this doesn't need a destructive confirmation.
  const wasEverVersioned = initialVersioningState !== 'disabled'

  const planLimits = getVersioningPlanLimits(organization?.plan.id)
  const isVersioningEnabled = useWatch({ control, name: 'enable_versioning' })
  const retentionDaysRaw = useWatch({ control, name: 'version_expiry_days' })
  const maxVersionsRaw = useWatch({ control, name: 'max_noncurrent_versions' })
  const expirationMode = useWatch({ control, name: 'expiration_mode' })
  // Avoid flashing the "upgrade" prompt before we actually know the org's plan
  const showUpgradePrompt = isOrganizationLoaded && !planLimits

  // Detect a tightening of retention (fewer days OR fewer versions than before)
  // while versioning was already enabled and still is. That's not destructive
  // enough for a typed confirmation, but users should know it can immediately
  // expire retained versions that no longer fit within the new bounds.
  const nextRetentionDays = typeof retentionDaysRaw === 'number' ? retentionDaysRaw : null
  const nextMaxVersions = typeof maxVersionsRaw === 'number' ? maxVersionsRaw : null
  const isTighteningRetention =
    initialVersioningEnabled &&
    isVersioningEnabled &&
    initialRetentionDays !== null &&
    initialRetentionDays !== undefined &&
    nextRetentionDays !== null &&
    nextRetentionDays < initialRetentionDays
  const isTighteningMaxVersions =
    initialVersioningEnabled &&
    isVersioningEnabled &&
    initialMaxVersions !== null &&
    initialMaxVersions !== undefined &&
    nextMaxVersions !== null &&
    nextMaxVersions < initialMaxVersions
  const isTightening = isTighteningRetention || isTighteningMaxVersions

  const hasDays = typeof retentionDaysRaw === 'number' && retentionDaysRaw > 0
  const hasVersions = typeof maxVersionsRaw === 'number' && maxVersionsRaw > 0

  // Turning versioning off never deletes anything by itself — a bucket that's
  // ever had it enabled can only be suspended, not returned to a plain
  // "disabled" state. Suspension is confirmed via an AlertDialog on save
  // (see EditBucketModal), so the toggle itself just flips the value.
  // The two expiration fields come prefilled with sensible starter values
  // (see CreateBucketModal / EditBucketModal defaults) — clearing a field
  // removes that condition from the policy.
  const handleVersioningToggle = (checked: boolean, onChange: (value: boolean) => void) => {
    onChange(checked)
  }

  const handleModeChange = (mode: ExpirationMode) => {
    setValue('expiration_mode', mode, { shouldDirty: true })
  }

  return (
    <>
      <DialogSectionSeparator />

      <DialogSection className="space-y-3">
        <FormField
          name="enable_versioning"
          control={control}
          render={({ field }) => (
            <FormItemLayout
              hideMessage
              name="enable_versioning"
              label="Object versioning"
              description="Keep previous versions of objects when they are overwritten or deleted"
              layout="flex"
            >
              <FormControl>
                <Switch
                  id="enable-versioning"
                  size="large"
                  checked={field.value}
                  disabled={!planLimits}
                  onCheckedChange={(checked) => handleVersioningToggle(checked, field.onChange)}
                />
              </FormControl>
            </FormItemLayout>
          )}
        />

        <AnimatePresence initial={false}>
          {!isVersioningEnabled && wasEverVersioned && (
            // Full-detail explanation moved to the AlertDialog that
            // confirms the save; the inline note is just a heads-up that
            // the switch did something non-obvious.
            <Collapse key="suspension-notice">
              <Admonition
                type="default"
                title={
                  initialVersioningEnabled
                    ? 'Versioning will be suspended once saved'
                    : 'Versioning is suspended on this bucket'
                }
                description="Existing versions and archived files stay put. Re-enable versioning any time."
              />
            </Collapse>
          )}

          {showUpgradePrompt && (
            <Collapse key="upgrade-prompt">
              <UpgradeToPro
                primaryText="Object versioning requires the Pro plan or higher"
                secondaryText="The Free plan doesn't support object versioning or lifecycle policy management. Upgrade to keep previous versions of objects and automatically manage their retention."
                source="storage-object-versioning"
              />
            </Collapse>
          )}

          {!!planLimits && isVersioningEnabled && isPublicBucket && (
            <Collapse key="public-bucket-warning">
              <Admonition
                type="warning"
                title="Public bucket exposes every version"
                description="Anyone with a version ID can fetch a noncurrent version of a public object. To hide noncurrent versions, add an RLS policy on storage.objects that filters where metadata->>'isCurrent' = 'true'."
              />
            </Collapse>
          )}

          {!!planLimits && isVersioningEnabled && isTightening && (
            <Collapse key="tightening-warning">
              <Admonition
                type="warning"
                title="Tightening retention will expire some data"
                description={
                  isTighteningRetention && isTighteningMaxVersions
                    ? 'Noncurrent versions past the shorter retention window, and any beyond the lower per-object cap, will be permanently deleted once saved.'
                    : isTighteningRetention
                      ? 'Noncurrent versions past the shorter retention window will be permanently deleted once saved.'
                      : 'Noncurrent versions beyond the lower per-object cap will be permanently deleted once saved.'
                }
              />
            </Collapse>
          )}

          {!!planLimits && isVersioningEnabled && (
            <Collapse key="lifecycle-policy">
              <LifecyclePolicySection
                control={control}
                hasDays={hasDays}
                hasVersions={hasVersions}
                mode={expirationMode}
                onModeChange={handleModeChange}
              />
            </Collapse>
          )}
        </AnimatePresence>
      </DialogSection>
    </>
  )
}

// ── Lifecycle policy section ─────────────────────────────────────────────

interface LifecyclePolicySectionProps {
  control: ReturnType<typeof useFormContext<BucketProtectionFormValues>>['control']
  hasDays: boolean
  hasVersions: boolean
  mode: ExpirationMode
  onModeChange: (mode: ExpirationMode) => void
}

const LifecyclePolicySection = ({
  control,
  hasDays,
  hasVersions,
  mode,
  onModeChange,
}: LifecyclePolicySectionProps) => {
  const { trigger, setValue } = useFormContext<BucketProtectionFormValues>()
  const hasNoPolicy = !hasDays && !hasVersions
  const hasBothConditions = hasDays && hasVersions

  // The retained-versions cap is only meaningful alongside an expiration age
  // (S3 requires the noncurrent-days condition on any noncurrent-count rule),
  // so clear any orphaned cap value the moment the age field transitions from
  // set to unset. Only fire on the actual flip — not on mount — so a bucket
  // opened with a stale `{ days: null, versions: N }` state doesn't silently
  // lose N (the input is also disabled while `!hasDays`, keeping the
  // orphaned value visible so the user can decide to keep or clear it).
  const prevHasDaysRef = useRef(hasDays)
  useEffect(() => {
    const prevHasDays = prevHasDaysRef.current
    prevHasDaysRef.current = hasDays
    if (prevHasDays && !hasDays) setValue('max_noncurrent_versions', '', { shouldDirty: true })
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
                  {...field}
                  id={field.name}
                  type="number"
                  inputMode="numeric"
                  placeholder="—"
                  value={field.value === '' ? '' : field.value}
                  onChange={(e) => {
                    const raw = e.target.value.replace(/[^0-9]/g, '')
                    field.onChange(raw === '' ? '' : Number(raw))
                    trigger('version_expiry_days')
                  }}
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
            description={
              !hasDays ? 'Requires an expiration age to be set.' : undefined
            }
            layout="flex-row-reverse"
            // Dim the whole row (label + description + input) so the
            // dependency reads at a glance rather than the disabled input
            // sitting under a still-full-strength label.
            className={!hasDays ? 'opacity-60' : undefined}
          >
            <FormControl>
              <InputGroup>
                <FormInputGroupInput
                  {...field}
                  id={field.name}
                  type="number"
                  inputMode="numeric"
                  placeholder="—"
                  disabled={!hasDays}
                  value={field.value === '' ? '' : field.value}
                  onChange={(e) => {
                    const raw = e.target.value.replace(/[^0-9]/g, '')
                    field.onChange(raw === '' ? '' : Number(raw))
                    trigger('max_noncurrent_versions')
                  }}
                />
                <InputGroupAddon align="inline-end">
                  <InputGroupText>versions</InputGroupText>
                </InputGroupAddon>
              </InputGroup>
            </FormControl>
          </FormItemLayout>
        )}
      />

      {/* Join-mode selection only makes sense when both conditions are set —
          with a single condition there's nothing to combine. Vertical layout
          lets the two-line option descriptions span the full section width
          rather than getting squeezed into the number-input column. */}
      <AnimatePresence initial={false}>
        {hasBothConditions && (
          <Collapse key="mode">
            <ExpirationModeToggle mode={mode} onModeChange={onModeChange} />
          </Collapse>
        )}

        {hasNoPolicy && (
          <Collapse key="no-policy">
            <Admonition
              type="warning"
              className="mt-2"
              title="No lifecycle policy"
              description="All noncurrent versions count toward storage usage and incur ongoing costs. Consider setting a lifecycle policy to automatically expire outdated versions."
            />
          </Collapse>
        )}
      </AnimatePresence>
    </div>
  )
}

// ── Both / either mode selection ─────────────────────────────────────────

interface ExpirationModeToggleProps {
  mode: ExpirationMode
  onModeChange: (mode: ExpirationMode) => void
}

const ExpirationModeToggle = ({ mode, onModeChange }: ExpirationModeToggleProps) => (
  <div className="mt-2 flex w-full flex-col gap-y-2">
    <label htmlFor="expiration_mode" className="text-sm text-foreground">
      Expire a noncurrent version when
    </label>
    <RadioGroupStacked
      id="expiration_mode"
      className="w-full"
      value={mode}
      onValueChange={(value: ExpirationMode) => {
        if (value) onModeChange(value)
      }}
    >
      <RadioGroupStackedItem
        value="and"
        label="Both conditions are met"
        description="It exceeds both the age limit and the retained-versions cap."
      />
      <RadioGroupStackedItem
        value="or"
        label="Either condition is met"
        description="It exceeds either the age limit or the retained-versions cap."
      />
    </RadioGroupStacked>
  </div>
)
