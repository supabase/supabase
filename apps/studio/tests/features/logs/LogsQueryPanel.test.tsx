import { screen } from '@testing-library/react'
import { expect, test } from 'vitest'

import LogsQueryPanel from 'components/interfaces/Settings/Logs/LogsQueryPanel'
import { customRender } from 'tests/lib/custom-render'

test('run and clear', async () => {
  customRender(
    <LogsQueryPanel
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
