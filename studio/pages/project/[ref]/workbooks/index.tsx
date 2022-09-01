import { ProjectLayoutWithAuth } from 'components/layouts'
import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import Connecting from 'components/ui/Loading/Loading'
import { useWorkbooksQuery } from 'data/workbooks/workbooks-query'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { NextPageWithLayout } from 'types'

const WorkbooksPage: NextPageWithLayout = () => {
  const router = useRouter()
  const { project } = useProjectContext()
  const { data, isLoading, isSuccess } = useWorkbooksQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })

  if (isLoading) {
    // TODO(alaister): skeleton loading ui
    return <Connecting />
  }

  return (
    <div className="flex flex-col">
      {isSuccess &&
        data.workbooks.map((workbook) => (
          <Link key={workbook.id} href={`${router.asPath}/${workbook.id}`}>
            <a>{workbook.title}</a>
          </Link>
        ))}
    </div>
  )
}

export default WorkbooksPage

WorkbooksPage.getLayout = (page) => (
  <ProjectLayoutWithAuth title="Workbooks">{page}</ProjectLayoutWithAuth>
)
