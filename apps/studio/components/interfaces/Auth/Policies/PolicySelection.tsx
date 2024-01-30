import { noop } from 'lodash'
import { Button, IconEdit, IconExternalLink, IconGrid, Modal } from 'ui'

import CardButton from 'components/ui/CardButton'
import { Info } from 'lucide-react'
import Link from 'next/link'
import { useAppStateSnapshot } from 'state/app-state'
import { LOCAL_STORAGE_KEYS } from 'lib/constants'

interface PolicySelectionProps {
  description: string
  onViewTemplates: () => void
  onViewEditor: () => void
  onSelectCancel: () => void
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
    <Modal.Content>
      <div className="space-y-6 py-8">
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
        <div className="bg-surface-200 rounded-md p-4 flex items-center  gap-2 text-sm">
          <Info size={16} strokeWidth={2} />
          <p>Try the new RLS Assistant</p>

          <ul className="flex items-center gap-1.5 ml-auto">
            <li>
              <Button type="default" onClick={toggleFeaturePreviewModal}>
                Enable
              </Button>
            </li>
            <li>
              <Button
                type="default"
                icon={<IconExternalLink size={14} strokeWidth={1.5} />}
                asChild
              >
                <Link
                  href="https://supabase.com/blog/studio-introducing-assistant#introducing-the-supabase-assistant"
                  target="_blank"
                  rel="noreferrer"
                >
                  Read more
                </Link>
              </Button>
            </li>
          </ul>
        </div>
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
      </div>
    </Modal.Content>
  )
}

export default PolicySelection
