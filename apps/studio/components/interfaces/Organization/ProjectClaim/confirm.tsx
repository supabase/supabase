import { OAuthScope } from '@supabase/shared-types/out/constants'
import { useParams } from 'common'
import { FormPanel } from 'components/ui/Forms/FormPanel'
import { ApiAuthorizationResponse } from 'data/api-authorization/api-authorization-query'
import { useOrganizationProjectClaimMutation } from 'data/organizations/organization-project-claim-mutation'
import { OrganizationProjectClaimResponse } from 'data/organizations/organization-project-claim-query'
import { BASE_PATH } from 'lib/constants'
import { CheckCircle2, ChevronRight, ChevronsLeftRight } from 'lucide-react'
import { useTheme } from 'next-themes'
import Image from 'next/image'
import { Organization } from 'types'
import {
  Badge,
  Button,
  Card,
  CardContent,
  cn,
  Collapsible_Shadcn_,
  CollapsibleContent_Shadcn_,
  CollapsibleTrigger_Shadcn_,
} from 'ui'
import { ScopeSection } from '../OAuthApps/AuthorizeRequesterDetails'

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
  const { token: claimToken } = useParams()
  const { resolvedTheme } = useTheme()

  const { mutate: claimProject, isLoading } = useOrganizationProjectClaimMutation()

  return (
    <FormPanel
      header={
        <div className="flex items-center justify-between">
          <p>
            Claim a project <span className="text-brand">{projectClaim?.project?.name}</span> from{' '}
            <span className="text-brand">{requester?.name}</span>
          </p>
          <p className="text-foreground-light text-xs">Step 3 of 3</p>
        </div>
      }
      footer={
        <div className="flex justify-end py-4 px-8">
          <Button
            loading={isLoading}
            disabled={
              isLoading
              // errorProjectClaim?.message === 'Project is already in the target organization.'
            }
            onClick={() =>
              claimProject({
                slug: selectedOrganization.slug,
                token: claimToken!,
              })
            }
          >
            Claim {projectClaim?.project?.name}
          </Button>
        </div>
      }
    >
      <div className="w-full px-8 py-6 space-y-8 text-sm">
        <div className="flex flex-col items-center mt-6">
          <div className="flex items-center gap-2">
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
            <p className="text-base">{requester.name}</p>
          </div>

          <div className="flex items-center justify-center h-28 relative flex-col">
            <div className="w-0.5 h-28 mt-2 border-2 border-dashed border-stronger" />
            <div className="rounded-full border flex items-center justify-center w-10 h-full shadow-sm">
              <ChevronsLeftRight className="text-muted-foreground" size={24} />
            </div>
            <div className="w-0.5 h-28 mb-6 border-2 border-dashed border-stronger z-10" />
          </div>

          <Card className="relative min-w-72 flex items-center justify-center">
            <Card className="absolute -top-6 bg-surface-200">
              <CardContent className="flex items-center gap-2 flex-row border-2 w-60">
                <div className="w-8 h-8">
                  <Image
                    src={
                      resolvedTheme?.includes('dark')
                        ? `${BASE_PATH}/img/supabase-logo.svg`
                        : `${BASE_PATH}/img/supabase-logo.svg`
                    }
                    alt="Supabase Logo"
                    className="w-full h-full"
                    width={50}
                    height={50}
                  />
                </div>
                <div className="flex flex-col">
                  <p className="truncate">{projectClaim?.project?.name}</p>
                  <p className="text-foreground-lighter text-sm">Project</p>
                </div>
              </CardContent>
            </Card>
            <CardContent className="mt-12 flex flex-col">
              <div className="flex items-end gap-2">
                <p>{selectedOrganization.name}</p>
                <Badge>{selectedOrganization.plan.name}</Badge>
              </div>
              <a
                className="text-foreground-lighter text-sm underline cursor-pointer"
                onClick={() => setStep('choose-org')}
              >
                Choose another organization
              </a>
            </CardContent>
          </Card>
        </div>
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
              <CheckCircle2 className="text-brand w-5 h-5" />
              <span>The project will be transferred to your Supabase organization.</span>
            </li>
            <li className="flex space-x-2">
              <CheckCircle2 className="text-brand w-5 h-5 flex-none" />
              <span>
                {requester?.name} will receive API access to all projects within your organization
                to continue providing its functionality.
              </span>
            </li>
            <li className="flex space-x-2">
              <CheckCircle2 className="text-brand w-5 h-5 flex-none" />
              <span>
                You’ll be responsible for maintaining the project, which may include additional
                costs.
              </span>
            </li>
          </ul>
        </div>
        <div className="flex space-y-4 flex-col">
          <Collapsible_Shadcn_ className="-space-y-px">
            <CollapsibleTrigger_Shadcn_ className="py-3 w-full flex rounded-t items-center justify-between group">
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
        </div>

        {/* Expiry warning */}
        {/* {isExpired && (
          <Alert withIcon variant="warning" title="This authorization request is expired">
            Please retry your authorization request from the requesting app
          </Alert>
        )} */}

        {/* Organization selection */}
        {/* {isLoadingOrganizations ? (
          <div className="py-4 space-y-2">
            <ShimmeringLoader />
            <ShimmeringLoader className="w-3/4" />
          </div>
        ) : organizations?.length === 0 ? (
          <Alert_Shadcn_ variant="warning">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle_Shadcn_>
              Organization is needed for installing an integration
            </AlertTitle_Shadcn_>
            <AlertDescription_Shadcn_ className="">
              Your account isn't associated with any organizations. To use this integration, it must
              be installed within an organization. You'll be redirected to create an organization
              first.
            </AlertDescription_Shadcn_>
          </Alert_Shadcn_>
        ) : (
          <>
            <Listbox
              label="Select an organization to grant API access to"
              value={selectedOrgSlug}
              disabled={isExpired}
              onChange={setSelectedOrgSlug}
            >
              {(organizations ?? []).map((organization) => (
                <Listbox.Option
                  key={organization?.slug}
                  label={organization?.name}
                  value={organization?.slug}
                >
                  {organization.name}
                </Listbox.Option>
              ))}
            </Listbox>
            {errorProjectClaim?.message === 'Project is already in the target organization.' && (
              <Alert_Shadcn_ variant="warning">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle_Shadcn_>
                  The project is already in the target organization.
                </AlertTitle_Shadcn_>
                <AlertDescription_Shadcn_ className="">
                  Please select a different organization to claim the project.
                </AlertDescription_Shadcn_>
              </Alert_Shadcn_>
            )}
          </>
        )} */}
      </div>
    </FormPanel>
  )
}
