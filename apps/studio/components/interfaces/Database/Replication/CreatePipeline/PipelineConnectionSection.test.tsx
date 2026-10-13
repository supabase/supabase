import { fireEvent, screen } from '@testing-library/react'
import { mockAnimationsApi } from 'jsdom-testing-mocks'
import { useForm } from 'react-hook-form'
import { Form } from 'ui'
import { describe, expect, it, vi } from 'vitest'

import { AdvancedSettings } from '../DestinationPanel/DestinationForm/AdvancedSettings'
import type { DestinationPanelSchemaType } from '../DestinationPanel/DestinationForm/DestinationForm.schema'
import type { DestinationType } from '../DestinationPanel/DestinationPanel.types'
import { PipelineConnectionSection } from './PipelineConnectionSection'
import { customRender } from '@/tests/lib/custom-render'

vi.mock('../DestinationPanel/DestinationForm/BigQuery/TableOptions', () => ({
  TableOptions: () => <p>Table layout controls</p>,
}))

mockAnimationsApi()

const TestSection = ({
  type,
  group = 'connection',
}: {
  type: DestinationType
  group?: 'connection' | 'data'
}) => {
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
      {group === 'data' ? (
        <AdvancedSettings type={type} form={form} group="data" />
      ) : (
        <PipelineConnectionSection type={type} form={form}>
          <p>Credentials</p>
        </PipelineConnectionSection>
      )}
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
    fireEvent.click(screen.getByRole('button', { name: /Advanced settings/ }))
    expect(screen.getByText(`Adjust how data is written to ${type}.`)).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /Advanced settings/ }).closest('.border-t')
    ).toHaveClass('border-t', 'border-default')
    expect(screen.getByLabelText(label)).toBeInTheDocument()
    expect(screen.queryByText('Batch wait time')).not.toBeInTheDocument()
    expect(screen.queryByText('Table layout')).not.toBeInTheDocument()
  })

  it.each<DestinationType>(['BigQuery', 'DuckLake', 'Snowflake'])(
    'keeps %s data settings separate from connection settings',
    (type) => {
      customRender(<TestSection type={type} group="data" />)
      fireEvent.click(screen.getByRole('button', { name: /Advanced settings/ }))
      for (const label of [
        'Batch wait time',
        'Table sync workers',
        'Initial sync connections per table',
        'Invalidated slot behavior',
      ]) {
        expect(screen.getByText(label)).toBeInTheDocument()
      }
      expect(
        screen.getByText('Adjust initial sync and replication slot behavior.')
      ).toBeInTheDocument()
      for (const label of ['Connection pool size', 'Maximum staleness', 'Pool size', 'Role']) {
        expect(screen.queryByText(label)).not.toBeInTheDocument()
      }
      expect(screen.queryByText('Table layout controls') !== null).toBe(type === 'BigQuery')
      expect(
        screen.getByRole('button', { name: /Advanced settings/ }).closest('.border-t')
      ).toHaveClass('border-default')
    }
  )

  it.each<DestinationType>(['ClickHouse', 'Analytics Bucket'])(
    'does not show an empty connection accordion for %s',
    (type) => {
      customRender(<TestSection type={type} />)
      expect(screen.queryByRole('button', { name: /Advanced settings/ })).not.toBeInTheDocument()
    }
  )
})
