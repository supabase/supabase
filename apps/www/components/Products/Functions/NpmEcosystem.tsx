import React from 'react'

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
  'winston',
  'debug',
  'eslint',
  'nodemon',
  'dotenv',
  '@octokit/rest',
  'cross-env',
  'commander',
  'yargs',
  'minimist',
  'chalk',
  'colors',
  'ora',
  '@aws-sdk',
  'axios',
  'passport',
  'nodemailer',
  '@supabase/auth-helpers-react',
  'mongoose',
  'openai',
  'jwt',
  'react',
  'mocha',
  'autoprefixer',
  '@supabase/auth-ui-react',
  'gray-matter',
  'request',
  'prop-types',
  'react-dom',
  'bluebird',
  'vue',
  'tslib',
  'inquirer',
  'webpack',
  'classnames',
  'body-parser',
  'rxjs',
  'babel-runtime',
  'jquery',
  'fetch',
  'crypto',
  'eslint',
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
  'minimist',
  'chalk',
]

const NpmEcosystem = () => {
  return (
    <div className="relative w-full h-full flex justify-center overflow-hidden group">
      <div
        className="absolute flex flex-wrap items-start gap-2 opacity-80 dark:opacity-50"
        style={{ left: -50, right: -150 }}
      >
        {npmList.map((module, i) => (
          <span
            key={`${module}-${i}`}
            className="py-1 px-2 rounded-md bg-surface-75 border text-foreground-muted"
          >
            {module}
          </span>
        ))}
      </div>
      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(70% 50% at 50% 50%, transparent, hsl(var(--background-surface-100))`,
        }}
      />
      <div className="absolute z-10 inset-0 flex flex-col items-center justify-center font-bold text-7xl uppercase text-foreground-light group-hover:text-foreground transition-colors">
        <svg
          width="111"
          height="42"
          viewBox="0 0 111 42"
          fill="currentColor"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M36.1763 37.4452H49.2591V30.8616H62.342V4.52698H36.1763V37.4452ZM49.2591 11.1106H55.8006V24.2779H49.2591V11.1106ZM67.5752 4.52698V30.8616H80.6581V11.1106H87.1995V30.8616H93.7409V11.1106H100.282V30.8616H106.824V4.52698H67.5752ZM4.77734 30.8616H17.8602V11.1106H24.4017V30.8616H30.9431V4.52698H4.77734V30.8616Z" />
        </svg>
      </div>
    </div>
  )
}

export default NpmEcosystem
