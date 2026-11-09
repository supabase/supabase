import { z } from 'zod'

/** What a notebook mutation (create, update, delete) reports back: the notebook it touched. */
export const notebookMutationOutputSchema = z.object({ id: z.string(), name: z.string() })
