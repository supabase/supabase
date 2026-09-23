import { fireEvent, screen, waitFor } from '@testing-library/react'
import { useForm } from 'react-hook-form'
import { Form } from 'ui'
import { describe, expect, it, vi } from 'vitest'

import type { DestinationPanelSchemaType } from '../DestinationForm.schema'
import { SnowflakeFields } from './Fields'
import { customRender } from '@/tests/lib/custom-render'

const PRIVATE_KEY = '-----BEGIN PRIVATE KEY-----\nprivate-key\n-----END PRIVATE KEY-----'

const TestForm = ({ snowflakePrivateKey = '' }: { snowflakePrivateKey?: string }) => {
  const form = useForm<DestinationPanelSchemaType>({
    defaultValues: { snowflakePrivateKey },
  })

  return (
    <Form {...form}>
      <SnowflakeFields form={form} editMode={false} />
    </Form>
  )
}

describe('SnowflakeFields', () => {
  it('imports a P8 file into an editable private key field', async () => {
    const { container } = customRender(<TestForm />)
    const file = new File([PRIVATE_KEY], 'rsa_key.p8', { type: 'application/x-pem-file' })
    Object.defineProperty(file, 'text', { value: vi.fn().mockResolvedValue(PRIVATE_KEY) })

    const fileInput = container.querySelector<HTMLInputElement>('input[type="file"]')
    expect(fileInput).not.toBeNull()
    fireEvent.change(fileInput!, { target: { files: [file] } })

    const textarea = screen.getByRole('textbox', { name: 'Private key' })
    await waitFor(() => expect(textarea).toHaveValue(PRIVATE_KEY))

    fireEvent.change(textarea, { target: { value: `${PRIVATE_KEY}\n` } })
    expect(textarea).toHaveValue(`${PRIVATE_KEY}\n`)
  })

  it('does not overwrite a manual edit when a file read resolves late', async () => {
    const { container } = customRender(<TestForm />)
    let resolveFileText!: (contents: string) => void
    const fileText = new Promise<string>((resolve) => {
      resolveFileText = resolve
    })
    const file = new File([PRIVATE_KEY], 'rsa_key.p8', { type: 'application/x-pem-file' })
    Object.defineProperty(file, 'text', { value: vi.fn(() => fileText) })

    const fileInput = container.querySelector<HTMLInputElement>('input[type="file"]')
    fireEvent.change(fileInput!, { target: { files: [file] } })

    const textarea = screen.getByRole('textbox', { name: 'Private key' })
    fireEvent.change(textarea, { target: { value: 'manual private key' } })
    resolveFileText(PRIVATE_KEY)

    await waitFor(() => expect(textarea).toHaveValue('manual private key'))
  })

  it('imports a dropped PEM private key file', async () => {
    customRender(<TestForm />)
    const file = new File([PRIVATE_KEY], 'rsa_key.pem', { type: 'application/x-pem-file' })
    Object.defineProperty(file, 'text', { value: vi.fn().mockResolvedValue(PRIVATE_KEY) })

    const textarea = screen.getByRole('textbox', { name: 'Private key' })
    fireEvent.drop(textarea.closest('div')!, { dataTransfer: { files: [file] } })

    await waitFor(() => expect(textarea).toHaveValue(PRIVATE_KEY))
  })

  it('rejects a public key file without replacing the private key', async () => {
    const { container } = customRender(<TestForm snowflakePrivateKey="existing-key" />)
    const publicKey = '-----BEGIN PUBLIC KEY-----\npublic-key\n-----END PUBLIC KEY-----'
    const file = new File([publicKey], 'rsa_key.pub', { type: 'application/x-pem-file' })
    Object.defineProperty(file, 'text', { value: vi.fn().mockResolvedValue(publicKey) })

    const fileInput = container.querySelector<HTMLInputElement>('input[type="file"]')
    fireEvent.change(fileInput!, { target: { files: [file] } })

    expect(await screen.findByText('Select a P8 or PEM private key.')).toBeInTheDocument()
    expect(screen.getByDisplayValue('existing-key')).toBeInTheDocument()
  })

  it.each([
    ['a key without an end marker', '-----BEGIN PRIVATE KEY-----\nprivate-key'],
    ['a key with an empty body', '-----BEGIN PRIVATE KEY-----\n   \n-----END PRIVATE KEY-----'],
  ])('rejects %s without replacing the private key', async (_, contents) => {
    const { container } = customRender(<TestForm snowflakePrivateKey="existing-key" />)
    const file = new File([contents], 'rsa_key.p8', { type: 'application/x-pem-file' })
    Object.defineProperty(file, 'text', { value: vi.fn().mockResolvedValue(contents) })

    const fileInput = container.querySelector<HTMLInputElement>('input[type="file"]')
    fireEvent.change(fileInput!, { target: { files: [file] } })

    expect(await screen.findByText('Select a P8 or PEM private key.')).toBeInTheDocument()
    expect(screen.getByDisplayValue('existing-key')).toBeInTheDocument()
  })
})
