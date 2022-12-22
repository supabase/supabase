import fs from 'fs/promises'
import { convert } from 'html-to-text'
import { NextApiHandler } from 'next'
import { mdxToHtml } from '~/lib/mdx/render'

const handler: NextApiHandler = async (req, res) => {
  const path = 'pages/guides/getting-started/features.mdx'
  const file = await fs.readFile(path, { encoding: 'utf8' })
  const html = await mdxToHtml(file)
  const text = convert(html)

  res.status(200).send(text)
}

export default handler
