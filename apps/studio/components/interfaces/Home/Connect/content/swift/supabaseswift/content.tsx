import type { ContentFileProps } from 'components/interfaces/Home/Connect/Connect.types'

import {
  ConnectTabs,
  ConnectTabTriggers,
  ConnectTabTrigger,
  ConnectTabContent,
} from 'components/interfaces/Home/Connect/ConnectTabs'
import SimpleCodeBlock from 'components/to-be-cleaned/SimpleCodeBlock'

const ContentFile = ({ projectKeys }: ContentFileProps) => {
  return (
    <ConnectTabs>
      <ConnectTabTriggers>
        <ConnectTabTrigger value="Supabase.swift" />
        <ConnectTabTrigger value="Todo.swift" />
        <ConnectTabTrigger value="ContentView.swift" />
      </ConnectTabTriggers>

      <ConnectTabContent value="Supabase.swift">
        <SimpleCodeBlock className="swift" parentClassName="min-h-72">
          {`
import Foundation
import Supabase

let supabase = SupabaseClient(
  supabaseURL: URL(string: "${projectKeys.apiUrl ?? 'your-project-url'}")!,
  supabaseKey: "${projectKeys.anonKey ?? 'your-anon-key'}"
)
        `}
        </SimpleCodeBlock>
      </ConnectTabContent>

      <ConnectTabContent value="Todo.swift">
        <SimpleCodeBlock className="swift" parentClassName="min-h-72">
          {`
import Foundation

struct Todo: Identifiable, Decodable {
  var id: Int
  var title: String
}
`}
        </SimpleCodeBlock>
      </ConnectTabContent>

      <ConnectTabContent value="ContentView.swift">
        <SimpleCodeBlock className="swift" parentClassName="min-h-72">
          {`
import Supabase
import SwiftUI

class TodoViewModel: ObservableObject {
  @Published var todos: [Todo] = []

  func getToDos() async throws {
    let response = try await supabase.from("todos").select().execute()

    self.todos = try JSONDecoder().decode([Todo].self, from: response.data)
  }

}

struct ContentView: View {
  @StateObject private var viewModel = TodoViewModel()

  var body: some View {
    NavigationView {
      List(viewModel.todos) { todo in
        HStack {
          Text(todo.title)
          Spacer()
        }
      }
      .navigationTitle("Todos")
      .onAppear {
        Task {
          do {
            try await viewModel.getToDos()
          }
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
      </ConnectTabContent>
    </ConnectTabs>
  )
}

export default ContentFile
