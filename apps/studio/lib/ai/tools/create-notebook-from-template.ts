import { z } from 'zod'

import { notebookMutationOutputSchema } from './notebook-mutation-output'
import type { ToolContract } from './types'
import {
  NOTEBOOK_TEMPLATE_IDS,
  NOTEBOOK_TEMPLATES,
} from '@/components/interfaces/Explorer/templates'

const inputSchema = z.object({
  template: z
    .enum(NOTEBOOK_TEMPLATE_IDS)
    .describe('The id of the Studio notebook template to add.'),
})

const templateList = NOTEBOOK_TEMPLATES.map(({ id, title }) => `\`${id}\` (${title})`).join(', ')

export const contract = {
  name: 'create_notebook_from_template',
  description: `Asks the user to add one of Studio's notebook templates to the project, exactly as Studio defines it. Requires user approval before creating. Templates: ${templateList}.`,
  inputSchema,
  outputSchema: notebookMutationOutputSchema,
  minOptInLevel: 'schema',
  availability: {
    environments: new Set(['platform']),
    requires: new Set(['explorer']),
  },
  needsApproval: true,
  promptGuidance: `- To add a notebook that matches one of Studio's templates, call \`create_notebook_from_template\` rather than writing its cells with \`create_notebook\`. The template's queries are maintained by Studio, so never retype them.`,
  toModelOutput: ({ id, name }) => ({ id, name }),
} as const satisfies ToolContract
