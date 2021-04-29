import { Button, Typography } from '@supabase/ui'
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
            alt="Benchmark illustration"
          />
          <img
            className="mb-10 w-full lg:w-auto lg:mb-0 lg:h-44 lg:mr-14 lg:hidden"
            src={`${basePath}/images/benchmark--mobile.svg`}
            alt="Benchmark illustration"
          />
          <div className="px-12 py-5 lg:px-0 lg:py-0">
            <Typography.Title level={4}>
              <span className="text-white">Built for speed and reliability</span>
            </Typography.Title>
            <Typography.Text type="secondary">
              <span className="block text-gray-300">
                Supabase outperforms equivalent systems by more than 300%.
              </span>
              <span className="block text-gray-300">
                Sign up for our public benchmark release and we'll send it to your inbox.
              </span>
            </Typography.Text>
          </div>
        </div>
        <div className="pb-12 px-12 col-span-1 lg:pb-0 lg:px-0 lg:col-span-2 rounded-r-md">
          <a href="https://supabasesubscribe.vercel.app/subscription/enterpriseBenchmarks">
            <Button>Get notified</Button>
          </a>
        </div>
      </div>
    </div>
  )
}

export default Benchmark
