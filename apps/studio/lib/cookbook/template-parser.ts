import { RecipeContext } from 'types/cookbook'

/**
 * Parses template variables in the format {{context.variable}}, {{input.field}}, {{env.VAR}}
 * and replaces them with actual values from the provided context
 */
export function parseTemplateVariables(
  template: string,
  context: RecipeContext,
  inputValues?: Record<string, any>,
  envValues?: Record<string, string>
): string {
  let result = template

  // Replace {{context.variable}} patterns
  result = result.replace(/\{\{context\.([^}]+)\}\}/g, (match, path) => {
    const value = getNestedValue(context, path)
    return value !== undefined ? String(value) : match
  })

  // Replace {{input.field}} patterns
  if (inputValues) {
    result = result.replace(/\{\{input\.([^}]+)\}\}/g, (match, path) => {
      const value = getNestedValue(inputValues, path)
      return value !== undefined ? String(value) : match
    })
  }

  // Replace {{env.VAR}} patterns
  if (envValues) {
    result = result.replace(/\{\{env\.([^}]+)\}\}/g, (match, varName) => {
      const value = envValues[varName]
      return value !== undefined ? String(value) : match
    })
  }

  return result
}

/**
 * Gets a nested value from an object using dot notation
 * e.g., getNestedValue({ foo: { bar: 'baz' }}, 'foo.bar') returns 'baz'
 */
function getNestedValue(obj: Record<string, any>, path: string): any {
  return path.split('.').reduce((current, key) => {
    return current && current[key] !== undefined ? current[key] : undefined
  }, obj)
}

/**
 * Extracts all template variables from a string
 * Returns an array of objects with the variable type and path
 */
export function extractTemplateVariables(template: string): Array<{
  type: 'context' | 'input' | 'env'
  path: string
}> {
  const variables: Array<{ type: 'context' | 'input' | 'env'; path: string }> = []
  const regex = /\{\{(context|input|env)\.([^}]+)\}\}/g
  let match

  while ((match = regex.exec(template)) !== null) {
    variables.push({
      type: match[1] as 'context' | 'input' | 'env',
      path: match[2],
    })
  }

  return variables
}

/**
 * Validates if all required template variables are available in the context
 */
export function validateTemplateVariables(
  template: string,
  context: RecipeContext,
  inputValues?: Record<string, any>,
  envValues?: Record<string, string>
): { valid: boolean; missingVariables: string[] } {
  const variables = extractTemplateVariables(template)
  const missingVariables: string[] = []

  for (const variable of variables) {
    let value: any

    switch (variable.type) {
      case 'context':
        value = getNestedValue(context, variable.path)
        break
      case 'input':
        value = inputValues ? getNestedValue(inputValues, variable.path) : undefined
        break
      case 'env':
        value = envValues ? envValues[variable.path] : undefined
        break
    }

    if (value === undefined) {
      missingVariables.push(`{{${variable.type}.${variable.path}}}`)
    }
  }

  return {
    valid: missingVariables.length === 0,
    missingVariables,
  }
}
