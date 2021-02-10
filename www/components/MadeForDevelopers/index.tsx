// import Button from 'components/Button'
// import Badge from 'components/Badge'
import { Badge, Button, Typography } from '@supabase/ui'
import SectionHeader from 'components/UI/SectionHeader'
import CodeExamples from 'components/MadeForDevelopers/CodeExamples'

import DeveloperFeatures from 'data/DeveloperFeatures.json'

const MadeForDevelopers = () => {
  return (
    <div className="py-16 bg-gray-50 dark:bg-dark-600 overflow-hidden lg:py-16">
      <div className="container mx-auto px-8 sm:px-16 xl:px-20">
        <div className="mx-auto max-w-7xl">
          <div className="grid grid-cols-12">
            <div className="col-span-12 lg:col-span-12 xl:col-span-12">
              <SectionHeader
                title={'Instant APIs'}
                title_alt={' that do the hard work for you'}
                subtitle={'MADE FOR DEVELOPERS'}
                paragraph={`We introspect your database to provide APIs instantly. Stop building repetitive CRUD endpoints and focus on your product.`}
              />
            </div>
          </div>

          <div className="relative grid grid-cols-12 gap-1 sm:gap-8 lg:items-center">
            <div className="mt-2 col-span-12">
              <CodeExamples />

              <div className="grid grid-cols-12 gap-2">
                <dl className="mt-12 grid-cols-12 grid col-span-12 sm:gap-4 md:gap-8 lg:gap-8 lg:space-y-0">
                  {DeveloperFeatures.map((feature: any, idx: number) => {
                    const blockClass =
                      idx !== DeveloperFeatures.length - 1
                        ? 'col-span-12 mb-10 sm:mb-0 sm:col-span-3 md:col-span-6 mb-12 lg:col-span-3 sm:border-gray-200 sm:pr-4 md:pr-6 lg:border-r-2 dark:border-dark-500 even:rotate-45'
                        : 'col-span-12 sm:col-span-3'

                    return (
                      <div className={blockClass} key={`dev_feature_${idx}`}>
                        <div className="lg:mt-5">
                          <dt className="flex flex-row sm:flex-col xl:flex-row">
                            <Typography.Title level={4}>{feature.name}</Typography.Title>
                            {feature.badge && (
                              <div className="block xl:ml-3">
                                <Badge
                                  dot
                                  // className="ml-3 sm:ml-0 sm:w-20 sm:mt-2 xl:ml-3 xl:mt-0 xl:w-auto"
                                >
                                  {feature.badge}
                                </Badge>
                              </div>
                            )}
                          </dt>
                          <dd className="my-3">
                            <Typography.Text type="secondary">
                              {feature.description}
                            </Typography.Text>
                          </dd>

                          <Typography.Link href={feature.url}>
                            {feature.badge ? 'Get notified' : 'Explore more'}
                          </Typography.Link>
                        </div>
                      </div>
                    )
                  })}
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default MadeForDevelopers
