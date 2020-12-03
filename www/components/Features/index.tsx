import Badge from 'components/Badge'
import Button from 'components/Button'
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
          <dt className="flex flex-row xl:flex-col ml-4 text-lg leading-6 font-medium text-gray-900 dark:text-white">
            {name}
          </dt>
        </div>
        <div className="mt-5">
          <dd className="mt-2 text-base text-gray-500 dark:text-dark-100">{description}</dd>
        </div>
        {url && <Button className="mt-5" type="secondary" text="Learn more" url={url} />}
        {label && <Badge className="mt-5">{label}</Badge>}
      </div>
    )
  })

  return (
    <div className="bg-gray-50 dark:bg-dark-700 overflow-hidden py-12">
      <div className="container mx-auto px-8 sm:px-16 xl:px-20">
        <div className="mx-auto max-w-7xl">
          <SectionHeader
            title={'Build Faster'}
            title_alt={' and Focus on Your Products'}
            subtitle={'What you get with Supabase'}
          />
          <div className="mt-12 grid grid-cols-12 gap-8">
            <div className="relative pb-12 col-span-12">
              <div className="relative lg:grid lg:grid-cols-12 lg:gap-x-8">
                <div className="relative col-span-12 lg:grid lg:grid-cols-2 lg:gap-x-8">
                  <dl className="space-y-10 sm:space-y-0 sm:grid sm:grid-cols-2 sm:gap-x-8 sm:gap-y-10 lg:gap-x-4 lg:mt-0 lg:col-span-2 xl:grid-cols-4 xl:gap-x-12">
                    {IconSections}
                  </dl>
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
