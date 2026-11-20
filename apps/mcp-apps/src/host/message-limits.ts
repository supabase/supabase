/**
 * What Claude accepts in a message a view sends with `app.sendMessage`
 * (https://claude.com/docs/connectors/building/mcp-apps/send-messages): text
 * blocks only, none blank, at most 8,000 characters across all blocks plus one
 * for each block after the first, no more than three line breaks or 64 spaces
 * or tabs in a row. Claude can refuse a message that breaks one.
 */
export const CLAUDE_MESSAGE_MAX_CHARS = 8000

/** Collapses the runs of blank lines and of spaces or tabs that Claude refuses. Log lines often have them. */
export function tidyMessageText(text: string) {
  return text
    .replace(/(\r?\n){4,}/g, '\n\n\n')
    .replace(/[ \t]{65,}/g, (run) => run.slice(0, 64))
    .trim()
}

/**
 * The blocks of one message, made to fit what Claude accepts. Throws when
 * they are too long: cutting what the user chose to send would mislead the
 * agent, so the user is asked to send less instead.
 */
export function claudeMessageBlocks(texts: string[]) {
  const blocks = texts.map(tidyMessageText).filter(Boolean)
  const length = blocks.reduce((total, block) => total + block.length, 0) + blocks.length - 1
  if (length > CLAUDE_MESSAGE_MAX_CHARS)
    throw new Error(
      `Claude accepts messages of up to ${CLAUDE_MESSAGE_MAX_CHARS.toLocaleString('en-US')} characters, and this one has ${length.toLocaleString('en-US')}. Select less to send.`
    )
  return blocks
}
