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

const TabTrigger = ({ value, children }: { value: string; children: React.ReactNode }) => (
  <TabsTrigger_Shadcn_ value={value} className="flex flex-col items-center gap-1 pt-4 pb-2">
    {children}
  </TabsTrigger_Shadcn_>
)

export default function RealtimeShowcase() {
  return (
    <UserProvider>
      <div>
        <Tabs_Shadcn_ defaultValue="presence" className="">
          <TabsList_Shadcn_ className="justify-center gap-4 md:gap-6 sticky top-16 bg-background/90 backdrop-blur-sm z-20 max-w-full overflow-x-auto">
            <TabTrigger value="presence">
              <Users strokeWidth={1.5} size={20} />
              Presence
            </TabTrigger>

            <TabTrigger value="chat">
              <MessageSquare strokeWidth={1.5} size={20} />
              Chat
            </TabTrigger>

            <TabTrigger value="todo">
              <CheckSquare strokeWidth={1.5} size={20} />
              Todo List
            </TabTrigger>

            <TabTrigger value="editor">
              <Edit strokeWidth={1.5} size={20} />
              Editor
            </TabTrigger>

            <TabTrigger value="formPresence">
              <ClipboardList strokeWidth={1.5} size={20} />
              Form
            </TabTrigger>

            <TabTrigger value="cursorTracking">
              <MousePointer strokeWidth={1.5} size={20} />
              Cursors
            </TabTrigger>

            <TabTrigger value="whiteboard">
              <PenTool strokeWidth={1.5} size={20} />
              Whiteboard
            </TabTrigger>

            <TabTrigger value="tictactoe">
              <Hash strokeWidth={1.5} size={20} />
              XO
            </TabTrigger>

            <TabTrigger value="emoji">
              <Smile strokeWidth={1.5} size={20} />
              Reactions
            </TabTrigger>

            <TabTrigger value="platformer">
              <Gamepad2 strokeWidth={1.5} size={20} />
              Platformer
            </TabTrigger>

            <TabTrigger value="annotation">
              <StickyNote strokeWidth={1.5} size={20} />
              Annotation
            </TabTrigger>

            <TabTrigger value="logs">
              <FileText strokeWidth={1.5} size={20} />
              Logs
            </TabTrigger>
          </TabsList_Shadcn_>

          {/* Tab Content */}
          <div className="max-w-5xl mx-auto flex-1 h-full overflow-hidden py-4 lg:py-8">
            <TabsContent_Shadcn_ value="presence" className="mt-0 border-0 py-0 px-4">
              <PresenceExample />
            </TabsContent_Shadcn_>

            <TabsContent_Shadcn_ value="chat" className="mt-0 border-0 py-0 px-4">
              <ChatExample />
            </TabsContent_Shadcn_>

            <TabsContent_Shadcn_ value="todo" className="mt-0 border-0 py-0 px-4">
              <TodoExample />
            </TabsContent_Shadcn_>

            <TabsContent_Shadcn_ value="editor" className="mt-0 border-0 py-0 px-4">
              <CollaborativeEditorExample />
            </TabsContent_Shadcn_>

            <TabsContent_Shadcn_ value="formPresence" className="mt-0 border-0 py-0 px-4">
              <FormPresenceExample />
            </TabsContent_Shadcn_>

            <TabsContent_Shadcn_ value="cursorTracking" className="mt-0 border-0 py-0 px-4">
              <CursorTrackingExample />
            </TabsContent_Shadcn_>

            <TabsContent_Shadcn_ value="whiteboard" className="mt-0 border-0 py-0 px-4">
              <WhiteboardExample />
            </TabsContent_Shadcn_>

            <TabsContent_Shadcn_ value="tictactoe" className="mt-0 border-0 py-0 px-4">
              <TicTacToeExample />
            </TabsContent_Shadcn_>

            <TabsContent_Shadcn_ value="emoji" className="mt-0 border-0 py-0 px-4">
              <EmojiPickerExample />
            </TabsContent_Shadcn_>

            <TabsContent_Shadcn_ value="platformer" className="mt-0 border-0 py-0 px-4">
              <Platformer3DExample />
            </TabsContent_Shadcn_>

            <TabsContent_Shadcn_ value="annotation" className="mt-0 border-0 py-0 px-4">
              <IframeAnnotationExample />
            </TabsContent_Shadcn_>

            <TabsContent_Shadcn_ value="logs" className="mt-0 border-0 py-0 px-4">
              <LogViewerExample />
            </TabsContent_Shadcn_>
          </div>
        </Tabs_Shadcn_>
      </div>
    </UserProvider>
  )
}
