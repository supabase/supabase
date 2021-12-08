import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { Button, Select } from '@supabase/ui'
import { observer } from 'mobx-react-lite'

import { useStore } from 'hooks'
import { API_URL } from 'lib/constants'
import { get, post } from 'lib/common/fetch'

const Associate = observer(() => {
  const { ui, app } = useStore()
  const sortedOrganizations = app.organizations.list()

  const [awsMarketplace, setAwsMarketplace] = useState<any>()
  const [error, setError] = useState<any>('')
  const [loading, setLoading] = useState<any>(true)
  const [organizationSlug, setOrganizationSlug] = useState<any>('')
  const [saving, setSaving] = useState<any>(false)
  const router = useRouter()

  const handleChange = (e: any) => {
    setOrganizationSlug(e.target.value)
  }

  const onSave = async () => {
    if (organizationSlug === '') {
      setError('Please select an organization')
      return
    }
    setSaving(true)
    const { error } = await post(
      `${API_URL}/organizations/${organizationSlug}/associate`,
      awsMarketplace
    )
    if (error) {
      setError(error.message)
    }
    setSaving(false)
    if (!error) {
      router.push('/')
    }
  }

  useEffect(() => {
    const getAwsMarketplaceInfo = async () => {
      try {
        setLoading(true)
        const xAmznMarketplaceToken = router.query['x-amzn-marketplace-token']
        if (typeof xAmznMarketplaceToken !== 'string') {
          throw new Error('Missing or multiple x-amzn-marketplace-token')
        }
        const response = await get(
          `${API_URL}/organizations/aws-marketplace?x-amzn-marketplace-token=${encodeURIComponent(
            xAmznMarketplaceToken
          )}`
        )
        if (response.error) {
          throw response.error
        }
        if (response.slug) {
          setOrganizationSlug(response.slug)
        }
        setAwsMarketplace(response.awsMarketplace)
        setLoading(false)
        if (sortedOrganizations.length === 1) {
          onSave()
        }
      } catch (error: any) {
        ui.setNotification({
          category: 'error',
          message: `Failed to get AWS Marketplace Information: ${error.message}`,
        })
      }
    }
    getAwsMarketplaceInfo()
  }, [])

  return (
    <div className="flex justify-center">
      {!loading && (
        <div>
          <Select
            className="my-4"
            error={error}
            label="Select an organization to associate AWS Marketplace subscription with:"
            onChange={handleChange}
            value={organizationSlug}
          >
            <Select.Option key="" value="">
              {' '}
            </Select.Option>
            {sortedOrganizations.map((organization: any) => (
              <Select.Option key={organization.slug} value={organization.slug}>
                {organization.name}
              </Select.Option>
            ))}
          </Select>
          <Button type="primary" loading={saving} onClick={onSave}>
            Save
          </Button>
        </div>
      )}
    </div>
  )
})

export default Associate
