import { Config } from '@stencil/core';
import { sass } from '@stencil/sass';

export const config: Config = {
  globalStyle: 'src/global/app.scss',
  globalScript: 'src/global/app.ts',
  taskQueue: 'async',
  enableCache: false,
  outputTargets: [
    {
      type: 'www',
      // Comment the following line to disable service workers in production
      serviceWorker: null,
      baseUrl: 'https://stencil-supabase.local/',
    },
  ],
  plugins: [sass({ injectGlobalPaths: ['src/assets/scss/helpers/variables.scss'] })],
};
