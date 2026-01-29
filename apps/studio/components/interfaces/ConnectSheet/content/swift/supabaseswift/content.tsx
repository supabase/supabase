import type { ContentFileProps } from '@/components/interfaces/ConnectSheet/Connect.types'

import { SimpleCodeBlock } from 'ui'
import {
  MultipleCodeBlock,
  MultipleCodeBlockContent,
  MultipleCodeBlockTrigger,
  MultipleCodeBlockTriggers,
} from 'ui-patterns/multiple-code-block'

const ContentFile = ({ projectKeys }: ContentFileProps) => {
  return (
    <MultipleCodeBlock>
      <MultipleCodeBlockTriggers>
        <MultipleCodeBlockTrigger value="Supabase.swift" />
        <MultipleCodeBlockTrigger value="Todo.swift" />
        <MultipleCodeBlockTrigger value="ContentView.swift" />
      </MultipleCodeBlockTriggers>

      <MultipleCodeBlockContent value="Supabase.swift">
        <SimpleCodeBlock className="swift" parentClassName="min-h-72">
          {`
import Foundation
import Supabase

let supabase = SupabaseClient(
  supabaseURL: URL(string: "${projectKeys.apiUrl ?? 'your-project-url'}")!,
  supabaseKey: "${projectKeys.publishableKey ?? '<prefer publishable key for native apps instead of anon key>'}"
)
        `}
        </SimpleCodeBlock>
      </MultipleCodeBlockContent>

      <MultipleCodeBlockContent value="Todo.swift">
        <SimpleCodeBlock className="swift" parentClassName="min-h-72">
          {`
import Foundation

struct Todo: Identifiable, Decodable {
  var id: Int
  var title: String
}
`}
        </SimpleCodeBlock>
      </MultipleCodeBlockContent>

      <MultipleCodeBlockContent value="ContentView.swift">
        <SimpleCodeBlock className="swift" parentClassName="min-h-72">
          {`
import Supabase
import SwiftUI

struct ContentView: View {
  @State var todos: [Todo] = []

  var body: some View {
    NavigationStack {
      List(todos) { todo in
        Text(todo.title)
      }
      .navigationTitle("Todos")
      .task {
        do {
          todos = try await supabase.from("todos").select().execute().value
        } catch {
          debugPrint(error)
        }
      }
    }
  }
}

#Preview {
  ContentView()
}

`}
        </SimpleCodeBlock>
      </MultipleCodeBlockContent>
    </MultipleCodeBlock>
  )
}

export default ContentFile
