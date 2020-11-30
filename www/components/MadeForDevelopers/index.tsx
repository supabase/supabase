import Badge from 'components/badge'
import SectionHeader from 'components/UI/SectionHeader'
import CodeExamples from 'components/MadeForDevelopers/CodeExamples'

const MadeForDevelopers = () => {
  return (
    <div className="py-16 bg-gray-50 dark:bg-dark-400 overflow-hidden lg:py-16">
      <div className="container mx-auto px-10 sm:px-16  xl:px-20">
        
      <SectionHeader className="text-center mx-auto" title={'Supafast easy-to-use APIs'} title_alt={' that do the hard work for you'} subtitle={'MADE FOR DEVELOPERS'} paragraph={'We inspect your database and provide APIs instantly so you can stop building repetitive CRUD endpoints and focus on your product.'} />

        <div className="relative grid grid-cols-12 gap-8 lg:items-center">

          <div className="mt-2 col-span-10 col-start-2">

            <CodeExamples />

            <div className="grid grid-cols-12 gap-2">
              <dl className="mt-12 grid-cols-12 grid lg:space-y-0 gap-12 col-start-1 col-span-12 md:col-span-12 md:col-start-1 lg:col-start-3 lg:col-span-8">
                <div className="col-span-12 lg:col-span-6 lg:border-r-2 lg:border-gray-200 pr-6 dark:border-dark-200">
                  <div className="lg:mt-5">
                    <dt className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
                      TypeScript support
                    </dt>
                    <dd className="mt-2 text-base text-gray-500 mb-6 dark:text-dark-100">
                      Type definitions for both server side and client side
                    </dd>
                    <button
                      type="button"
                      className="inline-flex items-center text-xs font-medium rounded transition text-brand-600 hover:text-brand-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500"
                    >
                      Explore more
                    </button>
                  </div>
                </div>
                <div className="col-span-12 lg:col-span-6">
                  <div className="lg:mt-5">
                    <dt className="text-lg leading-6 font-medium text-gray-900 dark:text-white flex">
                      Local emulator
                      <Badge>Coming Q1 2021</Badge>
                    </dt>
                    <dd className="mt-2 text-base text-gray-500 mb-6 dark:text-dark-100">
                      Develop locally and push to production when you're ready
                    </dd>
                    <button
                      type="button"
                      className="inline-flex items-center text-xs font-medium rounded transition text-brand-600 hover:text-brand-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500"
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
