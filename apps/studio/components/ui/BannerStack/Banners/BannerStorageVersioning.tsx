import { useLocation } from '@tanstack/react-router'
import { LOCAL_STORAGE_KEYS, useParams } from 'common'
import { CircleHelpIcon, FileIcon, InfoIcon, MoreVerticalIcon, RotateCcwIcon } from 'lucide-react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Badge, Button, cn } from 'ui'

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
  const { ref } = useParams()
  const pathname = useLocation({ select: (location) => location.pathname })
  const { isInitialized } = useFeaturePreviewContext()
  const { data } = useProjectStorageConfigQuery({ projectRef: ref })
  const isObjectVersioningAvailable = !!data?.capabilities?.object_versioning
  const [isDismissed, setIsDismissed] = useLocalStorageQuery(
    LOCAL_STORAGE_KEYS.STORAGE_VERSIONING_PREVIEW_BANNER_DISMISSED(ref ?? '_'),
    false
  )
  const { addBanner, dismissBanner } = useBannerStack()

  const handleDismiss = useCallback(() => {
    setIsDismissed(true)
    dismissBanner(BANNER_ID.STORAGE_VERSIONING)
  }, [dismissBanner, setIsDismissed])

  const isStorageFilesPage = pathname.startsWith(`/project/${ref}/storage/files`)
  const canShowBanner =
    isStorageFilesPage && isInitialized && isObjectVersioningAvailable && !isDismissed

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
            <p className="text-sm font-medium">
              Storage Object Versioning <br />
              and Lifecycle Policies
            </p>
            <p className="text-xs text-foreground-lighter text-pretty">
              Retain versions of files and automatically expire them with lifecycle policies.
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
  { id: 'v4', versionId: '7f3a9c21b8046d5e', size: '1.2 MB', isCurrent: true },
  { id: 'v2', versionId: '2b8e1d64a9703cf2', size: '980 KB', isCurrent: false },
]

const shortDemoVersionId = (versionId: string) => `${versionId.slice(0, 6)}…${versionId.slice(-2)}`

const VersionHistoryPreview = () => {
  const [versions, setVersions] = useState(INITIAL_VERSIONS)
  const [isAtRetentionLimit, setIsAtRetentionLimit] = useState(false)
  const [isRemovingVersion, setIsRemovingVersion] = useState(false)
  const nextVersionNumber = useRef(5)
  const shouldReduceMotion = useReducedMotion()

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout> | undefined
    let phase: 'upload' | 'expire' = 'upload'
    let isPageActive = document.visibilityState === 'visible' && document.hasFocus()

    const schedulePhase = () => {
      if (!isPageActive || timeout) return

      timeout = setTimeout(
        () => {
          timeout = undefined

          if (phase === 'upload') {
            const versionNumber = nextVersionNumber.current
            nextVersionNumber.current += 1
            setVersions((currentVersions) => [
              {
                id: `v${versionNumber}`,
                versionId: `a7c3d812e4f9b2${versionNumber.toString(16).padStart(2, '0')}`,
                size: '1.3 MB',
                isCurrent: true,
              },
              ...currentVersions.map((version) => ({ ...version, isCurrent: false })),
            ])
            setIsAtRetentionLimit(true)
            phase = 'expire'
          } else {
            setVersions((currentVersions) => currentVersions.slice(0, -1))
            setIsRemovingVersion(true)
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
      timeout = undefined
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
    <div className="border-b bg-surface-100 bg-[radial-gradient(oklch(from_var(--foreground-default)_l_c_h/0.02)_1px,transparent_1px)] bg-size-[6px_6px] px-3 pt-3">
      <div className="rounded-md rounded-b-none border border-b-0 bg-surface-100 p-3 pb-2 shadow-sm">
        <div className="mb-1 flex items-center gap-1 text-[9px] font-medium text-foreground-light">
          <span>Versions</span>
          <span className="text-[8px] text-foreground-lighter">
            {versions.length + (isRemovingVersion ? 1 : 0)}
          </span>
        </div>
        <div className="mb-2 flex items-center gap-1 text-[8px] font-mono text-foreground-lighter">
          <BroomSparklesIcon
            size={14}
            className="mr-0.5 shrink-0 text-foreground-lighter"
            aria-hidden="true"
          />
          <span className="rounded-sm border border-strong bg-surface-300 px-1 py-0.5">2d</span>
          <span className="rounded-sm border border-strong border-dashed px-1 py-0.5 uppercase">
            Either
          </span>
          <span className="rounded-sm border border-strong bg-surface-300 px-1 py-0.5">
            2 noncurrent v. retained
          </span>
        </div>
        <ol className="flex min-h-[5.5rem] flex-col gap-y-0.5">
          <AnimatePresence initial={false} onExitComplete={() => setIsRemovingVersion(false)}>
            {versions.map((version, index) => {
              const isCurrent = version.isCurrent
              const isExpiring = isAtRetentionLimit && index === versions.length - 1

              return (
                <motion.li
                  key={version.id}
                  initial={shouldReduceMotion ? false : { opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={shouldReduceMotion ? undefined : { opacity: 0, y: 8 }}
                  transition={{ duration: 0.25, ease: 'easeOut' }}
                  className="group flex min-h-7 items-center gap-1 rounded-md border border-transparent text-[9px] hover:bg-surface-200"
                >
                  <span
                    className={cn(
                      'flex h-6 w-6 shrink-0 items-center justify-center overflow-hidden rounded-md border',
                      isCurrent
                        ? 'border-brand-400 bg-surface-200 text-brand'
                        : 'border-overlay bg-surface-100 text-foreground-lighter'
                    )}
                    aria-hidden="true"
                  >
                    {isCurrent ? <RotateCcwIcon size={12} /> : <FileIcon size={12} />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-foreground leading-tight">
                      {shortDemoVersionId(version.versionId)}
                    </span>
                    <span className="block font-mono text-[8px] text-foreground-lighter leading-tight">
                      {version.size}
                    </span>
                  </span>
                  {isCurrent && (
                    <Badge variant="success" className="h-4 shrink-0 px-1 text-[8px] leading-none">
                      Current
                    </Badge>
                  )}
                  {!isCurrent && (
                    <motion.span
                      initial={shouldReduceMotion ? false : { opacity: 0, x: 4 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: isExpiring ? 0.2 : 0, duration: 0.2 }}
                      className={cn(
                        'flex shrink-0 items-center gap-0.5 text-[10px]',
                        isExpiring ? 'text-warning-600' : 'text-foreground-lighter'
                      )}
                    >
                      <BroomSparklesIcon size={12} aria-hidden="true" />
                      <span>2d</span>
                    </motion.span>
                  )}
                  {!isCurrent && (
                    <span
                      aria-hidden="true"
                      className="flex h-6 w-4 shrink-0 items-center justify-center text-foreground-lighter"
                    >
                      <MoreVerticalIcon size={14} />
                    </span>
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
