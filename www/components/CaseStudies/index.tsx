import ArticleThumb from '../ArticleThumb'
import SectionHeader from '../UI/SectionHeader'
import CaseStudiesData from "./../../data/CaseStudies.json"

const CaseStudies = () => {

  return (
    <>
      <div className="relative bg-gray-50 dark:bg-dark-300 pt-16 pb-20 px-4 sm:px-6 lg:pt-24 lg:pb-28 lg:px-8">
        <div className="absolute inset-0">
          <div className="bg-white dark:bg-dark-300 h-1/3 sm:h-2/3"></div>
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
            <ArticleThumb article={CaseStudiesData["monitoro"]} />
            <ArticleThumb article={CaseStudiesData["tayfab"]} />
            <ArticleThumb article={CaseStudiesData["llama_lab"]} />
          </div>
        </div>
      </div>
    </>
  )
}

export default CaseStudies
