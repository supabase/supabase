import { FC } from 'react'
import { IconEdit, IconGrid, Modal } from '@supabase/ui'
import CardButton from 'components/ui/CardButton'

interface Props {
  description: string
  onViewTemplates: () => void
  onViewEditor: () => void
}

const PolicySelection: FC<Props> = ({
  description = '',
  onViewTemplates = () => {},
  onViewEditor = () => {},
}) => {
  return (
    <Modal.Content>
      <div className="space-y-6 py-8">
        <div>
          <p className="text-scale-1100 text-sm">{description}</p>
        </div>
        <div className="grid grid-cols-1 gap-2 lg:grid-cols-1">
          <CardButton
            title="Get started quickly"
            description="Create a policy from a template"
            icon={
              <div className="flex">
                <div
                  className="
                  bg-scale-1200 text-scale-100 flex h-8
                  w-8
                  items-center justify-center rounded  
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
                  bg-scale-1200 text-scale-100 flex h-8
                  w-8
                  items-center justify-center rounded  
                "
                >
                  <IconEdit size={14} strokeWidth={2} />
                </div>
              </div>
            }
            onClick={onViewEditor}
          />
        </div>
        <p className="text-scale-1100 text-sm">
          Not sure what policies are? Check out our resources{' '}
          <a
            target="_blank"
            className="text-brand-900 hover:text-brand-1200 transition-colors"
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
