import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Fragment, useState } from 'react'
import { beforeEach, describe, expect, it } from 'vitest'

import { CommandProvider } from '../CommandProvider'
import type { ICommand } from '../types'
import { useCommands, useRegisterCommands } from './commandsHooks'

const oneCommand = [
  {
    id: 'command-one',
    name: 'Command one',
    action: () => alert('One!'),
  },
]

const twoCommands = [
  ...oneCommand,
  {
    id: 'command-two',
    name: 'Command two',
    action: () => alert('Two!'),
  },
]

let mockCommandMenuRenderCount = 0

const MockCommandMenu = () => {
  mockCommandMenuRenderCount++
  const commandSections = useCommands()

  return (
    <div>
      {commandSections.map((section) => (
        <Fragment key={section.id}>
          <h2>{section.name}</h2>
          <ul>
            {section.commands.map((cmd) => (
              <li key={cmd.id}>{cmd.name}</li>
            ))}
          </ul>
        </Fragment>
      ))}
    </div>
  )
}

const SimpleComponent = ({ commands }: { commands: Array<ICommand> }) => {
  useRegisterCommands('Section', commands)

  return <span>Simple</span>
}

const ToggledComponent = ({ commands }: { commands: Array<ICommand> }) => {
  const [visible, setVisible] = useState(true)

  return (
    <>
      <button onClick={() => setVisible((vis) => !vis)}>Toggle</button>
      {visible && <SimpleComponent commands={commands} />}
    </>
  )
}

const DisableableComponent = ({ commands }: { commands: Array<ICommand> }) => {
  const [enabled, setIsEnabled] = useState(true)
  useRegisterCommands('Section', commands, { enabled })

  return (
    <button onClick={() => setIsEnabled((enabled) => !enabled)}>
      {enabled ? 'Disable commands' : 'Enable commands'}
    </button>
  )
}

const ChangeableCommands = () => {
  const [commands, setCommands] = useState([{ ...twoCommands[0] }])
  useRegisterCommands('Section', commands, { deps: [commands] })

  return <button onClick={() => setCommands([{ ...twoCommands[1] }])}>Use second command</button>
}

const RerenderableComponent = () => {
  const [renderFlag, setRerenderFlag] = useState(0)

  // Define commands inline so the array identity changes each render
  const commands = [...oneCommand]
  useRegisterCommands('Section', commands) // Note no dependency array

  return (
    <>
      <button onClick={() => setRerenderFlag((flag) => ++flag)}>Rerender</button>
      <span>Render flag: {renderFlag}</span>
    </>
  )
}

describe('useRegisterCommand', () => {
  beforeEach(() => {
    mockCommandMenuRenderCount = 0
  })

  it('registers a command when component mounts', () => {
    render(
      <CommandProvider>
        <SimpleComponent commands={oneCommand} />
        <MockCommandMenu />
      </CommandProvider>
    )

    // @ts-ignore
    expect(screen.getByRole('heading')).toHaveTextContent('Section')
    expect(screen.getByRole('listitem')).toHaveTextContent('Command one')
  })

  it('registers multiple commands when component mounts', () => {
    render(
      <CommandProvider>
        <SimpleComponent commands={twoCommands} />
        <MockCommandMenu />
      </CommandProvider>
    )

    expect(screen.getByRole('heading')).toHaveTextContent('Section')

    const items = screen.getAllByRole('listitem')
    expect(items).toHaveLength(2)
    expect(items[0]).toHaveTextContent('Command one')
    expect(items[1]).toHaveTextContent('Command two')
  })

  it('unregisters and reregisters a command when component unmounts and remounts', async () => {
    act(() => {
      render(
        <CommandProvider>
          <ToggledComponent commands={oneCommand} />
          <MockCommandMenu />
        </CommandProvider>
      )
    })

    expect(screen.getByRole('listitem')).toHaveTextContent('Command one')

    act(() => {
      userEvent.click(screen.getByRole('button'))
    })
    await waitFor(() => {
      expect(screen.queryByRole('listitem')).toBeNull()
    })

    act(() => {
      userEvent.click(screen.getByRole('button'))
    })
    await waitFor(() => {
      expect(screen.getByRole('listitem')).toHaveTextContent('Command one')
    })
  })

  it('unregisters multiple commands when component unmounts', async () => {
    act(() => {
      render(
        <CommandProvider>
          <ToggledComponent commands={twoCommands} />
          <MockCommandMenu />
        </CommandProvider>
      )
    })

    expect(screen.getAllByRole('listitem')).toHaveLength(2)

    act(() => {
      userEvent.click(screen.getByRole('button'))
    })
    await waitFor(() => {
      expect(screen.queryAllByRole('listitem')).toHaveLength(0)
    })
  })

  it('unregisters and reregisters a command when enabled changes', async () => {
    act(() => {
      render(
        <CommandProvider>
          <DisableableComponent commands={oneCommand} />
          <MockCommandMenu />
        </CommandProvider>
      )
    })

    expect(screen.getByRole('listitem')).toHaveTextContent('Command one')

    act(() => {
      userEvent.click(screen.getByRole('button'))
    })
    await waitFor(() => {
      expect(screen.queryByRole('listitem')).toBeNull()
    })

    act(() => {
      userEvent.click(screen.getByRole('button'))
    })
    await waitFor(() => {
      expect(screen.getByRole('listitem')).toHaveTextContent('Command one')
    })
  })

  it('reregisters commands when dependencies change', async () => {
    act(() => {
      render(
        <CommandProvider>
          <ChangeableCommands />
          <MockCommandMenu />
        </CommandProvider>
      )
    })

    expect(screen.getByText('Command one')).toBeVisible()

    act(() => {
      userEvent.click(screen.getByRole('button'))
    })
    await waitFor(() => {
      expect(screen.queryByText('Command one')).toBeNull()
    })
    expect(screen.getByRole('listitem')).toHaveTextContent('Command two')
  })

  it("doesn't trigger command menu rerender when dependencies are unchanged", async () => {
    expect(mockCommandMenuRenderCount).toBe(0)

    act(() => {
      render(
        <CommandProvider>
          <RerenderableComponent />
          <MockCommandMenu />
        </CommandProvider>
      )
    })

    // React renders twice in dev mode
    expect(mockCommandMenuRenderCount).toBe(2)

    act(() => {
      userEvent.click(screen.getByRole('button'))
    })
    await waitFor(() => screen.getByText('Render flag: 1'))

    expect(mockCommandMenuRenderCount).toBe(2)
  })
})
