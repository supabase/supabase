import { IS_PLATFORM, useParams } from 'common'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { Badge, Menu } from 'ui'

import { BUCKET_TYPES } from './Storage.constants'
import { useStorageV2Page } from './Storage.utils'
import { ShortcutTooltip } from '@/components/ui/ShortcutTooltip'
import {
  useIsAnalyticsBucketsEnabled,
  useIsVectorBucketsEnabled,
} from '@/data/config/project-storage-config-query'
import { useIsFeatureEnabled } from '@/hooks/misc/useIsFeatureEnabled'
import { SHORTCUT_IDS, type ShortcutId } from '@/state/shortcuts/registry'
import { useShortcut } from '@/state/shortcuts/useShortcut'

const BUCKET_TYPE_SHORTCUTS: Record<keyof typeof BUCKET_TYPES, ShortcutId> = {
  files: SHORTCUT_IDS.NAV_STORAGE_FILES,
  analytics: SHORTCUT_IDS.NAV_STORAGE_ANALYTICS,
  vectors: SHORTCUT_IDS.NAV_STORAGE_VECTORS,
}

export const StorageMenuV2 = () => {
  const router = useRouter()
  const { ref } = useParams()
  const page = useStorageV2Page()

  const { storageAnalytics, storageVectors } = useIsFeatureEnabled([
    'storage:analytics',
    'storage:vectors',
  ])

  const isAnalyticsBucketsEnabled = useIsAnalyticsBucketsEnabled({ projectRef: ref })
  const isVectorBucketsEnabled = useIsVectorBucketsEnabled({ projectRef: ref })

  const showAnalytics = IS_PLATFORM && storageAnalytics
  const showVectors = IS_PLATFORM && storageVectors

  useShortcut(SHORTCUT_IDS.NAV_STORAGE_FILES, () => router.push(`/project/${ref}/storage/files`))
  useShortcut(
    SHORTCUT_IDS.NAV_STORAGE_ANALYTICS,
    () => router.push(`/project/${ref}/storage/analytics`),
    { enabled: showAnalytics }
  )
  useShortcut(
    SHORTCUT_IDS.NAV_STORAGE_VECTORS,
    () => router.push(`/project/${ref}/storage/vectors`),
    { enabled: showVectors }
  )
  useShortcut(SHORTCUT_IDS.NAV_STORAGE_S3, () => router.push(`/project/${ref}/storage/s3`), {
    enabled: IS_PLATFORM,
  })

  const bucketTypes = Object.entries(BUCKET_TYPES).filter(([key]) => {
    if (key === 'analytics') return showAnalytics
    if (key === 'vectors') return showVectors
    return true
  })

  return (
    <Menu type="pills" className="my-2 md:my-4 flex grow flex-col">
      <div className="space-y-4">
        <div className="md:mx-3">
          <Menu.Group title={<span className="uppercase font-mono">Manage</span>} />

          {bucketTypes.map(([type, config]) => {
            const isSelected = page === type
            const isAlphaEnabled =
              (type === 'analytics' && isAnalyticsBucketsEnabled) ||
              (type === 'vectors' && isVectorBucketsEnabled)
            const shortcutId = BUCKET_TYPE_SHORTCUTS[type as keyof typeof BUCKET_TYPES]

            const item = (
              <Link href={`/project/${ref}/storage/${type}`}>
                <Menu.Item rounded active={isSelected}>
                  <div className="flex items-center justify-between">
                    <p className="truncate">{config.displayName}</p>
                    {isAlphaEnabled && <Badge variant="success">New</Badge>}
                  </div>
                </Menu.Item>
              </Link>
            )

            return (
              <div key={type}>
                {shortcutId ? (
                  <ShortcutTooltip shortcutId={shortcutId} side="right" delayDuration={1000}>
                    {item}
                  </ShortcutTooltip>
                ) : (
                  item
                )}
              </div>
            )
          })}
        </div>

        {IS_PLATFORM && (
          <>
            <div className="h-px w-[calc(100%-1.5rem)] mx-auto md:w-full bg-border" />
            <div className="md:mx-3">
              <Menu.Group title={<span className="uppercase font-mono">Configuration</span>} />

              <ShortcutTooltip
                shortcutId={SHORTCUT_IDS.NAV_STORAGE_S3}
                side="right"
                delayDuration={1000}
              >
                <Link href={`/project/${ref}/storage/s3`}>
                  <Menu.Item rounded active={page === 's3'}>
                    <p className="truncate">S3</p>
                  </Menu.Item>
                </Link>
              </ShortcutTooltip>
            </div>
          </>
        )}
      </div>
    </Menu>
  )
}
