import { useRouter } from 'next/router'
import Benchmark from 'components/CaseStudies/benchmark'
import SectionHeader from 'components/UI/SectionHeader'
import CaseStudiesData from 'data/CaseStudies.json'
import { Card, Space } from '@supabase/ui'
import SectionContainer from '../Layouts/SectionContainer'
import BlogListItem from '../Blog/BlogListItem'

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
      <div className="mt-5 max-w-lg mx-auto grid gap-8 lg:gap-12 lg:grid-cols-3 lg:max-w-none">
        {CaseStudiesData.map((caseStudy: any, idx: number) => (
          <>
            <BlogListItem
              post={{
                type: 'casestudy',
                title: caseStudy.title,
                description: caseStudy.description,
                thumb: `${basePath}/${caseStudy.imgUrl}`,
                hideAuthor: true,
              }}
            />
            {/* <a href={caseStudy.url} key={idx}>
              <Card
                key={`caseStudy_${idx}`}
                hoverable
                cover={
                  <img src={`${basePath}/${caseStudy.imgUrl}`} className="h-64 object-cover" />
                }
                className="bg-scale-400"
              >
                <div>
                  <p className="p">Project example</p>
                  <h4 className="h5">{caseStudy.title}</h4>
                </div>
                <p className="p">{caseStudy.description}</p>
              </Card>
            </a> */}
          </>
        ))}
      </div>
      {/* <Benchmark /> */}
    </SectionContainer>
  )
}

export default CaseStudies
