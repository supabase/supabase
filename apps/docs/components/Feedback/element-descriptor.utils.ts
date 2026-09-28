import { FEEDBACK_LIMITS, type FeedbackPin } from './feedback-schema'
import { toSafePathname } from './Feedback.utils'

export interface ElementSnapshot {
  tag: string
  attributes: ElementAttributes
  labelledByText?: string | null
  labelText?: string | null
  text: string
  region: ElementRegion
  isRedacted: boolean
  headingId: string | null
  headingText: string | null
  pathname: string
}

export type ElementRegion = 'content' | 'nav' | 'rail' | 'other'

export type ElementAttributes = Partial<
  Record<'aria-label' | 'role' | 'title' | 'alt' | 'id' | 'type' | 'contenteditable', string>
>

const MEANINGFUL_TAGS = new Set([
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'pre',
  'table',
  'img',
  'a',
  'button',
  'iframe',
  'video',
  'summary',
])

const MEANINGFUL_ROLES = new Set(['alert', 'button', 'link', 'tab', 'menuitem', 'img', 'table'])

const VALUE_BEARING_TAGS = new Set(['input', 'textarea', 'select', 'option'])

const VALUE_BEARING_ROLES = new Set(['combobox', 'listbox', 'option', 'textbox', 'searchbox'])

const IMPLICIT_ROLES = new Map(
  Object.entries({
    a: 'link',
    button: 'button',
    summary: 'button',
    pre: 'code',
    img: 'img',
    table: 'table',
    iframe: 'iframe',
    video: 'video',
    textarea: 'textbox',
    select: 'combobox',
    option: 'option',
    p: 'paragraph',
    li: 'listitem',
  })
)

const INPUT_ROLES = new Map(
  Object.entries({
    button: 'button',
    submit: 'button',
    reset: 'button',
    image: 'button',
    checkbox: 'checkbox',
    radio: 'radio',
    range: 'slider',
    search: 'searchbox',
  })
)

const ROLE_NOUNS = new Map(
  Object.entries({
    alert: 'callout',
    button: 'button',
    checkbox: 'checkbox',
    code: 'code block',
    combobox: 'dropdown',
    heading: 'heading',
    iframe: 'embed',
    img: 'image',
    link: 'link',
    listbox: 'list',
    listitem: 'list item',
    menuitem: 'menu item',
    option: 'option',
    paragraph: 'paragraph',
    radio: 'radio button',
    searchbox: 'field',
    slider: 'slider',
    switch: 'switch',
    tab: 'tab',
    table: 'table',
    textbox: 'field',
    video: 'video',
  })
)

export const isMeaningfulElement = ({
  tag,
  attributes,
}: Pick<ElementSnapshot, 'tag' | 'attributes'>): boolean =>
  MEANINGFUL_TAGS.has(tag.toLowerCase()) ||
  MEANINGFUL_ROLES.has(getExplicitRole(attributes) ?? '') ||
  Boolean(attributes.id)

export const describeElement = (snapshot: ElementSnapshot): FeedbackPin => {
  const tag = snapshot.tag.toLowerCase().slice(0, FEEDBACK_LIMITS.tag)
  const role = getRole(snapshot).slice(0, FEEDBACK_LIMITS.role)
  const pathname = toSafePathname(snapshot.pathname)

  if (snapshot.region === 'other') {
    return { tag, role, pathname, name: null, text: null, headingId: null, headingText: null }
  }

  const heading = {
    headingId:
      snapshot.headingId && snapshot.headingId.length <= FEEDBACK_LIMITS.headingId
        ? snapshot.headingId
        : null,
    headingText: normalizeText({ value: snapshot.headingText, max: FEEDBACK_LIMITS.headingText }),
  }

  if (snapshot.isRedacted) {
    return { tag, role, pathname, name: null, text: null, ...heading }
  }

  const { attributes } = snapshot
  const labelSources = [attributes['aria-label'], snapshot.labelledByText]

  if (isValueBearing({ tag, role, attributes })) {
    const name = findName([...labelSources, snapshot.labelText])
    return { tag, role, pathname, name, text: null, ...heading }
  }

  const name = findName([...labelSources, snapshot.text, attributes.title, attributes.alt])
  const text = normalizeText({ value: snapshot.text, max: FEEDBACK_LIMITS.text })

  return { tag, role, pathname, name, text, ...heading }
}

export const getRoleNoun = (role: string): string => ROLE_NOUNS.get(role) ?? 'element'

const getExplicitRole = (attributes: ElementAttributes): string | undefined =>
  attributes.role?.trim().split(/\s+/, 1)[0] || undefined

const getRole = ({ tag, attributes }: Pick<ElementSnapshot, 'tag' | 'attributes'>): string => {
  const explicitRole = getExplicitRole(attributes)
  if (explicitRole) return explicitRole

  const lowerTag = tag.toLowerCase()
  if (lowerTag === 'input')
    return INPUT_ROLES.get(attributes.type?.toLowerCase() ?? '') ?? 'textbox'
  if (isEditable(attributes)) return 'textbox'
  if (/^h[1-6]$/.test(lowerTag)) return 'heading'

  return IMPLICIT_ROLES.get(lowerTag) ?? 'generic'
}

const isEditable = (attributes: ElementAttributes) =>
  attributes.contenteditable !== undefined && attributes.contenteditable !== 'false'

const isValueBearing = ({
  tag,
  role,
  attributes,
}: {
  tag: string
  role: string
  attributes: ElementAttributes
}) => VALUE_BEARING_TAGS.has(tag) || VALUE_BEARING_ROLES.has(role) || isEditable(attributes)

const findName = (sources: Array<string | null | undefined>): string | null =>
  sources.reduce<string | null>(
    (name, value) => name ?? normalizeText({ value, max: FEEDBACK_LIMITS.name }),
    null
  )

const normalizeText = ({
  value,
  max,
}: {
  value: string | null | undefined
  max: number
}): string | null => {
  const normalized = (value ?? '')
    .replace(/[\u0000-\u001f\u007f]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  if (!normalized) return null
  if (normalized.length <= max) return normalized

  const cut = normalized.slice(0, max - 1)
  return `${/[\uD800-\uDBFF]$/.test(cut) ? cut.slice(0, -1) : cut}…`
}
