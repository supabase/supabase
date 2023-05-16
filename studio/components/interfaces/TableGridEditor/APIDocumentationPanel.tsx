import { useState } from 'react'
import { SidePanel, IconBookOpen } from 'ui'

import { useStore } from 'hooks'
import { useParams } from 'common/hooks'
import { ResourceContent } from '../Docs'
import LangSelector from '../Docs/LangSelector'
import GeneratingTypes from '../Docs/GeneratingTypes'
import ActionBar from './SidePanelEditor/ActionBar'
import { useProjectApiQuery } from 'data/config/project-api-query'
import { useProjectJsonSchemaQuery } from 'data/docs/project-json-schema-query'
import { snakeToCamel } from 'lib/helpers'

interface APIDocumentationPanelProps {
  visible: boolean
  onClose: () => void
}

const APIDocumentationPanel = ({ visible, onClose }: APIDocumentationPanelProps) => {
  const { meta } = useStore()
  const { ref, page, id } = useParams()
  const {
    data: jsonSchema,
    error: jsonSchemaError,
    refetch,
  } = useProjectJsonSchemaQuery({ projectRef: ref })
  const { data: settings } = useProjectApiQuery({ projectRef: ref })

  const DEFAULT_KEY = { name: 'hide', key: 'SUPABASE_KEY' }
  const [selectedLang, setSelectedLang] = useState<any>('js')
  const [showApiKey, setShowApiKey] = useState<any>(DEFAULT_KEY)

  const tables = meta.tables.list()
  const autoApiService = {
    ...settings?.autoApiService,
    endpoint: `${settings?.autoApiService.protocol ?? 'https'}://${
      settings?.autoApiService.endpoint ?? '-'
    }`,
  }
  const apiService = settings?.autoApiService
  const anonKey = apiService?.service_api_keys.find((x) => x.name === 'anon key')
    ? apiService.defaultApiKey
    : undefined
  const resources = getResourcesFromJsonSchema(jsonSchema)

  function getResourcesFromJsonSchema(value: any) {
    const { paths } = value || {}
    const functionPath = 'rpc/'
    let resources: any = {}

    Object.entries(paths || []).forEach(([name, val]) => {
      let trimmed = name.slice(1)
      let id = trimmed.replace(functionPath, '')
      let displayName = id.replace(/_/g, ' ')
      let camelCase = snakeToCamel(id)
      let enriched = { id, displayName, camelCase }
      if (!trimmed.length) return
      else resources[id] = enriched
    })

    return resources
  }

  return (
    <SidePanel
      key="WrapperTableEditor"
      size="xxlarge"
      visible={visible}
      onCancel={() => onClose()}
      header={
        <span className="flex items-center gap-2">
          <IconBookOpen size="tiny" />
          API
        </span>
      }
      customFooter={
        <ActionBar
          backButtonLabel="Close"
          hideApply={true}
          formId="wrapper-table-editor-form"
          closePanel={() => onClose()}
        />
      }
    >
      <div className="Docs Docs--table-editor">
        <SidePanel.Content>
          {jsonSchemaError ? (
            <div className="p-6 mx-auto text-center sm:w-full md:w-3/4">
              <div className="text-scale-1000">
                <p>Error connecting to API</p>
                <p>{`${jsonSchemaError}`}</p>
              </div>
            </div>
          ) : (
            <>
              {jsonSchema ? (
                <>
                  <div className="sticky top-0 z-10 bg-scale-100 dark:bg-scale-300">
                    <LangSelector
                      selectedLang={selectedLang}
                      setSelectedLang={setSelectedLang}
                      showApiKey={showApiKey}
                      setShowApiKey={setShowApiKey}
                      apiKey={anonKey}
                      autoApiService={autoApiService}
                    />
                  </div>

                  {jsonSchema?.definitions && (
                    <ResourceContent
                      autoApiService={autoApiService}
                      selectedLang={selectedLang}
                      resourceId={tables.find((table) => table.id === Number(id))?.name}
                      resources={resources}
                      definitions={jsonSchema.definitions}
                      paths={jsonSchema.paths}
                      showApiKey={showApiKey.key}
                      refreshDocs={async () => await refetch()}
                    />
                  )}
                  <div className="mt-8">
                    <GeneratingTypes selectedLang={selectedLang} />
                  </div>
                </>
              ) : (
                <div className="p-6 mx-auto text-center sm:w-full md:w-3/4">
                  <h3 className="text-lg">Building docs ...</h3>
                </div>
              )}
            </>
          )}
        </SidePanel.Content>
      </div>
    </SidePanel>
  )
}

export default APIDocumentationPanel
