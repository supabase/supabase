import { useParams } from 'common'

import { DocSection } from './DocSection'
import CodeSnippet from '@/components/interfaces/Docs/CodeSnippet'
import Description from '@/components/interfaces/Docs/Description'
import Param from '@/components/interfaces/Docs/Param'
import Snippets from '@/components/interfaces/Docs/Snippets'
import { useProjectSettingsV2Query } from '@/data/config/project-settings-v2-query'
import { ProjectJsonSchemaPaths } from '@/data/docs/project-json-schema-query'

/**
 * TODO: need to support rpc with the same name and different params type
 */

interface RpcContentProps {
  rpcId: string
  rpcs: { [key: string]: any }
  paths?: ProjectJsonSchemaPaths
  selectedLang: 'bash' | 'js'
  showApiKey: string
  refreshDocs: () => void
}

export const RpcContent = ({
  rpcId,
  rpcs,
  paths,
  selectedLang,
  showApiKey,
  refreshDocs,
}: RpcContentProps) => {
  const { ref: projectRef } = useParams()
  const { data: settings } = useProjectSettingsV2Query({ projectRef })
  const protocol = settings?.app_config?.protocol ?? 'https'
  const hostEndpoint = settings?.app_config?.endpoint ?? ''
  const endpoint = `${protocol}://${hostEndpoint ?? ''}`

  const meta = rpcs[rpcId]
  const pathKey = `/rpc/${rpcId}`
  const path = paths && pathKey in paths ? paths[pathKey] : undefined
  const keyToShow = !!showApiKey ? showApiKey : 'SUPABASE_KEY'

  const { parameters, summary } = path?.post || {}
  const rpcParamsObject =
    parameters && parameters[0] && parameters[0].schema && (parameters[0].schema as any).properties
      ? (parameters[0].schema as any).properties
      : {}
  const rpcParams = Object.entries(rpcParamsObject)
    .map(([k, v]: any) => ({ name: k, ...v }))
    .filter((x) => !!x.name)

  if (!path) return null

  return (
    <div className="flex flex-col flex-1">
      <DocSection
        title={meta.id}
        content={
          <>
            <label className="font-mono text-xs uppercase text-foreground-lighter inline-block mb-2">
              Description
            </label>
            <Description content={summary ?? ''} metadata={{ rpc: rpcId }} onChange={refreshDocs} />
          </>
        }
        snippets={
          <CodeSnippet
            selectedLang={selectedLang}
            snippet={Snippets.rpcSingle({
              rpcName: rpcId,
              // @ts-ignore
              rpcCamelCase: meta.camelCase,
              rpcParams: rpcParams,
              apiKey: keyToShow,
              endpoint: endpoint,
            })}
          />
        }
      />

      {rpcParams.length > 0 && (
        <div className="flex flex-col flex-1">
          <DocSection title="Function Arguments" content={null} />
          {rpcParams.map((x, i) => {
            return (
              <DocSection
                key={i}
                title={null}
                content={
                  <Param
                    key={x.name}
                    name={x.name}
                    type={x.type}
                    format={x.format}
                    required={true}
                    description={false}
                  />
                }
              />
            )
          })}
        </div>
      )}
    </div>
  )
}
