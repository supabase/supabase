import { useDebounce } from '@uidotdev/usehooks'
import { ChevronDown, ExternalLink, User as IconUser, Loader2, Search, X } from 'lucide-react'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'

import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import AlertError from 'components/ui/AlertError'
import { User, useUsersInfiniteQuery } from 'data/auth/users-infinite-query'
import { useRoleImpersonationStateSnapshot } from 'state/role-impersonation-state'
import {
  Button,
  Collapsible_Shadcn_,
  CollapsibleContent_Shadcn_,
  CollapsibleTrigger_Shadcn_,
  Input,
  Switch,
} from 'ui'
import { InfoTooltip } from 'ui-patterns/info-tooltip'
import { getAvatarUrl, getDisplayName } from '../Auth/Users/Users.utils'

type AuthenticatorAssuranceLevels = 'aal1' | 'aal2'

const UserImpersonationSelector = () => {
  const [searchText, setSearchText] = useState('')
  const [aal, setAal] = useState<AuthenticatorAssuranceLevels>('aal1')
  const [externalUserId, setExternalUserId] = useState('')
  const [additionalClaims, setAdditionalClaims] = useState('')
  const [showExternalAuth, setShowExternalAuth] = useState(false)
  const state = useRoleImpersonationStateSnapshot()
  const debouncedSearchText = useDebounce(searchText, 300)

  const { project } = useProjectContext()

  const { data, isSuccess, isLoading, isError, error, isFetching, isPreviousData } =
    useUsersInfiniteQuery(
      {
        projectRef: project?.ref,
        connectionString: project?.connectionString,
        keywords: debouncedSearchText.trim().toLocaleLowerCase(),
      },
      {
        keepPreviousData: true,
      }
    )
  const users = useMemo(() => data?.pages.flatMap((page) => page.result) ?? [], [data?.pages])
  const isSearching = isPreviousData && isFetching
  const impersonatingUser =
    state.role?.type === 'postgrest' &&
    state.role.role === 'authenticated' &&
    state.role.userType === 'native' &&
    state.role.user

  // Check if we're currently impersonating an external auth user (e.g. OAuth, SAML)
  // This is used to show the correct UI state and impersonation details
  const isExternalAuthImpersonating =
    state.role?.type === 'postgrest' &&
    state.role.role === 'authenticated' &&
    state.role.userType === 'external' &&
    state.role.externalAuth

  function impersonateUser(user: User) {
    state.setRole({
      type: 'postgrest',
      role: 'authenticated',
      userType: 'native',
      user,
      aal,
    })
  }

  // Impersonates an external auth user (e.g. OAuth, SAML) by setting the sub and any additional claims
  // This allows testing RLS policies for external auth users without needing to set up the full OAuth/SAML flow
  function impersonateExternalUser() {
    let parsedClaims = {}
    try {
      parsedClaims = additionalClaims ? JSON.parse(additionalClaims) : {}
    } catch (e) {
      toast.error('Invalid JSON in additional claims')
      return
    }

    state.setRole({
      type: 'postgrest',
      role: 'authenticated',
      userType: 'external',
      externalAuth: {
        sub: externalUserId,
        additionalClaims: parsedClaims,
      },
      aal,
    })
  }

  function stopImpersonating() {
    state.setRole(undefined)
    setShowExternalAuth(false) // Reset external auth impersonation when stopping impersonation
  }

  function toggleAalState() {
    setAal((prev) => (prev === 'aal2' ? 'aal1' : 'aal2'))
  }

  const displayName = impersonatingUser
    ? getDisplayName(
        impersonatingUser,
        impersonatingUser.email ?? impersonatingUser.phone ?? impersonatingUser.id ?? 'Unknown'
      )
    : isExternalAuthImpersonating
      ? state.role.externalAuth.sub
      : undefined

  return (
    <div className="flex flex-col gap-1">
      <h2 className="text-foreground text-sm">
        {displayName ? `Impersonating ${displayName}` : 'Impersonate a User'}
      </h2>
      <p className="text-sm text-foreground-light">
        {!impersonatingUser && !isExternalAuthImpersonating
          ? "Select a user to respect your database's Row-Level Security policies for that particular user."
          : "Results will respect your database's Row-Level Security policies for this user."}
      </p>

      {/* Check for both regular user and external auth impersonation since they use different data structures but both need to be handled for displaying impersonation UI */}
      {!impersonatingUser && !isExternalAuthImpersonating ? (
        <div className="flex flex-col gap-2 mt-2">
          <Input
            className="table-editor-search border-none"
            icon={
              isSearching ? (
                <Loader2
                  className="animate-spin text-foreground-lighter"
                  size={16}
                  strokeWidth={1.5}
                />
              ) : (
                <Search className="text-foreground-lighter" size={16} strokeWidth={1.5} />
              )
            }
            placeholder="Search for a user.."
            onChange={(e) => setSearchText(e.target.value)}
            value={searchText}
            size="small"
            actions={
              searchText && (
                <Button size="tiny" type="text" className="px-1" onClick={() => setSearchText('')}>
                  <X size={12} strokeWidth={2} />
                </Button>
              )
            }
          />

          <Collapsible_Shadcn_>
            <CollapsibleTrigger_Shadcn_ className="group font-normal p-0 [&[data-state=open]>div>svg]:!-rotate-180">
              <div className="flex items-center gap-x-1 w-full">
                <p className="text-xs text-foreground-light group-hover:text-foreground transition">
                  Advanced options
                </p>
                <ChevronDown
                  className="transition-transform duration-200"
                  strokeWidth={1.5}
                  size={14}
                />
              </div>
            </CollapsibleTrigger_Shadcn_>
            <CollapsibleContent_Shadcn_ className="mt-1 flex flex-col gap-y-4">
              <div className="flex flex-row items-center gap-x-4 text-sm text-foreground-light">
                <div className="flex items-center gap-x-1">
                  <h3>MFA assurance level</h3>
                  <InfoTooltip side="top" className="flex flex-col gap-1 max-w-96">
                    <p>
                      AAL1 verifies users via standard login methods, while AAL2 adds a second
                      authentication factor.
                      <br />
                      If you're not using MFA, you can leave this on AAL1.
                    </p>
                    <a
                      href="/docs/guides/auth/auth-mfa"
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-x-1 opacity-50 hover:opacity-100 transition"
                    >
                      Learn more about MFA <ExternalLink size={14} strokeWidth={2} />
                    </a>
                  </InfoTooltip>
                </div>

                <div className="flex flex-row items-center gap-x-2 text-xs font-bold">
                  <p className={aal === 'aal1' ? undefined : 'text-foreground-lighter'}>AAL1</p>
                  <Switch checked={aal === 'aal2'} onCheckedChange={toggleAalState} />
                  <p className={aal === 'aal2' ? undefined : 'text-foreground-lighter'}>AAL2</p>
                </div>
              </div>

              <div className="flex flex-col gap-y-2">
                <div className="flex items-center gap-x-1">
                  <h3 className="text-sm text-foreground-light">External Auth Impersonation</h3>
                  <InfoTooltip side="top" className="flex flex-col gap-1 max-w-96">
                    <p>
                      Test RLS policies with external auth providers like Clerk or Auth0 by
                      providing a user ID and optional claims.
                    </p>
                  </InfoTooltip>
                </div>

                <div className="flex flex-row items-center gap-x-2">
                  <Switch checked={showExternalAuth} onCheckedChange={setShowExternalAuth} />
                  <p className="text-xs text-foreground-light">
                    Enable external auth impersonation
                  </p>
                </div>

                {showExternalAuth && (
                  <div className="flex flex-col gap-y-4 mt-2 border rounded-md p-4 bg-surface-100">
                    <Input
                      className="border-strong"
                      label="External User ID"
                      descriptionText="The user ID from your external auth provider"
                      placeholder="e.g. user_abc123"
                      value={externalUserId}
                      onChange={(e) => setExternalUserId(e.target.value)}
                      size="small"
                    />
                    <Input
                      className="border-strong"
                      label="Additional Claims (JSON)"
                      descriptionText="Optional: Add custom claims like org_id or roles"
                      placeholder='e.g. {"app_metadata": {"org_id": "org_456"}}'
                      value={additionalClaims}
                      onChange={(e) => setAdditionalClaims(e.target.value)}
                      size="small"
                    />
                    <div className="flex items-center justify-between">
                      <div />
                      <Button
                        type="default"
                        disabled={!externalUserId}
                        onClick={impersonateExternalUser}
                      >
                        Impersonate
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </CollapsibleContent_Shadcn_>
          </Collapsible_Shadcn_>

          {!showExternalAuth && (
            <>
              {isLoading && (
                <div className="flex flex-col gap-2 items-center justify-center h-24">
                  <Loader2 className="animate-spin" size={24} />
                  <span>Loading users...</span>
                </div>
              )}

              {isError && <AlertError error={error} subject="Failed to retrieve users" />}

              {isSuccess &&
                (users.length > 0 ? (
                  <ul className="divide-y max-h-[150px] overflow-y-scroll" role="list">
                    {users.map((user) => (
                      <li key={user.id} role="listitem">
                        <UserRow user={user} onClick={impersonateUser} />
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="flex flex-col gap-2 items-center justify-center h-24">
                    <p className="text-foreground-light text-xs" role="status">
                      No users found
                    </p>
                  </div>
                ))}
            </>
          )}
        </div>
      ) : (
        <>
          {impersonatingUser && (
            <UserImpersonatingRow
              user={impersonatingUser}
              onClick={stopImpersonating}
              isImpersonating={true}
              aal={aal}
            />
          )}
          {isExternalAuthImpersonating && (
            <ExternalAuthImpersonatingRow
              sub={state.role.externalAuth.sub}
              onClick={stopImpersonating}
              aal={aal}
            />
          )}
        </>
      )}
    </div>
  )
}

export default UserImpersonationSelector

// Base interface for shared impersonation row props to reduce
// duplication between user and external auth impersonation displays
interface BaseImpersonatingRowProps {
  onClick: () => void
  aal: AuthenticatorAssuranceLevels
  displayName: string
  avatarUrl?: string
  isImpersonating: boolean
}

const BaseImpersonatingRow = ({
  onClick,
  aal,
  displayName,
  avatarUrl,
  isImpersonating = false,
}: BaseImpersonatingRowProps) => {
  return (
    <div className="flex items-center gap-3 py-2 text-foreground">
      <div className="flex items-center gap-4 bg-surface-200 pr-4 pl-0.5 py-0.5 border rounded-full max-w-l">
        {avatarUrl ? (
          <img className="rounded-full w-5 h-5" src={avatarUrl} alt={displayName} />
        ) : (
          <div className="rounded-full w-[21px] h-[21px] bg-surface-300 border border-strong flex items-center justify-center">
            <IconUser size={12} strokeWidth={2} />
          </div>
        )}

        <span className="text-sm truncate">
          {displayName}{' '}
          <span className="ml-2 text-foreground-lighter text-xs font-light">
            {aal === 'aal2' ? 'AAL2' : 'AAL1'}
          </span>
        </span>
      </div>

      <Button type="default" onClick={onClick}>
        {isImpersonating ? 'Stop Impersonating' : 'Impersonate'}
      </Button>
    </div>
  )
}

const UserImpersonatingRow = ({
  user,
  onClick,
  isImpersonating = false,
  aal,
}: UserRowProps & { aal: AuthenticatorAssuranceLevels }) => {
  const avatarUrl = getAvatarUrl(user)
  const displayName =
    getDisplayName(user, user.email ?? user.phone ?? user.id ?? 'Unknown') +
    (user.is_anonymous ? ' (anonymous)' : '')

  return (
    <BaseImpersonatingRow
      onClick={() => onClick(user)}
      aal={aal}
      displayName={displayName}
      avatarUrl={avatarUrl}
      isImpersonating={isImpersonating}
    />
  )
}

interface ExternalAuthImpersonatingRowProps {
  sub: string
  onClick: () => void
  aal: AuthenticatorAssuranceLevels
}

const ExternalAuthImpersonatingRow = ({ sub, onClick, aal }: ExternalAuthImpersonatingRowProps) => {
  return (
    <BaseImpersonatingRow onClick={onClick} aal={aal} displayName={sub} isImpersonating={true} />
  )
}

interface UserRowProps {
  user: User
  onClick: (user: User) => void
  isImpersonating?: boolean
}

const UserRow = ({ user, onClick, isImpersonating = false }: UserRowProps) => {
  const avatarUrl = getAvatarUrl(user)
  const displayName =
    getDisplayName(user, user.email ?? user.phone ?? user.id ?? 'Unknown') +
    (user.is_anonymous ? ' (anonymous)' : '')

  return (
    <div className="flex items-center justify-between py-1 text-foreground">
      <div className="flex items-center gap-4">
        {avatarUrl ? (
          <img className="rounded-full w-5 h-5" src={avatarUrl} alt={displayName} />
        ) : (
          <div className="rounded-full w-[21px] h-[21px] bg-surface-300 border text-muted flex items-center justify-center text-background">
            <IconUser size={12} strokeWidth={2} />
          </div>
        )}

        <span className="text-sm">{displayName}</span>
      </div>

      <Button type="default" onClick={() => onClick(user)}>
        {isImpersonating ? 'Stop Impersonating' : 'Impersonate'}
      </Button>
    </div>
  )
}
