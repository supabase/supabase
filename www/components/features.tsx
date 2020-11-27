import Badge from './badge'
import Solutions from './../data/Solutions.json'
import SectionHeader from './UI/SectionHeader'

const Features = () => {
  const IconSections = Object.values(Solutions).map((solution) => {
    const { name, description, icon, label, url } = solution

    return (
      <div key={name}>
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
        {url && (
          <div className="mt-5">
            <dd className="mt-2 text-sm text-brand-600 underline">Learn more link</dd>
          </div>
        )}
      </div>
    )
  })

  return (
    // <!-- This example requires Tailwind CSS v2.0+ -->
    <div className="bg-gray-50 overflow-hidden py-12 sm:px-6 lg:px-16">
      <div className="mx-auto max-w-7xl">
        <SectionHeader
          title={'Build Faster'}
          title_alt={' and Focus on Your Core Products'}
          subtitle={'A better way to build products'}
        />
        <div className="mt-16 grid grid-cols-12 gap-8">
          <div className="relative pb-12 col-span-12">
            <div className="relative lg:grid lg:grid-cols-12 lg:gap-x-8">
              <div className="relative lg:grid lg:grid-cols-2 lg:gap-x-8 lg:col-span-7">
                <dl className="space-y-10 sm:space-y-0 sm:grid sm:grid-cols-2 sm:gap-x-8 sm:gap-y-10 lg:mt-0 lg:col-span-2">
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
      </div>
    </div>
  )
}

export default Features
