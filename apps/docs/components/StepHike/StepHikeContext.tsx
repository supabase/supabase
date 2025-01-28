import { createContext, ReactNode } from 'react'

export interface Step {
  type: {
    name: string;
  };
  props: {
    title: string;
    children: ReactNode;
  };
}

export interface ActiveStep {
  titleId: string;
  step: number;
}

export interface StepHikeContextType {
  activeStep: ActiveStep | undefined;
  steps: Step[];
}

// Make sure the shape of the default value passed to
// createContext matches the shape that the consumers expect!
export const StepHikeContext = createContext<StepHikeContextType>({
  activeStep: undefined,
  steps: [],
})
