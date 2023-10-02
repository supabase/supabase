import { ModalProps } from '@ui/components/Modal/Modal'
import { useLocalStorageQuery, useSelectedOrganization, useStore } from 'hooks'
import { IS_PLATFORM, OPT_IN_TAGS } from 'lib/constants'
import Link from 'next/link'
import { Alert, IconExternalLink, Modal, Toggle } from 'ui'
export interface AISettingsModalProps {
  visible: boolean
}

const AISettingsModal = (props: ModalProps) => {
  const selectedOrganization = useSelectedOrganization()
  const isOptedInToAI = selectedOrganization?.opt_in_tags?.includes(OPT_IN_TAGS.AI_SQL) ?? false
  const [hasEnabledAISchema, setHasEnabledAISchema] = useLocalStorageQuery(
    'supabase_sql-editor-ai-schema-enabled',
    true
  )
  const { ui } = useStore()

  const includeSchemaMetadata = (isOptedInToAI || !IS_PLATFORM) && hasEnabledAISchema

  const handleOptInToggle = () => {
    setHasEnabledAISchema((prev) => !prev)
    ui.setNotification({ category: 'success', message: 'Successfully saved settings' })
  }

  return (
    <Modal header="SQL Editor AI Settings" hideFooter closable {...props}>
      <div className="flex flex-col items-start justify-between gap-4 px-6 py-3">
        {IS_PLATFORM && !isOptedInToAI && selectedOrganization && (
          <Alert
            variant="warning"
            title="This option is only available if your organization has opted-in to sending anonymous data to OpenAI."
          >
            <Link
              href={`/org/${selectedOrganization.slug}/general`}
              className="flex flex-row gap-1 items-center"
              target="_blank"
              rel="noopener"
            >
              Go to your organization's settings to opt-in.
              <IconExternalLink className="inline-block w-3 h-3" />
            </Link>
          </Alert>
        )}
        <div className="flex justify-between gap-8 mr-8 my-4">
          <Toggle
            disabled={IS_PLATFORM && !isOptedInToAI}
            checked={includeSchemaMetadata}
            onChange={handleOptInToggle}
          />
          <div className="grid gap-2">
            <p className="text-sm">Include anonymous database metadata in AI queries</p>
            <p className="text-sm text-foreground-light">
              Includes table names, column names and their corresponding data types in the request.
              This will generate queries that are more relevant to your project.
            </p>
          </div>
        </div>
      </div>
    </Modal>
  )
}

export default AISettingsModal
