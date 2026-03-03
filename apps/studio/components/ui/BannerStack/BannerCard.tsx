import { X } from 'lucide-react'
import { Button, Card, CardContent, cn } from 'ui'
import { BASE_PATH } from 'lib/constants'

interface BannerCardProps {
  onDismiss?: () => void
  children: React.ReactNode
  className?: string
}

export const BannerCard = ({ onDismiss, children, className }: BannerCardProps) => {
  return (
    <Card className={cn('relative overflow-hidden shadow-lg rounded-2xl', className)}>
      <div className="absolute -inset-16 z-0 opacity-100 pointer-events-none">
        <img
          src={`${BASE_PATH}/img/reports/bg-grafana-dark.svg`}
          alt="Background pattern"
          className="w-full h-full object-cover object-right hidden dark:block"
        />
        <img
          src={`${BASE_PATH}/img/reports/bg-grafana-light.svg`}
          alt="Background pattern"
          className="w-full h-full object-cover object-right dark:hidden"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-background-alternative to-transparent" />
      </div>

      <CardContent className="relative z-10 p-6">
        {onDismiss && (
          <div className="absolute top-4 right-4 z-20">
            <Button
              type="text"
              size="tiny"
              htmlType="button"
              icon={<X size={16} strokeWidth={1.5} />}
              onClick={(e) => {
                e.preventDefault()
                onDismiss()
              }}
              className="opacity-75 hover:opacity-100 px-1"
              aria-label="Close banner"
            />
          </div>
        )}
        {children}
      </CardContent>
    </Card>
  )
}
