import { ModalProps } from '@ui/components/Modal/Modal'
import { useLocalStorageQuery, useSelectedOrganization } from 'hooks'
import { IS_PLATFORM } from 'lib/constants'
import Link from 'next/link'
import { Alert, IconExternalLink, Modal, Toggle } from 'ui'

export interface AISettingsModalProps {
  visible: boolean
}

const AISettingsModal = (props: ModalProps) => {
  const selectedOrganization = useSelectedOrganization()
  const isOptedInToAI =
    selectedOrganization?.opt_in_tags?.includes('AI_SQL_GENERATOR_OPT_IN') ?? false
  const [isOptedInToAISchema, setIsOptedInToAISchema] = useLocalStorageQuery(
    'supabase_sql-editor-ai-schema',
    false
  )

  const includeSchemaMetadata = (isOptedInToAI || !IS_PLATFORM) && isOptedInToAISchema

  return (
    <Modal header="SQL Editor AI Settings" hideFooter closable {...props}>
      <div className="flex flex-col items-start justify-between gap-4 px-6 py-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm">Include database metadata in AI requests</p>
            <p className="text-sm text-scale-1000">
              Includes table names, column names and their corresponding data types in the request.
              This will generate snippets that are more relevant to your project.
            </p>
          </div>
          <Toggle
            disabled={IS_PLATFORM && !isOptedInToAI}
            checked={includeSchemaMetadata}
            onChange={() => setIsOptedInToAISchema((prev) => !prev)}
          />
        </div>
        {IS_PLATFORM && !isOptedInToAI && selectedOrganization && (
          <Alert
            variant="warning"
            title="This option requires the OpenAI data opt-in on your organization"
          >
            <Link href={`/org/${selectedOrganization.slug}/general`} passHref>
              <a className="flex flex-row gap-1 items-center" target="_blank" rel="noopener">
                Go to your organization's settings to opt-in.
                <IconExternalLink className="inline-block w-3 h-3" />
              </a>
            </Link>
          </Alert>
        )}
      </div>
    </Modal>
  )
}

export default AISettingsModal
