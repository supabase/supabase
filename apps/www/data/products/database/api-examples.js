/*
 * description
 */
export default [
  {
    lang: 'js',
    title: 'Create a record',
    size: 'large',
    code: `// Create a record

// Insert new record into a table called \`rooms\`
const { data, error } = await supabase
  .from('rooms')
  .insert({ 
    name: 'Supabase Fan Club', 
    public: true 
  })


  








`,
  },
  {
    lang: 'js',
    title: 'Read a record',
    size: 'large',
    code: `// Read a record

// Retrieve all of the \`rooms\`, 
// and get all the messages for each room.
const { data, error } = await supabase
  .from('rooms').select(\`
    name,
    messages ( text )
  \`)
  .eq('public', true)










`,
  },
]
