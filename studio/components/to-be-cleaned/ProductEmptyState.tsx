import { Button, IconExternalLink } from 'ui'
import { FC, ReactNode } from 'react'
import * as Tooltip from '@radix-ui/react-tooltip'

interface Props {
  title?: string
  size?: 'medium' | 'large'
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
  size = 'medium',
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
    <div className="flex h-full w-full items-center justify-center">
      <div className="flex space-x-4 rounded border border-panel-border-light bg-panel-body-light p-6 shadow-md dark:border-panel-border-dark dark:bg-panel-body-dark">
        {/* A graphic can probably be placed here as a sibling to the div below*/}
        <div className="flex flex-col">
          <div className={`${size === 'medium' ? 'w-80' : 'w-[400px]'} space-y-4`}>
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
                            'rounded bg-scale-100 py-1 px-2 leading-none shadow',
                            'border border-scale-200',
                          ].join(' ')}
                        >
                          <span className="text-xs text-scale-1200">{disabledMessage}</span>
                        </div>
                      </Tooltip.Content>
                    )}
                  </Tooltip.Root>
                )}
                {infoButtonUrl && infoButtonLabel ? (
                  <Button type="default" icon={<IconExternalLink size={14} strokeWidth={1.5} />}>
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
