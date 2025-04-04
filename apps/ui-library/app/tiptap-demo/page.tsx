import { RealtimeTiptapEditor } from "@/registry/default/blocks/realtime-tiptap/components/realtime-tiptap";


export default function Page() {
  return (
    <div>
      <h1>Tiptap + Supabase Realtime</h1>
      <div>
        <RealtimeTiptapEditor />
      </div>
    </div>
  )
}
