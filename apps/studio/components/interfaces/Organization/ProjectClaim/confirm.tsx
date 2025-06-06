import { OAuthScope } from '@supabase/shared-types/out/constants'
import { CheckCircle2, ChevronRight } from 'lucide-react'
import { useRouter } from 'next/router'
import { toast } from 'sonner'

import { useParams } from 'common'
import { ApiAuthorizationResponse } from 'data/api-authorization/api-authorization-query'
import { useOrganizationProjectClaimMutation } from 'data/organizations/organization-project-claim-mutation'
import { OrganizationProjectClaimResponse } from 'data/organizations/organization-project-claim-query'
import { Organization } from 'types'
import {
  Button,
  cn,
  Collapsible_Shadcn_,
  CollapsibleContent_Shadcn_,
  CollapsibleTrigger_Shadcn_,
} from 'ui'
import { ScopeSection } from '../OAuthApps/AuthorizeRequesterDetails'
import { ProjectClaimLayout } from './layout'

export const ProjectClaimConfirm = ({
  selectedOrganization,
  projectClaim,
  requester,
  setStep,
}: {
  selectedOrganization: Organization
  projectClaim: OrganizationProjectClaimResponse
  requester: ApiAuthorizationResponse
  setStep: (step: 'choose-org' | 'benefits' | 'confirm') => void
}) => {
  const router = useRouter()
  const { token: claimToken } = useParams()

  const { mutate: claimProject, isLoading } = useOrganizationProjectClaimMutation({
    onSuccess: () => {
      toast.success('Project claimed successfully')
      router.push(`/org/${selectedOrganization.slug}`)
    },
    onError: (error) => {
      toast.error(`Failed to claim project ${error.message}`)
    },
  })

  return (
    <ProjectClaimLayout
      title={
        <>
          Claim a project <span className="text-brand">{projectClaim?.project?.name}</span> from{' '}
          <span className="text-brand">{requester?.name}</span>
        </>
      }
      description="Step 3 of 3"
    >
      <div className="px-8 py-6 space-y-8 text-sm">
        <div>
          <h2 className="text-center text-base text-foreground-light">
            Supabase will become the backend for{' '}
            <span className="text-foreground">{projectClaim?.project?.name}</span>.
          </h2>
          <p className="text-center text-foreground-lighter">
            Your backend will then be managed by Supabase.
          </p>
        </div>
        <div className="space-y-4 text-foreground-light">
          <p>
            By claiming the <span className="text-foreground">{projectClaim?.project?.name}</span>{' '}
            project from <span className="text-foreground">{requester?.name}</span>, the following
            will happen:
          </p>
          <ul className="space-y-3">
            <li className="flex space-x-2">
              <span>
                <CheckCircle2 className="text-brand h-5 w-5" />
              </span>
              <span>
                The project will be transferred to your Supabase organization{' '}
                <span className="text-foreground">{selectedOrganization.name}.</span>{' '}
                <a
                  href="#"
                  onClick={() => setStep('choose-org')}
                  className="text-foreground-light underline"
                >
                  Choose another organization?
                </a>
              </span>
            </li>
            <li className="flex space-x-2">
              <span>
                <CheckCircle2 className="text-brand h-5 w-5" />
              </span>
              <span>
                <span className="text-foreground">{requester?.name}</span> will receive API access
                to all projects within your organization to continue providing its functionality.
              </span>
            </li>
            <li className="flex space-x-2">
              <span>
                <CheckCircle2 className="text-brand h-5 w-5" />
              </span>
              <span>
                You'll be responsible for maintaining the project, which may include additional
                costs.
              </span>
            </li>
          </ul>
          <div className="text-foreground-light">
            Upon claiming, the project may undergo a short downtime (less than 10 minutes) for
            resizing.
          </div>
        </div>
        <div className="flex space-y-4 flex-col">
          {requester.scopes.length === 0 ? (
            <span className="text-foreground-light">
              <span className="text-foreground">{requester?.name}</span> hasn't requested any
              permissions to operate. This is normal and no action is needed from your side.
            </span>
          ) : (
            <Collapsible_Shadcn_>
              <CollapsibleTrigger_Shadcn_ className="pb-3 w-full flex items-center justify-between group">
                <p className="text-sm text-foreground-light text-left">
                  <span className="font-foreground">List of permissions</span> which will be applied
                  for the{' '}
                  <span className="text-amber-900">
                    selected organization and all of its projects.
                  </span>
                </p>

                <ChevronRight
                  size={16}
                  className="text-foreground-light transition-all group-data-[state=open]:rotate-90 w-20"
                  strokeWidth={1}
                />
              </CollapsibleTrigger_Shadcn_>
              <CollapsibleContent_Shadcn_
                className={cn(
                  'flex flex-col gap-8 transition-all',
                  'data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down'
                )}
              >
                <div>
                  <ScopeSection
                    description="access to analytics logs."
                    hasReadScope={requester.scopes.includes(OAuthScope.ANALYTICS_READ)}
                    hasWriteScope={requester.scopes.includes(OAuthScope.ANALYTICS_WRITE)}
                  />
                  <ScopeSection
                    description="access to auth configurations and SSO providers."
                    hasReadScope={requester.scopes.includes(OAuthScope.AUTH_READ)}
                    hasWriteScope={requester.scopes.includes(OAuthScope.AUTH_WRITE)}
                  />
                  <ScopeSection
                    description="access to Postgres configurations, SQL snippets, SSL enforcement configurations and Typescript schema types."
                    hasReadScope={requester.scopes.includes(OAuthScope.DATABASE_READ)}
                    hasWriteScope={requester.scopes.includes(OAuthScope.DATABASE_WRITE)}
                  />
                  <ScopeSection
                    description="access to custom domains and vanity subdomains."
                    hasReadScope={requester.scopes.includes(OAuthScope.DOMAINS_READ)}
                    hasWriteScope={requester.scopes.includes(OAuthScope.DOMAINS_WRITE)}
                  />
                  <ScopeSection
                    description="access to edge functions."
                    hasReadScope={requester.scopes.includes(OAuthScope.EDGE_FUNCTIONS_READ)}
                    hasWriteScope={requester.scopes.includes(OAuthScope.EDGE_FUNCTIONS_WRITE)}
                  />
                  <ScopeSection
                    description="access to environments/branches."
                    hasReadScope={requester.scopes.includes(OAuthScope.ENVIRONMENT_READ)}
                    hasWriteScope={requester.scopes.includes(OAuthScope.ENVIRONMENT_WRITE)}
                  />
                  <ScopeSection
                    description="access to the organization and all its members."
                    hasReadScope={requester.scopes.includes(OAuthScope.ORGANIZATIONS_READ)}
                    hasWriteScope={requester.scopes.includes(OAuthScope.ORGANIZATIONS_WRITE)}
                  />
                  <ScopeSection
                    description="access to metadata, its upgrade status, network restrictions and network bans."
                    hasReadScope={requester.scopes.includes(OAuthScope.PROJECTS_READ)}
                    hasWriteScope={requester.scopes.includes(OAuthScope.PROJECTS_WRITE)}
                  />
                  <ScopeSection
                    description="access to PostgREST configurations."
                    hasReadScope={requester.scopes.includes(OAuthScope.REST_READ)}
                    hasWriteScope={requester.scopes.includes(OAuthScope.REST_WRITE)}
                  />
                  <ScopeSection
                    description="access to API keys, secrets and pgsodium configurations."
                    hasReadScope={requester.scopes.includes(OAuthScope.SECRETS_READ)}
                    hasWriteScope={requester.scopes.includes(OAuthScope.SECRETS_WRITE)}
                  />
                  <ScopeSection
                    description="access to storage buckets and files."
                    hasReadScope={requester.scopes.includes(OAuthScope.STORAGE_READ)}
                    hasWriteScope={requester.scopes.includes(OAuthScope.STORAGE_WRITE)}
                  />
                </div>
              </CollapsibleContent_Shadcn_>
            </Collapsible_Shadcn_>
          )}
        </div>
      </div>
      <div className="flex justify-center sticky bottom-0">
        <Button
          size="medium"
          loading={isLoading}
          disabled={isLoading}
          onClick={() =>
            claimProject({
              slug: selectedOrganization.slug,
              token: claimToken!,
            })
          }
        >
          Claim project {projectClaim?.project?.name}
        </Button>
      </div>
    </ProjectClaimLayout>
  )
}
