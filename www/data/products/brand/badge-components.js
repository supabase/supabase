
/*
 * description
 */
export default [
  {
    lang: 'html',
    title: 'HTML Snippet',
    size: 'large',
    code: `
<!-- Simply copy and paste the following HTML -->
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
    title: 'React Component',
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

  {
    lang: 'js',
    title: 'SVG',
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
