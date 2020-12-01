import Button from 'components/Button'
import Badge from 'components/Badge'
import SectionHeader from 'components/UI/SectionHeader'
import CodeExamples from 'components/MadeForDevelopers/CodeExamples'

const MadeForDevelopers = () => {
  return (
    <div className="py-16 bg-gray-50 dark:bg-dark-400 overflow-hidden lg:py-16">
      <div className="container mx-auto px-8 sm:px-16  xl:px-20">
        
        <div className="grid grid-cols-12">
          <div className="col-span-12 lg:col-span-9 xl:col-span-7">
            <SectionHeader              
              title={'Supafast easy-to-use APIs'}
              title_alt={' that do the hard work for you'}
              subtitle={'MADE FOR DEVELOPERS'}
              paragraph={'We inspect your database and provide APIs instantly so you can stop building repetitive CRUD endpoints and focus on your product.'}
            />
          </div>
        </div>

        <div className="relative grid grid-cols-12 gap-1 sm:gap-8 lg:items-center">

          <div className="mt-2 col-span-12">

            <CodeExamples />

            <div className="grid grid-cols-12 gap-2">
              <dl className="mt-12 grid-cols-12 grid col-span-12 sm:gap-4 md:col-span-12 lg:gap-8 lg:space-y-0 lg:col-span-10 xl:col-span-8">
                <div className="col-span-12 mb-10 sm:mb-0 sm:col-span-6 sm:border-r-2 sm:border-gray-200 sm:pr-4 md:pr-6 dark:border-dark-200">
                  <div className="lg:mt-5">
                    <dt className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
                      TypeScript support
                    </dt>
                    <dd className="mt-3 text-base text-gray-500 mb-6 dark:text-dark-100">
                      Type definitions for both server side and client side
                    </dd>
                    <Button type="secondary" text="Explore more" url="#" />
                  </div>
                </div>
                <div className="col-span-12 sm:col-span-6">
                  <div className="lg:mt-5">
                    <dt className="text-lg leading-6 font-medium text-gray-900 dark:text-white flex">
                      Local emulator
                      <Badge>Q1 2021</Badge>
                    </dt>
                    <dd className="mt-3 text-base text-gray-500 mb-6 dark:text-dark-100">
                      Develop locally and push to production when you're ready
                    </dd>
                    <Button type="secondary" text="Get notified" url="#" />
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
