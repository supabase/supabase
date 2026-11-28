import { act, fireEvent, render, screen } from '@testing-library/react'
import { FormProvider, useForm, UseFormReturn } from 'react-hook-form'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { DatabasePasswordInput } from './DatabasePasswordInput'
import { CreateProjectForm } from './ProjectCreation.schema'
import { passwordStrength } from '@/lib/password-strength'

vi.mock('@/lib/password-strength', () => ({
  passwordStrength: vi.fn(),
}))

vi.mock('@/lib/project', () => ({
  generateStrongPassword: vi.fn(() => 'GeneratedStrongPassword123!'),
}))

const defaultValues: CreateProjectForm = {
  organization: 'default-org',
  projectName: 'Default project',
  highAvailability: false,
  postgresVersion: '15',
  dbRegion: 'us-east-1',
  cloudProvider: 'AWS_K8S',
  dbPass: '',
  dbPassStrength: 0,
  dbPassStrengthMessage: '',
  dbPassStrengthWarning: '',
  dataApi: true,
  dataApiDefaultPrivileges: true,
  enableRlsEventTrigger: true,
  postgresVersionSelection: '15',
  useOrioleDb: false,
}

function deferredPasswordStrength() {
  let resolve!: (value: { warning: string; message: string; strength: 0 | 1 | 2 | 3 | 4 }) => void

  const promise = new Promise<{
    warning: string
    message: string
    strength: 0 | 1 | 2 | 3 | 4
  }>((res) => {
    resolve = res
  })

  return { promise, resolve }
}

describe('DatabasePasswordInput', () => {
  const mockedPasswordStrength = vi.mocked(passwordStrength)

  beforeEach(() => {
    mockedPasswordStrength.mockReset()
  })

  it('ignores stale password strength results when checks resolve out of order', async () => {
    const firstCheck = deferredPasswordStrength()
    const secondCheck = deferredPasswordStrength()
    let form!: UseFormReturn<CreateProjectForm>

    mockedPasswordStrength
      .mockReturnValueOnce(firstCheck.promise)
      .mockReturnValueOnce(secondCheck.promise)

    function TestComponent() {
      form = useForm<CreateProjectForm>({ defaultValues })

      return (
        <FormProvider {...form}>
          <DatabasePasswordInput form={form} />
        </FormProvider>
      )
    }

    render(<TestComponent />)

    const input = screen.getByPlaceholderText('Type in a strong password')
    fireEvent.change(input, { target: { value: 'first-password' } })
    fireEvent.change(input, { target: { value: 'second-password' } })

    await act(async () => {
      secondCheck.resolve({ warning: '', message: 'Strong password', strength: 4 })
      await secondCheck.promise
    })

    expect(form.getValues('dbPassStrength')).toBe(4)
    expect(form.getValues('dbPassStrengthMessage')).toBe('Strong password')

    await act(async () => {
      firstCheck.resolve({ warning: 'Too weak', message: 'Weak password', strength: 1 })
      await firstCheck.promise
    })

    expect(form.getValues('dbPassStrength')).toBe(4)
    expect(form.getValues('dbPassStrengthMessage')).toBe('Strong password')
    expect(form.getValues('dbPassStrengthWarning')).toBe('')
  })
})
