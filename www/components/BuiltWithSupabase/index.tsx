import Card from 'components/Card'
import SectionHeader from 'components/UI/SectionHeader'
import ProjectExamples from "data/ProjectExamples.json"

const BuiltExamples = () => {
  return (
    <div className="bg-gray-50 dark:bg-dark-200 py-16">
      <div className="container mx-auto px-20 relative">
        <div className="absolute inset-0">
          <div className="bg-white dark:bg-dark-200 h-1/3 sm:h-2/3"></div>
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
            {ProjectExamples.map((example: any) => (
              <Card
                key={example.title}
                title={example.title}
                type="Project Example"
                description={example.description}
                imgUrl={example.imgUrl}
                url={example.url}
                ctaText={example.ctaText}
                icons={example.icons}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default BuiltExamples
