import { ChevronDownIcon, ScaleIcon } from 'lucide-react'
import { useId } from 'react'
import { Control, useWatch } from 'react-hook-form'
import { Badge, Card, cn, FormField, RadioGroupStacked, RadioGroupStackedItem } from 'ui'

import { MEMBER_BOUND_GRANT_NOTICE } from '../Consent/AuthorizingAsCard'
import { ScopeGroupCard } from '../Consent/ScopeGroupCard'
import {
  AuthorizationValues,
  getAllProjectsRowLabel,
  getResultingGrantDescription,
} from './Authorization.utils'
import { FormSchemaWithOAuthAppScopedGrants } from './PublishAppSidePanel.utils'
import { INTERSTITIAL_WIDTH_CLASS } from '@/components/layouts/InterstitialLayout'

const APPROVER_OPTIONS = {
  looser: {
    value: 'organization',
    label: 'An owner, once for the whole organization',
    description: 'One shared grant for everyone in the org.',
  },
  stricter: {
    value: 'member',
    label: 'Each member, for themselves',
    description: 'A grant per person, never more than they can already do.',
  },
} as const

const PROJECT_REACH_OPTIONS = {
  looser: {
    value: 'all',
    label: 'All projects',
    description: 'Every project, including ones created later. No choice shown.',
  },
  stricter: {
    value: 'choose',
    label: 'Let them choose',
    description:
      "People connecting pick all projects or specific ones. Requests to projects they didn't pick return 403.",
  },
} as const

interface PermanentChoiceOption {
  value: string
  label: string
  description: string
}

const toChoiceValue = (
  options: { looser: PermanentChoiceOption; stricter: PermanentChoiceOption },
  isStricter: boolean
) => (isStricter ? options.stricter.value : options.looser.value)

interface ChoiceBadge {
  label: string
  variant?: 'default' | 'warning'
}

interface PermanentChoiceItemProps {
  option: PermanentChoiceOption
  badge?: ChoiceBadge
  isDisabled?: boolean
}

const PermanentChoiceItem = ({ option, badge, isDisabled = false }: PermanentChoiceItemProps) => {
  const id = useId()
  const titleId = `${id}-title`
  const descriptionId = `${id}-description`
  const badgeId = `${id}-badge`

  const describedBy = [descriptionId, badge === undefined ? undefined : badgeId]
    .filter(Boolean)
    .join(' ')

  return (
    <RadioGroupStackedItem
      value={option.value}
      disabled={isDisabled}
      aria-labelledby={titleId}
      aria-describedby={describedBy}
      label={
        <span className="flex flex-col gap-y-0.5">
          <span className="flex items-center gap-x-2">
            <span id={titleId}>{option.label}</span>
            {badge !== undefined && (
              <Badge id={badgeId} variant={badge.variant}>
                {badge.label}
              </Badge>
            )}
          </span>
          <span id={descriptionId} className="text-sm text-foreground-lighter text-balance">
            {option.description}
          </span>
        </span>
      }
    />
  )
}

interface PermanentChoiceFieldProps {
  legend: string
  looser: PermanentChoiceOption
  stricter: PermanentChoiceOption
  value: string
  /** The value currently persisted on the app, or undefined for an app that has never been saved. */
  savedValue?: string
  onChange: (value: string) => void
}

const PermanentChoiceField = ({
  legend,
  looser,
  stricter,
  value,
  savedValue,
  onChange,
}: PermanentChoiceFieldProps) => {
  const isLockedToStricter = savedValue === stricter.value

  const getLooserBadge = (): ChoiceBadge | undefined => {
    if (isLockedToStricter) return { label: "Can't switch back", variant: 'warning' }
    if (savedValue === looser.value) return { label: 'Current' }
    return undefined
  }

  const stricterBadge: ChoiceBadge =
    savedValue === stricter.value
      ? { label: 'Current' }
      : { label: 'Permanent', variant: 'warning' }

  return (
    <fieldset>
      <legend className="text-sm text-foreground mb-2">{legend}</legend>
      <RadioGroupStacked
        value={value}
        onValueChange={(nextValue) => {
          if (nextValue) onChange(nextValue)
        }}
      >
        <PermanentChoiceItem
          option={looser}
          badge={getLooserBadge()}
          isDisabled={isLockedToStricter}
        />
        <PermanentChoiceItem option={stricter} badge={stricterBadge} />
      </RadioGroupStacked>
    </fieldset>
  )
}

