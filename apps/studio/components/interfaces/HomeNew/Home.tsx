import { DndContext, DragEndEvent, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { arrayMove, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { useEffect, useRef } from 'react'

import { IS_PLATFORM, useParams } from 'common'
import { SortableSection } from 'components/interfaces/HomeNew/SortableSection'
import { TopSection } from 'components/interfaces/HomeNew/TopSection'
import { ScaffoldContainer, ScaffoldSection } from 'components/layouts/Scaffold'
import { useBranchesQuery } from 'data/branches/branches-query'
import { useProjectDetailQuery } from 'data/projects/project-detail-query'
import { useSendEventMutation } from 'data/telemetry/send-event-mutation'
import { useLocalStorage } from 'hooks/misc/useLocalStorage'
import { useSelectedOrganizationQuery } from 'hooks/misc/useSelectedOrganization'
import { useIsOrioleDb, useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { PROJECT_STATUS } from 'lib/constants'
import { useAppStateSnapshot } from 'state/app-state'
import { AdvisorSection } from './AdvisorSection'
import { CustomReportSection } from './CustomReportSection'
import {
  GettingStartedSection,
  type GettingStartedState,
} from './GettingStarted/GettingStartedSection'
import { ProjectUsageSection } from './ProjectUsageSection'

export const HomeV2 = () => {
  const { ref, enableBranching } = useParams()
  const isOrioleDb = useIsOrioleDb()
  const snap = useAppStateSnapshot()
  const { data: project } = useSelectedProjectQuery()
  const { data: organization } = useSelectedOrganizationQuery()
  const { data: parentProject } = useProjectDetailQuery({ ref: project?.parent_project_ref })
  const { mutate: sendEvent } = useSendEventMutation()

  const hasShownEnableBranchingModalRef = useRef(false)
  const isPaused = project?.status === PROJECT_STATUS.INACTIVE

  const { data: branches } = useBranchesQuery({
    projectRef: project?.parent_project_ref ?? project?.ref,
  })

  const mainBranch = branches?.find((branch) => branch.is_default)
  const currentBranch = branches?.find((branch) => branch.project_ref === project?.ref)
  const isMainBranch = currentBranch?.name === mainBranch?.name

  const projectName =
    currentBranch && !isMainBranch
      ? currentBranch.name
      : project?.name
        ? project.name
        : 'Welcome to your project'

  const [sectionOrder, setSectionOrder] = useLocalStorage<string[]>(
    `home-section-order-${project?.ref || 'default'}`,
    ['getting-started', 'usage', 'advisor', 'custom-report']
  )

  const [gettingStartedState, setGettingStartedState] = useLocalStorage<GettingStartedState>(
    `home-getting-started-${project?.ref || 'default'}`,
    'empty'
  )

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }))

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    setSectionOrder((items) => {
      const oldIndex = items.indexOf(String(active.id))
      const newIndex = items.indexOf(String(over.id))
      if (oldIndex === -1 || newIndex === -1) return items

      if (project?.ref && organization?.slug) {
        sendEvent({
          action: 'home_section_rows_moved',
          properties: {
            section_moved: String(active.id),
            old_position: oldIndex,
            new_position: newIndex,
          },
          groups: {
            project: project.ref,
            organization: organization.slug,
          },
        })
      }

      return arrayMove(items, oldIndex, newIndex)
    })
  }

  useEffect(() => {
    if (enableBranching && !hasShownEnableBranchingModalRef.current) {
      hasShownEnableBranchingModalRef.current = true
      snap.setShowCreateBranchModal(true)
    }
  }, [enableBranching, snap])

  return (
    <div className="w-full">
      <ScaffoldContainer size="large">
        <ScaffoldSection isFullWidth className="pt-16 pb-0">
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
        </ScaffoldSection>
      </ScaffoldContainer>

      {!isPaused && (
        <ScaffoldContainer size="large">
          <ScaffoldSection isFullWidth className="gap-16 pb-32">
            <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
              <SortableContext
                items={sectionOrder.filter(
                  (id) => id !== 'getting-started' || gettingStartedState !== 'hidden'
                )}
                strategy={verticalListSortingStrategy}
              >
                {sectionOrder.map((id) => {
                  if (IS_PLATFORM && id === 'usage') {
                    return (
                      <SortableSection key={id} id={id}>
                        <ProjectUsageSection />
                      </SortableSection>
                    )
                  }
                  if (id === 'getting-started') {
                    return gettingStartedState === 'hidden' ? null : (
                      <SortableSection key={id} id={id}>
                        <GettingStartedSection
                          value={gettingStartedState}
                          onChange={setGettingStartedState}
                        />
                      </SortableSection>
                    )
                  }
                  if (id === 'advisor') {
                    return (
                      <SortableSection key={id} id={id}>
                        <AdvisorSection />
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
                })}
              </SortableContext>
            </DndContext>
          </ScaffoldSection>
        </ScaffoldContainer>
      )}
    </div>
  )
}
