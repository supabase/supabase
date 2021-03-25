import { Badge, Button, IconArrowUpRight, IconMail } from '@supabase/ui'
import APISection from '../Sections/APISection'
import SectionContainer from '../Layouts/SectionContainer'
import FeatureColumn from '../FeatureColumn'

import CodeExamples from 'data/home/api-examples'
import DeveloperFeatures from 'data/DeveloperFeatures.json'
import Link from 'next/link'

const MadeForDevelopers = () => {
  return (
    <SectionContainer className="pb-0">
      <APISection
        autoHeight={true}
        size="large"
        title={[
          <span>
            Instant APIs
            <br /> that do the hard work for you
          </span>,
        ]}
        text={[
          <p className="text-lg">
            We introspect your database to provide APIs instantly. Stop building repetitive CRUD
            endpoints and focus on your product.
          </p>,
        ]}
        // @ts-ignore
        content={CodeExamples}
        footer={[
          <dl className="grid grid-cols-12 gap-8">
            {DeveloperFeatures.map((feature: any, idx: number) => {
              return (
                <div className={'col-span-6 lg:col-span-6'} key={`dev_feature_${idx}`}>
                  <div className="lg:mt-5">
                    <dt>
                      <FeatureColumn title={feature.name} text={feature.description} />
                      {feature.badge && (
                        <div className="block mb-4">
                          <Badge dot color="blue">
                            {feature.badge}
                          </Badge>
                        </div>
                      )}
                      {feature.badge ? (
                        <Link href={feature.url} as={feature.url}>
                          <a>
                            <Button type="default" icon={<IconMail />}>
                              {'Get notified'}
                            </Button>
                          </a>
                        </Link>
                      ) : (
                        <Link href={feature.url} as={feature.url}>
                          <a>
                            <Button type="default" icon={<IconArrowUpRight />}>
                              {'Explore more'}
                            </Button>
                          </a>
                        </Link>
                      )}
                    </dt>
                  </div>
                </div>
              )
            })}
          </dl>,
        ]}
      />
    </SectionContainer>
  )
}

export default MadeForDevelopers
