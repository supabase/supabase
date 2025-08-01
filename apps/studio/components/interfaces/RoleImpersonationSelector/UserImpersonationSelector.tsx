import { useDebounce } from '@uidotdev/usehooks'
import { ChevronDown, User as IconUser, Loader2, Search, X } from 'lucide-react'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'

import { LOCAL_STORAGE_KEYS, useParams } from 'common'
import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import AlertError from 'components/ui/AlertError'
import { InlineLink } from 'components/ui/InlineLink'
import { User, useUsersInfiniteQuery } from 'data/auth/users-infinite-query'
import { useCustomAccessTokenHookDetails } from 'hooks/misc/useCustomAccessTokenHookDetails'
import { useLocalStorage } from 'hooks/misc/useLocalStorage'
import { useRoleImpersonationStateSnapshot } from 'state/role-impersonation-state'
import { ResponseError } from 'types'
import {
  Button,
  cn,
  Collapsible_Shadcn_,
  CollapsibleContent_Shadcn_,
  CollapsibleTrigger_Shadcn_,
  DropdownMenuSeparator,
  Input,
  ScrollArea,
  Switch,
  Tabs_Shadcn_,
  TabsContent_Shadcn_,
  TabsList_Shadcn_,
  TabsTrigger_Shadcn_,
} from 'ui'
import { InfoTooltip } from 'ui-patterns/info-tooltip'
import { getAvatarUrl, getDisplayName } from '../Auth/Users/Users.utils'

type AuthenticatorAssuranceLevels = 'aal1' | 'aal2'

