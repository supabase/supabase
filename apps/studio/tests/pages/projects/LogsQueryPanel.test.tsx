import { vi } from 'vitest'
import { screen } from '@testing-library/react'

import { render } from 'tests/helpers'
import LogsQueryPanel from 'components/interfaces/Settings/Logs/LogsQueryPanel'

test('run and clear', async () => {
  const mockRun = vi.fn()
  const mockClear = vi.fn()
  render(
    <LogsQueryPanel
      defaultFrom=""
      defaultTo=""
      isLoading={false}
      onDateChange={() => {}}
      onSelectSource={() => {}}
      onSelectTemplate={() => {}}
      warnings={[]}
      onClear={mockClear}
      hasEditorValue
      warehouseCollections={[]}
      dataSource="logs"
      onDataSourceChange={() => {}}
      templates={[]}
      warehouseTemplates={[]}
      onSelectWarehouseTemplate={() => {}}
    />
  )
  await expect(screen.findByPlaceholderText(/Search/)).rejects.toThrow()
})
