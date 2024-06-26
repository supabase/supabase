import ReadAndWritesChart from '@/src/components/charts/read-and-writes-chart'
import ProjectList from './project-list'
import ProjectsCharts from './projects-charts'
import ProjectsHeader from './projects-header'
import QueriesChart from '@/src/components/charts/queries-chart'
import IOPSChart from '@/src/components/charts/iops-chart'
import StorageChart from '@/src/components/charts/storage-chart'
import CPUAndMemoryChart from '@/src/components/charts/cpu-and-memory-chart'
import { Button, Separator } from 'ui'
import { Clock, MoreVertical } from 'lucide-react'
import Image from 'next/image'

export default function ProjectsPage() {
  return (
    <div className="flex flex-col gap-10 px-[48px]">
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
        <div className="grid grid-cols-3 gap-10">
          <QueriesChart />
          <ReadAndWritesChart />
          <QueriesChart />
        </div>
        {/* <IOPSChart /> */}
        {/* <StorageChart /> */}
        {/* <CPUAndMemoryChart /> */}
      </div>
      <Separator />
      <div className="flex flex-row gap-10 divide-x">
        <div className="grow">
          <ProjectList />
        </div>
        <div className="pl-5">
          <h2 className="text-lg text-foreground">Member activity</h2>
          <h2 className="text-xs text-foreground-muted mb-3">1,230 Backups in last 6 months</h2>
          <div className="grow rounded-md w-96 divide-y py-1">
            <MemberRow />
            <MemberRow />
            <MemberRow />
            <MemberRow />
            <MemberRow />
          </div>
        </div>
        <div className="pl-5">
          <h2 className="text-lg text-foreground">Backups</h2>
          <h2 className="text-xs text-foreground-muted mb-3">1,230 Backups in last 6 months</h2>
          <div className="grow rounded-md w-96 divide-y py-1">
            <MemberRow />
            <MemberRow />
            <MemberRow />
            <MemberRow />
            <MemberRow />
          </div>
        </div>
        {/* <div>Recent Members</div>
        <ProjectList /> */}
      </div>
    </div>
  )
}

const MemberRow = () => {
  return (
    <div className="flex gap-3 items-center py-2">
      <Image
        alt="icon"
        src="https://avatars.githubusercontent.com/u/8291514?v=4"
        className="rounded-full h-6 w-6"
        width={32}
        height={32}
      />
      <div className="flex flex-col gap-0 grow">
        <span className="text-xs text-foreground-lighter">Jonny Summers</span>
        <span className="text-sm text-foreground">Created a table</span>
      </div>
      <MoreVertical size={14} className="text-foreground-muted" strokeWidth={1} />
    </div>
  )
}
