export default [
  {
    lang: 'sql',
    title: 'Allow anyone to view',
    code: `create table profiles (
    id serial primary key,
    username text unique,
    avatar_url 
);

alter table profiles 
    enable row level security;

create policy "Public profiles are viewable by everyone." 
    on profiles 
    for select using (true);
  
  
  
  
  
  
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
