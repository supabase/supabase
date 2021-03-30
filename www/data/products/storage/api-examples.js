export default [
  {
    lang: 'js',
    title: 'Upload a file',
    code: `
  
  const { data, error } = await supabase
    .storage
    .from('avatars-bucket')
    .uploadFile('avatar.png', avatarFile)
  
  
  


  `,
  },
  {
    lang: 'js',
    title: 'Download a file',
    code: `
    const { data, error } = await supabase
        .storage
        .from('avatars-bucket')
        .downloadFile('avatar.png')





        
  `,
  },
]