const UserImpersonationSelector = () => {
  const [searchText, setSearchText] = useState('')
  const [aal, setAal] = useState<AuthenticatorAssuranceLevels>('aal1')
  const [externalUserId, setExternalUserId] = useState('')
  const [additionalClaims, setAdditionalClaims] = useState('')

  const { id: tableId } = useParams()
  const [selectedTab, setSelectedTab] = useState<'user' | 'external'>('user')

  const [previousSearches, setPreviousSearches] = useLocalStorage<User[]>(
    LOCAL_STORAGE_KEYS.USER_IMPERSONATION_SELECTOR_PREVIOUS_SEARCHES(tableId!),
    []
  )

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

  const customAccessTokenHookDetails = useCustomAccessTokenHookDetails(project?.ref)

  const [isImpersonateLoading, setIsImpersonateLoading] = useState(false)

  async function impersonateUser(user: User) {
    setIsImpersonateLoading(true)
    setPreviousSearches((prev) => {
      // Remove if already present
      const filtered = prev.filter((u) => u.id !== user.id)
      // Add new user to the end
      const updated = [...filtered, user]
      // Keep only the last 6
      return updated.slice(-6)
    })

    if (customAccessTokenHookDetails?.type === 'https') {
      toast.info(
        'Please note that HTTPS custom access token hooks are not yet supported in the dashboard.'
      )
    }

    try {
      await state.setRole(
        {
          type: 'postgrest',
          role: 'authenticated',
          userType: 'native',
          user,
          aal,
        },
        customAccessTokenHookDetails
      )
    } catch (error) {
      toast.error(`Failed to impersonate user: ${(error as ResponseError).message}`)
    }

    setIsImpersonateLoading(false)
  }

  // Impersonates an external auth user (e.g. OAuth, SAML) by setting the sub and any additional claims
  // This allows testing RLS policies for external auth users without needing to set up the full OAuth/SAML flow
  async function impersonateExternalUser() {
    setIsImpersonateLoading(true)

    let parsedClaims = {}
    try {
      parsedClaims = additionalClaims ? JSON.parse(additionalClaims) : {}
    } catch (e) {
      toast.error('Invalid JSON in additional claims')
      return
    }
    try {
      await state.setRole(
        {
          type: 'postgrest',
          role: 'authenticated',
          userType: 'external',
          externalAuth: {
            sub: externalUserId,
            additionalClaims: parsedClaims,
          },
          aal,
        },
        customAccessTokenHookDetails
      )
    } catch (error) {
      toast.error(`Failed to impersonate user: ${(error as ResponseError).message}`)
    }

    setIsImpersonateLoading(false)
  }

  function stopImpersonating() {
    state.setRole(undefined)
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

  // Clear all search history
  function clearSearchHistory() {
    setPreviousSearches([])
  }

  return (
    <>
      <div className="px-5 py-3">
        <p className="text-foreground text-sm">
          {displayName ? `Impersonating ${displayName}` : 'Impersonate a User'}
        </p>
        <p className="text-sm text-foreground-light">
          {!impersonatingUser && !isExternalAuthImpersonating
            ? "Select a user to respect your database's Row-Level Security policies for that particular user."
            : "Results will respect your database's Row-Level Security policies for this user."}
        </p>

        {impersonatingUser && (
          <UserImpersonatingRow
            user={impersonatingUser}
            onClick={stopImpersonating}
            isImpersonating={true}
            aal={aal}
            isLoading={isImpersonateLoading}
          />
        )}
        {isExternalAuthImpersonating && (
          <ExternalAuthImpersonatingRow
            sub={state.role.externalAuth.sub}
            onClick={stopImpersonating}
            aal={aal}
            isLoading={isImpersonateLoading}
          />
        )}

        {!impersonatingUser && !isExternalAuthImpersonating && (
          <Tabs_Shadcn_ value={selectedTab} onValueChange={(value: any) => setSelectedTab(value)}>
            <TabsList_Shadcn_ className="gap-x-3">
              <TabsTrigger_Shadcn_ value="user">Project user</TabsTrigger_Shadcn_>
              <TabsTrigger_Shadcn_ value="external" className="gap-x-1.5">
                External user
                <InfoTooltip side="bottom" className="flex flex-col gap-1 max-w-96">
                  Test RLS policies with external auth providers like Clerk or Auth0 by providing a
                  user ID and optional claims.
                </InfoTooltip>
              </TabsTrigger_Shadcn_>
            </TabsList_Shadcn_>

            <TabsContent_Shadcn_ value="user">
              <div className="flex flex-col gap-y-2">
                <Input
                  size="tiny"
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
                  placeholder="Search by id, email, phone, or name..."
                  onChange={(e) => setSearchText(e.target.value)}
                  value={searchText}
                  actions={
                    searchText && (
                      <Button
                        size="tiny"
                        type="text"
                        className="px-1"
                        onClick={() => setSearchText('')}
                      >
                        <X size={12} strokeWidth={2} />
                      </Button>
                    )
                  }
                />
                {isLoading && (
                  <div className="flex flex-col gap-2 items-center justify-center h-24">
                    <Loader2 className="animate-spin" size={24} />
                    <span className="text-foreground-light">Loading users...</span>
                  </div>
                )}

                {isError && <AlertError error={error} subject="Failed to retrieve users" />}

                {isSuccess &&
                  (users.length > 0 ? (
                    <div>
                      <ul className="divide-y max-h-[150px] overflow-y-scroll" role="list">
                        {users.map((user) => (
                          <li key={user.id} role="listitem">
                            <UserRow
                              user={user}
                              onClick={impersonateUser}
                              isLoading={isImpersonateLoading}
                            />
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2 items-center justify-center h-24">
                      <p className="text-foreground-light text-xs" role="status">
                        No users found
                      </p>
                    </div>
                  ))}

                <>
                  {previousSearches.length > 0 && (
                    <div>
                      {previousSearches.length > 0 ? (
                        <>
                          <Collapsible_Shadcn_ className="relative">
                            <CollapsibleTrigger_Shadcn_ className="group font-normal p-0 [&[data-state=open]>div>svg]:!-rotate-180">
                              <div className="flex items-center gap-x-1 w-full">
                                <p className="text-xs text-foreground-light group-hover:text-foreground transition">
                                  Recents
                                </p>
                                <ChevronDown
                                  className="transition-transform duration-200"
                                  strokeWidth={1.5}
                                  size={14}
                                />
                              </div>
                            </CollapsibleTrigger_Shadcn_>

                            <CollapsibleContent_Shadcn_ className="mt-1 flex flex-col gap-y-4">
                              <Button
                                size="tiny"
                                type="text"
                                className="absolute right-0 top-0 py-2 hover:bg-muted flex items-center text"
                                onClick={clearSearchHistory}
                              >
                                <span className="flex items-center">Clear</span>
                              </Button>
                              <ScrollArea
                                className={cn(previousSearches.length > 3 ? 'h-36' : 'h-auto')}
                              >
                                <ul className="grid gap-2 ">
                                  {previousSearches.map((search) => (
                                    <li key={search.id}>
                                      <UserRow user={search} onClick={impersonateUser} />
                                    </li>
                                  ))}
                                </ul>
                              </ScrollArea>
                            </CollapsibleContent_Shadcn_>
                          </Collapsible_Shadcn_>
                        </>
                      ) : (
                        <div className="p-4 text-center text-muted-foreground">
                          No recent searches
                        </div>
                      )}
                    </div>
                  )}
                </>
              </div>
            </TabsContent_Shadcn_>

            <TabsContent_Shadcn_ value="external">
              <div className="flex flex-col gap-y-4">
                <Input
                  size="small"
                  layout="horizontal"
                  label="External User ID"
                  descriptionText="The user ID from your external auth provider"
                  placeholder="e.g. user_abc123"
                  value={externalUserId}
                  onChange={(e) => setExternalUserId(e.target.value)}
                />
                <Input
                  size="small"
                  layout="horizontal"
                  label="Additional Claims (JSON)"
                  descriptionText="Optional: Add custom claims like org_id or roles"
                  placeholder='e.g. {"app_metadata": {"org_id": "org_456"}}'
                  value={additionalClaims}
                  onChange={(e) => setAdditionalClaims(e.target.value)}
                />
                <div className="flex items-center justify-end">
                  <Button
                    type="default"
                    disabled={!externalUserId}
                    onClick={impersonateExternalUser}
                  >
                    Impersonate
                  </Button>
                </div>
              </div>
            </TabsContent_Shadcn_>
          </Tabs_Shadcn_>
        )}
      </div>

      {/* Check for both regular user and external auth impersonation since they use different data structures but both need to be handled for displaying impersonation UI */}
      {!impersonatingUser && !isExternalAuthImpersonating ? (
        <>
          <DropdownMenuSeparator className="m-0" />
          <div className="px-5 py-2 flex flex-col gap-2 relative">
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
                    <InfoTooltip side="top" className="max-w-96">
                      AAL1 verifies users via standard login methods, while AAL2 adds a second
                      authentication factor. If you're not using MFA, you can leave this on AAL1.
                      Learn more about MFA{' '}
                      <InlineLink href="https://supabase.com/docs/guides/auth/auth-mfa">
                        here
                      </InlineLink>
                      .
                    </InfoTooltip>
                  </div>

                  <div className="flex flex-row items-center gap-x-2 text-xs font-bold">
                    <p className={aal === 'aal1' ? undefined : 'text-foreground-lighter'}>AAL1</p>
                    <Switch checked={aal === 'aal2'} onCheckedChange={toggleAalState} />
                    <p className={aal === 'aal2' ? undefined : 'text-foreground-lighter'}>AAL2</p>
                  </div>
                </div>
              </CollapsibleContent_Shadcn_>
            </Collapsible_Shadcn_>
          </div>
        </>
      ) : null}
    </>
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
  isLoading?: boolean
}

const BaseImpersonatingRow = ({
  onClick,
  aal,
  displayName,
  avatarUrl,
  isImpersonating = false,
  isLoading = false,
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

      <Button type="default" onClick={onClick} disabled={isLoading} loading={isLoading}>
        {isImpersonating ? 'Stop Impersonating' : 'Impersonate'}
      </Button>
    </div>
  )
}

const UserImpersonatingRow = ({
  user,
  onClick,
  isImpersonating = false,
  isLoading = false,
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
      isLoading={isLoading}
    />
  )
}

interface ExternalAuthImpersonatingRowProps {
  sub: string
  onClick: () => void
  aal: AuthenticatorAssuranceLevels
  isLoading?: boolean
}

const ExternalAuthImpersonatingRow = ({
  sub,
  onClick,
  aal,
  isLoading = false,
}: ExternalAuthImpersonatingRowProps) => {
  return (
    <BaseImpersonatingRow
      onClick={onClick}
      aal={aal}
      displayName={sub}
      isImpersonating={true}
      isLoading={isLoading}
    />
  )
}

interface UserRowProps {
  user: User
  onClick: (user: User) => void
  isImpersonating?: boolean
  isLoading?: boolean
}

const UserRow = ({ user, onClick, isImpersonating = false, isLoading = false }: UserRowProps) => {
  const avatarUrl = getAvatarUrl(user)
  const emailOrPhone = user.email || user.phone
  const displayName = getDisplayName(user, '')
  const isAnonymous = user.is_anonymous
  const showDisplayName = displayName && displayName !== emailOrPhone

  return (
    <div className="flex items-center justify-between py-1 text-foreground">
      <div className="flex items-center gap-4">
        {avatarUrl ? (
          <img className="rounded-full w-5 h-5" src={avatarUrl} alt={displayName || emailOrPhone} />
        ) : (
          <div className="rounded-full w-[21px] h-[21px] bg-surface-300 border flex items-center justify-center text-foreground-lighter">
            <IconUser size={12} strokeWidth={2} />
          </div>
        )}

        <span className="text-sm flex items-center gap-4">
          {emailOrPhone}
          {showDisplayName && (
            <>
              <span className="text-foreground-lighter">
                {displayName}
                {isAnonymous ? ' (anonymous)' : ''}
              </span>
            </>
          )}
          <span className="text-foreground-light bg-surface-200 dark:bg-surface-400 rounded-md px-1 py-0.5 font-mono text-xs">
            {user?.id?.slice(0, 8)}
          </span>
        </span>
      </div>

      <Button type="default" onClick={() => onClick(user)} disabled={isLoading} loading={isLoading}>
        {isImpersonating ? 'Stop Impersonating' : 'Impersonate'}
      </Button>
    </div>
  )
}
