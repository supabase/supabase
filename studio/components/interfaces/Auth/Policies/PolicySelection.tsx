import { noop } from 'lodash'
import { Button, IconEdit, IconExternalLink, IconGrid, Modal } from 'ui'

import CardButton from 'components/ui/CardButton'

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
  onSelectCancel = () => {},
}: PolicySelectionProps) => {
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
                  rounded bg-foreground text-background"
                >
                  <IconEdit size={14} strokeWidth={2} />
                </div>
              </div>
            }
            onClick={onViewEditor}
          />
        </div>
      </div>
      <div className="flex w-full items-center justify-end space-x-4 border-t py-3 dark:border-dark">
        <Button asChild type="link" icon={<IconExternalLink size={14} strokeWidth={1.5} />}>
          <a href="https://supabase.com/docs/guides/auth#policies" target="_blank" rel="noreferrer">
            Documentation
          </a>
        </Button>
        <div className="flex w-full items-center justify-end gap-2">
          <Button type="default" onClick={onSelectCancel}>
            Cancel
          </Button>
        </div>
      </div>
    </Modal.Content>
  )
}

export default PolicySelection
