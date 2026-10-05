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
using Supabase;
using UnityEngine;

// Keep a single client alive for the whole game and expose it through a
// MonoBehaviour singleton that survives scene loads.
public class SupabaseManager : MonoBehaviour
{
    public static SupabaseManager Instance { get; private set; }
    public Client Supabase { get; private set; }

    private const string Url = "${supabaseUrl}";
    private const string Key = "${supabaseKey}";

    private async void Awake()
    {
        if (Instance != null)
        {
            Destroy(gameObject);
            return;
        }

        Instance = this;
        DontDestroyOnLoad(gameObject);

        var options = new SupabaseOptions
        {
            AutoConnectRealtime = true
        };

        Supabase = new Client(Url, Key, options);
        await Supabase.InitializeAsync();
    }
}
`,
    },
    {
      name: 'TodoList.cs',
      language: 'csharp',
      code: `
using UnityEngine;

public class TodoList : MonoBehaviour
{
    private async void Start()
    {
        var supabase = SupabaseManager.Instance.Supabase;

        var response = await supabase.From<Todo>().Get();
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
