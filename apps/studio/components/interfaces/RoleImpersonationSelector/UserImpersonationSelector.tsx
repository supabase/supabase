import { keepPreviousData } from '@tanstack/react-query'
import { useDebounce } from '@uidotdev/usehooks'
import { ChevronsUpDown, User as IconUser, Loader2, X } from 'lucide-react'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import {
  Button,
  cn,
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  Input,
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
  Popover,
  PopoverContent,
  PopoverTrigger,
  ToggleGroup,
  ToggleGroupItem,
} from 'ui'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import { InfoTooltip } from 'ui-patterns/info-tooltip'

import { getDisplayName } from '../Auth/Users/Users.utils'
import { AlertError } from '@/components/ui/AlertError'
import { InlineLink } from '@/components/ui/InlineLink'
import { User, useUsersInfiniteQuery } from '@/data/auth/users-infinite-query'
import { useCustomAccessTokenHookDetails } from '@/hooks/misc/useCustomAccessTokenHookDetails'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'
import { DOCS_URL } from '@/lib/constants'
import type { RoleImpersonationController } from '@/state/role-impersonation-state'
import type { ResponseError } from '@/types'

type AuthenticatorAssuranceLevels = 'aal1' | 'aal2'
type UserSource = 'user' | 'external'

type UserImpersonationSelectorProps = {
  state: RoleImpersonationController
  disabled?: boolean
  onUserImpersonationCleared?: () => void
}

