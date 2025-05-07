// This file configures the initialization of Sentry on the server.
// The config you add here will be used whenever the server handles a request.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: "https://3c27c63b42048231340b7d640767ad02@o398706.ingest.us.sentry.io/4508132895096832",

  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: false,
});
