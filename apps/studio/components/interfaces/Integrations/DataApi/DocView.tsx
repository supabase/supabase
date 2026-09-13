import { useParams } from 'common'
import { useRouter } from 'next/router'
import { useEffect } from 'react'
import { toast } from 'sonner'

import type { ShowApiKey } from '../../Docs/Docs.types'
import { GeneralContent } from '@/components/interfaces/Docs/GeneralContent'
import { ResourceContent } from '@/components/interfaces/Docs/ResourceContent'
import { RpcContent } from '@/components/interfaces/Docs/RpcContent'
import { buildEntityMaps } from '@/components/interfaces/Integrations/DataApi/DataApi.utils'
import { DocViewError } from '@/components/interfaces/Integrations/DataApi/DocViewError'
import { DocViewLoading } from '@/components/interfaces/Integrations/DataApi/DocViewLoading'
import { useProjectSettingsV2Query } from '@/data/config/project-settings-v2-query'
import { useProjectJsonSchemaQuery } from '@/data/docs/project-json-schema-query'

interface DocViewProps {
  selectedLang: 'js' | 'bash'
  selectedApiKey: ShowApiKey
}

export const DocView = ({ selectedLang, selectedApiKey }: DocViewProps) => {
  const router = useRouter()
  const { ref: projectRef, page, resource, rpc } = useParams()

  const { data: settings, error: settingsError } = useProjectSettingsV2Query({ projectRef })
  const {
    data: jsonSchema,
    error: jsonSchemaError,
    isPending: isLoading,
    refetch,
  } = useProjectJsonSchemaQuery({ projectRef })

  const { paths } = jsonSchema || {}
  const PAGE_KEY = resource || rpc || page || 'index'

  const { resources, rpcs } = buildEntityMaps(paths)

  const resourceMissing = !!resource && !(resource in resources)
  const rpcMissing = !!rpc && !(rpc in rpcs)

  useEffect(() => {
    const isSchemaReady = !isLoading && !!jsonSchema && !settingsError && !jsonSchemaError
    if (!isSchemaReady || !projectRef) return
    if (resourceMissing || rpcMissing) {
      toast.error(`${resourceMissing ? 'table/view' : 'function'} could not be found`)
      router.replace(`/project/${projectRef}/integrations/data_api/docs`)
    }
  }, [
    isLoading,
    jsonSchema,
    settingsError,
    jsonSchemaError,
    projectRef,
    resourceMissing,
    rpcMissing,
    router,
  ])

  if (settingsError || jsonSchemaError) {
    return <DocViewError error={settingsError || jsonSchemaError} />
  }

  if (isLoading || !settings || !jsonSchema) {
    return <DocViewLoading />
  }

  return (
    <div className="w-full h-full overflow-y-auto flex flex-col" key={PAGE_KEY}>
      <div className="flex-1 flex flex-col">
        {resource ? (
          <ResourceContent
            selectedLang={selectedLang}
            resourceId={resource}
            resources={resources}
            showApiKey={selectedApiKey.key}
            refreshDocs={refetch}
          />
        ) : rpc ? (
          <RpcContent
            selectedLang={selectedLang}
            rpcId={rpc}
            paths={paths}
            rpcs={rpcs}
            showApiKey={selectedApiKey.key}
            refreshDocs={refetch}
          />
        ) : (
          <GeneralContent selectedLang={selectedLang} showApiKey={selectedApiKey.key} page={page} />
        )}
      </div>
    </div>
  )
}
