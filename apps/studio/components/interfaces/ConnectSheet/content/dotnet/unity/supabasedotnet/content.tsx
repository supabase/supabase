import { MultipleCodeBlock } from 'ui-patterns/MultipleCodeBlock'

import type { StepContentProps } from '@/components/interfaces/ConnectSheet/Connect.types'

const ContentFile = ({ projectKeys }: StepContentProps) => {
  const supabaseUrl = projectKeys.apiUrl ?? 'your-project-url'
  const supabaseKey = projectKeys.publishableKey ?? projectKeys.anonKey ?? 'your-anon-key'

  const files = [
    {
      name: 'SupabaseManager.cs',
      language: 'csharp',
      code: `
using System.Threading.Tasks;
using Supabase;
using UnityEngine;

// Keep a single client alive for the whole game and expose it through a
// MonoBehaviour singleton that survives scene loads.
public class SupabaseManager : MonoBehaviour
{
    public static SupabaseManager Instance { get; private set; }
    public Client Supabase { get; private set; }

    // Await this before using the client. Awake returns at the first await, so
    // other scripts could run before InitializeAsync() finishes without it.
    public Task InitializationTask { get; private set; }

    private const string Url = "${supabaseUrl}";
    private const string Key = "${supabaseKey}";

    private void Awake()
    {
        if (Instance != null)
        {
            Destroy(gameObject);
            return;
        }

        Instance = this;
        DontDestroyOnLoad(gameObject);
        InitializationTask = InitializeAsync();
    }

    private async Task InitializeAsync()
    {
        Supabase = new Client(Url, Key, new SupabaseOptions
        {
            AutoConnectRealtime = true
        });
        await Supabase.InitializeAsync();
    }
}
`,
    },
    {
      name: 'TodoList.cs',
      language: 'csharp',
      code: `
using System.Threading.Tasks;
using UnityEngine;

public class TodoList : MonoBehaviour
{
    // Lifecycle hooks can't be awaited, so start the async work from a Task
    // method rather than an "async void" Start, which would swallow exceptions.
    private void Start()
    {
        _ = LoadTodosAsync();
    }

    private async Task LoadTodosAsync()
    {
        var manager = SupabaseManager.Instance;
        await manager.InitializationTask;

        var response = await manager.Supabase.From<Todo>().Get();
        foreach (var todo in response.Models)
        {
            Debug.Log(todo.Name);
        }
    }
}
`,
    },
    {
      name: 'Todo.cs',
      language: 'csharp',
      code: `
using Supabase.Postgrest.Attributes;
using Supabase.Postgrest.Models;

[Table("todos")]
public class Todo : BaseModel
{
    [PrimaryKey("id")]
    public long Id { get; set; }

    [Column("name")]
    public string Name { get; set; } = string.Empty;
}
`,
    },
  ]

  return <MultipleCodeBlock files={files} />
}

// Used as a dynamic import
export default ContentFile
