import Card from 'components/Card'
import Benchmark from 'components/CaseStudies/benchmark'
import SectionHeader from 'components/UI/SectionHeader'
import CaseStudiesData from 'data/CaseStudies.json'
import { useRouter } from 'next/router'

const CaseStudies = () => {
  const { basePath } = useRouter()

  return (
    <div className="relative bg-gray-50 dark:bg-dark-600 pb-20">
      <div className="absolute inset-0">
        <div className="mx-auto bg-white dark:bg-dark-700 h-1/5 sm:h-2/5 w-full"></div>
      </div>
      <div className="container relative mx-auto px-8 sm:px-16 xl:px-20 lg:py-8">
        <div className="relative max-w-7xl mx-auto">
          <div>
            <SectionHeader
              title={'Scale up'}
              title_alt={' with no extra effort'}
              subtitle={'Enterprise Solutions'}
              paragraph={
                "Supabase is built with proven, enterprise-ready tools. We're supporting everything from fintech providers to social networks. "
              }
            />
          </div>
          <div className="mt-5 max-w-lg mx-auto grid gap-5 lg:grid-cols-3 lg:max-w-none">
            {CaseStudiesData.map((caseStudy: any, idx: number) => (
              <Card
                key={`caseStudy_${idx}`}
                title={caseStudy.title}
                type={caseStudy.type}
                description={caseStudy.description}
                imgUrl={`${basePath}/${caseStudy.imgUrl}`}
                url={caseStudy.url}
                logoUrl={caseStudy.logoUrl}
                // postMeta={caseStudy.postMeta}
                // ctaText={caseStudy.ctaText}
              />
            ))}
          </div>
          <Benchmark />
        </div>
      </div>
    </div>
  )
}

export default CaseStudies
