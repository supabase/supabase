import { useParams } from 'common'
import { useMemo, useState } from 'react'
import { LoadingLine } from 'ui'

import { LINTER_LEVELS } from '@/components/interfaces/Linter/Linter.constants'
import { lintInfoMap } from '@/components/interfaces/Linter/Linter.utils'
import { LinterDataGrid } from '@/components/interfaces/Linter/LinterDataGrid'
import LinterFilters from '@/components/interfaces/Linter/LinterFilters'
import LintPageTabs from '@/components/interfaces/Linter/LintPageTabs'
import { useAdvisorPageShortcuts } from '@/components/interfaces/Linter/useAdvisorPageShortcuts'
import AdvisorsLayout from '@/components/layouts/AdvisorsLayout/AdvisorsLayout'
import { DefaultLayout } from '@/components/layouts/DefaultLayout'
import { FormHeader } from '@/components/ui/Forms/FormHeader'
import { useProjectHealthLintsQuery } from '@/data/lint/health-lints-query'
import { Lint } from '@/data/lint/lint-query'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'
import { IS_PLATFORM } from '@/lib/constants'
import type { NextPageWithLayout } from '@/types'

const ProjectHealthLints: NextPageWithLayout = () => {
  const { preset, id } = useParams()
  const { data: project } = useSelectedProjectQuery()

  const [filters, setFilters] = useState<{ level: LINTER_LEVELS; filters: string[] }[]>([
    { level: LINTER_LEVELS.ERROR, filters: [] },
    { level: LINTER_LEVELS.WARN, filters: [] },
    { level: LINTER_LEVELS.INFO, filters: [] },
  ])
  const [currentTab, setCurrentTab] = useState<LINTER_LEVELS>(
    (preset as LINTER_LEVELS) ?? LINTER_LEVELS.ERROR
  )
  const { data, isPending, isRefetching, refetch } = useProjectHealthLintsQuery({
    projectRef: project?.ref,
  })

  // Health checks are platform-only. If this page is opened self-hosted the query stays
  // disabled, and `isPending` would otherwise spin forever.
  const isLoading = IS_PLATFORM && isPending

  const activeLints = (data ?? []).filter((lint) => lint.categories.includes('HEALTH'))
  const currentTabFilters = (filters.find((filter) => filter.level === currentTab)?.filters ||
    []) as string[]
  const filteredLints = activeLints
    .filter((x) => x.level === currentTab)
    .filter((x) => (currentTabFilters.length > 0 ? currentTabFilters.includes(x.name) : x))
  const filterOptions = lintInfoMap
    .filter((item) =>
      activeLints.some((lint) => lint.name === item.name && lint.level === currentTab)
    )
    .map((type) => ({
      name: type.title,
      value: type.name,
    }))

  const selectedLint: Lint | null = useMemo(() => {
    return activeLints.find((lint) => lint.cache_key === id) ?? null
  }, [id, activeLints])

  useAdvisorPageShortcuts({
    setCurrentTab,
    refetch,
    hasSelectedLint: selectedLint !== null,
    isRefreshDisabled: isLoading || isRefetching,
  })

  return (
    <div className="h-full flex flex-col">
      <FormHeader className="py-4 px-6 -mb-px!" title="Health Advisor" />
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
    </div>
  )
}

ProjectHealthLints.getLayout = (page) => (
  <DefaultLayout>
    <AdvisorsLayout title="Linter">{page}</AdvisorsLayout>
  </DefaultLayout>
)

export default ProjectHealthLints
