import { Badge, Button, IconGlobe, IconTrash } from 'ui'

import { useParams } from 'common'
import { HorizontalShimmerWithIcon } from 'components/ui/Shimmers'
import { EmptyListState } from 'components/ui/States'
import { useProjectPostgrestConfigQuery } from 'data/config/project-postgrest-config-query'
import { ValueContainer } from './ValueContainer'

interface Props {
  canUpdate: boolean
  onSelectUrlToDelete: (url: string) => void
}

export const CustomOpenIdUrlsList = ({ canUpdate, onSelectUrlToDelete }: Props) => {
  const { ref: projectRef } = useParams()
  const { data: postgrestConfig, isLoading } = useProjectPostgrestConfigQuery({
    projectRef,
  })
  // setJwksUris(postgrestConfig.jwt_jwks_uris)
  // setjwksOidcIssuers(postgrestConfig.jwt_oidc_issuers)

  const URI_ALLOW_LIST_ARRAY = [
    ...(postgrestConfig?.jwt_jwks_uris ?? []).map((url) => ({ url: url, type: 'uri' })),
    ...(postgrestConfig?.jwt_oidc_issuers ?? []).map((url) => ({ url: url, type: 'openId' })),
  ]

  return (
    <div className="-space-y-px">
      {isLoading ? (
        <>
          <ValueContainer>
            <HorizontalShimmerWithIcon />
          </ValueContainer>
          <ValueContainer>
            <HorizontalShimmerWithIcon />
          </ValueContainer>
        </>
      ) : null}
      {URI_ALLOW_LIST_ARRAY.length > 0 ? (
        URI_ALLOW_LIST_ARRAY.map((line) => {
          return (
            <ValueContainer key={`${line.url}_${line.type}`}>
              <div className="flex items-center gap-4 font-mono">
                <span className="text-scale-900">
                  <IconGlobe strokeWidth={2} size={14} />
                </span>
                <span className="text-sm">
                  {line.url} <Badge>{line.type === 'openId' ? 'OpenID' : 'JWKS URI'}</Badge>
                </span>
              </div>
              {canUpdate && (
                <Button
                  type="default"
                  icon={<IconTrash />}
                  onClick={() => onSelectUrlToDelete(line.url)}
                >
                  Remove
                </Button>
              )}
            </ValueContainer>
          )
        })
      ) : (
        <div
          className={[
            'flex items-center border-scale-400 bg-scale-200 text-scale-1200',
            'justify-center gap-2 rounded border px-6 py-8 text-sm',
          ].join(' ')}
        >
          <EmptyListState
            title="No Redirect URLs"
            description="Auth providers may need a URL to redirect back to"
          />
        </div>
      )}
    </div>
  )
}
