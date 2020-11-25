import Badge from './../badge'

import CodeExamples from './CodeExamples'

const MadeForDevelopers = () => {
  return (
    <div className="py-16 bg-gray-50 overflow-hidden lg:py-24">
      <div className="relative max-w-xl mx-auto px-4 sm:px-6 lg:px-8 lg:max-w-7xl">
        <div className="relative mt-12 lg:mt-24 lg:grid lg:grid-cols-12 lg:gap-8 lg:items-center">
          <div className="relative col-span-12 text-center">
            <small>MADE FOR DEVELOPERS</small>
            <h2 className="text-3xl leading-8 font-bold text-gray-900 sm:text-4xl">
              Supafast easy-to-use APIs that do the hard work for you
            </h2>
            <p className="mt-4 max-w-3xl mx-auto text-xl text-gray-500">
              We inspect your database and provide APIs instantly so you can stop building
              repetitive CRUD endpoints and focus on your product.
            </p>
          </div>
          <div className="mt-2 col-span-10 col-start-2">
            <CodeExamples />

            <div className="grid grid-cols-12 gap-2">

            <dl className="mt-12 space-y-10 lg:space-y-0 lg:grid lg:grid-cols-2 lg:gap-12 col-span-8 col-start-3">
              <div className="lg:border-r-2 lg:border-gray-200 pr-6">
                <div className="mt-5">
                  <dt className="text-lg leading-6 font-medium text-gray-900">
                    TypeScript support
                  </dt>
                  <dd className="mt-2 text-base text-gray-500 mb-6">
                    Type definitions for both server side and client side
                  </dd>
                  <button
                    type="button"
                    className="inline-flex items-center text-xs font-medium rounded text-gray-700 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500"
                  >
                    Explore more
                  </button>
                </div>
              </div>

              <div>
                <div className="mt-5">
                  <dt className="text-lg leading-6 font-medium text-gray-900 flex">
                    Local emulator
                    <Badge>Coming Q1 2021</Badge>
                  </dt>
                  <dd className="mt-2 text-base text-gray-500 mb-6">
                    Develop locally and push to production when you're ready
                  </dd>
                  <button
                    type="button"
                    className="inline-flex items-center text-xs font-medium rounded text-gray-700 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500"
                  >
                    Get notified
                  </button>
                </div>
              </div>
            </dl>

            </div>

          </div>
        </div>
      </div>
    </div>
  )
}

export default MadeForDevelopers
