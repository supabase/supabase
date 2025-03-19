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
      <div>
        <Tabs_Shadcn_ defaultValue="presence" className="w-full">
          <TabsList_Shadcn_ className="justify-center gap-6 sticky top-16 bg-background z-20 max-w-full overflow-x-auto">
            <TabsTrigger_Shadcn_ value="presence" className="flex flex-col items-center gap-3 py-4">
              <Users strokeWidth={1.5} size={20} className="text-brand" />
              Presence
            </TabsTrigger_Shadcn_>

            <TabsTrigger_Shadcn_ value="chat" className="flex flex-col items-center gap-3 py-4">
              <MessageSquare strokeWidth={1.5} size={20} className="text-brand" />
              Chat
            </TabsTrigger_Shadcn_>

            <TabsTrigger_Shadcn_ value="todo" className="flex flex-col items-center gap-3 py-4">
              <CheckSquare strokeWidth={1.5} size={20} className="text-brand" />
              Todo List
            </TabsTrigger_Shadcn_>

            <TabsTrigger_Shadcn_ value="editor" className="flex flex-col items-center gap-3 py-4">
              <Edit strokeWidth={1.5} size={20} className="text-brand" />
              Editor
            </TabsTrigger_Shadcn_>

            <TabsTrigger_Shadcn_
              value="formPresence"
              className="flex flex-col items-center gap-3 py-4"
            >
              <ClipboardList strokeWidth={1.5} size={20} className="text-brand" />
              Form
            </TabsTrigger_Shadcn_>

            <TabsTrigger_Shadcn_
              value="cursorTracking"
              className="flex flex-col items-center gap-3 py-4"
            >
              <MousePointer strokeWidth={1.5} size={20} className="text-brand" />
              Cursors
            </TabsTrigger_Shadcn_>

            <TabsTrigger_Shadcn_
              value="whiteboard"
              className="flex flex-col items-center gap-3 py-4"
            >
              <PenTool strokeWidth={1.5} size={20} className="text-brand" />
              Whiteboard
            </TabsTrigger_Shadcn_>

            <TabsTrigger_Shadcn_
              value="tictactoe"
              className="flex flex-col items-center gap-3 py-4"
            >
              <Hash strokeWidth={1.5} size={20} className="text-brand" />
              XO
            </TabsTrigger_Shadcn_>

            <TabsTrigger_Shadcn_ value="emoji" className="flex flex-col items-center gap-3 py-4">
              <Smile strokeWidth={1.5} size={20} className="text-brand" />
              Reactions
            </TabsTrigger_Shadcn_>

            <TabsTrigger_Shadcn_
              value="platformer"
              className="flex flex-col items-center gap-3 py-4"
            >
              <Gamepad2 strokeWidth={1.5} size={20} className="text-brand" />
              Platformer
            </TabsTrigger_Shadcn_>

            <TabsTrigger_Shadcn_
              value="annotation"
              className="flex flex-col items-center gap-3 py-4"
            >
              <StickyNote strokeWidth={1.5} size={20} className="text-brand" />
              Annotation
            </TabsTrigger_Shadcn_>

            <TabsTrigger_Shadcn_ value="logs" className="flex flex-col items-center gap-3 py-4">
              <FileText strokeWidth={1.5} size={20} className="text-brand" />
              Logs
            </TabsTrigger_Shadcn_>
          </TabsList_Shadcn_>

          {/* Tab Content */}
          <div className="flex-1 h-full overflow-hidden pt-8 px-8 lg:p-16 border-b">
            <TabsContent_Shadcn_ value="presence" className="mt-0 border-0 p-0">
              <PresenceExample />
            </TabsContent_Shadcn_>

            <TabsContent_Shadcn_ value="chat" className="mt-0 border-0 p-0">
              <ChatExample />
            </TabsContent_Shadcn_>

            <TabsContent_Shadcn_ value="todo" className="mt-0 border-0 p-0">
              <TodoExample />
            </TabsContent_Shadcn_>

            <TabsContent_Shadcn_ value="editor" className="mt-0 border-0 p-0">
              <CollaborativeEditorExample />
            </TabsContent_Shadcn_>

            <TabsContent_Shadcn_ value="formPresence" className="mt-0 border-0 p-0">
              <FormPresenceExample />
            </TabsContent_Shadcn_>

            <TabsContent_Shadcn_ value="cursorTracking" className="mt-0 border-0 p-0">
              <CursorTrackingExample />
            </TabsContent_Shadcn_>

            <TabsContent_Shadcn_ value="whiteboard" className="mt-0 border-0 p-0">
              <WhiteboardExample />
            </TabsContent_Shadcn_>

            <TabsContent_Shadcn_ value="tictactoe" className="mt-0 border-0 p-0">
              <TicTacToeExample />
            </TabsContent_Shadcn_>

            <TabsContent_Shadcn_ value="emoji" className="mt-0 border-0 p-0">
              <EmojiPickerExample />
            </TabsContent_Shadcn_>

            <TabsContent_Shadcn_ value="platformer" className="mt-0 border-0 p-0">
              <Platformer3DExample />
            </TabsContent_Shadcn_>

            <TabsContent_Shadcn_ value="annotation" className="mt-0 border-0 p-0">
              <IframeAnnotationExample />
            </TabsContent_Shadcn_>

            <TabsContent_Shadcn_ value="logs" className="mt-0 border-0 p-0">
              <LogViewerExample />
            </TabsContent_Shadcn_>
          </div>
        </Tabs_Shadcn_>
      </div>
    </UserProvider>
  )
}
