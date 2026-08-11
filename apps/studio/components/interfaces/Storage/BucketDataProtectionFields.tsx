import { ChevronRight } from 'lucide-react'
import { useState } from 'react'
import { useFormContext, useWatch } from 'react-hook-form'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
  DialogSection,
  DialogSectionSeparator,
  FormControl,
  FormField,
  FormInputGroupInput,
  InputGroup,
  InputGroupAddon,
  InputGroupText,
  Switch,
  cn,
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

  // Derived state for the sentence builder and collapsible
  const hasDays = typeof retentionDaysRaw === 'number' && retentionDaysRaw > 0
  const hasVersions = typeof maxVersionsRaw === 'number' && maxVersionsRaw > 0
  const hasBothConditions = hasDays && hasVersions

  // Turning versioning off never deletes anything by itself — a bucket that's
  // ever had it enabled can only be suspended, not returned to a plain
  // "disabled" state, so nothing needs a destructive confirmation here.
  // Both expiration fields default to empty (no limit) — the user opts in to
  // each condition deliberately rather than receiving prefilled defaults.
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

        {!isVersioningEnabled && wasEverVersioned && (
          <Admonition
            type="default"
            title={
              initialVersioningEnabled
                ? 'Versioning will be suspended once saved'
                : 'Versioning is suspended on this bucket'
            }
            description="New noncurrent versions won't be created, but every version and soft-deleted file this bucket is already retaining stays exactly where it is until it's deleted or a lifecycle policy expires it. You can re-enable versioning at any time."
          />
        )}

        {showUpgradePrompt && (
          <UpgradeToPro
            primaryText="Object versioning requires the Pro plan or higher"
            secondaryText="The Free plan doesn't support object versioning or lifecycle policy management. Upgrade to keep previous versions of objects and automatically manage their retention."
            source="storage-object-versioning"
          />
        )}

        {!!planLimits && isVersioningEnabled && isPublicBucket && (
          <Admonition
            type="warning"
            title="Public bucket exposes every version"
            description="Anyone with a version ID can fetch a noncurrent version of a public object. To hide noncurrent versions, add an RLS policy on storage.objects that filters where metadata->>'isCurrent' = 'true'."
          />
        )}

        {!!planLimits && isVersioningEnabled && isTightening && (
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
        )}

        {!!planLimits && isVersioningEnabled && (
          <ExpirationPolicySection
            control={control}
            hasDays={hasDays}
            hasVersions={hasVersions}
            hasBothConditions={hasBothConditions}
            days={hasDays ? (retentionDaysRaw as number) : 0}
            versions={hasVersions ? (maxVersionsRaw as number) : 0}
            mode={expirationMode}
            onModeChange={handleModeChange}
          />
        )}
      </DialogSection>
    </>
  )
}

// ── Expiration policy section ────────────────────────────────────────────

interface ExpirationPolicySectionProps {
  control: ReturnType<typeof useFormContext<BucketProtectionFormValues>>['control']
  hasDays: boolean
  hasVersions: boolean
  hasBothConditions: boolean
  days: number
  versions: number
  mode: ExpirationMode
  onModeChange: (mode: ExpirationMode) => void
}

