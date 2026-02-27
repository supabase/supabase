import { DatePicker } from 'components/ui/DatePicker'
import { InlineLink } from 'components/ui/InlineLink'
import dayjs from 'dayjs'
import { DOCS_URL } from 'lib/constants'
import {
  Checkbox_Shadcn_,
  Input_Shadcn_,
  Select_Shadcn_,
  SelectContent_Shadcn_,
  SelectItem_Shadcn_,
  SelectTrigger_Shadcn_,
  SelectValue_Shadcn_,
  WarningIcon,
} from 'ui'
import { Admonition } from 'ui-patterns/admonition'

import { JIT_EXPIRY_MODE_OPTIONS, JIT_MAX_CUSTOM_EXPIRY_YEARS } from './JitDbAccess.constants'
import type { JitRoleGrantDraft, JitRoleOption } from './JitDbAccess.types'
import { getRelativeDatetimeByMode } from './JitDbAccess.utils'

interface JitDbAccessRoleGrantFieldsProps {
  role: JitRoleOption
  grant: JitRoleGrantDraft
  onChange: (next: JitRoleGrantDraft) => void
}

export function JitDbAccessRoleGrantFields({
  role,
  grant,
  onChange,
}: JitDbAccessRoleGrantFieldsProps) {
  const isSuperuserRole = role.id === 'postgres'
  const isReadOnlyRole = role.id === 'supabase_read_only_user'
  const checkboxId = `jit-role-${role.id}`

  return (
    <div className={grant.enabled ? 'bg-surface-100' : 'bg-background'}>
      <label
        htmlFor={checkboxId}
        className={`grid w-full cursor-pointer select-none grid-cols-[16px_minmax(0,1fr)] items-start gap-x-3 px-4 py-3 transition-colors ${
          grant.enabled ? 'hover:bg-surface-200/40' : 'hover:bg-surface-100/50'
        }`}
      >
        <Checkbox_Shadcn_
          id={checkboxId}
          checked={grant.enabled}
          onCheckedChange={(value) => {
            const isEnabled = value === true

            if (!isEnabled) {
              onChange({ ...grant, enabled: false })
              return
            }

            if (
              (grant.hasExpiry && grant.expiry) ||
              (!grant.hasExpiry && grant.expiryMode === 'never')
            ) {
              onChange({ ...grant, enabled: true })
              return
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
          <code className="text-code-inline dark:!bg-surface-300 dark:!border-control !tracking-normal">
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
                showIcon={false}
                layout="vertical"
                title="Grants full database control"
                description={
                  <>
                    The selected role has unrestricted access and bypasses row-level security.
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
                showIcon={false}
                layout="vertical"
                title="Grants read-only access to all schemas"
                description={
                  <>
                    The selected role has read-only access to all schemas. Consider using a{' '}
                    <InlineLink href={`${DOCS_URL}/guides/database/postgres/roles`}>
                      custom Postgres role
                    </InlineLink>{' '}
                    with only the permissions required.
                  </>
                }
                className="rounded-md"
              />
            )}

            <div className="space-y-2 border-t border-muted pt-3">
              <p className="text-sm text-foreground">Expires in</p>
              <div className="flex gap-2">
                <div className="flex-1">
                  <Select_Shadcn_
                    value={grant.expiryMode}
                    onValueChange={(value) => {
                      const nextMode = value as JitRoleGrantDraft['expiryMode']

                      if (nextMode === 'never') {
                        onChange({
                          ...grant,
                          expiryMode: nextMode,
                          hasExpiry: false,
                          expiry: '',
                        })
                        return
                      }

                      if (nextMode === 'custom') {
                        onChange({
                          ...grant,
                          expiryMode: nextMode,
                          hasExpiry: true,
                          expiry: grant.expiry || getRelativeDatetimeByMode('1h'),
                        })
                        return
                      }

                      onChange({
                        ...grant,
                        expiryMode: nextMode,
                        hasExpiry: true,
                        expiry: getRelativeDatetimeByMode(nextMode),
                      })
                    }}
                  >
                    <SelectTrigger_Shadcn_>
                      <SelectValue_Shadcn_ placeholder="Expires in" />
                    </SelectTrigger_Shadcn_>
                    <SelectContent_Shadcn_>
                      {JIT_EXPIRY_MODE_OPTIONS.map((option) => (
                        <SelectItem_Shadcn_ key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem_Shadcn_>
                      ))}
                    </SelectContent_Shadcn_>
                  </Select_Shadcn_>
                </div>

                {grant.expiryMode === 'custom' && (
                  <DatePicker
                    selectsRange={false}
                    triggerButtonSize="small"
                    contentSide="top"
                    to={grant.expiry || undefined}
                    minDate={new Date()}
                    maxDate={dayjs().add(JIT_MAX_CUSTOM_EXPIRY_YEARS, 'year').toDate()}
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

              {grant.expiryMode === 'never' && (
                <div className="mt-3 mx-0.5 flex w-full items-center gap-x-2">
                  <WarningIcon />
                  <span className="text-left text-xs text-foreground-lighter">
                    No expiry means ongoing database access until manually revoked.
                  </span>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <p className="text-sm text-foreground">
                Restricted IP addresses{' '}
                <span className="font-normal text-foreground-lighter">(optional)</span>
              </p>
              <Input_Shadcn_
                value={grant.ipRanges}
                onChange={(event) =>
                  onChange({
                    ...grant,
                    hasIpRestriction: event.target.value.trim().length > 0,
                    ipRanges: event.target.value,
                  })
                }
                placeholder="e.g. 192.168.0.0/24, 203.0.113.4/32"
              />
              <p className="text-xs text-foreground-lighter">Comma-separated CIDR ranges</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
