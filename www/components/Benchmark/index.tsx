import Button from 'components/button'

const Benchmark = () => {
  return (
    <div className="bg-white dark:bg-dark-200 py-16 px-4 sm:px-6 lg:px-8">
      <div className="container mx-auto px-20">
        <div className="bg-white grid grid-cols-12 gap-4 items-center shadow-lg rounded-md">
          <div className="w-full h-full col-span-2 bg-gray-700 rounded-l-md flex items-center justify-center">
            <img className="w-3/4" src="images/benchmark.svg" />
          </div>
          <div className="col-span-6 py-6 ml-4">
            <p className="text-xl">Record breaking speed and reliability</p>
            <p className="text-gray-400 mt-2">
              <span className="block">Supabase is already enterprise level and we’re blown away by the speed!</span>
              <span className="block">Sign up for our public benchmark release and we’ll email it to you</span>
            </p>
          </div>
          <div className="col-span-2" />
          <div className="col-span-2 rounded-r-md">
            <Button text="Get notified" url="#"/>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Benchmark