import Badge from './badge'
import Solutions from './../data/Solutions.json'

const Features = () => {
  const IconSections = Object.values(Solutions).map((solution) => {
    const { name, description, description_short, icon, label, url } = solution

    return (
      <div>
        <div className="flex items-center">
          <div className="flex items-center justify-center h-12 w-12 rounded-md bg-gray-900 text-white">
            {/* <!-- Heroicon name: globe-alt --> */}
            <svg
              className="h-6 w-6"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={icon} />
            </svg>
          </div>
          <dt className="ml-4 text-lg leading-6 font-medium text-gray-900">
            {name} {label && <Badge>{label}</Badge>}
          </dt>
        </div>
        <div className="mt-5">
          <dd className="mt-2 text-base text-gray-500">{description}</dd>
        </div>
        <div className="mt-5">
          <dd className="mt-2 text-base text-gray-600 underline">Learn more link</dd>
        </div>
      </div>
    )
  })

  return (
    // <!-- This example requires Tailwind CSS v2.0+ -->
    <div className="bg-gray-50 overflow-hidden py-12">
      <div className="relative max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-0">
        <div className="lg:col-span-1">
          <small>A better way to build products</small>
          <h2 className="text-3xl text-gray-900 sm:text-4xl">
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
              {IconSections}
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
