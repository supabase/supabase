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
import {
  useFlyDeprecationProjects,
  type FlyDeprecationProject,
} from '@/hooks/misc/useFlyDeprecationProjects'
import { useLocalStorageQuery } from '@/hooks/misc/useLocalStorage'
import { useTrack } from '@/lib/telemetry/track'

const BANNER_EXPIRES_AT = new Date('2026-06-01T00:00:00Z')
const BACKUP_RESTORE_CLI_URL =
  'https://supabase.com/docs/guides/platform/migrating-within-supabase/backup-restore'
const DASHBOARD_RESTORE_URL =
  'https://supabase.com/docs/guides/platform/migrating-within-supabase/dashboard-restore'
const BRANCHING_DASHBOARD_URL = 'https://supabase.com/docs/guides/deployment/branching/dashboard'
const SUPPORT_EMAIL = 'success@supabase.io'

export const FlyDeprecationBanner = () => {
  const router = useRouter()

  const [acknowledged, setAcknowledged, { isSuccess }] = useLocalStorageQuery(
    LOCAL_STORAGE_KEYS.FLY_DEPRECATION_2026_05_31,
    false
  )

  const isExpired = Date.now() >= BANNER_EXPIRES_AT.getTime()
  const onSignIn = router.pathname.startsWith('/sign-in')

  const shouldEvaluate = !isExpired && !onSignIn && isSuccess && !acknowledged

  const { isReady, primaries, branches } = useFlyDeprecationProjects({ enabled: shouldEvaluate })

  const hasFlyResources = primaries.length > 0 || branches.length > 0

  const track = useTrack()

  const exposedRef = useRef(false)
  useEffect(() => {
    if (!shouldEvaluate || !isReady || !hasFlyResources || exposedRef.current) return
    exposedRef.current = true
    track('fly_deprecation_banner_exposed', {
      primaryCount: primaries.length,
      branchCount: branches.length,
    })
  }, [shouldEvaluate, isReady, hasFlyResources, primaries.length, branches.length, track])

  if (!shouldEvaluate || !isReady || !hasFlyResources) return null

  const onDismiss = () => {
    track('fly_deprecation_banner_dismissed', {
      primaryCount: primaries.length,
      branchCount: branches.length,
    })
    setAcknowledged(true)
  }

  const title =
    primaries.length > 0 && branches.length > 0
      ? 'Action required: Fly.io project and branch suspensions begin May 31'
      : primaries.length > 0
        ? 'Action required: Fly.io project suspensions begin May 31'
        : 'Action required: Fly.io branch suspensions begin May 31'

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
          <DialogTitle>Fly.io deprecation: suspensions begin May 31, 2026</DialogTitle>
          <DialogDescription>
            Supabase will begin suspending projects and branches still running on Fly.io
            infrastructure on May 31, 2026.
          </DialogDescription>
        </DialogHeader>

        <DialogSectionSeparator />

        <ProjectList
          label="Projects on Fly.io"
          items={primaries}
          instructions={
            <>
              <p>
                To preserve your data, migrate each project to Supabase's general infrastructure:
              </p>
              <ol className="list-decimal pl-5 space-y-1">
                <li>
                  Back up your database using the{' '}
                  <InlineLink href={BACKUP_RESTORE_CLI_URL}>Supabase CLI</InlineLink> (or take a{' '}
                  <InlineLink href={DASHBOARD_RESTORE_URL}>Dashboard backup</InlineLink>).
                </li>
                <li>Create a new project on Supabase's general infrastructure.</li>
                <li>Restore the backup into the new project.</li>
              </ol>
            </>
          }
        />

        <ProjectList
          label="Branches on Fly.io"
          items={branches}
          instructions={
            <>
              <p>Merge preview branches before May 31. For persistent branches:</p>
              <ol className="list-decimal pl-5 space-y-1">
                <li>
                  Take a{' '}
                  <InlineLink href={BACKUP_RESTORE_CLI_URL}>
                    snapshot of the branch database
                  </InlineLink>{' '}
                  before shutting it down.
                </li>
                <li>
                  <InlineLink href={BRANCHING_DASHBOARD_URL}>
                    Deploy a new persistent branch
                  </InlineLink>{' '}
                  on Supabase's general infrastructure.
                </li>
                <li>Restore your data manually from the snapshot.</li>
              </ol>
            </>
          }
        />

        <DialogSection className="text-sm">
          <p>
            Questions or need an extension? Email{' '}
            <a className={InlineLinkClassName} href={`mailto:${SUPPORT_EMAIL}`}>
              {SUPPORT_EMAIL}
            </a>
            .
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

const MAX_LISTED = 5

const ProjectList = ({
  label,
  items,
  instructions,
}: {
  label: string
  items: FlyDeprecationProject[]
  instructions: ReactNode
}) => {
  if (items.length === 0) return null
  const visible = items.slice(0, MAX_LISTED)
  const remaining = items.length - visible.length
  return (
    <>
      <DialogSection className="text-sm flex flex-col gap-y-2">
        <p className="font-medium">
          {label} ({items.length})
        </p>
        {items.length === 1 ? (
          <p>
            {items[0].name} <span className="text-foreground-muted">({items[0].orgName})</span>
          </p>
        ) : (
          <ul className="list-disc pl-5 space-y-1">
            {visible.map((p) => (
              <li key={p.ref}>
                {p.name} <span className="text-foreground-muted">({p.orgName})</span>
              </li>
            ))}
            {remaining > 0 && (
              <li className="text-foreground-muted list-none -ml-5">…and {remaining} more.</li>
            )}
          </ul>
        )}
      </DialogSection>
      <DialogSection className="text-sm flex flex-col gap-y-2">{instructions}</DialogSection>
    </>
  )
}
