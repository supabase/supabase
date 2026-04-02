import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useForm } from 'react-hook-form'
import { Form_Shadcn_ } from 'ui'
import { describe, expect, it } from 'vitest'

import { CreateFunctionConfigParamsSection } from './CreateFunctionConfigParamsSection'

type ConfigParamsFormValues = {
  config_params: Array<{ name: string; value: string }>
}

const CreateFunctionConfigParamsHarness = () => {
  const form = useForm<ConfigParamsFormValues>({
    defaultValues: {
      config_params: [{ name: 'search_path', value: 'public' }],
    },
  })

  return (
    <Form_Shadcn_ {...form}>
      <CreateFunctionConfigParamsSection />
    </Form_Shadcn_>
  )
}

describe('CreateFunctionConfigParamsSection', () => {
  it('appends a new config parameter row with name and value fields', async () => {
    const user = userEvent.setup()

    render(<CreateFunctionConfigParamsHarness />)

    await user.click(screen.getByRole('button', { name: 'Add a new config' }))

    expect(screen.getAllByPlaceholderText('parameter_name')).toHaveLength(2)
    expect(screen.getAllByPlaceholderText('parameter_value')).toHaveLength(2)
  })

  it('removes an existing config parameter row', async () => {
    const user = userEvent.setup()

    render(<CreateFunctionConfigParamsHarness />)

    expect(screen.getByDisplayValue('search_path')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Remove configuration parameter' }))

    expect(screen.queryByDisplayValue('search_path')).not.toBeInTheDocument()
  })
})
