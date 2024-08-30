import { useEffect, useState } from 'react'

import { useParams } from 'common'
import LintPageTabs from 'components/interfaces/Linter/LintPageTabs'
import { LINTER_LEVELS } from 'components/interfaces/Linter/Linter.constants'
import { lintInfoMap } from 'components/interfaces/Linter/Linter.utils'
import LinterDataGrid from 'components/interfaces/Linter/LinterDataGrid'
import LinterFilters from 'components/interfaces/Linter/LinterFilters'
import LinterPageFooter from 'components/interfaces/Linter/LinterPageFooter'
import AdvisorsLayout from 'components/layouts/AdvisorsLayout/AdvisorsLayout'
import { FormHeader } from 'components/ui/Forms/FormHeader'
import { Lint, useProjectLintsQuery } from 'data/lint/lint-query'
import { useSelectedProject } from 'hooks/misc/useSelectedProject'
import type { NextPageWithLayout } from 'types'
import { LoadingLine } from 'ui'

const ProjectLints: NextPageWithLayout = () => {
  const project = useSelectedProject()
  const { preset, id } = useParams()

  // need to maintain a list of filters for each tab
  const [filters, setFilters] = useState<{ level: LINTER_LEVELS; filters: string[] }[]>([
    { level: LINTER_LEVELS.ERROR, filters: [] },
    { level: LINTER_LEVELS.WARN, filters: [] },
    { level: LINTER_LEVELS.INFO, filters: [] },
  ])

  const [currentTab, setCurrentTab] = useState<LINTER_LEVELS>(
    (preset as LINTER_LEVELS) ?? LINTER_LEVELS.ERROR
  )

  const [selectedLint, setSelectedLint] = useState<Lint | null>(null)

  const {
    data,
    isLoading: areLintsLoading,
    isRefetching,
    refetch: refetchLintsQuery,
  } = useProjectLintsQuery({
    projectRef: project?.ref,
  })

  const isLoading = areLintsLoading

  const refetch = () => {
    refetchLintsQuery()
  }

  const activeLints = (data ?? []).filter((lint) => lint.categories.includes('SECURITY'))

  useEffect(() => {
    // check the URL for an ID and set the selected lint
    if (id) setSelectedLint(activeLints.find((lint) => lint.cache_key === id) ?? null)
  }, [id, activeLints])

  const currentTabFilters = (filters.find((filter) => filter.level === currentTab)?.filters ||
    []) as string[]

  const filteredLints = activeLints
    .filter((x) => x.level === currentTab)
    .filter((x) => (currentTabFilters.length > 0 ? currentTabFilters.includes(x.name) : x))

  const filterOptions = lintInfoMap
    // only show filters for lint types which are present in the results and not ignored
    .filter((item) =>
      activeLints.some((lint) => lint.name === item.name && lint.level === currentTab)
    )
    .map((type) => ({
      name: type.title,
      value: type.name,
    }))

  return (
    <div className="h-full flex flex-col">
      <FormHeader
        className="py-4 px-6 !mb-0"
        title="Security Advisor"
        docsUrl="https://supabase.com/docs/guides/database/database-linter"
      />
      <LintPageTabs
        activeLints={activeLints}
        isLoading={isLoading}
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        setSelectedLint={setSelectedLint}
      />
      <LinterFilters
        filterOptions={filterOptions}
        activeLints={activeLints}
        currentTab={currentTab}
        filters={filters}
        setFilters={setFilters}
      />
      <LoadingLine loading={isRefetching} />
      <LinterDataGrid
        filteredLints={filteredLints}
        currentTab={currentTab}
        selectedLint={selectedLint}
        setSelectedLint={setSelectedLint}
        isLoading={isLoading}
      />
      <LinterPageFooter
        hideDbInspectCTA
        isLoading={isLoading}
        isRefetching={isRefetching}
        refetch={refetch}
      />
    </div>
  )
}

ProjectLints.getLayout = (page) => <AdvisorsLayout title="Linter">{page}</AdvisorsLayout>

export default ProjectLints
