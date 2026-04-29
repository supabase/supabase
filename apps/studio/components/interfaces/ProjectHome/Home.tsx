import { DndContext, DragEndEvent, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { arrayMove, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { IS_PLATFORM, useFlag, useParams } from 'common'
import dayjs from 'dayjs'
import { useEffect, useRef } from 'react'
import { cn } from 'ui'

import { AdvisorSection } from './AdvisorSection'
import { ConnectSection } from './ConnectSection'
import { CustomReportSection } from './CustomReportSection'
import { DEFAULT_SECTION_ORDER, mergeSectionOrder } from './Home.utils'
import { ProjectUsageSection as ProjectUsageSectionV2 } from './ProjectUsageSection'
import { ProjectUsageSection as ProjectUsageSectionV1 } from '@/components/interfaces/Home/ProjectUsageSection'
import { SortableSection } from '@/components/interfaces/ProjectHome/SortableSection'
import { TopSection } from '@/components/interfaces/ProjectHome/TopSection'
import { ProjectNeedsSecuring } from '@/components/layouts/ProjectNeedsSecuring/ProjectNeedsSecuring'
import { ScaffoldContainer, ScaffoldSection } from '@/components/layouts/Scaffold'
import { useLocalStorage } from '@/hooks/misc/useLocalStorage'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'
import { PROJECT_STATUS } from '@/lib/constants'
import { useTrack } from '@/lib/telemetry/track'
import { useAppStateSnapshot } from '@/state/app-state'

export const ProjectHome = () => {
  const { enableBranching } = useParams()
  const snap = useAppStateSnapshot()
  const { data: project } = useSelectedProjectQuery()
  const track = useTrack()

  const showHomepageUsageV2 = useFlag('newHomepageUsageV2')

  const isMatureProject = dayjs(project?.inserted_at).isBefore(dayjs().subtract(10, 'day'))

  const hasShownEnableBranchingModalRef = useRef(false)
  const isPaused = project?.status === PROJECT_STATUS.INACTIVE
  const isComingUp = project?.status === PROJECT_STATUS.COMING_UP

  const [sectionOrder, setSectionOrder] = useLocalStorage<string[]>(
    `home-section-order-${project?.ref || 'default'}`,
    DEFAULT_SECTION_ORDER
  )

  const UsageSection = showHomepageUsageV2 ? ProjectUsageSectionV2 : ProjectUsageSectionV1

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }))

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    setSectionOrder((items) => {
      const oldIndex = items.indexOf(String(active.id))
      const newIndex = items.indexOf(String(over.id))
      if (oldIndex === -1 || newIndex === -1) return items

      track('home_section_rows_moved', {
        section_moved: String(active.id),
        old_position: oldIndex,
        new_position: newIndex,
      })

      return arrayMove(items, oldIndex, newIndex)
    })
  }

  useEffect(() => {
    if (enableBranching && !hasShownEnableBranchingModalRef.current) {
      hasShownEnableBranchingModalRef.current = true
      snap.setShowCreateBranchModal(true)
    }
  }, [enableBranching, snap])

  useEffect(() => {
    setSectionOrder(mergeSectionOrder)
  }, [setSectionOrder])

  const showConnectSection = !isMatureProject && !!project

  const renderOrder = mergeSectionOrder(sectionOrder).filter((id) => {
    if (id === 'connect') return showConnectSection
    return true
  })

  return (
    <ProjectNeedsSecuring>
      <div className="w-full h-full">
        <ScaffoldContainer size="large" className={cn(isPaused && 'h-full')}>
          <ScaffoldSection
            isFullWidth
            className={cn(isPaused ? 'h-full flex justify-center !p-0' : 'pb-0')}
          >
            <TopSection />
          </ScaffoldSection>
        </ScaffoldContainer>
        {!isPaused && (
          <ScaffoldContainer size="large">
            <ScaffoldSection isFullWidth className="gap-12 pb-32">
              <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
                <SortableContext items={renderOrder} strategy={verticalListSortingStrategy}>
                  {renderOrder.map((id) => {
                    if (IS_PLATFORM && id === 'usage') {
                      return (
                        <div
                          key={id}
                          className={cn(isComingUp && 'opacity-60 pointer-events-none')}
                        >
                          <SortableSection id={id}>
                            <UsageSection />
                          </SortableSection>
                        </div>
                      )
                    }
                    if (id === 'connect' && showConnectSection) {
                      return (
                        <SortableSection key={id} id={id}>
                          <ConnectSection />
                        </SortableSection>
                      )
                    }
                    if (id === 'advisor') {
                      return (
                        <div
                          key={id}
                          className={cn(isComingUp && 'opacity-60 pointer-events-none')}
                        >
                          <SortableSection id={id}>
                            <AdvisorSection showEmptyState={isComingUp} />
                          </SortableSection>
                        </div>
                      )
                    }
                    if (id === 'custom-report') {
                      return (
                        <div
                          key={id}
                          className={cn(isComingUp && 'opacity-60 pointer-events-none')}
                        >
                          <SortableSection id={id}>
                            <CustomReportSection />
                          </SortableSection>
                        </div>
                      )
                    }
                  })}
                </SortableContext>
              </DndContext>
            </ScaffoldSection>
          </ScaffoldContainer>
        )}
      </div>
    </ProjectNeedsSecuring>
  )
}
