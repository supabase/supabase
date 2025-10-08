import { blocks as originBlocks } from './registry/index'

const blocks = originBlocks.map((item) => {
  const newItem = { ...item }
  newItem.files = newItem.files?.map((file) => {
    if (file.path.startsWith('registry/')) {
      return { ...file, path: `node_modules/@supabase/vue-blocks/${file.path}` }
    }
    return file
  })
  return newItem
})

export { blocks }
