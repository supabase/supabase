import { IconAlertCircle } from 'ui'

import Panel from 'components/ui/Panel'
import { useParams, useStore } from 'hooks'

const CustomDomainConfig = () => {
  const { ui } = useStore()
  const { ref } = useParams()

  const isError = false

  return (
    <>
      <Panel title={<h5 className="mb-0">Custom Domains</h5>}>
        <Panel.Content className="space-y-6 border-t border-panel-border-interior-light dark:border-panel-border-interior-dark">
          {isError && (
            <div className="flex items-center justify-center space-x-2 py-8">
              <IconAlertCircle size={16} strokeWidth={1.5} />
              <p className="text-sm text-scale-1100">
                Failed to retrieve custom domain configuration
              </p>
            </div>
          )}

          <div>coming soon...</div>
        </Panel.Content>
      </Panel>

      {/* Add modals here */}
    </>
  )
}

export default CustomDomainConfig
