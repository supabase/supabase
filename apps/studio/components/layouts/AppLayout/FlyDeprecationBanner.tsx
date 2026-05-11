import { LOCAL_STORAGE_KEYS } from 'common'
import { useRouter } from 'next/router'
import { useEffect, useRef, type ReactNode } from 'react'
import {
  Button,
  cn,
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogSection,
  DialogSectionSeparator,
  DialogTitle,
  DialogTrigger,
} from 'ui'

import { HeaderBanner } from '@/components/interfaces/Organization/HeaderBanner'
import { InlineLink, InlineLinkClassName } from '@/components/ui/InlineLink'
import { useSendEventMutation } from '@/data/telemetry/send-event-mutation'
import {
  useFlyDeprecationProjects,
  type FlyDeprecationProject,
} from '@/hooks/misc/useFlyDeprecationProjects'
import { useLocalStorageQuery } from '@/hooks/misc/useLocalStorage'

const BANNER_EXPIRES_AT = new Date('2026-06-01T00:00:00Z')
const MIGRATION_GUIDE_URL =
  'https://supabase.com/docs/guides/platform/migrating-within-supabase/backup-restore'
const SUPPORT_URL = 'https://supabase.com/dashboard/support/new'

export const FlyDeprecationBanner = () => {
  const router = useRouter()

  const [acknowledged, setAcknowledged, { isSuccess }] = useLocalStorageQuery(
    LOCAL_STORAGE_KEYS.FLY_DEPRECATION_2026_05_31,
    false
  )

  const isExpired = Date.now() >= BANNER_EXPIRES_AT.getTime()
  const onSignIn = router.pathname.includes('sign-in')

  const shouldEvaluate = !isExpired && !onSignIn && isSuccess && !acknowledged

  const { isReady, primaries, branches } = useFlyDeprecationProjects({ enabled: shouldEvaluate })

  const hasFlyResources = primaries.length > 0 || branches.length > 0
  const firstProject = primaries[0] ?? branches[0]
  const firstOrgSlug = firstProject?.orgSlug ?? ''
  const firstProjectRef = firstProject?.ref ?? ''

  const { mutate: sendEvent } = useSendEventMutation()

  const viewedRef = useRef(false)
  useEffect(() => {
    if (!shouldEvaluate || !isReady || !hasFlyResources || viewedRef.current) return
    viewedRef.current = true
    sendEvent({
      action: 'fly_deprecation_banner_viewed',
      properties: { primaryCount: primaries.length, branchCount: branches.length },
      groups: { project: firstProjectRef, organization: firstOrgSlug },
    })
  }, [
    shouldEvaluate,
    isReady,
    hasFlyResources,
    primaries.length,
    branches.length,
    firstProjectRef,
    firstOrgSlug,
    sendEvent,
  ])

  if (!shouldEvaluate || !isReady || !hasFlyResources) return null

  const onDismiss = () => {
    sendEvent({
      action: 'fly_deprecation_banner_dismissed',
      properties: { primaryCount: primaries.length, branchCount: branches.length },
      groups: { project: firstProjectRef, organization: firstOrgSlug },
    })
    setAcknowledged(true)
  }

  const title =
    primaries.length > 0 && branches.length > 0
      ? 'Action required: Fly.io projects and branches will be suspended May 31'
      : primaries.length > 0
        ? 'Action required: Fly.io projects will be suspended May 31'
        : 'Action required: Fly.io branches will be suspended May 31'

  return (
    <HeaderBanner
      variant="warning"
      title={title}
      description={<FlyDeprecationDialog primaries={primaries} branches={branches} />}
      onDismiss={onDismiss}
    />
  )
}

const FlyDeprecationDialog = ({
  primaries,
  branches,
}: {
  primaries: FlyDeprecationProject[]
  branches: FlyDeprecationProject[]
}) => {
  return (
    <Dialog>
      <DialogTrigger className={cn(InlineLinkClassName, 'cursor-pointer')}>
        View affected projects
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Fly.io deprecation: May 31, 2026</DialogTitle>
          <DialogDescription>
            Supabase is sunsetting Fly.io infrastructure. Projects and branches still running on
            Fly.io will be suspended on May 31, 2026.
          </DialogDescription>
        </DialogHeader>

        <DialogSectionSeparator />

        <ProjectList
          label="Projects on Fly.io"
          items={primaries}
          note={
            <>
              To preserve your data, follow the{' '}
              <InlineLink href={MIGRATION_GUIDE_URL}>migration guide</InlineLink> to back up and
              restore onto Supabase's general infrastructure.
            </>
          }
        />

        <ProjectList
          label="Branches on Fly.io"
          items={branches}
          note={
            <>
              Merge preview branches before May 31. For persistent branches, take a{' '}
              <InlineLink href={MIGRATION_GUIDE_URL}>snapshot</InlineLink>, then deploy a new branch
              and restore your data.
            </>
          }
        />

        <DialogSection className="text-sm">
          <p>
            Questions or need an extension?{' '}
            <InlineLink href={SUPPORT_URL}>File a support ticket</InlineLink>.
          </p>
        </DialogSection>

        <DialogFooter>
          <DialogClose asChild>
            <Button type="default">Close</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

const ProjectList = ({
  label,
  items,
  note,
}: {
  label: string
  items: FlyDeprecationProject[]
  note: ReactNode
}) => {
  if (items.length === 0) return null
  return (
    <DialogSection className="text-sm flex flex-col gap-y-2">
      <p className="font-medium">
        {label} ({items.length})
      </p>
      <ul className="list-disc pl-5 space-y-1 text-foreground-light">
        {items.map((p) => (
          <li key={p.ref}>
            {p.name} <span className="text-foreground-muted">— {p.orgName}</span>
          </li>
        ))}
      </ul>
      <p>{note}</p>
    </DialogSection>
  )
}
