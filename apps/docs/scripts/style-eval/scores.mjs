/**
 * Score questions for the docs style evaluation.
 *
 * Each rubric is drawn from a named section of apps/docs/CONTRIBUTING.md, so a
 * low score points at guidance a writer can go read.
 */
export const scores = {
  informationTypes: {
    type: 'score',
    instructions:
      'The style guide asks writers to separate the six Information Mapping types, and to present each in the form that suits it. Rate how well the page separates procedure, process, structure, principle, concept, and fact. A single-sentence fact or principle is allowed to sit inside the section it qualifies.',
    criteria: [
      'poor: paragraphs routinely blend procedure, concept, and structure, and context interrupts the action path',
      'fair: some sections separate the types, but several paragraphs still carry two or more',
      'good: sections mostly hold one type, and the procedures run unbroken by background',
      'excellent: every section holds one type in a fitting presentation, and only single-sentence facts and principles ride along',
    ],
  },

  valueOpener: {
    type: 'score',
    instructions:
      'The style guide asks a guide to open with a value statement: name what the reader can do, and why it matters to them. Substantial background belongs in its own section or a separate explainer, cross-referenced rather than repeated. Rate the opening of the page.',
    criteria: [
      'poor: opens with background prose and never names what the reader can do',
      'fair: names the task, but only after several paragraphs of explanation',
      'good: opens by naming what the reader can do',
      'excellent: opens with what the reader can do and why it matters, and links out for the depth instead of repeating it',
    ],
  },

  sentenceClarity: {
    type: 'score',
    instructions:
      'The style guide asks for conversational English, short direct sentences that express one relationship at a time, and one topic per paragraph. Rate the prose. Ignore code blocks, frontmatter, and MDX component markup.',
    criteria: [
      'poor: long compound sentences, academic word choice, and paragraphs covering several topics',
      'fair: readable, but with recurring long sentences or needless words',
      'good: short direct sentences, one topic per paragraph',
      'excellent: conversational throughout, every sentence expresses one relationship, and no word is wasted',
    ],
  },

  readerAddress: {
    type: 'score',
    instructions:
      'The style guide asks writers to refer to the reader as "you", to reserve "we" for the Supabase team, and to use complete sentences that identify the actor and the action. Rate how the page addresses the reader.',
    criteria: [
      'poor: addresses the reader as "we", or leans on the passive voice to avoid naming an actor',
      'fair: mostly says "you", with occasional "we" or an unnamed actor',
      'good: consistently says "you", and reserves "we" for the Supabase team',
      'excellent: consistently says "you", reserves "we" for the Supabase team, and names the actor in every instruction',
    ],
  },

  styleMechanics: {
    type: 'score',
    instructions:
      'The style guide sets several mechanical rules: sentence case headings, the Oxford comma, the present tense, and American English. It also keeps important information out of parentheses, and asks that an aside longer than a few words becomes its own sentence rather than sitting in parentheses or between a pair of dashes. A brief acronym gloss, an "(Optional)" marker, and a short inline example are allowed. Parentheses required by Markdown link or code syntax do not count. Rate the page against those rules.',
    criteria: [
      'poor: title case headings, missing Oxford commas, future tense, and asides the reader must act on buried in parentheses or dashes',
      'fair: follows some of the rules, and breaks the rest more than once',
      'good: sentence case headings, Oxford commas, and the present tense, with a stray long parenthetical or dashed aside',
      'excellent: every rule holds, and parentheses carry only brief supplementary content',
    ],
  },

  terminology: {
    type: 'score',
    instructions:
      'The word list in the shared state sets the preferred spelling, capitalization, and usage for Supabase docs, in American English. Rate how closely the page follows it. Judge only terms the word list actually covers.',
    criteria: [
      'poor: repeatedly uses terms the word list rejects',
      'fair: a handful of terms depart from the word list',
      'good: follows the word list, with one or two slips',
      'excellent: every product name, capitalization, and term matches the word list',
    ],
  },
}
