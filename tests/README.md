## Tests

These tests can be run with Docker.

We can use either [allure-commandline](https://github.com/allure-framework/allure2) as it is open source and <https://github.com/marketplace/actions/allure-report-with-history> as an github action to host reports with history on GitHub Pages.

Or use their paid version if we want a bit more groove and possibility to manage test cases not only as code but also manually: <https://qameta.io>. It can be self-hosted or cloud. Not sure that we need it now, but we can always migrate seamlessly to it if we would need it.

### Steps

In the parent folder:

- `npm run docker:dev`
- `npm run test`

### Clean up

- `npm run docker:remove`
