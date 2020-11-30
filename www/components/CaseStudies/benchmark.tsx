import Button from 'components/button'

const Benchmark = () => {
  return (
    <div className="mt-6">
      <div className="bg-white dark:bg-dark-200 grid grid-cols-12 gap-4 items-center shadow-lg rounded-md">
        {/* <div className="w-full h-full col-span-2 bg-dark-200 rounded-l-md flex items-center justify-center">
          <div className="bg-cover bg-center w-full h-full" style={{ backgroundImage: "url('images/benchmark.svg')"}} />
        </div> */}
        <div className="col-span-10 flex items-center">
          <img className="h-44 mr-14" src="images/benchmark.svg" />
          <div className="py-0">
            <p className="text-xl dark:text-white">Record breaking speed and reliability</p>
            <p className="text-gray-400 dark:text-dark-100 mt-2">
              <span className="block">Supabase is already enterprise level and we’re blown away by the speed!</span>
              <span className="block">Sign up for our public benchmark release and we’ll email it to you</span>
            </p>
          </div>
        </div>
        <div className="col-span-2 rounded-r-md">
          <Button text="Get notified" url="#"/>
        </div>
      </div>
    </div>
  )
}

export default Benchmark