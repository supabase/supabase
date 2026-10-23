import { ShimmeringLoader } from 'ui-patterns/ShimmeringLoader'

export const CustomDomainsShimmerLoader = () => {
  return (
    <div className="grid grid-cols-12 gap-6 px-8 py-8">
      <div className="col-span-12 lg:col-span-5">
        <ShimmeringLoader className="h-6 w-1/3 py-0" />
      </div>

      <div className="col-span-12 lg:col-span-7">
        <ShimmeringLoader className="h-[38px] w-full py-0" />
      </div>
    </div>
  )
}
