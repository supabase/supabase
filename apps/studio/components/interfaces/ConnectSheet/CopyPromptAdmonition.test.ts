import { describe, expect, test } from 'vitest'

import { buildConnectPrompt } from './CopyPromptAdmonition'

describe('buildConnectPrompt', () => {
  test('uses redacted copy values instead of temporarily visible passwords', () => {
    const container = document.createElement('div')
    container.innerHTML = `
      <div
        data-connect-step
        data-step-title="Connection string"
        data-step-description="Copy the connection details for your database."
      >
        <div data-step-content>
          <div
            data-connect-copy-value="postgresql://postgres:[YOUR-PASSWORD]@db.example.supabase.co:5432/postgres"
          >
            <pre>postgresql://postgres:temporary-password@db.example.supabase.co:5432/postgres</pre>
          </div>
        </div>
      </div>
    `

    const prompt = buildConnectPrompt(container)

    expect(prompt).toContain(
      'postgresql://postgres:[YOUR-PASSWORD]@db.example.supabase.co:5432/postgres'
    )
    expect(prompt).not.toContain('temporary-password')
  })
})
