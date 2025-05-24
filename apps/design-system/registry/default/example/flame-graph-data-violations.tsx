import { FlameGraph, FlameGraphDataItem } from 'ui-patterns'

export default function FlameGraphDemo() {
  return (
    <FlameGraph
      data={data}
      title="flame graph (data violations)"
      tooltipFormatter={(params) => {
        const samples = params.value[2] - params.value[1]
        return `${params.marker} ${params.value[3]}: ${params.value[2] - params.value[1]}ms`
      }}
    />
  )
}

const data: FlameGraphDataItem[] = [
  {
    id: 'b37f9ec1-5432-48c8-9865-3fb4d3f92ce2',
    name: 'main',
    start_value: 0,
    end_value: 100,
    parent_id: '',
    color: '#8fd3e8',
  },
  {
    id: '5a34d0f2-1e87-4c3d-b4ef-c77a8bd9c591',
    name: 'too short values',
    start_value: 0,
    end_value: 30,
    parent_id: 'b37f9ec1-5432-48c8-9865-3fb4d3f92ce2',
    color: '#d95850',
  },
  {
    id: '83bc9c50-1247-4b1d-a8c0-4e96b6c3f87d',
    name: 'short1',
    start_value: 0,
    end_value: 5,
    parent_id: '5a34d0f2-1e87-4c3d-b4ef-c77a8bd9c591',
    color: '#d95850',
  },

  {
    id: '7e214c48-6a19-4e3a-9f3e-cb27c4b1792a',
    name: 'short2',
    start_value: 5,
    end_value: 15,
    parent_id: '5a34d0f2-1e87-4c3d-b4ef-c77a8bd9c591',
    color: '#d95850',
  },

  {
    id: '9f2ae472-8c4b-4d89-9c13-2f7d3647621e',
    name: 'too much values',
    start_value: 30,
    end_value: 70,
    parent_id: 'b37f9ec1-5432-48c8-9865-3fb4d3f92ce2',
    color: '#ffb248',
  },
  {
    id: '63d9a6f8-7e91-4e6d-b4a3-53b8421a6d0c',
    name: 'long1',
    start_value: 30,
    end_value: 55,
    parent_id: '9f2ae472-8c4b-4d89-9c13-2f7d3647621e',
    color: '#ffb248',
  },
  {
    id: 'a5f298d1-0237-4f9c-bc71-c6f9b234c620',
    name: 'long2',
    start_value: 55,
    end_value: 80,
    parent_id: '9f2ae472-8c4b-4d89-9c13-2f7d3647621e',
    color: '#ffb248',
  },
  {
    id: 'c4d5e6f7-8a9b-0c1d-2e3f-4a5b6c7d8e9f',
    name: 'overlap',
    start_value: 70,
    end_value: 100,
    parent_id: 'b37f9ec1-5432-48c8-9865-3fb4d3f92ce2',
    color: '#f2d643',
  },
  {
    id: 'd5e6f7a8-9b0c-1d2e-3f4a-5b6c7d8e9f0a',
    name: 'overlap1',
    start_value: 70,
    end_value: 100,
    parent_id: 'c4d5e6f7-8a9b-0c1d-2e3f-4a5b6c7d8e9f',
    color: '#f2d643',
  },
]