const ExpirationPolicySection = ({
  control,
  hasDays,
  hasVersions,
  hasBothConditions,
  days,
  versions,
  mode,
  onModeChange,
}: ExpirationPolicySectionProps) => {
  const hasNoPolicy = !hasDays && !hasVersions

  return (
    <div className="flex flex-col gap-y-4">
      <div>
        <p className="text-sm font-medium text-foreground mb-1.5">Expiration policy</p>
        <ExpirationSentence
          hasDays={hasDays}
          hasVersions={hasVersions}
          days={days}
          versions={versions}
          mode={mode}
          onModeChange={onModeChange}
        />
      </div>

      <div className="flex flex-col gap-y-2">
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
                    type="number"
                    min={1}
                    placeholder="—"
                    value={field.value === '' ? '' : field.value}
                    onChange={(e) => {
                      const raw = e.target.value.replace(/[^0-9]/g, '')
                      field.onChange(raw === '' ? '' : Number(raw))
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
              layout="flex-row-reverse"
            >
              <FormControl>
                <InputGroup>
                  <FormInputGroupInput
                    {...field}
                    type="number"
                    min={1}
                    placeholder="—"
                    value={field.value === '' ? '' : field.value}
                    onChange={(e) => {
                      const raw = e.target.value.replace(/[^0-9]/g, '')
                      field.onChange(raw === '' ? '' : Number(raw))
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
      </div>

      {hasNoPolicy && (
        <Admonition
          type="warning"
          title="No expiration policy"
          description="All noncurrent versions count toward storage usage and incur ongoing costs. Consider setting an expiration policy to automatically remove outdated versions."
        />
      )}

      {!hasNoPolicy && (
        <ExpirationExplainer
          hasDays={hasDays}
          hasVersions={hasVersions}
          days={days}
          versions={versions}
          mode={mode}
        />
      )}
    </div>
  )
}

// ── Sentence builder ─────────────────────────────────────────────────────

interface ExpirationSentenceProps {
  hasDays: boolean
  hasVersions: boolean
  days: number
  versions: number
  mode: ExpirationMode
  onModeChange: (mode: ExpirationMode) => void
}

const ExpirationSentence = ({
  hasDays,
  hasVersions,
  days,
  versions,
  mode,
  onModeChange,
}: ExpirationSentenceProps) => {
  if (!hasDays && !hasVersions) {
    return (
      <p className="text-sm text-foreground-lighter leading-relaxed">
        No expiration policy configured. Noncurrent versions will be retained indefinitely.
      </p>
    )
  }

  if (hasDays && !hasVersions) {
    return (
      <p className="text-sm text-foreground-lighter leading-relaxed">
        Remove noncurrent versions older than{' '}
        <span className="text-foreground font-medium">{days} days</span>. No version count limit.
      </p>
    )
  }

  if (!hasDays && hasVersions) {
    return (
      <p className="text-sm text-foreground-lighter leading-relaxed">
        Keep the newest <span className="text-foreground font-medium">{versions}</span> noncurrent
        versions per object. No age limit.
      </p>
    )
  }

  return (
    <p className="text-sm text-foreground-lighter leading-[1.7]">
      Remove noncurrent versions when <InlineModeToggle mode={mode} onModeChange={onModeChange} />{' '}
      conditions are met: older than{' '}
      <span className="text-foreground font-medium">{days} days</span> and more than{' '}
      <span className="text-foreground font-medium">{versions}</span> versions.
    </p>
  )
}

// ── Inline both/either toggle ────────────────────────────────────────────

interface InlineModeToggleProps {
  mode: ExpirationMode
  onModeChange: (mode: ExpirationMode) => void
}

const InlineModeToggle = ({ mode, onModeChange }: InlineModeToggleProps) => {
  const isBoth = mode === 'and'

  return (
    <button
      type="button"
      className="inline-flex items-center rounded border border-strong bg-surface-200 p-px align-baseline"
      onClick={() => onModeChange(isBoth ? 'or' : 'and')}
    >
      <span
        className={cn(
          'rounded-sm px-1.5 py-px text-xs font-medium transition-colors',
          isBoth ? 'bg-brand text-background-200' : 'text-foreground-muted'
        )}
      >
        both
      </span>
      <span
        className={cn(
          'rounded-sm px-1.5 py-px text-xs font-medium transition-colors',
          !isBoth ? 'bg-brand text-background-200' : 'text-foreground-muted'
        )}
      >
        either
      </span>
    </button>
  )
}

// ── Collapsible explainer ────────────────────────────────────────────────

interface ExpirationExplainerProps {
  hasDays: boolean
  hasVersions: boolean
  days: number
  versions: number
  mode: ExpirationMode
}

const ExpirationExplainer = ({
  hasDays,
  hasVersions,
  days,
  versions,
  mode,
}: ExpirationExplainerProps) => {
  const [isOpen, setIsOpen] = useState(false)
  const hasBothConditions = hasDays && hasVersions

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <button
          type="button"
          className="flex items-center gap-1.5 text-foreground-muted hover:text-foreground-lighter transition-colors"
        >
          <ChevronRight size={12} className={cn('transition-transform', isOpen && 'rotate-90')} />
          <span className="text-xs">See how this works</span>
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="mt-2.5 rounded-md border border-default bg-surface-100 p-3">
          <p className="mb-1.5 text-xs font-medium uppercase tracking-wider text-foreground-muted">
            Example
          </p>
          <p className="text-xs leading-relaxed text-foreground-lighter">
            <ExpirationExplainerBody
              hasDays={hasDays}
              hasVersions={hasVersions}
              hasBothConditions={hasBothConditions}
              days={days}
              versions={versions}
              mode={mode}
            />
          </p>
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}

const ExpirationExplainerBody = ({
  hasDays,
  hasVersions,
  hasBothConditions,
  days,
  versions,
  mode,
}: {
  hasDays: boolean
  hasVersions: boolean
  hasBothConditions: boolean
  days: number
  versions: number
  mode: ExpirationMode
}) => {
  if (hasDays && !hasVersions) {
    return (
      <>
        A noncurrent version aged <span className="text-foreground-light">{days + 1} days</span>{' '}
        exceeds the {days}-day limit, so the system permanently deletes it. A version at{' '}
        <span className="text-foreground-light">{Math.max(1, days - 1)} days</span> stays within the
        limit, so the system keeps it.
      </>
    )
  }

  if (!hasDays && hasVersions) {
    return (
      <>
        When a file accumulates{' '}
        <span className="text-foreground-light">{versions + 1} noncurrent versions</span>, the
        system keeps the newest {versions} and permanently deletes the oldest one regardless of its
        age.
      </>
    )
  }

  if (hasBothConditions) {
    const isBoth = mode === 'and'

    if (isBoth) {
      return (
        <>
          With <span className="text-foreground-light">{versions + 1} noncurrent versions</span> and
          the oldest at <span className="text-foreground-light">{days + 1} days</span>, the system
          permanently deletes it because it exceeds both the {versions}-version cap and the {days}
          -day limit. If the oldest version were only{' '}
          <span className="text-foreground-light">{Math.max(1, days - 1)} days</span> old, the
          system would keep it because both conditions must be met before a version is removed.
        </>
      )
    }

    return (
      <>
        With <span className="text-foreground-light">{versions + 1} noncurrent versions</span> and
        the oldest at <span className="text-foreground-light">{Math.max(1, days - 1)} days</span>,
        the system permanently deletes it because it exceeds the {versions}-version cap, even though
        it is within the {days}-day limit. Similarly, a file with only{' '}
        <span className="text-foreground-light">{versions} versions</span> where the oldest is{' '}
        <span className="text-foreground-light">{days + 1} days</span> old also has that version
        deleted because it exceeds the age limit. Either condition alone triggers removal.
      </>
    )
  }

  return null
}
