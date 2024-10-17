import * as Tooltip from '@radix-ui/react-tooltip'
import { ExternalLink } from 'lucide-react'
import { PropsWithChildren } from 'react'
import { Button } from 'ui'

interface ProductEmptyStateProps {
  title?: string
  size?: 'medium' | 'large'
  ctaButtonLabel?: string
  infoButtonLabel?: string
  infoButtonUrl?: string
  onClickCta?: () => void
  loading?: boolean
  disabled?: boolean
  disabledMessage?: string
}

const ProductEmptyState = ({
  title = '',
  size = 'medium',
  children,
  ctaButtonLabel = '',
  infoButtonLabel = '',
  infoButtonUrl = '',
  onClickCta = () => {},
  loading = false,
  disabled = false,
  disabledMessage = '',
}: PropsWithChildren<ProductEmptyStateProps>) => {
  const hasAction = (ctaButtonLabel && onClickCta) || (infoButtonUrl && infoButtonLabel)

  return (
    <div className="flex h-full w-full items-center justify-center">
      <div className="flex space-x-4 rounded border bg-surface-100 p-6 shadow-md">
        {/* A graphic can probably be placed here as a sibling to the div below*/}
        <div className="flex flex-col">
          <div className={`${size === 'medium' ? 'w-80' : 'w-[400px]'} space-y-4`}>
            <h5 className="text-foreground">{title}</h5>
            <div className="flex flex-col space-y-2 text-foreground-light">{children}</div>
            {hasAction && (
              <div className="flex items-center space-x-2">
                {ctaButtonLabel && onClickCta && (
                  <Tooltip.Root delayDuration={0}>
                    <Tooltip.Trigger asChild>
                      <Button
                        type="primary"
                        onClick={onClickCta}
                        loading={loading}
                        disabled={loading || disabled}
                      >
                        {ctaButtonLabel}
                      </Button>
                    </Tooltip.Trigger>
                    {disabled && disabledMessage.length > 0 && (
                      <Tooltip.Portal>
                        <Tooltip.Content side="bottom">
                          <Tooltip.Arrow className="radix-tooltip-arrow" />
                          <div
                            className={[
                              'rounded bg-alternative py-1 px-2 leading-none shadow',
                              'border border-background',
                            ].join(' ')}
                          >
                            <span className="text-xs text-foreground">{disabledMessage}</span>
                          </div>
                        </Tooltip.Content>
                      </Tooltip.Portal>
                    )}
                  </Tooltip.Root>
                )}
                {infoButtonUrl && infoButtonLabel ? (
                  <Button type="default" icon={<ExternalLink strokeWidth={1.5} />}>
                    <a target="_blank" rel="noreferrer" href={infoButtonUrl}>
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
