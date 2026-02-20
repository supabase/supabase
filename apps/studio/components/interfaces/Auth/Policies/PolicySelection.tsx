import CardButton from 'components/ui/CardButton'
import { noop } from 'lodash'
import { Edit, Grid } from 'lucide-react'
import { useAppStateSnapshot } from 'state/app-state'
import { Modal } from 'ui'

interface PolicySelectionProps {
  description: string
  onViewTemplates: () => void
  onViewEditor: () => void
}

export const PolicySelection = ({
  description = '',
  onViewTemplates = noop,
  onViewEditor = noop,
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
                  <Grid size={14} strokeWidth={2} />
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
                  <Edit size={14} strokeWidth={2} />
                </div>
              </div>
            }
            onClick={onViewEditor}
          />
        </div>
      </div>
    </Modal.Content>
  )
}
