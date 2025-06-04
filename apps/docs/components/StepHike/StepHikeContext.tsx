import { createContext } from 'react'

// Make sure the shape of the default value passed to
// createContext matches the shape that the consumers expect!
export const StepHikeContext = createContext<{
  activeStep: { titleId: string; step: number } | undefined
  steps: any[] | undefined
}>({
  activeStep: undefined,
  steps: undefined,
})
