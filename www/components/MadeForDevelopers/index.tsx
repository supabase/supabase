import Badge from 'components/badge'
import SectionHeader from 'components/UI/SectionHeader'
import CodeExamples from 'components/MadeForDevelopers/CodeExamples'

const MadeForDevelopers = () => {
  return (
    <div className="py-16 bg-gray-50 dark:bg-dark-300 overflow-hidden lg:py-16">
      <div className="container mx-auto sm:px-16  xl:px-20">

      <SectionHeader className="text-center sm:w-3/4 xl:w-2/3 mx-auto" title={'Supafast easy-to-use APIs'} title_alt={' that do the hard work for you'} subtitle={'MADE FOR DEVELOPERS'} paragraph={'We inspect your database and provide APIs instantly so you can stop building repetitive CRUD endpoints and focus on your product.'} />

        <div className="relative lg:grid lg:grid-cols-12 lg:gap-8 lg:items-center">

          <div className="mt-2 col-span-10 col-start-2">
            <CodeExamples />

            <div className="grid grid-cols-12 gap-2">
              <dl className="mt-12 space-y-10 lg:space-y-0 lg:grid lg:grid-cols-2 lg:gap-12 col-span-8 col-start-3">
                <div className="lg:border-r-2 lg:border-gray-200 pr-6">
                  <div className="mt-5">
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
                <div>
                  <div className="mt-5">
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
