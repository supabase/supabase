import { useParams } from 'common'
import dayjs from 'dayjs'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'

import AuthorizeRequesterDetails from 'components/interfaces/Organization/OAuthApps/AuthorizeRequesterDetails'
import APIAuthorizationLayout from 'components/layouts/APIAuthorizationLayout'
import { FormPanel } from 'components/ui/Forms/FormPanel'
import ShimmeringLoader from 'components/ui/ShimmeringLoader'
import { useApiAuthorizationApproveMutation } from 'data/api-authorization/api-authorization-approve-mutation'
import { useApiAuthorizationDeclineMutation } from 'data/api-authorization/api-authorization-decline-mutation'
import { useApiAuthorizationQuery } from 'data/api-authorization/api-authorization-query'
import { useOrganizationsQuery } from 'data/organizations/organizations-query'
import { withAuth } from 'hooks/misc/withAuth'
import type { NextPageWithLayout } from 'types'
import { Alert, Button, Listbox } from 'ui'

// Need to handle if no organizations in account
// Need to handle if not logged in yet state

const APIAuthorizationPage: NextPageWithLayout = () => {
  const router = useRouter()
  const { auth_id } = useParams()
  const [selectedOrgSlug, setSelectedOrgSlug] = useState<string>()

  const { data: organizations, isLoading: isLoadingOrganizations } = useOrganizationsQuery()
  const { data: requester, isLoading, isError, error } = useApiAuthorizationQuery({ id: auth_id })
  const isApproved = (requester?.approved_at ?? null) !== null
  const isExpired = dayjs().isAfter(dayjs(requester?.expires_at))

  const { mutate: approveRequest, isLoading: isApproving } = useApiAuthorizationApproveMutation({
    onSuccess: (res) => {
      window.location.href = res.url
    },
  })
  const { mutate: declineRequest, isLoading: isDeclining } = useApiAuthorizationDeclineMutation({
    onSuccess: () => {
      toast.success('Declined API authorization request')
      router.push('/projects')
    },
  })
  const isSubmitting = isApproving || isDeclining

  useEffect(() => {
    if (!isLoadingOrganizations) {
      setSelectedOrgSlug(organizations?.[0].slug ?? undefined)
    }
  }, [isLoadingOrganizations])

  const onApproveRequest = async () => {
    if (!auth_id) {
      return toast.error('Unable to approve request: auth_id is missing ')
    }
    if (!selectedOrgSlug) {
      return toast.error('Unable to approve request: No organization selected')
    }

    approveRequest({ id: auth_id, slug: selectedOrgSlug })
  }

  const onDeclineRequest = async () => {
    if (!auth_id) {
      return toast.error('Unable to decline request: auth_id is missing ')
    }
    if (!selectedOrgSlug) {
      return toast.error('Unable to decline request: No organization selected')
    }

    declineRequest({ id: auth_id, slug: selectedOrgSlug })
  }

  if (isLoading) {
    return (
      <FormPanel header={<p>Authorize API access</p>}>
        <div className="px-8 py-6 space-y-2">
          <ShimmeringLoader />
          <ShimmeringLoader className="w-3/4" />
          <ShimmeringLoader className="w-1/2" />
        </div>
      </FormPanel>
    )
  }

  if (auth_id === undefined) {
    return (
      <FormPanel header={<p>Authorization for API access</p>}>
        <div className="px-8 py-6">
          <Alert withIcon variant="warning" title="Missing authorization ID">
            Please provide a valid authorization ID in the URL
          </Alert>
        </div>
      </FormPanel>
    )
  }

  if (isError) {
    return (
      <FormPanel header={<p>Authorize API access</p>}>
        <div className="px-8 py-6">
          <Alert
            withIcon
            variant="warning"
            title="Failed to fetch details for API authorization request"
          >
            <p>Please retry your authorization request from the requesting app</p>
            {error !== undefined && <p className="mt-2">Error: {error?.message}</p>}
          </Alert>
        </div>
      </FormPanel>
    )
  }

  if (isApproved) {
    const approvedOrganization = organizations?.find(
      (org) => org.slug === requester.approved_organization_slug
    )

    return (
      <FormPanel header={<p>Authorize API access for {requester?.name}</p>}>
        <div className="w-full px-8 py-6 space-y-8">
          <Alert withIcon variant="success" title="This authorization request has been approved">
            <p>
              {requester.name} has read and write access to the organization "
              {approvedOrganization?.name ?? 'Unknown'}" and all of its projects
            </p>
            <p className="mt-2">
              Approved on: {dayjs(requester.approved_at).format('DD MMM YYYY HH:mm:ss (ZZ)')}
            </p>
          </Alert>
        </div>
      </FormPanel>
    )
  }

  return (
    <FormPanel
      header={<p>Authorize API access for {requester?.name}</p>}
      footer={
        <div className="flex items-center justify-end py-4 px-8">
          <div className="flex items-center space-x-2">
            <Button type="default" disabled={isSubmitting || isExpired} onClick={onDeclineRequest}>
              Decline
            </Button>
            <Button
              loading={isSubmitting}
              disabled={isSubmitting || isExpired}
              onClick={onApproveRequest}
            >
              Authorize {requester?.name}
            </Button>
          </div>
        </div>
      }
    >
      <div className="w-full px-8 py-6 space-y-8">
        {/* API Authorization requester details */}
        <AuthorizeRequesterDetails
          icon={requester.icon}
          name={requester.name}
          domain={requester.domain}
          scopes={requester.scopes}
        />

        {/* Expiry warning */}
        {isExpired && (
          <Alert withIcon variant="warning" title="This authorization request is expired">
            Please retry your authorization request from the requesting app
          </Alert>
        )}

        {/* Organization selection */}
        {isLoadingOrganizations ? (
          <div className="py-4 space-y-2">
            <ShimmeringLoader />
            <ShimmeringLoader className="w-3/4" />
          </div>
        ) : (
          <Listbox
            label="Select an organization to grant API access to"
            value={selectedOrgSlug}
            disabled={isExpired}
            onChange={setSelectedOrgSlug}
          >
            {(organizations ?? []).map((organization) => (
              <Listbox.Option
                key={organization.slug}
                label={organization.name}
                value={organization.slug}
              >
                {organization.name}
              </Listbox.Option>
            ))}
          </Listbox>
        )}
      </div>
    </FormPanel>
  )
}

APIAuthorizationPage.getLayout = (page) => <APIAuthorizationLayout>{page}</APIAuthorizationLayout>

export default withAuth(APIAuthorizationPage)
