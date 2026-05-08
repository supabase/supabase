import { createFileRoute, Outlet, useMatches } from '@tanstack/react-router'

import { StorageBucketsLayout } from '@/components/layouts/StorageLayout/StorageBucketsLayout'
import StorageLayout from '@/components/layouts/StorageLayout/StorageLayout'

export const Route = createFileRoute('/project/$ref/storage')({
  component: StorageShell,
})

type StorageStaticData = {
  storageLayoutTitle?: string
  // Most storage leaves wrap in <StorageBucketsLayout> (the bucket-tab
  // sub-nav). Bucket detail pages (files/analytics/vectors $bucketId) skip
  // it and render a full-bleed bucket UI under StorageLayout only.
  skipStorageBucketsLayout?: boolean
  // Inner-layout overrides — used by /storage/s3 which passes its own
  // title and hides the subtitle. Most leaves leave these undefined.
  storageBucketsLayoutTitle?: string
  storageBucketsLayoutHideSubtitle?: boolean
}

function StorageShell() {
  // `select` form across each field — only re-render when the specific
  // value changes. See routes/_app.tsx for the full rationale.
  const title = useMatches({
    select: (matches) =>
      (matches[matches.length - 1]?.staticData as StorageStaticData | undefined)
        ?.storageLayoutTitle ?? '',
  })
  const skipBuckets = useMatches({
    select: (matches) =>
      (matches[matches.length - 1]?.staticData as StorageStaticData | undefined)
        ?.skipStorageBucketsLayout ?? false,
  })
  const bucketsTitle = useMatches({
    select: (matches) =>
      (matches[matches.length - 1]?.staticData as StorageStaticData | undefined)
        ?.storageBucketsLayoutTitle,
  })
  const bucketsHideSubtitle = useMatches({
    select: (matches) =>
      (matches[matches.length - 1]?.staticData as StorageStaticData | undefined)
        ?.storageBucketsLayoutHideSubtitle ?? false,
  })

  if (skipBuckets) {
    return (
      <StorageLayout title={title}>
        <Outlet />
      </StorageLayout>
    )
  }

  return (
    <StorageLayout title={title}>
      <StorageBucketsLayout title={bucketsTitle} hideSubtitle={bucketsHideSubtitle}>
        <Outlet />
      </StorageBucketsLayout>
    </StorageLayout>
  )
}
