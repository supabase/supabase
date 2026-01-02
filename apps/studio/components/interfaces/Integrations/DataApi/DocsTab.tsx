import { useParams } from 'common'
import Link from 'next/link'
import { useMemo, useState } from 'react'

import { GeneralContent } from 'components/interfaces/Docs/GeneralContent'
import { ResourceContent } from 'components/interfaces/Docs/ResourceContent'
import { RpcContent } from 'components/interfaces/Docs/RpcContent'
import { generateDocsMenu } from 'components/layouts/DocsLayout/DocsLayout.utils'
import { ProductMenuGroup } from 'components/ui/ProductMenu/ProductMenu.types'
import { useProjectSettingsV2Query } from 'data/config/project-settings-v2-query'
import { useCustomDomainsQuery } from 'data/custom-domains/custom-domains-query'
import { useProjectJsonSchemaQuery } from 'data/docs/project-json-schema-query'
import { useOpenAPISpecQuery } from 'data/open-api/api-spec-query'
import { useIsFeatureEnabled } from 'hooks/misc/useIsFeatureEnabled'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { PROJECT_STATUS } from 'lib/constants'
import { snakeToCamel } from 'lib/helpers'
import { cn } from 'ui'
import { LangSelector } from '../../Docs/LangSelector'

export const DataApiDocsTab = () => {
  const DEFAULT_KEY = { name: 'hide', key: 'SUPABASE_KEY' }
  const { ref: projectRef, page, resource, rpc } = useParams()
  const { data: project } = useSelectedProjectQuery()
  const { projectAuthAll: authEnabled } = useIsFeatureEnabled(['project_auth:all'])
  const isPaused = project?.status === PROJECT_STATUS.INACTIVE

  const [selectedLang, setSelectedLang] = useState<'js' | 'bash'>('js')
  const [selectedApikey, setSelectedApiKey] = useState<any>(DEFAULT_KEY)

  const { data: openApiSpec } = useOpenAPISpecQuery(
    { projectRef },
    {
      enabled: !!projectRef && !isPaused,
    }
  )

  const tableNames = useMemo(
    () => (openApiSpec?.tables ?? []).map((table: any) => table.name),
    [openApiSpec]
  )
  const functionNames = useMemo(
    () => (openApiSpec?.functions ?? []).map((fn: any) => fn.name),
    [openApiSpec]
  )

  const activePage = useMemo(() => {
    if (!page && !resource && !rpc) return 'introduction'
    return (page || rpc || resource) as string
  }, [page, resource, rpc])

  const docsBasePath = projectRef ? `/project/${projectRef}/integrations/data_api/docs` : undefined

  const menu = useMemo(() => {
    if (!projectRef) return []
    return generateDocsMenu(projectRef, tableNames, functionNames, { authEnabled }, docsBasePath)
  }, [projectRef, tableNames, functionNames, authEnabled, docsBasePath])

  return (
    <div className="flex w-full bg-surface-100 flex-1 items-stretch">
      <aside className="hidden lg:flex flex-col gap-y-6 w-60 shrink-0 p-10">
        <LangSelector
          selectedLang={selectedLang}
          selectedApiKey={selectedApikey}
          setSelectedLang={(lang: 'js' | 'bash') => setSelectedLang(lang)}
          setSelectedApiKey={setSelectedApiKey}
        />
        <DocsMenu activePage={activePage} menu={menu} />
      </aside>
      <div className="flex-1 min-w-0 relative">
        <DocView
          selectedLang={selectedLang}
          setSelectedLang={setSelectedLang}
          selectedApikey={selectedApikey}
          setSelectedApiKey={setSelectedApiKey}
        />
      </div>
    </div>
  )
}

