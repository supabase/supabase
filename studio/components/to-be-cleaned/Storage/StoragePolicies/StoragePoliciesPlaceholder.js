import { Typography, IconArchive } from '@supabase/ui'
import Panel from 'components/to-be-cleaned/Panel'

const StoragePoliciesPlaceholder = ({ guiHeight }) => (
  <Panel
    title={[
      <div key="storagePlaceholder" className="flex items-center justify-between w-full">
        <div className="flex items-center space-x-4">
          <Typography.Text type="secondary">
            <IconArchive size="small" />
          </Typography.Text>
          <Typography.Title level={4} className="m-0">
            <span>Bucket policies</span>
          </Typography.Title>
        </div>
      </div>,
    ]}
  >
    <div className="p-4 px-6">
      <Typography.Text className="opacity-50 mt-5">
        Create a bucket first to start writing policies!
      </Typography.Text>
    </div>
  </Panel>
)

export default StoragePoliciesPlaceholder
