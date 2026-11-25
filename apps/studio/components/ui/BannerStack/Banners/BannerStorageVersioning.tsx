import { LOCAL_STORAGE_KEYS, useFlag, useParams } from 'common'
import { CircleHelpIcon, FileIcon } from 'lucide-react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useRouter } from 'next/router'
import { useCallback, useEffect, useState } from 'react'
import { Badge, Button } from 'ui'

import { BannerCard } from '../BannerCard'
import { BANNER_ID, useBannerStack } from '../BannerStackProvider'
import {
  useFeaturePreviewContext,
  useFeaturePreviewModal,
} from '@/components/interfaces/App/FeaturePreview/FeaturePreviewContext'
import { BroomSparklesIcon } from '@/components/interfaces/Storage/BroomSparklesIcon'
import { ButtonTooltip } from '@/components/ui/ButtonTooltip'
import { useProjectStorageConfigQuery } from '@/data/config/project-storage-config-query'
import { useLocalStorageQuery } from '@/hooks/misc/useLocalStorage'

export const BannerStorageVersioningManager = () => {
  const router = useRouter()
  const { ref } = useParams()
  const { isInitialized } = useFeaturePreviewContext()
  const isStorageVersioningAvailable = useFlag('storageVersioningPrivateAlpha')
  const { data } = useProjectStorageConfigQuery({ projectRef: ref })
  const [isDismissed, setIsDismissed] = useLocalStorageQuery(
    LOCAL_STORAGE_KEYS.STORAGE_VERSIONING_PREVIEW_BANNER_DISMISSED(ref ?? '_'),
    false
  )
  const { addBanner, dismissBanner } = useBannerStack()

  const handleDismiss = useCallback(() => {
    setIsDismissed(true)
    dismissBanner(BANNER_ID.STORAGE_VERSIONING)
  }, [dismissBanner, setIsDismissed])

  const isStorageFilesPage = router.pathname.startsWith('/project/[ref]/storage/files')
  const canShowBanner =
    isStorageFilesPage &&
    isInitialized &&
    isStorageVersioningAvailable &&
    !!data?.capabilities?.object_versioning &&
    !isDismissed

  useEffect(() => {
    if (!canShowBanner) {
      dismissBanner(BANNER_ID.STORAGE_VERSIONING)
      return
    }

    addBanner({
      id: BANNER_ID.STORAGE_VERSIONING,
      isDismissed: false,
      priority: 1,
      content: <BannerStorageVersioning onDismiss={handleDismiss} />,
    })
  }, [addBanner, canShowBanner, dismissBanner, handleDismiss])

  useEffect(() => () => dismissBanner(BANNER_ID.STORAGE_VERSIONING), [dismissBanner])

  return null
}

const BannerStorageVersioning = ({ onDismiss }: { onDismiss: () => void }) => {
  const { flags, onUpdateFlag } = useFeaturePreviewContext()
  const { selectFeaturePreview } = useFeaturePreviewModal()
  const isPreviewEnabled = flags[LOCAL_STORAGE_KEYS.UI_PREVIEW_STORAGE_VERSIONING] === true

  return (
    <BannerCard
      onDismiss={onDismiss}
      size="wide"
      className="[&>div:last-child]:p-0 [&>div:last-child>div:nth-child(2)>div:first-child>img:first-child]:border-b"
    >
      <div className="flex flex-col">
        <VersionHistoryPreview />
        <div className="flex flex-col gap-y-4 p-6">
          <div className="flex flex-col gap-y-1">
            <div className="mb-1 flex items-center gap-2">
              <Badge variant="success">New</Badge>
              <Badge variant="warning">Public Alpha</Badge>
            </div>
            <p className="text-sm font-medium text-balance">
              Introducing Storage Object Versioning and Lifecycle Policies
            </p>
            <p className="text-xs text-foreground-lighter text-pretty">
              Preserve and restore versions of files in your buckets, and automatically expire
              noncurrent versions with lifecycle policies.
            </p>
          </div>
          <div className="flex gap-2">
            {isPreviewEnabled ? (
              <Button
                size="tiny"
                onClick={() =>
                  selectFeaturePreview(LOCAL_STORAGE_KEYS.UI_PREVIEW_STORAGE_VERSIONING)
                }
              >
                Review feature
              </Button>
            ) : (
              <>
                <Button
                  size="tiny"
                  variant="primary"
                  onClick={() =>
                    onUpdateFlag(LOCAL_STORAGE_KEYS.UI_PREVIEW_STORAGE_VERSIONING, true)
                  }
                >
                  Enable
                </Button>
                <ButtonTooltip
                  className="px-1.5"
                  icon={<CircleHelpIcon />}
                  onClick={() =>
                    selectFeaturePreview(LOCAL_STORAGE_KEYS.UI_PREVIEW_STORAGE_VERSIONING)
                  }
                  tooltip={{ content: { side: 'bottom', text: 'More information' } }}
                />
              </>
            )}
          </div>
        </div>
      </div>
    </BannerCard>
  )
}

