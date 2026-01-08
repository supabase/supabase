import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { BaseBuilder } from '@workflow/builders'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')

class PagesWorkflowBuilder extends BaseBuilder {
  async run() {
    const { baseUrl, paths } = await this.getTsConfigOptions()
    const inputFiles = await this.getInputFiles()
    const workflowDir = path.join(root, '.well-known/workflow/v1')

    await mkdir(workflowDir, { recursive: true })
    await mkdir(path.join(workflowDir, 'step'), { recursive: true })
    await mkdir(path.join(workflowDir, 'flow'), { recursive: true })
    await mkdir(path.join(workflowDir, 'webhook'), { recursive: true })
    await mkdir(path.join(workflowDir, 'webhook/[token]'), { recursive: true })

    await this.createStepsBundle({
      format: 'esm',
      inputFiles,
      outfile: path.join(workflowDir, 'step/route.js'),
      externalizeNonSteps: true,
      tsBaseUrl: baseUrl,
      tsPaths: paths,
    })

    await this.createWorkflowsBundle({
      format: 'esm',
      inputFiles,
      outfile: path.join(workflowDir, 'flow/route.js'),
      bundleFinalOutput: false,
      tsBaseUrl: baseUrl,
      tsPaths: paths,
    })

    await this.createWebhookBundle({
      outfile: path.join(workflowDir, 'webhook/[token]/route.js'),
      bundle: false,
    })
    await writeFile(path.join(workflowDir, '.gitignore'), '*\n')
  }
}

const builder = new PagesWorkflowBuilder({
  dirs: ['workflows', 'src/workflows'],
  buildTarget: 'next',
  stepsBundlePath: '',
  workflowsBundlePath: '',
  webhookBundlePath: '',
  workingDir: root,
  externalPackages: [],
})

await builder.run()
