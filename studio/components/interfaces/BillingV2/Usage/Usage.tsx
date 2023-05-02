import { useParams } from 'common'
import ShimmeringLoader from 'components/ui/ShimmeringLoader'
import { useProjectsQuery } from 'data/projects/projects-query'
import { useProjectSubscriptionQuery } from 'data/subscriptions/project-subscription-query'
import { useEffect, useRef, useState } from 'react'
import { Button, IconCheckCircle, Listbox } from 'ui'
import Infrastructure from './Infrastructure'
import Bandwidth from './Bandwidth'
import SizeAndCounts from './SizeAndCounts'
import Activity from './Activity'

const Usage = () => {
  const { ref } = useParams()
  const [selectedProjectRef, setSelectedProjectRef] = useState<string>(ref as string)

  const infrastructureRef = useRef<HTMLDivElement>(null)
  const bandwidthRef = useRef<HTMLDivElement>(null)
  const sizeAndCountsRef = useRef<HTMLDivElement>(null)
  const activityRef = useRef<HTMLDivElement>(null)

  const { data: projects, isLoading, isSuccess } = useProjectsQuery()
  const { data: subscription } = useProjectSubscriptionQuery({ projectRef: ref })

  useEffect(() => {}, [isSuccess])

  const scrollTo = (id: 'infra' | 'bandwidth' | 'sizeCount' | 'activity') => {
    switch (id) {
      case 'infra':
        if (infrastructureRef.current)
          infrastructureRef.current.scrollIntoView({ behavior: 'smooth' })
        break
      case 'bandwidth':
        if (bandwidthRef.current) bandwidthRef.current.scrollIntoView({ behavior: 'smooth' })
        break
      case 'sizeCount':
        if (sizeAndCountsRef.current)
          sizeAndCountsRef.current.scrollIntoView({ behavior: 'smooth' })
        break
      case 'activity':
        if (activityRef.current) activityRef.current.scrollIntoView({ behavior: 'smooth' })
        break
    }
  }

  return (
    <>
      <div className="border-b">
        <div className="1xl:px-28 mx-auto flex flex-col px-5 lg:px-16 2xl:px-32 pt-6 space-y-4">
          <h3 className="text-scale-1200 text-xl">Usage</h3>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {/* <Billing cycle picker /> */}
              {isLoading ? (
                <ShimmeringLoader className="w-[200px]" />
              ) : (
                <Listbox size="small" value={ref} onChange={() => {}} className="w-[200px]">
                  {(projects ?? []).map((project) => (
                    <Listbox.Option
                      key={project.ref}
                      value={project.ref}
                      label={project.name}
                      className="!w-[200px]"
                    >
                      {project.name}
                    </Listbox.Option>
                  ))}
                </Listbox>
              )}
              {subscription !== undefined && (
                <p className="text-sm">Project is on {subscription.tier.name}</p>
              )}
            </div>
            <div className="flex items-center space-x-2">
              <Button type="default">View invoices</Button>
              <Button type="default">View billing</Button>
            </div>
          </div>

          <div className="flex items-center space-x-6 !mt-2">
            <div
              onClick={() => scrollTo('infra')}
              className="flex items-center opacity-50 space-x-2 py-3 hover:opacity-100 transition cursor-pointer"
            >
              <IconCheckCircle size={15} strokeWidth={2} className="text-brand-900" />
              <p className="text-sm">Infrastructure</p>
            </div>
            <div
              onClick={() => scrollTo('bandwidth')}
              className="flex items-center opacity-50 space-x-2 py-3 hover:opacity-100 transition cursor-pointer"
            >
              <IconCheckCircle size={15} strokeWidth={2} className="text-brand-900" />
              <p className="text-sm">Bandwidth</p>
            </div>
            <div
              onClick={() => scrollTo('sizeCount')}
              className="flex items-center opacity-50 space-x-2 py-3 hover:opacity-100 transition cursor-pointer"
            >
              <IconCheckCircle size={15} strokeWidth={2} className="text-brand-900" />
              <p className="text-sm">Size & Counts</p>
            </div>
            <div
              onClick={() => scrollTo('activity')}
              className="flex items-center opacity-50 space-x-2 py-3 hover:opacity-100 transition cursor-pointer"
            >
              <IconCheckCircle size={15} strokeWidth={2} className="text-brand-900" />
              <p className="text-sm">Activity</p>
            </div>
          </div>
        </div>
      </div>

      <div ref={infrastructureRef}>
        <Infrastructure />
      </div>
      <div ref={bandwidthRef}>
        <Bandwidth />
      </div>
      <div ref={sizeAndCountsRef}>
        <SizeAndCounts />
      </div>
      <div ref={activityRef}>
        <Activity />
      </div>
    </>
  )
}

export default Usage
