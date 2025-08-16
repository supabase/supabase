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
  WarningIcon,
  CheckIcon,
  Card,
  CardContent,
  CardHeader,
  CardFooter,
  Select_Shadcn_,
  SelectTrigger_Shadcn_,
  SelectValue_Shadcn_,
  SelectContent_Shadcn_,
  SelectItem_Shadcn_,
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

  if (isLoading) {
    return (
      <Card>
        <CardHeader>Authorize API access</CardHeader>
        <CardContent className="space-y-2">
          <ShimmeringLoader />
          <ShimmeringLoader className="w-3/4" />
          <ShimmeringLoader className="w-1/2" />
        </CardContent>
      </Card>
    )
  }

  if (auth_id === undefined) {
    return (
      <Card>
        <CardHeader>Authorization for API access</CardHeader>
        <CardContent>
          <Alert_Shadcn_ variant="warning">
            <WarningIcon />
            <AlertTitle_Shadcn_>Missing authorization ID</AlertTitle_Shadcn_>
            <AlertDescription_Shadcn_>
              Please provide a valid authorization ID in the URL
            </AlertDescription_Shadcn_>
          </Alert_Shadcn_>
        </CardContent>
      </Card>
    )
  }

  if (isError) {
    return (
      <Card>
        <CardHeader>Authorize API access</CardHeader>
        <CardContent>
          <Alert_Shadcn_ variant="warning">
            <WarningIcon />
            <AlertTitle_Shadcn_>
              Failed to fetch details for API authorization request"
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
        <CardContent>
          <Alert_Shadcn_>
            <CheckIcon />
            <AlertTitle_Shadcn_>This authorization request has been approved</AlertTitle_Shadcn_>
            <AlertDescription_Shadcn_>
              <p>
                {requester.name} has read and write access to the organization "
                {approvedOrganization?.name ?? 'Unknown'}" and all of its projects
              </p>
              <p className="mt-2">
                Approved on: {dayjs(requester.approved_at).format('DD MMM YYYY HH:mm:ss (ZZ)')}
              </p>
            </AlertDescription_Shadcn_>
          </Alert_Shadcn_>
        </CardContent>
      </Card>
    )
  }

  const searchParams = new URLSearchParams(location.search)
  let pathname = location.pathname
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH
  if (basePath) {
    pathname = pathname.replace(basePath, '')
  }

  searchParams.set('returnTo', pathname)

  return (
    <Card>
      <CardHeader>Authorize API access for {requester?.name}</CardHeader>
      <CardContent className="space-y-8">
        {/* API Authorization requester details */}
        <AuthorizeRequesterDetails
          icon={requester.icon}
          name={requester.name}
          domain={requester.domain}
          scopes={requester.scopes}
        />

        {/* Expiry warning */}
        {isExpired && (
          <Alert_Shadcn_ variant="warning">
            <WarningIcon />
            <AlertTitle_Shadcn_>This authorization request is expired</AlertTitle_Shadcn_>
            <AlertDescription_Shadcn_>
              Please retry your authorization request from the requesting app
            </AlertDescription_Shadcn_>
          </Alert_Shadcn_>
        )}

        {/* Organization selection */}
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
                <SelectValue_Shadcn_ asChild>
                  <>{selectedOrgSlug}</>
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
