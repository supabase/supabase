'use client'

import { LINTER_LEVELS } from 'components/interfaces/Linter/Linter.constants'
import { lintInfoMap } from 'components/interfaces/Linter/Linter.utils'
import LinterDataGrid from 'components/interfaces/Linter/LinterDataGrid'
import LinterFilters from 'components/interfaces/Linter/LinterFilters'
import { LinterPageFooter } from 'components/interfaces/Linter/LinterPageFooter'
import LintPageTabs from 'components/interfaces/Linter/LintPageTabs'
import { FormHeader } from 'components/ui/Forms/FormHeader'
import { useProjectLintsQuery, type Lint } from 'data/lint/lint-query'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { DOCS_URL } from 'lib/constants'
import { useMemo, useState } from 'react'
import { useRouter as useCompatRouter } from 'next/compat/router'
import { useSearchParams } from 'next/navigation'
import { LoadingLine } from 'ui'

type AdvisorCategory = 'SECURITY' | 'PERFORMANCE'

interface AdvisorLintsPageContentProps {
  category: AdvisorCategory
  title: string
  hideDbInspectCTA?: boolean
  headerClassName?: string
}

export function AdvisorLintsPageContent({
  category,
  title,
  hideDbInspectCTA,
  headerClassName,
}: AdvisorLintsPageContentProps) {
  const compatRouter = useCompatRouter()
  const searchParams = useSearchParams()
  const preset = (compatRouter?.query?.preset as string | undefined) ?? searchParams?.get('preset') ?? undefined
  const id = (compatRouter?.query?.id as string | undefined) ?? searchParams?.get('id') ?? undefined
  const { data: project } = useSelectedProjectQuery()

  const [filters, setFilters] = useState<{ level: LINTER_LEVELS; filters: string[] }[]>([
    { level: LINTER_LEVELS.ERROR, filters: [] },
    { level: LINTER_LEVELS.WARN, filters: [] },
    { level: LINTER_LEVELS.INFO, filters: [] },
  ])
  const [currentTab, setCurrentTab] = useState<LINTER_LEVELS>(
    (preset as LINTER_LEVELS) ?? LINTER_LEVELS.ERROR
  )
  const {
    data,
    isPending: isLoading,
    isRefetching,
    refetch,
  } = useProjectLintsQuery({
    projectRef: project?.ref,
  })

  const activeLints = useMemo(() => {
    return [...(data ?? [])].filter((x) => x.categories.includes(category))
  }, [data, category])

  const currentTabFilters = (filters.find((filter) => filter.level === currentTab)?.filters ||
    []) as string[]
  const filteredLints = activeLints
    .filter((x) => x.level === currentTab)
    .filter((x) => (currentTabFilters.length > 0 ? currentTabFilters.includes(x.name) : x))
  const filterOptions = lintInfoMap
    .filter((item) => activeLints.some((lint) => lint.name === item.name && lint.level === currentTab))
    .map((type) => ({
      name: type.title,
      value: type.name,
    }))

  const selectedLint: Lint | null = useMemo(() => {
    return activeLints.find((lint) => lint.cache_key === id) ?? null
  }, [id, activeLints])

  return (
    <div className="h-full flex flex-col">
      <FormHeader
        className={headerClassName ?? 'py-4 px-6 !-mb-px'}
        title={title}
        docsUrl={`${DOCS_URL}/guides/database/database-linter`}
      />
      <LintPageTabs
        activeLints={activeLints}
        isLoading={isLoading}
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
      />
      <LinterFilters
        filterOptions={filterOptions}
        filteredLints={filteredLints}
        activeLints={activeLints}
        currentTab={currentTab}
        filters={filters}
        isLoading={isLoading || isRefetching}
        setFilters={setFilters}
        onClickRefresh={refetch}
      />
      <LoadingLine loading={isRefetching} />
      <LinterDataGrid
        filteredLints={filteredLints}
        currentTab={currentTab}
        selectedLint={selectedLint}
        isLoading={isLoading}
      />
      <LinterPageFooter
        hideDbInspectCTA={hideDbInspectCTA}
        isLoading={isLoading}
        isRefetching={isRefetching}
        refetch={refetch}
      />
    </div>
  )
}
