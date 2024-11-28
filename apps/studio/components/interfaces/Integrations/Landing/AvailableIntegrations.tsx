import AlertError from 'components/ui/AlertError'
import NoSearchResults from 'components/ui/NoSearchResults'
import { motion, useInView } from 'framer-motion'
import { Search } from 'lucide-react'
import { createRef, useEffect, useRef, useState } from 'react'
import { cn, NavMenu, NavMenuItem, Tabs_Shadcn_, TabsList_Shadcn_, TabsTrigger_Shadcn_ } from 'ui'
import { Admonition } from 'ui-patterns'
import { Input } from 'ui-patterns/DataInputs/Input'
import { IntegrationCard, IntegrationLoadingCard } from './IntegrationCard'
import { useInstalledIntegrations } from './useInstalledIntegrations'

type IntegrationCategory = 'all' | 'wrapper' | 'postgres_extensions' | 'custom'

const categories = ['wrapper', 'postgres_extensions', 'custom', 'other']

export const AvailableIntegrations = () => {
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<IntegrationCategory>('all')
  const [activeCategory, setActiveCategory] = useState<number>(0)
  const { availableIntegrations, installedIntegrations, error, isError, isLoading, isSuccess } =
    useInstalledIntegrations()

  // Create individual refs for each category
  const categoryRefs = categories.map(() => useRef<HTMLDivElement>(null))

  useEffect(() => {
    const observerOptions = {
      root: null,
      rootMargin: '-50% 0px -50% 0px', // Center of viewport
      threshold: 0,
    }

    const observer = new IntersectionObserver((entries) => {
      let closestIndex = -1
      let closestDistance = Infinity

      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const distance = Math.abs(entry.boundingClientRect.top)
          const index = categoryRefs.findIndex((ref) => ref.current === entry.target)

          if (distance < closestDistance) {
            closestDistance = distance
            closestIndex = index
          }
        }
      })

      if (closestIndex !== -1) {
        setActiveCategory(closestIndex)
      }
    }, observerOptions)

    // Observe all categories
    categoryRefs.forEach((ref) => {
      if (ref.current) {
        observer.observe(ref.current)
      }
    })

    // Cleanup observer
    return () => observer.disconnect()
  }, [])

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

  function getCategoryName(category: IntegrationCategory | 'other') {
    switch (category) {
      case 'all':
        return 'All Integrations'
      case 'wrapper':
        return 'Wrappers'
      case 'postgres_extensions':
        return 'Postgres Extensions'
      case 'custom':
        return 'Custom Integrations'
      default:
        return 'Other'
    }
  }

  return (
    <>
      <NavMenu
        className="mt-4 sticky top-0 bg-dash-sidebar z-[1] px-10"
        // value={selectedCategory}
        // onValueChange={(value) => setSelectedCategory(value as IntegrationCategory)}
      >
        {/* <TabsList_Shadcn_ className="px-10 gap-5"> */}
        <Input
          value={search}
          // onChange={(e) => setSearch(e.target.value)}
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
        {categories.map((category, index) => (
          <NavMenuItem
            key={category}
            // value={category}
            active={activeCategory === index}
            className={cn('cursor-pointer hover:text-blue-500 transition-colors', {
              'font-bold text-blue-500': activeCategory === index,
              'text-gray-700': activeCategory !== index,
            })}
            onClick={() => {
              const element = categoryRefs[index].current
              const main = document.querySelector('main')
              if (element && main) {
                main.scroll({
                  top: element.offsetTop - 100,
                  behavior: 'smooth',
                })
              }
            }}
          >
            {getCategoryName(category as IntegrationCategory | 'other')}
          </NavMenuItem>
        ))}
        {/* </TabsList_Shadcn_> */}
      </NavMenu>
      <div className="p-10 py-8 flex flex-col gap-y-5">
        <div className="grid xl:grid-cols-3 2xl:grid-cols-4 gap-x-4 gap-y-10">
          {categories.map((category, index) => {
            const integrations = filteredIntegrations.filter((integration) => {
              if (category === 'other') {
                return true
              }
              return integration.type === category
            })
            return (
              <motion.div
                key={category}
                ref={categoryRefs[index]}
                className="xl:col-span-3 2xl:col-span-4"
              >
                <h3 className="mb-2">{getCategoryName(category as IntegrationCategory)}</h3>
                {isLoading ? (
                  <IntegrationLoadingCard />
                ) : isSuccess ? (
                  <>
                    {integrations.length === 0 ? (
                      <div className="border border-muted rounded-md p-4 w-full py-5 px-5 flex flex-col">
                        <span className="text-sm text-foreground-light">
                          No integrations found in{' '}
                          {getCategoryName(category as IntegrationCategory)} category
                        </span>
                        <span className="text-sm text-foreground-lighter">
                          Please check back later or explore other categories.
                        </span>
                      </div>
                    ) : (
                      <div className="grid xl:grid-cols-3 2xl:grid-cols-4 gap-x-4 gap-y-3">
                        {integrations.map((integration) => (
                          <IntegrationCard key={integration.id} {...integration} />
                        ))}
                      </div>
                    )}
                  </>
                ) : null}
              </motion.div>
            )
          })}
          {/* {isLoading &&
            new Array(3)
              .fill(0)
              .map((_, idx) => <IntegrationLoadingCard key={`integration-loading-${idx}`} />)} */}
          {isError && (
            <AlertError
              className="xl:col-span-3 2xl:col-span-4"
              subject="Failed to retrieve available integrations"
              error={error}
            />
          )}

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
