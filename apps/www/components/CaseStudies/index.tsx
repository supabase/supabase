import SectionHeader from 'components/UI/SectionHeader'
import CaseStudiesData from 'data/CaseStudies.json'
import { useRouter } from 'next/router'
import BlogGridItem from '../Blog/BlogGridItem'
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
      <div className="mx-auto mt-5 grid max-w-lg gap-8 lg:max-w-none lg:grid-cols-3 lg:gap-12">
        {CaseStudiesData.map((caseStudy, idx: number) => (
          <BlogGridItem
            key={idx}
            post={{
              type: 'casestudy',
              title: caseStudy.title,
              description: caseStudy.description,
              thumb: `${basePath}/${caseStudy.imgUrl}`,
              hideAuthor: true,
              url: caseStudy.url.replace('/blog/', ''),
              path: caseStudy.path,
            }}
          />
        ))}
      </div>
    </SectionContainer>
  )
}

export default CaseStudies
