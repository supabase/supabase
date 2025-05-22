import { FlameGraph, FlameGraphDataItem } from 'ui-patterns'

export default function FlameGraphDemo() {
  return (
    <FlameGraph
      data={data}
      title="flame graph"
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

  // Level 5
  {
    id: 'e4f5a6b7-c8d9-e0f1-a2b3-c4d5e6f7a8b9',
    name: 'calculateColumns',
    start_value: 0,
    end_value: 400,
    parent_id: 'd7e1c50f-6a94-4b68-8c4e-b3a978f2d5e7',
  },
  {
    id: 'f5a6b7c8-d9e0-f1a2-b3c4-d5e6f7a8b9c0',
    name: 'calculateRows',
    start_value: 400,
    end_value: 800,
    parent_id: 'd7e1c50f-6a94-4b68-8c4e-b3a978f2d5e7',
  },
  {
    id: 'a6b7c8d9-e0f1-a2b3-c4d5-e6f7a8b9c0d1',
    name: 'mediaQueries',
    start_value: 800,
    end_value: 1200,
    parent_id: '4b721f8e-2a3d-4f9c-8b57-da9c42f7e3a5',
  },
  {
    id: 'b7c8d9e0-f1a2-b3c4-d5e6-f7a8b9c0d1e2',
    name: 'deviceDetection',
    start_value: 1200,
    end_value: 1500,
    parent_id: '4b721f8e-2a3d-4f9c-8b57-da9c42f7e3a5',
  },
  {
    id: 'c8d9e0f1-a2b3-c4d5-e6f7-a8b9c0d1e2f3',
    name: 'fontLoading',
    start_value: 1500,
    end_value: 1800,
    parent_id: '2c5e8f3a-71d9-4b6c-9e8d-f17a32e40c9b',
  },
  {
    id: 'd9e0f1a2-b3c4-d5e6-f7a8-b9c0d1e2f3a4',
    name: 'textMeasurement',
    start_value: 1800,
    end_value: 2200,
    parent_id: '2c5e8f3a-71d9-4b6c-9e8d-f17a32e40c9b',
  },
  {
    id: 'e0f1a2b3-c4d5-e6f7-a8b9-c0d1e2f3a4b5',
    name: 'imageDecoding',
    start_value: 2200,
    end_value: 2500,
    parent_id: '1d8f6a92-5c47-4e3b-b9d8-72e4f91c3a5d',
  },
  {
    id: 'f1a2b3c4-d5e6-f7a8-b9c0-d1e2f3a4b5c6',
    name: 'imageCaching',
    start_value: 2500,
    end_value: 2900,
    parent_id: '1d8f6a92-5c47-4e3b-b9d8-72e4f91c3a5d',
  },
  {
    id: 'a2b3c4d5-e6f7-a8b9-c0d1-e2f3a4b5c6d7',
    name: 'cssProcessing',
    start_value: 2900,
    end_value: 3200,
    parent_id: 'f8e24a7c-9b53-4d6e-8a97-15f2c9e7b6d3',
  },
  {
    id: 'b3c4d5e6-f7a8-b9c0-d1e2-f3a4b5c6d7e8',
    name: 'animationSetup',
    start_value: 3200,
    end_value: 3500,
    parent_id: 'f8e24a7c-9b53-4d6e-8a97-15f2c9e7b6d3',
  },
  {
    id: 'c4d5e6f7-a8b9-c0d1-e2f3-a4b5c6d7e8f9',
    name: 'domEvents',
    start_value: 3500,
    end_value: 3700,
    parent_id: 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
  },
  {
    id: 'd5e6f7a8-b9c0-d1e2-f3a4-b5c6d7e8f9a0',
    name: 'customEvents',
    start_value: 3700,
    end_value: 4000,
    parent_id: 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
  },
  {
    id: 'e6f7a8b9-c0d1-e2f3-a4b5-c6d7e8f9a0b1',
    name: 'debounceEvents',
    start_value: 4000,
    end_value: 4200,
    parent_id: 'c6d7e8f9-a0b1-c2d3-e4f5-a6b7c8d9e0f1',
  },
  {
    id: 'f7a8b9c0-d1e2-f3a4-b5c6-d7e8f9a0b1c2',
    name: 'throttleEvents',
    start_value: 4200,
    end_value: 4500,
    parent_id: 'c6d7e8f9-a0b1-c2d3-e4f5-a6b7c8d9e0f1',
  },

  // Level 6
  {
    id: 'a8b9c0d1-e2f3-a4b5-c6d7-e8f9a0b1c2d3',
    name: 'determineBreakpoint',
    start_value: 800,
    end_value: 1000,
    parent_id: 'a6b7c8d9-e0f1-a2b3-c4d5-e6f7a8b9c0d1',
  },
  {
    id: 'b9c0d1e2-f3a4-b5c6-d7e8-f9a0b1c2d3e4',
    name: 'applyBreakpoint',
    start_value: 1000,
    end_value: 1200,
    parent_id: 'a6b7c8d9-e0f1-a2b3-c4d5-e6f7a8b9c0d1',
  },
  {
    id: 'c0d1e2f3-a4b5-c6d7-e8f9-a0b1c2d3e4f5',
    name: 'browserDetection',
    start_value: 1200,
    end_value: 1350,
    parent_id: 'b7c8d9e0-f1a2-b3c4-d5e6-f7a8b9c0d1e2',
  },
  {
    id: 'd1e2f3a4-b5c6-d7e8-f9a0-b1c2d3e4f5a6',
    name: 'orientationCheck',
    start_value: 1350,
    end_value: 1500,
    parent_id: 'b7c8d9e0-f1a2-b3c4-d5e6-f7a8b9c0d1e2',
  },
  {
    id: 'e2f3a4b5-c6d7-e8f9-a0b1-c2d3e4f5a6b7',
    name: 'webfontLoader',
    start_value: 1500,
    end_value: 1650,
    parent_id: 'c8d9e0f1-a2b3-c4d5-e6f7-a8b9c0d1e2f3',
  },
  {
    id: 'f3a4b5c6-d7e8-f9a0-b1c2-d3e4f5a6b7c8',
    name: 'fontSubsetting',
    start_value: 1650,
    end_value: 1800,
    parent_id: 'c8d9e0f1-a2b3-c4d5-e6f7-a8b9c0d1e2f3',
  },
  {
    id: 'a4b5c6d7-e8f9-a0b1-c2d3-e4f5a6b7c8d9',
    name: 'calculateLineHeight',
    start_value: 1800,
    end_value: 2000,
    parent_id: 'd9e0f1a2-b3c4-d5e6-f7a8-b9c0d1e2f3a4',
  },
  {
    id: 'b5c6d7e8-f9a0-b1c2-d3e4-f5a6b7c8d9e0',
    name: 'calculateLetterSpacing',
    start_value: 2000,
    end_value: 2200,
    parent_id: 'd9e0f1a2-b3c4-d5e6-f7a8-b9c0d1e2f3a4',
  },
  {
    id: 'c6d7e8f9-a0b1-c2d3-e4f5-a6b7c8d9e0f2',
    name: 'handleImageFormats',
    start_value: 2200,
    end_value: 2350,
    parent_id: 'e0f1a2b3-c4d5-e6f7-a8b9-c0d1e2f3a4b5',
  },
  {
    id: 'd7e8f9a0-b1c2-d3e4-f5a6-b7c8d9e0f1a2',
    name: 'imageCompression',
    start_value: 2350,
    end_value: 2500,
    parent_id: 'e0f1a2b3-c4d5-e6f7-a8b9-c0d1e2f3a4b5',
  },

  // Level 7
  {
    id: '9d1ecfbd-100f-46dc-9d72-9c5aa6ce3b13',
    name: 'determineBreakpoint 1',
    start_value: 800,
    end_value: 950,
    parent_id: 'a8b9c0d1-e2f3-a4b5-c6d7-e8f9a0b1c2d3',
  },
  {
    id: 'b770ae8c-a66d-45c4-b587-ad0eaade6a8c',
    name: 'determineBreakpoint 2',
    start_value: 950,
    end_value: 1000,
    parent_id: 'a8b9c0d1-e2f3-a4b5-c6d7-e8f9a0b1c2d3',
  },

  // Level 8
  {
    id: 'f6894fb6-0d04-4016-9d55-e2a7b1a2439d',
    name: 'determineBreakpoint 3',
    start_value: 800,
    end_value: 930,
    parent_id: '9d1ecfbd-100f-46dc-9d72-9c5aa6ce3b13',
  },
  {
    id: '5b9deed6-6153-4fac-ad17-966d06e05d49',
    name: 'determineBreakpoint 4',
    start_value: 930,
    end_value: 950,
    parent_id: '9d1ecfbd-100f-46dc-9d72-9c5aa6ce3b13',
  },

  // Level 9
  {
    id: '934aaa17-49ea-431d-8881-382fa419a5df',
    name: 'determineBreakpoint 5',
    start_value: 800,
    end_value: 910,
    parent_id: 'f6894fb6-0d04-4016-9d55-e2a7b1a2439d',
  },
  {
    id: '7b225d4b-f37a-41e4-a70f-293be30673d8',
    name: 'determineBreakpoint 6',
    start_value: 910,
    end_value: 930,
    parent_id: 'f6894fb6-0d04-4016-9d55-e2a7b1a2439d',
  },

  // Level 10
  {
    id: '371e51fc-3d31-4735-891d-46c8a771c66c',
    name: 'determineBreakpoint 7',
    start_value: 800,
    end_value: 890,
    parent_id: '934aaa17-49ea-431d-8881-382fa419a5df',
  },
  {
    id: '290abcc3-de45-4c79-95cb-9b24672fe6fe',
    name: 'determineBreakpoint 8',
    start_value: 890,
    end_value: 910,
    parent_id: '934aaa17-49ea-431d-8881-382fa419a5df',
  },

  // Level 10
  {
    id: '9088bee8-3850-4229-a122-b2b2a1421b22',
    name: 'determineBreakpoint 10.1',
    start_value: 800,
    end_value: 870,
    parent_id: '371e51fc-3d31-4735-891d-46c8a771c66c',
  },
  {
    id: 'dd1963ce-5197-41f1-b6f1-d99a0f052c2e',
    name: 'determineBreakpoint 10.2',
    start_value: 870,
    end_value: 890,
    parent_id: '371e51fc-3d31-4735-891d-46c8a771c66c',
  },

  // Level 11
  {
    id: '091e2ac0-4d44-4410-9781-314a3b75664b',
    name: 'determineBreakpoint 11.1',
    start_value: 800,
    end_value: 870,
    parent_id: '9088bee8-3850-4229-a122-b2b2a1421b22',
  },
  {
    id: '9f16f7dd-aefb-48fa-a544-7d080b4a588d',
    name: 'determineBreakpoint 11.2',
    start_value: 870,
    end_value: 890,
    parent_id: '9088bee8-3850-4229-a122-b2b2a1421b22',
  },
]
