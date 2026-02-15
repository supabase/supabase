import { MultipleCodeBlock } from 'ui-patterns/MultipleCodeBlock'

import type { StepContentProps } from '@/components/interfaces/ConnectSheet/Connect.types'

const ContentFile = ({ projectKeys }: StepContentProps) => {
  const files = [
    {
      name: 'MainActivity.kt',
      language: 'kotlin',
      code: `
val supabase = createSupabaseClient(
    supabaseUrl = "${projectKeys.apiUrl ?? 'your-project-url'}",
    supabaseKey = "${projectKeys.publishableKey ?? '<prefer publishable key instead of anon key for mobile apps>'}"
  ) {
    install(Postgrest)
}

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            MaterialTheme {
                // A surface container using the 'background' color from the theme
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = MaterialTheme.colorScheme.background
                ) {
                    TodoList()
                }
            }
        }
    }
}

@Composable
fun TodoList() {
    var items by remember { mutableStateOf<List<TodoItem>>(listOf()) }
    LaunchedEffect(Unit) {
        withContext(Dispatchers.IO) {
            items = supabase.from("todos")
                              .select().decodeList<TodoItem>()
        }
    }
    LazyColumn {
        items(
            items,
            key = { item -> item.id },
        ) { item ->
            Text(
                item.name,
                modifier = Modifier.padding(8.dp),
            )
        }
    }
}
`,
    },
    {
      name: 'TodoItem.kt',
      language: 'kotlin',
      code: `
@Serializable
data class TodoItem(val id: Int, val name: String)
        `,
    },
  ]

  return <MultipleCodeBlock files={files} />
}

export default ContentFile
