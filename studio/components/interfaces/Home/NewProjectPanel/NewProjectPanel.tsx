import { FC } from 'react'
import { Typography } from '@supabase/ui'

import GetStartedPanel from './GetStartedPanel'
import {
  DisplayApiSettings,
  DisplayConfigSettings,
} from 'components/to-be-cleaned/DisplayProjectSettings'

interface Props {}

const NewProjectPanel: FC<Props> = ({}) => (
  <div className="grid grid-cols-12 gap-8 mx-6">
    <div className="col-span-12">
      <GetStartedPanel />
    </div>
    <div className="col-span-4">
      <div className="space-y-2">
        <Typography.Title level={4} className="m-0">
          Connecting to your new project
        </Typography.Title>
        <div className="lg:max-w-sm">
          <Typography.Text className="block" type="secondary">
            <p>
              Your project has API keys for interacting with the database via Supabase client
              libraries.
            </p>
          </Typography.Text>
        </div>
      </div>
    </div>
    <div className="col-span-8">
      <DisplayApiSettings />
      <DisplayConfigSettings />
    </div>
  </div>
)

export default NewProjectPanel
