import { FeatureBanner } from 'components/ui/FeatureBanner'
import { Import } from 'lucide-react'
import { Button } from 'ui'

export const StartUsingJwtSigningKeysBanner = ({
  onClick,
  isLoading,
}: {
  onClick: () => void
  isLoading: boolean
}) => {
  return (
    <FeatureBanner bgAlt>
      <div className="flex flex-col gap-0 z-[2]">
        <p className="text-sm text-foreground">Start using JWT signing keys</p>
        <p className="text-sm text-foreground-lighter lg:max-w-sm 2xl:max-w-none">
          Right now your project is using the legacy JWT secret. To start taking advantage of the
          new JWT signing keys, migrate your project's secret to the new set up.
        </p>
        <div className="mt-4">
          <Button type="primary" icon={<Import />} onClick={onClick} loading={isLoading}>
            Migrate JWT secret
          </Button>
        </div>
      </div>
    </FeatureBanner>
  )
}
