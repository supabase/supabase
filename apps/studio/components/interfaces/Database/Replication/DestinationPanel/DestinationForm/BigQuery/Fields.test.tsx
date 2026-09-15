import { fireEvent, screen, waitFor } from '@testing-library/react'
import { useForm } from 'react-hook-form'
import { Form } from 'ui'
import { describe, expect, it, vi } from 'vitest'

import type { DestinationPanelSchemaType } from '../DestinationForm.schema'
import { BigQueryFields } from './Fields'
import { customRender } from '@/tests/lib/custom-render'

const TestForm = ({ serviceAccountKey = '' }: { serviceAccountKey?: string }) => {
  const form = useForm<DestinationPanelSchemaType>({
    defaultValues: { projectId: '', datasetId: '', serviceAccountKey },
  })

  return (
    <Form {...form}>
      <BigQueryFields form={form} editMode={false} />
    </Form>
  )
}

describe('BigQueryFields', () => {
  it('imports a JSON file into an editable service account key field', async () => {
    const { container } = customRender(<TestForm />)
    const contents = '{"type":"service_account"}'
    const file = new File([contents], 'service-account.json', { type: 'application/json' })
    Object.defineProperty(file, 'text', { value: vi.fn().mockResolvedValue(contents) })

    const fileInput = container.querySelector<HTMLInputElement>('input[type="file"]')
    expect(fileInput).not.toBeNull()
    fireEvent.change(fileInput!, { target: { files: [file] } })

    const textarea = screen.getByPlaceholderText(
      '{"type": "service_account", "project_id": "...", ...}'
    )
    await waitFor(() => expect(textarea).toHaveValue(contents))

    fireEvent.change(textarea, { target: { value: `${contents}\n` } })
    expect(textarea).toHaveValue(`${contents}\n`)
    expect(textarea).toHaveClass('max-h-[calc(13lh+1rem)]')
  })

  it('imports a dropped JSON file into the service account key field', async () => {
    customRender(<TestForm />)
    const contents = '{"type":"service_account"}'
    const file = new File([contents], 'service-account.json', { type: 'application/json' })
    Object.defineProperty(file, 'text', { value: vi.fn().mockResolvedValue(contents) })

    const textarea = screen.getByPlaceholderText(
      '{"type": "service_account", "project_id": "...", ...}'
    )
    fireEvent.drop(textarea.closest('div')!, {
      dataTransfer: { files: [file] },
    })

    await waitFor(() => expect(textarea).toHaveValue(contents))
  })

  it('rejects an oversized file without replacing the existing key', async () => {
    const { container } = customRender(<TestForm serviceAccountKey="existing-key" />)
    const file = new File(['x'.repeat(5001)], 'service-account.json', {
      type: 'application/json',
    })
    const readFile = vi.fn()
    Object.defineProperty(file, 'text', { value: readFile })

    const fileInput = container.querySelector<HTMLInputElement>('input[type="file"]')
    fireEvent.change(fileInput!, { target: { files: [file] } })

    expect(
      await screen.findByText('Service account key must be 5,000 characters or fewer.')
    ).toBeInTheDocument()
    expect(readFile).not.toHaveBeenCalled()
    expect(screen.getByDisplayValue('existing-key')).toBeInTheDocument()
  })

  it('preserves the existing key when the selected file cannot be read', async () => {
    const { container } = customRender(<TestForm serviceAccountKey="existing-key" />)
    const file = new File(['{}'], 'service-account.json', { type: 'application/json' })
    Object.defineProperty(file, 'text', {
      value: vi.fn().mockRejectedValue(new Error('File read failed')),
    })

    const fileInput = container.querySelector<HTMLInputElement>('input[type="file"]')
    fireEvent.change(fileInput!, { target: { files: [file] } })

    expect(await screen.findByText('Could not read the selected JSON file.')).toBeInTheDocument()
    expect(screen.getByDisplayValue('existing-key')).toBeInTheDocument()
  })
})
