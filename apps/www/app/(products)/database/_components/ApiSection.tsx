import { createHighlighter, type ThemeRegistration } from 'shiki'
import { ApiSectionClient } from './ApiSectionClient'

// ── Shiki themes ────────────────────────────────────────────────────────────

const supabaseDark: ThemeRegistration = {
  name: 'supabase-dark',
  type: 'dark',
  colors: {
    'editor.background': '#00000000',
    'editor.foreground': '#ffffff',
  },
  tokenColors: [
    { scope: ['keyword', 'storage', 'storage.type', 'storage.modifier'], settings: { foreground: '#bda4ff' } },
    { scope: ['entity.name.function', 'support.function', 'entity.name.tag', 'support.class.component'], settings: { foreground: '#3ecf8e' } },
    { scope: ['constant', 'variable.other.constant', 'support.constant'], settings: { foreground: '#3ecf8e' } },
    { scope: ['variable.other.property', 'support.type.property-name', 'meta.object-literal.key', 'entity.other.attribute-name'], settings: { foreground: '#3ecf8e' } },
    { scope: ['string', 'string.quoted'], settings: { foreground: '#ffcda1' } },
    { scope: ['comment', 'punctuation.definition.comment'], settings: { foreground: '#7e7e7e' } },
    { scope: ['variable.parameter'], settings: { foreground: '#ffffff' } },
    { scope: ['punctuation'], settings: { foreground: '#ffffff' } },
    { scope: ['constant.numeric'], settings: { foreground: '#ededed' } },
    { scope: ['markup.underline.link'], settings: { foreground: '#ffffff' } },
    { scope: ['markup.inserted'], settings: { foreground: '#3ecf8e' } },
    { scope: ['markup.deleted'], settings: { foreground: '#F06A50' } },
  ],
}

const supabaseLight: ThemeRegistration = {
  name: 'supabase-light',
  type: 'light',
  colors: {
    'editor.background': '#00000000',
    'editor.foreground': '#525252',
  },
  tokenColors: [
    { scope: ['keyword', 'storage', 'storage.type', 'storage.modifier'], settings: { foreground: '#6b35dc' } },
    { scope: ['entity.name.function', 'support.function', 'entity.name.tag', 'support.class.component'], settings: { foreground: '#15593b' } },
    { scope: ['constant', 'variable.other.constant', 'support.constant'], settings: { foreground: '#15593b' } },
    { scope: ['variable.other.property', 'support.type.property-name', 'meta.object-literal.key', 'entity.other.attribute-name'], settings: { foreground: '#15593b' } },
    { scope: ['string', 'string.quoted'], settings: { foreground: '#f1a10d' } },
    { scope: ['comment', 'punctuation.definition.comment'], settings: { foreground: '#7e7e7e' } },
    { scope: ['variable.parameter'], settings: { foreground: '#525252' } },
    { scope: ['punctuation'], settings: { foreground: '#a0a0a0' } },
    { scope: ['constant.numeric'], settings: { foreground: '#525252' } },
    { scope: ['markup.underline.link'], settings: { foreground: '#525252' } },
  ],
}

// ── Language → Shiki lang mapping ───────────────────────────────────────────

const LANG_MAP: Record<string, string> = {
  JavaScript: 'javascript',
  Flutter: 'dart',
  Python: 'python',
  'C#': 'csharp',
  Kotlin: 'kotlin',
  Swift: 'swift',
}

// ── API examples per language ───────────────────────────────────────────────

