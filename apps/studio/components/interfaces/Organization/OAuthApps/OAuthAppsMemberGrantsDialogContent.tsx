import { useIntersectionObserver } from '@uidotdev/usehooks'
import { useParams } from 'common'
import { BuildingIcon, UserIcon } from 'lucide-react'
import { ComponentProps, Fragment, ReactNode, useEffect, useMemo, useRef } from 'react'
import {
  Button,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetSection,
  SheetTitle,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from 'ui'
import { Admonition } from 'ui-patterns/Admonition'
import { ShimmeringLoader } from 'ui-patterns/ShimmeringLoader'

import { formatPermissionName, groupScopesByLevel } from './Consent/OAuthAppsAuthorizeScreen.utils'
import type { OAuthAppDatabaseAccess, PreviewGrant } from './OAuthAppsAuthorizedPreview'
import { OAuthGrantAccordion, OAuthGrantAccordionItem } from './OAuthGrantAccordionItem'
import { AlertError } from '@/components/ui/AlertError'
import { TOOLTIP_UNDERLINE_CLASS_NAME } from '@/components/ui/tooltip-styles'
import { OAuthApproval } from '@/data/oauth-apps/oauth-apps-approvals-query'
import {
  OAuthAppMemberGrant,
  useOAuthAppMemberGrantsQuery,
} from '@/data/oauth-apps/oauth-apps-member-grants-query'
import { pluralize } from '@/lib/helpers'

export interface OAuthAppsMemberGrantsDialogProps extends ComponentProps<typeof SheetContent> {
  onRevoke?: () => void
  approval?: OAuthApproval
  previewGrants?: PreviewGrant[]
  previewScopes?: string[]
  previewProjects?: { name: string; ref: string }[]
  databaseAccess?: OAuthAppDatabaseAccess
}

export const OAuthAppsMemberGrantsDialogContent = ({
  approval,
  onRevoke,
  previewScopes,
  previewGrants,
  previewProjects,
  databaseAccess,
  ...props
}: OAuthAppsMemberGrantsDialogProps) => {
  const titleRef = useRef<HTMLHeadingElement>(null)
  const isPreview = previewScopes != null
  const { slug } = useParams()
  const {
    data,
    error,
    isPending,
    isError,
    isSuccess,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useOAuthAppMemberGrantsQuery(
    { slug, appId: approval?.id },
    { enabled: Boolean(approval) && !isPreview }
  )

  const [sentinelRef, entry] = useIntersectionObserver({
    root: null,
    threshold: 0,
    rootMargin: '0px',
  })

  useEffect(() => {
    if (hasNextPage && entry?.isIntersecting && !isFetchingNextPage) {
      fetchNextPage()
    }
  }, [hasNextPage, entry?.isIntersecting, fetchNextPage, isFetchingNextPage])

  const statusText = useMemo(() => {
    if (isFetchingNextPage) return 'Loading more grants...'
    if (isPending) return 'Loading grants...'
    if (isError) return ''
    return 'Grants loaded'
  }, [isPending, isFetchingNextPage, isError])

  const memberGrants = data?.pages.flatMap((page) => page.data) ?? []
  const isEmpty = memberGrants.length === 0

  if (!approval) return null

  return (
    <SheetContent
      size="lg"
      className="flex flex-col gap-0"
      aria-describedby={undefined}
      {...props}
      onOpenAutoFocus={(event) => {
        event.preventDefault()
        titleRef.current?.focus()
      }}
    >
      <SheetHeader className="border-b pr-12 text-left">
        <SheetTitle ref={titleRef} tabIndex={-1} className="outline-none">
          Access for {approval.attributes.app.name}
        </SheetTitle>
      </SheetHeader>
      <SheetSection className="min-h-0 grow overflow-y-auto">
        <h3 className="mb-2 text-base font-medium">Details</h3>
        <dl className="mt-3 mb-8 divide-y rounded-md border bg-surface-75 px-4 text-sm">
          <div className="flex items-center justify-between gap-4 py-3">
            <dt className="text-foreground-light">App ID</dt>
            <dd>
              <code>{approval.id}</code>
            </dd>
          </div>
          {(previewGrants
            ? previewGrants
                .filter((grant) => grant.databaseAccess)
                .map((grant) => grant.databaseAccess!)
            : databaseAccess
              ? [databaseAccess]
              : []
          ).map((access) => (
            <div key={access.role} className="flex items-center justify-between gap-4 py-3">
              <dt className="text-foreground-light">Postgres role</dt>
              <dd>
                <code>{access.role}</code>
              </dd>
            </div>
          ))}
        </dl>
        <p aria-live="polite" className="sr-only">
          {!isPreview && statusText}
        </p>
        {!isPreview && isPending && <ShimmeringLoader />}
        {!isPreview && isError && <AlertError subject="Failed to retrieve grants" error={error} />}
        {!isPreview && isSuccess && isEmpty && (
          <p className="text-sm text-foreground-light">
            No grants have been authorized for this application.
          </p>
        )}
        {isPreview && !previewGrants && (
          <GrantAccess
            id={approval.id}
            title="Organization access"
            scopes={previewScopes}
            projects={previewProjects}
            databaseAccess={databaseAccess}
            icon={<BuildingIcon size={16} />}
            expanded
          />
        )}
        {isPreview &&
          previewGrants
            ?.filter((grant) => !grant.member)
            .map((grant) => (
              <GrantAccess
                key={grant.id}
                id={grant.id}
                title="Organization access"
                scopes={grant.scopes}
                projects={grant.projects}
                databaseAccess={grant.databaseAccess}
                icon={<BuildingIcon size={16} />}
                expanded
              />
            ))}
        {!isPreview &&
          memberGrants
            .filter((grant) => grant.attributes.kind === 'organization_bound')
            .map((grant) => (
              <GrantAccess
                key={grant.id}
                id={grant.id}
                title="Organization access"
                scopes={grant.attributes.approved_scopes}
                projects={grant.attributes.projects ?? undefined}
                icon={<BuildingIcon size={16} />}
                expanded
              />
            ))}
        {((isPreview && previewGrants?.some((grant) => grant.member)) ||
          (!isPreview &&
            memberGrants.some((grant) => grant.attributes.kind === 'member_bound'))) && (
          <h2 className="mb-3 mt-8 text-base font-medium">Member access</h2>
        )}
        <OAuthGrantAccordion
          key={isPreview ? 'preview' : memberGrants.map((grant) => grant.id).join(',')}
          defaultValue={
            isPreview
              ? previewGrants
                  ?.filter((grant) => grant.member)
                  .slice(0, 1)
                  .map((grant) => grant.id)
              : memberGrants
                  .filter((grant) => grant.attributes.kind !== 'organization_bound')
                  .slice(0, 1)
                  .map((grant) => grant.id)
          }
        >
          {isPreview &&
            previewGrants
              ?.filter((grant) => grant.member)
              .map((grant) => (
                <GrantAccess
                  key={grant.id}
                  id={grant.id}
                  title={grant.member ?? 'Organization access'}
                  scopes={grant.scopes}
                  projects={grant.projects}
                  databaseAccess={grant.databaseAccess}
                  icon={grant.member ? <UserIcon size={16} /> : <BuildingIcon size={16} />}
                />
              ))}
          {!isPreview &&
            memberGrants
              .filter((grant) => grant.attributes.kind !== 'organization_bound')
              .map((grant) => (
                <GrantAccess
                  key={grant.id}
                  id={grant.id}
                  title={getGrantLabel(grant)}
                  scopes={grant.attributes.approved_scopes}
                  projects={grant.attributes.projects ?? undefined}
                  icon={
                    grant.attributes.kind === 'organization_bound' ? (
                      <BuildingIcon size={16} />
                    ) : (
                      <UserIcon size={16} />
                    )
                  }
                  expanded={
                    memberGrants.length === 1 &&
                    !hasNextPage &&
                    grant.attributes.kind === 'organization_bound'
                  }
                />
              ))}
        </OAuthGrantAccordion>
        {!isPreview && (
          <p ref={sentinelRef} className="text-sm text-foreground-light">
            {isFetchingNextPage ? 'Loading...' : ''}
          </p>
        )}
      </SheetSection>
      {onRevoke && (
        <SheetFooter className="border-t">
          <Button variant="danger" onClick={onRevoke}>
            Revoke access
          </Button>
        </SheetFooter>
      )}
    </SheetContent>
  )
}

function GrantAccess({
  id,
  title,
  scopes,
  projects,
  databaseAccess,
  icon,
  expanded = false,
}: {
  id: string
  title: string
  scopes: string[]
  projects?: { name: string; ref: string }[]
  databaseAccess?: OAuthAppDatabaseAccess
  expanded?: boolean
  icon: ReactNode
}) {
  const groups = groupScopesByLevel(scopes)
  if (databaseAccess)
    groups[databaseAccess.mode === 'Read and write' ? 'read-write' : 'read'].push('table_data')
  const levels = [
    { label: 'Read and write', permissions: groups['read-write'] },
    { label: 'Write', permissions: groups.write },
    { label: 'Read only', permissions: groups.read },
  ]
  const count = levels.reduce((total, { permissions }) => total + permissions.length, 0)
  const projectSummary =
    projects == null
      ? 'All projects'
      : `${projects.length} ${pluralize(projects.length, 'project')}`

  const details = (
    <div className="space-y-6 text-sm">
      <section className="space-y-1">
        <h3 className="text-sm font-medium">Projects</h3>
        {projects && projects.length > 0 ? (
          <dl className="mt-3 divide-y rounded-md border bg-surface-75 px-4">
            {projects.map((project) => (
              <div key={project.ref} className="space-y-1 py-3">
                <dt>{project.name}</dt>
                <dd>
                  <code>{project.ref}</code>
                </dd>
              </div>
            ))}
          </dl>
        ) : (
          <p className="mt-3 text-foreground-light">
            {projects ? 'No projects included.' : 'All current and future projects.'}
          </p>
        )}
      </section>
      <section className="space-y-3">
        <h3 className="text-sm font-medium">Permissions</h3>
        {count > 0 && (
          <div className="mt-3 divide-y rounded-md border bg-surface-75 px-4">
            {levels
              .filter(({ permissions }) => permissions.length > 0)
              .map(({ label, permissions }) => (
                <div key={label} className="space-y-1.5 py-3">
                  <h4 className="font-mono text-xs uppercase text-foreground-light">{label}</h4>
                  <p className="text-sm text-foreground">
                    {permissions.map((permission, index) => (
                      <Fragment key={permission}>
                        {index > 0 && ', '}
                        <PermissionLabel permission={permission} />
                      </Fragment>
                    ))}
                  </p>
                </div>
              ))}
          </div>
        )}
        {(databaseAccess || scopes.includes('database:write')) && (
          <Admonition
            type="warning"
            description={
              <div className="space-y-1">
                <p>These permissions allow this app to:</p>
                <ul className="list-disc space-y-1 pl-4">
                  {databaseAccess && <li>Read rows that your access rules normally hide</li>}
                  {databaseAccess?.mode === 'Read and write' && (
                    <li>Change data and database structure</li>
                  )}
                  {scopes.includes('database:write') && <li>Run SQL on your database</li>}
                </ul>
              </div>
            }
          />
        )}

        {count === 0 && <p className="text-foreground-light">No permissions granted.</p>}
      </section>
    </div>
  )
  if (expanded)
    return (
      <div className="mb-8 space-y-4">
        <h2 className="text-base font-medium">{title}</h2>
        {details}
      </div>
    )
  return (
    <OAuthGrantAccordionItem
      value={id}
      icon={icon}
      title={title}
      description={`${projectSummary} · ${count} ${pluralize(count, 'permission')}`}
    >
      {details}
    </OAuthGrantAccordionItem>
  )
}

const getGrantLabel = (grant: OAuthAppMemberGrant) => {
  if (grant.attributes.user) return grant.attributes.user.email ?? grant.attributes.user.username
  return 'Organization-wide'
}

function PermissionLabel({ permission }: { permission: string }) {
  const descriptions: Record<string, string> = {
    database: 'Access database settings. Write access also allows the app to run SQL.',
    environment: 'Access project branches.',
    table_data: 'Connect directly to Postgres to access table data.',
  }
  const label =
    permission === 'database'
      ? 'Database management'
      : permission === 'table_data'
        ? 'Table data'
        : formatPermissionName(permission)
  if (!descriptions[permission]) return label
  return (
    <Tooltip>
      <TooltipTrigger className={TOOLTIP_UNDERLINE_CLASS_NAME}>{label}</TooltipTrigger>
      <TooltipContent side="top" className="max-w-60">
        {descriptions[permission]}
      </TooltipContent>
    </Tooltip>
  )
}
