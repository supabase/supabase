import Badge from './badge'

const Features = () => {
  return (
    // <!-- This example requires Tailwind CSS v2.0+ -->
    <div className="bg-gray-50 overflow-hidden py-12">
      <div className="relative max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-0">
        <div className="lg:col-span-1">
          <small>A better way to build products</small>
          <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">
            Build Faster and Focus on Your Core Products
          </h2>
        </div>
      </div>

      <div className="relative max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-0">
        <svg
          className="absolute top-0 left-full transform -translate-x-1/2 -translate-y-3/4 lg:left-auto lg:right-full lg:translate-x-2/3 lg:translate-y-1/4"
          width="404"
          height="784"
          fill="none"
          viewBox="0 0 404 784"
          aria-hidden="true"
        >
          <defs>
            <pattern
              id="8b1b5f72-e944-4457-af67-0c6d15a99f38"
              x="0"
              y="0"
              width="20"
              height="20"
              patternUnits="userSpaceOnUse"
            >
              <rect
                x="0"
                y="0"
                width="4"
                height="4"
                className="text-gray-200"
                fill="currentColor"
              />
            </pattern>
          </defs>
          <rect width="404" height="784" fill="url(#8b1b5f72-e944-4457-af67-0c6d15a99f38)" />
        </svg>

        <div className="relative lg:grid lg:grid-cols-12 lg:gap-x-8">
        <div className="relative lg:grid lg:grid-cols-2 lg:gap-x-8 lg:col-span-7">
          <dl className="mt-10 space-y-10 sm:space-y-0 sm:grid sm:grid-cols-2 sm:gap-x-8 sm:gap-y-10 lg:mt-0 lg:col-span-2">
            <div>
              <div className="flex items-center">
                <div className="flex items-center justify-center h-12 w-12 rounded-md bg-brand-600 text-white">
                  {/* <!-- Heroicon name: globe-alt --> */}
                  <svg
                    className="h-6 w-6"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"
                    />
                  </svg>
                </div>
                <dt className="ml-4 text-lg leading-6 font-medium text-gray-900">Database</dt>
              </div>
              <div className="mt-5">
                <dd className="mt-2 text-base text-gray-500">
                  Built on top of Postgres, an extremely scalable relational database, so you can
                  start building with the best tool in hand.
                </dd>
              </div>
            </div>

            <div>
              <div className="flex items-center">
                <div className="flex items-center justify-center h-12 w-12 rounded-md bg-brand-600 text-white">
                  {/* <!-- Heroicon name: scale --> */}
                  <svg
                    className="h-6 w-6"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3"
                    />
                  </svg>
                </div>
                <dt className="ml-3 text-lg leading-6 font-medium text-gray-900">Authentication</dt>
              </div>
              <div className="mt-5">
                <dd className="mt-2 text-base text-gray-500">
                  Manage your users easily, leverage on PostgreSQL’s Row Level Security, and even
                  write policies which fit your unique needs.
                </dd>
              </div>
            </div>

            <div>
              <div className="flex items-center">
                <div className="flex items-center justify-center h-12 w-12 rounded-md bg-brand-600 text-white">
                  {/* <!-- Heroicon name: lightning-bolt --> */}
                  <svg
                    className="h-6 w-6"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                  </svg>
                </div>
                <dt className="ml-3 text-lg leading-6 font-medium text-gray-900 flex">
                  Storage <Badge>Coming soon Q1 2021</Badge>
                </dt>
              </div>
              <div className="mt-5">
                <dd className="mt-2 text-base text-gray-500">
                  Store, organize, and serve any amount of assets from anywhere. Any media,
                  including videos of any size and format.
                </dd>
              </div>
            </div>

            <div>
              <div className="flex items-center">
                <div className="flex items-center justify-center h-12 w-12 rounded-md bg-brand-600 text-white">
                  {/* <!-- Heroicon name: mail --> */}
                  <svg
                    className="h-6 w-6"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <dt className="ml-3 text-lg leading-6 font-medium text-gray-900 flex">
                  Functions <Badge>Coming soon Q1 2021</Badge>
                </dt>
              </div>
              <div className="mt-5">
                <dd className="mt-2 text-base text-gray-500">
                  Trigger backend code automatically with database events, without ever worrying
                  about scaling a server.
                </dd>
              </div>
            </div>
          </dl>
        </div>
        <div className="lg:col-span-5">
        <div>
            <h2 className="text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">
              image here
            </h2>
          </div>
        </div>
      </div>
      </div>
    </div>
  )
}

export default Features
