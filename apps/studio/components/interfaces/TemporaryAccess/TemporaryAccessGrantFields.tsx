import { useParams } from 'common'
import dayjs from 'dayjs'
import type { Control } from 'react-hook-form'
import {
  Badge,
  Checkbox,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  WarningIcon,
} from 'ui'
import { TimestampInfo } from 'ui-patterns'
import { Admonition } from 'ui-patterns/admonition'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import { SingleValueFieldArray } from 'ui-patterns/form/SingleValueFieldArray/SingleValueFieldArray'

import type {
  TemporaryAccessExpiryContext,
  TemporaryAccessGrantDraft,
  TemporaryAccessRoleGrantDraft,
  TemporaryAccessRoleOption,
} from './TemporaryAccess.types'
import { createEmptyIpRange, getRelativeDatetimeByMode } from './TemporaryAccess.utils'
import { DatePicker } from '@/components/ui/DatePicker'
import { InlineLink } from '@/components/ui/InlineLink'
import { useHasAccessToProjectLevelPermissions } from '@/data/subscriptions/org-subscription-query'
import { DOCS_URL } from '@/lib/constants'

const EXPIRY_MODE_OPTIONS: Array<{
  value: TemporaryAccessRoleGrantDraft['expiryMode']
  label: string
}> = [
  { value: '1h', label: '1 hour' },
  { value: '1d', label: '1 day' },
  { value: '7d', label: '7 days' },
  { value: '30d', label: '30 days' },
  { value: 'custom', label: 'Custom' },
  { value: 'never', label: 'Never' },
]

const MAX_CUSTOM_EXPIRY_YEARS = 1
const BRANCH_SCOPE_OPTIONS = [
  { value: 'all', label: 'All project databases' },
  { value: 'preview', label: 'Preview branches only' },
] as const

interface TemporaryAccessGrantFieldsProps {
  control: Control<TemporaryAccessGrantDraft>
  grantIndex: number
  role: TemporaryAccessRoleOption
  grant: TemporaryAccessRoleGrantDraft
  onChange: (next: TemporaryAccessRoleGrantDraft) => void
  /** on_grant: expiry relative to when admin saves (Manage access). on_accept: invite presets run from accept. */
  expiryContext?: TemporaryAccessExpiryContext
  allowNeverExpiry?: boolean
  /** React Hook Form path prefix for grant rows. Defaults to `grants`. */
  grantsFieldName?: string
}

