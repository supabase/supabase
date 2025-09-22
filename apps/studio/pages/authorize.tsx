import dayjs from 'dayjs'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

import { useParams } from 'common'
import { AuthorizeRequesterDetails } from 'components/interfaces/Organization/OAuthApps/AuthorizeRequesterDetails'
import APIAuthorizationLayout from 'components/layouts/APIAuthorizationLayout'
import ShimmeringLoader from 'components/ui/ShimmeringLoader'
import { useApiAuthorizationApproveMutation } from 'data/api-authorization/api-authorization-approve-mutation'
import { useApiAuthorizationDeclineMutation } from 'data/api-authorization/api-authorization-decline-mutation'
import { useApiAuthorizationQuery } from 'data/api-authorization/api-authorization-query'
import { useOrganizationsQuery } from 'data/organizations/organizations-query'
import { withAuth } from 'hooks/misc/withAuth'
import type { NextPageWithLayout } from 'types'
import {
  Alert_Shadcn_,
  AlertDescription_Shadcn_,
  AlertTitle_Shadcn_,
  Button,
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CheckIcon,
  Select_Shadcn_,
  SelectContent_Shadcn_,
  SelectItem_Shadcn_,
  SelectTrigger_Shadcn_,
  SelectValue_Shadcn_,
  WarningIcon,
} from 'ui'
import { FormLayout } from 'ui-patterns/form/Layout/FormLayout'

// Need to handle if no organizations in account
// Need to handle if not logged in yet state

