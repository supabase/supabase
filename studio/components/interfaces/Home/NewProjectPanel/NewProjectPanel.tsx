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
        <h3 className="text-xl text-scale-1200">Connecting to your new project</h3>

        <p className="lg:max-w-sm text-scale-1000">
          Your project has API keys for interacting with the database via Supabase client libraries.
        </p>
      </div>
    </div>
    <div className="col-span-8">
      <DisplayApiSettings />
      <DisplayConfigSettings />
    </div>
  </div>
)

export default NewProjectPanel
