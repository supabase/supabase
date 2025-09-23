import { useParams } from 'common'
import CodeSnippet from 'components/interfaces/Docs/CodeSnippet'
import Description from 'components/interfaces/Docs/Description'
import Param from 'components/interfaces/Docs/Param'
import Snippets from 'components/interfaces/Docs/Snippets'
import { useProjectSettingsV2Query } from 'data/config/project-settings-v2-query'
import { ProjectJsonSchemaPaths } from 'data/docs/project-json-schema-query'

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

const RpcContent = ({
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

  const { post } = path!
  const { parameters, summary } = post || {}
  const rpcParamsObject =
    parameters && parameters[0] && parameters[0].schema && (parameters[0].schema as any).properties
      ? (parameters[0].schema as any).properties
      : {}
  const rpcParams = Object.entries(rpcParamsObject)
    .map(([k, v]: any) => ({ name: k, ...v }))
    .filter((x) => !!x.name)

  if (!path) return null

  return (
    <>
      <h2 className="text-foreground mt-0">
        <span className="px-6 text-2xl">{meta.id}</span>
      </h2>

      <div className="doc-section">
        <article className="code-column text-foreground">
          <label className="font-mono text-xs uppercase text-foreground-lighter">Description</label>
          <Description content={summary ?? ''} metadata={{ rpc: rpcId }} onChange={refreshDocs} />
        </article>
        <article className="code">
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
        </article>
      </div>
      {rpcParams.length > 0 && (
        <div>
          <h3 className="text-foreground mt-0 px-6 capitalize">Function Arguments</h3>
          {rpcParams.map((x, i) => {
            return (
              <div key={i} className="doc-section">
                <article className="code-column text-foreground">
                  <Param
                    key={x.name}
                    name={x.name}
                    type={x.type}
                    format={x.format}
                    required={true}
                    description={false}
                  />
                </article>
                <article className="code"></article>
              </div>
            )
          })}
        </div>
      )}
    </>
  )
}

export default RpcContent
