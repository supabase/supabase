import { baseKeymap, chainCommands, setBlockType, toggleMark } from 'prosemirror-commands'
import { closeHistory, redo, undo } from 'prosemirror-history'
import {
  InputRule,
  inputRules,
  textblockTypeInputRule,
  undoInputRule,
  wrappingInputRule,
} from 'prosemirror-inputrules'
import { keymap } from 'prosemirror-keymap'
import type { MarkType } from 'prosemirror-model'
import { liftListItem, sinkListItem, splitListItem } from 'prosemirror-schema-list'
import { NodeSelection, type Command } from 'prosemirror-state'

import { isSafeLink } from '../markdown/parse'
import { markdownSchema as schema } from '../schema'

function markRule(pattern: RegExp, mark: MarkType, delimiter: number) {
  return new InputRule(pattern, (state, match, start, end) => {
    const token = match[1]
    const from = start + match[0].length - token.length
    const text = token.slice(delimiter, -delimiter)
    const tr = state.tr.replaceWith(from, end, schema.text(text, [mark.create()]))
    return tr.removeStoredMark(mark)
  })
}

const codeFence: Command = (state, dispatch) => {
  const { $from, empty } = state.selection
  if (!empty || !$from.parent.isTextblock || $from.parentOffset !== $from.parent.content.size)
    return false
  const match = /^```([\w+-]*)$/.exec($from.parent.textContent)
  if (!match) return false
  const index = $from.index(-1)
  if (!$from.node(-1).canReplaceWith(index, index + 1, schema.nodes.embedded_block)) return false
  if (dispatch) {
    const start = $from.before()
    const node = schema.nodes.embedded_block.create({ kind: 'code', language: match[1] })
    const tr = state.tr.replaceWith(start, $from.after(), node)
    dispatch(closeHistory(tr).setSelection(NodeSelection.create(tr.doc, start)).scrollIntoView())
  }
  return true
}

export function editingPlugins() {
  const rules = [
    textblockTypeInputRule(/^(#{1,6})\s$/, schema.nodes.heading, (match) => ({
      level: match[1].length,
    })),
    wrappingInputRule(/^>\s$/, schema.nodes.blockquote),
    wrappingInputRule(/^\s*[-+*]\s$/, schema.nodes.bullet_list),
    wrappingInputRule(
      /^(\d+)\.\s$/,
      schema.nodes.ordered_list,
      (match) => ({ order: Number(match[1]) }),
      (match, node) => node.childCount + node.attrs.order === Number(match[1])
    ),
    markRule(/(?:^|\s)(\*\*[^*]+\*\*)$/, schema.marks.strong, 2),
    markRule(/(?:^|\s)(__[^_]+__)$/, schema.marks.strong, 2),
    markRule(/(?:^|\s)(\*[^*]+\*)$/, schema.marks.em, 1),
    markRule(/(?:^|\s)(_[^_]+_)$/, schema.marks.em, 1),
    markRule(/(?:^|\s)(`[^`]+`)$/, schema.marks.code, 1),
    new InputRule(/\[([^\]]+)\]\(([^\s)]+)\)$/, (state, match, start, end) => {
      if (!isSafeLink(match[2])) return null
      return state.tr
        .replaceWith(
          start,
          end,
          schema.text(match[1], [schema.marks.link.create({ href: match[2] })])
        )
        .removeStoredMark(schema.marks.link)
    }),
  ]
  return [
    inputRules({ rules }),
    keymap({
      'Mod-z': chainCommands(undoInputRule, undo),
      'Shift-Mod-z': redo,
      'Mod-y': redo,
      Backspace: undoInputRule,
      'Mod-b': toggleMark(schema.marks.strong),
      'Mod-i': toggleMark(schema.marks.em),
      'Mod-`': toggleMark(schema.marks.code),
      'Mod-Alt-0': setBlockType(schema.nodes.paragraph),
      'Mod-Alt-1': setBlockType(schema.nodes.heading, { level: 1 }),
      'Mod-Alt-2': setBlockType(schema.nodes.heading, { level: 2 }),
      'Mod-Alt-3': setBlockType(schema.nodes.heading, { level: 3 }),
      'Mod-[': liftListItem(schema.nodes.list_item),
      'Mod-]': sinkListItem(schema.nodes.list_item),
      Enter: chainCommands(codeFence, splitListItem(schema.nodes.list_item), baseKeymap.Enter),
      'Shift-Enter': (state, dispatch) => {
        dispatch?.(state.tr.replaceSelectionWith(schema.nodes.hard_break.create()).scrollIntoView())
        return true
      },
    }),
    keymap(baseKeymap),
  ]
}
