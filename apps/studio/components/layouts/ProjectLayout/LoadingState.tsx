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
    <div className="w-full mx-auto">
      <div className="max-w-7xl mx-auto flex items-center space-x-6 h-[184px]">
        {isLoading ? (
          <ShimmeringLoader className="h-9 w-40" />
        ) : (
          <h1 className="text-3xl">{projectName}</h1>
        )}
      </div>

      <div className="w-full border-t mb-16" />

      <div className="max-w-7xl mx-auto mb-16">
        <ProjectUsageLoadingState />
      </div>

      <div className="max-w-7xl mx-auto space-y-4">
        <ShimmeringLoader className="w-40 h-7" />
        <ShimmeringLoader className="w-full h-32" />
      </div>
    </div>
  )
}

export default LoadingState

export const ProjectUsageLoadingState = () => {
  return (
    <div className="space-y-6">
      <ShimmeringLoader className="w-40 h-7" />
      <div className="flex flex-col md:flex-row gap-2 md:gap-4">
        <ShimmeringLoader className="w-full h-[320px] py-0" />
        <ShimmeringLoader className="w-full h-[320px] py-0" />
        <ShimmeringLoader className="w-full h-[320px] py-0" />
        <ShimmeringLoader className="w-full h-[320px] py-0" />
      </div>
    </div>
  )
}
