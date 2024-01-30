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
import { Info } from 'lucide-react'
import Link from 'next/link'
import { useAppStateSnapshot } from 'state/app-state'
import { LOCAL_STORAGE_KEYS } from 'lib/constants'

interface PolicySelectionProps {
  description: string
  onViewTemplates: () => void
  onViewEditor: () => void
  onSelectCancel?: () => void
}

const PolicySelection = ({
  description = '',
  onViewTemplates = noop,
  onViewEditor = noop,
  onSelectCancel = noop,
}: PolicySelectionProps) => {
  const snap = useAppStateSnapshot()

  function toggleFeaturePreviewModal() {
    snap.setSelectedFeaturePreview(LOCAL_STORAGE_KEYS.UI_PREVIEW_RLS_AI_ASSISTANT)
    snap.setShowFeaturePreviewModal(!snap.showFeaturePreviewModal)
    onSelectCancel()
  }

  return (
    <Modal.Content className="space-y-6 py-6">
      <div>
        <p className="text-sm text-foreground-light">{description}</p>
      </div>
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

      <Alert_Shadcn_>
        <AlertTitle_Shadcn_>Try the new Supabase Assistant for RLS policies</AlertTitle_Shadcn_>
        <AlertDescription_Shadcn_>
          Create RLS policies for your tables with the help of AI
        </AlertDescription_Shadcn_>
        <div className="flex items-center gap-x-2 mt-3">
          <Button type="default" onClick={toggleFeaturePreviewModal}>
            See feature preview
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

      <p className="text-sm text-foreground-light">
        Not sure what policies are? Check out our resources{' '}
        <a
          target="_blank"
          rel="noreferrer"
          className="text-brand transition-colors hover:text-brand-600"
          href="https://supabase.com/docs/guides/auth#policies"
        >
          here
        </a>
        .
      </p>
    </Modal.Content>
  )
}

export default PolicySelection
