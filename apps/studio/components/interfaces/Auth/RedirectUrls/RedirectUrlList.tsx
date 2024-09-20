import { noop } from 'lodash'
import { Globe } from 'lucide-react'

import { EmptyListState } from 'components/ui/States'
import { Checkbox_Shadcn_ } from 'ui'
import { ValueContainer } from './ValueContainer'

interface RedirectUrlListProps {
  allowList: string[]
  canUpdate: boolean
  selectedUrls: string[]
  onSelectUrl: (urls: string[]) => void
}

export const RedirectUrlList = ({
  allowList,
  selectedUrls,
  onSelectUrl = noop,
}: RedirectUrlListProps) => {
  // [Joshen] One for next time: maybe shift this into a reusable logic since it
  // seems like we can use this in multiple places for future
  const onClickUrl = (event: any, url: string) => {
    if (event.shiftKey) {
      const urlIdx = allowList.indexOf(url)
      const idxLatest = allowList.indexOf(selectedUrls[selectedUrls.length - 1])

      const newSelectedUrls =
        urlIdx > idxLatest
          ? allowList.slice(idxLatest + 1, urlIdx + 1)
          : allowList.slice(urlIdx, idxLatest)

      const urlsNotSelectedYet = newSelectedUrls.filter((x) => !selectedUrls.includes(x))

      if (urlsNotSelectedYet.length > 0) {
        onSelectUrl([
          ...selectedUrls,
          ...(urlIdx > idxLatest ? newSelectedUrls : newSelectedUrls.reverse()),
        ])
      } else {
        const urlsToRemove = newSelectedUrls.concat([selectedUrls[selectedUrls.length - 1]])
        onSelectUrl(selectedUrls.filter((x) => !urlsToRemove.includes(x)))
      }
    } else {
      const isSelected = selectedUrls.includes(url)
      const newSelectedUrls = isSelected
        ? selectedUrls.filter((selectedUrl) => selectedUrl !== url)
        : [...selectedUrls, url]
      onSelectUrl(newSelectedUrls)
    }
  }

  return (
    <div className="-space-y-px">
      {allowList.length > 0 ? (
        <>
          {allowList.map((url) => {
            const isSelected = selectedUrls.includes(url)
            return (
              <ValueContainer key={url} isSelected={isSelected} onClick={(e) => onClickUrl(e, url)}>
                <div className={`flex items-center gap-4 font-mono group w-full`}>
                  <div className="w-5 h-5 flex items-center justify-center">
                    <span className="text-foreground-lighter">
                      <Globe strokeWidth={2} size={14} />
                    </span>
                  </div>
                  <span className="text-sm flex-grow">{url}</span>
                  <div className="flex-shrink-0">
                    <Checkbox_Shadcn_ checked={isSelected} onChange={(e) => onClickUrl(e, url)} />
                  </div>
                </div>
              </ValueContainer>
            )
          })}
        </>
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
