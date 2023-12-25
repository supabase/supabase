import CardButton from 'components/ui/CardButton'

const ShimmeringCard = () => {
  return (
    <CardButton
      className="h-44 !px-0 pt-5 pb-0"
      title={
        <div className="w-full justify-between space-y-1.5 px-5">
          <p className="flex-shrink truncate text-sm pr-4 shimmering-loader h-5 w-20" />
          <p className="text-sm lowercase text-foreground-light h-4 w-40 shimmering-loader" />
        </div>
      }
    />
  )
}

export default ShimmeringCard
