import SectionHeader from 'components/UI/SectionHeader'
import CaseStudiesData from 'data/CaseStudies.json'
import { useRouter } from 'next/router'
import BlogListItem from '../Blog/BlogListItem'
import SectionContainer from '../Layouts/SectionContainer'

const CaseStudies = () => {
  const { basePath } = useRouter()

  return (
    <SectionContainer>
      <div>
        <SectionHeader
          className="mb-12"
          title={'Scale up'}
          title_alt={' with no extra effort'}
          subtitle={'Enterprise Solutions'}
          paragraph={
            "Supabase is built with proven, enterprise-ready tools.\n We're supporting everything from fintech providers to social networks. "
          }
        />
      </div>
      <div className="grid max-w-lg gap-8 mx-auto mt-5 lg:gap-12 lg:grid-cols-3 lg:max-w-none">
        {CaseStudiesData.map((caseStudy, idx: number) => (
          <BlogListItem
            key={idx}
            post={{
              type: 'casestudy',
              title: caseStudy.title,
              description: caseStudy.description,
              thumb: `${basePath}/${caseStudy.imgUrl}`,
              hideAuthor: true,
              url: caseStudy.url.replace('/blog/', ''),
            }}
          />
        ))}
      </div>
    </SectionContainer>
  )
}

export default CaseStudies
