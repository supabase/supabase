import { FC } from 'react'
import { observer } from 'mobx-react-lite'
import { Button, IconGlobe, IconTrash } from '@supabase/ui'

import { useStore } from 'hooks'
import ValueContainer from './ValueContainer'
import { EmptyListState } from 'components/ui/States'
import { HorizontalShimmerWithIcon } from 'components/ui/Shimmers'

interface Props {
  onSelectDomainToDelete: (domain: string) => void
}

const DomainList: FC<Props> = ({ onSelectDomainToDelete }) => {
  const { authConfig } = useStore()

  const URI_ALLOW_LIST_ARRAY = authConfig.config.URI_ALLOW_LIST
    ? authConfig.config.URI_ALLOW_LIST.split(',')
    : []

  return (
    <div className="-space-y-px">
      {!authConfig.isLoaded ? (
        <>
          <ValueContainer>
            <HorizontalShimmerWithIcon />
          </ValueContainer>
          <ValueContainer>
            <HorizontalShimmerWithIcon />
          </ValueContainer>
        </>
      ) : URI_ALLOW_LIST_ARRAY.length > 0 ? (
        URI_ALLOW_LIST_ARRAY.map((domain: string) => {
          return (
            <ValueContainer key={domain}>
              <div className="flex items-center gap-2 font-mono">
                <span className="text-scale-900">
                  <IconGlobe strokeWidth={2} size={14} />
                </span>
                {domain}
              </div>
              <Button
                type="default"
                icon={<IconTrash />}
                onClick={() => onSelectDomainToDelete(domain)}
              >
                Remove
              </Button>
            </ValueContainer>
          )
        })
      ) : (
        <div
          className={[
            'bg-scale-200 border-scale-400 text-scale-1200 flex items-center',
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

export default observer(DomainList)
