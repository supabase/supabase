import { FlameGraph, FlameGraphDataItem } from 'ui-patterns'

export default function FlameGraphDemo() {
  return <FlameGraph data={data} title="flame graph (multiple root)" />
}

const data: FlameGraphDataItem[] = [
  {
    id: 'b37f9ec1-5432-48c8-9865-3fb4d3f92ce1',
    name: 'root 1',
    start_value: 0,
    end_value: 100,
    parent_id: '',
  },
  {
    id: 'b37f9ec1-5432-48c8-9865-3fb4d3f92ce2',
    name: 'root 2',
    start_value: 0,
    end_value: 100,
    parent_id: '',
  },
  {
    id: '5a34d0f2-1e87-4c3d-b4ef-c77a8bd9c591',
    name: 'renderUI',
    start_value: 0,
    end_value: 45,
    parent_id: 'b37f9ec1-5432-48c8-9865-3fb4d3f92ce2',
  },
  {
    id: '83bc9c50-1247-4b1d-a8c0-4e96b6c3f87d',
    name: 'processData',
    start_value: 45,
    end_value: 80,
    parent_id: 'b37f9ec1-5432-48c8-9865-3fb4d3f92ce2',
  },
  {
    id: '7e214c48-6a19-4e3a-9f3e-cb27c4b1792a',
    name: 'networkCalls',
    start_value: 80,
    end_value: 100,
    parent_id: 'b37f9ec1-5432-48c8-9865-3fb4d3f92ce2',
  },
]
