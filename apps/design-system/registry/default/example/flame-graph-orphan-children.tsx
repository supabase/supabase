import { FlameGraph, FlameGraphDataItem } from 'ui-patterns'

export default function FlameGraphDemo() {
  return (
    <FlameGraph
      data={data}
      title="flame graph (orphan children)"
      tooltipFormatter={(params) => {
        const samples = params.value[2] - params.value[1]
        return `${params.marker} ${params.value[3]}: ${params.value[2] - params.value[1]}ms`
      }}
    />
  )
}

const ColorTypes = [
  '#8fd3e8',
  '#d95850',
  '#eb8146',
  '#ffb248',
  '#f2d643',
  '#ebdba4',
  '#fcce10',
  '#b5c334',
  '#1bca93',
]

const data: FlameGraphDataItem[] = [
  {
    id: 'b37f9ec1-5432-48c8-9865-3fb4d3f92ce2',
    name: 'main',
    start_value: 0,
    end_value: 100,
    parent_id: '',
    color: ColorTypes[Math.floor(Math.random() * ColorTypes.length)],
  },
  {
    id: '5a34d0f2-1e87-4c3d-b4ef-c77a8bd9c591',
    name: 'renderUI',
    start_value: 0,
    end_value: 45,
    parent_id: 'b37f9ec1-5432-48c8-9865-3fb4d3f92ce2',
    color: ColorTypes[Math.floor(Math.random() * ColorTypes.length)],
  },
  {
    id: '83bc9c50-1247-4b1d-a8c0-4e96b6c3f87d',
    name: 'processData',
    start_value: 45,
    end_value: 80,
    parent_id: 'b37f9ec1-5432-48c8-9865-3fb4d3f92ce2',
    color: ColorTypes[Math.floor(Math.random() * ColorTypes.length)],
  },
  {
    id: '7e214c48-6a19-4e3a-9f3e-cb27c4b1792a',
    name: 'networkCalls',
    start_value: 80,
    end_value: 100,
    parent_id: 'b37f9ec1-5432-48c8-9865-3fb4d3f92ce2',
    color: ColorTypes[Math.floor(Math.random() * ColorTypes.length)],
  },
  {
    id: 'a9c8e7d6-5b4f-3c2e-1d8a-7b6f5e4d3c2b',
    name: 'hidden from flame graph',
    start_value: 80,
    end_value: 100,
    parent_id: 'ffffffff-ffff-ffff-ffff-ffffffffffff', // parent id doesn't exist
    color: ColorTypes[Math.floor(Math.random() * ColorTypes.length)],
  },
  {
    id: '2c5e8f3a-71d9-4b6c-9e8d-f17a32e40c9b',
    name: 'hidden from flame graph 2',
    start_value: 80,
    end_value: 100,
    parent_id: 'ffffffff-ffff-ffff-ffff-ffffffffffff', // parent id doesn't exist
    color: ColorTypes[Math.floor(Math.random() * ColorTypes.length)],
  },
]
