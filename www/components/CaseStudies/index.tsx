import Card from 'components/Card'
import Benchmark from 'components/CaseStudies/benchmark'
import SectionHeader from 'components/UI/SectionHeader'
import CaseStudiesData from "data/CaseStudies.json"

const CaseStudies = () => {

  return (
    <div className="relative bg-gray-50 dark:bg-dark-400 pt-16 pb-20 lg:pt-24 lg:pb-28">
      <div className="container relative mx-auto sm:px-16 xl:px-20">
        <div className="absolute inset-0">
          <div className="mx-auto bg-white dark:bg-dark-300 h-1/3 sm:h-2/3 md:w-5/6 lg:w-3/4 xl:w-full"></div>
        </div>
        <div className="relative max-w-7xl mx-auto">
          <div>
            <SectionHeader
              title={'We\'re ready to help scale your business'}
              subtitle={'Enterprise Solutions'}
              paragraph={'Supabase has already been supporting many companies in production, from monitoring applications to social networks. '}
            />
          </div>
          <div className="mt-5 max-w-lg mx-auto grid gap-5 lg:grid-cols-3 lg:max-w-none">
            {CaseStudiesData.map((caseStudy: any, idx: number) => (
              <Card
                key={`caseStudy_${idx}`}
                title={caseStudy.title}
                type={caseStudy.type}
                description={caseStudy.description}
                imgUrl={caseStudy.imgUrl}
                url={caseStudy.url}
                logoUrl={caseStudy.logoUrl}
                // postMeta={caseStudy.postMeta}
                ctaText={caseStudy.ctaText}
              />
            ))}
          </div>
        </div>
        <Benchmark />
      </div>
    </div>
  )
}

export default CaseStudies
