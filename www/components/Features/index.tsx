import Badge from 'components/badge'
import SectionHeader from 'components/UI/SectionHeader'
import Solutions from 'data/Solutions.json'

const Features = () => {
  const IconSections = Object.values(Solutions).map((solution: any) => {
    const { name, description, icon, label, url } = solution
    return (
      <div key={name}>
        <div className="flex items-center">
          <div className="flex items-center justify-center h-12 w-12 rounded-md bg-gray-900 text-white dark:bg-white">
            <svg
              className="h-6 w-6 stroke-white dark:stroke-black"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={icon} />
            </svg>
          </div>
          <dt className="ml-4 text-lg leading-6 font-medium text-gray-900 dark:text-white">
            {name} {label && <Badge>{label}</Badge>}
          </dt>
        </div>
        <div className="mt-5">
          <dd className="mt-2 text-base text-gray-500 dark:text-gray-400">{description}</dd>
        </div>
        {url && (
          <div className="mt-5">
            <a href="#" className="mt-2 text-sm text-brand-600 hover:underline">Learn more link</a>
          </div>
        )}
      </div>
    )
  })

  return (
    <div className="bg-gray-50 dark:bg-dark-300 overflow-hidden py-12">
      <div className="container mx-auto sm:px-16 xl:px-20">
        <div className="mx-auto max-w-7xl">
          <SectionHeader
            title={'Build Faster'}
            title_alt={' and Focus on Your Core Products'}
            subtitle={'A better way to build products'}
          />
          <div className="mt-12 grid grid-cols-12 gap-8">
            <div className="relative pb-12 col-span-12">
              <div className="relative lg:grid lg:grid-cols-12 lg:gap-x-8">
                <div className="relative lg:grid lg:grid-cols-2 lg:gap-x-8 lg:col-span-7">
                  <dl className="space-y-10 sm:space-y-0 sm:grid sm:grid-cols-2 sm:gap-x-8 sm:gap-y-10 lg:mt-0 lg:col-span-2">
                    {IconSections}
                  </dl>
                </div>
                <div className="lg:col-span-5 flex justify-end">
                  {/* <img src="images/features.png" /> */}
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
