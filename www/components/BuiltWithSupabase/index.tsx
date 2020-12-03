import Card from 'components/Card'
import SectionHeader from 'components/UI/SectionHeader'
import ProjectExamples from 'data/ProjectExamples.json'
import { useRouter } from 'next/router'

const BuiltExamples = () => {
  const { basePath } = useRouter()
  return (
    <div className="relative bg-gray-50 dark:bg-dark-600 pt-12 pb-16">
      <div className="absolute inset-0">
        <div className="mx-auto bg-white dark:bg-dark-600 w-full h-1/3 sm:h-2/3 lg:h-1/2"></div>
      </div>
      <div className="container mx-auto px-8 sm:px-16 xl:px-20 relative">
        <div className="mx-auto max-w-7xl">
          <SectionHeader
            title={'What you can build'}
            title_alt={' with Supabase'}
            subtitle={'Built with supabase'}
          />
        </div>
        <div className="relative max-w-7xl mx-auto">
          <div className="mt-12 max-w-lg mx-auto grid gap-5 lg:grid-cols-3 lg:max-w-none">
            {ProjectExamples.map((example: any, idx: number) => (
              <Card
                key={`example_${idx}`}
                title={example.title}
                type="Project Example"
                description={example.description}
                imgUrl={`${basePath}/${example.imgUrl}`}
                url={example.url}
                icons={example.icons}
              />
            ))}
          </div>
          <p className="mt-10 text-base text-gray-500 dark:text-dark-400">
            See all examples on our{' '}
            <a className="text-brand-700" href="https://github.com/supabase">
              Github
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}

export default BuiltExamples
