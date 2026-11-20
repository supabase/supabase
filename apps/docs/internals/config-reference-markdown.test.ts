import { readFileSync } from 'node:fs'
import yaml from 'js-yaml'
import { describe, expect, it } from 'vitest'

import {
  CONFIG_REFERENCE_SPEC,
  renderConfigReferenceMarkdown,
  type ConfigSpec,
} from './config-reference-markdown'

const spec: ConfigSpec = {
  info: {
    description: 'Intro with a [link](/docs/guides/x).\n',
    tags: [
      { id: 'general', title: 'General' },
      { id: 'auth', title: 'Auth' },
    ],
  },
  parameters: [
    {
      id: 'auth.enabled',
      title: 'auth.enabled',
      summary: '',
      tags: ['auth'],
      required: false,
      default: true,
      description: 'Enables auth.\n',
      usage: '[auth]\nenabled = true\n',
      links: [{ name: 'Auth', link: '/docs/guides/auth' }],
    },
    {
      id: 'project_id',
      title: 'project_id',
      summary: '',
      tags: ['general'],
      required: true,
      description: 'Project name.\n',
    },
  ],
}

describe('renderConfigReferenceMarkdown', () => {
  it('should render parameters grouped by tag with both config formats', async () => {
    expect(renderConfigReferenceMarkdown(spec)).toMatchInlineSnapshot(`
      "# Supabase CLI config

      Intro with a [link](/docs/guides/x).

      ## General Config

      ### \`project_id\`

      | Name | Default | Required |
      | --- | --- | --- |
      | \`project_id\` | None | true |

      Project name.

      ## Auth Config

      ### \`auth.enabled\`

      | Name | Default | Required |
      | --- | --- | --- |
      | \`auth.enabled\` | true | false |

      Enables auth.

      **supabase/config.toml**

      \`\`\`toml
      [auth]
      enabled = true
      \`\`\`

      **supabase/config.jsonc**

      \`\`\`jsonc
      {
        "auth": {
          "enabled": true
        }
      }
      \`\`\`

      See also:

      - [Auth](/docs/guides/auth)
      "
    `)
  })

  it('should render every parameter in the config spec', async () => {
    const real = yaml.load(readFileSync(CONFIG_REFERENCE_SPEC, 'utf8')) as ConfigSpec
    const output = renderConfigReferenceMarkdown(real)

    for (const parameter of real.parameters) {
      expect(output).toContain(`### \`${parameter.title}\``)
    }
    expect(output.match(/```jsonc/g)).toHaveLength(
      real.parameters.filter((parameter) => parameter.usage).length
    )
  })
})
