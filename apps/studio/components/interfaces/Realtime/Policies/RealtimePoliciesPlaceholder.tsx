import Panel from 'components/ui/Panel'
import { IconArchive } from 'ui'

export const RealtimePoliciesPlaceholder = () => (
  <Panel
    title={[
      <div key="storagePlaceholder" className="flex w-full items-center justify-between">
        <div className="flex items-center space-x-4">
          <IconArchive size="small" />
          <h4>Channel policies</h4>
        </div>
      </div>,
    ]}
  >
    <div className="p-4 px-6">
      <p className="text-sm text-foreground-light">
        Create a channel first to start writing policies!
      </p>
    </div>
  </Panel>
)
