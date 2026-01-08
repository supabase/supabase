import { Check, Copy } from 'lucide-react'
import { useState } from 'react'

import { useParams } from 'common'
import { IS_PLATFORM } from 'lib/constants'
import { Card, copyToClipboard, Table, TableBody, TableCell, TableRow } from 'ui'
import {
  PageSection,
  PageSectionContent,
  PageSectionMeta,
  PageSectionSummary,
  PageSectionTitle,
} from 'ui-patterns'

interface CopyableCellProps {
  value: string
}

const CopyableCell = ({ value }: CopyableCellProps) => {
  const [isCopied, setIsCopied] = useState(false)

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsCopied(true)
    copyToClipboard(value)
    setTimeout(() => setIsCopied(false), 3000)
  }

  return (
    <div
      className="group relative flex gap-2 items-center truncate cursor-pointer"
      onClick={handleCopy}
    >
      <span className="text-sm font-mono truncate">{value}</span>
      <button
        type="button"
        className="text-foreground-lighter hover:text-foreground transition opacity-0 group-hover:opacity-100 flex-shrink-0"
        onClick={handleCopy}
      >
        {isCopied ? <Check size={14} strokeWidth={1.5} /> : <Copy size={14} strokeWidth={1.5} />}
      </button>
    </div>
  )
}

export const OAuthEndpointsTable = () => {
  const { ref: projectRef } = useParams()

  const baseUrl = IS_PLATFORM ? `https://${projectRef}.supabase.co` : 'http://localhost:54321'

  const endpoints = [
    {
      name: 'Authorization endpoint',
      path: '/auth/v1/oauth/authorize',
    },
    {
      name: 'Token endpoint',
      path: '/auth/v1/oauth/token',
    },
    {
      name: 'JWKS endpoint',
      path: '/auth/v1/.well-known/jwks.json',
    },
    {
      name: 'Discovery endpoint',
      path: '/.well-known/oauth-authorization-server/auth/v1',
    },
    {
      name: 'OIDC discovery',
      path: '/auth/v1/.well-known/openid-configuration',
    },
  ]

  return (
    <PageSection>
      <PageSectionMeta>
        <PageSectionSummary>
          <PageSectionTitle>OAuth Endpoints</PageSectionTitle>
        </PageSectionSummary>
      </PageSectionMeta>
      <PageSectionContent>
        <Card>
          <Table>
            <TableBody>
              {endpoints.map((endpoint) => {
                const url = `${baseUrl}${endpoint.path}`
                return (
                  <TableRow key={endpoint.name}>
                    <TableCell className="text-sm text-foreground-lighter whitespace-nowrap">
                      {endpoint.name}
                    </TableCell>
                    <TableCell>
                      <CopyableCell value={url} />
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </Card>
      </PageSectionContent>
    </PageSection>
  )
}
