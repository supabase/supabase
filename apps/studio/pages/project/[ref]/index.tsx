import { useFlag } from 'common'
// import { Home } from 'components/interfaces/Home/Home'
import { HomeV2 } from 'components/interfaces/HomeNew/Home'
import DefaultLayout from 'components/layouts/DefaultLayout'
import { ProjectLayoutWithAuth } from 'components/layouts/ProjectLayout/ProjectLayout'
import type { NextPageWithLayout } from 'types'
import { ExplainPlanFlow } from 'components/interfaces/Database'

const sample = `[
  {
    "Plan": {
      "Node Type": "Hash Join",
      "Plans": [
        { "Node Type": "Seq Scan" },
        { "Node Type": "Bitmap Heap Scan", "Plans": [{ "Node Type": "Bitmap Index Scan" }] }
      ]
    }
  }
]`

const HomePage: NextPageWithLayout = () => {
  const isHomeNew = useFlag('homeNew')
  if (isHomeNew) {
    return <HomeV2 />
  }
  return (
    <>
      <div className="w-full h-[500px]">
        <ExplainPlanFlow json={sample} />
      </div>
      {/* <Home /> */}
    </>
  )
}

HomePage.getLayout = (page) => (
  <DefaultLayout>
    <ProjectLayoutWithAuth>{page}</ProjectLayoutWithAuth>
  </DefaultLayout>
)

export default HomePage
