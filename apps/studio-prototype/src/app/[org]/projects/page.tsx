import ReadAndWritesChart from '@/src/components/charts/read-and-writes-chart'
import ProjectList from './project-list'
import ProjectsCharts from './projects-charts'
import ProjectsHeader from './projects-header'
import QueriesChart from '@/src/components/charts/queries-chart'
import IOPSChart from '@/src/components/charts/iops-chart'
import StorageChart from '@/src/components/charts/storage-chart'
import CPUAndMemoryChart from '@/src/components/charts/cpu-and-memory-chart'
import { Button, Separator } from 'ui'
import { Clock } from 'lucide-react'

export default function ProjectsPage() {
  return (
    <div className="flex flex-col gap-4 px-[48px]">
      <ProjectsHeader />
      <Separator />
      <div className="flex flex-col gap-4">
        <div className="flex gap-2">
          <div className="-space-x-px flex items-center">
            <Button type="default" className="rounded-r-none">
              All projects
            </Button>
            <Button type="default" className="rounded-l-none" icon={<Clock />}>
              Last 6 hours
            </Button>
          </div>
          <Button type="default">All products</Button>
        </div>
        <div className="flex gap-10">
          <QueriesChart />
          <ReadAndWritesChart />
          <QueriesChart />
        </div>
        {/* <IOPSChart /> */}
        {/* <StorageChart /> */}
        {/* <CPUAndMemoryChart /> */}
      </div>
      <div className="flex flex-row gap-10">
        <div className="grow">
          <ProjectList />
        </div>
        {/* <div>Recent Members</div>
        <ProjectList /> */}
      </div>
    </div>
  )
}
