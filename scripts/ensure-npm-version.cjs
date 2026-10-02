#!/usr/bin/env node

const { execFileSync } = require('node:child_process')
const { readFileSync } = require('node:fs')
const { resolve } = require('node:path')

const packageJsonPath = resolve(process.cwd(), 'package.json')
const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'))
const packageManager = packageJson.packageManager
const match = /^npm@(\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?)$/.exec(packageManager || '')

if (!match) {
  console.error('package.json packageManager must be npm@<version>')
  process.exit(1)
}

const expectedVersion = match[1]

const currentVersion = () => execFileSync('npm', ['--version'], { encoding: 'utf8' }).trim()

const beforeVersion = currentVersion()

if (beforeVersion !== expectedVersion) {
  console.log(`Installing npm@${expectedVersion} over npm@${beforeVersion}`)
  execFileSync('npm', ['install', '--global', '--engine-strict=false', `npm@${expectedVersion}`], {
    stdio: 'inherit',
  })
}

const afterVersion = currentVersion()

if (afterVersion !== expectedVersion) {
  console.error(`Expected npm@${expectedVersion}, found npm@${afterVersion}`)
  process.exit(1)
}

console.log(`Using npm@${afterVersion}`)
