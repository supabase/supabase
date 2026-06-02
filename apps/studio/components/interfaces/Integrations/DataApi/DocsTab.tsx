import { useParams } from 'common'
import { useMemo, useState } from 'react'
import { ShimmeringLoader } from 'ui-patterns'

import type { ShowApiKey } from '../../Docs/Docs.types'
import { LangSelector } from '../../Docs/LangSelector'
import { DataApiDisabledState } from '@/components/interfaces/Integrations/DataApi/DataApiDisabledState'
import { DocsMenu } from '@/components/interfaces/Integrations/DataApi/DocsMenu'
import { DocsMobileNav } from '@/components/interfaces/Integrations/DataApi/DocsMobileNav'
import { DocView } from '@/components/interfaces/Integrations/DataApi/DocView'
import { generateDocsMenu, getActivePage } from '@/components/layouts/DocsLayout/DocsLayout.utils'
import { useOpenAPISpecQuery } from '@/data/open-api/api-spec-query'
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

  const { data: openApiSpec } = useOpenAPISpecQuery(
    { projectRef },
    {
      enabled: !!projectRef && !isPaused && isEnabled,
    }
  )

  const tableNames = useMemo(
    () => (openApiSpec?.tables ?? []).map((table) => table.name),
    [openApiSpec]
  )
  const functionNames = useMemo(
    () => (openApiSpec?.functions ?? []).map((fn) => fn.name),
    [openApiSpec]
  )

  const activePage = useMemo(() => getActivePage({ page, resource, rpc }), [page, resource, rpc])

  const docsBasePath = projectRef ? `/project/${projectRef}/integrations/data_api/docs` : undefined

  const menu = useMemo(() => {
    if (!projectRef) return []
    return generateDocsMenu(projectRef, tableNames, functionNames, { authEnabled }, docsBasePath)
  }, [projectRef, tableNames, functionNames, authEnabled, docsBasePath])

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
