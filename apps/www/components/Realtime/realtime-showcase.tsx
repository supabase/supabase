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

export default function RealtimeShowcase() {
  return (
    <UserProvider>
      <div className="bg-surface-75/50 border border-muted rounded-lg lg:h-[calc(100vh-128px)]">
        <Tabs_Shadcn_
          defaultValue="presence"
          className="w-full h-full flex flex-col lg:flex-row border-b border-muted h-full items-stretch"
        >
          {/* Desktop sidebar tabs - hidden on mobile */}
          <div className="hidden lg:block w-48 px-6 py-8 border-r border-muted h-full">
            <h2 className="text-xs uppercase text-foreground-light font-mono mb-4">Examples</h2>
            <TabsList_Shadcn_ className="border-none flex flex-col h-auto justify-start items-stretch gap-2 bg-transparent">
              <TabsTrigger_Shadcn_
                value="presence"
                className="justify-start px-2 py-2 h-auto data-[state=active]:bg-transparent data-[state=active]:border-none border-none p-0 data-[state=active]:text-foreground"
              >
                <Users strokeWidth={1.5} size={16} className="mr-3" />
                Presence
              </TabsTrigger_Shadcn_>

              <TabsTrigger_Shadcn_
                value="chat"
                className="justify-start px-2 py-2 h-auto data-[state=active]:bg-transparent data-[state=active]:border-none border-none p-0 data-[state=active]:text-foreground"
              >
                <MessageSquare strokeWidth={1.5} size={16} className="mr-3" />
                Chat
              </TabsTrigger_Shadcn_>

              <TabsTrigger_Shadcn_
                value="todo"
                className="justify-start px-2 py-2 h-auto data-[state=active]:bg-transparent data-[state=active]:border-none border-none p-0 data-[state=active]:text-foreground"
              >
                <CheckSquare strokeWidth={1.5} size={16} className="mr-3" />
                Todo List
              </TabsTrigger_Shadcn_>

              <TabsTrigger_Shadcn_
                value="editor"
                className="justify-start px-2 py-2 h-auto data-[state=active]:bg-transparent data-[state=active]:border-none border-none p-0 data-[state=active]:text-foreground"
              >
                <Edit strokeWidth={1.5} size={16} className="mr-3" />
                Editor
              </TabsTrigger_Shadcn_>

              <TabsTrigger_Shadcn_
                value="formPresence"
                className="justify-start px-2 py-2 h-auto data-[state=active]:bg-transparent data-[state=active]:border-none border-none p-0 data-[state=active]:text-foreground"
              >
                <ClipboardList strokeWidth={1.5} size={16} className="mr-3" />
                Form
              </TabsTrigger_Shadcn_>

              <TabsTrigger_Shadcn_
                value="cursorTracking"
                className="justify-start px-2 py-2 h-auto data-[state=active]:bg-transparent data-[state=active]:border-none border-none p-0 data-[state=active]:text-foreground"
              >
                <MousePointer strokeWidth={1.5} size={16} className="mr-3" />
                Cursor
              </TabsTrigger_Shadcn_>

              <TabsTrigger_Shadcn_
                value="whiteboard"
                className="justify-start px-2 py-2 h-auto data-[state=active]:bg-transparent data-[state=active]:border-none border-none p-0 data-[state=active]:text-foreground"
              >
                <PenTool strokeWidth={1.5} size={16} className="mr-3" />
                Whiteboard
              </TabsTrigger_Shadcn_>

              <TabsTrigger_Shadcn_
                value="tictactoe"
                className="justify-start px-2 py-2 h-auto data-[state=active]:bg-transparent data-[state=active]:border-none border-none p-0 data-[state=active]:text-foreground"
              >
                <Hash strokeWidth={1.5} size={16} className="mr-3" />
                XO
              </TabsTrigger_Shadcn_>

              <TabsTrigger_Shadcn_
                value="emoji"
                className="justify-start px-2 py-2 h-auto data-[state=active]:bg-transparent data-[state=active]:border-none border-none p-0 data-[state=active]:text-foreground"
              >
                <Smile strokeWidth={1.5} size={16} className="mr-3" />
                Reactions
              </TabsTrigger_Shadcn_>

              <TabsTrigger_Shadcn_
                value="platformer"
                className="justify-start px-2 py-2 h-auto data-[state=active]:bg-transparent data-[state=active]:border-none border-none p-0 data-[state=active]:text-foreground"
              >
                <Gamepad2 strokeWidth={1.5} size={16} className="mr-3" />
                Platformer
              </TabsTrigger_Shadcn_>

              <TabsTrigger_Shadcn_
                value="annotation"
                className="justify-start px-2 py-2 h-auto data-[state=active]:bg-transparent data-[state=active]:border-none border-none p-0 data-[state=active]:text-foreground"
              >
                <StickyNote strokeWidth={1.5} size={16} className="mr-3" />
                Annotation
              </TabsTrigger_Shadcn_>

              <TabsTrigger_Shadcn_
                value="logs"
                className="justify-start px-2 py-2 h-auto data-[state=active]:bg-transparent data-[state=active]:border-none border-none p-0 data-[state=active]:text-foreground"
              >
                <FileText strokeWidth={1.5} size={16} className="mr-3" />
                Logs
              </TabsTrigger_Shadcn_>
            </TabsList_Shadcn_>
          </div>

          {/* Mobile horizontal tabs - shown only on mobile */}
          <div className="lg:hidden px-4 py-4 border-b border-muted w-full overflow-x-auto">
            <TabsList_Shadcn_ className="border-none flex flex-row h-auto justify-start items-center gap-2 bg-transparent w-max">
              <TabsTrigger_Shadcn_
                value="presence"
                className="whitespace-nowrap justify-start px-3 py-2 h-auto data-[state=active]:bg-surface-100 data-[state=active]:border-none rounded-md"
              >
                <Users strokeWidth={1.5} size={14} className="mr-2" />
                Presence
              </TabsTrigger_Shadcn_>
              <TabsTrigger_Shadcn_
                value="chat"
                className="whitespace-nowrap justify-start px-3 py-2 h-auto data-[state=active]:bg-surface-100 data-[state=active]:border-none rounded-md"
              >
                <MessageSquare strokeWidth={1.5} size={14} className="mr-2" />
                Chat
              </TabsTrigger_Shadcn_>
              <TabsTrigger_Shadcn_
                value="todo"
                className="whitespace-nowrap justify-start px-3 py-2 h-auto data-[state=active]:bg-surface-100 data-[state=active]:border-none rounded-md"
              >
                <CheckSquare strokeWidth={1.5} size={14} className="mr-2" />
                Todo
              </TabsTrigger_Shadcn_>
              <TabsTrigger_Shadcn_
                value="editor"
                className="whitespace-nowrap justify-start px-3 py-2 h-auto data-[state=active]:bg-surface-100 data-[state=active]:border-none rounded-md"
              >
                <Edit strokeWidth={1.5} size={14} className="mr-2" />
                Editor
              </TabsTrigger_Shadcn_>
              <TabsTrigger_Shadcn_
                value="formPresence"
                className="whitespace-nowrap justify-start px-3 py-2 h-auto data-[state=active]:bg-surface-100 data-[state=active]:border-none rounded-md"
              >
                <ClipboardList strokeWidth={1.5} size={14} className="mr-2" />
                Form
              </TabsTrigger_Shadcn_>
              <TabsTrigger_Shadcn_
                value="cursorTracking"
                className="whitespace-nowrap justify-start px-3 py-2 h-auto data-[state=active]:bg-surface-100 data-[state=active]:border-none rounded-md"
              >
                <MousePointer strokeWidth={1.5} size={14} className="mr-2" />
                Cursor
              </TabsTrigger_Shadcn_>
              <TabsTrigger_Shadcn_
                value="whiteboard"
                className="whitespace-nowrap justify-start px-3 py-2 h-auto data-[state=active]:bg-surface-100 data-[state=active]:border-none rounded-md"
              >
                <PenTool strokeWidth={1.5} size={14} className="mr-2" />
                Whiteboard
              </TabsTrigger_Shadcn_>
              <TabsTrigger_Shadcn_
                value="tictactoe"
                className="whitespace-nowrap justify-start px-3 py-2 h-auto data-[state=active]:bg-surface-100 data-[state=active]:border-none rounded-md"
              >
                <Hash strokeWidth={1.5} size={14} className="mr-2" />
                XO
              </TabsTrigger_Shadcn_>
              <TabsTrigger_Shadcn_
                value="emoji"
                className="whitespace-nowrap justify-start px-3 py-2 h-auto data-[state=active]:bg-surface-100 data-[state=active]:border-none rounded-md"
              >
                <Smile strokeWidth={1.5} size={14} className="mr-2" />
                Reactions
              </TabsTrigger_Shadcn_>
              <TabsTrigger_Shadcn_
                value="platformer"
                className="whitespace-nowrap justify-start px-3 py-2 h-auto data-[state=active]:bg-surface-100 data-[state=active]:border-none rounded-md"
              >
                <Gamepad2 strokeWidth={1.5} size={14} className="mr-2" />
                Platformer
              </TabsTrigger_Shadcn_>
              <TabsTrigger_Shadcn_
                value="annotation"
                className="whitespace-nowrap justify-start px-3 py-2 h-auto data-[state=active]:bg-surface-100 data-[state=active]:border-none rounded-md"
              >
                <StickyNote strokeWidth={1.5} size={14} className="mr-2" />
                Annotation
              </TabsTrigger_Shadcn_>
              <TabsTrigger_Shadcn_
                value="logs"
                className="whitespace-nowrap justify-start px-3 py-2 h-auto data-[state=active]:bg-surface-100 data-[state=active]:border-none rounded-md"
              >
                <FileText strokeWidth={1.5} size={14} className="mr-2" />
                Logs
              </TabsTrigger_Shadcn_>
            </TabsList_Shadcn_>
          </div>

          {/* Tab Content */}
          <div className="flex-1 h-full">
            <TabsContent_Shadcn_
              value="presence"
              className="mt-0 border-0 p-0 m-0 h-full overflow-hidden"
            >
              <PresenceExample />
            </TabsContent_Shadcn_>

            <TabsContent_Shadcn_
              value="chat"
              className="mt-0 border-0 p-0 m-0 h-full overflow-hidden"
            >
              <ChatExample />
            </TabsContent_Shadcn_>

            <TabsContent_Shadcn_
              value="todo"
              className="mt-0 border-0 p-0 m-0 h-full overflow-hidden"
            >
              <TodoExample />
            </TabsContent_Shadcn_>

            <TabsContent_Shadcn_
              value="editor"
              className="mt-0 border-0 p-0 m-0 h-full overflow-hidden"
            >
              <CollaborativeEditorExample />
            </TabsContent_Shadcn_>

            <TabsContent_Shadcn_
              value="formPresence"
              className="mt-0 border-0 p-0 m-0 h-full overflow-hidden"
            >
              <FormPresenceExample />
            </TabsContent_Shadcn_>

            <TabsContent_Shadcn_
              value="cursorTracking"
              className="mt-0 border-0 p-0 m-0 h-full overflow-hidden"
            >
              <CursorTrackingExample />
            </TabsContent_Shadcn_>

            <TabsContent_Shadcn_
              value="whiteboard"
              className="mt-0 border-0 p-0 m-0 h-full overflow-hidden"
            >
              <WhiteboardExample />
            </TabsContent_Shadcn_>

            <TabsContent_Shadcn_
              value="tictactoe"
              className="mt-0 border-0 p-0 m-0 h-full overflow-hidden"
            >
              <TicTacToeExample />
            </TabsContent_Shadcn_>

            <TabsContent_Shadcn_
              value="emoji"
              className="mt-0 border-0 p-0 m-0 h-full overflow-hidden"
            >
              <EmojiPickerExample />
            </TabsContent_Shadcn_>

            <TabsContent_Shadcn_
              value="platformer"
              className="mt-0 border-0 p-0 m-0 h-full overflow-hidden"
            >
              <Platformer3DExample />
            </TabsContent_Shadcn_>

            <TabsContent_Shadcn_
              value="annotation"
              className="mt-0 border-0 p-0 m-0 h-full overflow-hidden"
            >
              <IframeAnnotationExample />
            </TabsContent_Shadcn_>

            <TabsContent_Shadcn_
              value="logs"
              className="mt-0 border-0 p-0 m-0 h-full overflow-hidden"
            >
              <LogViewerExample />
            </TabsContent_Shadcn_>
          </div>
        </Tabs_Shadcn_>
      </div>
    </UserProvider>
  )
}
