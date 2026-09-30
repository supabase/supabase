// type, instructions, and criteria are sent to Jev as written. Answers below the
// thresholds are stored as NULL.
export type SmartColumn = { instructions: unknown } & (
  | { type: 'choice'; criteria: Record<string, string>; minConfidence?: number }
  | {
      type: 'noul'
      criteria?: { true: string; false: string }
      falseBelow?: number
      trueAbove?: number
    }
  | { type: 'score'; criteria: string[]; minConfidence?: number }
)

export type SmartTable = {
  // As you would write it in SQL, for example 'public.feedback'.
  table: string
  inputs: string[]
  columns: Record<string, SmartColumn>
}

type Output = string | number | boolean | null
type Answer =
  | { output: Output; probability: number }
  | {
      output: Output
      value: string | number
      confidence: number
      probabilities: Record<string, number>
    }

function unit(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 1
}

function object(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    throw new Error('Invalid Jev response.')
  return value as Record<string, unknown>
}

export function validateTables(tables: SmartTable[]): void {
  const names = new Set<string>()
  for (const { table, inputs, columns } of tables) {
    if (names.has(table)) throw new Error(`Duplicate table: ${table}`)
    names.add(table)
    if (!inputs.length || !Object.keys(columns).length)
      throw new Error(`${table} needs input and output columns.`)
    for (const [name, column] of Object.entries(columns)) {
      if (inputs.includes(name)) throw new Error(`${name} cannot be both an input and an output.`)
      if (!column.instructions) throw new Error(`${name} needs instructions.`)
      if (column.type === 'noul') {
        const low = column.falseBelow ?? 0.2
        const high = column.trueAbove ?? 0.8
        if (!unit(low) || !unit(high) || low >= high)
          throw new Error(`Invalid thresholds for ${name}.`)
        continue
      }
      if (!unit(column.minConfidence ?? 0.7)) throw new Error(`Invalid minConfidence for ${name}.`)
      const count =
        column.type === 'choice' ? Object.keys(column.criteria).length : column.criteria.length
      const [min, max] = column.type === 'choice' ? [2, 255] : [2, 10]
      if (count < min || count > max)
        throw new Error(`${name} needs between ${min} and ${max} criteria.`)
    }
  }
}

export function questionsFor(columns: Record<string, SmartColumn>): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(columns).map(([name, { type, instructions, criteria }]) => [
      name,
      criteria === undefined ? { type, instructions } : { type, instructions, criteria },
    ])
  )
}

// Changes when an output's inputs, instructions, thresholds, or the model change.
export async function fingerprint(
  model: string,
  input: Record<string, unknown>,
  column: SmartColumn
): Promise<string> {
  const digest = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(JSON.stringify([model, input, column]))
  )
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('')
}

// Validates Jev's answers and applies each column's thresholds.
export function decodeAnswers(columns: Record<string, SmartColumn>, response: unknown) {
  const result = object(response)
  const answers = object(result.answers)
  if (typeof result.model !== 'string') throw new Error('Jev response is missing its model.')
  const outputs: Record<string, Output> = Object.create(null)
  const details: Record<string, Answer> = Object.create(null)

  for (const [name, column] of Object.entries(columns)) {
    const answer = object(answers[name])
    if (column.type === 'noul') {
      if (answer.type !== 'noul' || !unit(answer.noul))
        throw new Error(`Invalid probability for ${name}.`)
      outputs[name] =
        answer.noul <= (column.falseBelow ?? 0.2)
          ? false
          : answer.noul >= (column.trueAbove ?? 0.8)
            ? true
            : null
      details[name] = { output: outputs[name], probability: answer.noul }
      continue
    }

    const probabilities = object(answer.probabilities)
    const expected =
      column.type === 'choice'
        ? Object.keys(column.criteria)
        : column.criteria.map((_, index) => String(index))
    if (
      !unit(answer.confidence) ||
      Object.keys(probabilities).length !== expected.length ||
      expected.some((key) => !Object.hasOwn(probabilities, key) || !unit(probabilities[key]))
    ) {
      throw new Error(`Invalid distribution for ${name}.`)
    }
    if (
      Math.abs(
        Object.values(probabilities).reduce<number>((sum, value) => sum + (value as number), 0) - 1
      ) > 0.01
    ) {
      throw new Error(`Invalid probability total for ${name}.`)
    }
    let value: string | number
    if (column.type === 'choice') {
      if (
        answer.type !== 'choice' ||
        typeof answer.choice !== 'string' ||
        !Object.hasOwn(column.criteria, answer.choice)
      )
        throw new Error(`Invalid choice for ${name}.`)
      value = answer.choice
    } else {
      if (
        answer.type !== 'score' ||
        typeof answer.score !== 'number' ||
        !Number.isFinite(answer.score) ||
        answer.score < 0 ||
        answer.score > column.criteria.length - 1
      )
        throw new Error(`Invalid score for ${name}.`)
      value = answer.score
    }
    outputs[name] = answer.confidence >= (column.minConfidence ?? 0.7) ? value : null
    details[name] = {
      output: outputs[name],
      value,
      confidence: answer.confidence,
      probabilities: probabilities as Record<string, number>,
    }
  }
  return { outputs, details, model: result.model }
}
