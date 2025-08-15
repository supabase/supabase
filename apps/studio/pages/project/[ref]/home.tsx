import dayjs from 'dayjs'
import { useEffect, useRef, useState } from 'react'
import { useParams } from 'common'
import { useBranchesQuery } from 'data/branches/branches-query'
import { useSelectedOrganizationQuery } from 'hooks/misc/useSelectedOrganization'
import {
  useIsOrioleDb,
  useProjectByRefQuery,
  useSelectedProjectQuery,
} from 'hooks/misc/useSelectedProject'
import { IS_PLATFORM, PROJECT_STATUS } from 'lib/constants'
import { useAppStateSnapshot } from 'state/app-state'
import type { NextPageWithLayout } from 'types'
import {
  DndContext,
  DragEndEvent,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable'

import DefaultLayout from 'components/layouts/DefaultLayout'
import { ProjectLayoutWithAuth } from 'components/layouts/ProjectLayout/ProjectLayout'
import TopSection from 'components/interfaces/HomeNew/TopSection'
import GettingStartedSection from 'components/interfaces/HomeNew/GettingStartedSection'
import AdvisorSection from 'components/interfaces/HomeNew/AdvisorSection'
import CustomReportSection from 'components/interfaces/HomeNew/CustomReportSection'
import SortableSection from 'components/interfaces/HomeNew/SortableSection'
import { ProjectUsageSection } from 'components/interfaces/HomeNew/ProjectUsageSection'

const Home: NextPageWithLayout = () => {
  const { data: project } = useSelectedProjectQuery()
  const { data: organization } = useSelectedOrganizationQuery()
  const { data: parentProject } = useProjectByRefQuery(project?.parent_project_ref)
  const isOrioleDb = useIsOrioleDb()
  const snap = useAppStateSnapshot()
  const { ref, enableBranching } = useParams()

  const hasShownEnableBranchingModalRef = useRef(false)
  const isPaused = project?.status === PROJECT_STATUS.INACTIVE
  const isNewProject = dayjs(project?.inserted_at).isAfter(dayjs().subtract(2, 'day'))

  useEffect(() => {
    if (enableBranching && !hasShownEnableBranchingModalRef.current) {
      hasShownEnableBranchingModalRef.current = true
      snap.setShowCreateBranchModal(true)
    }
  }, [enableBranching, snap])

  const { data: branches } = useBranchesQuery({
    projectRef: project?.parent_project_ref ?? project?.ref,
  })

  const mainBranch = branches?.find((branch) => branch.is_default)
  const currentBranch = branches?.find((branch) => branch.project_ref === project?.ref)
  const isMainBranch = currentBranch?.name === mainBranch?.name

  let projectName = 'Welcome to your project'
  if (currentBranch && !isMainBranch) {
    projectName = currentBranch.name
  } else if (project?.name) {
    projectName = project.name
  }

  const [sectionOrder, setSectionOrder] = useState<string[]>([
    'getting-started',
    'usage',
    'advisor',
    'custom-report',
  ])

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }))
  const [activeId, setActiveId] = useState<string | null>(null)

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(String(event.active.id))
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    setSectionOrder((items) => {
      const oldIndex = items.indexOf(String(active.id))
      const newIndex = items.indexOf(String(over.id))
      if (oldIndex === -1 || newIndex === -1) return items
      return arrayMove(items, oldIndex, newIndex)
    })
    setActiveId(null)
  }

  return (
    <div className="w-full">
      <TopSection
        projectName={projectName}
        isMainBranch={isMainBranch}
        parentProject={parentProject}
        isOrioleDb={!!isOrioleDb}
        project={project}
        organization={organization}
        projectRef={ref}
        isPaused={isPaused}
      />

      {!isPaused && (
        <div className="py-16 px-8">
          <div className="mx-auto max-w-7xl space-y-16">
            <DndContext
              sensors={sensors}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
            >
              <SortableContext items={sectionOrder} strategy={verticalListSortingStrategy}>
                {sectionOrder.map((id) => {
                  if (id === 'getting-started') {
                    return (
                      <SortableSection key={id} id={id}>
                        <GettingStartedSection />
                      </SortableSection>
                    )
                  }
                  if (id === 'usage') {
                    return (
                      <SortableSection key={id} id={id}>
                        {IS_PLATFORM && <ProjectUsageSection />}
                      </SortableSection>
                    )
                  }
                  if (id === 'advisor') {
                    return (
                      <SortableSection key={id} id={id}>
                        {!isNewProject && <AdvisorSection />}
                      </SortableSection>
                    )
                  }
                  if (id === 'custom-report') {
                    return (
                      <SortableSection key={id} id={id}>
                        <CustomReportSection />
                      </SortableSection>
                    )
                  }
                  return null
                })}
              </SortableContext>
            </DndContext>
          </div>
        </div>
      )}
    </div>
  )
}

Home.getLayout = (page) => (
  <DefaultLayout>
    <ProjectLayoutWithAuth>{page}</ProjectLayoutWithAuth>
  </DefaultLayout>
)

export default Home
