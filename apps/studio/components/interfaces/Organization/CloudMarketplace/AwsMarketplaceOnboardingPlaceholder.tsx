import { Skeleton } from '@ui/components/shadcn/ui/skeleton'
import {
  ScaffoldSection,
  ScaffoldSectionContent,
  ScaffoldSectionDetail,
} from 'components/layouts/Scaffold'

const AwsMarketplaceOnboardingPlaceholder = () => {
  return (
    <ScaffoldSection>
      <ScaffoldSectionDetail>
        {Array(1)
          .fill(0)
          .map((_, i) => (
            <Skeleton key={i} className="w-full h-[110px] rounded-md" />
          ))}
      </ScaffoldSectionDetail>
      <ScaffoldSectionContent className="lg:ml-10">
        {Array(3)
          .fill(0)
          .map((_, i) => (
            <Skeleton key={i} className="w-full h-[110px] rounded-md" />
          ))}
      </ScaffoldSectionContent>
    </ScaffoldSection>
  )
}

export default AwsMarketplaceOnboardingPlaceholder
