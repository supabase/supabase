export default [
  {
    lang: 'js',
    title: 'Upload a file',
    code: `
  
  const { data, error } = await supabase
    .storage
    .from('avatars-bucket')
    .upload('avatar.png', avatarFile)
  
  
  


  `,
  },
  {
    lang: 'js',
    title: 'Download a file',
    code: `
    const { data, error } = await supabase
        .storage
        .from('avatars-bucket')
        .download('avatar.png')





        
  `,
  },
]
