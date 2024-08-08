import fs from 'fs'
import path from 'path'
import { NextApiRequest, NextApiResponse } from 'next'

function getFilePaths(folderPath: string, baseFolder = ''): string[] {
  const filepaths: string[] = []

  const files = fs.readdirSync(folderPath)
  for (const file of files) {
    if (file === '.DS_Store') {
      continue
    }

    const filePath = path.join(folderPath, file)
    const stats = fs.statSync(filePath)

    if (stats.isDirectory()) {
      const subFolder = path.join(baseFolder, file)
      const subFolderPaths = getFilePaths(filePath, subFolder)
      filepaths.push(...subFolderPaths)
    } else {
      const filePathRelativeToBase = path.join(baseFolder, file)
      if (file !== '.DS_Store') {
        filepaths.push(filePathRelativeToBase)
      }
      filepaths.push(filePathRelativeToBase)
    }
  }

  return filepaths
}

export default async function getFileNames(req: NextApiRequest, res: NextApiResponse) {
  const folderPath = path.join(process.cwd(), 'components/interfaces/Home/Connect/content')
  const filepaths = getFilePaths(folderPath)
  res.statusCode = 200
  res.json(filepaths)
}
