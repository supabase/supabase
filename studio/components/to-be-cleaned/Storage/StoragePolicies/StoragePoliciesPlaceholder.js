import { IconArchive } from '@supabase/ui'
import Panel from 'components/ui/Panel'

const StoragePoliciesPlaceholder = ({ guiHeight }) => (
  <Panel
    title={[
      <div key="storagePlaceholder" className="flex items-center justify-between w-full">
        <div className="flex items-center space-x-4">
          <IconArchive size="small" />
          <h4>Bucket policies</h4>
        </div>
      </div>,
    ]}
  >
    <div className="p-4 px-6">
      <p className="text-sm text-scale-1100">Create a bucket first to start writing policies!</p>
    </div>
  </Panel>
)

export default StoragePoliciesPlaceholder
