import { Badge } from 'ui'
import APISection from '../Sections/APISection'
import SectionContainer from '../Layouts/SectionContainer'
import FeatureColumn from '../FeatureColumn'

import CodeExamples from 'data/home/api-examples'
import DeveloperFeatures from 'data/DeveloperFeatures.json'
import TextLink from '../TextLink'

const MadeForDevelopers = () => {
  return (
    <SectionContainer>
      <APISection
        autoHeight={true}
        size="large"
        title={'Instant APIs that do the hard work for you'}
        text={[
          <p className="lg:text-lg" key={'madefordeveloper-para-1'}>
            We introspect your database to provide APIs instantly. Stop building repetitive CRUD
            endpoints and focus on your product.
          </p>,
        ]}
        // @ts-ignore
        content={CodeExamples}
        footer={[
          <dl className="grid grid-cols-12 gap-y-4 md:gap-8" key={'madefordeveloper-footer'}>
            {DeveloperFeatures.map((feature: any, i: number) => {
              return (
                <div className="col-span-12 md:col-span-6 lg:col-span-6" key={i}>
                  <div className="lg:mt-5">
                    <dt>
                      <FeatureColumn title={feature.name} text={feature.description} />
                      {feature.badge && (
                        <div className="mb-4 block">
                          <Badge dot>{feature.badge}</Badge>
                        </div>
                      )}
                      {feature.badge ? (
                        <TextLink url={feature.url} label="Get notified" />
                      ) : (
                        <TextLink url={feature.url} label="Explore more" />
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
