import { IconEdit, IconGrid, Modal } from '@supabase/ui'
import CardButton from 'components/ui/CardButton'

const PolicySelection = ({
  description = '',
  onViewTemplates = () => {},
  onViewEditor = () => {},
}) => {
  return (
    <Modal.Content>
      <div className="py-8 space-y-6">
        <div>
          <p className="text-sm text-scale-1100">{description}</p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-1 gap-2">
          <CardButton
            hoverable
            className="cursor-pointer py-4"
            onClick={onViewTemplates}
            // imgUrl={'/img/policy-template.svg'}
            title="Get started quickly"
            description="Create a policy from a template"
            icon={
              <div className="flex">
                <div
                  className="
                  w-8 h-8 bg-scale-1200 text-scale-100
                  rounded
                  flex items-center justify-center  
                "
                >
                  <IconGrid size={14} strokeWidth={2} />
                </div>
              </div>
            }
          />

          <CardButton
            hoverable
            className="cursor-pointer py-4"
            onClick={onViewEditor}
            title="For full customization"
            description="Create a policy from scratch"
            icon={
              <div className="flex">
                <div
                  className="
                  w-8 h-8 bg-scale-1200 text-scale-100
                  rounded
                  flex items-center justify-center  
                "
                >
                  <IconEdit size={14} strokeWidth={2} />
                </div>
              </div>
            }
          />
        </div>
        <p className="text-sm text-scale-1100">
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
