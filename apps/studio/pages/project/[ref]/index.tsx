import { useFlag } from 'common'
// import { Home } from 'components/interfaces/Home/Home'
import { HomeV2 } from 'components/interfaces/HomeNew/Home'
import DefaultLayout from 'components/layouts/DefaultLayout'
import { ProjectLayoutWithAuth } from 'components/layouts/ProjectLayout/ProjectLayout'
import type { NextPageWithLayout } from 'types'
import { QueryPlanVisualizer } from 'components/ui/QueryPlan/query-plan-visualizer'

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

const sample3 = `[
{
"Plan": {
"Node Type": "Hash Join",
"Join Type": "Inner",
"Startup Cost": 10.00,
"Total Cost": 120.00,
"Plan Rows": 500,
"Plan Width": 64,
"Actual Startup Time": 0.20,
"Actual Total Time": 20.00,
"Actual Rows": 400,
"Actual Loops": 1,
"Parallel Aware": true,
"Workers Planned": 4,
"Workers Launched": 3,
"Hash Cond": "(t1.id = t2.id)",
"Rows Removed by Join Filter": 50,
"Plans": [
{
"Node Type": "Seq Scan",
"Relation Name": "table2",
"Alias": "t2",
"Startup Cost": 0.00,
"Total Cost": 50.00,
"Plan Rows": 2000,
"Plan Width": 32,
"Actual Startup Time": 0.00,
"Actual Total Time": 8.00,
"Actual Rows": 150,
"Actual Loops": 1,
"Rows Removed by Filter": 20
},
{
"Node Type": "Bitmap Heap Scan",
"Relation Name": "table1",
"Alias": "t1",
"Startup Cost": 0.00,
"Total Cost": 70.00,
"Plan Rows": 100,
"Plan Width": 32,
"Actual Startup Time": 0.10,
"Actual Total Time": 12.00,
"Actual Rows": 900,
"Actual Loops": 1,
"Rows Removed by Index Recheck": 10,
"Recheck Cond": "(id < 1000)",
"Plans": [
{
"Node Type": "Bitmap Index Scan",
"Index Name": "idx_t1_id",
"Startup Cost": 0.00,
"Total Cost": 10.00,
"Plan Rows": 100,
"Plan Width": 0,
"Actual Startup Time": 0.00,
"Actual Total Time": 1.50,
"Actual Rows": 120,
"Actual Loops": 0,
"Index Cond": "(id < 1000)"
}
]
}
]
},
"Planning Time": 0.80,
"Execution Time": 22.50
}
]`

const HomePage: NextPageWithLayout = () => {
  const isHomeNew = useFlag('homeNew')

  if (isHomeNew) {
    return <HomeV2 />
  }
  return (
    <>
      <div className="w-full h-full">
        <QueryPlanVisualizer json={sample3} />
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
