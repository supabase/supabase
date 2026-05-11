'use client'

import { motion } from 'framer-motion'

const npmList = [
  'fetch',
  'crypto',
  'ESLint',
  'atob',
  'moment',
  'express',
  'fastify',
  'socket.io',
  'async',
  'lodash',
  'underscore',
  'ramda',
  'validator',
  'yup',
  'day.js',
  'date-fns',
  'jsonwebtoken',
  'bcrypt',
  'uuid',
  'fs-extra',
  'rimraf',
  'mkdirp',
  'glob',
  'shelljs',
  '@supabase/supabase-js',
  'js-yaml',
  'typescript',
  'jest',
  'vitest',
  'winston',
  'pino',
  'debug',
  'eslint',
  'prettier',
  'nodemon',
  'tsx',
  'dotenv',
  'zod',
  'valibot',
  '@octokit/rest',
  'cross-env',
  'commander',
  'yargs',
  'minimist',
  'chalk',
  'colors',
  'ora',
  'kleur',
  'picocolors',
  '@aws-sdk',
  '@google-cloud/storage',
  'axios',
  'got',
  'ky',
  'passport',
  'nodemailer',
  'resend',
  '@sendgrid/mail',
  '@supabase/auth-helpers-react',
  'mongoose',
  'prisma',
  'drizzle-orm',
  'kysely',
  'openai',
  '@anthropic-ai/sdk',
  'langchain',
  'jwt',
  'react',
  'solid-js',
  'svelte',
  'mocha',
  'autoprefixer',
  '@supabase/auth-ui-react',
  'gray-matter',
  'marked',
  'unified',
  'rehype',
  'remark',
  'request',
  'prop-types',
  'react-dom',
  'bluebird',
  'p-limit',
  'p-queue',
  'vue',
  'nuxt',
  'next',
  'tslib',
  'ts-node',
  'inquirer',
  'prompts',
  'webpack',
  'esbuild',
  'rollup',
  'classnames',
  'clsx',
  'body-parser',
  'rxjs',
  'xstate',
  'babel-runtime',
  'jquery',
  'stripe',
  '@clerk/clerk-js',
  'posthog-js',
  'sentry',
  'datadog-metrics',
  'sharp',
  'jimp',
  'pdf-lib',
  'archiver',
  'node-cron',
  'bull',
  'ioredis',
  'cheerio',
  'playwright',
  'puppeteer',
  'stytch',
  'twilio',
  'vonage',
  '@slack/web-api',
  'discord.js',
  'telegraf',
  'hono',
  'oak',
  'itty-router',
  'zx',
  'execa',
  'nanoid',
  'ms',
  'qs',
  'node-fetch',
  'undici',
  'msw',
  'jose',
  'qrcode',
  'jsdom',
  'xlsx',
  'csv-parse',
  'papaparse',
  'yaml',
  'bullmq',
  'lru-cache',
  'keyv',
  'deepmerge',
  'immer',
  'zustand',
  'jotai',
]

const center = Math.floor(npmList.length / 2)
const maxDistance = center

const NpmEcosystem = ({ isHovered = false }: { isHovered?: boolean }) => {
  return (
    <div className="absolute inset-0 flex justify-center overflow-hidden">
      {/* Pills */}
      <div className="absolute flex flex-wrap items-start gap-2" style={{ left: -50, right: -150 }}>
        {npmList.map((module, i) => {
          const distance = Math.abs(i - center)
          return (
            <motion.span
              key={`${module}-${i}`}
              className="py-1 px-2 rounded-md bg-surface-75 border text-foreground-muted text-sm"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={
                isHovered
                  ? {
                      opacity: 1,
                      scale: 1,
                      transition: {
                        delay: distance * 0.012,
                        duration: 0.2,
                        ease: 'easeOut',
                      },
                    }
                  : {
                      opacity: 0,
                      scale: 0.85,
                      transition: {
                        delay: (maxDistance - distance) * 0.008,
                        duration: 0.15,
                        ease: 'easeIn',
                      },
                    }
              }
            >
              {module}
            </motion.span>
          )
        })}
      </div>

      {/* Radial gradient fade */}
      <div
        className="absolute inset-0 z-10"
        style={{
          background: `radial-gradient(70% 50% at 50% 50%, transparent, hsl(var(--background-surface-75)))`,
        }}
      />

      {/* npm logo */}
      <div className="absolute z-20 inset-0 flex flex-col items-center justify-center">
        <svg
          width="111"
          height="42"
          viewBox="0 0 111 42"
          fill="currentColor"
          className="text-foreground-light"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M36.1763 37.4452H49.2591V30.8616H62.342V4.52698H36.1763V37.4452ZM49.2591 11.1106H55.8006V24.2779H49.2591V11.1106ZM67.5752 4.52698V30.8616H80.6581V11.1106H87.1995V30.8616H93.7409V11.1106H100.282V30.8616H106.824V4.52698H67.5752ZM4.77734 30.8616H17.8602V11.1106H24.4017V30.8616H30.9431V4.52698H4.77734V30.8616Z" />
        </svg>
      </div>
    </div>
  )
}

export default NpmEcosystem
