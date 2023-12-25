import { noop } from 'lodash'
import { IconEdit, IconGrid, Modal } from 'ui'

import CardButton from 'components/ui/CardButton'

interface PolicySelectionProps {
  description: string
  onViewTemplates: () => void
  onViewEditor: () => void
}

const PolicySelection = ({
  description = '',
  onViewTemplates = noop,
  onViewEditor = noop,
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
