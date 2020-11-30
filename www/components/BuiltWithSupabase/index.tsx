import ArticleThumb from 'components/ArticleThumb'
import SectionHeader from 'components/UI/SectionHeader'
import ProjectExamples from "data/ProjectExamples.json"

const BuiltExamples = () => {
  return (
    <>
      <div className="relative bg-gray-50 dark:bg-dark-100 py-16 px-4 sm:px-6 lg:pt-24 lg:pb-28 lg:px-16">
        <div className="absolute inset-0">
          <div className="bg-white dark:bg-dark-100 h-1/3 sm:h-2/3"></div>
        </div>
        <div className="mx-auto max-w-7xl">
          <SectionHeader
            title={'What you can build'}
            title_alt={' with Supabase'} 
            subtitle={'Built with supabase'} 
          />
        </div>
        <div className="relative max-w-7xl mx-auto">
          <div className="mt-12 max-w-lg mx-auto grid gap-5 lg:grid-cols-3 lg:max-w-none">
            <ArticleThumb article={ProjectExamples["vercel_and_stripe"]} />
            <ArticleThumb article={ProjectExamples["nextjs-slack-clone"]} />
          </div>
        </div>
      </div>
    </>
  )
}

export default BuiltExamples