export function TemporaryAccessGrantFields({
  control,
  grantIndex,
  role,
  grant,
  onChange,
  expiryContext = 'on_grant',
  allowNeverExpiry = true,
  grantsFieldName = 'grants',
}: TemporaryAccessGrantFieldsProps) {
  const { slug } = useParams()
  const hasIpRestrictionsEntitlement = useHasAccessToProjectLevelPermissions(slug as string)

  const isSuperuserRole = role.id === 'postgres'
  const isReadOnlyRole = role.id === 'supabase_read_only_user'
  const checkboxId = `temporary-access-role-${role.id}`
  const expiryOptions = allowNeverExpiry
    ? EXPIRY_MODE_OPTIONS
    : EXPIRY_MODE_OPTIONS.filter((option) => option.value !== 'never')

  const expiryPresetDescription: Record<string, string> = {
    '1h': '1 hour',
    '1d': '1 day',
    '7d': '7 days',
    '30d': '30 days',
  }

  return (
    <div className={grant.enabled ? 'bg-surface-100' : 'bg-background'}>
      <label
        htmlFor={checkboxId}
        className="grid w-full cursor-pointer select-none grid-cols-[16px_minmax(0,1fr)] items-start gap-x-3 px-4 py-3 transition-colors hover:bg-surface-200/40"
      >
        <Checkbox
          id={checkboxId}
          checked={grant.enabled}
          onCheckedChange={(value) => {
            const isEnabled = value === true

            if (!isEnabled) {
              return onChange({ ...grant, enabled: false })
            }

            if (
              (grant.hasExpiry && grant.expiry) ||
              (!grant.hasExpiry && grant.expiryMode === 'never')
            ) {
              return onChange({ ...grant, enabled: true })
            }

            onChange({
              ...grant,
              enabled: true,
              hasExpiry: true,
              expiryMode: '1h',
              expiry: getRelativeDatetimeByMode('1h'),
            })
          }}
          aria-label={`Enable ${role.label}`}
          className="mt-0.5"
        />
        <div className="min-w-0 flex-1">
          <code className="text-code-inline dark:bg-surface-300! dark:border-control! tracking-normal!">
            {role.label}
          </code>
        </div>
      </label>

      {grant.enabled && (
        <div className="grid grid-cols-[16px_minmax(0,1fr)] gap-x-3 px-4 pb-3">
          <div aria-hidden />

          <div className="space-y-4">
            {isSuperuserRole && (
              <Admonition
                type="warning"
                layout="vertical"
                className="mb-3"
                title="The selected role has unrestricted access and bypasses row-level security"
                description={
                  <>
                    Consider using a{' '}
                    <InlineLink href={`${DOCS_URL}/guides/database/postgres/roles`}>
                      custom Postgres role
                    </InlineLink>{' '}
                    with only the permissions required.
                  </>
                }
              />
            )}

            {isReadOnlyRole && (
              <Admonition
                type="warning"
                layout="vertical"
                title="The selected role has read-only access to all schemas"
                description={
                  <>
                    Consider using a{' '}
                    <InlineLink href={`${DOCS_URL}/guides/database/postgres/roles`}>
                      custom Postgres role
                    </InlineLink>{' '}
                    with only the permissions required.
                  </>
                }
                className="mb-3"
              />
            )}

            <FormItemLayout
              isReactForm={false}
              label="Applies to"
              description={
                <p className="text-xs text-foreground-lighter">
                  {grant.branchesOnly
                    ? 'Can only be requested from preview branch databases.'
                    : 'Can be requested from production and preview branch databases.'}
                </p>
              }
            >
              <Select
                value={grant.branchesOnly ? 'preview' : 'all'}
                onValueChange={(value) => onChange({ ...grant, branchesOnly: value === 'preview' })}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select database scope" />
                </SelectTrigger>
                <SelectContent>
                  {BRANCH_SCOPE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormItemLayout>

            <FormItemLayout
              isReactForm={false}
              label={expiryContext === 'on_accept' ? 'Expires after accept' : 'Expires in'}
              description={
                grant.hasExpiry && grant.expiry && expiryContext === 'on_grant' ? (
                  <p className="text-xs text-foreground-lighter">
                    Expires at{' '}
                    <TimestampInfo
                      utcTimestamp={grant.expiry}
                      className="text-foreground-lighter"
                      labelFormat="DD MMM, HH:mm"
                    />
                  </p>
                ) : grant.hasExpiry &&
                  grant.expiryMode !== 'custom' &&
                  grant.expiryMode !== 'never' &&
                  expiryContext === 'on_accept' ? (
                  <p className="text-xs text-foreground-lighter">
                    Access lasts {expiryPresetDescription[grant.expiryMode]} once they accept the
                    invitation.
                  </p>
                ) : grant.hasExpiry && grant.expiryMode === 'custom' ? (
                  <p className="text-xs text-foreground-lighter">
                    {expiryContext === 'on_accept' ? (
                      <>
                        Access expires at{' '}
                        <TimestampInfo
                          utcTimestamp={grant.expiry}
                          className="text-foreground-lighter"
                          labelFormat="DD MMM, HH:mm"
                        />{' '}
                        (fixed date, regardless of when they accept).
                      </>
                    ) : (
                      <>
                        Expires at{' '}
                        <TimestampInfo
                          utcTimestamp={grant.expiry}
                          className="text-foreground-lighter"
                          labelFormat="DD MMM, HH:mm"
                        />
                      </>
                    )}
                  </p>
                ) : grant.expiryMode === 'never' ? (
                  <div className="mt-3 mx-0.5 flex w-full items-center gap-x-2">
                    <WarningIcon />
                    <span className="text-left text-xs text-foreground-lighter">
                      No expiry means ongoing database access until manually revoked.
                    </span>
                  </div>
                ) : undefined
              }
            >
              <div className="flex gap-2">
                <div className="flex-1">
                  <Select
                    value={grant.expiryMode}
                    onValueChange={(value) => {
                      const nextMode = value as TemporaryAccessRoleGrantDraft['expiryMode']

                      if (nextMode === 'never') {
                        return onChange({
                          ...grant,
                          expiryMode: nextMode,
                          hasExpiry: false,
                          expiry: '',
                        })
                      }

                      if (nextMode === 'custom') {
                        return onChange({
                          ...grant,
                          expiryMode: nextMode,
                          hasExpiry: true,
                          expiry: grant.expiry || getRelativeDatetimeByMode('1h'),
                        })
                      }

                      onChange({
                        ...grant,
                        expiryMode: nextMode,
                        hasExpiry: true,
                        expiry: getRelativeDatetimeByMode(nextMode),
                      })
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Expires in" />
                    </SelectTrigger>
                    <SelectContent>
                      {expiryOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {grant.expiryMode === 'custom' && (
                  <DatePicker
                    selectsRange={false}
                    triggerButtonSize="small"
                    contentSide="top"
                    to={grant.expiry || undefined}
                    minDate={new Date()}
                    maxDate={dayjs().add(MAX_CUSTOM_EXPIRY_YEARS, 'year').toDate()}
                    onChange={(value) => {
                      const selectedDate = value.to || value.from || ''
                      onChange({
                        ...grant,
                        hasExpiry: true,
                        expiry: selectedDate,
                      })
                    }}
                    triggerButtonClassName="min-w-[120px]"
                  >
                    {grant.expiry ? dayjs(grant.expiry).format('DD MMM, HH:mm') : 'Select date'}
                  </DatePicker>
                )}
              </div>
            </FormItemLayout>

            <FormItemLayout
              isReactForm={false}
              label={
                <span className="flex w-full items-center justify-between gap-3">
                  <p className="text-sm text-foreground">
                    Restricted IP addresses{' '}
                    <span className="font-normal text-foreground-lighter">(optional)</span>
                  </p>
                  {!hasIpRestrictionsEntitlement ? <Badge>Team</Badge> : null}
                </span>
              }
              description={
                !hasIpRestrictionsEntitlement
                  ? 'Restrict database access by IP on Team plan and above'
                  : undefined
              }
            >
              {hasIpRestrictionsEntitlement ? (
                <SingleValueFieldArray
                  control={control}
                  name={`${grantsFieldName}.${grantIndex}.ipRanges` as 'grants.0.ipRanges'}
                  valueFieldName="value"
                  createEmptyRow={createEmptyIpRange}
                  placeholder="192.168.0.0/24"
                  addLabel="Add IP restriction"
                  removeLabel="Remove IP restriction"
                  minimumRows={1}
                  inputAutoComplete="off"
                  rowsClassName="space-y-2"
                  addButtonClassName="w-min"
                />
              ) : (
                <p className="text-sm text-foreground-lighter py-2">
                  IP restrictions are unavailable on your current plan.
                </p>
              )}
            </FormItemLayout>
          </div>
        </div>
      )}
    </div>
  )
}
