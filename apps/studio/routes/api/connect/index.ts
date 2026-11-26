import fs from 'fs'
import path from 'path'
import { createFileRoute } from '@tanstack/react-router'

import { createApiHandlers } from '@/lib/api/apiWrapper'

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
      filepaths.push(filePathRelativeToBase)
    }
  }

  return filepaths
}

export const Route = createFileRoute('/api/connect/')({
  server: {
    handlers: createApiHandlers({
      GET: async () => {
        const folderPath = path.join(process.cwd(), 'components/interfaces/ConnectSheet/content')
        const filepaths = getFilePaths(folderPath)
        return Response.json(filepaths)
      },
    }),
  },
})
