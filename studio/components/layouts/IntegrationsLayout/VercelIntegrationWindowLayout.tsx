import { useParams } from 'common'
import { PropsWithChildren } from 'react'
import IntegrationWindowLayout from './IntegrationWindowLayout'

const VERCEL_ICON = (
  <div className="bg-black shadow rounded p-1 w-8 h-8 flex justify-center items-center">
    <svg xmlns="http://www.w3.org/2000/svg" fill="white" viewBox="0 0 512 512" className="w-4">
      <path fill-rule="evenodd" d="M256,48,496,464H16Z" />
    </svg>
  </div>
)

const VercelIntegrationWindowLayout = ({ children }: PropsWithChildren<{}>) => {
  const { externalId } = useParams()

  const title = externalId
    ? 'Supabase + Vercel Deploy Button'
    : 'Supabase + Vercel Integration Marketplace Connector'

  return (
    <IntegrationWindowLayout title={title} integrationIcon={VERCEL_ICON}>
      {children}
    </IntegrationWindowLayout>
  )
}

export default VercelIntegrationWindowLayout
