import { act, fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { QuerySqlEditor } from './index'

let editorProps: Record<string, any> = {}

vi.mock('@monaco-editor/react', () => ({
  default: (props: Record<string, any>) => {
    editorProps = props
    return (
      <textarea
        aria-label={props.options?.ariaLabel}
        readOnly={props.options?.readOnly}
        value={props.value}
        onChange={(event) => props.onChange?.(event.currentTarget.value, {})}
      />
    )
  },
}))

describe('QuerySqlEditor', () => {
  beforeEach(() => {
    editorProps = {}
  })

  it('is controlled and forwards editor state without owning persistence', () => {
    const onValueChange = vi.fn()

    render(
      <QuerySqlEditor
        value="select 1"
        readOnly
        hideLineNumbers
        ariaLabel="Notebook SQL"
        onValueChange={onValueChange}
      />
    )

    const editor = screen.getByRole('textbox', { name: 'Notebook SQL' })
    expect(editor).toHaveValue('select 1')
    expect(editor).toHaveAttribute('readonly')
    expect(editorProps.options).toMatchObject({
      lineNumbers: 'off',
      minimap: { enabled: false },
      padding: { top: 8, bottom: 8 },
      readOnly: true,
    })

    fireEvent.change(editor, { target: { value: 'select 2' } })
    expect(onValueChange).toHaveBeenCalledWith('select 2')
  })

  it('uses compact, balanced editor spacing by default', () => {
    render(<QuerySqlEditor value="select 1" />)

    expect(editorProps.options).toMatchObject({
      lineNumbersMinChars: 3,
      padding: { top: 8, bottom: 8 },
    })
  })

  it('emits the selection for run and falls back to the whole document', () => {
    const onExecute = vi.fn()
    const addAction = vi.fn()
    const getValueInRange = vi.fn().mockReturnValue('  select selected  ')
    const fakeEditor = {
      addAction,
      focus: vi.fn(),
      getModel: () => ({ getValueInRange }),
      getSelection: () => ({ startLineNumber: 1 }),
      getValue: () => 'select everything',
    }
    const fakeMonaco = {
      KeyCode: { Enter: 3 },
      KeyMod: { CtrlCmd: 2048 },
    }

    render(<QuerySqlEditor id="explorer-1" value="select everything" onExecute={onExecute} />)

    act(() => editorProps.onMount(fakeEditor, fakeMonaco))

    const action = addAction.mock.calls[0][0]
    expect(action).toMatchObject({ id: 'run-query-explorer-1', label: 'Run query' })

    act(() => action.run())
    expect(onExecute).toHaveBeenLastCalledWith('select selected')

    getValueInRange.mockReturnValue('   ')
    act(() => action.run())
    expect(onExecute).toHaveBeenLastCalledWith('select everything')
  })
})
