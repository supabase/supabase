import { DndContext, DragEndEvent, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { arrayMove, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import dayjs from 'dayjs'
import { useEffect, useRef } from 'react'

import { IS_PLATFORM, useFlag, useParams } from 'common'
import { ProjectUsageSection as ProjectUsageSectionV1 } from 'components/interfaces/Home/ProjectUsageSection'
import { SortableSection } from 'components/interfaces/HomeNew/SortableSection'
import { TopSection } from 'components/interfaces/HomeNew/TopSection'
import { ScaffoldContainer, ScaffoldSection } from 'components/layouts/Scaffold'
import { useSendEventMutation } from 'data/telemetry/send-event-mutation'
import { useLocalStorage } from 'hooks/misc/useLocalStorage'
import { useSelectedOrganizationQuery } from 'hooks/misc/useSelectedOrganization'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { PROJECT_STATUS } from 'lib/constants'
import { useAppStateSnapshot } from 'state/app-state'
import { cn } from 'ui'
import { AdvisorSection } from './AdvisorSection'
import { CustomReportSection } from './CustomReportSection'
import { GetConnectedSection } from './GetConnectedSection'
import { type GettingStartedState } from './GettingStarted/GettingStarted.types'
import { GettingStartedSection } from './GettingStarted/GettingStartedSection'
import { ProjectUsageSection as ProjectUsageSectionV2 } from './ProjectUsageSection'
import { usePHFlag } from '@/hooks/ui/useFlag'

const DEFAULT_SECTION_ORDER = ['getting-started', 'get-connected', 'usage', 'advisor', 'custom-report']

export const HomeV2 = () => {
  const { enableBranching } = useParams()
  const snap = useAppStateSnapshot()
  const { data: project } = useSelectedProjectQuery()
  const { data: organization } = useSelectedOrganizationQuery()
  const { mutate: sendEvent } = useSendEventMutation()

  const showHomepageUsageV2 = useFlag('newHomepageUsageV2')
  const connectSheetFlag = usePHFlag<string | boolean>('connectSheet')
  const isConnectSheetFlagResolved = connectSheetFlag !== undefined
  const isConnectSheetEnabled = connectSheetFlag === true || connectSheetFlag === 'variation'

  const isMatureProject = dayjs(project?.inserted_at).isBefore(dayjs().subtract(10, 'day'))

  const hasShownEnableBranchingModalRef = useRef(false)
  const isPaused = project?.status === PROJECT_STATUS.INACTIVE
  const isComingUp = project?.status === PROJECT_STATUS.COMING_UP

  const [sectionOrder, setSectionOrder] = useLocalStorage<string[]>(
    `home-section-order-${project?.ref || 'default'}`,
    DEFAULT_SECTION_ORDER
  )

  const [gettingStartedState, setGettingStartedState] = useLocalStorage<GettingStartedState>(
    `home-getting-started-${project?.ref || 'default'}`,
    'empty'
  )

  const UsageSection = showHomepageUsageV2 ? ProjectUsageSectionV2 : ProjectUsageSectionV1
  const shouldShowGetConnectedRow = isConnectSheetFlagResolved && isConnectSheetEnabled
  const shouldShowGettingStartedRow =
    (!isConnectSheetFlagResolved || !isConnectSheetEnabled) &&
    !isMatureProject &&
    !!project &&
    gettingStartedState !== 'hidden'

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

  useEffect(() => {
    setSectionOrder((items) => {
      const knownItems = items.filter((id) => DEFAULT_SECTION_ORDER.includes(id))
      const missingItems = DEFAULT_SECTION_ORDER.filter((id) => !knownItems.includes(id))

      if (missingItems.length === 0 && knownItems.length === items.length) {
        return items
      }

      const merged = [...knownItems]

      // Insert missing sections using default order anchors instead of always appending.
      missingItems.forEach((id) => {
        const defaultIndex = DEFAULT_SECTION_ORDER.indexOf(id)
        const nextKnownId = DEFAULT_SECTION_ORDER.slice(defaultIndex + 1).find((candidate) =>
          merged.includes(candidate)
        )

        if (!nextKnownId) {
          merged.push(id)
          return
        }

        const insertIndex = merged.indexOf(nextKnownId)
        merged.splice(insertIndex, 0, id)
      })

      return merged
    })
  }, [setSectionOrder])

  const visibleSectionOrder = sectionOrder.filter((id) => {
    if (id === 'getting-started') return shouldShowGettingStartedRow
    if (id === 'get-connected') return shouldShowGetConnectedRow
    return true
  })

  return (
    <div className="w-full h-full">
      <ScaffoldContainer size="large" className={cn(isPaused && 'h-full')}>
        <ScaffoldSection
          isFullWidth
          className={cn(isPaused ? 'h-full flex justify-center !p-0' : 'pt-16 pb-0')}
        >
          <TopSection />
        </ScaffoldSection>
      </ScaffoldContainer>
      {!isPaused && (
        <ScaffoldContainer size="large">
          <ScaffoldSection isFullWidth className="gap-16 pb-32">
            <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
              <SortableContext
                items={visibleSectionOrder}
                strategy={verticalListSortingStrategy}
              >
                {visibleSectionOrder.map((id) => {
                  if (IS_PLATFORM && id === 'usage') {
                    return (
                      <div key={id} className={cn(isComingUp && 'opacity-60 pointer-events-none')}>
                        <SortableSection id={id}>
                          <UsageSection />
                        </SortableSection>
                      </div>
                    )
                  }
                  if (id === 'getting-started') {
                    return (
                      <SortableSection key={id} id={id}>
                        <GettingStartedSection
                          value={gettingStartedState}
                          onChange={setGettingStartedState}
                        />
                      </SortableSection>
                    )
                  }
                  if (id === 'get-connected') {
                    return (
                      <SortableSection key={id} id={id}>
                        <GetConnectedSection />
                      </SortableSection>
                    )
                  }
                  if (id === 'advisor') {
                    return (
                      <div key={id} className={cn(isComingUp && 'opacity-60 pointer-events-none')}>
                        <SortableSection id={id}>
                          <AdvisorSection showEmptyState={isComingUp} />
                        </SortableSection>
                      </div>
                    )
                  }
                  if (id === 'custom-report') {
                    return (
                      <div key={id} className={cn(isComingUp && 'opacity-60 pointer-events-none')}>
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
  )
}
