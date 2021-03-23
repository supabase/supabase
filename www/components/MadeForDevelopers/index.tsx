// import Button from 'components/Button'
// import Badge from 'components/Badge'
import {
  Badge,
  Button,
  IconAlignJustify,
  IconArrowUpRight,
  IconCode,
  IconMail,
  IconTerminal,
  IconType,
  Typography,
} from '@supabase/ui'
import SectionHeader from 'components/UI/SectionHeader'
// import CodeExamples from 'components/MadeForDevelopers/CodeExamples'

import CodeExamples from 'data/home/api-examples'

import DeveloperFeatures from 'data/DeveloperFeatures.json'
import APISection from '../Sections/APISection'
import SectionContainer from '../Layouts/SectionContainer'
import FeatureColumn from '../FeatureColumn'

const MadeForDevelopers = () => {
  return (
    <SectionContainer className="pb-0">
      <APISection
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
        content={CodeExamples}
        size="small"
        footer={[
          // <div className="grid grid-cols-12 gap-8 lg:gap-16">
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
                        <Button href={feature.url} type="default" icon={<IconMail />}>
                          {'Get notified'}
                        </Button>
                      ) : (
                        <Button href={feature.url} type="default" icon={<IconArrowUpRight />}>
                          {'Explore more'}
                        </Button>
                      )}
                    </dt>
                  </div>
                </div>
              )
            })}
          </dl>,
          // </div>,
        ]}
      />
    </SectionContainer>
  )
}

export default MadeForDevelopers
