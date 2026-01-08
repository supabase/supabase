#!/usr/bin/env node

/**
 * CLI Entry Point for Supabase LLM Docs Generator
 *
 * Performance considerations:
 * - Lazy module loading (only load what's needed)
 * - Parallel SDK processing where possible
 * - Efficient error handling
 */

import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';

import { ConfigLoader } from './config/loader.js';
import { OpenRefParser } from './core/parser.js';
import { LLMFormatter } from './core/formatter.js';
import { fetchSpec } from './utils/fetcher.js';
import { Logger, LogLevel } from './utils/logger.js';

// ============================================================================
// CLI PROGRAM
// ============================================================================

const program = new Command();

program
  .name('supabase-llm-docs')
  .description('Generate LLM-optimized documentation from Supabase SDK specifications')
  .version('1.0.0');

// ============================================================================
// GENERATE COMMAND
// ============================================================================

program
  .command('generate')
  .description('Generate LLM documentation for specified SDK(s) and version(s)')
  .requiredOption('--sdk <sdk>', 'SDK to generate (or "all" for all SDKs)')
  .option('--sdk-version <version>', 'Version to generate (or "all" for all versions)', 'latest')
  .option('--config-dir <dir>', 'Configuration directory', 'config')
  .option('--output-dir <dir>', 'Output directory', '../../public/llms-openref')
  .option('-v, --verbose', 'Enable verbose logging', false)
  .option('--force', 'Force re-download specs (ignore cache)', false)
  .action(async (options: {
    sdk: string;
    sdkVersion: string;
    configDir: string;
    outputDir: string;
    verbose: boolean;
    force: boolean;
  }) => {
    // Set log level
    Logger.setLevel(options.verbose ? LogLevel.DEBUG : LogLevel.INFO);

    console.log(chalk.bold.blue('\nSupabase LLM Documentation Generator\n'));

    try {
      // Load configuration
      const config = new ConfigLoader(options.configDir);
      await config.load();

      // Determine which SDKs to process
      const availableSDKs = config.getAllSDKs();
      const sdksToProcess = options.sdk === 'all' ? availableSDKs : [options.sdk];

      // Validate SDK names
      for (const sdkName of sdksToProcess) {
        if (!config.hasSDK(sdkName)) {
          console.error(chalk.red(`\nError: SDK '${sdkName}' not found`));
          console.log(`Available SDKs: ${availableSDKs.join(', ')}`);
          process.exit(1);
        }
      }

      // Build list of (sdk, version) pairs to process
      const tasks: Array<[string, string]> = [];

      for (const sdkName of sdksToProcess) {
        if (options.sdkVersion === 'all') {
          const versions = config.getSDKVersions(sdkName);
          for (const ver of versions) {
            tasks.push([sdkName, ver]);
          }
        } else {
          tasks.push([sdkName, options.sdkVersion]);
        }
      }

      console.log(chalk.cyan(`Processing ${tasks.length} SDK/version pair(s)...\n`));

      // Process each SDK/version combination
      let successCount = 0;
      let failureCount = 0;

      for (const [sdkName, ver] of tasks) {
        const spinner = ora(`Processing ${sdkName} ${ver}...`).start();

        try {
          // Fetch spec (uses cache by default) - returns [specPath, resolvedVersion]
          const [specPath, resolvedVersion] = await fetchSpec(sdkName, ver, config, options.force);

          // Parse spec
          const parser = new OpenRefParser(specPath);
          const parsedData = await parser.parse();

          // Save parsed JSON using resolved version
          const outputDir = `${options.outputDir}/${sdkName}/${resolvedVersion}`;
          await parser.saveJSON(
            parsedData,
            `${outputDir}/parsed/${sdkName}-${resolvedVersion}-spec.json`
          );

          // Format for LLM using resolved version
          const formatter = new LLMFormatter(parsedData, config, sdkName, resolvedVersion);
          await formatter.generateAll(outputDir);

          spinner.succeed(chalk.green(`Completed ${sdkName} ${resolvedVersion}`));
          successCount++;
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : String(error);
          spinner.fail(chalk.red(`Failed ${sdkName} ${ver}: ${errorMsg}`));
          failureCount++;

          if (options.verbose && error instanceof Error && error.stack !== undefined) {
            console.error(chalk.gray(error.stack));
          }

          // Continue with other SDKs even if one fails
          continue;
        }
      }

      // Summary
      console.log(chalk.bold.green(`\nGeneration complete!`));
      console.log(`  Successful: ${successCount}`);
      if (failureCount > 0) {
        console.log(chalk.red(`  Failed: ${failureCount}`));
      }
      console.log(`\nOutput location: ${chalk.cyan(options.outputDir)}`);

      process.exit(failureCount > 0 ? 1 : 0);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error(chalk.bold.red(`\nFatal error: ${errorMsg}`));

      if (options.verbose && error instanceof Error && error.stack !== undefined) {
        console.error(chalk.gray(error.stack));
      }

      process.exit(1);
    }
  });

