import type { PGTable } from '@supabase/pg-meta'
import { fireEvent, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { mockAnimationsApi } from 'jsdom-testing-mocks'
import { HttpResponse } from 'msw'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { RowEditor, type RowEditorProps } from './RowEditor'
import { customRender } from '@/tests/lib/custom-render'
import { addAPIMock } from '@/tests/lib/msw'

mockAnimationsApi()

const table = {
  id: 1,
  schema: 'public',
  name: 'posts',
  primary_keys: [{ name: 'id' }],
  columns: [
    {
      id: '1.1',
      table: 'posts',
      schema: 'public',
      name: 'id',
      format: 'int8',
      is_identity: true,
      is_generated: false,
      is_nullable: false,
      default_value: null,
      comment: null,
      enums: [],
    },
    {
      id: '1.2',
      table: 'posts',
      schema: 'public',
      name: 'title',
      format: 'text',
      is_identity: false,
      is_generated: false,
      is_nullable: true,
      default_value: null,
      comment: null,
      enums: [],
    },
  ],
} as unknown as PGTable

const renderRowEditor = (props: Partial<RowEditorProps> = {}) =>
  customRender(
    <RowEditor
      selectedTable={table}
      visible
      closePanel={() => {}}
      saveChanges={() => {}}
      updateEditorDirty={() => {}}
      {...props}
    />
  )

const getInput = async (name: string) =>
  (await screen.findByTestId(`${name}-input`)) as HTMLInputElement | HTMLTextAreaElement

describe('RowEditor', () => {
  beforeEach(() => {
    addAPIMock({
      method: 'get',
      path: '/platform/projects/:ref',
      // @ts-expect-error partial project is enough for useSelectedProjectQuery
      response: {
        cloud_provider: 'localhost',
        id: 1,
        inserted_at: '2021-08-02T06:40:40.646Z',
        name: 'Default Project',
        organization_id: 1,
        ref: 'default',
        region: 'local',
        status: 'ACTIVE_HEALTHY',
      },
    })

    // Foreign key constraints lookup
    addAPIMock({
      method: 'post',
      path: '/platform/pg-meta/:ref/query',
      response: () => HttpResponse.json<unknown[]>([]),
    })
  })

  describe('duplicating a row', () => {
    it('opens as a new record seeded from the row, with the identity primary key cleared', async () => {
      renderRowEditor({ duplicateFrom: { id: 7, title: 'Hello world' } })

      expect(await getInput('title')).toHaveValue('Hello world')
      expect(await getInput('id')).toHaveValue('')
      expect(screen.getByText(/Add new row/i)).toBeInTheDocument()
    })

    it('inserts the copied values without the cleared primary key', async () => {
      const saveChanges = vi.fn()
      renderRowEditor({ duplicateFrom: { id: 7, title: 'Hello world' }, saveChanges })

      await getInput('title')
      fireEvent.click(screen.getByRole('button', { name: 'Save' }))

      await waitFor(() => expect(saveChanges).toHaveBeenCalled())
      const [payload, isNewRecord] = saveChanges.mock.calls[0]
      expect(isNewRecord).toBe(true)
      expect(payload).toEqual({ title: 'Hello world' })
    })
  })

  describe('create more', () => {
    const submitAndResolve = async (title: string, { keepValues }: { keepValues: boolean }) => {
      const user = userEvent.setup()
      const saveChanges = vi.fn(
        (_payload: unknown, _isNew: boolean, _config: unknown, resolve: () => void) => resolve()
      )
      renderRowEditor({ saveChanges })

      const titleInput = await getInput('title')
      await user.click(titleInput)
      await user.paste(title)

      await user.click(screen.getByLabelText('Create more'))
      if (keepValues) {
        await user.click(screen.getByRole('button', { name: 'Row creation options' }))
        await user.click(await screen.findByLabelText('Keep values for the next row'))
        await user.keyboard('{Escape}')
      }

      fireEvent.click(screen.getByRole('button', { name: 'Save' }))
      await waitFor(() => expect(saveChanges).toHaveBeenCalled())
      return titleInput
    }

    it('clears the form after saving by default', async () => {
      const titleInput = await submitAndResolve('First post', { keepValues: false })
      await waitFor(() => expect(titleInput).toHaveValue(''))
    })

    it('keeps the entered values after saving when "Keep values" is on', async () => {
      const titleInput = await submitAndResolve('First post', { keepValues: true })
      // Let the resolve callback run its state updates before asserting nothing was cleared
      await waitFor(() => expect(screen.getByRole('button', { name: 'Save' })).toBeEnabled())
      expect(titleInput).toHaveValue('First post')
    })

    it('shows the row creation options only while Create more is on', async () => {
      const user = userEvent.setup()
      renderRowEditor()
      await getInput('title')

      expect(screen.queryByRole('button', { name: 'Row creation options' })).not.toBeInTheDocument()
      await user.click(screen.getByLabelText('Create more'))
      expect(screen.queryByText('Row creation options')).not.toBeInTheDocument()
      await user.click(await screen.findByRole('button', { name: 'Row creation options' }))
      expect(await screen.findByText('Row creation options')).toBeInTheDocument()
      expect(screen.getByLabelText('Keep values for the next row')).not.toBeChecked()
    })
  })
})
