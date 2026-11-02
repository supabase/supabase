import { fireEvent, screen } from '@testing-library/react'
import { useForm } from 'react-hook-form'
import { Button } from 'ui'
import { describe, expect, it } from 'vitest'

import type { DestinationPanelSchemaType } from '../DestinationPanel/DestinationForm/DestinationForm.schema'
import type { DestinationType } from '../DestinationPanel/DestinationPanel.types'
import { PipelineDestinationReview } from './PipelineDestinationReview'
import { customRender } from '@/tests/lib/custom-render'

const catalogUrl = 'postgres://user:catalog-password@catalog.example/postgres?token=secret'
const defaults = {
  name: 'Analytics',
  projectId: 'warehouse-project',
  datasetId: 'dataset',
  serviceAccountKey: 'private-service-account',
  ducklakeMode: 'custom',
  ducklakeCatalogUrl: catalogUrl,
  ducklakeDataPath: 's3://warehouse/data',
  ducklakeS3SecretAccessKey: 'private-s3-key',
  ducklakeStorageBucket: 'lake-bucket',
  snowflakeAccountId: 'my-account',
  snowflakeDatabase: 'warehouse',
  snowflakeSchema: 'PUBLIC',
  snowflakePrivateKey: 'private-snowflake-key',
  clickhouseUrl: 'https://user:password@cluster.example',
  clickhouseDatabase: 'events',
  clickhouseEngine: 'merge_tree',
  clickhousePassword: 'private-password',
  warehouseName: 'bucket',
  namespace: 'namespace',
} satisfies Partial<DestinationPanelSchemaType>

const TestReview = ({
  type,
  values = defaults,
}: {
  type: DestinationType
  values?: Partial<DestinationPanelSchemaType>
}) => {
  const form = useForm<DestinationPanelSchemaType>({ defaultValues: values })
  return (
    <>
      <PipelineDestinationReview type={type} control={form.control} />
      <Button
        onClick={() =>
          form.setValue('ducklakeCatalogUrl', 'postgres://new:secret@other.example/db')
        }
      >
        Change URL
      </Button>
      <Button onClick={() => form.setValue('name', 'Updated name')}>Change name</Button>
    </>
  )
}

describe('PipelineDestinationReview', () => {
  it.each<{ type: DestinationType; details: string[] }>([
    { type: 'BigQuery', details: ['warehouse-project', 'dataset'] },
    { type: 'DuckLake', details: ['s3://warehouse/data'] },
    { type: 'Snowflake', details: ['my-account', 'warehouse', 'PUBLIC'] },
    { type: 'ClickHouse', details: ['events', 'MergeTree'] },
    { type: 'Analytics Bucket', details: ['bucket', 'namespace'] },
  ])('shows $type details without credentials', ({ type, details }) => {
    const { container } = customRender(<TestReview type={type} />)
    expect(screen.getByDisplayValue('Analytics')).toHaveAttribute('readonly')
    for (const detail of details) expect(screen.getByDisplayValue(detail)).toBeInTheDocument()
    for (const secret of [
      'private-service-account',
      'private-s3-key',
      'private-snowflake-key',
      'private-password',
      catalogUrl,
      defaults.clickhouseUrl,
    ]) {
      expect(container.innerHTML).not.toContain(secret)
    }
    expect(screen.getByText('Pipeline region')).toBeInTheDocument()
  })

  it('reveals and hides the entire catalog URL and remasks a changed URL', () => {
    const { container } = customRender(<TestReview type="DuckLake" />)
    fireEvent.click(screen.getByRole('button', { name: 'Show catalog URL' }))
    expect(screen.getByDisplayValue(catalogUrl)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Hide catalog URL' }))
    expect(container.innerHTML).not.toContain(catalogUrl)
    fireEvent.click(screen.getByRole('button', { name: 'Show catalog URL' }))
    fireEvent.click(screen.getByRole('button', { name: 'Change URL' }))
    expect(screen.getByRole('button', { name: 'Show catalog URL' })).toBeInTheDocument()
    expect(container.innerHTML).not.toContain('new:secret')
  })

  it('shows Supabase DuckLake bucket details and updates live form values', () => {
    customRender(<TestReview type="DuckLake" values={{ ...defaults, ducklakeMode: 'supabase' }} />)
    expect(screen.getByDisplayValue('lake-bucket')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Show catalog URL' })).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Change name' }))
    expect(screen.getByDisplayValue('Updated name')).toBeInTheDocument()
  })

  it('masks a ClickHouse URL containing credentials until explicitly revealed', () => {
    const { container } = customRender(<TestReview type="ClickHouse" />)
    const button = screen.getByRole('button', { name: 'Show HTTPS endpoint' })
    expect(button).toHaveAttribute('type', 'button')
    fireEvent.click(button)
    expect(screen.getByDisplayValue(defaults.clickhouseUrl)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Hide HTTPS endpoint' }))
    expect(container.innerHTML).not.toContain(defaults.clickhouseUrl)
  })

  it('shows missing values without exposing inactive destination details', () => {
    customRender(<TestReview type="BigQuery" values={{ name: 'Analytics' }} />)
    expect(screen.getAllByDisplayValue('Not set')).toHaveLength(2)
    expect(screen.queryByText('Catalog URL')).not.toBeInTheDocument()
  })
})

it('includes custom settings in Connection without a separate heading', () => {
  customRender(
    <TestReview
      type="BigQuery"
      values={{ ...defaults, connectionPoolSize: 3, maxStalenessMins: 10 }}
    />
  )
  expect(screen.getByLabelText('Connection pool size')).toHaveValue('3')
  expect(screen.getByLabelText('Maximum staleness')).toHaveValue('10 minutes')
  expect(
    screen.getByText('Number of BigQuery connections used for destination writes.')
  ).toBeInTheDocument()
  expect(
    screen.getByText('Maximum age of BigQuery query results for newly created or recreated tables.')
  ).toBeInTheDocument()
  expect(screen.queryByText('Custom connection settings')).not.toBeInTheDocument()
})
