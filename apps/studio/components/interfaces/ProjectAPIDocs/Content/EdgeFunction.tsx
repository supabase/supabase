import { useParams } from 'common'

import { useEdgeFunctionsQuery } from 'data/edge-functions/edge-functions-query'
import { useAppStateSnapshot } from 'state/app-state'
import { DOCS_RESOURCE_CONTENT } from '../ProjectAPIDocs.constants'
import ResourceContent from '../ResourceContent'
import type { ContentProps } from './Content.types'

const Bucket = ({ language, apikey = 'API_KEY', endpoint }: ContentProps) => {
  const { ref } = useParams()
  const snap = useAppStateSnapshot()
  const { data } = useEdgeFunctionsQuery({ projectRef: ref })

  const resource = snap.activeDocsSection[1]
  const edgeFunctions = data ?? []
  const edgeFunction = edgeFunctions.find((fn) => fn.name === resource)

  if (edgeFunction === undefined) return null

  return (
    <div className="divide-y">
      <div className="space-y-1 px-4 py-4">
        <div className="flex items-center space-x-2">
          <h2>{edgeFunction.name}</h2>
        </div>
      </div>

      <ResourceContent
        selectedLanguage={language}
        snippet={DOCS_RESOURCE_CONTENT.invokeEdgeFunction}
        codeSnippets={DOCS_RESOURCE_CONTENT.invokeEdgeFunction.code({
          name: resource,
          endpoint: `${endpoint}`,
          apikey: apikey,
        })}
      />
    </div>
  )
}

export default Bucket
