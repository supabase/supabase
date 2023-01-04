import fs from 'fs/promises'
import { convert } from 'html-to-text'
import { NextApiHandler } from 'next'
import { mdxToHtml } from '~/lib/mdx/render'

const handler: NextApiHandler = async (req, res) => {
  const slug = req.query.slug as []
  console.log('slug is', slug.join('/'))

  // only handle .mdx files
  //const path = slug.join('/')
  //const path = 'pages/guides/getting-started/tutorials/with-angular.mdx'
  const path = 'pages/guides/functions.mdx'
  const file = await fs.readFile(path, { encoding: 'utf8' })
  const html = await mdxToHtml(file)
  const text = convert(html)

  res.status(200).send(text)
  //res.status(404).send('Not found')
}

export default handler
