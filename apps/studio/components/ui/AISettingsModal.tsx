import Link from 'next/link'
import toast from 'react-hot-toast'

import { useOrgOptedIntoAi } from 'hooks/misc/useOrgOptedIntoAi'
import { useSchemasForAi } from 'hooks/misc/useSchemasForAi'
import { useSelectedOrganization } from 'hooks/misc/useSelectedOrganization'
import { useSelectedProject } from 'hooks/misc/useSelectedProject'
import { IS_PLATFORM } from 'lib/constants'
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
  const isOptedInToAI = useOrgOptedIntoAi()
  const selectedProject = useSelectedProject()

  const [selectedSchemas, setSelectedSchemas] = useSchemasForAi(selectedProject?.ref!)

  const includeSchemaMetadata = (isOptedInToAI || !IS_PLATFORM) && selectedSchemas.length > 0

  const handleOptInToggle = () => {
    // TODO: Fix this before merging.
    if (selectedSchemas.length === 0) {
      setSelectedSchemas(['public'])
    } else {
      setSelectedSchemas([])
    }
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
