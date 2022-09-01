import WorkbookBlock from 'components/interfaces/Workbook/Block'
import { ProjectLayoutWithAuth } from 'components/layouts'
import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import Connecting from 'components/ui/Loading/Loading'
import { useWorkbookQuery } from 'data/workbooks/workbook-query'
import { useParams } from 'hooks'
import { NextPageWithLayout } from 'types'

const WorkbookPage: NextPageWithLayout = () => {
  const { id } = useParams()
  const { project } = useProjectContext()
  const { data, isLoading, isSuccess } = useWorkbookQuery({
    id,
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })

  if (isLoading) {
    // TODO(alaister): skeleton loading ui
    return <Connecting />
  }

  if (isSuccess && data.workbook === null) {
    // TODO(alaister): proper 404 state
    return <div>Not Found</div>
  }

  return (
    <div className="max-w-5xl mx-auto px-4 w-full">
      {isSuccess &&
        data.workbook?.blocks.map((block) => <WorkbookBlock key={block.id} block={block} />)}
    </div>
  )
}

export default WorkbookPage

WorkbookPage.getLayout = (page) => (
  <ProjectLayoutWithAuth title="Workbooks">{page}</ProjectLayoutWithAuth>
)
