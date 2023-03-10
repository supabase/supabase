import { createContext } from 'react'
import { RadioGroupProps } from './Radio'

interface RadioContext extends Pick<RadioGroupProps, 'name'> {
  type: NonNullable<RadioGroupProps['type']>
  parentCallback: (event: React.ChangeEvent<HTMLInputElement>) => void
  activeId: string
  parentSize: string
}

// Make sure the shape of the default value passed to
// createContext matches the shape that the consumers expect!
export const RadioContext = createContext<RadioContext>({
  parentCallback: (e: React.ChangeEvent<HTMLInputElement>) => {},
  type: 'list',
  name: '',
  activeId: '',
  parentSize: '',
})
