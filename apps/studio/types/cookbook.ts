export interface CookbookRecipe {
  name: string
  title: string
  description: string
  version: string
  steps: RecipeStep[]
}

export type RecipeStep = InputStep | SqlStep | EdgeFunctionStep | EnvStep

export interface BaseStep {
  name: string
  title: string
  description: string
  type: 'input' | 'sql' | 'edge_function' | 'env'
}

export interface InputStep extends BaseStep {
  type: 'input'
  description: string
  input: {
    fields: Record<string, InputField>
  }
  output: Record<string, string>
}

export interface InputField {
  label: string
  inputType: 'string' | 'select' | 'number' | 'password'
  required?: boolean
  default?: string
  options?: string[]
}

export interface SqlStep extends BaseStep {
  type: 'sql'
  description: string
  run: {
    content: string
  }
  output?: Record<string, string>
}

export interface EdgeFunctionStep extends BaseStep {
  type: 'edge_function'
  description: string
  run: {
    deploy: {
      name: string
      path: string
    }
    content: string
  }
  output?: Record<string, string>
}

export interface EnvStep extends BaseStep {
  type: 'env'
  description: string
  input: {
    fields: Record<string, InputField>
  }
  run: {
    env: Record<string, string>
    vault?: Record<string, string>
  }
}

export type StepStatus = 'pending' | 'running' | 'success' | 'error'

export interface StepExecutionState {
  status: StepStatus
  error?: string
  result?: any
}

export interface RecipeContext {
  [key: string]: any
}
