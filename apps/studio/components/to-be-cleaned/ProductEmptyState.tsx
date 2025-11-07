import { ExternalLink } from 'lucide-react'
import { PropsWithChildren } from 'react'

import { ButtonTooltip } from 'components/ui/ButtonTooltip'
import Link from 'next/link'
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
  ctaUrl?: string
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
  ctaUrl,
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
                {ctaButtonLabel && !!ctaUrl ? (
                  <Button asChild type="primary">
                    <Link href={ctaUrl}>{ctaButtonLabel}</Link>
                  </Button>
                ) : ctaButtonLabel && !!onClickCta ? (
                  <ButtonTooltip
                    type="primary"
                    onClick={onClickCta}
                    loading={loading}
                    disabled={loading || disabled}
                    tooltip={{
                      content: {
                        side: 'bottom',
                        text: disabled && disabledMessage.length > 0 ? disabledMessage : undefined,
                      },
                    }}
                  >
                    {ctaButtonLabel}
                  </ButtonTooltip>
                ) : null}
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
