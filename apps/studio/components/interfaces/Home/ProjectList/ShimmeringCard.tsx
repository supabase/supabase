import { ShimmeringLoader } from 'ui-patterns/ShimmeringLoader'

import CardButton from '@/components/ui/CardButton'

export const ShimmeringCard = () => {
  return (
    <CardButton
      className="h-44 px-0! pt-5 pb-0"
      title={
        <div className="w-full justify-between space-y-1.5 px-5">
          <ShimmeringLoader className="h-5 w-20 py-0" />
          <ShimmeringLoader className="h-4 w-40 py-0" />
        </div>
      }
    />
  )
}
