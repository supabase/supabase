import { ReactNode, useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Editor, Extension, Range } from '@tiptap/core'
import { ReactRenderer } from '@tiptap/react'
import Suggestion, { SuggestionOptions } from '@tiptap/suggestion'
import {
  BarChart,
  Code,
  Database,
  Heading1,
  Heading2,
  Heading3,
  ImageIcon,
  List,
  ListOrdered,
  Minus,
  SeparatorHorizontal,
  Text,
  TextQuote,
} from 'lucide-react'
import tippy, { GetReferenceClientRect } from 'tippy.js'

function cn(...classes: string[]) {
  return classes.filter(Boolean).join(' ')
}

type SlashCommandItem = {
  title: string
  searchTerms: string[]
  icon: ReactNode
  command: (options: CommandProps) => void
}

interface CommandItemProps {
  title: string
  description: string
  icon: ReactNode
}

interface CommandProps {
  editor: Editor
  range: Range
}

export const SlashCommand = Extension.create({
  name: 'slash-command',
  addOptions() {
    return {
      suggestion: {
        char: '/',
        command: ({ editor, range, props }: { editor: Editor; range: Range; props: any }) => {
          props.command({ editor, range })
        },
      },
    }
  },
  addProseMirrorPlugins() {
    return [
      Suggestion({
        editor: this.editor,
        ...this.options.suggestion,
      }),
    ]
  },
})

const iconClassNames = 'h-3.5 w-3.5 text-zinc-500'

const DEFAULT_SLASH_COMMANDS: SlashCommandItem[] = [
  {
    title: 'SQL Table',
    searchTerms: ['sql', 'table'],
    icon: <Database className={iconClassNames} />,
    command: ({ editor, range }: CommandProps) => {
      editor
        .chain()
        .focus()
        .deleteRange(range)
        .insertContent("<supa-block type='table' sql='SELECT * FROM customers'></sql-table><p></p>")
        .run()
    },
  },
  {
    title: 'Chart',
    searchTerms: ['sql', 'chart'],
    icon: <BarChart className={iconClassNames} />,
    command: ({ editor, range }: CommandProps) => {
      editor
        .chain()
        .focus()
        .deleteRange(range)
        .insertContent(
          "<supa-block type='chart' sql='SELECT * FROM customers'></supa-chart><p></p>"
        )
        .run()
    },
  },
  {
    title: 'Paragraph',
    searchTerms: ['p', 'paragraph'],
    icon: <Text className={iconClassNames} />,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleNode('paragraph', 'paragraph').run()
    },
  },
  {
    title: 'Heading 1',
    searchTerms: ['title', 'h1', 'h2', 'h3', 'heading', 'header'],
    icon: <Heading1 className={iconClassNames} />,
    command: ({ editor, range }: CommandProps) => {
      editor.chain().focus().deleteRange(range).setNode('heading', { level: 1 }).run()
    },
  },
  {
    title: 'Heading 2',
    searchTerms: ['title', 'h1', 'h2', 'h3', 'heading', 'header'],
    icon: <Heading2 className={iconClassNames} />,
    command: ({ editor, range }: CommandProps) => {
      editor.chain().focus().deleteRange(range).setNode('heading', { level: 2 }).run()
    },
  },
  {
    title: 'Heading 3',
    searchTerms: ['title', 'h1', 'h2', 'h3', 'heading', 'header'],
    icon: <Heading3 className={iconClassNames} />,
    command: ({ editor, range }: CommandProps) => {
      editor.chain().focus().deleteRange(range).setNode('heading', { level: 3 }).run()
    },
  },
  {
    title: 'Bullet List',
    searchTerms: ['unordered', 'point'],
    icon: <List className={iconClassNames} />,
    command: ({ editor, range }: CommandProps) => {
      editor.chain().focus().deleteRange(range).toggleBulletList().run()
    },
  },
  {
    title: 'Numbered List',

    searchTerms: ['ordered'],
    icon: <ListOrdered className={iconClassNames} />,
    command: ({ editor, range }: CommandProps) => {
      editor.chain().focus().deleteRange(range).toggleOrderedList().run()
    },
  },
  {
    title: 'Blockquote',

    searchTerms: ['quote', 'blockquote'],
    icon: <TextQuote className={iconClassNames} />,
    command: ({ editor, range }: CommandProps) => {
      editor.chain().focus().deleteRange(range).toggleBlockquote().run()
    },
  },
  {
    title: 'Divider',
    searchTerms: ['separator', 'hr', 'line', 'rule', 'line', 'divider'],
    icon: <Minus className={iconClassNames} />,
    command: ({ editor, range }: CommandProps) => {
      editor.chain().focus().deleteRange(range).setHorizontalRule().run()
    },
  },
  {
    title: 'Code Block',
    searchTerms: ['code', 'pre'],
    icon: <Code className={iconClassNames} />,
    command: ({ editor, range }: CommandProps) => {
      editor.chain().focus().deleteRange(range).toggleCodeBlock().run()
    },
  },
]

