import { FC } from 'react'
import { observer } from 'mobx-react-lite'
import { Badge, IconLoader, IconMonitor, IconServer } from '@supabase/ui'

import { Project } from 'types'

// interface Props {
//   project: Project
// }

//const ProjectPausedState: FC<Props> = ({ project }) => {
const ProjectPausedState = () => {
  return (
    <>
      <div className="mx-auto my-16 w-full max-w-7xl space-y-16">
        <div className="mx-6 space-y-16">
          <div className="flex flex-col space-y-4 lg:flex-row lg:items-center lg:space-y-0 lg:space-x-6">
            <h1 className="text-3xl">PROJECT NAME</h1>
            <div>
              <Badge color="brand">
                <div className="flex items-center gap-2">
                  <IconLoader className="animate-spin" size={12} />
                  <span>Connecting to project</span>
                </div>
              </Badge>
            </div>
          </div>
          <div className="bg-scale-300 border-scale-400 flex h-[500px] items-center justify-center rounded border p-8">
            <div className="w-[420px] space-y-4">
              <div className="mx-auto flex max-w-[300px] items-center justify-center space-x-4 lg:space-x-8">
                <IconMonitor className="text-scale-1100" size={50} strokeWidth={1.5} />
                <IconServer className="text-scale-1100" size={50} strokeWidth={1.5} />
              </div>

              <div className="space-y-1">
                <p className="text-center">Connecting to PROJECT NAME</p>
              </div>

              <div className="flex flex-col items-center"></div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default observer(ProjectPausedState)
