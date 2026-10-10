import { MultipleCodeBlock } from 'ui-patterns/MultipleCodeBlock'

import type { StepContentProps } from '@/components/interfaces/ConnectSheet/Connect.types'

const ContentFile = ({ projectKeys }: StepContentProps) => {
  const supabaseUrl = projectKeys.apiUrl ?? 'your-project-url'
  const supabaseKey = projectKeys.publishableKey ?? projectKeys.anonKey ?? 'your-anon-key'

  const files = [
    {
      name: 'appsettings.json',
      language: 'json',
      code: `
{
  "Supabase": {
    "Url": "${supabaseUrl}",
    "Key": "${supabaseKey}"
  }
}
`,
    },
    {
      name: 'Program.cs',
      language: 'csharp',
      code: `
using Supabase.Extensions.DependencyInjection;

var builder = WebApplication.CreateBuilder(args);

// Registers Supabase.Client and each of its sub-clients (Auth, Postgrest,
// Storage, Functions, Realtime) in the DI container, backed by pooled
// HttpClients from IHttpClientFactory.
//
// Blazor registers the client the same way: use this in your Blazor Server /
// Web App Program.cs, or WebAssemblyHostBuilder.CreateDefault(args) for a
// Blazor WebAssembly client.
builder.Services.AddSupabase(
    builder.Configuration["Supabase:Url"]!,
    builder.Configuration["Supabase:Key"]!
);

var app = builder.Build();

// Inject Supabase.Client (or a single sub-client) wherever you need it — a
// minimal API endpoint here, or a @inject in a Blazor component.
app.MapGet("/todos", async (Supabase.Client supabase) =>
{
    var response = await supabase.From<Todo>().Get();
    return response.Models;
});

app.Run();
`,
    },
    {
      name: 'Models/Todo.cs',
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
