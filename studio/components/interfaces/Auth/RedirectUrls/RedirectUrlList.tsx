import { noop } from 'lodash'
import { observer } from 'mobx-react-lite'
import { Button, IconGlobe, IconTrash } from 'ui'

import { useParams } from 'common'
import { HorizontalShimmerWithIcon } from 'components/ui/Shimmers'
import { EmptyListState } from 'components/ui/States'
import { useAuthConfigQuery } from 'data/auth/auth-config-query'
import ValueContainer from './ValueContainer'

interface RedirectUrlListProps {
  canUpdate: boolean
  onSelectUrlToDelete: (url: string) => void
}

const RedirectUrlList = ({ canUpdate, onSelectUrlToDelete = noop }: RedirectUrlListProps) => {
  const { ref: projectRef } = useParams()
  const { data: config, isFetched: isLoaded } = useAuthConfigQuery({ projectRef })

  const URI_ALLOW_LIST_ARRAY = config?.URI_ALLOW_LIST ? config.URI_ALLOW_LIST.split(',') : []

  return (
    <div className="-space-y-px">
      {!isLoaded ? (
        <>
          <ValueContainer>
            <HorizontalShimmerWithIcon />
          </ValueContainer>
          <ValueContainer>
            <HorizontalShimmerWithIcon />
          </ValueContainer>
        </>
      ) : URI_ALLOW_LIST_ARRAY.length > 0 ? (
        URI_ALLOW_LIST_ARRAY.map((url: string) => {
          return (
            <ValueContainer key={url}>
              <div className="flex items-center gap-4 font-mono">
                <span className="text-scale-900">
                  <IconGlobe strokeWidth={2} size={14} />
                </span>
                <span className="text-sm">{url}</span>
              </div>
              {canUpdate && (
                <Button
                  type="default"
                  icon={<IconTrash />}
                  onClick={() => onSelectUrlToDelete(url)}
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

export default observer(RedirectUrlList)
