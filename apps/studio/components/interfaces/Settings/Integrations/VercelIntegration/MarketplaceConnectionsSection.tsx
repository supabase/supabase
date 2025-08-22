import { format } from 'date-fns'
import { ExternalLink } from 'lucide-react'
import Link from 'next/link'
import { IntegrationConnectionHeader } from 'components/interfaces/Integrations/VercelGithub/IntegrationPanels'
import { pluralize } from 'lib/helpers'
import { BASE_PATH } from 'lib/constants'
import { Badge, cn } from 'ui'

type MarketplaceConnection = {
  id: string
  foreign_project_id: string
  name: string
  framework: string | null
  inserted_at: string
  updated_at: string
  marketplace_installation_id: string
  vercel_owner_id: string | null
}

type MarketplaceIntegration = {
  id: string
  connections: MarketplaceConnection[]
  inserted_at: string
  updated_at: string
}

interface MarketplaceConnectionsSectionProps {
  marketplaceIntegrations: MarketplaceIntegration[]
}

export const MarketplaceConnectionsSection = ({
  marketplaceIntegrations,
}: MarketplaceConnectionsSectionProps) => {
  const connections = marketplaceIntegrations.flatMap((integration) => integration.connections)

  if (connections.length === 0) {
    return null
  }

  return (
    <div>
      <IntegrationConnectionHeader
        title="Vercel Marketplace Connections"
        markdown="This project is connected to Vercel through the Vercel Marketplace. Environment variables are automatically synced for the connected projects below."
        showNode={false}
      />
      <ul className="flex flex-col gap-2">
        {marketplaceIntegrations.map(() => {
          return connections.map((connection) => {
            return (
              <li key={connection.id}>
                <Link
                  href={`https://vercel.com/${connection.vercel_owner_id}/${connection.name}/stores`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-between rounded-lg border bg-surface-100 px-5 py-4 hover:bg-surface-200 transition-colors group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-8 h-8 rounded-md bg-surface-200 flex items-center justify-center">
                      {!connection.framework ? (
                        <div className="bg-black text-white w-5 h-5 rounded flex items-center justify-center">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="white"
                            viewBox="0 0 512 512"
                            className="w-3"
                          >
                            <path fillRule="evenodd" d="M256,48,496,464H16Z" />
                          </svg>
                        </div>
                      ) : (
                        <img
                          src={`${BASE_PATH}/img/icons/frameworks/${connection.framework}.svg`}
                          width={20}
                          height={20}
                          alt={`${connection.framework} icon`}
                        />
                      )}
                    </div>
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-foreground">{connection.name}</p>
                      </div>
                      <p className="text-xs text-foreground-lighter">
                        Connected {format(new Date(connection.inserted_at), 'MMM d, yyyy')} via
                        Vercel Marketplace
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <ExternalLink className="w-4 h-4 text-foreground-lighter group-hover:text-foreground transition-colors" />
                  </div>
                </Link>
              </li>
            )
          })
        })}
      </ul>
    </div>
  )
}
