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

const sample2 = `[
      {
        "Plan": {
          "Node Type": "Seq Scan",
          "Parallel Aware": false,
          "Async Capable": false,
          "Relation Name": "onboarding_answers",
          "Alias": "onboarding_answers",
          "Startup Cost": 0,
          "Total Cost": 34.05,
          "Plan Rows": 1,
          "Plan Width": 65,
          "Filter": "(user_id = '1e7d399b-a806-4fc3-b0ca-5b536efbb540'::uuid)"
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
        <ExplainPlanFlow json={sample2} />
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
