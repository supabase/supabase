# Supabase documentation style guide

Welcome to the documentation style guide. This is a living document that
serves as the evolving source of truth for:

- Our Supabase voice and our audience
- The structure of our technical documents
- How we consistently talk about our product

This guide is for everyone who is writing to help Supabase users. It
can be used by anyone who writes for Supabase, no matter your role or whether you are an employee or open
source contributor.

The style guide is also for both humans and LLMs: our [SKILLS](../CONTRIBUTING.md#write-the-docs-skills)
use the style guide, but the style guide is also human-readable and friendly. Much of this guide is dedicated to removing AI smells such as verbosity and overused
asides.

We encourage you to contribute to the style guide so that we write the best
documentation for Supabase. If something consistently bothers you, it may bother others as
well. That could be an inconsistently used term or an unnecessarily verbose writing
pattern. Open a style guide PR and start the discussion.

## Navigation

The files in the style guide are numbered in the order of content size. It starts with
the smallest piece, at the word level, then progresses to the sentence, the element,
and the whole page. `WORD_LIST` is unnumbered and a master document for our word
consistency decisions.

| File                                             | Covers                                             |
| ------------------------------------------------ | -------------------------------------------------- |
| [`WORD_LIST.md`](./WORD_LIST.md)                 | Terminology, spelling, capitalization              |
| [`01-voice-and-tone.md`](./01-voice-and-tone.md) | Person, tense, sentence length, brevity            |
| [`02-elements.md`](./02-elements.md)             | Admonitions, code blocks, procedures, tabs, images |
| [`03-page-structure.md`](./03-page-structure.md) | Document type, section grouping, chunking          |

## Before you open a pull request

Always run [`WORD_LIST.md`](./WORD_LIST.md) against the finished page. We removed any
linter and instead entrust you to use the word list.

You can run `/review-the-docs` for a local self-review, and `/test-the-docs` if the page
contains runnable snippets.

### If you drafted with an agent

Run a critic pass. Open a
subagent with a clean context, holding only the relevant guide files and the draft
text, and give it this instruction:

> Referencing the docs style guide, cite every rule violation in the draft. Quote
> the offending phrase and cite the rule it breaks as `file#anchor`, for example
> `03-page-structure.md#chunking`. Derive the anchor from the heading itself, and
> ignore headings inside fenced code blocks, which are examples rather than rules.
> Then resolve.

Each citation has to resolve to a real heading in the guide. One that doesn't is an invented rule, so check the citations before you act on them.

## References

- For spelling, see [Merriam-Webster.com](https://merriam-webster.com)
- For accessible writing, see [Google's accessibility guidance](https://developers.google.com/style/accessibility)
- For gaps, see [Google developer documentation style guide](https://developers.google.com/style)
- For an additional developer guide reference, see [Microsoft Writing Style Guide](https://learn.microsoft.com/en-us/style-guide/welcome/)
