import Button from 'components/Button'

const CTABanner = () => {
  return (
    <div className="py-32 grid grid-cols-12 gap-4 items-center text-center bg-dark-800 px-16">
      <div className="col-span-12">
        <h4 className="flex flex-col sm:flex-row sm:justify-center font-normal text-white text-2xl lg:text-3xl">
          <span className="block">Build in a weekend, scale to millions.</span>
        </h4>
        {/* <p className="font-normal mt-1 text-gray-500 dark:text-dark-100 lg:text-3xl">
					Build in a weekend, scale to millions.
				</p> */}
      </div>
      <div className="col-span-12">
        <Button text="Start your project" url="https://app.supabase.io/api/login" />
      </div>
    </div>
  )
}

export default CTABanner
