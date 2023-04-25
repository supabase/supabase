import { useParams } from 'common'

import { withAuth } from 'hooks'
import { NextPageWithLayout } from 'types'
import { FormPanel } from 'components/ui/Forms'
import APIAuthorizationLayout from 'components/layouts/APIAuthorizationLayout'
import { Alert, Button, Listbox } from 'ui'
import { useOrganizationsQuery } from 'data/organizations/organizations-query'
import ShimmeringLoader from 'components/ui/ShimmeringLoader'
import { useApiAuthorizationQuery } from 'data/api-authorization/api-authorization-query'

const APIAuthorizationPage: NextPageWithLayout = () => {
  const { auth_id } = useParams()
  const { data: organizations, isLoading: isLoadingOrganizations } = useOrganizationsQuery()
  // const { data: apiAuthDetails, isLoading, isSuccess, isError } = useApiAuthorizationQuery({ id: auth_id })

  // [Joshen] To be replaced with actual API call above
  const apiAuthDetails = {
    icon: 'https://cdn-icons-png.flaticon.com/512/5969/5969044.png',
    host: 'cloudflare.com',
    name: 'Cloudflare',
  }

  // [Joshen] To be replaced with actual API call above
  const isApiAuthDetailsError = false
  const isExpired = false

  if (auth_id === undefined) {
    return (
      <FormPanel header={<p>Authorization for API access</p>}>
        <div className="w-[500px] px-8 py-6">
          <Alert withIcon variant="warning" title="Missing authorization ID">
            Please provide a valid authorization ID in the URL
          </Alert>
        </div>
      </FormPanel>
    )
  }

  if (isApiAuthDetailsError) {
    return (
      <FormPanel header={<p>Authorization for API access</p>}>
        <div className="w-[500px] px-8 py-6">
          <Alert
            withIcon
            variant="warning"
            title="Failed to fetch details for API authorization request"
          >
            Please retry your authorization request from the requesting app
          </Alert>
        </div>
      </FormPanel>
    )
  }

  return (
    <FormPanel
      header={<p>Authorize API access for {apiAuthDetails.name}</p>}
      footer={
        <div className="flex items-center justify-end py-4 px-8">
          <div className="flex items-center space-x-2">
            <Button type="default" disabled={isExpired} onClick={() => {}}>
              Decline
            </Button>
            <Button disabled={isExpired} onClick={() => {}}>
              Authorize {apiAuthDetails.name}
            </Button>
          </div>
        </div>
      }
    >
      <div className="w-full md:w-[500px] px-8 py-6 space-y-8">
        {/* API Authorization requester details */}

        <div className="flex space-x-4">
          <div>
            <div className="rounded-md border border-scale-600 p-2.5 flex items-center">
              <div
                className="w-8 h-8 md:w-10 md:h-10 bg-center bg-no-repeat bg-cover"
                style={{ backgroundImage: `url('${apiAuthDetails.icon}')` }}
              ></div>
            </div>
          </div>
          <p className="text-sm text-scale-1100">
            {apiAuthDetails.name} is requesting API access to an organization. The application will
            be able to{' '}
            <span className="text-scale-1200">
              read and write the organization's settings and projects
            </span>
          </p>
        </div>

        {/* Expiry warning */}
        {isExpired && (
          <Alert withIcon variant="warning" title="This authorization is expired">
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
          <Listbox label="Select an organization to grant API access to" disabled={isExpired}>
            {(organizations ?? []).map((organization) => (
              <Listbox.Option
                key={organization.id}
                label={organization.name}
                value={organization.id}
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
