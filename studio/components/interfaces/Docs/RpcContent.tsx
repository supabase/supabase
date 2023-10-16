import CodeSnippet from 'components/interfaces/Docs/CodeSnippet'
import Description from 'components/interfaces/Docs/Description'
import Param from 'components/interfaces/Docs/Param'
import Snippets from 'components/interfaces/Docs/Snippets'

/**
 * TODO: need to support rpc with the same name and different params type
 */
const RpcContent = ({
  autoApiService,
  rpcId,
  rpcs,
  paths,
  selectedLang,
  refreshDocs,
  showApiKey,
}: any) => {
  const meta = rpcs[rpcId]
  const pathKey = `/rpc/${rpcId}`
  const path = paths && pathKey in paths ? paths[pathKey] : undefined
  const keyToShow = !!showApiKey ? showApiKey : 'SUPABASE_KEY'

  if (!path) return null

  const {
    post: { parameters, summary },
  } = path
  const rpcParamsObject =
    parameters && parameters[0] && parameters[0].schema && parameters[0].schema.properties
      ? parameters[0].schema.properties
      : {}
  const rpcParams = Object.entries(rpcParamsObject)
    .map(([k, v]: any) => ({ name: k, ...v }))
    .filter((x) => !!x.name)
  const paramList = rpcParams.map((x) => x.type).join(', ')

  return (
    <>
      <h2 className="text-foreground mt-0">
        <span className="px-6 text-2xl">{meta.id}</span>
      </h2>

      <div className="doc-section">
        <article className="code-column text-foreground">
          <label className="font-mono text-xs uppercase text-foreground-lighter">Description</label>
          <Description content={summary} metadata={{ rpc: rpcId }} onChange={refreshDocs} />
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
              endpoint: autoApiService.endpoint,
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
