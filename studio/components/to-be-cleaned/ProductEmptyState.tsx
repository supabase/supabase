import { Button } from '@supabase/ui'
import { FC, ReactNode } from 'react'
import * as Tooltip from '@radix-ui/react-tooltip'

interface Props {
  title?: string
  children?: ReactNode
  ctaButtonLabel?: string
  infoButtonLabel?: string
  infoButtonUrl?: string
  onClickCta?: () => void
  disabled?: boolean
  disabledMessage?: string
}

const ProductEmptyState: FC<Props> = ({
  title = '',
  children,
  ctaButtonLabel = '',
  infoButtonLabel = '',
  infoButtonUrl = '',
  onClickCta = () => {},
  disabled = false,
  disabledMessage = '',
}) => {
  const hasAction = (ctaButtonLabel && onClickCta) || (infoButtonUrl && infoButtonLabel)

  return (
    <div className="flex items-center justify-center w-full h-full">
      <div className="flex space-x-4 p-6 rounded border border-panel-border-light dark:border-panel-border-dark bg-panel-body-light dark:bg-panel-body-dark shadow-md">
        {/* A graphic can probably be placed here as a sibling to the div below*/}
        <div className="flex flex-col">
          <div className="w-80 space-y-4">
            <h5>{title}</h5>
            <div className="flex flex-col space-y-2">{children}</div>
            {hasAction && (
              <div className="flex items-center space-x-2">
                {ctaButtonLabel && onClickCta && (
                  <Tooltip.Root delayDuration={0}>
                    <Tooltip.Trigger>
                      <Button type="primary" onClick={onClickCta} disabled={disabled}>
                        {ctaButtonLabel}
                      </Button>
                    </Tooltip.Trigger>
                    {disabled && disabledMessage.length > 0 && (
                      <Tooltip.Content side="bottom">
                        <Tooltip.Arrow className="radix-tooltip-arrow" />
                        <div
                          className={[
                            'bg-scale-100 rounded py-1 px-2 leading-none shadow',
                            'border-scale-200 border',
                          ].join(' ')}
                        >
                          <span className="text-scale-1200 text-xs">{disabledMessage}</span>
                        </div>
                      </Tooltip.Content>
                    )}
                  </Tooltip.Root>
                )}
                {infoButtonUrl && infoButtonLabel ? (
                  <Button type="default">
                    <a target="_blank" href={infoButtonUrl}>
                      {infoButtonLabel}
                    </a>
                  </Button>
                ) : null}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProductEmptyState
