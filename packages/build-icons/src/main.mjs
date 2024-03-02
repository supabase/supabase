#!/usr/bin/env node
import fs from 'fs'
import getArgumentOptions from 'minimist'
import path from 'path'

import generateExportsFile from './building/generateExportsFile.mjs'
import generateIconFiles from './building/generateIconFiles.mjs'
import renderIconsObject from './render/renderIconsObject.mjs'

import generateAliasesFile from './building/generateAliasesFile.mjs'
import generateDynamicImports from './building/generateDynamicImports.mjs'
import getIconMetaData from './utils/getIconMetaData.mjs'
import { readSvgDirectory } from './utils/helpers.mjs'

const cliArguments = getArgumentOptions(process.argv.slice(2))

const ICONS_DIR = path.resolve(process.cwd(), 'src/raw-icons')
const OUTPUT_DIR = path.resolve(process.cwd(), cliArguments.output || 'src')

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR)
}

const {
  renderUniqueKey = false,
  templateSrc,
  silent = false,
  iconFileExtension = '.js',
  importImportFileExtension = '',
  exportFileName = 'index.js',
  withAliases = false,
  aliasNamesOnly = false,
  withDynamicImports = false,
  separateAliasesFile = false,
  aliasesFileExtension = '.js',
  aliasImportFileExtension = '',
  pretty = true,
} = cliArguments

async function buildIcons() {
  if (templateSrc == null) {
    throw new Error('No `templateSrc` argument given.')
  }
  const svgFiles = readSvgDirectory(ICONS_DIR)

  const icons = renderIconsObject(svgFiles, ICONS_DIR, renderUniqueKey)

  const { default: iconFileTemplate } = await import(path.resolve(process.cwd(), templateSrc))

  const iconMetaData = await getIconMetaData(ICONS_DIR)

  // Generates iconsNodes files for each icon
  generateIconFiles({
    iconNodes: icons,
    outputDirectory: OUTPUT_DIR,
    template: iconFileTemplate,
    showLog: !silent,
    iconFileExtension,
    pretty: JSON.parse(pretty),
    iconsDir: ICONS_DIR,
    iconMetaData,
  })

  if (withAliases) {
    await generateAliasesFile({
      iconNodes: icons,
      iconMetaData,
      aliasNamesOnly,
      iconFileExtension,
      outputDirectory: OUTPUT_DIR,
      fileExtension: aliasesFileExtension,
      aliasImportFileExtension,
      separateAliasesFile,
      showLog: !silent,
    })
  }

  if (withDynamicImports) {
    generateDynamicImports({
      iconNodes: icons,
      outputDirectory: OUTPUT_DIR,
      fileExtension: aliasesFileExtension,
      showLog: !silent,
    })
  }

  // Generates entry files for the compiler filled with icons exports
  generateExportsFile(
    path.join(OUTPUT_DIR, 'icons', exportFileName),
    path.join(OUTPUT_DIR, 'icons'),
    icons,
    importImportFileExtension
  )
}

try {
  buildIcons()
} catch (error) {
  console.error(error)
}
