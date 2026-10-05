import { MultipleCodeBlock } from 'ui-patterns/MultipleCodeBlock'

import type { StepContentProps } from '@/components/interfaces/ConnectSheet/Connect.types'

const ContentFile = ({ projectKeys }: StepContentProps) => {
  const supabaseUrl = projectKeys.apiUrl ?? 'your-project-url'
  const supabaseKey = projectKeys.publishableKey ?? projectKeys.anonKey ?? 'your-anon-key'

  const files = [
    {
      name: 'Program.cs',
      language: 'csharp',
      code: `
using Supabase;
using Supabase.Postgrest.Attributes;
using Supabase.Postgrest.Models;

var url = "${supabaseUrl}";
var key = "${supabaseKey}";

var supabase = new Client(url, key, new SupabaseOptions
{
    AutoConnectRealtime = true
});
await supabase.InitializeAsync();

var response = await supabase.From<Todo>().Get();
foreach (var todo in response.Models)
{
    Console.WriteLine(todo.Name);
}

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
