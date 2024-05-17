import { noop } from 'lodash'
import {
  AlertDescription_Shadcn_,
  AlertTitle_Shadcn_,
  Alert_Shadcn_,
  Button,
  IconEdit,
  IconExternalLink,
  IconGrid,
  Modal,
} from 'ui'

import CardButton from 'components/ui/CardButton'
import { FlaskConical } from 'lucide-react'
import { useAppStateSnapshot } from 'state/app-state'

interface PolicySelectionProps {
  description: string
  showAssistantPreview: boolean
  onViewTemplates: () => void
  onViewEditor: () => void
  onToggleFeaturePreviewModal?: () => void
}

const PolicySelection = ({
  description = '',
  showAssistantPreview,
  onViewTemplates = noop,
  onViewEditor = noop,
  onToggleFeaturePreviewModal,
}: PolicySelectionProps) => {
  const snap = useAppStateSnapshot()

  return (
    <Modal.Content className="space-y-4 py-4">
      <div className="flex flex-col gap-y-2">
        <p className="text-sm text-foreground-light">{description}</p>
        <div className="grid grid-cols-1 gap-2 lg:grid-cols-1">
          <CardButton
            title="Get started quickly"
            description="Create a policy from a template"
            icon={
              <div className="flex">
                <div
                  className="
                  flex h-8 w-8 items-center
                  justify-center
                  rounded bg-foreground text-background
                "
                >
                  <IconGrid size={14} strokeWidth={2} />
                </div>
              </div>
            }
            onClick={onViewTemplates}
          />
          <CardButton
            title="For full customization"
            description="Create a policy from scratch"
            icon={
              <div className="flex">
                <div
                  className="
                  flex h-8 w-8 items-center
                  justify-center
                  rounded bg-foreground text-background
                "
                >
                  <IconEdit size={14} strokeWidth={2} />
                </div>
              </div>
            }
            onClick={onViewEditor}
          />
        </div>
      </div>

      {showAssistantPreview && onToggleFeaturePreviewModal !== undefined && (
        <Alert_Shadcn_>
          <FlaskConical />
          <AlertTitle_Shadcn_>Try the new Supabase Assistant for RLS policies</AlertTitle_Shadcn_>
          <AlertDescription_Shadcn_>
            Create RLS policies for your tables with the help of AI
          </AlertDescription_Shadcn_>
          <div className="flex items-center gap-x-2 mt-3">
            <Button type="default" onClick={onToggleFeaturePreviewModal}>
              Toggle feature preview
            </Button>
            <Button asChild type="default" icon={<IconExternalLink size={14} strokeWidth={1.5} />}>
              <a
                href="https://supabase.com/blog/studio-introducing-assistant#introducing-the-supabase-assistant"
                target="_blank"
                rel="noreferrer"
              >
                Learn more
              </a>
            </Button>
          </div>
        </Alert_Shadcn_>
      )}
    </Modal.Content>
  )
}

export default PolicySelection
