import { useParams } from 'common'
import { useMemo, useState } from 'react'
import { ShimmeringLoader } from 'ui-patterns/ShimmeringLoader'

import type { ShowApiKey } from '../../Docs/Docs.types'
import { LangSelector } from '../../Docs/LangSelector'
import { generateDocsMenu, getActivePage } from './DocsTabs.utils'
import { DataApiDisabledState } from '@/components/interfaces/Integrations/DataApi/DataApiDisabledState'
import { DocsMenu } from '@/components/interfaces/Integrations/DataApi/DocsMenu'
import { DocsMobileNav } from '@/components/interfaces/Integrations/DataApi/DocsMobileNav'
import { DocView } from '@/components/interfaces/Integrations/DataApi/DocView'
import { NotExposedEntitiesIndicator } from '@/components/ui/NotExposedEntitiesIndicator'
import { useOpenAPISpecQuery } from '@/data/open-api/api-spec-query'
import { partitionExposedDocsEntities } from '@/data/privileges/exposed-docs-entities'
import { useExposedFunctionsQuery } from '@/data/privileges/exposed-functions-query'
import { useExposedTablesQuery } from '@/data/privileges/exposed-tables-query'
import { useIsDataApiEnabled } from '@/hooks/misc/useIsDataApiEnabled'
import { useIsFeatureEnabled } from '@/hooks/misc/useIsFeatureEnabled'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'
import { PROJECT_STATUS } from '@/lib/constants'

export const DataApiDocsTab = () => {
  const DEFAULT_KEY = { name: 'hide', key: 'SUPABASE_KEY' }
  const { ref: projectRef, page, resource, rpc } = useParams()
  const { data: project } = useSelectedProjectQuery()
  const { projectAuthAll: authEnabled } = useIsFeatureEnabled(['project_auth:all'])
  const isPaused = project?.status === PROJECT_STATUS.INACTIVE

  const [selectedLang, setSelectedLang] = useState<'js' | 'bash'>('js')
  const [selectedApiKey, setSelectedApiKey] = useState<ShowApiKey>(DEFAULT_KEY)

  const { isEnabled, isPending: isConfigLoading } = useIsDataApiEnabled({ projectRef })

  const dataApiEnabled = !!projectRef && !isPaused && isEnabled

  const { data: openApiSpec } = useOpenAPISpecQuery({ projectRef }, { enabled: dataApiEnabled })

  // Cross-reference the spec against grant status so tables/functions that exist
  // in the spec but aren't actually exposed to the Data API are hidden + counted.
  const { data: exposedTables } = useExposedTablesQuery(
    { projectRef, connectionString: project?.connectionString },
    { enabled: dataApiEnabled }
  )
  const { data: exposedFunctions } = useExposedFunctionsQuery(
    { projectRef, connectionString: project?.connectionString },
    { enabled: dataApiEnabled }
  )

  const { tableNames, excludedTablesCount } = useMemo(() => {
    const { visibleEntities, excludedCount } = partitionExposedDocsEntities(
      openApiSpec?.tables ?? [],
      exposedTables
    )
    return {
      tableNames: visibleEntities.map((table) => table.name),
      excludedTablesCount: excludedCount,
    }
  }, [openApiSpec?.tables, exposedTables])

  const { functionNames, excludedFunctionsCount } = useMemo(() => {
    const { visibleEntities, excludedCount } = partitionExposedDocsEntities(
      openApiSpec?.functions ?? [],
      exposedFunctions
    )
    return {
      functionNames: visibleEntities.map((fn) => fn.name),
      excludedFunctionsCount: excludedCount,
    }
  }, [openApiSpec?.functions, exposedFunctions])

  const activePage = useMemo(() => getActivePage({ page, resource, rpc }), [page, resource, rpc])

  const docsBasePath = projectRef ? `/project/${projectRef}/integrations/data_api/docs` : undefined

  const menu = useMemo(() => {
    if (!projectRef) return []
    const groups = generateDocsMenu(
      projectRef,
      tableNames,
      functionNames,
      { authEnabled },
      docsBasePath
    )
    return groups.map((group) => {
      if (group.key === 'tables' && excludedTablesCount > 0) {
        return {
          ...group,
          footer: (
            <NotExposedEntitiesIndicator
              count={excludedTablesCount}
              entityNoun="table"
              entityNounPlural="tables"
              className="pt-1"
            />
          ),
        }
      }
      if (group.key === 'functions' && excludedFunctionsCount > 0) {
        return {
          ...group,
          footer: (
            <NotExposedEntitiesIndicator
              count={excludedFunctionsCount}
              entityNoun="function"
              entityNounPlural="functions"
              className="pt-1"
            />
          ),
        }
      }
      return group
    })
  }, [
    projectRef,
    tableNames,
    functionNames,
    authEnabled,
    docsBasePath,
    excludedTablesCount,
    excludedFunctionsCount,
  ])

  if (isConfigLoading) {
    return (
      <div className="flex w-full bg-surface-100 flex-1 items-stretch p-10">
        <ShimmeringLoader className="w-full h-full" />
      </div>
    )
  }

  if (!isEnabled) {
    return <DataApiDisabledState description="view the documentation" />
  }

  return (
    <div className="flex w-full bg-surface-100 flex-1 items-stretch">
      <aside className="hidden lg:flex flex-col gap-y-6 w-60 shrink-0 p-10">
        <LangSelector
          selectedLang={selectedLang}
          selectedApiKey={selectedApiKey}
          setSelectedLang={(lang: 'js' | 'bash') => setSelectedLang(lang)}
          setSelectedApiKey={setSelectedApiKey}
        />
        <DocsMenu activePage={activePage} menu={menu} />
      </aside>
      <div className="flex-1 min-w-0 relative">
        <DocsMobileNav
          activePage={activePage}
          menu={menu}
          selectedLang={selectedLang}
          selectedApiKey={selectedApiKey}
          setSelectedLang={setSelectedLang}
          setSelectedApiKey={setSelectedApiKey}
        />
        <DocView selectedLang={selectedLang} selectedApiKey={selectedApiKey} />
      </div>
    </div>
  )
}
