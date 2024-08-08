import { noop } from 'lodash'
import { Button, IconGlobe, IconTrash } from 'ui'

import { EmptyListState } from 'components/ui/States'
import ValueContainer from './ValueContainer'

interface RedirectUrlListProps {
  URI_ALLOW_LIST_ARRAY: string[]
  canUpdate: boolean
  onSelectUrlToDelete: (url: string) => void
}

const RedirectUrlList = ({
  URI_ALLOW_LIST_ARRAY,
  canUpdate,
  onSelectUrlToDelete = noop,
}: RedirectUrlListProps) => {
  return (
    <div className="-space-y-px">
      {URI_ALLOW_LIST_ARRAY.length > 0 ? (
        URI_ALLOW_LIST_ARRAY.map((url) => {
          return (
            <ValueContainer key={url}>
              <div className="flex items-center gap-4 font-mono">
                <span className="text-foreground-lighter">
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
            'flex items-center border-overlay bg-studio text-foreground',
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

export default RedirectUrlList
