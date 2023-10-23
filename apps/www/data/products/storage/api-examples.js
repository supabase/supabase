export default [
  {
    lang: 'js',
    title: 'Upload a file',
    code: `
// Upload an image to the "avatars" bucket
const spaceCat = event.target.files[0]
const { data, error } = await supabase
  .storage
  .from('avatars')
  .upload('space-cat.png', spaceCat)
  
  
  


  `,
  },
  {
    lang: 'js',
    title: 'Download a file',
    code: `
// Download the "space-cat.png" image from the "avatars" bucket
const { data, error } = await supabase
    .storage
    .from('avatars')
    .download('space-cat.png')





        
  `,
  },
  {
    lang: 'js',
    title: 'List files',
    code: `
// List all the files in the "avatars" bucket
const { data, error } = await supabase
    .storage
    .from('avatars')
    .list()





        
  `,
  },
  {
    lang: 'js',
    title: 'Move and rename files',
    code: `
// Move and rename files
const { data, error } = await supabase
  .storage
  .from('avatars')
  .move('public/space-cat.png', 'private/space-cat.png')






        
  `,
  },
  {
    lang: 'js',
    title: 'Delete files',
    code: `
// Delete a list of files
const { data, error } = await supabase
  .storage
  .from('avatars')
  .remove([ 'avatar1.png', 'avatar2.png' ])







        
  `,
  },
]
