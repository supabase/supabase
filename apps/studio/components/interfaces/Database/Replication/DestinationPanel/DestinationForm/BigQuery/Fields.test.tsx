import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { useForm } from 'react-hook-form'
import { Form } from 'ui'
import { describe, expect, it, vi } from 'vitest'

import type { DestinationPanelSchemaType } from '../DestinationForm.schema'
import { BigQueryFields } from './Fields'

const TestForm = () => {
  const form = useForm<DestinationPanelSchemaType>({
    defaultValues: { serviceAccountKey: '' } as DestinationPanelSchemaType,
  })

  return (
    <Form {...form}>
      <BigQueryFields form={form} editMode={false} />
    </Form>
  )
}

describe('BigQueryFields', () => {
  it('imports a JSON file into an editable service account key field', async () => {
    const { container } = render(<TestForm />)
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
    render(<TestForm />)
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
})