const DocView = ({
  selectedLang,
  selectedApikey,
}: {
  selectedLang: 'js' | 'bash'
  setSelectedLang: (lang: 'js' | 'bash') => void
  selectedApikey: any
  setSelectedApiKey: (key: any) => void
}) => {
  const functionPath = 'rpc/'

  const { ref: projectRef, page, resource, rpc } = useParams()

  const { data: settings, error: settingsError } = useProjectSettingsV2Query({ projectRef })
  const {
    data: jsonSchema,
    error: jsonSchemaError,
    isPending: isLoading,
    refetch,
  } = useProjectJsonSchemaQuery({ projectRef })
  const { data: customDomainData } = useCustomDomainsQuery({ projectRef })

  const refreshDocs = async () => await refetch()

  const protocol = settings?.app_config?.protocol ?? 'https'
  const hostEndpoint = settings?.app_config?.endpoint
  const endpoint =
    customDomainData?.customDomain?.status === 'active'
      ? `https://${customDomainData.customDomain?.hostname}`
      : `${protocol}://${hostEndpoint ?? '-'}`

  const { paths } = jsonSchema || {}
  const PAGE_KEY: any = resource || rpc || page || 'index'

  const { resources, rpcs } = Object.entries(paths || {}).reduce(
    (a, [name]) => {
      const trimmedName = name.slice(1)
      const id = trimmedName.replace(functionPath, '')

      const displayName = id.replace(/_/g, ' ')
      const camelCase = snakeToCamel(id)
      const enriched = { id, displayName, camelCase }

      if (!trimmedName.length) {
        return a
      }

      return {
        resources: {
          ...a.resources,
          ...(!trimmedName.includes(functionPath)
            ? {
                [id]: enriched,
              }
            : {}),
        },
        rpcs: {
          ...a.rpcs,
          ...(trimmedName.includes(functionPath)
            ? {
                [id]: enriched,
              }
            : {}),
        },
      }
    },
    { resources: {}, rpcs: {} }
  )

  if (settingsError || jsonSchemaError) {
    return (
      <div className="p-6 mx-auto text-center sm:w-full md:w-3/4">
        <p className="text-foreground-light">
          <p>Error connecting to API</p>
          <p>{`${settingsError || jsonSchemaError}`}</p>
        </p>
      </div>
    )
  }

  if (isLoading || !settings || !jsonSchema) {
    return (
      <div className="p-6 mx-auto text-center sm:w-full md:w-3/4">
        <h3 className="text-xl">Building docs ...</h3>
      </div>
    )
  }

  return (
    <div className="w-full h-full overflow-y-auto flex flex-col" key={PAGE_KEY}>
      <div className="flex-1 flex flex-col">
        {resource ? (
          <ResourceContent
            apiEndpoint={endpoint}
            selectedLang={selectedLang}
            resourceId={resource}
            resources={resources}
            showApiKey={selectedApikey.key}
            refreshDocs={refreshDocs}
          />
        ) : rpc ? (
          <RpcContent
            selectedLang={selectedLang}
            rpcId={rpc}
            paths={paths}
            rpcs={rpcs}
            showApiKey={selectedApikey.key}
            refreshDocs={refreshDocs}
          />
        ) : (
          <GeneralContent selectedLang={selectedLang} showApiKey={selectedApikey.key} page={page} />
        )}
      </div>
    </div>
  )
}

const DocsMenu = ({ menu, activePage }: { menu: ProductMenuGroup[]; activePage?: string }) => {
  return (
    <nav className="space-y-6 text-xs">
      {menu.map((group, idx) => (
        <div key={group.key || group.title || idx}>
          {group.title && (
            <div className="heading-meta mb-2 text-foreground-lighter">{group.title}</div>
          )}
          <div className="space-y-2">
            {group.items.map((item) => {
              const isActive = item.pages
                ? item.pages.includes(activePage ?? '')
                : activePage === item.key
              const isDisabled = !!item.disabled
              const content = (
                <span
                  className={cn(
                    'flex items-center',
                    isActive ? 'text-foreground' : 'text-foreground-light hover:text-foreground',
                    isDisabled && 'pointer-events-none opacity-50'
                  )}
                >
                  <span className="truncate">{item.name}</span>
                  {item.rightIcon && (
                    <span className="ml-auto text-foreground-lighter">{item.rightIcon}</span>
                  )}
                </span>
              )

              if (item.isExternal) {
                return (
                  <a
                    key={item.key}
                    href={item.url}
                    target="_blank"
                    rel="noreferrer"
                    className="block"
                  >
                    {content}
                  </a>
                )
              }

              return (
                <Link key={item.key} href={item.url} className="block">
                  {content}
                </Link>
              )
            })}
          </div>
        </div>
      ))}
    </nav>
  )
}