const API_EXAMPLES = [
  {
    icon: 'Search' as const,
    title: 'Fetch records',
    description: 'Query tables with joins, filters, and ordering in a single request.',
    code: {
      JavaScript: `// Fetch all public rooms with their messages
const { data: rooms } = await supabase
  .from('rooms')
  .select(\`
    id, name, created_at,
    messages ( id, text, user_id )
  \`)
  .eq('public', true)
  .order('created_at', { ascending: false })
  .limit(20)`,
      Flutter: `// Fetch all public rooms with their messages
final rooms = await supabase
  .from('rooms')
  .select('id, name, created_at, messages ( id, text, user_id )')
  .eq('public', true)
  .order('created_at', ascending: false)
  .limit(20);`,
      Python: `# Fetch all public rooms with their messages
rooms = supabase.table("rooms") \\
  .select("id, name, created_at, messages ( id, text, user_id )") \\
  .eq("public", True) \\
  .order("created_at", desc=True) \\
  .limit(20) \\
  .execute()`,
      'C#': `// Fetch all public rooms with their messages
var rooms = await supabase
  .From<Room>()
  .Select("id, name, created_at, messages ( id, text, user_id )")
  .Filter("public", Operator.Equals, "true")
  .Order("created_at", Ordering.Descending)
  .Limit(20)
  .Get();`,
      Kotlin: `// Fetch all public rooms with their messages
val rooms = supabase.from("rooms")
  .select(Columns.raw("""
    id, name, created_at,
    messages ( id, text, user_id )
  """)) {
    filter { eq("public", true) }
    order("created_at", Order.DESCENDING)
    limit(20)
  }`,
      Swift: `// Fetch all public rooms with their messages
let rooms: [Room] = try await supabase
  .from("rooms")
  .select("id, name, created_at, messages ( id, text, user_id )")
  .eq("public", value: true)
  .order("created_at", ascending: false)
  .limit(20)
  .execute()
  .value`,
    },
  },
  {
    icon: 'Plus' as const,
    title: 'Insert with relations',
    description: 'Create rows across related tables with automatic foreign key resolution.',
    code: {
      JavaScript: `// Create a room and its first message
const { data: room } = await supabase
  .from('rooms')
  .insert({ name: 'Design Team', public: false })
  .select()
  .single()

await supabase
  .from('messages')
  .insert({
    room_id: room.id,
    text: 'Welcome to the team channel!',
    user_id: session.user.id,
  })`,
      Flutter: `// Create a room and its first message
final room = await supabase
  .from('rooms')
  .insert({'name': 'Design Team', 'public': false})
  .select()
  .single();

await supabase
  .from('messages')
  .insert({
    'room_id': room['id'],
    'text': 'Welcome to the team channel!',
    'user_id': session.user.id,
  });`,
      Python: `# Create a room and its first message
room = supabase.table("rooms") \\
  .insert({"name": "Design Team", "public": False}) \\
  .execute()

supabase.table("messages") \\
  .insert({
    "room_id": room.data[0]["id"],
    "text": "Welcome to the team channel!",
    "user_id": session.user.id,
  }) \\
  .execute()`,
      'C#': `// Create a room and its first message
var room = await supabase
  .From<Room>()
  .Insert(new Room { Name = "Design Team", Public = false })
  .Single();

await supabase
  .From<Message>()
  .Insert(new Message {
    RoomId = room.Id,
    Text = "Welcome to the team channel!",
    UserId = session.User.Id,
  });`,
      Kotlin: `// Create a room and its first message
val room = supabase.from("rooms")
  .insert(Room(name = "Design Team", public = false)) {
    select()
  }.decodeSingle<Room>()

supabase.from("messages")
  .insert(Message(
    roomId = room.id,
    text = "Welcome to the team channel!",
    userId = session.user.id,
  ))`,
      Swift: `// Create a room and its first message
let room: Room = try await supabase
  .from("rooms")
  .insert(["name": "Design Team", "public": false])
  .select()
  .single()
  .execute()
  .value

try await supabase
  .from("messages")
  .insert([
    "room_id": room.id,
    "text": "Welcome to the team channel!",
    "user_id": session.user.id,
  ])
  .execute()`,
    },
  },
  {
    icon: 'ArrowDownUp' as const,
    title: 'Update records',
    description: 'Modify rows with conditions and return the updated data in one call.',
    code: {
      JavaScript: `// Update a room and return the updated row
const { data: updated } = await supabase
  .from('rooms')
  .update({
    name: 'Engineering Team',
    public: false,
    updated_at: new Date().toISOString(),
  })
  .eq('id', roomId)
  .select()
  .single()`,
      Flutter: `// Update a room and return the updated row
final updated = await supabase
  .from('rooms')
  .update({
    'name': 'Engineering Team',
    'public': false,
    'updated_at': DateTime.now().toIso8601String(),
  })
  .eq('id', roomId)
  .select()
  .single();`,
      Python: `# Update a room and return the updated row
updated = supabase.table("rooms") \\
  .update({
    "name": "Engineering Team",
    "public": False,
    "updated_at": datetime.now().isoformat(),
  }) \\
  .eq("id", room_id) \\
  .execute()`,
      'C#': `// Update a room and return the updated row
var updated = await supabase
  .From<Room>()
  .Filter("id", Operator.Equals, roomId)
  .Set(x => x.Name, "Engineering Team")
  .Set(x => x.Public, false)
  .Set(x => x.UpdatedAt, DateTime.UtcNow)
  .Update()
  .Single();`,
      Kotlin: `// Update a room and return the updated row
val updated = supabase.from("rooms")
  .update({
    Room::name setTo "Engineering Team"
    Room::public setTo false
    Room::updatedAt setTo Clock.System.now()
  }) {
    filter { eq("id", roomId) }
    select()
  }.decodeSingle<Room>()`,
      Swift: `// Update a room and return the updated row
let updated: Room = try await supabase
  .from("rooms")
  .update([
    "name": "Engineering Team",
    "public": false,
    "updated_at": ISO8601DateFormatter().string(from: Date()),
  ])
  .eq("id", value: roomId)
  .select()
  .single()
  .execute()
  .value`,
    },
  },
  {
    icon: 'Filter' as const,
    title: 'Filter & paginate',
    description: 'Full-text search, range queries, and cursor-based pagination built in.',
    code: {
      JavaScript: `// Full-text search with pagination
const { data, count } = await supabase
  .from('rooms')
  .select('id, name, member_count', { count: 'exact' })
  .textSearch('name', 'design')
  .gte('member_count', 5)
  .range(0, 9)
  .order('member_count', { ascending: false })`,
      Flutter: `// Full-text search with pagination
final response = await supabase
  .from('rooms')
  .select('id, name, member_count', const FetchOptions(count: CountOption.exact))
  .textSearch('name', 'design')
  .gte('member_count', 5)
  .range(0, 9)
  .order('member_count', ascending: false);`,
      Python: `# Full-text search with pagination
response = supabase.table("rooms") \\
  .select("id, name, member_count", count="exact") \\
  .text_search("name", "design") \\
  .gte("member_count", 5) \\
  .range(0, 9) \\
  .order("member_count", desc=True) \\
  .execute()`,
      'C#': `// Full-text search with pagination
var response = await supabase
  .From<Room>()
  .Select("id, name, member_count")
  .Filter("name", Operator.FTS, "design")
  .Filter("member_count", Operator.GreaterThanOrEqual, "5")
  .Range(0, 9)
  .Order("member_count", Ordering.Descending)
  .Get();`,
      Kotlin: `// Full-text search with pagination
val response = supabase.from("rooms")
  .select(Columns.list("id", "name", "member_count")) {
    filter {
      textSearch("name", "design")
      gte("member_count", 5)
    }
    range(0L..9L)
    order("member_count", Order.DESCENDING)
  }`,
      Swift: `// Full-text search with pagination
let response = try await supabase
  .from("rooms")
  .select("id, name, member_count", head: false, count: .exact)
  .textSearch("name", query: "design")
  .gte("member_count", value: 5)
  .range(from: 0, to: 9)
  .order("member_count", ascending: false)
  .execute()`,
    },
  },
]

// ── Server component: pre-highlights all code ───────────────────────────────

export async function ApiSection() {
  const hl = await createHighlighter({
    themes: [supabaseDark, supabaseLight],
    langs: Object.values(LANG_MAP),
  })

  const examples = API_EXAMPLES.map((example) => ({
    icon: example.icon,
    title: example.title,
    description: example.description,
    languages: Object.fromEntries(
      Object.entries(example.code).map(([lang, code]) => [
        lang,
        {
          darkHtml: hl.codeToHtml(code, { lang: LANG_MAP[lang], theme: 'supabase-dark' }),
          lightHtml: hl.codeToHtml(code, { lang: LANG_MAP[lang], theme: 'supabase-light' }),
        },
      ])
    ),
  }))

  hl.dispose()

  return <ApiSectionClient examples={examples} />
}
