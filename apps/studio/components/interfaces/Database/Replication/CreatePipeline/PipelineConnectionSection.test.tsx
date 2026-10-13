import { fireEvent, screen } from '@testing-library/react'
import { mockAnimationsApi } from 'jsdom-testing-mocks'
import { useForm } from 'react-hook-form'
import { Form } from 'ui'
import { describe, expect, it } from 'vitest'

import type { DestinationPanelSchemaType } from '../DestinationPanel/DestinationForm/DestinationForm.schema'
import type { DestinationType } from '../DestinationPanel/DestinationPanel.types'
import { PipelineConnectionSection } from './PipelineConnectionSection'
import { customRender } from '@/tests/lib/custom-render'

mockAnimationsApi()

const TestSection = ({ type }: { type: DestinationType }) => {
  const form = useForm<DestinationPanelSchemaType>({
    defaultValues: {
      name: '',
      connectionPoolSize: 5,
      maxStalenessMins: 0,
      ducklakePoolSize: 2,
      snowflakeRole: '',
    },
  })
  return (
    <Form {...form}>
      <PipelineConnectionSection type={type} form={form}>
        <p>Credentials</p>
      </PipelineConnectionSection>
    </Form>
  )
}

describe('PipelineConnectionSection', () => {
  it.each<{ type: DestinationType; label: string }>([
    { type: 'BigQuery', label: 'Connection pool size' },
    { type: 'DuckLake', label: 'Pool size' },
    { type: 'Snowflake', label: 'Role' },
  ])('groups $type connection fields separately from replication settings', ({ type, label }) => {
    customRender(<TestSection type={type} />)
    expect(screen.getByRole('region', { name: 'Destination connection' })).toBeInTheDocument()
    expect(screen.getByRole('textbox', { name: 'Pipeline name' })).toBeInTheDocument()
    expect(screen.getByText('Pipeline region')).toBeInTheDocument()
    expect(screen.getByText('Credentials')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /Connection advanced settings/ }))
    expect(screen.getByLabelText(label)).toBeInTheDocument()
    expect(screen.queryByText('Batch wait time')).not.toBeInTheDocument()
    expect(screen.queryByText('Table layout')).not.toBeInTheDocument()
  })

  it.each<DestinationType>(['ClickHouse', 'Analytics Bucket'])(
    'does not show an empty connection accordion for %s',
    (type) => {
      customRender(<TestSection type={type} />)
      expect(
        screen.queryByRole('button', { name: /Connection advanced settings/ })
      ).not.toBeInTheDocument()
    }
  )
})