const INITIAL_VERSIONS = [
  { id: 'v4', date: 'Today, 9:42 AM', size: '1.2 MB' },
  { id: 'v2', date: 'Yesterday, 9:05 AM', size: '980 KB' },
]

const VersionHistoryPreview = () => {
  const [versions, setVersions] = useState(INITIAL_VERSIONS)
  const [isAtRetentionLimit, setIsAtRetentionLimit] = useState(false)
  const shouldReduceMotion = useReducedMotion()

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>
    let nextVersionNumber = 5
    let phase: 'upload' | 'expire' = 'upload'
    let isPageActive = document.visibilityState === 'visible' && document.hasFocus()

    const schedulePhase = () => {
      if (!isPageActive) return

      timeout = setTimeout(
        () => {
          if (phase === 'upload') {
            setVersions((currentVersions) => [
              {
                id: `v${nextVersionNumber}`,
                date: 'Just now',
                size: '1.3 MB',
              },
              ...currentVersions.map((version, index) => ({
                ...version,
                date: index === 0 ? 'Today, 9:42 AM' : 'Yesterday, 9:05 AM',
              })),
            ])
            nextVersionNumber += 1
            setIsAtRetentionLimit(true)
            phase = 'expire'
          } else {
            setVersions((currentVersions) => currentVersions.slice(0, -1))
            setIsAtRetentionLimit(false)
            phase = 'upload'
          }

          schedulePhase()
        },
        phase === 'upload' ? 1800 : 3200
      )
    }

    const syncPageActivity = () => {
      const isActive = document.visibilityState === 'visible' && document.hasFocus()
      if (isActive === isPageActive) return

      isPageActive = isActive
      clearTimeout(timeout)
      if (isPageActive) schedulePhase()
    }

    document.addEventListener('visibilitychange', syncPageActivity)
    window.addEventListener('focus', syncPageActivity)
    window.addEventListener('blur', syncPageActivity)
    schedulePhase()

    return () => {
      clearTimeout(timeout)
      document.removeEventListener('visibilitychange', syncPageActivity)
      window.removeEventListener('focus', syncPageActivity)
      window.removeEventListener('blur', syncPageActivity)
    }
  }, [])

  return (
    <div className="border-b bg-surface-100 px-4 py-3">
      <div className="rounded-md border bg-surface-75 p-3 shadow-sm">
        <div className="mb-1 flex items-center gap-1 text-[9px] font-medium text-foreground-light">
          <span>Versions</span>
          <span className="text-[8px] text-foreground-lighter">{versions.length}</span>
        </div>
        <div className="mb-2 flex items-center gap-1 text-[8px] font-mono text-foreground-lighter">
          <BroomSparklesIcon size={14} className="shrink-0 text-foreground-lighter" />
          <span className="rounded-sm border bg-surface-200 px-1.5 py-0.5">2d</span>
          <span className="rounded-sm border border-dashed px-1.5 py-0.5 uppercase">Either</span>
          <span className="rounded-sm border bg-surface-200 px-1.5 py-0.5">
            2 noncurrent versions retained
          </span>
        </div>
        <ol className="flex min-h-[5.5rem] flex-col gap-y-0.5">
          <AnimatePresence initial={false} mode="popLayout">
            {versions.map((version, index) => {
              const isCurrent = index === 0
              const isExpiring = isAtRetentionLimit && index === versions.length - 1

              return (
                <motion.li
                  key={version.id}
                  layout={!shouldReduceMotion}
                  initial={shouldReduceMotion ? false : { opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={shouldReduceMotion ? undefined : { opacity: 0, y: 8 }}
                  transition={{ duration: 0.25, ease: 'easeOut' }}
                  className="flex min-h-7 items-center gap-1.5 rounded-sm text-[9px]"
                >
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-sm border bg-surface-200 text-foreground-lighter">
                    <FileIcon size={11} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-foreground leading-tight">
                      {version.date}
                    </span>
                    <span className="block text-[8px] text-foreground-lighter leading-tight">
                      {version.size}
                    </span>
                  </span>
                  {isCurrent && (
                    <span className="shrink-0 rounded-sm border border-brand-500/40 bg-brand-200 px-1 py-0.5 text-[8px] text-brand">
                      Current
                    </span>
                  )}
                  {isExpiring && (
                    <motion.span
                      initial={shouldReduceMotion ? false : { opacity: 0, x: 4 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2, duration: 0.2 }}
                      className="max-w-24 shrink-0 text-right text-[8px] leading-tight text-warning-600"
                    >
                      Expires on next upload or in 2d
                    </motion.span>
                  )}
                </motion.li>
              )
            })}
          </AnimatePresence>
        </ol>
      </div>
    </div>
  )
}