const APIAuthorizationPage: NextPageWithLayout = () => {
  const router = useRouter()
  const { auth_id, organization_slug } = useParams()
  const [isApproving, setIsApproving] = useState(false)
  const [isDeclining, setIsDeclining] = useState(false)
  const [selectedOrgSlug, setSelectedOrgSlug] = useState<string>()

  const {
    data: organizations,
    isSuccess: isSuccessOrganizations,
    isLoading: isLoadingOrganizations,
  } = useOrganizationsQuery()
  const { data: requester, isLoading, isError, error } = useApiAuthorizationQuery({ id: auth_id })
  const isApproved = (requester?.approved_at ?? null) !== null
  const isExpired = dayjs().isAfter(dayjs(requester?.expires_at))
  const isMcpClient = requester?.registration_type === 'dynamic'

  const searchParams =
    typeof window !== 'undefined' ? new URLSearchParams(location.search) : new URLSearchParams()
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH
  const pathname =
    typeof window !== 'undefined'
      ? basePath
        ? location.pathname.replace(basePath, '')
        : location.pathname
      : ''
  searchParams.set('returnTo', pathname)

  const { mutate: approveRequest } = useApiAuthorizationApproveMutation({
    onSuccess: (res) => {
      window.location.href = res.url
    },
  })
  const { mutate: declineRequest } = useApiAuthorizationDeclineMutation({
    onSuccess: () => {
      toast.success('Declined API authorization request')
      router.push('/organizations')
    },
  })

  const onApproveRequest = async () => {
    if (!auth_id) {
      return toast.error('Unable to approve request: auth_id is missing ')
    }
    if (!selectedOrgSlug) {
      return toast.error('Unable to approve request: No organization selected')
    }

    setIsApproving(true)
    approveRequest({ id: auth_id, slug: selectedOrgSlug }, { onError: () => setIsApproving(false) })
  }

  const onDeclineRequest = async () => {
    if (!auth_id) {
      return toast.error('Unable to decline request: auth_id is missing ')
    }
    if (!selectedOrgSlug) {
      return toast.error('Unable to decline request: No organization selected')
    }

    setIsDeclining(true)
    declineRequest({ id: auth_id, slug: selectedOrgSlug }, { onError: () => setIsDeclining(false) })
  }

  useEffect(() => {
    if (isSuccessOrganizations && organizations.length > 0) {
      if (organization_slug) {
        setSelectedOrgSlug(organizations.find(({ slug }) => slug === organization_slug)?.slug)
      } else {
        setSelectedOrgSlug(organizations[0].slug)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSuccessOrganizations])

  if (isLoading) {
    return (
      <Card>
        <CardHeader>Authorize API access</CardHeader>
        <CardContent>
          <div className="flex gap-x-4 items-center">
            <ShimmeringLoader className="w-12 h-12 md:w-14 md:h-14" />
            <ShimmeringLoader className="h-6 w-64" />
          </div>

          <div className="flex flex-col gap-y-2 mt-4">
            <ShimmeringLoader className="w-1/4" />
            <ShimmeringLoader />
          </div>

          <div className="flex flex-col gap-y-2 mt-8">
            <ShimmeringLoader className="w-1/2" />
            <ShimmeringLoader />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (isError) {
    return (
      <Card>
        <CardHeader>Authorize API access</CardHeader>
        <CardContent className="p-0">
          <Alert_Shadcn_ variant="warning" className="border-0 rounded-t-none">
            <WarningIcon />
            <AlertTitle_Shadcn_>
              Failed to fetch details for API authorization request
            </AlertTitle_Shadcn_>
            <AlertDescription_Shadcn_>
              <p>Please retry your authorization request from the requesting app</p>
              {error !== undefined && <p className="mt-2">Error: {error?.message}</p>}
            </AlertDescription_Shadcn_>
          </Alert_Shadcn_>
        </CardContent>
      </Card>
    )
  }

  if (isApproved) {
    const approvedOrganization = organizations?.find(
      (org) => org?.slug === requester.approved_organization_slug
    )

    return (
      <Card>
        <CardHeader>Authorize API access for {requester?.name}</CardHeader>
        <CardContent className="p-0">
          <Alert_Shadcn_ className="border-0 rounded-t-none">
            <CheckIcon />
            <AlertTitle_Shadcn_>This authorization request has been approved</AlertTitle_Shadcn_>
            <AlertDescription_Shadcn_>
              <p>
                {requester.name} has been approved access to the organization "
                {approvedOrganization?.name ?? 'Unknown'}" and all of its projects for the following
                scopes:
              </p>
              <AuthorizeRequesterDetails
                showOnlyScopes
                icon={requester.icon}
                name={requester.name}
                domain={requester.domain}
                scopes={requester.scopes}
              />
              <p className="mt-2">
                Approved on: {dayjs(requester.approved_at).format('DD MMM YYYY HH:mm:ss (ZZ)')}
              </p>
            </AlertDescription_Shadcn_>
          </Alert_Shadcn_>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>Authorize API access for {requester?.name}</CardHeader>
      <CardContent className="space-y-8">
        {isMcpClient && (
          <Alert_Shadcn_ variant="warning">
            <WarningIcon />
            <AlertTitle_Shadcn_>MCP Client Connection</AlertTitle_Shadcn_>
            <AlertDescription_Shadcn_>
              This is an MCP (Model Context Protocol) client designed to connect with AI
              applications. Please ensure you trust this application before granting access to your
              organization's data.
            </AlertDescription_Shadcn_>
          </Alert_Shadcn_>
        )}

        <AuthorizeRequesterDetails
          icon={requester.icon}
          name={requester.name}
          domain={requester.domain}
          scopes={requester.scopes}
        />

        {isExpired && (
          <Alert_Shadcn_ variant="warning">
            <WarningIcon />
            <AlertTitle_Shadcn_>This authorization request is expired</AlertTitle_Shadcn_>
            <AlertDescription_Shadcn_>
              Please retry your authorization request from the requesting app
            </AlertDescription_Shadcn_>
          </Alert_Shadcn_>
        )}

        {isLoadingOrganizations ? (
          <div className="py-4 space-y-2">
            <ShimmeringLoader />
            <ShimmeringLoader className="w-3/4" />
          </div>
        ) : organizations?.length === 0 ? (
          <Alert_Shadcn_ variant="warning">
            <WarningIcon />
            <AlertTitle_Shadcn_>
              Organization is needed for installing an integration
            </AlertTitle_Shadcn_>
            <AlertDescription_Shadcn_>
              Your account isn't associated with any organizations. To use this integration, it must
              be installed within an organization. You'll be redirected to create an organization
              first.
            </AlertDescription_Shadcn_>
          </Alert_Shadcn_>
        ) : organization_slug && !selectedOrgSlug ? (
          <Alert_Shadcn_ variant="warning">
            <WarningIcon />
            <AlertTitle_Shadcn_>
              Organization is needed for installing an integration
            </AlertTitle_Shadcn_>
            <AlertDescription_Shadcn_>
              Your account is not a member of the pre-selected organization. To use this
              integration, it must be installed within an organization your account is associated
              with.
            </AlertDescription_Shadcn_>
          </Alert_Shadcn_>
        ) : (
          <FormLayout
            label={
              organization_slug
                ? 'API access will be granted to pre-selected organization:'
                : 'Select an organization to grant API access to:'
            }
          >
            <Select_Shadcn_
              value={selectedOrgSlug}
              disabled={isExpired || Boolean(organization_slug)}
              onValueChange={setSelectedOrgSlug}
            >
              <SelectTrigger_Shadcn_ size="small">
                <SelectValue_Shadcn_>
                  {organizations?.find((x) => x.slug === selectedOrgSlug)?.name}
                </SelectValue_Shadcn_>
              </SelectTrigger_Shadcn_>
              <SelectContent_Shadcn_>
                {(organizations ?? []).map((organization) => (
                  <SelectItem_Shadcn_
                    key={organization?.slug}
                    value={organization?.slug}
                    className="text-xs"
                  >
                    {organization.name}
                  </SelectItem_Shadcn_>
                ))}
              </SelectContent_Shadcn_>
            </Select_Shadcn_>
          </FormLayout>
        )}
      </CardContent>
      <CardFooter className="justify-end space-x-2">
        <Button
          type="default"
          loading={isDeclining}
          disabled={isApproving || isExpired || (Boolean(organization_slug) && !selectedOrgSlug)}
          onClick={onDeclineRequest}
        >
          Decline
        </Button>
        {isLoadingOrganizations ? (
          <Button loading={isLoadingOrganizations}>Authorize {requester?.name}</Button>
        ) : isSuccessOrganizations && organizations.length === 0 ? (
          <Link href={`/new?${searchParams.toString()}`}>
            <Button loading={isLoadingOrganizations}>Create an organization</Button>
          </Link>
        ) : (
          <Button
            loading={isApproving}
            disabled={isDeclining || isExpired || (Boolean(organization_slug) && !selectedOrgSlug)}
            onClick={onApproveRequest}
          >
            Authorize {requester?.name}
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}

APIAuthorizationPage.getLayout = (page) => <APIAuthorizationLayout>{page}</APIAuthorizationLayout>

export default withAuth(APIAuthorizationPage)
