import SectionHeader from 'components/UI/SectionHeader'
import PostTypes from '~/types/post'
import SectionContainer from '../Layouts/SectionContainer'
import Link from 'next/link'
import { GlassPanel } from 'ui'
import TextLink from '../TextLink'

const CustomerStories = ({ customerStories }: any) => {
  const caseStudyThumbs = customerStories.map((blog: PostTypes, idx: number) => {
    return {
      logo: blog.logo_inverse,
      title: blog.title,
      link: blog.url,
    }
  })

  return (
    <SectionContainer>
      <div className="mb-12">
        <SectionHeader
          title={'Infrastructure'}
          title_alt={' to innovate and scale with ease.'}
          subtitle={'Customer Stories'}
          paragraph={
            'See how Supabase empowers companies of all sizes to accelerate their growth and streamline their work.'
          }
        />
      </div>
      <div className="mx-auto mt-5 grid grid-cols-12 gap-8 lg:gap-12">
        {caseStudyThumbs.map((caseStudy: any, i: number) => (
          <Link
            href={`${caseStudy.link}`}
            key={caseStudy.title}
            className="col-span-12 md:col-span-4"
          >
            <GlassPanel
              {...caseStudy}
              background={true}
              showIconBg={true}
              showLink={true}
              hasLightIcon
            >
              {caseStudy.description}
            </GlassPanel>
          </Link>
        ))}
      </div>
      <div className="mt-12">
        <TextLink url="/customers" label="Explore more" />
      </div>
    </SectionContainer>
  )
}

export default CustomerStories
