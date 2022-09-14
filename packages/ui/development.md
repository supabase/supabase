## Run storybook locally

Supabase UI uses storybook to develop and organise components.
They can be viewed locally in the Storybook docs explorer

make sure you are in the supabase-ui folder

```cli
cd supabase-ui
```

install dependencies

> :warning: **This project currently won't work using the latest node version. Internally we are using node 17.**

```cli
npm install
```

run storybook

```cli
npm run storybook
```

Storybook runs by default on `http://localhost:6006/`

## Local Development

If you want to test Supabase UI components locally, in context in another project locally, then you will need to `npm link` the supabase-ui project locally.

Follow these instructions here ->
[NPM Linking and Unlinking instructions](https://dev.to/erinbush/npm-linking-and-unlinking-2h1g)

### Common issues

_A common issue found with local testing is multiple versions of react running._

You may need to npm-link the react node module in the target app you want to locally test the library in. Then use that version of react inside the library, and then npm-link the library so the target app can use the library with just the 1 version of react.

Step by step:

• run npm link in /your-app/node_modules/react. This should make the React's global link.

• run npm link react in /supabase/ui. This should make the library use the application’s React copy.

• run npm link @supabase/ui in /your-app

## Icon generation script

There is a script that generates new icon files, and sets them up for individual export.

```cli
npm run build:icons
```