interface AuthorizationPreviewProps {
  appName: string
  scopes: string[]
  isMemberBoundGrant: boolean
  isProjectScopingEnabled: boolean
  organizationName?: string
  savedValues?: AuthorizationValues
}

const AuthorizationPreview = ({
  appName,
  scopes,
  isMemberBoundGrant,
  isProjectScopingEnabled,
  organizationName,
  savedValues,
}: AuthorizationPreviewProps) => {
  const hasUnsavedChanges =
    savedValues !== undefined &&
    (savedValues.member_bound_grant !== isMemberBoundGrant ||
      savedValues.project_scoping !== isProjectScopingEnabled)

  return (
    <section className="overflow-hidden rounded-lg border">
      <h2 className="sr-only">Preview of the consent screen as seen by your application users</h2>
      <div className="relative h-80 overflow-hidden bg-studio">
        {/*
            The crop stays fixed across both states so that turning on project scoping only adds
            the Projects section below Organization, the way the real screen does, rather than
            shifting everything above it.
          */}
        <div className="pointer-events-none absolute inset-x-0 -top-16 flex justify-center px-6 opacity-60 select-none">
          <Card className={cn('w-full', INTERSTITIAL_WIDTH_CLASS)}>
            <div className="flex flex-col items-center gap-1 px-6 pt-6 pb-5 text-center">
              <p className="text-lg font-medium tracking-tight text-foreground">
                Authorize {appName}
              </p>
              <p className="text-sm text-foreground-lighter">
                This application wants to access your Supabase Account
              </p>
            </div>

            <div className="flex flex-col gap-5 px-6 pb-6">
              <div className="flex flex-col gap-2">
                <div className="divide-y rounded-md border bg-surface-75 px-4">
                  <div className="flex items-center justify-between gap-4 py-2.5 text-xs">
                    <span className="shrink-0 text-foreground-light">Authorizing as</span>
                    <span className="min-w-0 truncate text-foreground">you@example.com</span>
                  </div>
                  {!isProjectScopingEnabled && (
                    <div className="flex items-center justify-between gap-4 py-2.5 text-xs">
                      <span className="shrink-0 text-foreground-light">Projects</span>
                      <span className="min-w-0 truncate text-foreground">
                        {getAllProjectsRowLabel(isMemberBoundGrant, organizationName)}
                      </span>
                    </div>
                  )}
                </div>
                {isMemberBoundGrant && (
                  <p className="text-xs text-foreground-lighter">{MEMBER_BOUND_GRANT_NOTICE}</p>
                )}
              </div>

              <div className="flex flex-col gap-2">
                <p className="text-sm text-foreground">Organization</p>
                <div className="flex items-center justify-between gap-2 rounded-md border bg-control px-3 py-1.5 text-sm text-foreground">
                  <span className="truncate">{organizationName ?? 'Your organization'}</span>
                  <ChevronDownIcon size={14} className="shrink-0 text-foreground-lighter" />
                </div>
              </div>

              {isProjectScopingEnabled && (
                <div className="flex flex-col gap-2">
                  <p className="text-sm text-foreground">Projects</p>
                  <span className="flex items-center gap-2 py-1 text-sm text-foreground">
                    <span className="size-4 rounded-xs border border-strong" />
                    All current and future projects
                  </span>
                  <div className="flex items-center justify-between gap-2 rounded-md border bg-control px-3 py-1.5 text-sm text-foreground-lighter">
                    <span className="truncate">Select projects...</span>
                    <ChevronDownIcon size={14} className="shrink-0" />
                  </div>
                </div>
              )}

              <div className="flex flex-col gap-3">
                <p className="text-sm text-foreground">Permissions requested</p>
                {scopes.length > 0 && <ScopeGroupCard scopes={scopes} />}
                <p className="text-xs text-foreground-lighter">
                  Authorizing {appName} grants it access to the permissions
                  {isProjectScopingEnabled ? <span>{' and selected projects '}</span> : ' '}
                  <span>above.</span>
                </p>
              </div>
            </div>
          </Card>
        </div>

        <div className="pointer-events-none absolute inset-x-0 top-0 h-16 bg-linear-to-b from-background to-transparent" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-linear-to-t from-background to-transparent" />

        <Badge variant="success" className="absolute top-3 left-3">
          Preview
        </Badge>
      </div>

      <div className="flex gap-x-2 border-t bg-surface-100 px-4 py-3">
        <ScaleIcon size={14} className="mt-0.5 shrink-0 text-foreground-lighter" />
        <div className="min-w-0">
          <p className="text-sm">
            <span className="text-foreground-lighter">Resulting grant: </span>
            <span className="text-foreground-light">
              {getResultingGrantDescription(isMemberBoundGrant, isProjectScopingEnabled)}
            </span>
          </p>
          {hasUnsavedChanges && (
            <p className="text-sm text-foreground-lighter">
              Today:{' '}
              {getResultingGrantDescription(
                savedValues.member_bound_grant,
                savedValues.project_scoping
              )}
            </p>
          )}
        </div>
      </div>
    </section>
  )
}

