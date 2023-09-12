import { useParams } from 'common'
import ShimmeringLoader from 'components/ui/ShimmeringLoader'
import { useProjectsQuery } from 'data/projects/projects-query'

const LoadingState = () => {
  const { ref } = useParams()
  const { data: allProjects, isLoading } = useProjectsQuery()

  const projectName =
    ref !== 'default'
      ? allProjects?.find((project) => project.ref === ref)?.name
      : 'Welcome to your project'

  return (
    <div className="w-full mx-auto my-16 space-y-16 max-w-7xl">
      <div className="flex items-center mx-6 space-x-6">
        {isLoading ? (
          <ShimmeringLoader className="h-9 w-40" />
        ) : (
          <h1 className="text-3xl">{projectName}</h1>
        )}
      </div>

      <div className="mx-6 space-y-4">
        <ShimmeringLoader className="w-40 h-7" />
        <div className="flex md:gap-4 lg:gap-8">
          <ShimmeringLoader className="w-full h-[304px]" />
          <ShimmeringLoader className="w-full h-[304px]" />
          <ShimmeringLoader className="w-full h-[304px]" />
          <ShimmeringLoader className="w-full h-[304px]" />
        </div>
      </div>

      <div className="mx-6 space-y-4">
        <ShimmeringLoader className="w-40 h-7" />
        <ShimmeringLoader className="w-full h-32" />
      </div>
    </div>
  )
}

export default LoadingState
