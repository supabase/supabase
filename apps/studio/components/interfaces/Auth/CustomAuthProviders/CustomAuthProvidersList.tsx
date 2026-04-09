import { useQueryClient } from '@tanstack/react-query'
import { useParams } from 'common'
import { Edit, MoreVertical, Plus, Search, Trash, X } from 'lucide-react'
import { parseAsBoolean, parseAsStringLiteral, useQueryState } from 'nuqs'
import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import {
  Badge,
  Button,
  Card,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
  Input,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableHeadSort,
  TableRow,
} from 'ui'
import { Admonition } from 'ui-patterns/admonition'
import { GenericSkeletonLoader } from 'ui-patterns/ShimmeringLoader'

import { CreateOrUpdateCustomProviderSheet } from './CreateOrUpdateCustomProviderSheet'
import {
  CUSTOM_PROVIDER_ENABLED_OPTIONS,
  CUSTOM_PROVIDER_TYPE_OPTIONS,
  filterCustomProviders,
  getNextPlanForCustomProviders,
} from './customProviders.utils'
import { DeleteCustomProviderModal } from './DeleteCustomProviderModal'
import AlertError from '@/components/ui/AlertError'
import { FilterPopover } from '@/components/ui/FilterPopover'
import { UpgradePlanButton } from '@/components/ui/UpgradePlanButton'
import { useAuthConfigQuery } from '@/data/auth/auth-config-query'
import { useAuthConfigUpdateMutation } from '@/data/auth/auth-config-update-mutation'
import { useOAuthCustomProvidersQuery } from '@/data/oauth-custom-providers/oauth-custom-providers-query'
import { useSelectedOrganizationQuery } from '@/hooks/misc/useSelectedOrganization'

const CUSTOM_PROVIDERS_SORT_VALUES = [
  'name:asc',
  'name:desc',
  'identifier:asc',
  'identifier:desc',
  'provider_type:asc',
  'provider_type:desc',
  'created_at:asc',
  'created_at:desc',
] as const

type CustomProvidersSort = (typeof CUSTOM_PROVIDERS_SORT_VALUES)[number]
type CustomProvidersSortColumn = CustomProvidersSort extends `${infer Column}:${string}`
  ? Column
  : unknown
type CustomProvidersSortOrder = CustomProvidersSort extends `${string}:${infer Order}`
  ? Order
  : unknown

const NewProviderButton = ({
  canCreateProvider,
  setShowCreateSheet,
}: {
  canCreateProvider: boolean
  setShowCreateSheet: (show: boolean) => void
}) => {
  return (
    <Button
      type="primary"
      disabled={!canCreateProvider}
      icon={<Plus />}
      onClick={() => setShowCreateSheet(true)}
      className="flex-grow"
    >
      New Provider
    </Button>
  )
}

