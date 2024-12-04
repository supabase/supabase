import { Search } from 'lucide-react'
import { parseAsString, useQueryState } from 'nuqs'

import AlertError from 'components/ui/AlertError'
import NoSearchResults from 'components/ui/NoSearchResults'
import { buttonVariants, cn, Tabs_Shadcn_, TabsList_Shadcn_, TabsTrigger_Shadcn_ } from 'ui'
import { Admonition } from 'ui-patterns/admonition'
import { Input } from 'ui-patterns/DataInputs/Input'
import { IntegrationCard, IntegrationLoadingCard } from './IntegrationCard'
import { useInstalledIntegrations } from './useInstalledIntegrations'

type IntegrationCategory = 'all' | 'wrapper' | 'postgres_extensions' | 'custom'
const CATEGORIES = [
  { key: 'all', label: 'All Integrations' },
  { key: 'wrapper', label: 'Wrappers' },
  { key: 'postgres_extension', label: 'Postgres Modules' },
] as const

export const AvailableIntegrations = () => {
  const [selectedCategory, setSelectedCategory] = useQueryState(
    'category',
    parseAsString.withDefault('all').withOptions({ clearOnDefault: true })
  )
  const [search, setSearch] = useQueryState(
    'search',
    parseAsString.withDefault('').withOptions({ clearOnDefault: true })
  )

  const { availableIntegrations, installedIntegrations, error, isError, isLoading, isSuccess } =
    useInstalledIntegrations()

  const installedIds = installedIntegrations.map((i) => i.id)

  // available integrations for install
  const integrationsByCategory =
    selectedCategory === 'all'
      ? availableIntegrations
      : availableIntegrations.filter((i) => i.type === selectedCategory)
  const filteredIntegrations = (
    search.length > 0
      ? integrationsByCategory.filter((i) => i.name.toLowerCase().includes(search.toLowerCase()))
      : integrationsByCategory
  ).sort((a, b) => a.name.localeCompare(b.name))

  return (
    <>
      <Tabs_Shadcn_
        className="mt-4"
        value={selectedCategory}
        onValueChange={(value) => setSelectedCategory(value as IntegrationCategory)}
      >
        <TabsList_Shadcn_ className="px-10 gap-2 border-b-0 border-t pt-5">
          {CATEGORIES.map((category) => (
            <TabsTrigger_Shadcn_
              key={category.key}
              value={category.key}
              onClick={() => setSelectedCategory(category.key as IntegrationCategory)}
              className={cn(
                buttonVariants({
                  size: 'tiny',
                  type: selectedCategory === category.key ? 'default' : 'outline',
                }),
                selectedCategory === category.key ? 'text-foreground' : 'text-foreground-lighter',
                '!rounded-full px-3'
              )}
            >
              {category.label}
            </TabsTrigger_Shadcn_>
          ))}
          <Input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setSelectedCategory('all')
            }}
            containerClassName="group w-40 ml-5"
            icon={
              <Search
                size={14}
                className="transition text-foreground-lighter group-hover:text-foreground"
              />
            }
            iconContainerClassName="p-0"
            className="pl-7 rounded-none !border-0 border-transparent bg-transparent !shadow-none !ring-0 !ring-offset-0"
            placeholder="Search..."
          />
        </TabsList_Shadcn_>
      </Tabs_Shadcn_>
      <div className="p-10 py-8 flex flex-col gap-y-5">
        <div className="grid xl:grid-cols-3 2xl:grid-cols-4 gap-x-4 gap-y-3">
          {isLoading &&
            new Array(3)
              .fill(0)
              .map((_, idx) => <IntegrationLoadingCard key={`integration-loading-${idx}`} />)}
          {isError && (
            <AlertError
              className="xl:col-span-3 2xl:col-span-4"
              subject="Failed to retrieve available integrations"
              error={error}
            />
          )}
          {isSuccess &&
            filteredIntegrations.map((i) => (
              <IntegrationCard key={i.id} {...i} isInstalled={installedIds.includes(i.id)} />
            ))}
          {isSuccess && search.length > 0 && filteredIntegrations.length === 0 && (
            <NoSearchResults
              className="xl:col-span-3 2xl:col-span-4"
              searchString={search}
              onResetFilter={() => setSearch('')}
            />
          )}
          {isSuccess &&
            selectedCategory !== 'all' &&
            search.length === 0 &&
            filteredIntegrations.length === 0 && (
              <Admonition
                showIcon={false}
                className="xl:col-span-3 2xl:col-span-4"
                type="default"
                title="All integrations in this category are currently in use"
                description="Manage your installed integrations in the section above"
              />
            )}
        </div>
      </div>
    </>
  )
}
