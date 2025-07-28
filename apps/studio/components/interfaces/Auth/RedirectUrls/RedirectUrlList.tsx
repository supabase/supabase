import { PermissionAction } from '@supabase/shared-types/out/constants'
import { Globe, Trash } from 'lucide-react'

import { ButtonTooltip } from 'components/ui/ButtonTooltip'
import { EmptyListState } from 'components/ui/States'
import { useCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { Button, Checkbox_Shadcn_ } from 'ui'
import { ValueContainer } from './ValueContainer'

interface RedirectUrlListProps {
  allowList: string[]
  selectedUrls: string[]
  onSelectUrl: (urls: string[]) => void
  onSelectAddURL: () => void
  onSelectRemoveURLs: () => void
  onSelectClearSelection: () => void
}

export const RedirectUrlList = ({
  allowList,
  selectedUrls,
  onSelectUrl,
  onSelectAddURL,
  onSelectRemoveURLs,
  onSelectClearSelection,
}: RedirectUrlListProps) => {
  const canUpdateConfig = useCheckPermissions(PermissionAction.UPDATE, 'custom_config_gotrue')

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
      <ValueContainer className="py-3 flex items-center justify-end">
        {selectedUrls.length > 0 ? (
          <div className="flex items-center gap-x-2">
            <Button type="default" onClick={() => onSelectClearSelection()}>
              Clear selection
            </Button>
            <ButtonTooltip
              type="default"
              disabled={!canUpdateConfig}
              tooltip={{
                content: {
                  side: 'bottom',
                  text: !canUpdateConfig
                    ? 'You need additional permissions to remove redirect URLs'
                    : undefined,
                },
              }}
              icon={<Trash />}
              onClick={() => (selectedUrls.length > 0 ? onSelectRemoveURLs() : null)}
            >
              Remove ({selectedUrls.length})
            </ButtonTooltip>
          </div>
        ) : (
          <ButtonTooltip
            disabled={!canUpdateConfig}
            onClick={() => onSelectAddURL()}
            tooltip={{
              content: {
                side: 'bottom',
                text: !canUpdateConfig
                  ? 'You need additional permissions to update redirect URLs'
                  : undefined,
              },
            }}
          >
            Add URL
          </ButtonTooltip>
        )}
      </ValueContainer>
      {allowList.length > 0 ? (
        <>
          {allowList.map((url) => {
            const isSelected = selectedUrls.includes(url)
            return (
              <ValueContainer key={url} isSelected={isSelected} onClick={(e) => onClickUrl(e, url)}>
                <div className={`flex items-center gap-4 font-mono group w-full`}>
                  <div className="w-5 h-5 flex items-center justify-center">
                    <Checkbox_Shadcn_ checked={isSelected} onChange={(e) => onClickUrl(e, url)} />
                  </div>
                  <Globe strokeWidth={2} size={14} className="text-foreground-lighter" />
                  <span className="text-sm flex-grow">{url}</span>
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
      {allowList.length > 0 && (
        <ValueContainer className="py-3 flex items-center justify-between">
          <p className="pl-9 text-foreground-muted text-sm">Total URLs: {allowList.length}</p>
        </ValueContainer>
      )}
    </div>
  )
}