export const UserImpersonationSelector = ({
  state,
  disabled = false,
  onUserImpersonationCleared,
}: UserImpersonationSelectorProps) => {
  const [searchText, setSearchText] = useState('')
  const [aal, setAal] = useState<AuthenticatorAssuranceLevels>(() =>
    state.role?.type === 'postgrest' && state.role.role === 'authenticated'
      ? (state.role.aal ?? 'aal1')
      : 'aal1'
  )
  const [externalUserId, setExternalUserId] = useState('')
  const [additionalClaims, setAdditionalClaims] = useState('')
  const [isUserComboboxOpen, setIsUserComboboxOpen] = useState(false)
  const [selectedSource, setSelectedSource] = useState<UserSource>(() =>
    state.role?.type === 'postgrest' &&
    state.role.role === 'authenticated' &&
    state.role.userType === 'external'
      ? 'external'
      : 'user'
  )
  const [isImpersonateLoading, setIsImpersonateLoading] = useState(false)

  const debouncedSearchText = useDebounce(searchText, 300)
  const { data: project } = useSelectedProjectQuery()
  const {
    data,
    isSuccess,
    isPending: isLoading,
    isError,
    error,
    isFetching,
    isPlaceholderData,
  } = useUsersInfiniteQuery(
    {
      projectRef: project?.ref,
      connectionString: project?.connectionString,
      keywords: debouncedSearchText.trim().toLocaleLowerCase(),
    },
    { placeholderData: keepPreviousData }
  )

  const users = useMemo(() => data?.pages.flatMap((page) => page.result) ?? [], [data?.pages])
  const isSearching = isPlaceholderData && isFetching
  const impersonatingUser =
    state.role?.type === 'postgrest' &&
    state.role.role === 'authenticated' &&
    state.role.userType === 'native' &&
    state.role.user
      ? state.role.user
      : undefined
  const impersonatingExternalUser =
    state.role?.type === 'postgrest' &&
    state.role.role === 'authenticated' &&
    state.role.userType === 'external' &&
    state.role.externalAuth
      ? state.role.externalAuth
      : undefined
  const displayName = impersonatingUser
    ? getDisplayName(
        impersonatingUser,
        impersonatingUser.email ?? impersonatingUser.phone ?? impersonatingUser.id ?? 'Unknown'
      )
    : impersonatingExternalUser?.sub
  const isUserSelected = Boolean(displayName)
  const customAccessTokenHookDetails = useCustomAccessTokenHookDetails(project?.ref)

  async function impersonateUser(user: User) {
    setIsImpersonateLoading(true)

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
    } finally {
      setIsImpersonateLoading(false)
    }
  }

  async function impersonateExternalUser() {
    setIsImpersonateLoading(true)

    let parsedClaims = {}
    try {
      parsedClaims = additionalClaims ? JSON.parse(additionalClaims) : {}
    } catch {
      toast.error('Invalid JSON in additional claims')
      setIsImpersonateLoading(false)
      return
    }

    try {
      await state.setRole(
        {
          type: 'postgrest',
          role: 'authenticated',
          userType: 'external',
          externalAuth: { sub: externalUserId, additionalClaims: parsedClaims },
          aal,
        },
        customAccessTokenHookDetails
      )
    } catch (error) {
      toast.error(`Failed to impersonate user: ${(error as ResponseError).message}`)
    } finally {
      setIsImpersonateLoading(false)
    }
  }

  async function changeSelectedSource(value: UserSource) {
    if (!isUserSelected) {
      setSelectedSource(value)
      return
    }

    try {
      await state.setRole(undefined)
      setSelectedSource(value)
      onUserImpersonationCleared?.()
    } catch (error) {
      toast.error(`Failed to stop impersonating user: ${(error as ResponseError).message}`)
    }
  }

  async function changeAal(value: AuthenticatorAssuranceLevels) {
    const previousAal = aal
    setAal(value)

    if (
      state.role?.type !== 'postgrest' ||
      state.role.role !== 'authenticated' ||
      !isUserSelected
    ) {
      return
    }

    try {
      await state.setRole({ ...state.role, aal: value }, customAccessTokenHookDetails)
    } catch (error) {
      setAal(previousAal)
      toast.error(`Failed to update MFA assurance level: ${(error as ResponseError).message}`)
    }
  }

  return (
    <fieldset
      disabled={disabled}
      aria-disabled={disabled}
      className={cn(
        'm-0 flex min-w-0 flex-col gap-y-2.5 border-0 p-0 transition-opacity',
        disabled && 'opacity-40'
      )}
    >
      <FormItemLayout
        isReactForm={false}
        layout="horizontal"
        size="tiny"
        label={
          <span className="flex items-center gap-1">
            Users
            <InfoTooltip side="left" className="max-w-80">
              Project users come from Supabase Auth. External users let you test RLS policies with
              providers such as Clerk or Auth0.
            </InfoTooltip>
          </span>
        }
      >
        <ToggleGroup
          type="single"
          value={selectedSource}
          onValueChange={(value) => {
            if (value === 'user' || value === 'external') void changeSelectedSource(value)
          }}
          variant="default"
          size="tiny"
          aria-label="User source"
          className="w-full"
        >
          <ToggleGroupItem value="user" className="w-full">
            Project
          </ToggleGroupItem>
          <ToggleGroupItem value="external" className="w-full">
            External
          </ToggleGroupItem>
        </ToggleGroup>
      </FormItemLayout>

      <FormItemLayout
        id="run-as-user"
        isReactForm={false}
        layout="horizontal"
        size="tiny"
        label="User"
      >
        <ImpersonationControl
          selectedSource={selectedSource}
          displayName={displayName}
          isImpersonateLoading={isImpersonateLoading}
          stopImpersonating={async () => {
            await state.setRole(undefined)
            onUserImpersonationCleared?.()
          }}
          isUserComboboxOpen={isUserComboboxOpen}
          setIsUserComboboxOpen={setIsUserComboboxOpen}
          searchText={searchText}
          setSearchText={setSearchText}
          isLoading={isLoading}
          isSearching={isSearching}
          isError={isError}
          error={error}
          isSuccess={isSuccess}
          users={users}
          impersonateUser={impersonateUser}
          externalUserId={externalUserId}
          setExternalUserId={setExternalUserId}
          impersonateExternalUser={impersonateExternalUser}
        />
      </FormItemLayout>

      {selectedSource === 'external' && !isUserSelected && (
        <FormItemLayout
          id="run-as-user-claims"
          isReactForm={false}
          layout="horizontal"
          size="tiny"
          label="Claims"
        >
          <Input
            id="run-as-user-claims"
            size="tiny"
            placeholder='e.g. {"app_metadata": {"org_id": "org_456"}}'
            value={additionalClaims}
            onChange={(event) => setAdditionalClaims(event.target.value)}
          />
        </FormItemLayout>
      )}

      <FormItemLayout
        isReactForm={false}
        layout="horizontal"
        size="tiny"
        label={
          <span className="flex items-center gap-1">
            MFA level
            <InfoTooltip side="left" className="max-w-96">
              AAL1 verifies users via standard login methods, while AAL2 adds a second
              authentication factor. If you are not using MFA, leave this on AAL1. Learn more in the{' '}
              <InlineLink href={`${DOCS_URL}/guides/auth/auth-mfa`}>MFA guide</InlineLink>.
            </InfoTooltip>
          </span>
        }
      >
        <ToggleGroup
          type="single"
          value={aal}
          onValueChange={(value) => {
            if (value === 'aal1' || value === 'aal2') void changeAal(value)
          }}
          variant="default"
          size="tiny"
          aria-label="MFA assurance level"
          className="w-full"
        >
          <ToggleGroupItem value="aal1" className="w-full">
            AAL1
          </ToggleGroupItem>
          <ToggleGroupItem value="aal2" className="w-full">
            AAL2
          </ToggleGroupItem>
        </ToggleGroup>
      </FormItemLayout>
    </fieldset>
  )
}

