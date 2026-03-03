import { useParams } from 'common'
import { LINTER_LEVELS } from 'components/interfaces/Linter/Linter.constants'
import { lintInfoMap } from 'components/interfaces/Linter/Linter.utils'
import LinterDataGrid from 'components/interfaces/Linter/LinterDataGrid'
import LinterFilters from 'components/interfaces/Linter/LinterFilters'
import { LinterPageFooter } from 'components/interfaces/Linter/LinterPageFooter'
import LintPageTabs from 'components/interfaces/Linter/LintPageTabs'
import AdvisorsLayout from 'components/layouts/AdvisorsLayout/AdvisorsLayout'
import DefaultLayout from 'components/layouts/DefaultLayout'
import { FormHeader } from 'components/ui/Forms/FormHeader'
import { Lint, useProjectLintsQuery } from 'data/lint/lint-query'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { DOCS_URL } from 'lib/constants'
import { useMemo, useState } from 'react'
import type { NextPageWithLayout } from 'types'
import { LoadingLine } from 'ui'

const ProjectLints: NextPageWithLayout = () => {
  const { preset, id } = useParams()
  const { data: project } = useSelectedProjectQuery()

  // need to maintain a list of filters for each tab
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

  const activeLints = (data ?? []).filter((lint) => lint.categories.includes('SECURITY'))
  // hide vulnerable_postgres_version lint temporarily
  // https://linear.app/supabase/project/pg-minor-version-upgrade-for-security-vulnerabilities-0124b2c2dcf5
  // https://github.com/supabase/supabase/pull/38280/files
  //.filter((lint) => lint.name !== 'vulnerable_postgres_version')

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

  const selectedLint: Lint | null = useMemo(() => {
    return activeLints.find((lint) => lint.cache_key === id) ?? null
  }, [id, activeLints])

  return (
    <div className="h-full flex flex-col">
      <FormHeader
        className="py-4 px-6 !-mb-px"
        title="Security Advisor"
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
        hideDbInspectCTA
        isLoading={isLoading}
        isRefetching={isRefetching}
        refetch={refetch}
      />
    </div>
  )
}

ProjectLints.getLayout = (page) => (
  <DefaultLayout>
    <AdvisorsLayout title="Linter">{page}</AdvisorsLayout>
  </DefaultLayout>
)

export default ProjectLints
