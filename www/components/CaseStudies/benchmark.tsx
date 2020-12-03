import Button from 'components/Button'
import { useRouter } from 'next/router'

const Benchmark = () => {
  const { basePath } = useRouter()
  return (
    <div className="mt-6 lg:mt-16 max-w-lg mx-auto lg:max-w-none lg:mx-0">
      <div className="grid gap-4 items-center rounded-md grid-cols-1 lg:grid-cols-12 overflow-auto bg-dark-800 shadow-lg">
        <div className="col-span-1 lg:col-span-10 flex items-center flex-col lg:flex-row">
          <img
            className="mb-10 w-full lg:w-auto lg:mb-0 lg:h-44 lg:mr-14 hidden lg:block"
            src={`${basePath}/images/benchmark.svg`}
          />
          <img
            className="mb-10 w-full lg:w-auto lg:mb-0 lg:h-44 lg:mr-14 lg:hidden"
            src={`${basePath}/images/benchmark--mobile.svg`}
          />
          <div className="px-12 py-5 lg:px-0 lg:py-0">
            <p className="text-xl text-white">Record breaking speed and reliability</p>
            <p className="text-dark-300 mt-2">
              <span className="block">
                Supabase is already enterprise level and we’re blown away by the speed!
              </span>
              <span className="block">
                Sign up for our public benchmark release and we’ll email it to you
              </span>
            </p>
          </div>
        </div>
        <div className="pb-12 px-12 col-span-1 lg:pb-0 lg:px-0 lg:col-span-2 rounded-r-md">
          <Button text="Get notified" url="https://mailchi.mp/supabase/enterprise-benchmarks" />
        </div>
      </div>
    </div>
  )
}

export default Benchmark