type ImpersonationControlProps = {
  selectedSource: UserSource
  displayName?: string
  isImpersonateLoading: boolean
  stopImpersonating: () => void
  isUserComboboxOpen: boolean
  setIsUserComboboxOpen: (open: boolean) => void
  searchText: string
  setSearchText: (value: string) => void
  isLoading: boolean
  isSearching: boolean
  isError: boolean
  error: ResponseError | null
  isSuccess: boolean
  users: User[]
  impersonateUser: (user: User) => Promise<void>
  externalUserId: string
  setExternalUserId: (value: string) => void
  impersonateExternalUser: () => Promise<void>
}

const ImpersonationControl = ({
  selectedSource,
  displayName,
  isImpersonateLoading,
  stopImpersonating,
  isUserComboboxOpen,
  setIsUserComboboxOpen,
  searchText,
  setSearchText,
  isLoading,
  isSearching,
  isError,
  error,
  isSuccess,
  users,
  impersonateUser,
  externalUserId,
  setExternalUserId,
  impersonateExternalUser,
}: ImpersonationControlProps) => {
  if (displayName) {
    return (
      <div className="flex min-w-0 items-center gap-2">
        <span className="min-w-0 flex-1 truncate text-xs">{displayName}</span>
        <Button
          type="button"
          size="tiny"
          variant="text"
          className="px-1"
          aria-label="Stop impersonating user"
          icon={<X size={14} />}
          onClick={stopImpersonating}
          disabled={isImpersonateLoading}
          loading={isImpersonateLoading}
        />
      </div>
    )
  }

  if (selectedSource === 'external') {
    return (
      <InputGroup>
        <InputGroupInput
          id="run-as-user"
          size="tiny"
          placeholder="External user ID"
          value={externalUserId}
          onChange={(event) => setExternalUserId(event.target.value)}
        />
        <InputGroupAddon align="inline-end">
          <InputGroupButton
            type="button"
            size="tiny"
            variant="default"
            disabled={!externalUserId}
            onClick={impersonateExternalUser}
          >
            Apply
          </InputGroupButton>
        </InputGroupAddon>
      </InputGroup>
    )
  }

  return (
    <Popover open={isUserComboboxOpen} onOpenChange={setIsUserComboboxOpen} modal={false}>
      <PopoverTrigger asChild>
        <Button
          id="run-as-user"
          type="button"
          size="tiny"
          variant="default"
          role="combobox"
          aria-label="Find user"
          aria-expanded={isUserComboboxOpen}
          className="w-full justify-between"
          iconRight={<ChevronsUpDown className="shrink-0 text-foreground-muted" size={14} />}
        >
          Email, name, or ID
        </Button>
      </PopoverTrigger>
      <PopoverContent className="p-0" side="bottom" align="start" sameWidthAsTrigger>
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Email, name, or ID"
            value={searchText}
            onValueChange={setSearchText}
          />
          <CommandList className="max-h-52">
            {(isLoading || isSearching) && (
              <div className="flex items-center justify-center gap-2 px-3 py-2">
                <Loader2 className="animate-spin" size={14} />
                <span className="text-xs text-foreground-light">Loading users…</span>
              </div>
            )}

            {isError && <AlertError error={error} subject="Failed to retrieve users" />}

            {isSuccess && !isSearching && users.length === 0 && (
              <CommandEmpty>No users found</CommandEmpty>
            )}

            {isSuccess && !isSearching && users.length > 0 && (
              <CommandGroup>
                {users.map((user) => {
                  const emailOrPhone = user.email || user.phone
                  const userDisplayName = getDisplayName(user, '')

                  return (
                    <CommandItem
                      key={user.id}
                      value={user.id}
                      onSelect={() => {
                        void impersonateUser(user)
                        setIsUserComboboxOpen(false)
                      }}
                      className="gap-2"
                    >
                      <IconUser size={14} className="shrink-0 text-foreground-lighter" />
                      <span className="min-w-0 flex-1 truncate">
                        {emailOrPhone || userDisplayName || user.id}
                      </span>
                      {userDisplayName && userDisplayName !== emailOrPhone && (
                        <span className="max-w-24 truncate text-foreground-lighter">
                          {userDisplayName}
                        </span>
                      )}
                    </CommandItem>
                  )
                })}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
