import { OAuthScope } from '@supabase/shared-types/out/constants'
import { useQueryClient } from '@tanstack/react-query'
import { CheckCircle2, ChevronRight, ChevronsLeftRight } from 'lucide-react'
import Image from 'next/image'
import { useRouter } from 'next/router'
import { toast } from 'sonner'

import { useParams } from 'common'
import { useApiAuthorizationApproveMutation } from 'data/api-authorization/api-authorization-approve-mutation'
import { ApiAuthorizationResponse } from 'data/api-authorization/api-authorization-query'
import { useOrganizationProjectClaimMutation } from 'data/organizations/organization-project-claim-mutation'
import { OrganizationProjectClaimResponse } from 'data/organizations/organization-project-claim-query'
import { projectKeys } from 'data/projects/keys'
import { BASE_PATH } from 'lib/constants'
import { Organization } from 'types'
import {
  Button,
  cn,
  Collapsible_Shadcn_,
  CollapsibleContent_Shadcn_,
  CollapsibleTrigger_Shadcn_,
} from 'ui'
import { Admonition } from 'ui-patterns/admonition'
import { ScopeSection } from '../OAuthApps/AuthorizeRequesterDetails'
import { PERMISSIONS_DESCRIPTIONS } from '../OAuthApps/OAuthApps.constants'
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
  const { auth_id, token: claimToken } = useParams()
  const queryClient = useQueryClient()

  const { mutateAsync: approveRequest, isLoading: isApproving } =
    useApiAuthorizationApproveMutation()

  const { mutateAsync: claimProject, isLoading: isClaiming } = useOrganizationProjectClaimMutation()

  const onClaimProject = async () => {
    try {
      await approveRequest({ id: auth_id!, slug: selectedOrganization.slug })
      await claimProject({
        slug: selectedOrganization.slug,
        token: claimToken!,
      })

      toast.success('Project claimed successfully')
      // invalidate the org projects to force them to be refetched
      queryClient.invalidateQueries(projectKeys.list())
      router.push(`/org/${selectedOrganization.slug}`)
    } catch (error: any) {
      toast.error(`Failed to claim project ${error.message}`)
    }
  }

  const isLoading = isApproving || isClaiming

  return (
    <ProjectClaimLayout
      title={
        <>
          Claim a project <span className="text-brand">{projectClaim?.project?.name}</span> from{' '}
          <span className="text-brand">{requester?.name}</span>
        </>
      }
    >
      <div className="py-6 space-y-8 text-sm">
        <div className="flex flex-col items-center mt-6">
          <div className="flex items-center">
            <div
              className={cn(
                'w-8 h-8 bg-center bg-no-repeat bg-cover flex items-center justify-center rounded-md'
              )}
              style={{
                backgroundImage: !!requester.icon ? `url('${requester.icon}')` : 'none',
              }}
            >
              {!requester.icon && (
                <p className="text-foreground-light text-lg">{requester.name[0]}</p>
              )}
            </div>

            <div className="flex items-center justify-center w-28 relative">
              <div className="h-0.5 w-full border-2 border-dashed border-stronger" />
              <div className="rounded-full border flex items-center justify-center h-10 w-full shadow-sm">
                <ChevronsLeftRight className="text-muted-foreground" size={24} />
              </div>
              <div className="h-0.5 w-full border-2 border-dashed border-stronger z-10" />
            </div>

            <div className="w-8 h-8">
              <Image
                src={`${BASE_PATH}/img/supabase-logo.svg`}
                alt="Supabase Logo"
                className="w-full h-full"
                width={100}
                height={100}
              />
            </div>
          </div>
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
                (permissions listed below) to all projects within your organization to continue
                providing its functionality to the application you've built.
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
          <Admonition type="caution">
            <div className="text-foreground-light">
              Upon claiming, the project may undergo a short downtime (less than 10 minutes) for
              resizing.
            </div>
          </Admonition>
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
                  <span className="font-foreground">List of permissions</span> that{' '}
                  <span className="text-foreground">{requester.name}</span> will have for the{' '}
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
                    description={PERMISSIONS_DESCRIPTIONS.ANALYTICS}
                    hasReadScope={requester.scopes.includes(OAuthScope.ANALYTICS_READ)}
                    hasWriteScope={requester.scopes.includes(OAuthScope.ANALYTICS_WRITE)}
                  />
                  <ScopeSection
                    description={PERMISSIONS_DESCRIPTIONS.AUTH}
                    hasReadScope={requester.scopes.includes(OAuthScope.AUTH_READ)}
                    hasWriteScope={requester.scopes.includes(OAuthScope.AUTH_WRITE)}
                  />
                  <ScopeSection
                    description={PERMISSIONS_DESCRIPTIONS.DATABASE}
                    hasReadScope={requester.scopes.includes(OAuthScope.DATABASE_READ)}
                    hasWriteScope={requester.scopes.includes(OAuthScope.DATABASE_WRITE)}
                  />
                  <ScopeSection
                    description={PERMISSIONS_DESCRIPTIONS.DOMAINS}
                    hasReadScope={requester.scopes.includes(OAuthScope.DOMAINS_READ)}
                    hasWriteScope={requester.scopes.includes(OAuthScope.DOMAINS_WRITE)}
                  />
                  <ScopeSection
                    description={PERMISSIONS_DESCRIPTIONS.EDGE_FUNCTIONS}
                    hasReadScope={requester.scopes.includes(OAuthScope.EDGE_FUNCTIONS_READ)}
                    hasWriteScope={requester.scopes.includes(OAuthScope.EDGE_FUNCTIONS_WRITE)}
                  />
                  <ScopeSection
                    description={PERMISSIONS_DESCRIPTIONS.ENVIRONMENT}
                    hasReadScope={requester.scopes.includes(OAuthScope.ENVIRONMENT_READ)}
                    hasWriteScope={requester.scopes.includes(OAuthScope.ENVIRONMENT_WRITE)}
                  />
                  <ScopeSection
                    description={PERMISSIONS_DESCRIPTIONS.ORGANIZATIONS}
                    hasReadScope={requester.scopes.includes(OAuthScope.ORGANIZATIONS_READ)}
                    hasWriteScope={requester.scopes.includes(OAuthScope.ORGANIZATIONS_WRITE)}
                  />
                  <ScopeSection
                    description={PERMISSIONS_DESCRIPTIONS.PROJECTS}
                    hasReadScope={requester.scopes.includes(OAuthScope.PROJECTS_READ)}
                    hasWriteScope={requester.scopes.includes(OAuthScope.PROJECTS_WRITE)}
                  />
                  <ScopeSection
                    description={PERMISSIONS_DESCRIPTIONS.REST}
                    hasReadScope={requester.scopes.includes(OAuthScope.REST_READ)}
                    hasWriteScope={requester.scopes.includes(OAuthScope.REST_WRITE)}
                  />
                  <ScopeSection
                    description={PERMISSIONS_DESCRIPTIONS.SECRETS}
                    hasReadScope={requester.scopes.includes(OAuthScope.SECRETS_READ)}
                    hasWriteScope={requester.scopes.includes(OAuthScope.SECRETS_WRITE)}
                  />
                  <ScopeSection
                    description={PERMISSIONS_DESCRIPTIONS.STORAGE}
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
        <Button size="medium" loading={isLoading} disabled={isLoading} onClick={onClaimProject}>
          Claim project {projectClaim?.project?.name}
        </Button>
      </div>
    </ProjectClaimLayout>
  )
}
