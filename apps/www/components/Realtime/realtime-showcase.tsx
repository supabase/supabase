'use client'

import { UserProvider } from '../contexts/user-context'
import PresenceExample from './examples/presence-example'
import ChatExample from './examples/chat-example'
import TodoExample from './examples/todo-example'
import CollaborativeEditorExample from './examples/collaborative-editor-example'
import WhiteboardExample from './examples/whiteboard-example'
import TicTacToeExample from './examples/tic-tac-toe-example'
import EmojiPickerExample from './examples/emoji-picker-example'
import Platformer3DExample from './examples/platformer-3d-example'
import FPSExample from './examples/fps-example'
import IframeAnnotationExample from './examples/iframe-annotation-example'
import CarRacingExample from './examples/car-racing-example'
import LogViewerExample from './examples/log-viewer-example'
import FormPresenceExample from './examples/form-presence-example'
import CursorTrackingExample from './examples/cursor-tracking-example'
import { Tabs_Shadcn_, TabsContent_Shadcn_, TabsList_Shadcn_, TabsTrigger_Shadcn_ } from 'ui'
import {
  Users,
  MessageSquare,
  CheckSquare,
  Edit,
  PenTool,
  Hash,
  Smile,
  Gamepad2,
  StickyNote,
  Car,
  FileText,
  ClipboardList,
  MousePointer,
  Crosshair,
} from 'lucide-react'
import { useState, useCallback } from 'react'
import ExampleLayout from './example-layout'

// Define the list of examples for easier navigation
const EXAMPLES = [
  {
    value: 'presence',
    label: 'Presence',
    icon: Users,
    component: PresenceExample,
  },
  {
    value: 'chat',
    label: 'Chat',
    icon: MessageSquare,
    component: ChatExample,
  },
  {
    value: 'todo',
    label: 'Todo List',
    icon: CheckSquare,
    component: TodoExample,
  },
  {
    value: 'editor',
    label: 'Editor',
    icon: Edit,
    component: CollaborativeEditorExample,
  },
  {
    value: 'formPresence',
    label: 'Form',
    icon: ClipboardList,
    component: FormPresenceExample,
  },
  {
    value: 'cursorTracking',
    label: 'Cursor',
    icon: MousePointer,
    component: CursorTrackingExample,
  },
  {
    value: 'whiteboard',
    label: 'Whiteboard',
    icon: PenTool,
    component: WhiteboardExample,
  },
  {
    value: 'tictactoe',
    label: 'XO',
    icon: Hash,
    component: TicTacToeExample,
  },
  {
    value: 'emoji',
    label: 'Reactions',
    icon: Smile,
    component: EmojiPickerExample,
  },
  {
    value: 'platformer',
    label: 'Platformer',
    icon: Gamepad2,
    component: Platformer3DExample,
  },
  {
    value: 'annotation',
    label: 'Annotation',
    icon: StickyNote,
    component: IframeAnnotationExample,
  },
  {
    value: 'logs',
    label: 'Logs',
    icon: FileText,
    component: LogViewerExample,
  },
]

export default function RealtimeShowcase() {
  // Use numeric index for active tab
  const [activeTabIndex, setActiveTabIndex] = useState(0)

  const handleTabChange = (value: string) => {
    const index = EXAMPLES.findIndex((ex) => ex.value === value)
    if (index !== -1) {
      setActiveTabIndex(index)
    }
  }

  const handleNext = useCallback(() => {
    if (activeTabIndex < EXAMPLES.length - 1) {
      setActiveTabIndex(activeTabIndex + 1)
    }
  }, [activeTabIndex])

  const handlePrevious = useCallback(() => {
    if (activeTabIndex > 0) {
      setActiveTabIndex(activeTabIndex - 1)
    }
  }, [activeTabIndex])

  // Get the current example from the index
  const currentExample = EXAMPLES[activeTabIndex]
  const ExampleComponent = currentExample.component

  return (
    <UserProvider>
      <div className="bg-surface-75/50 border border-muted rounded-lg h-auto lg:h-[600px]">
        <Tabs_Shadcn_
          value={currentExample.value}
          onValueChange={handleTabChange}
          className="w-full h-full flex flex-col lg:flex-row border-b border-muted h-full items-stretch"
        >
          {/* Desktop sidebar tabs - hidden on mobile */}
          <div className="hidden lg:block w-48 px-6 py-8 border-r border-muted h-full">
            <h2 className="text-xs uppercase text-foreground-light font-mono mb-4">Examples</h2>
            <TabsList_Shadcn_ className="border-none flex flex-col h-auto justify-start items-stretch gap-2 bg-transparent">
              {EXAMPLES.map((example) => (
                <TabsTrigger_Shadcn_
                  key={example.value}
                  value={example.value}
                  className="justify-start px-2 py-2 h-auto data-[state=active]:bg-transparent data-[state=active]:border-none border-none p-0 data-[state=active]:text-foreground"
                >
                  <example.icon strokeWidth={1.5} size={16} className="mr-3" />
                  {example.label}
                </TabsTrigger_Shadcn_>
              ))}
            </TabsList_Shadcn_>
          </div>

          {/* Mobile horizontal tabs - shown only on mobile */}
          <div className="lg:hidden px-2 py-2 border-b border-muted w-full overflow-x-auto">
            <TabsList_Shadcn_ className="border-none flex flex-row h-auto justify-start items-center gap-2 bg-transparent w-max">
              {EXAMPLES.map((example) => (
                <TabsTrigger_Shadcn_
                  key={example.value}
                  value={example.value}
                  className="whitespace-nowrap justify-start px-3 py-2 h-auto data-[state=active]:bg-surface-100 data-[state=active]:border-none rounded-md"
                >
                  <example.icon strokeWidth={1.5} size={14} className="mr-2" />
                  {example.label}
                </TabsTrigger_Shadcn_>
              ))}
            </TabsList_Shadcn_>
          </div>

          {/* Tab Content - render ExampleLayout with props from current example */}
          <div className="flex-1 h-full overflow-hidden">
            <div className="mt-0 border-0 p-0 m-0 h-full overflow-hidden">
              <ExampleComponent
                render={(layoutProps) => (
                  <ExampleLayout
                    {...layoutProps}
                    onNext={activeTabIndex < EXAMPLES.length - 1 ? handleNext : undefined}
                    onPrevious={activeTabIndex > 0 ? handlePrevious : undefined}
                  />
                )}
              />
            </div>
          </div>
        </Tabs_Shadcn_>
      </div>
    </UserProvider>
  )
}