export const updateScrollView = (container: HTMLElement, item: HTMLElement) => {
  const containerHeight = container.offsetHeight
  const itemHeight = item ? item.offsetHeight : 0

  const top = item.offsetTop
  const bottom = top + itemHeight

  if (top < container.scrollTop) {
    container.scrollTop -= container.scrollTop - top + 5
  } else if (bottom > containerHeight + container.scrollTop) {
    container.scrollTop += bottom - containerHeight - container.scrollTop + 5
  }
}

const CommandList = ({
  items,
  command,
  editor,
}: {
  items: CommandItemProps[]
  command: (item: CommandItemProps) => void
  editor: Editor
  range: any
}) => {
  const [selectedIndex, setSelectedIndex] = useState(0)

  const selectItem = useCallback(
    (index: number) => {
      const item = items[index]
      if (item) {
        command(item)
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [command, editor, items]
  )

  useEffect(() => {
    const navigationKeys = ['ArrowUp', 'ArrowDown', 'Enter']
    const onKeyDown = (e: KeyboardEvent) => {
      if (navigationKeys.includes(e.key)) {
        e.preventDefault()
        if (e.key === 'ArrowUp') {
          setSelectedIndex((selectedIndex + items.length - 1) % items.length)
          return true
        }
        if (e.key === 'ArrowDown') {
          setSelectedIndex((selectedIndex + 1) % items.length)
          return true
        }
        if (e.key === 'Enter') {
          selectItem(selectedIndex)
          return true
        }
        return false
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [items, selectedIndex, setSelectedIndex, selectItem])

  useEffect(() => {
    setSelectedIndex(0)
  }, [items])

  const commandListContainer = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    const container = commandListContainer?.current

    const item = container?.children[selectedIndex] as HTMLElement

    if (item && container) updateScrollView(container, item)
  }, [selectedIndex])

  return items.length > 0 ? (
    <div className="z-50 w-60 rounded-md border bg-background-200 shadow-sm transition-all">
      <div
        id="slash-command"
        ref={commandListContainer}
        className="no-scrollbar h-auto max-h-[330px] overflow-y-auto scroll-smooth p-1"
      >
        {items.map((item: CommandItemProps, index: number) => {
          return (
            <button
              className={cn(
                'flex w-full items-center space-x-2 rounded-sm px-2 py-1 text-left text-sm text-foreground-light transition-colors hover:bg-background-surface-75 hover:text-foreground-lighter',
                index === selectedIndex
                  ? 'bg-background-selection text-foreground'
                  : 'bg-transparent'
              )}
              key={index}
              onClick={() => selectItem(index)}
              type="button"
            >
              <div className="flex h-6 w-6 shrink-0 items-center justify-center">{item.icon}</div>
              <div>
                <p className="">{item.title}</p>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  ) : null
}

export function getSlashCommandSuggestions(
  commands: SlashCommandItem[] = []
): Omit<SuggestionOptions, 'editor'> {
  return {
    items: ({ query }) => {
      return [...DEFAULT_SLASH_COMMANDS, ...commands].filter((item) => {
        if (typeof query === 'string' && query.length > 0) {
          const search = query.toLowerCase()
          return (
            item.title.toLowerCase().includes(search) ||
            (item.searchTerms && item.searchTerms.some((term: string) => term.includes(search)))
          )
        }
        return true
      })
    },
    render: () => {
      let component: ReactRenderer<any>
      let popup: InstanceType<any> | null = null

      return {
        onStart: (props) => {
          component = new ReactRenderer(CommandList, {
            props,
            editor: props.editor,
          })

          popup = tippy('body', {
            getReferenceClientRect: props.clientRect as GetReferenceClientRect,
            appendTo: () => document.body,
            content: component.element,
            showOnCreate: true,
            interactive: true,
            trigger: 'manual',
            placement: 'bottom-start',
          })
        },
        onUpdate: (props) => {
          component?.updateProps(props)

          popup &&
            popup[0].setProps({
              getReferenceClientRect: props.clientRect,
            })
        },
        onKeyDown: (props) => {
          if (props.event.key === 'Escape') {
            popup?.[0].hide()

            return true
          }

          return component?.ref?.onKeyDown(props)
        },
        onExit: () => {
          if (!popup || !popup?.[0] || !component) {
            return
          }

          popup?.[0].destroy()
          component?.destroy()
        },
      }
    },
  }
}
