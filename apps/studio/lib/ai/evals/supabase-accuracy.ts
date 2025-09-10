import { LLMClassifierFromTemplate } from 'autoevals'

/**
 * Generic Supabase accuracy classifier (1–5).
 *
 * Purpose: Judge whether the model output solves the input task while
 * matching the facts of the provided correct answer. Produces a score 1–5.
 *
 * Usage: Add to an Eval's `scores` array alongside other metrics.
 * Requires data items to include `input`, `output`, and `expected`.
 */
export const SupabaseAccuracy = LLMClassifierFromTemplate({
  name: 'Supabase Accuracy (1-5)',
  promptTemplate: `
You are an expert Supabase engineer (Postgres, SQL, RLS, Edge Functions, Auth, Storage).

Evaluate the assistant's Output against the task (Input) and the reference solution (Expected).
Score based on factual correctness and task completion relative to the Input, and
whether the Output follows any explicitly stated or commonly expected Supabase
guidelines for the task. Prefer alignment with Expected's facts over formatting.
Do not penalize superficial style (naming/whitespace) unless the task or guidelines
explicitly require a format or convention.

Rubric (choose exactly one integer):
1 = Incorrect or unrelated; does not solve the task or contradicts Expected.
2 = Partially correct or incomplete; significant errors/omissions; not acceptable.
3 = Correct with minor issues; solves the task; small non-breaking mistakes.
4 = Factually correct but style/guidelines were not followed (e.g., response was too long or too short).
5 = Fully correct and follows required guidelines; solves the task; facts match Expected.

Input:
{{input}}

Expected (reference facts):
{{expected}}

Output (to grade):
{{output}}

Respond with ONLY one of: 1, 2, 3, 4, or 5.`,
  choiceScores: { 1: 0, 2: 0.4, 3: 0.6, 4: 0.8, 5: 1 },
  temperature: 0,
  useCoT: true,
  model: 'gpt-4o-mini',
})
