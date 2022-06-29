import { Button, Typography } from '@supabase/ui'
import { FC, ReactNode } from 'react'

interface Props {
  title?: string
  children?: ReactNode
  ctaButtonLabel?: string
  infoButtonLabel?: string
  infoButtonUrl?: string
  onClickCta?: () => void
}

const ProductEmptyState: FC<Props> = ({
  title = '',
  children,
  ctaButtonLabel = '',
  infoButtonLabel = '',
  infoButtonUrl = '',
  onClickCta = () => {},
}) => (
  <div className="flex items-center justify-center w-full h-full">
    <div className="flex space-x-4 p-6 rounded border border-panel-border-light dark:border-panel-border-dark bg-panel-body-light dark:bg-panel-body-dark shadow-md">
      {/* A graphic can probably be placed here as a sibling to the div below*/}
      <div className="flex flex-col">
        <div className="w-80 space-y-4">
          <Typography.Title level={5}>{title}</Typography.Title>
          <div className="flex flex-col space-y-2">{children}</div>
          <div className="flex items-center space-x-2">
            <Button type="primary" onClick={onClickCta}>
              {ctaButtonLabel}
            </Button>
            {infoButtonUrl && infoButtonLabel ? (
              <Button type="default">
                <a target="_blank" href={infoButtonUrl}>
                  {infoButtonLabel}
                </a>
              </Button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  </div>
)

export default ProductEmptyState
