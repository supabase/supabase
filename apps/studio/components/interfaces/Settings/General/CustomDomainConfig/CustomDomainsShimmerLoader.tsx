const CustomDomainsShimmerLoader = () => {
  return (
    <div className="grid grid-cols-12 gap-6 px-8 py-8">
      <div className="col-span-12 lg:col-span-5">
        <div className="h-6 w-1/3 bg-foreground-lighter rounded shimmering-loader" />
      </div>

      <div className="col-span-12 lg:col-span-7">
        <div className="h-[38px] w-full bg-foreground-lighter rounded shimmering-loader" />
      </div>
    </div>
  )
}

export default CustomDomainsShimmerLoader