// ============================================================================
// LIST-SDKS COMMAND
// ============================================================================

program
  .command('list-sdks')
  .description('List all configured SDKs and their versions')
  .option('--config-dir <dir>', 'Configuration directory', 'config')
  .action(async (options: { configDir: string }) => {
    try {
      const config = new ConfigLoader(options.configDir);
      await config.load();

      console.log(chalk.bold('\nConfigured SDKs:\n'));

      const sdks = config.getAllSDKs();

      for (const sdkName of sdks) {
        const sdk = config.getSDK(sdkName);
        const versions = Object.keys(sdk.versions);

        console.log(chalk.cyan(`  ${sdkName}`));
        console.log(`    Name: ${sdk.name}`);
        console.log(`    Language: ${sdk.language}`);
        console.log(`    Versions: ${versions.join(', ')}`);

        // Show details for each version
        for (const ver of versions) {
          const verConfig = sdk.versions[ver];
          if (verConfig !== undefined) {
            console.log(chalk.gray(`      ${ver}:`));
            console.log(chalk.gray(`        Display: ${verConfig.displayName}`));
            console.log(chalk.gray(`        Spec: ${verConfig.spec.url}`));
          }
        }

        console.log();
      }

      console.log(chalk.gray(`Total SDKs: ${sdks.length}`));
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error(chalk.red(`Error: ${errorMsg}`));
      process.exit(1);
    }
  });

// ============================================================================
// VALIDATE COMMAND
// ============================================================================

program
  .command('validate')
  .description('Validate SDK specification')
  .requiredOption('--sdk <sdk>', 'SDK name')
  .option('--version <version>', 'Version to validate', 'latest')
  .option('--config-dir <dir>', 'Configuration directory', 'config')
  .option('-v, --verbose', 'Enable verbose logging', false)
  .action(async (options: {
    sdk: string;
    version: string;
    configDir: string;
    verbose: boolean;
  }) => {
    Logger.setLevel(options.verbose ? LogLevel.DEBUG : LogLevel.INFO);

    console.log(chalk.yellow(`\nValidating ${options.sdk} ${options.version}...\n`));

    try {
      const config = new ConfigLoader(options.configDir);
      await config.load();

      // Fetch and parse spec - returns [specPath, resolvedVersion]
      const [specPath, resolvedVersion] = await fetchSpec(options.sdk, options.version, config);
      const parser = new OpenRefParser(specPath);
      const parsedData = await parser.parse();

      console.log(chalk.green('Validation successful!\n'));
      console.log(`  SDK: ${chalk.cyan(options.sdk)}`);
      console.log(`  Version: ${chalk.cyan(resolvedVersion)}`);
      console.log(`  Operations: ${parsedData.operations.length}`);
      console.log(
        `  Examples: ${parsedData.operations.reduce((sum, op) => sum + op.examples.length, 0)}`
      );
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error(chalk.red(`\nValidation failed: ${errorMsg}`));

      if (options.verbose && error instanceof Error && error.stack !== undefined) {
        console.error(chalk.gray(error.stack));
      }

      process.exit(1);
    }
  });

// ============================================================================
// PARSE AND RUN
// ============================================================================

program.parse();