export const CustomAuthProvidersList = () => {
  const { ref: projectRef } = useParams()

  const { data: organization } = useSelectedOrganizationQuery()
  const { data: authConfig, isPending: isAuthConfigLoading } = useAuthConfigQuery({ projectRef })
  const nextPlan = getNextPlanForCustomProviders(organization?.plan?.id)
  const isCustomProvidersEnabled = !!authConfig?.CUSTOM_OAUTH_ENABLED
  const providerLimit = authConfig?.CUSTOM_OAUTH_MAX_PROVIDERS || 0

  const queryClient = useQueryClient()
  const { mutate: updateAuthConfig, isPending: isEnabling } = useAuthConfigUpdateMutation({
    onSuccess: () => {
      toast.success('Custom providers have been enabled')
      // Invalidate and refetch custom providers query so it retries after enabling
      queryClient.invalidateQueries({
        queryKey: ['projects', projectRef, 'oauth-custom-providers'],
      })
    },
  })

  const handleEnableCustomProviders = () => {
    if (projectRef) {
      updateAuthConfig({ projectRef, config: { CUSTOM_OAUTH_ENABLED: true } })
    }
  }

  const [selectedProviderToEdit, setSelectedProviderToEdit] = useState<string | null>(null)
  const [selectedProviderToDelete, setSelectedProviderToDelete] = useState<string | null>(null)
  const [filteredProviderTypes, setFilteredProviderTypes] = useState<string[]>([])
  const [filteredEnabledStatuses, setFilteredEnabledStatuses] = useState<string[]>([])

  const {
    data: customProviders,
    isLoading: isPending,
    isError,
    error,
  } = useOAuthCustomProvidersQuery({ projectRef })
  const providerCount = customProviders?.length ?? 0
  const atProviderLimit = providerLimit !== Infinity && providerCount >= providerLimit

  const [showCreateSheet, setShowCreateSheet] = useQueryState(
    'new',
    parseAsBoolean.withDefault(false).withOptions({ history: 'push', clearOnDefault: true })
  )

  // Prevent opening the create sheet if custom providers are disabled or at plan limit
  useEffect(() => {
    if (showCreateSheet && (!isCustomProvidersEnabled || atProviderLimit)) {
      setShowCreateSheet(false)
    }
  }, [showCreateSheet, atProviderLimit, isCustomProvidersEnabled, setShowCreateSheet])

  const [filterString, setFilterString] = useState<string>('')

  const [sort, setSort] = useQueryState(
    'sort',
    parseAsStringLiteral<CustomProvidersSort>(CUSTOM_PROVIDERS_SORT_VALUES).withDefault('name:asc')
  )

  const providerToEdit = useMemo(
    () => customProviders?.find((p) => p.id === selectedProviderToEdit),
    [customProviders, selectedProviderToEdit]
  )

  const providerToDelete = useMemo(
    () => customProviders?.find((p) => p.id === selectedProviderToDelete),
    [customProviders, selectedProviderToDelete]
  )

  const filteredAndSortedCustomProviders = useMemo(() => {
    const filtered = filterCustomProviders({
      providers: customProviders ?? [],
      searchString: filterString,
      providerTypes: filteredProviderTypes,
      enabledStatuses: filteredEnabledStatuses,
    })

    const [sortCol, sortOrder] = sort.split(':') as [
      CustomProvidersSortColumn,
      CustomProvidersSortOrder,
    ]
    const orderMultiplier = sortOrder === 'asc' ? 1 : -1

    return filtered.sort((a, b) => {
      if (sortCol === 'name') {
        return a.name.localeCompare(b.name) * orderMultiplier
      }
      if (sortCol === 'identifier') {
        return a.identifier.localeCompare(b.identifier) * orderMultiplier
      }
      if (sortCol === 'provider_type') {
        return a.provider_type.localeCompare(b.provider_type) * orderMultiplier
      }
      if (sortCol === 'created_at') {
        return (
          (new Date(a.created_at).getTime() - new Date(b.created_at).getTime()) * orderMultiplier
        )
      }
      return 0
    })
  }, [customProviders, filterString, filteredProviderTypes, filteredEnabledStatuses, sort])

  const hasActiveFilters =
    filterString.length > 0 ||
    filteredProviderTypes.length > 0 ||
    filteredEnabledStatuses.length > 0

  const handleResetFilters = () => {
    setFilterString('')
    setFilteredProviderTypes([])
    setFilteredEnabledStatuses([])
  }

  const handleSortChange = (column: CustomProvidersSortColumn) => {
    const [currentCol, currentOrder] = sort.split(':') as [
      CustomProvidersSortColumn,
      CustomProvidersSortOrder,
    ]
    if (currentCol === column) {
      // Cycle through: asc -> desc -> no sort (default)
      if (currentOrder === 'asc') {
        setSort(`${column}:desc` as CustomProvidersSort)
      } else {
        // Reset to default sort (name:asc)
        setSort('name:asc')
      }
    } else {
      // New column, start with asc
      setSort(`${column}:asc` as CustomProvidersSort)
    }
  }

  const isCreateOrUpdateSheetVisible =
    isCustomProvidersEnabled && (showCreateSheet || !!providerToEdit)
  const canCreateProvider = isCustomProvidersEnabled && !atProviderLimit

  if (isAuthConfigLoading || (isCustomProvidersEnabled && isPending)) {
    return <GenericSkeletonLoader />
  }

  if (!isCustomProvidersEnabled) {
    return (
      <Admonition
        type="default"
        title="Custom providers are not enabled"
        description="Enable custom OAuth/OIDC providers to configure your own identity providers for authentication."
      >
        <Button
          type="primary"
          loading={isEnabling}
          disabled={isEnabling}
          onClick={handleEnableCustomProviders}
        >
          Enable Custom Providers
        </Button>
      </Admonition>
    )
  }

  if (isError) {
    if (error?.message?.includes('Custom providers are not enabled')) {
      return (
        <Admonition
          type="default"
          title="Custom providers are not enabled"
          description="Enable custom OAuth/OIDC providers to configure your own identity providers for authentication."
        >
          <Button
            type="primary"
            loading={isEnabling}
            disabled={isEnabling}
            onClick={handleEnableCustomProviders}
          >
            Enable Custom Providers
          </Button>
        </Admonition>
      )
    }
    return <AlertError error={error} subject="Failed to retrieve Custom Auth Providers" />
  }

  return (
    <>
      <div className="flex flex-col gap-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2 flex-wrap">
          <div className="flex flex-col lg:flex-row lg:items-center gap-2">
            <Input
              placeholder="Search custom providers"
              size="tiny"
              icon={<Search />}
              value={filterString}
              className="w-full lg:w-52"
              onChange={(e) => setFilterString(e.target.value)}
            />
            <FilterPopover
              name="Provider Type"
              options={CUSTOM_PROVIDER_TYPE_OPTIONS}
              labelKey="name"
              valueKey="value"
              iconKey="icon"
              activeOptions={filteredProviderTypes}
              labelClass="text-xs text-foreground-light"
              maxHeightClass="h-[200px]"
              className="w-52"
              onSaveFilters={setFilteredProviderTypes}
            />
            <FilterPopover
              name="Status"
              options={CUSTOM_PROVIDER_ENABLED_OPTIONS}
              labelKey="name"
              valueKey="value"
              iconKey="icon"
              activeOptions={filteredEnabledStatuses}
              labelClass="text-xs text-foreground-light"
              maxHeightClass="h-[190px]"
              className="w-52"
              onSaveFilters={setFilteredEnabledStatuses}
            />
            {hasActiveFilters && (
              <Button
                type="default"
                size="tiny"
                className="px-1"
                icon={<X />}
                onClick={handleResetFilters}
              />
            )}
          </div>
          <div className="flex items-center gap-x-2">
            {!isCustomProvidersEnabled || atProviderLimit ? (
              <HoverCard openDelay={0}>
                <HoverCardTrigger>
                  <NewProviderButton
                    canCreateProvider={canCreateProvider}
                    setShowCreateSheet={setShowCreateSheet}
                  />
                </HoverCardTrigger>
                <HoverCardContent
                  side="bottom"
                  align="end"
                  className="text-xs flex flex-col gap-y-2 bg-alternative items-start"
                >
                  {!isCustomProvidersEnabled ? (
                    <div className="flex flex-col gap-y-2">
                      <p>Custom providers are not enabled for this project.</p>
                      <Button
                        type="primary"
                        size="tiny"
                        loading={isEnabling}
                        disabled={isEnabling}
                        onClick={handleEnableCustomProviders}
                      >
                        Enable Custom Providers
                      </Button>
                    </div>
                  ) : (
                    <>
                      <p>You've reached the limit of {providerLimit} providers for your plan.</p>
                      <UpgradePlanButton
                        source={`customAuthProviders-${organization?.plan.id}`}
                        plan={nextPlan ?? 'Pro'}
                      />
                    </>
                  )}
                </HoverCardContent>
              </HoverCard>
            ) : (
              <NewProviderButton
                canCreateProvider={canCreateProvider}
                setShowCreateSheet={setShowCreateSheet}
              />
            )}
          </div>
        </div>

        <div className="w-full overflow-hidden overflow-x-auto">
          <Card className="@container">
            <Table containerProps={{ stickyLastColumn: true }}>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    <TableHeadSort column="name" currentSort={sort} onSortChange={handleSortChange}>
                      Name
                    </TableHeadSort>
                  </TableHead>
                  <TableHead>
                    <TableHeadSort
                      column="identifier"
                      currentSort={sort}
                      onSortChange={handleSortChange}
                    >
                      Identifier
                    </TableHeadSort>
                  </TableHead>
                  <TableHead>
                    <TableHeadSort
                      column="provider_type"
                      currentSort={sort}
                      onSortChange={handleSortChange}
                    >
                      Type
                    </TableHeadSort>
                  </TableHead>
                  <TableHead>Enabled</TableHead>
                  <TableHead className="w-8 px-0">
                    <div className="!bg-200 px-4 w-full h-full flex items-center border-l @[944px]:border-l-0" />
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAndSortedCustomProviders.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5}>
                      <p className="text-foreground-lighter">No custom providers found</p>
                    </TableCell>
                  </TableRow>
                )}
                {filteredAndSortedCustomProviders.length > 0 &&
                  filteredAndSortedCustomProviders.map((provider) => (
                    <TableRow key={provider.id} className="w-full">
                      <TableCell className="flex" title={provider.name}>
                        <Button
                          type="text"
                          className="text-link-table-cell text-sm p-0 hover:bg-transparent title [&>span]:!w-full"
                          onClick={() => setSelectedProviderToEdit(provider.id)}
                          title={provider.name}
                        >
                          {provider.name}
                        </Button>
                      </TableCell>
                      <TableCell title={provider.identifier}>
                        <Badge className="font-mono">{provider.identifier}</Badge>
                      </TableCell>
                      <TableCell className="text-xs text-foreground-light max-w-28 uppercase">
                        {provider.provider_type}
                      </TableCell>
                      <TableCell className="text-xs text-foreground-light max-w-28">
                        <Badge variant={provider.enabled ? 'success' : 'default'}>
                          {provider.enabled ? 'Enabled' : 'Disabled'}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-20 bg-surface-100 @[944px]:hover:bg-surface-200 px-6">
                        <div className="absolute top-0 right-0 left-0 bottom-0 flex items-center justify-center border-l @[944px]:border-l-0">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button type="default" className="px-1" icon={<MoreVertical />} />
                            </DropdownMenuTrigger>
                            <DropdownMenuContent side="bottom" align="end" className="w-48">
                              <DropdownMenuItem
                                className="space-x-2"
                                onClick={() => {
                                  setSelectedProviderToEdit(provider.id)
                                }}
                              >
                                <Edit size={12} />
                                <p>Update</p>
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="space-x-2"
                                onClick={() => setSelectedProviderToDelete(provider.id)}
                              >
                                <Trash size={12} />
                                <p>Delete</p>
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </Card>
        </div>
      </div>

      <CreateOrUpdateCustomProviderSheet
        visible={isCreateOrUpdateSheetVisible}
        providerToEdit={providerToEdit}
        onClose={() => {
          setShowCreateSheet(false)
          setSelectedProviderToEdit(null)
        }}
      />

      <DeleteCustomProviderModal
        visible={!!providerToDelete}
        selectedProvider={providerToDelete}
        onClose={() => setSelectedProviderToDelete(null)}
      />
    </>
  )
}
