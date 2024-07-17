'use client'

import SparkChart from '@/src/components/charts/spark-chart'
import { useConfig } from '@/src/hooks/use-config'
import { Box, Grid, List, MoreVertical, Search } from 'lucide-react'
import Link from 'next/link'
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
      <ul role="list" className="-space-y-px mt-3 divide-y">
        {selectedOrg?.projects.map((project) => {
          return (
            <Link
              href={`/${selectedOrg?.key}/${project?.key}/table-editor/1`}
              key={project.key}
              className="bg-surface-100/50 border px-5 first-of-type:rounded-t-md last-of-type:rounded-b-md h-16 flex items-center gap-10"
            >
              <Box className="text-foreground-muted" strokeWidth={1} />
              <div className="flex flex-col gap-0">
                <div className="flex gap-2 min-w-64">
                  <div className="text-foreground">{project.name}</div>
                  <Badge
                    variant={'default'}
                    size={'small'}
                    className="bg-opacity-100 bg-dash-canvas"
                  >
                    Micro
                  </Badge>
                </div>
                <div className="text-foreground-lighter/75 text-xs font-mono">
                  http://siteurl.com
                </div>
              </div>

              <div className="flex flex-col">
                <span className="font-mono text-xs text-foreground-lighter">Billed</span>
                <span className="font-mono text-xs text-foreground">$0.00</span>
              </div>

              <div className="flex flex-col min-w-[70px]">
                <span className="font-mono text-xs text-foreground-lighter">CPU</span>
                <SparkChart />
              </div>

              <div className="flex flex-col min-w-[70px]">
                <span className="font-mono text-xs text-foreground-lighter">Memory</span>
                <SparkChart />
              </div>

              <div className="grow"></div>

              <MoreVertical size={14} className="text-foreground-muted" strokeWidth={1} />
            </Link>
          )
        })}
      </ul>
    </div>
  )
}
