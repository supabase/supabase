import { Button } from 'ui'
import { useRouter } from 'next/router'

const Benchmark = () => {
  const { basePath } = useRouter()
  return (
    <div className="mx-auto mt-6 max-w-lg lg:mx-0 lg:mt-16 lg:max-w-none">
      <div className="bg-dark-800 grid grid-cols-1 items-center gap-4 overflow-auto rounded-md shadow-lg lg:grid-cols-12">
        <div className="col-span-1 flex flex-col items-center lg:col-span-10 lg:flex-row">
          <img
            className="mb-10 hidden w-full lg:mb-0 lg:mr-14 lg:block lg:h-44 lg:w-auto"
            src={`${basePath}/images/benchmark.svg`}
            alt="Benchmark illustration"
          />
          <img
            className="mb-10 w-full lg:mb-0 lg:mr-14 lg:hidden lg:h-44 lg:w-auto"
            src={`${basePath}/images/benchmark--mobile.svg`}
            alt="Benchmark illustration"
          />
          <div className="px-12 py-5 lg:px-0 lg:py-0">
            <h4>
              <span className="text-white">Built for speed and reliability</span>
            </h4>
            <p>
              <span className="block text-gray-300">
                Supabase outperforms equivalent systems by more than 300%.
              </span>
              <span className="block text-gray-300">
                Sign up for our public benchmark release and we'll send it to your inbox.
              </span>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Benchmark