export interface AuthorizationSectionProps {
  control: Control<FormSchemaWithOAuthAppScopedGrants>
  /** The values persisted on the app, or undefined while publishing a new app. */
  savedValues?: AuthorizationValues
  organizationName?: string
  /** The scopes the app is asking for, mirrored into the consent preview. */
  scopes?: string[]
}

export const AuthorizationSection = ({
  control,
  savedValues,
  organizationName,
  scopes = [],
}: AuthorizationSectionProps) => {
  const [appName, isMemberBoundGrant, isProjectScopingEnabled] = useWatch({
    control,
    name: ['name', 'member_bound_grant', 'project_scoping'],
  })

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col">
        <span className="text-sm text-foreground">Authorization</span>
        <span className="text-sm text-foreground-light">
          How your app gets access when someone connects it.
        </span>
      </div>

      <FormField
        control={control}
        name="member_bound_grant"
        render={({ field }) => (
          <PermanentChoiceField
            legend="Who approves access?"
            looser={APPROVER_OPTIONS.looser}
            stricter={APPROVER_OPTIONS.stricter}
            value={toChoiceValue(APPROVER_OPTIONS, field.value)}
            savedValue={
              savedValues && toChoiceValue(APPROVER_OPTIONS, savedValues.member_bound_grant)
            }
            onChange={(value) => field.onChange(value === APPROVER_OPTIONS.stricter.value)}
          />
        )}
      />

      <FormField
        control={control}
        name="project_scoping"
        render={({ field }) => (
          <PermanentChoiceField
            legend="Which projects can it reach?"
            looser={PROJECT_REACH_OPTIONS.looser}
            stricter={PROJECT_REACH_OPTIONS.stricter}
            value={toChoiceValue(PROJECT_REACH_OPTIONS, field.value)}
            savedValue={
              savedValues && toChoiceValue(PROJECT_REACH_OPTIONS, savedValues.project_scoping)
            }
            onChange={(value) => field.onChange(value === PROJECT_REACH_OPTIONS.stricter.value)}
          />
        )}
      />

      <AuthorizationPreview
        appName={appName.length > 0 ? appName : 'your app'}
        scopes={scopes}
        isMemberBoundGrant={isMemberBoundGrant}
        isProjectScopingEnabled={isProjectScopingEnabled}
        organizationName={organizationName}
        savedValues={savedValues}
      />
    </div>
  )
}
