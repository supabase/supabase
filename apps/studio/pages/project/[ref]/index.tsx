import { useFlag } from 'common'
// import { Home } from 'components/interfaces/Home/Home'
import { HomeV2 } from 'components/interfaces/HomeNew/Home'
import DefaultLayout from 'components/layouts/DefaultLayout'
import { ProjectLayoutWithAuth } from 'components/layouts/ProjectLayout/ProjectLayout'
import type { NextPageWithLayout } from 'types'
import { ExplainPlanFlow } from 'components/ui/QueryPlanner/query-planner-visualizer'

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
      "Node Type": "Hash Join",
      "Join Type": "Inner",
      "Startup Cost": 230.47,
      "Total Cost": 713.98,
      "Plan Rows": 101,
      "Plan Width": 488,
      "Hash Cond": "(t1.unique2 = t2.unique2)",
      "Plans": [
        {
          "Node Type": "Seq Scan",
          "Relation Name": "tenk2",
          "Alias": "t2",
          "Startup Cost": 0.00,
          "Total Cost": 445.00,
          "Plan Rows": 10000,
          "Plan Width": 244
        },
        {
          "Node Type": "Bitmap Heap Scan",
          "Relation Name": "tenk1",
          "Alias": "t1",
          "Startup Cost": 230.47,
          "Total Cost": 268.49,
          "Plan Rows": 101,
          "Plan Width": 244,
          "Recheck Cond": "(unique1 < 100)",
          "Plans": [
            {
              "Node Type": "Bitmap Index Scan",
              "Index Name": "tenk1_unique1",
              "Startup Cost": 0.00,
              "Total Cost": 230.47,
              "Plan Rows": 101,
              "Plan Width": 0,
              "Index Cond": "(unique1 < 100)"
            }
          ]
        }
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
