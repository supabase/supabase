import { FlameGraph, FlameGraphDataItem } from 'ui-patterns'

export default function FlameGraphDemo() {
  return (
    <FlameGraph
      data={data}
      title="flame graph (colorMode=width)"
      colorMode="width"
      tooltipFormatter={(params) => {
        return `${params.marker} ${params.value[3]}: ${params.value[2] - params.value[1]}ms`
      }}
    />
  )
}

const data: FlameGraphDataItem[] = [
  // Level 1
  {
    id: 'b37f9ec1-5432-48c8-9865-3fb4d3f92ce2',
    name: 'main',
    start_value: 0,
    end_value: 10000,
    parent_id: '',
  },

  // Level 2
  {
    id: '5a34d0f2-1e87-4c3d-b4ef-c77a8bd9c591',
    name: 'renderUI',
    start_value: 0,
    end_value: 4500,
    parent_id: 'b37f9ec1-5432-48c8-9865-3fb4d3f92ce2',
  },
  {
    id: '83bc9c50-1247-4b1d-a8c0-4e96b6c3f87d',
    name: 'processData',
    start_value: 4500,
    end_value: 8000,
    parent_id: 'b37f9ec1-5432-48c8-9865-3fb4d3f92ce2',
  },
  {
    id: '7e214c48-6a19-4e3a-9f3e-cb27c4b1792a',
    name: 'networkCalls',
    start_value: 8000,
    end_value: 10000,
    parent_id: 'b37f9ec1-5432-48c8-9865-3fb4d3f92ce2',
  },

  // Level 3
  {
    id: '9f2ae472-8c4b-4d89-9c13-2f7d3647621e',
    name: 'layoutCalculation',
    start_value: 0,
    end_value: 1500,
    parent_id: '5a34d0f2-1e87-4c3d-b4ef-c77a8bd9c591',
  },
  {
    id: '63d9a6f8-7e91-4e6d-b4a3-53b8421a6d0c',
    name: 'componentDraw',
    start_value: 1500,
    end_value: 3500,
    parent_id: '5a34d0f2-1e87-4c3d-b4ef-c77a8bd9c591',
  },
  {
    id: 'a5f298d1-0237-4f9c-bc71-c6f9b234c620',
    name: 'eventHandlers',
    start_value: 3500,
    end_value: 4500,
    parent_id: '5a34d0f2-1e87-4c3d-b4ef-c77a8bd9c591',
  },
  {
    id: 'e3f7c1d8-5a92-4b6e-87d9-2c5f1e4a3b6d',
    name: 'parseJSON',
    start_value: 4500,
    end_value: 5500,
    parent_id: '83bc9c50-1247-4b1d-a8c0-4e96b6c3f87d',
  },
  {
    id: 'a9c8e7d6-5b4f-3c2e-1d8a-7b6f5e4d3c2b',
    name: 'sortAlgorithm',
    start_value: 5500,
    end_value: 6500,
    parent_id: '83bc9c50-1247-4b1d-a8c0-4e96b6c3f87d',
  },
  {
    id: 'b2c3d4e5-f6a7-8b9c-1d2e-3f4a5b6c7d8e',
    name: 'filterData',
    start_value: 6500,
    end_value: 8000,
    parent_id: '83bc9c50-1247-4b1d-a8c0-4e96b6c3f87d',
  },
  {
    id: '7a8b9c0d-1e2f-3a4b-5c6d-7e8f9a0b1c2d',
    name: 'apiRequests',
    start_value: 8000,
    end_value: 9000,
    parent_id: '7e214c48-6a19-4e3a-9f3e-cb27c4b1792a',
  },
  {
    id: '3e4f5a6b-7c8d-9e0f-1a2b-3c4d5e6f7a8b',
    name: 'dataSync',
    start_value: 9000,
    end_value: 10000,
    parent_id: '7e214c48-6a19-4e3a-9f3e-cb27c4b1792a',
  },

  // Level 4
  {
    id: 'd7e1c50f-6a94-4b68-8c4e-b3a978f2d5e7',
    name: 'gridSystem',
    start_value: 0,
    end_value: 800,
    parent_id: '9f2ae472-8c4b-4d89-9c13-2f7d3647621e',
  },
  {
    id: '4b721f8e-2a3d-4f9c-8b57-da9c42f7e3a5',
    name: 'responsiveDesign',
    start_value: 800,
    end_value: 1500,
    parent_id: '9f2ae472-8c4b-4d89-9c13-2f7d3647621e',
  },
  {
    id: '2c5e8f3a-71d9-4b6c-9e8d-f17a32e40c9b',
    name: 'renderText',
    start_value: 1500,
    end_value: 2200,
    parent_id: '63d9a6f8-7e91-4e6d-b4a3-53b8421a6d0c',
  },
  {
    id: '1d8f6a92-5c47-4e3b-b9d8-72e4f91c3a5d',
    name: 'renderImages',
    start_value: 2200,
    end_value: 2900,
    parent_id: '63d9a6f8-7e91-4e6d-b4a3-53b8421a6d0c',
  },
  {
    id: 'f8e24a7c-9b53-4d6e-8a97-15f2c9e7b6d3',
    name: 'applyStyles',
    start_value: 2900,
    end_value: 3500,
    parent_id: '63d9a6f8-7e91-4e6d-b4a3-53b8421a6d0c',
  },
  {
    id: 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
    name: 'setupListeners',
    start_value: 3500,
    end_value: 4000,
    parent_id: 'a5f298d1-0237-4f9c-bc71-c6f9b234c620',
  },
  {
    id: 'c6d7e8f9-a0b1-c2d3-e4f5-a6b7c8d9e0f1',
    name: 'optimizeHandlers',
    start_value: 4000,
    end_value: 4500,
    parent_id: 'a5f298d1-0237-4f9c-bc71-c6f9b234c620',
  },
]
