import Link from 'next/link'
import toast from 'react-hot-toast'

import { useLocalStorageQuery } from 'hooks/misc/useLocalStorage'
import { useSelectedOrganization } from 'hooks/misc/useSelectedOrganization'
import { IS_PLATFORM, LOCAL_STORAGE_KEYS, OPT_IN_TAGS } from 'lib/constants'
import { useAppStateSnapshot } from 'state/app-state'
import {
  AlertDescription_Shadcn_,
  AlertTitle_Shadcn_,
  Alert_Shadcn_,
  Button,
  Modal,
  Toggle,
  WarningIcon,
} from 'ui'

const AISettingsModal = () => {
  const snap = useAppStateSnapshot()
  const selectedOrganization = useSelectedOrganization()
  const isOptedInToAI = selectedOrganization?.opt_in_tags?.includes(OPT_IN_TAGS.AI_SQL) ?? false

  const [hasEnabledAISchema, setHasEnabledAISchema] = useLocalStorageQuery(
    LOCAL_STORAGE_KEYS.SQL_EDITOR_AI_SCHEMA,
    true
  )

  const includeSchemaMetadata = (isOptedInToAI || !IS_PLATFORM) && hasEnabledAISchema

  const handleOptInToggle = () => {
    setHasEnabledAISchema((prev) => !prev)
    toast.success('Successfully saved settings')
  }

  return (
    <Modal
      hideFooter
      header="Supabase AI Settings"
      visible={snap.showAiSettingsModal}
      onCancel={() => snap.setShowAiSettingsModal(false)}
    >
      <Modal.Content className="flex flex-col items-start justify-between gap-y-4">
        <div className="flex justify-between gap-x-5 mr-8 my-4">
          <Toggle
            disabled={IS_PLATFORM && !isOptedInToAI}
            checked={includeSchemaMetadata}
            onChange={handleOptInToggle}
          />
          <div className="grid gap-2">
            <p className="text-sm">Include anonymous database metadata in AI queries</p>
            <p className="text-sm text-foreground-light">
              Metadata includes table names, column names and their corresponding data types in the
              request. This will generate queries that are more relevant to your project.
            </p>
          </div>
        </div>
        {IS_PLATFORM && !isOptedInToAI && selectedOrganization && (
          <Alert_Shadcn_ variant="warning">
            <WarningIcon />
            <AlertTitle_Shadcn_>
              Your organization does not allow sending anonymous data to OpenAI
            </AlertTitle_Shadcn_>
            <AlertDescription_Shadcn_>
              This option is only available if your organization has opted-in to sending anonymous
              data to OpenAI. You may configure your opt-in preferences through your organization's
              settings.
            </AlertDescription_Shadcn_>
            <AlertDescription_Shadcn_ className="mt-3">
              <Button asChild type="default">
                <Link
                  target="_blank"
                  rel="noreferrer"
                  href={`/org/${selectedOrganization.slug}/general`}
                  className="flex flex-row gap-1 items-center"
                >
                  Head to organization settings
                </Link>
              </Button>
            </AlertDescription_Shadcn_>
          </Alert_Shadcn_>
        )}
      </Modal.Content>
    </Modal>
  )
}

export default AISettingsModal
