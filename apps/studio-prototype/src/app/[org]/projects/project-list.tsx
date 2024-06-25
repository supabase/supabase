'use client'

import { useConfig } from '@/src/hooks/use-config'
import { Grid, List, Search } from 'lucide-react'
import { Badge, Button } from 'ui'
import { Input } from 'ui-patterns/DataInputs/Input'

export default function ProjectList() {
  const [config] = useConfig()
  const { selectedOrg, selectedProject, selectedEnv, settingsAllPreviews } = config

  return (
    <div className="mx-auto">
      <h2 className="text-2xl text-foreground mb-3">Projects</h2>
      <div className="flex gap-2 w-full">
        <Input
          icon={<Search size={14} />}
          size={'small'}
          placeholder="Search projects.."
          containerClassName="grow"
        />
        <div className="-space-x-px">
          <Button
            type="default"
            size="small"
            icon={<Grid />}
            className="px-2 rounded-r-none"
          ></Button>
          <Button
            type="default"
            size="small"
            icon={<List className="text-foreground" />}
            className="px-2 rounded-l-none"
          ></Button>
        </div>
      </div>
      <ul role="list" className="-space-y-px mt-3">
        {selectedOrg?.projects.map((project) => {
          return (
            <div
              key={project.key}
              className="bg-surface-100/50 border first-of-type:rounded-t-md last-of-type:rounded-b-md h-16 flex items-center  px-5"
            >
              <div className="flex flex-col gap-0">
                <div className="flex gap-2">
                  <div className="text-foreground">{project.name}</div>
                  <Badge variant={'default'} size={'small'}>
                    Micro
                  </Badge>
                </div>
                <div className="text-foreground-lighter/75 text-xs font-mono">
                  http://siteurl.com
                </div>
              </div>
            </div>
          )
        })}
      </ul>
    </div>
  )
}
