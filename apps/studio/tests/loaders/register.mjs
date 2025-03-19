import { register } from 'node:module'
import { pathToFileURL } from 'node:url'

register('./tests/loaders/asset-resource-loader.mjs', pathToFileURL('./'))
