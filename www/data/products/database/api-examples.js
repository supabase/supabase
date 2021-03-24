export default [
  {
    lang: 'js',
    title: 'Create a record',
    code: `// 
//  Create a record in a table
//  Insert new record into a table called \`rooms\`

const { data, error } = await supabase
  .from('rooms')
  .insert({ 
    name: 'Supabase Fan Club', 
    public: true 
  })

// \`data\` returns data
// \`error\` for handling errors






`,
  },
  {
    lang: 'js',
    title: 'Read a record',
    code: `// 
//  reading a record from a table
//  with column \`public\` equals true
    
const { data, error } = await supabase
.from('rooms').select(\`
  name,
  messages ( text )
\`)
.eq('public', true)

// \`data\` returns data
// \`error\` for handling errors
`,
  },
]
