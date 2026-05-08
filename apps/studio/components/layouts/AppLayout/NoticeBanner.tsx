import { useQueries } from '@tanstack/react-query'
import { LOCAL_STORAGE_KEYS } from 'common'
import { useRouter } from 'next/router'
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
import { useOrganizationsQuery } from '@/data/organizations/organizations-query'
import { projectKeys } from '@/data/projects/keys'
import {
  getOrganizationProjects,
  type OrgProject,
} from '@/data/projects/org-projects-infinite-query'
import { useLocalStorageQuery } from '@/hooks/misc/useLocalStorage'

// Update this whenever the banner content below changes so old client bundles
// stop displaying outdated notices after the relevant date passes.
const BANNER_EXPIRES_AT = new Date('2026-07-04T00:00:00Z')

/**
 * Used to display urgent notices that apply for all users, such as maintenance windows.
 */
export const NoticeBanner = () => {
  const router = useRouter()

  const [bannerAcknowledged, setBannerAcknowledged, { isSuccess }] = useLocalStorageQuery(
    LOCAL_STORAGE_KEYS.TERMS_OF_SERVICE_UPDATE,
    false
  )

  if (
    Date.now() >= BANNER_EXPIRES_AT.getTime() ||
    router.pathname.includes('sign-in') ||
    !isSuccess ||
    bannerAcknowledged
  ) {
    return null
  }

  return (
    <HeaderBanner
      variant="note"
      title="We've updated our Terms of Service"
      description={<UpdatedTermsOfServiceDialog onDismiss={() => setBannerAcknowledged(true)} />}
      onDismiss={() => setBannerAcknowledged(true)}
    />
  )
}

const MAINTENANCE_REGIONS = new Set(['ap-southeast-1', 'sa-east-1'])

export const NoticeBanner2 = () => {
  const id = 'maintenance-2026-05-13'
  const expiry = new Date('2026-05-14T23:59:00Z')
  const isExpired = new Date() > expiry

  const router = useRouter()

  const [bannerAcknowledged, setBannerAcknowledged, { isSuccess }] = useLocalStorageQuery(
    LOCAL_STORAGE_KEYS.MAINTENANCE_BANNER_DISMISSED(id),
    false
  )

  const shouldEvaluate =
    !router.pathname.includes('sign-in') && isSuccess && !bannerAcknowledged && !isExpired

  const { data: organizations } = useOrganizationsQuery({ enabled: shouldEvaluate })
  const orgProjectsQueries = useQueries({
    queries: (organizations ?? []).map((org) => ({
      queryKey: projectKeys.bannerProjectsByOrg(org.slug),
      queryFn: () => getOrganizationProjects({ slug: org.slug, limit: 100 }),
      staleTime: 30 * 60 * 1000,
      enabled: shouldEvaluate,
    })),
  })

  const isProjectsFetched =
    organizations !== undefined &&
    (organizations.length === 0 || orgProjectsQueries.every((q) => q.isFetched))

  const hasMaintenanceRegionProject = orgProjectsQueries
    .flatMap((q) => q.data?.projects ?? [])
    .some((project: OrgProject) =>
      project.databases.some((db) => MAINTENANCE_REGIONS.has(db.region))
    )

  console.log('Notice Banner 2 evaluation:', {
    bannerAcknowledged,
    isExpired,
    shouldEvaluate,
    isProjectsFetched,
    hasMaintenanceRegionProject,
  })

  if (!shouldEvaluate || !isProjectsFetched || !hasMaintenanceRegionProject) {
    return null
  }

  return (
    <HeaderBanner
      variant="note"
      title="Upcoming maintenance"
      description={
        <>
          Shared pooler maintenance in{' '}
          <a
            target="_blank"
            rel="noopener referrer"
            href="https://status.supabase.com/incidents/hxf8876zl69x"
          >
            ap-southeast-1
          </a>{' '}
          and{' '}
          <a
            target="_blank"
            rel="noopener noreferrer"
            href="https://status.supabase.com/incidents/jqsj3pb3mnx7"
          >
            sa-east-1
          </a>{' '}
          on May 13-14.
        </>
      }
      onDismiss={() => setBannerAcknowledged(true)}
    />
  )
}

const UpdatedTermsOfServiceDialog = ({ onDismiss }: { onDismiss: () => void }) => {
  return (
    <Dialog>
      <DialogTrigger className={cn(InlineLinkClassName, 'cursor-pointer')}>
        Learn more
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Terms of Service update</DialogTitle>
          <DialogDescription>
            We've updated our Terms of Service to better define the responsibilities of both you and
            Supabase in the use of AI.
          </DialogDescription>
        </DialogHeader>

        <DialogSectionSeparator />

        <DialogSection className="text-sm flex flex-col gap-y-2">
          <p>
            We've clarified how we use AI in our customer support tooling, introduced guidelines for
            the responsible use of AI by our users, and updated our indemnification terms to clarify
            the allocation of responsibility for claims arising from AI-generated inputs and
            outputs.
          </p>

          <p>
            Additionally, we've made an explicit commitment that Supabase will never use the data
            you submit to the Supabase services to train or improve any AI without your prior
            written consent.
          </p>

          <p>
            The updated Terms (Version 2) will take effect on June 6, 2026. By continuing to use the
            Services after that date, you agree to the updated Terms. You can review the changes{' '}
            <InlineLink href="https://supabase.com/terms">here</InlineLink>.
          </p>

          <p>
            This notice applies to users on Supabase's standard Terms of Service only. If you are on
            an Enterprise plan or with a separately negotiated agreement, your existing terms
            continue to govern your use of the Services.
          </p>
        </DialogSection>

        <DialogFooter>
          <DialogClose asChild>
            <Button type="default" className="opacity-100" onClick={onDismiss}>
              Understood
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
