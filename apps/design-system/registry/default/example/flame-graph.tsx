import { FlameGraph, FlameGraphDataItem } from 'ui-patterns'

export default function FlameGraphDemo() {
  return (
    <FlameGraph
      data={data}
      title="flame graph"
      tooltipFormatter={(params) => {
        const samples = params.value[2] - params.value[1]
        return `${params.marker} ${params.value[3]}: ${params.value[2] - params.value[1]}ms`
      }}
    />
  )
}

const FlameGraphGreenGradient = [
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
    color: '#4ade80',
  },
  {
    id: '5a34d0f2-1e87-4c3d-b4ef-c77a8bd9c591',
    name: 'renderUI',
    start_value: 0,
    end_value: 45,
    parent_id: 'b37f9ec1-5432-48c8-9865-3fb4d3f92ce2',
    color: '#22c55e',
  },
  {
    id: '83bc9c50-1247-4b1d-a8c0-4e96b6c3f87d',
    name: 'processData',
    start_value: 45,
    end_value: 80,
    parent_id: 'b37f9ec1-5432-48c8-9865-3fb4d3f92ce2',
    color: '#22c55e',
  },
  {
    id: '7e214c48-6a19-4e3a-9f3e-cb27c4b1792a',
    name: 'networkCalls',
    start_value: 80,
    end_value: 100,
    parent_id: 'b37f9ec1-5432-48c8-9865-3fb4d3f92ce2',
    color: '#22c55e',
  },
  {
    id: '9f2ae472-8c4b-4d89-9c13-2f7d3647621e',
    name: 'layoutCalculation',
    start_value: 0,
    end_value: 15,
    parent_id: '5a34d0f2-1e87-4c3d-b4ef-c77a8bd9c591',
    color: '#16a34a',
  },
  {
    id: '63d9a6f8-7e91-4e6d-b4a3-53b8421a6d0c',
    name: 'componentDraw',
    start_value: 15,
    end_value: 35,
    parent_id: '5a34d0f2-1e87-4c3d-b4ef-c77a8bd9c591',
    color: '#16a34a',
  },
  {
    id: 'a5f298d1-0237-4f9c-bc71-c6f9b234c620',
    name: 'eventHandlers',
    start_value: 35,
    end_value: 45,
    parent_id: '5a34d0f2-1e87-4c3d-b4ef-c77a8bd9c591',
    color: '#16a34a',
  },
  {
    id: 'd7e1c50f-6a94-4b68-8c4e-b3a978f2d5e7',
    name: 'gridSystem',
    start_value: 0,
    end_value: 8,
    parent_id: '9f2ae472-8c4b-4d89-9c13-2f7d3647621e',
    color: '#15803d',
  },
  {
    id: '4b721f8e-2a3d-4f9c-8b57-da9c42f7e3a5',
    name: 'responsiveDesign',
    start_value: 8,
    end_value: 15,
    parent_id: '9f2ae472-8c4b-4d89-9c13-2f7d3647621e',
    color: '#15803d',
  },
  {
    id: '2c5e8f3a-71d9-4b6c-9e8d-f17a32e40c9b',
    name: 'renderText',
    start_value: 15,
    end_value: 22,
    parent_id: '63d9a6f8-7e91-4e6d-b4a3-53b8421a6d0c',
    color: '#15803d',
  },
  {
    id: '1d8f6a92-5c47-4e3b-b9d8-72e4f91c3a5d',
    name: 'renderImages',
    start_value: 22,
    end_value: 29,
    parent_id: '63d9a6f8-7e91-4e6d-b4a3-53b8421a6d0c',
    color: '#15803d',
  },
  {
    id: 'f8e24a7c-9b53-4d6e-8a97-15f2c9e7b6d3',
    name: 'applyStyles',
    start_value: 29,
    end_value: 35,
    parent_id: '63d9a6f8-7e91-4e6d-b4a3-53b8421a6d0c',
    color: '#15803d',
  },
  {
    id: 'e3f7c1d8-5a92-4b6e-87d9-2c5f1e4a3b6d',
    name: 'parseJSON',
    start_value: 45,
    end_value: 55,
    parent_id: '83bc9c50-1247-4b1d-a8c0-4e96b6c3f87d',
    color: '#16a34a',
  },
  {
    id: 'a9c8e7d6-5b4f-3c2e-1d8a-7b6f5e4d3c2b',
    name: 'sortAlgorithm',
    start_value: 55,
    end_value: 65,
    parent_id: '83bc9c50-1247-4b1d-a8c0-4e96b6c3f87d',
    color: '#16a34a',
  },
  {
    id: 'b2c3d4e5-f6a7-8b9c-1d2e-3f4a5b6c7d8e',
    name: 'filterData',
    start_value: 65,
    end_value: 80,
    parent_id: '83bc9c50-1247-4b1d-a8c0-4e96b6c3f87d',
    color: '#16a34a',
  },
  {
    id: 'c4d5e6f7-8a9b-0c1d-2e3f-4a5b6c7d8e9f',
    name: 'quickSort',
    start_value: 55,
    end_value: 60,
    parent_id: 'a9c8e7d6-5b4f-3c2e-1d8a-7b6f5e4d3c2b',
    color: '#15803d',
  },
  {
    id: 'd5e6f7a8-9b0c-1d2e-3f4a-5b6c7d8e9f0a',
    name: 'mergeResults',
    start_value: 60,
    end_value: 65,
    parent_id: 'a9c8e7d6-5b4f-3c2e-1d8a-7b6f5e4d3c2b',
    color: '#15803d',
  },
]
