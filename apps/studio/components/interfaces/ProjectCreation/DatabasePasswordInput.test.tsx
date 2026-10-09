import { FormProvider, useForm } from 'react-hook-form'
import { describe, expect, it } from 'vitest'

import { DatabasePasswordInput } from './DatabasePasswordInput'
import type { CreateProjectForm } from './ProjectCreation.schema'
import { customRender } from '@/tests/lib/custom-render'

const TestHarness = () => {
  const form = useForm<CreateProjectForm>({ defaultValues: { dbPass: '' } })
  return (
    <FormProvider {...form}>
      <DatabasePasswordInput form={form} />
    </FormProvider>
  )
}

describe('DatabasePasswordInput', () => {
  it('opts the database password field out of password-manager autofill', () => {
    customRender(<TestHarness />)

    const input = document.querySelector('input[type="password"]')
    expect(input).not.toBeNull()
    expect(input?.getAttribute('autocomplete')).toBe('new-password')
    expect(input?.hasAttribute('data-1p-ignore')).toBe(true)
    expect(input?.getAttribute('data-lpignore')).toBe('true')
    expect(input?.getAttribute('data-form-type')).toBe('other')
    expect(input?.hasAttribute('data-bwignore')).toBe(true)
  })
})
