import { screen } from '@testing-library/react'
import { expect, test } from 'vitest'

import LogsQueryPanel from 'components/interfaces/Settings/Logs/LogsQueryPanel'
import { render } from 'tests/helpers'

test('run and clear', async () => {
  render(
    <LogsQueryPanel
      defaultFrom=""
      defaultTo=""
      onDateChange={() => {}}
      onSelectSource={() => {}}
      onSelectTemplate={() => {}}
      warnings={[]}
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
