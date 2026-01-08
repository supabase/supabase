const semver = require('semver')

function ensureWorkflowEnv(workflows) {
  const hasDeploymentId = Boolean(process.env.VERCEL_DEPLOYMENT_ID)
  if (!hasDeploymentId) {
    if (!process.env.WORKFLOW_TARGET_WORLD) {
      process.env.WORKFLOW_TARGET_WORLD = 'local'
      process.env.WORKFLOW_LOCAL_DATA_DIR = '.next/workflow-data'
    }
    const maybePort = workflows?.local?.port
    if (maybePort) {
      process.env.PORT = maybePort.toString()
    }
  } else if (!process.env.WORKFLOW_TARGET_WORLD) {
    process.env.WORKFLOW_TARGET_WORLD = 'vercel'
  }
}

function applyTurbopackLoader(nextConfig, loaderPath) {
  if (!nextConfig.turbopack) nextConfig.turbopack = {}
  if (!nextConfig.turbopack.rules) nextConfig.turbopack.rules = {}

  const existingRules = nextConfig.turbopack.rules
  const nextVersion = require('next/package.json').version
  const supportsTurboCondition = semver.gte(nextVersion, '16.0.0')

  const extensions = ['*.tsx', '*.ts', '*.jsx', '*.js', '*.mjs', '*.mts', '*.cjs', '*.cts']

  for (const key of extensions) {
    const priorRule = existingRules[key] || {}
    existingRules[key] = {
      ...(supportsTurboCondition
        ? {
            condition: {
              ...(priorRule.condition || {}),
              any: [...(priorRule.condition?.any || []), { content: /(use workflow|use step)/ }],
            },
          }
        : {}),
      loaders: [...(priorRule.loaders || []), loaderPath],
    }
  }
}

function applyWebpackLoader(nextConfig, loaderPath) {
  const existingWebpackModify = nextConfig.webpack
  nextConfig.webpack = (...args) => {
    const [webpackConfig] = args

    if (!webpackConfig.module) webpackConfig.module = {}
    if (!webpackConfig.module.rules) webpackConfig.module.rules = []

    webpackConfig.module.rules.push({
      test: /.*\.(mjs|cjs|cts|ts|tsx|js|jsx)$/,
      loader: loaderPath,
    })

    return existingWebpackModify ? existingWebpackModify(...args) : webpackConfig
  }
}

function withWorkflow(nextConfigOrFn, { workflows } = {}) {
  ensureWorkflowEnv(workflows)
  const loaderPath = require.resolve('@workflow/next/loader')

  return async function buildConfig(phase, ctx) {
    const resolvedConfig =
      typeof nextConfigOrFn === 'function' ? await nextConfigOrFn(phase, ctx) : nextConfigOrFn || {}

    const nextConfig = { ...resolvedConfig }

    applyTurbopackLoader(nextConfig, loaderPath)
    applyWebpackLoader(nextConfig, loaderPath)

    // Pages Router setup builds workflows separately (see build-workflows-pages.mjs),
    // so we intentionally skip the upstream Next.js builder here.
    return nextConfig
  }
}

module.exports = { withWorkflow }
