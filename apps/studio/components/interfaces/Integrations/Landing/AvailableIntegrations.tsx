import { Search } from 'lucide-react'
import { useState } from 'react'

import AlertError from 'components/ui/AlertError'
import NoSearchResults from 'components/ui/NoSearchResults'
import { Tabs_Shadcn_, TabsList_Shadcn_, TabsTrigger_Shadcn_ } from 'ui'
import { Input } from 'ui-patterns/DataInputs/Input'
import { IntegrationCard, IntegrationLoadingCard } from './IntegrationCard'
import { useInstalledIntegrations } from './useInstalledIntegrations'
import { Admonition } from 'ui-patterns'

type IntegrationCategory = 'all' | 'wrapper' | 'postgres_extensions' | 'custom'

export const AvailableIntegrations = () => {
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<IntegrationCategory>('all')

  const { availableIntegrations, installedIntegrations, error, isError, isLoading, isSuccess } =
    useInstalledIntegrations()

  const installedIds = installedIntegrations.map((i) => i.id)

  // available integrations for install
  const integrationsByCategory =
    selectedCategory === 'all'
      ? availableIntegrations.filter((i) => !installedIds.includes(i.id))
      : availableIntegrations.filter(
          (i) => !installedIds.includes(i.id) && i.type === selectedCategory
        )
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
        <TabsList_Shadcn_ className="px-10 gap-5">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            containerClassName="group w-40"
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
          <TabsTrigger_Shadcn_ value="all">All Integrations</TabsTrigger_Shadcn_>
          <TabsTrigger_Shadcn_ value="wrapper">Foreign Data Wrappers</TabsTrigger_Shadcn_>
          <TabsTrigger_Shadcn_ value="postgres_extension">Postgres Extensions</TabsTrigger_Shadcn_>
        </TabsList_Shadcn_>
      </Tabs_Shadcn_>
      <div className="p-10 py-8 flex flex-col gap-y-5">
        <h2>Available integrations</h2>
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
          {isSuccess && filteredIntegrations.map((i) => <IntegrationCard key={i.id} {...i} />)}
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
